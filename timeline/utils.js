// timeline/utils.js
// 텍스트 파싱, 주석 시스템, HTML 이스케이프, 이름 정규화 등 공통 유틸
// ------------------------------------------------------------

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
  return String(s || "").replace(/\[\d+\]/g, "");
}

function normalizePoetName(s) {
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

function getHistoryTagList(h) {
  if (Array.isArray(h?.tags)) return h.tags;
  const era = Array.isArray(h?.tags?.era) ? h.tags.era : [];
  const emp = Array.isArray(h?.tags?.emperor) ? h.tags.emperor : [];
  const theme = Array.isArray(h?.tags?.theme) ? h.tags.theme : [];
  return [...era, ...emp, ...(theme.slice(0, 1))];
}

function renderTagChips(tags, max = 3) {
  const arr = (tags || []).slice(0, max);
  if (!arr.length) return "";
  return arr.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("");
}

function hideDaggers(escapedHTML) {
  return escapedHTML.replace(/†/g, '<span class="note-dagger">†</span>');
}

function splitParagraphs(text) {
  const s = String(text || "").trim();
  if (!s) return [];
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

// ===== 시대별 그룹핑 =====

function getHistoryEra(year, titleId) {
  if (titleId && HISTORY_ERA_OVERRIDE[titleId]) return HISTORY_ERA_OVERRIDE[titleId];
  if (year == null) return null;
  if (year < 618)  return "pre";
  if (year < 713)  return "early";
  if (year < 766)  return "high";
  if (year < 835)  return "mid";
  if (year <= 960) return "late";
  return "post";
}

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

function groupHistoryByEra(historyEvents) {
  const map = new Map();
  for (const era of ["early", "high", "mid", "late"]) {
    map.set(era, { main: [], minor: [] });
  }
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

function calcPoetFontSize(poemCount) {
  const MIN_SIZE = 14;
  const MAX_SIZE = 32;
  if (poemCount <= 1) return MIN_SIZE;
  const ratio = Math.log2(poemCount) / Math.log2(39);
  return Math.round(MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE));
}

// ===== 주석 시스템 =====

function parseTextWithNotes(text, notes, titleId = "") {
  if (!text) return "";
  if (!Array.isArray(notes) || notes.length === 0) return escapeHTML(text);
  const sourceKey = "legacy";
  const noteWordClass = `note-word note-word-${sourceKey}`;
  const noteRefClass = `note-ref note-ref-${sourceKey}`;

  const notesByNo = new Map(notes.map(n => [String(n.no), n]));

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

  const cleanText = text.replace(/\[\d+\]/g, "").replace(/\n/g, " ");
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

  const cleanToOrig = [];
  for (let oi = 0; oi < text.length; oi++) {
    if (!markerSet.has(oi)) cleanToOrig.push(oi);
  }

  for (const m of matches) {
    const note = notesByNo.get(m.noteNo);
    if (!note || !(note.headZh || note.head)) continue;

    const head = note.headZh || note.head;
    const headStart = m.index - head.length;

    if (headStart >= 0 && text.substring(headStart, m.index) === head) {
      m.headStart = headStart;
      m.headLength = head.length;
      m.noteText = note.text;
    } else {
      const cleanIdx = origToClean[m.index];
      const cleanHeadStart = cleanIdx - head.length;
      if (cleanHeadStart >= 0 && cleanText.substring(cleanHeadStart, cleanIdx) === head) {
        m.headStart = cleanToOrig[cleanHeadStart];
        m.headLength = m.index - m.headStart;
        m.noteText = note.text;
      }
    }
  }

  let result = "";
  let lastIndex = text.length;

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];

    result = escapeHTML(text.substring(m.index + m.length, lastIndex)) + result;

    const uniqueId = titleId ? `${titleId}-${m.noteNo}` : m.noteNo;

    if (m.headStart !== undefined) {
      const rawKeyword = text.substring(m.headStart, m.index);
      const displayParts = rawKeyword.replace(/\[\d+\]/g, "").split("\n");
      const noteAttr = `data-note-no="${m.noteNo}" data-note-text="${escapeHTML(m.noteText)}"`;

      if (displayParts.length <= 1) {
        result =
          `<span class="${noteWordClass}" id="note-ref-${uniqueId}" ${noteAttr}>${escapeHTML(displayParts[0])}</span>` +
          `<sup class="${noteRefClass}">${m.noteNo}</sup>` +
          result;
      } else {
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
      const note = notesByNo.get(m.noteNo);
      if (note && note.text) {
        result = `<span class="${noteWordClass}" id="note-ref-${uniqueId}" data-note-no="${m.noteNo}" data-note-text="${escapeHTML(note.text)}">[${m.noteNo}]</span>` + result;
      } else {
        result = `<sup class="${noteRefClass}" id="note-ref-${uniqueId}">${m.noteNo}</sup>` + result;
      }
      lastIndex = m.index;
    }
  }

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
      head: String(n?.headZh ?? n?.head ?? "").trim(),
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
