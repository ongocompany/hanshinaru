// app.js
// ------------------------------------------------------------
// "동작" 담당:
// - JSON 로딩
// - 타임라인 렌더
// - 카드 아코디언
// - 클릭(시인/작품) → 시인 모달 열기 + 작품 섹션 펼치기
// ------------------------------------------------------------

// ===== 0) 공통 유틸 =====
async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${url}`);
  return res.json();
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeZhName(s) {
  // [1] 같은 주석번호만 제거 (공백은 그대로 둠)
  return String(s || "").replace(/\[\d+\]/g, "");
}

function normalizePoetName(s) {
  // 작가 매칭용 정규화: 주석번호 제거 + 직함 접두(예: "僧 ") 제거 + 공백 정리
  return normalizeZhName(s)
    .replace(/^僧\s+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatLife(life) {
  if (!life) return "";
  const b = life.birth ?? "";
  const d = life.death ?? "";
  if (b && d) return `${b}–${d}`;
  if (life.raw) return life.raw;
  return "";
}

function formatEventLife(life) {
  if (!life) return "";
  const b = life.birth;
  const d = life.death;
  if (b != null && d != null) return `${b}–${d}`;
  if (b != null) return String(b);
  if (life.raw) return life.raw;
  return "";
}

// ===== history 카드용: tags를 UI용 span으로 변환 =====
function getHistoryTagList(h) {
  // h.tags가 배열이면 그대로
  if (Array.isArray(h?.tags)) return h.tags;

  // h.tags가 { era:[], emperor:[], theme:[] } 형태면 합쳐서 배열로
  const era = Array.isArray(h?.tags?.era) ? h.tags.era : [];
  const emp = Array.isArray(h?.tags?.emperor) ? h.tags.emperor : [];
  // theme은 많아지기 쉬워서 카드에서는 선택적으로 1개만
  const theme = Array.isArray(h?.tags?.theme) ? h.tags.theme : [];

  return [...era, ...emp, ...(theme.slice(0, 1))];
}

function renderTagChips(tags, max = 3) {
  const arr = (tags || []).slice(0, max);
  if (!arr.length) return "";
  return arr.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("");
}

// ===== history 카드용: detail 문자열을 문단 배열로 =====
function splitParagraphs(text) {
  const s = String(text || "").trim();
  if (!s) return [];
  // 빈 줄 기준으로 문단 분리
  return s.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
}

function groupByKey(items, keyFn) {
  const map = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return map;
}

function groupByYear(items) {
  const map = new Map();
  for (const it of items) {
    if (it.year == null) continue;
    if (!map.has(it.year)) map.set(it.year, []);
    map.get(it.year).push(it);
  }
  return map;
}

// ===== 0.5) 주석 시스템 (하이브리드: 인라인 + 하단 리스트) =====
/**
 * 본문 텍스트에서 주석을 파싱하여 HTML로 변환
 * 예: "國破[1]山河在" → "<span class='note-word'>國破</span><sup>1</sup>山河在"
 *
 * @param {string} text - 원본 텍스트
 * @param {Array} notes - 주석 배열 [{ no, head, text }, ...]
 * @param {string} titleId - 작품 ID (ID 고유성 보장용)
 * @returns {string} HTML 문자열
 */
function parseTextWithNotes(text, notes, titleId = "") {
  if (!text) return "";
  if (!Array.isArray(notes) || notes.length === 0) return escapeHTML(text);

  // notes를 번호로 맵핑
  const notesByNo = new Map(notes.map(n => [String(n.no), n]));

  // 1단계: 모든 [번호] 위치 찾기
  const pattern = /\[(\d+)\]/g;
  const matches = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      noteNo: match[1]
    });
  }

  if (matches.length === 0) return escapeHTML(text);

  // 2단계: 각 [번호] 앞에 head 키워드가 있는지 확인
  for (const m of matches) {
    const note = notesByNo.get(m.noteNo);
    if (!note || !note.head) continue;

    const head = note.head;
    const headStart = m.index - head.length;

    // [번호] 바로 앞에 head가 있는지 확인
    if (headStart >= 0 && text.substring(headStart, m.index) === head) {
      m.headStart = headStart;
      m.headLength = head.length;
      m.noteText = note.text;
    }
  }

  // 3단계: 역순으로 HTML 생성 (인덱스 꼬임 방지)
  let result = "";
  let lastIndex = text.length;

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];

    // 매칭 후 텍스트
    result = escapeHTML(text.substring(m.index + m.length, lastIndex)) + result;

    // 고유 ID 생성 (titleId 포함)
    const uniqueId = titleId ? `${titleId}-${m.noteNo}` : m.noteNo;

    if (m.headStart !== undefined) {
      // head 키워드가 있으면
      const keyword = text.substring(m.headStart, m.index);
      result =
        `<span class="note-word" id="note-ref-${uniqueId}" data-note-no="${m.noteNo}" data-note-text="${escapeHTML(m.noteText)}">${escapeHTML(keyword)}</span>` +
        `<sup class="note-ref">${m.noteNo}</sup>` +
        result;
      lastIndex = m.headStart;
    } else {
      // head 키워드가 없으면 [번호]만 윗첨자로
      result = `<sup class="note-ref" id="note-ref-${uniqueId}">${m.noteNo}</sup>` + result;
      lastIndex = m.index;
    }
  }

  // 시작 부분 추가
  result = escapeHTML(text.substring(0, lastIndex)) + result;

  return result;
}

/**
 * 툴팁 요소 가져오기 (없으면 생성)
 */
function getOrCreateTooltip() {
  let tooltip = document.getElementById("annotation-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "annotation-tooltip";
    tooltip.className = "annotation-tooltip";
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

/**
 * 툴팁 위치 계산 - 마우스 커서 기준 (모달 내부로 제한)
 * @param {HTMLElement} tooltip - 툴팁 요소
 * @param {number} mouseX - 마우스 X 좌표 (viewport 기준)
 * @param {number} mouseY - 마우스 Y 좌표 (viewport 기준)
 * @param {HTMLElement} modal - 모달 요소
 */
function positionTooltipAtCursor(tooltip, mouseX, mouseY, modal) {
  const modalBox = modal.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  // 기본 위치: 커서 우측 하단 (viewport 기준)
  let top = mouseY + 10;   // 커서 아래 10px
  let left = mouseX + 10;  // 커서 오른쪽 10px

  // 우측 경계 체크: 모달 밖으로 나가면 좌측으로
  if (left + tooltipRect.width > modalBox.right) {
    left = mouseX - tooltipRect.width - 10;
  }

  // 하단 경계 체크: 모달 밖으로 나가면 상단으로
  if (top + tooltipRect.height > modalBox.bottom) {
    top = mouseY - tooltipRect.height - 10;
  }

  // 좌측 경계 체크
  if (left < modalBox.left) {
    left = modalBox.left + 10;
  }

  // 상단 경계 체크
  if (top < modalBox.top) {
    top = modalBox.top + 10;
  }

  // viewport 기준 fixed positioning
  tooltip.style.position = "fixed";
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

/**
 * 주석 툴팁 표시
 * @param {HTMLElement} element - 주석 키워드 요소
 * @param {string} content - 툴팁 내용
 * @param {number} mouseX - 마우스 X 좌표
 * @param {number} mouseY - 마우스 Y 좌표
 */
function showAnnotationTooltip(element, content, mouseX, mouseY) {
  const tooltip = getOrCreateTooltip();
  const modal = document.getElementById("modal");
  if (!modal) return;

  tooltip.textContent = content;
  tooltip.hidden = false;

  // 마우스 커서 기준 위치 계산
  positionTooltipAtCursor(tooltip, mouseX, mouseY, modal);
}

/**
 * 주석 툴팁 숨기기
 */
function hideAnnotationTooltip() {
  const tooltip = document.getElementById("annotation-tooltip");
  if (tooltip) tooltip.hidden = true;
}

/**
 * 주석 호버 이벤트 바인딩
 * @param {HTMLElement} container - 이벤트를 바인딩할 컨테이너 (보통 modal-body)
 */
function bindAnnotationHovers(container) {
  container.addEventListener("mouseover", (e) => {
    const noteWord = e.target.closest(".note-word");
    if (!noteWord) return;

    const noteText = noteWord.dataset.noteText;
    if (!noteText) return;

    // 마우스 좌표 전달
    showAnnotationTooltip(noteWord, noteText, e.clientX, e.clientY);
  });

  container.addEventListener("mouseout", (e) => {
    const noteWord = e.target.closest(".note-word");
    if (!noteWord) return;

    hideAnnotationTooltip();
  });
}

/**
 * 주석 크로스 링크 바인딩 (본문 ↔ 하단 양방향 이동)
 * @param {HTMLElement} container - 이벤트를 바인딩할 컨테이너 (보통 modal-body)
 */
function bindNoteCrossLinks(container) {
  container.addEventListener("click", (e) => {
    // 본문 주석 키워드 클릭 → 하단 주석으로 스크롤
    const noteWord = e.target.closest(".note-word");
    if (noteWord) {
      // ID에서 고유 식별자 추출 (예: "note-ref-C8-1" → "C8-1")
      const fullId = noteWord.id.replace("note-ref-", "");
      const targetItem = document.getElementById(`note-item-${fullId}`);
      if (targetItem) {
        targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
        // 하이라이트 효과
        targetItem.classList.add("highlight-flash");
        setTimeout(() => targetItem.classList.remove("highlight-flash"), 2000);
      }
      return;
    }

    // 윗첨자 번호 클릭 → 하단 주석으로 스크롤
    const noteRef = e.target.closest(".note-ref");
    if (noteRef) {
      // ID에서 고유 식별자 추출 (예: "note-ref-C8-1" → "C8-1")
      const fullId = noteRef.id.replace("note-ref-", "");
      const targetItem = document.getElementById(`note-item-${fullId}`);
      if (targetItem) {
        targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
        targetItem.classList.add("highlight-flash");
        setTimeout(() => targetItem.classList.remove("highlight-flash"), 2000);
      }
      return;
    }

    // 하단 주석 번호 또는 키워드 클릭 → 본문 주석으로 스크롤
    const noteNoSpan = e.target.closest(".note-no");
    const noteHeadSpan = e.target.closest(".note-head");

    if (noteNoSpan || noteHeadSpan) {
      // note-item에서 고유 식별자 찾기 (예: "note-item-C8-1" → "C8-1")
      const noteItem = e.target.closest(".note-item");
      if (noteItem) {
        const fullId = noteItem.id.replace("note-item-", "");
        const targetRef = document.getElementById(`note-ref-${fullId}`);
        if (targetRef) {
          targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
          // 하이라이트 효과
          targetRef.classList.add("highlight-flash");
          setTimeout(() => targetRef.classList.remove("highlight-flash"), 2000);
        }
      }
      return;
    }
  });
}

// ===== 1) 더미 UI =====
const DUMMY_UI = {
  defaultAvatar: "public/assets/avatars/default-author.jpg",
  authorTags: ["성당", "시성", "대표"],
  historyTags: ["사건"],
};

// ===== 2) 카드 렌더 =====
function renderAuthorCard(a) {
  const tags = DUMMY_UI.authorTags.map(t => `<span class="tag">${t}</span>`).join("");

  // ✅ 중요: w.poemId / w.titleId 혼재 대응
  const works = (a.works || []).map(w => {
    const pid = w.poemId || w.titleId || "";            // <-- 핵심
    const no  = w.poemNoStr || w.poemNo || "";
    const t   = w.titleCompact || w.title || "";
    const m   = w.meta || "";

    return `
      <li class="work-item" data-poem-id="${escapeHTML(pid)}">
        <span class="work-no">${escapeHTML(no)}</span>
        <span class="work-title">${escapeHTML(t)}</span>
        <span class="work-meta">${escapeHTML(m)}</span>
      </li>
    `;
  }).join("");

  return el(`
    <article class="card author-card compact" data-author-id="${escapeHTML(a.authorId)}">
      <div class="author-top">
        <img class="author-avatar" src="${DUMMY_UI.defaultAvatar}" alt="" />
        <div class="author-main">
          <div class="author-name">
            ${a.nameKo ? `${escapeHTML(a.nameKo)} ` : ""}
            <span class="zh">${escapeHTML(a.nameZh)}</span>
            ${a.lifeStr ? `<span class="life">${escapeHTML(a.lifeStr)}</span>` : ""}
          </div>
          <div class="author-tags">${tags}</div>
        </div>
      </div>

      <div class="author-bio">${escapeHTML(a.bio || "")}</div>

      <button class="works-toggle works-handle" aria-expanded="false" title="작품 펼치기">
        <span class="chev">▾</span>
      </button>

      <div class="works-panel" hidden>
        <ul class="works-list">${works}</ul>
      </div>
    </article>
  `);
}

function renderHistoryCard(h) {
  const title = h?.name?.ko || h?.name?.zh || h.title || "";
  const zh = h?.name?.zh ? ` <span class="zh">${escapeHTML(h.name.zh)}</span>` : "";
  const lifeStr = formatEventLife(h.life);
  const tags = renderTagChips(getHistoryTagList(h) || DUMMY_UI.historyTags, 3);


  const summary = (h.summary || "").split("\n")[0] || "";
  const paragraphs = splitParagraphs(h.detail);
  const detailHTML = paragraphs.length
    ? `<div class="history-detail-paras">
        ${paragraphs.slice(0, 2).map(p => `<p>${escapeHTML(p)}</p>`).join("")}
      </div>`
    : `<div class="muted">상세 없음</div>`;


  return el(`
    <article class="card history-card compact" data-history-id="${escapeHTML(h.titleId || h.id || "")}">
      <div class="history-top">
        <div class="history-main">
          <div class="history-title">${escapeHTML(title)}${zh}</div>
          <div class="history-sub">
            ${lifeStr ? `<span class="life">${escapeHTML(lifeStr)}</span>` : ""}
            <span class="history-tags">${tags}</span>
          </div>
        </div>
        <img class="history-avatar" src="${DUMMY_UI.defaultAvatar}" alt="" />
      </div>

      <div class="history-desc">${escapeHTML(summary)}</div>

      <button class="works-toggle works-handle" aria-expanded="false" title="상세 펼치기">
        <span class="chev">▾</span>
      </button>

      <div class="works-panel" hidden>
        <div class="history-detail">${detailHTML}</div>
      </div>
    </article>
  `);
}

function renderPrimaryItem(year, leftNodes = [], rightNodes = []) {
  const row = el(`
    <div class="timeline-item primary">
      <div class="timeline-left"></div>
      <div class="timeline-marker primary"><span class="year">${year}</span></div>
      <div class="timeline-right"></div>
    </div>
  `);

  const L = row.querySelector(".timeline-left");
  const R = row.querySelector(".timeline-right");
  leftNodes.forEach(n => L.appendChild(n));
  rightNodes.forEach(n => R.appendChild(n));
  return row;
}

// ===== 3) 타임라인 카드 아코디언 =====
function bindAccordions(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".works-toggle");
    if (!btn) return;

    const card = btn.closest(".card");
    const panel = card?.querySelector(".works-panel");
    if (!card || !panel) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";

    // 다른 카드 닫기
    root.querySelectorAll(".card.expanded").forEach(c => {
      if (c !== card) {
        c.classList.remove("expanded");
        const p = c.querySelector(".works-panel");
        const b = c.querySelector(".works-toggle");
        if (p) p.hidden = true;
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });

    btn.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
    card.classList.toggle("expanded", !expanded);
  });
}

// ===== 4) 모달 =====
function openModal({ title, bodyHTML }) {
  const overlay = document.getElementById("modal-overlay");
  const t = document.getElementById("modal-title");
  const b = document.getElementById("modal-body");
  if (!overlay || !t || !b) throw new Error("Modal elements missing");

  t.textContent = title || "";
  b.innerHTML = bodyHTML || "";

  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
}

function bindModalUI() {
  const overlay = document.getElementById("modal-overlay");
  const closeBtn = document.getElementById("modal-close");
  if (!overlay || !closeBtn) return;

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ===== 5) 모달 내부: 작품 섹션 =====
function renderPoemSection(p) {
  const poemNoStr = p.poemNoStr || String(p.poemNo ?? "").padStart(3, "0");
  const notes  = Array.isArray(p.notes) ? p.notes : [];
  const titleId = p.titleId || "";  // 고유 ID (예: "C8", "C9")

  // 제목도 주석 파싱 (펼침/접힘 상태 모두 적용)
  const titleFullRaw = p?.title?.zh ?? "";
  const titleFull = parseTextWithNotes(titleFullRaw, notes, titleId);
  const titleCompact = parseTextWithNotes(normalizeZhName(titleFullRaw), notes, titleId);

  const meta = [p.category, p.juan, p.meter ? `${p.meter}언` : ""].filter(Boolean).join(" · ");

  // 시인 이름 파싱 (주석이 있을 수 있음)
  const poetZh = p?.poet?.zh ?? "";
  const poetParsed = parseTextWithNotes(poetZh, notes, titleId);

  // 본문 파싱
  let poemZh = parseTextWithNotes(p.poemZh || "", notes, titleId);

  // 시인 이름에 주석이 있으면 본문 앞에 추가
  if (poetZh && /\[\d+\]/.test(poetZh)) {
    poemZh = poetParsed + "<br><br>" + poemZh;
  }

  const jipZh  = escapeHTML(p.jipyeongZh || "");  // 집평은 주석 없음

  const notesHTML = notes.length
    ? `<ul class="note-list">${notes.map(n => `
        <li class="note-item" id="note-item-${titleId}-${n.no}">
          <span class="note-no" data-target-ref="${titleId}-${n.no}">[${escapeHTML(n.no)}]</span>
          <span class="note-head">${escapeHTML(n.head || "")}</span>
          <span class="note-text">${escapeHTML(n.text || "")}</span>
        </li>
      `).join("")}</ul>`
    : `<div class="muted">주석 없음</div>`;

  const trKo  = escapeHTML(p.translationKo || "");
  const jipKo = escapeHTML(p.jipyeongKo || "");

  const pinyin = escapeHTML(p.pinyin || "");
  const pingze = escapeHTML(p.pingze || "");

  return `
    <section class="poem-sec" data-poem-sec="${escapeHTML(p.titleId)}">
      <button class="poem-head" type="button" aria-expanded="false">
        <div class="poem-head-line">
          <span class="poem-no">${escapeHTML(poemNoStr)}</span>
          <span class="poem-title compact">${titleCompact}</span>
          <span class="poem-title full">${titleFull}</span>
        </div>
        <div class="poem-head-meta">${escapeHTML(meta)}</div>
      </button>

      <div class="poem-body" hidden>
        <div class="poem-block">
          <div class="block-title">시 본문(한자)</div>
          <div class="block-box pre">${poemZh}</div>
        </div>

        <div class="poem-block">
          <div class="block-title">집평(한자)</div>
          <div class="block-box pre">${jipZh || `<span class="muted">집평 없음</span>`}</div>
        </div>

        <div class="poem-block notes">
          <div class="block-title">주석</div>
          <div class="block-box">${notesHTML}</div>
        </div>

        <button class="subtoggle" type="button" aria-expanded="false">상세보기 ▾</button>
        <div class="subpanel" hidden>
          <div class="poem-block">
            <div class="block-title">시 번역문</div>
            <div class="block-box pre">${trKo || `<span class="muted">번역 없음</span>`}</div>
          </div>
          <div class="poem-block">
            <div class="block-title">집평 번역문</div>
            <div class="block-box pre">${jipKo || `<span class="muted">집평 번역 없음</span>`}</div>
          </div>

          <button class="subtoggle deep" type="button" aria-expanded="false">심화자료 ▾</button>
          <div class="subpanel deep" hidden>
            <div class="poem-block">
              <div class="block-title">병음</div>
              <div class="block-box pre">${pinyin || `<span class="muted">준비중</span>`}</div>
            </div>
            <div class="poem-block">
              <div class="block-title">평측</div>
              <div class="block-box pre">${pingze || `<span class="muted">준비중</span>`}</div>
            </div>
            <div class="poem-block">
              <div class="block-title">멀티미디어</div>
              <div class="block-box"><span class="muted">유튜브 낭송/낭독 음원 등 (준비중)</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function bindPoemSections(modalBody) {
  // 작품 섹션 아코디언 (한 번에 하나)
  modalBody.addEventListener("click", (e) => {
    const head = e.target.closest(".poem-head");
    if (!head) return;

    const sec = head.closest(".poem-sec");
    const body = sec?.querySelector(".poem-body");
    if (!sec || !body) return;

    const expanded = head.getAttribute("aria-expanded") === "true";

    // 다른 섹션 닫기
    modalBody.querySelectorAll(".poem-sec").forEach(s => {
      if (s !== sec) {
        const h = s.querySelector(".poem-head");
        const b = s.querySelector(".poem-body");
        if (h) h.setAttribute("aria-expanded", "false");
        if (b) b.hidden = true;
        s.classList.remove("expanded");
        // nested 초기화
        s.querySelectorAll(".subtoggle").forEach(btn => btn.setAttribute("aria-expanded", "false"));
        s.querySelectorAll(".subpanel").forEach(p => p.hidden = true);
      }
    });

    head.setAttribute("aria-expanded", String(!expanded));
    body.hidden = expanded;
    sec.classList.toggle("expanded", !expanded);
  });

  // 상세보기/심화자료 토글
  modalBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".subtoggle");
    if (!btn) return;

    const panel = btn.nextElementSibling;
    if (!panel || !panel.classList.contains("subpanel")) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });
}

