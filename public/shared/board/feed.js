// =============================================================
//  board/feed.js — 피드 렌더링 (카드/리스트/무한스크롤)
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── Render.feed ───

  B.Render.feed = async function () {
    var container = document.getElementById(B.state.config.containerId);
    if (!container) return;

    // showcase: 배경 템플릿 데이터 미리 로드
    if (B.state.config.board === 'showcase' && !B.bgTemplates) {
      try {
        var res = await fetch('/public/assets/showcase-bg/templates.json?_ts=' + Date.now());
        var data = await res.json();
        B.bgTemplates = data.templates || [];
      } catch (e) {
        console.warn('[board.js] 배경 템플릿 로드 실패 (카드 뷰):', e);
      }
    }

    var html = '';

    var isShowcase = B.state.config.board === 'showcase';

    // 상단 툴바
    html += '<div class="board-toolbar">';
    html += '  <h2 class="board-toolbar-title">' + B.escapeHTML(getBoardTitle()) + '</h2>';
    html += '  <div class="board-toolbar-right">';
    if (!isShowcase) {
      html += '    <div class="board-view-toggle">';
      html += '      <button data-action="view-mode" data-mode="card" class="' + (B.state.displayMode === 'card' ? 'active' : '') + '" title="카드 보기">&#9638;</button>';
      html += '      <button data-action="view-mode" data-mode="list" class="' + (B.state.displayMode === 'list' ? 'active' : '') + '" title="리스트 보기">&#9776;</button>';
      html += '    </div>';
    }
    html += '    <button class="board-write-btn" data-action="write">글쓰기</button>';
    html += '  </div>';
    html += '</div>';

    // 게시글 목록
    if (isShowcase) {
      // 갤러리 2컬럼 그리드
      html += '<div class="board-feed board-gallery" id="boardFeed">';
      html += B.renderShowcaseCards(B.state.posts);
      html += '</div>';
    } else {
      html += '<div class="board-feed" id="boardFeed">';
      if (B.state.displayMode === 'list') {
        html += renderListItems(B.state.posts);
      } else {
        html += renderPostCards(B.state.posts);
      }
      html += '</div>';
    }

    // 무한스크롤 감지 sentinel
    if (B.state.hasMore) {
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

  // ─── getBoardTitle ───

  function getBoardTitle() {
    var titles = {
      forum: '자유게시판',
      showcase: '한시 작품 공유',
      notice: '공지사항'
    };
    return titles[B.state.config.board] || '게시판';
  }

  // ─── renderPostCards ───

  function renderPostCards(posts) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      html += renderPostCard(posts[i]);
    }
    return html;
  }

  // ─── renderListItems / renderListItem ───

  function renderListItems(posts) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      html += renderListItem(posts[i]);
    }
    return html;
  }

  function renderListItem(post) {
    var postId = post.id;
    var nickname = B.escapeHTML(B.getProfileNickname(post));
    var time = B.timeAgo(post.created_at);
    var likeCount = post.like_count || 0;
    var commentCount = post.comment_count || 0;
    var titlePrefix = post.is_pinned ? '<span class="board-pinned-badge">[고정]</span> ' : '';

    var html = '';
    html += '<div class="board-list-item" data-post-id="' + postId + '">';
    html += '  <span class="board-list-title">' + titlePrefix + B.escapeHTML(post.title) + '</span>';
    html += '  <span class="board-list-author">' + nickname + '</span>';
    html += '  <span class="board-list-date">' + B.escapeHTML(time) + '</span>';
    html += '  <span class="board-list-stats">';
    html += '    <span>' + B.ICONS.heartOutline + ' ' + likeCount + '</span>';
    html += '    <span>' + B.ICONS.comment + ' ' + commentCount + '</span>';
    html += '  </span>';
    html += '</div>';

    return html;
  }

  // ─── renderPostCard ───

  function renderPostCard(post) {
    var postId = post.id;
    var nickname = B.escapeHTML(B.getProfileNickname(post));
    var avatarChar = nickname.charAt(0).toUpperCase();
    var avatarUrl = post.profiles && post.profiles.avatar_url ? post.profiles.avatar_url : '';
    var time = B.timeAgo(post.created_at);
    var liked = B.state.likedPostIds.has(postId);
    var likeCount = post.like_count || 0;
    var commentCount = post.comment_count || 0;
    var viewCount = post.view_count || 0;
    var showMore = B.isPostOwner(post) || B.isAdmin();

    var html = '';
    html += '<div class="board-feed-card" data-post-id="' + postId + '">';

    // ─ 헤더 (아바타 + 닉네임 + 시간 + 더보기)
    html += '  <div class="board-card-header">';
    if (avatarUrl) {
      html += '    <span class="board-card-avatar level-1"><img src="' + B.escapeHTML(avatarUrl) + '" alt=""></span>';
    } else {
      html += '    <span class="board-card-avatar level-1">' + B.escapeHTML(avatarChar) + '</span>';
    }
    html += '    <span class="board-card-author">' + nickname + '</span>';
    html += '    <span class="board-card-time">' + B.escapeHTML(time) + '</span>';

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
    html += '  <div class="board-card-title"><span class="board-card-views">조회 ' + viewCount + '</span>' + titlePrefix + B.escapeHTML(post.title) + '</div>';

    // ─ showcase: 한시 표시 영역
    if (B.state.config.board === 'showcase' && post.poem_body) {
      var poemFontClass = post.font_style ? ('poem-font-' + post.font_style) : '';
      var bgStyle = '';
      if (post.bg_type === 'template' && post.bg_template_id && B.bgTemplates) {
        var tpl = B.bgTemplates.find(function (t) { return t.id === post.bg_template_id; });
        if (tpl && tpl.css) bgStyle = ' style="' + B.escapeHTML(tpl.css) + '"';
      } else if (post.bg_type === 'ai' && post.bg_image_url) {
        var cardDisplayUrl = B.getDisplayBgUrl(post.bg_image_url);
        bgStyle = ' style="background-image: url(\'' + B.escapeHTML(cardDisplayUrl) + '\'); background-size: cover; background-position: center;"';
      }
      var hasBg = post.bg_type ? ' has-bg' : '';
      html += '  <div class="board-poem-display' + hasBg + ' ' + poemFontClass + '"' + bgStyle + '>';
      if (post.poem_title) {
        html += '    <div class="board-poem-title">' + B.escapeHTML(post.poem_title) + '</div>';
      }
      html += '    <div class="board-poem-body">' + B.nl2br(B.escapeHTML(post.poem_body)) + '</div>';
      if (post.poem_translation) {
        html += '    <div class="board-poem-translation">' + B.nl2br(B.escapeHTML(post.poem_translation)) + '</div>';
      }
      if (post.poem_notes) {
        // Quill HTML이면 그대로, 일반 텍스트면 escapeHTML 처리
        var notesContent = post.poem_notes.charAt(0) === '<'
          ? post.poem_notes
          : B.nl2br(B.escapeHTML(post.poem_notes));
        html += '    <div class="board-poem-notes">' + notesContent + '</div>';
      }
      html += '  </div>';
    }

    // ─ 본문 (접힘 가능)
    html += '  <div class="board-card-body" id="body-' + postId + '">' + B.renderBodyContent(post.body) + '</div>';

    // ─ 펼치기/접기 버튼
    html += '  <button class="board-card-expand" data-action="expand" data-post-id="' + postId + '">...</button>';
    html += '  <button class="board-card-collapse" data-action="collapse" data-post-id="' + postId + '">&#9650;</button>';

    // ─ 태그
    if (post.tags && post.tags.length > 0) {
      html += '  <div class="board-card-tags">';
      post.tags.forEach(function (tag) {
        html += '<span class="board-tag">#' + B.escapeHTML(tag) + '</span>';
      });
      html += '  </div>';
    }

    // ─ 링크
    if (post.links && post.links.length > 0) {
      html += '  <div class="board-card-links">';
      post.links.forEach(function (link) {
        if (link) html += '<a href="' + B.escapeHTML(link) + '" target="_blank" rel="noopener">&#x1F517; ' + B.escapeHTML(link) + '</a>';
      });
      html += '  </div>';
    }

    // ─ 푸터 (좋아요, 댓글, 저장, 공유 — SVG 아이콘)
    html += '  <div class="board-card-footer">';
    html += '    <button class="board-card-action-btn' + (liked ? ' liked' : '') + '" data-action="like" data-post-id="' + postId + '">';
    html += (liked ? B.ICONS.heartFilled : B.ICONS.heartOutline) + ' <span>' + likeCount + '</span>';
    html += '    </button>';
    html += '    <button class="board-card-action-btn" data-action="toggle-comments" data-post-id="' + postId + '">';
    html += B.ICONS.comment + ' <span>' + commentCount + '</span>';
    html += '    </button>';
    html += '    <button class="board-card-action-btn" data-action="save-post" data-post-id="' + postId + '">';
    html += B.ICONS.bookmark;
    html += '    </button>';
    html += '    <div class="board-share-wrap">';
    html += '      <button class="board-card-action-btn" data-action="toggle-share" data-post-id="' + postId + '">';
    html += B.ICONS.share;
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

  // ─── checkExpandButtons ───

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

  // ─── prependCard ───

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

  // ─── replaceCard ───

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

  // ─── removeCard ───

  function removeCard(postId) {
    var card = document.querySelector('.board-feed-card[data-post-id="' + postId + '"]');
    if (card) card.remove();
  }

  // ─── appendCards ───

  function appendCards(posts) {
    var feed = document.getElementById('boardFeed');
    if (!feed) return;

    var html = B.state.displayMode === 'list' ? renderListItems(posts) : renderPostCards(posts);
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

  // ─── updateLoadMoreButton ───

  function updateLoadMoreButton() {
    var container = document.getElementById(B.state.config.containerId);
    if (!container) return;

    var sentinel = container.querySelector('.board-scroll-sentinel');
    if (B.state.hasMore) {
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
      if (B._scrollObserver) { B._scrollObserver.disconnect(); B._scrollObserver = null; }
    }
  }

  // ─── setupScrollObserver ───

  function setupScrollObserver() {
    // 기존 Observer 정리
    if (B._scrollObserver) { B._scrollObserver.disconnect(); B._scrollObserver = null; }

    var sentinel = document.getElementById('boardScrollSentinel');
    if (!sentinel || !B.state.hasMore) return;

    B._scrollObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !B._isLoadingMore && B.state.hasMore) {
        B.handleLoadMore();
      }
    }, { rootMargin: '200px' });

    B._scrollObserver.observe(sentinel);
  }

  // ─── Export to B namespace ───

  B.getBoardTitle = getBoardTitle;
  B.renderPostCard = renderPostCard;
  B.renderPostCards = renderPostCards;
  B.renderListItems = renderListItems;
  B.checkExpandButtons = checkExpandButtons;
  B.prependCard = prependCard;
  B.replaceCard = replaceCard;
  B.removeCard = removeCard;
  B.appendCards = appendCards;
  B.updateLoadMoreButton = updateLoadMoreButton;
  B.setupScrollObserver = setupScrollObserver;

})(window._B);
