/* ============================================
   당시삼백수 데이터 관리툴 - 핵심 로직
   1단계: JSON 로드/저장 + 탭 전환
   ============================================ */

// ─── 전역 상태 ─────────────────────────────
const DATA = {
  author: null,     // db_author.with_ko.json 원본
  poem: null,       // poems.full.json 원본
  history: null,    // history_cards.json 원본
};

const ORIGINAL = {
  author: null,     // 변경 감지용 원본 복사본
  poem: null,
  history: null,
};

// File System Access API 핸들 (직접 저장용)
const FILE_HANDLES = {
  author: null,
  poem: null,
  history: null,
};

const DATA_PATHS = {
  author: "../public/index/db_author.with_ko.json",
  poem: "../public/index/poems.full.json",
  history: "../public/index/history_cards.json",
};

const DATA_LABELS = {
  author: "시인 데이터",
  poem: "시 데이터",
  history: "역사 데이터",
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
}

async function loadJSON(key) {
  const res = await fetch(DATA_PATHS[key]);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
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

  const keys = ["author", "poem", "history"];
  const fileNames = {
    author: "db_author.with_ko.json",
    poem: "poems.full.json",
    history: "history_cards.json",
  };

  let savedCount = 0;

  for (const key of keys) {
    const jsonStr = JSON.stringify(DATA[key], null, 2);
    const saved = await saveFile(key, jsonStr, fileNames[key]);

    if (saved) {
      ORIGINAL[key] = structuredClone(DATA[key]);
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

  const keys = ["author", "poem", "history"];
  keys.forEach(key => {
    DATA[key] = structuredClone(ORIGINAL[key]);
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