// ===== 6) 시인 모달 =====
function openAuthorModal(authorId, ctx) {
  const a = STATE.authorById.get(authorId);
  if (!a) {
    console.warn("[openAuthorModal] missing authorId:", authorId);
    return;
  }

  const lifeStr = formatLife(a.life) || a.life?.raw || "";
  const nameKo = a.name?.ko || "";
  const nameZh = normalizeZhName(a.name?.zh || "");

  const tags = DUMMY_UI.authorTags.map(t => `<span class="tag">${t}</span>`).join("");

  const poems = STATE.poemsByAuthorId.get(authorId) || [];
  const poemsHTML = poems.map(renderPoemSection).join("");

  const bodyHTML = `
    <div class="author-modal">
      <section class="author-hero">
        <img class="author-photo" src="${DUMMY_UI.defaultAvatar}" alt="" />
        <div class="author-meta">
          <div class="author-name-line">
            <span class="name-ko">${escapeHTML(nameKo)}</span>
            <span class="name-zh">(${escapeHTML(nameZh)})</span>
          </div>
          <div class="author-life">${escapeHTML(lifeStr)}</div>
          <div class="author-tags">${tags}</div>
        </div>
      </section>

      <section class="author-grid2">
        <div class="panel">
          <div class="panel-title">출생지</div>
          <div class="panel-sub">출생지 자동 추출(백엔드 후처리 예정)</div>
          <div class="panel-box placeholder">지도(준비중)</div>
        </div>
        <div class="panel">
          <div class="panel-title">관계도</div>
          <div class="panel-sub">교유/제자/영향 관계(준비중)</div>
          <div class="panel-box placeholder">관계도(준비중)</div>
        </div>
      </section>

      <section class="author-bio-full">
        <div class="block-title">설명</div>
        <div class="block-box">${escapeHTML(a.bioKo || "")}</div>
      </section>

      <section class="author-works-full">
        <div class="block-title">작품</div>
        <div class="poem-list">
          ${poemsHTML || `<div class="muted">작품 없음</div>`}
        </div>
      </section>
    </div>
  `;

  openModal({ title: "시인", bodyHTML });

  const modalBody = document.getElementById("modal-body");
 if (!modalBody.dataset.poemBound) {
  bindPoemSections(modalBody);
  bindAnnotationHovers(modalBody);  // 주석 툴팁 호버 이벤트 바인딩
  bindNoteCrossLinks(modalBody);    // 본문 ↔ 하단 크로스 링크 바인딩
  modalBody.dataset.poemBound = "1";
}

  // 특정 작품으로 진입: 자동 펼침 + 스크롤
  if (ctx?.openPoemId) {
    try {
      const sel = `.poem-sec[data-poem-sec="${CSS.escape(ctx.openPoemId)}"]`;
      const sec = modalBody.querySelector(sel);
      if (!sec) {
        console.warn("[auto-open] poem section not found:", ctx.openPoemId);
        return;
      }
      const head = sec.querySelector(".poem-head");
      if (head) head.click();
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      console.warn("[auto-open] failed:", err);
    }
  }
}

