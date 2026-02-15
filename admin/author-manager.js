/* ============================================
   시인관리 모듈 (2단계)
   - 76명 시인 목록/검색/필터/정렬
   - 상세 편집 폼 + 변경감지
   - 시인 신규 추가 (isExtra)
   ============================================ */

// ─── 시인 관련 상태 ─────────────────────────
const AuthorManager = {
  selectedId: null,   // 현재 편집 중인 시인 titleId
  poemCounts: {},     // titleId → 작품수 매핑
  sortKey: "name-asc",
  eraFilter: "all",
  searchText: "",
};

// 시인 이름 정규화 (app.js와 동일 로직)
function normalizePoetNameAdmin(s) {
  return String(s || "")
    .replace(/\[\d+\]/g, "")   // [1] 같은 주석번호 제거
    .replace(/^僧\s+/u, "")    // 직함 접두 제거
    .trim();
}

// ─── 초기화 (admin.js의 loadAllData 완료 후 호출) ───
function initAuthorManager() {
  if (!DATA.author || !DATA.poem) return;

  buildPoemCounts();
  bindAuthorEvents();
  renderAuthorList();

  // 3단계 모듈 초기화
  if (typeof initBirthplaceEditor === "function") initBirthplaceEditor();
  if (typeof initRelationEditor === "function") initRelationEditor();
  if (typeof initAvatarEditor === "function") initAvatarEditor();
}

// ─── 작품수 집계 ────────────────────────────
function buildPoemCounts() {
  AuthorManager.poemCounts = {};
  const authors = DATA.author.authors || {};

  // 먼저 모든 시인을 0으로 초기화
  for (const id of Object.keys(authors)) {
    AuthorManager.poemCounts[id] = 0;
  }

  // poems.full에서 poet.zh를 정규화해서 매칭
  if (Array.isArray(DATA.poem)) {
    for (const poem of DATA.poem) {
      const poetZh = normalizePoetNameAdmin(poem.poet?.zh);
      if (!poetZh) continue;

      // authors에서 name.zh가 일치하는 시인 찾기
      for (const [id, author] of Object.entries(authors)) {
        if (author.name?.zh === poetZh) {
          AuthorManager.poemCounts[id] = (AuthorManager.poemCounts[id] || 0) + 1;
          break;
        }
      }
    }
  }
}

// ─── 이벤트 바인딩 ──────────────────────────
function bindAuthorEvents() {
  // 검색
  document.getElementById("author-search").addEventListener("input", (e) => {
    AuthorManager.searchText = e.target.value.trim().toLowerCase();
    renderAuthorList();
  });

  // 시대 필터
  document.getElementById("era-filter").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#era-filter .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    AuthorManager.eraFilter = btn.dataset.era;
    renderAuthorList();
  });

  // 정렬
  document.getElementById("author-sort").addEventListener("change", (e) => {
    AuthorManager.sortKey = e.target.value;
    renderAuthorList();
  });

  // 시인 추가 버튼
  document.getElementById("btn-add-author").addEventListener("click", addNewAuthor);

  // 되돌리기 버튼
  document.getElementById("btn-revert-author").addEventListener("click", revertCurrentAuthor);

  // 삭제 버튼
  document.getElementById("btn-delete-author").addEventListener("click", deleteCurrentAuthor);

  // 목록 행 클릭 (이벤트 위임)
  document.getElementById("author-tbody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
    if (id) selectAuthor(id);
  });

  // 폼 값 변경 감지 (이벤트 위임)
  document.getElementById("author-form").addEventListener("input", onFormChange);
  document.getElementById("author-form").addEventListener("change", onFormChange);
}

