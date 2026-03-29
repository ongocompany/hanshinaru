// timeline/app.js
// 초기화 오케스트레이션
// ------------------------------------------------------------

async function main() {
  const root = document.getElementById("timeline");
  if (!root) throw new Error("Missing #timeline");

  // 데이터 로딩: Supabase 우선, 실패 시 JSON fallback
  let authorsDB, poemsFull, historyCards;
  try {
    const db = await loadFromSupabase();
    authorsDB = db.authorsDB;
    poemsFull = db.poemsFull;
    historyCards = db.historyCards;
    console.log("[main] Supabase DB에서 로드 완료");
  } catch (e) {
    console.warn("[main] Supabase 실패 → JSON fallback:", e.message);
    const poemsFullPromise = loadJSON("public/index/poems.v3.json")
      .catch(() => loadJSON("public/index/poems.compact.json"));
    [authorsDB, poemsFull, historyCards] = await Promise.all([
      loadJSON("public/index/db_author.with_ko.json"),
      poemsFullPromise,
      loadJSON("public/index/history_cards.json"),
    ]);
  }

  // UI 설정 로드
  try {
    const uiSettings = await loadJSON("public/index/ui_settings.json");
    applyUISettings(uiSettings);
  } catch (e) {
    console.warn("ui_settings.json 로드 실패, CSS 기본값 사용:", e);
  }

  const idx = buildAuthorPoemIndex(authorsDB, poemsFull);
  STATE.poemById = idx.poemById;
  STATE.authorById = idx.authorById;
  STATE.poemsByAuthorId = idx.poemsByAuthorId;
  STATE.authorIdByPoetZh = idx.authorIdByPoetZh;

  const hcArr = Array.isArray(historyCards) ? historyCards : (historyCards.items || []);
  STATE.historyById = new Map(hcArr.map(h => [h.titleId || h.id, h]));

  const authorEvents = buildAuthorEvents(authorsDB, poemsFull);

  const historyEvents = hcArr
    .filter(h => h && h.year != null)
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));

  // 시대별 그룹핑
  const authorsByEra = groupByEra(authorEvents);
  const historyByEra = groupHistoryByEra(historyEvents);

  // 隋 북엔드
  root.appendChild(renderBookend("隋"));

  // 4개 시대 섹션 렌더링
  const eras = ERA_CONFIG.filter(e => ["early", "high", "mid", "late"].includes(e.key));
  for (const eraConf of eras) {
    const poets = authorsByEra.get(eraConf.key) || [];
    const hGroup = historyByEra.get(eraConf.key) || { main: [], minor: [] };

    const eraDetail = ERA_DETAILS[eraConf.key];
    if (eraDetail) {
      const allEvents = [...hGroup.main, ...hGroup.minor]
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      const featuredEvent = allEvents.find(h => h.titleId === eraDetail.featuredEventId);
      const dotEvents = allEvents.filter(h => h.titleId !== eraDetail.featuredEventId);

      const poetCards = renderPoetMiniCards(poets);
      const featuredNode = renderFeaturedEvent(featuredEvent || null, eraConf, eraDetail);

      root.appendChild(renderEraSection_v3(eraConf, eraDetail, poetCards, featuredNode, dotEvents));
      continue;
    }

    const poetNamesNode = renderPoetNames(poets);
    const mainCards = hGroup.main.map(renderMainHistoryCard);
    const minorDots = hGroup.minor.map(renderMinorHistoryDot);

    root.appendChild(renderEraSection(eraConf, poetNamesNode, mainCards, minorDots));
  }

  // 五代十國 북엔드
  root.appendChild(renderBookend("五代十國"));

  // 이벤트 바인딩
  bindAccordions(root);
  bindModalUI();
  bindModalOpeners(root);
  bindHoverPopups(root);
  bindFeaturedToggle(root);
}

main().catch(err => {
  console.error(err);
  const el = document.getElementById("timeline");
  if (el) el.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">데이터를 불러오지 못했습니다. 새로고침 해주세요.</p>';
});
