/* ============================================
   UI 스타일 관리 모듈
   - 시대별 타임라인 배경색/글자색
   - 시 모달 섹션별 배경색
   - 폰트(캐릭터셋) 관리: 폰트, 크기, 굵기, 색상
   ============================================ */

// ─── 폰트 선택지 ───
const FONT_OPTIONS = [
  { value: "adobe-fangsong-std", label: "Adobe 仿宋 (Typekit)" },
  { value: "fangsong",           label: "시스템 仿宋" },
  { value: "LXGW WenKai Mono TC", label: "LXGW 霞鹜文楷" },
  { value: "Noto Serif TC",      label: "Noto 明朝 TC" },
  { value: "Noto Serif KR",      label: "Noto 명조 KR" },
  { value: "Georgia",            label: "Georgia" },
];

const WEIGHT_OPTIONS = [
  { value: 300, label: "가늘게 (300)" },
  { value: 400, label: "보통 (400)" },
  { value: 500, label: "중간 (500)" },
  { value: 600, label: "세미볼드 (600)" },
  { value: 700, label: "볼드 (700)" },
];

const ERA_LABELS = {
  early: "초당",
  high: "성당",
  mid: "중당",
  late: "만당",
};

const SECTION_LABELS = {
  poemText:     "시 본문",
  commentary:   "집평 (한자)",
  commentaryTr: "집평 (한글)",
  notes:        "주석",
  advanced:     "심화자료",
  workList:     "작품 리스트",
};

// ─── 기본값 (현재 CSS 하드코딩 값) ───
const UI_DEFAULTS = {
  version: 1,
  timeline: {
    early: { bg: "#ffffff", textColor: "#222222" },
    high:  { bg: "#f4f9ff", textColor: "#222222" },
    mid:   { bg: "#fffcf6", textColor: "#222222" },
    late:  { bg: "#f6fff9", textColor: "#222222" },
  },
  poemSections: {
    poemText:      { bg: "#faf8f5" },
    commentary:    { bg: "#f0ede7" },
    commentaryTr:  { bg: "#ece8e1" },
    notes:         { bg: "#e8e4dd" },
    advanced:      { bg: "#e4e0d9" },
    workList:      { bg: "#ffffff" },
  },
  fonts: {
    zhTitle: {
      label: "한자 제목 (시제목, 병음제목)",
      family: "adobe-fangsong-std",
      fallback: "'LXGW WenKai Mono TC', 'Noto Serif TC', serif",
      size: 22, weight: 700, color: "#222222",
    },
    zhBody: {
      label: "한자 본문 (시 본문, 집평 한자)",
      family: "adobe-fangsong-std",
      fallback: "'LXGW WenKai Mono TC', 'Noto Serif TC', serif",
      size: 18, weight: 400, color: "#222222",
    },
    zhPoet: {
      label: "한자 시인명 (시인명, 시인카드)",
      family: "adobe-fangsong-std",
      fallback: "'LXGW WenKai Mono TC', 'Noto Serif TC', serif",
      size: 16, weight: 400, color: "#3a2a18",
    },
    koBody: {
      label: "한글 본문 (번역, 해설)",
      family: "Noto Serif KR",
      fallback: "'Noto Serif TC', Georgia, serif",
      size: 17, weight: 400, color: "#555555",
    },
    koMeta: {
      label: "한글 보조 (메타정보, 라벨)",
      family: "Noto Serif KR",
      fallback: "Georgia, serif",
      size: 13, weight: 400, color: "#777777",
    },
  },
};

// ─── 상태 ───
let uiSettings = null;       // 현재 편집 중인 설정
let uiSettingsOriginal = null; // 로딩 시점 원본

// ─── 초기화 ───
function initUIManager() {
  uiSettings = structuredClone(DATA.uiSettings || UI_DEFAULTS);
  uiSettingsOriginal = structuredClone(uiSettings);
  renderEraColors();
  renderSectionColors();
  renderFontSettings();
  renderPreview();
  bindUIManagerEvents();
}

// ─── 이벤트 바인딩 ───
function bindUIManagerEvents() {
  document.getElementById("btn-ui-reset").addEventListener("click", () => {
    if (!confirm("모든 UI 설정을 기본값으로 복원하시겠습니까?")) return;
    uiSettings = structuredClone(UI_DEFAULTS);
    DATA.uiSettings = uiSettings;
    renderEraColors();
    renderSectionColors();
    renderFontSettings();
    renderPreview();
    checkChanges();
    showToast("기본값으로 복원됨");
  });
}

