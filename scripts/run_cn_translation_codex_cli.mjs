#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const DEFAULT_QUEUE_PATH = 'docs/spec/cn-translation-pipeline-staging.v1.json';
const DEFAULT_PROMPT_PATH = 'docs/spec/cn-translation-prompts/gemini-cli-v2-full.txt';
const DEFAULT_SCHEMA_PATH = 'docs/spec/cn-translation-prompts/codex-cli-output.schema.json';
const DEFAULT_BATCH_SCHEMA_PATH = 'docs/spec/cn-translation-prompts/codex-cli-batch-output.schema.json';
const DEFAULT_OUTPUT_PATH = 'docs/spec/cn-translation-results.gemini-cli.v2.jsonl';
const DEFAULT_MODEL = 'gpt-5.4';
const COMMENTARY_MIN_CHARS = 260;
const COMMENTARY_MAX_CHARS = 560;

function parseArgs(argv) {
  const args = {
    queuePath: DEFAULT_QUEUE_PATH,
    promptPath: DEFAULT_PROMPT_PATH,
    schemaPath: DEFAULT_SCHEMA_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    model: DEFAULT_MODEL,
    reasoningEffort: 'xhigh',
    limit: 1,
    start: 0,
    timeoutMs: 300000,
    retry: 2,
    delayMs: 1000,
    groupSize: 1,
    force: false,
    dryRun: false,
    queueId: '',
    era: '',
    batch: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };

    if (arg === '--queue') args.queuePath = next();
    else if (arg === '--prompt') args.promptPath = next();
    else if (arg === '--schema') args.schemaPath = next();
    else if (arg === '--batch-schema') args.batchSchemaPath = next();
    else if (arg === '--output') args.outputPath = next();
    else if (arg === '--model') args.model = next();
    else if (arg === '--reasoning-effort') args.reasoningEffort = next();
    else if (arg === '--limit') args.limit = Number.parseInt(next(), 10);
    else if (arg === '--start') args.start = Number.parseInt(next(), 10);
    else if (arg === '--timeout-ms') args.timeoutMs = Number.parseInt(next(), 10);
    else if (arg === '--retry') args.retry = Number.parseInt(next(), 10);
    else if (arg === '--delay-ms') args.delayMs = Number.parseInt(next(), 10);
    else if (arg === '--group-size') args.groupSize = Number.parseInt(next(), 10);
    else if (arg === '--queue-id') args.queueId = next();
    else if (arg === '--era') args.era = next();
    else if (arg === '--batch') args.batch = next();
    else if (arg === '--force') args.force = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) throw new Error('--limit must be a positive integer');
  if (!Number.isFinite(args.start) || args.start < 0) throw new Error('--start must be 0 or greater');
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1000) throw new Error('--timeout-ms must be at least 1000');
  if (!Number.isFinite(args.retry) || args.retry < 1) throw new Error('--retry must be a positive integer');
  if (!Number.isFinite(args.groupSize) || args.groupSize < 1) throw new Error('--group-size must be a positive integer');
  if (args.groupSize > 10) throw new Error('--group-size must be 10 or less');
  if (!args.batchSchemaPath) args.batchSchemaPath = DEFAULT_BATCH_SCHEMA_PATH;
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/run_cn_translation_codex_cli.mjs [options]

Runs the Chinese poetry translation staging queue through Codex CLI.

Options:
  --limit N          Number of new records to process. Default: 1
  --queue-id ID      Process one exact queueId
  --output PATH      Output JSONL path
  --model MODEL      Codex model. Default: ${DEFAULT_MODEL}
  --reasoning-effort low|medium|high|xhigh. Default: xhigh
  --group-size N     Translate N records per Codex call. Default: 1
  --dry-run          Print selected records without calling Codex
