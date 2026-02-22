// ============================================
// Korean Poetry Timeline Renderer
// ============================================

/**
 * XSS 방지: HTML 특수문자 이스케이프
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 타임라인 데이터 로드
 */
async function loadTimeline() {
  try {
    const response = await fetch('/public/index/korean_timeline.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    renderTimeline(data);
    initNavigation();
  } catch (error) {
    console.error('타임라인 데이터 로드 실패:', error);
    const container = document.getElementById('timeline-content');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
          <p style="font-size: 18px; margin-bottom: 10px;">타임라인을 불러올 수 없습니다.</p>
          <p style="font-size: 14px;">페이지를 새로고침하거나 나중에 다시 시도해주세요.</p>
        </div>
      `;
    }
  }
}

/**
 * 타임라인 전체 렌더링
 */
function renderTimeline(data) {
  const container = document.getElementById('timeline-content');
  if (!container) return;

  let html = '';

  if (data.eras && Array.isArray(data.eras)) {
    data.eras.forEach(era => {
      html += `<section id="era-${escapeHTML(era.id)}" class="era-section">`;
      html += `<h2 class="chapter-title">${escapeHTML(era.name)}</h2>`;

      // 시인별 아코디언 카드
      if (era.poets && Array.isArray(era.poets)) {
        era.poets.forEach(poet => {
          html += renderPoetCard(poet);
        });
      }

      // 고아 작품 (research_poets에 없는 시인)
      if (era.orphanPoems && era.orphanPoems.length > 0) {
        html += renderOrphanSection(era.orphanPoems);
      }

      html += `</section>`;
    });
  }

  container.innerHTML = html;
}

/**
 * 시인 카드 렌더링 (아코디언 — 기본 접힘)
 */
function renderPoetCard(poet) {
  let html = `<details class="poet-card">`;

  // ── Summary (접힘 헤더): 이름 + 한자 + 생몰년 한 줄 ──
  html += `<summary class="poet-header">`;
  html += `<span class="poet-name">${escapeHTML(poet.name?.ko || '')}</span>`;
  if (poet.name?.hanja && poet.name.hanja !== '미상') {
    html += `<span class="poet-hanja">${escapeHTML(poet.name.hanja)}</span>`;
  }
  if (poet.birth_death) {
    html += `<span class="poet-dates">${escapeHTML(poet.birth_death)}</span>`;
  }
  html += `</summary>`;

  // ── 펼침 콘텐츠 ──
  html += `<div class="poet-detail">`;

  // 짧은 bio
  if (poet.bio) {
    html += `<p class="poet-bio">${escapeHTML(poet.bio)}</p>`;
  }

  // bio_detail (상세 약력)
  if (poet.bio_detail) {
    html += `<div class="poet-bio-detail">${escapeHTML(poet.bio_detail)}</div>`;
  }

  // 작품 전문
  if (poet.fullPoems && poet.fullPoems.length === 1) {
    // 1수: 바로 펼쳐서 표시
    html += renderPoemFull(poet.fullPoems[0]);
  } else if (poet.fullPoems && poet.fullPoems.length >= 2) {
    // 2수 이상: 제목만 보여주고 접이식
    poet.fullPoems.forEach(poem => {
      html += `<details class="poem-accordion">`;
      html += `<summary class="poem-accordion-header">`;
      if (poem.title?.한자) {
        html += `<span class="poem-title-hanja">${escapeHTML(poem.title.한자)}</span>`;
      }
      if (poem.title?.한글) {
        html += `<span class="poem-title-hangul">${escapeHTML(poem.title.한글)}</span>`;
      }
      html += `</summary>`;
      html += renderPoemFull(poem, true);
      html += `</details>`;
    });
  }

  // 저서 혹은 참여문집
  if (poet.otherWorks && poet.otherWorks.length > 0) {
    html += `<details class="other-works">`;
    html += `<summary>저서 혹은 참여문집 (${poet.otherWorks.length}건)</summary>`;
    html += `<ul class="other-works-list">`;
    poet.otherWorks.forEach(work => {
      html += `<li>`;
      html += escapeHTML(work.titleKo || '');
      if (work.titleHanja) {
        html += ` <span class="poem-title-hanja">(${escapeHTML(work.titleHanja)})</span>`;
      }
      if (work.source) {
        html += ` — ${escapeHTML(work.source)}`;
      }
      html += `</li>`;
    });
    html += `</ul></details>`;
  }

  html += `</div>`;
  html += `</details>`;
  return html;
}

/**
 * 시 전문 렌더링 (2컬럼 그리드 + 번역 + 해설)
 * @param {boolean} skipTitle - 아코디언 헤더에 제목이 있으면 true
 */
function renderPoemFull(poem, skipTitle) {
  let html = `<div class="poem-item">`;

  // 제목 (아코디언 안에서는 생략)
  if (!skipTitle) {
    html += `<h3 class="poem-title">`;
    if (poem.title?.한자) {
      html += `<span class="poem-title-hanja">${escapeHTML(poem.title.한자)}</span>`;
    }
    if (poem.title?.한글) {
      html += `<span class="poem-title-hangul">${escapeHTML(poem.title.한글)}</span>`;
    }
    html += `</h3>`;
  }

  // 2컬럼 그리드: 왼쪽 본문(한자) / 오른쪽 독음(한글)
  if (poem.content) {
    html += `<div class="poem-grid">`;
    html += `<pre class="poem-content">${escapeHTML(poem.content)}</pre>`;
    if (poem.pronunciation) {
      html += `<div class="poem-pronunciation">${escapeHTML(poem.pronunciation)}</div>`;
    }
    html += `</div>`;
  }

  // 번역
  if (poem.translation && poem.translation.trim()) {
    html += `<div class="poem-translation-label">번역</div>`;
    html += `<div class="poem-translation">${escapeHTML(poem.translation)}</div>`;
  }

  // 해설 (있으면 표시, 없으면 플레이스홀더)
  const hasCommentary = poem.commentary && poem.commentary.trim();
  html += `<div class="poem-commentary-label">해설</div>`;
  if (hasCommentary) {
    html += `<div class="poem-commentary" style="color:#3a4a50;font-style:normal;">${escapeHTML(poem.commentary)}</div>`;
  } else {
    html += `<div class="poem-commentary">해설이 준비 중입니다.</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * 고아 작품 섹션 렌더링 (작자별 그룹화)
 */
function renderOrphanSection(orphanPoems) {
  const groupedByAuthor = {};
  orphanPoems.forEach(item => {
    const authorName = item.authorName || '작자 미상';
    if (!groupedByAuthor[authorName]) {
      groupedByAuthor[authorName] = [];
    }
    groupedByAuthor[authorName].push(item);
  });

  let html = `<div class="orphan-section">`;
  html += `<h3 class="orphan-section-title">작자미상 및 기타 작품</h3>`;

  Object.keys(groupedByAuthor).forEach(authorName => {
    const items = groupedByAuthor[authorName];

    html += `<details class="poet-card">`;
    html += `<summary class="poet-header">`;
    html += `<span class="poet-name">${escapeHTML(authorName)}</span>`;
    html += `</summary>`;
    html += `<div class="poet-detail">`;

    if (items[0].bio) {
      html += `<p class="poet-bio">${escapeHTML(items[0].bio)}</p>`;
    }

    const poems = items.filter(item => item.poem).map(item => item.poem);
    if (poems.length === 1) {
      html += renderPoemFull(poems[0]);
    } else if (poems.length >= 2) {
      poems.forEach(poem => {
        html += `<details class="poem-accordion">`;
        html += `<summary class="poem-accordion-header">`;
        if (poem.title?.한자) {
          html += `<span class="poem-title-hanja">${escapeHTML(poem.title.한자)}</span>`;
        }
        if (poem.title?.한글) {
          html += `<span class="poem-title-hangul">${escapeHTML(poem.title.한글)}</span>`;
        }
        html += `</summary>`;
        html += renderPoemFull(poem, true);
        html += `</details>`;
      });
    }

    html += `</div></details>`;
  });

  html += `</div>`;
  return html;
}

/**
 * 네비게이션 초기화 (사이드바 링크 클릭 + 스크롤 감지)
 */
function initNavigation() {
  const sectionLinks = document.querySelectorAll('.era-tree-link[href^="#"]');

  // 클릭 → 부드러운 스크롤
  sectionLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      if (targetId) {
        const target = document.querySelector(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // IntersectionObserver: 스크롤 위치에 따라 사이드바 active 전환
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionLinks.forEach(l => l.classList.remove('active'));
        const sectionId = entry.target.getAttribute('id');
        if (sectionId) {
          const activeLink = document.querySelector(`.era-tree-link[href="#${sectionId}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      }
    });
  }, {
    root: null,
    rootMargin: '-100px 0px -60% 0px',
    threshold: 0
  });

  document.querySelectorAll('.era-section').forEach(section => {
    observer.observe(section);
  });
}

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadTimeline();
});
