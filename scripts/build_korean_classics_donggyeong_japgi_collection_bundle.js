#!/usr/bin/env node
/**
 * build_korean_classics_donggyeong_japgi_collection_bundle.js
 *
 * 목적:
 * - `東京雜記` 권차별 수확 결과를 전권 단위 문헌 묶음으로 통합한다.
 * - 문헌 층(section/항목)과 작품 층(시문 블록)을 함께 집계해
 *   연구 보존과 서비스 파생의 기준본으로 쓴다.
 *
 * 사용법:
 *   node scripts/build_korean_classics_donggyeong_japgi_collection_bundle.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VOLUMES = [1, 2, 3];
const OUT_BUNDLE = path.join(ROOT, 'docs', 'spec', 'korean-classics-donggyeong-japgi-collection-bundle.v1.json');

const COLLECTION_IDENTITY = {
  titleZh: '東京雜記',
  titleKo: '동경잡기',
  titleRomanization: 'Donggyeong Japgi',
  historicalPlaceNote: '여기서 東京은 일본 東京/도쿄가 아니라 신라·고려 문맥의 경주를 가리키는 별칭이다.',
  canonicalSlug: 'donggyeong-japgi'
};

const EXACT_AUTHOR_NORMALIZATIONS = {
  '佔畢齋金宗直': { normalizedAuthorZh: '金宗直' },
  '梅溪曹偉': { normalizedAuthorZh: '曹偉' },
  '圃隱鄭先生': { normalizedAuthorZh: '鄭夢周' },
  '李益齋': { normalizedAuthorZh: '李齊賢' },
  '稼亭李穀': { normalizedAuthorZh: '李穀', titlePrefixZh: '稼亭' },
  '東岳李安訥': { normalizedAuthorZh: '李安訥' },
  '柳西厓': { normalizedAuthorZh: '柳成龍' },
  '旅軒張先生': { normalizedAuthorZh: '張顯光' },
  '五峰李好閔': { normalizedAuthorZh: '李好閔' },
  '龍洲趙絅': { normalizedAuthorZh: '趙絅' },
  '高麗李公升': { normalizedAuthorZh: '李公升', titlePrefixZh: '高麗' },
  '府尹全湜': { normalizedAuthorZh: '全湜', titlePrefixZh: '府尹' },
  '府尹鄭文翼': { normalizedAuthorZh: '鄭文翼', titlePrefixZh: '府尹' },
  '金克已': { normalizedAuthorZh: '金克己' },
  '東岳李安訥無邊樓': { normalizedAuthorZh: '李安訥', titlePrefixZh: '無邊樓' },
  '金九容送權府尹': { normalizedAuthorZh: '金九容', titlePrefixZh: '送權府尹' },
  '權近應制': { normalizedAuthorZh: '權近', titlePrefixZh: '應制' },
  '朴文佑慈仁縣': { normalizedAuthorZh: '朴文佑', titlePrefixZh: '慈仁縣' },
  '朱巖寺持麥石金克己': { normalizedAuthorZh: '金克己', titlePrefixZh: '朱巖寺持麥石' },
  '唐顧雲贈崔文昌': { normalizedAuthorZh: '顧雲', titlePrefixZh: '贈崔文昌' },
  '月顚': { normalizedAuthorZh: '崔致遠', titlePrefixZh: '月顚', note: '鄕樂 五技 연작 표제 정리 규칙' },
  '大面': { normalizedAuthorZh: '崔致遠', titlePrefixZh: '大面', note: '鄕樂 五技 연작 표제 정리 규칙' },
  '束毒': { normalizedAuthorZh: '崔致遠', titlePrefixZh: '束毒', note: '鄕樂 五技 연작 표제 정리 규칙' },
  '狻猊': { normalizedAuthorZh: '崔致遠', titlePrefixZh: '狻猊', note: '鄕樂 五技 연작 표제 정리 규칙' },
  '又祓禊': {
    normalizedAuthorZh: '金克己',
    confidence: 'medium',
    titlePrefixZh: '祓禊',
    note: '兄山浦 金克己詩 뒤에 이어지는 又題 표제 정리 규칙'
  },
  '會蘇曲': { normalizedAuthorZh: '金宗直', titlePrefixZh: '會蘇曲', note: '七詠 연작 표제 정리 규칙' },
  '憂息曲': { normalizedAuthorZh: '金宗直', titlePrefixZh: '憂息曲', note: '七詠 연작 표제 정리 규칙' },
  '鵄述嶺': { normalizedAuthorZh: '金宗直', titlePrefixZh: '鵄述嶺', note: '七詠 연작 표제 정리 규칙' },
  '怛忉': { normalizedAuthorZh: '金宗直', titlePrefixZh: '怛忉', note: '七詠 연작 표제 정리 규칙' },
  '陽山': { normalizedAuthorZh: '金宗直', titlePrefixZh: '陽山', note: '七詠 연작 표제 정리 규칙' },
  '碓樂': { normalizedAuthorZh: '金宗直', titlePrefixZh: '碓樂', note: '七詠 연작 표제 정리 규칙' },
  '黃昌郞': { normalizedAuthorZh: '金宗直', titlePrefixZh: '黃昌郞', note: '七詠 연작 표제 정리 규칙' },
  '雜詠兪好仁': { normalizedAuthorZh: '兪好仁', titlePrefixZh: '雜詠', note: '표제+저자 결합 표기 정리 규칙' }
};

const SUFFIX_AUTHOR_NORMALIZATIONS = [
  { suffix: '徐四佳', normalizedAuthorZh: '徐居正' },
  { suffix: '佔畢齋金宗直', normalizedAuthorZh: '金宗直' }
];
const COMMON_SURNAMES = new Set([
  '金', '李', '朴', '崔', '鄭', '尹', '徐', '柳', '成', '安', '張', '閔',
  '趙', '權', '魚', '田', '盧', '全', '南', '黃', '韓', '吳', '蔡', '申',
  '任', '沈', '姜', '蘇', '兪', '郭'
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function summarizeCounts(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'));
}

function looksLikePersonalName(rawLabel) {
  if (!rawLabel) return false;
  if (rawLabel.length < 2 || rawLabel.length > 4) return false;
  if (!COMMON_SURNAMES.has(rawLabel[0])) return false;
  return !/[詩歌記亭臺樓曲齋院寺山川序題送贈制]/.test(rawLabel.slice(1));
}

function normalizeAuthorLabel(rawLabel) {
  if (!rawLabel) {
    return {
      rawLabelZh: '미상',
      normalizedAuthorZh: '미상',
      confidence: 'low',
      titlePrefixZh: null,
      note: '저자 표기가 비어 있음'
    };
  }

  const exact = EXACT_AUTHOR_NORMALIZATIONS[rawLabel];
  if (exact) {
    return {
      rawLabelZh: rawLabel,
      normalizedAuthorZh: exact.normalizedAuthorZh,
      confidence: exact.confidence || 'high',
      titlePrefixZh: exact.titlePrefixZh || null,
      note: exact.note || '명시적 표기 정리 규칙'
    };
  }

  for (const rule of SUFFIX_AUTHOR_NORMALIZATIONS) {
    if (rawLabel === rule.suffix) continue;
    if (rawLabel.endsWith(rule.suffix)) {
      const prefix = rawLabel.slice(0, rawLabel.length - rule.suffix.length) || null;
      return {
        rawLabelZh: rawLabel,
        normalizedAuthorZh: rule.normalizedAuthorZh,
        confidence: 'medium',
        titlePrefixZh: prefix,
        note: '저자명 뒤에 붙은 호/칭호 suffix 정리 규칙'
      };
    }
  }

  if (looksLikePersonalName(rawLabel)) {
    return {
      rawLabelZh: rawLabel,
      normalizedAuthorZh: rawLabel,
      confidence: 'high',
      titlePrefixZh: null,
      note: '일반적인 한자 인명 형태로 판단'
    };
  }

  return {
    rawLabelZh: rawLabel,
    normalizedAuthorZh: rawLabel,
    confidence: 'low',
    titlePrefixZh: null,
    note: '원표기를 그대로 유지'
  };
}

function main() {
  const manifests = VOLUMES.map((volume) => ({
    volume,
    manifest: readJson(`docs/spec/korean-hansi-donggyeong-japgi-vol${volume}-poem-harvest.v1.json`)
  }));

  const documentSections = [];
  const documentEntries = [];
  const poemBlocks = [];
  const attachedContexts = [];
  const volumeSummaries = [];

  for (const { volume, manifest } of manifests) {
    volumeSummaries.push({
      volume,
      collectionTitle: manifest.collection.title,
      juan: manifest.collection.juan,
      sourceUrl: manifest.collection.sourceUrl,
      documentSectionCount: manifest.summary.documentSectionCount,
      documentEntryCount: manifest.summary.documentEntryCount,
      poemBlockCount: manifest.summary.poemBlockCount,
      attachedContextCount: manifest.summary.attachedContextCount,
      sectionsWithPoems: manifest.summary.sectionsWithPoems
    });

    for (const section of manifest.documentSections) {
      documentSections.push({
        volume,
        ...section
      });
    }

    for (const entry of manifest.documentEntries) {
      documentEntries.push({
        volume,
        ...entry
      });
    }

    for (const block of manifest.poemBlocks) {
      poemBlocks.push({
        volume,
        ...block
      });
    }

    for (const context of manifest.attachedContexts) {
      attachedContexts.push({
        volume,
        ...context
      });
    }
  }

  const authorLabelSummary = summarizeCounts(
    poemBlocks,
    (block) => block.authorZh || block.titleHintZh || '미상'
  );
  const normalizedPoemBlocks = poemBlocks.map((block) => ({
    ...block,
    authorNormalization: normalizeAuthorLabel(block.authorZh || block.titleHintZh || '미상')
  }));
  const normalizedAuthorSummary = summarizeCounts(
    normalizedPoemBlocks,
    (block) => block.authorNormalization.normalizedAuthorZh
  );
  const sourceEntrySummary = summarizeCounts(
    poemBlocks.filter((block) => block.sourceEntryTitle),
    (block) => `${block.volume}:${block.sourceEntryTitle}`
  );
  const formSummary = summarizeCounts(poemBlocks, (block) => block.inferredForm || '미상');
  const confidenceSummary = summarizeCounts(poemBlocks, (block) => block.harvestPolicy.confidence || '미상');

  const bundle = {
    version: '2026-04-23.v1',
    collectionId: 'korean-classics-donggyeong-japgi-collection-bundle',
    purpose: '동경잡기(東京雜記) 1~3권을 문헌 층과 작품 층이 함께 보존되는 전권 묶음으로 통합한다',
    collection: {
      ...COLLECTION_IDENTITY,
      volumeRange: '卷一~卷三',
      sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
    },
    preservationPolicy: {
      documentLayer: '문헌 원문은 권차/section/항목 단위로 보존해 연구자료와 재가공 기준본으로 쓴다',
      workLayer: '시문은 문헌 항목을 가리키는 파생 자산으로 분리해 작품 보기와 번역에 쓴다'
    },
    summary: {
      volumeCount: manifests.length,
      documentSectionCount: documentSections.length,
      documentEntryCount: documentEntries.length,
      poemBlockCount: poemBlocks.length,
      attachedContextCount: attachedContexts.length,
      authorLabelCount: authorLabelSummary.length,
      normalizedAuthorCount: normalizedAuthorSummary.length
    },
    volumeSummaries,
    authorLabelSummary,
    normalizedAuthorSummary,
    formSummary,
    confidenceSummary,
    sourceEntrySummary: sourceEntrySummary.slice(0, 40),
    documentSections,
    documentEntries,
    poemBlocks: normalizedPoemBlocks,
    attachedContexts
  };

  writeJson(OUT_BUNDLE, bundle);

  console.log(
    JSON.stringify(
      {
        outBundle: OUT_BUNDLE,
        summary: bundle.summary,
        topAuthors: authorLabelSummary.slice(0, 10)
      },
      null,
      2
    )
  );
}

main();
