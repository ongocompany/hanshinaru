// app.js
// ------------------------------------------------------------
// "동작" 담당:
// - JSON 로딩
// - 타임라인 렌더
// - 카드 아코디언
// - 클릭(시인/작품) → 시인 모달 열기 + 작품 섹션 펼치기
// ------------------------------------------------------------

// ===== [v2 리뉴얼] 시대별 타임라인 상수 =====
// 기존: 연도(year)별 가로 행 → 변경: 시대(era)별 세로 타임라인
const ERA_CONFIG = [
  { key: "pre",   label: "隋",       zhLabel: "隋"      },
  { key: "early", label: "초당",     zhLabel: "初唐"    },
  { key: "high",  label: "성당",     zhLabel: "盛唐"    },
  { key: "mid",   label: "중당",     zhLabel: "中唐"    },
  { key: "late",  label: "만당",     zhLabel: "晩唐"    },
  { key: "post",  label: "오대십국", zhLabel: "五代十國" },
];

// [v2 리뉴얼] 오른쪽에 큰 카드로 표시할 메인 역사 이벤트 4개
// 나머지는 점+제목만 표시하고 호버시 summary 팝업
const MAIN_HISTORY_IDS = new Set(["H001", "H003", "H005", "H007"]);

// [v3 시대섹션 리디자인] 시대별 상세 정보 + 분기점 사건 ID
const ERA_DETAILS = {
  early: { yearRange: "618~712", featuredEventId: "H001" },
  high:  { yearRange: "713~765", featuredEventId: "H003" },
  mid:   { yearRange: "766~835", featuredEventId: "H005" },
  late:  { yearRange: "836~907", featuredEventId: "H007" },
};

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

function hexToRgb(hex) {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `${r},${g},${b}`;
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

// ===== 주석 표시(†) 숨김 처리 =====
// escapeHTML 후에 적용: †를 hidden span으로 감싸서 CSS로 on/off 가능
function hideDaggers(escapedHTML) {
  return escapedHTML.replace(/†/g, '<span class="note-dagger">†</span>');
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

/* [v2 리뉴얼] 기존 연도별 그룹핑 → main()에서 더 이상 사용하지 않지만 유틸로 보존 */
function groupByYear(items) {
  const map = new Map();
  for (const it of items) {
    if (it.year == null) continue;
    if (!map.has(it.year)) map.set(it.year, []);
    map.get(it.year).push(it);
  }
  return map;
}

// ===== [v2 리뉴얼] 시대별 그룹핑 유틸 =====

// 연도와 다른 시대에 배치해야 하는 역사 이벤트 오버라이드
// (안사의 난은 755년이지만 중당의 분기점, 두보 전란 체험도 중당 소속)
const HISTORY_ERA_OVERRIDE = {
  "H005": "mid",   // 안사의 난 (755) → 중당 분기점
  "H020": "mid",   // 두보와 전란의 체험 (760) → 중당
};

// 역사 이벤트의 연도 → 시대(era) 매핑
// 시인은 DB에 era.period가 있지만, 역사 이벤트는 연도로 판별해야 함
// titleId가 있으면 오버라이드 먼저 확인
function getHistoryEra(year, titleId) {
  if (titleId && HISTORY_ERA_OVERRIDE[titleId]) return HISTORY_ERA_OVERRIDE[titleId];
  if (year == null) return null;
  if (year < 618)  return "pre";    // 수나라
  if (year < 713)  return "early";  // 초당 618-712
  if (year < 766)  return "high";   // 성당 713-765
  if (year < 835)  return "mid";    // 중당 766-834
  if (year <= 960) return "late";   // 만당 835-960
  return "post";                    // 오대십국
}

// 시인 이벤트를 era별로 그룹핑 (작품수 내림차순 정렬 = 워드클라우드 크기 순)
function groupByEra(authorEvents) {
  const map = new Map();
  for (const era of ["early", "high", "mid", "late"]) {
    map.set(era, []);
  }
  for (const a of authorEvents) {
    const key = a.era || "early";
    if (map.has(key)) map.get(key).push(a);
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => (b.poemCount || 0) - (a.poemCount || 0));
  }
  return map;
}

// 역사 이벤트를 era별로 main(큰카드 4개) / minor(점+제목)로 분류
function groupHistoryByEra(historyEvents) {
  const map = new Map();
  for (const era of ["early", "high", "mid", "late"]) {
    map.set(era, { main: [], minor: [] });
  }
  // 중복 제거 (H009, H015 등 JSON에 중복 있음)
  const seen = new Set();
  for (const h of historyEvents) {
    if (seen.has(h.titleId)) continue;
    seen.add(h.titleId);
    const eraKey = getHistoryEra(h.year, h.titleId);
    if (!eraKey || !map.has(eraKey)) continue;
    const bucket = map.get(eraKey);
    if (MAIN_HISTORY_IDS.has(h.titleId)) {
      bucket.main.push(h);
    } else {
      bucket.minor.push(h);
    }
  }
  return map;
}

// 작품수 → 폰트 크기 (log2 스케일: 0편=14px ~ 39편=32px)
// 워드클라우드 효과: 두보(39편)가 가장 크고, 1편짜리는 작게
function calcPoetFontSize(poemCount) {
  const MIN_SIZE = 14;
  const MAX_SIZE = 32;
  if (poemCount <= 1) return MIN_SIZE;
  const ratio = Math.log2(poemCount) / Math.log2(39);
  return Math.round(MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE));
}

// ===== 0.5) 주석 시스템 (하이브리드: 인라인 + 하단 리스트) =====
/**
 * 본문 텍스트에서 주석을 파싱하여 HTML로 변환
 * 예: "國破[1]山河在" → "<span class='note-word'>國破</span><sup>1</sup>山河在"
 *
 * @param {string} text - 원본 텍스트
 * @param {Array} notes - 주석 배열 [{ no, head, text }, ...]
 * @param {string} titleId - 작품 ID (ID 고유성 보장용)
 * @param {"legacy"|"owned"} noteSource - 주석 출처 구분 (색상/스타일용)
 * @returns {string} HTML 문자열
 */
