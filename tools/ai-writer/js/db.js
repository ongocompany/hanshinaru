/**
 * db.js — AI Writer Database Module
 * Supabase REST API CRUD for 4 tables + auth + site menu.
 * Depends on: settings.js (Settings global)
 */
var DB = (() => {
  'use strict';

  // ─── Table / key mappings ─────────────────────────────────────────────────
  const TABLE_MAP = {
    poem:    'poems',
    poet:    'poets',
    history: 'history_cards',
    article: 'articles',
  };

  const KEY_MAP = {
    poem:    'poem_no_str',
    poet:    'id',
    history: 'id',
    article: 'slug',
  };

  // ─── Auth state ───────────────────────────────────────────────────────────
  let authToken = null;

  // ─── Private helpers ──────────────────────────────────────────────────────

  function getConfig() {
    if (typeof Settings === 'undefined') {
      throw new Error('Settings 모듈이 로드되지 않았습니다.');
    }
    const config = Settings.getSupabaseConfig();
    if (!config.url || !config.key) {
      throw new Error('Supabase URL과 Key를 설정하세요.');
    }
    return config;
  }

  function headers(config) {
    return {
      'apikey':        config.key,
      'Authorization': `Bearer ${authToken || config.key}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    };
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  /**
   * login(email, password)
   * Authenticates via Supabase email/password and stores access_token.
   * @returns {Promise<boolean>}
   */
  async function login(email, password) {
    const config = getConfig();
    const res = await fetch(
      `${config.url}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'apikey':       config.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`로그인 실패: ${res.status} ${errText}`);
    }
    const data = await res.json();
    authToken = data.access_token;
    // 쿠키에 세션 저장 (7일 유효)
    _saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    });
    return true;
  }

  /**
   * logout()
   * Clears the stored auth token and cookie.
   */
  function logout() {
    authToken = null;
    document.cookie = 'aiwriter_session=; max-age=0; path=/';
  }

  /**
   * isLoggedIn()
   * @returns {boolean}
   */
  function isLoggedIn() {
    return !!authToken;
  }

  /**
   * restoreSession()
   * 쿠키에서 세션 복원. 만료된 경우 refresh_token으로 갱신 시도.
   * @returns {Promise<boolean>}
   */
  async function restoreSession() {
    const session = _loadSession();
    if (!session) return false;

    // 토큰이 아직 유효하면 바로 사용
    if (session.expires_at > Date.now() + 60000) {
      authToken = session.access_token;
      return true;
    }

    // 만료됐으면 refresh_token으로 갱신
    if (session.refresh_token) {
      try {
        const config = getConfig();
        const res = await fetch(
          `${config.url}/auth/v1/token?grant_type=refresh_token`,
          {
            method: 'POST',
            headers: {
              'apikey':       config.key,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: session.refresh_token }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          authToken = data.access_token;
          _saveSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Date.now() + (data.expires_in || 3600) * 1000,
          });
          return true;
        }
      } catch (e) {
        // refresh 실패 — 쿠키 제거
      }
    }

    // 복원 실패
    document.cookie = 'aiwriter_session=; max-age=0; path=/';
    return false;
  }

  function _saveSession(session) {
    try {
      const encoded = btoa(JSON.stringify(session));
      document.cookie = `aiwriter_session=${encoded}; max-age=${7 * 86400}; path=/; SameSite=Strict`;
    } catch (e) { /* ignore */ }
  }

  function _loadSession() {
    try {
      const match = document.cookie.match(/aiwriter_session=([^;]+)/);
      if (!match) return null;
      return JSON.parse(atob(match[1]));
    } catch (e) { return null; }
  }

  // ─── Site Menu ────────────────────────────────────────────────────────────

  /**
   * fetchMenuTree()
   * Fetches all site_menu rows and builds a tree from parent_id.
   * @returns {Promise<Array>} Root nodes with .children arrays
   */
  async function fetchMenuTree() {
    const config = getConfig();
    const res = await fetch(
      `${config.url}/rest/v1/site_menu?select=*&order=sort_order.asc`,
      { headers: headers(config) }
    );
    if (!res.ok) throw new Error(`메뉴 조회 실패: ${res.status}`);
    const flat = await res.json();
    return _buildTree(flat);
  }

  function _buildTree(flat) {
    const map = {};
    flat.forEach(node => {
      map[node.id] = { ...node, children: [] };
    });
    const roots = [];
    flat.forEach(node => {
      if (node.parent_id && map[node.parent_id]) {
        map[node.parent_id].children.push(map[node.id]);
      } else {
        roots.push(map[node.id]);
      }
    });
    return roots;
  }

  /**
   * fetchArticlesBySection(section)
   * Lists articles in a given section, ordered by updated_at desc.
   * @param {string} section
   * @returns {Promise<Array>}
   */
  async function fetchArticlesBySection(section) {
    const config = getConfig();
    const res = await fetch(
      `${config.url}/rest/v1/articles?section=eq.${encodeURIComponent(section)}&select=id,title,slug,status,updated_at&order=updated_at.desc`,
      { headers: headers(config) }
    );
    if (!res.ok) throw new Error(`아티클 목록 조회 실패: ${res.status}`);
    return await res.json();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * save(mode, data)
   * Upserts a record: checks by primary key, then PATCH or POST.
   * @param {string} mode  — 'poem' | 'poet' | 'history' | 'article'
   * @param {Object} data  — record data (must contain key field for UPDATE)
   * @returns {Promise<Object|null>}
   */
  async function save(mode, data) {
    const config = getConfig();
    const table = TABLE_MAP[mode];
    const key   = KEY_MAP[mode];
    if (!table) throw new Error(`알 수 없는 모드: ${mode}`);

    const keyValue = data[key];

    if (keyValue) {
      // Check if record exists
      const checkRes = await fetch(
        `${config.url}/rest/v1/${table}?${key}=eq.${encodeURIComponent(keyValue)}&select=${key}`,
        { headers: headers(config) }
      );
      if (!checkRes.ok) throw new Error(`존재 확인 실패: ${checkRes.status}`);
      const checkData = await checkRes.json();

      if (Array.isArray(checkData) && checkData.length > 0) {
        // UPDATE (PATCH)
        const res = await fetch(
          `${config.url}/rest/v1/${table}?${key}=eq.${encodeURIComponent(keyValue)}`,
          {
            method:  'PATCH',
            headers: headers(config),
            body:    JSON.stringify(data),
          }
        );
        if (!res.ok) throw new Error(`저장 실패: ${res.status} ${await res.text()}`);
        return await res.json();
      }
    }

    // INSERT (POST)
    const res = await fetch(
      `${config.url}/rest/v1/${table}`,
      {
        method:  'POST',
        headers: headers(config),
        body:    JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error(`저장 실패: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  /**
   * load(mode, id)
   * Fetches a single record by primary key value.
   * @param {string} mode  — 'poem' | 'poet' | 'history' | 'article'
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async function load(mode, id) {
    const config = getConfig();
    const table  = TABLE_MAP[mode];
    const key    = KEY_MAP[mode];

    const res = await fetch(
      `${config.url}/rest/v1/${table}?${key}=eq.${encodeURIComponent(id)}&select=*`,
      { headers: headers(config) }
    );
    if (!res.ok) throw new Error(`불러오기 실패: ${res.status}`);
    const data = await res.json();
    return data[0] || null;
  }

  /**
   * list(mode, limit)
   * Returns recent records for the load dialog.
   * articles are ordered by updated_at desc; other tables have no guaranteed order column.
   * @param {string} mode   — 'poem' | 'poet' | 'history' | 'article'
   * @param {number} limit  — default 20
   * @returns {Promise<Array>}
   */
  async function list(mode, limit = 20) {
    const config = getConfig();
    const table  = TABLE_MAP[mode];

    // articles has updated_at; other tables do not — order only where available
    let orderParam = '';
    if (mode === 'article') orderParam = '&order=updated_at.desc';

    const res = await fetch(
      `${config.url}/rest/v1/${table}?select=*&limit=${limit}${orderParam}`,
      { headers: headers(config) }
    );
    if (!res.ok) throw new Error(`목록 조회 실패: ${res.status}`);
    return await res.json();
  }

  // ─── Exports ──────────────────────────────────────────────────────────────
  return {
    save, load, list,
    login, logout, isLoggedIn, restoreSession,
    fetchMenuTree, fetchArticlesBySection,
  };
})();
