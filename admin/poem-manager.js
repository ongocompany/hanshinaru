/* ============================================
   시관리 모듈 (5단계)
   - 320편 시 목록/검색/필터/정렬
   - 상세 편집 폼 + 변경감지
   - 주석 동적 추가/삭제
   - TTS 재생 (normal/slow)
   ============================================ */

// ─── 시 관련 상태 ───────────────────────────
const PoemManager = {
  selectedIndex: null,   // 현재 편집 중인 시의 배열 인덱스
  sortKey: "no-asc",
  categoryFilter: "all",
  searchText: "",
};

// 배경 그림 메모리 저장소: titleId → DataURL
// 파일을 올리면 여기에 저장 → 미리보기에서 이 URL로 표시
const BG_IMAGE_MEMORY = new Map();

// 현재 재생 중인 TTS 오디오
let currentTtsAudio = null;
let currentTtsBtn = null;

// ─── 초기화 (admin.js의 loadAllData 완료 후 호출) ───
function initPoemManager() {
  if (!Array.isArray(DATA.poem)) return;

  bindPoemEvents();
  renderPoemList();
}

// ─── 이벤트 바인딩 ──────────────────────────
function bindPoemEvents() {
  // 검색
  document.getElementById("poem-search").addEventListener("input", (e) => {
    PoemManager.searchText = e.target.value.trim().toLowerCase();
    renderPoemList();
  });

  // 카테고리 필터
  document.getElementById("poem-category-filter").addEventListener("change", (e) => {
    PoemManager.categoryFilter = e.target.value;
    renderPoemList();
  });

  // 정렬
  document.getElementById("poem-sort").addEventListener("change", (e) => {
    PoemManager.sortKey = e.target.value;
    renderPoemList();
  });

  // 목록 행 클릭 (이벤트 위임)
  document.getElementById("poem-tbody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const idx = Number(row.dataset.idx);
    if (!isNaN(idx)) selectPoem(idx);
  });

  // 확정/되돌리기 버튼
  document.getElementById("btn-confirm-poem").addEventListener("click", confirmCurrentPoem);
  document.getElementById("btn-revert-poem").addEventListener("click", revertCurrentPoem);

  // 폼 값 변경 감지 (이벤트 위임)
  document.getElementById("poem-form").addEventListener("input", onPoemFormChange);
  document.getElementById("poem-form").addEventListener("change", onPoemFormChange);

  // 주석 추가
  document.getElementById("btn-add-note").addEventListener("click", addNote);

  // TTS 재생
  document.getElementById("btn-tts-normal").addEventListener("click", () => playTts("normal"));
  document.getElementById("btn-tts-slow").addEventListener("click", () => playTts("slow"));

  // 간체자/병음/평측 자동 생성
  document.getElementById("btn-gen-pinyin").addEventListener("click", generatePinyinPingze);

  // 유튜브 링크
  document.getElementById("btn-add-youtube").addEventListener("click", addYoutubeLink);
  document.getElementById("btn-search-youtube").addEventListener("click", searchYoutube);

  // 배경 그림 (우측 패널에 이동됨)
  document.getElementById("btn-bg-upload").addEventListener("click", () => document.getElementById("pf-bg-file").click());
  document.getElementById("pf-bg-file").addEventListener("change", handleBgFileSelect);
  document.getElementById("btn-bg-paste").addEventListener("click", handleBgPaste);
  document.getElementById("btn-bg-delete").addEventListener("click", deleteBgImage);

  // 모달 미리보기 (최종 확인용)
  document.getElementById("btn-bg-preview").addEventListener("click", openBgPreviewModal);
  document.getElementById("btn-bg-modal-close").addEventListener("click", closeBgPreviewModal);
  document.getElementById("bg-preview-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeBgPreviewModal();
  });

  // 우측 패널: 박스 컨트롤 실시간 반영
  ["bg-ctrl-color","bg-ctrl-opacity","bg-ctrl-radius","bg-ctrl-padding"].forEach(id => {
    document.getElementById(id).addEventListener("input", onBoxControlChange);
  });
  document.getElementById("bg-ctrl-width").addEventListener("input", onBoxControlChange);
  document.querySelectorAll('input[name="bg-align-h"], input[name="bg-align-v"]').forEach(r => {
    r.addEventListener("change", onBoxControlChange);
  });

  // 우측 패널: 에디터 툴바
  document.getElementById("ed-font").addEventListener("change", onEditorChange);
  document.getElementById("ed-size").addEventListener("input", onEditorChange);
  ["ed-bold","ed-italic","ed-underline"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => toggleEditorBtn(id));
  });
  ["ed-align-left","ed-align-center","ed-align-right"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => setEditorAlign(id));
  });

  // 우측 패널: 액션 버튼
  document.getElementById("btn-preview-confirm").addEventListener("click", confirmCurrentPoem);
  document.getElementById("btn-preview-revert").addEventListener("click", revertCurrentPoem);

  // 중간 컬럼 폼 변경 → 실시간 미리보기 갱신
  document.getElementById("poem-form").addEventListener("input", updatePreviewLive);

  // 리사이즈 핸들 초기화
  initResizeHandles();
}

// ─── 시 목록 렌더링 ─────────────────────────
function renderPoemList() {
  if (!Array.isArray(DATA.poem)) return;

  // 인덱스 유지를 위해 [index, poem] 쌍 생성
  let list = DATA.poem.map((p, i) => [i, p]);

  // 필터: 카테고리
  if (PoemManager.categoryFilter !== "all") {
    list = list.filter(([, p]) => p.category === PoemManager.categoryFilter);
  }

  // 필터: 검색
  if (PoemManager.searchText) {
    const q = PoemManager.searchText;
    list = list.filter(([, p]) => {
      const titleZh = (p.title?.zh || "").toLowerCase();
      const titleKo = (p.title?.ko || "").toLowerCase();
      const poetZh = (p.poet?.zh || "").toLowerCase();
      const poetKo = (p.poet?.ko || "").toLowerCase();
      return titleZh.includes(q) || titleKo.includes(q) ||
             poetZh.includes(q) || poetKo.includes(q);
    });
  }

  // 정렬
  list = sortPoemList(list, PoemManager.sortKey);

  // 렌더
  const tbody = document.getElementById("poem-tbody");

  const rows = list.map(([idx, p]) => {
    const isSelected = idx === PoemManager.selectedIndex ? " selected" : "";
    const isModified = isPoemModified(idx) ? " row-modified" : "";
    const poetName = normalizePoetNameForPoem(p.poet?.zh || "");

    return `<tr data-idx="${idx}" class="${isSelected}${isModified}">
      <td>${escapeHTMLAdmin(p.poemNoStr || "")}</td>
      <td title="${escapeHTMLAdmin(p.title?.ko || "")}">${escapeHTMLAdmin(p.title?.zh || "")}</td>
      <td>${escapeHTMLAdmin(poetName)}</td>
    </tr>`;
  }).join("");

  tbody.innerHTML = rows;

  // 표시 카운트
  document.getElementById("poem-list-count").textContent =
    `${list.length}편 표시 / 총 ${DATA.poem.length}편`;
}

// 시인 이름에서 주석번호 제거
function normalizePoetNameForPoem(s) {
  return String(s || "").replace(/\[\d+\]/g, "").trim();
}

// 시인 한자이름 → 작가 데이터 매핑 (시대순 소팅용)
function getPoetAuthorMap() {
  if (!DATA.author?.authors) return new Map();
  const map = new Map();
  for (const [, author] of Object.entries(DATA.author.authors)) {
    const nameZh = (author.name?.zh || "").replace(/\[\d+\]/g, "").trim();
    if (nameZh) map.set(nameZh, author);
  }
  return map;
}

function sortPoemList(list, key) {
  switch (key) {
    case "no-asc":
      return list.sort(([, a], [, b]) => (a.poemNo || 0) - (b.poemNo || 0));
    case "era-asc": {
      const ERA_ORDER = { early: 0, high: 1, mid: 2, late: 3 };
      const poetMap = getPoetAuthorMap();
      return list.sort(([, a], [, b]) => {
        const authorA = poetMap.get(normalizePoetNameForPoem(a.poet?.zh));
        const authorB = poetMap.get(normalizePoetNameForPoem(b.poet?.zh));
        const eraA = ERA_ORDER[authorA?.era?.period] ?? 99;
        const eraB = ERA_ORDER[authorB?.era?.period] ?? 99;
        if (eraA !== eraB) return eraA - eraB;
        // 같은 시대 내: 출생연도 빠른 순
        const birthA = authorA?.life?.birth ?? 9999;
        const birthB = authorB?.life?.birth ?? 9999;
        if (birthA !== birthB) return birthA - birthB;
        // 같은 시인: 번호순
        return (a.poemNo || 0) - (b.poemNo || 0);
      });
    }
    case "title-asc":
      return list.sort(([, a], [, b]) =>
        (a.title?.ko || "").localeCompare(b.title?.ko || "", "ko")
      );
    case "poet-asc":
      return list.sort(([, a], [, b]) => {
        const pa = (a.poet?.ko || "").trim();
        const pb = (b.poet?.ko || "").trim();
        const diff = pa.localeCompare(pb, "ko");
        if (diff !== 0) return diff;
        return (a.poemNo || 0) - (b.poemNo || 0);
      });
    default:
      return list;
  }
}

