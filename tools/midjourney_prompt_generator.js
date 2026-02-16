#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_DB_PATH = "public/index/poems.full.json";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const DEFAULT_LIMIT = 5;
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_TEMPERATURE = 0.4;
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const REQUIRED_STYLE_KO = "동양화 수묵화(문인화) 느낌, 절제된 저채색, 시적인 느낌, 여백 중심 구도";
const REQUIRED_STYLE_EN = [
  "traditional East Asian ink wash painting (sumi-e)",
  "literati painting aesthetics",
  "minimal color palette with restrained tones",
  "poetic atmosphere",
  "generous negative space composition",
];
const DEFAULT_MJ_PARAMS = "--stylize 200";
const DEFAULT_ASPECT_RATIO = "3:2";
const DEFAULT_NEGATIVE_PROMPT = [
  "text",
  "logo",
  "watermark",
  "cartoon",
  "childish",
  "chibi",
  "anime",
  "toy",
  "neon",
].join(", ");

function printUsage() {
  console.log(`
Usage:
  OPENAI_API_KEY=... node tools/midjourney_prompt_generator.js [options]

Options:
  --db <path>          Path to poem DB JSON (default: ${DEFAULT_DB_PATH})
  --query <text>       Search text in title/poet/poem
  --title-id <id,...>  Exact titleId filter (comma separated)
  --limit <n>          Number of works to generate (default: ${DEFAULT_LIMIT})
  --all                Ignore limit and use all matched works
  --batch-size <n>     Works per API call when generating many works (default: ${DEFAULT_BATCH_SIZE})
  --resume-from <path> Reuse existing JSON results and generate only missing works
  --model <name>       OpenAI model (default: ${DEFAULT_MODEL})
  --temperature <n>    Sampling temperature 0-2 (default: ${DEFAULT_TEMPERATURE})
  --aspect-ratio <w:h> Default --ar for final prompt (default: ${DEFAULT_ASPECT_RATIO})
  --out <path>         Save JSON result file
  --list               List matched works only, do not generate
  --dry-run            Skip API and generate template prompts
  --help               Show this help

Examples:
  node tools/midjourney_prompt_generator.js --query "정야사" --limit 3 --list
  OPENAI_API_KEY=... node tools/midjourney_prompt_generator.js --all --batch-size 20 --out output/mj_prompts_all.json
  OPENAI_API_KEY=... node tools/midjourney_prompt_generator.js --all --out output/mj_prompts_all.json --resume-from output/mj_prompts_all.json
  node tools/midjourney_prompt_generator.js --query "달 강" --limit 2 --dry-run
`.trim());
}