function parseTextWithNotes(text, notes, titleId = "", noteSource = "legacy") {
  if (!text) return "";
  if (!Array.isArray(notes) || notes.length === 0) return escapeHTML(text);
  const sourceKey = noteSource === "owned" ? "owned" : "legacy";
  const noteWordClass = `note-word note-word-${sourceKey}`;
  const noteRefClass = `note-ref note-ref-${sourceKey}`;

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

  // 원본→clean 위치 매핑 테이블 (줄바꿈+[번호] 제거 후 위치 역산용)
  // cleanText: [번호] 제거 + \n→공백 치환
  const cleanText = text.replace(/\[\d+\]/g, "").replace(/\n/g, " ");
  // 원본 인덱스 → clean 인덱스 매핑
  const origToClean = [];
  let ci = 0;
  const markerPattern = /\[\d+\]/g;
  const markerSet = new Set();
  let mm;
  while ((mm = markerPattern.exec(text)) !== null) {
    for (let k = mm.index; k < mm.index + mm[0].length; k++) markerSet.add(k);
  }
  for (let oi = 0; oi < text.length; oi++) {
    origToClean[oi] = ci;
    if (!markerSet.has(oi)) ci++;
  }
  origToClean[text.length] = ci;

  // clean → 원본 역매핑
  const cleanToOrig = [];
  for (let oi = 0; oi < text.length; oi++) {
    if (!markerSet.has(oi)) cleanToOrig.push(oi);
  }

  // 2단계: 각 [번호] 앞에 head 키워드가 있는지 확인
  for (const m of matches) {
    const note = notesByNo.get(m.noteNo);
    if (!note || !note.head) continue;

    const head = note.head;
    const headStart = m.index - head.length;

    // 1차: 정확 매칭 (줄바꿈 없는 경우 — 대부분)
    if (headStart >= 0 && text.substring(headStart, m.index) === head) {
      m.headStart = headStart;
      m.headLength = head.length;
      m.noteText = note.text;
    } else {
      // 2차: clean text에서 매칭 (줄바꿈/[번호]가 끼어있는 경우)
      const cleanIdx = origToClean[m.index]; // [번호] 위치의 clean index
      const cleanHeadStart = cleanIdx - head.length;
      if (cleanHeadStart >= 0 && cleanText.substring(cleanHeadStart, cleanIdx) === head) {
        // clean 위치 → 원본 위치 역산
        m.headStart = cleanToOrig[cleanHeadStart];
        m.headLength = m.index - m.headStart;
        m.noteText = note.text;
      }
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
      const rawKeyword = text.substring(m.headStart, m.index);
      // 원본에 [번호]나 \n이 끼어있을 수 있음 → 제거한 표시용 텍스트 생성
      const displayParts = rawKeyword.replace(/\[\d+\]/g, "").split("\n");
      const noteAttr = `data-note-no="${m.noteNo}" data-note-text="${escapeHTML(m.noteText)}"`;

      if (displayParts.length <= 1) {
        // 줄바꿈 없음 — 기존 방식
        result =
          `<span class="${noteWordClass}" id="note-ref-${uniqueId}" ${noteAttr}>${escapeHTML(displayParts[0])}</span>` +
          `<sup class="${noteRefClass}">${m.noteNo}</sup>` +
          result;
      } else {
        // 줄바꿈 있음 — span을 줄별로 분할 (\n으로 split해도 태그 안 깨지게)
        let spans = "";
        for (let pi = 0; pi < displayParts.length; pi++) {
          if (displayParts[pi]) {
            const idAttr = pi === 0 ? ` id="note-ref-${uniqueId}"` : "";
            spans += `<span class="${noteWordClass}"${idAttr} ${noteAttr}>${escapeHTML(displayParts[pi])}</span>`;
          }
          if (pi < displayParts.length - 1) spans += "\n";
        }
        result = spans + `<sup class="${noteRefClass}">${m.noteNo}</sup>` + result;
      }
      lastIndex = m.headStart;
    } else {
      // head 키워드가 없으면 → 주석 내용이 있으면 [번호] 자체를 호버 가능하게
      const note = notesByNo.get(m.noteNo);
      if (note && note.text) {
        result = `<span class="${noteWordClass}" id="note-ref-${uniqueId}" data-note-no="${m.noteNo}" data-note-text="${escapeHTML(note.text)}">[${m.noteNo}]</span>` + result;
      } else {
        result = `<sup class="${noteRefClass}" id="note-ref-${uniqueId}">${m.noteNo}</sup>` + result;
      }
      lastIndex = m.index;
    }
  }

  // 시작 부분 추가
  result = escapeHTML(text.substring(0, lastIndex)) + result;

  return result;
}

function stripInlineNoteMarkers(text) {
  return String(text || "").replace(/\[\d+\]/g, "");
}

function injectNoteMarkersByHead(text, notes) {
  let base = stripInlineNoteMarkers(text);
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

function cleanLegacyKoReferences(text) {
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

// ===== [v2 리뉴얼] 호버 팝업 시스템 =====
// 용도: 시인 이름 호버 → 미니 카드 / 소규모 역사 이벤트 호버 → summary 팝업
// 기존 annotation-tooltip과 별개 (annotation은 모달 내부 전용)

function getOrCreatePopup() {
  let popup = document.getElementById("hover-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "hover-popup";
    popup.className = "hover-popup";
    popup.hidden = true;
    document.body.appendChild(popup);
  }
  return popup;
}

function showPopup(html, anchorRect) {
  const popup = getOrCreatePopup();
  popup.innerHTML = html;
  popup.hidden = false;

  // 위치 계산: 요소 아래 중앙 정렬
  const popupRect = popup.getBoundingClientRect();
  let top = anchorRect.bottom + 8;
  let left = anchorRect.left + (anchorRect.width / 2) - (popupRect.width / 2);

  // 뷰포트 경계 체크
  if (left < 10) left = 10;
  if (left + popupRect.width > window.innerWidth - 10) {
    left = window.innerWidth - popupRect.width - 10;
  }
  if (top + popupRect.height > window.innerHeight - 10) {
    top = anchorRect.top - popupRect.height - 8; // 위로 뒤집기
  }

  popup.style.position = "fixed";
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

function hidePopup() {
  const popup = document.getElementById("hover-popup");
  if (popup) popup.hidden = true;
}

// 시인 이름 호버 팝업 내용 생성
function buildPoetPopupHTML(authorId) {
  const a = STATE.authorById.get(authorId);
  if (!a) return "";

  const nameKo = escapeHTML(a?.name?.ko || "");
  const nameZh = escapeHTML(normalizeZhName(a?.name?.zh || ""));
  const lifeStr = escapeHTML(formatLife(a.life) || a?.life?.raw || "");
  const poemCount = (STATE.poemsByAuthorId.get(authorId) || []).length;
  const bio = escapeHTML((a.bioKo || "").slice(0, 80));

  return `
    <div class="poet-popup">
      <img class="poet-popup-avatar" src="${getAuthorAvatar(authorId)}" alt="" ${AVATAR_ONERROR} />
      <div class="poet-popup-info">
        <div class="poet-popup-name">${nameKo} <span class="zh">${nameZh}</span></div>
        ${lifeStr ? `<div class="poet-popup-life">${lifeStr}</div>` : ""}
        <div class="poet-popup-count">작품 ${poemCount}편</div>
        ${bio ? `<div class="poet-popup-bio">${bio}…</div>` : ""}
      </div>
    </div>
  `;
}

// 소규모 역사 이벤트 호버 팝업 내용 생성
function buildHistoryPopupHTML(historyId) {
  const h = STATE.historyById.get(historyId);
  if (!h) return "";

  const title = escapeHTML(h?.name?.ko || h?.name?.zh || "");
  const zh = h?.name?.zh ? escapeHTML(normalizeZhName(h.name.zh)) : "";
  const summary = hideDaggers(escapeHTML((h.summary || "").split("\n")[0].slice(0, 120)));

  return `
    <div class="history-popup">
      <div class="history-popup-title">${title} ${zh ? `<span class="zh">${zh}</span>` : ""}</div>
      <div class="history-popup-summary">${summary}…</div>
    </div>
  `;
}

// 타임라인 호버 이벤트 위임 (시인 이름 + 소규모 역사 이벤트)
function bindHoverPopups(root) {
  let hoverTimeout = null;

  root.addEventListener("mouseover", (e) => {
    // 시인 이름 호버
    const poetSpan = e.target.closest(".poet-name[data-author-id]");
    if (poetSpan) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const authorId = poetSpan.getAttribute("data-author-id");
        const html = buildPoetPopupHTML(authorId);
        if (html) showPopup(html, poetSpan.getBoundingClientRect());
      }, 200); // 200ms 딜레이: 너무 빠르면 깜빡임
      return;
    }

    // 소규모 역사 이벤트 호버
    const minorDot = e.target.closest(".history-minor[data-history-id]");
    if (minorDot) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const historyId = minorDot.getAttribute("data-history-id");
        const html = buildHistoryPopupHTML(historyId);
        if (html) showPopup(html, minorDot.getBoundingClientRect());
      }, 200);
      return;
    }

    // [v3] 시인 미니카드 호버
    const poetCard = e.target.closest(".v3-poet-card[data-author-id]");
    if (poetCard) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const authorId = poetCard.getAttribute("data-author-id");
        const html = buildPoetPopupHTML(authorId);
        if (html) showPopup(html, poetCard.getBoundingClientRect());
      }, 200);
      return;
    }

    // [v3] 이벤트 점 호버
    const eventDot = e.target.closest(".v3-event-dot[data-history-id]");
    if (eventDot) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const historyId = eventDot.getAttribute("data-history-id");
        const html = buildHistoryPopupHTML(historyId);
        if (html) showPopup(html, eventDot.getBoundingClientRect());
      }, 200);
      return;
    }
  });

  root.addEventListener("mouseout", (e) => {
    const poetSpan = e.target.closest(".poet-name[data-author-id]");
    const minorDot = e.target.closest(".history-minor[data-history-id]");
    const poetCard = e.target.closest(".v3-poet-card[data-author-id]");
    const eventDot = e.target.closest(".v3-event-dot[data-history-id]");
    if (poetSpan || minorDot || poetCard || eventDot) {
      clearTimeout(hoverTimeout);
      hidePopup();
    }
  });
}

