#!/usr/bin/env node
/* ============================================
   한시 소식 자동 크롤링 스크립트
   - Naver Search API (뉴스 검색)
   - Google News RSS (보조 소스)
   - AI 필터링 + 기사 재작성
   - news_articles.json 저장
   ============================================ */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ─── 설정 ───────────────────────────────────
const OUTPUT_PATH = path.join(__dirname, "../public/index/news_articles.json");
const MAX_ARTICLES = 50;  // JSON에 보존할 최대 기사 수
const DISPLAY_MONTHS = 2; // 프론트에서 표시할 개월 수
const MIN_BODY_CHARS = 300;
const MAX_BODY_CHARS = 500;
const MIN_BODY_FALLBACK_CHARS = 80;
const SUMMARY_MAX_CHARS = 180;
const NEWS_SCHEMA_VERSION = "1.1";
const FETCH_TIMEOUT_MS = Number(process.env.NEWS_FETCH_TIMEOUT_MS || 10000);
const FETCH_RETRIES = Number(process.env.NEWS_FETCH_RETRIES || 2);
const REDIRECT_MAX = 3;

const CLI_ARGS = new Set(process.argv.slice(2));
const NORMALIZE_ONLY = CLI_ARGS.has("--normalize-only");
const AI_PARSE_RETRY_MAX = 1;
const AI_REPAIR_INPUT_MAX = 12000;

// 환경변수
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "openai"; // "openai" 또는 "anthropic"
const AI_MODEL = process.env.AI_MODEL
  || (AI_PROVIDER === "anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");

// ─── 검색 키워드 설정 (추후 분리/수정 용이) ──────────────
const SEARCH_CONFIG = [
  { category: "한시", keywords: ["한시", "당시", "고전시", "시선집", "당시삼백수"], limitPerKeyword: 5 },
  { category: "한자시험", keywords: ["한자능력검정시험", "한자교육", "한문교육"], limitPerKeyword: 5 },
  { category: "유명시인", keywords: ["두보 뉴스", "이백 화제", "왕유 전시", "백거이 발견"], limitPerKeyword: 3 },
  { category: "시문학", keywords: ["신춘문예 시문학", "문학상 시부문", "시집 출간"], limitPerKeyword: 5 },
  { category: "전통행사", keywords: ["석전대제", "성균관 행사", "한시 백일장", "유교문화 행사"], limitPerKeyword: 3 },
  { category: "서예전시", keywords: ["서예전", "한시 전시회", "서각 전시"], limitPerKeyword: 3 }
];

const AI_REVIEW_MAX_CHARS = 700;

const GLOBAL_INCLUDE_TERMS = [
  "고전시", "시문학", "시조", "향가",
  "한문", "한자", "서예", "전통문화", "유교", "성균관",
  "석전대제", "백일장", "문학상", "신춘문예", "시집", "시선집",
  "두보", "이백", "왕유", "백거이", "중국고전", "고전문학",
  "한문교육", "한자교육", "한자능력검정"
];

const CATEGORY_INCLUDE_TERMS = {
  한시: ["漢詩", "당시삼백수", "고전시", "시선집", "시경", "절구", "율시", "한문시", "당나라 시인", "중국 고전시"],
  한자시험: ["한자능력검정", "한자시험", "한문교육", "한자교육", "한자급수", "검정시험"],
  유명시인: ["두보", "이백", "왕유", "백거이", "시인", "당나라 시인", "당시인"],
  시문학: ["신춘문예", "문학상", "시문학", "시집", "등단", "시 부문", "문예지"],
  전통행사: ["석전대제", "성균관", "유교문화", "한시 백일장", "향교", "전통문화 행사"],
  서예전시: ["서예", "서예전", "서각", "한시 전시", "필묵", "전각", "캘리그래피"],
};

const HANSHI_STRONG_TERMS = [
  "漢詩", "당시삼백수", "고전시", "한문시", "절구", "율시", "시선집",
  "당나라 시인", "중국 고전시", "두보", "이백", "왕유", "백거이",
];

const HANSHI_CONTEXT_TERMS = [
  "시인", "시구", "시집", "한문", "고전", "문학",
  "두보", "이백", "왕유", "백거이", "절구", "율시", "한시 작품",
];

const GLOBAL_EXCLUDE_TERMS = [
  "트럼프", "관세", "평택항", "수출부두", "환율", "주가", "코스피", "코스닥",
  "나스닥", "비트코인", "부동산", "분양", "청약", "전세", "실거래가",
  "야구", "축구", "농구", "골프", "epl", "kbo",
  "아이돌", "드라마", "예능", "영화", "ott", "컴백",
  "살인", "사고", "화재", "체포", "기소", "선거", "총선", "대선"
];

const COLUMN_TITLE_MARKERS = [
  "칼럼", "컬럼", "사설", "오피니언", "시론", "기고", "특별기고",
  "데스크", "기자수첩", "논단", "연재", "에세이", "논평",
  "선데이", "시간들", "현지 보고", "문학으로 세상읽기",
  "우리 음악 쉽게 듣기", "잡영", "泮中雜詠", "한시 감상",
];

const COLUMN_STRONG_TITLE_MARKERS = [
  "칼럼", "컬럼", "사설", "오피니언", "시론", "기고", "특별기고",
  "데스크", "기자수첩", "논단", "논평", "잡영", "泮中雜詠", "한시 감상",
];

const COLUMN_FORCE_NEWS_TITLE_MARKERS = [
  "뷰파인더",
];

const COLUMN_URL_MARKERS = [
  "/opinion/", "/column/", "/editorial/", "/op-ed/", "/opinions/",
];

const INFO_CATEGORY_HINTS = new Set(["한자시험"]);

const INFO_TITLE_MARKERS = [
  "시험 안내", "검정 안내", "원서 접수", "접수 안내", "시행 안내", "시행 공고",
  "시험 일정", "일정 안내", "공고", "모집", "신청", "응시", "상시운영", "상시 운영",
  "합격자 발표", "자격시험", "국가기술자격",
];

const INFO_BODY_MARKERS = [
  "원서 접수", "접수 기간", "시험 일정", "응시 자격", "시행 계획", "합격자 발표",
  "신청 방법", "문의처", "상시 운영", "검정 일정",
];

const CATEGORY_NEGATIVE_OVERRIDE_TERMS = {
  한시: HANSHI_STRONG_TERMS,
  한자시험: ["한자능력검정", "한자시험", "한자교육", "한문교육", "자격시험", "검정시험"],
  유명시인: ["두보", "이백", "왕유", "백거이", "당나라 시인", "시인"],
  시문학: ["신춘문예", "문학상", "시문학", "시집", "시 부문", "등단"],
  전통행사: ["석전대제", "성균관", "향교", "유교문화", "한시 백일장", "전통문화 행사"],
  서예전시: ["서예", "서예전", "서각", "전각", "한시 전시", "필묵"],
  서예: ["서예", "서예전", "서각", "전각", "필묵"],
};

const EVENT_AGGREGATION_WINDOW_DAYS = Number(process.env.NEWS_EVENT_AGG_WINDOW_DAYS || 45);
const EVENT_AGGREGATION_MIN_ITEMS = Number(process.env.NEWS_EVENT_AGG_MIN_ITEMS || 2);
const EVENT_AGGREGATION_RULES = [
  {
    id: "seokjeondaeje",
    keyword: "석전대제",
    category: "전통행사",
    matchInTitleOnly: true,
    title: "각지 향교에서 유교 최대행사 석전대제 거행",
    summary: "각지 향교에서 석전대제가 잇따라 열리고 있다.",
  },
];

const SIMILARITY_STOPWORDS = new Set([
  "기자", "서울", "부산", "대구", "인천", "한국", "대한민국",
  "이번", "관련", "통해", "위해", "대한", "오는", "지난", "오늘",
  "내일", "오전", "오후", "사진", "제공", "보도", "뉴스", "연합뉴스",
  "뉴시스", "뉴스1", "이날", "한편", "등을", "하고", "있다", "했다",
  "밝혔다", "전했다", "열린", "열렸다", "진행", "개최", "주최", "참석"
]);

function createRunStats() {
  return {
    requests: { total: 0, success: 0, failed: 0, retry: 0, timeout: 0, redirect: 0 },
    sources: {
      naverApi: { queried: 0, success: 0, failed: 0, items: 0 },
      googleRss: { queried: 0, success: 0, failed: 0, items: 0, parseDropped: 0 },
      naverWeb: { queried: 0, success: 0, failed: 0, items: 0, articleFetchFailed: 0 },
    },
    articleBody: {
      naverDicArea: 0,
      articleTag: 0,
      ogDescription: 0,
      metaDescription: 0,
      noBody: 0,
      fetchError: 0,
    },
    ai: {
      calls: 0,
      parseFail: 0,
      filteredIn: 0,
      filteredOut: 0,
      rewritten: 0,
      fallbackUsed: 0,
      repairCalls: 0,
      lengthRetry: 0,
      lengthRetrySuccess: 0,
      lengthRetryFailed: 0,
      copyRetry: 0,
    },
    normalize: {
      droppedInvalid: 0,
      droppedDuplicate: 0,
      droppedNearDuplicate: 0,
    },
    aggregation: {
      groups: 0,
      mergedArticles: 0,
    },
    relevance: {
      preDropped: 0,
      postDropped: 0,
      aiParseDropped: 0,
      noKeyDropped: 0,
    },
  };
}

const RUN_STATS = createRunStats();