function parseArgs(argv) {
  const args = {
    db: DEFAULT_DB_PATH,
    query: "",
    titleId: "",
    limit: DEFAULT_LIMIT,
    all: false,
    batchSize: DEFAULT_BATCH_SIZE,
    resumeFrom: "",
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    aspectRatio: DEFAULT_ASPECT_RATIO,
    out: "",
    list: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
    if (token === "--db" && next) {
      args.db = next;
      i += 1;
      continue;
    }
    if ((token === "--query" || token === "-q") && next) {
      args.query = next;
      i += 1;
      continue;
    }
    if (token === "--title-id" && next) {
      args.titleId = next;
      i += 1;
      continue;
    }
    if ((token === "--limit" || token === "-n") && next) {
      const parsed = Number.parseInt(next, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        throw new Error(`Invalid --limit value: ${next}`);
      }
      args.limit = parsed;
      i += 1;
      continue;
    }
    if (token === "--all") {
      args.all = true;
      continue;
    }
    if (token === "--batch-size" && next) {
      const parsed = Number.parseInt(next, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        throw new Error(`Invalid --batch-size value: ${next}`);
      }
      args.batchSize = parsed;
      i += 1;
      continue;
    }
    if (token === "--resume-from" && next) {
      args.resumeFrom = next;
      i += 1;
      continue;
    }
    if (token === "--model" && next) {
      args.model = next;
      i += 1;
      continue;
    }
    if (token === "--temperature" && next) {
      const parsed = Number.parseFloat(next);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
        throw new Error(`Invalid --temperature value: ${next}`);
      }
      args.temperature = parsed;
      i += 1;
      continue;
    }
    if (token === "--aspect-ratio" && next) {
      args.aspectRatio = next;
      i += 1;
      continue;
    }
    if (token === "--out" && next) {
      args.out = next;
      i += 1;
      continue;
    }
    if (token === "--list") {
      args.list = true;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return args;
}

function textValue(value, preferredKey = "ko") {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(v => textValue(v)).filter(Boolean).join(" ").trim();
  if (typeof value === "object") {
    if (typeof value[preferredKey] === "string" && value[preferredKey].trim()) {
      return value[preferredKey].trim();
    }
    const keys = Object.keys(value);
    for (const key of keys) {
      const v = value[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return String(value).trim();
}

function cleanText(raw) {
  return String(raw || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\[\d+\]/g, " ")
    .replace(/\[\*\s*[^]*?\]/g, " ")
    .replace(/#{1,6}\s*/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(raw, maxLen = 220) {
  const text = cleanText(raw);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}...`;
}

function normalizePoemFromFull(item, index) {
  const titleKo = textValue(item?.title, "ko");
  const titleZh = textValue(item?.title, "zh");
  const poetKo = textValue(item?.poet, "ko");
  const poetZh = textValue(item?.poet, "zh");

  return {
    source: "poems.full.json",
    titleId: textValue(item?.titleId) || `P${index + 1}`,
    titleKo,
    titleZh,
    poetKo,
    poetZh,
    titleDisplay: titleKo || titleZh || `Untitled-${index + 1}`,
    poetDisplay: poetKo || poetZh || "Unknown poet",
    poemZh: textValue(item?.poemZh, "zh"),
    translationKo: textValue(item?.translationKo, "ko"),
    category: textValue(item?.category, "ko"),
    meter: textValue(item?.meter, "ko"),
  };
}

function normalizePoemsFromArchive(rawData) {
  const out = [];
  for (const row of rawData) {
    if (row?.type !== "poet" || !Array.isArray(row?.poems)) continue;
    const poet = textValue(row?.name);
    for (let i = 0; i < row.poems.length; i += 1) {
      const poem = row.poems[i];
      const title = textValue(poem?.title) || `poem-${i + 1}`;
      out.push({
        source: "archive/database.json",
        titleId: `${row?.id || "A"}-P${i + 1}`,
        titleKo: title,
        titleZh: title,
        poetKo: poet,
        poetZh: poet,
        titleDisplay: title,
        poetDisplay: poet || "Unknown poet",
        poemZh: textValue(poem?.content),
        translationKo: textValue(row?.desc),
        category: "",
        meter: "",
      });
    }
  }
  return out;
}

function loadWorks(dbPath) {
  const absPath = path.resolve(dbPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`DB file not found: ${absPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(absPath, "utf8"));
  if (Array.isArray(payload)) {
    return payload.map(normalizePoemFromFull).filter(Boolean);
  }

  if (payload && Array.isArray(payload.data)) {
    return normalizePoemsFromArchive(payload.data);
  }

  throw new Error("Unsupported DB shape. Expected array or { data: [...] }");
}

function normalizeSearchText(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchHaystack(work) {
  return normalizeSearchText(
    [
      work.titleId,
      work.titleKo,
      work.titleZh,
      work.poetKo,
      work.poetZh,
      makeExcerpt(work.poemZh, 300),
      makeExcerpt(work.translationKo, 200),
    ].join(" ")
  );
}

function matchByQuery(work, query) {
  const haystack = buildSearchHaystack(work);
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every(token => haystack.includes(token));
}

function selectWorks(works, args) {
  let filtered = [...works];

  const idSet = new Set(
    String(args.titleId || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
  );

  if (idSet.size > 0) {
    filtered = filtered.filter(work => idSet.has(work.titleId));
  }

  if (args.query.trim()) {
    filtered = filtered.filter(work => matchByQuery(work, args.query));
  }

  filtered.sort((a, b) => a.titleId.localeCompare(b.titleId, "en"));

  if (!args.all) {
    filtered = filtered.slice(0, args.limit);
  }

  return filtered;
}

function inferVisualCues(work) {
  const text = `${work.titleDisplay} ${work.poemZh} ${work.translationKo}`;
  const cues = [];
  const pick = (re, label) => {
    if (re.test(text) && !cues.includes(label)) cues.push(label);
  };

  pick(/月|달|moon/iu, "moonlit sky");
  pick(/江|河|川|강|물|river/iu, "misty river");
  pick(/山|嶺|봉|mountain/iu, "layered distant mountains");
  pick(/秋|가을|autumn/iu, "autumn wind and sparse leaves");
  pick(/春|봄|spring/iu, "early spring blossoms");
  pick(/雪|눈|snow/iu, "light snow on roofs and trees");
  pick(/雨|비|rain/iu, "gentle rain over stone path");
  pick(/夜|밤|night/iu, "quiet nighttime atmosphere");
  pick(/酒|술|wine/iu, "solitary scholar with a wine cup");
  pick(/舟|船|배|boat/iu, "small lone boat near the shore");
  pick(/送|別|이별|farewell/iu, "departure pavilion with two figures");

  if (cues.length === 0) {
    cues.push("tranquil natural scene inspired by classical Tang poetry");
  }

  return cues.slice(0, 4);
}

function buildDryRunPrompt(work) {
  const cues = inferVisualCues(work).join(", ");
  const body = [
    REQUIRED_STYLE_EN.join(", "),
    "mature contemplative literati mood",
    "not cartoonish, not childish",
    "rice-paper brush texture and calligraphic brush rhythm",
    "wide breathing blank space composition",
    cues,
  ].join(", ");
  return enforcePromptStyle(body, DEFAULT_NEGATIVE_PROMPT);
}

function buildOpenAIInput(works) {
  return works.map(work => ({
    titleId: work.titleId,
    titleKo: work.titleKo,
    titleZh: work.titleZh,
    poetKo: work.poetKo,
    poetZh: work.poetZh,
    poemExcerpt: makeExcerpt(work.poemZh, 260),
    translationExcerpt: makeExcerpt(work.translationKo, 200),
    category: work.category,
    meter: work.meter,
  }));
}

function extractChatContent(responseJson) {
  const choice = responseJson?.choices?.[0];
  if (!choice) throw new Error("OpenAI response had no choices.");
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  throw new Error("Unexpected OpenAI message content format.");
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch (directErr) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw directErr;
    }
    return JSON.parse(match[0]);
  }
}

function normalizeAspectRatio(raw) {
  const ratio = String(raw || "").trim();
  return /^\d+:\d+$/.test(ratio) ? ratio : DEFAULT_ASPECT_RATIO;
}

function stripExistingMidjourneyParams(prompt) {
  return String(prompt || "")
    .replace(/\s--no\s+(.+?)(?=\s--[a-z]|$)/gi, "")
    .replace(/\s--ar\s+\d+:\d+/gi, "")
    .replace(/\s--stylize\s+\d+/gi, "")
    .replace(/\s--s\s+\d+/gi, "")
    .replace(/\s--v(?:ersion)?\s+[0-9.]+/gi, "")
    .replace(/\s--q(?:uality)?\s+[0-9.]+/gi, "")
    .replace(/\s--chaos\s+\d+/gi, "")
    .replace(/\s--weird\s+\d+/gi, "")
    .replace(/\s--seed\s+\d+/gi, "")
    .replace(/\s--[a-z0-9-]+(?:\s+\S+)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePromptBody(prompt) {
  return stripExistingMidjourneyParams(prompt)
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .replace(/,\s*$/, "")
    .trim();
}

function splitPromptParts(text) {
  return String(text || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

function normalizePromptPartKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^a-z0-9\s()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupePromptParts(parts) {
  const out = [];
  const seen = new Set();
  for (const raw of parts) {
    const part = String(raw || "").trim();
    if (!part) continue;
    const key = normalizePromptPartKey(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

function normalizeNegativePrompt(raw) {
  const currentTerms = String(raw || "")
    .replace(/^--no\s+/i, "")
    .split(/[,\n]/)
    .map(v => v.trim())
    .filter(Boolean);
  const merged = [...currentTerms];
  const lowerSet = new Set(currentTerms.map(v => v.toLowerCase()));
  for (const term of DEFAULT_NEGATIVE_PROMPT.split(",").map(v => v.trim()).filter(Boolean)) {
    const key = term.toLowerCase();
    if (lowerSet.has(key)) continue;
    lowerSet.add(key);
    merged.push(term);
  }
  return merged.join(", ");
}

function composePromptBodyWithStylePrefix(promptBody) {
  const mustLead = [
    ...REQUIRED_STYLE_EN,
    "mature contemplative literati mood",
    "not cartoonish",
    "not childish",
  ];
  const mustLeadKeys = new Set(mustLead.map(normalizePromptPartKey));
  const body = splitPromptParts(promptBody).filter(part => !mustLeadKeys.has(normalizePromptPartKey(part)));
  return dedupePromptParts([...mustLead, ...body]).join(", ");
}

function enforcePromptStyle(midjourneyPrompt, negativePrompt, aspectRatio = DEFAULT_ASPECT_RATIO) {
  let prompt = normalizePromptBody(midjourneyPrompt);
  if (!prompt) prompt = "classical Tang poem inspired scene";
  prompt = composePromptBodyWithStylePrefix(prompt);

  const ratio = normalizeAspectRatio(aspectRatio);
  const noPhrase = normalizeNegativePrompt(negativePrompt);
  prompt = `${prompt} --ar ${ratio}`.trim();
  if (DEFAULT_MJ_PARAMS) prompt = `${prompt} ${DEFAULT_MJ_PARAMS}`.trim();
  if (noPhrase) prompt = `${prompt} --no ${noPhrase}`.trim();
  return prompt;
}

async function requestPromptsFromOpenAI(works, model, temperature, aspectRatio) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Set it in your environment.");
  }
  const ratio = normalizeAspectRatio(aspectRatio);

  const systemInstruction = [
    "You are an art director generating Midjourney prompts for classical Chinese poems.",
    "Return only a valid JSON object, no markdown code fences.",
    "JSON schema:",
    "{",
    '  "results": [',
    "    {",
    '      "titleId": "string",',
    '      "sceneSummaryKo": "string",',
    '      "midjourneyPrompt": "string",',
    '      "midjourneyPromptKo": "string",',
    '      "negativePrompt": "string"',
    "    }",
    "  ]",
    "}",
    "Rules:",
    "- One result per provided work with matching titleId.",
    `- The midjourneyPrompt must start with: ${REQUIRED_STYLE_EN.join(", ")}.`,
    "- The midjourneyPrompt must be one English sentence, 40-80 words, specific and visual.",
    "- midjourneyPromptKo should be Korean review text with same intent (not literal only).",
    "- Include subject, setting, time/weather, and composition.",
    "- Avoid modern elements, typography, logos, and watermark.",
    "- Keep a mature East Asian literati mood with generous blank space.",
    "- Never output childlike/cartoon/chibi/anime tone.",
    `- Include --ar ${ratio} in every midjourneyPrompt.`,
    `- End each midjourneyPrompt with: ${DEFAULT_MJ_PARAMS}`,
    `- negativePrompt should include at least: ${DEFAULT_NEGATIVE_PROMPT}.`,
  ].join("\n");

  const userPayload = {
    commonRequirementKo: REQUIRED_STYLE_KO,
    commonRequirementEn: REQUIRED_STYLE_EN.join(", "),
    defaultAspectRatio: ratio,
    works: buildOpenAIInput(works),
  };

  const res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText.slice(0, 800)}`);
  }

  const json = await res.json();
  const content = extractChatContent(json);
  const parsed = parseJsonObject(content);
  if (!Array.isArray(parsed?.results)) {
    throw new Error("OpenAI response JSON missing results array.");
  }
  return parsed.results;
}

function mergeResults(works, generatedResults, modeLabel, aspectRatio) {
  const map = new Map();
  for (const row of generatedResults || []) {
    const id = textValue(row?.titleId);
    if (id) map.set(id, row);
  }

  return works.map(work => {
    const row = map.get(work.titleId) || {};
    const sceneSummaryKo = textValue(row.sceneSummaryKo, "ko");
    const negativePrompt = normalizeNegativePrompt(textValue(row.negativePrompt, "ko"));
    const fallbackPrompt = buildDryRunPrompt(work);
    const midjourneyPrompt = enforcePromptStyle(
      textValue(row.midjourneyPrompt, "ko") || fallbackPrompt,
      negativePrompt,
      aspectRatio
    );
    const midjourneyPromptKo = textValue(row.midjourneyPromptKo, "ko") || sceneSummaryKo || "";

    return {
      titleId: work.titleId,
      title: { ko: work.titleKo, zh: work.titleZh },
      poet: { ko: work.poetKo, zh: work.poetZh },
      source: work.source,
      sceneSummaryKo: sceneSummaryKo || "시의 정서를 기반으로 한 장면 구성",
      midjourneyPrompt,
      midjourneyPromptKo,
      negativePrompt: negativePrompt || DEFAULT_NEGATIVE_PROMPT,
      aspectRatio: normalizeAspectRatio(aspectRatio),
      generationMode: modeLabel,
    };
  });
}

function printWorkList(works) {
  for (const work of works) {
    const preview = makeExcerpt(work.poemZh || work.translationKo, 48);
    console.log(`${work.titleId} | ${work.poetDisplay} | ${work.titleDisplay} | ${preview}`);
  }
}

function printResults(results) {
  const limit = results.length > 30 ? 30 : results.length;
  for (let i = 0; i < limit; i += 1) {
    const row = results[i];
    const title = row?.title?.ko || row?.title?.zh || "";
    const poet = row?.poet?.ko || row?.poet?.zh || "";
    console.log(`\n[${i + 1}] ${row.titleId} | ${poet} | ${title}`);
    console.log(`Scene: ${row.sceneSummaryKo}`);
    console.log(`Prompt: ${row.midjourneyPrompt}`);
  }
  if (results.length > limit) {
    console.log(`\n... ${results.length - limit}개 결과는 출력을 생략했습니다.`);
  }
}

function saveJson(outPath, data) {
  const absPath = path.resolve(outPath);
  const dir = path.dirname(absPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return absPath;
}

function chunkArray(rows, chunkSize) {
  const out = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    out.push(rows.slice(i, i + chunkSize));
  }
  return out;
}

function readExistingResultMap(resumePath) {
  if (!resumePath) return new Map();
  const absPath = path.resolve(resumePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`--resume-from file not found: ${absPath}`);
  }
  const payload = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const rows = Array.isArray(payload?.results) ? payload.results : [];
  const map = new Map();
  for (const row of rows) {
    const id = textValue(row?.titleId);
    if (!id) continue;
    map.set(id, row);
  }
  return map;
}

function normalizeResultRowForWork(work, row, defaultMode, aspectRatio) {
  const sceneSummaryKo = textValue(row?.sceneSummaryKo, "ko") || "시의 정서를 기반으로 한 장면 구성";
  const negativePrompt = normalizeNegativePrompt(textValue(row?.negativePrompt, "ko"));
  const midjourneyPrompt = enforcePromptStyle(
    textValue(row?.midjourneyPrompt, "ko") || buildDryRunPrompt(work),
    negativePrompt,
    aspectRatio
  );

  return {
    titleId: work.titleId,
    title: {
      ko: textValue(row?.title?.ko, "ko") || work.titleKo,
      zh: textValue(row?.title?.zh, "zh") || work.titleZh,
    },
    poet: {
      ko: textValue(row?.poet?.ko, "ko") || work.poetKo,
      zh: textValue(row?.poet?.zh, "zh") || work.poetZh,
    },
    source: textValue(row?.source, "ko") || work.source,
    sceneSummaryKo,
    midjourneyPrompt,
    midjourneyPromptKo: textValue(row?.midjourneyPromptKo, "ko") || sceneSummaryKo,
    negativePrompt,
    aspectRatio: normalizeAspectRatio(row?.aspectRatio || aspectRatio),
    generationMode: textValue(row?.generationMode, "ko") || defaultMode,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const allWorks = loadWorks(args.db);
  const selectedWorks = selectWorks(allWorks, args);

  if (selectedWorks.length === 0) {
    throw new Error("No matched works. Try different --query or --title-id.");
  }

  console.log(`Loaded ${allWorks.length} works from ${args.db}`);
  console.log(`Selected ${selectedWorks.length} works.`);

  if (args.list) {
    printWorkList(selectedWorks);
    return;
  }

  const modeLabel = args.dryRun ? "dry-run" : args.model;
  const existingMap = readExistingResultMap(args.resumeFrom);
  const pendingWorks = selectedWorks.filter(work => !existingMap.has(work.titleId));
  const generatedMap = new Map();

  if (existingMap.size > 0) {
    console.log(`Resume source loaded: ${existingMap.size} results from ${args.resumeFrom}`);
    console.log(`Missing works to generate: ${pendingWorks.length}`);
  }

  if (pendingWorks.length > 0) {
    if (args.dryRun) {
      const generated = pendingWorks.map(work => ({
        titleId: work.titleId,
        sceneSummaryKo: "시의 핵심 정서를 반영한 문인화 장면",
        midjourneyPromptKo: "동양화 수묵화 스타일, 절제된 저채색, 넓은 여백 중심 구성",
        midjourneyPrompt: buildDryRunPrompt(work),
        negativePrompt: DEFAULT_NEGATIVE_PROMPT,
      }));
      const merged = mergeResults(pendingWorks, generated, modeLabel, args.aspectRatio);
      for (const row of merged) generatedMap.set(row.titleId, row);
    } else {
      const batches = chunkArray(pendingWorks, args.batchSize);
      for (let i = 0; i < batches.length; i += 1) {
        const batch = batches[i];
        console.log(`[batch ${i + 1}/${batches.length}] generating ${batch.length} works...`);
        const generated = await requestPromptsFromOpenAI(
          batch,
          args.model,
          args.temperature,
          args.aspectRatio
        );
        const merged = mergeResults(batch, generated, modeLabel, args.aspectRatio);
        for (const row of merged) generatedMap.set(row.titleId, row);
      }
    }
  }

  const mergedResults = selectedWorks.map(work => {
    if (generatedMap.has(work.titleId)) return generatedMap.get(work.titleId);
    if (existingMap.has(work.titleId)) {
      return normalizeResultRowForWork(work, existingMap.get(work.titleId), modeLabel, args.aspectRatio);
    }
    return normalizeResultRowForWork(work, {}, modeLabel, args.aspectRatio);
  });

  const output = {
    generatedAt: new Date().toISOString(),
    dbPath: args.db,
    selection: {
      query: args.query,
      titleId: args.titleId,
      limit: args.limit,
      all: args.all,
      batchSize: args.batchSize,
      resumedFrom: args.resumeFrom || "",
      count: mergedResults.length,
    },
    commonStyleRequirement: {
      ko: REQUIRED_STYLE_KO,
      en: REQUIRED_STYLE_EN,
    },
    aspectRatio: normalizeAspectRatio(args.aspectRatio),
    temperature: args.temperature,
    model: modeLabel,
    results: mergedResults,
  };

  printResults(mergedResults);

  if (args.out) {
    const absPath = saveJson(args.out, output);
    console.log(`\nSaved JSON: ${absPath}`);
  }
}

main().catch(err => {
  console.error(`[ERROR] ${err.message}`);
  process.exitCode = 1;
});
