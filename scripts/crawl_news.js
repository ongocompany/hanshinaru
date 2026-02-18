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

// 환경변수
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "openai"; // "openai" 또는 "anthropic"

// ─── 검색 키워드 ────────────────────────────
const SEARCH_KEYWORDS = [
  // 카테고리: [카테고리명, 키워드배열]
  ["한시", ["한시 漢詩", "당시삼백수", "고전시 한시"]],
  ["한자시험", ["한자능력검정시험", "한자교육 시험"]],
  ["시인화제", ["두보 이백 시인 뉴스", "왕유 백거이 전시 발견"]],
  ["시문학", ["신춘문예 시 부문", "문학상 시 수상", "시집 출간"]],
  ["전통행사", ["석전대제 성균관", "한시 백일장", "향교 유교 행사"]],
  ["서예", ["서예전 서예 공모전", "한시 전시회 서각"]],
];

// ─── HTTP 요청 유틸 ─────────────────────────
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, {
      headers: options.headers || {},
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, options).then(resolve).catch(reject);
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
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
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.log("  [Naver] API 키 미설정, 건너뜀");
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
      return [];
    }

    const data = JSON.parse(res.body);
    return (data.items || []).map(item => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      link: item.originallink || item.link,
      pubDate: item.pubDate,
      source: "Naver",
    }));
  } catch (e) {
    console.warn(`  [Naver] 검색 실패 "${query}":`, e.message);
    return [];
  }
}

// ─── Google News RSS ────────────────────────
async function searchGoogleNews(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await fetchUrl(url);
    if (res.status !== 200) {
      console.warn(`  [Google] HTTP ${res.status} for "${query}"`);
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
      items.push({
        title: extractTag(xml, "title"),
        description: stripHtml(extractTag(xml, "description")),
        link: extractTag(xml, "link"),
        pubDate: extractTag(xml, "pubDate"),
        source: "Google",
        sourceDomain: sourceUrlMatch ? sourceUrlMatch[1] : "",
        sourceName: sourceName || "",
      });
    }
    return items.slice(0, 10);
  } catch (e) {
    console.warn(`  [Google] 검색 실패 "${query}":`, e.message);
    return [];
  }
}

// ─── Naver 웹 검색으로 기사 URL + 설명 가져오기 ──
async function searchNaverWeb(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://search.naver.com/search.naver?where=news&query=${encoded}&sm=tab_opt&sort=1`;

  try {
    const res = await fetchUrl(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    if (res.status !== 200) return [];

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
          if (page.status !== 200) return null;

          const head = page.body.slice(0, 20000);

          // og 태그 추출
          const getOg = (prop) => {
            const m = head.match(new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`, "i"))
              || head.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${prop}["']`, "i"));
            return m ? m[1] : "";
          };

          const title = getOg("og:title");
          const ogDesc = getOg("og:description");
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
          };
        } catch {
          return null;
        }
      }));

      articles.push(...results.filter(Boolean));
      if (i + 3 < naverNewsUrls.length) await sleep(300);
    }

    return articles;
  } catch (e) {
    console.warn(`  [NaverWeb] 검색 실패 "${query}":`, e.message);
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
    if (res.status !== 200) return "";

    const body = res.body;

    // 1) Naver 뉴스 본문 (dic_area)
    const dicArea = body.match(/id="dic_area"[^>]*>([\s\S]*?)<\/article>/);
    if (dicArea) {
      const text = dicArea[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 100) return stripHtml(text.slice(0, 300));
    }

    // 2) 일반 기사 본문 (<article> 태그)
    const article = body.match(/<article[^>]*>([\s\S]*?)<\/article>/);
    if (article) {
      const text = article[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 100) return stripHtml(text.slice(0, 300));
    }

    // 3) og:description fallback
    const head = body.slice(0, 15000);
    const ogMatch = head.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i)
      || head.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i);
    if (ogMatch && ogMatch[1].length > 30) return stripHtml(ogMatch[1]);

    // 4) meta description
    const metaMatch = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      || head.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    if (metaMatch && metaMatch[1].length > 30) return stripHtml(metaMatch[1]);

    return "";
  } catch {
    return "";
  }
}

