/* ============================================
   데이터 검증 모듈 (4단계)
   - 16개 검증 규칙 (E5 + W7 + I4)
   - 검증 결과 렌더링
   - 오류 → 편집 바로가기
   - W03 단방향 관계 자동 수정
   ============================================ */

// ─── 초기화 ─────────────────────────────────
function initValidator() {
  document.getElementById("btn-run-validate").addEventListener("click", runValidation);

  // 모달 열기/닫기
  const overlay = document.getElementById("validator-overlay");
  const btnOpen = document.getElementById("btn-open-validator");
  const btnClose = document.getElementById("btn-validator-close");

  if (btnOpen) btnOpen.addEventListener("click", () => {
    overlay.hidden = false;
  });
  if (btnClose) btnClose.addEventListener("click", () => {
    overlay.hidden = true;
  });
  // 배경 클릭으로 닫기
  if (overlay) overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
}

// admin.js loadAllData 완료 후 호출
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (typeof initValidator === "function") initValidator();
  }, 0);
});

// ─── 검증 실행 ──────────────────────────────
function runValidation() {
  if (!DATA.author || !DATA.poem) {
    showToast("데이터가 아직 로드되지 않았습니다");
    return;
  }

  const results = {
    errors: [],
    warnings: [],
    infos: [],
  };

  const authors = DATA.author.authors || {};
  const poems = Array.isArray(DATA.poem) ? DATA.poem : [];
  const history = Array.isArray(DATA.history) ? DATA.history : [];

  // ── ERROR 규칙 ──────────────────────────

  // E01: titleId 중복
  checkE01(authors, results);
  // E02: 필수 필드 누락
  checkE02(authors, results);
  // E03: 시↔시인 매핑 실패
  checkE03(authors, poems, results);
  // E04: EXT_ 관계에 이름 누락
  checkE04(authors, results);
  // E05: 출생 > 사망
  checkE05(authors, results);

  // ── WARNING 규칙 ────────────────────────

  // W01: 출생지 누락
  checkW01(authors, results);
  // W02: 관계 빈 배열
  checkW02(authors, results);
  // W03: 관계 단방향
  checkW03(authors, results);
  // W04: era와 birth year 불일치
  checkW04(authors, results);
  // W05: 주석 번호 불일치
  checkW05(poems, results);
  // W06: 좌표 범위 이상
  checkW06(authors, results);
  // W07: bioKo 빈 값
  checkW07(authors, results);

  // ── INFO 규칙 ───────────────────────────

  checkInfos(authors, poems, history, results);

  // 결과 렌더링
  renderValidationResults(results);
}

// ═══════════════════════════════════════════
//  ERROR 검증 규칙
// ═══════════════════════════════════════════

function checkE01(authors, results) {
  // titleId는 객체 키이므로 원래 중복 불가
  // 하지만 name.zh 중복은 체크할 가치가 있음
  const nameMap = {};
  Object.entries(authors).forEach(([id, a]) => {
    const zh = a.name?.zh || "";
    if (zh && nameMap[zh]) {
      nameMap[zh].push(id);
    } else if (zh) {
      nameMap[zh] = [id];
    }
  });

  const dupes = Object.entries(nameMap).filter(([, ids]) => ids.length > 1);
  if (dupes.length > 0) {
    results.errors.push({
      code: "E01",
      title: "한자 이름 중복",
      items: dupes.map(([name, ids]) => ({
        text: `"${name}" — ${ids.join(", ")}`,
        authorIds: ids,
      })),
    });
  } else {
    results.infos.push({ code: "E01", title: "한자 이름 중복", passed: true });
  }
}

function checkE02(authors, results) {
  const missing = [];
  Object.entries(authors).forEach(([id, a]) => {
    const lacks = [];
    if (!a.name?.zh) lacks.push("name.zh");
    if (!a.name?.ko) lacks.push("name.ko");
    if (!a.era?.period) lacks.push("era.period");
    if (lacks.length > 0) {
      missing.push({
        text: `${id} ${a.name?.ko || a.name?.zh || "?"} — 누락: ${lacks.join(", ")}`,
        authorId: id,
      });
    }
  });

  if (missing.length > 0) {
    results.errors.push({ code: "E02", title: "필수 필드 누락", items: missing });
  } else {
    results.infos.push({ code: "E02", title: "필수 필드 누락", passed: true });
  }
}

