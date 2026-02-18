/* ============================================
   도구 탭 - 유틸리티 모음
   1. 日日五首 이미지 manifest 관리
   2. 오늘의 시인 — 대표구절 관리
   ============================================ */

// ─── 상태 ─────────────────────────────────
const ToolManager = {
  manifest: [],           // 日日五首 manifest 항목들
  manifestHandle: null,   // File System Access API 핸들
  verses: [],             // 대표구절 목록
  versesHandle: null,     // File System Access API 핸들
};

const MANIFEST_PATH = "../public/assets/main_page_poem/manifest.json";
const IMG_BASE = "../public/assets/main_page_poem/";
const VERSES_PATH = "../public/index/poet_verses.json";

// ─── 초기화 (DOMContentLoaded 후 admin.js의 loadAllData 완료 시점) ───
document.addEventListener("DOMContentLoaded", () => {
  // 도구 탭이 활성화될 때 manifest 로드
  document.querySelector('.tab-btn[data-tab="tools"]')
    ?.addEventListener("click", loadManifestOnce);

  document.getElementById("btn-poem-card-add")
    ?.addEventListener("click", addPoemCard);
  document.getElementById("btn-poem-card-save")
    ?.addEventListener("click", saveManifest);
  document.getElementById("btn-verse-add")
    ?.addEventListener("click", addVerse);
  document.getElementById("btn-verse-save")
    ?.addEventListener("click", saveVerses);

  // Enter키로 추가
  document.getElementById("poem-card-add-no")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addPoemCard(); }
    });
});

// ─── Manifest 로드 ───
let manifestLoaded = false;

async function loadManifestOnce() {
  if (manifestLoaded) return;
  manifestLoaded = true;

  // 日日五首 manifest 로드
  try {
    const res = await fetch(MANIFEST_PATH + "?_ts=" + Date.now(), { cache: "no-store" });
    if (res.ok) ToolManager.manifest = await res.json();
  } catch (e) {
    console.warn("manifest.json 로드 실패:", e);
    ToolManager.manifest = [];
  }
  renderPoemCardGrid();

  // 대표구절 로드
  try {
    const res = await fetch(VERSES_PATH + "?_ts=" + Date.now(), { cache: "no-store" });
    if (res.ok) ToolManager.verses = await res.json();
  } catch (e) {
    console.warn("poet_verses.json 로드 실패:", e);
    ToolManager.verses = [];
  }
  renderVerseList();
  populateVersePoetSelect();
}

// ─── 카드 그리드 렌더링 ───
function renderPoemCardGrid() {
  const grid = document.getElementById("poem-card-grid");
  if (!grid) return;

  if (ToolManager.manifest.length === 0) {
    grid.innerHTML = '<div class="poem-card-empty">등록된 이미지가 없습니다.</div>';
    return;
  }

  grid.innerHTML = ToolManager.manifest.map((item, idx) => `
    <div class="poem-card-item" data-idx="${idx}">
      <div class="poem-card-thumb-wrap">
        <img src="${IMG_BASE}${item.file}" alt="${item.title}" class="poem-card-thumb"
             onerror="this.src=''; this.alt='이미지 없음'; this.closest('.poem-card-thumb-wrap').classList.add('missing')">
      </div>
      <div class="poem-card-info">
        <div class="poem-card-no">#${String(item.no).padStart(3, '0')}</div>
        <div class="poem-card-title-text">${item.title}</div>
        <div class="poem-card-poet-text">${item.poet} · ${item.poetKo}</div>
      </div>
      <button class="btn btn-discard poem-card-remove" data-idx="${idx}" title="제거">&times;</button>
    </div>
  `).join("");

  // 제거 버튼 이벤트
  grid.querySelectorAll(".poem-card-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const item = ToolManager.manifest[idx];
      if (confirm(`#${String(item.no).padStart(3, '0')} ${item.title} (${item.poetKo})을(를) 목록에서 제거하시겠습니까?\n(이미지 파일은 삭제되지 않습니다)`)) {
        ToolManager.manifest.splice(idx, 1);
        renderPoemCardGrid();
        showToast("목록에서 제거됨 (저장 필요)");
      }
    });
  });
}