// ─── HTTP 요청 유틸 ─────────────────────────
function fetchUrl(url, options = {}) {
  const headers = options.headers || {};
  const timeoutMs = Number(options.timeoutMs || FETCH_TIMEOUT_MS);
  const retries = Number.isInteger(options.retries) ? options.retries : FETCH_RETRIES;

  function requestOnce(targetUrl, attempt = 0, redirectCount = 0) {
    RUN_STATS.requests.total += 1;
    return new Promise((resolve, reject) => {
      const mod = targetUrl.startsWith("https") ? https : http;
      let didTimeout = false;

      const req = mod.get(targetUrl, {
        headers,
        timeout: timeoutMs,
      }, (res) => {
        const status = res.statusCode || 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          if (redirectCount >= REDIRECT_MAX) {
            RUN_STATS.requests.failed += 1;
            reject(new Error(`Too many redirects: ${targetUrl}`));
            return;
          }

          let nextUrl = res.headers.location;
          try {
            nextUrl = new URL(res.headers.location, targetUrl).toString();
          } catch {
            // 원본 location 값을 그대로 사용
          }

          RUN_STATS.requests.redirect += 1;
          RUN_STATS.requests.success += 1;
          requestOnce(nextUrl, attempt, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          RUN_STATS.requests.success += 1;
          resolve({ status, body: data, url: targetUrl });
        });
      });

      req.on("error", (err) => {
        if (didTimeout) RUN_STATS.requests.timeout += 1;

        if (attempt < retries) {
          RUN_STATS.requests.retry += 1;
          const backoffMs = 200 * (attempt + 1);
          setTimeout(() => {
            requestOnce(targetUrl, attempt + 1, redirectCount).then(resolve).catch(reject);
          }, backoffMs);
          return;
        }

        RUN_STATS.requests.failed += 1;
        reject(err);
      });

      req.on("timeout", () => {
        didTimeout = true;
        req.destroy(new Error("Timeout"));
      });
    });
  }

  return requestOnce(url);
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...headers,
      },
      timeout: 30000,
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(payload);
    req.end();
  });
}

// ─── Naver 검색 API ─────────────────────────
async function searchNaver(query, display = 10) {
  RUN_STATS.sources.naverApi.queried += 1;

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.log("  [Naver] API 키 미설정, 건너뜀");
    RUN_STATS.sources.naverApi.failed += 1;
    return [];
  }

  const encoded = encodeURIComponent(query);
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encoded}&display=${display}&sort=date`;

  try {
    const res = await fetchUrl(url, {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    });

    if (res.status !== 200) {
      console.warn(`  [Naver] HTTP ${res.status} for "${query}"`);
      RUN_STATS.sources.naverApi.failed += 1;
      return [];
    }

    const data = JSON.parse(res.body);
    const items = (data.items || []).map(item => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      link: item.originallink || item.link,
      pubDate: item.pubDate,
      source: "Naver",
    }));
    RUN_STATS.sources.naverApi.success += 1;
    RUN_STATS.sources.naverApi.items += items.length;
    return items;
  } catch (e) {
    console.warn(`  [Naver] 검색 실패 "${query}":`, e.message);
    RUN_STATS.sources.naverApi.failed += 1;
    return [];
  }
}

// ─── Google News RSS ────────────────────────
async function searchGoogleNews(query) {
  RUN_STATS.sources.googleRss.queried += 1;

  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await fetchUrl(url);
    if (res.status !== 200) {
      console.warn(`  [Google] HTTP ${res.status} for "${query}"`);
      RUN_STATS.sources.googleRss.failed += 1;
      return [];
    }

    // 간단한 RSS XML 파싱
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(res.body)) !== null) {
      const xml = match[1];
      // <source url="...">출처</source> 에서 출처 도메인 추출
      const sourceUrlMatch = xml.match(/<source\s+url="([^"]+)"/);
      const sourceName = extractTag(xml, "source");
      const entry = {
        title: extractTag(xml, "title"),
        description: stripHtml(extractTag(xml, "description")),
        link: extractTag(xml, "link"),
        pubDate: extractTag(xml, "pubDate"),
        source: "Google",
        sourceDomain: sourceUrlMatch ? sourceUrlMatch[1] : "",
        sourceName: sourceName || "",
      };
      if (!entry.title || !entry.link) {
        RUN_STATS.sources.googleRss.parseDropped += 1;
        continue;
      }
      items.push(entry);
    }
    const out = items.slice(0, 10);
    RUN_STATS.sources.googleRss.success += 1;
    RUN_STATS.sources.googleRss.items += out.length;
    return out;
  } catch (e) {
    console.warn(`  [Google] 검색 실패 "${query}":`, e.message);
    RUN_STATS.sources.googleRss.failed += 1;
    return [];
  }
}

// ─── Naver 웹 검색으로 기사 URL + 설명 가져오기 ──
async function searchNaverWeb(query) {
  RUN_STATS.sources.naverWeb.queried += 1;

  const encoded = encodeURIComponent(query);
  const url = `https://search.naver.com/search.naver?where=news&query=${encoded}&sm=tab_opt&sort=1`;

  try {
    const res = await fetchUrl(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    if (res.status !== 200) {
      RUN_STATS.sources.naverWeb.failed += 1;
      return [];
    }

    // Naver 뉴스 기사 URL 추출 (n.news.naver.com)
    const naverNewsUrls = [...res.body.matchAll(/href="(https:\/\/n\.news\.naver\.com\/mnews\/article\/[^"]+)"/g)]
      .map(m => m[1])
      .slice(0, 10);

    if (naverNewsUrls.length === 0) return [];

    // 각 기사 페이지에서 og 정보 추출 (3개씩 배치)
    const articles = [];
    for (let i = 0; i < naverNewsUrls.length; i += 3) {
      const batch = naverNewsUrls.slice(i, i + 3);
      const results = await Promise.all(batch.map(async (articleUrl) => {
        try {
          const page = await fetchUrl(articleUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              "Accept-Language": "ko-KR,ko;q=0.9",
            },
          });
          if (page.status !== 200) {
            RUN_STATS.sources.naverWeb.articleFetchFailed += 1;
            return null;
          }

          const head = page.body.slice(0, 20000);

          // og 태그 추출
          const getOg = (prop) => {
            const m = head.match(new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`, "i"))
              || head.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${prop}["']`, "i"));
            return m ? m[1] : "";
          };

          const title = getOg("og:title");
          const ogDesc = getOg("og:description");
          const ogImage = getOg("og:image");
          const pubDate = getOg("article:published_time")
            || head.match(/datetime="([^"]+)"/)?.[1]
            || "";

          if (!title) return null;

          // 실제 기사 본문 추출 (dic_area > article > 전체 본문)
          let articleText = "";
          const bodyHtml = page.body;
          const dicArea = bodyHtml.match(/id="dic_area"[^>]*>([\s\S]*?)<\/article>/);
          if (dicArea) {
            articleText = dicArea[1]
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          }

          // 본문 300자 또는 og:description 사용
          const desc = articleText.length > 100
            ? articleText.slice(0, 300)
            : (ogDesc.length > 30 ? ogDesc : "");

          if (!desc || desc.length < 30) return null;

          return {
            title: stripHtml(title),
            description: stripHtml(desc),
            link: articleUrl,
            pubDate: pubDate,
            source: "NaverWeb",
            imageUrl: ogImage || "",
          };
        } catch {
          RUN_STATS.sources.naverWeb.articleFetchFailed += 1;
          return null;
        }
      }));

      articles.push(...results.filter(Boolean));
      if (i + 3 < naverNewsUrls.length) await sleep(300);
    }

    RUN_STATS.sources.naverWeb.success += 1;
    RUN_STATS.sources.naverWeb.items += articles.length;
    return articles;
  } catch (e) {
    console.warn(`  [NaverWeb] 검색 실패 "${query}":`, e.message);
    RUN_STATS.sources.naverWeb.failed += 1;
    return [];
  }
}

// ─── 기사 페이지에서 본문 또는 og:description 추출 ───
async function fetchArticleBody(url) {
  try {
    const res = await fetchUrl(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    if (res.status !== 200) {
      RUN_STATS.articleBody.fetchError += 1;
      return "";
    }

    const body = res.body;

    // 1) Naver 뉴스 본문 (dic_area)
    const dicArea = body.match(/id="dic_area"[^>]*>([\s\S]*?)<\/article>/);
    if (dicArea) {
      const text = dicArea[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 100) {
        RUN_STATS.articleBody.naverDicArea += 1;
        return stripHtml(text.slice(0, 300));
      }
    }

    // 2) 일반 기사 본문 (<article> 태그)
    const article = body.match(/<article[^>]*>([\s\S]*?)<\/article>/);
    if (article) {
      const text = article[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 100) {
        RUN_STATS.articleBody.articleTag += 1;
        return stripHtml(text.slice(0, 300));
      }
    }

    // 3) og:description fallback
    const head = body.slice(0, 15000);
    const ogMatch = head.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i)
      || head.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i);
    if (ogMatch && ogMatch[1].length > 30) {
      RUN_STATS.articleBody.ogDescription += 1;
      return stripHtml(ogMatch[1]);
    }

    // 4) meta description
    const metaMatch = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      || head.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    if (metaMatch && metaMatch[1].length > 30) {
      RUN_STATS.articleBody.metaDescription += 1;
      return stripHtml(metaMatch[1]);
    }

    RUN_STATS.articleBody.noBody += 1;
    return "";
  } catch {
    RUN_STATS.articleBody.fetchError += 1;
    return "";
  }
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(text, keyword) {
  if (!text || !keyword) return false;
  const kw = normalizeWhitespace(keyword).toLowerCase();
  if (!kw) return false;

  // 짧고 다의적인 키워드는 단어 경계 기반으로만 매칭 (예: "한시" vs "한시적으로")
  if (kw.length <= 2 || kw === "한시" || kw === "당시") {
    const boundary = new RegExp(`(^|[^0-9a-zA-Z가-힣])${escapeRegex(kw)}([^0-9a-zA-Z가-힣]|$)`);
    return boundary.test(text);
  }

  return text.includes(kw);
}

function containsAnyKeyword(text, keywords) {
  if (!text || !Array.isArray(keywords) || keywords.length === 0) return false;
  return keywords.some((k) => containsKeyword(text, k));
}

function buildRelevanceText(item) {
  const title = normalizeWhitespace(item?.title);
  const summary = normalizeWhitespace(item?.summary || item?.description);
  const body = normalizeWhitespace(item?.body || item?.reviewBody);
  return normalizeWhitespace(`${title} ${summary} ${body}`).toLowerCase();
}

function normalizeArticleType(value) {
  const v = normalizeWhitespace(value).toLowerCase();
  if (v === "column") return "column";
  if (v === "info" || v === "information") return "info";
  return "news";
}