// ─── 시 선택 → 편집 폼 로드 ──────────────
function selectPoem(index) {
  PoemManager.selectedIndex = index;
  const poem = DATA.poem[index];
  if (!poem) return;

  // 목록 하이라이트 갱신
  document.querySelectorAll("#poem-tbody tr").forEach(tr => {
    tr.classList.toggle("selected", Number(tr.dataset.idx) === index);
  });

  // 편집 폼 표시
  document.getElementById("poem-edit-placeholder").hidden = true;
  document.getElementById("poem-edit-form-wrap").hidden = false;
  document.getElementById("poem-edit-title").textContent =
    `${poem.poemNoStr || ""} — ${poem.title?.zh || ""} (${normalizePoetNameForPoem(poem.poet?.zh)})`;

  // 기본정보 (읽기전용)
  document.getElementById("pf-poemNoStr").value = poem.poemNoStr || "";
  document.getElementById("pf-titleId").value = poem.titleId || "";
  document.getElementById("pf-juan").value = poem.juan || "";

  // 분류
  document.getElementById("pf-category").value = poem.category || "";
  document.getElementById("pf-meter").value = String(poem.meter || 5);

  // 제목
  document.getElementById("pf-title-zh").value = poem.title?.zh || "";
  document.getElementById("pf-title-ko").value = poem.title?.ko || "";

  // 시인
  document.getElementById("pf-poet-zh").value = poem.poet?.zh || "";
  document.getElementById("pf-poet-ko").value = poem.poet?.ko || "";

  // 원문
  document.getElementById("pf-poemZh").value = poem.poemZh || "";

  // 번역
  document.getElementById("pf-translationKo").value = poem.translationKo || "";

  // 집평
  document.getElementById("pf-jipyeongZh").value = poem.jipyeongZh || "";
  document.getElementById("pf-jipyeongKo").value = poem.jipyeongKo || "";

  // 집필본(Owned) 확인 패널
  renderOwnedReadonlySection(poem);

  // 주석
  renderNotesList(index);

  // 간체자/병음/평측
  document.getElementById("pf-poemSimp").value = poem.poemSimp || "";
  document.getElementById("pf-pinyin").value = poem.pinyin || "";
  document.getElementById("pf-pingze").value = poem.pingze || "";
  document.getElementById("gen-pinyin-status").textContent = "";

  // 유튜브 링크
  renderYoutubeList(index);

  // 배경 그림 (우측 패널)
  renderBgImage(index);

  // 이미지 비율 감지 (랜덤 배경 포함, 모든 시에 대해)
  if (!poem.textBoxStyle?.imageRatio) {
    detectImageRatio(getBgImageUrl(poem), (ratio) => {
      if (!poem.textBoxStyle) poem.textBoxStyle = {};
      poem.textBoxStyle.imageRatio = ratio;
    });
  }

  // TTS 상태 초기화
  stopTts();
  document.getElementById("tts-status").textContent = "";

  // 변경 감지 표시
  updatePoemFieldHighlights(index);

  // 우측 미리보기 패널 표시 + 갱신
  document.getElementById("preview-placeholder").hidden = true;
  document.getElementById("preview-content").hidden = false;
  loadEditorToolbar(poem);
  updatePreviewLive();
}

function renderOwnedReadonlySection(poem) {
  const meta = poem?.ownedContentMeta || {};
  const ownedNotes = Array.isArray(poem?.notesOwned) ? poem.notesOwned : [];
  const sourceRefs = Array.isArray(meta.sourceRefs) ? meta.sourceRefs.length : 0;
  const hasOwned =
    String(poem?.translationKoOwned || "").trim() ||
    String(poem?.jipyeongKoOwned || "").trim() ||
    ownedNotes.length > 0;

  const status = String(meta.status || (hasOwned ? "editing" : "none"));
  const updatedAt = String(meta.updatedAt || "-");
  const depth = String(meta.depthLevel || "-");
  const policy = String(meta.generationPolicy || "-");
  const bulk = meta.bulkGenerated === true ? "true" : (meta.bulkGenerated === false ? "false" : "-");
  const summary = `depth=${depth} · bulk=${bulk} · refs=${sourceRefs} · policy=${policy}`;

  const statusEl = document.getElementById("pf-owned-status");
  const updatedEl = document.getElementById("pf-owned-updatedAt");
  const summaryEl = document.getElementById("pf-owned-meta-summary");
  const trEl = document.getElementById("pf-translationKoOwned-view");
  const jpEl = document.getElementById("pf-jipyeongKoOwned-view");
  const notesCountEl = document.getElementById("pf-owned-note-count");
  const notesWrapEl = document.getElementById("pf-owned-notes-view");

  if (statusEl) statusEl.value = status;
  if (updatedEl) updatedEl.value = updatedAt;
  if (summaryEl) summaryEl.value = summary;
  if (trEl) trEl.value = poem?.translationKoOwned || "";
  if (jpEl) jpEl.value = poem?.jipyeongKoOwned || "";
  if (notesCountEl) notesCountEl.textContent = String(ownedNotes.length);

  if (!notesWrapEl) return;
  if (ownedNotes.length === 0) {
    notesWrapEl.innerHTML = '<div class="muted">집필 주석이 없습니다.</div>';
    return;
  }

  notesWrapEl.innerHTML = ownedNotes.map((note) => `
    <div class="owned-note-item">
      <span class="owned-note-head">[${escapeHTMLAdmin(note.no || "")}] ${escapeHTMLAdmin(note.head || "")}</span>
      <span class="owned-note-text"> — ${escapeHTMLAdmin(note.text || "")}</span>
    </div>
  `).join("");
}

// ─── 주석 렌더링 (동적) ─────────────────────
function renderNotesList(index) {
  const poem = DATA.poem[index];
  const notes = poem.notes || [];
  const container = document.getElementById("pf-notes-list");
  const countEl = document.getElementById("pf-note-count");

  countEl.textContent = String(notes.length);

  if (notes.length === 0) {
    container.innerHTML = '<div class="no-poems" style="font-style:italic; color:#999; font-size:13px">주석 없음</div>';
    return;
  }

  container.innerHTML = notes.map((note, ni) => `
    <div class="note-edit-item" data-note-idx="${ni}">
      <div class="note-edit-header">
        <span class="note-num">[${note.no || ni + 1}]</span>
        <input type="text" class="note-head-input" value="${escapeAttr(note.head || "")}"
               placeholder="키워드" data-note-field="head" data-note-idx="${ni}">
        <button type="button" class="btn-del-note" data-note-idx="${ni}" title="삭제">&times;</button>
      </div>
      <textarea class="note-text-input" rows="2"
                data-note-field="text" data-note-idx="${ni}"
                placeholder="주석 내용">${escapeHTMLAdmin(note.text || "")}</textarea>
    </div>
  `).join("");

  // 주석 삭제 버튼 이벤트 (이벤트 위임)
  container.onclick = (e) => {
    const delBtn = e.target.closest(".btn-del-note");
    if (!delBtn) return;
    const ni = Number(delBtn.dataset.noteIdx);
    removeNote(ni);
  };

  // 주석 필드 변경 이벤트 (이벤트 위임)
  container.oninput = (e) => {
    const el = e.target;
    const noteField = el.dataset?.noteField;
    const ni = Number(el.dataset?.noteIdx);
    if (!noteField || isNaN(ni)) return;

    const poem2 = DATA.poem[PoemManager.selectedIndex];
    if (!poem2 || !poem2.notes || !poem2.notes[ni]) return;

    poem2.notes[ni][noteField] = el.value;
    checkChanges();
    updatePoemFieldHighlights(PoemManager.selectedIndex);
    renderPoemList();
  };
}

function addNote() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  if (!poem.notes) poem.notes = [];

  const nextNo = poem.notes.length > 0
    ? Math.max(...poem.notes.map(n => n.no || 0)) + 1
    : 1;

  poem.notes.push({ no: nextNo, head: "", text: "" });
  renderNotesList(idx);
  checkChanges();
  updatePoemFieldHighlights(idx);
}

function removeNote(noteIndex) {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem || !poem.notes) return;

  if (!confirm(`주석 [${poem.notes[noteIndex]?.no || noteIndex + 1}] "${poem.notes[noteIndex]?.head || ""}"을(를) 삭제하시겠습니까?`)) return;

  poem.notes.splice(noteIndex, 1);
  renderNotesList(idx);
  checkChanges();
  updatePoemFieldHighlights(idx);
  renderPoemList();
}

