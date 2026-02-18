// =============================================================
//  한시의모든것 — Supabase 클라이언트 초기화
//  모든 페이지에서 공용으로 사용
//  사용법: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//          <script src="/shared/supabase.js"></script>
//          → window.sb 로 접근
// =============================================================

(function () {
  const SUPABASE_URL = 'https://dhbrgmkrqvuftkjskmof.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_3841oamd20AXIpCsiqgkFQ_CX0V6yJB';

  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('[supabase.js] supabase-js CDN이 먼저 로드되어야 합니다.');
    return;
  }

  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('[supabase.js] Supabase 클라이언트 초기화 완료');
})();
