// =============================================================
//  한시의모든것 — Supabase 클라이언트 초기화
//  모든 페이지에서 공용으로 사용
//  사용법: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//          <script src="/shared/supabase.js"></script>
//          → window.sb 로 접근
// =============================================================

(function () {
  const SUPABASE_URL = 'https://iplxexvmrnzlqglfqrpg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SBqquD4OkM6a93H3dMPNRQ_X5JChwWI';

  // REST API 직접 호출용 공용 상수
  window.SB_REST_URL = SUPABASE_URL + '/rest/v1';
  window.SB_API_KEY = SUPABASE_KEY;
  window.SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };

  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.warn('[supabase.js] supabase-js CDN 미로드 — REST API만 사용 가능');
    return;
  }

  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('[supabase.js] Supabase 클라이언트 초기화 완료');
})();
