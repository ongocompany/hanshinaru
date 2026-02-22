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

  /**
   * data URL → Blob URL 변환 (HTML 문자열에 긴 data URL을 넣으면 렌더링 실패)
   * Blob URL은 짧은 형태 (blob:https://...) 로 변환되어 안정적으로 렌더링됨
   */
  var blobUrlCache = {};
  function toBlobUrl(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    // 캐시에서 찾기 (data URL 앞부분 해시)
    var cacheKey = dataUrl.substring(0, 60) + '_' + dataUrl.length;
    if (blobUrlCache[cacheKey]) return blobUrlCache[cacheKey];
    try {
      var parts = dataUrl.split(',');
      var mimeMatch = parts[0].match(/:(.*?);/);
      var mime = mimeMatch ? mimeMatch[1] : 'image/png';
      var binary = atob(parts[1]);
      var array = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      var blob = new Blob([array], { type: mime });
      var blobUrl = URL.createObjectURL(blob);
      blobUrlCache[cacheKey] = blobUrl;
      return blobUrl;
    } catch (e) {
      console.warn('[board.js] toBlobUrl 변환 실패:', e);
      return dataUrl;
    }
  }

  /** bg_image_url을 렌더링용 URL로 변환 (data URL이면 Blob URL로) */
  function getDisplayBgUrl(url) {
    if (!url) return url;
    if (url.startsWith('data:')) return toBlobUrl(url);
    return url;
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

    // 24시간 이상: YYYY.MM.DD HH:MM
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + '.' + m + '.' + day + ' ' + h + ':' + min;
  }

  /** Supabase 클라이언트 반환 (없으면 에러) */
  function getSB() {
    if (!window.sb) {
      throw new Error('[board.js] window.sb가 없습니다. shared/supabase.js를 먼저 로드하세요.');
    }
    return window.sb;
  }

  /** HTML 새니타이징 (XSS 방지) — script/iframe/style/onX 속성 제거 */
  function sanitizeHTML(html) {
    if (!html) return '';
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var dangerous = doc.querySelectorAll('script, style, iframe, object, embed, form');
    dangerous.forEach(function (el) { el.remove(); });
    var allEls = doc.body.querySelectorAll('*');
    allEls.forEach(function (el) {
      var attrs = Array.from(el.attributes);
      attrs.forEach(function (attr) {
        if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
      });
    });
    return doc.body.innerHTML;
  }

  /** 본문 렌더 — Quill HTML이면 새니타이징, 일반 텍스트면 escapeHTML+nl2br */
  function renderBodyContent(body) {
    if (!body) return '';
    if (body.charAt(0) === '<') {
      return sanitizeHTML(body);
    }
    return nl2br(escapeHTML(body));
  }

  /** SVG 아이콘 (Feather Icons 기반) */
  var ICONS = {
    heartOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFilled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>'
  };


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
    displayMode: 'card',    // 'card' | 'list'
    editingPostId: null,    // 수정 중인 게시글 ID
    likedPostIds: new Set() // 사용자가 좋아요 누른 게시글 ID 집합
  };

  /** Quill 에디터 인스턴스 */
  var quillInstance = null;

  /** 배경 템플릿 데이터 (캐시) */
  var bgTemplates = null;

  /** 첨부 파일 목록 */
  var attachedFiles = [];


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
      .select('*, profiles:author_id(nickname, avatar_url), likes(count), comments(count)', { count: 'exact' })
      .eq('board', state.config.board)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    var result = await query;

    if (result.error) {
      // 조인 실패 시 관계 없이 재시도
      console.warn('[board.js] 조인 쿼리 실패, 기본 쿼리로 재시도:', result.error.message);
      var fallback = await sb
        .from('posts')
        .select('*, profiles:author_id(nickname, avatar_url)', { count: 'exact' })
        .eq('board', state.config.board)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (fallback.error) {
        console.error('[board.js] fetchPosts 에러:', fallback.error);
        return { data: [], count: 0 };
      }
      return { data: fallback.data || [], count: fallback.count || 0 };
    }

    // likes(count), comments(count) → like_count, comment_count 매핑
    var posts = (result.data || []).map(function (post) {
      if (post.likes && post.likes.length > 0) {
        post.like_count = post.likes[0].count;
      }
      if (post.comments && post.comments.length > 0) {
        post.comment_count = post.comments[0].count;
      }
      if (!post.like_count) post.like_count = 0;
      if (!post.comment_count) post.comment_count = 0;
      return post;
    });

    return { data: posts, count: result.count || 0 };
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
    var result = await sb.rpc('toggle_like', { post_id_input: postId });

    if (result.error) {
      console.error('[board.js] toggleLike 에러:', result.error);
      return null;
    }

    return result.data;
  };

  /** 태그/링크 컬럼 존재 여부 (첫 실패 시 false로 전환) */
  var hasTagsColumn = true;

  /** payload에 태그/링크 필드 추가 (컬럼 존재 시에만) */
  function addExtraFields(payload, postData) {
    if (!hasTagsColumn) return;
    if (postData.tags && postData.tags.length > 0) payload.tags = postData.tags;
    if (postData.links && postData.links.length > 0) payload.links = postData.links;
  }

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
    if (postData.font_style) payload.font_style = postData.font_style;
    if (postData.bg_type) payload.bg_type = postData.bg_type;
    if (postData.bg_template_id) payload.bg_template_id = postData.bg_template_id;
    if (postData.bg_image_url) payload.bg_image_url = postData.bg_image_url;
    if (postData.text_position) payload.text_position = postData.text_position;

    // 태그, 링크 (컬럼 존재 시에만)
    addExtraFields(payload, postData);

    var result = await sb
      .from('posts')
      .insert(payload)
      .select('*, profiles:author_id(nickname, avatar_url)')
      .single();

    // 컬럼 미존재 에러 → 해당 필드 빼고 재시도
    if (result.error) {
      console.warn('[board.js] createPost 첫 시도 실패:', result.error.message || result.error.code);

      // 1차 재시도: tags/links + text_position 제거
      hasTagsColumn = false;
      delete payload.tags;
      delete payload.links;
      delete payload.text_position;
      result = await sb
        .from('posts')
        .insert(payload)
        .select('*, profiles:author_id(nickname, avatar_url)')
        .single();
    }

    if (result.error) {
      console.error('[board.js] createPost 최종 에러:', result.error);
      return null;
    }

    console.log('[board.js] createPost 성공 — bg_type:', result.data.bg_type, ', bg_image_url:', result.data.bg_image_url ? result.data.bg_image_url.substring(0, 60) + '...' : 'null');
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
      payload.font_style = postData.font_style || null;
      payload.bg_type = postData.bg_type || null;
      payload.bg_template_id = postData.bg_template_id || null;
      payload.bg_image_url = postData.bg_image_url || null;
      payload.text_position = postData.text_position || null;
    }

    // 태그, 링크 (컬럼 존재 시에만)
    if (hasTagsColumn) {
      payload.tags = (postData.tags && postData.tags.length > 0) ? postData.tags : [];
      payload.links = (postData.links && postData.links.length > 0) ? postData.links : [];
    }

    var result = await sb
      .from('posts')
      .update(payload)
      .eq('id', postId)
      .select('*, profiles:author_id(nickname, avatar_url)')
      .single();

    // 컬럼 미존재 에러 → 해당 필드 빼고 재시도
    if (result.error) {
      console.warn('[board.js] updatePost 첫 시도 실패:', result.error.message || result.error.code);
      hasTagsColumn = false;
      delete payload.tags;
      delete payload.links;
      delete payload.text_position;
      result = await sb
        .from('posts')
        .update(payload)
        .eq('id', postId)
        .select('*, profiles:author_id(nickname, avatar_url)')
        .single();
    }

    if (result.error) {
      console.error('[board.js] updatePost 최종 에러:', result.error);
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

  /** 댓글 작성 (RPC → 직접 insert 폴백) */
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
      console.warn('[board.js] add_comment RPC 실패, 직접 insert 시도:', result.error.message);

      // 폴백: 직접 comments 테이블에 insert
      if (!state.currentUser) return null;
      var payload = {
        post_id: postId,
        author_id: state.currentUser.id,
        body: body
      };
      if (parentId) payload.parent_id = parentId;

      var insertResult = await sb.from('comments').insert(payload).select().single();
      if (insertResult.error) {
        console.error('[board.js] comments insert 에러:', insertResult.error);
        return null;
      }

      return insertResult.data.id;
    }

    return result.data; // new comment id
  };

  /** 댓글 삭제 (RPC → 직접 delete 폴백) */
  API.deleteComment = async function (commentId) {
    var sb = getSB();
    var result = await sb.rpc('delete_comment', { p_comment_id: commentId });

    if (result.error) {
      console.warn('[board.js] delete_comment RPC 실패, 직접 delete 시도:', result.error.message);

      // 폴백: 직접 comments 테이블에서 삭제
      var deleteResult = await sb.from('comments').delete().eq('id', commentId);
      if (deleteResult.error) {
        console.error('[board.js] comments delete 에러:', deleteResult.error);
        return false;
      }

      return true;
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

  /** 프로필에서 닉네임 추출 (빈 문자열도 fallback) */
  function getProfileNickname(post) {
    // 1) profiles JOIN 결과에서 닉네임
    if (post.profiles && post.profiles.nickname && post.profiles.nickname.trim()) {
      return post.profiles.nickname;
    }
    // 2) 현재 사용자가 작성자면 AuthState에서 email 기반 닉네임
    if (state.currentUser && state.currentUser.id === post.author_id) {
      if (state.currentUser.nickname && state.currentUser.nickname.trim()) {
        return state.currentUser.nickname;
      }
      if (state.currentUser.email) {
        return state.currentUser.email.split('@')[0];
      }
    }
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

  Render.feed = async function () {
    var container = document.getElementById(state.config.containerId);
    if (!container) return;

    // showcase: 배경 템플릿 데이터 미리 로드
    if (state.config.board === 'showcase' && !bgTemplates) {
      try {
        var res = await fetch('/public/assets/showcase-bg/templates.json?_ts=' + Date.now());
        var data = await res.json();
        bgTemplates = data.templates || [];
      } catch (e) {
        console.warn('[board.js] 배경 템플릿 로드 실패 (카드 뷰):', e);
      }
    }

    var html = '';

    var isShowcase = state.config.board === 'showcase';

    // 상단 툴바
    html += '<div class="board-toolbar">';
    html += '  <h2 class="board-toolbar-title">' + escapeHTML(getBoardTitle()) + '</h2>';
    html += '  <div class="board-toolbar-right">';
    if (!isShowcase) {
      html += '    <div class="board-view-toggle">';
      html += '      <button data-action="view-mode" data-mode="card" class="' + (state.displayMode === 'card' ? 'active' : '') + '" title="카드 보기">&#9638;</button>';
      html += '      <button data-action="view-mode" data-mode="list" class="' + (state.displayMode === 'list' ? 'active' : '') + '" title="리스트 보기">&#9776;</button>';
      html += '    </div>';
    }
    html += '    <button class="board-write-btn" data-action="write">글쓰기</button>';
    html += '  </div>';
    html += '</div>';

    // 게시글 목록
    if (isShowcase) {
      // 갤러리 2컬럼 그리드
      html += '<div class="board-feed board-gallery" id="boardFeed">';
      html += renderShowcaseCards(state.posts);
      html += '</div>';
    } else {
      html += '<div class="board-feed" id="boardFeed">';
      if (state.displayMode === 'list') {
        html += renderListItems(state.posts);
      } else {
        html += renderPostCards(state.posts);
      }
      html += '</div>';
    }

    // 무한스크롤 감지 sentinel
    if (state.hasMore) {
      html += '<div class="board-scroll-sentinel" id="boardScrollSentinel">';
      html += '  <div class="board-scroll-spinner"></div>';
      html += '</div>';
    }

    container.innerHTML = html;

    // 무한스크롤 Observer 연결
    setupScrollObserver();

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

  /** showcase 갤러리 카드 목록 */
  function renderShowcaseCards(posts) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      html += renderShowcaseCard(posts[i]);
    }
    return html;
  }

  /** showcase 갤러리 카드 — 배경 + 시 제목 + 작성자 */
  function renderShowcaseCard(post) {
    var postId = post.id;
    var nickname = escapeHTML(getProfileNickname(post));
    var likeCount = post.like_count || 0;
    var poemFontClass = post.font_style ? ('poem-font-' + post.font_style) : '';

    // 배경 CSS
    var bgCss = '';
    console.log('[renderShowcaseCard] post #' + postId + ' → bg_type:', post.bg_type, ', bg_image_url:', post.bg_image_url ? post.bg_image_url.substring(0, 60) : 'null');
    if (post.bg_type === 'template' && post.bg_template_id && bgTemplates) {
      var tpl = bgTemplates.find(function (t) { return t.id === post.bg_template_id; });
      if (tpl && tpl.css) bgCss = tpl.css;
    } else if (post.bg_type === 'ai' && post.bg_image_url) {
      var displayUrl = getDisplayBgUrl(post.bg_image_url);
      bgCss = "background-image: url('" + escapeHTML(displayUrl) + "'); background-size: cover; background-position: center;";
      console.log('[renderShowcaseCard] AI 배경 적용됨:', bgCss.substring(0, 80));
    }
    if (!bgCss) {
      bgCss = 'background: linear-gradient(135deg, #F5E6C8 0%, #EDD9A8 50%, #F0DEB8 100%);';
    }

    // 텍스트 스타일 파싱 (배경색, 글자색)
    var tp = null;
    if (post.text_position) {
      try { tp = typeof post.text_position === 'string' ? JSON.parse(post.text_position) : post.text_position; } catch (e) {}
    }
    var contentStyle = '';
    if (tp) {
      if (tp.fontColor) contentStyle += 'color:' + tp.fontColor + ';';
      if (tp.boxBg) {
        var opacity = (tp.boxOpacity !== undefined && tp.boxOpacity !== null) ? tp.boxOpacity : 0.7;
        if (tp.boxBg === 'white') contentStyle += 'background:rgba(255,255,255,' + opacity + ');';
        else if (tp.boxBg === 'black') contentStyle += 'background:rgba(0,0,0,' + opacity + ');';
        else contentStyle += 'background:' + tp.boxBg + ';';
        contentStyle += 'padding:8px 12px;border-radius:4px;';
      }
    }

    // 시 본문 미리보기 (첫 2줄)
    var poemPreview = '';
    if (post.poem_body) {
      var lines = post.poem_body.split('\n').filter(function (l) { return l.trim(); });
      poemPreview = lines.slice(0, 2).join('\n');
    }

    var html = '';
    html += '<div class="showcase-card" data-post-id="' + postId + '" data-action="open-poem">';
    html += '  <div class="showcase-card-bg" style="' + bgCss + '">';
    html += '    <div class="showcase-card-overlay"></div>';
    html += '    <div class="showcase-card-content ' + poemFontClass + '"' + (contentStyle ? ' style="' + contentStyle + '"' : '') + '>';
    if (post.poem_title) {
      html += '      <div class="showcase-card-poem-title">' + escapeHTML(post.poem_title) + '</div>';
    }
    if (poemPreview) {
      html += '      <div class="showcase-card-poem-preview">' + nl2br(escapeHTML(poemPreview)) + '</div>';
    }
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="showcase-card-info">';
    html += '    <span class="showcase-card-author">' + nickname + '</span>';
    if (likeCount > 0) {
      html += '    <span class="showcase-card-likes">' + ICONS.heartFilled + ' ' + likeCount + '</span>';
    }
    html += '  </div>';
    html += '</div>';

    return html;
  }

  /** 리스트 아이템 HTML 배열 생성 */
  function renderListItems(posts) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      html += renderListItem(posts[i]);
    }
    return html;
  }

  /** 단일 리스트 아이템 HTML */
  function renderListItem(post) {
    var postId = post.id;
    var nickname = escapeHTML(getProfileNickname(post));
    var time = timeAgo(post.created_at);
    var likeCount = post.like_count || 0;
    var commentCount = post.comment_count || 0;
    var titlePrefix = post.is_pinned ? '<span class="board-pinned-badge">[고정]</span> ' : '';

    var html = '';
    html += '<div class="board-list-item" data-post-id="' + postId + '">';
    html += '  <span class="board-list-title">' + titlePrefix + escapeHTML(post.title) + '</span>';
    html += '  <span class="board-list-author">' + nickname + '</span>';
    html += '  <span class="board-list-date">' + escapeHTML(time) + '</span>';
    html += '  <span class="board-list-stats">';
    html += '    <span>' + ICONS.heartOutline + ' ' + likeCount + '</span>';
    html += '    <span>' + ICONS.comment + ' ' + commentCount + '</span>';
    html += '  </span>';
    html += '</div>';

    return html;
  }

  /** 단일 게시글 카드 HTML */
  function renderPostCard(post) {
    var postId = post.id;
    var nickname = escapeHTML(getProfileNickname(post));
    var avatarChar = nickname.charAt(0).toUpperCase();
    var avatarUrl = post.profiles && post.profiles.avatar_url ? post.profiles.avatar_url : '';
    var time = timeAgo(post.created_at);
    var liked = state.likedPostIds.has(postId);
    var likeCount = post.like_count || 0;
    var commentCount = post.comment_count || 0;
    var viewCount = post.view_count || 0;
    var showMore = isPostOwner(post) || isAdmin();

    var html = '';
    html += '<div class="board-feed-card" data-post-id="' + postId + '">';

    // ─ 헤더 (아바타 + 닉네임 + 시간 + 더보기)
    html += '  <div class="board-card-header">';
    if (avatarUrl) {
      html += '    <span class="board-card-avatar level-1"><img src="' + escapeHTML(avatarUrl) + '" alt=""></span>';
    } else {
      html += '    <span class="board-card-avatar level-1">' + escapeHTML(avatarChar) + '</span>';
    }
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

    // ─ 제목 (고정 뱃지 + 조회수)
    var titlePrefix = post.is_pinned ? '<span class="board-pinned-badge">[고정]</span> ' : '';
    html += '  <div class="board-card-title"><span class="board-card-views">조회 ' + viewCount + '</span>' + titlePrefix + escapeHTML(post.title) + '</div>';

    // ─ showcase: 한시 표시 영역
    if (state.config.board === 'showcase' && post.poem_body) {
      var poemFontClass = post.font_style ? ('poem-font-' + post.font_style) : '';
      var bgStyle = '';
      if (post.bg_type === 'template' && post.bg_template_id && bgTemplates) {
        var tpl = bgTemplates.find(function (t) { return t.id === post.bg_template_id; });
        if (tpl && tpl.css) bgStyle = ' style="' + escapeHTML(tpl.css) + '"';
      } else if (post.bg_type === 'ai' && post.bg_image_url) {
        var cardDisplayUrl = getDisplayBgUrl(post.bg_image_url);
        bgStyle = ' style="background-image: url(\'' + escapeHTML(cardDisplayUrl) + '\'); background-size: cover; background-position: center;"';
      }
      var hasBg = post.bg_type ? ' has-bg' : '';
      html += '  <div class="board-poem-display' + hasBg + ' ' + poemFontClass + '"' + bgStyle + '>';
      if (post.poem_title) {
        html += '    <div class="board-poem-title">' + escapeHTML(post.poem_title) + '</div>';
      }
      html += '    <div class="board-poem-body">' + nl2br(escapeHTML(post.poem_body)) + '</div>';
      if (post.poem_translation) {
        html += '    <div class="board-poem-translation">' + nl2br(escapeHTML(post.poem_translation)) + '</div>';
      }
      if (post.poem_notes) {
        // Quill HTML이면 그대로, 일반 텍스트면 escapeHTML 처리
        var notesContent = post.poem_notes.charAt(0) === '<'
          ? post.poem_notes
          : nl2br(escapeHTML(post.poem_notes));
        html += '    <div class="board-poem-notes">' + notesContent + '</div>';
      }
      html += '  </div>';
    }

    // ─ 본문 (접힘 가능)
    html += '  <div class="board-card-body" id="body-' + postId + '">' + renderBodyContent(post.body) + '</div>';

    // ─ 펼치기/접기 버튼
    html += '  <button class="board-card-expand" data-action="expand" data-post-id="' + postId + '">...</button>';
    html += '  <button class="board-card-collapse" data-action="collapse" data-post-id="' + postId + '">&#9650;</button>';

    // ─ 태그
    if (post.tags && post.tags.length > 0) {
      html += '  <div class="board-card-tags">';
      post.tags.forEach(function (tag) {
        html += '<span class="board-tag">#' + escapeHTML(tag) + '</span>';
      });
      html += '  </div>';
    }

    // ─ 링크
    if (post.links && post.links.length > 0) {
      html += '  <div class="board-card-links">';
      post.links.forEach(function (link) {
        if (link) html += '<a href="' + escapeHTML(link) + '" target="_blank" rel="noopener">&#x1F517; ' + escapeHTML(link) + '</a>';
      });
      html += '  </div>';
    }

    // ─ 푸터 (좋아요, 댓글, 저장, 공유 — SVG 아이콘)
    html += '  <div class="board-card-footer">';
    html += '    <button class="board-card-action-btn' + (liked ? ' liked' : '') + '" data-action="like" data-post-id="' + postId + '">';
    html += (liked ? ICONS.heartFilled : ICONS.heartOutline) + ' <span>' + likeCount + '</span>';
    html += '    </button>';
    html += '    <button class="board-card-action-btn" data-action="toggle-comments" data-post-id="' + postId + '">';
    html += ICONS.comment + ' <span>' + commentCount + '</span>';
    html += '    </button>';
    html += '    <button class="board-card-action-btn" data-action="save-post" data-post-id="' + postId + '">';
    html += ICONS.bookmark;
    html += '    </button>';
    html += '    <div class="board-share-wrap">';
    html += '      <button class="board-card-action-btn" data-action="toggle-share" data-post-id="' + postId + '">';
    html += ICONS.share;
    html += '      </button>';
    html += '      <div class="board-share-menu">';
    html += '        <button data-action="share-link" data-post-id="' + postId + '">&#x1F517; 링크 복사</button>';
    html += '        <button data-action="share-twitter" data-post-id="' + postId + '">&#x1D54F; 트위터</button>';
    html += '        <button data-action="share-facebook" data-post-id="' + postId + '">&#x1F4D8; 페이스북</button>';
    html += '      </div>';
    html += '    </div>';
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

  // ─── 글쓰기/수정 폼 (다모앙 스타일) ───

  Render.writeForm = function (post) {
    var container = document.getElementById(state.config.containerId);
    if (!container) return;

    var isEdit = !!post;
    var heading = isEdit ? '글 수정' : '글쓰기';

    var html = '';
    html += '<div class="board-write-overlay">';

    // 상단 네비
    html += '  <div class="board-detail-nav">';
    html += '    <button class="board-back-btn" data-action="cancel-write">&larr; 돌아가기</button>';
    html += '  </div>';

    // 폼
    html += '  <form class="board-write-form" id="boardWriteForm">';
    html += '    <h2 class="board-write-heading">' + heading + '</h2>';

    // 제목 (showcase에서는 숨김 — 시 제목이 글 제목 역할)
    if (state.config.board === 'showcase') {
      html += '    <input type="hidden" id="postTitle" value="' + (isEdit ? escapeHTML(post.title) : '') + '">';
    } else {
      html += '    <div class="board-form-group">';
      html += '      <label for="postTitle">제목 <span class="required">*</span></label>';
      html += '      <input type="text" id="postTitle" class="board-form-input" maxlength="200" required';
      html += '        placeholder="제목을 입력하세요"';
      html += '        value="' + (isEdit ? escapeHTML(post.title) : '') + '">';
      html += '    </div>';
    }

    // showcase 전용 필드
    if (state.config.board === 'showcase') {
      html += '    <div class="board-form-group">';
      html += '      <label for="poemTitle">시 제목</label>';
      html += '      <input type="text" id="poemTitle" class="board-form-input zh" maxlength="200"';
      html += '        placeholder="예: 靜夜思"';
      html += '        value="' + (isEdit && post.poem_title ? escapeHTML(post.poem_title) : '') + '">';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemBody">시 원문</label>';
      html += '      <textarea id="poemBody" class="board-form-textarea zh" rows="6"';
      html += '        placeholder="한시 원문을 입력하세요">';
      html += (isEdit && post.poem_body ? escapeHTML(post.poem_body) : '');
      html += '</textarea>';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemTranslation">한국어 번역</label>';
      html += '      <p class="board-form-hint">한국어는 그림에 합성되지 않습니다. 필요하지 않으면 적지 않으셔도 돼요.</p>';
      html += '      <textarea id="poemTranslation" class="board-form-textarea" rows="4"';
      html += '        placeholder="한국어 번역을 입력하세요">';
      html += (isEdit && post.poem_translation ? escapeHTML(post.poem_translation) : '');
      html += '</textarea>';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label>작시 메모</label>';
      html += '      <div class="board-editor-wrap">';
      html += '        <div id="poemNotesEditor"></div>';
      html += '      </div>';
      html += '    </div>';

      // 폰트 선택
      var selectedFont = (isEdit && post.font_style) ? post.font_style : 'fangsong';
      html += '    <div class="board-form-group">';
      html += '      <label for="fontStyle">서체 선택</label>';
      html += '      <select id="fontStyle" class="board-form-select">';
      html += '        <option value="fangsong"' + (selectedFont === 'fangsong' ? ' selected' : '') + '>仿宋 — 방송체 (기본)</option>';
      html += '        <option value="wenkai"' + (selectedFont === 'wenkai' ? ' selected' : '') + '>楷書 — 해서체</option>';
      html += '        <option value="mashanzheng"' + (selectedFont === 'mashanzheng' ? ' selected' : '') + '>行書 — 행서체 (Ma Shan Zheng)</option>';
      html += '        <option value="zhimangxing"' + (selectedFont === 'zhimangxing' ? ' selected' : '') + '>草書 — 초서체 (Zhi Mang Xing)</option>';
      html += '        <option value="liujianmaocao"' + (selectedFont === 'liujianmaocao' ? ' selected' : '') + '>草書 — 유건모초 (Liu Jian Mao Cao)</option>';
      html += '        <option value="longcang"' + (selectedFont === 'longcang' ? ' selected' : '') + '>行書 — 용장체 (Long Cang)</option>';
      html += '      </select>';
      html += '      <div id="fontPreviewBox" class="board-font-preview poem-font-' + selectedFont + '">床前明月光 疑是地上霜</div>';
      html += '    </div>';

      // 배경 선택
      var selectedBg = (isEdit && post.bg_template_id) ? post.bg_template_id : 'none';
      html += '    <div class="board-form-group">';
      html += '      <label>배경 선택</label>';
      html += '      <input type="hidden" id="bgTemplateId" value="' + selectedBg + '">';
      html += '      <div id="bgTemplateGrid" class="board-bg-grid">';
      html += '        <div class="board-bg-loading">배경 목록 불러오는 중...</div>';
      html += '      </div>';
      html += '      <div id="bgPreviewBox" class="board-bg-preview"></div>';
      html += '    </div>';

      // AI 배경 생성 — 선택지 기반
      html += '    <div class="board-form-group">';
      html += '      <label>AI 배경 생성</label>';
      html += '      <div class="board-ai-bg-wrap">';

      // 비율
      html += '        <div class="ai-opt-row">';
      html += '          <span class="ai-opt-label">비율</span>';
      html += '          <div class="ai-opt-chips" data-group="ratio">';
      html += '            <button type="button" class="ai-chip selected" data-value="square">정방형 (1:1)</button>';
      html += '            <button type="button" class="ai-chip" data-value="landscape">가로형 (3:2)</button>';
      html += '            <button type="button" class="ai-chip" data-value="portrait">세로형 (2:3)</button>';
      html += '          </div>';
      html += '        </div>';


      // 스타일 (1단계)
      html += '        <div class="ai-opt-row">';
      html += '          <span class="ai-opt-label">스타일</span>';
      html += '          <div class="ai-opt-chips" data-group="style">';
      html += '            <button type="button" class="ai-chip selected" data-value="oriental">동양화</button>';
      html += '            <button type="button" class="ai-chip" data-value="western">서양화</button>';
      html += '          </div>';
      html += '        </div>';

      // ── 동양화 서브옵션 ──
      html += '        <div class="ai-sub-options" id="aiSubOriental">';
      // 기법
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">기법</span>';
      html += '            <div class="ai-opt-chips" data-group="oriental-technique">';
      html += '              <button type="button" class="ai-chip selected" data-value="literati">문인화풍</button>';
      html += '              <button type="button" class="ai-chip" data-value="colored">채색화풍</button>';
      html += '              <button type="button" class="ai-chip" data-value="gongbi">공필화풍</button>';
      html += '            </div>';
      html += '          </div>';
      // 소재
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">소재</span>';
      html += '            <div class="ai-opt-chips" data-group="oriental-subject">';
      html += '              <button type="button" class="ai-chip selected" data-value="landscape">산수</button>';
      html += '              <button type="button" class="ai-chip" data-value="stilllife">정물</button>';
      html += '              <button type="button" class="ai-chip" data-value="figure">인물</button>';
      html += '              <button type="button" class="ai-chip" data-value="fourplants">사군자</button>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 산수
      html += '          <div class="ai-sub-branch" id="aiBranchLandscape">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips" data-group="oriental-landscape-detail">';
      html += '                <button type="button" class="ai-chip selected" data-value="guilin">계림풍 산수화</button>';
      html += '                <button type="button" class="ai-chip" data-value="jingyeong">진경산수화풍</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 정물
      html += '          <div class="ai-sub-branch" id="aiBranchStilllife" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips" data-group="oriental-stilllife-detail">';
      html += '                <button type="button" class="ai-chip selected" data-value="yeongmo">영모화 (새와 짐승)</button>';
      html += '                <button type="button" class="ai-chip" data-value="hwajo">화조화 (새와 꽃)</button>';
      html += '                <button type="button" class="ai-chip" data-value="chochung">초충화 (풀과 벌레)</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 인물
      html += '          <div class="ai-sub-branch" id="aiBranchFigure" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips" data-group="oriental-figure-detail">';
      html += '                <button type="button" class="ai-chip selected" data-value="waiting">기다리는 여인</button>';
      html += '                <button type="button" class="ai-chip" data-value="walking">숲길을 걷는 선비</button>';
      html += '                <button type="button" class="ai-chip" data-value="fishing">낚시하는 노인과 배</button>';
      html += '                <button type="button" class="ai-chip" data-value="reading">숲속에서 책 읽는 선비</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 사군자
      html += '          <div class="ai-sub-branch" id="aiBranchFourplants" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips ai-opt-multi" data-group="oriental-fourplants-detail">';
      html += '                <button type="button" class="ai-chip" data-value="plum">매화</button>';
      html += '                <button type="button" class="ai-chip" data-value="orchid">난초</button>';
      html += '                <button type="button" class="ai-chip" data-value="chrysanthemum">국화</button>';
      html += '                <button type="button" class="ai-chip" data-value="bamboo">대나무</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      html += '        </div>';

      // ── 서양화 서브옵션 ──
      html += '        <div class="ai-sub-options" id="aiSubWestern" style="display:none">';
      // 기법
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">기법</span>';
      html += '            <div class="ai-opt-chips" data-group="western-technique">';
      html += '              <button type="button" class="ai-chip selected" data-value="impressionist">인상파 유채화</button>';
      html += '              <button type="button" class="ai-chip" data-value="detailed-oil">세밀한 유채화</button>';
      html += '              <button type="button" class="ai-chip" data-value="watercolor">수채화</button>';
      html += '              <button type="button" class="ai-chip" data-value="pastel">파스텔화</button>';
      html += '              <button type="button" class="ai-chip" data-value="illustration">일러스트</button>';
      html += '              <button type="button" class="ai-chip" data-value="photo">실사풍</button>';
      html += '            </div>';
      html += '          </div>';
      // 소재
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">소재</span>';
      html += '            <div class="ai-opt-chips" data-group="western-subject">';
      html += '              <button type="button" class="ai-chip selected" data-value="scenery">풍경</button>';
      html += '              <button type="button" class="ai-chip" data-value="still">정물</button>';
      html += '              <button type="button" class="ai-chip" data-value="person">인물</button>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 풍경
      html += '          <div class="ai-sub-branch" id="aiBranchScenery">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">계절</span>';
      html += '              <div class="ai-opt-chips" data-group="western-season">';
      html += '                <button type="button" class="ai-chip" data-value="spring">봄</button>';
      html += '                <button type="button" class="ai-chip" data-value="summer">여름</button>';
      html += '                <button type="button" class="ai-chip" data-value="autumn">가을</button>';
      html += '                <button type="button" class="ai-chip" data-value="winter">겨울</button>';
      html += '                <button type="button" class="ai-chip selected" data-value="any-season">무관</button>';
      html += '              </div>';
      html += '            </div>';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">배경</span>';
      html += '              <div class="ai-opt-chips" data-group="western-place">';
      html += '                <button type="button" class="ai-chip selected" data-value="mountain-river">산과 강</button>';
      html += '                <button type="button" class="ai-chip" data-value="lake">호수</button>';
      html += '                <button type="button" class="ai-chip" data-value="sea">바다</button>';
      html += '                <button type="button" class="ai-chip" data-value="city">도시</button>';
      html += '                <button type="button" class="ai-chip" data-value="village">동아시아풍 시골</button>';
      html += '              </div>';
      html += '            </div>';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">시간</span>';
      html += '              <div class="ai-opt-chips" data-group="western-time">';
      html += '                <button type="button" class="ai-chip" data-value="dawn">아침(새벽)</button>';
      html += '                <button type="button" class="ai-chip" data-value="afternoon">맑은 오후</button>';
      html += '                <button type="button" class="ai-chip" data-value="sunset">노을진 저녁</button>';
      html += '                <button type="button" class="ai-chip" data-value="rainy">비오는 날</button>';
      html += '                <button type="button" class="ai-chip" data-value="snowy">눈오는 날</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 정물
      html += '          <div class="ai-sub-branch" id="aiBranchStill" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">분위기</span>';
      html += '              <div class="ai-opt-chips" data-group="western-still-mood">';
      html += '                <button type="button" class="ai-chip selected" data-value="bright-mood">밝고 화사한</button>';
      html += '                <button type="button" class="ai-chip" data-value="dark-mood">어둡고 쓸쓸한</button>';
      html += '                <button type="button" class="ai-chip" data-value="any-mood">무관</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 인물
      html += '          <div class="ai-sub-branch" id="aiBranchPerson" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">인물</span>';
      html += '              <div class="ai-opt-chips" data-group="western-person-gender">';
      html += '                <button type="button" class="ai-chip selected" data-value="male">남성</button>';
      html += '                <button type="button" class="ai-chip" data-value="female">여성</button>';
      html += '                <button type="button" class="ai-chip" data-value="couple">남과 여</button>';
      html += '              </div>';
      html += '            </div>';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">표정</span>';
      html += '              <div class="ai-opt-chips" data-group="western-person-mood">';
      html += '                <button type="button" class="ai-chip selected" data-value="happy">밝은 표정</button>';
      html += '                <button type="button" class="ai-chip" data-value="melancholy">어둡고 쓸쓸한</button>';
      html += '                <button type="button" class="ai-chip" data-value="sad">슬픈 표정</button>';
      html += '                <button type="button" class="ai-chip" data-value="crying">우는 표정</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      html += '        </div>';

      // 생성 버튼 (가운데 정렬 + AI 아이콘)
      html += '        <div class="board-ai-bg-actions" style="justify-content:center">';
      html += '          <button type="button" id="aiBgGenerateBtn" class="board-ai-bg-btn">';
      html += '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7z"/></svg>';
      html += '            AI 배경 생성';
      html += '          </button>';
      html += '        </div>';
      html += '        <div id="aiBgFormPreview" class="board-ai-form-preview"></div>';
      html += '        <input type="hidden" id="aiBgImageData" value="">';
      html += '        <input type="hidden" id="textPositionData" value="">';

      html += '      </div>';
      html += '    </div>';
    }

    // 본문 (Quill 에디터) — showcase는 작시메모 에디터를 사용하므로 제외
    if (state.config.board !== 'showcase') {
      html += '    <div class="board-form-group">';
      html += '      <label>내용</label>';
      html += '      <div class="board-editor-wrap">';
      html += '        <div id="postBodyEditor"></div>';
      html += '      </div>';
      html += '    </div>';
    }

    // 구분선
    html += '    <hr class="board-form-divider">';

    // 태그
    html += '    <div class="board-form-group">';
    html += '      <label for="postTags">태그</label>';
    html += '      <input type="text" id="postTags" class="board-form-input"';
    html += '        placeholder="예: 한시,칠언율시,이백"';
    html += '        value="' + (isEdit && post.tags ? escapeHTML(post.tags.join(',')) : '') + '">';
    html += '      <p class="board-form-hint">콤마(,)로 구분하여 복수 태그 등록 가능</p>';
    html += '    </div>';

    // 링크 (showcase에서는 숨김)
    if (state.config.board !== 'showcase') {
    html += '    <div class="board-form-group">';
    html += '      <label>링크</label>';
    html += '      <div class="board-form-links">';
    html += '        <input type="url" id="postLink1" class="board-form-input" placeholder="https://..."';
    html += '          value="' + (isEdit && post.links && post.links[0] ? escapeHTML(post.links[0]) : '') + '">';
    html += '        <input type="url" id="postLink2" class="board-form-input" placeholder="https://..."';
    html += '          value="' + (isEdit && post.links && post.links[1] ? escapeHTML(post.links[1]) : '') + '">';
    html += '      </div>';
    html += '    </div>';
    }

    // 첨부 (showcase에서는 숨김)
    if (state.config.board !== 'showcase') {
    html += '    <div class="board-form-group">';
    html += '      <label>첨부</label>';
    html += '      <div class="board-form-attach">';
    html += '        <label class="board-form-attach-label">';
    html += '          &#x1F4CE; 파일 선택';
    html += '          <input type="file" id="postFile" multiple accept="image/*,.pdf,.doc,.docx,.txt">';
    html += '        </label>';
    html += '        <span class="board-form-attach-info">10MB 이하 파일만 업로드 가능</span>';
    html += '      </div>';
    html += '      <div class="board-form-attach-list" id="attachList"></div>';
    html += '    </div>';
    }

    // 버튼
    html += '    <div class="board-form-actions">';
    html += '      <button type="button" class="board-cancel-btn" data-action="cancel-write">취소</button>';
    html += '      <button type="submit" class="board-submit-btn">' + (isEdit ? '수정 완료' : '작성완료') + '</button>';
    html += '    </div>';

    html += '  </form>';
    html += '</div>';

    container.innerHTML = html;

    // Quill 에디터 초기화 — showcase는 작시메모, 그 외는 본문
    var quillInitContent = '';
    if (isEdit) {
      quillInitContent = state.config.board === 'showcase' ? (post.poem_notes || '') : (post.body || '');
    }
    initQuillEditor(quillInitContent);

    // 파일 첨부 이벤트
    initFileAttach();

    // 폰트 미리보기 이벤트 (showcase)
    if (state.config.board === 'showcase') {
      var fontSelect = document.getElementById('fontStyle');
      var fontPreview = document.getElementById('fontPreviewBox');
      var poemBodyEl = document.getElementById('poemBody');
      if (fontSelect) {
        fontSelect.addEventListener('change', function () {
          var cls = 'poem-font-' + fontSelect.value;
          if (fontPreview) fontPreview.className = 'board-font-preview ' + cls;
          if (poemBodyEl) poemBodyEl.className = 'board-form-textarea zh ' + cls;
        });
      }

      // 배경 템플릿 그리드 로드
      loadBgTemplates(selectedBg);

      // AI 배경 생성 버튼 이벤트
      initAiBgGenerate();
    }

    // 제목 필드에 포커스
    var titleEl = document.getElementById('postTitle');
    if (titleEl) titleEl.focus();
  };

  /** 배경 템플릿 로드 + 그리드 렌더링 */
  async function loadBgTemplates(selectedId) {
    var grid = document.getElementById('bgTemplateGrid');
    var hiddenInput = document.getElementById('bgTemplateId');
    var previewBox = document.getElementById('bgPreviewBox');
    if (!grid) return;

    // 캐시 확인
    if (!bgTemplates) {
      try {
        var res = await fetch('/public/assets/showcase-bg/templates.json?_ts=' + Date.now());
        var data = await res.json();
        bgTemplates = data.templates || [];
      } catch (e) {
        console.error('[board.js] 배경 템플릿 로드 실패:', e);
        grid.innerHTML = '<div class="board-bg-loading">배경 목록을 불러올 수 없습니다</div>';
        return;
      }
    }

    // 그리드 HTML 생성
    var html = '';
    bgTemplates.forEach(function (tpl) {
      var isSelected = tpl.id === selectedId;
      var thumbStyle = tpl.css || 'background-color: transparent; border: 2px dashed #ccc;';
      html += '<div class="board-bg-thumb' + (isSelected ? ' selected' : '') + '"';
      html += ' data-bg-id="' + tpl.id + '"';
      html += ' data-bg-css="' + escapeHTML(tpl.css || '') + '"';
      html += ' title="' + escapeHTML(tpl.name) + '">';
      html += '<div class="board-bg-thumb-inner" style="' + thumbStyle + '"></div>';
      html += '<span class="board-bg-thumb-name">' + escapeHTML(tpl.name) + '</span>';
      html += '</div>';
    });
    grid.innerHTML = html;

    // 미리보기 업데이트
    function updatePreview(css) {
      if (!previewBox) return;
      if (!css) {
        previewBox.style.cssText = '';
        previewBox.textContent = '';
        previewBox.classList.remove('active');
      } else {
        previewBox.style.cssText = css;
        previewBox.textContent = '床前明月光 疑是地上霜 舉頭望明月 低頭思故鄉';
        previewBox.classList.add('active');
      }
    }

    // 초기 미리보기
    var selectedTpl = bgTemplates.find(function (t) { return t.id === selectedId; });
    if (selectedTpl && selectedTpl.css) updatePreview(selectedTpl.css);

    // 클릭 이벤트 (이벤트 위임)
    grid.addEventListener('click', function (e) {
      var thumb = e.target.closest('.board-bg-thumb');
      if (!thumb) return;

      // 이전 선택 해제
      grid.querySelectorAll('.board-bg-thumb.selected').forEach(function (el) {
        el.classList.remove('selected');
      });

      // 현재 선택
      thumb.classList.add('selected');
      var bgId = thumb.getAttribute('data-bg-id');
      var bgCss = thumb.getAttribute('data-bg-css');
      if (hiddenInput) hiddenInput.value = bgId;

      updatePreview(bgCss);
    });
  }

  /** AI 배경 생성 — 모달 방식 */
  function initAiBgGenerate() {
    var wrap = document.querySelector('.board-ai-bg-wrap');
    if (!wrap) return;

    // 칩 클릭 — 단일 선택 (일반 그룹)
    wrap.addEventListener('click', function (e) {
      var chip = e.target.closest('.ai-chip');
      if (!chip) return;

      var group = chip.closest('.ai-opt-chips');
      if (!group) return;

      var isMulti = group.classList.contains('ai-opt-multi');

      if (isMulti) {
        // 다중 선택 토글
        chip.classList.toggle('selected');
      } else {
        // 단일 선택
        group.querySelectorAll('.ai-chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');
      }

      // 스타일 변경 시 서브옵션 토글
      var groupName = group.getAttribute('data-group');
      if (groupName === 'style') {
        var val = chip.getAttribute('data-value');
        var subOriental = document.getElementById('aiSubOriental');
        var subWestern = document.getElementById('aiSubWestern');
        if (subOriental) subOriental.style.display = val === 'oriental' ? '' : 'none';
        if (subWestern) subWestern.style.display = val === 'western' ? '' : 'none';
      }

      // 동양화 소재 분기 토글
      if (groupName === 'oriental-subject') {
        var subj = chip.getAttribute('data-value');
        var branches = { landscape: 'aiBranchLandscape', stilllife: 'aiBranchStilllife', figure: 'aiBranchFigure', fourplants: 'aiBranchFourplants' };
        Object.keys(branches).forEach(function (k) {
          var el = document.getElementById(branches[k]);
          if (el) el.style.display = k === subj ? '' : 'none';
        });
      }

      // 서양화 소재 분기 토글
      if (groupName === 'western-subject') {
        var wSubj = chip.getAttribute('data-value');
        var wBranches = { scenery: 'aiBranchScenery', still: 'aiBranchStill', person: 'aiBranchPerson' };
        Object.keys(wBranches).forEach(function (k) {
          var el = document.getElementById(wBranches[k]);
          if (el) el.style.display = k === wSubj ? '' : 'none';
        });
      }
    });

    var btn = document.getElementById('aiBgGenerateBtn');
    if (!btn) return;

    btn.addEventListener('click', async function () {
      // 선택지에서 프롬프트 빌드
      var promptData = buildAiPrompt();

      // API 키 확인
      var apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        apiKey = window.prompt('Google Gemini API 키를 입력하세요.\n(한번 입력하면 브라우저에 저장됩니다)');
        if (!apiKey) return;
        localStorage.setItem('gemini_api_key', apiKey.trim());
        apiKey = apiKey.trim();
      }

      // 폼에서 시 텍스트 가져오기
      var ptEl = document.getElementById('poemTitle');
      var pbEl = document.getElementById('poemBody');
      var fsEl = document.getElementById('fontStyleSelect');
      var pTitle = ptEl ? ptEl.value : '';
      var pBody = pbEl ? pbEl.value : '';
      var fontCls = (fsEl && fsEl.value) ? 'poem-font-' + fsEl.value : '';

      // 모달 HTML
      var mHtml = '';
      mHtml += '<div class="ai-gen-modal-overlay" id="aiGenModal">';
      mHtml += '  <div class="ai-gen-modal">';
      mHtml += '    <div class="ai-gen-modal-header">';
      mHtml += '      <span>AI 배경 미리보기</span>';
      mHtml += '      <button class="ai-gen-modal-close" id="aiGenClose">&times;</button>';
      mHtml += '    </div>';

      // 로딩 영역
      mHtml += '    <div class="ai-gen-loading" id="aiGenLoading">';
      mHtml += '      <svg class="ai-gen-spinner" viewBox="0 0 100 100">';
      mHtml += '        <circle cx="50" cy="50" r="40" stroke="#c8d8e0" stroke-width="6" fill="none" opacity="0.3"/>';
      mHtml += '        <circle cx="50" cy="50" r="40" stroke="#4a6670" stroke-width="6" fill="none" stroke-dasharray="80 200" stroke-linecap="round">';
      mHtml += '          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.2s" repeatCount="indefinite"/>';
      mHtml += '        </circle>';
      mHtml += '        <circle cx="50" cy="50" r="20" stroke="#8aacb0" stroke-width="4" fill="none" stroke-dasharray="40 100" stroke-linecap="round">';
      mHtml += '          <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="1.8s" repeatCount="indefinite"/>';
      mHtml += '        </circle>';
      mHtml += '        <path d="M44 45 L50 38 L56 45 M44 55 L50 62 L56 55" stroke="#4a6670" stroke-width="2.5" fill="none" stroke-linecap="round">';
      mHtml += '          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>';
      mHtml += '        </path>';
      mHtml += '      </svg>';
      mHtml += '      <p class="ai-gen-loading-text">AI가 그림을 그리고 있습니다...</p>';
      mHtml += '      <p class="ai-gen-loading-sub">잠시만 기다려주세요</p>';
      mHtml += '    </div>';

      // 미리보기 영역 (처음엔 숨김)
      mHtml += '    <div class="ai-gen-preview" id="aiGenPreview" style="display:none">';
      mHtml += '      <div class="ai-gen-canvas" id="aiGenCanvas">';
      mHtml += '        <div class="ai-gen-textbox ' + fontCls + '" id="aiGenTextbox" contenteditable="true">';
      if (pTitle) mHtml += '<div class="ai-gen-text-title">' + escapeHTML(pTitle) + '</div>';
      if (pBody) mHtml += '<div class="ai-gen-text-body">' + escapeHTML(pBody).replace(/\n/g, '<br>') + '</div>';
      if (!pTitle && !pBody) mHtml += '<div class="ai-gen-text-body" style="opacity:0.5">시 제목/원문을 위 폼에서 먼저 입력하세요</div>';
      mHtml += '      </div>';
      mHtml += '      </div>';

      mHtml += '    </div>';

      // 컨트롤 바 (preview 밖 — 항상 보이도록)
      mHtml += '    <div class="ai-gen-controls" id="aiGenControls" style="display:none">';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">글자 크기</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlFontMinus">A−</button>';
      mHtml += '        <span id="aiCtrlFontSize">20px</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlFontPlus">A+</button>';
      mHtml += '      </div>';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">글자색</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn ai-gen-ctrl-active" id="aiCtrlFontBlack" data-color="black">검정</button>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlFontWhite" data-color="white">흰색</button>';
      mHtml += '      </div>';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">박스 배경</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn ai-gen-ctrl-active" id="aiCtrlBoxWhite" data-bg="white">흰색</button>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlBoxBlack" data-bg="black">검정</button>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlBoxNone" data-bg="none">없음</button>';
      mHtml += '      </div>';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">투명도</span>';
      mHtml += '        <input type="range" id="aiCtrlOpacity" min="0" max="100" value="70" class="ai-gen-slider">';
      mHtml += '        <span id="aiCtrlOpacityVal">70%</span>';
      mHtml += '      </div>';
      mHtml += '    </div>';

      // 에러 영역
      mHtml += '    <div class="ai-gen-error" id="aiGenError" style="display:none"></div>';

      // 하단 버튼
      mHtml += '    <div class="ai-gen-modal-footer">';
      mHtml += '      <button type="button" class="ai-gen-cancel-btn" id="aiGenCancel">취소</button>';
      mHtml += '      <button type="button" class="ai-gen-confirm-btn" id="aiGenConfirm" disabled>확정</button>';
      mHtml += '    </div>';

      mHtml += '  </div>';
      mHtml += '</div>';

      // 기존 모달 제거 후 삽입
      var oldModal = document.getElementById('aiGenModal');
      if (oldModal) oldModal.remove();
      document.body.insertAdjacentHTML('beforeend', mHtml);

      var modal = document.getElementById('aiGenModal');
      var loading = document.getElementById('aiGenLoading');
      var preview = document.getElementById('aiGenPreview');
      var errorEl = document.getElementById('aiGenError');
      var confirmBtn = document.getElementById('aiGenConfirm');

      // 모달 표시
      requestAnimationFrame(function () { modal.classList.add('visible'); });

      // 닫기 함수
      function closeModal() {
        modal.classList.remove('visible');
        setTimeout(function () { modal.remove(); }, 300);
      }
      document.getElementById('aiGenClose').addEventListener('click', closeModal);
      document.getElementById('aiGenCancel').addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

      // API 호출
      try {
        var imageBase64 = await callGeminiImageApi(apiKey, promptData.prompt, promptData.ratio);

        if (imageBase64) {
          var imgSrc = 'data:image/png;base64,' + imageBase64;
          var dataEl = document.getElementById('aiBgImageData');
          if (dataEl) dataEl.value = imageBase64;

          // 로딩 → 미리보기 전환
          loading.style.display = 'none';
          preview.style.display = '';
          var ctrlBar = document.getElementById('aiGenControls');
          if (ctrlBar) ctrlBar.style.display = '';

          var canvas = document.getElementById('aiGenCanvas');
          canvas.style.backgroundImage = 'url(' + imgSrc + ')';

          // 이미지 비율 감지 → 캔버스에 적용
          var ratioImg = new Image();
          ratioImg.onload = function () {
            canvas.style.aspectRatio = ratioImg.naturalWidth + '/' + ratioImg.naturalHeight;
          };
          ratioImg.src = imgSrc;

          confirmBtn.disabled = false;

          // 템플릿 선택 해제
          var bgIdEl = document.getElementById('bgTemplateId');
          if (bgIdEl) bgIdEl.value = 'none';
          var grid = document.getElementById('bgTemplateGrid');
          if (grid) {
            grid.querySelectorAll('.board-bg-thumb.selected').forEach(function (el) {
              el.classList.remove('selected');
            });
          }

          // ── 드래그 + 컨트롤 초기화 ──
          initAiGenModalControls(canvas, imgSrc, fontCls);
        }
      } catch (err) {
        console.error('[board.js] AI 배경 생성 실패:', err);
        loading.style.display = 'none';
        errorEl.style.display = '';
        errorEl.textContent = '생성 실패: ' + (err.message || '알 수 없는 오류');
        if (err.message && (err.message.includes('API key') || err.message.includes('401') || err.message.includes('403'))) {
          localStorage.removeItem('gemini_api_key');
          errorEl.textContent += ' (API 키를 다시 확인해주세요)';
        }
      }

      // 확정 버튼
      confirmBtn.addEventListener('click', function () {
        var textbox = document.getElementById('aiGenTextbox');
        var canvas = document.getElementById('aiGenCanvas');
        if (!textbox || !canvas) { closeModal(); return; }

        // 위치 + 스타일 저장
        var tpData = JSON.stringify({
          x: parseFloat(textbox.style.left) || 10,
          y: parseFloat(textbox.style.top) || 10,
          fontSize: parseInt(textbox.style.fontSize) || 20,
          fontColor: textbox.style.color || '#2a2a2a',
          boxBg: textbox.getAttribute('data-box-bg') || 'white',
          boxOpacity: parseFloat(textbox.getAttribute('data-box-opacity')) || 0.7
        });
        var tpEl = document.getElementById('textPositionData');
        if (tpEl) tpEl.value = tpData;

        // 편집된 텍스트를 폼에 반영
        var editedTitle = textbox.querySelector('.ai-gen-text-title');
        var editedBody = textbox.querySelector('.ai-gen-text-body');
        if (editedTitle && ptEl) ptEl.value = editedTitle.textContent;
        if (editedBody && pbEl) {
          // br → 줄바꿈 변환
          var bodyText = editedBody.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
          pbEl.value = bodyText;
        }

        // 폼에 50% 미리보기 표시 (비율 맞춤)
        var formPreview = document.getElementById('aiBgFormPreview');
        if (formPreview) {
          var bgUrl = canvas.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
          var previewImg = new Image();
          previewImg.onload = function () {
            var fpHtml = '<div class="ai-form-preview-img" style="';
            fpHtml += 'background-image:url(' + bgUrl + ');';
            fpHtml += 'aspect-ratio:' + previewImg.naturalWidth + '/' + previewImg.naturalHeight + ';">';
            fpHtml += '<div class="ai-form-preview-text" style="';
            fpHtml += 'left:' + (parseFloat(textbox.style.left) || 10) + '%;';
            fpHtml += 'top:' + (parseFloat(textbox.style.top) || 10) + '%;';
            fpHtml += 'font-size:' + (parseInt(textbox.style.fontSize) * 0.6 || 12) + 'px;';
            fpHtml += 'color:' + (textbox.style.color || '#2a2a2a') + ';';
            fpHtml += 'background:' + (textbox.style.background || 'rgba(255,255,255,0.75)') + ';';
            fpHtml += '">' + textbox.innerHTML + '</div>';
            fpHtml += '</div>';
            formPreview.innerHTML = fpHtml;
            formPreview.style.display = 'block';
          };
          previewImg.src = bgUrl;
        }

        closeModal();
      });
    });
  }

  /** 모달 내 컨트롤 초기화 — 드래그, 폰트, 색상, 투명도 */
  function initAiGenModalControls(canvas, imgSrc, fontCls) {
    var textbox = document.getElementById('aiGenTextbox');
    if (!canvas || !textbox) return;

    var dragging = false;
    var startX, startY, startLeft, startTop;
    var fontSize = 20;
    var boxBgColor = 'white';
    var boxOpacity = 0.7;

    // 기본 스타일 즉시 적용 (컨트롤 미조작 시에도 inline style 보장)
    textbox.style.fontSize = fontSize + 'px';
    textbox.style.color = '#1a1a1a';
    textbox.style.background = 'rgba(255,255,255,' + boxOpacity + ')';
    textbox.setAttribute('data-box-bg', boxBgColor);
    textbox.setAttribute('data-box-opacity', boxOpacity);

    // 텍스트 편집 중엔 드래그 방지
    var isEditing = false;
    textbox.addEventListener('focus', function () { isEditing = true; });
    textbox.addEventListener('blur', function () { isEditing = false; });

    // ── 드래그 (마우스) ──
    textbox.addEventListener('mousedown', function (e) {
      if (isEditing && e.target.closest('[contenteditable]')) return;
      if (e.target === textbox || e.target.classList.contains('ai-gen-text-title') || e.target.classList.contains('ai-gen-text-body')) {
        // contenteditable 내부 클릭이면 편집 모드
        return;
      }
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(textbox.style.left) || 10;
      startTop = parseFloat(textbox.style.top) || 10;
      textbox.style.cursor = 'grabbing';
    });

    // 드래그 핸들 (텍스트 편집과 분리)
    var dragHandle = document.createElement('div');
    dragHandle.className = 'ai-gen-drag-handle';
    dragHandle.innerHTML = '⠿ 드래그';
    dragHandle.title = '드래그하여 위치 이동';
    textbox.insertBefore(dragHandle, textbox.firstChild);

    dragHandle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(textbox.style.left) || 10;
      startTop = parseFloat(textbox.style.top) || 10;
      textbox.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var rect = canvas.getBoundingClientRect();
      var dx = ((e.clientX - startX) / rect.width) * 100;
      var dy = ((e.clientY - startY) / rect.height) * 100;
      textbox.style.left = Math.max(0, Math.min(85, startLeft + dx)) + '%';
      textbox.style.top = Math.max(0, Math.min(85, startTop + dy)) + '%';
    });

    document.addEventListener('mouseup', function () {
      if (dragging) { dragging = false; textbox.style.cursor = ''; }
    });

    // ── 드래그 (터치) ──
    dragHandle.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      dragging = true;
      startX = t.clientX;
      startY = t.clientY;
      startLeft = parseFloat(textbox.style.left) || 10;
      startTop = parseFloat(textbox.style.top) || 10;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      var rect = canvas.getBoundingClientRect();
      var dx = ((t.clientX - startX) / rect.width) * 100;
      var dy = ((t.clientY - startY) / rect.height) * 100;
      textbox.style.left = Math.max(0, Math.min(85, startLeft + dx)) + '%';
      textbox.style.top = Math.max(0, Math.min(85, startTop + dy)) + '%';
    }, { passive: true });

    document.addEventListener('touchend', function () { dragging = false; });

    // ── 폰트 크기 ──
    var fontSizeLabel = document.getElementById('aiCtrlFontSize');
    document.getElementById('aiCtrlFontMinus').addEventListener('click', function () {
      fontSize = Math.max(10, fontSize - 2);
      textbox.style.fontSize = fontSize + 'px';
      if (fontSizeLabel) fontSizeLabel.textContent = fontSize + 'px';
    });
    document.getElementById('aiCtrlFontPlus').addEventListener('click', function () {
      fontSize = Math.min(48, fontSize + 2);
      textbox.style.fontSize = fontSize + 'px';
      if (fontSizeLabel) fontSizeLabel.textContent = fontSize + 'px';
    });

    // ── 글자색 ──
    function updateBoxBg() {
      if (boxBgColor === 'none') {
        textbox.style.background = 'transparent';
      } else if (boxBgColor === 'white') {
        textbox.style.background = 'rgba(255,255,255,' + boxOpacity + ')';
      } else {
        textbox.style.background = 'rgba(0,0,0,' + boxOpacity + ')';
      }
      textbox.setAttribute('data-box-bg', boxBgColor);
      textbox.setAttribute('data-box-opacity', boxOpacity);
    }

    document.getElementById('aiCtrlFontBlack').addEventListener('click', function () {
      textbox.style.color = '#1a1a1a';
      this.classList.add('ai-gen-ctrl-active');
      document.getElementById('aiCtrlFontWhite').classList.remove('ai-gen-ctrl-active');
    });
    document.getElementById('aiCtrlFontWhite').addEventListener('click', function () {
      textbox.style.color = '#ffffff';
      this.classList.add('ai-gen-ctrl-active');
      document.getElementById('aiCtrlFontBlack').classList.remove('ai-gen-ctrl-active');
    });

    // ── 박스 배경색 ──
    var boxBtns = [document.getElementById('aiCtrlBoxWhite'), document.getElementById('aiCtrlBoxBlack'), document.getElementById('aiCtrlBoxNone')];
    boxBtns.forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function () {
        boxBgColor = this.getAttribute('data-bg');
        boxBtns.forEach(function (bb) { if (bb) bb.classList.remove('ai-gen-ctrl-active'); });
        this.classList.add('ai-gen-ctrl-active');
        updateBoxBg();
      });
    });

    // ── 투명도 슬라이더 ──
    var opacitySlider = document.getElementById('aiCtrlOpacity');
    var opacityLabel = document.getElementById('aiCtrlOpacityVal');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', function () {
        boxOpacity = parseInt(this.value) / 100;
        if (opacityLabel) opacityLabel.textContent = this.value + '%';
        updateBoxBg();
      });
    }
  }

  /** 선택지에서 AI 프롬프트 빌드 */
  function buildAiPrompt() {
    function getSelected(groupName) {
      var group = document.querySelector('[data-group="' + groupName + '"]');
      if (!group) return [];
      var chips = group.querySelectorAll('.ai-chip.selected');
      return Array.from(chips).map(function (c) { return c.getAttribute('data-value'); });
    }
    function sel(groupName) { return (getSelected(groupName)[0]) || ''; }

    // 비율
    var ratio = sel('ratio') || 'square';
    var ratioMap = { square: '1:1', landscape: '3:2', portrait: '2:3' };
    var ratioLabel = { square: '정방형', landscape: '가로 파노라마', portrait: '세로 족자형' };

    // 스타일
    var style = sel('style') || 'oriental';

    var parts = [];

    // ── 동양화 ──
    if (style === 'oriental') {
      parts.push('한시(漢詩) 배경 이미지.');
      parts.push('중국 또는 조선시대 전통 화풍을 충실히 재현할 것.');
      parts.push('텍스트, 글자, 문자, 낙관은 절대 포함하지 말 것.');
      parts.push(ratioLabel[ratio] + ' 비율.');



      // 기법
      var oTech = sel('oriental-technique') || 'literati';
      var oTechDesc = {
        literati: '문인화풍(수묵담채화, 文人畵) 스타일. 색채는 최소한으로 사용하고 먹(墨)과 붓터치만으로 표현할 것. 수묵의 농담(濃淡)을 살린 흑백 위주의 그림.',
        colored: '채색화풍(북종화, 北宗畵) 스타일. 선명한 색채와 정밀한 묘사.',
        gongbi: '공필화풍(工筆畵) 스타일. 세밀하고 정교한 선과 채색.'
      };
      parts.push(oTechDesc[oTech] || oTechDesc.literati);

      // 소재
      var oSubj = sel('oriental-subject') || 'landscape';

      if (oSubj === 'landscape') {
        var lDetail = sel('oriental-landscape-detail') || 'guilin';
        if (lDetail === 'guilin') parts.push('중국 계림(桂林) 풍의 기암절벽과 강, 안개가 있는 산수화.');
        else if (lDetail === 'jingyeong') parts.push('조선 진경산수화(眞景山水畵) 풍. 금강산이나 한국 실경을 사의적으로 표현.');
      } else if (oSubj === 'stilllife') {
        var sDetail = sel('oriental-stilllife-detail') || 'yeongmo';
        if (sDetail === 'yeongmo') parts.push('영모화(翎毛畵) 스타일. 새와 짐승을 정밀하게 그린 그림.');
        else if (sDetail === 'hwajo') parts.push('화조화(花鳥畵) 스타일. 꽃과 새가 어우러진 아름다운 그림.');
        else if (sDetail === 'chochung') parts.push('초충화(草蟲畵) 스타일. 풀과 벌레를 섬세하게 그린 그림.');
      } else if (oSubj === 'figure') {
        var fDetail = sel('oriental-figure-detail') || 'waiting';
        var figureDesc = {
          waiting: '기다리는 여인. 동양 전통 의상을 입고 먼 곳을 바라보는 여인의 뒷모습.',
          walking: '숲길을 걷는 선비. 갓과 도포를 입은 선비가 산길을 걸어가는 모습.',
          fishing: '낚시하는 노인과 배. 고요한 강가에서 배 위에 앉아 낚시하는 노인.',
          reading: '숲속에서 책 읽는 선비. 소나무 아래에서 독서하는 선비의 한적한 모습.'
        };
        parts.push(figureDesc[fDetail] || figureDesc.waiting);
      } else if (oSubj === 'fourplants') {
        var plants = getSelected('oriental-fourplants-detail');
        if (plants.length > 0) {
          var plantNames = { plum: '매화(梅)', orchid: '난초(蘭)', chrysanthemum: '국화(菊)', bamboo: '대나무(竹)' };
          var plantList = plants.map(function (p) { return plantNames[p] || p; }).join(', ');
          parts.push('사군자(四君子) 문인화 스타일로 ' + plantList + '을(를) 그려주세요.');
        } else {
          parts.push('사군자(四君子) 문인화. 매난국죽 중 어울리는 식물.');
        }
      }

    // ── 서양화 ──
    } else if (style === 'western') {
      parts.push('시(Poetry) 배경 이미지.');
      parts.push('서정적이고 감성적인 분위기.');
      parts.push('안정적이고 고전적인 구도.');
      parts.push('텍스트, 글자, 문자는 절대 포함하지 말 것.');
      parts.push(ratioLabel[ratio] + ' 비율.');



      // 기법
      var wTech = sel('western-technique') || 'impressionist';
      var wTechDesc = {
        'impressionist': '인상파(Impressionism) 스타일 유채화. 빛과 색채의 인상을 담아낸 화풍.',
        'detailed-oil': '세밀한 유채화(Detailed Oil Painting). 사실주의적이고 정교한 묘사.',
        'watercolor': '수채화(Watercolor). 물감의 번짐과 투명한 색감.',
        'pastel': '파스텔화(Pastel Drawing). 부드러운 색감과 몽환적인 질감.',
        'illustration': '일러스트레이션(Illustration). 감성적이고 동화적인 분위기.',
        'photo': '실사 사진(Photography) 스타일. 고화질의 자연스러운 사진처럼.'
      };
      parts.push(wTechDesc[wTech] || wTechDesc.impressionist);

      // 소재
      var wSubj = sel('western-subject') || 'scenery';

      if (wSubj === 'scenery') {
        // 계절
        var season = sel('western-season');
        var seasonDesc = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
        if (season && season !== 'any-season') parts.push(seasonDesc[season] + ' 풍경.');

        // 배경
        var place = sel('western-place') || 'mountain-river';
        var placeDesc = {
          'mountain-river': '산과 강이 어우러진 풍경.',
          'lake': '고요한 호수가 있는 풍경.',
          'sea': '바다와 해안 풍경.',
          'city': '도시 풍경.',
          'village': '동아시아풍 시골 전원 풍경.'
        };
        parts.push(placeDesc[place] || placeDesc['mountain-river']);

        // 시간
        var time = sel('western-time');
        var timeDesc = {
          'dawn': '이른 아침(새벽), 여명이 밝아오는 하늘.',
          'afternoon': '맑은 오후, 따뜻한 햇살.',
          'sunset': '노을진 저녁, 붉은 하늘.',
          'rainy': '비 오는 날씨, 촉촉한 분위기.',
          'snowy': '눈 오는 날씨, 하얀 설경.'
        };
        if (time) parts.push(timeDesc[time] || '');

      } else if (wSubj === 'still') {
        parts.push('정물화(Still Life).');
        var stillMood = sel('western-still-mood') || 'any-mood';
        if (stillMood === 'bright-mood') parts.push('밝고 화사한 분위기.');
        else if (stillMood === 'dark-mood') parts.push('어둡고 쓸쓸한 분위기.');

      } else if (wSubj === 'person') {
        parts.push('인물화(Portrait).');
        var gender = sel('western-person-gender') || 'male';
        var genderDesc = { male: '남성', female: '여성', couple: '남녀가 함께 있는' };
        parts.push(genderDesc[gender] + ' 인물.');

        var pMood = sel('western-person-mood') || 'happy';
        var pMoodDesc = {
          happy: '밝고 평온한 표정.',
          melancholy: '어둡고 쓸쓸한 표정.',
          sad: '슬픈 표정.',
          crying: '눈물을 흘리는 표정.'
        };
        parts.push(pMoodDesc[pMood] || '');
      }
    }

    return {
      prompt: parts.join(' '),
      ratio: ratioMap[ratio]
    };
  }


  /** Gemini NanoBanana API 호출 */
  async function callGeminiImageApi(apiKey, prompt, aspectRatio) {

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

    var body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: aspectRatio ? { aspectRatio: aspectRatio } : undefined
      }
    };

    var res = await fetch(url + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error('API 오류 (' + res.status + '): ' + errText.slice(0, 200));
    }

    var data = await res.json();

    // 응답에서 이미지 base64 추출
    var candidates = data.candidates;
    if (!candidates || !candidates.length) throw new Error('응답에 이미지가 없습니다');

    var parts = candidates[0].content && candidates[0].content.parts;
    if (!parts) throw new Error('응답 형식 오류');

    for (var i = 0; i < parts.length; i++) {
      if (parts[i].inlineData || parts[i].inline_data) {
        var inlineData = parts[i].inlineData || parts[i].inline_data;
        return inlineData.data;
      }
    }

    throw new Error('응답에 이미지 데이터가 없습니다');
  }

  /** AI 생성 이미지를 Supabase Storage에 업로드 */
  async function uploadAiBgToStorage(base64Data) {
    var sb = getSB();
    if (!sb || !state.currentUser) return null;

    // MIME 타입 자동 감지 (JPEG: /9j/, PNG: iVBO, WebP: UklG)
    var mimeType = 'image/png';
    var ext = '.png';
    if (base64Data.charAt(0) === '/') { mimeType = 'image/jpeg'; ext = '.jpg'; }
    else if (base64Data.startsWith('UklG')) { mimeType = 'image/webp'; ext = '.webp'; }

    try {
      // base64 → Blob 변환
      var byteChars = atob(base64Data);
      var byteArray = new Uint8Array(byteChars.length);
      for (var i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
      var blob = new Blob([byteArray], { type: mimeType });

      // 파일명: user_id + timestamp
      var fileName = 'ai-bg/' + state.currentUser.id + '_' + Date.now() + ext;

      var result = await sb.storage
        .from('showcase-backgrounds')
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: false
        });

      if (result.error) {
        console.error('[board.js] Storage 업로드 실패:', result.error.message || result.error);
        alert('Storage 업로드 실패: ' + (result.error.message || '알 수 없는 오류'));
        // fallback: data URL
        return 'data:' + mimeType + ';base64,' + base64Data;
      }

      // public URL 가져오기
      var publicUrl = sb.storage
        .from('showcase-backgrounds')
        .getPublicUrl(fileName);

      var url = publicUrl.data ? publicUrl.data.publicUrl : null;
      console.log('[board.js] Storage 업로드 성공:', url);
      return url;
    } catch (err) {
      console.error('[board.js] Storage 업로드 오류:', err);
      // fallback: data URL 직접 사용
      return 'data:' + mimeType + ';base64,' + base64Data;
    }
  }

  /** Quill 에디터 초기화 */
  function initQuillEditor(initialContent) {
    // showcase → 작시메모 에디터, 그 외 → 본문 에디터
    var editorId = state.config.board === 'showcase' ? 'poemNotesEditor' : 'postBodyEditor';
    var editorEl = document.getElementById(editorId);
    if (!editorEl) return;

    var placeholder = state.config.board === 'showcase'
      ? '시를 지은 배경이나 메모를 남겨보세요...'
      : '내용을 입력하세요...';

    // Quill 미로드 시 textarea 폴백
    if (typeof Quill === 'undefined') {
      console.warn('[board.js] Quill 미로드 — textarea 폴백');
      var wrap = editorEl.closest('.board-editor-wrap');
      if (wrap) {
        var ta = document.createElement('textarea');
        ta.id = state.config.board === 'showcase' ? 'poemNotes' : 'postBody';
        ta.className = 'board-form-textarea';
        ta.rows = 10;
        ta.placeholder = placeholder;
        ta.value = initialContent || '';
        wrap.replaceWith(ta);
      }
      quillInstance = null;
      return;
    }

    quillInstance = new Quill('#' + editorId, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean']
        ]
      }
    });

    // 수정 모드: 기존 내용 넣기
    if (initialContent) {
      if (initialContent.charAt(0) === '<') {
        quillInstance.root.innerHTML = initialContent;
      } else {
        quillInstance.setText(initialContent);
      }
    }
  }

  /** 파일 첨부 이벤트 바인딩 */
  function initFileAttach() {
    attachedFiles = [];
    var fileInput = document.getElementById('postFile');
    if (!fileInput) return;

    fileInput.addEventListener('change', function () {
      var files = Array.from(this.files);
      files.forEach(function (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert(file.name + ': 10MB를 초과합니다.');
          return;
        }
        attachedFiles.push(file);
      });
      renderAttachList();
      fileInput.value = '';
    });
  }

  /** 첨부 파일 목록 렌더 */
  function renderAttachList() {
    var list = document.getElementById('attachList');
    if (!list) return;
    var html = '';
    attachedFiles.forEach(function (file, index) {
      html += '<span class="board-form-attach-item">';
      html += escapeHTML(file.name);
      html += ' <button type="button" class="board-form-attach-remove" data-action="remove-attach" data-index="' + index + '">&times;</button>';
      html += '</span>';
    });
    list.innerHTML = html;
  }

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

    var html = state.displayMode === 'list' ? renderListItems(posts) : renderPostCards(posts);
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

  /** 무한스크롤 sentinel 업데이트 */
  function updateLoadMoreButton() {
    var container = document.getElementById(state.config.containerId);
    if (!container) return;

    var sentinel = container.querySelector('.board-scroll-sentinel');
    if (state.hasMore) {
      if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.className = 'board-scroll-sentinel';
        sentinel.id = 'boardScrollSentinel';
        sentinel.innerHTML = '<div class="board-scroll-spinner"></div>';
        container.appendChild(sentinel);
      }
      setupScrollObserver();
    } else {
      if (sentinel) sentinel.remove();
      if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    }
  }

  /** IntersectionObserver 기반 무한스크롤 */
  var scrollObserver = null;
  var isLoadingMore = false;

  function setupScrollObserver() {
    // 기존 Observer 정리
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }

    var sentinel = document.getElementById('boardScrollSentinel');
    if (!sentinel || !state.hasMore) return;

    scrollObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !isLoadingMore && state.hasMore) {
        handleLoadMore();
      }
    }, { rootMargin: '200px' });

    scrollObserver.observe(sentinel);
  }


  // ─────────────────────────────────────────────
  //  이벤트 핸들링 (Event Delegation)
  // ─────────────────────────────────────────────

  /** 메인 클릭 핸들러 — 컨테이너에 한 번만 바인딩 */
  function handleClick(e) {
    var target = e.target.closest('[data-action]');
    if (!target) {
      // 제목/본문 클릭 시 카드 펼치기 (접힌 상태에서만)
      if (!e.target.closest('a, button, input, textarea')) {
        var clickable = e.target.closest('.board-card-title, .board-card-body');
        if (clickable) {
          var card = clickable.closest('.board-feed-card');
          if (card && !card.classList.contains('card-expanded')) {
            handleExpand(card.getAttribute('data-post-id'));
          }
        }
      }
      // 리스트 아이템 클릭 시 카드 뷰로 전환
      var listItem = e.target.closest('.board-list-item');
      if (listItem) {
        state.displayMode = 'card';
        Render.feed();
        var targetPostId = listItem.getAttribute('data-post-id');
        requestAnimationFrame(function () {
          var targetCard = document.querySelector('.board-feed-card[data-post-id="' + targetPostId + '"]');
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            handleExpand(targetPostId);
          }
        });
      }
      return;
    }

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

      case 'collapse':
        handleCollapse(postId);
        break;

      case 'toggle-share':
        handleToggleShare(target);
        break;

      case 'share-link':
        handleShareLink(postId);
        break;

      case 'share-twitter':
        handleShareTwitter(postId);
        break;

      case 'share-facebook':
        handleShareFacebook(postId);
        break;

      case 'save-post':
        handleSavePost(postId);
        break;

      case 'open-poem':
        showPoemModal(postId);
        break;

      case 'view-mode':
        handleViewMode(target);
        break;

      case 'load-more':
        handleLoadMore();
        break;

      case 'remove-attach':
        var idx = parseInt(target.getAttribute('data-index'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < attachedFiles.length) {
          attachedFiles.splice(idx, 1);
          renderAttachList();
        }
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
    quillInstance = null;
    attachedFiles = [];
    Render.feed();
  }

  /** 더보기(본문 펼치기) */
  function handleExpand(postId) {
    var body = document.getElementById('body-' + postId);
    if (!body) return;

    body.classList.add('expanded');
    var card = body.closest('.board-feed-card');
    if (card) {
      card.classList.add('card-expanded');
      // 조회수 증가
      API.incrementView(postId);
    }
  }

  /** 카드 접기 */
  function handleCollapse(postId) {
    var body = document.getElementById('body-' + postId);
    if (!body) return;

    body.classList.remove('expanded');
    var card = body.closest('.board-feed-card');
    if (card) {
      card.classList.remove('card-expanded');
      // 접힌 후 더보기 버튼 필요 여부 체크
      requestAnimationFrame(function () {
        var expandBtn = card.querySelector('.board-card-expand');
        if (expandBtn) {
          if (body.scrollHeight > body.clientHeight + 2) {
            expandBtn.style.display = '';
          } else {
            expandBtn.style.display = 'none';
          }
        }
      });
    }
  }

  /** 공유 메뉴 토글 */
  function handleToggleShare(target) {
    var wrap = target.closest('.board-share-wrap');
    if (!wrap) return;
    var menu = wrap.querySelector('.board-share-menu');
    if (!menu) return;

    // 다른 열린 공유 메뉴 닫기
    var allMenus = document.querySelectorAll('.board-share-menu.show');
    allMenus.forEach(function (m) {
      if (m !== menu) m.classList.remove('show');
    });

    menu.classList.toggle('show');
  }

  /** 링크 복사 */
  function handleShareLink(postId) {
    var url = window.location.origin + window.location.pathname + '#post-' + postId;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        alert('링크가 복사되었습니다.');
      });
    } else {
      prompt('링크를 복사하세요:', url);
    }
    // 메뉴 닫기
    var allMenus = document.querySelectorAll('.board-share-menu.show');
    allMenus.forEach(function (m) { m.classList.remove('show'); });
  }

  /** 트위터 공유 */
  function handleShareTwitter(postId) {
    var post = findPostById(postId);
    var title = post ? post.title : '';
    var url = window.location.origin + window.location.pathname + '#post-' + postId;
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
    var allMenus = document.querySelectorAll('.board-share-menu.show');
    allMenus.forEach(function (m) { m.classList.remove('show'); });
  }

  /** 페이스북 공유 */
  function handleShareFacebook(postId) {
    var url = window.location.origin + window.location.pathname + '#post-' + postId;
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
    var allMenus = document.querySelectorAll('.board-share-menu.show');
    allMenus.forEach(function (m) { m.classList.remove('show'); });
  }

  /** 서재 저장 (준비 중) */
  function handleSavePost(postId) {
    if (!state.currentUser) {
      if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        window.location.href = '/auth/?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }
    alert('서재 저장 기능은 준비 중입니다.');
  }

  /** 시 상세보기 모달 */
  function showPoemModal(postId) {
    var post = state.posts.find(function (p) { return String(p.id) === String(postId); });
    if (!post) return;

    var nickname = escapeHTML(getProfileNickname(post));
    var time = timeAgo(post.created_at);
    var likeCount = post.like_count || 0;
    var liked = state.likedPostIds.has(postId);
    var poemFontClass = post.font_style ? ('poem-font-' + post.font_style) : '';
    var isOwner = isPostOwner(post) || isAdmin();

    // 배경 CSS
    var bgCss = '';
    if (post.bg_type === 'template' && post.bg_template_id && bgTemplates) {
      var tpl = bgTemplates.find(function (t) { return t.id === post.bg_template_id; });
      if (tpl && tpl.css) bgCss = tpl.css;
    } else if (post.bg_type === 'ai' && post.bg_image_url) {
      var modalDisplayUrl = getDisplayBgUrl(post.bg_image_url);
      bgCss = "background-image: url('" + escapeHTML(modalDisplayUrl) + "'); background-size: cover; background-position: center;";
    }
    if (!bgCss) bgCss = 'background: linear-gradient(135deg, #F5E6C8 0%, #EDD9A8 50%, #F0DEB8 100%);';

    // 작시메모 렌더링
    var notesHtml = '';
    if (post.poem_notes) {
      notesHtml = post.poem_notes.charAt(0) === '<'
        ? post.poem_notes
        : nl2br(escapeHTML(post.poem_notes));
    }

    var html = '';
    html += '<div class="poem-modal-overlay" id="poemModalOverlay">';
    html += '  <div class="poem-modal">';

    // 닫기 버튼
    html += '    <button class="poem-modal-close" id="poemModalClose">&times;</button>';

    // 텍스트 위치 파싱
    var tp = null;
    if (post.text_position) {
      try { tp = typeof post.text_position === 'string' ? JSON.parse(post.text_position) : post.text_position; } catch (e) {}
    }
    var poemStyle = '';
    if (tp) {
      poemStyle = 'position:absolute;left:' + tp.x + '%;top:' + tp.y + '%;';
      if (tp.fontSize) poemStyle += 'font-size:' + tp.fontSize + 'px;';
      if (tp.fontColor) poemStyle += 'color:' + tp.fontColor + ';';
      if (tp.boxBg) {
        var opacity = (tp.boxOpacity !== undefined && tp.boxOpacity !== null) ? tp.boxOpacity : 0.7;
        if (tp.boxBg === 'white') {
          poemStyle += 'background:rgba(255,255,255,' + opacity + ');';
        } else if (tp.boxBg === 'black') {
          poemStyle += 'background:rgba(0,0,0,' + opacity + ');';
        } else {
          poemStyle += 'background:' + tp.boxBg + ';';
        }
        poemStyle += 'padding:12px 16px;border-radius:6px;';
      }
    }

    // 시 디스플레이 영역 (배경 + 시)
    html += '    <div class="poem-modal-display" style="' + bgCss + '">';
    html += '      <div class="poem-modal-display-overlay"></div>';
    html += '      <div class="poem-modal-poem ' + poemFontClass + '" style="' + poemStyle + '">';
    if (post.poem_title) {
      html += '        <div class="poem-modal-poem-title">' + escapeHTML(post.poem_title) + '</div>';
    }
    if (post.poem_body) {
      html += '        <div class="poem-modal-poem-body">' + nl2br(escapeHTML(post.poem_body)) + '</div>';
    }
    html += '      </div>';
    html += '    </div>';

    // 하단 정보 영역
    html += '    <div class="poem-modal-info">';

    // 번역
    if (post.poem_translation) {
      html += '      <div class="poem-modal-translation">';
      html += '        <h4>번역</h4>';
      html += '        <p>' + nl2br(escapeHTML(post.poem_translation)) + '</p>';
      html += '      </div>';
    }

    // 작시메모
    if (notesHtml) {
      html += '      <div class="poem-modal-notes">';
      html += '        <h4>작시 메모</h4>';
      html += '        <div>' + notesHtml + '</div>';
      html += '      </div>';
    }

    // 작성자 + 액션
    html += '      <div class="poem-modal-footer">';
    html += '        <div class="poem-modal-author">';
    html += '          <strong>' + nickname + '</strong> · ' + escapeHTML(time);
    html += '        </div>';
    html += '        <div class="poem-modal-actions">';
    html += '          <button class="poem-modal-action-btn' + (liked ? ' liked' : '') + '" data-action="like" data-post-id="' + postId + '">';
    html += (liked ? ICONS.heartFilled : ICONS.heartOutline) + ' ' + likeCount;
    html += '          </button>';
    if (isOwner) {
      html += '          <button class="poem-modal-action-btn" data-action="edit" data-post-id="' + postId + '">수정</button>';
      html += '          <button class="poem-modal-action-btn" data-action="delete" data-post-id="' + postId + '">삭제</button>';
    }
    html += '        </div>';
    html += '      </div>';

    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // 모달 삽입
    var existing = document.getElementById('poemModalOverlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);

    // AI 배경이면 이미지 비율 감지 → 모달 크기 동적 조절
    if (post.bg_type === 'ai' && post.bg_image_url) {
      var img = new Image();
      img.onload = function () {
        var modal = document.querySelector('.poem-modal');
        var display = document.querySelector('.poem-modal-display');
        if (!modal || !display) return;
        var ratio = img.naturalWidth / img.naturalHeight;
        display.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
        if (ratio > 1.2) {
          // 가로형 — 모달 넓히기
          modal.style.maxWidth = Math.min(900, window.innerWidth * 0.9) + 'px';
        } else if (ratio < 0.8) {
          // 세로형 — 모달 좁히기
          modal.style.maxWidth = '480px';
        }
      };
      img.src = post.bg_image_url;
    }

    // 이벤트 바인딩
    var overlay = document.getElementById('poemModalOverlay');
    var closeBtn = document.getElementById('poemModalClose');

    function closeModal() {
      if (overlay) {
        overlay.classList.add('closing');
        setTimeout(function () { overlay.remove(); }, 250);
      }
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onEsc);
      }
    });

    // 모달 내 액션 버튼 이벤트 위임
    overlay.addEventListener('click', function (e) {
      var actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      var act = actionEl.getAttribute('data-action');
      var pid = actionEl.getAttribute('data-post-id');
      if (act === 'like') {
        handleLike(pid, actionEl);
      } else if (act === 'edit') {
        closeModal();
        handleEdit(pid);
      } else if (act === 'delete') {
        closeModal();
        handleDelete(pid);
      }
    });

    // 페이드인
    requestAnimationFrame(function () {
      overlay.classList.add('visible');
    });
  }

  /** 뷰 모드 전환 (카드/리스트) */
  function handleViewMode(target) {
    var mode = target.getAttribute('data-mode');
    if (!mode || mode === state.displayMode) return;
    state.displayMode = mode;
    Render.feed();
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

    var btn = target.closest('[data-action="like"]');
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
    var countSpan = btn.querySelector('span');
    var currentCount = countSpan ? (parseInt(countSpan.textContent) || 0) : 0;
    var newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    btn.innerHTML = (wasLiked ? ICONS.heartOutline : ICONS.heartFilled) + ' <span>' + newCount + '</span>';

    // API 호출
    var result = await API.toggleLike(postId);

    // 서버 결과로 보정
    if (result !== null) {
      btn.innerHTML = (state.likedPostIds.has(postId) ? ICONS.heartFilled : ICONS.heartOutline) + ' <span>' + result + '</span>';
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
          var commentToggle = card.querySelector('[data-action="toggle-comments"]');
          if (commentToggle) {
            commentToggle.innerHTML = ICONS.comment + ' <span>' + comments.length + '</span>';
          }
        }
      }
    } else {
      alert('삭제에 실패했습니다.');
    }
  }

  /** 더 불러오기 (무한스크롤 트리거) */
  async function handleLoadMore() {
    if (isLoadingMore) return;
    isLoadingMore = true;

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
    isLoadingMore = false;
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
    if (!titleEl) return;

    var title = titleEl.value.trim();

    // showcase: 시 제목을 글 제목으로 자동 설정
    if (state.config.board === 'showcase' && !title) {
      var poemTitleEl = document.getElementById('poemTitle');
      if (poemTitleEl && poemTitleEl.value.trim()) {
        title = poemTitleEl.value.trim();
        titleEl.value = title;
      }
    }

    if (!title) {
      alert(state.config.board === 'showcase' ? '시 제목을 입력하세요.' : '제목을 입력하세요.');
      var focusEl = state.config.board === 'showcase' ? document.getElementById('poemTitle') : titleEl;
      if (focusEl) focusEl.focus();
      return;
    }

    // 본문 / 작시메모: Quill 에디터에서 가져오기
    var quillContent = '';
    if (quillInstance) {
      var html = quillInstance.root.innerHTML;
      // Quill 빈 상태면 <p><br></p>만 있음
      if (html === '<p><br></p>') html = '';
      quillContent = html;
    }

    var body = '';
    if (state.config.board === 'showcase') {
      // showcase: Quill 내용 → poem_notes, body는 빈값
      body = '';
    } else {
      // 그 외: Quill 내용 → body
      body = quillContent || '';
      if (!body) {
        var bodyEl = document.getElementById('postBody');
        body = bodyEl ? bodyEl.value.trim() : '';
      }
    }

    var postData = {
      title: title,
      body: body
    };

    // showcase 전용 필드
    if (state.config.board === 'showcase') {
      var poemTitleEl = document.getElementById('poemTitle');
      var poemBodyEl = document.getElementById('poemBody');
      var poemTranslationEl = document.getElementById('poemTranslation');

      if (poemTitleEl) postData.poem_title = poemTitleEl.value.trim();
      if (poemBodyEl) postData.poem_body = poemBodyEl.value.trim();
      if (poemTranslationEl) postData.poem_translation = poemTranslationEl.value.trim();
      // 작시메모: Quill 에디터 내용 또는 textarea 폴백
      postData.poem_notes = quillContent;
      if (!postData.poem_notes) {
        var poemNotesEl = document.getElementById('poemNotes');
        if (poemNotesEl) postData.poem_notes = poemNotesEl.value.trim();
      }

      var fontStyleEl = document.getElementById('fontStyle');
      if (fontStyleEl) postData.font_style = fontStyleEl.value;

      // 배경: AI 생성 우선, 없으면 템플릿
      var aiBgData = document.getElementById('aiBgImageData');
      if (aiBgData && aiBgData.value) {
        // AI 이미지를 Supabase Storage에 업로드
        var submitBtn = document.querySelector('.board-submit-btn');
        if (submitBtn) submitBtn.textContent = '이미지 업로드 중...';

        var imageUrl = await uploadAiBgToStorage(aiBgData.value);

        if (imageUrl) {
          postData.bg_type = 'ai';
          postData.bg_image_url = imageUrl;
          console.log('[board.js] 배경 이미지 저장 성공:', imageUrl.startsWith('data:') ? 'data URL (fallback)' : imageUrl);
        } else {
          console.error('[board.js] 배경 이미지 저장 실패: imageUrl이 null');
          alert('배경 이미지 업로드에 실패했습니다. 콘솔을 확인해주세요.');
        }
        // 텍스트 위치 저장
        var tpEl = document.getElementById('textPositionData');
        if (tpEl && tpEl.value) {
          postData.text_position = tpEl.value;
        }
      } else {
        var bgIdEl = document.getElementById('bgTemplateId');
        if (bgIdEl && bgIdEl.value && bgIdEl.value !== 'none') {
          postData.bg_type = 'template';
          postData.bg_template_id = bgIdEl.value;
        }
      }
    }

    // 태그
    var tagsEl = document.getElementById('postTags');
    if (tagsEl && tagsEl.value.trim()) {
      postData.tags = tagsEl.value.trim().split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    } else {
      postData.tags = [];
    }

    // 링크
    var link1El = document.getElementById('postLink1');
    var link2El = document.getElementById('postLink2');
    var links = [];
    if (link1El && link1El.value.trim()) links.push(link1El.value.trim());
    if (link2El && link2El.value.trim()) links.push(link2El.value.trim());
    postData.links = links;

    // TODO: 첨부 파일 업로드 (Supabase Storage 설정 후 구현)
    // attachedFiles 배열에 파일이 있으면 Storage에 업로드 후 URL 저장

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
        quillInstance = null;
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
        console.log('[board.js] 새 글 생성 완료 — id:', result.id, ', bg_type:', result.bg_type, ', bg_image_url:', result.bg_image_url ? 'SET' : 'null');
        state.posts.unshift(result);
        state.viewMode = 'feed';
        quillInstance = null;
        Render.feed();
      } else {
        alert('작성에 실패했습니다. (콘솔에서 에러 확인)');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '작성완료';
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
          var commentToggle = card.querySelector('[data-action="toggle-comments"]');
          if (commentToggle) {
            commentToggle.innerHTML = ICONS.comment + ' <span>' + comments.length + '</span>';
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
          var commentToggle = card.querySelector('[data-action="toggle-comments"]');
          if (commentToggle) {
            commentToggle.innerHTML = ICONS.comment + ' <span>' + comments.length + '</span>';
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

    // 공유 메뉴 — 바깥 클릭 시 닫기
    if (!e.target.closest('.board-share-wrap')) {
      var shareMenus = document.querySelectorAll('.board-share-menu.show');
      shareMenus.forEach(function (m) { m.classList.remove('show'); });
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
        var displayNick = (user.nickname && user.nickname.trim()) ? user.nickname : (user.email ? user.email.split('@')[0] : '');
        state.currentUser = {
          id: user.id,
          email: user.email,
          nickname: displayNick,
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

      // ?write=1 파라미터가 있으면 자동으로 글쓰기 폼 열기
      if (new URLSearchParams(window.location.search).get('write') === '1') {
        handleWrite();
      }
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