// ===== [v2 리뉴얼] 호버 팝업 시스템 끝 =====

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

// 시인 초상화 경로 반환 (없으면 기본 이미지 fallback)
function getAuthorAvatar(authorId) {
  if (!authorId) return DUMMY_UI.defaultAvatar;
  return `public/assets/avatars/${authorId}.jpg`;
}
// img onerror용 fallback 속성 문자열
const AVATAR_ONERROR = `onerror="this.onerror=null;this.src='${DUMMY_UI.defaultAvatar}'"`;


// ===== [v2 리뉴얼] 시대별 타임라인 렌더러 =====
// 기존 renderAuthorCard/renderHistoryCard/renderPrimaryItem을 대체
// 기존 함수는 아래에 주석처리하여 보존

// 시인 이름 나열 (워드클라우드 스타일: 한자 이름 + | 구분 + 크기 차등)
function renderPoetNames(authors) {
  if (!authors.length) return el(`<div class="poet-names empty">-</div>`);

  const spans = authors.map(a => {
    const fontSize = calcPoetFontSize(a.poemCount || 0);
    return `<span class="poet-name"
                  data-author-id="${escapeHTML(a.authorId)}"
                  style="font-size: ${fontSize}px"
                  title="${escapeHTML(a.nameKo || '')} (${escapeHTML(a.nameZh)})"
            ><img class="poet-name-avatar" src="${getAuthorAvatar(a.authorId)}" alt="" ${AVATAR_ONERROR} />${escapeHTML(a.nameZh)}</span>`;
  }).join('<span class="poet-sep"> | </span>');

  return el(`<div class="poet-names">${spans}</div>`);
}

// 메인 역사 카드 (4개: 당건국, 개원지치, 안사지란, 황소지란)
// 모달 대신 인라인 아코디언으로 상세 펼치기/접기
function renderMainHistoryCard(h) {
  const title = h?.name?.ko || h?.name?.zh || "";
  const zh = h?.name?.zh ? ` <span class="zh">${escapeHTML(h.name.zh)}</span>` : "";
  const lifeStr = formatEventLife(h.life);
  const tags = renderTagChips(getHistoryTagList(h), 3);
  const summary = hideDaggers(escapeHTML((h.summary || "").split("\n")[0] || ""));
  const paragraphs = splitParagraphs(h.detail);
  const detailHTML = paragraphs.length
    ? paragraphs.map(p => `<p>${hideDaggers(escapeHTML(p))}</p>`).join("")
    : `<div class="muted">상세 없음</div>`;

  return el(`
    <article class="history-main-card" data-history-id="${escapeHTML(h.titleId || "")}">
      <div class="history-main-top">
        <img class="history-main-portrait" src="${DUMMY_UI.defaultAvatar}" alt="" />
        <div class="history-main-info">
          <div class="history-main-title">${escapeHTML(title)}${zh}</div>
          ${lifeStr ? `<div class="history-main-life">${escapeHTML(lifeStr)}</div>` : ""}
          <div class="history-main-tags">${tags}</div>
        </div>
      </div>
      <div class="history-main-summary">${summary}</div>
      <button class="history-detail-toggle" aria-expanded="false">
        <span class="chev">&#x25BE;</span> 상세보기
      </button>
      <div class="history-detail-panel" hidden>
        ${detailHTML}
      </div>
    </article>
  `);
}

// 소규모 역사 이벤트 (점 + 연도 + 제목, 호버시 summary 팝업)
function renderMinorHistoryDot(h) {
  const title = h?.name?.ko || h?.name?.zh || "";
  const year = h.year ?? "";
  return el(`
    <div class="history-minor" data-history-id="${escapeHTML(h.titleId || "")}">
      <span class="history-minor-dot"></span>
      <span class="history-minor-title">${escapeHTML(String(year))} ${escapeHTML(title)}</span>
    </div>
  `);
}

// 시대 섹션 조립 (3열: 왼쪽 시인 | 가운데 타임라인선 | 오른쪽 역사)
function renderEraSection(eraConfig, poetNamesNode, mainCards, minorDots) {
  const section = el(`
    <section class="era-section" data-era="${eraConfig.key}">
      <div class="era-header">
        <div class="era-label">${eraConfig.zhLabel}</div>
        <div class="era-label-sub">${escapeHTML(eraConfig.label)}</div>
      </div>
      <div class="era-body">
        <div class="era-left"></div>
        <div class="era-center">
          <div class="era-timeline-line"></div>
        </div>
        <div class="era-right"></div>
      </div>
    </section>
  `);

  const left = section.querySelector(".era-left");
  const right = section.querySelector(".era-right");

  if (poetNamesNode) left.appendChild(poetNamesNode);

  for (const card of mainCards) right.appendChild(card);

  if (minorDots.length) {
    const minorGroup = el(`<div class="history-minor-group"></div>`);
    for (const dot of minorDots) minorGroup.appendChild(dot);
    right.appendChild(minorGroup);
  }

  return section;
}

// 隋 / 五代十國 북엔드 라벨
function renderBookend(label) {
  return el(`
    <div class="era-bookend">
      <div class="era-bookend-label">${escapeHTML(label)}</div>
    </div>
  `);
}

// ===== [v2 리뉴얼] 시대별 타임라인 렌더러 끝 =====

// ===== [v3 시대섹션 리디자인] 성당 프로토타입 =====

// 시인 미니카드 배치: 줄마다 개수가 다른 들쭉날쭉 그리드
// seed 기반 패턴으로 동일 데이터엔 동일 배치 유지
function distributeIrregularRows(count) {
  const pattern = [5, 7, 4, 6, 5, 3, 7, 6];
  const rows = [];
  let remaining = count;
  let i = 0;
  while (remaining > 0) {
    const maxSize = pattern[i % pattern.length];
    const take = Math.min(remaining, maxSize);
    rows.push(take);
    remaining -= take;
    i++;
  }
  return rows;
}