// ─── 폼 변경 → DATA 즉시 반영 ──────────────
function onPoemFormChange(e) {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;

  const poem = DATA.poem[idx];
  if (!poem) return;

  const el = e.target;
  const field = el.dataset?.field;
  if (!field) return;  // 주석 필드는 별도 처리

  // 중첩 필드 처리 (예: "title.zh" → poem.title.zh)
  const parts = field.split(".");
  let target = poem;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!target[parts[i]]) target[parts[i]] = {};
    target = target[parts[i]];
  }

  const lastKey = parts[parts.length - 1];

  // 값 할당
  if (field === "meter") {
    target[lastKey] = Number(el.value);
  } else {
    target[lastKey] = el.value;
  }

  // 편집 헤더 갱신
  if (field === "title.zh" || field === "poet.zh") {
    document.getElementById("poem-edit-title").textContent =
      `${poem.poemNoStr || ""} — ${poem.title?.zh || ""} (${normalizePoetNameForPoem(poem.poet?.zh)})`;
  }

  // 변경 감지 + 목록 갱신
  updatePoemFieldHighlights(idx);
  renderPoemList();
  checkChanges();
}

// ─── 변경 감지 ──────────────────────────────
function isPoemModified(index) {
  if (!ORIGINAL.poem || !ORIGINAL.poem[index]) return false;
  return JSON.stringify(DATA.poem[index]) !== JSON.stringify(ORIGINAL.poem[index]);
}

function updatePoemFieldHighlights(index) {
  const orig = ORIGINAL.poem?.[index];
  if (!orig) return;

  const form = document.getElementById("poem-form");
  const inputs = form.querySelectorAll("[data-field]");

  inputs.forEach(el => {
    const field = el.dataset.field;
    const parts = field.split(".");

    let origVal = orig;
    let currVal = DATA.poem[index];

    for (const p of parts) {
      origVal = origVal?.[p];
      currVal = currVal?.[p];
    }

    const origStr = String(origVal ?? "");
    const currStr = String(currVal ?? "");
    el.classList.toggle("modified-field", origStr !== currStr);
  });
}

// ─── 이 시 확정 (메모리 저장) ────────────────
function confirmCurrentPoem() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;

  const poem = DATA.poem[idx];
  if (!poem) return;

  // 현재 DATA 상태를 ORIGINAL에 반영 → 이 시는 "변경 없음" 상태가 됨
  ORIGINAL.poem[idx] = structuredClone(poem);
  updatePoemFieldHighlights(idx);
  renderPoemList();
  checkChanges();

  const title = poem.title?.zh || poem.title?.ko || poem.poemNoStr;
  showToast(`"${title}" 확정 완료 (메모리 저장됨)`);
}

// ─── 시 되돌리기 ────────────────────────────
function revertCurrentPoem() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;

  const orig = ORIGINAL.poem?.[idx];
  if (!orig) return;

  if (!confirm("이 시의 변경사항을 모두 되돌리시겠습니까?")) return;

  DATA.poem[idx] = structuredClone(orig);
  selectPoem(idx);
  renderPoemList();
  checkChanges();
  showToast("되돌리기 완료");
}

// ─── TTS 재생 ───────────────────────────────
function playTts(speed) {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  const btnId = speed === "normal" ? "btn-tts-normal" : "btn-tts-slow";
  const btn = document.getElementById(btnId);

  // 현재 재생 중인 것을 다시 누르면 정지
  if (currentTtsBtn === btn && currentTtsAudio && !currentTtsAudio.paused) {
    stopTts();
    return;
  }

  // 기존 재생 정지
  stopTts();

  const src = `../public/audio/${poem.poemNoStr}_${speed}.mp3`;
  const audio = new Audio(src);

  currentTtsAudio = audio;
  currentTtsBtn = btn;

  btn.classList.add("playing");
  btn.querySelector(".tts-icon").innerHTML = "&#9724;";
  document.getElementById("tts-status").textContent = speed === "normal" ? "재생 중..." : "느리게 재생 중...";

  audio.play().catch(() => {
    document.getElementById("tts-status").textContent = "파일 없음";
    stopTts();
  });

  audio.onended = () => {
    stopTts();
  };
}

function stopTts() {
  if (currentTtsAudio) {
    currentTtsAudio.pause();
    currentTtsAudio.currentTime = 0;
    currentTtsAudio = null;
  }
  if (currentTtsBtn) {
    currentTtsBtn.classList.remove("playing");
    currentTtsBtn.querySelector(".tts-icon").innerHTML = "&#9654;";
    currentTtsBtn = null;
  }
  document.getElementById("tts-status").textContent = "";
}

// ─── HTML 이스케이프 (속성용) ─────────────────
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ═══════════════════════════════════════════════
//  간체자/병음/평측 자동 생성
// ═══════════════════════════════════════════════

// 번체 → 간체 매핑 (298자)
const TRAD_TO_SIMP = {
  "萬":"万","與":"与","嚴":"严","葉":"叶","劉":"刘","吳":"吴","國":"国",
  "圍":"围","圖":"图","壽":"寿","夢":"梦","張":"张","彥":"彦","後":"后",
  "從":"从","復":"复","徵":"征","應":"应","慶":"庆","戰":"战","戶":"户",
  "揚":"扬","擇":"择","擬":"拟","擴":"扩","數":"数","斂":"敛","於":"于",
  "時":"时","晉":"晋","晝":"昼","會":"会","曉":"晓","書":"书","東":"东",
  "條":"条","樂":"乐","權":"权","標":"标","機":"机","檢":"检","歐":"欧",
  "歷":"历","歲":"岁","殘":"残","氣":"气","漢":"汉","無":"无","爲":"为",
  "牆":"墙","獨":"独","現":"现","瑤":"瑶","畫":"画","畢":"毕","當":"当",
  "盧":"卢","眾":"众","硯":"砚","禮":"礼","祕":"秘","稅":"税","稱":"称",
  "穎":"颖","竇":"窦","筆":"笔","簫":"箫","簡":"简","粵":"粤","紛":"纷",
  "終":"终","緒":"绪","經":"经","網":"网","羅":"罗","罷":"罢","羣":"群",
  "習":"习","聖":"圣","聞":"闻","聯":"联","肅":"肃","腦":"脑","臨":"临",
  "興":"兴","臺":"台","蔣":"蒋","蕭":"萧","處":"处","號":"号","蘇":"苏",
  "虛":"虚","蝕":"蚀","衛":"卫","複":"复","覺":"觉","訓":"训","記":"记",
  "評":"评","詩":"诗","話":"话","詳":"详","語":"语","說":"说","請":"请",
  "論":"论","譯":"译","護":"护","讀":"读","豐":"丰","貝":"贝","負":"负",
  "貴":"贵","費":"费","資":"资","賈":"贾","賓":"宾","賞":"赏","賴":"赖",
  "輕":"轻","輩":"辈","輿":"舆","轟":"轰","辦":"办","辭":"辞","選":"选",
  "遙":"遥","遞":"递","邊":"边","鄉":"乡","鄒":"邹","鄭":"郑","釋":"释",
  "錄":"录","鍾":"钟","鎮":"镇","長":"长","門":"门","開":"开","閔":"闵",
  "閣":"阁","隊":"队","陽":"阳","陳":"陈","隨":"随","雙":"双","雜":"杂",
  "靈":"灵","靜":"静","韓":"韩","韋":"韦","頁":"页","項":"项","頌":"颂",
  "顧":"顾","顯":"显","顥":"颢","風":"风","馬":"马","馮":"冯","驚":"惊",
  "體":"体","鬱":"郁","魯":"鲁","鮑":"鲍","鳳":"凤","鶴":"鹤","黃":"黄",
  "齊":"齐","齡":"龄","龐":"庞","島":"岛","適":"适","參":"参",
  // 추가 이체자 (평측 스크립트에서 발견)
  "値":"值","偸":"偷","卻":"却","卽":"即","吞":"吞","塚":"冢",
  "尙":"尚","屛":"屏","嶽":"岳","強":"强","慎":"慎","戲":"戏",
  "插":"插","舉":"举","教":"教","晚":"晚","冰":"冰","清":"清",
  "為":"为","床":"床","佩":"佩","疏":"疏","杯":"杯","真":"真",
  "絕":"绝","眾":"众","裏":"里","回":"回","迥":"迥","郎":"郎",
  "鄰":"邻","青":"青","顏":"颜","飲":"饮","鬥":"斗","雞":"鸡",
  "鴻":"鸿","鶯":"莺","鷗":"鸥","鸚":"鹦","鵡":"鹉","歸":"归",
  "對":"对","觀":"观","點":"点","麗":"丽","龍":"龙","亂":"乱",
  "傳":"传","僅":"仅","億":"亿","優":"优","儀":"仪","兒":"儿",
  "內":"内","問":"问","園":"园","場":"场","報":"报","塵":"尘",
  "壓":"压","學":"学","寶":"宝","將":"将","層":"层","嶺":"岭",
  "帶":"带","廟":"庙","彈":"弹","態":"态","懷":"怀","戀":"恋",
  "搖":"摇","損":"损","搶":"抢","摯":"挚","斷":"断","暫":"暂",
  "構":"构","歡":"欢","歎":"叹","殺":"杀","減":"减","溫":"温",
  "滿":"满","漸":"渐","濃":"浓","營":"营","獻":"献","環":"环",
  "確":"确","禪":"禅","積":"积","穩":"稳","紅":"红","純":"纯",
  "細":"细","結":"结","給":"给","續":"续","縣":"县","總":"总",
  "織":"织","繞":"绕","義":"义","翹":"翘","職":"职","腳":"脚",
  "華":"华","萊":"莱","蘭":"兰","蟲":"虫","補":"补","裝":"装",
  "規":"规","覽":"览","觸":"触","計":"计","設":"设","認":"认",
  "議":"议","讓":"让","變":"变","豬":"猪","趨":"趋","車":"车",
  "軍":"军","轉":"转","農":"农","運":"运","過":"过","達":"达",
  "違":"违","遠":"远","鋼":"钢","錢":"钱","鑑":"鉴","關":"关",
  "難":"难","雲":"云","電":"电","響":"响","頭":"头","額":"额",
  "飛":"飞","養":"养","驗":"验","髮":"发","鬧":"闹"
};