function extractBracketLabels(title) {
  const safeTitle = normalizeWhitespace(title);
  if (!safeTitle) return [];
  return [...safeTitle.matchAll(/\[([^\]]{1,80})\]/g)]
    .map((m) => normalizeWhitespace(m[1]).toLowerCase())
    .filter(Boolean);
}

function isNaverOpinionUrl(sourceUrl) {
  const raw = normalizeWhitespace(sourceUrl);
  if (!raw) return false;

  const lowered = raw.toLowerCase();
  if (!lowered.includes("naver.com")) return false;
  if (lowered.includes("sid=110") || lowered.includes("sid1=110")) return true;

  try {
    const parsed = new URL(raw);
    const sid = parsed.searchParams.get("sid") || parsed.searchParams.get("sid1");
    return sid === "110";
  } catch {
    return false;
  }
}

function hasStrongColumnSignal(item = {}) {
  const title = normalizeWhitespace(item?.title);
  const body = normalizeWhitespace(item?.body || item?.reviewBody || item?.summary || item?.description);
  const sourceUrlRaw = normalizeWhitespace(item?.sourceUrl || item?.link);
  const sourceUrl = sourceUrlRaw.toLowerCase();
  const bracketLabels = extractBracketLabels(title);
  const titleText = title.toLowerCase();
  const bodyText = body.toLowerCase();

  if (COLUMN_URL_MARKERS.some((m) => sourceUrl.includes(m))) return true;
  if (isNaverOpinionUrl(sourceUrlRaw)) return true;
  if (bracketLabels.some((label) => COLUMN_STRONG_TITLE_MARKERS.some((m) => label.includes(m.toLowerCase())))) {
    return true;
  }
  if (COLUMN_STRONG_TITLE_MARKERS.some((m) => titleText.includes(m.toLowerCase()))) return true;
  if (bodyText.includes("칼럼니스트") || bodyText.includes("논설위원")) return true;

  return false;
}

function hasForceNewsSignal(item = {}) {
  const title = normalizeWhitespace(item?.title).toLowerCase();
  if (!title) return false;
  const bracketLabels = extractBracketLabels(item?.title);
  const hasMarker = COLUMN_FORCE_NEWS_TITLE_MARKERS.some((m) => {
    const lowered = m.toLowerCase();
    if (title.includes(lowered)) return true;
    return bracketLabels.some((label) => label.includes(lowered));
  });
  if (!hasMarker) return false;
  return !hasStrongColumnSignal(item);
}

function extractColumnAuthor(title) {
  const t = normalizeWhitespace(title);
  if (!t) return "";

  const bracket = t.match(/\[([^\]]+?)의 [^\]]+\]/);
  if (bracket?.[1]) return normalizeWhitespace(bracket[1]);

  const plain = t.match(/^([가-힣A-Za-z·\s]{2,30})\s*(칼럼|시론|기고|논평)/);
  if (plain?.[1]) return normalizeWhitespace(plain[1]);

  const byRole = t.match(/[-–:]\s*([가-힣A-Za-z·\s]{2,30})\s*(시인|수필가|칼럼니스트|작가|교수|기자|평론가)/);
  if (byRole?.[1]) return normalizeWhitespace(byRole[1]);

  return "";
}

function detectArticleType(item) {
  const title = normalizeWhitespace(item?.title);
  const summary = normalizeWhitespace(item?.summary || item?.description);
  const body = normalizeWhitespace(item?.body || item?.reviewBody);
  const category = normalizeWhitespace(item?.category);
  const sourceUrl = normalizeWhitespace(item?.sourceUrl || item?.link);

  if (hasStrongColumnSignal({ title, summary, body, sourceUrl, category })) return "column";
  if (hasForceNewsSignal({ title, summary, body, sourceUrl, category })) return "news";

  const titleText = title.toLowerCase();
  const bodyText = body.toLowerCase();
  // 약한 마커는 강한 시그널이 없을 때 보조로만 사용
  if (COLUMN_TITLE_MARKERS.some((m) => titleText.includes(m.toLowerCase()))) {
    if (isNaverOpinionUrl(sourceUrl)) return "column";
  }

  const infoText = `${title} ${summary}`.toLowerCase();
  const hasInfoTitleMarker = INFO_TITLE_MARKERS.some((m) => infoText.includes(m.toLowerCase()));
  if (INFO_CATEGORY_HINTS.has(category) && hasInfoTitleMarker) return "info";
  if (INFO_CATEGORY_HINTS.has(category)) return "info";
  if (hasInfoTitleMarker) return "info";
  if (INFO_BODY_MARKERS.some((m) => bodyText.includes(m.toLowerCase()))) return "info";

  return "news";
}

