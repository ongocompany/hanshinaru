/* ============================================
   당시삼백수 데이터 관리툴 - 핵심 로직
   1단계: JSON 로드/저장 + 탭 전환
   ============================================ */

// ─── 전역 상태 ─────────────────────────────
const DATA = {
  author: null,     // db_author.with_ko.json 원본
  poem: null,       // poems.full.json 원본
  history: null,    // history_cards.json 원본
  uiSettings: null, // ui_settings.json 원본
  hyeonto: null,    // hyeonto_data.json 현토 데이터
};

const ORIGINAL = {
  author: null,     // 변경 감지용 원본 복사본
  poem: null,
  history: null,
  uiSettings: null,
  hyeonto: null,
};

// File System Access API 핸들 (직접 저장용)
const FILE_HANDLES = {
  author: null,
  poem: null,
  history: null,
  uiSettings: null,
  hyeonto: null,
};

const DATA_PATHS = {
  author: "../public/index/db_author.with_ko.json",
  poem: "../public/index/poems.v3.json",
  history: "../public/index/history_cards.json",
  uiSettings: "../public/index/ui_settings.json",
  hyeonto: "../public/index/hyeonto_data.json",
};

// ── Supabase REST API (shared/supabase.js에서 제공) ──
const SB_REST = window.SB_REST_URL;
const SB_KEY = window.SB_API_KEY;
const SB_HEADERS = window.SB_HEADERS;

// ── DB → JSON 변환 (로드용) ──
function dbPoetsToAdmin(rows) {
  const authors = {};
  for (const r of rows) {
    authors[r.id] = {
      titleId: r.id,
      sourceUrl: r.source_url,
      name: { zh: r.name_zh, ko: r.name_ko },
      life: { birth: r.birth_year, death: r.death_year, raw: r.life_raw, birthApprox: r.birth_approx, deathApprox: r.death_approx },
      bioKo: r.bio_ko,
      era: { period: r.era_period, confidence: r.era_confidence, source: r.era_source },
      birthplace: { name: r.birthplace_name, nameZh: r.birthplace_name_zh, lat: r.birthplace_lat, lng: r.birthplace_lng },
      relations: r.relations || [],
    };
  }
  return { authors, count: rows.length };
}

function dbPoemsToAdmin(rows) {
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
  })).sort((a, b) => a.poemNo - b.poemNo);
}

function dbHistoryToAdmin(rows) {
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

// ── JSON → DB 변환 (저장용) ──
function adminPoetToRow(a) {
  return {
    id: a.titleId,
    name_zh: a.name?.zh, name_ko: a.name?.ko,
    bio_ko: a.bioKo || null,
    birth_year: a.life?.birth ?? null, death_year: a.life?.death ?? null,
    birth_approx: a.life?.birthApprox ?? false, death_approx: a.life?.deathApprox ?? false,
    life_raw: a.life?.raw || null,
    era_period: a.era?.period || null, era_confidence: a.era?.confidence || null, era_source: a.era?.source || null,
    birthplace_name: a.birthplace?.name || null, birthplace_name_zh: a.birthplace?.nameZh || null,
    birthplace_lat: a.birthplace?.lat ?? null, birthplace_lng: a.birthplace?.lng ?? null,
    relations: a.relations || [],
    source_url: a.sourceUrl || null,
  };
}

function adminPoemToRow(p) {
  return {
    poem_no_str: p.poemNoStr,
    poem_no: p.poemNo,
    title_zh: p.title?.zh, title_ko: p.title?.ko,
    poet_zh: p.poet?.zh, poet_ko: p.poet?.ko,
    category: p.category, juan: p.juan, meter: p.meter,
    body_zh: p.poemZh,
    translation_ko: p.translationKo,
    commentary_ko: p.commentaryKo,
    jipyeong_zh: p.jipyeongZh,
    jipyeong_ko: p.jipyeongKo,
    pinyin: p.pinyin, pingze: p.pingze,
    notes: p.notes || [],
    media: p.media || null,
  };
}

function adminHistoryToRow(c) {
  return {
    id: c.titleId,
    year: c.year,
    name_ko: c.name?.ko || null, name_zh: c.name?.zh || null,
    birth_year: c.life?.birth ?? null, death_year: c.life?.death ?? null,
    summary: c.summary || null,
    detail: c.detail || null,
    tags: c.tags || {},
    annotations: c.annotations || [],
  };
}

const DATA_LABELS = {
  author: "시인 데이터",
  poem: "시 데이터",
  history: "역사 데이터",
  uiSettings: "UI 설정",
  hyeonto: "현토 데이터",
};

// ─── 초기화 ────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSaveButtons();
  loadAllData();
});