function tradToSimp(text) {
  return Array.from(text).map(ch => TRAD_TO_SIMP[ch] || ch).join("");
}

// 평수운 char_map (비동기 로드)
let _pingshuiCharMap = null;

async function loadPingshuiCharMap() {
  if (_pingshuiCharMap) return _pingshuiCharMap;
  try {
    const res = await fetch("../public/index/pingshui_yun.json");
    const data = await res.json();
    _pingshuiCharMap = data.char_map || {};
    return _pingshuiCharMap;
  } catch {
    console.error("pingshui_yun.json 로드 실패");
    return {};
  }
}

// 평측 카테고리
const PINGZE_CATEGORIES = new Set(["五言律詩", "七言律詩", "五言絶句", "七言絶句"]);

async function generatePinyinPingze() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  const statusEl = document.getElementById("gen-pinyin-status");
  statusEl.textContent = "생성 중...";

  try {
    // 원문에서 주석번호 제거
    const cleanText = (poem.poemZh || "").replace(/\[\d+\]/g, "");
    const lines = cleanText.split("\n").filter(l => l.trim());

    // 1. 간체자 변환
    const simpLines = lines.map(l => tradToSimp(l));
    poem.poemSimp = simpLines.join("\n");

    // 2. 병음 생성 (pinyin-pro CDN)
    if (typeof pinyinPro !== "undefined" && pinyinPro.pinyin) {
      const pinyinLines = simpLines.map(l => {
        const chars = Array.from(l).filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
        if (chars.length === 0) return "";
        return pinyinPro.pinyin(chars.join(""), { toneType: "symbol", type: "array" }).join(" ");
      });
      poem.pinyin = pinyinLines.join("\n");
    } else {
      statusEl.textContent = "pinyin-pro 미로드";
      return;
    }

    // 3. 평측 생성 (절구/율시만)
    if (PINGZE_CATEGORIES.has(poem.category)) {
      const charMap = await loadPingshuiCharMap();
      const pingzeLines = lines.map(l => {
        const chars = Array.from(l).filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
        return chars.map(ch => {
          const info = charMap[ch];
          return info ? info.tone : "?";
        }).join("");
      });
      poem.pingze = pingzeLines.join("\n");
    } else {
      poem.pingze = "";
    }

    // 4. 제목 간체자 + 병음
    const titleZhRaw = (poem.title && poem.title.zh) ? poem.title.zh.replace(/\[\d+\]/g, "").replace(/[〈〉《》]/g, "").trim() : "";
    if (titleZhRaw) {
      poem.titleSimp = tradToSimp(titleZhRaw);
      const titleChars = Array.from(poem.titleSimp).filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
      if (titleChars.length > 0) {
        poem.titlePinyin = pinyinPro.pinyin(titleChars.join(""), { toneType: "symbol", type: "array" }).join(" ");
      }
    }

    // 5. 시인 간체자 + 병음
    const poetZhRaw = (poem.poet && poem.poet.zh) ? poem.poet.zh.replace(/\[\d+\]/g, "").trim() : "";
    if (poetZhRaw) {
      poem.poetSimp = tradToSimp(poetZhRaw);
      const poetChars = Array.from(poem.poetSimp).filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
      if (poetChars.length > 0) {
        poem.poetPinyin = pinyinPro.pinyin(poetChars.join(""), { toneType: "symbol", type: "array" }).join(" ");
      }
    }

    // 폼 업데이트
    document.getElementById("pf-poemSimp").value = poem.poemSimp;
    document.getElementById("pf-pinyin").value = poem.pinyin;
    document.getElementById("pf-pingze").value = poem.pingze;

    checkChanges();
    updatePoemFieldHighlights(idx);
    renderPoemList();
    updatePreviewLive();
    statusEl.textContent = "완료!";
  } catch (err) {
    statusEl.textContent = "오류: " + err.message;
  }
}

// ═══════════════════════════════════════════════
//  유튜브 링크 관리
// ═══════════════════════════════════════════════

function renderYoutubeList(index) {
  const poem = DATA.poem[index];
  const yt = (poem.media && Array.isArray(poem.media.youtube)) ? poem.media.youtube : [];
  const container = document.getElementById("pf-youtube-list");
  const countEl = document.getElementById("pf-yt-count");
  countEl.textContent = String(yt.length);

  if (yt.length === 0) {
    container.innerHTML = '<div style="font-style:italic; color:#999; font-size:13px">유튜브 링크 없음</div>';
    return;
  }

  container.innerHTML = yt.map((url, i) => `
    <div class="yt-edit-item" data-yt-idx="${i}">
      <input type="url" class="yt-url-input" value="${escapeAttr(url)}"
             placeholder="https://youtu.be/..." data-yt-idx="${i}">
      <button type="button" class="btn-del-yt" data-yt-idx="${i}" title="삭제">&times;</button>
    </div>
  `).join("");

  // 삭제 + 수정 이벤트 위임
  container.onclick = (e) => {
    const delBtn = e.target.closest(".btn-del-yt");
    if (!delBtn) return;
    const yi = Number(delBtn.dataset.ytIdx);
    removeYoutubeLink(yi);
  };

  container.oninput = (e) => {
    const input = e.target.closest(".yt-url-input");
    if (!input) return;
    const yi = Number(input.dataset.ytIdx);
    const poem2 = DATA.poem[PoemManager.selectedIndex];
    if (poem2?.media?.youtube && poem2.media.youtube[yi] !== undefined) {
      poem2.media.youtube[yi] = input.value;
      checkChanges();
      updatePoemFieldHighlights(PoemManager.selectedIndex);
    }
  };
}

function addYoutubeLink() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  if (!poem.media || typeof poem.media !== "object") poem.media = {};
  if (!Array.isArray(poem.media.youtube)) poem.media.youtube = [];

  poem.media.youtube.push("");
  renderYoutubeList(idx);
  checkChanges();
  updatePoemFieldHighlights(idx);

  // 새로 추가된 입력에 포커스
  const inputs = document.querySelectorAll(".yt-url-input");
  if (inputs.length) inputs[inputs.length - 1].focus();
}

function removeYoutubeLink(ytIndex) {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem?.media?.youtube) return;

  poem.media.youtube.splice(ytIndex, 1);
  if (poem.media.youtube.length === 0) delete poem.media.youtube;
  renderYoutubeList(idx);
  checkChanges();
  updatePoemFieldHighlights(idx);
  renderPoemList();
}

function searchYoutube() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  // 간체자로 변환하여 검색 (경험상 간체가 결과 좋음)
  const poetZh = normalizePoetNameForPoem(poem.poet?.zh || "");
  const titleZh = normalizePoetNameForPoem(poem.title?.zh || "")
    .replace(/〈|〉/g, "").trim();

  const simpPoet = tradToSimp(poetZh);
  const simpTitle = tradToSimp(titleZh);
  const query = encodeURIComponent(`${simpPoet} ${simpTitle} 朗诵`);

  window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
}

// ═══════════════════════════════════════════════
//  배경 그림 관리
// ═══════════════════════════════════════════════