function formatMonthDayKorean(dateValue) {
  const raw = normalizeWhitespace(dateValue);
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function resolveSourceLabel(item = {}) {
  const source = normalizeWhitespace(item?.source);
  if (source && source !== "unknown") return source;

  const sourceUrl = normalizeWhitespace(item?.sourceUrl || item?.link);
  const domain = extractDomain(sourceUrl);
  if (domain) return domain;

  return "원문 출처";
}

function buildInfoExcerpt(candidate = {}, rawSource = {}) {
  const rawCandidates = [
    rawSource?.reviewBody,
    rawSource?.body,
    rawSource?.description,
    candidate?.body,
    candidate?.summary,
  ];

  let excerpt = "";
  for (const value of rawCandidates) {
    const clean = cleanArticleText(value || "");
    if (clean.length >= 20) {
      excerpt = clean;
      break;
    }
  }

  if (!excerpt) {
    excerpt = normalizeWhitespace(rawSource?.title || candidate?.title);
  }

  excerpt = normalizeWhitespace(excerpt.replace(/https?:\/\/\S+/g, ""));
  excerpt = collapseRepeatedClauses(excerpt);
  if (excerpt.length > 260) excerpt = clipText(excerpt, 260, "…");
  return excerpt;
}

function stabilizeNewsRewrite(candidate = {}, rawSource = {}) {
  const title = normalizeWhitespace(candidate?.title || rawSource?.title);
  let body = cleanArticleText(candidate?.body);
  let summary = cleanArticleText(candidate?.summary);

  if (!body) return { ...candidate };

  // 심사평 계열은 6하원칙 핵심(누가/무엇을/어떻게)이 드러나도록 본문을 안정화
  if (title.includes("심사평")) {
    const sourceExcerpt = buildInfoExcerpt(candidate, rawSource);
    const winnerMatch = sourceExcerpt.match(/([가-힣A-Za-z·\s]{2,20})\s*시인의\s*시집\s*[‘'"]([^’'"]+)[’'"]/);

    const lines = [
      `${title} 기사에 따르면 심사위원단은 응모작을 검토해 수상작을 선정했다.`,
    ];
    if (winnerMatch?.[1] && winnerMatch?.[2]) {
      lines.push(`최종적으로 ${winnerMatch[1].trim()} 시인의 시집 '${winnerMatch[2].trim()}'이 수상작으로 언급됐다.`);
    }
    lines.push("심사평은 작품의 완성도와 주제 표현, 문학적 성취를 중심으로 평가 이유를 제시했다.");

    body = clipText(collapseRepeatedClauses(normalizeWhitespace(lines.join(" "))), MAX_BODY_CHARS);
    summary = clipText(`${title}에서 심사 주체와 선정 이유를 중심으로 결과를 정리했다.`, 120, "…");
  }

  return {
    ...candidate,
    body,
    summary,
  };
}

function buildColumnNotice(meta = {}) {
  const source = resolveSourceLabel(meta);
  const monthDay = formatMonthDayKorean(meta?.publishedAt || meta?.pubDate || meta?.crawledAt);
  const title = normalizeWhitespace(meta?.title || "제목 미상");
  if (monthDay) {
    return `이 기사는 '${source}' ${monthDay}에 실린 '${title}'라는 제목의 컬럼입니다.`;
  }
  return `이 기사는 '${source}'에 실린 '${title}'라는 제목의 컬럼입니다.`;
}

function isColumnNoticeText(text) {
  const value = normalizeWhitespace(text);
  if (!value) return false;
  return /라는 제목의 컬럼입니다\.?$/u.test(value)
    || /컬럼입니다\.?$/u.test(value);
}

function applyArticleTypePolicy(candidate, rawSource = {}) {
  const sourceForType = { ...rawSource, ...candidate };
  const explicitType = normalizeWhitespace(candidate?.articleType).toLowerCase();
  const detectedType = normalizeArticleType(detectArticleType(sourceForType));
  let articleType = detectedType;

  if (explicitType === "info") {
    articleType = "info";
  } else if (explicitType === "column") {
    if (hasForceNewsSignal(sourceForType)) {
      articleType = "news";
    } else if (hasStrongColumnSignal(sourceForType)) {
      articleType = "column";
    } else {
      articleType = detectedType;
    }
  }

  const out = {
    ...candidate,
    articleType,
  };

  if (articleType === "column") {
    const author = normalizeWhitespace(
      candidate?.columnAuthor
      || rawSource?.columnAuthor
      || extractColumnAuthor(rawSource?.title || candidate?.title)
    );
    const notice = buildColumnNotice({
      source: candidate?.source || rawSource?.source,
      sourceUrl: candidate?.sourceUrl || rawSource?.sourceUrl || rawSource?.link,
      publishedAt: candidate?.publishedAt || rawSource?.publishedAt,
      pubDate: candidate?.pubDate || rawSource?.pubDate,
      crawledAt: candidate?.crawledAt || rawSource?.crawledAt,
      title: candidate?.title || rawSource?.title,
    });
    out.summary = notice;
    out.body = notice;
    out.keywords = normalizeKeywords([...(candidate?.keywords || []), "칼럼"]);
    if (author) out.columnAuthor = author;
  } else if (articleType === "info") {
    const excerpt = buildInfoExcerpt(candidate, rawSource);
    if (excerpt) {
      out.summary = clipText(excerpt, 140, "…");
      out.body = excerpt;
    }
    out.keywords = normalizeKeywords([...(candidate?.keywords || []), "정보"]);
  } else {
    const stabilized = stabilizeNewsRewrite(out, rawSource);
    out.body = normalizeWhitespace(stabilized.body || out.body);
    out.summary = normalizeWhitespace(stabilized.summary || out.summary);
  }

  return out;
}

function passesHardRelevanceGate(item, category) {
  const text = buildRelevanceText(item);
  if (!text) return false;

  const categoryTerms = CATEGORY_INCLUDE_TERMS[category] || [];
  const hasGlobalPositive = containsAnyKeyword(text, GLOBAL_INCLUDE_TERMS);
  let hasCategoryPositive = containsAnyKeyword(text, categoryTerms);

  if (category === "한시") {
    const hasHanshiAmbiguous = containsKeyword(text, "한시") || containsKeyword(text, "당시");
    const hasHanshiContext = hasHanshiAmbiguous && containsAnyKeyword(text, HANSHI_CONTEXT_TERMS);
    const hasHanshiStrong = containsAnyKeyword(text, HANSHI_STRONG_TERMS);
    hasCategoryPositive = hasHanshiStrong || hasHanshiContext;
  }

  const hasPositive = hasGlobalPositive || hasCategoryPositive;
  if (!hasPositive) return false;

  const hasNegative = containsAnyKeyword(text, GLOBAL_EXCLUDE_TERMS);
  if (!hasNegative) return true;

  const overrideTerms = CATEGORY_NEGATIVE_OVERRIDE_TERMS[category]
    || categoryTerms.filter((t) => t.length >= 2);
  return containsAnyKeyword(text, overrideTerms);
}

async function buildAiReviewArticles(rawArticles) {
  const out = [];
  for (let i = 0; i < rawArticles.length; i += 5) {
    const batch = rawArticles.slice(i, i + 5);
    const bodies = await Promise.all(batch.map(async (a) => {
      if (a.source === "NaverWeb" && normalizeWhitespace(a.description).length >= 120) {
        return a.description;
      }
      const fetched = await fetchArticleBody(a.link);
      return fetched || a.description || "";
    }));

    for (let j = 0; j < batch.length; j += 1) {
      const a = batch[j];
      const reviewBody = clipText(stripHtml(bodies[j] || a.description || ""), AI_REVIEW_MAX_CHARS);
      out.push({ ...a, reviewBody });
    }

    if (i + 5 < rawArticles.length) await sleep(200);
  }

  return out;
}

function buildFilterRewritePrompt(category, reviewArticles) {
  return `당신은 한시(漢詩)·한자·전통문화 전문 에디터입니다.

아래 뉴스 기사 목록을 검토하여:
1. 한시, 한자, 고전 시문학, 전통문화, 서예와 **직접적으로 관련 있는** 기사만 선별
2. 관련 여부를 모든 기사에 대해 판단 (relevant: true/false)
3. relevant=true인 기사만 **사이트 톤에 맞게 재작성** (교양 있고 차분한 톤)
4. 재작성 본문은 6하원칙(누가/언제/어디서/무엇을/어떻게/왜) 중 최소 4개 요소가 드러나야 함
5. 첫 문장은 반드시 "누가 무엇을 했다" 형식으로 시작
6. 제목에 "심사평/심사/평가"가 있으면, 심사 주체·대상·기준(또는 논점)·결과를 반드시 포함
7. 본문은 300~500자(한국어), 요약은 50자 내외, 추측/과장 금지

카테고리: ${category}

기사 목록:
${reviewArticles.map((a, i) => `[${i + 1}] 제목: ${a.title}\n    요약: ${a.description}\n    검토본문: ${a.reviewBody || ""}\n    원문: ${a.link}\n    날짜: ${a.pubDate}`).join("\n\n")}

반드시 JSON 배열로만 응답하고, 입력 기사 수와 동일한 개수의 항목을 반환하세요:
[{
  "originalIndex": 1,
  "relevant": true,
  "reason": "선정/제외 이유 (80자 이내)",
  "category": "${category}",
  "articleType": "news|info|column",
  "title": "relevant=true일 때 재작성 제목",
  "summary": "relevant=true일 때 1줄 요약",
  "body": "relevant=true일 때 재작성 본문 (300~500자)",
  "keywords": ["키워드1", "키워드2"]
}]

관련 없는 기사도 relevant=false와 reason을 반드시 채우세요.
JSON 외 텍스트는 출력하지 마세요.`;
}

function buildJsonRepairPrompt(rawOutput) {
  const snippet = String(rawOutput || "").slice(0, AI_REPAIR_INPUT_MAX);
  return `아래 텍스트를 유효한 JSON 배열로만 정리해 주세요.

요구사항:
- 오직 JSON 배열만 출력
- Markdown, 설명 문장, 주석 금지
- trailing comma 금지
- 문자열 내부 따옴표는 JSON 규칙에 맞게 escape
- 항목 스키마:
  {"originalIndex":number,"relevant":boolean,"reason":string,"category":string,"articleType":"news|info|column","title":string,"summary":string,"body":string,"keywords":string[]}

원본 텍스트:
${snippet}`;
}

function sanitizeJsonCandidate(text) {
  return String(text || "")
    .replace(/\uFEFF/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseAiJsonArray(rawText) {
  const raw = String(rawText || "").trim();
  if (!raw) return null;

  const candidates = [];
  candidates.push(raw);
  const extracted = extractJsonArray(raw);
  if (extracted && extracted !== "[]" && extracted !== raw) candidates.push(extracted);

  for (const cand of candidates) {
    const parsed = tryParseJson(cand) || tryParseJson(sanitizeJsonCandidate(cand));
    if (!parsed) continue;
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.data)) return parsed.data;
  }
  return null;
}

function extractJsonObject(text) {
  const raw = String(text || "");
  if (!raw) return "{}";

  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || raw;
  const start = source.indexOf("{");
  if (start < 0) return "{}";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return "{}";
}

function parseAiJsonObject(rawText) {
  const raw = String(rawText || "").trim();
  if (!raw) return null;

  const candidates = [raw];
  const extracted = extractJsonObject(raw);
  if (extracted !== "{}" && extracted !== raw) candidates.push(extracted);

  for (const cand of candidates) {
    const parsed = tryParseJson(cand) || tryParseJson(sanitizeJsonCandidate(cand));
    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
      return parsed;
    }
  }
  return null;
}

async function callAiProvider(prompt) {
  RUN_STATS.ai.calls += 1;
  if (AI_PROVIDER === "anthropic") return callClaude(prompt);
  return callOpenAI(prompt);
}

async function callAiAndParseArray(prompt) {
  let currentPrompt = prompt;
  for (let attempt = 0; attempt <= AI_PARSE_RETRY_MAX; attempt += 1) {
    const rawText = await callAiProvider(currentPrompt);
    const parsed = parseAiJsonArray(rawText);
    if (Array.isArray(parsed)) return parsed;

    RUN_STATS.ai.parseFail += 1;
    if (attempt < AI_PARSE_RETRY_MAX) {
      RUN_STATS.ai.repairCalls += 1;
      currentPrompt = buildJsonRepairPrompt(rawText);
    }
  }
  return null;
}

function isNewsArticleType(articleType) {
  return normalizeArticleType(articleType) === "news";
}

function hasValidNewsBodyLength(body) {
  const len = normalizeWhitespace(body).length;
  return len >= MIN_BODY_CHARS && len <= MAX_BODY_CHARS;
}

function hasLongSharedFragment(textA, textB, minLen = 45) {
  const a = cleanArticleText(textA);
  const b = cleanArticleText(textB);
  if (!a || !b || a.length < minLen || b.length < minLen) return false;

  const step = Math.max(6, Math.floor(minLen / 6));
  for (let i = 0; i <= a.length - minLen; i += step) {
    const chunk = a.slice(i, i + minLen);
    if (b.includes(chunk)) return true;
  }
  return false;
}

function buildBodyQualityRetryPrompt(candidate, rawSource = {}, category = "") {
  const sourceTitle = normalizeWhitespace(rawSource?.title || candidate?.title);
  const sourceBody = clipText(
    cleanArticleText(rawSource?.reviewBody || rawSource?.body || rawSource?.description || candidate?.body),
    2800
  );

  return `당신은 한국어 뉴스 에디터입니다.
아래 원문 정보를 바탕으로 기사 본문을 다시 작성하세요.

요구사항:
1. JSON 객체 하나만 출력
2. title, summary, body 필드 포함
3. body는 300~500자
4. 첫 문장은 "누가 무엇을 했다" 형태
5. 원문 문장을 40자 이상 연속 복사 금지
6. 사실 기반으로만 작성 (추측/과장 금지)

카테고리: ${category || candidate?.category || "기타"}
원문 제목: ${sourceTitle}
원문 본문(발췌): ${sourceBody}
원문 링크: ${normalizeWhitespace(rawSource?.link || candidate?.sourceUrl)}
발행일: ${parseDate(rawSource?.pubDate || candidate?.publishedAt)}

현재 결과(보정 대상):
title: ${normalizeWhitespace(candidate?.title)}
summary: ${normalizeWhitespace(candidate?.summary)}
body: ${normalizeWhitespace(candidate?.body)}

출력 예시:
{"title":"...","summary":"...","body":"..."}`;
}

async function enforceNewsRewriteQuality(candidate, rawSource = {}, category = "") {
  if (!isNewsArticleType(candidate?.articleType)) return candidate;
  if (!AI_API_KEY) return candidate;

  const sourceExcerpt = cleanArticleText(rawSource?.reviewBody || rawSource?.body || rawSource?.description || "");
  const currentBody = cleanArticleText(candidate?.body);
  const needsLengthRetry = !hasValidNewsBodyLength(currentBody);
  const needsCopyRetry = hasLongSharedFragment(currentBody, sourceExcerpt, 45);

  if (!needsLengthRetry && !needsCopyRetry) return candidate;

  if (needsLengthRetry) RUN_STATS.ai.lengthRetry += 1;
  if (needsCopyRetry) RUN_STATS.ai.copyRetry += 1;

  try {
    const prompt = buildBodyQualityRetryPrompt(candidate, rawSource, category);
    const rawText = await callAiProvider(prompt);
    const parsed = parseAiJsonObject(rawText);
    if (!parsed) {
      if (needsLengthRetry) RUN_STATS.ai.lengthRetryFailed += 1;
      return null;
    }

    const retried = applyArticleTypePolicy({
      ...candidate,
      title: normalizeWhitespace(parsed?.title) || candidate.title,
      summary: normalizeWhitespace(parsed?.summary) || candidate.summary,
      body: normalizeWhitespace(parsed?.body) || candidate.body,
    }, rawSource);

    const retriedBody = cleanArticleText(retried?.body);
    const lengthOk = hasValidNewsBodyLength(retriedBody);
    const copyOk = !hasLongSharedFragment(retriedBody, sourceExcerpt, 45);

    if (lengthOk && copyOk) {
      if (needsLengthRetry) RUN_STATS.ai.lengthRetrySuccess += 1;
      return retried;
    }

    if (needsLengthRetry) RUN_STATS.ai.lengthRetryFailed += 1;
    return null;
  } catch {
    if (needsLengthRetry) RUN_STATS.ai.lengthRetryFailed += 1;
    return null;
  }
}

