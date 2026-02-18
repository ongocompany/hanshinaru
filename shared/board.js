// =============================================================
//  한시의모든것 — 커뮤니티 게시판 엔진 (shared/board.js)
//  피드 스타일 공용 게시판: forum / showcase / notice
//  의존: shared/supabase.js (window.sb)
//         shared/auth-state.js (window.AuthState)
//  사용법: Board.init({ board: 'forum', containerId: 'boardContainer', ... })
// =============================================================

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  //  유틸리티 함수
  // ─────────────────────────────────────────────

  /** XSS 방지 — 모든 사용자 콘텐츠에 반드시 적용 */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 줄바꿈을 <br>로 변환 (escapeHTML 이후 사용) */
  function nl2br(str) {
    if (!str) return '';
    return str.replace(/\n/g, '<br>');
  }

  /** 상대 시간 표시 */
  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    if (diff < 604800) return Math.floor(diff / 86400) + '일 전';

    // 7일 이상: YYYY.MM.DD
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  /** Supabase 클라이언트 반환 (없으면 에러) */
  function getSB() {
    if (!window.sb) {
      throw new Error('[board.js] window.sb가 없습니다. shared/supabase.js를 먼저 로드하세요.');
    }
    return window.sb;
  }


  // ─────────────────────────────────────────────
  //  상태 (State)
  // ─────────────────────────────────────────────

  var state = {
    config: null,           // Board.init() 설정
    currentUser: null,      // { id, email, nickname, avatar, role } or null
    posts: [],              // 로드된 게시글 배열 (누적)
    offset: 0,              // 현재 페이지네이션 오프셋
    hasMore: true,          // 더 불러올 데이터 존재 여부
    viewMode: 'feed',       // 'feed' | 'write' | 'edit'
    editingPostId: null,    // 수정 중인 게시글 ID
    likedPostIds: new Set() // 사용자가 좋아요 누른 게시글 ID 집합
  };


  // ─────────────────────────────────────────────
  //  API 레이어 (Supabase)
  // ─────────────────────────────────────────────

  var API = {};

  /**
   * 게시글 목록 조회
   * is_pinned DESC, created_at DESC 정렬
   * profiles 테이블 조인
   */
  API.fetchPosts = async function (offset, limit) {
    var sb = getSB();
    var query = sb
      .from('posts')
      .select('*, profiles:author_id(nickname, avatar_url)', { count: 'exact' })
      .eq('board', state.config.board)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    var result = await query;

    if (result.error) {
      console.error('[board.js] fetchPosts 에러:', result.error);
      return { data: [], count: 0 };
    }

    return { data: result.data || [], count: result.count || 0 };
  };

  /**
   * 댓글 목록 조회
   * created_at ASC 정렬, profiles 조인
   */
  API.fetchComments = async function (postId) {
    var sb = getSB();
    var result = await sb
      .from('comments')
      .select('*, profiles:author_id(nickname, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (result.error) {
      console.error('[board.js] fetchComments 에러:', result.error);
      return [];
    }

    return result.data || [];
  };

  /**
   * 로그인 사용자가 좋아요 누른 게시글 확인
   * @returns {Set} 좋아요 누른 post ID 집합
   */
  API.checkLikedPosts = async function (postIds) {
    if (!state.currentUser || !postIds || postIds.length === 0) {
      return new Set();
    }
    var sb = getSB();
    var result = await sb
      .from('likes')
      .select('post_id')
      .eq('user_id', state.currentUser.id)
      .in('post_id', postIds);

    if (result.error) {
      console.error('[board.js] checkLikedPosts 에러:', result.error);
      return new Set();
    }

    var ids = new Set();
    (result.data || []).forEach(function (row) {
      ids.add(row.post_id);
    });
    return ids;
  };

  /**
   * 좋아요 토글 (RPC)
   * @returns {number} 새로운 좋아요 수
   */
  API.toggleLike = async function (postId) {
    var sb = getSB();
    var result = await sb.rpc('toggle_like', { p_post_id: postId });

    if (result.error) {
      console.error('[board.js] toggleLike 에러:', result.error);
      return null;
    }

    return result.data;
  };

  /** 게시글 작성 */
  API.createPost = async function (postData) {
    var sb = getSB();
    var payload = {
      board: state.config.board,
      author_id: state.currentUser.id,
      title: postData.title,
      body: postData.body || ''
    };

    // showcase 전용 필드
    if (postData.poem_title) payload.poem_title = postData.poem_title;
    if (postData.poem_body) payload.poem_body = postData.poem_body;
    if (postData.poem_translation) payload.poem_translation = postData.poem_translation;
    if (postData.poem_notes) payload.poem_notes = postData.poem_notes;

    var result = await sb
      .from('posts')
      .insert(payload)
      .select('*, profiles:author_id(nickname, avatar_url)')
      .single();

    if (result.error) {
      console.error('[board.js] createPost 에러:', result.error);
      return null;
    }

    return result.data;
  };

  /** 게시글 수정 */
  API.updatePost = async function (postId, postData) {
    var sb = getSB();
    var payload = {
      title: postData.title,
      body: postData.body || ''
    };

    if (state.config.board === 'showcase') {
      payload.poem_title = postData.poem_title || null;
      payload.poem_body = postData.poem_body || null;
      payload.poem_translation = postData.poem_translation || null;
      payload.poem_notes = postData.poem_notes || null;
    }

    var result = await sb
      .from('posts')
      .update(payload)
      .eq('id', postId)
      .select('*, profiles:author_id(nickname, avatar_url)')
      .single();

    if (result.error) {
      console.error('[board.js] updatePost 에러:', result.error);
      return null;
    }

    return result.data;
  };

  /** 게시글 삭제 */
  API.deletePost = async function (postId) {
    var sb = getSB();
    var result = await sb
      .from('posts')
      .delete()
      .eq('id', postId);

    if (result.error) {
      console.error('[board.js] deletePost 에러:', result.error);
      return false;
    }

    return true;
  };

  /** 댓글 작성 (RPC) */
  API.addComment = async function (postId, body, parentId) {
    var sb = getSB();
    var params = {
      p_post_id: postId,
      p_body: body
    };
    if (parentId) {
      params.p_parent_id = parentId;
    }

    var result = await sb.rpc('add_comment', params);

    if (result.error) {
      console.error('[board.js] addComment 에러:', result.error);
      return null;
    }

    return result.data; // new comment id
  };

  /** 댓글 삭제 (RPC) */
  API.deleteComment = async function (commentId) {
    var sb = getSB();
    var result = await sb.rpc('delete_comment', { p_comment_id: commentId });

    if (result.error) {
      console.error('[board.js] deleteComment 에러:', result.error);
      return false;
    }

    return true;
  };

  /** 조회수 증가 (RPC) */
  API.incrementView = async function (postId) {
    var sb = getSB();
    var result = await sb.rpc('increment_view_count', { p_post_id: postId });

    if (result.error) {
      console.error('[board.js] incrementView 에러:', result.error);
    }
  };


  // ─────────────────────────────────────────────
  //  렌더 레이어 (Render)
  // ─────────────────────────────────────────────

  var Render = {};

  /** 프로필에서 닉네임 추출 */
  function getProfileNickname(post) {
    if (post.profiles && post.profiles.nickname) return post.profiles.nickname;
    return '익명';
  }

  /** 현재 사용자가 게시글 소유자인지 확인 */
  function isPostOwner(post) {
    if (!state.currentUser) return false;
    return state.currentUser.id === post.author_id;
  }

  /** 현재 사용자가 관리자인지 확인 */
  function isAdmin() {
    return state.currentUser && state.currentUser.role === 'admin';
  }

  /** 현재 사용자가 댓글 소유자인지 확인 */
  function isCommentOwner(comment) {
    if (!state.currentUser) return false;
    return state.currentUser.id === comment.author_id;
  }

  // ─── 피드 뷰 ───

  Render.feed = function () {
    var container = document.getElementById(state.config.containerId);
    if (!container) return;

    var html = '';

    // 상단 툴바
    html += '<div class="board-toolbar">';
    html += '  <h2 class="board-toolbar-title">' + escapeHTML(getBoardTitle()) + '</h2>';
    html += '  <button class="board-write-btn" data-action="write">글쓰기</button>';
    html += '</div>';

    // 게시글 카드 목록
    html += '<div class="board-feed" id="boardFeed">';
    html += renderPostCards(state.posts);
    html += '</div>';

    // 더 불러오기 버튼
    if (state.hasMore) {
      html += '<div class="board-load-more-wrap">';
      html += '  <button class="board-load-more-btn" data-action="load-more">더 불러오기</button>';
      html += '</div>';
    }

    container.innerHTML = html;

    // 더보기 버튼 표시 여부 체크
    requestAnimationFrame(function () {
      checkExpandButtons();
    });
  };

  /** 게시판 제목 반환 */
  function getBoardTitle() {
    var titles = {
      forum: '자유게시판',
      showcase: '한시 작품 공유',
      notice: '공지사항'
    };
    return titles[state.config.board] || '게시판';
  }

  /** 게시글 카드 HTML 배열 생성 */
  function renderPostCards(posts) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      html += renderPostCard(posts[i]);
    }
    return html;
  }

  /** 단일 게시글 카드 HTML */
  function renderPostCard(post) {
    var postId = post.id;
    var nickname = escapeHTML(getProfileNickname(post));
    var time = timeAgo(post.created_at);
    var liked = state.likedPostIds.has(postId);
    var likeCount = post.like_count || 0;
    var commentCount = post.comment_count || 0;
    var showMore = isPostOwner(post) || isAdmin();

    var html = '';
    html += '<div class="board-feed-card" data-post-id="' + postId + '">';

    // ─ 헤더
    html += '  <div class="board-card-header">';
    html += '    <span class="board-card-author">' + nickname + '</span>';
    html += '    <span class="board-card-time">' + escapeHTML(time) + '</span>';

    if (showMore) {
      html += '    <div class="board-card-more">';
      html += '      <button class="board-card-more-btn" data-action="toggle-more" data-post-id="' + postId + '">···</button>';
      html += '      <div class="board-card-more-menu">';
      html += '        <button data-action="edit" data-post-id="' + postId + '">수정</button>';
      html += '        <button data-action="delete" data-post-id="' + postId + '">삭제</button>';
      html += '      </div>';
      html += '    </div>';
    }

    html += '  </div>';

    // ─ 제목 (고정 뱃지 포함)
    var titlePrefix = post.is_pinned ? '<span class="board-pinned-badge">[고정]</span> ' : '';
    html += '  <div class="board-card-title">' + titlePrefix + escapeHTML(post.title) + '</div>';

    // ─ showcase: 한시 표시 영역
    if (state.config.board === 'showcase' && post.poem_body) {
      html += '  <div class="board-poem-display">';
      if (post.poem_title) {
        html += '    <div class="board-poem-title">' + escapeHTML(post.poem_title) + '</div>';
      }
      html += '    <div class="board-poem-body">' + nl2br(escapeHTML(post.poem_body)) + '</div>';
      if (post.poem_translation) {
        html += '    <div class="board-poem-translation">' + nl2br(escapeHTML(post.poem_translation)) + '</div>';
      }
      if (post.poem_notes) {
        html += '    <div class="board-poem-notes">' + nl2br(escapeHTML(post.poem_notes)) + '</div>';
      }
      html += '  </div>';
    }

    // ─ 본문 (접힘 가능)
    html += '  <div class="board-card-body" id="body-' + postId + '">' + nl2br(escapeHTML(post.body)) + '</div>';
    html += '  <button class="board-card-expand" data-action="expand" data-post-id="' + postId + '">...더보기</button>';

    // ─ 푸터 (좋아요, 댓글)
    html += '  <div class="board-card-footer">';
    html += '    <button class="board-card-like-btn' + (liked ? ' liked' : '') + '" data-action="like" data-post-id="' + postId + '">';
    html += (liked ? '❤️' : '🤍') + ' ' + likeCount;
    html += '    </button>';
    html += '    <button class="board-card-comment-toggle" data-action="toggle-comments" data-post-id="' + postId + '">';
    html += '💬 ' + commentCount;
    html += '    </button>';
    html += '  </div>';

    // ─ 댓글 영역 (숨김)
    html += '  <div class="board-comments" id="comments-' + postId + '"></div>';

    html += '</div>';

    return html;
  }

  /** 본문 높이 체크 → 더보기 버튼 표시/숨김 */
  function checkExpandButtons() {
    var cards = document.querySelectorAll('.board-card-body');
    cards.forEach(function (body) {
      var expandBtn = body.nextElementSibling;
      if (!expandBtn || !expandBtn.classList.contains('board-card-expand')) return;

      // scrollHeight > clientHeight면 내용이 넘침 (CSS에서 max-height 제한)
      if (body.scrollHeight > body.clientHeight + 2) {
        expandBtn.style.display = '';
      } else {
        expandBtn.style.display = 'none';
      }
    });
  }

  // ─── 글쓰기/수정 폼 ───

  Render.writeForm = function (post) {
    var container = document.getElementById(state.config.containerId);
    if (!container) return;

    var isEdit = !!post;
    var heading = isEdit ? '글 수정' : '새 글 작성';

    var html = '';
    html += '<div class="board-write-overlay">';

    // 상단 네비
    html += '  <div class="board-detail-nav">';
    html += '    <button class="board-back-btn" data-action="cancel-write">&larr; 취소</button>';
    html += '  </div>';

    // 폼
    html += '  <form class="board-write-form" id="boardWriteForm">';
    html += '    <h2 class="board-write-heading">' + heading + '</h2>';

    // 제목
    html += '    <div class="board-form-group">';
    html += '      <label for="postTitle">제목</label>';
    html += '      <input type="text" id="postTitle" class="board-form-input" maxlength="200" required';
    html += '        value="' + (isEdit ? escapeHTML(post.title) : '') + '">';
    html += '    </div>';

    // showcase 전용 필드
    if (state.config.board === 'showcase') {
      html += '    <div class="board-form-group">';
      html += '      <label for="poemTitle">시 제목</label>';
      html += '      <input type="text" id="poemTitle" class="board-form-input" maxlength="200"';
      html += '        value="' + (isEdit && post.poem_title ? escapeHTML(post.poem_title) : '') + '">';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemBody">시 원문</label>';
      html += '      <textarea id="poemBody" class="board-form-textarea" rows="6">';
      html += (isEdit && post.poem_body ? escapeHTML(post.poem_body) : '');
      html += '</textarea>';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemTranslation">번역</label>';
      html += '      <textarea id="poemTranslation" class="board-form-textarea" rows="4">';
      html += (isEdit && post.poem_translation ? escapeHTML(post.poem_translation) : '');
      html += '</textarea>';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemNotes">작시 메모</label>';
      html += '      <textarea id="poemNotes" class="board-form-textarea" rows="4">';
      html += (isEdit && post.poem_notes ? escapeHTML(post.poem_notes) : '');
      html += '</textarea>';
      html += '    </div>';
    }

    // 내용
    html += '    <div class="board-form-group">';
    html += '      <label for="postBody">내용</label>';
    html += '      <textarea id="postBody" class="board-form-textarea" rows="10">';
    html += (isEdit ? escapeHTML(post.body) : '');
    html += '</textarea>';
    html += '    </div>';

    // 버튼
    html += '    <div class="board-form-actions">';
    html += '      <button type="submit" class="board-submit-btn">' + (isEdit ? '수정 완료' : '작성 완료') + '</button>';
    html += '      <button type="button" class="board-cancel-btn" data-action="cancel-write">취소</button>';
    html += '    </div>';

    html += '  </form>';
    html += '</div>';

    container.innerHTML = html;

    // 제목 필드에 포커스
    var titleEl = document.getElementById('postTitle');
    if (titleEl) titleEl.focus();
  };

  // ─── 댓글 렌더 ───

  Render.comments = function (postId, comments) {
    var wrapper = document.getElementById('comments-' + postId);
    if (!wrapper) return;

    var html = '';

    // 댓글 헤더
    html += '<div class="board-comments-header">💬 댓글 ' + comments.length + '</div>';

    // 댓글 입력 폼 (로그인 시만)
    if (state.currentUser) {
      html += '<form class="board-comment-form" data-post-id="' + postId + '">';
      html += '  <textarea class="board-comment-input" placeholder="댓글을 작성하세요..." maxlength="2000" rows="2"></textarea>';
      html += '  <button type="submit" class="board-comment-submit">등록</button>';
      html += '</form>';
    } else {
      html += '<div class="board-comment-login-hint">';
      html += '  <a href="/auth/">로그인</a>하면 댓글을 작성할 수 있습니다.';
      html += '</div>';
    }

    // 댓글 목록
    html += '<div class="board-comment-list">';

    // 최상위 댓글 먼저, 그 아래 답글 순서
    var topLevel = [];
    var replies = {}; // parentId → [comment, ...]

    for (var i = 0; i < comments.length; i++) {
      var c = comments[i];
      if (!c.parent_id) {
        topLevel.push(c);
      } else {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(c);
      }
    }

    for (var j = 0; j < topLevel.length; j++) {
      html += renderCommentItem(topLevel[j], postId, false);
      // 이 댓글의 답글
      var childReplies = replies[topLevel[j].id];
      if (childReplies) {
        for (var k = 0; k < childReplies.length; k++) {
          html += renderCommentItem(childReplies[k], postId, true);
        }
      }
    }

    html += '</div>';

    wrapper.innerHTML = html;
  };

  /** 단일 댓글 아이템 HTML */
  function renderCommentItem(comment, postId, isReply) {
    var nickname = escapeHTML(
      (comment.profiles && comment.profiles.nickname) ? comment.profiles.nickname : '익명'
    );
    var time = timeAgo(comment.created_at);
    var canDelete = isCommentOwner(comment) || isAdmin();

    var html = '';
    html += '<div class="board-comment-item' + (isReply ? ' reply' : '') + '" id="comment-' + comment.id + '">';

    // 댓글 헤더
    html += '  <div class="board-comment-header">';
    html += '    <span class="board-comment-author">' + nickname + '</span>';
    html += '    <span class="board-comment-date">' + escapeHTML(time) + '</span>';

    // 답글 버튼 (로그인 시만, 최상위 댓글에만)
    if (state.currentUser && !isReply) {
      html += '    <button class="board-comment-reply-btn" data-action="reply" data-comment-id="' + comment.id + '" data-post-id="' + postId + '" data-author="' + nickname + '">답글</button>';
    }

    // 삭제 버튼
    if (canDelete) {
      html += '    <button class="board-comment-delete-btn" data-action="delete-comment" data-comment-id="' + comment.id + '" data-post-id="' + postId + '">삭제</button>';
    }

    html += '  </div>';

    // 댓글 본문
    html += '  <div class="board-comment-body">' + nl2br(escapeHTML(comment.body)) + '</div>';

    html += '</div>';

    return html;
  }

  // ─── 기존 피드에 카드 추가/제거 ───

  /** 피드 맨 앞에 카드 추가 */
  function prependCard(post) {
    var feed = document.getElementById('boardFeed');
    if (!feed) return;

    var temp = document.createElement('div');
    temp.innerHTML = renderPostCard(post);
    var card = temp.firstElementChild;

    if (feed.firstChild) {
      feed.insertBefore(card, feed.firstChild);
    } else {
      feed.appendChild(card);
    }

    // 더보기 버튼 체크
    requestAnimationFrame(function () {
      var body = card.querySelector('.board-card-body');
      var expandBtn = card.querySelector('.board-card-expand');
      if (body && expandBtn) {
        if (body.scrollHeight > body.clientHeight + 2) {
          expandBtn.style.display = '';
        } else {
          expandBtn.style.display = 'none';
        }
      }
    });
  }

  /** 피드에서 카드 교체 (수정 후) */
  function replaceCard(post) {
    var oldCard = document.querySelector('.board-feed-card[data-post-id="' + post.id + '"]');
    if (!oldCard) return;

    var temp = document.createElement('div');
    temp.innerHTML = renderPostCard(post);
    var newCard = temp.firstElementChild;

    oldCard.parentNode.replaceChild(newCard, oldCard);

    // 더보기 버튼 체크
    requestAnimationFrame(function () {
      var body = newCard.querySelector('.board-card-body');
      var expandBtn = newCard.querySelector('.board-card-expand');
      if (body && expandBtn) {
        if (body.scrollHeight > body.clientHeight + 2) {
          expandBtn.style.display = '';
        } else {
          expandBtn.style.display = 'none';
        }
      }
    });
  }

  /** 피드에서 카드 제거 */
  function removeCard(postId) {
    var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
    if (card) card.remove();
  }

  /** 피드 하단에 카드들 추가 (더 불러오기) */
  function appendCards(posts) {
    var feed = document.getElementById('boardFeed');
    if (!feed) return;

    var html = renderPostCards(posts);
    var temp = document.createElement('div');
    temp.innerHTML = html;

    while (temp.firstElementChild) {
      feed.appendChild(temp.firstElementChild);
    }

    // 더보기 버튼 체크
    requestAnimationFrame(function () {
      checkExpandButtons();
    });
  }

  /** 더 불러오기 버튼 업데이트 */
  function updateLoadMoreButton() {
    var container = document.getElementById(state.config.containerId);
    if (!container) return;

    var wrap = container.querySelector('.board-load-more-wrap');
    if (state.hasMore) {
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'board-load-more-wrap';
        wrap.innerHTML = '<button class="board-load-more-btn" data-action="load-more">더 불러오기</button>';
        container.appendChild(wrap);
      }
    } else {
      if (wrap) wrap.remove();
    }
  }


  // ─────────────────────────────────────────────
  //  이벤트 핸들링 (Event Delegation)
  // ─────────────────────────────────────────────

  /** 메인 클릭 핸들러 — 컨테이너에 한 번만 바인딩 */
  function handleClick(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    var postId = target.getAttribute('data-post-id');
    var commentId = target.getAttribute('data-comment-id');

    switch (action) {

      case 'write':
        handleWrite();
        break;

      case 'cancel-write':
        handleCancelWrite();
        break;

      case 'expand':
        handleExpand(postId);
        break;

      case 'toggle-more':
        handleToggleMore(target);
        break;

      case 'edit':
        handleEdit(postId);
        break;

      case 'delete':
        handleDelete(postId);
        break;

      case 'like':
        handleLike(postId, target);
        break;

      case 'toggle-comments':
        handleToggleComments(postId);
        break;

      case 'reply':
        handleReply(target);
        break;

      case 'delete-comment':
        handleDeleteComment(commentId, postId);
        break;

      case 'load-more':
        handleLoadMore();
        break;
    }
  }

  /** 글쓰기 버튼 */
  function handleWrite() {
    // 권한 체크
    if (state.config.canWrite && !state.config.canWrite(state.currentUser)) {
      // 로그인 안 된 경우 → 로그인 페이지로
      if (!state.currentUser) {
        if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
          window.location.href = '/auth/?redirect=' + encodeURIComponent(window.location.pathname);
        }
      } else {
        alert('글 작성 권한이 없습니다.');
      }
      return;
    }

    state.viewMode = 'write';
    state.editingPostId = null;
    Render.writeForm(null);
  }

  /** 글쓰기/수정 취소 */
  function handleCancelWrite() {
    state.viewMode = 'feed';
    state.editingPostId = null;
    Render.feed();
  }

  /** 더보기(본문 펼치기) */
  function handleExpand(postId) {
    var body = document.getElementById('body-' + postId);
    if (!body) return;

    body.classList.add('expanded');
    // 더보기 버튼 숨기기
    var card = body.closest('.board-feed-card');
    if (card) {
      var expandBtn = card.querySelector('.board-card-expand');
      if (expandBtn) expandBtn.style.display = 'none';
    }
  }

  /** ··· 드롭다운 토글 */
  function handleToggleMore(target) {
    var moreWrap = target.closest('.board-card-more');
    if (!moreWrap) return;

    var menu = moreWrap.querySelector('.board-card-more-menu');
    if (!menu) return;

    // 다른 열린 메뉴 닫기
    var allMenus = document.querySelectorAll('.board-card-more-menu.show');
    allMenus.forEach(function (m) {
      if (m !== menu) m.classList.remove('show');
    });

    menu.classList.toggle('show');
  }

  /** 수정 */
  async function handleEdit(postId) {
    // 게시글 데이터 찾기
    var post = findPostById(postId);
    if (!post) return;

    state.viewMode = 'edit';
    state.editingPostId = postId;
    Render.writeForm(post);
  }

  /** 삭제 */
  async function handleDelete(postId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    var success = await API.deletePost(postId);
    if (success) {
      // state.posts에서도 제거
      state.posts = state.posts.filter(function (p) { return p.id !== parseInt(postId) && p.id !== postId; });
      removeCard(postId);
    } else {
      alert('삭제에 실패했습니다.');
    }
  }

  /** 좋아요 (낙관적 UI) */
  async function handleLike(postId, target) {
    if (!state.currentUser) {
      if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        window.location.href = '/auth/?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }

    var btn = target.closest('.board-card-like-btn');
    if (!btn) return;

    var wasLiked = state.likedPostIds.has(postId);

    // 낙관적 UI 업데이트
    if (wasLiked) {
      state.likedPostIds.delete(postId);
      btn.classList.remove('liked');
    } else {
      state.likedPostIds.add(postId);
      btn.classList.add('liked');
    }

    // 카운트 업데이트 (낙관적)
    var currentCount = parseInt(btn.textContent.replace(/[^\d]/g, '')) || 0;
    var newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    btn.innerHTML = (wasLiked ? '🤍' : '❤️') + ' ' + newCount;

    // API 호출
    var result = await API.toggleLike(postId);

    // 서버 결과로 보정
    if (result !== null) {
      btn.innerHTML = (state.likedPostIds.has(postId) ? '❤️' : '🤍') + ' ' + result;
      // state.posts에서도 업데이트
      var post = findPostById(postId);
      if (post) post.like_count = result;
    }
  }

  /** 댓글 토글 */
  async function handleToggleComments(postId) {
    var wrapper = document.getElementById('comments-' + postId);
    if (!wrapper) return;

    var isOpen = wrapper.classList.contains('open');

    if (isOpen) {
      // 닫기
      wrapper.classList.remove('open');
      return;
    }

    // 열기 — 댓글 로드 (매번 새로 로드)
    wrapper.innerHTML = '<div class="board-comments-loading">댓글 불러오는 중...</div>';
    wrapper.classList.add('open');

    // 조회수 증가
    API.incrementView(postId);

    var comments = await API.fetchComments(postId);
    Render.comments(postId, comments);
  }

  /** 답글 인라인 폼 */
  function handleReply(target) {
    if (!state.currentUser) return;

    var commentId = target.getAttribute('data-comment-id');
    var postId = target.getAttribute('data-post-id');
    var authorName = target.getAttribute('data-author') || '';

    // 기존 열린 답글 폼 닫기
    var existingForms = document.querySelectorAll('.board-reply-form');
    existingForms.forEach(function (f) { f.remove(); });

    // 답글 폼 생성
    var commentEl = document.getElementById('comment-' + commentId);
    if (!commentEl) return;

    var replyForm = document.createElement('form');
    replyForm.className = 'board-reply-form';
    replyForm.setAttribute('data-post-id', postId);
    replyForm.setAttribute('data-parent-id', commentId);

    replyForm.innerHTML =
      '<textarea class="board-reply-input" placeholder="답글을 작성하세요..." maxlength="2000" rows="2">@' + escapeHTML(authorName) + ' </textarea>' +
      '<div class="board-reply-actions">' +
      '  <button type="submit" class="board-reply-submit">등록</button>' +
      '  <button type="button" class="board-reply-cancel" data-action="cancel-reply">취소</button>' +
      '</div>';

    // 댓글 바로 아래에 삽입
    commentEl.after(replyForm);

    // 텍스트영역에 포커스, 커서를 맨 끝으로
    var textarea = replyForm.querySelector('.board-reply-input');
    if (textarea) {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }
  }

  /** 댓글 삭제 */
  async function handleDeleteComment(commentId, postId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    var success = await API.deleteComment(commentId);
    if (success) {
      // 댓글 다시 로드
      var comments = await API.fetchComments(postId);
      Render.comments(postId, comments);

      // 게시글의 comment_count 업데이트
      var post = findPostById(postId);
      if (post) {
        post.comment_count = comments.length;
        // 댓글 수 버튼 업데이트
        var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
        if (card) {
          var commentToggle = card.querySelector('.board-card-comment-toggle');
          if (commentToggle) {
            commentToggle.innerHTML = '💬 ' + comments.length;
          }
        }
      }
    } else {
      alert('삭제에 실패했습니다.');
    }
  }

  /** 더 불러오기 */
  async function handleLoadMore() {
    var btn = document.querySelector('.board-load-more-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '불러오는 중...';
    }

    state.offset += state.config.pageSize;

    var result = await API.fetchPosts(state.offset, state.config.pageSize);
    var newPosts = result.data;

    if (newPosts.length > 0) {
      // 좋아요 체크
      var newPostIds = newPosts.map(function (p) { return p.id; });
      var newLiked = await API.checkLikedPosts(newPostIds);
      newLiked.forEach(function (id) {
        state.likedPostIds.add(id);
      });

      state.posts = state.posts.concat(newPosts);
      appendCards(newPosts);
    }

    // 더 불러올 데이터 있는지 확인
    state.hasMore = state.posts.length < result.count;
    updateLoadMoreButton();
  }

  /** state.posts에서 ID로 검색 */
  function findPostById(postId) {
    // postId는 문자열일 수도 숫자일 수도 있으므로 둘 다 비교
    for (var i = 0; i < state.posts.length; i++) {
      if (String(state.posts[i].id) === String(postId)) {
        return state.posts[i];
      }
    }
    return null;
  }


  // ─────────────────────────────────────────────
  //  폼 제출 핸들링
  // ─────────────────────────────────────────────

  function handleFormSubmits(e) {
    var form = e.target;

    // 글쓰기/수정 폼
    if (form.id === 'boardWriteForm') {
      e.preventDefault();
      submitWriteForm();
      return;
    }

    // 댓글 폼
    if (form.classList.contains('board-comment-form')) {
      e.preventDefault();
      submitCommentForm(form);
      return;
    }

    // 답글 폼
    if (form.classList.contains('board-reply-form')) {
      e.preventDefault();
      submitReplyForm(form);
      return;
    }
  }

  /** 글쓰기/수정 제출 */
  async function submitWriteForm() {
    var titleEl = document.getElementById('postTitle');
    var bodyEl = document.getElementById('postBody');
    if (!titleEl) return;

    var title = titleEl.value.trim();
    if (!title) {
      alert('제목을 입력하세요.');
      titleEl.focus();
      return;
    }

    var postData = {
      title: title,
      body: bodyEl ? bodyEl.value.trim() : ''
    };

    // showcase 전용 필드
    if (state.config.board === 'showcase') {
      var poemTitleEl = document.getElementById('poemTitle');
      var poemBodyEl = document.getElementById('poemBody');
      var poemTranslationEl = document.getElementById('poemTranslation');
      var poemNotesEl = document.getElementById('poemNotes');

      if (poemTitleEl) postData.poem_title = poemTitleEl.value.trim();
      if (poemBodyEl) postData.poem_body = poemBodyEl.value.trim();
      if (poemTranslationEl) postData.poem_translation = poemTranslationEl.value.trim();
      if (poemNotesEl) postData.poem_notes = poemNotesEl.value.trim();
    }

    // 제출 버튼 비활성화
    var submitBtn = document.querySelector('.board-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '저장 중...';
    }

    var result;

    if (state.viewMode === 'edit' && state.editingPostId) {
      // 수정
      result = await API.updatePost(state.editingPostId, postData);
      if (result) {
        // state.posts 업데이트
        for (var i = 0; i < state.posts.length; i++) {
          if (String(state.posts[i].id) === String(state.editingPostId)) {
            state.posts[i] = result;
            break;
          }
        }
        state.viewMode = 'feed';
        state.editingPostId = null;
        Render.feed();
      } else {
        alert('수정에 실패했습니다.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '수정 완료';
        }
      }
    } else {
      // 새 글 작성
      result = await API.createPost(postData);
      if (result) {
        state.posts.unshift(result);
        state.viewMode = 'feed';
        Render.feed();
      } else {
        alert('작성에 실패했습니다.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '작성 완료';
        }
      }
    }
  }

  /** 댓글 제출 */
  async function submitCommentForm(form) {
    var postId = form.getAttribute('data-post-id');
    var textarea = form.querySelector('.board-comment-input');
    if (!textarea) return;

    var body = textarea.value.trim();
    if (!body) {
      textarea.focus();
      return;
    }

    var submitBtn = form.querySelector('.board-comment-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '등록 중...';
    }

    var commentId = await API.addComment(postId, body, null);

    if (commentId) {
      // 댓글 목록 새로 로드
      var comments = await API.fetchComments(postId);
      Render.comments(postId, comments);

      // 게시글의 comment_count 업데이트
      var post = findPostById(postId);
      if (post) {
        post.comment_count = comments.length;
        // 댓글 수 버튼 업데이트
        var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
        if (card) {
          var commentToggle = card.querySelector('.board-card-comment-toggle');
          if (commentToggle) {
            commentToggle.innerHTML = '💬 ' + comments.length;
          }
        }
      }
    } else {
      alert('댓글 등록에 실패했습니다.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '등록';
      }
    }
  }

  /** 답글 제출 */
  async function submitReplyForm(form) {
    var postId = form.getAttribute('data-post-id');
    var parentId = form.getAttribute('data-parent-id');
    var textarea = form.querySelector('.board-reply-input');
    if (!textarea) return;

    var body = textarea.value.trim();
    if (!body) {
      textarea.focus();
      return;
    }

    var submitBtn = form.querySelector('.board-reply-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '등록 중...';
    }

    var commentId = await API.addComment(postId, body, parentId);

    if (commentId) {
      // 답글 폼 제거
      form.remove();

      // 댓글 목록 새로 로드
      var comments = await API.fetchComments(postId);
      Render.comments(postId, comments);

      // 게시글의 comment_count 업데이트
      var post = findPostById(postId);
      if (post) {
        post.comment_count = comments.length;
        var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
        if (card) {
          var commentToggle = card.querySelector('.board-card-comment-toggle');
          if (commentToggle) {
            commentToggle.innerHTML = '💬 ' + comments.length;
          }
        }
      }
    } else {
      alert('답글 등록에 실패했습니다.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '등록';
      }
    }
  }


  // ─────────────────────────────────────────────
  //  외부 클릭 핸들러 (··· 메뉴 닫기)
  // ─────────────────────────────────────────────

  function handleDocumentClick(e) {
    // ··· 더보기 메뉴 — 바깥 클릭 시 닫기
    if (!e.target.closest('.board-card-more')) {
      var openMenus = document.querySelectorAll('.board-card-more-menu.show');
      openMenus.forEach(function (m) { m.classList.remove('show'); });
    }

    // 답글 취소 버튼
    if (e.target.getAttribute('data-action') === 'cancel-reply') {
      var replyForm = e.target.closest('.board-reply-form');
      if (replyForm) replyForm.remove();
    }
  }


  // ─────────────────────────────────────────────
  //  초기화 (Board.init)
  // ─────────────────────────────────────────────

  async function init(options) {
    // 기본 설정
    state.config = {
      board: options.board || 'forum',
      containerId: options.containerId || 'boardContainer',
      pageSize: options.pageSize || 20,
      canWrite: options.canWrite || function (user) { return !!user; }
    };

    // 현재 사용자
    if (window.AuthState) {
      var user = window.AuthState.getUser();
      if (user) {
        state.currentUser = {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role || null
        };
      }
    }

    // 컨테이너 확인
    var container = document.getElementById(state.config.containerId);
    if (!container) {
      console.error('[board.js] 컨테이너를 찾을 수 없습니다: #' + state.config.containerId);
      return;
    }

    // 로딩 표시
    container.innerHTML = '<div class="board-loading">게시글을 불러오는 중...</div>';

    // 이벤트 위임 바인딩
    container.addEventListener('click', handleClick);
    container.addEventListener('submit', handleFormSubmits);
    document.addEventListener('click', handleDocumentClick);

    // 첫 페이지 로드
    try {
      var result = await API.fetchPosts(0, state.config.pageSize);
      state.posts = result.data;
      state.offset = 0;
      state.hasMore = state.posts.length < result.count;

      // 좋아요 체크
      if (state.currentUser && state.posts.length > 0) {
        var postIds = state.posts.map(function (p) { return p.id; });
        state.likedPostIds = await API.checkLikedPosts(postIds);
      }

      // 피드 렌더
      Render.feed();
    } catch (err) {
      console.error('[board.js] 초기화 에러:', err);
      container.innerHTML = '<div class="board-error">게시판을 불러오지 못했습니다. 새로고침을 시도해 주세요.</div>';
    }
  }


  // ─────────────────────────────────────────────
  //  전역 API (window.Board)
  // ─────────────────────────────────────────────

  window.Board = {
    init: init,

    // 외부에서 상태 접근 (디버깅/테스트용)
    getState: function () { return state; },

    // 유틸리티 노출
    escapeHTML: escapeHTML,
    timeAgo: timeAgo,
    nl2br: nl2br
  };

})();
