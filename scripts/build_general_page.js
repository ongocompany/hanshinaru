#!/usr/bin/env node
/**
 * build_general_page.js
 * 
 * Converts the 3 markdown docs (2-1, 2-1-1, 2-1-2) into a single
 * /chinese-poetry/general/index.html using the existing Layout 5a template
 * with accordion sidebar navigation (matching the poets page pattern).
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ── Paths ──
const MD_DIR = path.join(__dirname, '../docs/resources/중국한시페이지용문서들');
const OUT = path.join(__dirname, '../chinese-poetry/general/index.html');

// ── Read markdown files ──
function readMd(filename) {
    const p = path.join(MD_DIR, filename);
    if (!fs.existsSync(p)) { console.error('Missing:', p); return ''; }
    return fs.readFileSync(p, 'utf8');
}

const md1 = readMd('2-1한시일반론.md');
const md2 = readMd('2-1-1 중국시문학통사.md');
const md3 = readMd('2-1-2 시대별 대표작가와 대표 작품 해설.md');

// ── Custom marked renderer to use site CSS classes ──
const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
    // Extract text from tokens if passed as object (marked v14+)
    if (typeof text === 'object' && text.tokens) {
        text = this.parser.parseInline(text.tokens);
    } else if (typeof text === 'object' && text.text) {
        text = text.text;
    }

    const id = text.replace(/<[^>]*>/g, '').replace(/\s+/g, '-').toLowerCase().substring(0, 40);
    if (level === 1 || level === 2) {
        return `<h2 class="chapter-title" id="${id}">${text}</h2>\n`;
    }
    if (level === 3) {
        return `<h3 class="mid-title">${text}</h3>\n`;
    }
    return `<h${level}>${text}</h${level}>\n`;
};
renderer.paragraph = function (text) {
    if (typeof text === 'object' && text.tokens) {
        text = this.parser.parseInline(text.tokens);
    } else if (typeof text === 'object' && text.text) {
        text = text.text;
    }
    return `<p class="era-desc">${text}</p>\n`;
};
renderer.list = function (body, ordered) {
    // Handle marked v14 token-based list
    let items = '';
    if (typeof body === 'object' && body.items) {
        for (const item of body.items) {
            let itemText = '';
            if (item.tokens) {
                itemText = this.parser.parse(item.tokens, !!item.task);
            } else if (item.text) {
                itemText = item.text;
            }
            items += `<li class="era-desc">${itemText}</li>\n`;
        }
    } else if (typeof body === 'string') {
        items = body;
    }
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag} style="padding-left:24px; margin-bottom:24px;">\n${items}</${tag}>\n`;
};
renderer.listitem = function (text) {
    if (typeof text === 'object' && text.tokens) {
        text = this.parser.parseInline(text.tokens);
    } else if (typeof text === 'object' && text.text) {
        text = text.text;
    }
    return `<li class="era-desc">${text}</li>\n`;
};
renderer.strong = function (text) {
    if (typeof text === 'object' && text.tokens) {
        text = this.parser.parseInline(text.tokens);
    } else if (typeof text === 'object' && text.text) {
        text = text.text;
    }
    return `<strong>${text}</strong>`;
};
renderer.hr = function () {
    return '<hr class="section-divider">\n';
};

marked.setOptions({ renderer });

// ── Convert markdown to HTML ──
const html1 = marked.parse(md1);
const html2 = marked.parse(md2);
const html3 = marked.parse(md3);

// ── Extract section headers from markdown for sidebar sub-items ──
function extractH2(md) {
    const re = /^##\s+(.+)$/gm;
    const items = [];
    let m;
    while ((m = re.exec(md)) !== null) {
        const text = m[1].trim();
        const id = text.replace(/\s+/g, '-').toLowerCase().substring(0, 40);
        items.push({ text, id });
    }
    return items;
}

const sections1 = extractH2(md1);
const sections2 = extractH2(md2);
const sections3 = extractH2(md3);

// ── Build sidebar sub-items HTML ──
function buildSubItems(sections, prefix) {
    return sections.map((s, i) => {
        const cls = (i === 0 && prefix === 'hansi') ? ' active' : '';
        return `              <li class="era-sub-tree-item">
                <a class="era-sub-link${cls}" href="#${s.id}" data-parent="${prefix}">${s.text}</a>
              </li>`;
    }).join('\n');
}

// ── Generate the full HTML page ──
const pageHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>한시(漢詩) 일반론 — 한시나루</title>
  <link rel="stylesheet" href="https://use.typekit.net/dje5vco.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+Mono+TC&family=Noto+Serif+KR:wght@200..900&family=Noto+Serif+TC:wght@200..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/shared/styles.css">
  <style>
    /* ===== Global Body ===== */
    body {
      background: #fff;
      color: #000;
      padding-top: 73px;
    }

    /* ===== Layout 5-a: 좌측 고정 300px + 우측 스크롤 ===== */
    .layout-5a {
      display: flex;
      max-width: 1300px;
      margin: 0 auto;
      padding-top: 0;
      background: #FBFAFA;
      box-shadow: 5px 0 15px rgba(0,0,0,0.06), -5px 0 15px rgba(0,0,0,0.06);
    }

    /* ===== Sidebar 300px (sticky) ===== */
    aside.sidebar {
      width: 300px;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      background: #FBFAFA;
      position: sticky;
      top: 73px;
      height: calc(100vh - 73px);
      overflow-y: auto;
    }

    .layout-5a .sidebar-header {
      padding: 40px 30px 24px;
      text-align: right;
      flex-shrink: 0;
      border-bottom: 1px dashed var(--c-silver, #c8d3d5);
    }
    .sidebar-header h2 {
      font-family: var(--font-ko);
      font-size: var(--fs-lead, 20px);
      font-weight: bold;
      color: #1C2122;
      margin-bottom: 8px;
    }
    .sidebar-header p {
      font-size: var(--fs-small, 14px);
      color: var(--c-powder-blue, #a4b8c4);
    }

    /* Era tree navigation */
    .era-tree {
      list-style: none;
      flex: 1;
      padding: 8px 0;
    }
    .era-tree-item {
      margin-bottom: 0;
      padding: 0;
      font-size: inherit;
      color: #000;
      cursor: default;
      opacity: 1;
      display: block;
    }
    .era-tree-link {
      display: block;
      padding: 5px 30px;
      font-family: var(--font-ko);
      font-size: var(--fs-body, 16px);
      color: #000;
      text-align: right;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .era-tree-link:hover:not(.active) {
      background: #A4B8C4;
      color: #1C2122;
    }
    .era-tree-link.active,
    .era-tree-link.expanded {
      background: #8FA8B2;
      color: #FBFAFA;
      font-weight: bold;
    }

    /* Sub-items (아코디언) */
    .era-sub-tree {
      list-style: none;
      display: none;
      background: rgba(143, 168, 178, 0.15);
    }
    .era-sub-tree.show {
      display: block;
    }
    .era-sub-link {
      display: block;
      padding: 5px 30px;
      font-family: var(--font-ko);
      font-size: calc(var(--fs-body, 16px) - 2px);
      color: #000;
      text-align: right;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      text-decoration: none;
    }
    .era-sub-link:hover {
      background: #A4B8C4;
      color: #1C2122;
    }
    .era-sub-link.active {
      background: rgba(143, 168, 178, 0.4);
      color: #1C2122;
      font-weight: 600;
    }

    /* ===== Content Area ===== */
    main.content-area {
      flex: 1;
      min-width: 0;
    }
    .era-content-section {
      display: none;
    }
    .era-content-section.active {
      display: block;
    }
    .section-inner {
      padding: 40px 32px 80px;
    }
    .section-divider {
      border: none;
      border-top: 1px solid var(--c-silver, #c8d3d5);
      margin: 48px 0;
    }

    /* ===== Typography ===== */
    .chapter-title {
      font-family: var(--font-ko);
      font-size: var(--fs-lead, 20px);
      font-weight: bold;
      margin-bottom: 24px;
      margin-top: 48px;
      color: #1C2122;
      scroll-margin-top: 90px;
    }
    .chapter-title:first-child {
      margin-top: 0;
    }
    .mid-title {
      font-family: var(--font-zh);
      font-size: var(--fs-lead, 20px);
      font-weight: bold;
      margin-top: 32px;
      margin-bottom: 16px;
      color: #1C2122;
    }
    .era-desc {
      font-family: var(--font-ko);
      font-size: var(--fs-body, 18px);
      color: #000;
      line-height: 1.9;
      margin-bottom: 24px;
    }
    .era-desc .zh {
      font-family: var(--font-zh);
    }

    /* ===== Responsive ===== */
    @media (max-width: 1024px) {
      body { overflow: auto; }
      .layout-5a {
        flex-direction: column;
        height: auto;
      }
      aside.sidebar {
        width: 100%;
        min-width: 100%;
      }
      main.content-area {
        overflow-y: visible;
      }
    }
    @media (max-width: 768px) {
      .section-inner {
        padding: 24px 16px 48px;
      }
    }
  </style>
</head>
<body>
  <div id="nav-placeholder"></div>

  <div class="layout-5a">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>한시(漢詩) 일반론</h2>
        <p>중국 시문학의 기초</p>
      </div>

      <ul class="era-tree">
        <li class="era-tree-item">
          <div class="era-tree-link active expanded" data-section="hansi">
            <span>한시 일반론</span>
          </div>
          <ul class="era-sub-tree show">
${buildSubItems(sections1, 'hansi')}
          </ul>
        </li>
        <li class="era-tree-item">
          <div class="era-tree-link" data-section="tongsa">
            <span>중국 시문학 통사</span>
          </div>
          <ul class="era-sub-tree">
${buildSubItems(sections2, 'tongsa')}
          </ul>
        </li>
        <li class="era-tree-item">
          <div class="era-tree-link" data-section="poets">
            <span>대표 작가와 작품 해설</span>
          </div>
          <ul class="era-sub-tree">
${buildSubItems(sections3, 'poets')}
          </ul>
        </li>
      </ul>
    </aside>

    <!-- Content Area -->
    <main class="content-area">
      <div class="era-content-section active" data-section="hansi">
        <div class="section-inner">
          ${html1}
        </div>
      </div>
      <div class="era-content-section" data-section="tongsa">
        <div class="section-inner">
          ${html2}
        </div>
      </div>
      <div class="era-content-section" data-section="poets">
        <div class="section-inner">
          ${html3}
        </div>
      </div>
    </main>
  </div>

  <div id="footer-placeholder"></div>
  <script src="/shared/auth-state.js"></script>
  <script src="/shared/components.js"></script>
  <script>
    // ===== Sidebar accordion + content switching =====
    document.addEventListener('DOMContentLoaded', () => {
      const treeLinks = document.querySelectorAll('.era-tree-link');
      const subLinks = document.querySelectorAll('.era-sub-link');

      // Main section click (accordion toggle + content switch)
      treeLinks.forEach(link => {
        link.addEventListener('click', () => {
          const section = link.dataset.section;

          // Collapse all
          treeLinks.forEach(l => {
            l.classList.remove('active', 'expanded');
            const sub = l.closest('.era-tree-item').querySelector('.era-sub-tree');
            if (sub) sub.classList.remove('show');
          });

          // Expand clicked
          link.classList.add('active', 'expanded');
          const sub = link.closest('.era-tree-item').querySelector('.era-sub-tree');
          if (sub) sub.classList.add('show');

          // Switch content section
          document.querySelectorAll('.era-content-section').forEach(s => s.classList.remove('active'));
          const target = document.querySelector('.era-content-section[data-section="' + section + '"]');
          if (target) {
            target.classList.add('active');
            // Scroll content to top
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
          }

          // Activate first sub-link
          subLinks.forEach(s => s.classList.remove('active'));
          if (sub) {
            const firstSub = sub.querySelector('.era-sub-link');
            if (firstSub) firstSub.classList.add('active');
          }
        });
      });

      // Sub-link click (scroll to heading within active section)
      subLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();

          // Make sure parent section is active
          const parentSection = link.dataset.parent;
          const parentLink = document.querySelector('.era-tree-link[data-section="' + parentSection + '"]');
          if (parentLink && !parentLink.classList.contains('active')) {
            parentLink.click();
          }

          // Activate this sub-link
          subLinks.forEach(s => s.classList.remove('active'));
          link.classList.add('active');

          // Scroll to heading
          const href = link.getAttribute('href');
          const targetEl = document.querySelector(href);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    });
  </script>
</body>
</html>
`;

// ── Write output ──
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, pageHtml, 'utf8');
console.log('✅ Generated', OUT);
`;

console.log('Script complete');