function buildDeterministicFallbackArticles(inputArticles, category) {
  const source = Array.isArray(inputArticles) ? inputArticles : [];
  const results = [];

  for (const a of source) {
    const baseBody = cleanArticleText(a?.reviewBody || a?.description || a?.title);
    if (!baseBody) continue;

    const candidate = {
      title: normalizeWhitespace(a?.title),
      summary: clipText(baseBody, 150, "…"),
      body: baseBody,
      source: extractDomain(a?.link || a?.sourceUrl || ""),
      sourceUrl: normalizeWhitespace(a?.link || a?.sourceUrl),
      publishedAt: parseDate(a?.pubDate || a?.publishedAt),
      category,
      keywords: [],
      imageUrl: a?.imageUrl || "",
    };

    if (!candidate.title || !candidate.sourceUrl) continue;
    if (!passesHardRelevanceGate(candidate, category)) continue;
    results.push(applyArticleTypePolicy(candidate, a));
  }

  return results;
}

// ─── AI 필터링 + 재작성 ────────────────────
async function aiFilterAndRewrite(rawArticles, category) {
  if (!Array.isArray(rawArticles) || rawArticles.length === 0) return [];

  if (!AI_API_KEY) {
    console.log("  [AI] API 키 미설정 — 요약 추출 모드");
    RUN_STATS.ai.fallbackUsed += 1;

    const results = [];
    // NaverWeb 소스는 이미 og:description을 가지고 있음
    // Google/Naver API 소스만 추가 fetching 필요
    const needsFetch = rawArticles.filter(a => a.source !== "NaverWeb" && a.description.length < 30);
    const hasSummary = rawArticles.filter(a => a.source === "NaverWeb" || a.description.length >= 30);

    console.log(`    (설명 있음: ${hasSummary.length}건, 추가 fetch 필요: ${needsFetch.length}건)`);

    // 이미 설명이 있는 기사 처리
    for (const a of hasSummary) {
      const body = a.description.length >= 30 ? a.description : a.title;
      const summary = body.length > 60 ? body.slice(0, 150) + "…" : body;
      const candidate = {
        title: a.title,
        summary,
        body,
        source: a.source === "NaverWeb" ? extractDomain(a.link) : extractDomain(a.link),
        sourceUrl: a.link,
        publishedAt: parseDate(a.pubDate),
        category,
        keywords: [],
        imageUrl: a.imageUrl || "",
      };
      if (!passesHardRelevanceGate(candidate, category)) {
        RUN_STATS.relevance.noKeyDropped += 1;
        continue;
      }
      results.push(applyArticleTypePolicy(candidate, a));
    }

    // 설명이 없는 기사 → og:description fetch (Google News 등)
    for (let i = 0; i < needsFetch.length; i += 5) {
      const batch = needsFetch.slice(i, i + 5);
      const descriptions = await Promise.all(
        batch.map(a => fetchArticleBody(a.link))
      );
      for (let j = 0; j < batch.length; j++) {
        const a = batch[j];
        const ogDesc = descriptions[j];
        const cleanDesc = a.description.replace(/https?:\/\/\S+/g, "").trim();

        let body = "";
        if (ogDesc.length > 30) {
          body = ogDesc;
        } else if (cleanDesc.length > 20) {
          body = cleanDesc;
        } else {
          body = a.title;
        }

        const summary = body.length > 60 ? body.slice(0, 150) + "…" : body;

        const candidate = {
          title: a.title,
          summary,
          body,
          source: extractDomain(a.link),
          sourceUrl: a.link,
          publishedAt: parseDate(a.pubDate),
          category,
          keywords: [],
          imageUrl: a.imageUrl || "",
        };
        if (!passesHardRelevanceGate(candidate, category)) {
          RUN_STATS.relevance.noKeyDropped += 1;
          continue;
        }
        results.push(applyArticleTypePolicy(candidate, a));
      }
      // 배치 간 딜레이 (서버 부담 방지)
      if (i + 5 < rawArticles.length) await sleep(300);
    }

    RUN_STATS.ai.filteredIn += results.length;
    RUN_STATS.ai.filteredOut += Math.max(rawArticles.length - results.length, 0);
    return results;
  }

  const reviewArticles = await buildAiReviewArticles(rawArticles);
  const prompt = buildFilterRewritePrompt(category, reviewArticles);

  try {
    const parsed = await callAiAndParseArray(prompt);
    if (!Array.isArray(parsed)) throw new Error("AI JSON parse failed");

    const rewritten = [];
    const seenIndexes = new Set();

    for (const item of parsed) {
      const originalIndex = Number(item?.originalIndex);
      if (!Number.isInteger(originalIndex) || originalIndex < 1 || originalIndex > rawArticles.length) {
        RUN_STATS.ai.parseFail += 1;
        continue;
      }

      const idx = originalIndex - 1;
      if (seenIndexes.has(idx)) continue;
      seenIndexes.add(idx);

      const orig = reviewArticles[idx];
      const relevant = toBoolean(item?.relevant);
      const reason = normalizeWhitespace(item?.reason);

      if (!reason) RUN_STATS.ai.parseFail += 1;

      if (!relevant) {
        RUN_STATS.ai.filteredOut += 1;
        continue;
      }

      const candidate = {
        title: normalizeWhitespace(item?.title) || orig.title,
        summary: normalizeWhitespace(item?.summary) || normalizeWhitespace(orig.description),
        body: normalizeWhitespace(item?.body) || normalizeWhitespace(orig.reviewBody || orig.description) || orig.title,
        source: extractDomain(orig?.link || ""),
        sourceUrl: orig?.link || "",
        publishedAt: parseDate(orig?.pubDate),
        category: normalizeWhitespace(item?.category) || category,
        articleType: normalizeWhitespace(item?.articleType),
        aiWritten: true,
        keywords: normalizeKeywords(item?.keywords),
        imageUrl: orig?.imageUrl || "",
      };
      if (!passesHardRelevanceGate(candidate, category)) {
        RUN_STATS.relevance.postDropped += 1;
        RUN_STATS.ai.filteredOut += 1;
        continue;
      }
      const policyApplied = applyArticleTypePolicy(candidate, orig);
      const qualityChecked = await enforceNewsRewriteQuality(policyApplied, orig, category);
      if (!qualityChecked) {
        RUN_STATS.ai.filteredOut += 1;
        continue;
      }
      rewritten.push(qualityChecked);

      RUN_STATS.ai.filteredIn += 1;
      RUN_STATS.ai.rewritten += 1;
    }

    if (seenIndexes.size < rawArticles.length) {
      RUN_STATS.ai.filteredOut += rawArticles.length - seenIndexes.size;
    }

    return rewritten;
  } catch (e) {
    console.warn("  [AI] 재작성 실패:", e.message);
    RUN_STATS.ai.parseFail += 1;
    RUN_STATS.ai.fallbackUsed += 1;
    RUN_STATS.relevance.aiParseDropped += rawArticles.length;
    const fallback = buildDeterministicFallbackArticles(reviewArticles, category);
    RUN_STATS.ai.filteredIn += fallback.length;
    RUN_STATS.ai.filteredOut += Math.max(rawArticles.length - fallback.length, 0);
    return fallback;
  }
}

async function callOpenAI(prompt) {
  const res = await postJson("https://api.openai.com/v1/chat/completions", {
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 2000,
  }, {
    Authorization: `Bearer ${AI_API_KEY}`,
  });

  if (res.status !== 200) throw new Error(`OpenAI HTTP ${res.status}`);
  return res.body.choices?.[0]?.message?.content || "";
}

async function callClaude(prompt) {
  const res = await postJson("https://api.anthropic.com/v1/messages", {
    model: AI_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  }, {
    "x-api-key": AI_API_KEY,
    "anthropic-version": "2023-06-01",
  });

  if (res.status !== 200) throw new Error(`Claude HTTP ${res.status}`);
  return res.body.content?.[0]?.text || "";
}

// ─── 유틸 함수 ──────────────────────────────
function toBoolean(value) {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function extractJsonArray(text) {
  const raw = String(text || "");
  if (!raw) return "[]";

  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || raw;
  const start = source.indexOf("[");
  if (start < 0) return "[]";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  return "[]";
}

function normalizeWhitespace(str) {
  return String(str || "").replace(/\s+/g, " ").trim();
}

function collapseRepeatedClauses(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return "";

  const clauses = normalized.split(/(?<=[.!?])\s+/u).map((c) => normalizeWhitespace(c)).filter(Boolean);
  const out = [];
  const seenLong = new Set();

  for (const clause of clauses) {
    const key = clause.toLowerCase();
    if (out.length > 0 && out[out.length - 1].toLowerCase() === key) continue;
    if (clause.length >= 35 && seenLong.has(key)) continue;
    if (clause.length >= 35) seenLong.add(key);
    out.push(clause);
  }

  return out.join(" ");
}

function cleanArticleText(str) {
  return normalizeWhitespace(
    stripHtml(String(str || ""))
      .replace(/[▪■□◆◇▶▣]/g, " ")
      .replace(/\s+/g, " ")
  );
}

function clipText(str, max, suffix = "") {
  const s = normalizeWhitespace(str);
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max).trim() + suffix;
}

