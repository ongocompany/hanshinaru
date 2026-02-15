/* ============================================
   출생지 편집 모듈 (3단계)
   - Leaflet 미니맵 + 마커
   - Nominatim Geocoding (장소 검색)
   - 출생지 추가/삭제
   ============================================ */

let _bpMap = null;       // Leaflet 맵 인스턴스
let _bpMarker = null;    // 마커
let _geoTimer = null;    // 검색 디바운스

// ─── 초기화 ─────────────────────────────────
function initBirthplaceEditor() {
  document.getElementById("btn-add-birthplace").addEventListener("click", addBirthplace);
  document.getElementById("btn-del-birthplace").addEventListener("click", deleteBirthplace);

  // 좌표 직접 입력 시 마커 이동
  document.getElementById("f-bp-lat").addEventListener("input", onCoordsInput);
  document.getElementById("f-bp-lng").addEventListener("input", onCoordsInput);

  // 이름 필드 변경
  document.getElementById("f-bp-name").addEventListener("input", onBpFieldChange);
  document.getElementById("f-bp-nameZh").addEventListener("input", onBpFieldChange);

  // 장소 검색 (Enter 또는 디바운스)
  const searchInput = document.getElementById("f-bp-search");
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchPlace(searchInput.value.trim());
    }
  });
  searchInput.addEventListener("input", () => {
    clearTimeout(_geoTimer);
    const q = searchInput.value.trim();
    if (q.length >= 2) {
      _geoTimer = setTimeout(() => searchPlace(q), 600);
    } else {
      document.getElementById("geo-results").hidden = true;
    }
  });

  // 결과 영역 밖 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".geo-search-wrap")) {
      document.getElementById("geo-results").hidden = true;
    }
  });
}

// ─── 시인 선택 시 출생지 로드 ───────────────
function loadBirthplace(authorId) {
  const author = DATA.author.authors[authorId];
  if (!author) return;

  const bp = author.birthplace;
  const hasData = bp && (bp.lat || bp.lng || bp.name || bp.nameZh);

  document.getElementById("birthplace-empty").hidden = !!hasData;
  document.getElementById("birthplace-form").hidden = !hasData;

  if (hasData) {
    document.getElementById("f-bp-name").value = bp.name || "";
    document.getElementById("f-bp-nameZh").value = bp.nameZh || "";
    document.getElementById("f-bp-lat").value = bp.lat ?? "";
    document.getElementById("f-bp-lng").value = bp.lng ?? "";
    document.getElementById("f-bp-search").value = "";

    // 맵 갱신 (약간 딜레이 — DOM이 보여야 맵이 제대로 렌더됨)
    setTimeout(() => updateMap(bp.lat, bp.lng), 100);
  }
}

// ─── 맵 초기화/갱신 ─────────────────────────
function updateMap(lat, lng) {
  const container = document.getElementById("bp-map");
  if (!container || container.offsetParent === null) return; // hidden이면 스킵

  const hasCoords = lat && lng && !isNaN(lat) && !isNaN(lng);
  const center = hasCoords ? [lat, lng] : [34, 108]; // 기본: 중국 중부
  const zoom = hasCoords ? 7 : 4;

  if (!_bpMap) {
    _bpMap = L.map("bp-map", { scrollWheelZoom: true }).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap",
    }).addTo(_bpMap);

    // 맵 클릭 → 좌표 입력
    _bpMap.on("click", (e) => {
      const { lat: cLat, lng: cLng } = e.latlng;
      document.getElementById("f-bp-lat").value = Math.round(cLat * 100) / 100;
      document.getElementById("f-bp-lng").value = Math.round(cLng * 100) / 100;
      setMarker(cLat, cLng);
      saveBpToData();
    });
  } else {
    _bpMap.setView(center, zoom);
    _bpMap.invalidateSize();
  }

  if (hasCoords) {
    setMarker(lat, lng);
  } else if (_bpMarker) {
    _bpMap.removeLayer(_bpMarker);
    _bpMarker = null;
  }
}

function setMarker(lat, lng) {
  if (_bpMarker) {
    _bpMarker.setLatLng([lat, lng]);
  } else {
    _bpMarker = L.marker([lat, lng]).addTo(_bpMap);
  }
  _bpMap.setView([lat, lng], Math.max(_bpMap.getZoom(), 6));
}

