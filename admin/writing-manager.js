/* ============================================
   집필관리 모듈 (MVP)
   - 원문/신규 번역 동시 편집
   - 레거시 번역 읽기전용 비교
   - Owned 필드 저장: translationKoOwned, jipyeongKoOwned, ownedContentMeta
   ============================================ */

const WRITING_SAMPLE_IDS = ["001", "008", "045", "073", "124"];

const WritingManager = {
  selectedIndex: null,
  searchText: "",
  sortKey: "no-asc",
  ownedOnly: false,
  newNotesOnly: false,
  eventsBound: false,
};

function initWritingManager() {
  if (!Array.isArray(DATA.poem)) return;
  if (!WritingManager.eventsBound) bindWritingEvents();
  renderWritingList();

  if (WritingManager.selectedIndex !== null && DATA.poem[WritingManager.selectedIndex]) {
    selectWritingPoem(WritingManager.selectedIndex);
  }
}

function bindWritingEvents() {
  WritingManager.eventsBound = true;

  document.getElementById("writing-search").addEventListener("input", (e) => {
    WritingManager.searchText = String(e.target.value || "").trim().toLowerCase();
    renderWritingList();
  });

  document.getElementById("writing-sort").addEventListener("change", (e) => {
    WritingManager.sortKey = e.target.value;
    renderWritingList();
  });

  document.getElementById("writing-owned-only").addEventListener("change", (e) => {
    WritingManager.ownedOnly = !!e.target.checked;
    renderWritingList();
  });
  document.getElementById("writing-new-notes-only").addEventListener("change", (e) => {
    WritingManager.newNotesOnly = !!e.target.checked;
    if (WritingManager.selectedIndex !== null) {
      renderOwnedNotesList(WritingManager.selectedIndex);
    }
  });

  document.getElementById("btn-writing-seed-samples").addEventListener("click", seedWritingSamples);

  document.getElementById("writing-tbody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const idx = Number(row.dataset.idx);
    if (!isNaN(idx)) selectWritingPoem(idx);
  });

  document.getElementById("wf-titleZhOwned").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-titleKoOwned").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-poemZhOwned").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-translationKoOwned").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-jipyeongKoOwned").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-commentaryKoOwned").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-status").addEventListener("change", onWritingFormChange);
  document.getElementById("wf-editedBy").addEventListener("input", onWritingFormChange);
  document.getElementById("wf-reviewedBy").addEventListener("input", onWritingFormChange);
  document.getElementById("btn-writing-add-note").addEventListener("click", addOwnedNote);

  const ownedNotesList = document.getElementById("wf-owned-notes-list");
  ownedNotesList.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".btn-del-note");
    if (!delBtn) return;
    const ni = Number(delBtn.dataset.ownedNoteIdx);
    if (!isNaN(ni)) removeOwnedNote(ni);
  });
  ownedNotesList.addEventListener("input", onOwnedNotesInput);
  ownedNotesList.addEventListener("change", () => {
    if (WritingManager.selectedIndex !== null) {
      renderOwnedNotesList(WritingManager.selectedIndex);
    }
  });

  document.getElementById("btn-confirm-writing").addEventListener("click", confirmCurrentWriting);
  document.getElementById("btn-revert-writing").addEventListener("click", revertCurrentWriting);

  bindScrollSyncPair("wf-poemZh", "wf-translationKoOwned");
  bindScrollSyncPair("wf-jipyeongZh", "wf-jipyeongKoOwned");
}

