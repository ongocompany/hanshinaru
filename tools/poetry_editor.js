const { pinyin } = pinyinPro;

// 평측 기호: 1=평, 2=측, 3=운(평)
const TEMPLATES = {
  "5-jue-ping": {
    rows: 4, cols: 5,
    pattern: [
      [0, 1, 0, 2, 2], [0, 2, 1, 1, 3],
      [0, 2, 0, 1, 2], [0, 1, 0, 2, 3]
    ]
  },
  "5-jue-ze": {
    rows: 4, cols: 5,
    pattern: [
      [0, 2, 1, 1, 2], [0, 1, 0, 2, 3],
      [0, 1, 0, 2, 2], [0, 2, 1, 1, 3]
    ]
  },
  "7-jue-ping": {
    rows: 4, cols: 7,
    pattern: [
      [0, 1, 0, 2, 1, 1, 3], [0, 2, 0, 1, 0, 2, 3],
      [0, 2, 0, 1, 0, 2, 2], [0, 1, 0, 2, 1, 1, 3]
    ]
  },
  "7-jue-ze": {
    rows: 4, cols: 7,
    pattern: [
      [0, 2, 0, 1, 0, 2, 3], [0, 1, 0, 2, 1, 1, 3],
      [0, 1, 0, 2, 0, 2, 2], [0, 2, 0, 1, 0, 2, 3]
    ]
  },
  "5-lu-ping": {
    rows: 8, cols: 5,
    pattern: [
      [0, 1, 0, 2, 2], [0, 2, 1, 1, 3],
      [0, 2, 0, 1, 2], [0, 1, 0, 2, 3],
      [0, 1, 0, 2, 2], [0, 2, 1, 1, 3],
      [0, 2, 0, 1, 2], [0, 1, 0, 2, 3]
    ]
  },
  "7-lu-ping": {
    rows: 8, cols: 7,
    pattern: [
      [0, 1, 0, 2, 1, 1, 3], [0, 2, 0, 1, 0, 2, 3],
      [0, 2, 0, 1, 0, 2, 2], [0, 1, 0, 2, 1, 1, 3],
      [0, 1, 0, 2, 1, 1, 2], [0, 2, 0, 1, 0, 2, 3],
      [0, 2, 0, 1, 0, 2, 2], [0, 1, 0, 2, 1, 1, 3]
    ]
  }
};

const editorGrid = document.getElementById("editor-grid");
const templateSelect = document.getElementById("template-select");
const analysisResult = document.getElementById("analysis-result");
const btnReset = document.getElementById("btn-reset");
const btnCopy = document.getElementById("btn-copy");

let currentTemplate = TEMPLATES["5-jue-ping"];

function init() {
  renderGrid();
  templateSelect.addEventListener("change", (e) => {
    currentTemplate = TEMPLATES[e.target.value];
    renderGrid();
    analyzePoem();
  });
  btnReset.addEventListener("click", () => {
    document.querySelectorAll(".char-input").forEach(input => input.value = "");
    analyzePoem();
  });
  btnCopy.addEventListener("click", copyToClipboard);
}

function renderGrid() {
  editorGrid.innerHTML = "";
  for (let r = 0; r < currentTemplate.rows; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "poem-row";
    for (let c = 0; c < currentTemplate.cols; c++) {
      const charBox = document.createElement("div");
      charBox.className = "char-box";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "char-input";
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;
      input.addEventListener("input", () => analyzePoem());
      
      const indicator = document.createElement("div");
      indicator.className = "tone-indicator";
      const reqTone = currentTemplate.pattern[r][c];
      let guideText = reqTone === 1 ? "○" : reqTone === 2 ? "●" : reqTone === 3 ? "◎(운)" : "-";
      indicator.innerHTML = `<span class="tone-mark"></span> ${guideText}`;
      
      charBox.appendChild(input);
      charBox.appendChild(indicator);
      rowDiv.appendChild(charBox);
    }
    editorGrid.appendChild(rowDiv);
  }
}

function analyzePoem() {
  const inputs = document.querySelectorAll(".char-input");
  let violationCount = 0;
  inputs.forEach(input => {
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    const char = input.value.trim();
    const box = input.parentElement;
    box.classList.remove("is-ping", "is-ze", "violation");
    if (!char) return;

    const pyData = pinyin(char, { type: 'all', toneType: 'num', multiple: true });
    if (!pyData || pyData.length === 0) return;
    const toneNum = pyData[0].num;
    let isPing = (toneNum === 1 || toneNum === 2 || toneNum === 0);
    let isZe = (toneNum === 3 || toneNum === 4);
    if (isPing) box.classList.add("is-ping");
    if (isZe) box.classList.add("is-ze");

    const reqTone = currentTemplate.pattern[r][c];
    if ((reqTone === 1 && !isPing) || (reqTone === 2 && !isZe) || (reqTone === 3 && !isPing)) {
      box.classList.add("violation");
      violationCount++;
    }
  });
  analysisResult.innerHTML = violationCount > 0 
    ? `<span style="color:var(--ze)">⚠️ 평측 불일치 ${violationCount}곳 (현대음 기준)</span>` 
    : `<span style="color:var(--primary)">✔️ 격률에 맞습니다.</span>`;
}

function copyToClipboard() {
  // ... (복사 로직 생략, 필요시 추가)
}

init();