/**
 * db.js — AI Writer Database Module
 * Supabase REST API CRUD for 4 tables.
 * Depends on: settings.js (Settings global)
 */
const DB = (() => {
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

  // ─── Private helpers ──────────────────────────────────────────────────────

  function getConfig() {
    const config = Settings.getSupabaseConfig();
    if (!config.url || !config.key) {
      throw new Error('Supabase URL과 Key를 설정하세요.');
    }
    return config;
  }

  function headers(config) {
    return {
      'apikey':        config.key,
      'Authorization': `Bearer ${config.key}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    };
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
  return { save, load, list };
})();
