// shared/board/core.js
// 상태관리, Supabase API (CRUD/댓글/좋아요), 유틸리티
// 의존: shared/supabase.js, shared/auth-state.js

window._B = {};

(function (B) {
  'use strict';

  // ─── 유틸리티 ───

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var blobUrlCache = {};
  function toBlobUrl(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
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
      console.warn('[board] toBlobUrl 변환 실패:', e);
      return dataUrl;
    }
  }

  function getDisplayBgUrl(url) {
    if (!url) return url;
    if (url.startsWith('data:')) return toBlobUrl(url);
    return url;
  }

  function nl2br(str) { return str ? str.replace(/\n/g, '<br>') : ''; }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.floor((now - then) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + '.' + m + '.' + day + ' ' + h + ':' + min;
  }

  function getSB() {
    if (!window.sb) throw new Error('[board] window.sb가 없습니다. shared/supabase.js를 먼저 로드하세요.');
    return window.sb;
  }

  function sanitizeHTML(html) {
    if (!html) return '';
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed, form').forEach(function (el) { el.remove(); });
    doc.body.querySelectorAll('*').forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
      });
    });
    return doc.body.innerHTML;
  }

  function renderBodyContent(body) {
    if (!body) return '';
    if (body.charAt(0) === '<') return sanitizeHTML(body);
    return nl2br(escapeHTML(body));
  }

  var ICONS = {
    heartOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFilled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>'
  };

  // ─── 상태 ───

  var state = {
    config: null,
    currentUser: null,
    posts: [],
    offset: 0,
    hasMore: true,
    viewMode: 'feed',
    displayMode: 'card',
    editingPostId: null,
    likedPostIds: new Set()
  };

  var quillInstance = null;
  var bgTemplates = null;
  var attachedFiles = [];

  // ─── 헬퍼 ───

  function getProfileNickname(post) {
    if (post.profiles && post.profiles.nickname && post.profiles.nickname.trim()) return post.profiles.nickname;
    if (state.currentUser && state.currentUser.id === post.author_id) {
      if (state.currentUser.nickname && state.currentUser.nickname.trim()) return state.currentUser.nickname;
      if (state.currentUser.email) return state.currentUser.email.split('@')[0];
    }
    return '익명';
  }

  function isPostOwner(post) { return state.currentUser && state.currentUser.id === post.author_id; }
  function isAdmin() { return state.currentUser && state.currentUser.role === 'admin'; }
  function isCommentOwner(comment) { return state.currentUser && state.currentUser.id === comment.author_id; }

  function findPostById(postId) {
    for (var i = 0; i < state.posts.length; i++) {
      if (String(state.posts[i].id) === String(postId)) return state.posts[i];
    }
    return null;
  }

  function getBoardTitle() {
    var titles = { forum: '자유게시판', showcase: '한시 작품 공유', notice: '공지사항' };
    return titles[state.config.board] || '게시판';
  }

  // ─── API 레이어 ───

  var API = {};
  var hasTagsColumn = true;

  function addExtraFields(payload, postData) {
    if (!hasTagsColumn) return;
    if (postData.tags && postData.tags.length > 0) payload.tags = postData.tags;
    if (postData.links && postData.links.length > 0) payload.links = postData.links;
  }

  API.fetchPosts = async function (offset, limit) {
    var sb = getSB();
    var query = sb.from('posts')
      .select('*, profiles:author_id(nickname, avatar_url), likes(count), comments(count)', { count: 'exact' })
      .eq('board', state.config.board)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    var result = await query;
    if (result.error) {
      console.warn('[board] 조인 쿼리 실패, 기본 쿼리로 재시도:', result.error.message);
      var fallback = await sb.from('posts')
        .select('*, profiles:author_id(nickname, avatar_url)', { count: 'exact' })
        .eq('board', state.config.board)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (fallback.error) { console.error('[board] fetchPosts 에러:', fallback.error); return { data: [], count: 0 }; }
      return { data: fallback.data || [], count: fallback.count || 0 };
    }
    var posts = (result.data || []).map(function (post) {
      if (post.likes && post.likes.length > 0) post.like_count = post.likes[0].count;
      if (post.comments && post.comments.length > 0) post.comment_count = post.comments[0].count;
      if (!post.like_count) post.like_count = 0;
      if (!post.comment_count) post.comment_count = 0;
      return post;
    });
    return { data: posts, count: result.count || 0 };
  };

  API.fetchComments = async function (postId) {
    var sb = getSB();
    var result = await sb.from('comments').select('*, profiles:author_id(nickname, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
    if (result.error) { console.error('[board] fetchComments 에러:', result.error); return []; }
    return result.data || [];
  };

  API.checkLikedPosts = async function (postIds) {
    if (!state.currentUser || !postIds || postIds.length === 0) return new Set();
    var sb = getSB();
    var result = await sb.from('likes').select('post_id').eq('user_id', state.currentUser.id).in('post_id', postIds);
    if (result.error) { console.error('[board] checkLikedPosts 에러:', result.error); return new Set(); }
    var ids = new Set();
    (result.data || []).forEach(function (row) { ids.add(row.post_id); });
    return ids;
  };

  API.toggleLike = async function (postId) {
    var sb = getSB();
    var result = await sb.rpc('toggle_like', { post_id_input: postId });
    if (result.error) { console.error('[board] toggleLike 에러:', result.error); return null; }
    return result.data;
  };

  API.createPost = async function (postData) {
    var sb = getSB();
    var payload = { board: state.config.board, author_id: state.currentUser.id, title: postData.title, body: postData.body || '' };
    if (postData.poem_title) payload.poem_title = postData.poem_title;
    if (postData.poem_body) payload.poem_body = postData.poem_body;
    if (postData.poem_translation) payload.poem_translation = postData.poem_translation;
    if (postData.poem_notes) payload.poem_notes = postData.poem_notes;
    if (postData.font_style) payload.font_style = postData.font_style;
    if (postData.bg_type) payload.bg_type = postData.bg_type;
    if (postData.bg_template_id) payload.bg_template_id = postData.bg_template_id;
    if (postData.bg_image_url) payload.bg_image_url = postData.bg_image_url;
    if (postData.text_position) payload.text_position = postData.text_position;
    addExtraFields(payload, postData);
    var result = await sb.from('posts').insert(payload).select('*, profiles:author_id(nickname, avatar_url)').single();
    if (result.error) {
      console.warn('[board] createPost 첫 시도 실패:', result.error.message || result.error.code);
      hasTagsColumn = false;
      delete payload.tags; delete payload.links; delete payload.text_position;
      result = await sb.from('posts').insert(payload).select('*, profiles:author_id(nickname, avatar_url)').single();
    }
    if (result.error) { console.error('[board] createPost 최종 에러:', result.error); return null; }
    return result.data;
  };

  API.updatePost = async function (postId, postData) {
    var sb = getSB();
    var payload = { title: postData.title, body: postData.body || '' };
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
    if (hasTagsColumn) {
      payload.tags = (postData.tags && postData.tags.length > 0) ? postData.tags : [];
      payload.links = (postData.links && postData.links.length > 0) ? postData.links : [];
    }
    var result = await sb.from('posts').update(payload).eq('id', postId).select('*, profiles:author_id(nickname, avatar_url)').single();
    if (result.error) {
      console.warn('[board] updatePost 첫 시도 실패:', result.error.message || result.error.code);
      hasTagsColumn = false;
      delete payload.tags; delete payload.links; delete payload.text_position;
      result = await sb.from('posts').update(payload).eq('id', postId).select('*, profiles:author_id(nickname, avatar_url)').single();
    }
    if (result.error) { console.error('[board] updatePost 최종 에러:', result.error); return null; }
    return result.data;
  };

  API.deletePost = async function (postId) {
    var sb = getSB();
    var result = await sb.from('posts').delete().eq('id', postId);
    if (result.error) { console.error('[board] deletePost 에러:', result.error); return false; }
    return true;
  };

  API.addComment = async function (postId, body, parentId) {
    var sb = getSB();
    var params = { p_post_id: postId, p_body: body };
    if (parentId) params.p_parent_id = parentId;
    var result = await sb.rpc('add_comment', params);
    if (result.error) {
      console.warn('[board] add_comment RPC 실패, 직접 insert 시도:', result.error.message);
      if (!state.currentUser) return null;
      var payload = { post_id: postId, author_id: state.currentUser.id, body: body };
      if (parentId) payload.parent_id = parentId;
      var insertResult = await sb.from('comments').insert(payload).select().single();
      if (insertResult.error) { console.error('[board] comments insert 에러:', insertResult.error); return null; }
      return insertResult.data.id;
    }
    return result.data;
  };

  API.deleteComment = async function (commentId) {
    var sb = getSB();
    var result = await sb.rpc('delete_comment', { p_comment_id: commentId });
    if (result.error) {
      console.warn('[board] delete_comment RPC 실패, 직접 delete 시도:', result.error.message);
      var deleteResult = await sb.from('comments').delete().eq('id', commentId);
      if (deleteResult.error) { console.error('[board] comments delete 에러:', deleteResult.error); return false; }
      return true;
    }
    return true;
  };

  API.incrementView = async function (postId) {
    var sb = getSB();
    var result = await sb.rpc('increment_view_count', { p_post_id: postId });
    if (result.error) console.error('[board] incrementView 에러:', result.error);
  };

  // ─── 네임스페이스 노출 ───

  B.escapeHTML = escapeHTML;
  B.nl2br = nl2br;
  B.timeAgo = timeAgo;
  B.getSB = getSB;
  B.sanitizeHTML = sanitizeHTML;
  B.renderBodyContent = renderBodyContent;
  B.getDisplayBgUrl = getDisplayBgUrl;
  B.ICONS = ICONS;
  B.state = state;
  B.API = API;
  B.Render = {};
  B.getProfileNickname = getProfileNickname;
  B.isPostOwner = isPostOwner;
  B.isAdmin = isAdmin;
  B.isCommentOwner = isCommentOwner;
  B.findPostById = findPostById;
  B.getBoardTitle = getBoardTitle;
  B.hasTagsColumn = hasTagsColumn;
  B.addExtraFields = addExtraFields;
  // Mutable shared refs (getter/setter 유지 + 직접 프로퍼티 병행)
  B.getQuill = function () { return quillInstance; };
  B.setQuill = function (q) { quillInstance = q; };
  B.getBgTemplates = function () { return bgTemplates; };
  B.setBgTemplates = function (t) { bgTemplates = t; };
  B.getAttachedFiles = function () { return attachedFiles; };
  B.setAttachedFiles = function (f) { attachedFiles = f; };

  // 직접 프로퍼티 — 모듈에서 B.quillInstance / B.bgTemplates / B.attachedFiles 접근용
  B.quillInstance = null;
  B.bgTemplates = null;
  B.attachedFiles = [];
  B._scrollObserver = null;
  B._isLoadingMore = false;

})(window._B);