// ─── 시인 목록 렌더링 ───────────────────────
function renderAuthorList() {
  const authors = DATA.author?.authors;
  if (!authors) return;

  let list = Object.entries(authors);

  // 필터: era
  if (AuthorManager.eraFilter !== "all") {
    list = list.filter(([, a]) => a.era?.period === AuthorManager.eraFilter);
  }

  // 필터: 검색
  if (AuthorManager.searchText) {
    const q = AuthorManager.searchText;
    list = list.filter(([, a]) => {
      const ko = (a.name?.ko || "").toLowerCase();
      const zh = (a.name?.zh || "").toLowerCase();
      return ko.includes(q) || zh.includes(q);
    });
  }

  // 정렬
  list = sortAuthorList(list, AuthorManager.sortKey);

  // 렌더
  const tbody = document.getElementById("author-tbody");
  const ERA_LABELS = { early: "초당", high: "성당", mid: "중당", late: "만당" };

  const rows = list.map(([id, a]) => {
    const era = a.era?.period || "";
    const poemCount = AuthorManager.poemCounts[id] || 0;
    const hasBirth = a.birthplace && a.birthplace.lat ? "O" : "-";
    const relCount = Array.isArray(a.relations) ? a.relations.length : 0;
    const isSelected = id === AuthorManager.selectedId ? " selected" : "";
    const isModified = isAuthorModified(id) ? " row-modified" : "";
    const isExtra = a.isExtra ? ' <span style="color:#999;font-size:10px">(추가)</span>' : "";

    return `<tr data-id="${id}" class="${isSelected}${isModified}">
      <td>${id}</td>
      <td>${escapeHTMLAdmin(a.name?.ko || "")} (${escapeHTMLAdmin(a.name?.zh || "")})${isExtra}</td>
      <td>${escapeHTMLAdmin(a.life?.raw || "미상")}</td>
      <td><span class="badge badge-${era}">${ERA_LABELS[era] || "?"}</span></td>
      <td style="text-align:center">${poemCount}</td>
      <td style="text-align:center">${hasBirth}</td>
      <td style="text-align:center">${relCount || "-"}</td>
    </tr>`;
  }).join("");

  tbody.innerHTML = rows;

  // 표시 카운트
  document.getElementById("author-list-count").textContent =
    `${list.length}명 표시 / 총 ${Object.keys(authors).length}명`;
}

function sortAuthorList(list, key) {
  const counts = AuthorManager.poemCounts;

  switch (key) {
    case "name-asc":
      return list.sort(([, a], [, b]) =>
        (a.name?.ko || a.name?.zh || "").localeCompare(b.name?.ko || b.name?.zh || "", "ko")
      );
    case "year-asc":
      return list.sort(([, a], [, b]) =>
        (a.life?.birth || 9999) - (b.life?.birth || 9999)
      );
    case "poems-desc":
      return list.sort(([idA, a], [idB, b]) => {
        const diff = (counts[idB] || 0) - (counts[idA] || 0);
        if (diff !== 0) return diff;
        // 작품수 같으면 가나다순
        return (a.name?.ko || "").localeCompare(b.name?.ko || "", "ko");
      });
    default:
      return list;
  }
}

// ─── 시인 선택 → 편집 폼 로드 ──────────────
function selectAuthor(id) {
  AuthorManager.selectedId = id;
  const author = DATA.author.authors[id];
  if (!author) return;

  // 목록 하이라이트 갱신
  document.querySelectorAll("#author-tbody tr").forEach(tr => {
    tr.classList.toggle("selected", tr.dataset.id === id);
  });

  // 편집 폼 표시
  document.getElementById("edit-placeholder").hidden = true;
  document.getElementById("edit-form-wrap").hidden = false;
  document.getElementById("edit-title").textContent =
    `${author.name?.ko || ""} (${author.name?.zh || ""})`;

  // 기본정보
  document.getElementById("f-titleId").value = id;
  document.getElementById("f-name-zh").value = author.name?.zh || "";
  document.getElementById("f-name-ko").value = author.name?.ko || "";
  document.getElementById("f-birth").value = author.life?.birth ?? "";
  document.getElementById("f-death").value = author.life?.death ?? "";
  document.getElementById("f-birthApprox").checked = !!author.life?.birthApprox;
  document.getElementById("f-deathApprox").checked = !!author.life?.deathApprox;
  document.getElementById("f-life-raw").value = author.life?.raw || "";
  document.getElementById("f-isExtra").checked = !!author.isExtra;

  // 시대 분류
  const eraRadios = document.querySelectorAll('input[name="era-period"]');
  eraRadios.forEach(r => { r.checked = r.value === (author.era?.period || ""); });
  document.getElementById("f-era-confidence").value = author.era?.confidence || "high";
  document.getElementById("f-era-source").value = author.era?.source || "birth_year";

  // 약전
  document.getElementById("f-bioKo").value = author.bioKo || "";

  // 초상화
  if (typeof loadAvatar === "function") loadAvatar(id);

  // 출생지 (3단계)
  if (typeof loadBirthplace === "function") loadBirthplace(id);

  // 교유관계 (3단계)
  if (typeof loadRelations === "function") loadRelations(id);

  // 작품 목록
  renderPoemList(id, author);

  // 변경 감지 표시 초기화
  updateFieldHighlights(id);
}