// 시인 미니카드 렌더 (오른쪽 정렬, 줄마다 랜덤 개수)
function renderPoetMiniCards(authors) {
  if (!authors.length) return el(`<div class="v3-poet-grid empty">-</div>`);

  const rowSizes = distributeIrregularRows(authors.length);
  const container = el(`<div class="v3-poet-grid"></div>`);
  let idx = 0;

  for (const size of rowSizes) {
    const row = el(`<div class="v3-poet-row"></div>`);
    for (let j = 0; j < size; j++) {
      const a = authors[idx++];
      // 한자 이름에서 성씨 제외한 짧은 이름 or 전체 (2~3자)
      const zhName = escapeHTML(a.nameZh || "");
      const koName = escapeHTML(a.nameKo || "");
      const card = el(`
        <div class="v3-poet-card"
             data-author-id="${escapeHTML(a.authorId)}"
             title="${koName} (${zhName})">
          <span class="v3-poet-card-name">${zhName}</span>
        </div>
      `);
      row.appendChild(card);
    }
    container.appendChild(row);
  }

  return container;
}

// 분기점 사건 렌더 (서브헤더 + 점선 + 설명박스 + 더보기)
// eraConfig/eraDetail을 받아서 서브헤더 2칼럼 구성
function renderFeaturedEvent(historyEvent, eraConfig, eraDetail) {
  if (!historyEvent) return el(`<div class="v3-featured empty"></div>`);

  const eventTitle = historyEvent?.name?.ko || "";
  const eventZh = historyEvent?.name?.zh ? normalizeZhName(historyEvent.name.zh) : "";
  const eventLife = formatEventLife(historyEvent.life);

  // 시대 라벨: "盛唐 성당 · 713~765"
  const eraZh = eraConfig?.zhLabel || "";
  const eraKo = eraConfig?.label || "";
  const eraRange = eraDetail?.yearRange || "";

  // summary + detail을 한 박스에 모두 표시 (펼침 버튼 없이 전체 노출)
  const summaryText = hideDaggers(escapeHTML(historyEvent.summary || ""));
  const paragraphs = splitParagraphs(historyEvent.detail);
  const detailHTML = paragraphs.length
    ? paragraphs.map(p => `<p>${hideDaggers(escapeHTML(p))}</p>`).join("")
    : "";

  return el(`
    <div class="v3-featured">
      <div class="v3-sub-header">
        <span class="v3-era-info"><span class="v3-era-zh">${escapeHTML(eraZh)}</span> ${escapeHTML(eraKo)} · ${escapeHTML(eraRange)}</span>
        <span class="v3-event-info">${escapeHTML(eventTitle)} ${eventZh ? escapeHTML(eventZh) : ""} ${eventLife ? `<span class="v3-event-life">${escapeHTML(eventLife)}</span>` : ""}</span>
      </div>
      <div class="v3-featured-divider"></div>
      <div class="v3-desc-box">
        <div class="v3-featured-text">${summaryText}</div>
        ${detailHTML ? `<div class="v3-featured-text">${detailHTML}</div>` : ""}
      </div>
    </div>
  `);
}

// v3 시대 섹션 조립 (성당 프로토타입)
// era-header 제거 → 시대 라벨은 우측 서브헤더 안에 통합
// 사건 점은 타임라인 선 위에 직접 배치
function renderEraSection_v3(eraConfig, eraDetail, poetCards, featuredNode, dotEvents) {
  // 2행 그리드: Row1=헤더(우측만), Row2=시인·도트·설명 (같은 줄 시작)
  const section = el(`
    <section class="era-section v3" data-era="${eraConfig.key}">
      <div class="era-body v3">
        <div class="era-center v3">
          <div class="era-timeline-line"></div>
        </div>
        <div class="v3-featured-header"></div>
        <div class="era-left v3"></div>
        <div class="v3-timeline-dots"></div>
        <div class="v3-featured-content"></div>
      </div>
    </section>
  `);

  const left = section.querySelector(".era-left.v3");
  const featHeader = section.querySelector(".v3-featured-header");
  const featContent = section.querySelector(".v3-featured-content");
  const timelineDots = section.querySelector(".v3-timeline-dots");

  // 좌측 Row2: 시인 미니카드 (오른쪽 정렬)
  if (poetCards) left.appendChild(poetCards);

  // 우측: featuredNode에서 헤더(Row1)와 설명(Row2) 분리
  if (featuredNode) {
    const subHeader = featuredNode.querySelector(".v3-sub-header");
    const divider = featuredNode.querySelector(".v3-featured-divider");
    const descBox = featuredNode.querySelector(".v3-desc-box");

    if (subHeader) featHeader.appendChild(subHeader);
    if (divider) featHeader.appendChild(divider);
    if (descBox) featContent.appendChild(descBox);
  }

  // 가운데 Row2: 사건 점을 타임라인 선 위에 배치
  if (dotEvents && dotEvents.length) {
    for (const h of dotEvents) {
      const title = h?.name?.ko || h?.name?.zh || "";
      const year = h.year ?? "";
      const dot = el(`
        <div class="v3-event-dot" data-history-id="${escapeHTML(h.titleId || "")}">
          <span class="v3-dot-marker"></span>
          <span class="v3-dot-label">
            <span class="v3-dot-year">${escapeHTML(String(year))}</span>
            <span class="v3-dot-title">${escapeHTML(title)}</span>
          </span>
        </div>
      `);
      timelineDots.appendChild(dot);
    }
  }

  return section;
}

// v3 분기점 사건 더보기 토글 바인딩
function bindFeaturedToggle(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".v3-featured-toggle");
    if (!btn) return;

    const featured = btn.closest(".v3-featured");
    const detail = featured?.querySelector(".v3-featured-detail");
    const summary = featured?.querySelector(".v3-featured-summary");
    if (!detail) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    detail.hidden = expanded;
    btn.querySelector(".v3-featured-toggle-icon").textContent = expanded ? "▾" : "▴";

    // summary의 line-clamp 해제/복원
    if (summary) {
      summary.style.webkitLineClamp = expanded ? "5" : "unset";
      summary.style.overflow = expanded ? "hidden" : "visible";
    }
  });
}

// ===== [v3 시대섹션 리디자인] 끝 =====

/* ===== [v2 리뉴얼] 기존 카드 렌더러 3개 주석처리 시작 =====
   renderAuthorCard  → renderPoetNames로 대체 (시인 이름 워드클라우드)
   renderHistoryCard → renderMainHistoryCard + renderMinorHistoryDot으로 대체
   renderPrimaryItem → renderEraSection으로 대체 (시대별 세로 타임라인)

function renderAuthorCard(a) {
  const tags = DUMMY_UI.authorTags.map(t => '<span class="tag">' + t + '</span>').join("");
  const works = (a.works || []).map(w => {
    const pid = w.poemId || w.titleId || "";
    const no  = w.poemNoStr || w.poemNo || "";
    const t   = w.titleCompact || w.title || "";
    const m   = w.meta || "";
    return '<li class="work-item" data-poem-id="' + escapeHTML(pid) + '">'
      + '<span class="work-no">' + escapeHTML(no) + '</span>'
      + '<span class="work-title">' + escapeHTML(t) + '</span>'
      + '<span class="work-meta">' + escapeHTML(m) + '</span></li>';
  }).join("");
  return el('...');  // 생략 (전체 HTML 템플릿)
}

function renderHistoryCard(h) {
  // 역사 카드 렌더러 (모달 클릭 방식 → 인라인 아코디언으로 변경)
  return el('...');  // 생략
}

function renderPrimaryItem(year, leftNodes, rightNodes) {
  // 연도별 가로 행 렌더러 (시대별 세로 섹션으로 변경)
  return el('...');  // 생략
}

===== [v2 리뉴얼] 기존 카드 렌더러 3개 주석처리 끝 ===== */

