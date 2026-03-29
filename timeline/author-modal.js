// timeline/author-modal.js
// 시인 모달 (약력, Leaflet 지도, vis-network 관계도), 클릭 → 모달 열기
// ------------------------------------------------------------

// ===== 출생지 지도 (Leaflet) =====
function initBirthplaceMap(container, birthplace) {
  if (!birthplace || birthplace.lat == null || birthplace.lng == null) {
    container.innerHTML = '<div class="muted" style="padding:10px">출생지 정보 없음</div>';
    return;
  }
  if (typeof L === "undefined") {
    container.innerHTML = '<div class="muted" style="padding:10px">Leaflet 로드 실패</div>';
    return;
  }

  const map = L.map(container, { scrollWheelZoom: false }).setView(
    [birthplace.lat, birthplace.lng],
    6
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 18,
  }).addTo(map);

  L.marker([birthplace.lat, birthplace.lng])
    .addTo(map)
    .bindPopup(`<b>${birthplace.nameZh || ""}</b><br>${birthplace.name || ""}`)
    .openPopup();

  setTimeout(() => map.invalidateSize(), 300);
}

// ===== 관계도 (vis-network) =====
function initRelationGraph(container, authorId) {
  const a = STATE.authorById.get(authorId);
  if (!a) return;

  const edgesRaw = [];
  const nodeIds = new Set([authorId]);

  if (a.relations) {
    a.relations.forEach(r => {
      edgesRaw.push({
        from: authorId,
        to: r.targetId,
        label: r.label,
        desc: r.desc,
        type: r.type,
        targetName: r.targetName,
        targetNameKo: r.targetNameKo
      });
      nodeIds.add(r.targetId);
    });
  }

  for (const [id, other] of STATE.authorById) {
    if (id === authorId || !other.relations) continue;
    other.relations.forEach(r => {
      if (r.targetId === authorId) {
        edgesRaw.push({ from: id, to: authorId, label: r.label, desc: r.desc, type: r.type });
        nodeIds.add(id);
      }
    });
  }

  if (!edgesRaw.length) {
    container.innerHTML = '<div class="muted" style="padding:10px">관계 정보 없음</div>';
    return;
  }
  if (typeof vis === "undefined") {
    container.innerHTML = '<div class="muted" style="padding:10px">vis-network 로드 실패</div>';
    return;
  }

  const nodes = [];
  for (const nid of nodeIds) {
    const p = STATE.authorById.get(nid);
    const extRel = edgesRaw.find(e => e.to === nid || e.from === nid);
    const nameLabel = p ? (p.name?.ko || p.name?.zh || nid) : (extRel?.targetNameKo || extRel?.targetName || nid);
    nodes.push({
      id: nid,
      title: nameLabel,
      shape: "circularImage",
      image: getAuthorAvatar(nid),
      color: nid === authorId
        ? { background: "#8b0000", border: "#5a0000", highlight: { background: "#a00", border: "#5a0000" } }
        : p
          ? { background: "#4a90d9", border: "#2a6cb0", highlight: { background: "#5aa0e9", border: "#2a6cb0" } }
          : { background: "#8a8a8a", border: "#666", highlight: { background: "#999", border: "#666" } },
      size: nid === authorId ? 50 : 35,
      borderWidth: 3,
    });
  }

  const edges = edgesRaw.map((e, i) => ({
    id: i,
    from: e.from,
    to: e.to,
    label: e.label || "",
    arrows: e.type === "friend" ? "" : "to",
    color: { color: "#888", highlight: "#444" },
    font: { size: 11, color: "#555", strokeWidth: 2, strokeColor: "#fff" },
    title: e.desc || "",
    smooth: { type: "curvedCW", roundness: 0.2 },
  }));

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };
  const options = {
    nodes: { brokenImage: DUMMY_UI.defaultAvatar },
    interaction: { hover: true, zoomView: true, dragView: true },
    physics: {
      enabled: true,
      solver: "repulsion",
      repulsion: {
        nodeDistance: 100,
        springLength: 100,
        centralGravity: 0.8,
      },
      stabilization: {
        iterations: 200,
        fit: true,
      },
    },
    layout: { randomSeed: 42 },
  };

  const network = new vis.Network(container, data, options);

  network.on("click", params => {
    if (params.nodes.length === 1 && params.nodes[0] !== authorId && STATE.authorById.has(params.nodes[0])) {
      openAuthorModal(params.nodes[0]);
    }
  });
}

