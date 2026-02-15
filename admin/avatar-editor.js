/* ============================================
   초상화 관리 모듈 (시인관리 하위)
   - 현재 시인의 초상화 미리보기/교체
   - Google/Baidu 이미지 검색 (새 탭)
   - URL / 파일 / 클립보드 3가지 입력
   - Cropper.js 1:1 크롭
   - 개별 다운로드 (C341.jpg)
   ============================================ */

const AvatarEditor = {
  cropper: null,
  loadedUrl: null,     // 크로퍼에 로드된 objectURL (해제용)
  currentId: null,     // 현재 편집 중인 시인 ID
};

const AVATAR_BASE = "../public/assets/avatars/";
const AVATAR_DEFAULT = AVATAR_BASE + "default-author.jpg";

// 번체 → 간체 변환 (검색 쿼리용)
const TRAD_SIMP = {
  "萬":"万","與":"与","劉":"刘","張":"张","應":"应","權":"权","盧":"卢",
  "陳":"陈","韓":"韩","韋":"韦","馬":"马","島":"岛","適":"适","參":"参",
  "賈":"贾","賓":"宾","顧":"顾","顥":"颢","風":"风","龐":"庞","齡":"龄",
  "興":"兴","葉":"叶","嚴":"严","國":"国","東":"东","書":"书","長":"长",
  "門":"门","開":"开","閣":"阁","陽":"阳","黃":"黄","齊":"齐","經":"经",
  "號":"号","漢":"汉","無":"无","溫":"温","鶴":"鹤","鳳":"凤","歷":"历",
  "處":"处","聖":"圣","聞":"闻","說":"说","語":"语","詩":"诗","論":"论",
  "護":"护","讀":"读","體":"体","會":"会","樂":"乐","機":"机","歲":"岁",
};

function toSimpChar(text) {
  return (text || "").split("").map(ch => TRAD_SIMP[ch] || ch).join("");
}

// ─── 초기화 ────────────────────────────────
function initAvatarEditor() {
  bindAvatarEvents();
}

// ─── 시인 선택 시 호출 (author-manager.js에서) ──
function loadAvatar(authorId) {
  AvatarEditor.currentId = authorId;
  destroyAvatarCropper();

  const preview = document.getElementById("avatar-preview");
  const badge = document.getElementById("avatar-status-badge");

  if (!authorId) {
    preview.src = AVATAR_DEFAULT;
    badge.hidden = true;
    return;
  }

  const avatarPath = AVATAR_BASE + authorId + ".jpg";

  // 이미지 존재 여부 확인
  const testImg = new Image();
  testImg.onload = () => {
    preview.src = avatarPath + "?t=" + Date.now(); // 캐시 방지
    badge.textContent = "등록됨";
    badge.className = "avatar-badge badge-ok";
    badge.hidden = false;
  };
  testImg.onerror = () => {
    preview.src = AVATAR_DEFAULT;
    badge.textContent = "미등록";
    badge.className = "avatar-badge badge-missing";
    badge.hidden = false;
  };
  testImg.src = avatarPath + "?t=" + Date.now();
}

// ─── 검색 (Google/Baidu 새 탭) ──────────────
function buildAvatarSearchQuery(authorId) {
  const author = DATA.author?.authors?.[authorId];
  if (!author) return authorId;

  const zhTrad = (author.name?.zh || "").trim();
  const zhSimp = toSimpChar(zhTrad);
  const ko = (author.name?.ko || "").trim();

  const names = [];
  if (zhSimp) names.push(zhSimp);
  if (zhTrad && zhTrad !== zhSimp) names.push(zhTrad);
  if (ko) names.push(ko);

  const nameExpr = names.length > 1
    ? names.map(n => `"${n}"`).join(" OR ")
    : `"${names[0] || authorId}"`;

  return `${nameExpr} 唐代 诗人 肖像`;
}