// ===== 3) 타임라인 카드 아코디언 =====
/* [v2 리뉴얼] 기존 .works-toggle 아코디언은 타임라인에서 더 이상 사용하지 않음
   (모달 내부의 작품 아코디언은 bindPoemSections가 별도 관리)
   새로 추가: .history-detail-toggle (메인 역사 카드 상세 펼치기/접기) */
function bindAccordions(root) {
  root.addEventListener("click", (e) => {
    // [v2 리뉴얼] 메인 역사 카드의 상세 아코디언
    const histBtn = e.target.closest(".history-detail-toggle");
    if (histBtn) {
      const card = histBtn.closest(".history-main-card");
      const panel = card?.querySelector(".history-detail-panel");
      if (!card || !panel) return;

      const expanded = histBtn.getAttribute("aria-expanded") === "true";
      histBtn.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
      card.classList.toggle("expanded", !expanded);
      return;
    }
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
  const ownedNotes = Array.isArray(p.notesOwned) ? p.notesOwned : [];
  const legacyNotes = Array.isArray(p.notes) ? p.notes : [];
  const useOwnedNotes = ownedNotes.length > 0;
  const notes = useOwnedNotes ? ownedNotes : legacyNotes;
  const noteSource = useOwnedNotes ? "owned" : "legacy";
  const titleId = p.titleId || poemNoStr || "";  // 고유 ID (예: "C8", "C9")

  // 제목 주석 파싱
  const titleFullRaw = p?.title?.zh ?? "";
  const titleFullSource = useOwnedNotes ? injectNoteMarkersByHead(titleFullRaw, notes) : titleFullRaw;
  const titleFull = parseTextWithNotes(titleFullSource, notes, titleId, noteSource);

  const meta = [p.category, p.juan, p.meter ? `${p.meter}언` : ""].filter(Boolean).join(" · ");

  const jipZhSource = useOwnedNotes
    ? injectNoteMarkersByHead(p.jipyeongZh || "", notes)
    : (p.jipyeongZh || "");
  const jipZh = parseTextWithNotes(jipZhSource, notes, titleId, noteSource);  // 집평도 주석 파싱

  const notesHTML = notes.length
    ? `<ul class="note-list">${notes.map(n => `
        <li class="note-item" id="note-item-${titleId}-${n.no}">
          <span class="note-no" data-target-ref="${titleId}-${n.no}">[${escapeHTML(n.no)}]</span>
          <span class="note-head">${escapeHTML(n.head || "")}</span>
          <span class="note-text">${escapeHTML(n.text || "")}</span>
        </li>
      `).join("")}</ul>`
    : `<div class="muted">주석 없음</div>`;

  const jipKoRaw = p.jipyeongKoOwned || p.jipyeongKo || "";
  const jipKo = escapeHTML(cleanLegacyKoReferences(jipKoRaw));

  // 심화자료 데이터
  const pinyinRaw = p.pinyin || "";
  const pingzeRaw = p.pingze || "";
  const poemSimpRaw = p.poemSimp || "";
  const ytLinks = (p.media && Array.isArray(p.media.youtube)) ? p.media.youtube : [];

  // 제목/시인 병음 데이터
  const titleSimp = p.titleSimp || "";
  const titlePinyin = p.titlePinyin || "";
  const poetSimp = p.poetSimp || "";
  const poetPinyin = p.poetPinyin || "";

  // 제목 병음 루비 생성
  function buildTitlePinyinRuby(simp, pinyin) {
    if (!simp || !pinyin) return "";
    const chars = Array.from(simp).filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
    const syllables = pinyin.split(/\s+/).filter(Boolean);
    let ruby = "";
    for (let i = 0; i < chars.length; i++) {
      const ch = escapeHTML(chars[i]);
      const py = escapeHTML(syllables[i] || "");
      ruby += `<ruby>${ch}<rp>(</rp><rt>${py}</rt><rp>)</rp></ruby>`;
    }
    return ruby;
  }

  // 제목/시인 표시용 (한자+한글)
  const titleKo = p?.title?.ko ?? "";
  const poetZhRaw = p?.poet?.zh ?? "";
  const poetZhClean = poetZhRaw.replace(/\[\d+\]/g, "").trim();  // 주석번호 제거
  const poetZhSource = useOwnedNotes ? injectNoteMarkersByHead(poetZhRaw, notes) : poetZhRaw;

  // 병음 칸: 간체자 + 병음 루비문자
  let pinyinHTML = "";
  if (poemSimpRaw || pinyinRaw) {
    // 제목/시인 병음 루비
    const titleRuby = buildTitlePinyinRuby(titleSimp, titlePinyin);
    const poetRuby = buildTitlePinyinRuby(poetSimp, poetPinyin);
    const titlePinyinLine = titleRuby ? `<div class="ruby-title">${titleRuby}</div>` : "";
    const poetPinyinLine = poetRuby ? `<div class="ruby-poet">${poetRuby}</div>` : "";

    const simpLines = poemSimpRaw.split("\n");
    const pinyinLines = pinyinRaw.split("\n");
    const maxLen = Math.max(simpLines.length, pinyinLines.length);
    let rubyRows = "";
    for (let li = 0; li < maxLen; li++) {
      const chars = Array.from(simpLines[li] || "").filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
      const syllables = (pinyinLines[li] || "").split(/\s+/).filter(Boolean);
      let lineRuby = "";
      for (let ci = 0; ci < chars.length; ci++) {
        const ch = escapeHTML(chars[ci]);
        const py = escapeHTML(syllables[ci] || "");
        lineRuby += `<ruby>${ch}<rp>(</rp><rt>${py}</rt><rp>)</rp></ruby>`;
      }
      rubyRows += `<div class="ruby-line">${lineRuby}</div>`;
    }
    pinyinHTML = `
      ${titlePinyinLine}${poetPinyinLine}
      <div class="ruby-grid">${rubyRows}</div>
      <div class="tts-label">보통화(普通話) 시 낭송 듣기</div>
      <div class="tts-player" data-poem-no="${escapeHTML(poemNoStr)}">
        <button type="button" class="tts-btn" data-speed="normal">
          <span class="tts-icon">&#9654;</span> 정상속도
        </button>
        <button type="button" class="tts-btn" data-speed="slow">
          <span class="tts-icon">&#9654;</span> 느리게
        </button>
        <span class="tts-status"></span>
      </div>`;
  }

  // 평측 칸: 간체자 + 평측 루비문자 (절구/율시만)
  let pingzeHTML = "";
  if (pingzeRaw && poemSimpRaw) {
    const simpLines = poemSimpRaw.split("\n");
    const pingzeLines = pingzeRaw.split("\n");
    const maxLen = Math.max(simpLines.length, pingzeLines.length);
    let pzRows = "";
    for (let li = 0; li < maxLen; li++) {
      const chars = Array.from(simpLines[li] || "").filter(ch => ch >= "\u4e00" && ch <= "\u9fff");
      const tones = Array.from(pingzeLines[li] || "");
      let lineRuby = "";
      for (let ci = 0; ci < chars.length; ci++) {
        const ch = escapeHTML(chars[ci]);
        const tone = escapeHTML(tones[ci] || "");
        const toneClass = tone === "平" ? "tone-ping" : tone === "仄" ? "tone-ze" : "";
        lineRuby += `<ruby class="${toneClass}">${ch}<rp>(</rp><rt>${tone}</rt><rp>)</rp></ruby>`;
      }
      pzRows += `<div class="ruby-line">${lineRuby}</div>`;
    }
    pingzeHTML = `<div class="ruby-grid pingze">${pzRows}</div>`;
  }

  // 번역문 (2컬럼용)
  const trKoRaw = p.translationKoOwned || p.translationKo || "";

  // YouTube 임베드 플레이어
  function extractYoutubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?#\s]+)/);
    return m ? m[1] : null;
  }

  let mediaHTML = "";
  if (ytLinks.length > 0) {
    const embeds = ytLinks.map((url) => {
      const vid = extractYoutubeId(url);
      if (!vid) return "";
      return `<div class="yt-embed-wrap">
        <iframe src="https://www.youtube.com/embed/${escapeHTML(vid)}"
          frameborder="0" allowfullscreen
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"></iframe>
      </div>`;
    }).filter(Boolean).join("");
    mediaHTML = embeds;
  }

  // 심화자료 2컬럼 레이아웃 구성
  let deepContentHTML = "";
  if (pinyinHTML && pingzeHTML) {
    // 병음 + 평측 둘 다 있음 → 2컬럼
    deepContentHTML = `
      <div class="deep-two-col">
        <div class="poem-block">
          <div class="block-title">간체자 &amp; 병음</div>
          <div class="block-box">${pinyinHTML}</div>
        </div>
        <div class="poem-block">
          <div class="block-title">평측</div>
          <div class="block-box">${pingzeHTML}</div>
        </div>
      </div>
      ${mediaHTML ? `<div class="poem-block">
        <div class="block-title">YouTube 낭송</div>
        <div class="block-box">${mediaHTML}</div>
      </div>` : ""}`;
  } else if (pinyinHTML && !pingzeHTML && mediaHTML) {
    // 병음만 + YouTube → 2컬럼 (미니)
    deepContentHTML = `
      <div class="deep-two-col">
        <div class="poem-block">
          <div class="block-title">간체자 &amp; 병음</div>
          <div class="block-box">${pinyinHTML}</div>
        </div>
        <div class="poem-block">
          <div class="block-title">YouTube 낭송</div>
          <div class="block-box">${mediaHTML}</div>
        </div>
      </div>`;
  } else {
    // 각각 따로 표시
    deepContentHTML = `
      ${pinyinHTML ? `<div class="poem-block">
        <div class="block-title">간체자 &amp; 병음</div>
        <div class="block-box">${pinyinHTML}</div>
      </div>` : ""}
      ${pingzeHTML ? `<div class="poem-block">
        <div class="block-title">평측</div>
        <div class="block-box">${pingzeHTML}</div>
      </div>` : ""}
      ${mediaHTML ? `<div class="poem-block">
        <div class="block-title">YouTube 낭송</div>
        <div class="block-box">${mediaHTML}</div>
      </div>` : ""}`;
  }

  // 시 본문 2컬럼 (한자 | 한글) 구성
  // 전체 텍스트를 먼저 주석 파싱 → 줄 분리 (줄 경계에 걸친 head도 처리 가능)
  const poemZhSource = useOwnedNotes
    ? injectNoteMarkersByHead(p.poemZh || "", notes)
    : (p.poemZh || "");
  const parsedPoemZh = parseTextWithNotes(poemZhSource, notes, titleId, noteSource);
  const poemZhLines = parsedPoemZh.split("\n");
  const allTrKoLines = trKoRaw.split("\n");
  // 번역 데이터 앞 2줄은 제목+시인 이름 → 상단에 이미 표시하므로 본문에서 제외
  const trKoLines = allTrKoLines.length > 2 ? allTrKoLines.slice(2) : allTrKoLines;
  const maxLines = Math.max(poemZhLines.length, trKoLines.length);
  let bilingualRows = "";
  for (let i = 0; i < maxLines; i++) {
    const zhLine = poemZhLines[i] || "";
    const koLine = escapeHTML(trKoLines[i] || "");
    bilingualRows += `<div class="bl-row"><div class="bl-zh">${zhLine}</div><div class="bl-ko">${koLine}</div></div>`;
  }

  return `
    <section class="poem-sec" data-poem-sec="${escapeHTML(p.titleId)}">
      <button class="poem-head" type="button" aria-expanded="false">
        <div class="poem-head-line">
          <span class="poem-no">${escapeHTML(poemNoStr)}</span>
          <span class="poem-title">${titleFull}</span>
        </div>
        <div class="poem-head-meta">${escapeHTML(meta)}</div>
      </button>

      <div class="poem-body" hidden>
        <div class="poem-text-box">
          <div class="poem-title-zh">${parseTextWithNotes(titleFullSource, notes, titleId, noteSource)}</div>
          ${titleKo ? `<div class="poem-title-ko">${escapeHTML(titleKo)}</div>` : ''}
          <div class="poem-poet-zh">${parseTextWithNotes(poetZhSource, notes, titleId, noteSource)}</div>
          <div class="poem-bilingual">${bilingualRows}</div>
        </div>

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
    </section>
  `;
}

function bindPoemSections(modalBody) {
  // 작품 섹션 아코디언 (한 번에 하나만 펼침)
  modalBody.addEventListener("click", (e) => {
    const head = e.target.closest(".poem-head");
    if (!head) return;

    const sec = head.closest(".poem-sec");
    const body = sec?.querySelector(".poem-body");
    if (!sec || !body) return;

    const expanded = head.getAttribute("aria-expanded") === "true";

    if (expanded) {
      // 닫기
      head.setAttribute("aria-expanded", "false");
      body.hidden = true;
      sec.classList.remove("expanded");
    } else {
      const modal = sec.closest(".modal");

      // ① 먼저 이 작품을 아래로 펼침
      head.setAttribute("aria-expanded", "true");
      body.hidden = false;
      sec.classList.add("expanded");

      // ② 이전 작품 닫기 전에 현재 화면상 위치 기억
      const secTopBefore = sec.getBoundingClientRect().top;

      // ③ 이전 작품 닫기
      modalBody.querySelectorAll(".poem-sec").forEach(s => {
        if (s !== sec) {
          const h = s.querySelector(".poem-head");
          const b = s.querySelector(".poem-body");
          if (h) h.setAttribute("aria-expanded", "false");
          if (b) b.hidden = true;
          s.classList.remove("expanded");
        }
      });

      // ④ 닫혀서 줄어든 높이만큼 스크롤 보정 → 화면 점프 방지
      if (modal) {
        const secTopAfter = sec.getBoundingClientRect().top;
        modal.scrollTop -= (secTopBefore - secTopAfter);
      }

      // ⑤ 부드럽게 위로 올려서 작품 상단이 모달 상단에 붙게
      requestAnimationFrame(() => {
        if (modal) {
          const modalRect = modal.getBoundingClientRect();
          const secRect = sec.getBoundingClientRect();
          const targetScroll = secRect.top - modalRect.top + modal.scrollTop;
          modal.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      });
    }
  });

  // TTS 재생 (이벤트 위임)
  modalBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".tts-btn");
    if (!btn) return;

    const player = btn.closest(".tts-player");
    if (!player) return;

    const poemNo = player.dataset.poemNo;
    const speed = btn.dataset.speed;
    handleTtsPlay(player, btn, poemNo, speed);
  });
}

