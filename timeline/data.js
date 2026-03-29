// timeline/data.js
// 상수, Supabase 로딩, DB→JSON 변환, 인덱스 빌드, STATE, UI 설정
// ------------------------------------------------------------

// ===== 시대별 타임라인 상수 =====
const ERA_CONFIG = [
  { key: "pre",   label: "隋",       zhLabel: "隋"      },
  { key: "early", label: "초당",     zhLabel: "初唐"    },
  { key: "high",  label: "성당",     zhLabel: "盛唐"    },
  { key: "mid",   label: "중당",     zhLabel: "中唐"    },
  { key: "late",  label: "만당",     zhLabel: "晩唐"    },
  { key: "post",  label: "오대십국", zhLabel: "五代十國" },
];

const MAIN_HISTORY_IDS = new Set(["H001", "H003", "H005", "H007"]);

const ERA_DETAILS = {
  early: { yearRange: "618~712", featuredEventId: "H001" },
  high:  { yearRange: "713~765", featuredEventId: "H003" },
  mid:   { yearRange: "766~835", featuredEventId: "H005" },
  late:  { yearRange: "836~907", featuredEventId: "H007" },
};

// 역사 이벤트 시대 오버라이드
const HISTORY_ERA_OVERRIDE = {
  "H005": "mid",
  "H020": "mid",
};

// ===== 전역 상태 =====
const STATE = {
  poemById: new Map(),
  authorById: new Map(),
  poemsByAuthorId: new Map(),
  authorIdByPoetZh: new Map(),
  historyById: new Map(),
};