function renderWritingList() {
  if (!Array.isArray(DATA.poem)) return;

  let list = DATA.poem.map((p, i) => [i, p]);

  if (WritingManager.searchText) {
    const q = WritingManager.searchText;
    list = list.filter(([, p]) => {
      const poemNo = String(p.poemNoStr || "").toLowerCase();
      const titleZh = String(p.title?.zh || "").toLowerCase();
      const titleKo = String(p.title?.ko || "").toLowerCase();
      const poetZh = String(p.poet?.zh || "").toLowerCase();
      const poetKo = String(p.poet?.ko || "").toLowerCase();
      return poemNo.includes(q) || titleZh.includes(q) || titleKo.includes(q) || poetZh.includes(q) || poetKo.includes(q);
    });
  }

  if (WritingManager.ownedOnly) {
    list = list.filter(([, p]) => hasOwnedContent(p));
  }

  list = sortWritingList(list, WritingManager.sortKey);

  const tbody = document.getElementById("writing-tbody");
  tbody.innerHTML = list.map(([idx, p]) => {
    const selected = idx === WritingManager.selectedIndex ? " selected" : "";
    const modified = isWritingModified(idx) ? " row-modified" : "";
    const meta = p.ownedContentMeta || {};
    const status = String(meta.status || (hasOwnedContent(p) ? "editing" : "drafted"));
    const editedBy = String(meta.editedBy || "-");
    return `<tr data-idx="${idx}" class="${selected}${modified}">
      <td>${escapeForWriting(p.poemNoStr || "")}</td>
      <td title="${escapeForWriting(p.title?.ko || "")}">${escapeForWriting(p.title?.zh || "")}</td>
      <td>${escapeForWriting(status)}</td>
      <td>${escapeForWriting(editedBy)}</td>
    </tr>`;
  }).join("");

  document.getElementById("writing-list-count").textContent =
    `${list.length}편 표시 / 총 ${DATA.poem.length}편`;
}

function sortWritingList(list, key) {
  const statusOrder = {
    drafted: 0,
    editing: 1,
    reviewed: 2,
    approved: 3,
    published: 4,
  };

  if (key === "status-asc") {
    return list.sort(([, a], [, b]) => {
      const as = String(a.ownedContentMeta?.status || (hasOwnedContent(a) ? "editing" : "drafted"));
      const bs = String(b.ownedContentMeta?.status || (hasOwnedContent(b) ? "editing" : "drafted"));
      const ad = statusOrder[as] ?? 99;
      const bd = statusOrder[bs] ?? 99;
      if (ad !== bd) return ad - bd;
      return (a.poemNo || 0) - (b.poemNo || 0);
    });
  }

  if (key === "updated-desc") {
    return list.sort(([, a], [, b]) => {
      const at = parseUpdatedAt(a.ownedContentMeta?.updatedAt);
      const bt = parseUpdatedAt(b.ownedContentMeta?.updatedAt);
      if (at !== bt) return bt - at;
      return (a.poemNo || 0) - (b.poemNo || 0);
    });
  }

  return list.sort(([, a], [, b]) => (a.poemNo || 0) - (b.poemNo || 0));
}

function selectWritingPoem(index) {
  WritingManager.selectedIndex = index;
  const poem = DATA.poem[index];
  if (!poem) return;
  ensureOwnedFields(poem);

  document.querySelectorAll("#writing-tbody tr").forEach((tr) => {
    tr.classList.toggle("selected", Number(tr.dataset.idx) === index);
  });

  document.getElementById("writing-edit-placeholder").hidden = true;
  document.getElementById("writing-edit-form-wrap").hidden = false;

  const title = poem.title?.zh || "";
  const poet = String(poem.poet?.zh || "").replace(/\[\d+\]/g, "").trim();
  document.getElementById("writing-edit-title").textContent = `${poem.poemNoStr || ""} — ${title} (${poet})`;

  const meta = poem.ownedContentMeta || {};
  document.getElementById("wf-poemNoStr").value = poem.poemNoStr || "";
  document.getElementById("wf-titleId").value = poem.titleId || "";
  document.getElementById("wf-status").value = String(meta.status || (hasOwnedContent(poem) ? "editing" : "drafted"));
  document.getElementById("wf-editedBy").value = meta.editedBy || "";
  document.getElementById("wf-reviewedBy").value = meta.reviewedBy || "";
  document.getElementById("wf-updatedAt").value = meta.updatedAt || "";

  document.getElementById("wf-poemZh").value = poem.poemZh || "";
  document.getElementById("wf-jipyeongZh").value = poem.jipyeongZh || "";

  document.getElementById("wf-titleZhOwned").value = poem.titleZhOwned || "";
  document.getElementById("wf-titleKoOwned").value = poem.titleKoOwned || "";
  document.getElementById("wf-poemZhOwned").value = poem.poemZhOwned || "";
  document.getElementById("wf-translationKoOwned").value = poem.translationKoOwned || "";
  document.getElementById("wf-jipyeongKoOwned").value = poem.jipyeongKoOwned || "";
  document.getElementById("wf-commentaryKoOwned").value = poem.commentaryKoOwned || "";

  document.getElementById("wf-legacy-translationKo").value = poem.translationKo || "";
  document.getElementById("wf-legacy-jipyeongKo").value = poem.jipyeongKo || "";

  renderWritingSourcePreviews(poem);
  renderOwnedNotesList(index);
  renderLegacyNotesList(index);
  updateWritingFieldHighlights(index);
}