function normalizeIsoDatetime(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function normalizeUrlForCompare(url) {
  try {
    const u = new URL(url);
    // 추적성 쿼리는 제거해 중복 판단 정확도 확보
    const keep = new URL(u.origin + u.pathname);
    return keep.toString().replace(/\/$/, "");
  } catch {
    return normalizeWhitespace(url);
  }
}

function normalizeKeywords(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const kw = normalizeWhitespace(raw);
    if (!kw) continue;
    const k = kw.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(kw);
  }
  return out;
}

function normalizeForSimilarity(text) {
  return normalizeWhitespace(
    stripHtml(String(text || ""))
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
  );
}

function tokenizeSimilarity(text) {
  const base = normalizeForSimilarity(text);
  if (!base) return [];
  return base.split(" ").filter((t) => t.length >= 2);
}

function setJaccard(aSet, bSet) {
  if (!aSet.size || !bSet.size) return 0;
  let intersection = 0;
  const [small, large] = aSet.size <= bSet.size ? [aSet, bSet] : [bSet, aSet];
  for (const v of small) if (large.has(v)) intersection += 1;
  const union = aSet.size + bSet.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function setContainment(aSet, bSet) {
  if (!aSet.size || !bSet.size) return 0;
  let intersection = 0;
  const [small, large] = aSet.size <= bSet.size ? [aSet, bSet] : [bSet, aSet];
  for (const v of small) if (large.has(v)) intersection += 1;
  return intersection / small.size;
}

function informativeTokenSet(text) {
  const tokens = tokenizeSimilarity(text);
  const out = new Set();
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (SIMILARITY_STOPWORDS.has(t)) continue;
    out.add(t);
  }
  return out;
}

function charNgrams(text, n = 3) {
  const src = normalizeForSimilarity(text).replace(/\s+/g, "");
  if (!src) return new Set();
  if (src.length < n) return new Set([src]);
  const out = new Set();
  for (let i = 0; i <= src.length - n; i += 1) {
    out.add(src.slice(i, i + n));
  }
  return out;
}

function isSameOrNearDate(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.abs(a.getTime() - b.getTime()) <= dayMs;
}

function articleQualityScore(item) {
  const bodyLen = normalizeWhitespace(item.body).length;
  const summaryLen = normalizeWhitespace(item.summary).length;
  const hasImage = item.imageUrl ? 1 : 0;
  return bodyLen + Math.round(summaryLen * 0.2) + hasImage * 40;
}

function areNearDuplicateArticles(a, b) {
  if (!isSameOrNearDate(a.publishedAt, b.publishedAt)) return false;

  // 카테고리가 아예 다르면 오탐 가능성이 높아 기본적으로 제외
  if (normalizeWhitespace(a.category) !== normalizeWhitespace(b.category)) return false;

  const typeA = normalizeArticleType(a.articleType);
  const typeB = normalizeArticleType(b.articleType);
  if (typeA === "column" || typeB === "column") {
    const titleSetA = new Set(tokenizeSimilarity(a.title));
    const titleSetB = new Set(tokenizeSimilarity(b.title));
    return setJaccard(titleSetA, titleSetB) >= 0.86;
  }

  const bodyA = normalizeWhitespace(a.body || a.summary);
  const bodyB = normalizeWhitespace(b.body || b.summary);
  if (!bodyA || !bodyB) return false;

  const bodyTriA = charNgrams(bodyA, 3);
  const bodyTriB = charNgrams(bodyB, 3);
  const bodySim = setJaccard(bodyTriA, bodyTriB);

  const bodyTokA = new Set(tokenizeSimilarity(bodyA));
  const bodyTokB = new Set(tokenizeSimilarity(bodyB));
  const bodyContain = setContainment(bodyTokA, bodyTokB);

  const titleSetA = new Set(tokenizeSimilarity(a.title));
  const titleSetB = new Set(tokenizeSimilarity(b.title));
  const titleSim = setJaccard(titleSetA, titleSetB);

  const infoA = informativeTokenSet(bodyA);
  const infoB = informativeTokenSet(bodyB);
  let infoOverlap = 0;
  const [smallInfo, largeInfo] = infoA.size <= infoB.size ? [infoA, infoB] : [infoB, infoA];
  for (const t of smallInfo) if (largeInfo.has(t)) infoOverlap += 1;

  // 본문이 거의 동일하면 제목이 달라도 중복으로 판단
  if (bodySim >= 0.9) return true;
  // 본문 유사 + 제목 일부 유사
  if (bodySim >= 0.78 && titleSim >= 0.18) return true;
  // 사건/행사 기사: 본문 핵심어 겹침이 크면 중복으로 판단
  if (bodyContain >= 0.4 && infoOverlap >= 8) return true;
  return false;
}

function dedupeNearDuplicateArticles(items) {
  const kept = [];

  for (const item of items) {
    let merged = false;

    for (let i = 0; i < kept.length; i += 1) {
      const cand = kept[i];
      if (!areNearDuplicateArticles(item, cand)) continue;

      RUN_STATS.normalize.droppedNearDuplicate += 1;
      merged = true;

      if (articleQualityScore(item) > articleQualityScore(cand)) {
        kept[i] = item;
      }
      break;
    }

    if (!merged) kept.push(item);
  }

  return kept;
}

function daysDiff(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return Number.POSITIVE_INFINITY;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.abs(a.getTime() - b.getTime()) / dayMs;
}

function containsEventKeyword(item, keyword, titleOnly = false) {
  const text = titleOnly
    ? normalizeWhitespace(`${item?.title || ""}`).toLowerCase()
    : normalizeWhitespace(
      `${item?.title || ""} ${item?.summary || ""} ${(Array.isArray(item?.keywords) ? item.keywords.join(" ") : "")}`
    ).toLowerCase();
  return text.includes(String(keyword || "").toLowerCase());
}

function extractEventLocationLabel(item) {
  const title = normalizeWhitespace(item?.title);
  if (!title) return "";

  const schoolMatch = title.match(/([가-힣A-Za-z0-9·ㆍ\-]+향교)/);
  if (schoolMatch?.[1]) return schoolMatch[1];

  const regionMatch = title.match(/([가-힣A-Za-z0-9·ㆍ\-]+(?:시|군|구))/);
  if (regionMatch?.[1]) return regionMatch[1];

  return clipText(title, 16, "…");
}

function buildEventAggregateId(rule, newestDate, clusterSize, clusterIndex) {
  const ymd = String(newestDate || "").replace(/-/g, "") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `news-agg-${rule.id}-${ymd}-${clusterSize}-${clusterIndex}`;
}

function buildAggregatedEventArticle(rule, clusterItems, nowIso, clusterIndex) {
  const sorted = [...clusterItems].sort(compareArticlesByPublishedThenCrawledDesc);
  const newest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  const locationList = [];
  for (const item of sorted) {
    const label = extractEventLocationLabel(item);
    if (!label) continue;
    if (!locationList.includes(label)) locationList.push(label);
  }

  const perArticleMentions = sorted
    .slice(0, 6)
    .map((item) => {
      const day = formatMonthDayKorean(item.publishedAt);
      const loc = extractEventLocationLabel(item);
      if (day && loc) return `${day} ${loc}`;
      if (day) return day;
      return loc;
    })
    .filter(Boolean);

  const rangeText = (() => {
    const start = formatMonthDayKorean(oldest?.publishedAt);
    const end = formatMonthDayKorean(newest?.publishedAt);
    if (start && end) {
      if (start === end) return `${end}`;
      return `${start}~${end}`;
    }
    return "";
  })();

  const locationsText = locationList.length
    ? `${locationList.slice(0, 5).join(", ")}${locationList.length > 5 ? " 등" : ""}`
    : "여러 지역 향교";

  const lead = "전국 각지 향교에서 유교 전통 의례인 석전대제가 잇따라 봉행됐다.";
  const bodyParts = [
    lead,
    `${rangeText ? `${rangeText} 사이 ` : ""}확인된 관련 보도 ${sorted.length}건을 종합하면 ${locationsText}에서 행사가 열렸다.`,
  ];

  if (perArticleMentions.length > 0) {
    bodyParts.push(`보도 기준 주요 일정은 ${perArticleMentions.join(", ")} 등이다.`);
  }

  bodyParts.push("석전대제는 공자를 비롯한 유학 성현에게 예를 올리는 의례로, 향교의 대표 연례행사로 이어지고 있다.");

  const body = clipText(bodyParts.join(" "), MAX_BODY_CHARS);
  const summary = clipText(`${rule.summary} 관련 보도 ${sorted.length}건을 종합했다.`, SUMMARY_MAX_CHARS, "…");

  return {
    id: buildEventAggregateId(rule, newest?.publishedAt, sorted.length, clusterIndex),
    category: rule.category,
    articleType: "news",
    title: rule.title,
    summary,
    body,
    source: "한시나루 종합",
    sourceUrl: normalizeWhitespace(newest?.sourceUrl || ""),
    publishedAt: parseDate(newest?.publishedAt),
    crawledAt: normalizeIsoDatetime(nowIso),
    keywords: normalizeKeywords([
      ...(newest?.keywords || []),
      rule.keyword,
      "향교",
      "전통행사",
      "종합",
    ]),
  };
}

