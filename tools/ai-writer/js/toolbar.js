/**
 * toolbar.js — AI Writer Toolbar Module
 *
 * Handles two AI interaction patterns:
 *  1. Floating toolbar — appears on text selection (B/I/U format + AI rewrite)
 *  2. Slash commands  — appears when user types '/' on an empty line
 *
 * IIFE pattern. Exposes global `Toolbar` object.
 * Dependencies (guarded): Settings, AIClient, PromptBuilder, Editor, App
 */

var Toolbar = (() => {
  'use strict';

  // =====================================================
  // CONSTANTS
  // =====================================================

  const SLASH_COMMANDS = [
    { id: 'continue', label: '이어서 작성', icon: '✨' },
    { id: 'rewrite',  label: '다시 쓰기',   icon: '📝' },
    { id: 'expand',   label: '분량 늘리기', icon: '📏' },
    { id: 'shorten',  label: '분량 줄이기', icon: '✂️' },
    { id: 'tone',     label: '톤 변경',     icon: '🔄' },
  ];

  // =====================================================
  // MODULE STATE
  // =====================================================

  let selectedRange = null;     // Saved selection range for AI bubble
  let slashNode = null;         // Text node where / was typed
  let selectedCommandIndex = 0; // Arrow key navigation index

  // =====================================================
  // PUBLIC: init
  // =====================================================

  function init() {
    initFloatingToolbar();
    initSlashCommand();
  }

  // =====================================================
  // FLOATING TOOLBAR
  // =====================================================

  function initFloatingToolbar() {
    // --- Render toolbar HTML ---
    const toolbarEl = document.getElementById('floating-toolbar');
    if (toolbarEl) {
      toolbarEl.innerHTML = `
        <button data-format="bold"><b>B</b></button>
        <button data-format="italic"><i>I</i></button>
        <button data-format="underline"><u>U</u></button>
        <span style="border-left:1px solid var(--c-text-faint);margin:0 4px;height:16px;display:inline-block;"></span>
        <button class="btn-ai" id="toolbar-ai-btn">✨ AI</button>
      `;
    }

    // --- Render AI bubble HTML ---
    const bubbleEl = document.getElementById('ai-bubble');
    if (bubbleEl) {
      bubbleEl.innerHTML = `
        <div class="ai-bubble__label">AI에게 지시</div>
        <input class="ai-bubble__input" id="ai-bubble-input" placeholder="예: 좀 더 구체적인 예시를 들어줘">
        <div class="ai-bubble__actions">
          <button class="btn-cancel" id="ai-bubble-cancel">취소</button>
          <button class="btn-submit" id="ai-bubble-apply">적용</button>
        </div>
      `;
      // Cancel button handler (inline — avoids stale binding from app.js)
      bubbleEl.querySelector('#ai-bubble-cancel').addEventListener('click', () => {
        hideAiBubble();
      });
    }

    // --- Text selection listener ---
    const editorBody = document.getElementById('editor-body');
    if (editorBody) {
      editorBody.addEventListener('mouseup', () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.toString().trim() === '') return;

        // Ensure selection is inside #editor-body
        if (!editorBody.contains(sel.anchorNode)) return;

        selectedRange = sel.getRangeAt(0);

        // Position toolbar above selection
        const rect = selectedRange.getBoundingClientRect();
        const tb = document.getElementById('floating-toolbar');
        if (tb) {
          tb.style.left = rect.left + window.scrollX + 'px';
          tb.style.top  = rect.top  + window.scrollY - tb.offsetHeight - 8 + 'px';
          tb.classList.add('visible');
        }
      });
    }

    // --- Hide on outside click ---
    document.addEventListener('mousedown', (e) => {
      const tb = document.getElementById('floating-toolbar');
      const bubble = document.getElementById('ai-bubble');
      const clickedInside =
        (tb     && tb.contains(e.target)) ||
        (bubble && bubble.contains(e.target));
      if (!clickedInside) {
        hideToolbar();
        hideAiBubble();
      }
    });

    // --- Format button clicks ---
    const tb = document.getElementById('floating-toolbar');
    if (tb) {
      tb.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-format]');
        if (btn) {
          const format = btn.dataset.format;
          document.execCommand(format);
        }
      });
    }

    // --- AI button → show bubble ---
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'toolbar-ai-btn') {
        const bubble = document.getElementById('ai-bubble');
        const tbEl   = document.getElementById('floating-toolbar');
        if (bubble && tbEl) {
          const tbRect = tbEl.getBoundingClientRect();
          bubble.style.left = tbRect.left + window.scrollX + 'px';
          bubble.style.top  = tbRect.top  + window.scrollY - bubble.offsetHeight - 8 + 'px';
          bubble.classList.add('visible');
          const input = document.getElementById('ai-bubble-input');
          if (input) {
            input.value = '';
            input.focus();
          }
        }
      }
    });

    // --- AI bubble apply ---
    async function applyAiBubble() {
      const input       = document.getElementById('ai-bubble-input');
      const instruction = input ? input.value.trim() : '';
      if (!instruction || !selectedRange) return;

      const selectedText = selectedRange.toString();

      const apiConfig = typeof Settings !== 'undefined' ? Settings.getApiConfig() : null;
      if (!apiConfig || !apiConfig.apiKey) {
        if (typeof App !== 'undefined') App.toast('API 키를 설정하세요.', 'error');
        return;
      }

      hideAiBubble();
      hideToolbar();

      try {
        const baseRules = (typeof PromptBuilder !== 'undefined' && PromptBuilder.BASE_STYLE_RULES)
          ? PromptBuilder.BASE_STYLE_RULES
          : '';

        const result = await AIClient.chat(apiConfig, {
          system: `너는 한시 콘텐츠 작가다. 선택된 텍스트를 지시에 따라 다시 작성해라. 다시 작성한 내용만 출력해라.\n\n${baseRules}`,
          user:   `선택된 텍스트:\n${selectedText}\n\n지시: ${instruction}`,
        });

        // Restore selection and replace
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(selectedRange);
        document.execCommand('insertHTML', false, result.replace(/\n/g, '<br>'));

        if (typeof Editor !== 'undefined') Editor.syncContentFromDOM();
        if (typeof App    !== 'undefined') App.toast('완료!', 'success');
      } catch (err) {
        if (typeof App !== 'undefined') App.toast('AI 요청 실패: ' + err.message, 'error');
      }
    }

    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'ai-bubble-apply') {
        applyAiBubble();
      }
    });

    document.addEventListener('keydown', (e) => {
      const bubble = document.getElementById('ai-bubble');
      if (!bubble || !bubble.classList.contains('visible')) return;

      if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active && active.id === 'ai-bubble-input') {
          e.preventDefault();
          applyAiBubble();
        }
      }
      if (e.key === 'Escape') {
        hideAiBubble();
      }
    });
  }

  // =====================================================
  // SLASH COMMANDS
  // =====================================================

  function initSlashCommand() {
    // --- Render slash palette HTML ---
    const palette = document.getElementById('slash-palette');
    if (palette) {
      const itemsHtml = SLASH_COMMANDS.map((cmd, i) =>
        `<div class="slash-palette__item${i === 0 ? ' selected' : ''}" data-cmd="${cmd.id}">${cmd.icon} ${cmd.label}</div>`
      ).join('');

      palette.innerHTML = `
        <div class="slash-palette__header">빠른 명령</div>
        ${itemsHtml}
        <div class="slash-palette__divider"></div>
        <div class="slash-palette__input-wrap">
          <input class="slash-palette__input" id="slash-custom-input" placeholder="또는 자유롭게 입력...">
        </div>
      `;
    }

    // --- Input event: detect '/' on empty line ---
    const editorBody = document.getElementById('editor-body');
    if (editorBody) {
      editorBody.addEventListener('input', () => {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return;

        const node = sel.anchorNode;
        const text = node.textContent || '';

        if (text.trim() === '/') {
          slashNode = node;
          selectedCommandIndex = 0;

          // Position palette below cursor
          const range = sel.getRangeAt(0);
          const rect  = range.getBoundingClientRect();
          const pal   = document.getElementById('slash-palette');
          if (pal) {
            pal.style.left = rect.left + window.scrollX + 'px';
            pal.style.top  = rect.bottom + window.scrollY + 4 + 'px';
            pal.classList.add('visible');
            updateSlashSelection();
          }
        } else if (!text.includes('/')) {
          hideSlashPalette();
        }
      });
    }

    // --- Keyboard navigation for palette ---
    document.addEventListener('keydown', (e) => {
      const pal = document.getElementById('slash-palette');
      if (!pal || !pal.classList.contains('visible')) return;

      // Don't intercept keys typed in the custom input
      const customInput = document.getElementById('slash-custom-input');
      if (document.activeElement === customInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = customInput.value.trim();
          if (val) {
            executeSlashCommand('custom', val);
            customInput.value = '';
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedCommandIndex = Math.min(selectedCommandIndex + 1, SLASH_COMMANDS.length - 1);
        updateSlashSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
        updateSlashSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = SLASH_COMMANDS[selectedCommandIndex];
        if (cmd) executeSlashCommand(cmd.id);
      } else if (e.key === 'Escape') {
        hideSlashPalette();
      }
    });

    // --- Click on palette item ---
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.slash-palette__item');
      if (item) {
        const cmdId = item.dataset.cmd;
        if (cmdId) executeSlashCommand(cmdId);
      }
    });
  }

  function updateSlashSelection() {
    const pal = document.getElementById('slash-palette');
    if (!pal) return;
    const items = pal.querySelectorAll('.slash-palette__item');
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === selectedCommandIndex);
    });
  }

  // =====================================================
  // EXECUTE SLASH COMMAND
  // =====================================================

  async function executeSlashCommand(cmdId, customText) {
    hideSlashPalette();

    // Remove the '/' character from the node
    if (slashNode && slashNode.textContent.includes('/')) {
      slashNode.textContent = slashNode.textContent.replace('/', '');
    }

    const apiConfig = typeof Settings !== 'undefined' ? Settings.getApiConfig() : null;
    if (!apiConfig || !apiConfig.apiKey) {
      if (typeof App !== 'undefined') App.toast('API 키를 설정하세요.', 'error');
      return;
    }

    const sectionBlock  = slashNode?.closest?.('.section-block');
    const currentContent = sectionBlock?.querySelector('.section-block__content')?.innerHTML || '';

    let instruction;
    switch (cmdId) {
      case 'continue': instruction = '이 내용에 이어서 자연스럽게 작성해줘. 현재 내용과 중복되지 않게.'; break;
      case 'rewrite':  instruction = '같은 내용을 다른 방식으로, 문체는 유지하면서 다시 작성해줘.';      break;
      case 'expand':   instruction = '더 자세하게, 예시나 배경을 추가해서 분량을 늘려줘.';              break;
      case 'shorten':  instruction = '핵심만 남기고, 반복되는 내용은 제거해서 간결하게 줄여줘.';        break;
      case 'tone':     instruction = '좀 더 부드럽고 읽기 편하게 톤을 바꿔줘.';                         break;
      case 'custom':   instruction = customText; break;
      default: return;
    }

    if (!instruction) return;

    try {
      const baseRules = (typeof PromptBuilder !== 'undefined' && PromptBuilder.BASE_STYLE_RULES)
        ? PromptBuilder.BASE_STYLE_RULES
        : '';

      const result = await AIClient.chat(apiConfig, {
        system: `너는 한시 콘텐츠 작가다. 지시에 따라 작성해라. 작성한 내용만 출력해라.\n\n${baseRules}`,
        user:   `현재 내용:\n${currentContent}\n\n지시: ${instruction}`,
      });

      const contentEl = sectionBlock?.querySelector('.section-block__content');
      if (contentEl) {
        if (cmdId === 'continue') {
          contentEl.innerHTML += '<br>' + result.replace(/\n/g, '<br>');
        } else {
          contentEl.innerHTML = result.replace(/\n/g, '<br>');
        }
      }

      if (typeof Editor !== 'undefined') Editor.syncContentFromDOM();
      if (typeof App    !== 'undefined') App.toast('완료!', 'success');
    } catch (err) {
      if (typeof App !== 'undefined') App.toast('AI 요청 실패: ' + err.message, 'error');
    }
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function hideToolbar() {
    const el = document.getElementById('floating-toolbar');
    if (el) el.classList.remove('visible');
  }

  function hideAiBubble() {
    const el = document.getElementById('ai-bubble');
    if (el) el.classList.remove('visible');
  }

  function hideSlashPalette() {
    const el = document.getElementById('slash-palette');
    if (el) el.classList.remove('visible');
    selectedCommandIndex = 0;
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  return { init };

})();