function onWritingFormChange(e) {
  const idx = WritingManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  ensureOwnedFields(poem);

  const id = e.target.id;
  if (id === "wf-titleZhOwned") poem.titleZhOwned = e.target.value;
  if (id === "wf-titleKoOwned") poem.titleKoOwned = e.target.value;
  if (id === "wf-poemZhOwned") poem.poemZhOwned = e.target.value;
  if (id === "wf-translationKoOwned") poem.translationKoOwned = e.target.value;
  if (id === "wf-jipyeongKoOwned") poem.jipyeongKoOwned = e.target.value;
  if (id === "wf-commentaryKoOwned") poem.commentaryKoOwned = e.target.value;
  if (id === "wf-status") poem.ownedContentMeta.status = e.target.value;
  if (id === "wf-editedBy") poem.ownedContentMeta.editedBy = e.target.value;
  if (id === "wf-reviewedBy") poem.ownedContentMeta.reviewedBy = e.target.value;

  poem.ownedContentMeta.updatedAt = nowLocalString();
  document.getElementById("wf-updatedAt").value = poem.ownedContentMeta.updatedAt;

  updateWritingFieldHighlights(idx);
  renderWritingList();
  checkChanges();
}

function confirmCurrentWriting() {
  const idx = WritingManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  ensureOwnedFields(poem);
  // 기존 notes는 삭제하지 않고, 검수 확정 시 숨김 플래그로만 관리한다.
  poem.ownedContentMeta.legacyNotesHidden = true;
  poem.ownedContentMeta.updatedAt = nowLocalString();
  document.getElementById("wf-updatedAt").value = poem.ownedContentMeta.updatedAt;

  ORIGINAL.poem[idx] = structuredClone(poem);
  renderLegacyNotesList(idx);
  renderOwnedNotesList(idx);
  updateWritingFieldHighlights(idx);
  renderWritingList();
  checkChanges();

  const title = poem.title?.zh || poem.title?.ko || poem.poemNoStr;
  showToast(`"${title}" 집필본 확정 완료`);
}

function revertCurrentWriting() {
  const idx = WritingManager.selectedIndex;
  if (idx === null) return;
  const orig = ORIGINAL.poem?.[idx];
  if (!orig) return;

  if (!confirm("이 작품의 집필 변경사항을 되돌리시겠습니까?")) return;

  DATA.poem[idx] = structuredClone(orig);
  selectWritingPoem(idx);
  renderWritingList();
  checkChanges();
  showToast("집필 변경사항 되돌리기 완료");
}