// ─── AI 필터링 + 재작성 ────────────────────
async function aiFilterAndRewrite(rawArticles, category) {
  if (!AI_API_KEY) {
    console.log("  [AI] API 키 미설정 — 요약 추출 모드");

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
      results.push({
        title: a.title,
        summary,
        body,
        source: a.source === "NaverWeb" ? extractDomain(a.link) : extractDomain(a.link),
        sourceUrl: a.link,
        publishedAt: parseDate(a.pubDate),
        category,
        keywords: [],
      });
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

        results.push({
          title: a.title,
          summary,
          body,
          source: extractDomain(a.link),
          sourceUrl: a.link,
          publishedAt: parseDate(a.pubDate),
          category,
          keywords: [],
        });
      }
      // 배치 간 딜레이 (서버 부담 방지)
      if (i + 5 < rawArticles.length) await sleep(300);
    }
    return results;
  }

  const prompt = `당신은 한시(漢詩)·한자·전통문화 전문 에디터입니다.

아래 뉴스 기사 목록을 검토하여:
1. 한시, 한자, 고전 시문학, 전통문화, 서예와 **직접적으로 관련 있는** 기사만 선별
2. 선별된 기사를 **사이트 톤에 맞게 재작성** (교양 있고 차분한 톤)
3. 각 기사의 본문은 300~500자(한국어)

카테고리: ${category}

기사 목록:
${rawArticles.map((a, i) => `[${i + 1}] 제목: ${a.title}\n    요약: ${a.description}\n    원문: ${a.link}\n    날짜: ${a.pubDate}`).join("\n\n")}

JSON 배열로 응답하세요 (관련 없는 기사는 제외):
[{
  "originalIndex": 번호,
  "title": "재작성된 제목",
  "summary": "1줄 요약 (50자 이내)",
  "body": "재작성된 본문 (300~500자)",
  "keywords": ["키워드1", "키워드2"]
}]

관련 있는 기사가 없으면 빈 배열 []을 반환하세요.`;

  try {
    let result;
    if (AI_PROVIDER === "anthropic") {
      result = await callClaude(prompt);
    } else {
      result = await callOpenAI(prompt);
    }

    const parsed = JSON.parse(result);
    return parsed.map(item => {
      const orig = rawArticles[item.originalIndex - 1];
      return {
        title: item.title,
        summary: item.summary,
        body: item.body,
        source: extractDomain(orig?.link || ""),
        sourceUrl: orig?.link || "",
        publishedAt: parseDate(orig?.pubDate),
        category,
        keywords: item.keywords || [],
      };
    });
  } catch (e) {
    console.warn("  [AI] 재작성 실패:", e.message);
    // AI 실패 시 원본 그대로
    return rawArticles.slice(0, 3).map(a => ({
      title: a.title,
      summary: a.description.slice(0, 200),
      body: a.description,
      source: extractDomain(a.link),
      sourceUrl: a.link,
      publishedAt: parseDate(a.pubDate),
      category,
      keywords: [],
    }));
  }
}

async function callOpenAI(prompt) {
  const res = await postJson("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  }, {
    Authorization: `Bearer ${AI_API_KEY}`,
  });

  if (res.status !== 200) throw new Error(`OpenAI HTTP ${res.status}`);
  const text = res.body.choices?.[0]?.message?.content || "[]";
  // JSON 블록 추출
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : "[]";
}

async function callClaude(prompt) {
  const res = await postJson("https://api.anthropic.com/v1/messages", {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  }, {
    "x-api-key": AI_API_KEY,
    "anthropic-version": "2023-06-01",
  });

  if (res.status !== 200) throw new Error(`Claude HTTP ${res.status}`);
  const text = res.body.content?.[0]?.text || "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : "[]";
}

// ─── 유틸 함수 ──────────────────────────────
function stripHtml(str) {
  return (str || "")
    // 1) HTML 엔티티 먼저 디코딩 (&lt;a&gt; → <a>)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
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
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function generateId(date) {
  const d = date.replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `news-${d}-${rand}`;
}

// ─── 중복 제거 ──────────────────────────────
function deduplicateArticles(articles, existing) {
  const existingTitles = new Set(existing.map(a => a.title.toLowerCase()));
  const existingUrls = new Set(existing.map(a => a.sourceUrl).filter(Boolean));
  const seen = new Set();

  return articles.filter(a => {
    const titleKey = a.title.toLowerCase();
    // 제목 유사도 체크 (완전 일치)
    if (existingTitles.has(titleKey) || seen.has(titleKey)) return false;
    // URL 중복
    if (a.sourceUrl && existingUrls.has(a.sourceUrl)) return false;
    seen.add(titleKey);
    return true;
  });
}

// ─── 메인 실행 ──────────────────────────────
async function main() {
  console.log("=== 한시 소식 크롤링 시작 ===\n");
  console.log(`Naver API: ${NAVER_CLIENT_ID ? "설정됨" : "미설정"}`);
  console.log(`AI API: ${AI_API_KEY ? "설정됨 (" + AI_PROVIDER + ")" : "미설정"}`);
  console.log("");

  // 기존 데이터 로드
  let existingData = { version: "1.0", lastUpdated: "", articles: [] };
  try {
    const raw = fs.readFileSync(OUTPUT_PATH, "utf8");
    existingData = JSON.parse(raw);
  } catch {
    console.log("기존 news_articles.json 없음, 새로 생성\n");
  }

  const newArticles = [];

  // 카테고리별 검색
  for (const [category, keywords] of SEARCH_KEYWORDS) {
    console.log(`\n── 카테고리: ${category} ──`);

    let rawResults = [];

    for (const kw of keywords) {
      console.log(`  검색: "${kw}"`);

      // Naver API + Google RSS + Naver Web(스크래핑) 병렬
      const [naverResults, googleResults, naverWebResults] = await Promise.all([
        searchNaver(kw, 5),
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

    // AI 필터링 + 재작성
    const rewritten = await aiFilterAndRewrite(unique.slice(0, 10), category);
    console.log(`  → AI 재작성: ${rewritten.length}건`);

    newArticles.push(...rewritten);
  }

  // 기존 기사와 중복 제거
  const deduped = deduplicateArticles(newArticles, existingData.articles);
  console.log(`\n새 기사: ${deduped.length}건 (중복 제거 후)`);

  // ID 부여 + 기존 기사와 합치기
  const withIds = deduped.map(a => ({
    id: generateId(a.publishedAt),
    ...a,
    crawledAt: new Date().toISOString(),
  }));

  const merged = [...withIds, ...existingData.articles]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ARTICLES);

  // 저장
  const output = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    articles: merged,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`\n저장 완료: ${OUTPUT_PATH}`);
  console.log(`총 ${merged.length}개 기사 (신규 ${withIds.length}건)\n`);
  console.log("=== 크롤링 완료 ===");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(e => {
  console.error("크롤링 실패:", e);
  process.exit(1);
});