// ─── 탭 네비게이션 ─────────────────────────
function initTabs() {
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      // 모든 탭 비활성화
      btns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      // 선택 탭 활성화
      btn.classList.add("active");
      const panelId = "panel-" + btn.dataset.tab;
      document.getElementById(panelId).classList.add("active");
      // URL hash 업데이트
      history.replaceState(null, "", "#" + btn.dataset.tab);
    });
  });

  // URL hash로 초기 탭 복원
  const hash = location.hash.replace("#", "");
  if (hash) {
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (targetBtn) targetBtn.click();
  }
}

// ─── 데이터 로드 ───────────────────────────
async function loadAllData() {
  const dbKeys = ["author", "poem", "history"];

  // 로딩 상태 표시
  dbKeys.forEach(key => setLoadState(key, "loading"));

  // ── 1) Supabase REST API에서 로드 (JSON 폴백 포함) ──
  try {
    const fetchOpts = { headers: SB_HEADERS, cache: "no-store" };
    const [poetsRes, poemsRes, histRes] = await Promise.all([
      fetch(SB_REST + "/poets?select=*", fetchOpts),
      fetch(SB_REST + "/poems?select=*&order=poem_no.asc", fetchOpts),
      fetch(SB_REST + "/history_cards?select=*&order=year.asc", fetchOpts),
    ]);

    if (!poetsRes.ok) throw new Error("poets " + poetsRes.status);
    if (!poemsRes.ok) throw new Error("poems " + poemsRes.status);
    if (!histRes.ok) throw new Error("history " + histRes.status);

    DATA.author = dbPoetsToAdmin(await poetsRes.json());
    DATA.poem = dbPoemsToAdmin(await poemsRes.json());
    DATA.history = dbHistoryToAdmin(await histRes.json());

    dbKeys.forEach(key => {
      ORIGINAL[key] = structuredClone(DATA[key]);
      setLoadState(key, "success");
      updateCount(key);
    });

    console.log("[admin] Supabase DB에서 로드 완료");
  } catch (e) {
    console.warn("[admin] Supabase 실패 → JSON fallback:", e.message);
    const results = await Promise.allSettled(
      dbKeys.map(key => loadJSON(key))
    );
    results.forEach((result, i) => {
      const key = dbKeys[i];
      if (result.status === "fulfilled") {
        DATA[key] = result.value;
        ORIGINAL[key] = structuredClone(result.value);
        setLoadState(key, "success");
        updateCount(key);
      } else {
        setLoadState(key, "error");
        console.error(`${DATA_LABELS[key]} 로드 실패:`, result.reason);
      }
    });
  }

  // ── 2) UI 설정 로드 (JSON — DB에 없음) ──
  try {
    const uiRes = await fetch(withNoCacheQuery(DATA_PATHS.uiSettings), { cache: "no-store" });
    if (uiRes.ok) {
      DATA.uiSettings = await uiRes.json();
    }
  } catch (e) {
    console.warn("ui_settings.json 로드 실패, 기본값 사용:", e);
  }
  if (!DATA.uiSettings && typeof UI_DEFAULTS !== "undefined") {
    DATA.uiSettings = structuredClone(UI_DEFAULTS);
  }
  ORIGINAL.uiSettings = structuredClone(DATA.uiSettings);

  // ── 3) 현토 데이터 로드 (JSON — DB에 없음) ──
  try {
    const hyRes = await fetch(withNoCacheQuery(DATA_PATHS.hyeonto), { cache: "no-store" });
    if (hyRes.ok) {
      DATA.hyeonto = await hyRes.json();
      ORIGINAL.hyeonto = structuredClone(DATA.hyeonto);
      console.log(`현토 데이터 로드: ${Object.keys(DATA.hyeonto).length}편`);
    }
  } catch (e) {
    console.warn("hyeonto_data.json 로드 실패:", e);
  }
  if (!DATA.hyeonto) DATA.hyeonto = {};
  if (!ORIGINAL.hyeonto) ORIGINAL.hyeonto = {};

  // ── 4) 전체 상태 업데이트 + 각 매니저 초기화 ──
  const allLoaded = dbKeys.every(k => DATA[k] !== null);
  document.getElementById("load-status").textContent =
    allLoaded ? "데이터 로드 완료" : "일부 데이터 로드 실패";
  document.getElementById("btn-save").disabled = !allLoaded;

  if (allLoaded && typeof initAuthorManager === "function") initAuthorManager();
  if (allLoaded && typeof initPoemManager === "function") initPoemManager();
  if (allLoaded && typeof initHistoryManager === "function") initHistoryManager();
  if (typeof initUIManager === "function") initUIManager();
}