function renderBgImage(index) {
  const poem = DATA.poem[index];
  const bgImage = poem.bgImage || "";
  const thumb = document.getElementById("pf-bg-thumb");
  const emptyMsg = document.getElementById("pf-bg-empty");
  const delBtn = document.getElementById("btn-bg-delete");

  if (bgImage) {
    const bgUrl = getBgImageUrl(poem);
    thumb.src = bgUrl;
    thumb.hidden = false;
    if (!poem.textBoxStyle?.imageRatio) {
      detectImageRatio(bgUrl, (ratio) => {
        if (!poem.textBoxStyle) poem.textBoxStyle = {};
        poem.textBoxStyle.imageRatio = ratio;
      });
    }
    emptyMsg.hidden = true;
    delBtn.hidden = false;
  } else {
    thumb.src = "";
    thumb.hidden = true;
    emptyMsg.hidden = false;
    delBtn.hidden = true;
  }
}

function handleBgFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  // 파일명 = titleId.jpg (Midjourney 생성기와 통일)
  const titleId = poem.titleId || `C${poem.poemNoStr}`;
  const filename = `${titleId}.jpg`;
  poem.bgImage = filename;

  // 메모리에 DataURL 저장 → 미리보기에서 사용
  const reader = new FileReader();
  reader.onload = () => {
    BG_IMAGE_MEMORY.set(titleId, reader.result);
    detectImageRatio(reader.result, (ratio) => {
      if (!poem.textBoxStyle) poem.textBoxStyle = {};
      poem.textBoxStyle.imageRatio = ratio;
      updatePreviewLive();
    });
    const thumb = document.getElementById("pf-bg-thumb");
    thumb.src = reader.result;
    thumb.hidden = false;
    document.getElementById("pf-bg-empty").hidden = true;
    document.getElementById("btn-bg-delete").hidden = false;
    showToast(`배경 그림 설정: ${filename} (메모리에 저장됨)`);
  };
  reader.readAsDataURL(file);

  checkChanges();
  updatePoemFieldHighlights(idx);
  e.target.value = "";
}

function handleBgPaste() {
  const url = prompt("배경 그림 URL을 입력하세요:");
  if (!url) return;

  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  // titleId.jpg (Midjourney 생성기와 통일)
  const titleId = poem.titleId || `C${poem.poemNoStr}`;
  poem.bgImage = `${titleId}.jpg`;

  // URL을 메모리에 저장
  BG_IMAGE_MEMORY.set(titleId, url);
  detectImageRatio(url, (ratio) => {
    if (!poem.textBoxStyle) poem.textBoxStyle = {};
    poem.textBoxStyle.imageRatio = ratio;
    updatePreviewLive();
  });

  const thumb = document.getElementById("pf-bg-thumb");
  thumb.src = url;
  thumb.hidden = false;
  document.getElementById("pf-bg-empty").hidden = true;
  document.getElementById("btn-bg-delete").hidden = false;

  checkChanges();
  updatePoemFieldHighlights(idx);
}

function deleteBgImage() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  if (!confirm("배경 그림을 삭제하시겠습니까?")) return;

  const titleId = poem.titleId || `C${poem.poemNoStr}`;
  BG_IMAGE_MEMORY.delete(titleId);

  poem.bgImage = "";
  poem.textPosition = { x: 5, y: 10 };
  poem.textBoxStyle = {};

  renderBgImage(idx);
  checkChanges();
  updatePoemFieldHighlights(idx);
  showToast("배경 그림 삭제됨");
}

// ═══════════════════════════════════════════════
//  공용 유틸 (app.js 동일 로직)
// ═══════════════════════════════════════════════

function hexToRgbAdmin(hex) {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}

function normalizeZhNameAdmin(s) {
  return String(s || "").replace(/\[\d+\]/g, "");
}

function hideDaggersAdmin(escapedHTML) {
  return escapedHTML.replace(/†/g, '<span class="note-dagger">†</span>');
}

// 랜덤 배경이미지 목록
const RANDOM_BG_LIST = ["sample1.jpg", "sample2.jpg", "sample3.jpg", "sample4.jpg"];
function getRandomBgFilename(poemNo) {
  const idx = (parseInt(poemNo, 10) || 0) % RANDOM_BG_LIST.length;
  return RANDOM_BG_LIST[idx];
}

// 주석 파싱 (app.js parseTextWithNotes 동일 로직)
function parseTextWithNotesAdmin(text, notes, titleId, noteSource = "legacy") {
  if (!text) return "";
  if (!Array.isArray(notes) || notes.length === 0) return escapeHTMLAdmin(text);
  const sourceKey = noteSource === "owned" ? "owned" : "legacy";
  const noteWordClass = `note-word note-word-${sourceKey}`;
  const noteRefClass = `note-ref note-ref-${sourceKey}`;
  const notesByNo = new Map(notes.map(n => [String(n.no), n]));
  const pattern = /\[(\d+)\]/g;
  const matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length, noteNo: match[1] });
  }
  if (matches.length === 0) return escapeHTMLAdmin(text);
  for (const m of matches) {
    const note = notesByNo.get(m.noteNo);
    if (!note || !note.head) continue;
    const head = note.head;
    const headStart = m.index - head.length;
    if (headStart >= 0 && text.substring(headStart, m.index) === head) {
      m.headStart = headStart;
      m.headLength = head.length;
      m.noteText = note.text;
    }
  }
  let result = "";
  let lastIndex = text.length;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    result = escapeHTMLAdmin(text.substring(m.index + m.length, lastIndex)) + result;
    const uniqueId = titleId ? `${titleId}-${m.noteNo}` : m.noteNo;
    if (m.headStart !== undefined) {
      const keyword = text.substring(m.headStart, m.index);
      result =
        `<span class="${noteWordClass}" id="note-ref-${uniqueId}" data-note-no="${m.noteNo}" data-note-text="${escapeHTMLAdmin(m.noteText)}">${escapeHTMLAdmin(keyword)}</span>` +
        `<sup class="${noteRefClass}">${m.noteNo}</sup>` + result;
      lastIndex = m.headStart;
    } else {
      result = `<sup class="${noteRefClass}" id="note-ref-${uniqueId}">${m.noteNo}</sup>` + result;
      lastIndex = m.index;
    }
  }
  result = escapeHTMLAdmin(text.substring(0, lastIndex)) + result;
  return result;
}

function stripInlineNoteMarkersAdmin(text) {
  return String(text || "").replace(/\[\d+\]/g, "");
}

function injectNoteMarkersByHeadAdmin(text, notes) {
  let base = stripInlineNoteMarkersAdmin(text);
  if (!base) return "";
  if (!Array.isArray(notes) || notes.length === 0) return base;

  const ordered = notes
    .map((n) => ({
      no: String(n?.no ?? "").trim(),
      head: String(n?.head ?? "").trim(),
    }))
    .filter((n) => n.no && n.head)
    .sort((a, b) => b.head.length - a.head.length);

  const usedNo = new Set();
  for (const n of ordered) {
    if (usedNo.has(n.no)) continue;
    const marker = `[${n.no}]`;
    if (base.includes(marker)) {
      usedNo.add(n.no);
      continue;
    }
    const idx = base.indexOf(n.head);
    if (idx < 0) continue;
    const insertAt = idx + n.head.length;
    base = `${base.slice(0, insertAt)}${marker}${base.slice(insertAt)}`;
    usedNo.add(n.no);
  }

  return base;
}

