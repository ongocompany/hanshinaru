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

const urlParams = new URLSearchParams(window.location.search);
const isTestMode = urlParams.get('test') === 'qwen';

const DATA_PATHS = {
  author: "../public/index/db_author.with_ko.json",
  poem: isTestMode ? "../public/index/poems.qwen_test.json" : "../public/index/poems.full.owned.json",
  history: "../public/index/history_cards.json",
  uiSettings: "../public/index/ui_settings.json",
  hyeonto: "../public/index/hyeonto_data.json",
};

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
  const keys = ["author", "poem", "history"];

  // 로딩 상태 표시
  keys.forEach(key => setLoadState(key, "loading"));

  const results = await Promise.allSettled(
    keys.map(key => loadJSON(key))
  );

  results.forEach((result, i) => {
    const key = keys[i];
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

  // UI 설정 로드 (별도 — 없으면 기본값 사용)
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

  // 현토 데이터 로드 (별도 — 없어도 정상 동작)
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

  // 전체 상태 업데이트
  const allLoaded = keys.every(k => DATA[k] !== null);
  document.getElementById("load-status").textContent =
    allLoaded ? "데이터 로드 완료" : "일부 데이터 로드 실패";
  document.getElementById("btn-save").disabled = !allLoaded;

  // 2단계: 시인관리 초기화
  if (allLoaded && typeof initAuthorManager === "function") {
    initAuthorManager();
  }

  // 5단계: 시관리 초기화
  if (allLoaded && typeof initPoemManager === "function") {
    initPoemManager();
  }

  // 집필관리 초기화
  if (allLoaded && typeof initWritingManager === "function") {
    initWritingManager();
  }

  // 역사관리 초기화
  if (allLoaded && typeof initHistoryManager === "function") {
    initHistoryManager();
  }

  // UI관리 초기화
  if (typeof initUIManager === "function") {
    initUIManager();
  }
}

async function loadJSON(key) {
  const res = await fetch(withNoCacheQuery(DATA_PATHS[key]), { cache: "no-store" });
  if (res.ok) return await res.json();

  // owned 복사본이 없을 때는 원본으로 폴백
  if (key === "poem") {
    const fallback = await fetch(withNoCacheQuery("../public/index/poems.full.json"), { cache: "no-store" });
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
    if (key === "poem") {
      const writingTabBtn = document.querySelector('.tab-btn[data-tab="writing"]');
      if (writingTabBtn) writingTabBtn.classList.toggle("modified", changed);
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
    changeCount.textContent = `${totalChanges}개 파일 수정됨`;
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

  const keys = ["author", "poem", "history", "uiSettings", "hyeonto"];
  const fileNames = {
    author: "db_author.with_ko.json",
    poem: "poems.full.owned.json",
    history: "history_cards.json",
    uiSettings: "ui_settings.json",
    hyeonto: "hyeonto_data.json",
  };

  let savedCount = 0;

  for (const key of keys) {
    if (!DATA[key]) continue;
    const jsonStr = JSON.stringify(DATA[key], null, 2);
    const saved = await saveFile(key, jsonStr, fileNames[key]);

    if (saved) {
      ORIGINAL[key] = structuredClone(DATA[key]);
      if (key === "uiSettings" && typeof initUIManager !== "undefined") {
        uiSettingsOriginal = structuredClone(DATA[key]);
      }
      savedCount++;
    }
  }

  checkChanges();

  if (savedCount > 0) {
    showToast(hasChanges ? "변경사항 저장 완료!" : "현재 상태 저장 완료!");
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

  // 집필관리 화면 갱신
  if (typeof initWritingManager === "function") {
    initWritingManager();
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
