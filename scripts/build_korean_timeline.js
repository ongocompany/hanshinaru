const fs = require('fs');
const path = require('path');

// ============================================================
// 1. 파일 경로 설정
// ============================================================
const BASE_DIR = path.resolve(__dirname, '..');
const INPUT_POETS = path.join(BASE_DIR, '한시사이트개발/한국의한시/research_poets.json');
const INPUT_POEMS = path.join(BASE_DIR, '한시사이트개발/한국의한시/poem_korean.json');
const OUTPUT_FILE = path.join(BASE_DIR, 'public/index/korean_timeline.json');

// ============================================================
// 2. 시대 매핑 설정
// ============================================================
const ERA_MAP = {
  'ancient': {
    id: 'ancient',
    name: '고조선~통일신라',
    match: ['상고(전승)', '고구려', '백제/신라', '신라', '신라 말', '신라 말~고려 초', '신라 말~후백제', '통일신라']
  },
  'goryeo': {
    id: 'goryeo',
    name: '고려',
    match: ['고려 초', '고려 전기', '고려 중기', '고려', '고려 후기']
  },
  'joseon-early': {
    id: 'joseon-early',
    name: '조선전기',
    match: ['고려 말', '고려 말~조선 초', '조선 전기']
  },
  'joseon-late': {
    id: 'joseon-late',
    name: '조선후기',
    match: ['조선 중기', '조선 중기~후기', '조선 후기', '대한제국기', '대한제국~일제강점기']
  }
};

// 시대 문자열 → 그룹 ID 변환
function getEraGroup(eraCountry) {
  for (const [groupId, config] of Object.entries(ERA_MAP)) {
    if (config.match.includes(eraCountry)) {
      return groupId;
    }
  }
  return 'ancient'; // 기본값
}

// ============================================================
// 3. 고아 시인 추정 (작가이름 → 시대)
// ============================================================
const ORPHAN_ERA_MAP = {
  '균여': 'ancient',
  '광덕': 'ancient',
  '광덕의 아내': 'ancient',
  '득오': 'ancient',
  '득오곡': 'ancient',
  '작자 미상 노옹': 'ancient',
  '백수광부': 'ancient',
  '백결선생': 'ancient'
};

function guessOrphanEra(authorName, poemNumber) {
  // 1. 알려진 작가 매핑
  if (ORPHAN_ERA_MAP[authorName]) {
    return ORPHAN_ERA_MAP[authorName];
  }

  // 2. "작자 미상" 번호 범위로 추정
  if (authorName === '작자 미상') {
    const num = parseInt(poemNumber.replace('KPOEM-', ''));
    if (num <= 30) return 'ancient';
    if (num <= 60) return 'goryeo';
    return 'joseon-late';
  }

  return 'ancient'; // 기본값
}

