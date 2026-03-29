// =============================================================
//  한시의모든것 — Lightweight Auth State (SDK 불필요)
//  localStorage에서 Supabase 세션을 읽어 로그인 상태 확인
//  사용법: <script src="/shared/auth-state.js"></script>
//          → window.AuthState.getUser() / .isLoggedIn()
// =============================================================

(function () {
  'use strict';

  var STORAGE_KEY = 'sb-iplxexvmrnzlqglfqrpg-auth-token';

  function getUser() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      var user = session && session.user;
      if (!user) return null;
      // 토큰 만료 체크
      var expiresAt = session.expires_at;
      if (expiresAt && Date.now() / 1000 > expiresAt) return null;
      return {
        id: user.id,
        email: user.email || '',
        nickname: (user.user_metadata && user.user_metadata.nickname) || (user.email ? user.email.split('@')[0] : ''),
        avatar: (user.user_metadata && user.user_metadata.avatar_url) || null,
      };
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return getUser() !== null;
  }

  window.AuthState = { getUser: getUser, isLoggedIn: isLoggedIn };
})();
