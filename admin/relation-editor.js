/* ============================================
   교유관계 편집 모듈 (3단계)
   - 관계 목록 테이블 렌더링
   - 시인 검색+자동완성 (대상 선택)
   - 외부인물(EXT_) 지원
   - 양방향 관계 자동 추가 (friend/rival/colleague)
   ============================================ */

const REL_TYPES = [
  { value: "friend",    label: "친구(벗)" },
  { value: "respect",   label: "존경" },
  { value: "admirer",   label: "흠모" },
  { value: "patron",    label: "후원" },
  { value: "recommend", label: "추천/발탁" },
  { value: "teacher",   label: "스승" },
  { value: "student",   label: "제자" },
  { value: "rival",     label: "라이벌" },
  { value: "colleague", label: "동료" },
];

// 양방향 관계 유형
const BIDIRECTIONAL_TYPES = ["friend", "rival", "colleague"];

// ─── 초기화 ─────────────────────────────────
function initRelationEditor() {
  document.getElementById("btn-add-rel").addEventListener("click", () => addRelationRow(false));
  document.getElementById("btn-add-ext-rel").addEventListener("click", () => addRelationRow(true));

  // 테이블 이벤트 위임
  document.getElementById("rel-tbody").addEventListener("click", onRelTableClick);
  document.getElementById("rel-tbody").addEventListener("input", onRelTableInput);
  document.getElementById("rel-tbody").addEventListener("change", onRelTableInput);

  // 자동완성 닫기
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".rel-target-wrap")) {
      document.querySelectorAll(".rel-autocomplete").forEach(el => el.remove());
    }
  });
}

// ─── 시인 선택 시 관계 로드 ─────────────────
function loadRelations(authorId) {
  const author = DATA.author.authors[authorId];
  if (!author) return;

  const rels = author.relations || [];
  document.getElementById("f-rel-count").textContent = String(rels.length);
  renderRelTable(authorId, rels);
}

// ─── 관계 테이블 렌더링 ─────────────────────
function renderRelTable(authorId, rels) {
  const tbody = document.getElementById("rel-tbody");

  if (rels.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999; padding:12px">관계 없음</td></tr>';
    return;
  }

  tbody.innerHTML = rels.map((rel, i) => {
    const isExt = (rel.targetId || "").startsWith("EXT_");
    const targetDisplay = getTargetDisplay(rel);
    const typeOptions = REL_TYPES.map(t =>
      `<option value="${t.value}"${t.value === rel.type ? " selected" : ""}>${t.label}</option>`
    ).join("");

    return `<tr data-idx="${i}">
      <td style="text-align:center; color:#999">${i + 1}</td>
      <td>
        <div class="rel-target-wrap">
          <input type="text" class="rel-target-input" data-idx="${i}"
                 value="${escapeHTMLAdmin(targetDisplay)}" readonly
                 style="cursor:default; background:#f9f9f9"
                 title="${rel.targetId}">
          ${isExt ? '<span class="ext-badge">외부</span>' : ''}
        </div>
        ${isExt ? `<div class="ext-fields">
          <div>${escapeHTMLAdmin(rel.targetName || "")} (${escapeHTMLAdmin(rel.targetNameKo || "")})</div>
        </div>` : ''}
      </td>
      <td><select class="rel-type-select" data-idx="${i}">${typeOptions}</select></td>
      <td><input type="text" class="rel-label-input" data-idx="${i}" value="${escapeHTMLAdmin(rel.label || "")}"></td>
      <td><textarea class="rel-desc-input" data-idx="${i}" rows="1">${escapeHTMLAdmin(rel.desc || "")}</textarea></td>
      <td style="text-align:center"><button type="button" class="btn-del-rel" data-idx="${i}" title="삭제">✕</button></td>
    </tr>`;
  }).join("");
}

