/**
 * app.js — 한시나루 AI 저작툴 메인 컨트롤러
 *
 * IIFE 모듈 패턴. 전역 App 객체 노출.
 * 의존: Settings, AIClient, PromptBuilder, DB, Editor, Toolbar (script 태그로 선 로드)
 */

const App = (() => {
  // =====================================================
  // CONSTANTS
  // =====================================================

  const MODES = [
    { id: 'poem',    label: '시 해설',    icon: '📜' },
    { id: 'poet',    label: '시인 소개',  icon: '👤' },
    { id: 'history', label: '역사 카드',  icon: '🏛'  },
    { id: 'article', label: '아티클',     icon: '📝' },
  ];

  const DEFAULT_CONTENT_TYPES = [
    { id: 'commentary', label: '시 해설' },
    { id: 'intro',      label: '시인 소개' },
    { id: 'history',    label: '역사 정보' },
    { id: 'essay',      label: '에세이' },
  ];

  const DEFAULT_STYLE_PRESETS = [
    { id: 'academic',  label: '학술적' },
    { id: 'popular',   label: '대중적' },
    { id: 'poetic',    label: '시적' },
    { id: 'concise',   label: '간결한' },
  ];

  // =====================================================
  // STATE
  // =====================================================

  let currentMode = 'poem';
  let _toastTimer = null;

  // =====================================================
  // SAFE GLOBAL HELPERS
  // (guard against missing globals from other tasks)
  // =====================================================

  function safeCall(globalName, method, ...args) {
    try {
      const obj = window[globalName];
      if (obj && typeof obj[method] === 'function') {
        return obj[method](...args);
      }
    } catch (e) {
      console.warn(`[App] ${globalName}.${method}() failed:`, e);
    }
    return null;
  }

  function getContentTypes() {
    const types = safeCall('Settings', 'getContentTypes');
    return types && types.length ? types : DEFAULT_CONTENT_TYPES;
  }

  function getStylePresets() {
    const presets = safeCall('Settings', 'getStylePresets');
    return presets && presets.length ? presets : DEFAULT_STYLE_PRESETS;
  }

  function getStructuresForMode(mode) {
    const structs = safeCall('PromptBuilder', 'getStructuresForMode', mode);
    return structs && structs.length ? structs : [
      { id: 'standard', label: '기본' },
    ];
  }

  // =====================================================
  // INIT
  // =====================================================

  function init() {
    // Settings 초기화 (API 키 등)
    safeCall('Settings', 'init');

    renderModeTabs();
    renderInputPanel();

    // Editor / Toolbar 초기화
    safeCall('Editor', 'init', currentMode);
    safeCall('Toolbar', 'init');

    updateStructureOptions(currentMode);
    updateSaveMeta(currentMode);
    bindEvents();

    console.log('[App] 초기화 완료 — 모드:', currentMode);
  }

  // =====================================================
  // MODE TABS
  // =====================================================

  function renderModeTabs() {
    const container = document.getElementById('mode-tabs');
    if (!container) return;

    container.innerHTML = MODES.map(m => `
      <button
        class="mode-tab${m.id === currentMode ? ' active' : ''}"
        data-mode="${m.id}"
        aria-label="${m.label} 모드"
      >
        <span>${m.icon}</span>
        <span>${m.label}</span>
      </button>
    `).join('');
  }

  // =====================================================
  // INPUT PANEL
  // =====================================================

  function renderInputPanel() {
    const panel = document.getElementById('input-panel');
    if (!panel) return;

    const contentTypes = getContentTypes();
    const stylePresets = getStylePresets();

    panel.innerHTML = `
      <!-- 콘텐츠 유형 -->
      <div class="input-panel__section">
        <div class="input-panel__heading">콘텐츠 유형</div>
        <div class="chips" id="content-type-chips">
          ${contentTypes.map((ct, i) => `
            <span class="chip${i === 0 ? ' active' : ''}" data-type="${ct.id}" role="button" tabindex="0">
              ${ct.label}
            </span>
          `).join('')}
          <span class="chip chip--add" data-action="add-type" role="button" tabindex="0">+ 추가</span>
        </div>
      </div>

      <!-- 주제 -->
      <div class="input-panel__section">
        <label class="input-panel__label" for="topic-input">주제 / 키워드</label>
        <textarea
          class="field"
          id="topic-input"
          rows="3"
          placeholder="작성할 내용의 주제나 핵심 키워드를 입력하세요"
        ></textarea>
      </div>

      <!-- 문체 -->
      <div class="input-panel__section">
        <label class="input-panel__label" for="style-select">문체 스타일</label>
        <div class="select-wrap">
          <select class="field" id="style-select">
            ${stylePresets.map(sp => `
              <option value="${sp.id}">${sp.label}</option>
            `).join('')}
            <option value="custom">직접 입력</option>
          </select>
        </div>
        <textarea
          class="field mt-8 hidden"
          id="style-custom"
          rows="2"
          placeholder="원하는 문체를 직접 설명해 주세요"
        ></textarea>
      </div>

      <!-- 길이 -->
      <div class="input-panel__section">
        <div class="input-panel__label">분량</div>
        <div class="length-chips">
          <span class="chip" data-length="short" role="button" tabindex="0">짧게</span>
          <span class="chip active" data-length="medium" role="button" tabindex="0">보통</span>
          <span class="chip" data-length="long" role="button" tabindex="0">길게</span>
        </div>
      </div>

      <!-- 구조 -->
      <div class="input-panel__section">
        <label class="input-panel__label" for="structure-select">구조</label>
        <div class="select-wrap">
          <select class="field" id="structure-select">
            <!-- updateStructureOptions()에서 채워짐 -->
          </select>
        </div>
      </div>

      <!-- 추가 지시 -->
      <div class="input-panel__section">
        <label class="input-panel__label" for="extra-instructions">추가 지시사항</label>
        <textarea
          class="field"
          id="extra-instructions"
          rows="3"
          placeholder="AI에게 전달할 추가 지시사항 (선택)"
        ></textarea>
      </div>

      <!-- 생성 버튼 -->
      <div class="input-panel__section">
        <button class="btn-generate" id="btn-generate">
          ✨ AI 생성
        </button>
      </div>
    `;
  }

  // =====================================================
  // SWITCH MODE
  // =====================================================

  function switchMode(mode) {
    currentMode = mode;
    renderModeTabs();
    safeCall('Editor', 'init', mode);
    updateStructureOptions(mode);
    updateSaveMeta(mode);
  }

  // =====================================================
  // STRUCTURE OPTIONS
  // =====================================================

  function updateStructureOptions(mode) {
    const select = document.getElementById('structure-select');
    if (!select) return;

    const structures = getStructuresForMode(mode);
    select.innerHTML = structures.map(s => `
      <option value="${s.id}">${s.label}</option>
    `).join('');
  }

  // =====================================================
  // SAVE META
  // =====================================================

  function updateSaveMeta(mode) {
    const meta = document.getElementById('save-meta');
    if (!meta) return;

    if (mode === 'article') {
      meta.innerHTML = `
        <label style="color: var(--c-text-faint); font-size:12px;">섹션</label>
        <div class="select-wrap">
          <select class="field" id="article-section-select" style="height:28px; font-size:12px; padding: 0 24px 0 8px;">
            <option value="">섹션 선택</option>
            <option value="community">커뮤니티</option>
            <option value="history">역사</option>
            <option value="poetry">시문학</option>
          </select>
        </div>
        <label style="color: var(--c-text-faint); font-size:12px; margin-left:8px;">Slug</label>
        <input
          class="field"
          id="article-slug-input"
          style="height:28px; font-size:12px; width:160px; padding: 0 8px;"
          placeholder="url-friendly-slug"
        />
      `;
    } else {
      const modeLabel = MODES.find(m => m.id === mode)?.label || mode;
      meta.innerHTML = `
        <span style="color: var(--c-text-faint); font-size:12px;">모드: ${modeLabel}</span>
      `;
    }
  }

  // =====================================================
  // GENERATE
  // =====================================================

  async function handleGenerate() {
    // API 설정 확인
    const apiConfig = safeCall('Settings', 'getApiConfig');
    if (!apiConfig || !apiConfig.apiKey) {
      toast('API 키를 먼저 설정해 주세요. (⚙ 설정)', 'error');
      return;
    }

    const btn = document.getElementById('btn-generate');
    const indicator = document.getElementById('streaming-indicator');

    // UI — 생성 중 상태
    if (btn) {
      btn.disabled = true;
      btn.textContent = '생성 중...';
    }
    if (indicator) indicator.classList.add('visible');

    try {
      // 파라미터 수집
      const topicInput = document.getElementById('topic-input');
      const styleSelect = document.getElementById('style-select');
      const styleCustom = document.getElementById('style-custom');
      const lengthChip = document.querySelector('.length-chips .chip.active');
      const structureSelect = document.getElementById('structure-select');
      const extraInstructions = document.getElementById('extra-instructions');

      const params = {
        mode: currentMode,
        contentType: getActiveContentType(),
        topic: topicInput?.value?.trim() || '',
        stylePreset: styleSelect?.value || '',
        styleCustom: styleSelect?.value === 'custom' ? styleCustom?.value?.trim() || '' : '',
        structureCustom: document.getElementById('structure-custom')?.value || '',
        length: lengthChip?.dataset.length || 'medium',
        structure: structureSelect?.value || 'standard',
        extra: extraInstructions?.value?.trim() || '',
      };

      // 프롬프트 빌드
      const prompt = safeCall('PromptBuilder', 'build', params) || params.topic;

      // 스트리밍 초기화
      safeCall('Editor', 'startStreaming');

      // AI 호출
      if (window.AIClient && typeof AIClient.streamChat === 'function') {
        await AIClient.streamChat(
          apiConfig,
          prompt,
          (chunk) => safeCall('Editor', 'appendStreaming', chunk)
        );
      } else {
        // AIClient 없을 때 — 더미 스트리밍 (개발/테스트용)
        console.warn('[App] AIClient 없음 — 더미 출력으로 대체');
        const dummy = `[AI 생성 결과 — 더미]\n\n주제: ${params.topic || '(없음)'}\n모드: ${currentMode}\n\n실제 AI 응답은 api.js 구현 후 작동합니다.`;
        for (const char of dummy) {
          safeCall('Editor', 'appendStreaming', char);
          await new Promise(r => setTimeout(r, 12));
        }
      }

      safeCall('Editor', 'finalizeStreaming');
      toast('생성 완료!', 'success');

    } catch (err) {
      console.error('[App] 생성 실패:', err);
      toast(`생성 실패: ${err.message || err}`, 'error');
      safeCall('Editor', 'finalizeStreaming');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✨ AI 생성';
      }
      if (indicator) indicator.classList.remove('visible');
    }
  }

  // =====================================================
  // SAVE
  // =====================================================

  async function handleSave(status) {
    try {
      const data = safeCall('Editor', 'getData', currentMode) || {};

      if (currentMode === 'article') {
        const sectionSelect = document.getElementById('article-section-select');
        const slugInput = document.getElementById('article-slug-input');
        data.section = sectionSelect?.value || '';
        data.slug = slugInput?.value?.trim() || '';
        data.status = status;
      } else {
        data.status = status;
      }

      const result = await (window.DB && typeof DB.save === 'function'
        ? DB.save(currentMode, data)
        : Promise.resolve({ id: 'mock-' + Date.now() }));

      const label = status === 'published' ? 'Published' : 'Draft';
      toast(`${label} 저장 완료! (ID: ${result?.id || '?'})`, 'success');

    } catch (err) {
      console.error('[App] 저장 실패:', err);
      toast(`저장 실패: ${err.message || err}`, 'error');
    }
  }

  // =====================================================
  // RESET
  // =====================================================

  function handleReset() {
    if (!confirm('편집 내용을 모두 초기화할까요?')) return;
    safeCall('Editor', 'clear');
    toast('초기화되었습니다.', 'success');
  }

  // =====================================================
  // LOAD
  // =====================================================

  async function handleLoad() {
    const id = window.prompt('불러올 항목의 ID를 입력하세요:');
    if (!id) return;

    try {
      const data = window.DB && typeof DB.load === 'function'
        ? await DB.load(currentMode, id.trim())
        : null;

      if (!data) {
        toast('항목을 찾을 수 없습니다.', 'error');
        return;
      }

      safeCall('Editor', 'loadData', currentMode, data);
      toast('불러오기 완료!', 'success');

    } catch (err) {
      console.error('[App] 불러오기 실패:', err);
      toast(`불러오기 실패: ${err.message || err}`, 'error');
    }
  }

  // =====================================================
  // CHIP HANDLING
  // =====================================================

  function handleChipClick(e) {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    // "추가" 버튼
    if (chip.dataset.action === 'add-type') {
      const label = window.prompt('추가할 콘텐츠 유형 이름:');
      if (!label) return;
      addCustomChip(label);
      return;
    }

    // 삭제 버튼
    if (e.target.classList.contains('chip__remove')) {
      chip.remove();
      return;
    }

    // 단일 선택 — content-type-chips 내부
    const chipsContainer = chip.closest('#content-type-chips');
    if (chipsContainer) {
      chipsContainer.querySelectorAll('.chip[data-type]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      return;
    }

    // 다중 선택 — length-chips
    const lengthContainer = chip.closest('.length-chips');
    if (lengthContainer) {
      lengthContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    }
  }

  function addCustomChip(label) {
    const id = 'custom-' + Date.now();
    const container = document.getElementById('content-type-chips');
    if (!container) return;

    const addBtn = container.querySelector('[data-action="add-type"]');
    const chip = document.createElement('span');
    chip.className = 'chip chip--custom active';
    chip.dataset.type = id;
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    const textNode = document.createTextNode(label);
    chip.appendChild(textNode);
    const removeSpan = document.createElement('span');
    removeSpan.className = 'chip__remove';
    removeSpan.setAttribute('aria-label', '삭제');
    removeSpan.textContent = '×';
    chip.appendChild(removeSpan);

    // 기존 활성 해제
    container.querySelectorAll('.chip[data-type]').forEach(c => c.classList.remove('active'));

    // 추가 버튼 앞에 삽입
    container.insertBefore(chip, addBtn);
  }

  function getActiveContentType() {
    const active = document.querySelector('#content-type-chips .chip.active');
    return active?.dataset.type || '';
  }

  // =====================================================
  // TOAST
  // =====================================================

  function toast(message, type = 'success') {
    const el = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    if (!el || !msgEl) return;

    // 이전 타이머 취소
    if (_toastTimer) {
      clearTimeout(_toastTimer);
      _toastTimer = null;
    }

    msgEl.textContent = message;
    el.className = 'toast visible';
    if (type !== 'success') el.classList.add(`toast--${type}`);

    _toastTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 3000);
  }

  // =====================================================
  // EVENT BINDING
  // =====================================================

  function bindEvents() {
    // Mode tabs (이벤트 위임)
    const modeTabs = document.getElementById('mode-tabs');
    if (modeTabs) {
      modeTabs.addEventListener('click', e => {
        const tab = e.target.closest('.mode-tab');
        if (tab?.dataset.mode) switchMode(tab.dataset.mode);
      });
    }

    // Generate
    const btnGenerate = document.getElementById('btn-generate');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', handleGenerate);
    }

    // Save
    const btnDraft = document.getElementById('btn-save-draft');
    if (btnDraft) btnDraft.addEventListener('click', () => handleSave('draft'));

    const btnPublish = document.getElementById('btn-save-publish');
    if (btnPublish) btnPublish.addEventListener('click', () => handleSave('published'));

    // Settings
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        if (window.Settings && typeof Settings.showModal === 'function') {
          Settings.showModal();
        } else {
          // 폴백: 설정 모달 직접 열기
          document.getElementById('settings-modal')?.classList.add('visible');
        }
      });
    }

    // Reset
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', handleReset);

    // Load
    const btnLoad = document.getElementById('btn-load');
    if (btnLoad) btnLoad.addEventListener('click', handleLoad);

    // Input panel — 이벤트 위임 (chip, length)
    const inputPanel = document.getElementById('input-panel');
    if (inputPanel) {
      inputPanel.addEventListener('click', handleChipClick);
    }

    // Style select — custom 토글
    document.addEventListener('change', e => {
      if (e.target.id === 'style-select') {
        const styleCustom = document.getElementById('style-custom');
        if (!styleCustom) return;
        if (e.target.value === 'custom') {
          styleCustom.classList.remove('hidden');
        } else {
          styleCustom.classList.add('hidden');
        }
      }
    });

    // AI bubble cancel
    const aiBubbleCancel = document.getElementById('ai-bubble-cancel');
    if (aiBubbleCancel) {
      aiBubbleCancel.addEventListener('click', () => {
        document.getElementById('ai-bubble')?.classList.remove('visible');
      });
    }

    // Keyboard: Esc closes overlays
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        // settings-modal is owned by Settings.showModal() — close via display:none
        const sm = document.getElementById('settings-modal');
        if (sm) {
          sm.classList.remove('visible');
          sm.innerHTML = '';
        }
        document.getElementById('ai-bubble')?.classList.remove('visible');
        document.getElementById('floating-toolbar')?.classList.remove('visible');
        document.getElementById('slash-palette')?.classList.remove('visible');
      }
    });
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  return {
    init,
    toast,
    switchMode,
    get currentMode() { return currentMode; },
  };
})();

// 앱 시작
document.addEventListener('DOMContentLoaded', App.init);