// ─── 카드 추가 ───
function addPoemCard() {
  const input = document.getElementById("poem-card-add-no");
  const status = document.getElementById("poem-card-add-status");
  const no = parseInt(input.value);

  if (!no || no < 1) {
    status.textContent = "유효한 시 번호를 입력하세요.";
    status.className = "poem-card-add-status error";
    return;
  }

  // 이미 등록되어 있는지 확인
  if (ToolManager.manifest.some(m => m.no === no)) {
    status.textContent = `#${String(no).padStart(3, '0')}은 이미 등록되어 있습니다.`;
    status.className = "poem-card-add-status error";
    return;
  }

  // poems.full.json에서 시 정보 찾기
  if (!DATA.poem) {
    status.textContent = "시 데이터가 로드되지 않았습니다. 새로고침 해주세요.";
    status.className = "poem-card-add-status error";
    return;
  }

  const poem = DATA.poem.find(p => p.poemNo === no);
  if (!poem) {
    status.textContent = `#${no}번 시를 poems.full.json에서 찾을 수 없습니다.`;
    status.className = "poem-card-add-status error";
    return;
  }

  // 제목/시인 추출 (주석 마커/괄호 제거)
  function stripNotes(text) {
    return (text || '')
      .replace(/[\[\［]\s*\d+\s*[\]\］]/g, '')
      .replace(/[〈〉《》]/g, '')
      .trim();
  }

  const titleZh = typeof poem.title === 'object'
    ? stripNotes(poem.title.zh)
    : stripNotes(String(poem.title));

  const poetZh = typeof poem.poet === 'object'
    ? stripNotes(poem.poet.zh)
    : stripNotes(String(poem.poet));

  const poetKo = typeof poem.poet === 'object'
    ? (poem.poet.ko || '')
    : '';

  const file = String(no).padStart(3, '0') + '.jpg';

  // manifest에 추가
  ToolManager.manifest.push({ no, file, title: titleZh, poet: poetZh, poetKo });
  // 번호순 정렬
  ToolManager.manifest.sort((a, b) => a.no - b.no);

  renderPoemCardGrid();
  input.value = "";
  status.textContent = `#${String(no).padStart(3, '0')} ${titleZh} 추가됨 (저장 필요)`;
  status.className = "poem-card-add-status success";
  showToast(`${poetKo} 《${titleZh}》 추가됨`);
}

// ─── Manifest 저장 ───
async function saveManifest() {
  const status = document.getElementById("poem-card-save-status");
  const jsonStr = JSON.stringify(ToolManager.manifest, null, 2) + "\n";

  // File System Access API 시도 (Chrome/Edge)
  if ("showSaveFilePicker" in window) {
    try {
      let handle = ToolManager.manifestHandle;

      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName: "manifest.json",
          types: [{
            description: "JSON 파일",
            accept: { "application/json": [".json"] },
          }],
        });
        ToolManager.manifestHandle = handle;
      }

      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      status.textContent = "저장 완료!";
      status.className = "poem-card-save-status success";
      showToast("manifest.json 저장 완료!");
      return;
    } catch (err) {
      if (err.name === "AbortError") {
        status.textContent = "저장 취소됨";
        status.className = "poem-card-save-status";
        return;
      }
      console.warn("File System Access 실패, 다운로드로 폴백:", err);
    }
  }

  // 폴백: Blob 다운로드
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "manifest.json";
  a.click();
  URL.revokeObjectURL(url);

  status.textContent = "다운로드 완료 (public/assets/main_page_poem/에 수동 교체 필요)";
  status.className = "poem-card-save-status success";
  showToast("manifest.json 다운로드 완료");
}

// ════════════════════════════════════════════
// 2. 오늘의 시인 — 대표구절 관리
// ════════════════════════════════════════════

function stripNotes(text) {
  return (text || '')
    .replace(/[\[\［]\s*\d+\s*[\]\］]/g, '')
    .replace(/[〈〉《》]/g, '')
    .trim();
}

// ─── 시인 드롭다운 채우기 ───
function populateVersePoetSelect() {
  const select = document.getElementById("verse-add-poet");
  if (!select || !DATA.author?.authors) return;

  const authors = DATA.author.authors;
  const sorted = Object.keys(authors).sort((a, b) => {
    const ka = authors[a].name?.ko || "";
    const kb = authors[b].name?.ko || "";
    return ka.localeCompare(kb, "ko");
  });

  select.innerHTML = '<option value="">시인 선택...</option>' +
    sorted.map(key => {
      const a = authors[key];
      const nameZh = a.name?.zh || key;
      const nameKo = a.name?.ko || "";
      return `<option value="${nameZh}">${nameKo} (${nameZh})</option>`;
    }).join("");
}