// ─── 좌표 직접 입력 ─────────────────────────
function onCoordsInput() {
  const lat = parseFloat(document.getElementById("f-bp-lat").value);
  const lng = parseFloat(document.getElementById("f-bp-lng").value);
  if (!isNaN(lat) && !isNaN(lng)) {
    setMarker(lat, lng);
  }
  saveBpToData();
}

// ─── 이름 필드 변경 ─────────────────────────
function onBpFieldChange() {
  saveBpToData();
}

// ─── DATA에 출생지 저장 ─────────────────────
function saveBpToData() {
  const id = AuthorManager.selectedId;
  if (!id) return;
  const author = DATA.author.authors[id];
  if (!author) return;

  const latVal = document.getElementById("f-bp-lat").value;
  const lngVal = document.getElementById("f-bp-lng").value;

  author.birthplace = {
    name: document.getElementById("f-bp-name").value,
    nameZh: document.getElementById("f-bp-nameZh").value,
    lat: latVal === "" ? null : parseFloat(latVal),
    lng: lngVal === "" ? null : parseFloat(lngVal),
  };

  renderAuthorList();
  checkChanges();
  updateFieldHighlights(id);
}

// ─── 출생지 추가 ────────────────────────────
function addBirthplace() {
  const id = AuthorManager.selectedId;
  if (!id) return;

  DATA.author.authors[id].birthplace = {
    name: "", nameZh: "", lat: null, lng: null,
  };

  document.getElementById("birthplace-empty").hidden = true;
  document.getElementById("birthplace-form").hidden = false;
  document.getElementById("f-bp-name").value = "";
  document.getElementById("f-bp-nameZh").value = "";
  document.getElementById("f-bp-lat").value = "";
  document.getElementById("f-bp-lng").value = "";
  document.getElementById("f-bp-search").value = "";

  setTimeout(() => updateMap(null, null), 100);
  renderAuthorList();
  checkChanges();
}

// ─── 출생지 삭제 ────────────────────────────
function deleteBirthplace() {
  if (!confirm("출생지 정보를 삭제하시겠습니까?")) return;

  const id = AuthorManager.selectedId;
  if (!id) return;

  delete DATA.author.authors[id].birthplace;

  document.getElementById("birthplace-empty").hidden = false;
  document.getElementById("birthplace-form").hidden = true;

  // 맵 정리
  if (_bpMarker && _bpMap) {
    _bpMap.removeLayer(_bpMarker);
    _bpMarker = null;
  }

  renderAuthorList();
  checkChanges();
  showToast("출생지 삭제됨");
}

// ─── Nominatim Geocoding (장소 검색) ────────
async function searchPlace(query) {
  if (!query || query.length < 2) return;

  const resultsEl = document.getElementById("geo-results");
  resultsEl.hidden = false;
  resultsEl.innerHTML = '<div class="geo-searching">검색 중...</div>';

  try {
    const url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
      q: query,
      format: "json",
      limit: "5",
      addressdetails: "1",
      "accept-language": "ko,zh,en",
    });

    const res = await fetch(url, {
      headers: { "User-Agent": "tangshi-admin-tool" },
    });
    const data = await res.json();

    if (data.length === 0) {
      resultsEl.innerHTML = '<div class="geo-searching">결과 없음</div>';
      return;
    }

    resultsEl.innerHTML = data.map((item, i) => `
      <div class="geo-result-item" data-idx="${i}"
           data-lat="${item.lat}" data-lng="${item.lon}">
        ${escapeHTMLAdmin(item.display_name)}
      </div>
    `).join("");

    // 결과 클릭
    resultsEl.querySelectorAll(".geo-result-item").forEach(el => {
      el.addEventListener("click", () => {
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);
        document.getElementById("f-bp-lat").value = Math.round(lat * 100) / 100;
        document.getElementById("f-bp-lng").value = Math.round(lng * 100) / 100;
        setMarker(lat, lng);
        saveBpToData();
        resultsEl.hidden = true;
      });
    });
  } catch (err) {
    resultsEl.innerHTML = '<div class="geo-searching">검색 실패: ' + err.message + '</div>';
  }
}