// ─── 1. 시대별 타임라인 배경색 (4컬럼) ───
function renderEraColors() {
  const grid = document.getElementById("era-color-grid");
  grid.innerHTML = Object.entries(ERA_LABELS).map(([key, label]) => {
    const era = uiSettings.timeline[key];
    return `
      <div class="era-color-col">
        <div class="era-color-header">${label}</div>
        <label class="ui-label">배경색
          <input type="color" value="${era.bg}" data-era="${key}" data-field="bg" class="ui-color-input era-color-pick">
          <input type="text" value="${era.bg}" data-era="${key}" data-field="bg" class="ui-color-text era-color-text" maxlength="7">
        </label>
        <label class="ui-label">글자색
          <input type="color" value="${era.textColor}" data-era="${key}" data-field="textColor" class="ui-color-input era-color-pick">
          <input type="text" value="${era.textColor}" data-era="${key}" data-field="textColor" class="ui-color-text era-color-text" maxlength="7">
        </label>
        <div class="era-color-preview" style="background:${era.bg}; color:${era.textColor}">
          <span style="font-size:14px">${label} 미리보기</span>
        </div>
      </div>`;
  }).join("");

  // 컬러피커 이벤트
  grid.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.classList.contains("era-color-pick") && !el.classList.contains("era-color-text")) return;
    const era = el.dataset.era;
    const field = el.dataset.field;
    const val = el.value;
    uiSettings.timeline[era][field] = val;

    // 피커↔텍스트 동기화
    const row = el.closest("label");
    if (el.classList.contains("era-color-pick")) {
      row.querySelector(".era-color-text").value = val;
    } else {
      const picker = row.querySelector(".era-color-pick");
      if (/^#[0-9a-f]{6}$/i.test(val)) picker.value = val;
    }

    // 미리보기 갱신
    const col = el.closest(".era-color-col");
    const preview = col.querySelector(".era-color-preview");
    preview.style.background = uiSettings.timeline[era].bg;
    preview.style.color = uiSettings.timeline[era].textColor;

    syncToData();
  });
}

// ─── 2. 섹션별 배경색 ───
function renderSectionColors() {
  const grid = document.getElementById("section-color-grid");
  grid.innerHTML = Object.entries(SECTION_LABELS).map(([key, label]) => {
    const sec = uiSettings.poemSections[key];
    return `
      <div class="section-color-item">
        <label class="ui-label">${label}
          <input type="color" value="${sec.bg}" data-sec="${key}" class="ui-color-input sec-color-pick">
          <input type="text" value="${sec.bg}" data-sec="${key}" class="ui-color-text sec-color-text" maxlength="7">
        </label>
        <div class="section-color-swatch" style="background:${sec.bg}"></div>
      </div>`;
  }).join("");

  grid.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.classList.contains("sec-color-pick") && !el.classList.contains("sec-color-text")) return;
    const key = el.dataset.sec;
    const val = el.value;
    uiSettings.poemSections[key].bg = val;

    const row = el.closest("label");
    if (el.classList.contains("sec-color-pick")) {
      row.querySelector(".sec-color-text").value = val;
    } else {
      const picker = row.querySelector(".sec-color-pick");
      if (/^#[0-9a-f]{6}$/i.test(val)) picker.value = val;
    }

    const item = el.closest(".section-color-item");
    item.querySelector(".section-color-swatch").style.background = val;
    syncToData();
  });
}

// ─── 3. 폰트 설정 ───
function renderFontSettings() {
  const list = document.getElementById("font-settings-list");
  list.innerHTML = Object.entries(uiSettings.fonts).map(([key, f]) => {
    const familyOpts = FONT_OPTIONS.map(o =>
      `<option value="${o.value}"${o.value === f.family ? " selected" : ""}>${o.label}</option>`
    ).join("");
    const weightOpts = WEIGHT_OPTIONS.map(o =>
      `<option value="${o.value}"${o.value === f.weight ? " selected" : ""}>${o.label}</option>`
    ).join("");

    return `
      <div class="font-setting-card" data-fkey="${key}">
        <div class="font-setting-header">${f.label}</div>
        <div class="font-setting-body">
          <label class="ui-label">폰트
            <select data-fkey="${key}" data-ffield="family" class="font-select">${familyOpts}</select>
          </label>
          <label class="ui-label">크기 (px)
            <input type="number" value="${f.size}" min="10" max="48" data-fkey="${key}" data-ffield="size" class="font-size-input">
          </label>
          <label class="ui-label">굵기
            <select data-fkey="${key}" data-ffield="weight" class="font-weight-select">${weightOpts}</select>
          </label>
          <label class="ui-label">색상
            <input type="color" value="${f.color}" data-fkey="${key}" data-ffield="color" class="ui-color-input font-color-pick">
            <input type="text" value="${f.color}" data-fkey="${key}" data-ffield="color" class="ui-color-text font-color-text" maxlength="7">
          </label>
        </div>
        <div class="font-preview" data-fkey="${key}" style="font-family:${f.family},${f.fallback}; font-size:${f.size}px; font-weight:${f.weight}; color:${f.color}">
          ${key.startsWith("zh") ? "春眠不覺曉 處處聞啼鳥 ABC abc 123" : "봄잠에 깨지 못하여 곳곳에 새소리 ABC 123"}
        </div>
      </div>`;
  }).join("");

  list.addEventListener("input", onFontSettingChange);
  list.addEventListener("change", onFontSettingChange);
}