function seedWritingSamples() {
  if (!Array.isArray(DATA.poem)) return;
  const now = nowLocalString();
  let touched = 0;

  WRITING_SAMPLE_IDS.forEach((poemNo) => {
    const idx = DATA.poem.findIndex((p) => String(p.poemNoStr || "") === poemNo);
    if (idx < 0) return;
    const poem = DATA.poem[idx];
    ensureOwnedFields(poem);

    let changed = false;
    if (!String(poem.translationKoOwned || "").trim()) {
      poem.translationKoOwned = buildSampleTranslation(poem);
      changed = true;
    }
    if (!String(poem.jipyeongKoOwned || "").trim()) {
      poem.jipyeongKoOwned = buildSampleJipyeong(poem);
      changed = true;
    }

    if (changed) touched++;
    poem.ownedContentMeta.status = poem.ownedContentMeta.status || "editing";
    poem.ownedContentMeta.editedBy = poem.ownedContentMeta.editedBy || "JIN";
    poem.ownedContentMeta.updatedAt = now;
    poem.ownedContentMeta.sampleSeed = true;
  });

  if (touched === 0) {
    showToast("샘플 5건이 이미 준비되어 있습니다.");
    return;
  }

  if (WritingManager.selectedIndex !== null) {
    selectWritingPoem(WritingManager.selectedIndex);
  }
  renderWritingList();
  checkChanges();
  showToast(`샘플 ${touched}건 생성 완료`);
}

function buildSampleTranslation(poem) {
  const title = poem.title?.ko || poem.title?.zh || poem.poemNoStr || "작품";
  const lines = String(poem.poemZh || "").replace(/\[\d+\]/g, "").split("\n").filter((v) => v.trim());
  const lineHints = lines.map((_, i) => `- ${i + 1}행:`).join("\n");
  return `[샘플 집필 초안] ${title}\n${lineHints}\n\n시의 정서와 장면을 평서문으로 자연스럽게 정리합니다.`;
}

function buildSampleJipyeong(poem) {
  const title = poem.title?.ko || poem.title?.zh || poem.poemNoStr || "작품";
  return `[샘플 집필 초안] ${title} 집평\n1) 핵심 평어를 현대 한국어로 요약합니다.\n2) 수사/전고/맥락을 짧게 보충합니다.\n3) 과도한 직역 표현은 다듬습니다.`;
}

function ensureOwnedFields(poem) {
  if (typeof poem.titleZhOwned !== "string") poem.titleZhOwned = "";
  if (typeof poem.titleKoOwned !== "string") poem.titleKoOwned = "";
  if (typeof poem.poemZhOwned !== "string") poem.poemZhOwned = "";
  if (typeof poem.translationKoOwned !== "string") poem.translationKoOwned = "";
  if (typeof poem.jipyeongKoOwned !== "string") poem.jipyeongKoOwned = "";
  if (typeof poem.commentaryKoOwned !== "string") poem.commentaryKoOwned = "";
  if (!Array.isArray(poem.notesOwned)) poem.notesOwned = [];
  if (!poem.ownedContentMeta || typeof poem.ownedContentMeta !== "object") {
    poem.ownedContentMeta = {
      status: "drafted",
      editedBy: "",
      reviewedBy: "",
      approvedBy: "",
      updatedAt: "",
      sampleSeed: false,
    };
  }
  if (typeof poem.ownedContentMeta.legacyNotesHidden !== "boolean") {
    poem.ownedContentMeta.legacyNotesHidden = false;
  }
}

function hasOwnedContent(poem) {
  return !!(
    String(poem.titleZhOwned || "").trim() ||
    String(poem.titleKoOwned || "").trim() ||
    String(poem.poemZhOwned || "").trim() ||
    String(poem.translationKoOwned || "").trim() ||
    String(poem.jipyeongKoOwned || "").trim() ||
    String(poem.commentaryKoOwned || "").trim() ||
    (Array.isArray(poem.notesOwned) && poem.notesOwned.length > 0)
  );
}

function isWritingModified(index) {
  if (!ORIGINAL.poem || !ORIGINAL.poem[index]) return false;
  return JSON.stringify(DATA.poem[index]) !== JSON.stringify(ORIGINAL.poem[index]);
}

