/* ============================================
   한시나루 아티클 에디터
   Supabase REST API + Quill WYSIWYG
   ============================================ */

(function () {
  'use strict';

  // ── Supabase 설정 ──
  const SB_URL = 'https://iplxexvmrnzlqglfqrpg.supabase.co';
  const SB_KEY = 'sb_publishable_SBqquD4OkM6a93H3dMPNRQ_X5JChwWI';
  const REST = SB_URL + '/rest/v1';
  const STORAGE = SB_URL + '/storage/v1';
  const HEADERS = {
    apikey: SB_KEY,
    Authorization: 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
  };

  let sb = null; // supabase client (auth용)
  let accessToken = null; // 로그인 후 토큰

  // ── 상태 ──
  let articles = [];
  let currentId = null;
  let quill = null;

  // ── DOM ──
  const $ = (s) => document.querySelector(s);
  const articleList = $('#articleList');
  const editorEmpty = $('#editorEmpty');
  const editorWrap = $('#editorWrap');
  const filterSection = $('#filterSection');
  const filterSearch = $('#filterSearch');
  const toast = $('#toast');

  // ── 메뉴 트리 ──
  let menuItems = [];

  async function loadMenuTree() {
    const res = await fetch(
      `${REST}/site_menu?select=id,section,label,path,parent_id,sort_order,is_top_menu&order=sort_order.asc`,
      { headers: HEADERS },
    );
    menuItems = await res.json();
    renderMenuSelect();
  }

  function renderMenuSelect() {
    const sel = $('#fieldMenuPath');
    sel.innerHTML = '<option value="">-- 메뉴에서 선택 --</option>';

    // 트리 구조 만들기
    const byId = new Map();
    for (const m of menuItems) byId.set(m.id, m);

    const roots = menuItems.filter((m) => !m.is_top_menu && (m.parent_id === null || byId.get(m.parent_id)?.is_top_menu));

    // section별 그룹
    const sectionLabels = {
      'chinese-poetry': '중국 시문학',
      'korean-poetry': '한국의 한시',
      community: '커뮤니티',
      hanja: '한자와 한문',
      'writing-helper': '작성도우미',
    };

    const sections = [...new Set(roots.map((r) => r.section))];
    for (const sec of sections) {
      const group = document.createElement('optgroup');
      group.label = sectionLabels[sec] || sec;

      const sectionRoots = roots.filter((r) => r.section === sec);
      for (const root of sectionRoots) {
        addMenuOption(group, root, 0, byId);
      }
      sel.appendChild(group);
    }
  }

  function addMenuOption(parent, node, depth, byId) {
    const prefix = '\u00A0\u00A0'.repeat(depth);
    const opt = document.createElement('option');
    const slug = node.path.replace(/^\/|\/$/g, '');
    opt.value = JSON.stringify({ slug, section: node.section });
    opt.textContent = prefix + (depth > 0 ? '└ ' : '') + node.label;
    parent.appendChild(opt);

    // 자식 찾기
    const children = menuItems
      .filter((m) => m.parent_id === node.id && !m.is_top_menu)
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const child of children) {
      addMenuOption(parent, child, depth + 1, byId);
    }
  }

  // ── 인증 ──
  async function ensureAuth() {
    sb = supabase.createClient(SB_URL, SB_KEY);
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      updateAuthHeaders(session.access_token);
      return;
    }

    const email = prompt('관리자 이메일:');
    if (!email) return;
    const pw = prompt('비밀번호:');
    if (!pw) return;

    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) {
      alert('로그인 실패: ' + error.message);
      return ensureAuth();
    }
    updateAuthHeaders(data.session.access_token);
  }

  function updateAuthHeaders(token) {
    HEADERS.Authorization = 'Bearer ' + token;
  }

  // ── 초기화 ──
  async function init() {
    await ensureAuth();
    initQuill();
    bindEvents();
    resizeEditor();
    window.addEventListener('resize', resizeEditor);
    await Promise.all([loadArticles(), loadMenuTree()]);
  }

  // ── Quill 에디터 ──
  function initQuill() {
    quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: '본문을 작성하세요...',
      modules: {
        toolbar: {
          container: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['clean'],
          ],
          handlers: {
            image: imageHandler,
          },
        },
      },
    });
  }

  // 이미지 핸들러: 파일 선택 → Storage 업로드 → URL 삽입
  function imageHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const ext = file.name.split('.').pop();
      const name = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;

      showToast('이미지 업로드 중...');

      const res = await fetch(`${STORAGE}/object/article-images/${name}`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: HEADERS.Authorization,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!res.ok) {
        showToast('업로드 실패');
        return;
      }

      const url = `${STORAGE}/object/public/article-images/${name}`;
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
      showToast('이미지 삽입 완료');
    };
    input.click();
  }

  // ── 아티클 목록 ──
  async function loadArticles() {
    const res = await fetch(
      `${REST}/articles?select=id,title,slug,section,status,updated_at&order=updated_at.desc`,
      { headers: HEADERS },
    );
    articles = await res.json();
    renderList();
  }

  function renderList() {
    const section = filterSection.value;
    const search = filterSearch.value.toLowerCase();

    const filtered = articles.filter((a) => {
      if (section && a.section !== section) return false;
      if (search && !a.title.toLowerCase().includes(search) && !a.slug.toLowerCase().includes(search)) return false;
      return true;
    });

    articleList.innerHTML = filtered
      .map(
        (a) => `
      <div class="article-item ${a.id === currentId ? 'active' : ''}" data-id="${a.id}">
        <div class="title">
          <span class="status-dot ${a.status}"></span>
          ${escHtml(a.title)}
        </div>
        <div class="meta">
          <span>${sectionLabel(a.section)}</span>
          <span>${timeAgo(a.updated_at)}</span>
        </div>
      </div>`,
      )
      .join('');
  }

  // ── 아티클 선택/편집 ──
  async function selectArticle(id) {
    currentId = id;
    renderList();

    const res = await fetch(`${REST}/articles?id=eq.${id}&select=*`, { headers: HEADERS });
    const rows = await res.json();
    if (!rows.length) return;

    const a = rows[0];
    $('#fieldTitle').value = a.title || '';
    $('#fieldSubtitle').value = a.subtitle || '';
    $('#fieldSlug').value = a.slug || '';
    $('#fieldSection').value = a.section || 'chinese-poetry';
    $('#fieldStatus').value = a.status || 'draft';
    $('#fieldCover').value = a.cover_image || '';

    // Quill 1.3: convert(html_string)
    quill.setContents([]);
    if (a.body) {
      const delta = quill.clipboard.convert(a.body);
      quill.setContents(delta);
    }

    // 메뉴 드롭다운에서 slug 매칭
    const menuSel = $('#fieldMenuPath');
    menuSel.value = '';
    for (const opt of menuSel.options) {
      if (!opt.value) continue;
      try {
        const { slug: optSlug } = JSON.parse(opt.value);
        if (optSlug === a.slug) { menuSel.value = opt.value; break; }
      } catch (_) {}
    }

    editorEmpty.style.display = 'none';
    editorWrap.style.display = 'flex';
    requestAnimationFrame(resizeEditor);
  }

  // ── 새 아티클 ──
  async function createArticle() {
    const body = {
      title: '새 아티클',
      slug: 'new-' + Date.now(),
      section: filterSection.value || 'chinese-poetry',
      status: 'draft',
      body: '',
    };

    const res = await fetch(`${REST}/articles`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      showToast('생성 실패: ' + res.statusText);
      return;
    }

    const rows = await res.json();
    await loadArticles();
    if (rows[0]) selectArticle(rows[0].id);
    showToast('새 아티클 생성');
  }

  // ── 저장 ──
  async function saveArticle(status) {
    if (!currentId) return;

    const body = {
      title: $('#fieldTitle').value.trim(),
      subtitle: $('#fieldSubtitle').value.trim() || null,
      slug: $('#fieldSlug').value.trim(),
      section: $('#fieldSection').value,
      status: status || $('#fieldStatus').value,
      cover_image: $('#fieldCover').value.trim() || null,
      body: quill.root.innerHTML,
    };

    if (!body.title || !body.slug) {
      showToast('제목과 슬러그는 필수입니다');
      return;
    }

    const res = await fetch(`${REST}/articles?id=eq.${currentId}`, {
      method: 'PATCH',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      showToast('저장 실패: ' + err);
      return;
    }

    await loadArticles();
    showToast(status === 'published' ? '발행 완료' : '저장 완료');
  }

  // ── 삭제 ──
  async function deleteArticle() {
    if (!currentId) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    await fetch(`${REST}/articles?id=eq.${currentId}`, {
      method: 'DELETE',
      headers: HEADERS,
    });

    currentId = null;
    editorWrap.style.display = 'none';
    editorEmpty.style.display = 'flex';
    await loadArticles();
    showToast('삭제 완료');
  }

  // ── 커버 이미지 업로드 ──
  async function uploadCover() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const ext = file.name.split('.').pop();
      const name = 'cover_' + Date.now() + '.' + ext;

      showToast('커버 업로드 중...');
      const res = await fetch(`${STORAGE}/object/article-images/${name}`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: HEADERS.Authorization,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (res.ok) {
        $('#fieldCover').value = `${STORAGE}/object/public/article-images/${name}`;
        showToast('커버 업로드 완료');
      } else {
        showToast('업로드 실패');
      }
    };
    input.click();
  }

  // ── 이벤트 바인딩 ──
  function bindEvents() {
    articleList.addEventListener('click', (e) => {
      const item = e.target.closest('.article-item');
      if (item) selectArticle(Number(item.dataset.id));
    });

    $('#btnNew').addEventListener('click', createArticle);
    $('#btnDraft').addEventListener('click', () => saveArticle('draft'));
    $('#btnPreview').addEventListener('click', openPreview);
    $('#btnPublish').addEventListener('click', () => saveArticle('published'));
    $('#btnDelete').addEventListener('click', deleteArticle);
    $('#btnUploadCover').addEventListener('click', uploadCover);

    filterSection.addEventListener('change', renderList);
    filterSearch.addEventListener('input', renderList);

    // 메뉴 관리
    $('#btnMenuMgr').addEventListener('click', openMenuManager);
    $('#menuModalClose').addEventListener('click', closeMenuManager);
    $('#menuModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeMenuManager(); });
    $('#menuSection').addEventListener('change', renderMenuTree);
    $('#menuTree').addEventListener('click', handleMenuTreeClick);
    $('#btnAddMenu').addEventListener('click', () => openMenuEdit(null));
    $('#menuEditClose').addEventListener('click', closeMenuEdit);
    $('#menuEditCancel').addEventListener('click', closeMenuEdit);
    $('#menuEditModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeMenuEdit(); });
    $('#menuEditSave').addEventListener('click', saveMenuEdit);

    // 메뉴 선택 → slug/section 자동 채우기
    $('#fieldMenuPath').addEventListener('change', (e) => {
      if (!e.target.value) return;
      try {
        const { slug, section } = JSON.parse(e.target.value);
        $('#fieldSlug').value = slug;
        $('#fieldSection').value = section;
      } catch (_) {}
    });
  }

  // ── 에디터 높이 조절 ──
  function resizeEditor() {
    const qlEditor = document.querySelector('.ql-editor');
    if (!qlEditor) return;
    const rect = qlEditor.getBoundingClientRect();
    const footerH = 52; // editor-footer 높이
    const available = window.innerHeight - rect.top - footerH;
    qlEditor.style.height = Math.max(200, available) + 'px';
    qlEditor.style.overflowY = 'auto';
  }

  // ── 미리보기 ──
  function openPreview() {
    const data = {
      title: $('#fieldTitle').value.trim(),
      subtitle: $('#fieldSubtitle').value.trim(),
      body: quill.root.innerHTML,
      cover_image: $('#fieldCover').value.trim(),
    };
    sessionStorage.setItem('article-preview', JSON.stringify(data));
    window.open('/admin/article-preview.html', '_blank');
  }

  // ── 메뉴 관리 ──
  let editingMenuId = null;

  function openMenuManager() {
    $('#menuModal').style.display = 'flex';
    renderMenuTree();
  }

  function closeMenuManager() {
    $('#menuModal').style.display = 'none';
  }

  function renderMenuTree() {
    const sec = $('#menuSection').value;
    const tree = $('#menuTree');

    const byId = new Map();
    for (const m of menuItems) byId.set(m.id, m);

    // 해당 섹션의 non-top 루트 아이템
    const roots = menuItems.filter(
      (m) => m.section === sec && !m.is_top_menu &&
        (m.parent_id === null || byId.get(m.parent_id)?.is_top_menu),
    ).sort((a, b) => a.sort_order - b.sort_order);

    let html = '';
    // 탑메뉴 아이템 먼저 표시
    const topItems = menuItems.filter((m) => m.section === sec && m.is_top_menu)
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const t of topItems) {
      html += menuItemHtml(t, 0, true);
    }
    html += '<hr style="margin:4px 0;border:none;border-top:1px solid #eee;">';

    for (const root of roots) {
      html += renderMenuNode(root, 0);
    }

    tree.innerHTML = html;
  }

  function renderMenuNode(node, depth) {
    let html = menuItemHtml(node, depth, false);
    const children = menuItems
      .filter((m) => m.parent_id === node.id && !m.is_top_menu)
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const c of children) {
      html += renderMenuNode(c, depth + 1);
    }
    return html;
  }

  function menuItemHtml(item, depth, isTop) {
    const dClass = depth > 0 ? ` mtree-d${Math.min(depth, 2)}` : '';
    return `
      <div class="mtree-item${dClass}" data-menu-id="${item.id}">
        <span class="mtree-label" data-action="edit">${escHtml(item.label)}</span>
        <span class="mtree-path">${item.path}</span>
        ${isTop ? '<span class="mtree-top-badge">탑메뉴</span>' : ''}
        <span class="mtree-actions">
          <button class="mtree-btn" data-action="up" title="위로">▲</button>
          <button class="mtree-btn" data-action="down" title="아래로">▼</button>
          <button class="mtree-btn danger" data-action="delete" title="삭제">✕</button>
        </span>
      </div>`;
  }

  // 메뉴 트리 이벤트 위임
  function handleMenuTreeClick(e) {
    const item = e.target.closest('[data-menu-id]');
    if (!item) return;
    const id = Number(item.dataset.menuId);
    const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;

    if (action === 'edit') openMenuEdit(id);
    else if (action === 'up') moveMenu(id, -1);
    else if (action === 'down') moveMenu(id, 1);
    else if (action === 'delete') deleteMenu(id);
  }

  // 순서 변경
  async function moveMenu(id, dir) {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return;

    // 같은 부모의 형제들
    const siblings = menuItems
      .filter((m) => m.parent_id === item.parent_id && m.section === item.section && m.is_top_menu === item.is_top_menu)
      .sort((a, b) => a.sort_order - b.sort_order);

    const idx = siblings.findIndex((m) => m.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const other = siblings[swapIdx];
    const tmpOrder = item.sort_order;
    item.sort_order = other.sort_order;
    other.sort_order = tmpOrder;

    // 같으면 강제로 차이 만들기
    if (item.sort_order === other.sort_order) {
      item.sort_order += dir;
    }

    await Promise.all([
      fetch(`${REST}/site_menu?id=eq.${item.id}`, {
        method: 'PATCH', headers: HEADERS,
        body: JSON.stringify({ sort_order: item.sort_order }),
      }),
      fetch(`${REST}/site_menu?id=eq.${other.id}`, {
        method: 'PATCH', headers: HEADERS,
        body: JSON.stringify({ sort_order: other.sort_order }),
      }),
    ]);

    await reloadMenus();
    showToast('순서 변경');
  }

  // 삭제
  async function deleteMenu(id) {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return;

    const children = menuItems.filter((m) => m.parent_id === id);
    const msg = children.length
      ? `"${item.label}" 및 하위 ${children.length}개 메뉴를 삭제하시겠습니까?`
      : `"${item.label}" 메뉴를 삭제하시겠습니까?`;
    if (!confirm(msg)) return;

    await fetch(`${REST}/site_menu?id=eq.${id}`, { method: 'DELETE', headers: HEADERS });
    await reloadMenus();
    showToast('메뉴 삭제');
  }

  // 메뉴 추가/편집 모달
  function openMenuEdit(id) {
    editingMenuId = id || null;
    const modal = $('#menuEditModal');
    const sec = $('#menuSection').value;

    if (id) {
      const item = menuItems.find((m) => m.id === id);
      if (!item) return;
      $('#menuEditTitle').textContent = '메뉴 편집';
      $('#menuEditLabel').value = item.label;
      $('#menuEditPath').value = item.path;
      $('#menuEditTopMenu').checked = item.is_top_menu;
    } else {
      $('#menuEditTitle').textContent = '메뉴 추가';
      $('#menuEditLabel').value = '';
      $('#menuEditPath').value = '';
      $('#menuEditTopMenu').checked = false;
    }

    // 부모 메뉴 옵션
    const parentSel = $('#menuEditParent');
    parentSel.innerHTML = '<option value="">최상위</option>';
    const sectionMenus = menuItems.filter((m) => m.section === sec && !m.is_top_menu);
    for (const m of sectionMenus) {
      if (m.id === id) continue;
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.label;
      if (id && menuItems.find((x) => x.id === id)?.parent_id === m.id) opt.selected = true;
      parentSel.appendChild(opt);
    }

    modal.style.display = 'flex';
  }

  function closeMenuEdit() {
    $('#menuEditModal').style.display = 'none';
    editingMenuId = null;
  }

  async function saveMenuEdit() {
    const sec = $('#menuSection').value;
    const label = $('#menuEditLabel').value.trim();
    const path = $('#menuEditPath').value.trim();
    const parentId = $('#menuEditParent').value ? Number($('#menuEditParent').value) : null;
    const isTopMenu = $('#menuEditTopMenu').checked;

    if (!label || !path) {
      showToast('이름과 경로는 필수입니다');
      return;
    }

    const body = {
      section: sec,
      label,
      path,
      parent_id: parentId,
      is_top_menu: isTopMenu,
    };

    if (editingMenuId) {
      await fetch(`${REST}/site_menu?id=eq.${editingMenuId}`, {
        method: 'PATCH', headers: HEADERS,
        body: JSON.stringify(body),
      });
      showToast('메뉴 수정 완료');
    } else {
      // sort_order: 같은 부모의 마지막 +1
      const siblings = menuItems.filter(
        (m) => m.section === sec && m.parent_id === parentId && m.is_top_menu === isTopMenu,
      );
      body.sort_order = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sort_order)) + 1 : 1;

      await fetch(`${REST}/site_menu`, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify(body),
      });
      showToast('메뉴 추가 완료');
    }

    closeMenuEdit();
    await reloadMenus();
  }

  async function reloadMenus() {
    await loadMenuTree();
    renderMenuTree();
    renderMenuSelect();
  }

  // ── 유틸 ──
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function sectionLabel(s) {
    const map = {
      hansi: '한시',
      community: '커뮤니티',
      hanja: '한자와 한문',
      'writing-helper': '한시 도우미',
    };
    return map[s] || s;
  }

  function timeAgo(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    return d.toLocaleDateString('ko-KR');
  }

  // ── 시작 ──
  document.addEventListener('DOMContentLoaded', init);
})();
