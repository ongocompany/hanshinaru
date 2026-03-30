// =============================================================
//  board/handlers.js — 클릭/폼 이벤트 핸들러
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── handleClick (메인 클릭 위임) ───

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
        B.state.displayMode = 'card';
        B.Render.feed();
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
        B.showPoemModal(postId);
        break;

      case 'view-mode':
        handleViewMode(target);
        break;

      case 'load-more':
        handleLoadMore();
        break;

      case 'remove-attach':
        var idx = parseInt(target.getAttribute('data-index'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < B.attachedFiles.length) {
          B.attachedFiles.splice(idx, 1);
          B.renderAttachList();
        }
        break;
    }
  }

  // ─── handleWrite ───

  function handleWrite() {
    // 권한 체크
    if (B.state.config.canWrite && !B.state.config.canWrite(B.state.currentUser)) {
      // 로그인 안 된 경우 → 로그인 페이지로
      if (!B.state.currentUser) {
        if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
          window.location.href = '/auth/?redirect=' + encodeURIComponent(window.location.pathname);
        }
      } else {
        alert('글 작성 권한이 없습니다.');
      }
      return;
    }

    B.state.viewMode = 'write';
    B.state.editingPostId = null;
    B.Render.writeForm(null);
  }

  // ─── handleCancelWrite ───

  function handleCancelWrite() {
    B.state.viewMode = 'feed';
    B.state.editingPostId = null;
    B.quillInstance = null;
    B.attachedFiles = [];
    B.Render.feed();
  }

  // ─── handleExpand ───

  function handleExpand(postId) {
    var body = document.getElementById('body-' + postId);
    if (!body) return;

    body.classList.add('expanded');
    var card = body.closest('.board-feed-card');
    if (card) {
      card.classList.add('card-expanded');
      // 조회수 증가
      B.API.incrementView(postId);
    }
  }

  // ─── handleCollapse ───

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

  // ─── handleToggleShare ───

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

  // ─── handleShareLink ───

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

  // ─── handleShareTwitter ───

  function handleShareTwitter(postId) {
    var post = findPostById(postId);
    var title = post ? post.title : '';
    var url = window.location.origin + window.location.pathname + '#post-' + postId;
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
    var allMenus = document.querySelectorAll('.board-share-menu.show');
    allMenus.forEach(function (m) { m.classList.remove('show'); });
  }

  // ─── handleShareFacebook ───

  function handleShareFacebook(postId) {
    var url = window.location.origin + window.location.pathname + '#post-' + postId;
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
    var allMenus = document.querySelectorAll('.board-share-menu.show');
    allMenus.forEach(function (m) { m.classList.remove('show'); });
  }

  // ─── handleSavePost ───

  function handleSavePost(postId) {
    if (!B.state.currentUser) {
      if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        window.location.href = '/auth/?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }
    alert('서재 저장 기능은 준비 중입니다.');
  }

  // ─── handleViewMode ───

  function handleViewMode(target) {
    var mode = target.getAttribute('data-mode');
    if (!mode || mode === B.state.displayMode) return;
    B.state.displayMode = mode;
    B.Render.feed();
  }

  // ─── handleToggleMore ───

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

  // ─── handleEdit ───

  async function handleEdit(postId) {
    // 게시글 데이터 찾기
    var post = findPostById(postId);
    if (!post) return;

    B.state.viewMode = 'edit';
    B.state.editingPostId = postId;
    B.Render.writeForm(post);
  }

  // ─── handleDelete ───

  async function handleDelete(postId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    var success = await B.API.deletePost(postId);
    if (success) {
      // state.posts에서도 제거
      B.state.posts = B.state.posts.filter(function (p) { return p.id !== parseInt(postId) && p.id !== postId; });
      B.removeCard(postId);
    } else {
      alert('삭제에 실패했습니다.');
    }
  }

  // ─── handleLike ───

  async function handleLike(postId, target) {
    if (!B.state.currentUser) {
      if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        window.location.href = '/auth/?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }

    var btn = target.closest('[data-action="like"]');
    if (!btn) return;

    var wasLiked = B.state.likedPostIds.has(postId);

    // 낙관적 UI 업데이트
    if (wasLiked) {
      B.state.likedPostIds.delete(postId);
      btn.classList.remove('liked');
    } else {
      B.state.likedPostIds.add(postId);
      btn.classList.add('liked');
    }

    // 카운트 업데이트 (낙관적)
    var countSpan = btn.querySelector('span');
    var currentCount = countSpan ? (parseInt(countSpan.textContent) || 0) : 0;
    var newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    btn.innerHTML = (wasLiked ? B.ICONS.heartOutline : B.ICONS.heartFilled) + ' <span>' + newCount + '</span>';

    // API 호출
    var result = await B.API.toggleLike(postId);

    // 서버 결과로 보정
    if (result !== null) {
      btn.innerHTML = (B.state.likedPostIds.has(postId) ? B.ICONS.heartFilled : B.ICONS.heartOutline) + ' <span>' + result + '</span>';
      // state.posts에서도 업데이트
      var post = findPostById(postId);
      if (post) post.like_count = result;
    }
  }

  // ─── handleToggleComments ───

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

    var comments = await B.API.fetchComments(postId);
    B.Render.comments(postId, comments);
  }

  // ─── handleReply ───

  function handleReply(target) {
    if (!B.state.currentUser) return;

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
      '<textarea class="board-reply-input" placeholder="답글을 작성하세요..." maxlength="2000" rows="2">@' + B.escapeHTML(authorName) + ' </textarea>' +
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

  // ─── handleDeleteComment ───

  async function handleDeleteComment(commentId, postId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    var success = await B.API.deleteComment(commentId);
    if (success) {
      // 댓글 다시 로드
      var comments = await B.API.fetchComments(postId);
      B.Render.comments(postId, comments);

      // 게시글의 comment_count 업데이트
      var post = findPostById(postId);
      if (post) {
        post.comment_count = comments.length;
        // 댓글 수 버튼 업데이트
        var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
        if (card) {
          var commentToggle = card.querySelector('[data-action="toggle-comments"]');
          if (commentToggle) {
            commentToggle.innerHTML = B.ICONS.comment + ' <span>' + comments.length + '</span>';
          }
        }
      }
    } else {
      alert('삭제에 실패했습니다.');
    }
  }

  // ─── handleLoadMore ───

  async function handleLoadMore() {
    if (B._isLoadingMore) return;
    B._isLoadingMore = true;

    B.state.offset += B.state.config.pageSize;

    var result = await B.API.fetchPosts(B.state.offset, B.state.config.pageSize);
    var newPosts = result.data;

    if (newPosts.length > 0) {
      // 좋아요 체크
      var newPostIds = newPosts.map(function (p) { return p.id; });
      var newLiked = await B.API.checkLikedPosts(newPostIds);
      newLiked.forEach(function (id) {
        B.state.likedPostIds.add(id);
      });

      B.state.posts = B.state.posts.concat(newPosts);
      B.appendCards(newPosts);
    }

    // 더 불러올 데이터 있는지 확인
    B.state.hasMore = B.state.posts.length < result.count;
    B._isLoadingMore = false;
    B.updateLoadMoreButton();
  }

  // ─── findPostById ───

  function findPostById(postId) {
    // postId는 문자열일 수도 숫자일 수도 있으므로 둘 다 비교
    for (var i = 0; i < B.state.posts.length; i++) {
      if (String(B.state.posts[i].id) === String(postId)) {
        return B.state.posts[i];
      }
    }
    return null;
  }

  // ─── handleFormSubmits ───

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

  // ─── submitWriteForm ───

  async function submitWriteForm() {
    var titleEl = document.getElementById('postTitle');
    if (!titleEl) return;

    var title = titleEl.value.trim();

    // showcase: 시 제목을 글 제목으로 자동 설정
    if (B.state.config.board === 'showcase' && !title) {
      var poemTitleEl = document.getElementById('poemTitle');
      if (poemTitleEl && poemTitleEl.value.trim()) {
        title = poemTitleEl.value.trim();
        titleEl.value = title;
      }
    }

    if (!title) {
      alert(B.state.config.board === 'showcase' ? '시 제목을 입력하세요.' : '제목을 입력하세요.');
      var focusEl = B.state.config.board === 'showcase' ? document.getElementById('poemTitle') : titleEl;
      if (focusEl) focusEl.focus();
      return;
    }

    // 본문 / 작시메모: Quill 에디터에서 가져오기
    var quillContent = '';
    if (B.quillInstance) {
      var html = B.quillInstance.root.innerHTML;
      // Quill 빈 상태면 <p><br></p>만 있음
      if (html === '<p><br></p>') html = '';
      quillContent = html;
    }

    var body = '';
    if (B.state.config.board === 'showcase') {
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
    if (B.state.config.board === 'showcase') {
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

        var imageUrl = await B.uploadAiBgToStorage(aiBgData.value);

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

    if (B.state.viewMode === 'edit' && B.state.editingPostId) {
      // 수정
      result = await B.API.updatePost(B.state.editingPostId, postData);
      if (result) {
        // state.posts 업데이트
        for (var i = 0; i < B.state.posts.length; i++) {
          if (String(B.state.posts[i].id) === String(B.state.editingPostId)) {
            B.state.posts[i] = result;
            break;
          }
        }
        B.state.viewMode = 'feed';
        B.state.editingPostId = null;
        B.quillInstance = null;
        B.Render.feed();
      } else {
        alert('수정에 실패했습니다.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '수정 완료';
        }
      }
    } else {
      // 새 글 작성

      result = await B.API.createPost(postData);
      if (result) {
        console.log('[board.js] 새 글 생성 완료 — id:', result.id, ', bg_type:', result.bg_type, ', bg_image_url:', result.bg_image_url ? 'SET' : 'null');
        B.state.posts.unshift(result);
        B.state.viewMode = 'feed';
        B.quillInstance = null;
        B.Render.feed();
      } else {
        alert('작성에 실패했습니다. (콘솔에서 에러 확인)');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '작성완료';
        }
      }
    }
  }

  // ─── submitCommentForm ───

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

    var commentId = await B.API.addComment(postId, body, null);

    if (commentId) {
      // 댓글 목록 새로 로드
      var comments = await B.API.fetchComments(postId);
      B.Render.comments(postId, comments);

      // 게시글의 comment_count 업데이트
      var post = findPostById(postId);
      if (post) {
        post.comment_count = comments.length;
        // 댓글 수 버튼 업데이트
        var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
        if (card) {
          var commentToggle = card.querySelector('[data-action="toggle-comments"]');
          if (commentToggle) {
            commentToggle.innerHTML = B.ICONS.comment + ' <span>' + comments.length + '</span>';
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

  // ─── submitReplyForm ───

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

    var commentId = await B.API.addComment(postId, body, parentId);

    if (commentId) {
      // 답글 폼 제거
      form.remove();

      // 댓글 목록 새로 로드
      var comments = await B.API.fetchComments(postId);
      B.Render.comments(postId, comments);

      // 게시글의 comment_count 업데이트
      var post = findPostById(postId);
      if (post) {
        post.comment_count = comments.length;
        var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
        if (card) {
          var commentToggle = card.querySelector('[data-action="toggle-comments"]');
          if (commentToggle) {
            commentToggle.innerHTML = B.ICONS.comment + ' <span>' + comments.length + '</span>';
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

  // ─── handleDocumentClick ───

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

  // ─── Export to B namespace ───

  B.handleClick = handleClick;
  B.handleFormSubmits = handleFormSubmits;
  B.handleDocumentClick = handleDocumentClick;
  B.handleLoadMore = handleLoadMore;
  B.handleLike = handleLike;
  B.handleEdit = handleEdit;
  B.handleDelete = handleDelete;
  B.findPostById = findPostById;

})(window._B);