function updateWritingFieldHighlights(index) {
  const curr = DATA.poem[index];
  const orig = ORIGINAL.poem?.[index];
  if (!curr || !orig) return;

  const pairs = [
    ["wf-titleZhOwned", curr.titleZhOwned, orig.titleZhOwned],
    ["wf-titleKoOwned", curr.titleKoOwned, orig.titleKoOwned],
    ["wf-poemZhOwned", curr.poemZhOwned, orig.poemZhOwned],
    ["wf-translationKoOwned", curr.translationKoOwned, orig.translationKoOwned],
    ["wf-jipyeongKoOwned", curr.jipyeongKoOwned, orig.jipyeongKoOwned],
    ["wf-commentaryKoOwned", curr.commentaryKoOwned, orig.commentaryKoOwned],
    ["wf-status", curr.ownedContentMeta?.status, orig.ownedContentMeta?.status],
    ["wf-editedBy", curr.ownedContentMeta?.editedBy, orig.ownedContentMeta?.editedBy],
    ["wf-reviewedBy", curr.ownedContentMeta?.reviewedBy, orig.ownedContentMeta?.reviewedBy],
  ];

  pairs.forEach(([id, a, b]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("modified-field", String(a ?? "") !== String(b ?? ""));
  });

  const currNotes = JSON.stringify(Array.isArray(curr.notesOwned) ? curr.notesOwned : []);
  const origNotes = JSON.stringify(Array.isArray(orig.notesOwned) ? orig.notesOwned : []);
  const notesFieldset = document.getElementById("wf-owned-notes-fieldset");
  if (notesFieldset) {
    notesFieldset.classList.toggle("writing-notes-modified", currNotes !== origNotes);
  }
}

function bindScrollSyncPair(leftId, rightId) {
  const left = document.getElementById(leftId);
  const right = document.getElementById(rightId);
  if (!left || !right) return;

  let locking = false;
  left.addEventListener("scroll", () => {
    if (locking) return;
    locking = true;
    right.scrollTop = left.scrollTop;
    locking = false;
  });
  right.addEventListener("scroll", () => {
    if (locking) return;
    locking = true;
    left.scrollTop = right.scrollTop;
    locking = false;
  });
}

function nowLocalString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function parseUpdatedAt(value) {
  const s = String(value || "").trim();
  if (!s) return 0;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (m) {
    const yyyy = Number(m[1]);
    const mm = Number(m[2]) - 1;
    const dd = Number(m[3]);
    const hh = Number(m[4]);
    const mi = Number(m[5]);
    return new Date(yyyy, mm, dd, hh, mi, 0).getTime();
  }
  return Date.parse(s) || 0;
}

function escapeForWriting(str) {
  if (typeof escapeHTMLAdmin === "function") return escapeHTMLAdmin(str);
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderWritingSourcePreviews(poem) {
  const poemPreview = document.getElementById("wf-poemZh-preview");
  const jipPreview = document.getElementById("wf-jipyeongZh-preview");
  if (!poemPreview || !jipPreview) return;

  const ownedNotes = Array.isArray(poem?.notesOwned) ? poem.notesOwned : [];

  poemPreview.innerHTML = buildDualNotePreviewHTML(poem?.poemZh || "", ownedNotes);
  jipPreview.innerHTML = buildDualNotePreviewHTML(poem?.jipyeongZh || "", ownedNotes);
}

function buildDualNotePreviewHTML(text, ownedNotes) {
  const raw = String(text || "");
  if (!raw.trim()) return '<span class="muted">원문 없음</span>';

  const withOwned = injectOwnedPreviewMarkers(raw, ownedNotes);
  let marked = withOwned
    .replace(/\[(\d+)\]/g, (_, no) => `__LEGACY_NOTE_${no}__`)
    .replace(/\[\[OWNED:(\d+)\]\]/g, (_, no) => `__OWNED_NOTE_${no}__`);

  let html = escapeForWriting(marked);
  html = html.replace(/__LEGACY_NOTE_(\d+)__/g, (_, no) =>
    `<sup class="writing-note-inline writing-note-inline-legacy">[${escapeForWriting(no)}]</sup>`
  );
  html = html.replace(/__OWNED_NOTE_(\d+)__/g, (_, no) =>
    `<sup class="writing-note-inline writing-note-inline-owned">[${escapeForWriting(no)}]</sup>`
  );

  return html.replace(/\n/g, "<br>");
}

function injectOwnedPreviewMarkers(text, notes) {
  let base = String(text || "");
  if (!base || !Array.isArray(notes) || notes.length === 0) return base;

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
    const token = `[[OWNED:${n.no}]]`;
    const idx = base.indexOf(n.head);
    if (idx < 0) continue;
    let insertAt = idx + n.head.length;
    const tail = base.slice(insertAt);
    const legacyMarker = tail.match(/^(\[\d+\])/);
    if (legacyMarker) insertAt += legacyMarker[0].length;
    base = `${base.slice(0, insertAt)}${token}${base.slice(insertAt)}`;
    usedNo.add(n.no);
  }

  return base;
}