async function loadJSON(key) {
  const res = await fetch(withNoCacheQuery(DATA_PATHS[key]), { cache: "no-store" });
  if (res.ok) return await res.json();

  // poems.v3.json 폴백
  if (key === "poem") {
    const fallback = await fetch(withNoCacheQuery("../public/index/poems.v3.json"), { cache: "no-store" });
    if (fallback.ok) return await fallback.json();
  }

  throw new Error(`HTTP ${res.status}`);
}

function withNoCacheQuery(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

function setLoadState(key, state) {
  const dot = document.querySelector(`#load-${key} .load-dot`);
  dot.className = "load-dot " + state;
}

function updateCount(key) {
  const el = document.getElementById("count-" + key);
  if (!DATA[key]) { el.textContent = "-"; return; }

  if (key === "author") {
    const count = DATA[key].authors ? Object.keys(DATA[key].authors).length : 0;
    el.textContent = count + "명";
  } else if (key === "poem") {
    el.textContent = (Array.isArray(DATA[key]) ? DATA[key].length : 0) + "편";
  } else if (key === "history") {
    el.textContent = (Array.isArray(DATA[key]) ? DATA[key].length : 0) + "건";
  }
}

// ─── 변경 감지 ─────────────────────────────
function checkChanges() {
  const keys = ["author", "poem", "history"];
  let totalChanges = 0;

  keys.forEach(key => {
    const changed = JSON.stringify(DATA[key]) !== JSON.stringify(ORIGINAL[key]);
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${key}"]`);
    if (tabBtn) {
      tabBtn.classList.toggle("modified", changed);
    }
    if (changed) totalChanges++;
  });

  // UI 설정 변경 감지
  const uiChanged = typeof isUISettingsModified === "function" && isUISettingsModified();
  const uiTabBtn = document.querySelector('.tab-btn[data-tab="ui"]');
  if (uiTabBtn) uiTabBtn.classList.toggle("modified", uiChanged);
  if (uiChanged) totalChanges++;

  const changeBar = document.getElementById("change-bar");
  const changeCount = document.getElementById("change-count");

  if (totalChanges > 0) {
    changeBar.hidden = false;
    changeCount.textContent = `${totalChanges}개 항목 수정됨`;
  } else {
    changeBar.hidden = true;
  }

  return totalChanges > 0;
}

// ─── 저장 기능 ─────────────────────────────
function initSaveButtons() {
  document.getElementById("btn-save").addEventListener("click", saveAll);
  document.getElementById("btn-save-bottom").addEventListener("click", saveAll);
  document.getElementById("btn-discard").addEventListener("click", discardAll);
}

async function saveAll() {
  const hasChanges = checkChanges();

  const DB_KEYS = ["author", "poem", "history"];
  const FILE_KEYS = ["uiSettings", "hyeonto"];
  const fileNames = {
    uiSettings: "ui_settings.json",
    hyeonto: "hyeonto_data.json",
  };

  let savedCount = 0;
  const errors = [];

  // 1) DB 키: Supabase에 저장
  for (const key of DB_KEYS) {
    if (!DATA[key]) continue;
    if (JSON.stringify(DATA[key]) === JSON.stringify(ORIGINAL[key])) continue;

    try {
      await saveToSupabase(key);
      ORIGINAL[key] = structuredClone(DATA[key]);
      savedCount++;
    } catch (err) {
      console.error(`[saveAll] ${key} DB 저장 실패:`, err);
      errors.push(`${DATA_LABELS[key]}: ${err.message}`);
    }
  }

  // 2) 파일 키: 기존 방식 유지 (UI설정, 현토)
  for (const key of FILE_KEYS) {
    if (!DATA[key]) continue;
    if (JSON.stringify(DATA[key]) === JSON.stringify(ORIGINAL[key])) continue;

    const jsonStr = JSON.stringify(DATA[key], null, 2);
    const saved = await saveFile(key, jsonStr, fileNames[key]);
    if (saved) {
      ORIGINAL[key] = structuredClone(DATA[key]);
      if (key === "uiSettings" && typeof uiSettingsOriginal !== "undefined") {
        uiSettingsOriginal = structuredClone(DATA[key]);
      }
      savedCount++;
    }
  }

  checkChanges();

  if (errors.length > 0) {
    showToast("DB 저장 오류: " + errors.join(", "), 5000);
  } else if (savedCount > 0) {
    showToast(hasChanges ? "변경사항 저장 완료!" : "현재 상태 저장 완료!");
  } else if (!hasChanges) {
    showToast("변경된 내용이 없습니다.");
  }
}

// ── Supabase DB 저장 ──
async function saveToSupabase(key) {
  if (!window.sb) throw new Error("Supabase 클라이언트를 찾을 수 없습니다 (supabase.js 로드 확인)");

  if (key === "author") {
    const rows = Object.values(DATA.author.authors).map(adminPoetToRow);
    const { error } = await window.sb.from("poets").upsert(rows, { onConflict: "id" });
    if (error) throw error;
    showToast(`시인 ${rows.length}명 DB 저장 완료`);

  } else if (key === "poem") {
    const rows = DATA.poem.map(adminPoemToRow);
    const { error } = await window.sb.from("poems").upsert(rows, { onConflict: "poem_no_str" });
    if (error) throw error;
    showToast(`시 ${rows.length}편 DB 저장 완료`);

  } else if (key === "history") {
    const rows = DATA.history.map(adminHistoryToRow);
    const { error } = await window.sb.from("history_cards").upsert(rows, { onConflict: "id" });
    if (error) throw error;
    showToast(`역사 ${rows.length}건 DB 저장 완료`);
  }
}

async function saveFile(key, jsonStr, fileName) {
  // 1) File System Access API 시도 (Chrome/Edge)
  if ("showSaveFilePicker" in window) {
    try {
      // 기존 핸들이 있으면 재사용 (두 번째 저장부터 팝업 없음)
      let handle = FILE_HANDLES[key];

      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: "JSON 파일",
            accept: { "application/json": [".json"] },
          }],
        });
        FILE_HANDLES[key] = handle;
      }

      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      showToast(`${DATA_LABELS[key]} 저장 완료 (파일 직접 저장)`);
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false; // 사용자가 취소
      console.warn("File System Access 실패, 다운로드로 폴백:", err);
    }
  }

  // 2) 폴백: Blob 다운로드
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().slice(2, 16).replace(/[-T:]/g, "");
  a.href = url;
  a.download = fileName.replace(".json", `_${timestamp}.json`);
  a.click();
  URL.revokeObjectURL(url);

  showToast(`${DATA_LABELS[key]} 다운로드 완료 (public/index/에 수동 교체 필요)`);
  return true;
}

