#!/usr/bin/env node
/**
 * 태훈(Gemini) 조사 결과 기반 era 업데이트 스크립트
 *
 * 작성자: Claude(민철)
 * 작성일: 2026-02-12
 * 목적: 생몰년 있는 작가 48명의 era를 실제 활동 시기 기준으로 재정제
 *       태훈이 조사한 bioKo 분석 및 웹 서칭 결과 반영
 */

const fs = require('fs');
const path = require('path');

// 파일 경로
const DB_PATH = path.join(__dirname, '../public/index/db_author.with_ko.json');
const BACKUP_PATH = path.join(__dirname, '../public/index/db_author.with_ko.backup2.json');

// 태훈(Gemini)의 조사 결과 - era_refinement_results.md 기반
const TAEHUN_ERA_MAP = {
  'C382': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '張九齡 - 開元 연간 명재상' },
  'C375': { period: 'high', confidence: 'high', source: 'bio_era', note: '李白 - 盛唐 詩仙' },
  'C341': { period: 'high', confidence: 'high', source: 'bio_era', note: '杜甫 - 盛唐 詩聖' },
  'C359': { period: 'high', confidence: 'high', source: 'bio_era', note: '王維 - 盛唐 대표 시인' },
  'C347': { period: 'high', confidence: 'high', source: 'bio_era', note: '孟浩然 - 盛唐 전원시 대가' },
  'C361': { period: 'high', confidence: 'high', source: 'bio_era', note: '王昌齡 - 盛唐 邊塞詩 대가' },
  'C332': { period: 'high', confidence: 'high', source: 'birth_20', note: '邱爲 - birth+20 (714) 성당기' },
  'C334': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '綦毋潛 - 開元 13년 진사' },
  'C351': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '常建 - 開元 15년 진사' },
  'C379': { period: 'high', confidence: 'high', source: 'bio_era', note: '岑參 - 盛唐 邊塞詩人' },
  'C363': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '元結 - 天寶 12년 진사' },
  'C365': { period: 'mid', confidence: 'high', source: 'bio_era', note: '韋應物 - 大曆(766) 이후 활동' },
  'C371': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '柳宗元 - 元和 연간 핵심' },
  'C346': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '孟郊 - 貞元(785) 연간 활동' },
  'C393': { period: 'early', confidence: 'high', source: 'bio_era', note: '陳子昻 - 702년 사망, 初唐' },
  'C373': { period: 'high', confidence: 'high', source: 'bio_era', note: '李頎 - 盛唐기 활동' },
  'C401': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '韓愈 - 元和 연간 활동' },
  'C349': { period: 'mid', confidence: 'high', source: 'bio_era', note: '白居易 - 中唐 원백체' },
  'C377': { period: 'late', confidence: 'high', source: 'bio_era', note: '李商隱 - 晩唐 대표 시인' },
  'C329': { period: 'high', confidence: 'high', source: 'bio_era', note: '高適 - 盛唐 邊塞詩人' },
  'C338': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '唐玄宗 - 開元/天寶 황제' },
  'C358': { period: 'early', confidence: 'high', source: 'bio_era', note: '王勃 - 初唐四傑' },
  'C336': { period: 'early', confidence: 'high', source: 'bio_era', note: '駱賓王 - 初唐四傑' },
  'C343': { period: 'early', confidence: 'high', source: 'bio_era', note: '杜審言 - 初唐 시인' },
  'C397': { period: 'early', confidence: 'high', source: 'bio_era', note: '沈佺期 - 初唐 沈宋體' },
  'C354': { period: 'early', confidence: 'high', source: 'bio_era', note: '宋之問 - 初唐 沈宋體' },
  'C357': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '王灣 - 先天(712) 연간 진사' },
  'C370': { period: 'mid', confidence: 'high', source: 'bio_era', note: '劉長卿 - 大曆十才子 흡사' },
  'C387': { period: 'mid', confidence: 'high', source: 'bio_era', note: '錢起 - 大曆十才子' },
  'C399': { period: 'mid', confidence: 'high', source: 'bio_era', note: '韓翃 - 大曆十才子' },
  'C368': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '劉眘虛 - 開元 11년 진사' },
  'C339': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '戴叔倫 - 大曆 연간 활동' },
  'C337': { period: 'mid', confidence: 'high', source: 'bio_era', note: '盧綸 - 大曆十才子' },
  'C378': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '李益 - 大曆 4년 진사' },
  'C350': { period: 'mid', confidence: 'high', source: 'bio_era', note: '司空曙 - 大曆十才子' },
  'C369': { period: 'mid', confidence: 'high', source: 'bio_era', note: '劉禹錫 - 中唐 시인' },
  'C384': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '張籍 - 貞元 15년 진사' },
  'C402': { period: 'late', confidence: 'high', source: 'bio_era', note: '許渾 - 晩唐 시인' },
  'C355': { period: 'late', confidence: 'high', source: 'bio_era', note: '溫庭筠 - 晩唐 花間派' },
  'C345': { period: 'late', confidence: 'high', source: 'bio_regnal_year', note: '馬戴 - 會昌 4년 진사' },
  'C381': { period: 'late', confidence: 'high', source: 'bio_era', note: '張喬 - 咸通十哲' },
  'C342': { period: 'late', confidence: 'high', source: 'bio_era', note: '杜荀鶴 - 唐末 시인' },
  'C366': { period: 'late', confidence: 'high', source: 'bio_era', note: '韋莊 - 唐末 花間派' },
  'C331': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '皎然 - 大曆/貞元 연간' },
  'C396': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '崔顥 - 開元 11년 진사' },
  'C389': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '祖詠 - 開元 12년 진사' },
  'C395': { period: 'high', confidence: 'high', source: 'bio_regnal_year', note: '崔曙 - 開元 26년 진사' },
  'C364': { period: 'mid', confidence: 'high', source: 'bio_era', note: '元稹 - 中唐 元和體' },
  'C328': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '賈島 - 文宗 때 長江主簿' },
  'C330': { period: 'mid', confidence: 'high', source: 'bio_regnal_year', note: '顧況 - 貞元 3년 著作郞' }
};