function onFontSettingChange(e) {
  const el = e.target;
  const fkey = el.dataset.fkey;
  const ffield = el.dataset.ffield;
  if (!fkey || !ffield) return;

  let val = el.value;
  if (ffield === "size") val = parseInt(val) || 16;
  if (ffield === "weight") val = parseInt(val) || 400;

  uiSettings.fonts[fkey][ffield] = val;

  // 컬러 피커↔텍스트 동기화
  if (ffield === "color") {
    const card = el.closest(".font-setting-card");
    if (el.classList.contains("font-color-pick")) {
      card.querySelector(".font-color-text").value = val;
    } else if (el.classList.contains("font-color-text")) {
      const picker = card.querySelector(".font-color-pick");
      if (/^#[0-9a-f]{6}$/i.test(val)) picker.value = val;
    }
  }

  // 미리보기 갱신
  const f = uiSettings.fonts[fkey];
  const preview = document.querySelector(`.font-preview[data-fkey="${fkey}"]`);
  if (preview) {
    preview.style.fontFamily = `${f.family}, ${f.fallback}`;
    preview.style.fontSize = `${f.size}px`;
    preview.style.fontWeight = f.weight;
    preview.style.color = f.color;
  }

  syncToData();
}

// ─── 4. 종합 미리보기 ───
function renderPreview() {
  const wrap = document.getElementById("ui-preview-wrap");
  const tl = uiSettings.timeline;
  const ps = uiSettings.poemSections;
  const ft = uiSettings.fonts;

  wrap.innerHTML = `
    <div class="ui-preview-section">
      <div class="ui-preview-label">타임라인 배경</div>
      <div class="ui-preview-timeline">
        ${Object.entries(ERA_LABELS).map(([k, l]) => `
          <div class="ui-prev-era" style="background:${tl[k].bg}; color:${tl[k].textColor}">
            <strong>${l}</strong>
            <span style="font-family:${ft.zhPoet.family},${ft.zhPoet.fallback}; font-size:14px">李白 杜甫</span>
          </div>`).join("")}
      </div>
    </div>
    <div class="ui-preview-section">
      <div class="ui-preview-label">시 모달 섹션</div>
      <div class="ui-preview-poem">
        <div style="background:${ps.poemText.bg}; padding:12px">
          <div style="font-family:${ft.zhTitle.family},${ft.zhTitle.fallback}; font-size:${ft.zhTitle.size}px; font-weight:${ft.zhTitle.weight}; color:${ft.zhTitle.color}; text-align:center; margin-bottom:4px">春曉</div>
          <div style="font-family:${ft.zhPoet.family},${ft.zhPoet.fallback}; font-size:${ft.zhPoet.size}px; font-weight:${ft.zhPoet.weight}; color:${ft.zhPoet.color}; text-align:right; margin-bottom:8px">孟浩然</div>
          <div style="display:flex; gap:16px">
            <div style="font-family:${ft.zhBody.family},${ft.zhBody.fallback}; font-size:${ft.zhBody.size}px; font-weight:${ft.zhBody.weight}; color:${ft.zhBody.color}">春眠不覺曉<br>處處聞啼鳥</div>
            <div style="font-family:${ft.koBody.family},${ft.koBody.fallback}; font-size:${ft.koBody.size}px; font-weight:${ft.koBody.weight}; color:${ft.koBody.color}">봄잠에 깨지 못하여<br>곳곳에서 새소리 들리네</div>
          </div>
        </div>
        <div style="background:${ps.commentary.bg}; padding:8px 12px; font-family:${ft.zhBody.family},${ft.zhBody.fallback}; font-size:14px; color:${ft.zhBody.color}">
          <span style="font-size:12px; color:${ft.koMeta.color}; font-weight:600">집평 (한자)</span><br>
          此詩以春眠為題
        </div>
        <div style="background:${ps.commentaryTr.bg}; padding:8px 12px; font-family:${ft.koBody.family},${ft.koBody.fallback}; font-size:14px; color:${ft.koBody.color}">
          <span style="font-size:12px; color:${ft.koMeta.color}; font-weight:600">집평 (한글)</span><br>
          이 시는 봄잠을 주제로 하여
        </div>
        <div style="background:${ps.notes.bg}; padding:8px 12px; font-size:13px; color:${ft.koBody.color}">
          <span style="font-size:12px; color:${ft.koMeta.color}; font-weight:600">주석</span><br>
          [1] 春眠 — 봄잠
        </div>
        <div style="background:${ps.advanced.bg}; padding:8px 12px; font-size:13px; color:${ft.koMeta.color}">
          <span style="font-size:12px; font-weight:600">심화자료</span>
        </div>
      </div>
    </div>`;
}

// ─── DATA 동기화 + 변경감지 ───
function syncToData() {
  DATA.uiSettings = uiSettings;
  renderPreview();
  checkChanges();
}

// 변경 여부 체크 (admin.js의 checkChanges에서 호출)
function isUISettingsModified() {
  if (!uiSettingsOriginal || !uiSettings) return false;
  return JSON.stringify(uiSettings) !== JSON.stringify(uiSettingsOriginal);
}