function discardAll() {
  if (!confirm("모든 변경사항을 되돌리시겠습니까?")) return;

  const keys = ["author", "poem", "history", "uiSettings"];
  keys.forEach(key => {
    if (ORIGINAL[key]) DATA[key] = structuredClone(ORIGINAL[key]);
  });

  checkChanges();
  showToast("모든 변경사항이 되돌려졌습니다.");

  // 시인관리 화면 갱신
  if (typeof renderAuthorList === "function") {
    renderAuthorList();
    if (AuthorManager.selectedId) {
      selectAuthor(AuthorManager.selectedId);
    }
  }

  // 시관리 화면 갱신
  if (typeof renderPoemList === "function") {
    renderPoemList();
    if (PoemManager.selectedIndex !== null) {
      selectPoem(PoemManager.selectedIndex);
    }
  }

  // UI관리 화면 갱신
  if (typeof initUIManager === "function") {
    initUIManager();
  }
}

// ─── 토스트 알림 ───────────────────────────
function showToast(message, duration = 3000) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      padding: 10px 24px; background: #2c3e50; color: #fff;
      border-radius: 6px; font-size: 14px; z-index: 200;
      opacity: 0; transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
  }, duration);
}

// ─── 페이지 떠남 경고 ──────────────────────
window.addEventListener("beforeunload", (e) => {
  if (checkChanges()) {
    e.preventDefault();
    e.returnValue = "";
  }
});