function checkE03(authors, poems, results) {
  // 시인 이름 → ID 맵
  const nameToId = {};
  Object.entries(authors).forEach(([id, a]) => {
    const zh = a.name?.zh;
    if (zh) nameToId[zh] = id;
  });
  const authorNames = Object.keys(nameToId);

  const unmapped = [];
  poems.forEach((poem, i) => {
    const poetZh = normalizePoetNameAdmin(poem.poet?.zh);
    if (!poetZh) {
      unmapped.push({ text: `시 #${i + 1} — poet.zh 비어있음`, poemIdx: i });
      return;
    }
    if (!nameToId[poetZh]) {
      // 가장 비슷한 시인 찾기 (글자 포함 관계)
      const similar = findSimilarAuthor(poetZh, authorNames);
      let text = `시 #${i + 1} "${poem.title?.zh || "?"}" — 시인 "${poetZh}" 매핑 실패`;
      const item = { text, poemIdx: i };

      if (similar) {
        item.text += ` (유사: ${similar})`;
        item.authorId = nameToId[similar]; // 유사 시인으로 바로가기
      }
      unmapped.push(item);
    }
  });

  if (unmapped.length > 0) {
    results.errors.push({ code: "E03", title: "시↔시인 매핑 실패", items: unmapped });
  } else {
    results.infos.push({ code: "E03", title: "시↔시인 매핑 실패", passed: true });
  }
}

// 글자 겹침으로 유사 시인 찾기
function findSimilarAuthor(poetName, authorNames) {
  let bestMatch = null;
  let bestScore = 0;

  for (const name of authorNames) {
    // 한쪽이 다른 쪽을 포함하면 최우선
    if (name.includes(poetName) || poetName.includes(name)) return name;

    // 공통 글자 수 비교
    let common = 0;
    for (const ch of poetName) {
      if (name.includes(ch)) common++;
    }
    const score = common / Math.max(poetName.length, name.length);
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = name;
    }
  }
  return bestMatch;
}

function checkE04(authors, results) {
  const missing = [];
  Object.entries(authors).forEach(([id, a]) => {
    (a.relations || []).forEach((rel, ri) => {
      if ((rel.targetId || "").startsWith("EXT_")) {
        if (!rel.targetName && !rel.targetNameKo) {
          missing.push({
            text: `${id} ${a.name?.ko || "?"} — 관계[${ri}] ${rel.targetId}: 이름 없음`,
            authorId: id,
          });
        }
      }
    });
  });

  if (missing.length > 0) {
    results.errors.push({ code: "E04", title: "외부 인물 이름 누락", items: missing });
  } else {
    results.infos.push({ code: "E04", title: "외부 인물 이름 누락", passed: true });
  }
}

function checkE05(authors, results) {
  const bad = [];
  Object.entries(authors).forEach(([id, a]) => {
    const birth = a.life?.birth;
    const death = a.life?.death;
    if (birth && death && birth > death) {
      bad.push({
        text: `${id} ${a.name?.ko || "?"} — 출생 ${birth} > 사망 ${death}`,
        authorId: id,
      });
    }
  });

  if (bad.length > 0) {
    results.errors.push({ code: "E05", title: "출생이 사망보다 나중", items: bad });
  } else {
    results.infos.push({ code: "E05", title: "출생이 사망보다 나중", passed: true });
  }
}

// ═══════════════════════════════════════════
//  WARNING 검증 규칙
// ═══════════════════════════════════════════

function checkW01(authors, results) {
  const missing = [];
  Object.entries(authors).forEach(([id, a]) => {
    if (!a.birthplace || (!a.birthplace.lat && !a.birthplace.lng && !a.birthplace.name)) {
      missing.push({ text: `${id} ${a.name?.ko || a.name?.zh || "?"}`, authorId: id });
    }
  });

  results.warnings.push({
    code: "W01",
    title: `출생지 누락 (${missing.length}건)`,
    items: missing,
    collapsible: true,
  });
}

