#!/usr/bin/env node
/**
 * build_korean_hansi_text_collection_pilot.js
 *
 * 목적:
 * - 실제 본문이 열리는 위키문헌 페이지를 기준으로 한국 한시 파일럿 입력 15건을 만든다.
 * - 상위 3명(최치원, 정지상, 허난설헌) 범위 안에서 실제 텍스트 수집 가능분을 우선 확보한다.
 * - 수집 성공/실패와 원래 보드 후보 일치 여부를 별도 리포트로 남긴다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_text_collection_pilot.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_INPUT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-text-collection-pilot.input.v1.json');
const OUT_REPORT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-text-collection-pilot.report.v1.json');
const RAW_CACHE_DIR = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-text-collection-raw');

const HAN_RE = /[\u3400-\u9FFF]/;
const KO_RE = /[\uAC00-\uD7A3]/;

const SOURCES = [
  {
    poemId: 'KHS-COLLECT-0001',
    canonicalId: 'KHS-CANON-CHOE-CHIWON-CHUYAUJUNG',
    author: { authorId: 'KAUTH-CHOE-CHIWON', ko: '최치원', zh: '崔致遠' },
    era: { label: '신라 말', startYear: 857, endYear: 940, confidence: 'medium' },
    title: { ko: '추야우중', zh: '秋夜雨中' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%B6%94%EC%95%BC%EC%9A%B0%EC%A4%91&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%B6%94%EC%95%BC%EC%9A%B0%EC%A4%91',
      collectionTitle: '위키문헌 개별 작품',
      entryTitle: '秋夜雨中'
    },
    boardTarget: '秋夜雨中'
  },
  {
    poemId: 'KHS-COLLECT-0002',
    canonicalId: 'KHS-CANON-CHOE-CHIWON-GAYASAN-FALLS',
    author: { authorId: 'KAUTH-CHOE-CHIWON', ko: '최치원', zh: '崔致遠' },
    era: { label: '신라 말', startYear: 857, endYear: 940, confidence: 'medium' },
    title: { ko: '제가야산 독서당 폭포', zh: '題伽倻山讀書堂瀑布' },
    page: {
      lang: 'zh',
      rawUrl: 'https://zh.wikisource.org/w/index.php?title=%E9%A1%8C%E4%BC%BD%E5%80%BB%E5%B1%B1%E8%AE%80%E6%9B%B8%E5%A0%82%E7%80%91%E5%B8%83&action=raw',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E9%A1%8C%E4%BC%BD%E5%80%BB%E5%B1%B1%E8%AE%80%E6%9B%B8%E5%A0%82%E7%80%91%E5%B8%83',
      collectionTitle: '중국 위키문헌 개별 작품',
      entryTitle: '題伽倻山讀書堂瀑布'
    },
    boardTarget: '題伽倻山'
  },
  {
    poemId: 'KHS-COLLECT-0003',
    canonicalId: 'KHS-CANON-CHOE-CHIWON-DEUNGYUNJUJAHWASA',
    author: { authorId: 'KAUTH-CHOE-CHIWON', ko: '최치원', zh: '崔致遠' },
    era: { label: '신라 말', startYear: 857, endYear: 940, confidence: 'medium' },
    title: { ko: '등윤주자화사', zh: '登潤州慈和寺' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0017150',
      collectionTitle: '한국민족문화대백과사전 작품 항목',
      entryTitle: '登潤州慈和寺'
    },
    inlinePoemZh: '登臨蹔隔路岐塵\n吟想興亡恨益新\n畫角聲中朝暮浪\n靑山影裏古今人\n霜摧玉樹花無主\n風暖金陵草自春\n賴有謝家餘境在\n長敎詩客爽精神',
    inlineLegacyTranslationKo: '높은 곳에 올라서 잠시나마 세상일 멀어지는듯싶더니\n흥망을 되씹으니 한이 더욱 새로워라\n아침 저녁 화각소리에 물은 흘러가고\n푸른 산 그림자 속엔 고금 인물 몇몇인고\n옥수에 서리치니 꽃은 임자도 없고\n금릉 따스한 바람에 풀은 절로 봄이로고\n사씨 일가 남은 경지 그대로 있어\n시객의 정신 길이 상쾌하게 하네',
    sourcePolicyIdOverride: 'SRC-ENCYKOREA-ARTICLE-TEXT',
    boardTarget: '登潤州慈和寺'
  },
  {
    poemId: 'KHS-COLLECT-0004',
    canonicalId: 'KHS-CANON-CHOE-CHIWON-GANGNAMNYEO',
    author: { authorId: 'KAUTH-CHOE-CHIWON', ko: '최치원', zh: '崔致遠' },
    era: { label: '신라 말', startYear: 857, endYear: 940, confidence: 'medium' },
    title: { ko: '강남녀', zh: '江南女' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E5%9B%9B',
      collectionTitle: '동문선 권4',
      entryTitle: '江南女'
    },
    inlinePoemZh: '江南蕩風俗\n養女嬌且憐\n冶性恥針線\n粧成調管絃\n所學非雅音\n多被春心牽\n自謂芳華色\n長占艷陽年\n却笑隣舍女\n終朝弄機杼\n機杼縱勞身\n羅衣不到汝',
    boardTarget: '江南女'
  },
  {
    poemId: 'KHS-COLLECT-0005',
    canonicalId: 'KHS-CANON-JEONG-JISANG-SONGIN',
    author: { authorId: 'KAUTH-JEONG-JISANG', ko: '정지상', zh: '鄭知常' },
    era: { label: '고려 중기', startYear: null, endYear: 1135, confidence: 'medium' },
    title: { ko: '송인', zh: '送人' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%86%A1%EC%9D%B8&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%86%A1%EC%9D%B8',
      collectionTitle: '위키문헌 개별 작품',
      entryTitle: '送人-大同江'
    },
    boardTarget: '送人'
  },
  {
    poemId: 'KHS-COLLECT-0006',
    canonicalId: 'KHS-CANON-CHOE-CHIWON-HYANGAKJAPYEONG',
    author: { authorId: 'KAUTH-CHOE-CHIWON', ko: '최치원', zh: '崔致遠' },
    era: { label: '신라 말', startYear: 857, endYear: 940, confidence: 'medium' },
    title: { ko: '향악잡영', zh: '鄕樂雜詠' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://zh.wikisource.org/wiki/%E4%B8%89%E5%9C%8B%E5%8F%B2%E8%A8%98/%E5%8D%B732',
      collectionTitle: '삼국사기 권32 악지 신라악',
      entryTitle: '鄕樂雜詠五首'
    },
    inlinePoemZh: '廻身掉臂弄金丸\n月轉星浮滿眼看\n縱有宜僚那勝此\n定知鯨海息波瀾\n肩高項縮髮崔嵬\n攘臂羣儒鬪酒盃\n聽得歌聲人盡笑\n夜頭旗幟曉頭催\n黃金面色是其人\n手抱珠鞭役鬼神\n疾步徐趍呈雅舞\n宛如丹鳳舞堯春\n蓮頭藍面異人間\n押隊來庭學舞鸞\n打鼓冬冬風瑟瑟\n南奔北躍也無端\n遠涉流沙萬里來\n毛衣破盡着塵埃\n搖頭掉尾馴仁德\n雄氣寧同百獸才',
    boardTarget: '鄕樂雜詠'
  },
  {
    poemId: 'KHS-COLLECT-0007',
    canonicalId: 'KHS-CANON-JEONG-JISANG-SINSEOL',
    author: { authorId: 'KAUTH-JEONG-JISANG', ko: '정지상', zh: '鄭知常' },
    era: { label: '고려 중기', startYear: null, endYear: 1135, confidence: 'medium' },
    title: { ko: '신설', zh: '新雪' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E5%8D%81%E4%B9%9D',
      collectionTitle: '동문선 권19',
      entryTitle: '新雪'
    },
    inlinePoemZh: '昨夜紛紛瑞雪新\n曉來鵷鷺賀中宸\n輕風不起陰雲捲\n白玉花開萬樹春',
    boardTarget: '新雪'
  },
  {
    poemId: 'KHS-COLLECT-0008',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-SONGHAKOK',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '송하곡적갑산', zh: '送荷谷謫甲山' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://zh.wikisource.org/wiki/%E8%98%AD%E9%9B%AA%E8%BB%92%E8%A9%A9%E9%9B%86',
      collectionTitle: '난설헌시집',
      entryTitle: '送荷谷謫甲山'
    },
    inlinePoemZh: '遠謫甲山客\n咸原行色忙\n臣同賈太傅\n主豈楚懷王\n河水平秋岸\n關雲欲夕陽\n霜風吹雁去\n中斷不成行',
    boardTarget: '送荷谷謫甲山'
  },
  {
    poemId: 'KHS-COLLECT-0009',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-GOKJA',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '곡자', zh: '哭子' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://zh.wikisource.org/wiki/%E8%98%AD%E9%9B%AA%E8%BB%92%E8%A9%A9%E9%9B%86',
      collectionTitle: '난설헌시집',
      entryTitle: '哭子'
    },
    inlinePoemZh: '去年喪愛女\n今年喪愛子\n哀哀廣陵土\n雙墳相對起\n蕭蕭白楊風\n鬼火明松楸\n紙錢招汝魄\n玄酒奠汝丘\n應知弟兄魂\n夜夜相追遊\n縱有腹中孩\n安可冀長成\n浪吟黃臺詞\n血泣悲呑聲',
    boardTarget: '哭子'
  },
  {
    poemId: 'KHS-COLLECT-0010',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-GYEONGHEUNG',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '견흥', zh: '遣興' },
    page: {
      lang: 'inline',
      rawUrl: null,
      sourceUrl: 'https://zh.wikisource.org/wiki/%E8%98%AD%E9%9B%AA%E8%BB%92%E8%A9%A9%E9%9B%86',
      collectionTitle: '난설헌시집',
      entryTitle: '遣興'
    },
    inlinePoemZh: '梧桐生嶧陽\n幾年傲寒陰\n幸遇稀代工\n劚取爲鳴琴\n琴成彈一曲\n擧世無知音\n所以廣陵散\n終古聲堙沈',
    boardTarget: '遣興'
  },
  {
    poemId: 'KHS-COLLECT-0011',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-IBYEOLIJATTA',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '이별이 잦아', zh: '江南曲 其四' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EC%9D%B4%EB%B3%84%EC%9D%B4_%EC%9E%A6%EC%95%84&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EC%9D%B4%EB%B3%84%EC%9D%B4_%EC%9E%A6%EC%95%84',
      collectionTitle: '조선여류한시선집',
      entryTitle: '江南曲 4'
    },
    boardTarget: null
  },
  {
    poemId: 'KHS-COLLECT-0012',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-BINNYEO-1',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '빈녀의 노래 1', zh: '貧女吟 其一' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_1&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_1',
      collectionTitle: '조선여류한시선집',
      entryTitle: '貧女吟 1'
    },
    boardTarget: '貧女吟'
  },
  {
    poemId: 'KHS-COLLECT-0013',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-BINNYEO-2',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '빈녀의 노래 2', zh: '貧女吟 其二' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_2&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_2',
      collectionTitle: '조선여류한시선집',
      entryTitle: '貧女吟 2'
    },
    boardTarget: '貧女吟'
  },
  {
    poemId: 'KHS-COLLECT-0014',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-BINNYEO-3',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '빈녀의 노래 3', zh: '貧女吟 其三' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_3&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_3',
      collectionTitle: '조선여류한시선집',
      entryTitle: '貧女吟 3'
    },
    boardTarget: '貧女吟'
  },
  {
    poemId: 'KHS-COLLECT-0015',
    canonicalId: 'KHS-CANON-HEO-NANSEOLHEON-BINNYEO-4',
    author: { authorId: 'KAUTH-HEO-NANSEOLHEON', ko: '허난설헌', zh: '許蘭雪軒' },
    era: { label: '조선 중기', startYear: 1563, endYear: 1589, confidence: 'high' },
    title: { ko: '빈녀의 노래 4', zh: '貧女吟 其四' },
    page: {
      lang: 'ko',
      rawUrl: 'https://ko.wikisource.org/w/index.php?title=%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_4&action=raw',
      sourceUrl: 'https://ko.wikisource.org/wiki/%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B9%88%EB%85%80%EC%9D%98_%EB%85%B8%EB%9E%98_4',
      collectionTitle: '조선여류한시선집',
      entryTitle: '貧女吟 4'
    },
    boardTarget: '貧女吟'
  }
];

const BOARD_TARGETS = {
  최치원: ['秋夜雨中', '題伽倻山', '登潤州慈和寺', '江南女', '鄕樂雜詠'],
  정지상: ['送人', '新雪', '鄕宴致語', '栢律寺', '西樓'],
  허난설헌: ['送荷谷謫甲山', '寄夫讀書江舍', '哭子', '遣興', '貧女吟']
};

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function cachePathFor(source) {
  return path.join(RAW_CACHE_DIR, `${source.poemId}.raw.txt`);
}

function fetchRaw(source) {
  const cachePath = cachePathFor(source);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf8');
  }

  const { rawUrl: url } = source.page;
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const out = execFileSync('curl', ['-sSL', '--connect-timeout', '5', '--max-time', '20', url], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      if (out && out.trim()) return out;
      lastError = new Error('empty response');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`failed to fetch: ${url}`);
}

function stripWikiMarkup(text) {
  return text
    .replace(/{{sic\|([^|}]+)\|[^}]+}}/g, '$1')
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function extractModernTranslation(raw) {
  const match = raw.match(/===현대어===\s*<poem>([\s\S]*?)<\/poem>/);
  if (!match) return null;
  return stripWikiMarkup(match[1])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n') || null;
}

function parseKoPoemBlock(raw) {
  const poemMatch = raw.match(/<poem>([\s\S]*?)<\/poem>/);
  if (!poemMatch) throw new Error('ko page has no poem block');

  const block = poemMatch[1];
  const witjuMatches = [...block.matchAll(/{{윗주\|([^|}]+)\|([^}]+)}}/g)];
  if (witjuMatches.length > 0) {
    return {
      poemZh: witjuMatches.map((m) => stripWikiMarkup(m[1])).join('\n'),
      poemKoReading: witjuMatches.map((m) => stripWikiMarkup(m[2])).join('\n'),
      legacyTranslationKo: extractModernTranslation(raw)
    };
  }

  const cleanedBlock = stripWikiMarkup(block);
  const lines = cleanedBlock.split('\n').map((line) => line.trim()).filter(Boolean);
  const poemZhLines = [];
  const poemKoReadingLines = [];
  const translationLines = [];
  let originalStarted = false;

  for (const line of lines) {
    if (/^:+/.test(line)) {
      originalStarted = true;
      const body = line.replace(/^:+/, '').trim();
      const tokens = body.split(/\s+/).filter(Boolean);
      const zhTokens = [];
      const koTokens = [];
      let seenKo = false;
      for (const token of tokens) {
        if (!seenKo && KO_RE.test(token)) seenKo = true;
        if (seenKo) koTokens.push(token);
        else zhTokens.push(token);
      }
      zhTokens
        .map((token) => token.trim())
        .filter((token) => HAN_RE.test(token))
        .forEach((token) => poemZhLines.push(token));
      koTokens
        .map((token) => token.trim())
        .filter((token) => KO_RE.test(token))
        .forEach((token) => poemKoReadingLines.push(token));
      continue;
    }
    if (/^×/.test(line) || /^={3}/.test(line)) continue;
    if (!originalStarted) translationLines.push(line);
  }

  return {
    poemZh: poemZhLines.join('\n'),
    poemKoReading: poemKoReadingLines.length > 0 ? poemKoReadingLines.join('\n') : null,
    legacyTranslationKo: translationLines.length > 0 ? translationLines.join('\n') : null
  };
}

function parseZhPoemBlock(raw) {
  const normalized = raw
    .replace(/<onlyinclude>/g, '')
    .replace(/<\/onlyinclude>/g, '')
    .replace(/{{[^{}]*}}/g, '')
    .trim();

  let poemBody = '';
  const poemMatch = normalized.match(/<poem>([\s\S]*?)<\/poem>/);
  if (poemMatch) {
    poemBody = poemMatch[1];
  } else {
    const candidates = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && HAN_RE.test(line) && !line.startsWith('|') && !line.startsWith('[['));
    poemBody = candidates[candidates.length - 1] || '';
  }

  const lines = [];
  for (const rawLine of stripWikiMarkup(poemBody).split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/[，。！？；]/.test(line) && !line.includes('\n')) {
      line
        .split(/[，。！？；]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => lines.push(part));
    } else {
      lines.push(line);
    }
  }

  return {
    poemZh: lines.join('\n'),
    poemKoReading: null,
    legacyTranslationKo: null
  };
}

function inferForm(poemZh) {
  const lines = poemZh
    .split('\n')
    .map((line) => line.replace(/[，。！？；、\s]/g, '').trim())
    .filter(Boolean);

  if (lines.length === 0) return '미상';
  const lengths = [...new Set(lines.map((line) => line.length))];
  if (lengths.length !== 1) return '미상';

  if (lines.length === 4 && lengths[0] === 5) return '오언절구';
  if (lines.length === 4 && lengths[0] === 7) return '칠언절구';
  if (lines.length === 8 && lengths[0] === 5) return '오언율시';
  if (lines.length === 8 && lengths[0] === 7) return '칠언율시';
  return '미상';
}

function buildLegacyTranslationRights(sourceUrl) {
  return {
    sourcePolicyId: 'SRC-WIKISOURCE-TEXT',
    sourceUrl,
    checkedAt: '2026-04-21T05:36:00+09:00',
    checkedBy: '태훈',
    evidence: '위키문헌 raw 페이지와 문서 하단 라이선스 표기를 함께 확인',
    notes: '위키문헌 수록 번역문'
  };
}

function buildLegacyTranslationRightsWithPolicy(sourceUrl, sourcePolicyId, evidence, notes) {
  return {
    sourcePolicyId,
    sourceUrl,
    checkedAt: '2026-04-21T06:07:00+09:00',
    checkedBy: '태훈',
    evidence,
    notes
  };
}

function buildRecord(source) {
  let parsed;
  if (source.page.lang === 'inline') {
    parsed = {
      poemZh: source.inlinePoemZh,
      poemKoReading: null,
      legacyTranslationKo: source.inlineLegacyTranslationKo || null
    };
  } else {
    const raw = fetchRaw(source);
    parsed = source.page.lang === 'zh' ? parseZhPoemBlock(raw) : parseKoPoemBlock(raw);
  }
  if (!parsed.poemZh) throw new Error(`${source.poemId}: poemZh parse failed`);

  const sourcePolicyId = source.sourcePolicyIdOverride || 'SRC-WIKISOURCE-TEXT';
  const legacyTranslationRights = parsed.legacyTranslationKo
    ? (
      sourcePolicyId === 'SRC-WIKISOURCE-TEXT'
        ? buildLegacyTranslationRights(source.page.sourceUrl)
        : buildLegacyTranslationRightsWithPolicy(
          source.page.sourceUrl,
          sourcePolicyId,
          '항목 본문에 원문과 번역이 함께 수록됨',
          '백과사전 항목 수록 번역문'
        )
    )
    : null;

  return {
    poemId: source.poemId,
    canonicalId: source.canonicalId,
    title: source.title,
    author: source.author,
    era: source.era,
    genre: {
      broad: '한시',
      form: inferForm(parsed.poemZh)
    },
    sourceWork: {
      collectionTitle: source.page.collectionTitle,
      juan: null,
      entryTitle: source.page.entryTitle,
      sourceUrl: source.page.sourceUrl,
      sourcePolicyId
    },
    text: {
      poemZh: parsed.poemZh,
      poemKoReading: parsed.poemKoReading,
      poemKoGloss: null
    },
    legacyAssets: {
      translationKo: parsed.legacyTranslationKo,
      notes: [],
      commentaryKo: null
    },
    ownedAssets: {
      translationKoOwned: null,
      notesOwned: [],
      commentaryKoOwned: null
    },
    rights: parsed.legacyTranslationKo
      ? { legacyTranslation: legacyTranslationRights }
      : {},
    commercialTransition: {
      isCommercialReady: false,
      blockingAssets: [],
      replacementRequired: []
    }
  };
}

function summarize(records) {
  const authorCounts = {};
  const boardCoverage = {};

  for (const author of Object.keys(BOARD_TARGETS)) {
    boardCoverage[author] = { totalTargets: BOARD_TARGETS[author].length, matchedTargets: [] };
  }

  for (const source of SOURCES) {
    authorCounts[source.author.ko] = (authorCounts[source.author.ko] || 0) + 1;
    if (source.boardTarget) {
      boardCoverage[source.author.ko].matchedTargets.push(source.boardTarget);
    }
  }

  const unresolvedBoardTargets = {};
  for (const [author, targets] of Object.entries(BOARD_TARGETS)) {
    const matched = new Set(boardCoverage[author].matchedTargets);
    unresolvedBoardTargets[author] = targets.filter((target) => !matched.has(target));
  }

  const issues = [];
  const distribution = ['최치원', '정지상', '허난설헌']
    .map((author) => `${author} ${authorCounts[author] || 0}`)
    .join(', ');
  issues.push(`상위 3명 15수는 확보했지만 저자별 분포는 아직 불균등함 (${distribution})`);

  for (const author of ['최치원', '정지상', '허난설헌']) {
    if (unresolvedBoardTargets[author].length > 0) {
      issues.push(`${author} 미해결 보드 후보: ${unresolvedBoardTargets[author].join(', ')}`);
    }
  }

  issues.push('동문선·삼국사기·난설헌시집처럼 다작이 한 페이지에 실린 공개 문헌을 재사용하므로, 실제 ingest 전에는 작품별 수록 위치(locator)와 시리즈 처리 기준을 계속 고정해야 함');

  return {
    version: '2026-04-21.v1',
    purpose: '실제 텍스트가 열리는 공개 문헌 페이지 기준 수집 파일럿',
    totalCollected: records.length,
    authorCounts,
    boardCoverage,
    unresolvedBoardTargets,
    issues
  };
}

function main() {
  const records = SOURCES.map(buildRecord);
  const report = summarize(records);
  writeJson(OUT_INPUT, records);
  writeJson(OUT_REPORT, report);
  console.log(`Collected records: ${records.length}`);
  console.log(`Input JSON: ${OUT_INPUT}`);
  console.log(`Report JSON: ${OUT_REPORT}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
