// =============================================================
//  board/init.js — 초기화 + window.Board 노출
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── init ───

  async function init(options) {
    // 기본 설정
    B.state.config = {
      board: options.board || 'forum',
      containerId: options.containerId || 'boardContainer',
      pageSize: options.pageSize || 20,
      canWrite: options.canWrite || function (user) { return !!user; }
    };

    // 현재 사용자
    if (window.AuthState) {
      var user = window.AuthState.getUser();
      if (user) {
        var displayNick = (user.nickname && user.nickname.trim()) ? user.nickname : (user.email ? user.email.split('@')[0] : '');
        B.state.currentUser = {
          id: user.id,
          email: user.email,
          nickname: displayNick,
          avatar: user.avatar,
          role: user.role || null
        };
      }
    }

    // 컨테이너 확인
    var container = document.getElementById(B.state.config.containerId);
    if (!container) {
      console.error('[board.js] 컨테이너를 찾을 수 없습니다: #' + B.state.config.containerId);
      return;
    }

    // 로딩 표시
    container.innerHTML = '<div class="board-loading">게시글을 불러오는 중...</div>';

    // 이벤트 위임 바인딩
    container.addEventListener('click', B.handleClick);
    container.addEventListener('submit', B.handleFormSubmits);
    document.addEventListener('click', B.handleDocumentClick);

    // 첫 페이지 로드
    try {
      var result = await B.API.fetchPosts(0, B.state.config.pageSize);
      B.state.posts = result.data;
      B.state.offset = 0;
      B.state.hasMore = B.state.posts.length < result.count;

      // 좋아요 체크
      if (B.state.currentUser && B.state.posts.length > 0) {
        var postIds = B.state.posts.map(function (p) { return p.id; });
        B.state.likedPostIds = await B.API.checkLikedPosts(postIds);
      }

      // 피드 렌더
      B.Render.feed();

      // ?write=1 파라미터가 있으면 자동으로 글쓰기 폼 열기
      if (new URLSearchParams(window.location.search).get('write') === '1') {
        // 권한 체크 후 글쓰기 모드 진입
        if (!B.state.config.canWrite || B.state.config.canWrite(B.state.currentUser)) {
          B.state.viewMode = 'write';
          B.state.editingPostId = null;
          B.Render.writeForm(null);
        }
      }
    } catch (err) {
      console.error('[board.js] 초기화 에러:', err);
      container.innerHTML = '<div class="board-error">게시판을 불러오지 못했습니다. 새로고침을 시도해 주세요.</div>';
    }
  }

  // ─── window.Board 전역 API ───

  window.Board = {
    init: init,

    // 외부에서 상태 접근 (디버깅/테스트용)
    getState: function () { return B.state; },

    // 유틸리티 노출
    escapeHTML: B.escapeHTML,
    timeAgo: B.timeAgo,
    nl2br: B.nl2br
  };

})(window._B);