`);
}

function buildPrompt(systemPrompt, record) {
  const blocks = [
    systemPrompt,
    '',
    '---',
    '중요: 기존 Gemini v2 번역 결과와 같은 한시나루 본문 톤을 유지하세요.',
    `- commentary는 반드시 ${COMMENTARY_MIN_CHARS}~500자 정도로 씁니다. 너무 짧은 감상문처럼 끝내지 않습니다.`,
    '- 작품 배경을 확실히 알 수 없으면 만들지 말고, 원문 이미지와 정서를 중심으로 해설합니다.',
    '- 번역은 행 대응을 지키되 자연스럽고 문어적인 한국어로 씁니다.',
    '- 해설은 "~이다/~한다" 평서문으로만 씁니다.',
    '- "돋보인다", "드러난다", "상징한다", "보여준다" 같은 기존 문체의 분석 어휘를 자연스럽게 사용합니다.',
    '- 마지막 출력은 JSON 객체 하나만 냅니다. 마크다운 코드블록이나 설명문은 금지합니다.',
    '',
    '아래 작품만 번역하세요.',
    record.authorZh ? `시인: ${record.authorZh}` : '',
    record.titleZh ? `제목: ${record.titleZh}` : '',
    `시대: ${record.eraPeriod || record.eraSlug || ''}`,
    `원문:\n${record.bodyZh}`,
  ].filter(Boolean);
  return blocks.join('\n');
}

function buildBatchPrompt(systemPrompt, records) {
  const items = records.map((record) => [
    `queueId: ${record.queueId}`,
    record.authorZh ? `시인: ${record.authorZh}` : '',
    record.titleZh ? `제목: ${record.titleZh}` : '',
    `시대: ${record.eraPeriod || record.eraSlug || ''}`,
    `원문:\n${record.bodyZh}`,
  ].filter(Boolean).join('\n')).join('\n\n--- 작품 구분 ---\n\n');

  return [
    systemPrompt,
    '',
    '---',
    '중요: 기존 Gemini v2 번역 결과와 같은 한시나루 본문 톤을 유지하세요.',
    `- 각 작품의 commentary는 반드시 ${COMMENTARY_MIN_CHARS}~500자 정도로 씁니다. 너무 짧은 감상문처럼 끝내지 않습니다.`,
    '- 작품 배경을 확실히 알 수 없으면 만들지 말고, 원문 이미지와 정서를 중심으로 해설합니다.',
    '- 번역은 행 대응을 지키되 자연스럽고 문어적인 한국어로 씁니다.',
    '- 해설은 "~이다/~한다" 평서문으로만 씁니다.',
    '- "돋보인다", "드러난다", "상징한다", "보여준다" 같은 기존 문체의 분석 어휘를 자연스럽게 사용합니다.',
    '- 마지막 출력은 JSON 객체 하나만 냅니다. 마크다운 코드블록이나 설명문은 금지합니다.',
    '- 반드시 입력된 모든 queueId를 results 배열에 하나씩 포함하세요.',
    '',
    '출력 형식:',
    '{"results":[{"queueId":"CN-TR-XXXXX","title_ko":"...","translation":"...","reading":"...","commentary":"...","notes":[{"word":"...","meaning":"..."}]}]}',
    '',
    '아래 작품들을 각각 번역하세요.',
    items,
  ].join('\n');
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function loadCompleted(outputPath) {
  const completed = new Set();
  if (!existsSync(outputPath)) return completed;

  const lines = createInterface({
    input: createReadStream(outputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of lines) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.queueId && row.status === 'ok') completed.add(row.queueId);
    } catch {
      // Ignore a torn final line; the next append will keep going safely.
    }
  }
  return completed;
}

async function appendJsonl(outputPath, row) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(row, null, 0)}\n`, { flag: 'a', encoding: 'utf8' });
}

function extractJson(raw) {
  const text = raw.trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && typeof parsed.translation === 'string') return parsed;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1));
        if (parsed && typeof parsed === 'object' && typeof parsed.translation === 'string') return parsed;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function validateParsed(parsed) {
  if (!parsed) return 'missing-json';
  if (typeof parsed.title_ko !== 'string' || !parsed.title_ko.trim()) return 'missing-title_ko';
  if (typeof parsed.translation !== 'string' || !parsed.translation.trim()) return 'missing-translation';
  if (typeof parsed.reading !== 'string' || !parsed.reading.trim()) return 'missing-reading';
  if (/[\u3400-\u9fff]/.test(parsed.reading)) return 'reading-contains-hanzi';
  if (typeof parsed.commentary !== 'string' || !parsed.commentary.trim()) return 'missing-commentary';
  if (!Array.isArray(parsed.notes)) return 'notes-not-array';
  const commentaryChars = [...parsed.commentary].length;
  if (commentaryChars < COMMENTARY_MIN_CHARS) return `commentary-too-short:${commentaryChars}`;
  if (commentaryChars > COMMENTARY_MAX_CHARS) return `commentary-too-long:${commentaryChars}`;
  return '';
}

function chunkRecords(records, groupSize) {
  const chunks = [];
  for (let i = 0; i < records.length; i += groupSize) {
    chunks.push(records.slice(i, i + groupSize));
  }
  return chunks;
}

