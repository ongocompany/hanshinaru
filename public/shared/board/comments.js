// =============================================================
//  board/comments.js — 댓글 렌더링
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── Render.comments ───

  B.Render.comments = function (postId, comments) {
    var wrapper = document.getElementById('comments-' + postId);
    if (!wrapper) return;

    var html = '';

    // 댓글 헤더
    html += '<div class="board-comments-header">💬 댓글 ' + comments.length + '</div>';

    // 댓글 입력 폼 (로그인 시만)
    if (B.state.currentUser) {
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

  // ─── renderCommentItem ───

  function renderCommentItem(comment, postId, isReply) {
    var nickname = B.escapeHTML(
      (comment.profiles && comment.profiles.nickname) ? comment.profiles.nickname : '익명'
    );
    var time = B.timeAgo(comment.created_at);
    var canDelete = B.isCommentOwner(comment) || B.isAdmin();

    var html = '';
    html += '<div class="board-comment-item' + (isReply ? ' reply' : '') + '" id="comment-' + comment.id + '">';

    // 댓글 헤더
    html += '  <div class="board-comment-header">';
    html += '    <span class="board-comment-author">' + nickname + '</span>';
    html += '    <span class="board-comment-date">' + B.escapeHTML(time) + '</span>';

    // 답글 버튼 (로그인 시만, 최상위 댓글에만)
    if (B.state.currentUser && !isReply) {
      html += '    <button class="board-comment-reply-btn" data-action="reply" data-comment-id="' + comment.id + '" data-post-id="' + postId + '" data-author="' + nickname + '">답글</button>';
    }

    // 삭제 버튼
    if (canDelete) {
      html += '    <button class="board-comment-delete-btn" data-action="delete-comment" data-comment-id="' + comment.id + '" data-post-id="' + postId + '">삭제</button>';
    }

    html += '  </div>';

    // 댓글 본문
    html += '  <div class="board-comment-body">' + B.nl2br(B.escapeHTML(comment.body)) + '</div>';

    html += '</div>';

    return html;
  }

})(window._B);