// ===== 6.5) 역사 모달 =====
function openHistoryModal(historyId) {
  // ✅ historyId는 카드의 data-history-id에서 넘어옵니다.
  // 우리 스키마에서는 보통 titleId(H001 같은 값)로 들어오므로,
  // STATE.historyById 맵도 같은 키(titleId)로 만들어져 있어야 합니다.
  const h = STATE.historyById.get(historyId);
  if (!h) {
    console.warn("[openHistoryModal] missing historyId:", historyId);
    return; // 데이터가 없으면 조용히 종료 (사이트 전체가 멈추는 것 방지)
  }

  // ===== 1) 상단(제목/연도/태그) =====
  const title = h?.name?.ko || h?.name?.zh || h.title || "";
  const zhText = h?.name?.zh ? normalizeZhName(h.name.zh) : "";
  const zh = zhText ? `(${zhText})` : "";
  const lifeStr = formatEventLife(h.life);

  // ✅ history.tags는 배열이 아니라 객체({era/emperor/theme})일 수 있어요.
  // 그래서 getHistoryTagList()로 "배열 형태"로 만든 뒤 칩으로 렌더합니다.
  const tags = renderTagChips(getHistoryTagList(h) || DUMMY_UI.historyTags, 6);

  // ===== 2) 요약/설명(문단 렌더) =====
  // summary는 보통 한 덩어리 문자열(긴 문장)이므로, 그대로 보여주되 줄바꿈이 있으면 줄 단위로 나눕니다.
  const summaryLines = String(h.summary || "").split("\n").map(s => s.trim()).filter(Boolean);
  const summaryHTML = summaryLines.length
    ? `<div class="block-box">${summaryLines.map(s => `<p>${escapeHTML(s)}</p>`).join("")}</div>`
    : `<div class="block-box muted">요약 없음</div>`;

  // detail은 \n\n(빈 줄) 기준으로 문단이 나뉘어 있으니 splitParagraphs로 <p> 처리합니다.
  const paragraphs = splitParagraphs(h.detail);
  const detailHTML = paragraphs.length
    ? `<div class="history-detail-paras modal">
        ${paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join("")}
      </div>`
    : `<div class="muted">상세 없음</div>`;

  // ✅ 역사 모달은 시인 모달 폼을 기준으로 간다.
  // - 2칼럼(출생지/관계도) 대신 지도 1개를 풀-폭으로 둔다.
  // - 작품 리스트 섹션은 없다.
  // - [요약]/[설명] 같은 라벨 타이틀은 넣지 않는다.
  const bodyHTML = `
    <div class="author-modal history-modal">
      <section class="author-hero">
        <img class="author-photo" src="${DUMMY_UI.defaultAvatar}" alt="" />
        <div class="author-meta">
          <div class="author-name-line">
            <span class="name-ko">${escapeHTML(title)}</span>
            ${zh ? `<span class="name-zh">${escapeHTML(zh)}</span>` : ""}
          </div>
          ${lifeStr ? `<div class="author-life">${escapeHTML(lifeStr)}</div>` : ""}
          <div class="author-tags">${tags}</div>
        </div>
      </section>

      <section class="history-map-full">
        <div class="panel">
          <div class="panel-box placeholder">지도(준비중)</div>
        </div>
      </section>

      <section class="history-summary">
        ${summaryHTML}
      </section>

      <section class="history-detail-sec">
        <div class="block-box">${detailHTML}</div>
      </section>

      <section class="history-media">
        <div class="panel">
          <div class="panel-box placeholder">멀티미디어(준비중)</div>
        </div>
      </section>
    </div>
  `;

  openModal({ title: "사건", bodyHTML });
}