function openAvatarGoogle() {
  const id = AvatarEditor.currentId;
  if (!id) { showToast("시인을 먼저 선택하세요"); return; }
  const q = buildAvatarSearchQuery(id);
  window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`, "_blank");
}

function openAvatarBaidu() {
  const id = AvatarEditor.currentId;
  if (!id) { showToast("시인을 먼저 선택하세요"); return; }
  const q = buildAvatarSearchQuery(id);
  window.open(`https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(q)}`, "_blank");
}

// ─── 이미지 입력 → 크롭 도구 로드 ─────────────
function loadImageToAvatarCropper(objectUrl) {
  destroyAvatarCropper();

  const cropArea = document.getElementById("avatar-crop-area");
  const cropImg = document.getElementById("avatar-crop-image");

  cropArea.hidden = false;
  cropImg.src = objectUrl;
  AvatarEditor.loadedUrl = objectUrl;

  AvatarEditor.cropper = new Cropper(cropImg, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 0.85,
    responsive: true,
    restore: false,
    guides: true,
    center: true,
    background: true,
    modal: true,
    cropBoxResizable: true,
    cropBoxMovable: true,
  });
}

function destroyAvatarCropper() {
  if (AvatarEditor.cropper) {
    AvatarEditor.cropper.destroy();
    AvatarEditor.cropper = null;
  }
  if (AvatarEditor.loadedUrl) {
    URL.revokeObjectURL(AvatarEditor.loadedUrl);
    AvatarEditor.loadedUrl = null;
  }

  const cropArea = document.getElementById("avatar-crop-area");
  const cropImg = document.getElementById("avatar-crop-image");
  if (cropArea) cropArea.hidden = true;
  if (cropImg) cropImg.removeAttribute("src");
}

// 1) URL 붙여넣기
function applyAvatarUrl() {
  const input = document.getElementById("avatar-url-input");
  const url = (input.value || "").trim();
  if (!url) { showToast("URL을 입력해주세요"); return; }
  if (!AvatarEditor.currentId) { showToast("시인을 먼저 선택하세요"); return; }

  showToast("이미지 로딩 중...");

  fetch(url, { mode: "cors", referrerPolicy: "no-referrer" })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then(blob => {
      const objUrl = URL.createObjectURL(blob);
      loadImageToAvatarCropper(objUrl);
      input.value = "";
      showToast("이미지 로드 성공 — 크롭 영역을 조절하세요");
    })
    .catch(() => {
      // fetch 실패 시 img 태그로 시도
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        c.toBlob((blob) => {
          if (blob) {
            const objUrl = URL.createObjectURL(blob);
            loadImageToAvatarCropper(objUrl);
            input.value = "";
            showToast("이미지 로드 성공 — 크롭 영역을 조절하세요");
          } else {
            showToast("이미지 변환 실패. Ctrl+V나 파일 선택을 사용하세요");
          }
        }, "image/jpeg", 0.95);
      };
      img.onerror = () => {
        showToast("CORS 차단됨. 이미지를 '복사' 후 Ctrl+V로 붙여넣기 하세요");
      };
      img.src = url;
    });
}

// 2) 파일 선택
function handleAvatarFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!AvatarEditor.currentId) { showToast("시인을 먼저 선택하세요"); return; }
  if (!file.type.startsWith("image/")) { showToast("이미지 파일만 선택 가능"); return; }

  const objUrl = URL.createObjectURL(file);
  loadImageToAvatarCropper(objUrl);
  showToast(`파일 로드: ${file.name}`);
  e.target.value = ""; // 같은 파일 다시 선택 가능
}

// 3) 클립보드 붙여넣기 (Ctrl+V)
function handleAvatarPaste(e) {
  if (!AvatarEditor.currentId) return;

  // 시인관리 탭이 활성화된 상태에서만 작동
  const authorPanel = document.getElementById("panel-author");
  if (!authorPanel || !authorPanel.classList.contains("active")) return;

  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      e.preventDefault();
      const blob = item.getAsFile();
      if (!blob) continue;
      const objUrl = URL.createObjectURL(blob);
      loadImageToAvatarCropper(objUrl);
      showToast("클립보드 이미지 붙여넣기 완료 — 크롭 영역을 조절하세요");
      return;
    }
  }
}

// ─── 크롭 확인 → 다운로드 ─────────────────────
function confirmAvatarCrop() {
  const id = AvatarEditor.currentId;
  if (!id) { showToast("시인을 먼저 선택하세요"); return; }
  if (!AvatarEditor.cropper) { showToast("크롭할 이미지를 먼저 불러와주세요"); return; }

  const canvas = AvatarEditor.cropper.getCroppedCanvas({
    width: 500,
    height: 500,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  canvas.toBlob((blob) => {
    if (!blob) { showToast("크롭 실패 — 다시 시도해주세요"); return; }

    const fileName = `${id}.jpg`;

    // 자동 다운로드
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    // 크롭 영역 정리
    destroyAvatarCropper();

    // 미리보기 즉시 갱신 (blob URL로 표시)
    const previewUrl = URL.createObjectURL(blob);
    const preview = document.getElementById("avatar-preview");
    preview.src = previewUrl;

    const badge = document.getElementById("avatar-status-badge");
    badge.textContent = "다운로드됨";
    badge.className = "avatar-badge badge-downloaded";
    badge.hidden = false;

    const author = DATA.author?.authors?.[id];
    const name = author?.name?.ko || author?.name?.zh || id;
    showToast(`${name} 초상화 다운로드 완료! → public/assets/avatars/ 에 넣어주세요`);
  }, "image/jpeg", 0.92);
}

// ─── 이벤트 바인딩 ──────────────────────────
function bindAvatarEvents() {
  // 검색 버튼
  document.getElementById("btn-avatar-google")?.addEventListener("click", openAvatarGoogle);
  document.getElementById("btn-avatar-baidu")?.addEventListener("click", openAvatarBaidu);

  // URL 적용
  document.getElementById("btn-avatar-url")?.addEventListener("click", applyAvatarUrl);
  document.getElementById("avatar-url-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applyAvatarUrl(); }
  });

  // 파일 선택
  document.getElementById("avatar-file-input")?.addEventListener("change", handleAvatarFile);

  // 클립보드 붙여넣기 (전역)
  document.addEventListener("paste", handleAvatarPaste);

  // 크롭 확인/취소
  document.getElementById("btn-avatar-crop-confirm")?.addEventListener("click", confirmAvatarCrop);
  document.getElementById("btn-avatar-crop-cancel")?.addEventListener("click", destroyAvatarCropper);
}
