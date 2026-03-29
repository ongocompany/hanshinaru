// timeline/tooltip.js
// 호버 팝업, 주석 툴팁, 미니 카드 팝업, 크로스 링크
// ------------------------------------------------------------

// ===== 주석 툴팁 =====
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

function positionTooltipAtCursor(tooltip, mouseX, mouseY, modal) {
  const modalBox = modal.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = mouseY + 10;
  let left = mouseX + 10;

  if (left + tooltipRect.width > modalBox.right) {
    left = mouseX - tooltipRect.width - 10;
  }
  if (top + tooltipRect.height > modalBox.bottom) {
    top = mouseY - tooltipRect.height - 10;
  }
  if (left < modalBox.left) {
    left = modalBox.left + 10;
  }
  if (top < modalBox.top) {
    top = modalBox.top + 10;
  }

  tooltip.style.position = "fixed";
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function showAnnotationTooltip(element, content, mouseX, mouseY) {
  const tooltip = getOrCreateTooltip();
  const modal = document.getElementById("modal");
  if (!modal) return;

  tooltip.textContent = content;
  tooltip.hidden = false;

  positionTooltipAtCursor(tooltip, mouseX, mouseY, modal);
}

function hideAnnotationTooltip() {
  const tooltip = document.getElementById("annotation-tooltip");
  if (tooltip) tooltip.hidden = true;
}

function bindAnnotationHovers(container) {
  container.addEventListener("mouseover", (e) => {
    const noteWord = e.target.closest(".note-word");
    if (!noteWord) return;

    const noteText = noteWord.dataset.noteText;
    if (!noteText) return;

    showAnnotationTooltip(noteWord, noteText, e.clientX, e.clientY);
  });

  container.addEventListener("mouseout", (e) => {
    const noteWord = e.target.closest(".note-word");
    if (!noteWord) return;

    hideAnnotationTooltip();
  });
}

// ===== 호버 팝업 시스템 =====
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

  const popupRect = popup.getBoundingClientRect();
  let top = anchorRect.bottom + 8;
  let left = anchorRect.left + (anchorRect.width / 2) - (popupRect.width / 2);

  if (left < 10) left = 10;
  if (left + popupRect.width > window.innerWidth - 10) {
    left = window.innerWidth - popupRect.width - 10;
  }
  if (top + popupRect.height > window.innerHeight - 10) {
    top = anchorRect.top - popupRect.height - 8;
  }

  popup.style.position = "fixed";
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

function hidePopup() {
  const popup = document.getElementById("hover-popup");
  if (popup) popup.hidden = true;
}

// ===== 시인/역사 팝업 내용 생성 =====
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

// ===== 타임라인 호버 이벤트 위임 =====
function bindHoverPopups(root) {
  let hoverTimeout = null;

  root.addEventListener("mouseover", (e) => {
    const poetSpan = e.target.closest(".poet-name[data-author-id]");
    if (poetSpan) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const authorId = poetSpan.getAttribute("data-author-id");
        const html = buildPoetPopupHTML(authorId);
        if (html) showPopup(html, poetSpan.getBoundingClientRect());
      }, 200);
      return;
    }

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

// ===== 주석 크로스 링크 =====
function bindNoteCrossLinks(container) {
  container.addEventListener("click", (e) => {
    const noteWord = e.target.closest(".note-word");
    if (noteWord) {
      const fullId = noteWord.id.replace("note-ref-", "");
      const targetItem = document.getElementById(`note-item-${fullId}`);
      if (targetItem) {
        targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
        targetItem.classList.add("highlight-flash");
        setTimeout(() => targetItem.classList.remove("highlight-flash"), 2000);
      }
      return;
    }

    const noteRef = e.target.closest(".note-ref");
    if (noteRef) {
      const fullId = noteRef.id.replace("note-ref-", "");
      const targetItem = document.getElementById(`note-item-${fullId}`);
      if (targetItem) {
        targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
        targetItem.classList.add("highlight-flash");
        setTimeout(() => targetItem.classList.remove("highlight-flash"), 2000);
      }
      return;
    }

    const noteNoSpan = e.target.closest(".note-no");
    const noteHeadSpan = e.target.closest(".note-head");

    if (noteNoSpan || noteHeadSpan) {
      const noteItem = e.target.closest(".note-item");
      if (noteItem) {
        const fullId = noteItem.id.replace("note-item-", "");
        const targetRef = document.getElementById(`note-ref-${fullId}`);
        if (targetRef) {
          targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
          targetRef.classList.add("highlight-flash");
          setTimeout(() => targetRef.classList.remove("highlight-flash"), 2000);
        }
      }
      return;
    }
  });
}