// ===== 7) 클릭 → 모달 열기 =====
function bindModalOpeners(root) {
  root.addEventListener("click", (e) => {
    // (1) 작품 클릭: 시인 모달 열고 해당 작품 펼치기
    const work = e.target.closest(".work-item[data-poem-id]");
    if (work) {
      const poemId = work.getAttribute("data-poem-id") || "";
      if (!poemId) return;

      const p = STATE.poemById.get(poemId);
      if (!p) {
        // ✅ 여기서 조용히 실패(사이트 멈춤 방지), 콘솔만 남김
        console.warn("[work click] poem not found:", poemId);
        return;
      }

      // 1차: poet.zh → authorId 매핑
      const poetKey = normalizePoetName(p?.poet?.zh || "");
      let authorId = STATE.authorIdByPoetZh.get(poetKey);

      // 2차 fallback: authors를 돌며 name.zh 정규화 비교
      if (!authorId && poetKey) {
        for (const [aid, a] of STATE.authorById.entries()) {
          const k = normalizePoetName(a?.name?.zh || "");
          if (k === poetKey) {
            authorId = aid;
            break;
          }
        }
      }

      if (!authorId) {
        console.warn("[work click] author match failed:", { poemId, poetKey, poetZh: p?.poet?.zh });
        return;
      }

      openAuthorModal(authorId, { openPoemId: poemId });
      e.stopPropagation();
      return;
    }

    // (2) 시인 카드 클릭(핸들 제외)
    const card = e.target.closest(".author-card[data-author-id]");
    if (card) {
      if (e.target.closest(".works-toggle")) return;
      const authorId = card.getAttribute("data-author-id");
      if (!authorId) return;
      openAuthorModal(authorId, {});
      return;
    }

    // (3) 역사 카드 클릭(핸들 제외)
    const hcard = e.target.closest(".history-card[data-history-id]");
    if (hcard) {
      if (e.target.closest(".works-toggle")) return;
      const hid = hcard.getAttribute("data-history-id");
      if (!hid) return;
      openHistoryModal(hid);
    }
  });
}