function cleanLegacyKoReferencesAdmin(text) {
  return String(text || "")
    .replace(/\[역주\s*\d*\]/g, "")
    .replace(/\(역주\s*\d*\)/g, "")
    .replace(/역주\s*\d*/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// YouTube ID 추출
function extractYoutubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?#\s]+)/);
  return m ? m[1] : null;
}

// 이미지 비율 감지 (width/height)
function detectImageRatio(url, callback) {
  const img = new Image();
  img.onload = () => callback(img.naturalWidth / img.naturalHeight);
  img.onerror = () => callback(0);
  img.src = url;
}

// 배경 이미지 URL 가져오기: 메모리 → 파일 경로 → 랜덤
function getBgImageUrl(poem) {
  const titleId = poem.titleId || `C${poem.poemNoStr}`;
  if (BG_IMAGE_MEMORY.has(titleId)) return BG_IMAGE_MEMORY.get(titleId);
  if (poem.bgImage) return `../public/assets/poem-bg/${poem.bgImage}`;
  // 랜덤 배경
  const poemNo = poem.poemNoStr || String(poem.poemNo ?? "").padStart(3, "0");
  return `../public/assets/backgrounds/random/${getRandomBgFilename(poemNo)}`;
}

function renderPoemPreview(poem) {
  const esc = escapeHTMLAdmin;
  const poemNoStr = poem.poemNoStr || String(poem.poemNo ?? "").padStart(3, "0");
  const ownedNotes = Array.isArray(poem.notesOwned) ? poem.notesOwned : [];
  const legacyNotes = Array.isArray(poem.notes) ? poem.notes : [];
  const useOwnedNotes = ownedNotes.length > 0;
  const notes = useOwnedNotes ? ownedNotes : legacyNotes;
  const noteSource = useOwnedNotes ? "owned" : "legacy";
  const titleId = poem.titleId || "";

  // 주석 파싱 적용
  const titleFullRaw = poem?.title?.zh ?? "";
  const titleSource = useOwnedNotes
    ? injectNoteMarkersByHeadAdmin(normalizeZhNameAdmin(titleFullRaw), notes)
    : normalizeZhNameAdmin(titleFullRaw);
  const titleParsed = parseTextWithNotesAdmin(titleSource, notes, titleId, noteSource);
  const poetZh = poem?.poet?.zh ?? "";
  const poetZhSource = useOwnedNotes ? injectNoteMarkersByHeadAdmin(poetZh, notes) : poetZh;
  const meta = [poem.category, poem.juan, poem.meter ? `${poem.meter}언` : ""].filter(Boolean).join(" · ");

  // 본문 + 집평 주석 파싱
  const poemZhSource = useOwnedNotes
    ? injectNoteMarkersByHeadAdmin(poem.poemZh || "", notes)
    : (poem.poemZh || "");
  const jipZhSource = useOwnedNotes
    ? injectNoteMarkersByHeadAdmin(poem.jipyeongZh || "", notes)
    : (poem.jipyeongZh || "");
  let poemZh = parseTextWithNotesAdmin(poemZhSource, notes, titleId, noteSource);
  const jipZh = parseTextWithNotesAdmin(jipZhSource, notes, titleId, noteSource);
  const trKo = esc(poem.translationKoOwned || poem.translationKo || "");
  const jipKo = esc(cleanLegacyKoReferencesAdmin(poem.jipyeongKoOwned || poem.jipyeongKo || ""));

  // 주석 리스트
  const notesHTML = notes.length
    ? `<ul class="note-list">${notes.map(n => `
        <li class="note-item" id="note-item-${titleId}-${n.no}">
          <span class="note-no" data-target-ref="${titleId}-${n.no}">[${esc(n.no)}]</span>
          <span class="note-head">${esc(n.head || "")}</span>
          <span class="note-text">${esc(n.text || "")}</span>
        </li>
      `).join("")}</ul>`
    : `<div class="muted">주석 없음</div>`;

  // 배경 그림 (항상 있음 — 없으면 랜덤)
  const bgImage = poem.bgImage || "";
  const textPos = poem.textPosition || { x: 5, y: 10 };
  const boxStyle = poem.textBoxStyle || {};
  const boxBg = boxStyle.bgColor || "#000000";
  const boxOpacity = boxStyle.opacity != null ? boxStyle.opacity : 0.6;
  const boxRadius = boxStyle.borderRadius || 8;
  const boxPadding = boxStyle.padding || 16;
  const boxAlignH = boxStyle.alignH || "left";
  const boxAlignV = boxStyle.alignV || "top";
  const jcMap = { top: "flex-start", center: "center", bottom: "flex-end" };

  // 에디터 스타일
  const edFont = boxStyle.fontFamily || "fangsong";
  const edSize = boxStyle.fontSize || 18;
  const edWeight = boxStyle.fontWeight || "normal";
  const edStyle = boxStyle.fontStyle || "normal";
  const edDeco = boxStyle.textDecoration || "none";

  // 캔버스 크기 (이미지 비율 기반)
  const canvasW = boxStyle.canvasWidth || null;
  const imgRatio = boxStyle.imageRatio || 0;
  let canvasExtraStyle = '';
  if (canvasW) {
    canvasExtraStyle = `width:${canvasW}px;background-size:100% 100%;min-height:0;`;
    if (imgRatio) canvasExtraStyle += `aspect-ratio:${imgRatio};height:auto;`;
  }

  // 제목+시인 (본문 상단)
  const titleDisplay = `<div class="poem-body-title">${titleParsed}</div>`;
  const poetDisplay = `<div class="poem-body-poet">${parseTextWithNotesAdmin(poetZhSource, notes, titleId, noteSource)}</div>`;

  // 본문 HTML (배경 그림 모드)
  const bgUrl = getBgImageUrl(poem);
  const poemBodyHTML = `
    <div class="block-box poem-bg-wrap" id="pv-bg-canvas" style="background-image:url('${bgUrl}');${canvasExtraStyle}">
      <div class="poem-text-overlay pv-draggable" id="pv-text-box" style="
        left:${textPos.x}%;top:${textPos.y}%;
        background:rgba(${hexToRgbAdmin(boxBg)},${boxOpacity});
        border-radius:${boxRadius}px;padding:${boxPadding}px;
        text-align:${boxAlignH};
        justify-content:${jcMap[boxAlignV] || 'flex-start'};
        font-family:${edFont},'LXGW WenKai Mono TC','Noto Serif TC',serif;
        font-size:${edSize}px;font-weight:${edWeight};
        font-style:${edStyle};text-decoration:${edDeco};
      ">${titleDisplay}${poetDisplay}<div class="poem-body-text">${poemZh}</div></div>
    </div>`;

  // 심화자료
  const poemSimpRaw = poem.poemSimp || "";
  const pinyinRaw = poem.pinyin || "";
  const pingzeRaw = poem.pingze || "";
  const ytLinks = (poem.media && Array.isArray(poem.media.youtube)) ? poem.media.youtube : [];

  // 제목/시인 병음 루비
  const titleSimp = poem.titleSimp || "";
  const titlePinyin = poem.titlePinyin || "";
  const poetSimp = poem.poetSimp || "";
  const poetPinyin = poem.poetPinyin || "";

  function buildRuby(simp, pinyin) {
    if (!simp || !pinyin) return "";
    const chars = Array.from(simp).filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
    const syllables = pinyin.split(/\s+/).filter(Boolean);
    let ruby = "";
    for (let i = 0; i < chars.length; i++) {
      ruby += `<ruby>${esc(chars[i])}<rp>(</rp><rt>${esc(syllables[i] || "")}</rt><rp>)</rp></ruby>`;
    }
    return ruby;
  }

  // 병음
  let pinyinHTML = "";
  if (poemSimpRaw || pinyinRaw) {
    const titleRuby = buildRuby(titleSimp, titlePinyin);
    const poetRuby = buildRuby(poetSimp, poetPinyin);
    const titleLine = titleRuby ? `<div class="ruby-title">${titleRuby}</div>` : "";
    const poetLine = poetRuby ? `<div class="ruby-poet">${poetRuby}</div>` : "";

    const simpLines = poemSimpRaw.split("\n");
    const pinyinLines = pinyinRaw.split("\n");
    const maxLen = Math.max(simpLines.length, pinyinLines.length);
    let rows = "";
    for (let li = 0; li < maxLen; li++) {
      const chars = Array.from(simpLines[li] || "").filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
      const syllables = (pinyinLines[li] || "").split(/\s+/).filter(Boolean);
      let lineRuby = "";
      for (let ci = 0; ci < chars.length; ci++) {
        lineRuby += `<ruby>${esc(chars[ci])}<rp>(</rp><rt>${esc(syllables[ci] || "")}</rt><rp>)</rp></ruby>`;
      }
      rows += `<div class="ruby-line">${lineRuby}</div>`;
    }
    pinyinHTML = `
      ${titleLine}${poetLine}
      <div class="ruby-grid">${rows}</div>
      <div class="tts-label">보통화(普通話) 시 낭송 듣기</div>
      <div class="tts-player" data-poem-no="${esc(poemNoStr)}">
        <button type="button" class="tts-btn" data-speed="normal"><span class="tts-icon">&#9654;</span> 정상속도</button>
        <button type="button" class="tts-btn" data-speed="slow"><span class="tts-icon">&#9654;</span> 느리게</button>
        <span class="tts-status"></span>
      </div>`;
  }

  // 평측
  let pingzeHTML = "";
  if (pingzeRaw && poemSimpRaw) {
    const simpLines = poemSimpRaw.split("\n");
    const pingzeLines = pingzeRaw.split("\n");
    const maxLen = Math.max(simpLines.length, pingzeLines.length);
    let rows = "";
    for (let li = 0; li < maxLen; li++) {
      const chars = Array.from(simpLines[li] || "").filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
      const tones = Array.from(pingzeLines[li] || "");
      let lineRuby = "";
      for (let ci = 0; ci < chars.length; ci++) {
        const tone = tones[ci] || "";
        const cls = tone === "平" ? "tone-ping" : tone === "仄" ? "tone-ze" : "";
        lineRuby += `<ruby class="${cls}">${esc(chars[ci])}<rp>(</rp><rt>${esc(tone)}</rt><rp>)</rp></ruby>`;
      }
      rows += `<div class="ruby-line">${lineRuby}</div>`;
    }
    pingzeHTML = `<div class="ruby-grid pingze">${rows}</div>`;
  }

  // YouTube 임베드
  let mediaHTML = "";
  if (ytLinks.length > 0) {
    mediaHTML = ytLinks.map(url => {
      const vid = extractYoutubeId(url);
      if (!vid) return "";
      return `<div class="yt-embed-wrap"><iframe src="https://www.youtube.com/embed/${esc(vid)}"
        frameborder="0" allowfullscreen loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    }).filter(Boolean).join("");
  }

  // 심화자료 2컬럼 레이아웃
  let deepContentHTML = "";
  if (pinyinHTML && pingzeHTML) {
    deepContentHTML = `
      <div class="deep-two-col">
        <div class="poem-block"><div class="block-title">간체자 &amp; 병음</div><div class="block-box">${pinyinHTML}</div></div>
        <div class="poem-block"><div class="block-title">평측</div><div class="block-box">${pingzeHTML}</div></div>
      </div>
      ${mediaHTML ? `<div class="poem-block"><div class="block-title">YouTube 낭송</div><div class="block-box">${mediaHTML}</div></div>` : ""}`;
  } else if (pinyinHTML && !pingzeHTML && mediaHTML) {
    deepContentHTML = `
      <div class="deep-two-col">
        <div class="poem-block"><div class="block-title">간체자 &amp; 병음</div><div class="block-box">${pinyinHTML}</div></div>
        <div class="poem-block"><div class="block-title">YouTube 낭송</div><div class="block-box">${mediaHTML}</div></div>
      </div>`;
  } else {
    deepContentHTML = `
      ${pinyinHTML ? `<div class="poem-block"><div class="block-title">간체자 &amp; 병음</div><div class="block-box">${pinyinHTML}</div></div>` : ""}
      ${pingzeHTML ? `<div class="poem-block"><div class="block-title">평측</div><div class="block-box">${pingzeHTML}</div></div>` : ""}
      ${mediaHTML ? `<div class="poem-block"><div class="block-title">YouTube 낭송</div><div class="block-box">${mediaHTML}</div></div>` : ""}`;
  }

  // 배경그림 유무에 따라 hero 영역 분기
  const hasImage = !!bgImage;
  const heroClass = hasImage ? 'poem-hero' : 'poem-hero-plain';
  const heroStyleAttr = hasImage ? `style="background-image:url('${bgUrl}')"` : '';

  return `
    <div class="poem-body" style="display:flex;flex-direction:column;gap:0;">
      <div class="${heroClass}" ${heroStyleAttr}>
        <div class="poem-hero-text">
          ${titleDisplay}${poetDisplay}<div class="poem-body-text">${poemZh}</div>
        </div>
      </div>

      ${trKo ? `
      <div class="poem-section-block poem-sec-translation">
        <div class="poem-sec-label">번역</div>
        <div class="poem-sec-text pre">${trKo}</div>
      </div>` : ''}

      ${jipZh ? `
      <div class="poem-section-block poem-sec-commentary">
        <div class="poem-sec-label">집평</div>
        <div class="poem-sec-text pre">${jipZh}</div>
      </div>` : ''}

      ${jipKo ? `
      <div class="poem-section-block poem-sec-commentary-tr">
        <div class="poem-sec-label">집평 번역</div>
        <div class="poem-sec-text pre">${jipKo}</div>
      </div>` : ''}

      <div class="poem-section-block poem-sec-notes">
        <div class="poem-sec-label">${useOwnedNotes ? "주석 (집필)" : "주석"}</div>
        <div class="poem-sec-text">${notesHTML}</div>
      </div>

      ${deepContentHTML ? `
      <div class="poem-section-block poem-sec-advanced">
        <div class="poem-sec-label">심화자료</div>
        ${deepContentHTML}
      </div>` : ''}
    </div>

    <div style="margin-top:12px;padding:12px;border:1px solid #ddd;border-radius:8px;background:#f8f8f8;">
      <div style="font-size:11px;color:#888;margin-bottom:8px;">배경그림 편집용 (구형 오버레이 뷰)</div>
      ${poemBodyHTML}
    </div>
  `;
}

// ═══════════════════════════════════════════
//  3컬럼 레이아웃: 리사이즈 핸들
// ═══════════════════════════════════════════
function initResizeHandles() {
  const split = document.querySelector(".poem-split");
  if (!split) return;

  const handle1 = document.getElementById("resize-handle-1");
  const handle2 = document.getElementById("resize-handle-2");
  const leftPane = document.getElementById("poem-list-pane");
  const midPane = document.getElementById("poem-edit-pane");

  function setupHandle(handle, leftEl, rightEl, leftMin, rightMin) {
    let dragging = false;
    let startX, startLeftW, startRightW;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startLeftW = leftEl.getBoundingClientRect().width;
      startRightW = rightEl.getBoundingClientRect().width;
      handle.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const newLeft = Math.max(leftMin, startLeftW + dx);
      const newRight = Math.max(rightMin, startRightW - dx);
      leftEl.style.flex = `0 0 ${newLeft}px`;
      rightEl.style.flex = `0 0 ${newRight}px`;
    });

    document.addEventListener("mouseup", () => {
      if (dragging) {
        dragging = false;
        handle.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    });
  }

  setupHandle(handle1, leftPane, midPane, 200, 300);
  setupHandle(handle2, midPane, document.getElementById("poem-preview-pane"), 300, 400);
}

// ═══════════════════════════════════════════
//  실시간 미리보기 갱신
// ═══════════════════════════════════════════
function updatePreviewLive() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  const previewBody = document.getElementById("preview-body");
  if (!previewBody) return;

  // 렌더링
  previewBody.innerHTML = renderPoemPreview(poem);

  // 축소 스케일 적용 (메인 사이트 모달 1400px 기준)
  applyPreviewScale();

  // 박스 컨트롤 항상 표시
  const boxCtrl = document.getElementById("box-controls");
  if (boxCtrl) boxCtrl.hidden = false;

  // 드래그 초기화
  initPvTextDrag("preview-body");

  // 주석 크로스링크 + 툴팁 바인딩
  bindPreviewNoteEvents(previewBody);
}

// 축소 스케일 계산 및 적용
function applyPreviewScale() {
  const previewBody = document.getElementById("preview-body");
  if (!previewBody) return;

  const containerWidth = previewBody.parentElement.clientWidth - 20; // 패딩 고려
  const contentWidth = 1400; // 메인 사이트 모달 폭
  const scale = Math.min(1, containerWidth / contentWidth);

  const inner = previewBody.firstElementChild;
  if (inner) {
    inner.style.width = contentWidth + "px";
    inner.style.transform = `scale(${scale})`;
    inner.style.transformOrigin = "top left";
    previewBody.style.height = (inner.scrollHeight * scale) + "px";
    previewBody.style.overflow = "hidden";
  }
}

// 주석 이벤트 바인딩 (미리보기용)
function bindPreviewNoteEvents(container) {
  // 크로스링크: 클릭 시 스크롤
  container.addEventListener("click", (e) => {
    const noteWord = e.target.closest(".note-word");
    const noteRef = e.target.closest(".note-ref");
    const noteNo = e.target.closest(".note-no");
    const noteHead = e.target.closest(".note-head");

    if (noteWord || noteRef) {
      const el = noteWord || noteRef;
      const fullId = el.id.replace("note-ref-", "");
      const target = container.querySelector(`#note-item-${fullId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("highlight-flash");
        setTimeout(() => target.classList.remove("highlight-flash"), 2000);
      }
      return;
    }

    if (noteNo || noteHead) {
      const noteItem = e.target.closest(".note-item");
      if (noteItem) {
        const fullId = noteItem.id.replace("note-item-", "");
        const targetRef = container.querySelector(`#note-ref-${fullId}`);
        if (targetRef) {
          targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
          targetRef.classList.add("highlight-flash");
          setTimeout(() => targetRef.classList.remove("highlight-flash"), 2000);
        }
      }
    }
  });

  // 툴팁: 호버
  container.addEventListener("mouseover", (e) => {
    const noteWord = e.target.closest(".note-word");
    if (!noteWord) return;
    const noteText = noteWord.dataset.noteText;
    if (!noteText) return;
    let tooltip = document.getElementById("admin-annotation-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "admin-annotation-tooltip";
      tooltip.className = "annotation-tooltip";
      tooltip.hidden = true;
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = noteText;
    tooltip.hidden = false;
    tooltip.style.position = "fixed";
    tooltip.style.top = (e.clientY + 10) + "px";
    tooltip.style.left = (e.clientX + 10) + "px";
  });

  container.addEventListener("mouseout", (e) => {
    if (!e.target.closest(".note-word")) return;
    const tooltip = document.getElementById("admin-annotation-tooltip");
    if (tooltip) tooltip.hidden = true;
  });
}

// ═══════════════════════════════════════════
//  에디터 툴바
// ═══════════════════════════════════════════
function loadEditorToolbar(poem) {
  const style = poem.textBoxStyle || {};
  // 폰트
  const font = style.fontFamily || "fangsong";
  const fontSel = document.getElementById("ed-font");
  for (const opt of fontSel.options) {
    if (font.includes(opt.value.replace(/'/g, ""))) { opt.selected = true; break; }
  }
  // 크기
  document.getElementById("ed-size").value = style.fontSize || 18;
  // 토글 버튼 상태
  document.getElementById("ed-bold").classList.toggle("active", style.fontWeight === "bold");
  document.getElementById("ed-italic").classList.toggle("active", style.fontStyle === "italic");
  document.getElementById("ed-underline").classList.toggle("active", style.textDecoration === "underline");
  // 정렬
  const alignH = style.alignH || "left";
  document.getElementById("ed-align-left").classList.toggle("active", alignH === "left");
  document.getElementById("ed-align-center").classList.toggle("active", alignH === "center");
  document.getElementById("ed-align-right").classList.toggle("active", alignH === "right");

  // 박스 컨트롤 값 로드
  document.getElementById("bg-ctrl-color").value = style.bgColor || "#000000";
  document.getElementById("bg-ctrl-opacity").value = style.opacity != null ? style.opacity : 0.6;
  document.getElementById("bg-ctrl-radius").value = style.borderRadius || 8;
  document.getElementById("bg-ctrl-padding").value = style.padding || 16;
  document.getElementById("bg-ctrl-opacity-val").textContent = (style.opacity != null ? style.opacity : 0.6).toFixed(2);
  document.getElementById("bg-ctrl-radius-val").textContent = (style.borderRadius || 8) + "px";
  document.getElementById("bg-ctrl-padding-val").textContent = (style.padding || 16) + "px";
  const widthSlider = document.getElementById("bg-ctrl-width");
  const widthLabel = document.getElementById("bg-ctrl-width-val");
  if (style.canvasWidth) {
    widthSlider.value = style.canvasWidth;
    widthLabel.textContent = style.canvasWidth + "px";
  } else {
    widthSlider.value = 800;
    widthLabel.textContent = "자동";
  }

  const ah = style.alignH || "left";
  const av = style.alignV || "top";
  const ahEl = document.querySelector(`input[name="bg-align-h"][value="${ah}"]`);
  const avEl = document.querySelector(`input[name="bg-align-v"][value="${av}"]`);
  if (ahEl) ahEl.checked = true;
  if (avEl) avEl.checked = true;
}

function onEditorChange() {
  saveEditorToPoem();
  applyEditorToPreview();
}

function toggleEditorBtn(id) {
  document.getElementById(id).classList.toggle("active");
  saveEditorToPoem();
  applyEditorToPreview();
}

function setEditorAlign(id) {
  ["ed-align-left","ed-align-center","ed-align-right"].forEach(a => {
    document.getElementById(a).classList.toggle("active", a === id);
  });
  saveEditorToPoem();
  applyEditorToPreview();
}

function saveEditorToPoem() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;
  if (!poem.textBoxStyle) poem.textBoxStyle = {};

  const s = poem.textBoxStyle;
  s.fontFamily = document.getElementById("ed-font").value;
  s.fontSize = parseInt(document.getElementById("ed-size").value) || 18;
  s.fontWeight = document.getElementById("ed-bold").classList.contains("active") ? "bold" : "normal";
  s.fontStyle = document.getElementById("ed-italic").classList.contains("active") ? "italic" : "normal";
  s.textDecoration = document.getElementById("ed-underline").classList.contains("active") ? "underline" : "none";

  if (document.getElementById("ed-align-center").classList.contains("active")) s.alignH = "center";
  else if (document.getElementById("ed-align-right").classList.contains("active")) s.alignH = "right";
  else s.alignH = "left";

  checkChanges();
}

function applyEditorToPreview() {
  const textBox = document.getElementById("pv-text-box");
  if (!textBox) return;
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const s = DATA.poem[idx]?.textBoxStyle || {};

  textBox.style.fontFamily = s.fontFamily || "fangsong";
  textBox.style.fontSize = (s.fontSize || 18) + "px";
  textBox.style.fontWeight = s.fontWeight || "normal";
  textBox.style.fontStyle = s.fontStyle || "normal";
  textBox.style.textDecoration = s.textDecoration || "none";
  textBox.style.textAlign = s.alignH || "left";
}

// ═══════════════════════════════════════════
//  박스 컨트롤 (실시간)
// ═══════════════════════════════════════════
function onBoxControlChange() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;
  if (!poem.textBoxStyle) poem.textBoxStyle = {};

  const color = document.getElementById("bg-ctrl-color").value;
  const opacity = parseFloat(document.getElementById("bg-ctrl-opacity").value);
  const radius = parseInt(document.getElementById("bg-ctrl-radius").value);
  const padding = parseInt(document.getElementById("bg-ctrl-padding").value);
  const alignH = document.querySelector('input[name="bg-align-h"]:checked')?.value || "left";
  const alignV = document.querySelector('input[name="bg-align-v"]:checked')?.value || "top";
  const cw = parseInt(document.getElementById("bg-ctrl-width").value) || null;

  // 값 표시 갱신
  document.getElementById("bg-ctrl-opacity-val").textContent = opacity.toFixed(2);
  document.getElementById("bg-ctrl-radius-val").textContent = radius + "px";
  document.getElementById("bg-ctrl-padding-val").textContent = padding + "px";
  document.getElementById("bg-ctrl-width-val").textContent = cw ? cw + "px" : "자동";

  // 데이터에 저장
  Object.assign(poem.textBoxStyle, {
    bgColor: color, opacity, borderRadius: radius, padding,
    alignH, alignV, canvasWidth: cw
  });

  // 인라인 미리보기 텍스트박스에 즉시 반영
  const textBox = document.getElementById("pv-text-box");
  if (textBox) {
    const [r, g, b] = [parseInt(color.substring(1,3),16), parseInt(color.substring(3,5),16), parseInt(color.substring(5,7),16)];
    textBox.style.background = `rgba(${r},${g},${b},${opacity})`;
    textBox.style.borderRadius = radius + "px";
    textBox.style.padding = padding + "px";
    textBox.style.textAlign = alignH;
    const jcMap = { top: "flex-start", center: "center", bottom: "flex-end" };
    textBox.style.justifyContent = jcMap[alignV] || "flex-start";
  }

  // 캔버스 크기 반영
  const canvas = document.getElementById("pv-bg-canvas");
  if (canvas) {
    const imgRatio = poem.textBoxStyle.imageRatio || 0;
    canvas.style.width = cw ? cw + "px" : "";
    if (cw && imgRatio) {
      canvas.style.aspectRatio = String(imgRatio);
      canvas.style.height = "auto";
      canvas.style.minHeight = "0";
    } else {
      canvas.style.aspectRatio = "";
      canvas.style.height = "";
      canvas.style.minHeight = "";
    }
    canvas.style.backgroundSize = cw ? "100% 100%" : "";
    canvas.style.backgroundRepeat = "no-repeat";
  }

  checkChanges();
}

// ═══════════════════════════════════════════
//  모달 미리보기 (최종 확인용)
// ═══════════════════════════════════════════
function openBgPreviewModal() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  // 드래그로 이동한 좌표를 먼저 데이터에 저장
  saveTextPositionFromPreview();

  // 모달에 전체 미리보기 렌더링
  document.getElementById("poem-preview-body").innerHTML = renderPoemPreview(poem);
  document.getElementById("bg-preview-overlay").hidden = false;
}

function closeBgPreviewModal() {
  document.getElementById("bg-preview-overlay").hidden = true;
}

function saveTextPositionFromPreview() {
  const idx = PoemManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  const textBox = document.getElementById("pv-text-box");
  if (!textBox) return;
  const x = parseFloat(textBox.style.left) || 5;
  const y = parseFloat(textBox.style.top) || 10;
  poem.textPosition = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  checkChanges();
}

// ── 텍스트 박스 드래그 ──
function initPvTextDrag(containerId) {
  const container = document.getElementById(containerId || "preview-body");
  if (!container) return;
  const textBox = container.querySelector("#pv-text-box");
  const canvas = container.querySelector("#pv-bg-canvas");
  if (!textBox || !canvas) return;

  let dragging = false;
  let startX, startY, startLeft, startTop;

  const newBox = textBox.cloneNode(true);
  textBox.replaceWith(newBox);

  newBox.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseFloat(newBox.style.left) || 5;
    startTop = parseFloat(newBox.style.top) || 10;
    newBox.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const dx = ((e.clientX - startX) / rect.width) * 100;
    const dy = ((e.clientY - startY) / rect.height) * 100;
    let newLeft = Math.max(0, Math.min(80, startLeft + dx));
    let newTop = Math.max(0, Math.min(80, startTop + dy));
    newBox.style.left = newLeft + "%";
    newBox.style.top = newTop + "%";
  });

  document.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      newBox.style.cursor = "grab";
      // 드래그 끝나면 좌표 저장
      saveTextPositionFromPreview();
    }
  });
}