// ===== JSON 로더 =====
async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${url}`);
  return res.json();
}

// ===== Supabase DB → JSON 변환 =====
function dbPoetsToJSON(rows) {
  const authors = {};
  for (const r of rows) {
    authors[r.id] = {
      titleId: r.id,
      sourceUrl: r.source_url,
      name: { zh: r.name_zh, ko: r.name_ko },
      life: {
        birth: r.birth_year, death: r.death_year, raw: r.life_raw,
        birthApprox: r.birth_approx, deathApprox: r.death_approx,
      },
      bioKo: r.bio_ko,
      era: { period: r.era_period, confidence: r.era_confidence, source: r.era_source },
      birthplace: {
        name: r.birthplace_name, nameZh: r.birthplace_name_zh,
        lat: r.birthplace_lat, lng: r.birthplace_lng,
      },
      relations: r.relations || [],
    };
  }
  return { authors, count: rows.length };
}

function dbPoemsToJSON(rows) {
  return rows.map(r => ({
    poemNoStr: r.poem_no_str,
    poemNo: r.poem_no,
    title: { zh: r.title_zh, ko: r.title_ko },
    poet: { zh: r.poet_zh, ko: r.poet_ko },
    category: r.category,
    juan: r.juan,
    meter: r.meter,
    poemZh: r.body_zh,
    translationKo: r.translation_ko,
    commentaryKo: r.commentary_ko,
    jipyeongZh: r.jipyeong_zh,
    jipyeongKo: r.jipyeong_ko,
    pinyin: r.pinyin,
    pingze: r.pingze,
    notes: r.notes || [],
    media: r.media || null,
  }));
}

function dbHistoryToJSON(rows) {
  return rows.map(r => ({
    type: "card",
    titleId: r.id,
    year: r.year,
    name: { ko: r.name_ko, zh: r.name_zh },
    life: { birth: r.birth_year, death: r.death_year },
    summary: r.summary,
    detail: r.detail,
    tags: r.tags || {},
    annotations: r.annotations || [],
  }));
}

async function loadFromSupabase() {
  const SB_URL = window.SB_REST_URL;
  const SB_KEY = window.SB_API_KEY;
  const headers = window.SB_HEADERS;

  const opts = { headers };
  const [poets, poems, history] = await Promise.all([
    fetch(SB_URL + "/poets?select=*", opts).then(r => { if (!r.ok) throw new Error("poets " + r.status); return r.json(); }),
    fetch(SB_URL + "/poems?select=*", opts).then(r => { if (!r.ok) throw new Error("poems " + r.status); return r.json(); }),
    fetch(SB_URL + "/history_cards?select=*", opts).then(r => { if (!r.ok) throw new Error("history " + r.status); return r.json(); }),
  ]);
  console.log("[DB] poets " + poets.length + ", poems " + poems.length + ", history " + history.length);
  return {
    authorsDB: dbPoetsToJSON(poets),
    poemsFull: dbPoemsToJSON(poems),
    historyCards: dbHistoryToJSON(history),
  };
}

// ===== 데이터 결합 =====
function buildAuthorEvents(authorsDB, poemsCompact) {
  const poems = Array.isArray(poemsCompact) ? poemsCompact : (poemsCompact.items || []);
  const poemsByPoetZh = groupByKey(poems, p => normalizePoetName(p?.poet?.zh || ""));

  const authors = Object.values(authorsDB.authors || {});
  const events = [];

  for (const a of authors) {
    const authorId = a.titleId;
    const nameZh = normalizePoetName(a?.name?.zh || "");
    const nameKo = a?.name?.ko || "";
    const lifeStr = formatLife(a.life) || (a?.life?.raw ? `(${a.life.raw})` : "");
    const year = a?.life?.birth ?? null;

    const worksRaw = poemsByPoetZh.get(nameZh) || [];
    worksRaw.sort((x, y) => (x.poemNo ?? 0) - (y.poemNo ?? 0));

    const works = worksRaw.map(p => ({
      poemId: p.poemNoStr || p.titleId,
      poemNoStr: p.poemNoStr || String(p.poemNo ?? "").padStart(3, "0"),
      titleCompact: normalizeZhName(p?.title?.zh || ""),
      meta: [p.category, p.juan].filter(Boolean).join(" · "),
    }));

    const era = a?.era?.period || null;
    const poemCount = worksRaw.length;

    events.push({
      year, authorId, nameZh, nameKo, lifeStr,
      bio: (a?.bioKo || "").slice(0, 120),
      works, era, poemCount,
    });
  }

  return events.sort((x, y) => (x.year ?? 9999) - (y.year ?? 9999));
}

function buildAuthorPoemIndex(authorsDB, poemsCompact) {
  const poems = Array.isArray(poemsCompact) ? poemsCompact : (poemsCompact.items || []);
  const poemById = new Map(poems.map(p => [p.poemNoStr || p.titleId, p]));

  const authors = Object.values(authorsDB.authors || {});
  const authorById = new Map(authors.map(a => [a.titleId, a]));

  const authorIdByPoetZh = new Map();
  for (const a of authors) {
    const k = normalizePoetName(a?.name?.zh || "");
    if (k) authorIdByPoetZh.set(k, a.titleId);
  }

  const poemsByAuthorId = new Map();
  for (const p of poems) {
    const poetKey = normalizePoetName(p?.poet?.zh || "");
    const aid = authorIdByPoetZh.get(poetKey);
    if (!aid) continue;

    if (!poemsByAuthorId.has(aid)) poemsByAuthorId.set(aid, []);
    poemsByAuthorId.get(aid).push(p);
  }

  for (const [aid, arr] of poemsByAuthorId.entries()) {
    arr.sort((a, b) => (a.poemNo ?? 0) - (b.poemNo ?? 0));
  }

  return { poemById, authorById, authorIdByPoetZh, poemsByAuthorId };
}

// ===== UI 설정 → CSS 변수 주입 =====
function applyUISettings(s) {
  if (!s) return;
  const r = document.documentElement.style;

  if (s.timeline) {
    for (const [era, v] of Object.entries(s.timeline)) {
      r.setProperty(`--era-${era}-bg`, v.bg);
      r.setProperty(`--era-${era}-text`, v.textColor);
    }
  }

  if (s.poemSections) {
    const map = {
      poemText: "--poem-text-bg",
      commentary: "--poem-commentary-bg",
      commentaryTr: "--poem-commentary-tr-bg",
      notes: "--poem-notes-bg",
      advanced: "--poem-advanced-bg",
      workList: "--poem-worklist-bg",
    };
    for (const [key, varName] of Object.entries(map)) {
      if (s.poemSections[key]) r.setProperty(varName, s.poemSections[key].bg);
    }
  }

  if (s.fonts) {
    for (const [key, f] of Object.entries(s.fonts)) {
      const fullFamily = f.family + (f.fallback ? `, ${f.fallback}` : "");
      r.setProperty(`--font-${key}-family`, fullFamily);
      r.setProperty(`--font-${key}-size`, `${f.size}px`);
      r.setProperty(`--font-${key}-weight`, String(f.weight));
      r.setProperty(`--font-${key}-color`, f.color);
    }
  }
}
