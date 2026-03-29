// timeline/timeline-render.js
// v2/v3 시대별 타임라인 렌더러, 시인 카드, 역사 카드, 모달 UI
// ------------------------------------------------------------

// ===== 더미 UI / 아바타 =====
const DUMMY_UI = {
  defaultAvatar: "/public/assets/avatars/default-author.jpg",
  authorTags: ["성당", "시성", "대표"],
  historyTags: ["사건"],
};

function getAuthorAvatar(authorId) {
  if (!authorId) return DUMMY_UI.defaultAvatar;
  return `/public/assets/avatars/${authorId}.jpg`;
}

const AVATAR_ONERROR = `onerror="this.onerror=null;this.src='${DUMMY_UI.defaultAvatar}'"`;

// ===== [v2] 시인 이름 워드클라우드 =====
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

// ===== 메인 역사 카드 =====
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

// ===== 소규모 역사 이벤트 =====
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

// ===== v2 시대 섹션 =====
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

// ===== 북엔드 라벨 =====
function renderBookend(label) {
  return el(`
    <div class="era-bookend">
      <div class="era-bookend-label">${escapeHTML(label)}</div>
    </div>
  `);
}

// ===== [v3] 시인 미니카드 =====
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

function renderPoetMiniCards(authors) {
  if (!authors.length) return el(`<div class="v3-poet-grid empty">-</div>`);

  const rowSizes = distributeIrregularRows(authors.length);
  const container = el(`<div class="v3-poet-grid"></div>`);
  let idx = 0;

  for (const size of rowSizes) {
    const row = el(`<div class="v3-poet-row"></div>`);
    for (let j = 0; j < size; j++) {
      const a = authors[idx++];
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

// ===== [v3] 분기점 사건 렌더 =====
function renderFeaturedEvent(historyEvent, eraConfig, eraDetail) {
  if (!historyEvent) return el(`<div class="v3-featured empty"></div>`);

  const eventTitle = historyEvent?.name?.ko || "";
  const eventZh = historyEvent?.name?.zh ? normalizeZhName(historyEvent.name.zh) : "";
  const eventLife = formatEventLife(historyEvent.life);

  const eraZh = eraConfig?.zhLabel || "";
  const eraKo = eraConfig?.label || "";
  const eraRange = eraDetail?.yearRange || "";

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

// ===== [v3] 시대 섹션 조립 =====
function renderEraSection_v3(eraConfig, eraDetail, poetCards, featuredNode, dotEvents) {
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

  if (poetCards) left.appendChild(poetCards);

  if (featuredNode) {
    const subHeader = featuredNode.querySelector(".v3-sub-header");
    const divider = featuredNode.querySelector(".v3-featured-divider");
    const descBox = featuredNode.querySelector(".v3-desc-box");

    if (subHeader) featHeader.appendChild(subHeader);
    if (divider) featHeader.appendChild(divider);
    if (descBox) featContent.appendChild(descBox);
  }

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

// ===== 이벤트 바인딩 =====

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

    if (summary) {
      summary.style.webkitLineClamp = expanded ? "5" : "unset";
      summary.style.overflow = expanded ? "hidden" : "visible";
    }
  });
}

function bindAccordions(root) {
  root.addEventListener("click", (e) => {
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

// ===== 모달 UI =====
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
