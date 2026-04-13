/**
 * tree.js — AI Writer Site Tree Module
 * Renders the site menu tree and allows selecting a save location.
 * Depends on: db.js (DB global)
 */
var SiteTree = (() => {
  'use strict';

  let menuData = [];
  let selectedNode = null;
  let articleListCallback = null; // called when node is selected

  // ─── Load ─────────────────────────────────────────────────────────────────

  async function load() {
    if (typeof DB === 'undefined' || typeof DB.fetchMenuTree !== 'function') {
      console.warn('[SiteTree] DB.fetchMenuTree 사용 불가');
      return;
    }
    try {
      menuData = await DB.fetchMenuTree();
      render();
    } catch (err) {
      console.error('[SiteTree] 메뉴 로드 실패:', err);
      const container = document.getElementById('site-tree');
      if (container) {
        container.innerHTML = `<div class="tree-error">메뉴 로드 실패: ${err.message}</div>`;
      }
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  function render() {
    const container = document.getElementById('site-tree');
    if (!container) return;

    if (!menuData || menuData.length === 0) {
      container.innerHTML = '<div class="tree-empty">메뉴 항목 없음</div>';
      return;
    }

    container.innerHTML = buildTreeHTML(menuData, 0);
    bindTreeEvents(container);
  }

  function buildTreeHTML(nodes, level) {
    if (!nodes || nodes.length === 0) return '';
    return nodes.map(node => {
      if (node.disabled) return '';
      const hasChildren = node.children && node.children.length > 0;
      const indent = level * 12;
      const toggleIcon = hasChildren ? '▸' : '·';
      const childrenHTML = hasChildren ? buildTreeHTML(node.children, level + 1) : '';

      return `
        <div class="tree-node${hasChildren ? ' tree-node--has-children' : ''}"
             data-id="${node.id}"
             data-section="${_esc(node.section || '')}"
             data-path="${_esc(node.path || '')}"
             data-label="${_esc(node.label || '')}"
             style="padding-left: ${indent}px">
          <div class="tree-node__row" role="button" tabindex="0">
            <span class="tree-toggle">${toggleIcon}</span>
            <span class="tree-label">${_esc(node.label)}</span>
          </div>
          ${hasChildren ? `<div class="tree-children" style="display:none">${childrenHTML}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function bindTreeEvents(container) {
    container.addEventListener('click', e => {
      const row = e.target.closest('.tree-node__row');
      if (!row) return;
      const node = row.closest('.tree-node');
      if (!node) return;

      // Toggle expand/collapse if has children
      const childrenEl = node.querySelector(':scope > .tree-children');
      if (childrenEl) {
        const toggle = row.querySelector('.tree-toggle');
        const isOpen = childrenEl.style.display !== 'none';
        childrenEl.style.display = isOpen ? 'none' : 'block';
        if (toggle) toggle.textContent = isOpen ? '▸' : '▾';
      }

      // Select this node
      container.querySelectorAll('.tree-node__row.selected').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');

      selectedNode = {
        id:      parseInt(node.dataset.id, 10),
        section: node.dataset.section,
        path:    node.dataset.path,
        label:   node.dataset.label,
      };

      // Notify app of selection
      _onNodeSelected(selectedNode);
    });

    // Keyboard support
    container.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const row = e.target.closest('.tree-node__row');
        if (row) { e.preventDefault(); row.click(); }
      }
    });
  }

  function _onNodeSelected(node) {
    // Update the article location display
    const locationEl = document.getElementById('tree-selected-location');
    if (locationEl) {
      locationEl.textContent = node.label || node.path || node.section;
    }

    // Show selected info box
    const selectedInfo = document.getElementById('tree-selected-info');
    if (selectedInfo) selectedInfo.classList.add('visible');

    // Show articles panel for this section
    const articlesPanel = document.getElementById('tree-articles-panel');
    if (articlesPanel && node.section) {
      articlesPanel.style.display = '';
      _loadArticlesForNode(node);
    }
  }

  async function _loadArticlesForNode(node) {
    const listEl = document.getElementById('tree-articles-list');
    if (!listEl) return;

    if (!node.section) {
      listEl.innerHTML = '<div class="tree-articles-msg">섹션 정보 없음</div>';
      return;
    }

    listEl.innerHTML = '<div class="tree-articles-msg">로딩 중...</div>';

    try {
      const articles = await DB.fetchArticlesBySection(node.section);
      if (!articles || articles.length === 0) {
        listEl.innerHTML = '<div class="tree-articles-msg">아티클 없음</div>';
        return;
      }
      listEl.innerHTML = articles.map(a => `
        <div class="tree-article-item" data-slug="${_esc(a.slug)}" data-id="${a.id}" role="button" tabindex="0">
          <span class="tree-article-status tree-article-status--${a.status || 'draft'}"></span>
          <span class="tree-article-title">${_esc(a.title || a.slug)}</span>
          <span class="tree-article-date">${_formatDate(a.updated_at)}</span>
        </div>
      `).join('');

      // Bind article click — load into editor
      listEl.querySelectorAll('.tree-article-item').forEach(item => {
        item.addEventListener('click', () => {
          const slug = item.dataset.slug;
          if (slug && typeof App !== 'undefined' && typeof App.loadArticleBySlug === 'function') {
            App.loadArticleBySlug(slug);
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = `<div class="tree-articles-msg tree-error">오류: ${err.message}</div>`;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * getSelectedPath()
   * Returns the currently selected tree node info for saving.
   * @returns {{ section: string, path: string, menuId: number|null }|null}
   */
  function getSelectedPath() {
    if (!selectedNode) return null;
    return {
      section: selectedNode.section,
      path:    selectedNode.path,
      menuId:  selectedNode.id,
    };
  }

  function getSelectedNode() {
    return selectedNode;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
    } catch {
      return '';
    }
  }

  return { load, render, getSelectedPath, getSelectedNode };
})();
