#!/usr/bin/env node
/**
 * build_korean_hansi_donggyeong_japgi_volume_harvest.js
 *
 * 목적:
 * - 동경잡기(東京雜記) 공개 원문에서 권차별 시문 수록 블록을 collection-slice 단위로 harvest 한다.
 * - exact-title 1건 추적이 아니라, 한 권차 안에서 직접 열리는 시문 후보를 최대한 많이 구조화한다.
 * - 최종 canonical record 이전 단계의 harvest manifest를 만든다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js 1
 *   node scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js 2
 *   node scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js 3
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const VOLUME_CONFIG = {
  1: {
    collectionTitle: '東京雜記 卷一',
    juan: '卷一',
    sourceUrl: 'https://zh.wikisource.org/zh-hant/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%B8%80',
    rawUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%B8%80?action=raw',
    rawCacheDir: 'korean-hansi-donggyeong-japgi-vol1-raw',
    rawCacheName: 'donggyeong-japgi-1.raw.txt',
    outManifestName: 'korean-hansi-donggyeong-japgi-vol1-poem-harvest.v1.json',
    localFallbacks: [
      '/private/tmp/donggyeong-japgi-1.raw.txt'
    ]
  },
  2: {
    collectionTitle: '東京雜記 卷二',
    juan: '卷二',
    sourceUrl: 'https://zh.wikisource.org/zh-hant/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%BA%8C',
    rawUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%BA%8C?action=raw',
    rawCacheDir: 'korean-hansi-donggyeong-japgi-vol2-raw',
    rawCacheName: 'donggyeong-japgi-2.raw.txt',
    outManifestName: 'korean-hansi-donggyeong-japgi-vol2-poem-harvest.v1.json',
    localFallbacks: [
      '/private/tmp/donggyeong-japgi-2.raw.txt'
    ]
  },
  3: {
    collectionTitle: '東京雜記 卷三',
    juan: '卷三',
    sourceUrl: 'https://zh.wikisource.org/zh-hant/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%B8%89',
    rawUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%B8%89?action=raw',
    rawCacheDir: 'korean-hansi-donggyeong-japgi-vol3-raw',
    rawCacheName: 'donggyeong-japgi-3.raw.txt',
    outManifestName: 'korean-hansi-donggyeong-japgi-vol3-poem-harvest.v1.json',
    localFallbacks: [
      path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche2-raw', 'donggyeong-japgi-3.raw.txt'),
      '/private/tmp/donggyeong-japgi-3.raw.txt'
    ]
  }
};

const ROOT = path.join(__dirname, '..');
const VOLUME = Number(process.argv[2] || process.env.TZ_VOLUME || '2');
const CONFIG = VOLUME_CONFIG[VOLUME];

if (!CONFIG) {
  throw new Error(`Unsupported TZ_VOLUME: ${VOLUME}`);
}

const SOURCE = {
  collectionTitle: CONFIG.collectionTitle,
  juan: CONFIG.juan,
  sourceUrl: CONFIG.sourceUrl,
  rawUrl: CONFIG.rawUrl,
  sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
};

const RAW_CACHE_DIR = path.join(ROOT, 'docs', 'spec', CONFIG.rawCacheDir);
const RAW_CACHE_PATH = path.join(RAW_CACHE_DIR, CONFIG.rawCacheName);
const OUT_MANIFEST = path.join(ROOT, 'docs', 'spec', CONFIG.outManifestName);

const LOCAL_FALLBACKS = CONFIG.localFallbacks;

const COLLECTION_IDENTITY = {
  titleZh: '東京雜記',
  titleKo: '동경잡기',
  titleRomanization: 'Donggyeong Japgi',
  historicalPlaceNote: '여기서 東京은 일본 東京/도쿄가 아니라 신라·고려 문맥의 경주를 가리키는 별칭이다.',
  canonicalSlug: 'donggyeong-japgi'
};

const CONTEXT_SUFFIXES = [
  '寺', '臺', '池', '井', '宮', '樓', '亭', '巷', '山', '巖', '浦',
  '笛', '橋', '宅', '藪', '庵', '院', '城', '門', '嶺', '墓', '泉'
];

const HEADER_REJECT_CHARS = /[在有今其乃爲云曰傳作唱因得使來見聞與同及從卽故仍命幸]/;
const HEADER_REJECT_PHRASES = ['之後', '九歲能', '登第能', '尤長於', '其爲文', '能詩', '有能詩'];
const PERSONISH_SUFFIXES = ['先生', '居士', '齋', '翁', '叟', '君', '老', '隱'];
const TRAILING_CONTEXT_START_RE = /^(?:兄山在|養直菴在|東京雜記卷之|[一-龥]{1,8}(?:在|今稱|前臨|手植|一名|又名|新羅稱|諺傳|世傳))/;
const COMMON_SURNAMES = new Set([
  '金', '李', '朴', '崔', '鄭', '尹', '徐', '柳', '成', '安', '張', '閔',
  '趙', '權', '魚', '田', '盧', '全', '南', '黃', '韓', '吳', '蔡', '申',
  '任', '沈', '姜', '蘇', '兪', '郭', '顧'
]);

const SEVEN_YEONG_COLLATION_SOURCE = {
  sourceTitle: '新增東國輿地勝覽 卷021',
  sourceUrl: 'https://zh.wikisource.org/wiki/%E6%96%B0%E5%A2%9E%E6%9D%B1%E5%9C%8B%E8%BC%BF%E5%9C%B0%E5%8B%9D%E8%A6%BD/%E5%8D%B7021',
  note: '七詠 金宗直詩 하위 곡명과 구두점 대조'
};

const YUEBAK_COLLATION_SOURCE = {
  sourceTitle: '新增東國輿地勝覽 卷021',
  sourceUrl: 'https://zh.wikisource.org/wiki/%E6%96%B0%E5%A2%9E%E6%9D%B1%E5%9C%8B%E8%BC%BF%E5%9C%B0%E5%8B%9D%E8%A6%BD/%E5%8D%B7021',
  note: '悅朴嶺 수록 시문 구두점과 행 분할 대조'
};

const SEVEN_YEONG_WORKS = [
  { header: '會蘇曲', marker: '曲', prefix: '七詠佔畢齋金宗直詩(會蘇曲)' },
  { header: '憂息曲', marker: '曲', prefix: '憂息曲' },
  { header: '鵄述嶺', marker: '嶺', prefix: '鵄述嶺' },
  { header: '怛忉', marker: '歌', prefix: '怛忉歌', displayLabelZh: '怛忉歌' },
  { header: '陽山', marker: '歌', prefix: '陽山歌', displayLabelZh: '陽山歌' },
  { header: '碓樂', marker: '樂', prefix: '碓樂' },
  { header: '黃昌郞', marker: '樂府', prefix: '黃昌郞' }
];

const SEVEN_YEONG_LINE_OVERRIDES = {
  會蘇曲: [
    '會蘇曲會蘇曲',
    '西風吹廣庭',
    '明月滿華屋',
    '王姬厭坐理繅車',
    '六部女兒多如簇',
    '爾筥旣盈我筐空',
    '釃酒揶揄笑相譃',
    '一婦嘆千室歡',
    '坐令四方勤杼柚',
    '嘉俳縱失閨中儀',
    '猶勝跋河爭嗃嗃'
  ],
  憂息曲: [
    '常棣華隨風落扶桑',
    '扶桑萬里鯨鯢浪',
    '縱有音書誰得將',
    '常棣華隨風返鷄林',
    '鷄林春色擁雙闕',
    '友于歡倩如許深'
  ],
  鵄述嶺: [
    '鵄述嶺頭望日本',
    '粘天鯨海無涯岸',
    '良人去時但搖手',
    '生歟死歟音耗斷',
    '長別離',
    '死生寧有相見時',
    '呼天便化武昌石',
    '烈氣千載干空碧'
  ],
  怛忉: [
    '怛怛復忉忉',
    '大家幾不保',
    '流蘇悵裏玄鶴到',
    '揚且之晢難偕老',
    '忉怛忉怛',
    '神物不告知奈何',
    '神物告兮基圖大'
  ],
  陽山: [
    '敵國爲封豕',
    '荐食我邊疆',
    '赳赳花郞徒',
    '報國心靡遑',
    '荷戈訣妻子',
    '欶泉啖糗糧',
    '賊人夜劘壘',
    '毅魂飛劍鋩',
    '回首陽山雲',
    '矗矗虹蜺光',
    '哀哉四丈夫',
    '終是北方强',
    '千秋爲鬼雄',
    '相與歆椒漿'
  ],
  碓樂: [
    '東家砧舂忝稻',
    '西家杵搗寒襖',
    '東家西家砧杵聲',
    '卒歲之質贏復贏',
    '儂家窖乏甔石',
    '儂家箱無尺帛',
    '懸鶉衣兮藜羹椀',
    '榮期之樂足飽燰',
    '糟妻糟妻莫謾憂',
    '富貴在天那可求',
    '曲肱而寢有至味',
    '梁鵠孟光眞好逑'
  ],
  黃昌郞: [
    '若有人兮纔離齠',
    '身未三尺何雄驍',
    '平生汪錡我所師',
    '爲國雪恥心無憀',
    '劍鐔凝頸股不戰',
    '劍鍔指心目不搖',
    '功成脫然罷舞去',
    '挾山北海猶可超'
  ]
};

const YUEBAK_LINE_OVERRIDES = [
  {
    volume: 2,
    sourceEntryTitle: '悅朴嶺',
    header: '金克己',
    marker: '詩',
    inferredForm: '육언율시',
    collationSource: YUEBAK_COLLATION_SOURCE,
    lines: [
      '玉貌催魂隔世',
      '空端只見層巓',
      '神女雨收巫峽',
      '麗人風斷洛川',
      '雲學舞衫曳地',
      '月偸歌扇當天',
      '行客幾傷芳性',
      '滿巾紅淚泫然'
    ]
  },
  {
    volume: 2,
    sourceEntryTitle: '悅朴嶺',
    header: '李石亨',
    marker: '詩',
    inferredForm: '잡언고시',
    collationSource: YUEBAK_COLLATION_SOURCE,
    lines: [
      '鷄林往事聞夙昔',
      '借問王笛何代作',
      '聞說新羅大平日',
      '大平風月屬絲竹',
      '竹聲猶嫌渭川俗',
      '命工斲得藍田玉',
      '磨礲細膩光潤澤',
      '巧鑿六孔星錯落',
      '和絲調曲諧金石',
      '戞戞淸聲定場屋',
      '當時萬物皆炯滅',
      '至今存者唯此物',
      '無乃鬼物煩守直',
      '傳之永久完無缺',
      '我欲凝絲歌一曲',
      '曲且不成詞亦拙',
      '君不見岐山石鼓久湮沒',
      '昌黎老韓歌獨發'
    ]
  }
];

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getRaw() {
  ensureDir(RAW_CACHE_DIR);

  if (fs.existsSync(RAW_CACHE_PATH)) {
    return fs.readFileSync(RAW_CACHE_PATH, 'utf8');
  }

  for (const fallbackPath of LOCAL_FALLBACKS) {
    if (!fs.existsSync(fallbackPath)) continue;
    const raw = fs.readFileSync(fallbackPath, 'utf8');
    if (!raw.trim()) continue;
    fs.writeFileSync(RAW_CACHE_PATH, raw, 'utf8');
    return raw;
  }

  const raw = execFileSync('curl', ['-sSL', '--connect-timeout', '5', '--max-time', '20', SOURCE.rawUrl], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  if (!raw || !raw.trim()) {
    throw new Error('東京雜記 卷二 raw fetch returned empty response');
  }
  fs.writeFileSync(RAW_CACHE_PATH, raw, 'utf8');
  return raw;
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function stripMarkup(raw) {
  return normalizeNewlines(raw)
    .replace(/{{Header[\s\S]*?}}\n?/g, '')
    .replace(/{{right\|[^}]+}}\n?/g, '')
    .replace(/{{ul\|([^}]+)}}/g, '$1')
    .replace(/{{另\|([^|}]+)\|[^}]+}}/g, '$1')
    .replace(/{{\*\|[^}]+}}/g, '')
    .replace(/{{[^{}]*}}/g, '')
    .replace(/<ref[^>]*>.*?<\/ref>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1')
    .replace(/&nbsp;/g, ' ');
}

function normalizeForEntries(raw) {
  return stripMarkup(raw)
    .replace(/==\s*([^=\n]+?)\s*==/g, '\nSECTION:$1\n')
    .replace(/新增([^\s○]{1,12})詩/g, '\n○$1詩')
    .replace(/新增([^\s○]{1,12})歌/g, '\n○$1歌')
    .replace(/○/g, '\n○');
}

function buildDocumentSections(raw) {
  const lines = normalizeForEntries(raw)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const sections = [];
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    current.textZh = current.lines.join('\n').trim();
    current.characterCount = current.textZh.length;
    delete current.lines;
    sections.push(current);
    current = null;
  };

  for (const line of lines) {
    if (line.startsWith('SECTION:')) {
      flushCurrent();
      current = {
        sectionId: `KHS-TZ${VOLUME}-S-${String(sections.length + 1).padStart(4, '0')}`,
        headingZh: line.slice('SECTION:'.length),
        lines: []
      };
      continue;
    }

    if (!current) continue;
    current.lines.push(line.startsWith('○') ? line.slice(1) : line);
  }

  flushCurrent();
  return sections;
}

function buildEntries(raw) {
  const lines = normalizeForEntries(raw)
    .split('\n')
    .map((line) => line.replace(/\s+/g, '').trim())
    .filter(Boolean);

  const entries = [];
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    entries.push(current);
    current = null;
  };

  for (const line of lines) {
    if (line.startsWith('SECTION:')) {
      flushCurrent();
      entries.push({ type: 'section', section: line.slice('SECTION:'.length) });
      continue;
    }

    if (line.startsWith('○')) {
      flushCurrent();
      current = { type: 'entry', text: line.slice(1) };
      continue;
    }

    if (current) {
      current.text += line;
    }
  }

  flushCurrent();
  return entries;
}

function looksLikePersonishLabel(header) {
  if (header.length <= 4) return true;
  return PERSONISH_SUFFIXES.some((suffix) => header.endsWith(suffix));
}

function looksLikeExplicitWorkHeader(header, marker) {
  if (!header || header.length > 12) return false;
  if (HEADER_REJECT_CHARS.test(header)) return false;
  if (HEADER_REJECT_PHRASES.some((phrase) => header.includes(phrase))) return false;
  if (marker === '詩') return true;
  if (marker === '歌') return looksLikePersonishLabel(header) || header.endsWith('歌');
  return false;
}

function parseExplicitWork(entryText) {
  const match = entryText.match(/^(.{1,12}?)(詩|歌)(.+)$/);
  if (!match) return null;

  const [, header, marker, body] = match;
  if (!looksLikeExplicitWorkHeader(header, marker)) return null;

  return {
    header,
    marker,
    body
  };
}

function parseSevenYeongWork(entryText) {
  if (VOLUME !== 3) return null;

  const compact = entryText.replace(/\s+/g, '');
  for (const work of SEVEN_YEONG_WORKS) {
    if (!compact.startsWith(work.prefix)) continue;
    return {
      header: work.header,
      marker: work.marker,
      body: compact.slice(work.prefix.length),
      displayLabelZh: work.displayLabelZh || work.header,
      seriesTitleZh: '七詠',
      collationSource: SEVEN_YEONG_COLLATION_SOURCE
    };
  }
  return null;
}

function parseAttachedContext(entryText) {
  const match = entryText.match(/^(.{1,16}?記)(.+)$/);
  if (!match) return null;
  if (HEADER_REJECT_CHARS.test(match[1])) return null;

  return {
    heading: match[1],
    proseText: match[2]
  };
}

function extractContextTitle(entryText) {
  for (const suffix of CONTEXT_SUFFIXES) {
    const match = entryText.match(new RegExp(`^([^○]{1,24}?${suffix})(?:在|卽|有|今|舊在|諺傳|世傳|未知|前有|火于|文武王|新羅|高麗|本朝)`));
    if (match) return match[1];
  }
  return null;
}

function splitVerseLines(text) {
  const clean = text
    .replace(/[「」『』（）()]/g, '')
    .replace(/\s+/g, '');

  const punctuatedLines = clean
    .split(/[，。？！]/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (punctuatedLines.length > 1) {
    return punctuatedLines;
  }

  let normalized = clean.replace(/[◉]/g, '□');
  for (const width of [7, 5]) {
    for (let lineCount = Math.floor(normalized.length / width); lineCount >= 4; lineCount -= 1) {
      const prefixLength = lineCount * width;
      const suffix = normalized.slice(prefixLength);
      if (!suffix) continue;
      if (!TRAILING_CONTEXT_START_RE.test(suffix)) continue;
      normalized = normalized.slice(0, prefixLength);
      break;
    }
  }

  let bestWidth = null;
  let bestRemainder = Infinity;

  for (const width of [7, 5]) {
    const quotient = Math.floor(normalized.length / width);
    const remainder = normalized.length % width;
    if (quotient < 4) continue;
    if (remainder < bestRemainder) {
      bestWidth = width;
      bestRemainder = remainder;
    }
  }

  if (bestWidth !== null && bestRemainder <= 3) {
    const lines = [];
    for (let i = 0; i < normalized.length; i += bestWidth) {
      lines.push(normalized.slice(i, i + bestWidth));
    }
    return lines.filter(Boolean);
  }

  return punctuatedLines;
}

function focusWorkBody(body) {
  let focused = body.trim();

  const quoteMarkers = ['其詩曰', '詩曰', '歌曰'];
  const marker = quoteMarkers.find((candidate) => focused.includes(candidate));
  if (marker) {
    focused = focused.slice(focused.indexOf(marker) + marker.length);
  }

  const parentheticalTitle = focused.match(/^[（(]([^（）()]{1,12})[）)]/);
  if (parentheticalTitle) {
    focused = focused.slice(parentheticalTitle[0].length);
  }

  focused = focused.replace(/[\[（(]?新增[\]）)]?(?![^○]{0,12}[詩歌])[\s\S]*$/, '');

  const compact = focused.replace(/\s+/g, '');
  for (let index = 2; index < compact.length - 2; index += 1) {
    const maybeSurname = compact[index];
    if (!COMMON_SURNAMES.has(maybeSurname)) continue;

    const candidate = compact.slice(index).match(/^([一-龥]{2,4})(詩|歌)/);
    if (!candidate) continue;
    if (candidate[2] === '歌') continue;
    if (!looksLikeExplicitWorkHeader(candidate[1], candidate[2])) continue;
    if (index < 20) continue;

    focused = compact.slice(0, index);
    break;
  }

  return focused.trim();
}

function looksLikeNarrativeSongBody(body) {
  const compact = body.replace(/\s+/g, '');
  return (
    compact.length > 80 &&
    /(?:呈舞名|唱歌云|者蓋言|故作舞|國人不悟|以至於亡)/.test(compact)
  );
}

function inferForm(lines) {
  if (!lines.length) return '미상';
  const lengths = [...new Set(lines.map((line) => line.length))];
  if (lengths.length !== 1) return '미상';

  const lineCount = lines.length;
  const width = lengths[0];
  if (lineCount === 4 && width === 5) return '오언절구';
  if (lineCount === 4 && width === 7) return '칠언절구';
  if (lineCount === 8 && width === 5) return '오언율시';
  if (lineCount === 8 && width === 7) return '칠언율시';
  if (lineCount >= 5 && width === 5) return '오언고시';
  if (lineCount >= 5 && width === 7) return '칠언고시';
  return '미상';
}

function splitSevenYeongLines(work, focusedBody) {
  const lines = SEVEN_YEONG_LINE_OVERRIDES[work.header];
  if (!lines) return splitVerseLines(focusedBody);

  const compact = focusedBody.replace(/\s+/g, '');
  const expected = lines.join('');
  if (compact === expected) return lines;
  return splitVerseLines(focusedBody);
}

function getCollatedLineOverride(entryContextTitle, explicitWork, focusedBody) {
  const override = YUEBAK_LINE_OVERRIDES.find((candidate) => (
    candidate.volume === VOLUME &&
    candidate.sourceEntryTitle === entryContextTitle &&
    candidate.header === explicitWork.header &&
    candidate.marker === explicitWork.marker
  ));

  if (!override) return null;
  const compact = focusedBody.replace(/\s+/g, '');
  if (compact !== override.lines.join('')) return null;
  return override;
}

function normalizeAuthorOrTitle(header) {
  const clean = header.trim();
  const titleish = CONTEXT_SUFFIXES.some((suffix) => clean.includes(suffix));
  return {
    authorZh: titleish ? null : clean,
    titleHintZh: titleish ? clean : null
  };
}

function buildManifest(entries) {
  const documentSections = buildDocumentSections(getRaw());
  const sectionIdMap = new Map(documentSections.map((section) => [section.headingZh, section.sectionId]));
  const documentEntries = [];
  const poemBlocks = [];
  const attachedContexts = [];

  let currentSection = null;
  let currentContextTitle = null;

  for (const entry of entries) {
    if (entry.type === 'section') {
      currentSection = entry.section;
      currentContextTitle = null;
      continue;
    }

    const derivedContextTitle = extractContextTitle(entry.text);
    const entryContextTitle = derivedContextTitle || currentContextTitle;
    const documentEntryId = `KHS-TZ${VOLUME}-D-${String(documentEntries.length + 1).padStart(4, '0')}`;
    const sevenYeongWork = parseSevenYeongWork(entry.text);
    const explicitWork = sevenYeongWork || parseExplicitWork(entry.text);
    const attachedContext = parseAttachedContext(entry.text);
    const entryKind = explicitWork
      ? 'poem-bearing'
      : attachedContext
        ? 'context-bearing'
        : 'prose';

    documentEntries.push({
      documentEntryId,
      documentSectionId: sectionIdMap.get(currentSection) || null,
      section: currentSection,
      sourceEntryTitle: entryContextTitle,
      entryKind,
      textZh: entry.text,
      source: {
        collectionTitle: SOURCE.collectionTitle,
        juan: SOURCE.juan,
        sourceUrl: SOURCE.sourceUrl,
        sourcePolicyId: SOURCE.sourcePolicyId
      }
    });

    if (explicitWork) {
      const focusedBody = focusWorkBody(explicitWork.body);
      const collatedOverride = sevenYeongWork
        ? null
        : getCollatedLineOverride(entryContextTitle, explicitWork, focusedBody);
      const verseLines = sevenYeongWork
        ? splitSevenYeongLines(sevenYeongWork, focusedBody)
        : collatedOverride
          ? collatedOverride.lines
          : splitVerseLines(focusedBody);
      const focusedCompactBody = focusedBody.replace(/\s+/g, '');
      const label = normalizeAuthorOrTitle(explicitWork.header);
      const inferredForm = sevenYeongWork
        ? '가요/기타'
        : collatedOverride
          ? collatedOverride.inferredForm
        : explicitWork.marker === '詩'
          ? inferForm(verseLines)
          : '가요/기타';
      const confidence = sevenYeongWork
        ? 'high'
        : collatedOverride
          ? 'high'
        : verseLines.length === 1 || inferredForm === '미상'
          ? 'medium'
          : 'high';
      const rationale = sevenYeongWork
        ? '七詠 金宗直詩는 대조 문헌에서 하위 곡명이 확인되어 개별 작품 후보로 분리함'
        : collatedOverride
          ? '대조 문헌에서 구두점과 행 분할이 확인되어 보수 분할을 확정함'
        : confidence === 'high'
          ? 'entry가 `○저자/표제+詩/歌` 형태로 직접 열리고 행 분할도 안정적으로 복원됨'
          : 'entry는 직접 열리지만 원문 손상/무구두점 때문에 행 분할은 보수적으로 유지함';

      const looksNarrativeSong =
        explicitWork.marker === '歌' &&
        (looksLikeNarrativeSongBody(focusedBody) ||
          (verseLines.length === 1 && verseLines[0].length > 80));

      if (looksNarrativeSong) {
        attachedContexts.push({
          contextId: `KHS-TZ${VOLUME}-C-${String(attachedContexts.length + 1).padStart(4, '0')}`,
          documentEntryId,
          documentSectionId: sectionIdMap.get(currentSection) || null,
          section: currentSection,
          sourceEntryTitle: entryContextTitle,
          headingZh: `${explicitWork.header}${explicitWork.marker}`,
          prosePreview: focusedCompactBody.slice(0, 160),
          source: {
            collectionTitle: SOURCE.collectionTitle,
            juan: SOURCE.juan,
            sourceUrl: SOURCE.sourceUrl
          }
        });
      } else {
        poemBlocks.push({
          harvestId: `KHS-TZ${VOLUME}-H-${String(poemBlocks.length + 1).padStart(4, '0')}`,
          documentEntryId,
          documentSectionId: sectionIdMap.get(currentSection) || null,
          section: currentSection,
          sourceEntryTitle: entryContextTitle,
          marker: explicitWork.marker,
          authorZh: label.authorZh,
          titleHintZh: label.titleHintZh,
          displayLabelZh: explicitWork.displayLabelZh || `${explicitWork.header}${explicitWork.marker}`,
          ...(explicitWork.seriesTitleZh ? { seriesTitleZh: explicitWork.seriesTitleZh } : {}),
          textZh: verseLines.join('\n'),
          lineCount: verseLines.length,
          inferredForm,
          source: {
            collectionTitle: SOURCE.collectionTitle,
            juan: SOURCE.juan,
            sourceUrl: SOURCE.sourceUrl,
            sourcePolicyId: SOURCE.sourcePolicyId
          },
          harvestPolicy: {
            confidence,
            rationale,
            ...(explicitWork.collationSource || collatedOverride?.collationSource
              ? { collationSource: explicitWork.collationSource || collatedOverride.collationSource }
              : {})
          }
        });
      }
    }

    if (attachedContext) {
      attachedContexts.push({
        contextId: `KHS-TZ${VOLUME}-C-${String(attachedContexts.length + 1).padStart(4, '0')}`,
        documentEntryId,
        documentSectionId: sectionIdMap.get(currentSection) || null,
        section: currentSection,
        sourceEntryTitle: entryContextTitle,
        headingZh: attachedContext.heading,
        prosePreview: attachedContext.proseText.slice(0, 160),
        source: {
          collectionTitle: SOURCE.collectionTitle,
          juan: SOURCE.juan,
          sourceUrl: SOURCE.sourceUrl
        }
      });
    }

    if (derivedContextTitle) {
      currentContextTitle = derivedContextTitle;
    }
  }

  const bySection = {};
  for (const block of poemBlocks) {
    bySection[block.section] = (bySection[block.section] || 0) + 1;
  }
  const documentEntryKinds = documentEntries.reduce((acc, entry) => {
    acc[entry.entryKind] = (acc[entry.entryKind] || 0) + 1;
    return acc;
  }, {});

  return {
    version: '2026-04-23.v1',
    batchId: `korean-hansi-donggyeong-japgi-vol${VOLUME}-poem-harvest`,
    purpose: `${COLLECTION_IDENTITY.titleKo}(${COLLECTION_IDENTITY.titleZh}) ${SOURCE.juan}에서 문헌 원문 보존층과 시문 파생층을 함께 구조화한다`,
    collection: {
      ...COLLECTION_IDENTITY,
      title: SOURCE.collectionTitle,
      juan: SOURCE.juan,
      sourceUrl: SOURCE.sourceUrl,
      sourcePolicyId: SOURCE.sourcePolicyId,
      rawCachePath: RAW_CACHE_PATH
    },
    preservationPolicy: {
      documentLayer: '권차 원문은 section/항목 단위로 보존하고 연구·검수·재가공의 기준본으로 삼는다',
      workLayer: '시문은 문헌 항목을 가리키는 파생 자산으로 분리해 시 보기·번역·주석에 사용한다'
    },
    executionPolicy: {
      collectionUnit: 'collection slice -> document layer -> poem-bearing block',
      extractionRule: 'exact-title 1건보다, 권차 원문을 먼저 보존하고 그 안에서 직접 열리는 시문 블록을 파생한다',
      reviewRule: 'manifest는 후보 수집용이며 canonical record 승격은 별도 검토 단계에서 수행한다'
    },
    summary: {
      documentSectionCount: documentSections.length,
      documentEntryCount: documentEntries.length,
      documentEntryKinds,
      poemBlockCount: poemBlocks.length,
      attachedContextCount: attachedContexts.length,
      sectionsWithPoems: Object.keys(bySection).sort(),
      poemBlocksBySection: bySection
    },
    documentSections,
    documentEntries,
    poemBlocks,
    attachedContexts
  };
}

function main() {
  const raw = getRaw();
  const entries = buildEntries(raw);
  const manifest = buildManifest(entries);

  writeJson(OUT_MANIFEST, manifest);

  console.log(
    JSON.stringify(
      {
        outManifest: OUT_MANIFEST,
        documentSectionCount: manifest.summary.documentSectionCount,
        documentEntryCount: manifest.summary.documentEntryCount,
        poemBlockCount: manifest.summary.poemBlockCount,
        attachedContextCount: manifest.summary.attachedContextCount,
        sectionsWithPoems: manifest.summary.sectionsWithPoems
      },
      null,
      2
    )
  );
}

main();