// ===== 시인 모달 =====
function openAuthorModal(authorId, ctx) {
  const a = STATE.authorById.get(authorId);
  if (!a) {
    console.warn("[openAuthorModal] missing authorId:", authorId);
    return;
  }

  const lifeStr = formatLife(a.life) || a.life?.raw || "";
  const nameKo = a.name?.ko || "";
  const nameZh = normalizeZhName(a.name?.zh || "");

  const tags = DUMMY_UI.authorTags.map(t => `<span class="tag">${t}</span>`).join("");

  const poems = STATE.poemsByAuthorId.get(authorId) || [];
  const poemsHTML = poems.map(renderPoemSection).join("");

  const bodyHTML = `
    <div class="author-modal">
      <section class="author-hero">
        <img class="author-photo" src="${getAuthorAvatar(authorId)}" alt="${escapeHTML(nameKo)}" ${AVATAR_ONERROR} />
        <div class="author-meta">
          <div class="author-name-line">
            <span class="name-ko">${escapeHTML(nameKo)}</span>
            <span class="name-zh">(${escapeHTML(nameZh)})</span>
          </div>
          <div class="author-life">${escapeHTML(lifeStr)}</div>
          <div class="author-tags">${tags}</div>
        </div>
      </section>

      <section class="author-grid2">
        <div class="panel">
          <div class="panel-title">출생지</div>
          <div class="panel-sub">${a.birthplace ? escapeHTML(a.birthplace.nameZh || "") : "출생지 정보 없음"}</div>
          <div class="panel-box map-container" id="modal-map"></div>
        </div>
        <div class="panel">
          <div class="panel-title">관계도</div>
          <div class="panel-sub">교유/제자/영향 관계</div>
          <div class="panel-box graph-container" id="modal-graph"></div>
        </div>
      </section>

      <section class="author-bio-full">
        <div class="block-title">설명</div>
        <div class="block-box">${escapeHTML(a.bioKo || "")}</div>
      </section>

      <section class="author-works-full">
        <div class="block-title">작품</div>
        <div class="poem-list">
          ${poemsHTML || `<div class="muted">작품 없음</div>`}
        </div>
      </section>
    </div>
  `;

  openModal({ title: "시인", bodyHTML });

  const modalBody = document.getElementById("modal-body");
  if (!modalBody.dataset.poemBound) {
    bindPoemSections(modalBody);
    bindAnnotationHovers(modalBody);
    bindNoteCrossLinks(modalBody);
    modalBody.dataset.poemBound = "1";
  }

  const mapEl = document.getElementById("modal-map");
  if (mapEl) initBirthplaceMap(mapEl, a.birthplace || null);

  const graphEl = document.getElementById("modal-graph");
  if (graphEl) initRelationGraph(graphEl, authorId);

  if (ctx?.openPoemId) {
    try {
      const sel = `.poem-sec[data-poem-sec="${CSS.escape(ctx.openPoemId)}"]`;
      const sec = modalBody.querySelector(sel);
      if (!sec) {
        console.warn("[auto-open] poem section not found:", ctx.openPoemId);
        return;
      }
      const head = sec.querySelector(".poem-head");
      if (head) head.click();
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      console.warn("[auto-open] failed:", err);
    }
  }
}

// ===== 클릭 → 모달 열기 =====
function bindModalOpeners(root) {
  root.addEventListener("click", (e) => {
    // (1) 작품 클릭
    const work = e.target.closest(".work-item[data-poem-id]");
    if (work) {
      const poemId = work.getAttribute("data-poem-id") || "";
      if (!poemId) return;

      const p = STATE.poemById.get(poemId);
      if (!p) {
        console.warn("[work click] poem not found:", poemId);
        return;
      }

      const poetKey = normalizePoetName(p?.poet?.zh || "");
      let authorId = STATE.authorIdByPoetZh.get(poetKey);

      if (!authorId && poetKey) {
        for (const [aid, a] of STATE.authorById.entries()) {
          const k = normalizePoetName(a?.name?.zh || "");
          if (k === poetKey) {
            authorId = aid;
            break;
          }
        }
      }

      if (!authorId) {
        console.warn("[work click] author match failed:", { poemId, poetKey, poetZh: p?.poet?.zh });
        return;
      }

      openAuthorModal(authorId, { openPoemId: poemId });
      e.stopPropagation();
      return;
    }

    // (2) 시인 이름 클릭
    const poetSpan = e.target.closest(".poet-name[data-author-id]");
    if (poetSpan) {
      const authorId = poetSpan.getAttribute("data-author-id");
      if (!authorId) return;
      openAuthorModal(authorId, {});
      return;
    }

    // (3) 시인 미니카드 클릭
    const poetCard = e.target.closest(".v3-poet-card[data-author-id]");
    if (poetCard) {
      const authorId = poetCard.getAttribute("data-author-id");
      if (!authorId) return;
      openAuthorModal(authorId, {});
      return;
    }
  });
}