function parseBatchResults(raw) {
  const text = raw.trim();
  const parse = (value) => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.results)) return parsed.results;
    } catch {
      return null;
    }
    return null;
  };

  const direct = parse(text);
  if (direct) return direct;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return parse(text.slice(start, end + 1));
  return null;
}

async function callCodexCli({ prompt, model, schemaPath, timeoutMs, reasoningEffort }) {
  const workDir = await mkdtemp(resolve(tmpdir(), 'hanshinaru-codex-cn-'));
  const outputPath = resolve(workDir, 'last-message.json');
  const startedAt = Date.now();

  return new Promise((resolveCall) => {
    let timedOut = false;
    let stdout = '';
    let stderr = '';
    let killTimer = null;
    const child = spawn('codex', [
      'exec',
      '--ephemeral',
      '--ignore-rules',
      '--model',
      model,
      '--config',
      `model_reasoning_effort="${reasoningEffort}"`,
      '--cd',
      process.cwd(),
      '--sandbox',
      'read-only',
      '--output-schema',
      schemaPath,
      '--output-last-message',
      outputPath,
      '-',
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      detached: true,
    });

    const killChild = (signal) => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, signal);
      } catch {
        try {
          child.kill(signal);
        } catch {
          // The process may already be gone.
        }
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killChild('SIGTERM');
      killTimer = setTimeout(() => killChild('SIGKILL'), 10000);
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', async (code, signal) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      let finalText = '';
      try {
        finalText = await readFile(outputPath, 'utf8');
      } catch {
        finalText = stdout;
      }
      await rm(workDir, { recursive: true, force: true });
      resolveCall({
        code,
        signal,
        timedOut,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        finalText: finalText.trim(),
        elapsedMs: Date.now() - startedAt,
      });
    });

    child.stdin.end(prompt);
  });
}