// ── TTS 재생 전역 상태 ──
let _ttsAudio = null;
let _ttsBtn = null;
let _ttsPlayer = null;

function handleTtsPlay(player, btn, poemNo, speed) {
  // 같은 버튼 다시 누르면 정지
  if (_ttsBtn === btn && _ttsAudio && !_ttsAudio.paused) {
    stopTtsPlayback();
    return;
  }
  // 기존 재생 정지
  stopTtsPlayback();

  const src = `public/audio/${poemNo}_${speed}.mp3`;
  const audio = new Audio(src);
  _ttsAudio = audio;
  _ttsBtn = btn;
  _ttsPlayer = player;

  btn.classList.add("playing");
  btn.querySelector(".tts-icon").innerHTML = "&#9724;";
  const status = player.querySelector(".tts-status");
  if (status) status.textContent = speed === "normal" ? "재생 중..." : "느리게 재생 중...";

  audio.play().catch(() => {
    if (status) status.textContent = "파일 없음";
    stopTtsPlayback();
  });

  audio.onended = () => stopTtsPlayback();
}

function stopTtsPlayback() {
  if (_ttsAudio) {
    _ttsAudio.pause();
    _ttsAudio.currentTime = 0;
    _ttsAudio = null;
  }
  if (_ttsBtn) {
    _ttsBtn.classList.remove("playing");
    _ttsBtn.querySelector(".tts-icon").innerHTML = "&#9654;";
    _ttsBtn = null;
  }
  if (_ttsPlayer) {
    const status = _ttsPlayer.querySelector(".tts-status");
    if (status) status.textContent = "";
    _ttsPlayer = null;
  }
}

