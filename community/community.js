/**
 * community.js
 * 커뮤니티 메인 페이지 — 게시판 미리보기 + 사이드바 네비게이션
 *
 * 역할:
 * - Supabase에서 각 게시판의 최신 글 가져오기
 * - 테이블/카드형 미리보기 렌더
 * - 사이드바 네비게이션 인터랙션 (스크롤 연동)
 */

// ========================================
// 1. XSS 방지
// ========================================
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================================
// 2. 날짜 포맷
// ========================================
function formatDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // 오늘이면 "HH:MM"
  if (targetDate.getTime() === today.getTime()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 올해면 "MM.DD"
  if (date.getFullYear() === now.getFullYear()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  }

  // 그 외 "YY.MM.DD"
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// ========================================
// 3. Supabase 미리보기 데이터 가져오기
// ========================================
async function fetchPreview(boardName, limit, orderBy = 'created_at') {
  if (!window.sb) {
    console.error('Supabase가 초기화되지 않았습니다');
    return [];
  }

  let query = window.sb
    .from('posts')
    .select('id, title, created_at, view_count, profiles:author_id(nickname), likes(count), comments(count)')
    .eq('board', boardName);

  if (orderBy === 'likes') {
    // 추천수 높은 순 — Supabase에서 aggregate 정렬이 안되므로,
    // 많이 가져와서 JS에서 정렬
    query = query.order('created_at', { ascending: false }).limit(20);
  } else {
    query = query.order('created_at', { ascending: false }).limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`fetchPreview(${boardName}) error:`, error);
    return [];
  }

  if (orderBy === 'likes' && data) {
    // likes count로 정렬 후 상위 limit개
    data.sort((a, b) => {
      const aLikes = a.likes?.[0]?.count || 0;
      const bLikes = b.likes?.[0]?.count || 0;
      return bLikes - aLikes;
    });
    return data.slice(0, limit);
  }

  return data || [];
}

// ========================================
// 4. 창작마당 미리보기 (시 제목 포함)
// ========================================
async function fetchShowcasePreview(limit) {
  if (!window.sb) {
    console.error('Supabase가 초기화되지 않았습니다');
    return [];
  }

  const { data, error } = await window.sb
    .from('posts')
    .select('id, title, poem_title, created_at, profiles:author_id(nickname), likes(count)')
    .eq('board', 'showcase')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('fetchShowcasePreview error:', error);
    return [];
  }

  if (!data) return [];

  // 추천수 높은 순 정렬
  data.sort((a, b) => {
    const aLikes = a.likes?.[0]?.count || 0;
    const bLikes = b.likes?.[0]?.count || 0;
    return bLikes - aLikes;
  });

  return data.slice(0, limit);
}

// ========================================
// 5. 테이블형 미리보기 렌더
// ========================================
function renderPreviewTable(posts, containerId, boardPath) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} not found`);
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="comm-empty-msg">아직 글이 없습니다</div>';
    return;
  }

  let html = '<table class="preview-table">';

  posts.forEach(post => {
    const views = post.view_count || 0;
    const commentCount = post.comments?.[0]?.count || 0;
    const commentBadge = commentCount > 0 ? ` <span class="preview-comment-count">[${commentCount}]</span>` : '';

    html += `<tr onclick="location.href='${boardPath}'">`;
    html += `<td class="preview-td-title">${escapeHTML(post.title)}${commentBadge}</td>`;
    html += `<td class="preview-td-stats">${views > 0 ? '조회 ' + views : ''}</td>`;
    html += `</tr>`;
  });

  html += '</table>';

  container.innerHTML = html;
}

// ========================================
// 6. 카드형 미리보기 렌더 (창작마당)
// ========================================
function renderShowcasePreview(posts, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} not found`);
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="comm-empty-msg">아직 작품이 없습니다</div>';
    container.classList.remove('comm-showcase-grid');
    return;
  }

  let html = '';

  posts.forEach(post => {
    const nickname = post.profiles?.nickname || '익명';
    const likes = post.likes?.[0]?.count || 0;
    const displayTitle = post.poem_title || post.title || '';

    html += `<div class="showcase-card" onclick="location.href='/community/showcase/'">`;
    html += `<div class="showcase-card-title">${escapeHTML(displayTitle)}</div>`;
    html += `<div class="showcase-card-author">${escapeHTML(nickname)}</div>`;
    if (likes > 0) {
      html += `<div class="showcase-card-likes">♥ ${likes}</div>`;
    }
    html += `</div>`;
  });

  container.innerHTML = html;
}

// ========================================
// 7. 뉴스 미리보기 (news_articles.json)
// ========================================
async function fetchNewsPreview(limit) {
  try {
    const res = await fetch('/public/index/news_articles.json');
    if (!res.ok) return [];
    const payload = await res.json();
    const articles = Array.isArray(payload?.articles) ? payload.articles : (Array.isArray(payload) ? payload : []);
    return articles
      .slice()
      .sort((a, b) => new Date(b.crawledAt || b.publishedAt || 0) - new Date(a.crawledAt || a.publishedAt || 0))
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

function renderNewsPreview(articles, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!articles || articles.length === 0) {
    container.innerHTML = '<div class="comm-placeholder-msg">준비 중입니다</div>';
    return;
  }

  let html = '<table class="preview-table">';
  articles.forEach(a => {
    const title = escapeHTML(a.title || '제목 없음');
    const date = formatDate(a.publishedAt || a.crawledAt);
    const url = a.sourceUrl || '#';

    html += `<tr onclick="window.open('${url}','_blank')">`;
    html += `<td class="preview-td-title">${title}</td>`;
    html += `<td class="preview-td-stats">${date}</td>`;
    html += `</tr>`;
  });
  html += '</table>';
  container.innerHTML = html;
}

// ========================================
// 8. 커뮤니티 초기화
// ========================================
async function initCommunity() {
  try {
    // 5개 섹션 미리보기 병렬 로드
    const [noticeData, forumData, qnaData, showcaseData, newsData] = await Promise.all([
      fetchPreview('notice', 3),
      fetchPreview('forum', 6),
      fetchPreview('qna', 6),
      fetchShowcasePreview(4),
      fetchNewsPreview(5)
    ]);

    renderPreviewTable(noticeData, 'preview-notice', '/community/notice/');
    renderPreviewTable(forumData, 'preview-forum', '/community/forum/');
    renderPreviewTable(qnaData, 'preview-qna', '/community/qna/');
    renderShowcasePreview(showcaseData, 'preview-showcase');
    renderNewsPreview(newsData, 'preview-news');

  } catch (error) {
    console.error('커뮤니티 미리보기 로드 실패:', error);
  }
}

// ========================================
// 8. 사이드바 — 현재 페이지 active 표시
// ========================================
function initSidebarNav() {
  // 현재 URL 경로와 일치하는 메뉴 항목에 active 클래스 추가
  const currentPath = location.pathname;
  document.querySelectorAll('.comm-menu-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

// ========================================
// 9. DOMContentLoaded
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initCommunity();
  initSidebarNav();
});