function renderOwnedNotesList(index) {
  const poem = DATA.poem[index];
  const analysis = buildOwnedNoteAnalysis(poem);
  const notes = analysis.rows;
  const shown = WritingManager.newNotesOnly
    ? notes.filter((row) => row.status === "new")
    : notes;
  const statusLabel = {
    new: "신규",
    modified: "수정",
    unchanged: "유지",
  };
  const container = document.getElementById("wf-owned-notes-list");
  const countEl = document.getElementById("wf-owned-note-count");
  const summaryEl = document.getElementById("wf-owned-note-summary");

  countEl.textContent = WritingManager.newNotesOnly
    ? `${shown.length}/${notes.length}`
    : String(notes.length);

  if (summaryEl) {
    const { newCount, modifiedCount, unchangedCount } = analysis;
    const filterOn = WritingManager.newNotesOnly ? " · 신규만 보기 ON" : "";
    summaryEl.textContent = `신규 ${newCount} · 수정 ${modifiedCount} · 유지 ${unchangedCount}${filterOn}`;
  }

  if (notes.length === 0) {
    container.innerHTML = '<div class="writing-empty-note">집필 주석이 없습니다. 하단 버튼으로 추가하세요.</div>';
    return;
  }

  if (shown.length === 0) {
    container.innerHTML = '<div class="writing-empty-note">신규 주석이 없습니다. 필터를 해제하세요.</div>';
    return;
  }

  container.innerHTML = shown.map(({ note, ni, status }) => `
    <div class="note-edit-item note-status-${status}" data-owned-note-idx="${ni}">
      <div class="note-edit-header">
        <span class="note-num">[${escapeForWriting(note.no ?? ni + 1)}]</span>
        <input type="text"
               class="note-head-input"
               value="${escapeForWriting(note.head || "")}"
               placeholder="키워드"
               data-owned-note-field="head"
               data-owned-note-idx="${ni}">
        <span class="note-status-badge">${statusLabel[status]}</span>
        <button type="button" class="btn-del-note" data-owned-note-idx="${ni}" title="삭제">&times;</button>
      </div>
      <textarea class="note-text-input"
                rows="2"
                placeholder="주석 내용"
                data-owned-note-field="text"
                data-owned-note-idx="${ni}">${escapeForWriting(note.text || "")}</textarea>
    </div>
  `).join("");
}

function buildOwnedNoteAnalysis(poem) {
  const ownedNotes = Array.isArray(poem?.notesOwned) ? poem.notesOwned : [];
  const legacyNotes = Array.isArray(poem?.notes) ? poem.notes : [];
  const legacyExactSet = new Set();
  const legacyHeadMap = new Map();
  const legacyTextSet = new Set();

  legacyNotes.forEach((note) => {
    const head = normalizeNoteCompareValue(note?.head);
    const text = normalizeNoteCompareValue(note?.text);
    legacyExactSet.add(`${head}::${text}`);
    if (head) {
      if (!legacyHeadMap.has(head)) legacyHeadMap.set(head, new Set());
      legacyHeadMap.get(head).add(text);
    }
    if (text) legacyTextSet.add(text);
  });

  let newCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;

  const rows = ownedNotes.map((note, ni) => {
    const head = normalizeNoteCompareValue(note?.head);
    const text = normalizeNoteCompareValue(note?.text);
    const exactKey = `${head}::${text}`;

    let status = "new";
    if (legacyExactSet.has(exactKey)) {
      status = "unchanged";
      unchangedCount++;
    } else if ((head && legacyHeadMap.has(head)) || (text && legacyTextSet.has(text))) {
      status = "modified";
      modifiedCount++;
    } else {
      newCount++;
    }

    return { note, ni, status };
  });

  return { rows, newCount, modifiedCount, unchangedCount };
}