// ===== 6-A) 출생지 지도 (Leaflet) =====
/**
 * 모달 내 출생지 지도를 초기화한다.
 * @param {HTMLElement} container - 지도를 넣을 빈 div (.map-container)
 * @param {object} birthplace - { name, nameZh, lat, lng }
 */
function initBirthplaceMap(container, birthplace) {
  if (!birthplace || birthplace.lat == null || birthplace.lng == null) {
    container.innerHTML = '<div class="muted" style="padding:10px">출생지 정보 없음</div>';
    return;
  }
  if (typeof L === "undefined") {
    container.innerHTML = '<div class="muted" style="padding:10px">Leaflet 로드 실패</div>';
    return;
  }

  const map = L.map(container, { scrollWheelZoom: false }).setView(
    [birthplace.lat, birthplace.lng],
    6 // 중국 성 단위가 잘 보이는 줌 레벨
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 18,
  }).addTo(map);

  L.marker([birthplace.lat, birthplace.lng])
    .addTo(map)
    .bindPopup(`<b>${birthplace.nameZh || ""}</b><br>${birthplace.name || ""}`)
    .openPopup();

  // 모달 리사이즈 시 지도 타일 깨짐 방지
  setTimeout(() => map.invalidateSize(), 300);
}

// ===== 6-B) 관계도 (vis-network) =====
/**
 * 모달 내 시인 관계도를 초기화한다.
 * 현재 시인을 중심 노드로 놓고, relations 배열의 대상을 연결선으로 표시.
 * @param {HTMLElement} container - 관계도를 넣을 빈 div (.graph-container)
 * @param {string} authorId - 현재 시인의 titleId
 */