/**
 * 메인 처리 함수
 */
function updateEraFromTaehun() {
  console.log('🚀 태훈 조사 결과 기반 era 업데이트 시작...\n');

  // 1. DB 파일 읽기
  console.log('📖 DB 파일 읽는 중...');
  let dbData;
  try {
    const dbContent = fs.readFileSync(DB_PATH, 'utf8');
    dbData = JSON.parse(dbContent);
  } catch (error) {
    console.error('❌ DB 파일 읽기 실패:', error.message);
    process.exit(1);
  }
  console.log(`✅ DB 파일 로드 완료 (총 ${dbData.count}명)\n`);

  // 2. 백업 생성
  console.log('💾 백업 파일 생성 중...');
  try {
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(dbData, null, 2), 'utf8');
    console.log(`✅ 백업 완료: ${BACKUP_PATH}\n`);
  } catch (error) {
    console.error('❌ 백업 실패:', error.message);
    process.exit(1);
  }

  // 3. era 업데이트
  console.log('⚙️  Era 업데이트 중...\n');

  let updated = 0;
  let unchanged = 0;
  const changes = [];

  for (const [titleId, eraData] of Object.entries(TAEHUN_ERA_MAP)) {
    const author = dbData.authors[titleId];

    if (!author) {
      console.log(`  ⚠️  ${titleId}: DB에 없음`);
      continue;
    }

    const oldEra = author.era?.period || 'none';
    const newEra = eraData.period;

    if (oldEra !== newEra) {
      author.era = {
        period: eraData.period,
        confidence: eraData.confidence,
        source: eraData.source
      };
      updated++;

      const eraLabel = {
        'early': '초당',
        'high': '성당',
        'mid': '중당',
        'late': '만당'
      };

      console.log(`  ✓ ${titleId} ${author.name.zh}: ${eraLabel[oldEra] || oldEra} → ${eraLabel[newEra]} [${eraData.note}]`);
      changes.push({ titleId, name: author.name.zh, oldEra, newEra, note: eraData.note });
    } else {
      unchanged++;
    }
  }

  // 4. 결과 저장
  console.log('\n💾 업데이트된 DB 저장 중...');
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
    console.log(`✅ DB 저장 완료: ${DB_PATH}\n`);
  } catch (error) {
    console.error('❌ DB 저장 실패:', error.message);
    console.log('⚠️  백업 파일에서 복구하세요:', BACKUP_PATH);
    process.exit(1);
  }

  // 5. 결과 리포트
  console.log('═══════════════════════════════════════');
  console.log('📊 작업 완료 리포트');
  console.log('═══════════════════════════════════════');
  console.log(`총 대상:     ${Object.keys(TAEHUN_ERA_MAP).length}명`);
  console.log(`변경됨:      ${updated}명`);
  console.log(`유지됨:      ${unchanged}명`);

  if (changes.length > 0) {
    console.log('\n📝 주요 변경 내역:');
    const eraLabel = { 'early': '초당', 'high': '성당', 'mid': '중당', 'late': '만당' };
    changes.slice(0, 5).forEach(c => {
      console.log(`  - ${c.name}: ${eraLabel[c.oldEra]} → ${eraLabel[c.newEra]}`);
    });
    if (changes.length > 5) {
      console.log(`  ... 외 ${changes.length - 5}건`);
    }
  }

  console.log('\n백업 파일:', BACKUP_PATH);
  console.log('═══════════════════════════════════════\n');
}

// 실행
if (require.main === module) {
  updateEraFromTaehun();
}

module.exports = { updateEraFromTaehun };