function checkW02(authors, results) {
  const missing = [];
  Object.entries(authors).forEach(([id, a]) => {
    if (!a.relations || a.relations.length === 0) {
      missing.push({ text: `${id} ${a.name?.ko || a.name?.zh || "?"}`, authorId: id });
    }
  });

  results.warnings.push({
    code: "W02",
    title: `교유관계 없음 (${missing.length}건)`,
    items: missing,
    collapsible: true,
  });
}

function checkW03(authors, results) {
  const BIDIR = ["friend", "rival", "colleague"];
  const oneway = [];

  Object.entries(authors).forEach(([id, a]) => {
    (a.relations || []).forEach(rel => {
      if (!BIDIR.includes(rel.type)) return;
      if ((rel.targetId || "").startsWith("EXT_")) return;

      const target = authors[rel.targetId];
      if (!target) return;

      const hasReverse = (target.relations || []).some(r => r.targetId === id);
      if (!hasReverse) {
        // 중복 방지 (A→B, B→A 둘 다 나오지 않게)
        const key = [id, rel.targetId].sort().join("-");
        if (!oneway.some(o => o._key === key)) {
          const fromName = a.name?.ko || a.name?.zh || id;
          const toName = target.name?.ko || target.name?.zh || rel.targetId;
          const typeLabel = rel.type === "friend" ? "친구" : rel.type === "rival" ? "라이벌" : "동료";
          oneway.push({
            _key: key,
            text: `${fromName} → ${toName} (${typeLabel}) 역방향 없음`,
            fromId: id,
            toId: rel.targetId,
            type: rel.type,
          });
        }
      }
    });
  });

  if (oneway.length > 0) {
    results.warnings.push({
      code: "W03",
      title: `관계 단방향 (${oneway.length}건)`,
      items: oneway,
      autoFixable: true,
    });
  }
}

function checkW04(authors, results) {
  const ERA_RANGES = {
    early: [618, 712],
    high: [701, 770],
    mid: [766, 835],
    late: [803, 907],
  };

  const mismatches = [];
  Object.entries(authors).forEach(([id, a]) => {
    const era = a.era?.period;
    const birth = a.life?.birth;
    if (!era || !birth || !ERA_RANGES[era]) return;

    const [min, max] = ERA_RANGES[era];
    // 여유 20년
    if (birth < min - 20 || birth > max + 20) {
      mismatches.push({
        text: `${id} ${a.name?.ko || "?"} — ${era}인데 출생 ${birth}`,
        authorId: id,
      });
    }
  });

  if (mismatches.length > 0) {
    results.warnings.push({
      code: "W04",
      title: `시대-출생년 불일치 (${mismatches.length}건)`,
      items: mismatches,
    });
  }
}

function checkW05(poems, results) {
  const issues = [];
  poems.forEach((poem, i) => {
    const bodyText = (poem.body?.zh || "") + (poem.body?.ko || "");
    // 본문에서 [N] 주석 번호 추출
    const bodyNotes = [...bodyText.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1], 10));
    if (bodyNotes.length === 0) return;

    const noteNos = (poem.notes || []).map(n => n.no);
    const missingInNotes = bodyNotes.filter(n => !noteNos.includes(n));
    const missingInBody = noteNos.filter(n => !bodyNotes.includes(n));

    if (missingInNotes.length > 0 || missingInBody.length > 0) {
      let detail = `시 #${i + 1} "${poem.title?.zh || "?"}"`;
      if (missingInNotes.length > 0) detail += ` — 본문[${missingInNotes.join(",")}] notes에 없음`;
      if (missingInBody.length > 0) detail += ` — notes[${missingInBody.join(",")}] 본문에 없음`;
      issues.push({ text: detail, poemIdx: i });
    }
  });

  if (issues.length > 0) {
    results.warnings.push({
      code: "W05",
      title: `주석 번호 불일치 (${issues.length}건)`,
      items: issues,
    });
  }
}

