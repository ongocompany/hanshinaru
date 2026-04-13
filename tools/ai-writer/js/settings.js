/**
 * settings.js — AI Writer Settings Module
 * Loaded first; exposes global `Settings` object.
 */
const Settings = (() => {
  'use strict';

  // ─── Storage keys ────────────────────────────────────────────────────────
  const STORAGE_KEYS = {
    api:      'aiwriter_api_config',
    types:    'aiwriter_content_types',
    presets:  'aiwriter_style_presets',
    supabase: 'aiwriter_supabase',
  };

  // ─── Default providers ────────────────────────────────────────────────────
  const DEFAULT_PROVIDERS = [
    {
      id: 'openrouter',
      label: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: ['qwen/qwen3.6-plus', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro'],
    },
    {
      id: 'dashscope',
      label: 'Alibaba DashScope',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    },
    {
      id: 'openai',
      label: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4.1', 'gpt-4.1-mini', 'o3-mini'],
    },
    {
      id: 'google',
      label: 'Google AI',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    },
    {
      id: 'custom',
      label: '커스텀 URL',
      baseUrl: '',
      models: [],
    },
  ];

  // ─── Default content types ────────────────────────────────────────────────
  const DEFAULT_CONTENT_TYPES = [
    { id: 'poem-commentary',  label: '시 해설',       custom: false },
    { id: 'literary-history', label: '문학사',        custom: false },
    { id: 'history',          label: '역사',          custom: false },
    { id: 'poet-intro',       label: '작가 소개',     custom: false },
    { id: 'beginner-guide',   label: '입문 가이드',   custom: false },
  ];

  // ─── Default style presets ────────────────────────────────────────────────
  const DEFAULT_STYLE_PRESETS = [
    {
      id: 'popular',
      label: '대중 교양',
      desc: '전문 용어를 쓰되 쉽게 풀어쓴다. 독자가 배경지식 없이도 이해할 수 있도록.',
    },
    {
      id: 'academic',
      label: '학술적',
      desc: '논문 스타일. 근거를 명확히 밝히고, 인용과 출전을 중시한다.',
    },
    {
      id: 'essay',
      label: '에세이풍',
      desc: '개인적 감상과 서사를 섞는다. 경험과 느낌을 곁들여 이야기하듯 쓴다.',
    },
    {
      id: 'journalism',
      label: '저널리즘',
      desc: '사실 중심, 간결한 문장. 핵심을 먼저 전달하고 배경을 뒤에 놓는다.',
    },
    {
      id: 'easy',
      label: '쉬운 설명',
      desc: '중학생도 이해할 수 있는 수준. 비유와 예시를 적극 활용한다.',
    },
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function _save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[Settings] localStorage write failed:', e);
    }
  }

  function _genId() {
    return 'custom_' + Math.random().toString(36).slice(2, 9);
  }

  // ─── init ─────────────────────────────────────────────────────────────────
  /**
   * Set defaults in localStorage if not yet set.
   * Idempotent — safe to call multiple times.
   */
  function init() {
    if (!localStorage.getItem(STORAGE_KEYS.api)) {
      _save(STORAGE_KEYS.api, {
        provider: 'openrouter',
        apiKey:   '',
        model:    'qwen/qwen3.6-plus',
        baseUrl:  '',
      });
    }
    if (!localStorage.getItem(STORAGE_KEYS.types)) {
      _save(STORAGE_KEYS.types, DEFAULT_CONTENT_TYPES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.presets)) {
      _save(STORAGE_KEYS.presets, DEFAULT_STYLE_PRESETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.supabase)) {
      _save(STORAGE_KEYS.supabase, { url: '', key: '' });
    }
  }

  // ─── API config ───────────────────────────────────────────────────────────
  function getApiConfig() {
    return _load(STORAGE_KEYS.api, {
      provider: 'openrouter',
      apiKey:   '',
      model:    'qwen/qwen3.6-plus',
      baseUrl:  '',
    });
  }

  function saveApiConfig(config) {
    _save(STORAGE_KEYS.api, config);
  }

  // ─── Supabase config ──────────────────────────────────────────────────────
  function getSupabaseConfig() {
    return _load(STORAGE_KEYS.supabase, { url: '', key: '' });
  }

  function saveSupabaseConfig(config) {
    _save(STORAGE_KEYS.supabase, config);
  }

  // ─── Content types ────────────────────────────────────────────────────────
  function getContentTypes() {
    return _load(STORAGE_KEYS.types, DEFAULT_CONTENT_TYPES);
  }

  function addContentType(label) {
    const types = getContentTypes();
    types.push({ id: _genId(), label, custom: true });
    _save(STORAGE_KEYS.types, types);
  }

  function removeContentType(id) {
    const types = getContentTypes().filter(t => t.id !== id);
    _save(STORAGE_KEYS.types, types);
  }

  // ─── Style presets ────────────────────────────────────────────────────────
  function getStylePresets() {
    return _load(STORAGE_KEYS.presets, DEFAULT_STYLE_PRESETS);
  }

  function addStylePreset(label, desc) {
    const presets = getStylePresets();
    presets.push({ id: _genId(), label, desc });
    _save(STORAGE_KEYS.presets, presets);
  }

  function removeStylePreset(id) {
    const presets = getStylePresets().filter(p => p.id !== id);
    _save(STORAGE_KEYS.presets, presets);
  }

  // ─── showModal ────────────────────────────────────────────────────────────
  function showModal() {
    const overlay = document.getElementById('settings-modal');
    if (!overlay) {
      console.warn('[Settings] #settings-modal element not found');
      return;
    }

    const cfg       = getApiConfig();
    const sbCfg     = getSupabaseConfig();
    const providers = DEFAULT_PROVIDERS;

    // Build provider <option> list
    const providerOptions = providers
      .map(p => `<option value="${p.id}"${p.id === cfg.provider ? ' selected' : ''}>${p.label}</option>`)
      .join('');

    // Build model <datalist> for current provider
    const currentProvider = providers.find(p => p.id === cfg.provider) || providers[0];
    const modelOptions = currentProvider.models
      .map(m => `<option value="${m}">`)
      .join('');

    const isCustom      = cfg.provider === 'custom';
    const baseUrlStyle  = isCustom ? '' : 'display:none;';

    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <h2 class="modal__title" id="settings-modal-title">설정</h2>

        <!-- AI Provider -->
        <div class="field modal__field">
          <label for="sm-provider">AI 제공자</label>
          <div class="select-wrap">
            <select id="sm-provider">${providerOptions}</select>
          </div>
        </div>

        <!-- API Key -->
        <div class="field modal__field">
          <label for="sm-apikey">API 키</label>
          <input id="sm-apikey" type="password" placeholder="sk-..." value="${_escHtml(cfg.apiKey)}">
        </div>

        <!-- Model -->
        <div class="field modal__field">
          <label for="sm-model">모델</label>
          <input id="sm-model" type="text" list="sm-model-list" value="${_escHtml(cfg.model)}" placeholder="모델명 입력">
          <datalist id="sm-model-list">${modelOptions}</datalist>
        </div>

        <!-- Base URL (custom only) -->
        <div class="field modal__field" id="sm-baseurl-wrap" style="${baseUrlStyle}">
          <label for="sm-baseurl">Base URL</label>
          <input id="sm-baseurl" type="text" placeholder="https://..." value="${_escHtml(cfg.baseUrl)}">
        </div>

        <hr class="modal__sep">

        <!-- Supabase -->
        <div class="field modal__field">
          <label for="sm-sb-url">Supabase URL</label>
          <input id="sm-sb-url" type="text" placeholder="https://xxx.supabase.co" value="${_escHtml(sbCfg.url)}">
        </div>

        <div class="field modal__field">
          <label for="sm-sb-key">Supabase Anon Key</label>
          <input id="sm-sb-key" type="password" placeholder="eyJ..." value="${_escHtml(sbCfg.key)}">
        </div>

        <!-- Actions -->
        <div class="modal__actions">
          <button class="modal__btn-test" id="sm-btn-test" type="button">연결 테스트</button>
          <button class="modal__btn-cancel" id="sm-btn-cancel" type="button">취소</button>
          <button class="modal__btn-ok" id="sm-btn-save" type="button">저장</button>
        </div>
      </div>
    `;

    overlay.classList.add('modal-overlay--open');
    overlay.style.display = 'flex';

    // ── Provider change handler ──────────────────────────────────────────
    const providerSel = overlay.querySelector('#sm-provider');
    const modelInput  = overlay.querySelector('#sm-model');
    const modelList   = overlay.querySelector('#sm-model-list');
    const baseWrap    = overlay.querySelector('#sm-baseurl-wrap');
    const baseInput   = overlay.querySelector('#sm-baseurl');

    providerSel.addEventListener('change', () => {
      const sel = providers.find(p => p.id === providerSel.value) || providers[0];
      // Update datalist
      modelList.innerHTML = sel.models.map(m => `<option value="${m}">`).join('');
      // Auto-select first model if provider changed
      if (sel.models.length) modelInput.value = sel.models[0];
      // Show/hide base URL
      if (sel.id === 'custom') {
        baseWrap.style.display = '';
        baseInput.value = '';
      } else {
        baseWrap.style.display = 'none';
        baseInput.value = sel.baseUrl;
      }
    });

    // ── Test connection ──────────────────────────────────────────────────
    overlay.querySelector('#sm-btn-test').addEventListener('click', async () => {
      const testConfig = _readFormConfig(overlay, providers);
      try {
        if (typeof AIClient !== 'undefined') {
          await AIClient.testConnection(testConfig.apiCfg);
        } else {
          _toast('AIClient가 아직 로드되지 않았습니다.', 'warn');
        }
      } catch (err) {
        _toast('연결 테스트 실패: ' + (err.message || err), 'error');
      }
    });

    // ── Cancel ───────────────────────────────────────────────────────────
    overlay.querySelector('#sm-btn-cancel').addEventListener('click', () => _closeModal(overlay));

    // ── Save ─────────────────────────────────────────────────────────────
    overlay.querySelector('#sm-btn-save').addEventListener('click', () => {
      const { apiCfg, sbCfg: newSbCfg } = _readFormConfig(overlay, providers);
      saveApiConfig(apiCfg);
      saveSupabaseConfig(newSbCfg);
      _closeModal(overlay);
      _toast('설정 저장 완료!', 'success');
    });

    // Close on overlay click (outside modal box)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) _closeModal(overlay);
    }, { once: true });
  }

  // ─── Private modal helpers ────────────────────────────────────────────────
  function _readFormConfig(overlay, providers) {
    const providerId = overlay.querySelector('#sm-provider').value;
    const apiKey     = overlay.querySelector('#sm-apikey').value.trim();
    const model      = overlay.querySelector('#sm-model').value.trim();
    const baseUrlEl  = overlay.querySelector('#sm-baseurl');
    const sbUrlEl    = overlay.querySelector('#sm-sb-url');
    const sbKeyEl    = overlay.querySelector('#sm-sb-key');

    const providerDef = providers.find(p => p.id === providerId) || providers[0];
    const baseUrl     = providerId === 'custom'
      ? (baseUrlEl ? baseUrlEl.value.trim() : '')
      : providerDef.baseUrl;

    return {
      apiCfg: { provider: providerId, apiKey, model, baseUrl },
      sbCfg:  { url: sbUrlEl ? sbUrlEl.value.trim() : '', key: sbKeyEl ? sbKeyEl.value.trim() : '' },
    };
  }

  function _closeModal(overlay) {
    overlay.style.display = 'none';
    overlay.classList.remove('modal-overlay--open');
    overlay.innerHTML = '';
  }

  function _toast(msg, type) {
    if (typeof App !== 'undefined' && typeof App.toast === 'function') {
      App.toast(msg, type);
    } else {
      console.info(`[Settings toast][${type}] ${msg}`);
    }
  }

  function _escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init,
    getApiConfig,
    saveApiConfig,
    getSupabaseConfig,
    saveSupabaseConfig,
    getContentTypes,
    addContentType,
    removeContentType,
    getStylePresets,
    addStylePreset,
    removeStylePreset,
    showModal,
    DEFAULT_PROVIDERS,
    DEFAULT_STYLE_PRESETS,
  };
})();