function renderPoemList(authorId, author) {
  const container = document.getElementById("f-poem-list");
  const countEl = document.getElementById("f-poem-count");

  if (!Array.isArray(DATA.poem)) {
    container.innerHTML = '<div class="no-poems">시 데이터 없음</div>';
    countEl.textContent = "0";
    return;
  }

  const poetZh = author.name?.zh || "";
  const poems = DATA.poem.filter(p =>
    normalizePoetNameAdmin(p.poet?.zh) === poetZh
  );

  countEl.textContent = String(poems.length);

  if (poems.length === 0) {
    container.innerHTML = '<div class="no-poems">등재된 작품이 없습니다</div>';
    return;
  }

  container.innerHTML = poems.map((p, i) => {
    const title = p.title?.zh || p.title?.ko || "(무제)";
    return `<div class="poem-item">
      <span class="poem-no">${i + 1}</span>
      ${escapeHTMLAdmin(title)}
    </div>`;
  }).join("");
}

// ─── 폼 변경 → DATA 즉시 반영 ──────────────
function onFormChange(e) {
  const id = AuthorManager.selectedId;
  if (!id) return;

  const author = DATA.author.authors[id];
  if (!author) return;

  const el = e.target;
  const field = el.dataset?.field;
  if (!field) return;

  // 중첩 필드 처리 (예: "name.zh" → author.name.zh)
  const parts = field.split(".");
  let target = author;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!target[parts[i]]) target[parts[i]] = {};
    target = target[parts[i]];
  }

  const lastKey = parts[parts.length - 1];

  // 값 타입에 따라 할당
  if (el.type === "checkbox") {
    target[lastKey] = el.checked;
  } else if (el.type === "radio") {
    target[lastKey] = el.value;
  } else if (el.type === "number") {
    target[lastKey] = el.value === "" ? null : Number(el.value);
  } else {
    target[lastKey] = el.value;
  }

  // 편집 헤더 제목 갱신
  if (field === "name.ko" || field === "name.zh") {
    document.getElementById("edit-title").textContent =
      `${author.name?.ko || ""} (${author.name?.zh || ""})`;
  }

  // 변경 감지 표시
  updateFieldHighlights(id);

  // 목록 행 갱신 (이름/시대 등 변경될 수 있으므로)
  renderAuthorList();

  // 전체 변경 감지
  checkChanges();
}

// ─── 변경 감지 (필드별 하이라이트) ──────────
function isAuthorModified(id) {
  const orig = ORIGINAL.author?.authors?.[id];
  const curr = DATA.author?.authors?.[id];
  if (!orig && curr) return true; // 신규 추가
  if (!orig || !curr) return false;
  return JSON.stringify(orig) !== JSON.stringify(curr);
}

function updateFieldHighlights(id) {
  const orig = ORIGINAL.author?.authors?.[id];
  if (!orig) return; // 신규 추가된 시인은 모든 필드가 "새 것"

  const form = document.getElementById("author-form");
  const inputs = form.querySelectorAll("[data-field]");

  inputs.forEach(el => {
    const field = el.dataset.field;
    const parts = field.split(".");

    let origVal = orig;
    let currVal = DATA.author.authors[id];

    for (const p of parts) {
      origVal = origVal?.[p];
      currVal = currVal?.[p];
    }

    // 값 비교
    const origStr = String(origVal ?? "");
    let currStr;
    if (el.type === "checkbox") {
      currStr = String(!!currVal);
      const origBool = String(!!origVal);
      el.closest(".check-label")?.classList.toggle("modified-field", origBool !== currStr);
    } else if (el.type === "radio") {
      // 라디오는 그룹이라 개별 처리 안함
    } else {
      currStr = String(currVal ?? "");
      el.classList.toggle("modified-field", origStr !== currStr);
    }
  });
}

// ─── 시인 되돌리기 ──────────────────────────
function revertCurrentAuthor() {
  const id = AuthorManager.selectedId;
  if (!id) return;

  const orig = ORIGINAL.author?.authors?.[id];
  if (!orig) {
    // 신규 추가된 시인 → 삭제할지 확인
    if (confirm(`새로 추가한 시인 ${id}을(를) 삭제하시겠습니까?`)) {
      delete DATA.author.authors[id];
      DATA.author.count = Object.keys(DATA.author.authors).length;
      AuthorManager.selectedId = null;
      document.getElementById("edit-placeholder").hidden = false;
      document.getElementById("edit-form-wrap").hidden = true;
      renderAuthorList();
      updateCount("author");
      checkChanges();
    }
    return;
  }

  if (!confirm("이 시인의 변경사항을 되돌리시겠습니까?")) return;

  DATA.author.authors[id] = structuredClone(orig);
  selectAuthor(id);
  renderAuthorList();
  checkChanges();
  showToast("되돌리기 완료");
}