function initRelationGraph(container, authorId) {
  const a = STATE.authorById.get(authorId);
  if (!a) return;

  // 현재 시인의 relations + 다른 시인이 나를 가리키는 relations 모두 수집
  const edgesRaw = [];
  const nodeIds = new Set([authorId]);

  // (1) 내 relations
  if (a.relations) {
    a.relations.forEach(r => {
      edgesRaw.push({
        from: authorId,
        to: r.targetId,
        label: r.label,
        desc: r.desc,
        type: r.type,
        targetName: r.targetName,
        targetNameKo: r.targetNameKo
      });
      nodeIds.add(r.targetId);
    });
  }

  // (2) 다른 시인 → 나를 가리키는 relations
  for (const [id, other] of STATE.authorById) {
    if (id === authorId || !other.relations) continue;
    other.relations.forEach(r => {
      if (r.targetId === authorId) {
        edgesRaw.push({ from: id, to: authorId, label: r.label, desc: r.desc, type: r.type });
        nodeIds.add(id);
      }
    });
  }

  if (!edgesRaw.length) {
    container.innerHTML = '<div class="muted" style="padding:10px">관계 정보 없음</div>';
    return;
  }
  if (typeof vis === "undefined") {
    container.innerHTML = '<div class="muted" style="padding:10px">vis-network 로드 실패</div>';
    return;
  }

  // 노드 생성
  const nodes = [];
  for (const nid of nodeIds) {
    const p = STATE.authorById.get(nid);
    const extRel = edgesRaw.find(e => e.to === nid || e.from === nid);
    const nameLabel = p ? (p.name?.ko || p.name?.zh || nid) : (extRel?.targetNameKo || extRel?.targetName || nid);
    nodes.push({
      id: nid,
      title: nameLabel, // 툴팁으로 이름 표시
      shape: "circularImage", // 원형 이미지
      image: getAuthorAvatar(nid), // 실제 초상화 (없으면 onerror fallback)
      color: nid === authorId
        ? { background: "#8b0000", border: "#5a0000", highlight: { background: "#a00", border: "#5a0000" } }
        : p
          ? { background: "#4a90d9", border: "#2a6cb0", highlight: { background: "#5aa0e9", border: "#2a6cb0" } }
          : { background: "#8a8a8a", border: "#666", highlight: { background: "#999", border: "#666" } },
      size: nid === authorId ? 50 : 35, // 크기 상향 조정
      borderWidth: 3,
    });
  }

  // 엣지 생성
  const edges = edgesRaw.map((e, i) => ({
    id: i,
    from: e.from,
    to: e.to,
    label: e.label || "",
    arrows: e.type === "friend" ? "" : "to",
    color: { color: "#888", highlight: "#444" },
    font: { size: 11, color: "#555", strokeWidth: 2, strokeColor: "#fff" },
    title: e.desc || "",
    smooth: { type: "curvedCW", roundness: 0.2 },
  }));

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };
  const options = {
    nodes: { brokenImage: DUMMY_UI.defaultAvatar }, // 이미지 로드 실패 시 기본 이미지
    interaction: { hover: true, zoomView: true, dragView: true }, // 줌/드래그 허용
    physics: {
      enabled: true, // 물리 엔진 활성화 (노드 간격 자동 조절)
      solver: "repulsion",
      repulsion: {
        nodeDistance: 100, // 노드 간 거리 (좁힘)
        springLength: 100,
        centralGravity: 0.8, // 중심으로 당기는 힘 (강하게)
      },
      stabilization: { // 초기 배치 안정화
        iterations: 200,
        fit: true,
      },
    },
    layout: { randomSeed: 42 },
  };

  const network = new vis.Network(container, data, options);

  // 노드 클릭 시 해당 시인 모달 열기 (자기 자신 제외)
  network.on("click", params => {
    if (params.nodes.length === 1 && params.nodes[0] !== authorId && STATE.authorById.has(params.nodes[0])) {
      openAuthorModal(params.nodes[0]);
    }
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
        <img class="author-photo" src="${getAuthorAvatar(authorId)}" alt="${escapeHTML(nameKo)}" ${AVATAR_ONERROR} />
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
          <div class="panel-sub">${a.birthplace ? escapeHTML(a.birthplace.nameZh || "") : "출생지 정보 없음"}</div>
          <div class="panel-box map-container" id="modal-map"></div>
        </div>
        <div class="panel">
          <div class="panel-title">관계도</div>
          <div class="panel-sub">교유/제자/영향 관계</div>
          <div class="panel-box graph-container" id="modal-graph"></div>
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

  // 출생지 지도 초기화
  const mapEl = document.getElementById("modal-map");
  if (mapEl) initBirthplaceMap(mapEl, a.birthplace || null);

  // 관계도 초기화
  const graphEl = document.getElementById("modal-graph");
  if (graphEl) initRelationGraph(graphEl, authorId);

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

/* ===== [v2 리뉴얼] 역사 모달 주석처리 =====
   이유: 역사 이벤트는 이제 인라인 카드(메인 4개) + 호버 팝업(나머지)으로 표시
   복원 필요시: 이 블록 주석 해제 + bindModalOpeners에서 (3) 역사 카드 클릭 섹션도 복원
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
    ? `<div class="block-box">${summaryLines.map(s => `<p>${hideDaggers(escapeHTML(s))}</p>`).join("")}</div>`
    : `<div class="block-box muted">요약 없음</div>`;

  // detail은 \n\n(빈 줄) 기준으로 문단이 나뉘어 있으니 splitParagraphs로 <p> 처리합니다.
  const paragraphs = splitParagraphs(h.detail);
  const detailHTML = paragraphs.length
    ? `<div class="history-detail-paras modal">
        ${paragraphs.map(p => `<p>${hideDaggers(escapeHTML(p))}</p>`).join("")}
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
===== [v2 리뉴얼] 역사 모달 주석처리 끝 ===== */


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

    // [v2 리뉴얼] (2) 시인 이름 클릭 → 작가 모달 열기
    // 기존: .author-card[data-author-id] → 변경: .poet-name[data-author-id]
    const poetSpan = e.target.closest(".poet-name[data-author-id]");
    if (poetSpan) {
      const authorId = poetSpan.getAttribute("data-author-id");
      if (!authorId) return;
      openAuthorModal(authorId, {});
      return;
    }

    // [v3] 시인 미니카드 클릭 → 작가 모달 열기
    const poetCard = e.target.closest(".v3-poet-card[data-author-id]");
    if (poetCard) {
      const authorId = poetCard.getAttribute("data-author-id");
      if (!authorId) return;
      openAuthorModal(authorId, {});
      return;
    }

    /* [v2 리뉴얼] (3) 역사 카드 클릭 → 모달 제거 (인라인 아코디언으로 대체)
    const hcard = e.target.closest(".history-card[data-history-id]");
    if (hcard) {
      if (e.target.closest(".works-toggle")) return;
      const hid = hcard.getAttribute("data-history-id");
      if (!hid) return;
      openHistoryModal(hid);
    }
    */
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

    // [v2 리뉴얼] era, poemCount 추가 (시대별 그룹핑 + 폰트 크기 계산용)
    const era = a?.era?.period || null;
    const poemCount = worksRaw.length;

    events.push({
      year,
      authorId,
      nameZh,
      nameKo,
      lifeStr,
      bio: (a?.bioKo || "").slice(0, 120),
      works,
      era,        // [v2] 'early'|'high'|'mid'|'late'
      poemCount,  // [v2] 워드클라우드 폰트 크기 계산용
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

// ===== 10.5) UI 설정 → CSS 변수 주입 =====
function applyUISettings(s) {
  if (!s) return;
  const r = document.documentElement.style;

  // 시대별 타임라인 배경색/글자색
  if (s.timeline) {
    for (const [era, v] of Object.entries(s.timeline)) {
      r.setProperty(`--era-${era}-bg`, v.bg);
      r.setProperty(`--era-${era}-text`, v.textColor);
    }
  }

  // 시 모달 섹션별 배경색
  if (s.poemSections) {
    const map = {
      poemText: "--poem-text-bg",
      commentary: "--poem-commentary-bg",
      commentaryTr: "--poem-commentary-tr-bg",
      notes: "--poem-notes-bg",
      advanced: "--poem-advanced-bg",
      workList: "--poem-worklist-bg",
    };
    for (const [key, varName] of Object.entries(map)) {
      if (s.poemSections[key]) r.setProperty(varName, s.poemSections[key].bg);
    }
  }

  // 폰트 설정
  if (s.fonts) {
    for (const [key, f] of Object.entries(s.fonts)) {
      const fullFamily = f.family + (f.fallback ? `, ${f.fallback}` : "");
      r.setProperty(`--font-${key}-family`, fullFamily);
      r.setProperty(`--font-${key}-size`, `${f.size}px`);
      r.setProperty(`--font-${key}-weight`, String(f.weight));
      r.setProperty(`--font-${key}-color`, f.color);
    }
  }
}

// ===== 11) main =====
async function main() {
  const root = document.getElementById("timeline");
  if (!root) throw new Error("Missing #timeline");

  const poemsFullPromise = loadJSON("public/index/poems.full.owned.json")
    .catch(() => loadJSON("public/index/poems.full.json"))
    .catch(() => loadJSON("public/index/poems.compact.json"));

  const [authorsDB, poemsCompact, poemsFull, historyCards] = await Promise.all([
    loadJSON("public/index/db_author.with_ko.json"),
    loadJSON("public/index/poems.compact.json"),
    poemsFullPromise,
    loadJSON("public/index/history_cards.json"),
  ]);

  // UI 설정 로드 → CSS 변수 주입
  try {
    const uiSettings = await loadJSON("public/index/ui_settings.json");
    applyUISettings(uiSettings);
  } catch (e) {
    console.warn("ui_settings.json 로드 실패, CSS 기본값 사용:", e);
  }

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

  /* [v2 리뉴얼] 기존 연도별 렌더링 루프 → 시대별 렌더링으로 대체
     기존 코드:
       const aByYear = groupByYear(authorEvents);
       const hByYear = groupByYear(historyEvents);
       for (const y of years) { ... renderPrimaryItem(y, left, right) }
       // + 연도 미상 작가 별도 처리
     변경 이유: 시인 76명 카드가 한꺼번에 펼쳐지는 정보 과부하 → 시대별 워드클라우드로 개편
  */

  // 시대별 그룹핑
  const authorsByEra = groupByEra(authorEvents);
  const historyByEra = groupHistoryByEra(historyEvents);

  // 隋 북엔드
  root.appendChild(renderBookend("隋"));

  // 4개 시대 섹션 렌더링
  const eras = ERA_CONFIG.filter(e => ["early", "high", "mid", "late"].includes(e.key));
  for (const eraConf of eras) {
    const poets = authorsByEra.get(eraConf.key) || [];
    const hGroup = historyByEra.get(eraConf.key) || { main: [], minor: [] };

    // [v3] 전체 시대에 새 디자인 적용
    const eraDetail = ERA_DETAILS[eraConf.key];
    if (eraDetail) {
      // 분기점 사건 분리: featured 1개 + 나머지 dot
      const allEvents = [...hGroup.main, ...hGroup.minor]
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      const featuredEvent = allEvents.find(h => h.titleId === eraDetail.featuredEventId);
      const dotEvents = allEvents.filter(h => h.titleId !== eraDetail.featuredEventId);

      const poetCards = renderPoetMiniCards(poets);
      const featuredNode = renderFeaturedEvent(featuredEvent || null, eraConf, eraDetail);

      root.appendChild(renderEraSection_v3(eraConf, eraDetail, poetCards, featuredNode, dotEvents));
      continue;
    }

    // 기존 v2 렌더링
    const poetNamesNode = renderPoetNames(poets);
    const mainCards = hGroup.main.map(renderMainHistoryCard);
    const minorDots = hGroup.minor.map(renderMinorHistoryDot);

    root.appendChild(renderEraSection(eraConf, poetNamesNode, mainCards, minorDots));
  }

  // 五代十國 북엔드
  root.appendChild(renderBookend("五代十國"));

  // 이벤트 바인딩
  bindAccordions(root);
  bindModalUI();
  bindModalOpeners(root);
  bindHoverPopups(root); // [v2 리뉴얼] 호버 팝업 바인딩 추가
  bindFeaturedToggle(root); // [v3] 분기점 사건 더보기 토글
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});