function checkW06(authors, results) {
  const bad = [];
  Object.entries(authors).forEach(([id, a]) => {
    const bp = a.birthplace;
    if (!bp || bp.lat == null || bp.lng == null) return;

    // 중국 범위: lat 18~54, lng 73~135
    if (bp.lat < 18 || bp.lat > 54 || bp.lng < 73 || bp.lng > 135) {
      bad.push({
        text: `${id} ${a.name?.ko || "?"} — (${bp.lat}, ${bp.lng}) 중국 범위 밖`,
        authorId: id,
      });
    }
  });

  if (bad.length > 0) {
    results.warnings.push({
      code: "W06",
      title: `좌표 범위 이상 (${bad.length}건)`,
      items: bad,
    });
  }
}

function checkW07(authors, results) {
  const missing = [];
  Object.entries(authors).forEach(([id, a]) => {
    if (!a.bioKo || a.bioKo.trim() === "") {
      missing.push({ text: `${id} ${a.name?.ko || a.name?.zh || "?"}`, authorId: id });
    }
  });

  results.warnings.push({
    code: "W07",
    title: `약전(bioKo) 없음 (${missing.length}건)`,
    items: missing,
    collapsible: true,
  });
}

// ═══════════════════════════════════════════
//  INFO 통계
// ═══════════════════════════════════════════

function checkInfos(authors, poems, history, results) {
  const authorList = Object.entries(authors);
  const authorCount = authorList.length;

  // I01: 전체 통계
  results.infos.push({
    code: "I01",
    title: "전체 통계",
    text: `시인 ${authorCount}명 / 시 ${poems.length}편 / 역사 ${history.length}건`,
  });

  // I02: 출생지 입력률
  const bpCount = authorList.filter(([, a]) =>
    a.birthplace && (a.birthplace.lat || a.birthplace.name)
  ).length;
  results.infos.push({
    code: "I02",
    title: "출생지 입력률",
    text: `${bpCount}/${authorCount} (${authorCount ? Math.round(bpCount / authorCount * 100) : 0}%)`,
  });

  // I03: 관계 입력률
  const relCount = authorList.filter(([, a]) =>
    a.relations && a.relations.length > 0
  ).length;
  results.infos.push({
    code: "I03",
    title: "관계 입력률",
    text: `${relCount}/${authorCount} (${authorCount ? Math.round(relCount / authorCount * 100) : 0}%)`,
  });

  // I04: 시대별 분포
  const eraDist = { early: 0, high: 0, mid: 0, late: 0, none: 0 };
  authorList.forEach(([, a]) => {
    const era = a.era?.period;
    if (era && eraDist[era] !== undefined) eraDist[era]++;
    else eraDist.none++;
  });
  results.infos.push({
    code: "I04",
    title: "시대별 분포",
    text: `초당 ${eraDist.early} / 성당 ${eraDist.high} / 중당 ${eraDist.mid} / 만당 ${eraDist.late}` +
          (eraDist.none > 0 ? ` / 미지정 ${eraDist.none}` : ""),
  });
}

// ═══════════════════════════════════════════
//  결과 렌더링
// ═══════════════════════════════════════════