function aggregateRecurringEventArticles(items, nowIso = new Date().toISOString()) {
  if (!Array.isArray(items) || items.length === 0) return items;

  let working = [...items];

  for (const rule of EVENT_AGGREGATION_RULES) {
    const stalePrefix = `news-agg-${rule.id}-`;
    const staleAggregates = working.filter((item) => String(item?.id || "").startsWith(stalePrefix));
    const baseItems = working.filter((item) => !String(item?.id || "").startsWith(stalePrefix));

    const candidates = baseItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (normalizeArticleType(item?.articleType) !== "news") return false;
        if (normalizeWhitespace(item?.category) !== rule.category) return false;
        return containsEventKeyword(item, rule.keyword, Boolean(rule.matchInTitleOnly));
      })
      .sort((a, b) => compareArticlesByPublishedThenCrawledDesc(a.item, b.item));

    if (candidates.length < EVENT_AGGREGATION_MIN_ITEMS) {
      working = [...baseItems, ...staleAggregates];
      continue;
    }

    const consumed = new Set();
    const removeIndexes = new Set();
    const aggregates = [];
    let clusterIndex = 0;

    for (let i = 0; i < candidates.length; i += 1) {
      if (consumed.has(i)) continue;

      const anchor = candidates[i];
      const cluster = [anchor];
      consumed.add(i);

      for (let j = i + 1; j < candidates.length; j += 1) {
        if (consumed.has(j)) continue;
        const curr = candidates[j];
        if (daysDiff(anchor.item.publishedAt, curr.item.publishedAt) > EVENT_AGGREGATION_WINDOW_DAYS) continue;
        cluster.push(curr);
        consumed.add(j);
      }

      if (cluster.length < EVENT_AGGREGATION_MIN_ITEMS) continue;

      clusterIndex += 1;
      for (const c of cluster) removeIndexes.add(c.index);
      const aggregate = buildAggregatedEventArticle(
        rule,
        cluster.map((c) => c.item),
        nowIso,
        clusterIndex
      );
      if (aggregate?.sourceUrl) {
        aggregates.push(aggregate);
      }
      RUN_STATS.aggregation.groups += 1;
      RUN_STATS.aggregation.mergedArticles += cluster.length;
    }

    if (aggregates.length > 0) {
      working = baseItems
        .filter((_, idx) => !removeIndexes.has(idx))
        .concat(aggregates);
    } else {
      working = [...baseItems, ...staleAggregates];
    }
  }

  working.sort(compareArticlesByPublishedThenCrawledDesc);
  return working;
}

function buildBodyText(body, summary, articleType = "news", options = {}) {
  let b = cleanArticleText(body);
  const s = cleanArticleText(summary);
  const allowLongBody = options?.allowLongBody === true;

  if (articleType === "column") {
    if (!b && s) b = s;
    if (!allowLongBody && b.length > 180) b = clipText(b, 180, "…");
    if (b.length < 20) return "";
    return b;
  }

  if (articleType === "info") {
    if (!b && s) b = s;
    if (!allowLongBody && b.length > 260) b = clipText(b, 260, "…");
    if (b.length < 20) return "";
    return b;
  }

  if (!b && s) b = s;

  if (!allowLongBody && b.length > MAX_BODY_CHARS) {
    b = clipText(b, MAX_BODY_CHARS);
  }

  // 300자 미만이면 summary가 더 길 경우 summary로 보강
  if (b.length < MIN_BODY_CHARS && s.length > b.length) {
    b = allowLongBody ? s : clipText(s, MAX_BODY_CHARS);
  }

  // 예외: 원문 자체가 매우 짧은 경우는 폐기하지 않고 최소 길이만 통과
  if (b.length < MIN_BODY_FALLBACK_CHARS) return "";
  return b;
}

function buildSummaryText(summary, body, articleType = "news") {
  let s = cleanArticleText(summary);
  const b = cleanArticleText(body);

  if (articleType === "column") {
    if (!s && b) s = clipText(b, 100, "…");
    return clipText(s, 140, "…");
  }

  if (articleType === "info") {
    if (!s && b) s = clipText(b, 110, "…");
    return clipText(s, 140, "…");
  }

  if (!s && b) s = clipText(b, 120, "…");
  return clipText(s, SUMMARY_MAX_CHARS, "…");
}

function normalizeArticleRecord(raw, defaultCategory = "", nowIso = new Date().toISOString()) {
  const title = normalizeWhitespace(raw.title);
  const sourceUrl = normalizeWhitespace(raw.sourceUrl || raw.link);
  if (!title || !sourceUrl) return null;

  const category = normalizeWhitespace(raw.category || defaultCategory || "기타");
  const baseCandidate = applyArticleTypePolicy({
    title,
    summary: raw.summary || raw.description,
    body: raw.body || raw.description,
    category,
    sourceUrl,
    articleType: normalizeWhitespace(raw.articleType),
    aiWritten: raw.aiWritten === true,
    columnAuthor: normalizeWhitespace(raw.columnAuthor),
    keywords: normalizeKeywords(raw.keywords),
  }, raw);

  const articleType = normalizeArticleType(baseCandidate.articleType || detectArticleType({ ...raw, title, sourceUrl }));
  const aiWrittenInput = baseCandidate.aiWritten === true || raw.aiWritten === true;
  let body = buildBodyText(
    baseCandidate.body || raw.body || raw.description,
    baseCandidate.summary || raw.summary || raw.description,
    articleType,
    { allowLongBody: aiWrittenInput }
  );
  if (!body) return null;

  let summary = buildSummaryText(baseCandidate.summary || raw.summary || raw.description, body, articleType);
  if (articleType === "news" && title.includes("심사평")) {
    const detail = buildInfoExcerpt({
      body: baseCandidate.body || raw.body,
      summary: baseCandidate.summary || raw.summary,
      title,
    }, raw);
    const winnerMatch = detail.match(/([가-힣A-Za-z·\s]{2,20})\s*시인의\s*시집\s*[‘'"]([^’'"]+)[’'"]/);
    const lines = [
      `${title} 기사에 따르면 심사위원단은 응모작을 검토해 수상작을 선정했다.`,
    ];
    if (winnerMatch?.[1] && winnerMatch?.[2]) {
      lines.push(`최종적으로 ${winnerMatch[1].trim()} 시인의 시집 '${winnerMatch[2].trim()}'이 수상작으로 언급됐다.`);
    }
    lines.push("심사평은 작품의 완성도와 주제 표현, 문학적 성취를 중심으로 평가 이유를 제시했다.");

    body = clipText(collapseRepeatedClauses(lines.join(" ")), MAX_BODY_CHARS);
    summary = clipText(`${title}에서 심사 주체와 선정 이유를 중심으로 결과를 정리했다.`, 120, "…");
  }

  // 과거 데이터가 재분류되면서 "뉴스 타입 + 컬럼 안내문 본문"이 남는 경우를 정리한다.
  if (articleType !== "column" && (isColumnNoticeText(body) || isColumnNoticeText(summary))) {
    const recovered = cleanArticleText(raw.reviewBody || raw.description);
    if (recovered.length >= MIN_BODY_FALLBACK_CHARS) {
      const rebuiltBody = buildBodyText(recovered, recovered, articleType, {
        allowLongBody: aiWrittenInput,
      });
      if (!rebuiltBody) return null;
      body = rebuiltBody;
      summary = buildSummaryText(raw.summary || recovered, body, articleType);
    } else {
      // 복구 가능한 원문 요약이 없으면 품질 문제 기사로 폐기한다.
      return null;
    }
  }

  const source = normalizeWhitespace(raw.source || extractDomain(sourceUrl) || "unknown");
  const publishedAt = parseDate(raw.publishedAt || raw.pubDate);
  const crawledAt = normalizeIsoDatetime(raw.crawledAt || nowIso);
  const keywords = normalizeKeywords(baseCandidate.keywords || raw.keywords);
  const imageUrl = normalizeWhitespace(raw.imageUrl);
  const id = normalizeWhitespace(raw.id || generateId(publishedAt));
  const columnAuthor = normalizeWhitespace(baseCandidate.columnAuthor || raw.columnAuthor);
  const aiWritten = aiWrittenInput;

  const normalized = {
    id,
    category,
    articleType,
    title,
    body,
    source,
    sourceUrl,
    publishedAt,
    crawledAt,
    keywords,
  };

  if (summary) normalized.summary = summary;
  if (imageUrl) normalized.imageUrl = imageUrl;
  if (aiWritten) normalized.aiWritten = true;
  if (articleType === "column" && columnAuthor) normalized.columnAuthor = columnAuthor;

  return normalized;
}

function normalizeDataset(data) {
  const nowIso = new Date().toISOString();
  const list = Array.isArray(data?.articles) ? data.articles : [];

  const normalized = [];
  const seenUrl = new Set();
  const seenTitleDate = new Set();

  for (const raw of list) {
    const item = normalizeArticleRecord(raw, raw?.category || "", nowIso);
    if (!item) {
      RUN_STATS.normalize.droppedInvalid += 1;
      continue;
    }

    if (!passesHardRelevanceGate({
      title: item.title,
      summary: item.summary,
      body: item.body,
    }, item.category)) {
      RUN_STATS.relevance.postDropped += 1;
      continue;
    }

    const urlKey = normalizeUrlForCompare(item.sourceUrl);
    const titleDateKey = `${item.title.toLowerCase()}|${item.publishedAt}`;

    if (seenUrl.has(urlKey) || seenTitleDate.has(titleDateKey)) {
      RUN_STATS.normalize.droppedDuplicate += 1;
      continue;
    }
    seenUrl.add(urlKey);
    seenTitleDate.add(titleDateKey);
    normalized.push(item);
  }

  normalized.sort(compareArticlesByPublishedThenCrawledDesc);

  // 유사행사 종합 기사를 먼저 만든 뒤, 나머지 전체에 대해 유사중복 정리를 수행한다.
  const aggregated = aggregateRecurringEventArticles(normalized, nowIso);
  const nearDeduped = dedupeNearDuplicateArticles(aggregated);
  nearDeduped.sort(compareArticlesByPublishedThenCrawledDesc);

  return {
    version: NEWS_SCHEMA_VERSION,
    lastUpdated: nowIso,
    articles: nearDeduped.slice(0, MAX_ARTICLES),
  };
}

