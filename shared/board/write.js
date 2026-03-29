// =============================================================
//  board/write.js — 글쓰기/수정 폼 + Quill + 파일첨부 + 배경 템플릿
//  namespace: window._B
// =============================================================

(function (B) {
  'use strict';

  // ─── Render.writeForm ───

  B.Render.writeForm = function (post) {
    var container = document.getElementById(B.state.config.containerId);
    if (!container) return;

    var isEdit = !!post;
    var heading = isEdit ? '글 수정' : '글쓰기';

    var html = '';
    html += '<div class="board-write-overlay">';

    // 상단 네비
    html += '  <div class="board-detail-nav">';
    html += '    <button class="board-back-btn" data-action="cancel-write">&larr; 돌아가기</button>';
    html += '  </div>';

    // 폼
    html += '  <form class="board-write-form" id="boardWriteForm">';
    html += '    <h2 class="board-write-heading">' + heading + '</h2>';

    // 제목 (showcase에서는 숨김 — 시 제목이 글 제목 역할)
    if (B.state.config.board === 'showcase') {
      html += '    <input type="hidden" id="postTitle" value="' + (isEdit ? B.escapeHTML(post.title) : '') + '">';
    } else {
      html += '    <div class="board-form-group">';
      html += '      <label for="postTitle">제목 <span class="required">*</span></label>';
      html += '      <input type="text" id="postTitle" class="board-form-input" maxlength="200" required';
      html += '        placeholder="제목을 입력하세요"';
      html += '        value="' + (isEdit ? B.escapeHTML(post.title) : '') + '">';
      html += '    </div>';
    }

    // showcase 전용 필드
    if (B.state.config.board === 'showcase') {
      html += '    <div class="board-form-group">';
      html += '      <label for="poemTitle">시 제목</label>';
      html += '      <input type="text" id="poemTitle" class="board-form-input zh" maxlength="200"';
      html += '        placeholder="예: 靜夜思"';
      html += '        value="' + (isEdit && post.poem_title ? B.escapeHTML(post.poem_title) : '') + '">';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemBody">시 원문</label>';
      html += '      <textarea id="poemBody" class="board-form-textarea zh" rows="6"';
      html += '        placeholder="한시 원문을 입력하세요">';
      html += (isEdit && post.poem_body ? B.escapeHTML(post.poem_body) : '');
      html += '</textarea>';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label for="poemTranslation">한국어 번역</label>';
      html += '      <p class="board-form-hint">한국어는 그림에 합성되지 않습니다. 필요하지 않으면 적지 않으셔도 돼요.</p>';
      html += '      <textarea id="poemTranslation" class="board-form-textarea" rows="4"';
      html += '        placeholder="한국어 번역을 입력하세요">';
      html += (isEdit && post.poem_translation ? B.escapeHTML(post.poem_translation) : '');
      html += '</textarea>';
      html += '    </div>';

      html += '    <div class="board-form-group">';
      html += '      <label>작시 메모</label>';
      html += '      <div class="board-editor-wrap">';
      html += '        <div id="poemNotesEditor"></div>';
      html += '      </div>';
      html += '    </div>';

      // 폰트 선택
      var selectedFont = (isEdit && post.font_style) ? post.font_style : 'fangsong';
      html += '    <div class="board-form-group">';
      html += '      <label for="fontStyle">서체 선택</label>';
      html += '      <select id="fontStyle" class="board-form-select">';
      html += '        <option value="fangsong"' + (selectedFont === 'fangsong' ? ' selected' : '') + '>仿宋 — 방송체 (기본)</option>';
      html += '        <option value="wenkai"' + (selectedFont === 'wenkai' ? ' selected' : '') + '>楷書 — 해서체</option>';
      html += '        <option value="mashanzheng"' + (selectedFont === 'mashanzheng' ? ' selected' : '') + '>行書 — 행서체 (Ma Shan Zheng)</option>';
      html += '        <option value="zhimangxing"' + (selectedFont === 'zhimangxing' ? ' selected' : '') + '>草書 — 초서체 (Zhi Mang Xing)</option>';
      html += '        <option value="liujianmaocao"' + (selectedFont === 'liujianmaocao' ? ' selected' : '') + '>草書 — 유건모초 (Liu Jian Mao Cao)</option>';
      html += '        <option value="longcang"' + (selectedFont === 'longcang' ? ' selected' : '') + '>行書 — 용장체 (Long Cang)</option>';
      html += '      </select>';
      html += '      <div id="fontPreviewBox" class="board-font-preview poem-font-' + selectedFont + '">床前明月光 疑是地上霜</div>';
      html += '    </div>';

      // 배경 선택
      var selectedBg = (isEdit && post.bg_template_id) ? post.bg_template_id : 'none';
      html += '    <div class="board-form-group">';
      html += '      <label>배경 선택</label>';
      html += '      <input type="hidden" id="bgTemplateId" value="' + selectedBg + '">';
      html += '      <div id="bgTemplateGrid" class="board-bg-grid">';
      html += '        <div class="board-bg-loading">배경 목록 불러오는 중...</div>';
      html += '      </div>';
      html += '      <div id="bgPreviewBox" class="board-bg-preview"></div>';
      html += '    </div>';

      // AI 배경 생성 — 선택지 기반
      html += '    <div class="board-form-group">';
      html += '      <label>AI 배경 생성</label>';
      html += '      <div class="board-ai-bg-wrap">';

      // 비율
      html += '        <div class="ai-opt-row">';
      html += '          <span class="ai-opt-label">비율</span>';
      html += '          <div class="ai-opt-chips" data-group="ratio">';
      html += '            <button type="button" class="ai-chip selected" data-value="square">정방형 (1:1)</button>';
      html += '            <button type="button" class="ai-chip" data-value="landscape">가로형 (3:2)</button>';
      html += '            <button type="button" class="ai-chip" data-value="portrait">세로형 (2:3)</button>';
      html += '          </div>';
      html += '        </div>';


      // 스타일 (1단계)
      html += '        <div class="ai-opt-row">';
      html += '          <span class="ai-opt-label">스타일</span>';
      html += '          <div class="ai-opt-chips" data-group="style">';
      html += '            <button type="button" class="ai-chip selected" data-value="oriental">동양화</button>';
      html += '            <button type="button" class="ai-chip" data-value="western">서양화</button>';
      html += '          </div>';
      html += '        </div>';

      // ── 동양화 서브옵션 ──
      html += '        <div class="ai-sub-options" id="aiSubOriental">';
      // 기법
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">기법</span>';
      html += '            <div class="ai-opt-chips" data-group="oriental-technique">';
      html += '              <button type="button" class="ai-chip selected" data-value="literati">문인화풍</button>';
      html += '              <button type="button" class="ai-chip" data-value="colored">채색화풍</button>';
      html += '              <button type="button" class="ai-chip" data-value="gongbi">공필화풍</button>';
      html += '            </div>';
      html += '          </div>';
      // 소재
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">소재</span>';
      html += '            <div class="ai-opt-chips" data-group="oriental-subject">';
      html += '              <button type="button" class="ai-chip selected" data-value="landscape">산수</button>';
      html += '              <button type="button" class="ai-chip" data-value="stilllife">정물</button>';
      html += '              <button type="button" class="ai-chip" data-value="figure">인물</button>';
      html += '              <button type="button" class="ai-chip" data-value="fourplants">사군자</button>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 산수
      html += '          <div class="ai-sub-branch" id="aiBranchLandscape">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips" data-group="oriental-landscape-detail">';
      html += '                <button type="button" class="ai-chip selected" data-value="guilin">계림풍 산수화</button>';
      html += '                <button type="button" class="ai-chip" data-value="jingyeong">진경산수화풍</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 정물
      html += '          <div class="ai-sub-branch" id="aiBranchStilllife" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips" data-group="oriental-stilllife-detail">';
      html += '                <button type="button" class="ai-chip selected" data-value="yeongmo">영모화 (새와 짐승)</button>';
      html += '                <button type="button" class="ai-chip" data-value="hwajo">화조화 (새와 꽃)</button>';
      html += '                <button type="button" class="ai-chip" data-value="chochung">초충화 (풀과 벌레)</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 인물
      html += '          <div class="ai-sub-branch" id="aiBranchFigure" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips" data-group="oriental-figure-detail">';
      html += '                <button type="button" class="ai-chip selected" data-value="waiting">기다리는 여인</button>';
      html += '                <button type="button" class="ai-chip" data-value="walking">숲길을 걷는 선비</button>';
      html += '                <button type="button" class="ai-chip" data-value="fishing">낚시하는 노인과 배</button>';
      html += '                <button type="button" class="ai-chip" data-value="reading">숲속에서 책 읽는 선비</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 사군자
      html += '          <div class="ai-sub-branch" id="aiBranchFourplants" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">세부</span>';
      html += '              <div class="ai-opt-chips ai-opt-multi" data-group="oriental-fourplants-detail">';
      html += '                <button type="button" class="ai-chip" data-value="plum">매화</button>';
      html += '                <button type="button" class="ai-chip" data-value="orchid">난초</button>';
      html += '                <button type="button" class="ai-chip" data-value="chrysanthemum">국화</button>';
      html += '                <button type="button" class="ai-chip" data-value="bamboo">대나무</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      html += '        </div>';

      // ── 서양화 서브옵션 ──
      html += '        <div class="ai-sub-options" id="aiSubWestern" style="display:none">';
      // 기법
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">기법</span>';
      html += '            <div class="ai-opt-chips" data-group="western-technique">';
      html += '              <button type="button" class="ai-chip selected" data-value="impressionist">인상파 유채화</button>';
      html += '              <button type="button" class="ai-chip" data-value="detailed-oil">세밀한 유채화</button>';
      html += '              <button type="button" class="ai-chip" data-value="watercolor">수채화</button>';
      html += '              <button type="button" class="ai-chip" data-value="pastel">파스텔화</button>';
      html += '              <button type="button" class="ai-chip" data-value="illustration">일러스트</button>';
      html += '              <button type="button" class="ai-chip" data-value="photo">실사풍</button>';
      html += '            </div>';
      html += '          </div>';
      // 소재
      html += '          <div class="ai-opt-row">';
      html += '            <span class="ai-opt-label">소재</span>';
      html += '            <div class="ai-opt-chips" data-group="western-subject">';
      html += '              <button type="button" class="ai-chip selected" data-value="scenery">풍경</button>';
      html += '              <button type="button" class="ai-chip" data-value="still">정물</button>';
      html += '              <button type="button" class="ai-chip" data-value="person">인물</button>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 풍경
      html += '          <div class="ai-sub-branch" id="aiBranchScenery">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">계절</span>';
      html += '              <div class="ai-opt-chips" data-group="western-season">';
      html += '                <button type="button" class="ai-chip" data-value="spring">봄</button>';
      html += '                <button type="button" class="ai-chip" data-value="summer">여름</button>';
      html += '                <button type="button" class="ai-chip" data-value="autumn">가을</button>';
      html += '                <button type="button" class="ai-chip" data-value="winter">겨울</button>';
      html += '                <button type="button" class="ai-chip selected" data-value="any-season">무관</button>';
      html += '              </div>';
      html += '            </div>';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">배경</span>';
      html += '              <div class="ai-opt-chips" data-group="western-place">';
      html += '                <button type="button" class="ai-chip selected" data-value="mountain-river">산과 강</button>';
      html += '                <button type="button" class="ai-chip" data-value="lake">호수</button>';
      html += '                <button type="button" class="ai-chip" data-value="sea">바다</button>';
      html += '                <button type="button" class="ai-chip" data-value="city">도시</button>';
      html += '                <button type="button" class="ai-chip" data-value="village">동아시아풍 시골</button>';
      html += '              </div>';
      html += '            </div>';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">시간</span>';
      html += '              <div class="ai-opt-chips" data-group="western-time">';
      html += '                <button type="button" class="ai-chip" data-value="dawn">아침(새벽)</button>';
      html += '                <button type="button" class="ai-chip" data-value="afternoon">맑은 오후</button>';
      html += '                <button type="button" class="ai-chip" data-value="sunset">노을진 저녁</button>';
      html += '                <button type="button" class="ai-chip" data-value="rainy">비오는 날</button>';
      html += '                <button type="button" class="ai-chip" data-value="snowy">눈오는 날</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 정물
      html += '          <div class="ai-sub-branch" id="aiBranchStill" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">분위기</span>';
      html += '              <div class="ai-opt-chips" data-group="western-still-mood">';
      html += '                <button type="button" class="ai-chip selected" data-value="bright-mood">밝고 화사한</button>';
      html += '                <button type="button" class="ai-chip" data-value="dark-mood">어둡고 쓸쓸한</button>';
      html += '                <button type="button" class="ai-chip" data-value="any-mood">무관</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      // 분기: 인물
      html += '          <div class="ai-sub-branch" id="aiBranchPerson" style="display:none">';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">인물</span>';
      html += '              <div class="ai-opt-chips" data-group="western-person-gender">';
      html += '                <button type="button" class="ai-chip selected" data-value="male">남성</button>';
      html += '                <button type="button" class="ai-chip" data-value="female">여성</button>';
      html += '                <button type="button" class="ai-chip" data-value="couple">남과 여</button>';
      html += '              </div>';
      html += '            </div>';
      html += '            <div class="ai-opt-row">';
      html += '              <span class="ai-opt-label">표정</span>';
      html += '              <div class="ai-opt-chips" data-group="western-person-mood">';
      html += '                <button type="button" class="ai-chip selected" data-value="happy">밝은 표정</button>';
      html += '                <button type="button" class="ai-chip" data-value="melancholy">어둡고 쓸쓸한</button>';
      html += '                <button type="button" class="ai-chip" data-value="sad">슬픈 표정</button>';
      html += '                <button type="button" class="ai-chip" data-value="crying">우는 표정</button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      html += '        </div>';

      // 생성 버튼 (가운데 정렬 + AI 아이콘)
      html += '        <div class="board-ai-bg-actions" style="justify-content:center">';
      html += '          <button type="button" id="aiBgGenerateBtn" class="board-ai-bg-btn">';
      html += '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7z"/></svg>';
      html += '            AI 배경 생성';
      html += '          </button>';
      html += '        </div>';
      html += '        <div id="aiBgFormPreview" class="board-ai-form-preview"></div>';
      html += '        <input type="hidden" id="aiBgImageData" value="">';
      html += '        <input type="hidden" id="textPositionData" value="">';

      html += '      </div>';
      html += '    </div>';
    }

    // 본문 (Quill 에디터) — showcase는 작시메모 에디터를 사용하므로 제외
    if (B.state.config.board !== 'showcase') {
      html += '    <div class="board-form-group">';
      html += '      <label>내용</label>';
      html += '      <div class="board-editor-wrap">';
      html += '        <div id="postBodyEditor"></div>';
      html += '      </div>';
      html += '    </div>';
    }

    // 구분선
    html += '    <hr class="board-form-divider">';

    // 태그
    html += '    <div class="board-form-group">';
    html += '      <label for="postTags">태그</label>';
    html += '      <input type="text" id="postTags" class="board-form-input"';
    html += '        placeholder="예: 한시,칠언율시,이백"';
    html += '        value="' + (isEdit && post.tags ? B.escapeHTML(post.tags.join(',')) : '') + '">';
    html += '      <p class="board-form-hint">콤마(,)로 구분하여 복수 태그 등록 가능</p>';
    html += '    </div>';

    // 링크 (showcase에서는 숨김)
    if (B.state.config.board !== 'showcase') {
    html += '    <div class="board-form-group">';
    html += '      <label>링크</label>';
    html += '      <div class="board-form-links">';
    html += '        <input type="url" id="postLink1" class="board-form-input" placeholder="https://..."';
    html += '          value="' + (isEdit && post.links && post.links[0] ? B.escapeHTML(post.links[0]) : '') + '">';
    html += '        <input type="url" id="postLink2" class="board-form-input" placeholder="https://..."';
    html += '          value="' + (isEdit && post.links && post.links[1] ? B.escapeHTML(post.links[1]) : '') + '">';
    html += '      </div>';
    html += '    </div>';
    }

    // 첨부 (showcase에서는 숨김)
    if (B.state.config.board !== 'showcase') {
    html += '    <div class="board-form-group">';
    html += '      <label>첨부</label>';
    html += '      <div class="board-form-attach">';
    html += '        <label class="board-form-attach-label">';
    html += '          &#x1F4CE; 파일 선택';
    html += '          <input type="file" id="postFile" multiple accept="image/*,.pdf,.doc,.docx,.txt">';
    html += '        </label>';
    html += '        <span class="board-form-attach-info">10MB 이하 파일만 업로드 가능</span>';
    html += '      </div>';
    html += '      <div class="board-form-attach-list" id="attachList"></div>';
    html += '    </div>';
    }

    // 버튼
    html += '    <div class="board-form-actions">';
    html += '      <button type="button" class="board-cancel-btn" data-action="cancel-write">취소</button>';
    html += '      <button type="submit" class="board-submit-btn">' + (isEdit ? '수정 완료' : '작성완료') + '</button>';
    html += '    </div>';

    html += '  </form>';
    html += '</div>';

    container.innerHTML = html;

    // Quill 에디터 초기화 — showcase는 작시메모, 그 외는 본문
    var quillInitContent = '';
    if (isEdit) {
      quillInitContent = B.state.config.board === 'showcase' ? (post.poem_notes || '') : (post.body || '');
    }
    B.initQuillEditor(quillInitContent);

    // 파일 첨부 이벤트
    B.initFileAttach();

    // 폰트 미리보기 이벤트 (showcase)
    if (B.state.config.board === 'showcase') {
      var fontSelect = document.getElementById('fontStyle');
      var fontPreview = document.getElementById('fontPreviewBox');
      var poemBodyEl = document.getElementById('poemBody');
      if (fontSelect) {
        fontSelect.addEventListener('change', function () {
          var cls = 'poem-font-' + fontSelect.value;
          if (fontPreview) fontPreview.className = 'board-font-preview ' + cls;
          if (poemBodyEl) poemBodyEl.className = 'board-form-textarea zh ' + cls;
        });
      }

      // 배경 템플릿 그리드 로드
      B.loadBgTemplates(selectedBg);

      // AI 배경 생성 버튼 이벤트
      B.initAiBgGenerate();
    }

    // 제목 필드에 포커스
    var titleEl = document.getElementById('postTitle');
    if (titleEl) titleEl.focus();
  };

  // ─── loadBgTemplates ───

  async function loadBgTemplates(selectedId) {
    var grid = document.getElementById('bgTemplateGrid');
    var hiddenInput = document.getElementById('bgTemplateId');
    var previewBox = document.getElementById('bgPreviewBox');
    if (!grid) return;

    // 캐시 확인
    if (!B.bgTemplates) {
      try {
        var res = await fetch('/public/assets/showcase-bg/templates.json?_ts=' + Date.now());
        var data = await res.json();
        B.bgTemplates = data.templates || [];
      } catch (e) {
        console.error('[board.js] 배경 템플릿 로드 실패:', e);
        grid.innerHTML = '<div class="board-bg-loading">배경 목록을 불러올 수 없습니다</div>';
        return;
      }
    }

    // 그리드 HTML 생성
    var html = '';
    B.bgTemplates.forEach(function (tpl) {
      var isSelected = tpl.id === selectedId;
      var thumbStyle = tpl.css || 'background-color: transparent; border: 2px dashed #ccc;';
      html += '<div class="board-bg-thumb' + (isSelected ? ' selected' : '') + '"';
      html += ' data-bg-id="' + tpl.id + '"';
      html += ' data-bg-css="' + B.escapeHTML(tpl.css || '') + '"';
      html += ' title="' + B.escapeHTML(tpl.name) + '">';
      html += '<div class="board-bg-thumb-inner" style="' + thumbStyle + '"></div>';
      html += '<span class="board-bg-thumb-name">' + B.escapeHTML(tpl.name) + '</span>';
      html += '</div>';
    });
    grid.innerHTML = html;

    // 미리보기 업데이트
    function updatePreview(css) {
      if (!previewBox) return;
      if (!css) {
        previewBox.style.cssText = '';
        previewBox.textContent = '';
        previewBox.classList.remove('active');
      } else {
        previewBox.style.cssText = css;
        previewBox.textContent = '床前明月光 疑是地上霜 舉頭望明月 低頭思故鄉';
        previewBox.classList.add('active');
      }
    }

    // 초기 미리보기
    var selectedTpl = B.bgTemplates.find(function (t) { return t.id === selectedId; });
    if (selectedTpl && selectedTpl.css) updatePreview(selectedTpl.css);

    // 클릭 이벤트 (이벤트 위임)
    grid.addEventListener('click', function (e) {
      var thumb = e.target.closest('.board-bg-thumb');
      if (!thumb) return;

      // 이전 선택 해제
      grid.querySelectorAll('.board-bg-thumb.selected').forEach(function (el) {
        el.classList.remove('selected');
      });

      // 현재 선택
      thumb.classList.add('selected');
      var bgId = thumb.getAttribute('data-bg-id');
      var bgCss = thumb.getAttribute('data-bg-css');
      if (hiddenInput) hiddenInput.value = bgId;

      updatePreview(bgCss);
    });
  }

  // ─── initQuillEditor ───

  function initQuillEditor(initialContent) {
    // showcase → 작시메모 에디터, 그 외 → 본문 에디터
    var editorId = B.state.config.board === 'showcase' ? 'poemNotesEditor' : 'postBodyEditor';
    var editorEl = document.getElementById(editorId);
    if (!editorEl) return;

    var placeholder = B.state.config.board === 'showcase'
      ? '시를 지은 배경이나 메모를 남겨보세요...'
      : '내용을 입력하세요...';

    // Quill 미로드 시 textarea 폴백
    if (typeof Quill === 'undefined') {
      console.warn('[board.js] Quill 미로드 — textarea 폴백');
      var wrap = editorEl.closest('.board-editor-wrap');
      if (wrap) {
        var ta = document.createElement('textarea');
        ta.id = B.state.config.board === 'showcase' ? 'poemNotes' : 'postBody';
        ta.className = 'board-form-textarea';
        ta.rows = 10;
        ta.placeholder = placeholder;
        ta.value = initialContent || '';
        wrap.replaceWith(ta);
      }
      B.quillInstance = null;
      return;
    }

    B.quillInstance = new Quill('#' + editorId, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean']
        ]
      }
    });

    // 수정 모드: 기존 내용 넣기
    if (initialContent) {
      if (initialContent.charAt(0) === '<') {
        B.quillInstance.root.innerHTML = initialContent;
      } else {
        B.quillInstance.setText(initialContent);
      }
    }
  }

  // ─── initFileAttach ───

  function initFileAttach() {
    B.attachedFiles = [];
    var fileInput = document.getElementById('postFile');
    if (!fileInput) return;

    fileInput.addEventListener('change', function () {
      var files = Array.from(this.files);
      files.forEach(function (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert(file.name + ': 10MB를 초과합니다.');
          return;
        }
        B.attachedFiles.push(file);
      });
      renderAttachList();
      fileInput.value = '';
    });
  }

  // ─── renderAttachList ───

  function renderAttachList() {
    var list = document.getElementById('attachList');
    if (!list) return;
    var html = '';
    B.attachedFiles.forEach(function (file, index) {
      html += '<span class="board-form-attach-item">';
      html += B.escapeHTML(file.name);
      html += ' <button type="button" class="board-form-attach-remove" data-action="remove-attach" data-index="' + index + '">&times;</button>';
      html += '</span>';
    });
    list.innerHTML = html;
  }

  // ─── Export to B namespace ───

  B.loadBgTemplates = loadBgTemplates;
  B.initQuillEditor = initQuillEditor;
  B.initFileAttach = initFileAttach;
  B.renderAttachList = renderAttachList;

})(window._B);