// ============================================================
// 4. 메인 빌드 로직
// ============================================================
function buildKoreanTimeline() {
  console.log('===== 한국 시가 타임라인 빌드 시작 =====\n');

  // 4-1. JSON 파일 읽기
  console.log('📖 데이터 로딩 중...');
  const poets = JSON.parse(fs.readFileSync(INPUT_POETS, 'utf-8'));
  const poemsRaw = JSON.parse(fs.readFileSync(INPUT_POEMS, 'utf-8'));
  console.log(`  - 시인 데이터: ${poets.length}명`);
  console.log(`  - 시 데이터: ${poemsRaw.length}편\n`);

  // 4-2. 시 중복 제거 (본문 기준)
  console.log('🔍 중복 시 제거 중...');
  const poemMap = new Map();
  const duplicates = [];

  poemsRaw.forEach(poem => {
    const content = (poem.본문 || '').trim();
    if (!content) return; // 본문 없으면 스킵

    if (!poemMap.has(content)) {
      poemMap.set(content, poem);
    } else {
      duplicates.push(poem.시제목.한글 || poem.시제목.한자);
    }
  });

  const poems = Array.from(poemMap.values());
  console.log(`  - 중복 제거 전: ${poemsRaw.length}편`);
  console.log(`  - 중복 제거 후: ${poems.length}편`);
  console.log(`  - 제거된 작품: ${duplicates.join(', ')}\n`);

  // 4-3. 시인별 작품 매칭
  console.log('🔗 시인-작품 매칭 중...');
  const poetMap = new Map(); // name.ko → poet
  poets.forEach(poet => {
    poetMap.set(poet.name.ko, {
      ...poet,
      fullPoems: [],
      otherWorks: []
    });
  });

  const orphanPoems = []; // 고아 시들
  let matchedCount = 0;

  poems.forEach(poem => {
    const authorName = poem.작가이름;
    const poet = poetMap.get(authorName);

    if (poet) {
      // 시인 정보 있음 → fullPoems에 추가
      poet.fullPoems.push({
        id: poem.작품번호,
        title: poem.시제목,
        content: poem.본문,
        pronunciation: poem.독음,
        translation: poem.번역문,
        commentary: poem.해설 || ''
      });
      matchedCount++;
    } else {
      // 시인 정보 없음 → orphan으로 분류
      const era = guessOrphanEra(authorName, poem.작품번호);
      orphanPoems.push({
        era,
        authorName,
        poem: {
          id: poem.작품번호,
          title: poem.시제목,
          content: poem.본문,
          pronunciation: poem.독음,
          translation: poem.번역문,
          commentary: poem.해설 || ''
        }
      });
    }
  });

  console.log(`  - 매칭 성공: ${matchedCount}편`);
  console.log(`  - 고아 시: ${orphanPoems.length}편\n`);

  // 4-4. otherWorks 구축 (시인의 works에서 fullPoems에 없는 것)
  console.log('📝 otherWorks 구축 중...');
  let otherWorksCount = 0;

  poetMap.forEach(poet => {
    const fullPoemTitles = new Set(
      poet.fullPoems.map(p => p.title.한글 || p.title.한자)
    );

    poet.otherWorks = (poet.works || [])
      .filter(work => !fullPoemTitles.has(work.title_ko))
      .map(work => ({
        titleKo: work.title_ko,
        titleHanja: work.title_hanja,
        source: work.source
      }));

    otherWorksCount += poet.otherWorks.length;
  });

  console.log(`  - 그외 작품 총 ${otherWorksCount}건\n`);

  // 4-5. 시대별 그룹핑
  console.log('🗂️  시대별 그룹핑 중...');
  const eras = {
    ancient: { id: 'ancient', name: '고조선~통일신라', poets: [], orphanPoems: [] },
    goryeo: { id: 'goryeo', name: '고려', poets: [], orphanPoems: [] },
    'joseon-early': { id: 'joseon-early', name: '조선전기', poets: [], orphanPoems: [] },
    'joseon-late': { id: 'joseon-late', name: '조선후기', poets: [], orphanPoems: [] }
  };

  // 시인 배치
  poetMap.forEach(poet => {
    const eraGroup = getEraGroup(poet.era_country);

    // works, era_country 제거 (이미 처리됨)
    const { works, era_country, ...poetData } = poet;

    eras[eraGroup].poets.push(poetData);
  });

  // 고아 시 배치
  orphanPoems.forEach(({ era, authorName, poem }) => {
    eras[era].orphanPoems.push({
      authorName,
      bio: '작품만 전함',
      poem
    });
  });

  // 통계 출력
  Object.values(eras).forEach(era => {
    console.log(`  - ${era.name}: 시인 ${era.poets.length}명, 고아시 ${era.orphanPoems.length}편`);
  });
  console.log();

  // 4-6. 최종 출력 구조 생성
  const output = {
    buildInfo: {
      date: new Date().toISOString().split('T')[0],
      totalPoets: poets.length,
      totalPoemsWithContent: poems.length,
      deduplicatedPoems: duplicates.length,
      matchedPoems: matchedCount,
      orphanPoems: orphanPoems.length
    },
    eras: Object.values(eras)
  };

  // 4-7. 파일 쓰기
  console.log('💾 파일 저장 중...');
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 저장 완료: ${OUTPUT_FILE}\n`);

  // 4-8. 최종 통계
  console.log('===== 빌드 완료 =====');
  console.log(`📊 총 시인: ${output.buildInfo.totalPoets}명`);
  console.log(`📊 총 시(본문 있음): ${output.buildInfo.totalPoemsWithContent}편`);
  console.log(`📊 중복 제거: ${output.buildInfo.deduplicatedPoems}편`);
  console.log(`📊 매칭 성공: ${output.buildInfo.matchedPoems}편`);
  console.log(`📊 고아 시: ${output.buildInfo.orphanPoems}편`);
  console.log(`📊 그외 작품: ${otherWorksCount}건`);
  console.log('======================\n');
}

// ============================================================
// 5. 실행
// ============================================================
try {
  buildKoreanTimeline();
} catch (error) {
  console.error('❌ 에러 발생:', error.message);
  console.error(error.stack);
  process.exit(1);
}