// ─── 시인 삭제 (삭제 취소 지원) ─────────────
let _deletedBackup = null;   // 삭제 취소용 백업
let _deleteUndoTimer = null; // 취소 타이머

function deleteCurrentAuthor() {
  const id = AuthorManager.selectedId;
  if (!id) return;

  const author = DATA.author.authors[id];
  if (!author) return;

  const name = author.name?.ko || author.name?.zh || id;
  if (!confirm(`"${name}" 시인을 정말 삭제하시겠습니까?`)) return;

  // 백업 저장 (삭제 취소용)
  _deletedBackup = {
    id: id,
    data: structuredClone(author),
    original: ORIGINAL.author?.authors?.[id]
      ? structuredClone(ORIGINAL.author.authors[id])
      : null,
  };

  // DATA에서 제거
  delete DATA.author.authors[id];
  DATA.author.count = Object.keys(DATA.author.authors).length;

  // 편집 패널 초기화
  AuthorManager.selectedId = null;
  document.getElementById("edit-placeholder").hidden = false;
  document.getElementById("edit-form-wrap").hidden = true;

  renderAuthorList();
  updateCount("author");
  checkChanges();

  // 삭제 취소 토스트 (10초)
  showUndoDeleteToast(name);
}

function showUndoDeleteToast(name) {
  // 기존 타이머 정리
  if (_deleteUndoTimer) clearTimeout(_deleteUndoTimer);

  let toast = document.getElementById("undo-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "undo-toast";
    toast.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px; background: #2c3e50; color: #fff;
      border-radius: 6px; font-size: 14px; z-index: 300;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span>"${escapeHTMLAdmin(name)}" 삭제됨</span>
    <button id="btn-undo-delete" style="
      padding: 4px 14px; background: #e74c3c; color: #fff;
      border: none; border-radius: 4px; font-size: 13px;
      font-weight: 600; cursor: pointer;
    ">삭제 취소</button>
    <span id="undo-countdown" style="font-size:12px; opacity:0.7">10초</span>
  `;
  toast.style.opacity = "1";

  // 삭제 취소 버튼
  document.getElementById("btn-undo-delete").addEventListener("click", undoDelete);

  // 카운트다운
  let remaining = 10;
  const countdownEl = document.getElementById("undo-countdown");

  _deleteUndoTimer = setInterval(() => {
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining + "초";
    if (remaining <= 0) {
      clearInterval(_deleteUndoTimer);
      _deleteUndoTimer = null;
      _deletedBackup = null; // 백업 폐기 → 복구 불가
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }
  }, 1000);
}

function undoDelete() {
  if (!_deletedBackup) return;

  const { id, data, original } = _deletedBackup;

  // DATA에 복원
  DATA.author.authors[id] = data;
  DATA.author.count = Object.keys(DATA.author.authors).length;

  // ORIGINAL에도 복원 (있었던 경우)
  if (original) {
    ORIGINAL.author.authors[id] = original;
  }

  _deletedBackup = null;

  // 타이머 정리
  if (_deleteUndoTimer) {
    clearInterval(_deleteUndoTimer);
    _deleteUndoTimer = null;
  }

  // 토스트 제거
  const toast = document.getElementById("undo-toast");
  if (toast) {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }

  renderAuthorList();
  selectAuthor(id);
  updateCount("author");
  checkChanges();
  showToast("삭제가 취소되었습니다");
}

// ─── 시인 추가 ──────────────────────────────
function addNewAuthor() {
  // 새 titleId 생성: 기존 중 가장 큰 번호 + 1
  const existingIds = Object.keys(DATA.author.authors)
    .map(id => parseInt(id.replace("C", ""), 10))
    .filter(n => !isNaN(n));
  const maxNum = Math.max(...existingIds, 0);
  const newId = "C" + (maxNum + 1);

  const newAuthor = {
    titleId: newId,
    sourceUrl: "",
    name: { zh: "", ko: "" },
    life: { birth: null, death: null, raw: "", birthApprox: false, deathApprox: false },
    bioKo: "",
    era: { period: "high", confidence: "low", source: "manual" },
    isExtra: true,
  };

  DATA.author.authors[newId] = newAuthor;
  DATA.author.count = Object.keys(DATA.author.authors).length;

  buildPoemCounts(); // 새 시인은 작품 0편
  renderAuthorList();
  selectAuthor(newId);
  updateCount("author");
  checkChanges();
  showToast(`새 시인 ${newId} 추가됨 (미등재 시인)`);
}

// ─── 유틸 ───────────────────────────────────
function escapeHTMLAdmin(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
