(() => {
  "use strict";

  const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
  const REQUIRED_STYLE_KO = "동양화 수묵화(문인화) 느낌, 절제된 저채색, 시적인 느낌, 여백 중심 구도";
  const REQUIRED_STYLE_EN = [
    "traditional East Asian ink wash painting (sumi-e)",
    "literati painting aesthetics",
    "minimal color palette with restrained tones",
    "poetic atmosphere",
    "generous negative space composition",
  ];
  const STYLE_PREFIX_EN = REQUIRED_STYLE_EN.join(", ");
  const DEFAULT_MJ_PARAMS = "--stylize 200";
  const DEFAULT_ASPECT_RATIO = "3:2";
  const QUEUE_LIMIT = 5;
  const ASPECT_RATIOS = ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16"];
  const API_KEY_STORAGE_KEY = "midjourney_prompt_api_key_v1";
  const SESSION_STATE_KEY = "midjourney_prompt_session_v2";
  const DEFAULT_MODEL = "gpt-4.1";
  const DEFAULT_TEMPERATURE = 0.4;
  const DEFAULT_NEGATIVE_PROMPT = [
    "text",
    "logo",
    "watermark",
    "cartoon",
    "childish",
    "chibi",
    "anime",
    "toy",
    "neon",
  ].join(", ");

  const state = {
    works: [],
    filteredWorks: [],
    selectedIds: new Set(),
    resultsById: new Map(), // titleId -> result
    resultOrder: [],
    isGenerating: false,
    lastRunMeta: null,
    queueItems: [], // [{ titleId, status: "pending"|"done" }]
    activeQueueTitleId: null,
    imageCollection: new Map(), // titleId -> { blob, fileName, size, width, height, thumbUrl }
    completedImageIds: new Set(),
    promptCatalogById: new Map(), // titleId -> normalized prompt row
    promptCatalogMeta: null,
  };

  let persistTimer = null;
  let suspendPersist = false;

  const $ = (id) => document.getElementById(id);
  const els = {
    dbPath: $("dbPath"),
    btnLoadPath: $("btnLoadPath"),
    dbFileInput: $("dbFileInput"),
    queryInput: $("queryInput"),
    poetInput: $("poetInput"),
    btnApplyFilter: $("btnApplyFilter"),
    btnResetFilter: $("btnResetFilter"),
    btnSelectFiltered: $("btnSelectFiltered"),
    btnClearSelection: $("btnClearSelection"),
    workList: $("workList"),
    worksCount: $("worksCount"),
    leftStatus: $("leftStatus"),
    selectionSummary: $("selectionSummary"),
    apiKeyInput: $("apiKeyInput"),
    btnToggleApiKey: $("btnToggleApiKey"),
    rememberApiKey: $("rememberApiKey"),
    btnForgetApiKey: $("btnForgetApiKey"),
    modelInput: $("modelInput"),
    temperatureInput: $("temperatureInput"),
    globalAspectRatio: $("globalAspectRatio"),
    dryRunToggle: $("dryRunToggle"),
    openMidjourneyAfterGenerate: $("openMidjourneyAfterGenerate"),
    btnGenerate: $("btnGenerate"),
    btnGenerateSelectedTop5: $("btnGenerateSelectedTop5"),
    promptCatalogFileInput: $("promptCatalogFileInput"),
    btnApplyCatalogSelection: $("btnApplyCatalogSelection"),
    autoApplyCatalogOnSelect: $("autoApplyCatalogOnSelect"),
    centerStatus: $("centerStatus"),
    resultList: $("resultList"),
    resultsCount: $("resultsCount"),
    btnCopyAllPrompts: $("btnCopyAllPrompts"),
    btnExportJson: $("btnExportJson"),
    btnClearResults: $("btnClearResults"),
    btnBuildQueueFromSelection: $("btnBuildQueueFromSelection"),
    btnClearQueue: $("btnClearQueue"),
    queueFileInput: $("queueFileInput"),
    queueList: $("queueList"),
    queueCountBadge: $("queueCountBadge"),
    imageCollectionCount: $("imageCollectionCount"),
    imageCollectionList: $("imageCollectionList"),
    existingImagesDirInput: $("existingImagesDirInput"),
    btnDownloadImageZip: $("btnDownloadImageZip"),
    btnExportImageManifest: $("btnExportImageManifest"),
    btnClearImages: $("btnClearImages"),
  };

  function stamp() {
    return new Date().toLocaleTimeString("ko-KR", { hour12: false });
  }

  function setLeftStatus(msg) {
    els.leftStatus.textContent = `[${stamp()}] ${msg}`;
  }

  function setCenterStatus(msg) {
    els.centerStatus.textContent = `[${stamp()}] ${msg}`;
  }

  function getStoredApiKey() {
    try {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setStoredApiKey(value) {
    try {
      if (value) localStorage.setItem(API_KEY_STORAGE_KEY, value);
      else localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (_) {
      // ignore storage errors
    }
  }

  function textValue(value, preferredKey = "ko") {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      return value.map(v => textValue(v, preferredKey)).filter(Boolean).join(" ").trim();
    }
    if (typeof value === "object") {
      if (typeof value[preferredKey] === "string" && value[preferredKey].trim()) {
        return value[preferredKey].trim();
      }
      for (const key of Object.keys(value)) {
        if (typeof value[key] === "string" && value[key].trim()) {
          return value[key].trim();
        }
      }
    }
    return String(value).trim();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function cleanText(raw) {
    return String(raw || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\[\d+\]/g, " ")
      .replace(/\[\*\s*[^]*?\]/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function makeExcerpt(raw, maxLen = 100) {
    const text = cleanText(raw);
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}...`;
  }

  function normalizeSearchText(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/<[^>]*>/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeAspectRatio(raw) {
    const ratio = String(raw || "").trim();
    if (ASPECT_RATIOS.includes(ratio)) return ratio;
    return DEFAULT_ASPECT_RATIO;
  }

  function updateApiKeyVisibilityLabel() {
    if (!els.btnToggleApiKey || !els.apiKeyInput) return;
    els.btnToggleApiKey.textContent = els.apiKeyInput.type === "password" ? "보기" : "숨기기";
  }

  function initApiKeyUi() {
    if (!els.apiKeyInput) return;
    const stored = getStoredApiKey();
    if (stored) {
      els.apiKeyInput.value = stored;
      if (els.rememberApiKey) els.rememberApiKey.checked = true;
    }
    updateApiKeyVisibilityLabel();
  }

  function getLocalTimeLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("ko-KR", { hour12: false });
  }

  function normalizeNegativePrompt(raw) {
    const currentTerms = String(raw || "")
      .replace(/^--no\s+/i, "")
      .split(/[,\n]/)
      .map(v => v.trim())
      .filter(Boolean);

    const merged = [...currentTerms];
    const lowerSet = new Set(currentTerms.map(v => v.toLowerCase()));
    for (const term of DEFAULT_NEGATIVE_PROMPT.split(",").map(v => v.trim()).filter(Boolean)) {
      const key = term.toLowerCase();
      if (lowerSet.has(key)) continue;
      lowerSet.add(key);
      merged.push(term);
    }
    return merged.join(", ");
  }

  function stripExistingMidjourneyParams(prompt) {
    return String(prompt || "")
      .replace(/\s--no\s+(.+?)(?=\s--[a-z]|$)/gi, "")
      .replace(/\s--ar\s+\d+:\d+/gi, "")
      .replace(/\s--stylize\s+\d+/gi, "")
      .replace(/\s--s\s+\d+/gi, "")
      .replace(/\s--v(?:ersion)?\s+[0-9.]+/gi, "")
      .replace(/\s--q(?:uality)?\s+[0-9.]+/gi, "")
      .replace(/\s--chaos\s+\d+/gi, "")
      .replace(/\s--weird\s+\d+/gi, "")
      .replace(/\s--seed\s+\d+/gi, "")
      .replace(/\s--[a-z0-9-]+(?:\s+\S+)?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizePromptBody(prompt) {
    return stripExistingMidjourneyParams(prompt)
      .replace(/["“”]/g, "")
      .replace(/\s+/g, " ")
      .replace(/,\s*$/, "")
      .trim();
  }

  function splitPromptParts(text) {
    return String(text || "")
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);
  }

  function normalizePromptPartKey(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, "")
      .replace(/[^a-z0-9\s()-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function dedupePromptParts(parts) {
    const out = [];
    const seen = new Set();
    for (const partRaw of parts) {
      const part = String(partRaw || "").trim();
      if (!part) continue;
      const key = normalizePromptPartKey(part);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(part);
    }
    return out;
  }

  function composePromptBodyWithStylePrefix(promptBody) {
    const mustLead = [
      ...REQUIRED_STYLE_EN,
      "mature contemplative literati mood",
      "not cartoonish",
      "not childish",
    ];
    const mustLeadKeys = new Set(mustLead.map(normalizePromptPartKey));
    const body = splitPromptParts(promptBody).filter(part => !mustLeadKeys.has(normalizePromptPartKey(part)));
    return dedupePromptParts([...mustLead, ...body]).join(", ");
  }

  function getValidTitleIdSet() {
    return new Set(state.works.map(work => work.titleId));
  }

  function buildSerializableResults() {
    const rows = [];
    for (const id of state.resultOrder) {
      const row = state.resultsById.get(id);
      if (!row) continue;
      rows.push({
        titleId: row.titleId,
        title: row.title || { ko: "", zh: "" },
        poet: row.poet || { ko: "", zh: "" },
        source: row.source || "",
        sceneSummaryKo: row.sceneSummaryKo || "",
        midjourneyPrompt: row.midjourneyPrompt || "",
        midjourneyPromptKo: row.midjourneyPromptKo || "",
        negativePrompt: row.negativePrompt || "",
        aspectRatio: normalizeAspectRatio(row.aspectRatio),
        generationMode: row.generationMode || "",
      });
    }
    return rows;
  }

  function buildSessionSnapshot() {
    return {
      version: 2,
      savedAt: new Date().toISOString(),
      form: {
        dbPath: els.dbPath.value || "",
        query: els.queryInput.value || "",
        poet: els.poetInput.value || "",
        model: els.modelInput.value || DEFAULT_MODEL,
        temperature: els.temperatureInput.value || String(DEFAULT_TEMPERATURE),
        globalAspectRatio: normalizeAspectRatio(els.globalAspectRatio.value),
        dryRun: !!els.dryRunToggle.checked,
        autoOpenMidjourney: !!els.openMidjourneyAfterGenerate.checked,
        autoApplyCatalogOnSelect: !!els.autoApplyCatalogOnSelect?.checked,
      },
      works: state.works,
      selectedIds: Array.from(state.selectedIds),
      results: buildSerializableResults(),
      resultOrder: [...state.resultOrder],
      lastRunMeta: state.lastRunMeta,
      queueItems: state.queueItems.map(item => ({
        titleId: item.titleId,
        status: item.status === "done" ? "done" : "pending",
      })),
      activeQueueTitleId: state.activeQueueTitleId || null,
      completedImageIds: Array.from(state.completedImageIds),
    };
  }

  function persistSessionStateNow() {
    if (suspendPersist) return;
    try {
      sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(buildSessionSnapshot()));
    } catch (_) {
      // ignore quota/storage errors for offline utility
    }
  }

  function schedulePersistSessionState() {
    if (suspendPersist) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistSessionStateNow();
    }, 120);
  }

  function restoreSessionState() {
    let snapshot = null;
    try {
      const raw = sessionStorage.getItem(SESSION_STATE_KEY);
      if (!raw) return false;
      snapshot = JSON.parse(raw);
    } catch (_) {
      return false;
    }
    if (!snapshot || typeof snapshot !== "object") return false;

    suspendPersist = true;
    try {
      if (snapshot.form && typeof snapshot.form === "object") {
        if (typeof snapshot.form.dbPath === "string") els.dbPath.value = snapshot.form.dbPath;
        if (typeof snapshot.form.query === "string") els.queryInput.value = snapshot.form.query;
        if (typeof snapshot.form.poet === "string") els.poetInput.value = snapshot.form.poet;
        if (typeof snapshot.form.model === "string") els.modelInput.value = snapshot.form.model || DEFAULT_MODEL;
        if (typeof snapshot.form.temperature === "string" || typeof snapshot.form.temperature === "number") {
          els.temperatureInput.value = String(snapshot.form.temperature);
        }
        els.globalAspectRatio.value = normalizeAspectRatio(snapshot.form.globalAspectRatio);
        els.dryRunToggle.checked = !!snapshot.form.dryRun;
        els.openMidjourneyAfterGenerate.checked = !!snapshot.form.autoOpenMidjourney;
        if (els.autoApplyCatalogOnSelect) {
          els.autoApplyCatalogOnSelect.checked = snapshot.form.autoApplyCatalogOnSelect !== false;
        }
      }

      if (!Array.isArray(snapshot.works) || snapshot.works.length === 0) {
        return false;
      }

      state.works = snapshot.works;
      state.filteredWorks = [...snapshot.works];
      state.selectedIds = new Set(Array.isArray(snapshot.selectedIds) ? snapshot.selectedIds : []);
      state.resultsById.clear();
      state.resultOrder = [];
      state.queueItems = [];
      state.activeQueueTitleId = null;

      const validIds = getValidTitleIdSet();
      const normalizedSelected = new Set();
      for (const id of state.selectedIds) {
        if (validIds.has(id)) normalizedSelected.add(id);
      }
      state.selectedIds = normalizedSelected;

      const savedResults = Array.isArray(snapshot.results) ? snapshot.results : [];
      for (const row of savedResults) {
        const id = textValue(row?.titleId);
        if (!id || !validIds.has(id)) continue;
        const ratio = normalizeAspectRatio(row.aspectRatio);
        const normalizedNegative = normalizeNegativePrompt(row.negativePrompt);
        const normalizedPrompt = enforcePromptStyle(String(row.midjourneyPrompt || ""), normalizedNegative, ratio);
        state.resultsById.set(id, {
          titleId: id,
          title: row.title || { ko: "", zh: "" },
          poet: row.poet || { ko: "", zh: "" },
          source: row.source || "",
          sceneSummaryKo: row.sceneSummaryKo || "",
          midjourneyPrompt: normalizedPrompt,
          midjourneyPromptKo: String(row.midjourneyPromptKo || ""),
          negativePrompt: normalizedNegative,
          aspectRatio: ratio,
          generationMode: row.generationMode || "",
        });
      }

      const ordered = Array.isArray(snapshot.resultOrder) ? snapshot.resultOrder : [];
      const existing = new Set();
      for (const id of ordered) {
        if (!state.resultsById.has(id)) continue;
        if (existing.has(id)) continue;
        existing.add(id);
        state.resultOrder.push(id);
      }
      for (const id of state.resultsById.keys()) {
        if (existing.has(id)) continue;
        existing.add(id);
        state.resultOrder.push(id);
      }

      state.lastRunMeta = snapshot.lastRunMeta && typeof snapshot.lastRunMeta === "object"
        ? snapshot.lastRunMeta
        : null;

      clearImageCollectionData(false);
      state.completedImageIds = new Set();
      for (const id of (Array.isArray(snapshot.completedImageIds) ? snapshot.completedImageIds : [])) {
        if (validIds.has(id)) state.completedImageIds.add(id);
      }

      const queueItems = Array.isArray(snapshot.queueItems) ? snapshot.queueItems : [];
      state.queueItems = queueItems
        .map(item => ({
          titleId: textValue(item?.titleId),
          status: item?.status === "done" ? "done" : "pending",
        }))
        .filter(item => item.titleId && validIds.has(item.titleId))
        .slice(0, QUEUE_LIMIT)
        .map(item => ({
          titleId: item.titleId,
          status: state.completedImageIds.has(item.titleId) ? "done" : "pending",
        }));

      const activeId = textValue(snapshot.activeQueueTitleId);
      if (activeId && state.queueItems.some(item => item.titleId === activeId)) {
        state.activeQueueTitleId = activeId;
      } else {
        const pending = state.queueItems.find(item => item.status !== "done");
        state.activeQueueTitleId = pending ? pending.titleId : (state.queueItems[0]?.titleId || null);
      }

      if (els.queryInput.value.trim() || els.poetInput.value.trim()) {
        applyFilters();
      } else {
        renderWorkList();
      }
      renderSelectionSummary();
      renderResults();
      renderQueue();
      renderImageCollection();

      setLeftStatus(`${state.works.length}편 작업 상태 복원`);
      const restoredAt = getLocalTimeLabel(snapshot.savedAt);
      setCenterStatus(restoredAt ? `이전 작업 복원 완료 (${restoredAt})` : "이전 작업 복원 완료");
      return true;
    } finally {
      suspendPersist = false;
    }
  }

  function extractAspectRatioFromPrompt(prompt) {
    const match = String(prompt || "").match(/--ar\s+(\d+:\d+)/i);
    return match ? normalizeAspectRatio(match[1]) : DEFAULT_ASPECT_RATIO;
  }

  function removeAspectRatioFlag(prompt) {
    return String(prompt || "").replace(/\s--ar\s+\d+:\d+/gi, "").replace(/\s+/g, " ").trim();
  }

  function applyAspectRatioToPrompt(prompt, aspectRatio) {
    const ratio = normalizeAspectRatio(aspectRatio);
    const body = removeAspectRatioFlag(prompt);
    return `${body} --ar ${ratio}`.trim();
  }

  function normalizePoemFromFull(item, index) {
    const titleKo = textValue(item?.title, "ko");
    const titleZh = textValue(item?.title, "zh");
    const poetKo = textValue(item?.poet, "ko");
    const poetZh = textValue(item?.poet, "zh");

    return {
      source: "poems.full.json",
      titleId: textValue(item?.titleId) || `P${index + 1}`,
      titleKo,
      titleZh,
      poetKo,
      poetZh,
      titleDisplay: titleKo || titleZh || `Untitled-${index + 1}`,
      poetDisplay: poetKo || poetZh || "Unknown poet",
      poemZh: textValue(item?.poemZh, "zh"),
      translationKo: textValue(item?.translationKo, "ko"),
      category: textValue(item?.category, "ko"),
      meter: textValue(item?.meter, "ko"),
    };
  }

  function normalizePoemsFromArchive(rows) {
    const out = [];
    for (const row of rows) {
      if (row?.type !== "poet" || !Array.isArray(row?.poems)) continue;
      const poet = textValue(row?.name);
      for (let i = 0; i < row.poems.length; i += 1) {
        const poem = row.poems[i];
        const title = textValue(poem?.title) || `poem-${i + 1}`;
        out.push({
          source: "archive/database.json",
          titleId: `${row?.id || "A"}-P${i + 1}`,
          titleKo: title,
          titleZh: title,
          poetKo: poet,
          poetZh: poet,
          titleDisplay: title,
          poetDisplay: poet || "Unknown poet",
          poemZh: textValue(poem?.content),
          translationKo: textValue(row?.desc),
          category: "",
          meter: "",
        });
      }
    }
    return out;
  }

  function parseWorksFromJsonText(jsonText) {
    const payload = JSON.parse(jsonText);
    if (Array.isArray(payload)) {
      return payload.map(normalizePoemFromFull).filter(Boolean);
    }
    if (payload && Array.isArray(payload.data)) {
      return normalizePoemsFromArchive(payload.data);
    }
    throw new Error("지원하지 않는 JSON 구조입니다.");
  }

  function getWorkById(titleId) {
    return state.works.find(w => w.titleId === titleId) || null;
  }

  function applyFilters() {
    const query = normalizeSearchText(els.queryInput.value);
    const poet = normalizeSearchText(els.poetInput.value);

    state.filteredWorks = state.works.filter(work => {
      if (poet) {
        const poetTarget = normalizeSearchText(`${work.poetKo} ${work.poetZh}`);
        if (!poetTarget.includes(poet)) return false;
      }

      if (!query) return true;
      const haystack = normalizeSearchText([
        work.titleId,
        work.titleKo,
        work.titleZh,
        work.poetKo,
        work.poetZh,
        makeExcerpt(work.poemZh, 260),
        makeExcerpt(work.translationKo, 220),
      ].join(" "));

      return query.split(" ").filter(Boolean).every(token => haystack.includes(token));
    });

    renderWorkList();
    renderSelectionSummary();
    setLeftStatus(`필터 적용: ${state.filteredWorks.length}편`);
    schedulePersistSessionState();
  }

  function renderWorkList() {
    els.worksCount.textContent = `${state.filteredWorks.length} / ${state.works.length}`;
    if (state.filteredWorks.length === 0) {
      els.workList.innerHTML = '<div class="empty-msg">표시할 작품이 없습니다.</div>';
      schedulePersistSessionState();
      return;
    }

    const html = state.filteredWorks.map(work => {
      const selected = state.selectedIds.has(work.titleId);
      const done = state.completedImageIds.has(work.titleId);
      const preview = makeExcerpt(work.poemZh || work.translationKo, 74);
      return `
        <div class="work-item ${selected ? "selected" : ""} ${done ? "done" : ""}" data-title-id="${work.titleId}">
          <input type="checkbox" ${selected ? "checked" : ""} data-action="toggle" data-title-id="${work.titleId}">
          <div>
            <div class="work-title-row">
              <div class="work-title">${escapeHtml(work.titleDisplay)}</div>
              ${done ? '<span class="work-ok">OK</span>' : ""}
            </div>
            <div class="work-meta">${escapeHtml(work.titleId)} · ${escapeHtml(work.poetDisplay)}</div>
            <div class="work-preview">${escapeHtml(preview)}</div>
          </div>
        </div>
      `;
    }).join("");

    els.workList.innerHTML = html;
    schedulePersistSessionState();
  }

  function renderSelectionSummary() {
    const totalSelected = state.selectedIds.size;
    const visibleSelected = state.filteredWorks.filter(w => state.selectedIds.has(w.titleId)).length;
    const queueDone = state.queueItems.filter(q => q.status === "done").length;
    const doneCount = state.completedImageIds.size;
    const catalogCount = state.promptCatalogById.size;
    els.selectionSummary.innerHTML = [
      `선택된 작품: <strong>${totalSelected}편</strong>`,
      `현재 필터에서 선택: ${visibleSelected}편`,
      `저장 프롬프트 catalog: ${catalogCount}편`,
      `이미지 저장완료(OK): ${doneCount}편`,
      `이미지 큐: ${queueDone}/${state.queueItems.length}`,
      state.lastRunMeta ? `최근 생성: ${escapeHtml(state.lastRunMeta.generatedAt)}` : "최근 생성: 없음",
    ].join("<br>");
    schedulePersistSessionState();
  }

  function ratioOptionsHtml(selectedRatio) {
    const ratio = normalizeAspectRatio(selectedRatio);
    return ASPECT_RATIOS.map(r => `<option value="${r}" ${r === ratio ? "selected" : ""}>${r}</option>`).join("");
  }

  function renderResults() {
    els.resultsCount.textContent = `${state.resultOrder.length}개`;
    const hasAny = state.resultOrder.length > 0;
    els.btnCopyAllPrompts.disabled = !hasAny;
    els.btnExportJson.disabled = !hasAny;

    if (!hasAny) {
      els.resultList.innerHTML = '<div class="empty-msg">생성된 프롬프트가 없습니다.</div>';
      schedulePersistSessionState();
      return;
    }

    const html = state.resultOrder.map(titleId => {
      const result = state.resultsById.get(titleId);
      if (!result) return "";
      const title = result?.title?.ko || result?.title?.zh || "";
      const poet = result?.poet?.ko || result?.poet?.zh || "";
      const ratio = normalizeAspectRatio(result.aspectRatio || extractAspectRatioFromPrompt(result.midjourneyPrompt));

      return `
        <div class="result-card" data-title-id="${escapeHtml(titleId)}">
          <div class="result-head">
            <div class="result-title">${escapeHtml(title)} · ${escapeHtml(poet)}</div>
            <div class="result-meta">${escapeHtml(titleId)}</div>
          </div>
          <div class="result-scene">${escapeHtml(result.sceneSummaryKo || "시 장면 요약 없음")}</div>

          <label class="field-label">영문 프롬프트</label>
          <textarea data-role="prompt-en" data-title-id="${escapeHtml(titleId)}">${escapeHtml(result.midjourneyPrompt || "")}</textarea>

          <label class="field-label">한글 검토/수정용</label>
          <textarea data-role="prompt-ko" data-title-id="${escapeHtml(titleId)}">${escapeHtml(result.midjourneyPromptKo || "")}</textarea>

          <div class="result-actions">
            <select data-role="aspect-ratio" data-title-id="${escapeHtml(titleId)}" class="ratio-select">
              ${ratioOptionsHtml(ratio)}
            </select>
            <button type="button" class="secondary" data-action="confirm-sync" data-title-id="${escapeHtml(titleId)}">한글확정→영문반영</button>
            <button type="button" data-action="confirm-copy-open" data-title-id="${escapeHtml(titleId)}">확정+복사+Midjourney</button>
            <button type="button" class="secondary" data-action="copy-prompt" data-title-id="${escapeHtml(titleId)}">복사</button>
            <button type="button" data-action="open-mj" data-title-id="${escapeHtml(titleId)}">Midjourney 열기</button>
          </div>
        </div>
      `;
    }).join("");

    els.resultList.innerHTML = html;
    schedulePersistSessionState();
  }

  function renderQueue() {
    els.queueCountBadge.textContent = `${state.queueItems.length}/${QUEUE_LIMIT}`;

    if (state.queueItems.length === 0) {
      els.queueList.innerHTML = '<div class="empty-msg" style="padding:16px 10px;">아직 큐가 없습니다.</div>';
      schedulePersistSessionState();
      return;
    }

    const html = state.queueItems.map(item => {
      const work = getWorkById(item.titleId);
      const name = work ? `${work.poetDisplay} · ${work.titleDisplay}` : item.titleId;
      const isDone = item.status === "done" || state.completedImageIds.has(item.titleId);
      const isActive = item.titleId === state.activeQueueTitleId;
      const activeClass = isActive ? "active" : "";
      const doneClass = isDone ? "done" : "";
      const stateParts = [isDone ? "저장완료" : "대기"];
      if (isActive) stateParts.push("활성");
      const stateText = stateParts.join(" · ");
      return `
        <div class="queue-item ${activeClass} ${doneClass}" data-action="queue-select" data-title-id="${escapeHtml(item.titleId)}">
          <div>${escapeHtml(item.titleId)} · ${escapeHtml(name)}</div>
          <div class="queue-state">${stateText}</div>
        </div>
      `;
    }).join("");

    els.queueList.innerHTML = html;
    schedulePersistSessionState();
  }

  function renderImageCollection() {
    els.imageCollectionCount.textContent = `${state.imageCollection.size}개`;
    const hasImages = state.imageCollection.size > 0;
    els.btnDownloadImageZip.disabled = !hasImages;
    els.btnExportImageManifest.disabled = !hasImages;

    if (!hasImages) {
      els.imageCollectionList.innerHTML = '<div class="empty-msg" style="padding:16px 10px;">저장된 이미지가 없습니다.</div>';
      schedulePersistSessionState();
      return;
    }

    const orderedIds = [];
    const seen = new Set();
    for (const q of state.queueItems) {
      if (state.imageCollection.has(q.titleId)) {
        orderedIds.push(q.titleId);
        seen.add(q.titleId);
      }
    }
    for (const id of state.imageCollection.keys()) {
      if (!seen.has(id)) orderedIds.push(id);
    }

    const rows = orderedIds.map(titleId => {
      const img = state.imageCollection.get(titleId);
      if (!img) return "";
      const work = getWorkById(titleId);
      const titleText = work?.titleDisplay || "작품명 없음";
      const poetText = work?.poetDisplay || "시인 미상";
      const thumbSrc = img.thumbUrl || "";
      return `
        <div class="img-col-item">
          <img class="img-thumb" src="${thumbSrc}" alt="${escapeHtml(titleId)}">
          <div class="img-meta">
            <div class="img-title">${escapeHtml(titleId)} · ${escapeHtml(titleText)}</div>
            <div class="img-sub">${escapeHtml(poetText)}</div>
            <div class="img-sub">${escapeHtml(img.fileName)} · ${img.width}x${img.height} · ${Math.round(img.size / 1024)}KB</div>
          </div>
        </div>
      `;
    }).join("");

    els.imageCollectionList.innerHTML = rows;
    schedulePersistSessionState();
  }

  function selectFilteredWorks() {
    for (const work of state.filteredWorks) {
      state.selectedIds.add(work.titleId);
    }
    renderWorkList();
    renderSelectionSummary();
    if (els.autoApplyCatalogOnSelect?.checked && state.promptCatalogById.size > 0) {
      applyCatalogToSelection(true);
    }
    setLeftStatus(`필터 전부 선택: ${state.filteredWorks.length}편`);
  }

  function clearSelection() {
    state.selectedIds.clear();
    renderWorkList();
    renderSelectionSummary();
    setLeftStatus("선택 해제 완료");
  }

  function getSelectedWorks(limit = null) {
    const selected = state.works.filter(work => state.selectedIds.has(work.titleId));
    if (typeof limit === "number") return selected.slice(0, limit);
    return selected;
  }

  function inferVisualCues(work) {
    const text = `${work.titleDisplay} ${work.poemZh} ${work.translationKo}`;
    const cues = [];
    const pick = (re, label) => {
      if (re.test(text) && !cues.includes(label)) cues.push(label);
    };

    pick(/月|달|moon/iu, "moonlit sky");
    pick(/江|河|川|강|물|river/iu, "misty river");
    pick(/山|嶺|봉|mountain/iu, "layered distant mountains");
    pick(/秋|가을|autumn/iu, "autumn wind and sparse leaves");
    pick(/春|봄|spring/iu, "early spring blossoms");
    pick(/雪|눈|snow/iu, "light snow on roofs and trees");
    pick(/雨|비|rain/iu, "gentle rain over stone path");
    pick(/夜|밤|night/iu, "quiet nighttime atmosphere");
    pick(/酒|술|wine/iu, "solitary scholar with a wine cup");
    pick(/舟|船|배|boat/iu, "small lone boat near the shore");
    pick(/送|別|이별|farewell/iu, "departure pavilion with two figures");

    if (cues.length === 0) {
      cues.push("tranquil natural scene inspired by classical Tang poetry");
    }
    return cues.slice(0, 4);
  }

  const EN_TO_KO_CUE = {
    "moonlit sky": "달빛이 감도는 하늘",
    "misty river": "안개 낀 강",
    "layered distant mountains": "겹겹의 원산",
    "autumn wind and sparse leaves": "가을 바람과 듬성한 낙엽",
    "early spring blossoms": "초봄의 옅은 꽃기운",
    "light snow on roofs and trees": "지붕과 나뭇가지 위 옅은 눈",
    "gentle rain over stone path": "돌길 위의 잔잔한 비",
    "quiet nighttime atmosphere": "고요한 야경",
    "solitary scholar with a wine cup": "술잔을 든 고독한 선비",
    "small lone boat near the shore": "강가의 작은 외로운 배",
    "departure pavilion with two figures": "송별의 정자와 두 인물",
    "tranquil natural scene inspired by classical Tang poetry": "당시 정서를 살린 고요한 자연 장면",
  };

  function buildDryRunPrompt(work, aspectRatio) {
    const ratio = normalizeAspectRatio(aspectRatio);
    const promptBody = [
      STYLE_PREFIX_EN,
      "rice-paper brush texture and calligraphic brush rhythm",
      "wide breathing blank space composition",
      inferVisualCues(work).join(", "),
      "no modern objects",
    ].join(", ");
    return enforcePromptStyle(promptBody, DEFAULT_NEGATIVE_PROMPT, ratio);
  }

  function buildDryRunPromptKo(work, aspectRatio) {
    const ratio = normalizeAspectRatio(aspectRatio);
    const cues = inferVisualCues(work).map(c => EN_TO_KO_CUE[c] || c).join(", ");
    return [
      "동양화 수묵화(문인화) 스타일",
      "절제된 저채색",
      "넓은 여백 중심 구도",
      "붓의 운필과 먹 번짐 질감",
      "시적인 정서",
      cues,
      "성숙하고 절제된 문인화 톤, 아동용/카툰 느낌 배제",
      "여백 중심의 구도, 현대 요소/문자/워터마크 제외",
      `비율 ${ratio}`,
    ].join(", ");
  }

  function buildOpenAIInput(works) {
    return works.map(work => ({
      titleId: work.titleId,
      titleKo: work.titleKo,
      titleZh: work.titleZh,
      poetKo: work.poetKo,
      poetZh: work.poetZh,
      poemExcerpt: makeExcerpt(work.poemZh, 260),
      translationExcerpt: makeExcerpt(work.translationKo, 220),
      category: work.category,
      meter: work.meter,
    }));
  }

  function enforcePromptStyle(promptRaw, negativePromptRaw, aspectRatio) {
    let prompt = normalizePromptBody(promptRaw);
    if (!prompt) prompt = "classical Tang poem inspired scene";
    prompt = composePromptBodyWithStylePrefix(prompt);

    const noText = normalizeNegativePrompt(negativePromptRaw);
    prompt = applyAspectRatioToPrompt(prompt, aspectRatio);
    if (DEFAULT_MJ_PARAMS) prompt = `${prompt} ${DEFAULT_MJ_PARAMS}`.trim();
    if (noText) prompt = `${prompt} --no ${noText}`.trim();
    return prompt;
  }

  function extractChatContent(responseJson) {
    const choice = responseJson?.choices?.[0];
    if (!choice) throw new Error("OpenAI 응답에 choices가 없습니다.");
    const content = choice?.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map(part => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      }).join("");
    }
    throw new Error("OpenAI 응답 content 형식을 해석할 수 없습니다.");
  }

  function parseJsonObject(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      const match = String(text).match(/\{[\s\S]*\}/);
      if (!match) throw err;
      return JSON.parse(match[0]);
    }
  }

  async function requestPromptsFromOpenAI(works, apiKey, model, temperature, aspectRatio) {
    const ratio = normalizeAspectRatio(aspectRatio);
    const systemInstruction = [
      "You are an art director generating Midjourney prompts for classical Chinese poems.",
      "Return only a valid JSON object, no markdown code fences.",
      "JSON schema:",
      "{",
      '  "results": [',
      "    {",
      '      "titleId": "string",',
      '      "sceneSummaryKo": "string",',
      '      "midjourneyPrompt": "string",',
      '      "midjourneyPromptKo": "string",',
      '      "negativePrompt": "string"',
      "    }",
      "  ]",
      "}",
      "Rules:",
      "- One result per provided work with matching titleId.",
      `- Include these style phrases in midjourneyPrompt: ${REQUIRED_STYLE_EN.join(", ")}.`,
      `- Every midjourneyPrompt MUST start with this exact leading style phrase: ${STYLE_PREFIX_EN}.`,
      `- Include --ar ${ratio} in every midjourneyPrompt.`,
      "- midjourneyPrompt must be one English sentence, 40-80 words, visual and specific.",
      "- midjourneyPromptKo should be Korean review text with same intent (not literal only).",
      "- Emphasize East Asian brush-and-ink mood and spacious blank composition.",
      "- Avoid modern elements, typography, logos, watermark.",
      "- Keep a mature literati tone. Never produce childlike/cartoon/chibi/anime rendering.",
      "- Prefer one calm scene with 0-2 human figures; avoid playful children's-book narrative.",
      `- End each midjourneyPrompt with: ${DEFAULT_MJ_PARAMS}`,
      `- negativePrompt should include at least: ${DEFAULT_NEGATIVE_PROMPT}.`,
    ].join("\n");

    const payload = {
      commonRequirementKo: REQUIRED_STYLE_KO,
      commonRequirementEn: REQUIRED_STYLE_EN.join(", "),
      defaultAspectRatio: ratio,
      works: buildOpenAIInput(works),
    };

    const res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 400)}`);
    }

    const parsed = parseJsonObject(extractChatContent(await res.json()));
    if (!Array.isArray(parsed?.results)) {
      throw new Error("OpenAI 응답 JSON에 results 배열이 없습니다.");
    }
    return parsed.results;
  }

  async function requestEnglishFromKorean(koreanPrompt, currentEnglish, apiKey, model, aspectRatio) {
    const ratio = normalizeAspectRatio(aspectRatio);
    const systemInstruction = [
      "You convert Korean prompt edits into Midjourney English prompts.",
      "Return only JSON: {\"midjourneyPrompt\":\"...\"}",
      `- Include these phrases: ${REQUIRED_STYLE_EN.join(", ")}`,
      `- Start the prompt with this exact leading style phrase: ${STYLE_PREFIX_EN}.`,
      `- Include --ar ${ratio}`,
      `- Keep Midjourney params like ${DEFAULT_MJ_PARAMS}`,
      "- Keep strong East Asian ink-and-wash feeling with generous blank space.",
      "- Keep mature literati mood. Avoid cartoon/childish/chibi/anime vibe.",
      "- Single concise English prompt sentence.",
      "- No markdown.",
    ].join("\n");

    const userPayload = {
      koreanPrompt,
      currentEnglishPrompt: currentEnglish,
      requiredStyleKo: REQUIRED_STYLE_KO,
    };

    const res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`한글->영문 변환 실패 ${res.status}: ${errText.slice(0, 300)}`);
    }

    const parsed = parseJsonObject(extractChatContent(await res.json()));
    return textValue(parsed.midjourneyPrompt, "ko");
  }

  function mergeResults(works, generatedRows, generationMode, aspectRatio) {
    const ratio = normalizeAspectRatio(aspectRatio);
    const rowMap = new Map();
    for (const row of generatedRows || []) {
      const id = textValue(row?.titleId);
      if (id) rowMap.set(id, row);
    }

    for (const work of works) {
      const row = rowMap.get(work.titleId) || {};
      const sceneSummaryKo = textValue(row?.sceneSummaryKo, "ko") || "시의 정서를 반영한 문인화 장면";
      const negativePrompt = normalizeNegativePrompt(textValue(row?.negativePrompt, "ko"));
      const baseEn = textValue(row?.midjourneyPrompt, "ko") || buildDryRunPrompt(work, ratio);
      const baseKo = textValue(row?.midjourneyPromptKo, "ko") || buildDryRunPromptKo(work, ratio);
      const midjourneyPrompt = enforcePromptStyle(baseEn, negativePrompt, ratio);

      state.resultsById.set(work.titleId, {
        titleId: work.titleId,
        title: { ko: work.titleKo, zh: work.titleZh },
        poet: { ko: work.poetKo, zh: work.poetZh },
        source: work.source,
        sceneSummaryKo,
        midjourneyPrompt,
        midjourneyPromptKo: baseKo,
        negativePrompt,
        aspectRatio: ratio,
        generationMode,
      });
    }

    const existing = new Set(state.resultOrder);
    for (const work of works) {
      if (!existing.has(work.titleId)) state.resultOrder.push(work.titleId);
    }
  }

  function normalizeCatalogRow(row, fallbackWork = null) {
    const titleId = textValue(row?.titleId);
    if (!titleId) return null;
    const work = fallbackWork || getWorkById(titleId);
    const ratio = normalizeAspectRatio(
      row?.aspectRatio || extractAspectRatioFromPrompt(textValue(row?.midjourneyPrompt, "ko"))
    );
    const negativePrompt = normalizeNegativePrompt(textValue(row?.negativePrompt, "ko"));
    const midjourneyPrompt = enforcePromptStyle(textValue(row?.midjourneyPrompt, "ko"), negativePrompt, ratio);
    const sceneSummaryKo = textValue(row?.sceneSummaryKo, "ko") || "시의 정서를 반영한 문인화 장면";
    const midjourneyPromptKo =
      textValue(row?.midjourneyPromptKo, "ko") ||
      textValue(row?.sceneSummaryKo, "ko") ||
      (work ? buildDryRunPromptKo(work, ratio) : "");

    return {
      titleId,
      title: row?.title || { ko: work?.titleKo || "", zh: work?.titleZh || "" },
      poet: row?.poet || { ko: work?.poetKo || "", zh: work?.poetZh || "" },
      source: row?.source || work?.source || "catalog",
      sceneSummaryKo,
      midjourneyPrompt,
      midjourneyPromptKo,
      negativePrompt,
      aspectRatio: ratio,
      generationMode: row?.generationMode || "catalog",
    };
  }

  function parsePromptCatalogPayload(payload) {
    const rows = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.results) ? payload.results : []);
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("results 배열이 없는 JSON입니다.");
    }

    const map = new Map();
    for (const row of rows) {
      const id = textValue(row?.titleId);
      if (!id) continue;
      map.set(id, row);
    }
    return map;
  }

  function applyCatalogRowsByIds(titleIds, silent = false) {
    if (state.promptCatalogById.size === 0) {
      if (!silent) setCenterStatus("로드된 프롬프트 catalog가 없습니다.");
      return 0;
    }

    const uniqueIds = [...new Set((titleIds || []).map(id => String(id || "").trim()).filter(Boolean))];
    let applied = 0;

    for (const titleId of uniqueIds) {
      const raw = state.promptCatalogById.get(titleId);
      if (!raw) continue;
      const work = getWorkById(titleId);
      const row = normalizeCatalogRow(raw, work);
      if (!row) continue;

      state.resultsById.set(titleId, row);
      if (!state.resultOrder.includes(titleId)) state.resultOrder.push(titleId);
      applied += 1;
    }

    if (applied > 0) {
      renderResults();
      renderSelectionSummary();
    }
    if (!silent) {
      if (applied > 0) setCenterStatus(`선택작품에 저장 프롬프트 ${applied}개 반영 완료`);
      else setCenterStatus("선택 작품에 매칭되는 저장 프롬프트가 없습니다.");
    }
    return applied;
  }

  function applyCatalogToSelection(silent = false) {
    const ids = getSelectedWorks(null).map(work => work.titleId);
    if (ids.length === 0) {
      if (!silent) setCenterStatus("먼저 작품을 선택해주세요.");
      return 0;
    }
    return applyCatalogRowsByIds(ids, silent);
  }

  async function loadPromptCatalogFromText(text, sourceName = "catalog.json") {
    const payload = JSON.parse(text);
    const catalogMap = parsePromptCatalogPayload(payload);
    state.promptCatalogById = catalogMap;
    state.promptCatalogMeta = {
      sourceName,
      loadedAt: new Date().toISOString(),
      count: catalogMap.size,
    };

    renderSelectionSummary();
    const autoApply = !!els.autoApplyCatalogOnSelect?.checked;
    const applied = autoApply ? applyCatalogToSelection(true) : 0;
    const loadedCount = catalogMap.size;
    if (applied > 0) {
      setCenterStatus(`프롬프트 catalog 로드 완료: ${loadedCount}편, 현재 선택에 ${applied}편 자동 반영`);
    } else {
      setCenterStatus(`프롬프트 catalog 로드 완료: ${loadedCount}편`);
    }
  }

  function setGeneratingUiState(isGenerating) {
    state.isGenerating = isGenerating;
    els.btnGenerate.disabled = isGenerating;
    els.btnGenerateSelectedTop5.disabled = isGenerating;
  }

  async function copyText(text) {
    const raw = String(text || "");
    if (!raw) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(raw);
        return true;
      }
    } catch (_) {
      // fallback below
    }

    const ta = document.createElement("textarea");
    ta.value = raw;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }

  async function openMidjourneyWithPrompt(prompt, preparedWindow = null) {
    const promptText = String(prompt || "").trim();
    if (!promptText) {
      setCenterStatus("Midjourney로 보낼 프롬프트가 비어 있습니다.");
      return;
    }

    const copied = await copyText(promptText);
    const targetUrl = `https://www.midjourney.com/imagine?prompt=${encodeURIComponent(promptText)}`;
    let win = preparedWindow;

    if (win && !win.closed) {
      try {
        win.location.href = targetUrl;
      } catch (_) {
        win = null;
      }
    }
    if (!win) win = window.open(targetUrl, "_blank");

    if (!win) {
      setCenterStatus("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
      return;
    }

    if (copied) {
      setCenterStatus("Midjourney 탭 열기 + 프롬프트 복사 완료. 붙여넣고 실행하세요.");
    } else {
      setCenterStatus("Midjourney 탭은 열렸지만 복사 실패. 수동 복사 후 실행하세요.");
    }
  }

  function readCardValues(card, titleId) {
    const enTa = card?.querySelector("textarea[data-role='prompt-en']");
    const koTa = card?.querySelector("textarea[data-role='prompt-ko']");
    const ratioSel = card?.querySelector("select[data-role='aspect-ratio']");
    const ratio = normalizeAspectRatio(ratioSel?.value || DEFAULT_ASPECT_RATIO);
    return {
      titleId,
      enText: String(enTa?.value || ""),
      koText: String(koTa?.value || ""),
      ratio,
      enTa,
      koTa,
      ratioSel,
    };
  }

  function writeResultStateFromCard(titleId, cardData) {
    const row = state.resultsById.get(titleId);
    if (!row) return;
    row.midjourneyPrompt = applyAspectRatioToPrompt(cardData.enText, cardData.ratio);
    row.midjourneyPromptKo = cardData.koText;
    row.aspectRatio = cardData.ratio;
    state.resultsById.set(titleId, row);
    schedulePersistSessionState();
  }

  async function confirmKoreanToEnglish(titleId, cardData) {
    const apiKey = (els.apiKeyInput.value || "").trim();
    const model = (els.modelInput.value || "").trim() || DEFAULT_MODEL;

    let nextEnglish = cardData.enText;
    if (apiKey && cardData.koText.trim()) {
      nextEnglish = await requestEnglishFromKorean(cardData.koText, cardData.enText, apiKey, model, cardData.ratio);
    } else if (cardData.koText.trim()) {
      setCenterStatus("API Key가 없어 한글→영문 자동 변환은 건너뜁니다. 기존 영문에 비율만 반영합니다.");
    }

    const row = state.resultsById.get(titleId);
    const negative = normalizeNegativePrompt(row?.negativePrompt);
    const enforced = enforcePromptStyle(nextEnglish || cardData.enText, negative, cardData.ratio);
    cardData.enTa.value = enforced;

    writeResultStateFromCard(titleId, {
      ...cardData,
      enText: enforced,
    });
    return enforced;
  }

  async function generatePrompts(limit = null) {
    if (state.isGenerating) return;
    const selectedWorks = getSelectedWorks(limit);
    if (selectedWorks.length === 0) {
      setCenterStatus("선택된 작품이 없습니다.");
      return;
    }

    const model = (els.modelInput.value || "").trim() || DEFAULT_MODEL;
    const dryRun = !!els.dryRunToggle.checked;
    const autoOpenMidjourney = !!els.openMidjourneyAfterGenerate.checked;
    const aspectRatio = normalizeAspectRatio(els.globalAspectRatio.value);
    const temperature = Number.parseFloat(els.temperatureInput.value);
    const safeTemp = Number.isFinite(temperature) ? Math.min(2, Math.max(0, temperature)) : DEFAULT_TEMPERATURE;
    const apiKey = (els.apiKeyInput.value || "").trim();

    if (!dryRun && !apiKey) {
      setCenterStatus("API Key를 입력하거나 dry-run을 켜주세요.");
      return;
    }

    setGeneratingUiState(true);
    setCenterStatus(`생성 시작: ${selectedWorks.length}편`);

    let preparedWindow = null;
    if (autoOpenMidjourney) {
      preparedWindow = window.open("", "_blank");
      if (preparedWindow && !preparedWindow.closed) {
        preparedWindow.document.title = "Midjourney Opening...";
        preparedWindow.document.body.style.fontFamily = "sans-serif";
        preparedWindow.document.body.style.padding = "24px";
        preparedWindow.document.body.textContent = "프롬프트 생성 중... 완료되면 Midjourney로 이동합니다.";
      }
    }

    try {
      let generatedRows;
      let modeLabel;

      if (dryRun) {
        generatedRows = selectedWorks.map(work => ({
          titleId: work.titleId,
          sceneSummaryKo: "시의 핵심 정서를 반영한 문인화 장면",
          midjourneyPrompt: buildDryRunPrompt(work, aspectRatio),
          midjourneyPromptKo: buildDryRunPromptKo(work, aspectRatio),
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
        }));
        modeLabel = "dry-run";
      } else {
        generatedRows = await requestPromptsFromOpenAI(selectedWorks, apiKey, model, safeTemp, aspectRatio);
        modeLabel = model;
      }

      mergeResults(selectedWorks, generatedRows, modeLabel, aspectRatio);
      state.lastRunMeta = {
        generatedAt: new Date().toISOString(),
        count: selectedWorks.length,
        model: modeLabel,
      };

      renderSelectionSummary();
      renderResults();
      setCenterStatus(`생성 완료: ${selectedWorks.length}편 (${modeLabel}, ${aspectRatio})`);

      if (autoOpenMidjourney && selectedWorks.length > 0) {
        const first = state.resultsById.get(selectedWorks[0].titleId);
        if (first?.midjourneyPrompt) {
          await openMidjourneyWithPrompt(first.midjourneyPrompt, preparedWindow);
        } else if (preparedWindow && !preparedWindow.closed) {
          preparedWindow.close();
        }
      } else if (preparedWindow && !preparedWindow.closed) {
        preparedWindow.close();
      }
    } catch (err) {
      if (preparedWindow && !preparedWindow.closed) preparedWindow.close();
      setCenterStatus(`생성 실패: ${err.message}`);
    } finally {
      setGeneratingUiState(false);
    }
  }

  async function copyAllPrompts() {
    if (state.resultOrder.length === 0) return;
    const lines = [];
    for (const titleId of state.resultOrder) {
      const row = state.resultsById.get(titleId);
      if (!row) continue;
      const title = row?.title?.ko || row?.title?.zh || "";
      const poet = row?.poet?.ko || row?.poet?.zh || "";
      lines.push(`[${titleId}] ${poet} - ${title}`);
      lines.push(row.midjourneyPrompt || "");
      lines.push("");
    }
    const ok = await copyText(lines.join("\n"));
    setCenterStatus(ok ? `전체 프롬프트 복사 완료 (${state.resultOrder.length}개)` : "복사 실패");
  }

  function exportResultsJson() {
    if (state.resultOrder.length === 0) {
      setCenterStatus("내보낼 결과가 없습니다.");
      return;
    }
    const results = state.resultOrder.map(id => state.resultsById.get(id)).filter(Boolean);
    const payload = {
      generatedAt: new Date().toISOString(),
      commonStyleRequirement: { ko: REQUIRED_STYLE_KO, en: REQUIRED_STYLE_EN },
      defaultAspectRatio: normalizeAspectRatio(els.globalAspectRatio.value),
      lastRunMeta: state.lastRunMeta,
      count: results.length,
      results,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `midjourney_prompts_${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setCenterStatus(`JSON 저장 완료 (${results.length}개)`);
  }

  function clearResults() {
    state.resultsById.clear();
    state.resultOrder = [];
    state.lastRunMeta = null;
    renderResults();
    renderSelectionSummary();
    setCenterStatus("생성 결과 초기화 완료");
  }

  function clearImageCollectionData(clearCompleted = false) {
    for (const [, item] of state.imageCollection) {
      if (item?.thumbUrl) {
        URL.revokeObjectURL(item.thumbUrl);
      }
    }
    state.imageCollection.clear();
    if (clearCompleted) state.completedImageIds.clear();
  }

  function buildQueueFromSelection() {
    const selectedWorks = getSelectedWorks(null);
    if (selectedWorks.length === 0) {
      setCenterStatus("큐를 만들 선택 작품이 없습니다.");
      return;
    }

    state.queueItems = selectedWorks.slice(0, QUEUE_LIMIT).map(work => ({
      titleId: work.titleId,
      status: state.completedImageIds.has(work.titleId) ? "done" : "pending",
    }));

    const firstPending = state.queueItems.find(item => item.status === "pending");
    state.activeQueueTitleId = firstPending ? firstPending.titleId : (state.queueItems[0]?.titleId || null);

    renderQueue();
    renderSelectionSummary();
    setCenterStatus(`이미지 큐 구성 완료 (${state.queueItems.length}개)`);
  }

  function clearQueue() {
    state.queueItems = [];
    state.activeQueueTitleId = null;
    renderQueue();
    renderSelectionSummary();
    setCenterStatus("이미지 큐 초기화 완료");
  }

  function setQueueItemStatus(titleId, status) {
    const target = state.queueItems.find(item => item.titleId === titleId);
    if (target) target.status = status;
  }

  function moveToNextPendingQueue() {
    const pending = state.queueItems.find(item => item.status !== "done");
    state.activeQueueTitleId = pending ? pending.titleId : null;
  }

  function dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  async function compressImageBlob(blob, maxSide = 2048, quality = 0.88) {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = reject;
        element.src = url;
      });

      const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(1, Math.round(img.naturalWidth * ratio));
      const height = Math.max(1, Math.round(img.naturalHeight * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const outBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (!outBlob) throw new Error("이미지 압축 실패");
      return { blob: outBlob, width, height };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function saveImageToActiveQueue(rawBlob, sourceLabel = "paste") {
    if (!state.activeQueueTitleId) {
      setCenterStatus("활성 큐 항목이 없습니다. 먼저 큐를 구성하세요.");
      return;
    }

    const titleId = state.activeQueueTitleId;
    try {
      const compressed = await compressImageBlob(rawBlob);
      const fileName = `${titleId}.jpg`;
      const prev = state.imageCollection.get(titleId);
      if (prev?.thumbUrl) URL.revokeObjectURL(prev.thumbUrl);
      const thumbUrl = URL.createObjectURL(compressed.blob);
      state.imageCollection.set(titleId, {
        blob: compressed.blob,
        fileName,
        width: compressed.width,
        height: compressed.height,
        size: compressed.blob.size,
        thumbUrl,
      });

      state.completedImageIds.add(titleId);
      setQueueItemStatus(titleId, "done");
      moveToNextPendingQueue();
      renderQueue();
      renderImageCollection();
      renderWorkList();
      renderSelectionSummary();
      setCenterStatus(`${titleId} 이미지 저장 완료 (${sourceLabel})`);
    } catch (err) {
      setCenterStatus(`이미지 저장 실패: ${err.message}`);
    }
  }

  function resolveTitleIdFromImageFileName(fileName) {
    const raw = String(fileName || "").trim();
    if (!raw) return "";
    const base = raw.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "").trim();
    if (!base) return "";

    if (getWorkById(base)) return base;

    const compact = base.replace(/\s+/g, "");
    if (compact && getWorkById(compact)) return compact;

    const candidates = base
      .split(/[\s_()[\]{}]+/)
      .map(v => v.trim())
      .filter(Boolean);

    for (const token of candidates) {
      if (getWorkById(token)) return token;
    }
    return "";
  }

  async function importExistingImageFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) {
      setCenterStatus("불러올 이미지 파일이 없습니다.");
      return;
    }
    if (state.works.length === 0) {
      setCenterStatus("먼저 작품 DB를 로드한 뒤 기존 이미지 폴더를 불러와주세요.");
      return;
    }

    const imageFiles = files.filter(file => {
      if (String(file.type || "").startsWith("image/")) return true;
      return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name || "");
    });

    if (imageFiles.length === 0) {
      setCenterStatus("이미지 파일이 없습니다. 폴더를 다시 선택해주세요.");
      return;
    }

    let matched = 0;
    let skipped = 0;
    let replaced = 0;

    for (const file of imageFiles) {
      const titleId = resolveTitleIdFromImageFileName(file.name);
      if (!titleId) {
        skipped += 1;
        continue;
      }
      try {
        const compressed = await compressImageBlob(file);
        const prev = state.imageCollection.get(titleId);
        if (prev?.thumbUrl) URL.revokeObjectURL(prev.thumbUrl);
        if (prev) replaced += 1;

        const thumbUrl = URL.createObjectURL(compressed.blob);
        state.imageCollection.set(titleId, {
          blob: compressed.blob,
          fileName: `${titleId}.jpg`,
          width: compressed.width,
          height: compressed.height,
          size: compressed.blob.size,
          thumbUrl,
        });
        state.completedImageIds.add(titleId);
        setQueueItemStatus(titleId, "done");
        matched += 1;
      } catch (_) {
        skipped += 1;
      }
    }

    moveToNextPendingQueue();
    renderQueue();
    renderImageCollection();
    renderWorkList();
    renderSelectionSummary();

    const summary = [
      `매칭 ${matched}개`,
      replaced > 0 ? `덮어씀 ${replaced}개` : "",
      skipped > 0 ? `건너뜀 ${skipped}개` : "",
    ].filter(Boolean).join(", ");
    setCenterStatus(`기존 이미지 불러오기 완료 (${summary})`);
  }

  async function handlePaste(e) {
    if (!state.activeQueueTitleId) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;
        await saveImageToActiveQueue(blob, "paste");
        return;
      }
    }
  }

  async function handleQueueFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCenterStatus("이미지 파일만 선택할 수 있습니다.");
      e.target.value = "";
      return;
    }
    await saveImageToActiveQueue(file, "file");
    e.target.value = "";
  }

  async function handleExistingImagesDirInput(e) {
    const files = e.target.files;
    try {
      await importExistingImageFiles(files);
    } finally {
      e.target.value = "";
    }
  }

  async function downloadImageZip() {
    if (state.imageCollection.size === 0) {
      setCenterStatus("다운로드할 이미지가 없습니다.");
      return;
    }
    if (typeof JSZip === "undefined") {
      setCenterStatus("JSZip 라이브러리를 찾을 수 없습니다.");
      return;
    }

    try {
      setCenterStatus("이미지 ZIP 생성 중...");
      const zip = new JSZip();
      for (const [, item] of state.imageCollection) {
        zip.file(item.fileName, item.blob);
      }
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mj_images_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setCenterStatus(`이미지 ZIP 다운로드 완료 (${state.imageCollection.size}개)`);
    } catch (err) {
      setCenterStatus(`이미지 ZIP 생성 실패: ${err.message}`);
    }
  }

  function exportImageManifest() {
    if (state.imageCollection.size === 0) {
      setCenterStatus("manifest로 내보낼 이미지가 없습니다.");
      return;
    }

    const items = [];
    for (const queueItem of state.queueItems) {
      const row = state.imageCollection.get(queueItem.titleId);
      if (!row) continue;
      const work = getWorkById(queueItem.titleId);
      items.push({
        titleId: queueItem.titleId,
        fileName: row.fileName,
        width: row.width,
        height: row.height,
        size: row.size,
        titleKo: work?.titleKo || "",
        poetKo: work?.poetKo || "",
      });
    }

    const payload = {
      createdAt: new Date().toISOString(),
      count: items.length,
      items,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mj_image_manifest_${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setCenterStatus(`이미지 manifest 저장 완료 (${items.length}개)`);
  }

  function clearImages() {
    if (state.imageCollection.size > 0) {
      const ok = confirm(`저장된 이미지 ${state.imageCollection.size}개를 모두 삭제할까요?`);
      if (!ok) return;
    }

    clearImageCollectionData(true);
    for (const item of state.queueItems) item.status = "pending";
    moveToNextPendingQueue();
    renderQueue();
    renderImageCollection();
    renderWorkList();
    renderSelectionSummary();
    setCenterStatus("저장 이미지 초기화 완료");
  }

  async function loadFromPath() {
    const path = (els.dbPath.value || "").trim();
    if (!path) {
      setLeftStatus("DB 경로를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadFromJsonText(await res.text());
    } catch (err) {
      setLeftStatus(`DB 로드 실패: ${err.message}`);
    }
  }

  async function handlePromptCatalogFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await loadPromptCatalogFromText(text, file.name || "catalog.json");
    } catch (err) {
      setCenterStatus(`프롬프트 catalog 로드 실패: ${err.message}`);
    } finally {
      e.target.value = "";
    }
  }

  async function loadFromJsonText(text) {
    const works = parseWorksFromJsonText(text);
    state.works = works;
    state.filteredWorks = [...works];
    state.selectedIds.clear();
    state.promptCatalogById = new Map();
    state.promptCatalogMeta = null;
    clearResults();
    clearQueue();
    clearImageCollectionData(true);
    renderImageCollection();
    renderWorkList();
    renderSelectionSummary();
    setLeftStatus(`${works.length}편 로드 완료`);
  }

  function onWorkListClick(e) {
    const checkbox = e.target.closest("[data-action='toggle']");
    if (checkbox) {
      const id = checkbox.dataset.titleId;
      if (!id) return;
      if (checkbox.checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      renderWorkList();
      renderSelectionSummary();
      if (checkbox.checked && els.autoApplyCatalogOnSelect?.checked && state.promptCatalogById.size > 0) {
        applyCatalogRowsByIds([id], true);
      }
      return;
    }

    const item = e.target.closest(".work-item[data-title-id]");
    if (!item) return;
    const id = item.dataset.titleId;
    if (!id) return;
    if (state.selectedIds.has(id)) state.selectedIds.delete(id);
    else state.selectedIds.add(id);
    renderWorkList();
    renderSelectionSummary();
    if (state.selectedIds.has(id) && els.autoApplyCatalogOnSelect?.checked && state.promptCatalogById.size > 0) {
      applyCatalogRowsByIds([id], true);
    }
  }

  function onResultListInput(e) {
    const ta = e.target.closest("textarea[data-role], select[data-role='aspect-ratio']");
    if (!ta) return;
    const card = e.target.closest(".result-card");
    const titleId = card?.dataset.titleId;
    if (!titleId) return;

    const data = readCardValues(card, titleId);
    writeResultStateFromCard(titleId, data);
  }

  async function onResultListClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === "queue-select") return;
    const titleId = btn.dataset.titleId;
    if (!titleId) return;

    const card = e.target.closest(".result-card");
    const data = readCardValues(card, titleId);
    const row = state.resultsById.get(titleId);
    const negative = normalizeNegativePrompt(row?.negativePrompt);

    if (action === "copy-prompt") {
      const finalEn = enforcePromptStyle(data.enText, negative, data.ratio);
      data.enTa.value = finalEn;
      writeResultStateFromCard(titleId, { ...data, enText: finalEn });
      const ok = await copyText(finalEn);
      setCenterStatus(ok ? `${titleId} 프롬프트 복사 완료` : `${titleId} 복사 실패`);
      return;
    }

    if (action === "open-mj") {
      const finalEn = enforcePromptStyle(data.enText, negative, data.ratio);
      data.enTa.value = finalEn;
      writeResultStateFromCard(titleId, { ...data, enText: finalEn });
      await openMidjourneyWithPrompt(finalEn);
      return;
    }

    if (action === "confirm-sync") {
      const synced = await confirmKoreanToEnglish(titleId, data);
      setCenterStatus(`${titleId} 한글 수정사항을 영문 프롬프트에 반영했습니다 (${data.ratio}).`);
      return synced;
    }

    if (action === "confirm-copy-open") {
      const synced = await confirmKoreanToEnglish(titleId, data);
      const copied = await copyText(synced);
      await openMidjourneyWithPrompt(synced);
      if (copied) {
        setCenterStatus(`${titleId} 확정 → 복사 → Midjourney 열기 완료`);
      }
    }
  }

  function onQueueListClick(e) {
    const item = e.target.closest("[data-action='queue-select']");
    if (!item) return;
    const titleId = item.dataset.titleId;
    if (!titleId) return;
    state.activeQueueTitleId = titleId;
    renderQueue();
    setCenterStatus(`활성 큐 선택: ${titleId}`);
  }

  function bindEvents() {
    if (els.btnToggleApiKey) {
      els.btnToggleApiKey.addEventListener("click", () => {
        els.apiKeyInput.type = els.apiKeyInput.type === "password" ? "text" : "password";
        updateApiKeyVisibilityLabel();
      });
    }

    if (els.rememberApiKey) {
      els.rememberApiKey.addEventListener("change", () => {
        if (els.rememberApiKey.checked) {
          setStoredApiKey((els.apiKeyInput.value || "").trim());
          setCenterStatus("API 키를 이 브라우저에 저장했습니다.");
        } else {
          setStoredApiKey("");
          setCenterStatus("저장된 API 키를 해제했습니다.");
        }
      });
    }

    if (els.apiKeyInput) {
      els.apiKeyInput.addEventListener("input", () => {
        if (els.rememberApiKey?.checked) {
          setStoredApiKey((els.apiKeyInput.value || "").trim());
        }
      });
    }

    if (els.btnForgetApiKey) {
      els.btnForgetApiKey.addEventListener("click", () => {
        setStoredApiKey("");
        if (els.rememberApiKey) els.rememberApiKey.checked = false;
        els.apiKeyInput.value = "";
        els.apiKeyInput.type = "password";
        updateApiKeyVisibilityLabel();
        setCenterStatus("브라우저에 저장된 API 키를 삭제했습니다.");
      });
    }

    els.btnLoadPath.addEventListener("click", loadFromPath);
    els.dbFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await loadFromJsonText(await file.text());
      } catch (err) {
        setLeftStatus(`파일 로드 실패: ${err.message}`);
      } finally {
        e.target.value = "";
      }
    });

    els.btnApplyFilter.addEventListener("click", applyFilters);
    els.btnResetFilter.addEventListener("click", () => {
      els.queryInput.value = "";
      els.poetInput.value = "";
      state.filteredWorks = [...state.works];
      renderWorkList();
      renderSelectionSummary();
      setLeftStatus("필터 초기화");
    });

    els.queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });
    els.poetInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });

    els.btnSelectFiltered.addEventListener("click", selectFilteredWorks);
    els.btnClearSelection.addEventListener("click", clearSelection);
    els.workList.addEventListener("click", onWorkListClick);

    els.btnGenerate.addEventListener("click", () => generatePrompts(null));
    els.btnGenerateSelectedTop5.addEventListener("click", () => generatePrompts(5));
    if (els.promptCatalogFileInput) {
      els.promptCatalogFileInput.addEventListener("change", handlePromptCatalogFileInput);
    }
    if (els.btnApplyCatalogSelection) {
      els.btnApplyCatalogSelection.addEventListener("click", () => applyCatalogToSelection(false));
    }
    els.resultList.addEventListener("input", onResultListInput);
    els.resultList.addEventListener("change", onResultListInput);
    els.resultList.addEventListener("click", onResultListClick);

    els.btnCopyAllPrompts.addEventListener("click", copyAllPrompts);
    els.btnExportJson.addEventListener("click", exportResultsJson);
    els.btnClearResults.addEventListener("click", clearResults);

    els.btnBuildQueueFromSelection.addEventListener("click", buildQueueFromSelection);
    els.btnClearQueue.addEventListener("click", clearQueue);
    els.queueFileInput.addEventListener("change", handleQueueFileInput);
    if (els.existingImagesDirInput) {
      els.existingImagesDirInput.addEventListener("change", handleExistingImagesDirInput);
    }
    els.queueList.addEventListener("click", onQueueListClick);
    els.btnDownloadImageZip.addEventListener("click", downloadImageZip);
    els.btnExportImageManifest.addEventListener("click", exportImageManifest);
    els.btnClearImages.addEventListener("click", clearImages);

    const persistTargets = [
      els.dbPath,
      els.queryInput,
      els.poetInput,
      els.modelInput,
      els.temperatureInput,
      els.globalAspectRatio,
      els.dryRunToggle,
      els.openMidjourneyAfterGenerate,
      els.autoApplyCatalogOnSelect,
    ];
    for (const node of persistTargets) {
      if (!node) continue;
      node.addEventListener("input", schedulePersistSessionState);
      node.addEventListener("change", schedulePersistSessionState);
    }

    document.addEventListener("paste", handlePaste);
  }

  function init() {
    initApiKeyUi();
    bindEvents();
    const restored = restoreSessionState();
    if (!restored) {
      renderSelectionSummary();
      renderResults();
      renderQueue();
      renderImageCollection();
      setLeftStatus("준비 완료 — 작품 DB를 로드하세요.");
      setCenterStatus("아직 생성 전");
    }
    schedulePersistSessionState();
  }

  window.addEventListener("pagehide", () => {
    persistSessionStateNow();
  });

  init();
})();
