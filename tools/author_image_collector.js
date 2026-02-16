(() => {
  "use strict";

  /* ==========================================================
   *  작가 초상화 수집기 v3 — 반자동 (크롭 + ZIP)
   *  v3.0 (2026-02-15) 민철 리팩토링
   *  - API 검색 완전 제거
   *  - Google Images / Baidu Images → 새 탭으로 수동 검색
   *  - 이미지 입력 3가지: URL 붙여넣기, 로컬 파일, 클립보드(Ctrl+V)
   *  - Cropper.js로 1:1 크롭
   *  - JSZip으로 ZIP 다운로드
   * ========================================================== */

  /* ===== 번체 → 간체 변환 테이블 ===== */
  const TRAD_TO_SIMP = {
    "萬":"万","與":"与","嚴":"严","葉":"叶","劉":"刘","吳":"吴","國":"国",
    "圍":"围","圖":"图","壽":"寿","夢":"梦","張":"张","彥":"彦","後":"后",
    "從":"从","復":"复","徵":"征","應":"应","慶":"庆","戰":"战","戶":"户",
    "揚":"扬","擇":"择","擬":"拟","擴":"扩","數":"数","斂":"敛","於":"于",
    "時":"时","晉":"晋","晝":"昼","會":"会","曉":"晓","書":"书","東":"东",
    "條":"条","樂":"乐","權":"权","標":"标","機":"机","檢":"检","歐":"欧",
    "歷":"历","歲":"岁","殘":"残","氣":"气","漢":"汉","無":"无","爲":"为",
    "牆":"墙","獨":"独","現":"现","瑤":"瑶","畫":"画","畢":"毕","當":"当",
    "盧":"卢","眾":"众","硯":"砚","禮":"礼","祕":"秘","稅":"税","稱":"称",
    "穎":"颖","竇":"窦","筆":"笔","簫":"箫","簡":"简","粵":"粤","紛":"纷",
    "終":"终","緒":"绪","經":"经","網":"网","羅":"罗","罷":"罢","羣":"群",
    "習":"习","聖":"圣","聞":"闻","聯":"联","肅":"肃","腦":"脑","臨":"临",
    "興":"兴","臺":"台","蔣":"蒋","蕭":"萧","處":"处","號":"号","蘇":"苏",
    "虛":"虚","蝕":"蚀","衛":"卫","複":"复","覺":"觉","訓":"训","記":"记",
    "評":"评","詩":"诗","話":"话","詳":"详","語":"语","說":"说","請":"请",
    "論":"论","譯":"译","護":"护","讀":"读","豐":"丰","貝":"贝","負":"负",
    "貴":"贵","費":"费","資":"资","賈":"贾","賓":"宾","賞":"赏","賴":"赖",
    "輕":"轻","輩":"辈","輿":"舆","轟":"轰","辦":"办","辭":"辞","選":"选",
    "遙":"遥","遞":"递","邊":"边","鄉":"乡","鄒":"邹","鄭":"郑","釋":"释",
    "錄":"录","鍾":"钟","鎮":"镇","長":"长","門":"门","開":"开","閔":"闵",
    "閣":"阁","隊":"队","陽":"阳","陳":"陈","隨":"随","雙":"双","雜":"杂",
    "靈":"灵","靜":"静","韓":"韩","韋":"韦","頁":"页","項":"项","頌":"颂",
    "顧":"顾","顯":"显","顥":"颢","風":"风","馬":"马","馮":"冯","驚":"惊",
    "體":"体","鬱":"郁","魯":"鲁","鮑":"鲍","鳳":"凤","鶴":"鹤","黃":"黄",
    "齊":"齐","齡":"龄","龐":"庞","島":"岛","適":"适","參":"参"
  };

  /* ===== 상태 ===== */
  const state = {
    authors: [],
    currentIdx: -1,
    collection: new Map(),   // authorId → { blob, thumbUrl, fileName }
    cropper: null,
    loadedImageUrl: null     // 크로퍼에 로드된 objectURL (해제용)
  };

  /* ===== DOM 참조 ===== */
  const $ = (id) => document.getElementById(id);

  const els = {
    dbPath:        $("dbPath"),
    loadBtn:       $("loadBtn"),
    dbFileInput:   $("dbFileInput"),
    authorCount:   $("authorCount"),
    authorList:    $("authorList"),
    authorInfo:    $("authorInfo"),
    searchGoogle:  $("searchGoogle"),
    searchBaidu:   $("searchBaidu"),
    btnSearch:     $("btnSearch"),
    inputUrl:      $("inputUrl"),
    btnApplyUrl:   $("btnApplyUrl"),
    inputFile:     $("inputFile"),
    cropArea:      $("cropArea"),
    cropImage:     $("cropImage"),
    cropPlaceholder: $("cropPlaceholder"),
    btnCropConfirm:  $("btnCropConfirm"),
    btnCropCancel:   $("btnCropCancel"),
    collectionList:  $("collectionList"),
    collectionCount: $("collectionCount"),
    btnDownloadZip:  $("btnDownloadZip"),
    btnExportManifest: $("btnExportManifest"),
    btnClearAll:     $("btnClearAll"),
    status:          $("status")
  };

  /* ===== 유틸 ===== */

  function setStatus(msg) {
    const t = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    els.status.textContent = `[${t}] ${msg}`;
  }

  function toSimp(text) {
    return (text || "").split("").map(ch => TRAD_TO_SIMP[ch] || ch).join("");
  }

  /* ===== 시인 데이터 ===== */

  function normalizeAuthor(id, raw) {
    const ko = (raw?.name?.ko || "").trim();
    const zhTrad = (raw?.name?.zh || "").trim();
    const zhSimp = toSimp(zhTrad);
    return { id, ko, zhTrad, zhSimp, displayName: ko || zhTrad || id };
  }

  function parseAuthors(db, count) {
    const entries = Object.entries(db?.authors || {});
    const filtered = entries.filter(([id]) => !id.startsWith("EXT_"));
    const sliced = count > 0 ? filtered.slice(0, count) : filtered;
    return sliced.map(([id, a]) => normalizeAuthor(id, a));
  }

  function currentAuthor() {
    return state.authors[state.currentIdx] || null;
  }

  /* ===== 검색 쿼리 생성 ===== */

  function buildSearchQuery(author) {
    // 간체 우선, 번체가 다르면 OR로 묶기
    const names = [];
    if (author.zhSimp) names.push(author.zhSimp);
    if (author.zhTrad && author.zhTrad !== author.zhSimp) names.push(author.zhTrad);
    if (author.ko) names.push(author.ko);

    const nameExpr = names.length > 1
      ? names.map(n => `"${n}"`).join(" OR ")
      : `"${names[0] || author.id}"`;

    return `${nameExpr} 唐代 诗人 肖像`;
  }

  /* ===== 검색 (새 탭 열기) ===== */

  function openSearchTabs() {
    const author = currentAuthor();
    if (!author) {
      setStatus("먼저 작가를 선택해주세요.");
      return;
    }

    const query = buildSearchQuery(author);

    const useGoogle = els.searchGoogle.checked;
    const useBaidu = els.searchBaidu.checked;

    if (!useGoogle && !useBaidu) {
      setStatus("Google 또는 Baidu 중 하나는 선택해주세요.");
      return;
    }

    let opened = 0;
    if (useGoogle) {
      const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      opened++;
    }
    if (useBaidu) {
      const url = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(query)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      opened++;
    }

    setStatus(`${author.displayName} — ${opened}개 검색 탭 열림  |  검색어: ${query}`);
  }

  /* ===== 크롭 도구 ===== */

  function loadImageToCropper(objectUrl) {
    // 기존 크로퍼 정리
    destroyCropper();

    // 플레이스홀더 숨기고 이미지 표시
    els.cropPlaceholder.hidden = true;
    els.cropImage.hidden = false;
    els.cropImage.src = objectUrl;
    state.loadedImageUrl = objectUrl;

    // Cropper.js 초기화
    state.cropper = new Cropper(els.cropImage, {
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
      cropBoxMovable: true
    });

    // 크롭 버튼 활성화
    els.btnCropConfirm.disabled = false;
    els.btnCropCancel.disabled = false;
  }

  function destroyCropper() {
    if (state.cropper) {
      state.cropper.destroy();
      state.cropper = null;
    }
    if (state.loadedImageUrl) {
      URL.revokeObjectURL(state.loadedImageUrl);
      state.loadedImageUrl = null;
    }
    els.cropImage.hidden = true;
    els.cropImage.removeAttribute("src");
    els.cropPlaceholder.hidden = false;
    els.btnCropConfirm.disabled = true;
    els.btnCropCancel.disabled = true;
  }

  function confirmCrop() {
    const author = currentAuthor();
    if (!author) {
      setStatus("작가를 먼저 선택해주세요.");
      return;
    }
    if (!state.cropper) {
      setStatus("크롭할 이미지를 먼저 불러와주세요.");
      return;
    }

    // 500x500 JPEG로 크롭
    const canvas = state.cropper.getCroppedCanvas({
      width: 500,
      height: 500,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high"
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("크롭 실패 — 다시 시도해주세요.");
        return;
      }

      // 썸네일 DataURL
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 80;
      thumbCanvas.height = 80;
      const ctx = thumbCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, 0, 80, 80);
      const thumbUrl = thumbCanvas.toDataURL("image/jpeg", 0.7);

      const fileName = `${author.id}.jpg`;

      // 컬렉션에 저장
      state.collection.set(author.id, { blob, thumbUrl, fileName });

      destroyCropper();
      renderCollectionList();
      renderAuthorList();

      setStatus(`${author.displayName} (${author.id}) 이미지 수집 완료! [${state.collection.size}/${state.authors.length}]`);

      // 다음 미수집 작가로 자동 이동
      advanceToNextUncollected();
    }, "image/jpeg", 0.92);
  }

  function advanceToNextUncollected() {
    const total = state.authors.length;
    if (total === 0) return;

    // 현재 위치 다음부터 순환 탐색
    for (let offset = 1; offset <= total; offset++) {
      const idx = (state.currentIdx + offset) % total;
      const a = state.authors[idx];
      if (!state.collection.has(a.id)) {
        selectAuthor(idx);
        return;
      }
    }

    // 전부 수집 완료!
    setStatus(`전체 수집 완료! (${state.collection.size}명)`);
  }

  /* ===== 이미지 입력 — 3가지 방법 ===== */

  // 1) URL 붙여넣기
  function applyUrlInput() {
    const url = (els.inputUrl.value || "").trim();
    if (!url) {
      setStatus("URL을 입력해주세요.");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setStatus("URL은 http:// 또는 https:// 형식이어야 합니다.");
      return;
    }
    if (!currentAuthor()) {
      setStatus("먼저 작가를 선택해주세요.");
      return;
    }

    setStatus("이미지 로딩 중...");

    // CORS 프록시 없이 직접 fetch (같은 도메인이면 OK, 외부면 CORS 오류 가능)
    // 오류 시 → 클립보드 붙여넣기(Ctrl+V) 또는 로컬 파일 사용 안내
    fetch(url, { mode: "cors", referrerPolicy: "no-referrer" })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        loadImageToCropper(objUrl);
        els.inputUrl.value = "";
        setStatus("이미지 로드 성공 — 크롭 영역을 조절하고 확인을 누르세요.");
      })
      .catch(() => {
        // fetch 실패 시 img 태그로 시도 (일부 사이트는 img src로는 가능)
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
              loadImageToCropper(objUrl);
              els.inputUrl.value = "";
              setStatus("이미지 로드 성공 (img 방식) — 크롭 영역을 조절하세요.");
            } else {
              setStatus("이미지 변환 실패. 클립보드(Ctrl+V)나 로컬 파일을 사용해보세요.");
            }
          }, "image/jpeg", 0.95);
        };
        img.onerror = () => {
          setStatus("CORS 차단됨. 해당 이미지를 크롬에서 '이미지 복사' 후 Ctrl+V로 붙여넣기 하세요.");
        };
        img.src = url;
      });
  }

  // 2) 로컬 파일
  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentAuthor()) {
      setStatus("먼저 작가를 선택해주세요.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus("이미지 파일만 선택할 수 있습니다.");
      return;
    }

    const objUrl = URL.createObjectURL(file);
    loadImageToCropper(objUrl);
    setStatus(`파일 로드: ${file.name} — 크롭 영역을 조절하세요.`);
    // 같은 파일 다시 선택 가능하도록 리셋
    e.target.value = "";
  }

  // 3) 클립보드 붙여넣기 (Ctrl+V)
  function handlePaste(e) {
    if (!currentAuthor()) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;
        const objUrl = URL.createObjectURL(blob);
        loadImageToCropper(objUrl);
        setStatus("클립보드 이미지 붙여넣기 완료 — 크롭 영역을 조절하세요.");
        return;
      }
    }
  }

  /* ===== 렌더링 ===== */

  function renderAuthorList() {
    const html = state.authors
      .map((author, idx) => {
        const isActive = idx === state.currentIdx ? "active" : "";
        const hasImage = state.collection.has(author.id);
        const badge = hasImage ? '<span class="done-badge">OK</span>' : "";
        const ko = author.ko || "(한글명 없음)";
        const zh = author.zhTrad || "";

        return `
          <div class="author-item ${isActive} ${hasImage ? "collected" : ""}"
               data-idx="${idx}">
            <div class="author-name">
              <strong>${author.id}</strong> ${ko} ${badge}
            </div>
            <div class="author-sub">${zh}</div>
          </div>`;
      })
      .join("");

    els.authorList.innerHTML = html || '<div class="empty-msg">DB를 먼저 로드해주세요.</div>';
  }

  function renderAuthorInfo() {
    const author = currentAuthor();
    if (!author) {
      els.authorInfo.textContent = "좌측에서 작가를 선택하세요.";
      return;
    }
    const parts = [author.id, author.ko, author.zhTrad];
    if (author.zhSimp && author.zhSimp !== author.zhTrad) parts.push(`(${author.zhSimp})`);
    els.authorInfo.textContent = parts.filter(Boolean).join("  ·  ");
  }

  function renderCollectionList() {
    const entries = [];
    for (const author of state.authors) {
      const item = state.collection.get(author.id);
      if (!item) continue;
      entries.push({ author, item });
    }

    els.collectionCount.textContent = `${entries.length}/${state.authors.length}`;

    if (entries.length === 0) {
      els.collectionList.innerHTML = '<div class="empty-msg">수집된 이미지가 없습니다.</div>';
      els.btnDownloadZip.disabled = true;
      els.btnExportManifest.disabled = true;
      return;
    }

    els.btnDownloadZip.disabled = false;
    els.btnExportManifest.disabled = false;

    const html = entries
      .map(({ author, item }) => `
        <div class="collection-item" data-author-id="${author.id}">
          <img src="${item.thumbUrl}" alt="${author.displayName}" class="coll-thumb">
          <div class="coll-info">
            <div class="coll-name">${author.displayName}</div>
            <div class="coll-file">${item.fileName}</div>
          </div>
          <button type="button" class="btn-remove" data-action="remove" data-author-id="${author.id}" title="삭제">×</button>
        </div>`)
      .join("");

    els.collectionList.innerHTML = html;
  }

  /* ===== 작가 선택 ===== */

  function selectAuthor(idx) {
    if (idx < 0 || idx >= state.authors.length) return;
    state.currentIdx = idx;

    // 크롭 상태 초기화
    destroyCropper();

    renderAuthorList();
    renderAuthorInfo();

    // 선택된 작가를 목록에서 보이도록 스크롤
    const el = els.authorList.querySelector(`[data-idx="${idx}"]`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ===== ZIP 다운로드 ===== */

  async function downloadZip() {
    if (state.collection.size === 0) {
      setStatus("다운로드할 이미지가 없습니다.");
      return;
    }

    setStatus("ZIP 생성 중...");

    const zip = new JSZip();

    for (const [authorId, item] of state.collection) {
      zip.file(item.fileName, item.blob);
    }

    try {
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `author_portraits_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setStatus(`ZIP 다운로드 완료 (${state.collection.size}개 이미지)`);
    } catch (err) {
      setStatus(`ZIP 생성 실패: ${err.message}`);
    }
  }

  /* ===== Manifest 저장 ===== */

  function exportManifest() {
    const items = [];
    for (const author of state.authors) {
      const item = state.collection.get(author.id);
      if (!item) continue;
      items.push({
        id: author.id,
        nameKo: author.ko,
        nameZh: author.zhTrad,
        fileName: item.fileName
      });
    }

    const payload = {
      createdAt: new Date().toISOString(),
      count: items.length,
      items
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `author_image_manifest_${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    setStatus(`manifest 저장 완료 (${items.length}개)`);
  }

  /* ===== 전체 초기화 ===== */

  function clearAll() {
    if (state.collection.size > 0 && !confirm(`수집된 ${state.collection.size}개 이미지를 모두 지울까요?`)) {
      return;
    }
    state.collection.clear();
    destroyCropper();
    renderCollectionList();
    renderAuthorList();
    setStatus("전체 초기화 완료");
  }

  /* ===== 데이터 로드 ===== */

  async function loadFromJsonText(jsonText) {
    const parsed = JSON.parse(jsonText);
    const count = Number(els.authorCount.value) || 0;
    state.authors = parseAuthors(parsed, count);
    state.currentIdx = state.authors.length > 0 ? 0 : -1;
    state.collection.clear();

    destroyCropper();
    renderAuthorList();
    renderAuthorInfo();
    renderCollectionList();

    if (state.authors.length === 0) {
      setStatus("작가 데이터를 찾지 못했습니다.");
      return;
    }

    setStatus(`${state.authors.length}명 로드 완료 — 작가를 선택하고 이미지를 검색하세요.`);
  }

  async function loadFromPath() {
    const path = (els.dbPath.value || "").trim();
    if (!path) { setStatus("DB 경로를 입력해주세요."); return; }

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      await loadFromJsonText(text);
    } catch (err) {
      setStatus(`DB 로드 실패: ${err.message}`);
    }
  }

  /* ===== 이벤트 바인딩 ===== */

  function bindEvents() {
    // DB 로드
    els.loadBtn.addEventListener("click", loadFromPath);

    els.dbFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await loadFromJsonText(text);
      } catch (err) {
        setStatus(`JSON 파일 로드 실패: ${err.message}`);
      }
    });

    // 작가 목록 클릭 (이벤트 위임)
    els.authorList.addEventListener("click", (e) => {
      const item = e.target.closest("[data-idx]");
      if (!item) return;
      selectAuthor(Number(item.dataset.idx));
    });

    // 검색 탭 열기
    els.btnSearch.addEventListener("click", openSearchTabs);

    // URL 입력 → 엔터로도 적용
    els.inputUrl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyUrlInput();
      }
    });

    // URL 적용 버튼
    els.btnApplyUrl.addEventListener("click", applyUrlInput);

    // 로컬 파일
    els.inputFile.addEventListener("change", handleFileInput);

    // 클립보드 붙여넣기 (전역)
    document.addEventListener("paste", handlePaste);

    // 크롭 확인/취소
    els.btnCropConfirm.addEventListener("click", confirmCrop);
    els.btnCropCancel.addEventListener("click", destroyCropper);

    // 컬렉션 삭제 (이벤트 위임)
    els.collectionList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='remove']");
      if (!btn) return;
      const authorId = btn.dataset.authorId;
      state.collection.delete(authorId);
      renderCollectionList();
      renderAuthorList();
      setStatus(`${authorId} 이미지 삭제됨 [${state.collection.size}/${state.authors.length}]`);
    });

    // ZIP / Manifest / 초기화
    els.btnDownloadZip.addEventListener("click", downloadZip);
    els.btnExportManifest.addEventListener("click", exportManifest);
    els.btnClearAll.addEventListener("click", clearAll);
  }

  /* ===== 초기화 ===== */

  function init() {
    bindEvents();
    setStatus("준비 완료 — DB를 로드하고 작가를 선택하세요.");
  }

  init();
})();
