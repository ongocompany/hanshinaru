// =============================================================
//  board/ai-bg.js — AI 배경 생성 (Gemini API)
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── initAiBgGenerate ───

  function initAiBgGenerate() {
    var wrap = document.querySelector('.board-ai-bg-wrap');
    if (!wrap) return;

    // 칩 클릭 — 단일 선택 (일반 그룹)
    wrap.addEventListener('click', function (e) {
      var chip = e.target.closest('.ai-chip');
      if (!chip) return;

      var group = chip.closest('.ai-opt-chips');
      if (!group) return;

      var isMulti = group.classList.contains('ai-opt-multi');

      if (isMulti) {
        // 다중 선택 토글
        chip.classList.toggle('selected');
      } else {
        // 단일 선택
        group.querySelectorAll('.ai-chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');
      }

      // 스타일 변경 시 서브옵션 토글
      var groupName = group.getAttribute('data-group');
      if (groupName === 'style') {
        var val = chip.getAttribute('data-value');
        var subOriental = document.getElementById('aiSubOriental');
        var subWestern = document.getElementById('aiSubWestern');
        if (subOriental) subOriental.style.display = val === 'oriental' ? '' : 'none';
        if (subWestern) subWestern.style.display = val === 'western' ? '' : 'none';
      }

      // 동양화 소재 분기 토글
      if (groupName === 'oriental-subject') {
        var subj = chip.getAttribute('data-value');
        var branches = { landscape: 'aiBranchLandscape', stilllife: 'aiBranchStilllife', figure: 'aiBranchFigure', fourplants: 'aiBranchFourplants' };
        Object.keys(branches).forEach(function (k) {
          var el = document.getElementById(branches[k]);
          if (el) el.style.display = k === subj ? '' : 'none';
        });
      }

      // 서양화 소재 분기 토글
      if (groupName === 'western-subject') {
        var wSubj = chip.getAttribute('data-value');
        var wBranches = { scenery: 'aiBranchScenery', still: 'aiBranchStill', person: 'aiBranchPerson' };
        Object.keys(wBranches).forEach(function (k) {
          var el = document.getElementById(wBranches[k]);
          if (el) el.style.display = k === wSubj ? '' : 'none';
        });
      }
    });

    var btn = document.getElementById('aiBgGenerateBtn');
    if (!btn) return;

    btn.addEventListener('click', async function () {
      // 선택지에서 프롬프트 빌드
      var promptData = buildAiPrompt();

      // API 키 확인
      var apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        apiKey = window.prompt('Google Gemini API 키를 입력하세요.\n(한번 입력하면 브라우저에 저장됩니다)');
        if (!apiKey) return;
        localStorage.setItem('gemini_api_key', apiKey.trim());
        apiKey = apiKey.trim();
      }

      // 폼에서 시 텍스트 가져오기
      var ptEl = document.getElementById('poemTitle');
      var pbEl = document.getElementById('poemBody');
      var fsEl = document.getElementById('fontStyleSelect');
      var pTitle = ptEl ? ptEl.value : '';
      var pBody = pbEl ? pbEl.value : '';
      var fontCls = (fsEl && fsEl.value) ? 'poem-font-' + fsEl.value : '';

      // 모달 HTML
      var mHtml = '';
      mHtml += '<div class="ai-gen-modal-overlay" id="aiGenModal">';
      mHtml += '  <div class="ai-gen-modal">';
      mHtml += '    <div class="ai-gen-modal-header">';
      mHtml += '      <span>AI 배경 미리보기</span>';
      mHtml += '      <button class="ai-gen-modal-close" id="aiGenClose">&times;</button>';
      mHtml += '    </div>';

      // 로딩 영역
      mHtml += '    <div class="ai-gen-loading" id="aiGenLoading">';
      mHtml += '      <svg class="ai-gen-spinner" viewBox="0 0 100 100">';
      mHtml += '        <circle cx="50" cy="50" r="40" stroke="#c8d8e0" stroke-width="6" fill="none" opacity="0.3"/>';
      mHtml += '        <circle cx="50" cy="50" r="40" stroke="#4a6670" stroke-width="6" fill="none" stroke-dasharray="80 200" stroke-linecap="round">';
      mHtml += '          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.2s" repeatCount="indefinite"/>';
      mHtml += '        </circle>';
      mHtml += '        <circle cx="50" cy="50" r="20" stroke="#8aacb0" stroke-width="4" fill="none" stroke-dasharray="40 100" stroke-linecap="round">';
      mHtml += '          <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="1.8s" repeatCount="indefinite"/>';
      mHtml += '        </circle>';
      mHtml += '        <path d="M44 45 L50 38 L56 45 M44 55 L50 62 L56 55" stroke="#4a6670" stroke-width="2.5" fill="none" stroke-linecap="round">';
      mHtml += '          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>';
      mHtml += '        </path>';
      mHtml += '      </svg>';
      mHtml += '      <p class="ai-gen-loading-text">AI가 그림을 그리고 있습니다...</p>';
      mHtml += '      <p class="ai-gen-loading-sub">잠시만 기다려주세요</p>';
      mHtml += '    </div>';

      // 미리보기 영역 (처음엔 숨김)
      mHtml += '    <div class="ai-gen-preview" id="aiGenPreview" style="display:none">';
      mHtml += '      <div class="ai-gen-canvas" id="aiGenCanvas">';
      mHtml += '        <div class="ai-gen-textbox ' + fontCls + '" id="aiGenTextbox" contenteditable="true">';
      if (pTitle) mHtml += '<div class="ai-gen-text-title">' + B.escapeHTML(pTitle) + '</div>';
      if (pBody) mHtml += '<div class="ai-gen-text-body">' + B.escapeHTML(pBody).replace(/\n/g, '<br>') + '</div>';
      if (!pTitle && !pBody) mHtml += '<div class="ai-gen-text-body" style="opacity:0.5">시 제목/원문을 위 폼에서 먼저 입력하세요</div>';
      mHtml += '      </div>';
      mHtml += '      </div>';

      mHtml += '    </div>';

      // 컨트롤 바 (preview 밖 — 항상 보이도록)
      mHtml += '    <div class="ai-gen-controls" id="aiGenControls" style="display:none">';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">글자 크기</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlFontMinus">A−</button>';
      mHtml += '        <span id="aiCtrlFontSize">20px</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlFontPlus">A+</button>';
      mHtml += '      </div>';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">글자색</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn ai-gen-ctrl-active" id="aiCtrlFontBlack" data-color="black">검정</button>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlFontWhite" data-color="white">흰색</button>';
      mHtml += '      </div>';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">박스 배경</span>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn ai-gen-ctrl-active" id="aiCtrlBoxWhite" data-bg="white">흰색</button>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlBoxBlack" data-bg="black">검정</button>';
      mHtml += '        <button type="button" class="ai-gen-ctrl-btn" id="aiCtrlBoxNone" data-bg="none">없음</button>';
      mHtml += '      </div>';
      mHtml += '      <div class="ai-gen-ctrl-group">';
      mHtml += '        <span class="ai-gen-ctrl-label">투명도</span>';
      mHtml += '        <input type="range" id="aiCtrlOpacity" min="0" max="100" value="70" class="ai-gen-slider">';
      mHtml += '        <span id="aiCtrlOpacityVal">70%</span>';
      mHtml += '      </div>';
      mHtml += '    </div>';

      // 에러 영역
      mHtml += '    <div class="ai-gen-error" id="aiGenError" style="display:none"></div>';

      // 하단 버튼
      mHtml += '    <div class="ai-gen-modal-footer">';
      mHtml += '      <button type="button" class="ai-gen-cancel-btn" id="aiGenCancel">취소</button>';
      mHtml += '      <button type="button" class="ai-gen-confirm-btn" id="aiGenConfirm" disabled>확정</button>';
      mHtml += '    </div>';

      mHtml += '  </div>';
      mHtml += '</div>';

      // 기존 모달 제거 후 삽입
      var oldModal = document.getElementById('aiGenModal');
      if (oldModal) oldModal.remove();
      document.body.insertAdjacentHTML('beforeend', mHtml);

      var modal = document.getElementById('aiGenModal');
      var loading = document.getElementById('aiGenLoading');
      var preview = document.getElementById('aiGenPreview');
      var errorEl = document.getElementById('aiGenError');
      var confirmBtn = document.getElementById('aiGenConfirm');

      // 모달 표시
      requestAnimationFrame(function () { modal.classList.add('visible'); });

      // 닫기 함수
      function closeModal() {
        modal.classList.remove('visible');
        setTimeout(function () { modal.remove(); }, 300);
      }
      document.getElementById('aiGenClose').addEventListener('click', closeModal);
      document.getElementById('aiGenCancel').addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

      // API 호출
      try {
        var imageBase64 = await callGeminiImageApi(apiKey, promptData.prompt, promptData.ratio);

        if (imageBase64) {
          var imgSrc = 'data:image/png;base64,' + imageBase64;
          var dataEl = document.getElementById('aiBgImageData');
          if (dataEl) dataEl.value = imageBase64;

          // 로딩 → 미리보기 전환
          loading.style.display = 'none';
          preview.style.display = '';
          var ctrlBar = document.getElementById('aiGenControls');
          if (ctrlBar) ctrlBar.style.display = '';

          var canvas = document.getElementById('aiGenCanvas');
          canvas.style.backgroundImage = 'url(' + imgSrc + ')';

          // 이미지 비율 감지 → 캔버스에 적용
          var ratioImg = new Image();
          ratioImg.onload = function () {
            canvas.style.aspectRatio = ratioImg.naturalWidth + '/' + ratioImg.naturalHeight;
          };
          ratioImg.src = imgSrc;

          confirmBtn.disabled = false;

          // 템플릿 선택 해제
          var bgIdEl = document.getElementById('bgTemplateId');
          if (bgIdEl) bgIdEl.value = 'none';
          var grid = document.getElementById('bgTemplateGrid');
          if (grid) {
            grid.querySelectorAll('.board-bg-thumb.selected').forEach(function (el) {
              el.classList.remove('selected');
            });
          }

          // ── 드래그 + 컨트롤 초기화 ──
          initAiGenModalControls(canvas, imgSrc, fontCls);
        }
      } catch (err) {
        console.error('[board.js] AI 배경 생성 실패:', err);
        loading.style.display = 'none';
        errorEl.style.display = '';
        errorEl.textContent = '생성 실패: ' + (err.message || '알 수 없는 오류');
        if (err.message && (err.message.includes('API key') || err.message.includes('401') || err.message.includes('403'))) {
          localStorage.removeItem('gemini_api_key');
          errorEl.textContent += ' (API 키를 다시 확인해주세요)';
        }
      }

      // 확정 버튼
      confirmBtn.addEventListener('click', function () {
        var textbox = document.getElementById('aiGenTextbox');
        var canvas = document.getElementById('aiGenCanvas');
        if (!textbox || !canvas) { closeModal(); return; }

        // 위치 + 스타일 저장
        var tpData = JSON.stringify({
          x: parseFloat(textbox.style.left) || 10,
          y: parseFloat(textbox.style.top) || 10,
          fontSize: parseInt(textbox.style.fontSize) || 20,
          fontColor: textbox.style.color || '#2a2a2a',
          boxBg: textbox.getAttribute('data-box-bg') || 'white',
          boxOpacity: parseFloat(textbox.getAttribute('data-box-opacity')) || 0.7
        });
        var tpEl = document.getElementById('textPositionData');
        if (tpEl) tpEl.value = tpData;

        // 편집된 텍스트를 폼에 반영
        var editedTitle = textbox.querySelector('.ai-gen-text-title');
        var editedBody = textbox.querySelector('.ai-gen-text-body');
        if (editedTitle && ptEl) ptEl.value = editedTitle.textContent;
        if (editedBody && pbEl) {
          // br → 줄바꿈 변환
          var bodyText = editedBody.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
          pbEl.value = bodyText;
        }

        // 폼에 50% 미리보기 표시 (비율 맞춤)
        var formPreview = document.getElementById('aiBgFormPreview');
        if (formPreview) {
          var bgUrl = canvas.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
          var previewImg = new Image();
          previewImg.onload = function () {
            var fpHtml = '<div class="ai-form-preview-img" style="';
            fpHtml += 'background-image:url(' + bgUrl + ');';
            fpHtml += 'aspect-ratio:' + previewImg.naturalWidth + '/' + previewImg.naturalHeight + ';">';
            fpHtml += '<div class="ai-form-preview-text" style="';
            fpHtml += 'left:' + (parseFloat(textbox.style.left) || 10) + '%;';
            fpHtml += 'top:' + (parseFloat(textbox.style.top) || 10) + '%;';
            fpHtml += 'font-size:' + (parseInt(textbox.style.fontSize) * 0.6 || 12) + 'px;';
            fpHtml += 'color:' + (textbox.style.color || '#2a2a2a') + ';';
            fpHtml += 'background:' + (textbox.style.background || 'rgba(255,255,255,0.75)') + ';';
            fpHtml += '">' + textbox.innerHTML + '</div>';
            fpHtml += '</div>';
            formPreview.innerHTML = fpHtml;
            formPreview.style.display = 'block';
          };
          previewImg.src = bgUrl;
        }

        closeModal();
      });
    });
  }

  // ─── initAiGenModalControls ───

  function initAiGenModalControls(canvas, imgSrc, fontCls) {
    var textbox = document.getElementById('aiGenTextbox');
    if (!canvas || !textbox) return;

    var dragging = false;
    var startX, startY, startLeft, startTop;
    var fontSize = 20;
    var boxBgColor = 'white';
    var boxOpacity = 0.7;

    // 기본 스타일 즉시 적용 (컨트롤 미조작 시에도 inline style 보장)
    textbox.style.fontSize = fontSize + 'px';
    textbox.style.color = '#1a1a1a';
    textbox.style.background = 'rgba(255,255,255,' + boxOpacity + ')';
    textbox.setAttribute('data-box-bg', boxBgColor);
    textbox.setAttribute('data-box-opacity', boxOpacity);

    // 텍스트 편집 중엔 드래그 방지
    var isEditing = false;
    textbox.addEventListener('focus', function () { isEditing = true; });
    textbox.addEventListener('blur', function () { isEditing = false; });

    // ── 드래그 (마우스) ──
    textbox.addEventListener('mousedown', function (e) {
      if (isEditing && e.target.closest('[contenteditable]')) return;
      if (e.target === textbox || e.target.classList.contains('ai-gen-text-title') || e.target.classList.contains('ai-gen-text-body')) {
        // contenteditable 내부 클릭이면 편집 모드
        return;
      }
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(textbox.style.left) || 10;
      startTop = parseFloat(textbox.style.top) || 10;
      textbox.style.cursor = 'grabbing';
    });

    // 드래그 핸들 (텍스트 편집과 분리)
    var dragHandle = document.createElement('div');
    dragHandle.className = 'ai-gen-drag-handle';
    dragHandle.innerHTML = '⠿ 드래그';
    dragHandle.title = '드래그하여 위치 이동';
    textbox.insertBefore(dragHandle, textbox.firstChild);

    dragHandle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(textbox.style.left) || 10;
      startTop = parseFloat(textbox.style.top) || 10;
      textbox.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var rect = canvas.getBoundingClientRect();
      var dx = ((e.clientX - startX) / rect.width) * 100;
      var dy = ((e.clientY - startY) / rect.height) * 100;
      textbox.style.left = Math.max(0, Math.min(85, startLeft + dx)) + '%';
      textbox.style.top = Math.max(0, Math.min(85, startTop + dy)) + '%';
    });

    document.addEventListener('mouseup', function () {
      if (dragging) { dragging = false; textbox.style.cursor = ''; }
    });

    // ── 드래그 (터치) ──
    dragHandle.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      dragging = true;
      startX = t.clientX;
      startY = t.clientY;
      startLeft = parseFloat(textbox.style.left) || 10;
      startTop = parseFloat(textbox.style.top) || 10;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      var rect = canvas.getBoundingClientRect();
      var dx = ((t.clientX - startX) / rect.width) * 100;
      var dy = ((t.clientY - startY) / rect.height) * 100;
      textbox.style.left = Math.max(0, Math.min(85, startLeft + dx)) + '%';
      textbox.style.top = Math.max(0, Math.min(85, startTop + dy)) + '%';
    }, { passive: true });

    document.addEventListener('touchend', function () { dragging = false; });

    // ── 폰트 크기 ──
    var fontSizeLabel = document.getElementById('aiCtrlFontSize');
    document.getElementById('aiCtrlFontMinus').addEventListener('click', function () {
      fontSize = Math.max(10, fontSize - 2);
      textbox.style.fontSize = fontSize + 'px';
      if (fontSizeLabel) fontSizeLabel.textContent = fontSize + 'px';
    });
    document.getElementById('aiCtrlFontPlus').addEventListener('click', function () {
      fontSize = Math.min(48, fontSize + 2);
      textbox.style.fontSize = fontSize + 'px';
      if (fontSizeLabel) fontSizeLabel.textContent = fontSize + 'px';
    });

    // ── 글자색 ──
    function updateBoxBg() {
      if (boxBgColor === 'none') {
        textbox.style.background = 'transparent';
      } else if (boxBgColor === 'white') {
        textbox.style.background = 'rgba(255,255,255,' + boxOpacity + ')';
      } else {
        textbox.style.background = 'rgba(0,0,0,' + boxOpacity + ')';
      }
      textbox.setAttribute('data-box-bg', boxBgColor);
      textbox.setAttribute('data-box-opacity', boxOpacity);
    }

    document.getElementById('aiCtrlFontBlack').addEventListener('click', function () {
      textbox.style.color = '#1a1a1a';
      this.classList.add('ai-gen-ctrl-active');
      document.getElementById('aiCtrlFontWhite').classList.remove('ai-gen-ctrl-active');
    });
    document.getElementById('aiCtrlFontWhite').addEventListener('click', function () {
      textbox.style.color = '#ffffff';
      this.classList.add('ai-gen-ctrl-active');
      document.getElementById('aiCtrlFontBlack').classList.remove('ai-gen-ctrl-active');
    });

    // ── 박스 배경색 ──
    var boxBtns = [document.getElementById('aiCtrlBoxWhite'), document.getElementById('aiCtrlBoxBlack'), document.getElementById('aiCtrlBoxNone')];
    boxBtns.forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function () {
        boxBgColor = this.getAttribute('data-bg');
        boxBtns.forEach(function (bb) { if (bb) bb.classList.remove('ai-gen-ctrl-active'); });
        this.classList.add('ai-gen-ctrl-active');
        updateBoxBg();
      });
    });

    // ── 투명도 슬라이더 ──
    var opacitySlider = document.getElementById('aiCtrlOpacity');
    var opacityLabel = document.getElementById('aiCtrlOpacityVal');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', function () {
        boxOpacity = parseInt(this.value) / 100;
        if (opacityLabel) opacityLabel.textContent = this.value + '%';
        updateBoxBg();
      });
    }
  }

  // ─── buildAiPrompt ───

  function buildAiPrompt() {
    function getSelected(groupName) {
      var group = document.querySelector('[data-group="' + groupName + '"]');
      if (!group) return [];
      var chips = group.querySelectorAll('.ai-chip.selected');
      return Array.from(chips).map(function (c) { return c.getAttribute('data-value'); });
    }
    function sel(groupName) { return (getSelected(groupName)[0]) || ''; }

    // 비율
    var ratio = sel('ratio') || 'square';
    var ratioMap = { square: '1:1', landscape: '3:2', portrait: '2:3' };
    var ratioLabel = { square: '정방형', landscape: '가로 파노라마', portrait: '세로 족자형' };

    // 스타일
    var style = sel('style') || 'oriental';

    var parts = [];

    // ── 동양화 ──
    if (style === 'oriental') {
      parts.push('한시(漢詩) 배경 이미지.');
      parts.push('중국 또는 조선시대 전통 화풍을 충실히 재현할 것.');
      parts.push('텍스트, 글자, 문자, 낙관은 절대 포함하지 말 것.');
      parts.push(ratioLabel[ratio] + ' 비율.');



      // 기법
      var oTech = sel('oriental-technique') || 'literati';
      var oTechDesc = {
        literati: '문인화풍(수묵담채화, 文人畵) 스타일. 색채는 최소한으로 사용하고 먹(墨)과 붓터치만으로 표현할 것. 수묵의 농담(濃淡)을 살린 흑백 위주의 그림.',
        colored: '채색화풍(북종화, 北宗畵) 스타일. 선명한 색채와 정밀한 묘사.',
        gongbi: '공필화풍(工筆畵) 스타일. 세밀하고 정교한 선과 채색.'
      };
      parts.push(oTechDesc[oTech] || oTechDesc.literati);

      // 소재
      var oSubj = sel('oriental-subject') || 'landscape';

      if (oSubj === 'landscape') {
        var lDetail = sel('oriental-landscape-detail') || 'guilin';
        if (lDetail === 'guilin') parts.push('중국 계림(桂林) 풍의 기암절벽과 강, 안개가 있는 산수화.');
        else if (lDetail === 'jingyeong') parts.push('조선 진경산수화(眞景山水畵) 풍. 금강산이나 한국 실경을 사의적으로 표현.');
      } else if (oSubj === 'stilllife') {
        var sDetail = sel('oriental-stilllife-detail') || 'yeongmo';
        if (sDetail === 'yeongmo') parts.push('영모화(翎毛畵) 스타일. 새와 짐승을 정밀하게 그린 그림.');
        else if (sDetail === 'hwajo') parts.push('화조화(花鳥畵) 스타일. 꽃과 새가 어우러진 아름다운 그림.');
        else if (sDetail === 'chochung') parts.push('초충화(草蟲畵) 스타일. 풀과 벌레를 섬세하게 그린 그림.');
      } else if (oSubj === 'figure') {
        var fDetail = sel('oriental-figure-detail') || 'waiting';
        var figureDesc = {
          waiting: '기다리는 여인. 동양 전통 의상을 입고 먼 곳을 바라보는 여인의 뒷모습.',
          walking: '숲길을 걷는 선비. 갓과 도포를 입은 선비가 산길을 걸어가는 모습.',
          fishing: '낚시하는 노인과 배. 고요한 강가에서 배 위에 앉아 낚시하는 노인.',
          reading: '숲속에서 책 읽는 선비. 소나무 아래에서 독서하는 선비의 한적한 모습.'
        };
        parts.push(figureDesc[fDetail] || figureDesc.waiting);
      } else if (oSubj === 'fourplants') {
        var plants = getSelected('oriental-fourplants-detail');
        if (plants.length > 0) {
          var plantNames = { plum: '매화(梅)', orchid: '난초(蘭)', chrysanthemum: '국화(菊)', bamboo: '대나무(竹)' };
          var plantList = plants.map(function (p) { return plantNames[p] || p; }).join(', ');
          parts.push('사군자(四君子) 문인화 스타일로 ' + plantList + '을(를) 그려주세요.');
        } else {
          parts.push('사군자(四君子) 문인화. 매난국죽 중 어울리는 식물.');
        }
      }

    // ── 서양화 ──
    } else if (style === 'western') {
      parts.push('시(Poetry) 배경 이미지.');
      parts.push('서정적이고 감성적인 분위기.');
      parts.push('안정적이고 고전적인 구도.');
      parts.push('텍스트, 글자, 문자는 절대 포함하지 말 것.');
      parts.push(ratioLabel[ratio] + ' 비율.');



      // 기법
      var wTech = sel('western-technique') || 'impressionist';
      var wTechDesc = {
        'impressionist': '인상파(Impressionism) 스타일 유채화. 빛과 색채의 인상을 담아낸 화풍.',
        'detailed-oil': '세밀한 유채화(Detailed Oil Painting). 사실주의적이고 정교한 묘사.',
        'watercolor': '수채화(Watercolor). 물감의 번짐과 투명한 색감.',
        'pastel': '파스텔화(Pastel Drawing). 부드러운 색감과 몽환적인 질감.',
        'illustration': '일러스트레이션(Illustration). 감성적이고 동화적인 분위기.',
        'photo': '실사 사진(Photography) 스타일. 고화질의 자연스러운 사진처럼.'
      };
      parts.push(wTechDesc[wTech] || wTechDesc.impressionist);

      // 소재
      var wSubj = sel('western-subject') || 'scenery';

      if (wSubj === 'scenery') {
        // 계절
        var season = sel('western-season');
        var seasonDesc = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
        if (season && season !== 'any-season') parts.push(seasonDesc[season] + ' 풍경.');

        // 배경
        var place = sel('western-place') || 'mountain-river';
        var placeDesc = {
          'mountain-river': '산과 강이 어우러진 풍경.',
          'lake': '고요한 호수가 있는 풍경.',
          'sea': '바다와 해안 풍경.',
          'city': '도시 풍경.',
          'village': '동아시아풍 시골 전원 풍경.'
        };
        parts.push(placeDesc[place] || placeDesc['mountain-river']);

        // 시간
        var time = sel('western-time');
        var timeDesc = {
          'dawn': '이른 아침(새벽), 여명이 밝아오는 하늘.',
          'afternoon': '맑은 오후, 따뜻한 햇살.',
          'sunset': '노을진 저녁, 붉은 하늘.',
          'rainy': '비 오는 날씨, 촉촉한 분위기.',
          'snowy': '눈 오는 날씨, 하얀 설경.'
        };
        if (time) parts.push(timeDesc[time] || '');

      } else if (wSubj === 'still') {
        parts.push('정물화(Still Life).');
        var stillMood = sel('western-still-mood') || 'any-mood';
        if (stillMood === 'bright-mood') parts.push('밝고 화사한 분위기.');
        else if (stillMood === 'dark-mood') parts.push('어둡고 쓸쓸한 분위기.');

      } else if (wSubj === 'person') {
        parts.push('인물화(Portrait).');
        var gender = sel('western-person-gender') || 'male';
        var genderDesc = { male: '남성', female: '여성', couple: '남녀가 함께 있는' };
        parts.push(genderDesc[gender] + ' 인물.');

        var pMood = sel('western-person-mood') || 'happy';
        var pMoodDesc = {
          happy: '밝고 평온한 표정.',
          melancholy: '어둡고 쓸쓸한 표정.',
          sad: '슬픈 표정.',
          crying: '눈물을 흘리는 표정.'
        };
        parts.push(pMoodDesc[pMood] || '');
      }
    }

    return {
      prompt: parts.join(' '),
      ratio: ratioMap[ratio]
    };
  }

  // ─── callGeminiImageApi ───

  async function callGeminiImageApi(apiKey, prompt, aspectRatio) {

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

    var body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: aspectRatio ? { aspectRatio: aspectRatio } : undefined
      }
    };

    var res = await fetch(url + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error('API 오류 (' + res.status + '): ' + errText.slice(0, 200));
    }

    var data = await res.json();

    // 응답에서 이미지 base64 추출
    var candidates = data.candidates;
    if (!candidates || !candidates.length) throw new Error('응답에 이미지가 없습니다');

    var parts = candidates[0].content && candidates[0].content.parts;
    if (!parts) throw new Error('응답 형식 오류');

    for (var i = 0; i < parts.length; i++) {
      if (parts[i].inlineData || parts[i].inline_data) {
        var inlineData = parts[i].inlineData || parts[i].inline_data;
        return inlineData.data;
      }
    }

    throw new Error('응답에 이미지 데이터가 없습니다');
  }

  // ─── uploadAiBgToStorage ───

  async function uploadAiBgToStorage(base64Data) {
    var sb = B.getSB();
    if (!sb || !B.state.currentUser) return null;

    // MIME 타입 자동 감지 (JPEG: /9j/, PNG: iVBO, WebP: UklG)
    var mimeType = 'image/png';
    var ext = '.png';
    if (base64Data.charAt(0) === '/') { mimeType = 'image/jpeg'; ext = '.jpg'; }
    else if (base64Data.startsWith('UklG')) { mimeType = 'image/webp'; ext = '.webp'; }

    try {
      // base64 → Blob 변환
      var byteChars = atob(base64Data);
      var byteArray = new Uint8Array(byteChars.length);
      for (var i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
      var blob = new Blob([byteArray], { type: mimeType });

      // 파일명: user_id + timestamp
      var fileName = 'ai-bg/' + B.state.currentUser.id + '_' + Date.now() + ext;

      var result = await sb.storage
        .from('showcase-backgrounds')
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: false
        });

      if (result.error) {
        console.error('[board.js] Storage 업로드 실패:', result.error.message || result.error);
        alert('Storage 업로드 실패: ' + (result.error.message || '알 수 없는 오류'));
        // fallback: data URL
        return 'data:' + mimeType + ';base64,' + base64Data;
      }

      // public URL 가져오기
      var publicUrl = sb.storage
        .from('showcase-backgrounds')
        .getPublicUrl(fileName);

      var url = publicUrl.data ? publicUrl.data.publicUrl : null;
      console.log('[board.js] Storage 업로드 성공:', url);
      return url;
    } catch (err) {
      console.error('[board.js] Storage 업로드 오류:', err);
      // fallback: data URL 직접 사용
      return 'data:' + mimeType + ';base64,' + base64Data;
    }
  }

  // ─── Export to B namespace ───

  B.initAiBgGenerate = initAiBgGenerate;
  B.uploadAiBgToStorage = uploadAiBgToStorage;

})(window._B);