function stripHtml(str) {
  return (str || "")
    // 1) HTML 엔티티 먼저 디코딩 (&lt;a&gt; → <a>)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => {
      const code = Number(d);
      return Number.isFinite(code) ? String.fromCharCode(code) : " ";
    })
    // 2) 태그 제거
    .replace(/<[^>]+>/g, " ")
    // 3) 2중 인코딩 대비 한번 더
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    // 4) 정리
    .replace(/\]\]>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`);
  const m = xml.match(regex);
  return m ? m[1].trim() : "";
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

function toMillis(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function compareArticlesByPublishedThenCrawledDesc(a, b) {
  const byPublished = toMillis(b?.publishedAt) - toMillis(a?.publishedAt);
  if (byPublished !== 0) return byPublished;
  return toMillis(b?.crawledAt) - toMillis(a?.crawledAt);
}

function saveJsonAtomically(filePath, payload) {
  const tmpPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;
  const serialized = JSON.stringify(payload, null, 2) + "\n";
  const existed = fs.existsSync(filePath);

  try {
    if (existed) {
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(tmpPath, serialized, "utf8");
    JSON.parse(fs.readFileSync(tmpPath, "utf8"));
    fs.renameSync(tmpPath, filePath);

    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // no-op
      }
    }

    if (existed && fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, filePath);
      } catch {
        // no-op
      }
      try {
        fs.unlinkSync(backupPath);
      } catch {
        // no-op
      }
    }

    throw error;
  }
}

function generateId(date) {
  const d = date.replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `news-${d}-${rand}`;
}

function buildTitleDateKey(item = {}) {
  const title = normalizeWhitespace(item?.title).toLowerCase();
  const date = parseDate(item?.publishedAt);
  return `${title}|${date}`;
}

function applyAiRewriteToExisting(newArticles, existingArticles) {
  const existing = Array.isArray(existingArticles) ? existingArticles.map((a) => ({ ...a })) : [];
  if (!existing.length || !Array.isArray(newArticles) || newArticles.length === 0) return existing;

  const byUrl = new Map();
  const byTitleDate = new Map();

  for (let i = 0; i < existing.length; i += 1) {
    const item = existing[i];
    const urlKey = normalizeUrlForCompare(item?.sourceUrl);
    if (urlKey && !byUrl.has(urlKey)) byUrl.set(urlKey, i);

    const titleDateKey = buildTitleDateKey(item);
    if (!byTitleDate.has(titleDateKey)) byTitleDate.set(titleDateKey, i);
  }

  for (const candidate of newArticles) {
    if (candidate?.aiWritten !== true) continue;

    const urlKey = normalizeUrlForCompare(candidate?.sourceUrl);
    const titleDateKey = buildTitleDateKey(candidate);
    const idx = (urlKey && byUrl.has(urlKey))
      ? byUrl.get(urlKey)
      : byTitleDate.get(titleDateKey);

    if (idx == null) continue;

    const base = existing[idx];
    const merged = {
      ...base,
      category: normalizeWhitespace(candidate?.category || base?.category || "기타"),
      articleType: normalizeArticleType(candidate?.articleType || base?.articleType),
      title: normalizeWhitespace(candidate?.title || base?.title),
      summary: normalizeWhitespace(candidate?.summary || base?.summary),
      body: normalizeWhitespace(candidate?.body || base?.body),
      source: normalizeWhitespace(candidate?.source || base?.source),
      sourceUrl: normalizeWhitespace(candidate?.sourceUrl || base?.sourceUrl),
      publishedAt: parseDate(candidate?.publishedAt || base?.publishedAt),
      crawledAt: normalizeIsoDatetime(candidate?.crawledAt || new Date().toISOString()),
      keywords: normalizeKeywords([...(candidate?.keywords || []), ...(base?.keywords || [])]),
      aiWritten: true,
    };

    const imageUrl = normalizeWhitespace(candidate?.imageUrl || base?.imageUrl);
    if (imageUrl) merged.imageUrl = imageUrl;

    const columnAuthor = normalizeWhitespace(candidate?.columnAuthor || base?.columnAuthor);
    if (columnAuthor) merged.columnAuthor = columnAuthor;

    const normalized = normalizeArticleRecord(merged, merged.category, merged.crawledAt);
    if (normalized) existing[idx] = normalized;
  }

  return existing;
}

// ─── 중복 제거 ──────────────────────────────
function deduplicateArticles(articles, existing) {
  const existingTitleDate = new Set(
    existing.map(a => `${normalizeWhitespace(a.title).toLowerCase()}|${a.publishedAt}`)
  );
  const existingUrls = new Set(
    existing.map(a => normalizeUrlForCompare(a.sourceUrl)).filter(Boolean)
  );

  const seenTitleDate = new Set();
  const seenUrls = new Set();

  return articles.filter(a => {
    const titleDateKey = `${normalizeWhitespace(a.title).toLowerCase()}|${a.publishedAt}`;
    const urlKey = normalizeUrlForCompare(a.sourceUrl);

    if (existingTitleDate.has(titleDateKey) || seenTitleDate.has(titleDateKey)) return false;
    if (urlKey && (existingUrls.has(urlKey) || seenUrls.has(urlKey))) return false;

    seenTitleDate.add(titleDateKey);
    if (urlKey) seenUrls.add(urlKey);
    return true;
  });
}

// ─── 메인 실행 ──────────────────────────────
async function main() {
  console.log("=== 한시 소식 크롤링 시작 ===\n");
  console.log(`Naver API: ${NAVER_CLIENT_ID ? "설정됨" : "미설정"}`);
  console.log(`AI API: ${AI_API_KEY ? "설정됨 (" + AI_PROVIDER + ")" : "미설정"}`);
  if (NORMALIZE_ONLY) {
    console.log("실행 모드: normalize-only");
  }
  console.log("");

  // 기존 데이터 로드
  let existingData = { version: NEWS_SCHEMA_VERSION, lastUpdated: "", articles: [] };
  try {
    const raw = fs.readFileSync(OUTPUT_PATH, "utf8");
    existingData = normalizeDataset(JSON.parse(raw));
  } catch {
    console.log("기존 news_articles.json 없음, 새로 생성\n");
  }

  if (NORMALIZE_ONLY) {
    saveJsonAtomically(OUTPUT_PATH, existingData);
    console.log(`정규화 저장 완료: ${OUTPUT_PATH}`);
    console.log(`총 ${existingData.articles.length}개 기사\n`);
    console.log("=== normalize-only 완료 ===");
    printRunStats();
    return;
  }

  const newArticles = [];

  // 카테고리별 검색
  for (const config of SEARCH_CONFIG) {
    const category = config.category;
    const keywords = config.keywords;
    const limit = config.limitPerKeyword;

    console.log(`\n── 카테고리: ${category} ──`);

    let rawResults = [];

    for (const kw of keywords) {
      console.log(`  검색: "${kw}" (최대 ${limit}건)`);

      // Naver API + Google RSS + Naver Web(스크래핑) 병렬
      const [naverResults, googleResults, naverWebResults] = await Promise.all([
        searchNaver(kw, limit),
        searchGoogleNews(kw),
        searchNaverWeb(kw),
      ]);

      console.log(`    Naver API: ${naverResults.length}건, Google: ${googleResults.length}건, NaverWeb: ${naverWebResults.length}건`);
      // NaverWeb 결과 우선 (og:description 포함)
      rawResults.push(...naverWebResults, ...naverResults, ...googleResults);

      // 부하 방지
      await sleep(500);
    }

    if (rawResults.length === 0) {
      console.log(`  → 검색 결과 없음`);
      continue;
    }

    // 카테고리 내 중복 제거 (제목 기준)
    const uniqueMap = new Map();
    for (const r of rawResults) {
      const key = r.title.toLowerCase().replace(/\s+/g, "");
      if (!uniqueMap.has(key)) uniqueMap.set(key, r);
    }
    const unique = [...uniqueMap.values()];
    console.log(`  → 중복 제거 후: ${unique.length}건`);

    const ruleFiltered = unique.filter((item) => passesHardRelevanceGate({
      title: item.title,
      description: item.description,
      body: item.description,
    }, category));
    const preDropped = unique.length - ruleFiltered.length;
    RUN_STATS.relevance.preDropped += preDropped;
    console.log(`  → 규칙 필터 통과: ${ruleFiltered.length}건 (제외 ${preDropped}건)`);
    if (ruleFiltered.length === 0) {
      console.log("  → 규칙 필터 결과 없음");
      continue;
    }

    // AI 필터링 + 재작성
    const rewritten = await aiFilterAndRewrite(ruleFiltered.slice(0, 10), category);
    const normalized = rewritten
      .map(item => normalizeArticleRecord(item, category))
      .filter(Boolean);

    console.log(`  → AI 재작성: ${rewritten.length}건 / 정규화 통과: ${normalized.length}건`);
    newArticles.push(...normalized);
  }

  // 기존 기사 중, 중복 키를 가진 AI 재작성 결과가 있으면 기존 레코드를 AI 버전으로 승격
  const existingUpgraded = applyAiRewriteToExisting(newArticles, existingData.articles);

  // 기존 기사와 중복 제거
  const deduped = deduplicateArticles(newArticles, existingUpgraded);
  console.log(`\n새 기사: ${deduped.length}건 (중복 제거 후)`);

  // 기존 기사와 합치기
  const withMeta = deduped.map(a => normalizeArticleRecord({
    ...a,
    id: a.id || generateId(a.publishedAt),
    crawledAt: a.crawledAt || new Date().toISOString(),
  }, a.category)).filter(Boolean);

  const merged = [...withMeta, ...existingUpgraded]
    .sort(compareArticlesByPublishedThenCrawledDesc)
    .slice(0, MAX_ARTICLES);

  const mergedFiltered = merged.filter((item) => passesHardRelevanceGate({
    title: item.title,
    summary: item.summary,
    body: item.body,
  }, item.category));
  const mergedDropped = merged.length - mergedFiltered.length;
  if (mergedDropped > 0) {
    RUN_STATS.relevance.postDropped += mergedDropped;
    console.log(`병합 후 규칙 필터 제외: ${mergedDropped}건`);
  }

  // 저장 전 최종 정규화
  const output = normalizeDataset({
    version: NEWS_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    articles: mergedFiltered,
  });

  saveJsonAtomically(OUTPUT_PATH, output);
  console.log(`\n저장 완료: ${OUTPUT_PATH}`);
  console.log(`총 ${output.articles.length}개 기사 (신규 ${withMeta.length}건)\n`);
  console.log("=== 크롤링 완료 ===");
  printRunStats();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function printRunStats() {
  console.log("\n--- 실행 통계 ---");
  console.log(JSON.stringify(RUN_STATS, null, 2));
}

main().catch(e => {
  console.error("크롤링 실패:", e);
  printRunStats();
  process.exit(1);
});