function normalizeNoteCompareValue(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderLegacyNotesList(index) {
  const poem = DATA.poem[index];
  const notes = Array.isArray(poem?.notes) ? poem.notes : [];
  const container = document.getElementById("wf-legacy-notes-list");
  const countEl = document.getElementById("wf-legacy-note-count");
  const isHidden = poem?.ownedContentMeta?.legacyNotesHidden === true;
  countEl.textContent = String(notes.length);

  if (isHidden) {
    container.innerHTML = '<div class="writing-empty-note">검수 확정으로 기존 주석은 히든 처리됨 (원본 데이터는 보존).</div>';
    return;
  }

  if (notes.length === 0) {
    container.innerHTML = '<div class="writing-empty-note">기존 주석이 없습니다.</div>';
    return;
  }

  container.innerHTML = notes.map((note) => `
    <div class="writing-legacy-note-item">
      <div class="writing-legacy-note-head">[${escapeForWriting(note.no || "")}] ${escapeForWriting(note.head || "")}</div>
      <div class="writing-legacy-note-text">${escapeForWriting(note.text || "")}</div>
    </div>
  `).join("");
}

function onOwnedNotesInput(e) {
  const idx = WritingManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  const field = e.target?.dataset?.ownedNoteField;
  const ni = Number(e.target?.dataset?.ownedNoteIdx);
  if (!field || isNaN(ni)) return;

  ensureOwnedFields(poem);
  if (!poem.notesOwned[ni]) return;

  poem.notesOwned[ni][field] = e.target.value;
  poem.ownedContentMeta.updatedAt = nowLocalString();
  document.getElementById("wf-updatedAt").value = poem.ownedContentMeta.updatedAt;

  renderWritingSourcePreviews(poem);
  updateWritingFieldHighlights(idx);
  checkChanges();
}

function addOwnedNote() {
  const idx = WritingManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  ensureOwnedFields(poem);
  const nextNo = poem.notesOwned.length > 0
    ? Math.max(...poem.notesOwned.map((n) => Number(n.no) || 0)) + 1
    : 1;
  poem.notesOwned.push({ no: nextNo, head: "", text: "" });

  poem.ownedContentMeta.updatedAt = nowLocalString();
  document.getElementById("wf-updatedAt").value = poem.ownedContentMeta.updatedAt;

  renderWritingSourcePreviews(poem);
  renderOwnedNotesList(idx);
  updateWritingFieldHighlights(idx);
  renderWritingList();
  checkChanges();
}

function removeOwnedNote(noteIndex) {
  const idx = WritingManager.selectedIndex;
  if (idx === null) return;
  const poem = DATA.poem[idx];
  if (!poem) return;

  ensureOwnedFields(poem);
  if (!poem.notesOwned[noteIndex]) return;

  if (!confirm(`집필 주석 [${poem.notesOwned[noteIndex].no || noteIndex + 1}]을 삭제하시겠습니까?`)) return;

  poem.notesOwned.splice(noteIndex, 1);
  poem.ownedContentMeta.updatedAt = nowLocalString();
  document.getElementById("wf-updatedAt").value = poem.ownedContentMeta.updatedAt;

  renderWritingSourcePreviews(poem);
  renderOwnedNotesList(idx);
  updateWritingFieldHighlights(idx);
  renderWritingList();
  checkChanges();
}
