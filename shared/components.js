// =============================================================
//  한시의모든것 — 공용 컴포넌트 로더 (shared/components.js)
//  네비게이션/푸터 자동 주입 + 드롭다운 + 스크롤 + fade-in
// =============================================================

(function () {
  'use strict';

  // ===== 1) 네비게이션 & 푸터 자동 주입 =====
  async function loadComponent(id, file) {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
      const res = await fetch('/shared/' + file + '?v=20260228');
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = await res.text();
      return el;
    } catch (e) {
      console.warn('[components] ' + file + ' 로드 실패:', e);
      return null;
    }
  }

  // ===== 2) 현재 페이지에 맞게 active 표시 =====
  function markActiveNav() {
    const path = location.pathname;
    const links = document.querySelectorAll('.nav-links a[href], .dropdown-panel a[href]');
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      // 정확 매치 또는 하위 경로 매치
      if (path === href || (href !== '/' && path.startsWith(href))) {
        a.classList.add('active');
        // 드롭다운 부모도 활성화
        const dropdown = a.closest('.nav-dropdown');
        if (dropdown) {
          const parentLink = dropdown.querySelector('.nav-link');
          if (parentLink) parentLink.classList.add('active');
        }
      }
    });
  }

  // ===== 3) 드롭다운 (모바일 터치 지원) =====
  function initDropdowns() {
    // 모바일: 터치로 드롭다운 토글
    document.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
      link.addEventListener('click', function (e) {
        // 640px 이하에서만 터치 토글
        if (window.innerWidth > 640) return;
        e.preventDefault();
        const dropdown = this.closest('.nav-dropdown');
        const wasOpen = dropdown.classList.contains('open');
        // 다른 드롭다운 닫기
        document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!wasOpen) dropdown.classList.add('open');
      });
    });

    // 바깥 클릭 시 닫기
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });
  }

  // ===== 4) 햄버거 메뉴 (모바일) =====
  function initHamburger() {
    const btn = document.getElementById('navHamburger');
    const links = document.getElementById('navLinks');
    if (!btn || !links) return;
    btn.addEventListener('click', () => {
      links.classList.toggle('mobile-open');
      // 아이콘 토글
      const isOpen = links.classList.contains('mobile-open');
      btn.innerHTML = isOpen
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  }

  // ===== 5) 스크롤 감지 (네비 배경 변경) =====
  function initScrollNav() {
    const nav = document.getElementById('topNav');
    if (!nav) return;
    // top-nav--dark 클래스가 없는 경우만 스크롤 감지 (메인페이지)
    if (nav.classList.contains('top-nav--dark')) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ===== 6) Fade-in 애니메이션 =====
  function initFadeIn() {
    if (!('IntersectionObserver' in window)) {
      // 폴백: 그냥 다 보이게
      document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // ===== 7) 네비 검색 말풍선 (JS 동적 생성) =====
  function initNavSearch() {
    const wrap = document.getElementById('navSearchWrap');
    if (!wrap) return;

    // 말풍선 DOM을 JS로 직접 생성 (innerHTML 파싱 이슈 우회)
    const bubble = document.createElement('div');
    bubble.className = 'nav-search-bubble';
    bubble.innerHTML = '<form class="nav-search-form" action="/search/" method="get">'
      + '<input type="text" name="q" class="nav-search-input" placeholder="시, 시인, 키워드 검색..." autocomplete="off">'
      + '</form>';
    wrap.appendChild(bubble);

    const form = bubble.querySelector('.nav-search-form');
    let hideTimer = null;

    function showBubble() {
      clearTimeout(hideTimer);
      bubble.classList.add('show');
      const input = bubble.querySelector('.nav-search-input');
      if (input) setTimeout(() => input.focus(), 100);
    }

    function hideBubble() {
      bubble.classList.remove('show');
    }

    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideBubble, 1000);
    }

    // 마우스 오버 → 보이기
    wrap.addEventListener('mouseenter', showBubble);

    // 마우스 떠남 → 2초 후 사라짐
    wrap.addEventListener('mouseleave', scheduleHide);

    // 입력 중이면 숨기지 않기
    bubble.addEventListener('focus', () => clearTimeout(hideTimer), true);
    bubble.addEventListener('input', () => clearTimeout(hideTimer));

    // 입력창 밖 클릭 시 즉시 닫기
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        clearTimeout(hideTimer);
        hideBubble();
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && bubble.classList.contains('show')) {
        clearTimeout(hideTimer);
        hideBubble();
      }
    });

    // 폼 제출 → /search/?q=...
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = form.querySelector('.nav-search-input').value.trim();
      if (q) location.href = '/search/?q=' + encodeURIComponent(q);
    });
  }

  // ===== 7-b) 사용자 메뉴 (로그인/아바타 — JS 동적 생성) =====
  function initUserMenu() {
    const navInner = document.querySelector('.nav-inner');
    if (!navInner) return;

    // nav-actions: 로그인 버튼만 생성 (아바타는 로그인 시 생성)
    const actions = document.createElement('div');
    actions.className = 'nav-actions';
    actions.id = 'navActions';

    const wrap = document.createElement('div');
    wrap.className = 'nav-user-wrap';
    wrap.id = 'navUserWrap';

    const loginBtn = document.createElement('button');
    loginBtn.className = 'nav-login-btn';
    loginBtn.id = 'navLoginBtn';
    loginBtn.textContent = '로그인';

    wrap.appendChild(loginBtn);
    actions.appendChild(wrap);
    navInner.appendChild(actions);

    // 바깥 클릭 → 유저 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        const bubble = wrap.querySelector('.nav-user-bubble');
        if (bubble) bubble.classList.remove('show');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const bubble = wrap.querySelector('.nav-user-bubble');
        if (bubble) bubble.classList.remove('show');
      }
    });

    // 로그인 버튼 → 로그인 페이지 이동
    loginBtn.addEventListener('click', () => {
      window.location.href = '/auth/';
    });
  }

  /**
   * 전역 API: 로그인 상태 반영
   * @param {object} user - { name, email, avatar? }
   * NavAuth.login({ name: '진', email: 'jin@example.com', avatar: '/path/to/img.jpg' })
   * NavAuth.logout()
   */
  window.NavAuth = {
    login: function (user) {
      const wrap = document.getElementById('navUserWrap');
      const loginBtn = document.getElementById('navLoginBtn');
      if (!wrap || !loginBtn) return;

      // 로그인 버튼 제거
      loginBtn.remove();

      // 기존 아바타/드롭다운 있으면 정리
      const old = wrap.querySelector('.nav-avatar-btn');
      if (old) old.remove();
      const oldBubble = wrap.querySelector('.nav-user-bubble');
      if (oldBubble) oldBubble.remove();

      // 아바타 버튼 생성
      const avatarBtn = document.createElement('button');
      avatarBtn.className = 'nav-avatar-btn';
      avatarBtn.id = 'navAvatarBtn';

      if (user.avatar) {
        const img = document.createElement('img');
        img.className = 'nav-avatar-img';
        img.src = user.avatar;
        img.alt = user.name || '';
        avatarBtn.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.className = 'nav-avatar-initial';
        span.textContent = (user.name || '?').charAt(0);
        avatarBtn.appendChild(span);
      }

      // 드롭다운 생성
      const bubble = document.createElement('div');
      bubble.className = 'nav-user-bubble';
      bubble.innerHTML =
        '<div class="nav-user-info">' +
          '<div class="nav-user-display-name">' + (user.name || '') + '</div>' +
          (user.email ? '<div class="nav-user-email">' + user.email + '</div>' : '') +
        '</div>' +
        '<a href="/mypage/">내 서재</a>' +
        '<a href="/settings/">설정</a>' +
        '<div class="nav-user-divider"></div>' +
        '<button class="nav-user-menu-item" id="navLogoutBtn">로그아웃</button>';

      wrap.appendChild(avatarBtn);
      wrap.appendChild(bubble);

      // 아바타 클릭 → 드롭다운 토글
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bubble.classList.toggle('show');
      });

      // 로그아웃 버튼
      bubble.querySelector('#navLogoutBtn').addEventListener('click', () => {
        window.NavAuth.logout();
      });
    },

    logout: async function () {
      // Supabase SDK가 로드된 경우 서버 세션도 정리
      if (window.sb) {
        try { await window.sb.auth.signOut(); } catch (e) { /* ignore */ }
      }
      // localStorage 세션 삭제
      try { localStorage.removeItem('sb-iplxexvmrnzlqglfqrpg-auth-token'); } catch (e) { /* ignore */ }

      const wrap = document.getElementById('navUserWrap');
      if (!wrap) return;

      // 아바타 + 드롭다운 제거
      const avatarBtn = wrap.querySelector('.nav-avatar-btn');
      if (avatarBtn) avatarBtn.remove();
      const bubble = wrap.querySelector('.nav-user-bubble');
      if (bubble) bubble.remove();

      // 로그인 버튼이 없으면 다시 생성
      if (!wrap.querySelector('.nav-login-btn')) {
        const loginBtn = document.createElement('button');
        loginBtn.className = 'nav-login-btn';
        loginBtn.id = 'navLoginBtn';
        loginBtn.textContent = '로그인';
        loginBtn.addEventListener('click', () => {
          window.location.href = '/auth/';
        });
        wrap.appendChild(loginBtn);
      }
    }
  };

  // ===== 초기화 =====
  document.addEventListener('DOMContentLoaded', async () => {
    // 네비 + 푸터 로딩
    await Promise.all([
      loadComponent('nav-placeholder', 'nav.html'),
      loadComponent('footer-placeholder', 'footer.html'),
    ]);

    // 메인페이지: 투명 네비 모드 (data-transparent 속성이 있으면)
    const navHolder = document.getElementById('nav-placeholder');
    if (navHolder && navHolder.hasAttribute('data-transparent')) {
      const topNav = document.getElementById('topNav');
      if (topNav) topNav.classList.remove('top-nav--dark');
    }

    // 네비 기능 초기화
    markActiveNav();
    initDropdowns();
    initHamburger();
    initScrollNav();
    initNavSearch();
    initUserMenu();

    // Auth state: localStorage에서 세션 읽어서 네비 아바타 표시
    if (window.AuthState) {
      const user = window.AuthState.getUser();
      if (user) {
        window.NavAuth.login({
          name: user.nickname,
          email: user.email,
          avatar: user.avatar,
        });

        // 프로필 미완성 체크 → /auth/setup/으로 리다이렉트
        // (auth, privacy, terms 페이지에서는 리다이렉트 안 함)
        var path = location.pathname;
        var skipPaths = ['/auth/', '/privacy/', '/terms/'];
        var shouldCheck = !skipPaths.some(function (p) { return path.startsWith(p); });
        if (shouldCheck && window.sb) {
          window.sb.from('profiles').select('profile_completed').eq('id', user.id).single().then(function (res) {
            if (res.data && res.data.profile_completed !== true) {
              location.href = '/auth/setup/';
            }
          }).catch(function () { /* 컬럼 없으면 무시 */ });
        }
      }
    }

    // 페이지 콘텐츠 애니메이션
    initFadeIn();
  });

})();
