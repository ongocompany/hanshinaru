/* ============================================
   역사관리 모듈
   - 분기점(4개) / 단일항목 서브탭
   - 목록 + 검색 + 시대별 소팅
   - 편집: 제목, 연도, 시대, 내용
   ============================================ */

// ─── 분기점 ID (app.js MAIN_HISTORY_IDS와 동일) ───
const MILESTONE_IDS = new Set(["H001", "H003", "H005", "H007"]);

// ─── 상태 ───
const HistoryManager = {
  selectedIndex: null,   // DATA.history 배열 인덱스
  subtab: "milestone",   // "milestone" | "single"
  searchText: "",
};

// ─── 초기화 ───
function initHistoryManager() {
  if (!Array.isArray(DATA.history)) return;
  bindHistoryEvents();
  renderHistoryList();
}

// ─── 이벤트 바인딩 ───
function bindHistoryEvents() {
  // 서브탭
  document.querySelectorAll(".history-subtab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".history-subtab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      HistoryManager.subtab = btn.dataset.htab;
      HistoryManager.selectedIndex = null;
      hideHistoryEditForm();
      renderHistoryList();
    });
  });

  // 검색
  document.getElementById("history-search").addEventListener("input", (e) => {
    HistoryManager.searchText = e.target.value.trim().toLowerCase();
    renderHistoryList();
  });

  // 목록 행 클릭
  document.getElementById("history-tbody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const idx = Number(row.dataset.idx);
    if (!isNaN(idx)) selectHistory(idx);
  });

  // 되돌리기
  document.getElementById("btn-revert-history").addEventListener("click", revertHistory);

  // 삭제
  document.getElementById("btn-delete-history").addEventListener("click", deleteHistory);

  // 항목 추가
  document.getElementById("btn-add-history").addEventListener("click", addHistory);

  // 폼 변경 감지
  document.getElementById("history-form").addEventListener("input", onHistoryFormChange);
  document.getElementById("history-form").addEventListener("change", onHistoryFormChange);
}

// ─── 목록 렌더링 ───
function renderHistoryList() {
  if (!Array.isArray(DATA.history)) return;

  const isMilestone = HistoryManager.subtab === "milestone";

  // [index, item] 쌍
  let list = DATA.history.map((h, i) => [i, h]);

  // 분기점 / 단일항목 필터
  list = list.filter(([, h]) => {
    const isMs = MILESTONE_IDS.has(h.titleId);
    return isMilestone ? isMs : !isMs;
  });

  // 검색
  if (HistoryManager.searchText) {
    const q = HistoryManager.searchText;
    list = list.filter(([, h]) => {
      const ko = (h.name?.ko || "").toLowerCase();
      const zh = (h.name?.zh || "").toLowerCase();
      return ko.includes(q) || zh.includes(q);
    });
  }

  // 소팅: 분기점은 연도순, 단일항목은 시대순(초→성→중→만) + 연도순
  if (isMilestone) {
    list.sort(([, a], [, b]) => (a.year || 0) - (b.year || 0));
  } else {
    const ERA_ORDER = { "초당": 0, "성당": 1, "중당": 2, "만당": 3 };
    list.sort(([, a], [, b]) => {
      const eraA = ERA_ORDER[getHistoryEra(a)] ?? 99;
      const eraB = ERA_ORDER[getHistoryEra(b)] ?? 99;
      if (eraA !== eraB) return eraA - eraB;
      return (a.year || 0) - (b.year || 0);
    });
  }

  // 렌더
  const tbody = document.getElementById("history-tbody");
  tbody.innerHTML = list.map(([idx, h]) => {
    const isSelected = idx === HistoryManager.selectedIndex ? " selected" : "";
    const isModified = isHistoryModified(idx) ? " row-modified" : "";
    const era = getHistoryEra(h);
    return `<tr data-idx="${idx}" class="${isSelected}${isModified}">
      <td>${escapeHTMLAdmin(h.titleId || "")}</td>
      <td>${h.year || ""}</td>
      <td title="${escapeHTMLAdmin(h.name?.zh || "")}">${escapeHTMLAdmin(h.name?.ko || "")}</td>
      <td>${escapeHTMLAdmin(era)}</td>
    </tr>`;
  }).join("");

  document.getElementById("history-list-count").textContent =
    `${list.length}건 표시 / 총 ${DATA.history.length}건`;
}

