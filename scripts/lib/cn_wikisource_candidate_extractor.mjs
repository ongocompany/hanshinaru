import { detectCategory, detectMeter, normalizeChineseForHanshinaru } from './cn_hansi_text_normalizer.mjs';

const ERA_PERIOD_BY_SLUG = {
  song: '宋',
  yuan: '元',
  ming: '明',
  qing: '淸',
};

export function buildCandidateRecord(rawPage, index) {
  const bodyZh = extractCandidatePoemBody(rawPage.html ?? rawPage.wikitext ?? '');
  const recordId = `CN-NT-CAT-${String(index + 1).padStart(5, '0')}`;
  const authorZh = normalizeChineseForHanshinaru(rawPage.authorHint);
  const titleZh = normalizeChineseForHanshinaru(rawPage.normalizedTitle);

  return {
    recordId,
    canonicalId: `CN-CANDIDATE-${rawPage.eraSlug.toUpperCase()}-${rawPage.pageid}`,
    country: 'CN',
    eraSlug: rawPage.eraSlug,
    title: {
      zh: titleZh,
      ko: null,
    },
    author: {
      authorId: `CN-AUTHOR-CANDIDATE-${slugifyHanja(authorZh)}`,
      zh: authorZh,
      ko: null,
      life: null,
    },
    sourceWork: {
      collectionTitle: rawPage.categoryTitle,
      entryTitle: titleZh,
      sourceUrl: rawPage.sourceUrl,
      sourcePolicyId: 'SRC-ZH-WIKISOURCE-TEXT',
    },
    text: {
      poemZh: bodyZh,
      poemKoReading: null,
      poemKoGloss: null,
    },
    translation: {
      translationKoOwned: null,
      commentaryKoOwned: null,
    },
    extraction: buildExtractionMeta(rawPage, bodyZh),
    jdsCandidate: {
      poet: {
        name_zh: authorZh,
        name_ko: null,
        life_raw: null,
        era_period: ERA_PERIOD_BY_SLUG[rawPage.eraSlug] ?? rawPage.eraSlug,
        country: 'CN',
        slug: `candidate-${rawPage.eraSlug}-${slugifyHanja(authorZh)}`,
      },
      poem: {
        title_zh: titleZh,
        title_ko: null,
        body_zh: bodyZh,
        category: detectCategory(bodyZh, { eraSlug: rawPage.eraSlug }),
        meter: detectMeter(bodyZh),
        country: 'CN',
        status: bodyZh ? 'parsed' : 'needs-review',
        quality: 'category-auto-needs-review',
      },
    },
    rights: {
      originalText: {
        sourcePolicyId: 'SRC-ZH-WIKISOURCE-TEXT',
        sourceUrl: rawPage.sourceUrl,
        publicDisplayAllowedNow: true,
        commercialAllowedNow: true,
        attributionRequired: true,
      },
      ownedTranslation: {
        exists: false,
        sourcePolicyId: null,
        publicDisplayAllowedNow: false,
        commercialAllowedNow: false,
      },
    },
  };
}

export function buildReviewQueueItem(record) {
  return {
    queueId: `REVIEW-${record.recordId}`,
    recordId: record.recordId,
    priority: record.extraction.reviewPriority,
    eraSlug: record.eraSlug,
    titleZh: record.title.zh,
    authorZh: record.author.zh,
    sourceUrl: record.sourceWork.sourceUrl,
    lineCount: record.extraction.lineCount,
    charCount: record.extraction.charCount,
    extractionStatus: record.extraction.status,
    reviewReasons: record.extraction.reviewReasons,
    poemPreview: record.text.poemZh.split(/\r?\n/).slice(0, 4).join('\n'),
  };
}

export function extractCandidatePoemBody(html) {
  const lines = htmlToCandidateLines(html);
  return normalizeCandidateLines(lines).join('\n');
}