function renderValidationResults(results) {
  document.getElementById("validator-empty").hidden = true;
  document.getElementById("validator-results").hidden = false;

  const errorCount = results.errors.reduce((s, e) => s + (e.items?.length || 0), 0);
  const warnCount = results.warnings.reduce((s, w) => s + (w.items?.length || 0), 0);
  const passedCount = results.infos.filter(i => i.passed).length;
  const infoCount = results.infos.filter(i => !i.passed).length;

  // 요약
  document.getElementById("v-summary").innerHTML = `
    <div class="v-summary-grid">
      <div class="v-stat v-stat-error">
        <span class="v-stat-icon">&#10060;</span>
        <span class="v-stat-label">ERROR</span>
        <span class="v-stat-num">${errorCount}건</span>
      </div>
      <div class="v-stat v-stat-warn">
        <span class="v-stat-icon">&#9888;&#65039;</span>
        <span class="v-stat-label">WARNING</span>
        <span class="v-stat-num">${warnCount}건</span>
      </div>
      <div class="v-stat v-stat-info">
        <span class="v-stat-icon">&#8505;&#65039;</span>
        <span class="v-stat-label">INFO</span>
        <span class="v-stat-num">${infoCount}건</span>
      </div>
      <div class="v-stat v-stat-pass">
        <span class="v-stat-icon">&#9989;</span>
        <span class="v-stat-label">PASS</span>
        <span class="v-stat-num">${passedCount}건</span>
      </div>
    </div>
  `;

  // ERROR 섹션
  const errorsDiv = document.getElementById("v-errors");
  if (results.errors.length > 0) {
    errorsDiv.innerHTML = `<h3 class="v-section-title v-section-error">ERROR</h3>` +
      results.errors.map(e => renderRuleBlock(e, "error")).join("");
  } else {
    errorsDiv.innerHTML = "";
  }

  // WARNING 섹션
  const warnsDiv = document.getElementById("v-warnings");
  const activeWarns = results.warnings.filter(w => w.items && w.items.length > 0);
  if (activeWarns.length > 0) {
    warnsDiv.innerHTML = `<h3 class="v-section-title v-section-warn">WARNING</h3>` +
      activeWarns.map(w => renderRuleBlock(w, "warn")).join("");
  } else {
    warnsDiv.innerHTML = "";
  }

  // INFO 섹션
  const infosDiv = document.getElementById("v-infos");
  infosDiv.innerHTML = `<h3 class="v-section-title v-section-info">INFO / PASS</h3>` +
    results.infos.map(info => {
      if (info.passed) {
        return `<div class="v-rule-block v-block-pass">
          <span class="v-rule-code">${info.code}</span>
          <span class="v-rule-title">${info.title}</span>
          <span class="v-pass-badge">PASS</span>
        </div>`;
      }
      return `<div class="v-rule-block v-block-info">
        <span class="v-rule-code">${info.code}</span>
        <span class="v-rule-title">${info.title}</span>
        <span class="v-info-text">${info.text}</span>
      </div>`;
    }).join("");

  // 이벤트 위임: 바로가기 + 자동 수정 + 접기/펼치기
  bindValidatorEvents();
}

function renderRuleBlock(rule, level) {
  const maxShow = rule.collapsible ? 5 : 20;
  const items = rule.items || [];
  const showItems = items.slice(0, maxShow);
  const hasMore = items.length > maxShow;

  let itemsHtml = showItems.map(item => {
    let links = "";
    if (item.authorId) {
      links = ` <a href="#" class="v-goto-author" data-id="${item.authorId}">편집으로 이동</a>`;
    }
    return `<div class="v-item">${escapeHTMLAdmin(item.text)}${links}</div>`;
  }).join("");

  if (hasMore) {
    itemsHtml += `<div class="v-item v-item-more" data-code="${rule.code}">
      ... 외 ${items.length - maxShow}건 더 <a href="#" class="v-show-all">전체 보기</a>
    </div>`;
  }

  // W03 자동 수정 버튼
  let autoFixBtn = "";
  if (rule.autoFixable) {
    autoFixBtn = `<button class="btn btn-secondary v-autofix" data-code="${rule.code}" style="margin-left:auto; font-size:12px; padding:3px 10px">자동 수정</button>`;
  }

  return `<div class="v-rule-block v-block-${level}" data-code="${rule.code}">
    <div class="v-rule-header">
      <span class="v-rule-code">${rule.code}</span>
      <span class="v-rule-title">${rule.title}</span>
      ${autoFixBtn}
    </div>
    <div class="v-rule-items" id="v-items-${rule.code}">${itemsHtml}</div>
  </div>`;
}

// ─── 이벤트 바인딩 ──────────────────────────