// 시대 추출 (tags.era 첫 번째 값)
function getHistoryEra(h) {
  if (h.tags?.era && Array.isArray(h.tags.era) && h.tags.era.length > 0) {
    return h.tags.era[0];
  }
  return "";
}

// ─── 항목 선택 → 편집 폼 ───
function selectHistory(index) {
  HistoryManager.selectedIndex = index;
  const h = DATA.history[index];
  if (!h) return;

  const isMilestone = MILESTONE_IDS.has(h.titleId);

  // 목록 하이라이트
  document.querySelectorAll("#history-tbody tr").forEach(tr => {
    tr.classList.toggle("selected", Number(tr.dataset.idx) === index);
  });

  // 폼 표시
  document.getElementById("history-edit-placeholder").hidden = true;
  document.getElementById("history-edit-form-wrap").hidden = false;
  document.getElementById("history-edit-title").textContent =
    `${h.titleId} — ${h.name?.ko || ""} (${h.year || ""})`;

  // 기본정보
  document.getElementById("hf-titleId").value = h.titleId || "";
  document.getElementById("hf-name-ko").value = h.name?.ko || "";
  document.getElementById("hf-name-zh").value = h.name?.zh || "";
  document.getElementById("hf-year").value = h.year || "";

  // 시대 드롭다운: 분기점은 숨김, 단일항목은 표시
  const eraWrap = document.getElementById("hf-era-wrap");
  eraWrap.hidden = isMilestone;
  if (!isMilestone) {
    document.getElementById("hf-era").value = getHistoryEra(h);
  }

  // 내용: 분기점은 detail, 단일항목은 summary
  const contentLegend = document.getElementById("hf-content-legend");
  const contentField = document.getElementById("hf-content");
  if (isMilestone) {
    contentLegend.textContent = "내용 (detail)";
    contentField.value = h.detail || "";
  } else {
    contentLegend.textContent = "내용 (summary)";
    contentField.value = h.summary || "";
  }

  // 태그 (읽기전용)
  document.getElementById("hf-tags-emperor").value =
    (h.tags?.emperor || []).join(", ");
  document.getElementById("hf-tags-theme").value =
    (h.tags?.theme || []).join(", ");

  // 주석 (읽기전용)
  renderHistoryAnnotations(h);

  // 변경 표시
  updateHistoryFieldHighlights(index);
}

function hideHistoryEditForm() {
  document.getElementById("history-edit-placeholder").hidden = false;
  document.getElementById("history-edit-form-wrap").hidden = true;
}

// ─── 주석 렌더 (읽기전용) ───
function renderHistoryAnnotations(h) {
  const anns = h.annotations || [];
  const container = document.getElementById("hf-annotations");
  document.getElementById("hf-ann-count").textContent = String(anns.length);

  if (anns.length === 0) {
    container.innerHTML = '<div style="font-style:italic; color:#999; font-size:13px">주석 없음</div>';
    return;
  }

  container.innerHTML = anns.map(a => `
    <div class="history-ann-item">
      <span class="ann-key">${escapeHTMLAdmin(a.key || "")}</span>
      <span class="ann-type badge">${escapeHTMLAdmin(a.type || "")}</span>
      <span class="ann-summary">${escapeHTMLAdmin(a.summary || "")}</span>
    </div>
  `).join("");
}

// ─── 폼 변경 → DATA 반영 ───
function onHistoryFormChange(e) {
  const idx = HistoryManager.selectedIndex;
  if (idx === null) return;
  const h = DATA.history[idx];
  if (!h) return;

  const el = e.target;
  const field = el.dataset?.hfield;
  if (!field) return;

  const isMilestone = MILESTONE_IDS.has(h.titleId);

  if (field === "name.ko") {
    if (!h.name) h.name = {};
    h.name.ko = el.value;
  } else if (field === "name.zh") {
    if (!h.name) h.name = {};
    h.name.zh = el.value;
  } else if (field === "year") {
    h.year = parseInt(el.value) || null;
    // life도 동기화
    if (!h.life) h.life = {};
    h.life.birth = h.year;
  } else if (field === "tags.era") {
    if (!h.tags) h.tags = {};
    h.tags.era = el.value ? [el.value] : [];
  } else if (field === "content") {
    if (isMilestone) {
      h.detail = el.value;
    } else {
      h.summary = el.value;
    }
  }

  // 헤더 갱신
  document.getElementById("history-edit-title").textContent =
    `${h.titleId} — ${h.name?.ko || ""} (${h.year || ""})`;

  updateHistoryFieldHighlights(idx);
  renderHistoryList();
  checkChanges();
}

