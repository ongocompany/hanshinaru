// =============================================================
//  board/showcase.js — showcase 갤러리 렌더링 + 시 모달
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── renderShowcaseCards ───

  function renderShowcaseCards(posts) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      html += renderShowcaseCard(posts[i]);
    }
    return html;
  }

  // ─── renderShowcaseCard ───

  function renderShowcaseCard(post) {
    var postId = post.id;
    var nickname = B.escapeHTML(B.getProfileNickname(post));
    var likeCount = post.like_count || 0;
    var poemFontClass = post.font_style ? ('poem-font-' + post.font_style) : '';

    // 배경 CSS
    var bgCss = '';
    console.log('[renderShowcaseCard] post #' + postId + ' → bg_type:', post.bg_type, ', bg_image_url:', post.bg_image_url ? post.bg_image_url.substring(0, 60) : 'null');
    if (post.bg_type === 'template' && post.bg_template_id && B.bgTemplates) {
      var tpl = B.bgTemplates.find(function (t) { return t.id === post.bg_template_id; });
      if (tpl && tpl.css) bgCss = tpl.css;
    } else if (post.bg_type === 'ai' && post.bg_image_url) {
      var displayUrl = B.getDisplayBgUrl(post.bg_image_url);
      bgCss = "background-image: url('" + B.escapeHTML(displayUrl) + "'); background-size: cover; background-position: center;";
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
      html += '      <div class="showcase-card-poem-title">' + B.escapeHTML(post.poem_title) + '</div>';
    }
    if (poemPreview) {
      html += '      <div class="showcase-card-poem-preview">' + B.nl2br(B.escapeHTML(poemPreview)) + '</div>';
    }
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="showcase-card-info">';
    html += '    <span class="showcase-card-author">' + nickname + '</span>';
    if (likeCount > 0) {
      html += '    <span class="showcase-card-likes">' + B.ICONS.heartFilled + ' ' + likeCount + '</span>';
    }
    html += '  </div>';
    html += '</div>';

    return html;
  }

  // ─── showPoemModal ───

  function showPoemModal(postId) {
    var post = B.state.posts.find(function (p) { return String(p.id) === String(postId); });
    if (!post) return;

    var nickname = B.escapeHTML(B.getProfileNickname(post));
    var time = B.timeAgo(post.created_at);
    var likeCount = post.like_count || 0;
    var liked = B.state.likedPostIds.has(postId);
    var poemFontClass = post.font_style ? ('poem-font-' + post.font_style) : '';
    var isOwner = B.isPostOwner(post) || B.isAdmin();

    // 배경 CSS
    var bgCss = '';
    if (post.bg_type === 'template' && post.bg_template_id && B.bgTemplates) {
      var tpl = B.bgTemplates.find(function (t) { return t.id === post.bg_template_id; });
      if (tpl && tpl.css) bgCss = tpl.css;
    } else if (post.bg_type === 'ai' && post.bg_image_url) {
      var modalDisplayUrl = B.getDisplayBgUrl(post.bg_image_url);
      bgCss = "background-image: url('" + B.escapeHTML(modalDisplayUrl) + "'); background-size: cover; background-position: center;";
    }
    if (!bgCss) bgCss = 'background: linear-gradient(135deg, #F5E6C8 0%, #EDD9A8 50%, #F0DEB8 100%);';

    // 작시메모 렌더링
    var notesHtml = '';
    if (post.poem_notes) {
      notesHtml = post.poem_notes.charAt(0) === '<'
        ? post.poem_notes
        : B.nl2br(B.escapeHTML(post.poem_notes));
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
      html += '        <div class="poem-modal-poem-title">' + B.escapeHTML(post.poem_title) + '</div>';
    }
    if (post.poem_body) {
      html += '        <div class="poem-modal-poem-body">' + B.nl2br(B.escapeHTML(post.poem_body)) + '</div>';
    }
    html += '      </div>';
    html += '    </div>';

    // 하단 정보 영역
    html += '    <div class="poem-modal-info">';

    // 번역
    if (post.poem_translation) {
      html += '      <div class="poem-modal-translation">';
      html += '        <h4>번역</h4>';
      html += '        <p>' + B.nl2br(B.escapeHTML(post.poem_translation)) + '</p>';
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
    html += '          <strong>' + nickname + '</strong> · ' + B.escapeHTML(time);
    html += '        </div>';
    html += '        <div class="poem-modal-actions">';
    html += '          <button class="poem-modal-action-btn' + (liked ? ' liked' : '') + '" data-action="like" data-post-id="' + postId + '">';
    html += (liked ? B.ICONS.heartFilled : B.ICONS.heartOutline) + ' ' + likeCount;
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
        B.handleLike(pid, actionEl);
      } else if (act === 'edit') {
        closeModal();
        B.handleEdit(pid);
      } else if (act === 'delete') {
        closeModal();
        B.handleDelete(pid);
      }
    });

    // 페이드인
    requestAnimationFrame(function () {
      overlay.classList.add('visible');
    });
  }

  // ─── Export to B namespace ───

  B.renderShowcaseCards = renderShowcaseCards;
  B.showPoemModal = showPoemModal;

})(window._B);