function bindValidatorEvents() {
  const container = document.getElementById("validator-results");

  // 기존 리스너 제거를 위해 클론 교체
  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);

  newContainer.addEventListener("click", (e) => {
    // 시인 편집 바로가기
    const gotoLink = e.target.closest(".v-goto-author");
    if (gotoLink) {
      e.preventDefault();
      const authorId = gotoLink.dataset.id;
      navigateToAuthor(authorId);
      return;
    }

    // 전체 보기
    const showAll = e.target.closest(".v-show-all");
    if (showAll) {
      e.preventDefault();
      const moreDiv = showAll.closest(".v-item-more");
      const code = moreDiv?.dataset.code;
      if (code) expandAllItems(code);
      return;
    }

    // W03 자동 수정
    const autofix = e.target.closest(".v-autofix");
    if (autofix) {
      const code = autofix.dataset.code;
      if (code === "W03") autoFixW03();
      return;
    }
  });
}

// ─── 편집 바로가기 ──────────────────────────

function navigateToAuthor(authorId) {
  // 시인관리 탭으로 전환
  const authorTab = document.querySelector('.tab-btn[data-tab="author"]');
  if (authorTab) authorTab.click();

  // 해당 시인 선택
  setTimeout(() => {
    if (typeof selectAuthor === "function") {
      selectAuthor(authorId);
    }
    // 목록에서 해당 행 스크롤
    const row = document.querySelector(`#author-tbody tr[data-id="${authorId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      // 깜빡임 효과
      row.style.transition = "background 0.3s";
      row.style.background = "#fff3cd";
      setTimeout(() => { row.style.background = ""; }, 1500);
    }
  }, 100);
}

// ─── 전체 보기 (접힌 목록 펼치기) ─────────────

function expandAllItems(code) {
  // 마지막 검증 결과에서 해당 규칙 찾기
  // 다시 검증하지 않고, 현재 데이터로 해당 규칙만 재렌더링
  const itemsDiv = document.getElementById("v-items-" + code);
  if (!itemsDiv) return;

  // 간단한 방법: 해당 규칙의 전체 데이터를 다시 수집
  const authors = DATA.author.authors || {};
  let allItems = [];

  if (code === "W01") {
    Object.entries(authors).forEach(([id, a]) => {
      if (!a.birthplace || (!a.birthplace.lat && !a.birthplace.lng && !a.birthplace.name)) {
        allItems.push({ text: `${id} ${a.name?.ko || a.name?.zh || "?"}`, authorId: id });
      }
    });
  } else if (code === "W02") {
    Object.entries(authors).forEach(([id, a]) => {
      if (!a.relations || a.relations.length === 0) {
        allItems.push({ text: `${id} ${a.name?.ko || a.name?.zh || "?"}`, authorId: id });
      }
    });
  } else if (code === "W07") {
    Object.entries(authors).forEach(([id, a]) => {
      if (!a.bioKo || a.bioKo.trim() === "") {
        allItems.push({ text: `${id} ${a.name?.ko || a.name?.zh || "?"}`, authorId: id });
      }
    });
  }

  if (allItems.length === 0) return;

  itemsDiv.innerHTML = allItems.map(item => {
    let links = "";
    if (item.authorId) {
      links = ` <a href="#" class="v-goto-author" data-id="${item.authorId}">편집으로 이동</a>`;
    }
    return `<div class="v-item">${escapeHTMLAdmin(item.text)}${links}</div>`;
  }).join("");
}

// ─── W03 자동 수정 ──────────────────────────

function autoFixW03() {
  const authors = DATA.author.authors || {};
  const BIDIR = ["friend", "rival", "colleague"];
  let fixCount = 0;

  Object.entries(authors).forEach(([id, a]) => {
    (a.relations || []).forEach(rel => {
      if (!BIDIR.includes(rel.type)) return;
      if ((rel.targetId || "").startsWith("EXT_")) return;

      const target = authors[rel.targetId];
      if (!target) return;

      const hasReverse = (target.relations || []).some(r => r.targetId === id);
      if (!hasReverse) {
        if (!target.relations) target.relations = [];
        target.relations.push({
          targetId: id,
          type: rel.type,
          label: "",
          desc: "",
        });
        fixCount++;
      }
    });
  });

  if (fixCount > 0) {
    checkChanges();
    showToast(`${fixCount}건 역방향 관계 자동 추가됨`);
    // 검증 다시 실행
    runValidation();
  } else {
    showToast("수정할 항목이 없습니다");
  }
}