function buildExtractionMeta(rawPage, bodyZh) {
  const lines = bodyZh.split(/\r?\n/).filter(Boolean);
  const reviewReasons = [];
  if (lines.length < 2) reviewReasons.push('extracted-too-few-lines');
  if (lines.length > 40) reviewReasons.push('extracted-too-many-lines');
  if (lines.some((line) => Array.from(line.replace(/[，。！？、；：\s]/g, '')).length > 12)) {
    reviewReasons.push('possible-joined-lines');
  }
  if (!bodyZh) reviewReasons.push('empty-body');
  if (/[简汉诗东为乐云从会传体关兴写军农冲决凤刘则刚创别剑华压县叹听国图声处复头学对将尘尽岁岛岭岳广庆应庙开张归当录径忆忧怀惊战报拟挥损据摄数斋无旧时书来楼欢气汉济浅浊涛润渔游满灯灵点烟爱牵状独献现画礼离种积称穷笔类红级纸线终经绝绘绿缘罗联聪胜舆艳艺节苏药获蓝补观觉诗诚语误说请诸谓谢谦贤败质赏赠赵车转轻载辞边还进远连选遗邻郑释钱长门间陈陆难静韩页题风飞饮马鸣黄龙龟]/.test(bodyZh)) {
    reviewReasons.push('possible-simplified-residue');
  }
  if (rawPage.fetchStatus !== 'ok') reviewReasons.push(`fetch-${rawPage.fetchStatus}`);

  return {
    status: reviewReasons.length ? 'needs-review' : 'auto-extracted',
    reviewPriority: reviewReasons.length ? 'manual-check' : 'bulk-review',
    lineCount: lines.length,
    charCount: Array.from(bodyZh.replace(/\s/g, '')).length,
    reviewReasons,
  };
}

function htmlToCandidateLines(html) {
  const text = String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, '\n')
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<table[\s\S]*?<\/table>/gi, '\n')
    .replace(/<sup[\s\S]*?<\/sup>/gi, '')
    .replace(/<span[^>]*class="mw-editsection"[\s\S]*?<\/span>/gi, '')
    .replace(/<(br|p|div|li|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#160;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

  return text.split(/\r?\n/).map(cleanWikitextLine).map((line) => normalizeChineseForHanshinaru(line).trim()).filter(Boolean);
}

function cleanWikitextLine(line) {
  return String(line ?? '')
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^/]*\/>/gi, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[File:[^\]]+\]\]/gi, '')
    .replace(/\[\[Category:[^\]]+\]\]/gi, '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/^[:*#;]+/, '')
    .trim();
}

function normalizeCandidateLines(lines) {
  const kept = [];
  for (const line of lines) {
    const compact = line.replace(/\s+/g, '');
    if (!compact) continue;
    if (!/[\u3400-\u9fff]/.test(compact)) continue;
    if (isNoiseLine(compact)) continue;
    if (Array.from(compact.replace(/[，。！？、；：]/g, '')).length > 80) continue;
    kept.push(...splitPoeticLine(compact));
  }
  return dedupeAdjacentLines(kept).slice(0, 80);
}

function splitPoeticLine(line) {
  const parts = line.match(/[^，。！？；：]+[，。！？；：]?/g) ?? [line];
  if (parts.length <= 1) return [line];
  return parts
    .map((part) => part.trim())
    .filter((part) => {
      const length = Array.from(part.replace(/[，。！？、；：\s]/g, '')).length;
      return length >= 3;
    });
}

function isNoiseLine(line) {
  return [
    /^作者[：:]/,
    /^姊妹計[畫劃]/,
    /^維基文庫/,
    /^取自維基文庫/,
    /^本作品/,
    /^返回/,
    /^上一/,
    /^下一/,
    /^目錄/,
    /^分類[：:]/,
    /^導航/,
    /^此頁面/,
    /^本頁面/,
    /^如果您想要/,
    /^校對/,
    /^版本/,
    /^編輯/,
    /^註釋/,
    /^\{\{/,
    /^\|/,
    /^\}/,
  ].some((pattern) => pattern.test(line));
}

function dedupeAdjacentLines(lines) {
  const out = [];
  for (const line of lines) {
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out;
}

function slugifyHanja(value) {
  return Array.from(String(value ?? 'unknown'))
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
}