// ─── 구절 목록 렌더링 ───
function renderVerseList() {
  const list = document.getElementById("verse-list");
  if (!list) return;

  if (ToolManager.verses.length === 0) {
    list.innerHTML = '<div class="poem-card-empty">등록된 대표구절이 없습니다.</div>';
    return;
  }

  list.innerHTML = ToolManager.verses.map((v, idx) => {
    const poetKo = getPoetKo(v.poet);
    return `
    <div class="verse-item" data-idx="${idx}">
      <div class="verse-item-header">
        <strong>${v.poet}</strong> <span class="verse-item-ko">${poetKo}</span>
        <span class="verse-item-source">#${String(v.poemNo).padStart(3, '0')} 〈${v.source}〉</span>
        <button class="btn btn-discard verse-item-remove" data-idx="${idx}" title="제거">&times;</button>
      </div>
      <div class="verse-item-text">${v.verse}</div>
    </div>`;
  }).join("");

  // 제거 버튼
  list.querySelectorAll(".verse-item-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const v = ToolManager.verses[idx];
      if (confirm(`${v.poet}의 대표구절을 제거하시겠습니까?`)) {
        ToolManager.verses.splice(idx, 1);
        renderVerseList();
        showToast("제거됨 (저장 필요)");
      }
    });
  });
}

// 시인 한글이름 가져오기
function getPoetKo(poetZh) {
  if (!DATA.author?.authors) return "";
  const a = DATA.author.authors[poetZh];
  return a?.name?.ko || "";
}

// ─── 구절 추가 ───
function addVerse() {
  const poetSelect = document.getElementById("verse-add-poet");
  const poemNoInput = document.getElementById("verse-add-poemNo");
  const sourceInput = document.getElementById("verse-add-source");
  const textInput = document.getElementById("verse-add-text");
  const status = document.getElementById("verse-add-status");

  const poet = poetSelect.value;
  const poemNo = parseInt(poemNoInput.value);
  const source = sourceInput.value.trim();
  const verse = textInput.value.trim();

  if (!poet) {
    status.textContent = "시인을 선택하세요.";
    status.className = "verse-add-status error";
    return;
  }
  if (!verse) {
    status.textContent = "대표 구절을 입력하세요.";
    status.className = "verse-add-status error";
    return;
  }
  if (!poemNo || poemNo < 1) {
    status.textContent = "시 번호를 입력하세요.";
    status.className = "verse-add-status error";
    return;
  }

  // 이미 등록된 시인인지 확인
  const existing = ToolManager.verses.findIndex(v => v.poet === poet);
  if (existing >= 0) {
    if (!confirm(`${poet}의 기존 구절을 덮어쓰시겠습니까?`)) return;
    ToolManager.verses.splice(existing, 1);
  }

  // 출처가 비어있으면 poems.full.json에서 제목 가져오기
  let finalSource = source;
  if (!finalSource && DATA.poem) {
    const poem = DATA.poem.find(p => p.poemNo === poemNo);
    if (poem) {
      finalSource = typeof poem.title === "object"
        ? stripNotes(poem.title.zh)
        : stripNotes(String(poem.title));
    }
  }

  ToolManager.verses.push({ poet, verse, poemNo, source: finalSource || "" });
  ToolManager.verses.sort((a, b) => a.poet.localeCompare(b.poet, "zh"));

  renderVerseList();
  poetSelect.value = "";
  poemNoInput.value = "";
  sourceInput.value = "";
  textInput.value = "";
  status.textContent = `${poet} 대표구절 추가됨 (저장 필요)`;
  status.className = "verse-add-status success";
  showToast(`${getPoetKo(poet)} 대표구절 추가됨`);
}

// ─── 대표구절 저장 ───
async function saveVerses() {
  const status = document.getElementById("verse-save-status");
  const jsonStr = JSON.stringify(ToolManager.verses, null, 2) + "\n";

  if ("showSaveFilePicker" in window) {
    try {
      let handle = ToolManager.versesHandle;
      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName: "poet_verses.json",
          types: [{ description: "JSON 파일", accept: { "application/json": [".json"] } }],
        });
        ToolManager.versesHandle = handle;
      }
      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();
      status.textContent = "저장 완료!";
      status.className = "poem-card-save-status success";
      showToast("poet_verses.json 저장 완료!");
      return;
    } catch (err) {
      if (err.name === "AbortError") {
        status.textContent = "저장 취소됨";
        status.className = "poem-card-save-status";
        return;
      }
      console.warn("File System Access 실패, 다운로드로 폴백:", err);
    }
  }

  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "poet_verses.json";
  a.click();
  URL.revokeObjectURL(url);
  status.textContent = "다운로드 완료 (public/index/에 수동 교체 필요)";
  status.className = "poem-card-save-status success";
  showToast("poet_verses.json 다운로드 완료");
}
