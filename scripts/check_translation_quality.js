/**
 * Qwen 번역 데이터 품질 체크 스크립트
 * 제목(한글/한자), 집평(원문/번역) 누락 여부 분석
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(
  'docs/research/qwen_translations/qwen_translation_20260221_143125.json', 'utf8'
));

const results = [];
const stats = {
  total: 0,
  // 집평 상태
  jippyung_both: 0,      // 원문+번역 모두 있음
  jippyung_cn_only: 0,   // 한자 원문만
  jippyung_kr_only: 0,   // 한국어 번역만
  jippyung_none: 0,      // 집평 없음
  // 제목 상태
  title_kr_missing: 0,   // 한글 제목 누락/한자섞임
  title_cn_missing: 0,   // 한자 제목 누락
};

function hasChineseChars(text) {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

function hasKoreanChars(text) {
  return /[\uac00-\ud7af]/.test(text);
}

for (const item of data.results) {
  stats.total++;
  const no = item.poemNoStr;
  const titleCn = item.title || '';
  const poet = (item.poet || '').replace(/\[\d+\]/, '');
  const md = item.markdown || '';

  // 1. 한글 제목 추출 (## NNN. 한글제목)
  const headingMatch = md.match(/^##\s+\d+\.\s+(.+)/m);
  const headingTitle = headingMatch ? headingMatch[1].trim() : '';

  // 한글 제목 문제: 한자가 섞여있거나 비어있음
  let titleKrStatus = 'OK';
  if (!headingTitle) {
    titleKrStatus = '한글제목 없음';
    stats.title_kr_missing++;
  } else if (hasChineseChars(headingTitle) && !hasKoreanChars(headingTitle)) {
    titleKrStatus = '한자만 있음 (한글 없음)';
    stats.title_kr_missing++;
  } else if (hasChineseChars(headingTitle) && hasKoreanChars(headingTitle)) {
    titleKrStatus = '한자+한글 혼합';
    stats.title_kr_missing++;
  }

  // 2. 한자 제목 체크
  let titleCnStatus = 'OK';
  if (!titleCn || !hasChineseChars(titleCn)) {
    titleCnStatus = '한자제목 없음';
    stats.title_cn_missing++;
  }

  // 3. 집평 분석
  // 집평 관련 패턴들
  const hasJippyungHeader = /\[집평\]|\[集評\]|집평 원문|### 집평|### 集評/.test(md);
  const hasJippyungTransHeader = /### 집평 번역/.test(md);

  // 집평 영역에서 한자/한국어 존재 여부 판단
  // 집평 섹션 추출
  let jippyungSection = '';

  // [집평] 또는 [集評] 이후 ~ ### 번역 이전
  const jippyungMatch = md.match(/(\[집평\]|\[集評\]|집평 원문[^]*?[:：]\s*\n)([\s\S]*?)(?=###\s|$)/);
  if (jippyungMatch) {
    jippyungSection = jippyungMatch[0];
  }

  // ### 집평 번역 섹션
  const jippyungTransMatch = md.match(/### 집평 번역\s*\n([\s\S]*?)(?=###\s|$)/);
  const jippyungTransSection = jippyungTransMatch ? jippyungTransMatch[1].trim() : '';

  // 집평 내 한자 원문 존재?
  let hasJippyungCn = false;
  let hasJippyungKr = false;

  if (jippyungSection) {
    // 한자가 상당량 있으면 원문으로 판단
    const cnChars = (jippyungSection.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    if (cnChars > 5) hasJippyungCn = true;

    // 한국어가 있으면 번역으로 판단
    const krChars = (jippyungSection.match(/[\uac00-\ud7af]/g) || []).length;
    if (krChars > 10) hasJippyungKr = true;
  }

  if (jippyungTransSection) {
    hasJippyungKr = true;
  }

  // 만약 집평 헤더도 없으면
  if (!hasJippyungHeader && !hasJippyungTransHeader) {
    // markdown 내에서 집평 키워드 자체를 찾아봄
    if (!/집평|集評/.test(md)) {
      // 집평 자체가 없음
    }
  }

  // 최종 집평 상태 판정
  let jippyungStatus;
  if (hasJippyungCn && hasJippyungKr) {
    jippyungStatus = 'OK (원문+번역)';
    stats.jippyung_both++;
  } else if (hasJippyungCn && !hasJippyungKr) {
    jippyungStatus = '⚠️ 원문만 있음 (번역 누락)';
    stats.jippyung_cn_only++;
  } else if (!hasJippyungCn && hasJippyungKr) {
    jippyungStatus = '⚠️ 번역만 있음 (원문 누락)';
    stats.jippyung_kr_only++;
  } else {
    jippyungStatus = '❌ 집평 없음';
    stats.jippyung_none++;
  }

  // 문제 여부
  const hasIssue = titleKrStatus !== 'OK' || titleCnStatus !== 'OK' ||
                   !jippyungStatus.startsWith('OK');

  results.push({
    no, titleCn, headingTitle, poet,
    titleKrStatus, titleCnStatus, jippyungStatus,
    hasIssue
  });
}

// 리포트 생성
let report = `# Qwen 번역 데이터 품질 체크 리포트\n\n`;
report += `- **분석일**: ${new Date().toISOString().split('T')[0]}\n`;
report += `- **대상 파일**: qwen_translation_20260221_143125.json\n`;
report += `- **총 시 수**: ${stats.total}편\n\n`;

report += `## 통계 요약\n\n`;
report += `| 항목 | 수량 | 비율 |\n`;
report += `|------|------|------|\n`;
report += `| 집평 원문+번역 모두 있음 | ${stats.jippyung_both} | ${(stats.jippyung_both/stats.total*100).toFixed(1)}% |\n`;
report += `| 집평 원문만 있음 (번역 누락) | ${stats.jippyung_cn_only} | ${(stats.jippyung_cn_only/stats.total*100).toFixed(1)}% |\n`;
report += `| 집평 번역만 있음 (원문 누락) | ${stats.jippyung_kr_only} | ${(stats.jippyung_kr_only/stats.total*100).toFixed(1)}% |\n`;
report += `| 집평 없음 | ${stats.jippyung_none} | ${(stats.jippyung_none/stats.total*100).toFixed(1)}% |\n`;
report += `| 한글 제목 문제 | ${stats.title_kr_missing} | ${(stats.title_kr_missing/stats.total*100).toFixed(1)}% |\n`;
report += `| 한자 제목 문제 | ${stats.title_cn_missing} | ${(stats.title_cn_missing/stats.total*100).toFixed(1)}% |\n\n`;

// 문제 항목 상세 목록
report += `## 문제 항목 상세 목록\n\n`;

// 1. 집평 원문만 있는 것 (번역 누락)
const cnOnly = results.filter(r => r.jippyungStatus.includes('원문만'));
if (cnOnly.length > 0) {
  report += `### 1. 집평 원문만 있음 — 번역 누락 (${cnOnly.length}편)\n\n`;
  report += `| 번호 | 한자 제목 | 시인 | 한글 제목 |\n`;
  report += `|------|-----------|------|----------|\n`;
  for (const r of cnOnly) {
    report += `| ${r.no} | ${r.titleCn} | ${r.poet} | ${r.headingTitle} |\n`;
  }
  report += `\n`;
}

// 2. 집평 번역만 있는 것 (원문 누락)
const krOnly = results.filter(r => r.jippyungStatus.includes('번역만'));
if (krOnly.length > 0) {
  report += `### 2. 집평 번역만 있음 — 원문 누락 (${krOnly.length}편)\n\n`;
  report += `| 번호 | 한자 제목 | 시인 | 한글 제목 |\n`;
  report += `|------|-----------|------|----------|\n`;
  for (const r of krOnly) {
    report += `| ${r.no} | ${r.titleCn} | ${r.poet} | ${r.headingTitle} |\n`;
  }
  report += `\n`;
}

// 3. 집평 없음
const noJP = results.filter(r => r.jippyungStatus.includes('없음'));
if (noJP.length > 0) {
  report += `### 3. 집평 없음 (${noJP.length}편)\n\n`;
  report += `| 번호 | 한자 제목 | 시인 | 한글 제목 |\n`;
  report += `|------|-----------|------|----------|\n`;
  for (const r of noJP) {
    report += `| ${r.no} | ${r.titleCn} | ${r.poet} | ${r.headingTitle} |\n`;
  }
  report += `\n`;
}

// 4. 한글 제목 문제
const titleIssues = results.filter(r => r.titleKrStatus !== 'OK');
if (titleIssues.length > 0) {
  report += `### 4. 한글 제목 문제 (${titleIssues.length}편)\n\n`;
  report += `| 번호 | 한자 제목 | 시인 | 현재 한글 제목 | 문제 |\n`;
  report += `|------|-----------|------|----------------|------|\n`;
  for (const r of titleIssues) {
    report += `| ${r.no} | ${r.titleCn} | ${r.poet} | ${r.headingTitle} | ${r.titleKrStatus} |\n`;
  }
  report += `\n`;
}

// 5. 전체 목록 (간략)
report += `## 전체 320편 상태\n\n`;
report += `| 번호 | 한자 제목 | 시인 | 한글제목 | 집평 상태 |\n`;
report += `|------|-----------|------|----------|----------|\n`;
for (const r of results) {
  const titleMark = r.titleKrStatus !== 'OK' ? '⚠️' : '✅';
  report += `| ${r.no} | ${r.titleCn} | ${r.poet} | ${titleMark} ${r.headingTitle.substring(0, 20)} | ${r.jippyungStatus} |\n`;
}

fs.writeFileSync('docs/research/qwen_translations/품질체크_리포트.md', report, 'utf8');
console.log('리포트 생성 완료!');
console.log('---');
console.log(`총: ${stats.total}`);
console.log(`집평 원문+번역: ${stats.jippyung_both}`);
console.log(`집평 원문만: ${stats.jippyung_cn_only}`);
console.log(`집평 번역만: ${stats.jippyung_kr_only}`);
console.log(`집평 없음: ${stats.jippyung_none}`);
console.log(`한글제목 문제: ${stats.title_kr_missing}`);
console.log(`한자제목 문제: ${stats.title_cn_missing}`);