function getTargetDisplay(rel) {
  if (!rel.targetId) return "(미지정)";
  if (rel.targetId.startsWith("EXT_")) {
    return rel.targetNameKo || rel.targetName || rel.targetId;
  }
  const target = DATA.author.authors[rel.targetId];
  if (target) {
    return `${target.name?.ko || ""} (${target.name?.zh || ""})`;
  }
  return rel.targetId;
}

// ─── 관계 추가 ──────────────────────────────
function addRelationRow(isExternal) {
  const id = AuthorManager.selectedId;
  if (!id) return;
  const author = DATA.author.authors[id];
  if (!author) return;

  if (!author.relations) author.relations = [];

  if (isExternal) {
    // 외부 인물 추가 — 입력 팝업
    const targetName = prompt("외부 인물 한자 이름 (예: 唐玄宗):");
    if (!targetName) return;
    const targetNameKo = prompt("외부 인물 한글 이름 (예: 당현종):");

    // EXT_ ID 생성
    const extId = "EXT_" + targetName.replace(/\s+/g, "_").toLowerCase();

    author.relations.push({
      targetId: extId,
      targetName: targetName,
      targetNameKo: targetNameKo || "",
      type: "patron",
      label: "",
      desc: "",
    });
  } else {
    // 내부 시인 — 검색 모달
    showAuthorSearchForRelation(id);
    return; // 검색 후 콜백에서 push
  }

  saveRelationsToData(id);
  loadRelations(id);
}