// ===== 8) 데이터 결합 =====
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

    // ✅ works는 "poemId"로 통일
    const works = worksRaw.map(p => ({
      poemId: p.titleId,
      poemNoStr: p.poemNoStr || String(p.poemNo ?? "").padStart(3, "0"),
      titleCompact: normalizeZhName(p?.title?.zh || ""),
      meta: [p.category, p.juan].filter(Boolean).join(" · "),
    }));

    events.push({
      year,
      authorId,
      nameZh,
      nameKo,
      lifeStr,
      bio: (a?.bioKo || "").slice(0, 120),
      works,
    });
  }

  return events.sort((x, y) => (x.year ?? 9999) - (y.year ?? 9999));
}

function buildAuthorPoemIndex(authorsDB, poemsCompact) {
  const poems = Array.isArray(poemsCompact) ? poemsCompact : (poemsCompact.items || []);
  const poemById = new Map(poems.map(p => [p.titleId, p]));

  const authors = Object.values(authorsDB.authors || {});
  const authorById = new Map(authors.map(a => [a.titleId, a]));

  // poet.zh(정규화) → authorId 매핑
  const authorIdByPoetZh = new Map();
  for (const a of authors) {
    const k = normalizePoetName(a?.name?.zh || "");
    if (k) authorIdByPoetZh.set(k, a.titleId);
  }

  // authorId → poems[]
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

// ===== 10) 전역 상태 =====
const STATE = {
  poemById: new Map(),
  authorById: new Map(),
  poemsByAuthorId: new Map(),
  authorIdByPoetZh: new Map(),
  historyById: new Map(),
};

// ===== 11) main =====
async function main() {
  const root = document.getElementById("timeline");
  if (!root) throw new Error("Missing #timeline");

  const [authorsDB, poemsCompact, poemsFull, historyCards] = await Promise.all([
    loadJSON("public/index/db_author.with_ko.json"),
    loadJSON("public/index/poems.compact.json"),
    loadJSON("public/index/poems.full.json").catch(() => poemsCompact),
    loadJSON("public/index/history_cards.json"),
  ]);

  const idx = buildAuthorPoemIndex(authorsDB, poemsFull);
  STATE.poemById = idx.poemById;
  STATE.authorById = idx.authorById;
  STATE.poemsByAuthorId = idx.poemsByAuthorId;
  STATE.authorIdByPoetZh = idx.authorIdByPoetZh;

  const hcArr = Array.isArray(historyCards) ? historyCards : (historyCards.items || []);

  // ✅ 중요: history 카드 클릭에서 넘어오는 값은 data-history-id(= titleId, 예: H001)입니다.
  // 그래서 historyById 맵도 'titleId'를 키로 만들어 두면 클릭 → 모달 조회가 바로 됩니다.
  STATE.historyById = new Map(hcArr.map(h => [h.titleId || h.id, h]));

  const authorEvents = buildAuthorEvents(authorsDB, poemsCompact);

  const historyEvents = hcArr
    .filter(h => h && h.year != null)
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));

  const aByYear = groupByYear(authorEvents);
  const hByYear = groupByYear(historyEvents);
  const years = Array.from(new Set([...aByYear.keys(), ...hByYear.keys()])).sort((a, b) => a - b);

  for (const y of years) {
    const left = (aByYear.get(y) || []).slice(0, 2).map(renderAuthorCard);
    const right = (hByYear.get(y) || []).map(renderHistoryCard);
    root.appendChild(renderPrimaryItem(y, left, right));
  }

  const unknownYearAuthors = authorEvents
    .filter(a => a.year == null)
    .sort((a, b) => {
      const ak = String(a.nameKo || "").trim();
      const bk = String(b.nameKo || "").trim();
      return ak.localeCompare(bk, "ko");
    });
  if (unknownYearAuthors.length) {
    root.appendChild(
      renderPrimaryItem("연도 미상", unknownYearAuthors.map(renderAuthorCard), [])
    );
  }

  bindAccordions(root);
  bindModalUI();
  bindModalOpeners(root);
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});
