// timeline/poem.js
// 시 상세 렌더링 (원문/번역/병음/평측/TTS/유튜브)
// ------------------------------------------------------------

function renderPoemSection(p) {
  const poemNoStr = p.poemNoStr || String(p.poemNo ?? "").padStart(3, "0");
  const notes = Array.isArray(p.notes) ? p.notes : [];
  const titleId = poemNoStr;

  const titleFullRaw = p?.title?.zh ?? "";
  const titleFullSource = injectNoteMarkersByHead(titleFullRaw, notes);
  const titleFull = parseTextWithNotes(titleFullSource, notes, titleId);

  const meta = [p.category, p.juan, p.meter ? `${p.meter}언` : ""].filter(Boolean).join(" · ");

  const jipZhSource = injectNoteMarkersByHead(p.jipyeongZh || "", notes);
  const jipZh = parseTextWithNotes(jipZhSource, notes, titleId);

  const notesHTML = notes.length
    ? `<ul class="note-list">${notes.map(n => `
        <li class="note-item" id="note-item-${titleId}-${n.no}">
          <span class="note-no" data-target-ref="${titleId}-${n.no}">[${escapeHTML(n.no)}]</span>
          <span class="note-head">${escapeHTML(n.headZh || n.head || "")}</span>
          <span class="note-text">${escapeHTML(n.text || "")}</span>
        </li>
      `).join("")}</ul>`
    : `<div class="muted">주석 없음</div>`;

  const jipKoRaw = p.jipyeongKo || "";
  const jipKo = escapeHTML(cleanLegacyKoReferences(jipKoRaw));

  const commentaryKoRaw = p.commentaryKo || "";
  const commentaryKo = escapeHTML(commentaryKoRaw);

  const pinyinRaw = p.pinyin || "";
  const pingzeRaw = p.pingze || "";
  const poemCharsRaw = (p.poemZh || "").replace(/\[\d+\]/g, "");
  const ytLinks = (p.media && Array.isArray(p.media.youtube)) ? p.media.youtube : [];

  const titleSimp = p.titleSimp || "";
  const titlePinyin = p.titlePinyin || "";
  const poetSimp = p.poetSimp || "";
  const poetPinyin = p.poetPinyin || "";

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

  const titleKo = p?.title?.ko ?? "";
  const poetZhRaw = p?.poet?.zh ?? "";
  const poetZhClean = poetZhRaw.replace(/\[\d+\]/g, "").trim();
  const poetZhSource = injectNoteMarkersByHead(poetZhRaw, notes);

  let pinyinHTML = "";
  if (poemCharsRaw || pinyinRaw) {
    const titleRuby = buildTitlePinyinRuby(titleSimp, titlePinyin);
    const poetRuby = buildTitlePinyinRuby(poetSimp, poetPinyin);
    const titlePinyinLine = titleRuby ? `<div class="ruby-title">${titleRuby}</div>` : "";
    const poetPinyinLine = poetRuby ? `<div class="ruby-poet">${poetRuby}</div>` : "";

    const simpLines = poemCharsRaw.split("\n");
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

  let pingzeHTML = "";
  if (pingzeRaw && poemCharsRaw) {
    const simpLines = poemCharsRaw.split("\n");
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

  const trKoRaw = p.translationKo || "";

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

  let deepContentHTML = "";
  if (pinyinHTML && pingzeHTML) {
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

  const poemZhSource = injectNoteMarkersByHead(p.poemZh || "", notes);
  const parsedPoemZh = parseTextWithNotes(poemZhSource, notes, titleId);
  const poemZhLines = parsedPoemZh.split("\n");
  const allTrKoLines = trKoRaw.split("\n");
  const trKoLines = (allTrKoLines.length === poemZhLines.length + 2)
    ? allTrKoLines.slice(2)
    : allTrKoLines;
  const maxLines = Math.max(poemZhLines.length, trKoLines.length);
  let bilingualRows = "";
  for (let i = 0; i < maxLines; i++) {
    const zhLine = poemZhLines[i] || "";
    const koLine = escapeHTML(trKoLines[i] || "");
    bilingualRows += `<div class="bl-row"><div class="bl-zh">${zhLine}</div><div class="bl-ko">${koLine}</div></div>`;
  }

  return `
    <section class="poem-sec" data-poem-sec="${escapeHTML(poemNoStr)}">
      <button class="poem-head" type="button" aria-expanded="false">
        <div class="poem-head-line">
          <span class="poem-no">${escapeHTML(poemNoStr)}</span>
          <span class="poem-title">${titleFull}</span>
        </div>
        <div class="poem-head-meta">${escapeHTML(meta)}</div>
      </button>

      <div class="poem-body" hidden>
        <div class="poem-text-box">
          <div class="poem-title-zh">${titleFull}</div>
          ${titleKo ? `<div class="poem-title-ko">${escapeHTML(titleKo)}</div>` : ''}
          <div class="poem-poet-zh">${parseTextWithNotes(poetZhSource, notes, titleId)}</div>
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

        ${commentaryKo ? `
        <div class="poem-section-block poem-sec-commentary-ko">
          <div class="poem-sec-label">해설</div>
          <div class="poem-sec-text pre">${commentaryKo}</div>
        </div>` : ''}

        <div class="poem-section-block poem-sec-notes">
          <div class="poem-sec-label">주석</div>
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

// ===== 작품 섹션 아코디언 + TTS =====
function bindPoemSections(modalBody) {
  modalBody.addEventListener("click", (e) => {
    const head = e.target.closest(".poem-head");
    if (!head) return;

    const sec = head.closest(".poem-sec");
    const body = sec?.querySelector(".poem-body");
    if (!sec || !body) return;

    const expanded = head.getAttribute("aria-expanded") === "true";

    if (expanded) {
      head.setAttribute("aria-expanded", "false");
      body.hidden = true;
      sec.classList.remove("expanded");
    } else {
      const modal = sec.closest(".modal");

      head.setAttribute("aria-expanded", "true");
      body.hidden = false;
      sec.classList.add("expanded");

      const secTopBefore = sec.getBoundingClientRect().top;

      modalBody.querySelectorAll(".poem-sec").forEach(s => {
        if (s !== sec) {
          const h = s.querySelector(".poem-head");
          const b = s.querySelector(".poem-body");
          if (h) h.setAttribute("aria-expanded", "false");
          if (b) b.hidden = true;
          s.classList.remove("expanded");
        }
      });

      if (modal) {
        const secTopAfter = sec.getBoundingClientRect().top;
        modal.scrollTop -= (secTopBefore - secTopAfter);
      }

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

// ===== TTS 재생 =====
let _ttsAudio = null;
let _ttsBtn = null;
let _ttsPlayer = null;

function handleTtsPlay(player, btn, poemNo, speed) {
  if (_ttsBtn === btn && _ttsAudio && !_ttsAudio.paused) {
    stopTtsPlayback();
    return;
  }
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