// ─── 시인 검색+선택 (관계 대상) ─────────────
function showAuthorSearchForRelation(currentAuthorId) {
  // 간단한 오버레이 검색창
  const overlay = document.createElement("div");
  overlay.id = "rel-search-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); z-index: 500;
    display: flex; align-items: center; justify-content: center;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    background: #fff; border-radius: 8px; padding: 20px;
    width: 400px; max-height: 500px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  `;
  panel.innerHTML = `
    <h4 style="margin-bottom:10px; font-size:15px">관계 대상 시인 선택</h4>
    <input type="text" id="rel-search-input" placeholder="시인 이름 검색..." style="margin-bottom:8px">
    <div id="rel-search-results" style="max-height:350px; overflow-y:auto; border:1px solid #eee; border-radius:4px"></div>
    <div style="margin-top:10px; text-align:right">
      <button class="btn btn-secondary" id="rel-search-cancel">취소</button>
    </div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const searchInput = document.getElementById("rel-search-input");
  const resultsDiv = document.getElementById("rel-search-results");

  // 초기 전체 목록
  renderSearchResults(resultsDiv, "", currentAuthorId);

  searchInput.focus();
  searchInput.addEventListener("input", () => {
    renderSearchResults(resultsDiv, searchInput.value.trim().toLowerCase(), currentAuthorId);
  });

  // 결과 클릭
  resultsDiv.addEventListener("click", (e) => {
    const item = e.target.closest(".rel-ac-item");
    if (!item) return;
    const targetId = item.dataset.id;
    finishAddRelation(currentAuthorId, targetId);
    overlay.remove();
  });

  // 취소
  document.getElementById("rel-search-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function renderSearchResults(container, query, excludeId) {
  const authors = DATA.author.authors;
  let list = Object.entries(authors).filter(([id]) => id !== excludeId);

  if (query) {
    list = list.filter(([, a]) => {
      const ko = (a.name?.ko || "").toLowerCase();
      const zh = (a.name?.zh || "").toLowerCase();
      return ko.includes(query) || zh.includes(query);
    });
  }

  list.sort(([, a], [, b]) =>
    (a.name?.ko || "").localeCompare(b.name?.ko || "", "ko")
  );

  if (list.length === 0) {
    container.innerHTML = '<div style="padding:12px; color:#999; text-align:center">결과 없음</div>';
    return;
  }

  container.innerHTML = list.map(([id, a]) =>
    `<div class="rel-ac-item" data-id="${id}">
      <span class="ac-id">${id}</span>
      ${escapeHTMLAdmin(a.name?.ko || "")} (${escapeHTMLAdmin(a.name?.zh || "")})
    </div>`
  ).join("");
}

function finishAddRelation(currentAuthorId, targetId) {
  const author = DATA.author.authors[currentAuthorId];
  if (!author.relations) author.relations = [];

  // 중복 체크
  if (author.relations.some(r => r.targetId === targetId)) {
    showToast("이미 추가된 관계입니다");
    return;
  }

  author.relations.push({
    targetId: targetId,
    type: "friend",
    label: "",
    desc: "",
  });

  saveRelationsToData(currentAuthorId);
  loadRelations(currentAuthorId);

  // 양방향 관계 제안 (friend가 기본값)
  offerBidirectional(currentAuthorId, targetId, "friend");
}

// ─── 양방향 관계 자동 제안 ──────────────────
function offerBidirectional(fromId, toId, type) {
  if (!BIDIRECTIONAL_TYPES.includes(type)) return;
  if (toId.startsWith("EXT_")) return; // 외부인물은 양방향 불가

  const target = DATA.author.authors[toId];
  if (!target) return;

  // 이미 역방향 관계가 있는지 확인
  const existing = (target.relations || []).some(r => r.targetId === fromId);
  if (existing) return;

  const fromName = DATA.author.authors[fromId]?.name?.ko || fromId;
  const toName = target.name?.ko || toId;
  const typeLabel = REL_TYPES.find(t => t.value === type)?.label || type;

  if (confirm(`"${toName}"에게도 "${fromName}"과(와)의 ${typeLabel} 관계를 추가하시겠습니까?`)) {
    if (!target.relations) target.relations = [];
    target.relations.push({
      targetId: fromId,
      type: type,
      label: "",
      desc: "",
    });
    checkChanges();
    showToast(`${toName}에게 역방향 관계 추가됨`);
  }
}

// ─── 테이블 이벤트 핸들러 ───────────────────
function onRelTableClick(e) {
  const delBtn = e.target.closest(".btn-del-rel");
  if (delBtn) {
    const idx = parseInt(delBtn.dataset.idx, 10);
    deleteRelation(idx);
  }
}

function onRelTableInput(e) {
  const el = e.target;
  const idx = parseInt(el.dataset?.idx, 10);
  if (isNaN(idx)) return;

  const id = AuthorManager.selectedId;
  if (!id) return;
  const author = DATA.author.authors[id];
  if (!author?.relations?.[idx]) return;

  if (el.classList.contains("rel-type-select")) {
    const oldType = author.relations[idx].type;
    author.relations[idx].type = el.value;

    // 양방향 관계 타입 변경 시 제안
    if (BIDIRECTIONAL_TYPES.includes(el.value) && el.value !== oldType) {
      offerBidirectional(id, author.relations[idx].targetId, el.value);
    }
  } else if (el.classList.contains("rel-label-input")) {
    author.relations[idx].label = el.value;
  } else if (el.classList.contains("rel-desc-input")) {
    author.relations[idx].desc = el.value;
  }

  saveRelationsToData(id);
}

// ─── 관계 삭제 ──────────────────────────────
function deleteRelation(idx) {
  const id = AuthorManager.selectedId;
  if (!id) return;
  const author = DATA.author.authors[id];
  if (!author?.relations) return;

  const rel = author.relations[idx];
  const targetName = getTargetDisplay(rel);
  if (!confirm(`"${targetName}" 관계를 삭제하시겠습니까?`)) return;

  author.relations.splice(idx, 1);
  saveRelationsToData(id);
  loadRelations(id);
  showToast("관계 삭제됨");
}

// ─── DATA 저장 + UI 갱신 ────────────────────
function saveRelationsToData(authorId) {
  document.getElementById("f-rel-count").textContent =
    String((DATA.author.authors[authorId]?.relations || []).length);
  renderAuthorList();
  checkChanges();
}
