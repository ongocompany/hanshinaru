/**
 * editor.js — AI Writer Editor Core Module
 * Loaded after prompt.js; exposes global `Editor` object.
 *
 * Supports 4 modes:
 *   - poem    : fixed sections → poems table fields
 *   - poet    : fixed sections → poets table fields
 *   - history : fixed sections → history_cards table fields
 *   - article : free sections (add/delete/reorder), saved as HTML body
 */
var Editor = (() => {
  'use strict';

  // ─── HTML escape helper ───────────────────────────────────────────────────
  function _escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Module State ─────────────────────────────────────────────────────────
  let currentMode = 'poem';
  let sections = [];       // Array of { key, name, content, color }
  let streamBuffer = '';   // Accumulates streaming text

  // ─── Color palette ────────────────────────────────────────────────────────
  const COLORS = ['purple', 'red', 'green', 'blue', 'yellow'];

  // ─── Fixed section definitions per mode (maps to DB columns) ─────────────
  const MODE_SECTIONS = {
    poem: [
      { key: 'body_zh',        label: '원문',          color: 'red',    placeholder: '한시 원문을 입력하세요...' },
      { key: 'translation_ko', label: '한국어 번역',   color: 'green',  placeholder: '번역을 입력하세요...' },
      { key: 'commentary_ko',  label: '해설',          color: 'blue',   placeholder: '해설을 입력하세요...' },
      { key: 'notes',          label: '주석',          color: 'yellow', placeholder: '주석을 입력하세요...' },
      { key: 'pinyin',         label: '핀인',          color: 'purple', placeholder: '핀인을 입력하세요...' },
    ],
    poet: [
      { key: 'name_info',  label: '기본 정보',  color: 'red',    placeholder: '이름, 생몰년, 출생지...' },
      { key: 'bio_ko',     label: '약력',       color: 'green',  placeholder: '시인의 약력을 작성하세요...' },
      { key: 'era_period', label: '시대 구분',  color: 'blue',   placeholder: '시대와 활동 시기...' },
      { key: 'works',      label: '대표작',     color: 'yellow', placeholder: '대표 작품과 설명...' },
      { key: 'relations',  label: '관계/영향',  color: 'purple', placeholder: '다른 시인과의 관계, 문학사적 영향...' },
    ],
    history: [
      { key: 'year',     label: '연도',              color: 'red',    placeholder: '예: 755' },
      { key: 'name_ko',  label: '사건명 (한국어)',   color: 'green',  placeholder: '예: 안사의 난' },
      { key: 'name_zh',  label: '사건명 (중국어)',   color: 'blue',   placeholder: '예: 安史之亂' },
      { key: 'summary',  label: '요약',              color: 'yellow', placeholder: '사건 요약...' },
      { key: 'detail',   label: '상세 설명',         color: 'purple', placeholder: '상세한 설명을 작성하세요...' },
    ],
    article: [], // free structure
  };

  // ─── createSectionBlock ───────────────────────────────────────────────────
  /**
   * Creates and returns a .section-block DOM element.
   * @param {number}  index       - section index
   * @param {string}  label       - display label
   * @param {string}  content     - initial HTML content
   * @param {string}  color       - color name (matches CSS data-color values)
   * @param {string}  placeholder - placeholder text for empty content
   * @param {boolean} removable   - whether to show up/down/delete buttons (article mode)
   */
  function createSectionBlock(index, label, content, color, placeholder, removable) {
    const block = document.createElement('div');
    block.className = 'section-block';
    block.dataset.index = index;
    block.dataset.color = color;
    block.setAttribute('data-color', color);

    // ── Header ──────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'section-block__header';

    // Label: editable input for article mode, plain text otherwise
    if (removable) {
      const labelInput = document.createElement('input');
      labelInput.className = 'section-block__label';
      labelInput.dataset.sectionLabel = '';
      labelInput.value = label;
      labelInput.style.cssText = [
        'background: transparent',
        'border: none',
        'color: var(--c-text-dim)',
        'font-size: 12px',
        'font-weight: 600',
        'text-transform: uppercase',
        'letter-spacing: 0.06em',
        'outline: none',
        'width: 160px',
        'font-family: inherit',
      ].join('; ');
      header.appendChild(labelInput);
    } else {
      const labelEl = document.createElement('span');
      labelEl.className = 'section-block__label';
      labelEl.textContent = label;
      header.appendChild(labelEl);
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'section-block__actions';

    if (removable) {
      actions.innerHTML = `
        <button data-action="up"     title="위로">↑</button>
        <button data-action="down"   title="아래로">↓</button>
        <button data-action="ai"     title="AI 재생성">✨</button>
        <button data-action="delete" title="삭제">🗑</button>
      `;
    } else {
      actions.innerHTML = `
        <button data-action="ai" title="AI 재생성">✨</button>
      `;
    }

    // Delegate action clicks on the actions container
    actions.addEventListener('click', e => {
      const action = e.target.closest('button')?.dataset.action;
      if (!action) return;
      const idx = parseInt(block.dataset.index);
      switch (action) {
        case 'up':     moveSection(idx, -1); break;
        case 'down':   moveSection(idx,  1); break;
        case 'delete': removeSection(idx);   break;
        case 'ai':     regenerateSection(idx); break;
      }
    });

    header.appendChild(actions);
    block.appendChild(header);

    // ── Content area ─────────────────────────────────────────────────────────
    const contentEl = document.createElement('div');
    contentEl.className = 'section-block__content';
    contentEl.setAttribute('contenteditable', 'true');
    contentEl.setAttribute('data-placeholder', placeholder || '');
    contentEl.innerHTML = content || '';

    block.appendChild(contentEl);

    return block;
  }

  // ─── init ─────────────────────────────────────────────────────────────────
  /**
   * Resets state and renders the editor for the given mode.
   * @param {string} mode - 'poem' | 'poet' | 'history' | 'article'
   */
  function init(mode) {
    currentMode = mode;
    sections = [];
    streamBuffer = '';
    const body = document.getElementById('editor-body');
    if (!body) return;

    if (mode === 'article') {
      body.innerHTML = `
        <div class="editor-title">제목</div>
        <input class="editor-title-input" id="editor-title" placeholder="글 제목을 입력하세요">
        <div class="editor-title">부제목</div>
        <input class="editor-title-input" id="editor-subtitle" placeholder="부제목 (선택)" style="font-size:14px;">
        <div id="sections-container"></div>
        <button class="btn-add-section" id="btn-add-section">+ 섹션 추가</button>
      `;
      document.getElementById('btn-add-section').addEventListener('click', () => addSection());
    } else {
      const modeSections = MODE_SECTIONS[mode] || [];
      body.innerHTML = `
        <div class="editor-title">제목</div>
        <input class="editor-title-input" id="editor-title" placeholder="제목을 입력하세요">
        <div id="sections-container"></div>
      `;
      const container = document.getElementById('sections-container');
      modeSections.forEach(s => {
        sections.push({ key: s.key, name: s.label, content: '', color: s.color });
        container.appendChild(createSectionBlock(
          sections.length - 1, s.label, '', s.color, s.placeholder, false
        ));
      });
    }
  }

  // ─── addSection ───────────────────────────────────────────────────────────
  /**
   * Adds a new free section (article mode only).
   * @param {string} [name]    - section label (defaults to '새 섹션')
   * @param {string} [content] - initial HTML content
   */
  function addSection(name, content) {
    const label = name || '새 섹션';
    const color = COLORS[sections.length % COLORS.length];
    sections.push({ key: `section_${sections.length}`, name: label, content: content || '', color });

    const container = document.getElementById('sections-container');
    if (!container) return;

    const block = createSectionBlock(
      sections.length - 1, label, content || '', color, '내용을 입력하세요...', true
    );
    container.appendChild(block);
  }

  // ─── removeSection ────────────────────────────────────────────────────────
  /**
   * Removes a section by index and rerenders.
   * @param {number} index
   */
  function removeSection(index) {
    if (index < 0 || index >= sections.length) return;
    sections.splice(index, 1);
    rerender();
  }

  // ─── moveSection ──────────────────────────────────────────────────────────
  /**
   * Moves a section up or down by swapping with its neighbor.
   * @param {number} index
   * @param {number} direction - -1 (up) or +1 (down)
   */
  function moveSection(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    syncContentFromDOM();
    const temp = sections[index];
    sections[index] = sections[target];
    sections[target] = temp;
    rerender();
  }

  // ─── rerender ─────────────────────────────────────────────────────────────
  /**
   * Clears and re-renders all sections from the sections array.
   */
  function rerender() {
    const container = document.getElementById('sections-container');
    if (!container) return;
    container.innerHTML = '';

    const isArticle = currentMode === 'article';
    sections.forEach((s, i) => {
      const def = isArticle ? null : (MODE_SECTIONS[currentMode] || [])[i];
      const placeholder = def ? def.placeholder : '내용을 입력하세요...';
      container.appendChild(
        createSectionBlock(i, s.name, s.content, s.color, placeholder, isArticle)
      );
    });
  }

  // ─── syncContentFromDOM ───────────────────────────────────────────────────
  /**
   * Reads current DOM and syncs content (and labels for article) back to sections array.
   */
  function syncContentFromDOM() {
    const container = document.getElementById('sections-container');
    if (!container) return;

    const blocks = container.querySelectorAll('.section-block');
    blocks.forEach((block, i) => {
      if (i >= sections.length) return;
      const contentEl = block.querySelector('.section-block__content');
      if (contentEl) {
        sections[i].content = contentEl.innerHTML;
      }
      if (currentMode === 'article') {
        const labelInput = block.querySelector('[data-section-label]');
        if (labelInput) {
          sections[i].name = labelInput.value;
        }
      }
    });
  }

  // ─── regenerateSection ────────────────────────────────────────────────────
  /**
   * Regenerates a single section using the AI API.
   * @param {number} index
   */
  async function regenerateSection(index) {
    if (index < 0 || index >= sections.length) return;
    const section = sections[index];

    // Guard: need AIClient and Settings
    if (typeof AIClient === 'undefined' || typeof Settings === 'undefined') {
      console.warn('[Editor] AIClient or Settings not loaded');
      return;
    }

    let config;
    try {
      config = Settings.getApiConfig();
    } catch (e) {
      console.warn('[Editor] Settings.getApiConfig() failed:', e);
      return;
    }

    if (!config || !config.apiKey) {
      if (typeof App !== 'undefined' && typeof App.toast === 'function') {
        App.toast('API 키가 설정되지 않았습니다.', 'warn');
      }
      return;
    }

    const instruction = window.prompt(`"${section.name}" 섹션을 어떻게 수정할까요?`);
    if (!instruction) return;

    syncContentFromDOM();

    const styleRules = (typeof PromptBuilder !== 'undefined' && PromptBuilder.BASE_STYLE_RULES)
      ? PromptBuilder.BASE_STYLE_RULES
      : '';

    const system = `너는 한시 콘텐츠 작가다. 아래 섹션을 지시에 따라 다시 작성해라.\n\n${styleRules}`;
    const user   = `섹션명: ${section.name}\n현재 내용:\n${section.content}\n\n지시: ${instruction}\n\n다시 작성한 내용만 출력해라.`;

    try {
      const result = await AIClient.chat(config, { system, user });
      sections[index].content = result;
      rerender();
    } catch (e) {
      console.error('[Editor] regenerateSection failed:', e);
      if (typeof App !== 'undefined' && typeof App.toast === 'function') {
        App.toast(`AI 재생성 실패: ${e.message}`, 'error');
      }
    }
  }

  // ─── startStreaming ───────────────────────────────────────────────────────
  /**
   * Resets streaming state before a new generation begins.
   * Clears stale buffer and removes any previously streamed sections.
   */
  function startStreaming() {
    streamBuffer = '';
    sections = [];
    const container = document.getElementById('sections-container');
    if (container) container.innerHTML = '';
  }

  // ─── appendStreaming ──────────────────────────────────────────────────────
  /**
   * Called by app.js during streaming generation.
   * Accumulates text and progressively updates the editor DOM.
   * @param {string} chunk - next piece of streamed text
   */
  function appendStreaming(chunk) {
    streamBuffer += chunk;

    // Guard: need PromptBuilder.parseSections
    if (typeof PromptBuilder === 'undefined' || typeof PromptBuilder.parseSections !== 'function') {
      return;
    }

    const parsed = PromptBuilder.parseSections(streamBuffer);
    const container = document.getElementById('sections-container');
    if (!container) return;

    // Add new section blocks as sections appear in the stream
    while (sections.length < parsed.length) {
      const p = parsed[sections.length];
      const color = COLORS[sections.length % COLORS.length];
      sections.push({ key: `gen_${sections.length}`, name: p.name, content: '', color });
      container.appendChild(createSectionBlock(
        sections.length - 1, p.name, '', color,
        'AI가 작성 중...', currentMode === 'article'
      ));
    }

    // Update content of each section
    parsed.forEach((p, i) => {
      sections[i].name = p.name;
      sections[i].content = p.content;
      const block = container.children[i];
      if (block) {
        const contentEl = block.querySelector('.section-block__content');
        if (contentEl) contentEl.textContent = p.content;
      }
    });
  }

  // ─── finalizeStreaming ────────────────────────────────────────────────────
  /**
   * Called when streaming is complete. Clears the buffer and syncs DOM → state.
   */
  function finalizeStreaming() {
    streamBuffer = '';
    syncContentFromDOM();
  }

  // ─── clear ────────────────────────────────────────────────────────────────
  /**
   * Resets the editor to the current mode's initial state.
   */
  function clear() {
    init(currentMode);
  }

  // ─── getData ─────────────────────────────────────────────────────────────
  /**
   * Extracts data from editor for DB saving.
   * @param {string} mode
   * @returns {object}
   */
  function getData(mode) {
    syncContentFromDOM();
    const title = document.getElementById('editor-title')?.value || '';

    switch (mode) {
      case 'poem': {
        const data = { title };
        sections.forEach(s => { data[s.key] = s.content; });
        return data;
      }
      case 'poet': {
        const data = { title };
        sections.forEach(s => { data[s.key] = s.content; });
        return data;
      }
      case 'history': {
        const data = {};
        sections.forEach(s => { data[s.key] = s.content; });
        return data;
      }
      case 'article': {
        const subtitle = document.getElementById('editor-subtitle')?.value || '';
        const body = sections.map(s =>
          `<h2>${_escHtml(s.name)}</h2>\n${s.content}`
        ).join('\n\n');
        return { title, subtitle, body };
      }
      default:
        return { title };
    }
  }

  // ─── loadData ────────────────────────────────────────────────────────────
  /**
   * Loads an existing DB record into the editor.
   * @param {string} mode
   * @param {object} data - DB record
   */
  function loadData(mode, data) {
    init(mode);
    const titleInput = document.getElementById('editor-title');
    if (titleInput && data.title) titleInput.value = data.title;

    if (mode === 'article') {
      const subtitleInput = document.getElementById('editor-subtitle');
      if (subtitleInput && data.subtitle) subtitleInput.value = data.subtitle;

      if (data.body) {
        // Parse h2 sections from HTML body
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.body, 'text/html');
        const headers = doc.querySelectorAll('h2');
        if (headers.length > 0) {
          headers.forEach(h2 => {
            let content = '';
            let sibling = h2.nextElementSibling;
            while (sibling && sibling.tagName !== 'H2') {
              content += sibling.outerHTML;
              sibling = sibling.nextElementSibling;
            }
            addSection(h2.textContent, content);
          });
        } else {
          addSection('본문', data.body);
        }
      }
    } else {
      // Map data fields to fixed sections
      sections.forEach(s => {
        if (data[s.key] !== undefined) s.content = data[s.key];
      });
      rerender();
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init,
    addSection,
    startStreaming,
    appendStreaming,
    finalizeStreaming,
    clear,
    getData,
    loadData,
    syncContentFromDOM,
  };
})();