// ─── 변경 감지 ───
function isHistoryModified(index) {
  if (!ORIGINAL.history || !ORIGINAL.history[index]) return false;
  return JSON.stringify(DATA.history[index]) !== JSON.stringify(ORIGINAL.history[index]);
}

function updateHistoryFieldHighlights(index) {
  const orig = ORIGINAL.history?.[index];
  if (!orig) return;
  const curr = DATA.history[index];
  if (!curr) return;

  const isMilestone = MILESTONE_IDS.has(curr.titleId);

  // 개별 필드 하이라이트
  const fieldMap = {
    "hf-name-ko": () => (orig.name?.ko || "") !== (curr.name?.ko || ""),
    "hf-name-zh": () => (orig.name?.zh || "") !== (curr.name?.zh || ""),
    "hf-year": () => (orig.year || "") !== (curr.year || ""),
    "hf-era": () => JSON.stringify(orig.tags?.era) !== JSON.stringify(curr.tags?.era),
    "hf-content": () => {
      if (isMilestone) return (orig.detail || "") !== (curr.detail || "");
      return (orig.summary || "") !== (curr.summary || "");
    },
  };

  for (const [id, isChanged] of Object.entries(fieldMap)) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("modified-field", isChanged());
  }
}

// ─── 되돌리기 ───
function revertHistory() {
  const idx = HistoryManager.selectedIndex;
  if (idx === null) return;
  const orig = ORIGINAL.history?.[idx];
  if (!orig) return;

  if (!confirm("이 항목의 변경사항을 되돌리시겠습니까?")) return;

  DATA.history[idx] = structuredClone(orig);
  selectHistory(idx);
  renderHistoryList();
  checkChanges();
  showToast("되돌리기 완료");
}

// ─── 삭제 ───
function deleteHistory() {
  const idx = HistoryManager.selectedIndex;
  if (idx === null) return;
  const h = DATA.history[idx];
  if (!h) return;

  if (MILESTONE_IDS.has(h.titleId)) {
    alert("분기점 사건은 삭제할 수 없습니다.");
    return;
  }

  if (!confirm(`"${h.name?.ko || h.titleId}" 항목을 삭제하시겠습니까?`)) return;

  DATA.history.splice(idx, 1);
  ORIGINAL.history.splice(idx, 1);
  HistoryManager.selectedIndex = null;
  hideHistoryEditForm();
  renderHistoryList();
  checkChanges();
  showToast("항목 삭제 완료");
}

// ─── 추가 ───
function addHistory() {
  // 다음 ID 계산
  const existingIds = DATA.history.map(h => {
    const m = (h.titleId || "").match(/^H(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  const nextNum = Math.max(0, ...existingIds) + 1;
  const newId = "H" + String(nextNum).padStart(3, "0");

  const newItem = {
    type: "card",
    titleId: newId,
    year: null,
    name: { ko: "새 항목", zh: "" },
    life: { birth: null, death: null },
    summary: "",
    detail: "",
    tags: { era: ["초당"], emperor: [], theme: [] },
    annotations: [],
  };

  DATA.history.push(newItem);
  ORIGINAL.history.push(structuredClone(newItem));

  // 단일항목 탭으로 전환 후 선택
  HistoryManager.subtab = "single";
  document.querySelectorAll(".history-subtab").forEach(b => {
    b.classList.toggle("active", b.dataset.htab === "single");
  });

  renderHistoryList();
  selectHistory(DATA.history.length - 1);
  checkChanges();
  showToast(`새 항목 추가: ${newId}`);
}
