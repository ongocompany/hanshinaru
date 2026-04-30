#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const DEFAULT_QUEUE_PATH = 'docs/spec/cn-translation-pipeline-staging.v1.json';
const DEFAULT_PROMPT_PATH = 'docs/spec/cn-translation-prompts/gemini-cli-v2-full.txt';
const DEFAULT_OUTPUT_PATH = 'docs/spec/cn-translation-results.gemini-cli.v2.jsonl';
const DEFAULT_MODEL = 'gemini-3-flash-preview';
const JSON_BLOCK_RE = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;

function parseArgs(argv) {
  const args = {
    queuePath: DEFAULT_QUEUE_PATH,
    promptPath: DEFAULT_PROMPT_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    model: DEFAULT_MODEL,
    limit: 10,
    start: 0,
    timeoutMs: 300000,
    retry: 2,
    delayMs: 1500,
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
    else if (arg === '--output') args.outputPath = next();
    else if (arg === '--model') args.model = next();
    else if (arg === '--limit') args.limit = Number.parseInt(next(), 10);
    else if (arg === '--start') args.start = Number.parseInt(next(), 10);
    else if (arg === '--timeout-ms') args.timeoutMs = Number.parseInt(next(), 10);
    else if (arg === '--retry') args.retry = Number.parseInt(next(), 10);
    else if (arg === '--delay-ms') args.delayMs = Number.parseInt(next(), 10);
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
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/run_cn_translation_gemini_cli.mjs [options]

Runs the Chinese poetry translation staging queue through Gemini CLI.

Options:
  --limit N          Number of new records to process. Default: 10
  --start N          Skip N filtered records before processing. Default: 0
  --queue-id ID      Process one exact queueId
  --era SLUG         Filter by eraSlug, e.g. pre-qin, song, ming
  --batch NAME       Filter by batch name
  --force            Re-run records already present in the output JSONL
  --dry-run          Print selected records without calling Gemini
  --output PATH      Output JSONL path
  --model MODEL      Gemini CLI model. Default: ${DEFAULT_MODEL}
`);
}

function buildPrompt(systemPrompt, record) {
  const blocks = [
    systemPrompt,
    '',
    '---',
    '아래 작품만 번역하세요.',
    record.authorZh ? `시인: ${record.authorZh}` : '',
    record.titleZh ? `제목: ${record.titleZh}` : '',
    `시대: ${record.eraPeriod || record.eraSlug || ''}`,
    `원문:\n${record.bodyZh}`,
  ].filter(Boolean);
  return blocks.join('\n');
}

function extractJson(raw) {
  let text = raw.trim();
  const match = JSON_BLOCK_RE.exec(text);
  if (match) text = match[1].trim();

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && typeof parsed.translation === 'string') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
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

function callGeminiCli({ prompt, model, timeoutMs }) {
  return new Promise((resolveCall) => {
    const startedAt = Date.now();
    let settled = false;
    let timedOut = false;
    let closed = false;
    const child = spawn('gemini', ['--model', model, '--prompt', prompt, '--output-format', 'text'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      detached: true,
    });

    let stdout = '';
    let stderr = '';
    let killTimer = null;
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
      killTimer = setTimeout(() => {
        killChild('SIGKILL');
      }, 10000);
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (!settled && stdout.includes('Opening authentication page in your browser')) {
        settled = true;
        killChild('SIGTERM');
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code, signal) => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolveCall({
        code,
        signal,
        authRequired: stdout.includes('Opening authentication page in your browser'),
        timedOut,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        elapsedMs: Date.now() - startedAt,
      });
    });
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

    let saved = false;
    for (let attempt = 1; attempt <= args.retry; attempt += 1) {
      console.log(`[${index + 1}/${selected.length}] ${record.queueId} ${record.authorZh} ${record.titleZh} attempt=${attempt}`);
      const result = await callGeminiCli({ prompt, model: args.model, timeoutMs: args.timeoutMs });
      const parsed = extractJson(result.stdout);
      const status = result.code === 0 && parsed ? 'ok' : result.authRequired ? 'auth_required' : result.timedOut ? 'timeout' : 'error';
      const row = {
        ...baseRow,
        attempt,
        status,
        finishedAt: new Date().toISOString(),
        elapsedMs: result.elapsedMs,
        cliExitCode: result.code,
        cliSignal: result.signal,
        authRequired: result.authRequired,
        timedOut: result.timedOut,
        parsed,
        raw: result.stdout,
        stderr: result.stderr,
      };

      if (status === 'ok') {
        await appendJsonl(outputPath, row);
        ok += 1;
        saved = true;
        break;
      }

      if (status === 'auth_required' || attempt === args.retry) {
        await appendJsonl(outputPath, row);
        failed += 1;
        saved = true;
        break;
      } else {
        await sleep(args.delayMs);
      }
    }

    if (!saved) failed += 1;
    if (args.delayMs > 0) await sleep(args.delayMs);
  }

  const afterSize = (await stat(outputPath)).size;
  console.log(JSON.stringify({ ok, failed, appendedBytes: afterSize - beforeSize }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