function selectRecords(records, args, completed) {
  let filtered = records;
  if (args.queueId) filtered = filtered.filter((record) => record.queueId === args.queueId);
  if (args.era) filtered = filtered.filter((record) => record.eraSlug === args.era);
  if (args.batch) filtered = filtered.filter((record) => record.batch === args.batch);
  if (!args.force) filtered = filtered.filter((record) => !completed.has(record.queueId));
  return filtered.slice(args.start, args.start + args.limit);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queuePath = resolve(args.queuePath);
  const promptPath = resolve(args.promptPath);
  const schemaPath = resolve(args.schemaPath);
  const batchSchemaPath = resolve(args.batchSchemaPath);
  const outputPath = resolve(args.outputPath);

  const [queueRaw, systemPrompt] = await Promise.all([
    readFile(queuePath, 'utf8'),
    readFile(promptPath, 'utf8'),
  ]);
  const queue = JSON.parse(queueRaw);
  const records = Array.isArray(queue.records) ? queue.records : [];
  const completed = await loadCompleted(outputPath);
  const selected = selectRecords(records, args, completed);

  console.log(JSON.stringify({
    queuePath,
    outputPath,
    model: args.model,
    totalRecords: records.length,
    completed: completed.size,
    selected: selected.length,
    dryRun: args.dryRun,
  }, null, 2));

  if (args.dryRun) {
    for (const record of selected) {
      console.log(`${record.queueId}\t${record.eraSlug}\t${record.authorZh}\t${record.titleZh}`);
    }
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  if (!existsSync(outputPath)) await writeFile(outputPath, '', 'utf8');
  const beforeSize = (await stat(outputPath)).size;

  let ok = 0;
  let failed = 0;

  if (args.groupSize > 1) {
    const groups = chunkRecords(selected, args.groupSize);
    for (const [groupIndex, group] of groups.entries()) {
      const prompt = buildBatchPrompt(systemPrompt.trim(), group);
      const expectedIds = new Set(group.map((record) => record.queueId));
      let savedGroup = false;
      for (let attempt = 1; attempt <= args.retry; attempt += 1) {
        console.log(`[group ${groupIndex + 1}/${groups.length}] ${group.map((r) => r.queueId).join(',')} attempt=${attempt}`);
        const result = await callCodexCli({
          prompt,
          model: args.model,
          schemaPath: batchSchemaPath,
          timeoutMs: args.timeoutMs,
          reasoningEffort: args.reasoningEffort,
        });
        const batchResults = parseBatchResults(result.finalText);
        const resultById = new Map((batchResults || []).map((item) => [item.queueId, item]));
        const missingIds = [...expectedIds].filter((id) => !resultById.has(id));
        const invalids = [];

        for (const record of group) {
          const parsed = resultById.get(record.queueId) || null;
          const validationError = validateParsed(parsed);
          if (validationError) invalids.push(`${record.queueId}:${validationError}`);
        }

        const status = result.code === 0 && batchResults && missingIds.length === 0 && invalids.length === 0
          ? 'ok'
          : result.timedOut
            ? 'timeout'
            : 'error';

        if (status === 'ok') {
          for (const record of group) {
            const parsed = resultById.get(record.queueId);
            await appendJsonl(outputPath, {
              queueId: record.queueId,
              sourceRecordId: record.sourceRecordId,
              batch: record.batch,
              eraSlug: record.eraSlug,
              eraPeriod: record.eraPeriod,
              authorZh: record.authorZh,
              titleZh: record.titleZh,
              model: args.model,
              promptChars: prompt.length,
              startedAt: new Date().toISOString(),
              attempt,
              status: 'ok',
              finishedAt: new Date().toISOString(),
              elapsedMs: result.elapsedMs,
              cliExitCode: result.code,
              cliSignal: result.signal,
              timedOut: result.timedOut,
              validationError: '',
              parsed,
              raw: JSON.stringify(parsed),
              stderr: result.stderr,
            });
            ok += 1;
          }
          savedGroup = true;
          break;
        }

        if (attempt === args.retry) {
          for (const record of group) {
            await appendJsonl(outputPath, {
              queueId: record.queueId,
              sourceRecordId: record.sourceRecordId,
              batch: record.batch,
              eraSlug: record.eraSlug,
              eraPeriod: record.eraPeriod,
              authorZh: record.authorZh,
              titleZh: record.titleZh,
              model: args.model,
              promptChars: prompt.length,
              startedAt: new Date().toISOString(),
              attempt,
              status,
              finishedAt: new Date().toISOString(),
              elapsedMs: result.elapsedMs,
              cliExitCode: result.code,
              cliSignal: result.signal,
              timedOut: result.timedOut,
              validationError: [...missingIds.map((id) => `${id}:missing`), ...invalids].join(';'),
              parsed: resultById.get(record.queueId) || null,
              raw: result.finalText,
              stderr: result.stderr,
            });
            failed += 1;
          }
          savedGroup = true;
        } else {
          await sleep(args.delayMs);
        }
      }
      if (!savedGroup) failed += group.length;
      if (args.delayMs > 0) await sleep(args.delayMs);
    }

    const afterSize = (await stat(outputPath)).size;
    console.log(JSON.stringify({ ok, failed, appendedBytes: afterSize - beforeSize }, null, 2));
    return;
  }

  for (const [index, record] of selected.entries()) {
    const prompt = buildPrompt(systemPrompt.trim(), record);
    const baseRow = {
      queueId: record.queueId,
      sourceRecordId: record.sourceRecordId,
      batch: record.batch,
      eraSlug: record.eraSlug,
      eraPeriod: record.eraPeriod,
      authorZh: record.authorZh,
      titleZh: record.titleZh,
      model: args.model,
      promptChars: prompt.length,
      startedAt: new Date().toISOString(),
    };

    for (let attempt = 1; attempt <= args.retry; attempt += 1) {
      console.log(`[${index + 1}/${selected.length}] ${record.queueId} ${record.authorZh} ${record.titleZh} attempt=${attempt}`);
      const result = await callCodexCli({
        prompt,
        model: args.model,
        schemaPath,
        timeoutMs: args.timeoutMs,
        reasoningEffort: args.reasoningEffort,
      });
      const parsed = extractJson(result.finalText);
      const validationError = validateParsed(parsed);
      const status = result.code === 0 && !validationError ? 'ok' : result.timedOut ? 'timeout' : 'error';
      const row = {
        ...baseRow,
        attempt,
        status,
        finishedAt: new Date().toISOString(),
        elapsedMs: result.elapsedMs,
        cliExitCode: result.code,
        cliSignal: result.signal,
        timedOut: result.timedOut,
        validationError,
        parsed,
        raw: result.finalText,
        stderr: result.stderr,
      };

      if (status === 'ok') {
        await appendJsonl(outputPath, row);
        ok += 1;
        break;
      }

      if (attempt === args.retry) {
        await appendJsonl(outputPath, row);
        failed += 1;
      } else {
        await sleep(args.delayMs);
      }
    }

    if (args.delayMs > 0) await sleep(args.delayMs);
  }

  const afterSize = (await stat(outputPath)).size;
  console.log(JSON.stringify({ ok, failed, appendedBytes: afterSize - beforeSize }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
