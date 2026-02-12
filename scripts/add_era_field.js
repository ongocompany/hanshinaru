#!/usr/bin/env node
/**
 * 작가 DB에 시대(era) 필드 추가 스크립트
 *
 * 작성자: Claude(민철)
 * 작성일: 2026-02-12
 * 목적: 전체 작가 76명에게 시대(era) 필드 추가
 *       - 생몰년 있는 작가: birth 기준 자동 계산
 *       - 생몰년 미상 28명: Gemini(태훈) 조사 결과 반영
 */

const fs = require('fs');
const path = require('path');

// 파일 경로
const DB_PATH = path.join(__dirname, '../public/index/db_author.with_ko.json');
const BACKUP_PATH = path.join(__dirname, '../public/index/db_author.with_ko.backup.json');

// 시대 구분 기준 (unknown_author.md 기준)
const ERA_RANGES = {
  early: { start: 618, end: 712, label: '초당' },
  high: { start: 713, end: 766, label: '성당' },
  mid: { start: 767, end: 835, label: '중당' },
  late: { start: 836, end: 907, label: '만당' }
};

// 생몰년 미상 작가 시대 매핑 (태훈의 조사 결과)
const UNKNOWN_ERA_MAP = {
  // 초당 (618-712)
  'C354': { period: 'early', confidence: 'high', source: 'direct_era', note: '宋之問' },

  // 성당 (713-766)
  'C362': { period: 'high', confidence: 'medium', source: 'direct_era', note: '王翰(추정)' },
  'C368': { period: 'high', confidence: 'high', source: 'direct_era', note: '劉眘虛' },
  'C352': { period: 'high', confidence: 'high', source: 'regnal_year', note: '西鄙人(천보 연간)' },
  'C335': { period: 'high', confidence: 'high', source: 'regnal_year', note: '金昌緖(개원 연간)' },
  'C383': { period: 'high', confidence: 'high', source: 'related_person', note: '張旭(이백과 교유)' },
  'C348': { period: 'high', confidence: 'high', source: 'related_person', note: '裴迪(왕유와 교유)' },
  'C367': { period: 'high', confidence: 'high', source: 'regnal_year', note: '劉方平(천보~대력 연간)' },

  // 중당 (767-835)
  'C356': { period: 'mid', confidence: 'high', source: 'direct_era', note: '王建' },
  'C350': { period: 'mid', confidence: 'high', source: 'direct_era', note: '司空曙' },
  'C374': { period: 'mid', confidence: 'high', source: 'direct_era', note: '李端' },
  'C399': { period: 'mid', confidence: 'medium', source: 'direct_era', note: '韓翃(추정)' },
  'C380': { period: 'mid', confidence: 'high', source: 'direct_era', note: '張繼' },
  'C344': { period: 'mid', confidence: 'medium', source: 'regnal_year', note: '杜秋娘(원화 연간 추정)' },
  'C372': { period: 'mid', confidence: 'high', source: 'regnal_year', note: '柳中庸(대력 연간)' },
  'C390': { period: 'mid', confidence: 'high', source: 'regnal_year', note: '朱慶餘(826년 급제)' },

  // 중당~만당 범위 (중당으로 분류)
  'C386': { period: 'mid', confidence: 'medium', source: 'direct_era', note: '張祜(중당~만당)' },

  // 만당 (836-907)
  'C402': { period: 'late', confidence: 'high', source: 'direct_era', note: '許渾' },
  'C355': { period: 'late', confidence: 'high', source: 'direct_era', note: '溫庭筠' },
  'C391': { period: 'late', confidence: 'medium', source: 'direct_era', note: '陳陶(추정)' },
  'C394': { period: 'late', confidence: 'high', source: 'direct_era', note: '崔塗' },
  'C353': { period: 'late', confidence: 'high', source: 'regnal_year', note: '薛逢(841년 급제)' },
  'C345': { period: 'late', confidence: 'high', source: 'regnal_year', note: '馬戴(844년 급제)' },
  'C376': { period: 'late', confidence: 'high', source: 'regnal_year', note: '李頻(854년 급제)' },
  'C381': { period: 'late', confidence: 'high', source: 'regnal_year', note: '張喬(860-874년 급제)' },
  'C392': { period: 'late', confidence: 'high', source: 'regnal_year', note: '秦韜玉(873-888년 활동)' },
  'C385': { period: 'late', confidence: 'high', source: 'direct_era', note: '張泌(당말~오대)' },

  // 성당~중당 범위 (중당으로 분류)
  'C331': { period: 'mid', confidence: 'medium', source: 'regnal_year', note: '皎然(대력~정원 연간)' }
};

/**
 * 생년을 기준으로 시대 계산
 */
function calculateEraFromBirth(birth) {
  if (!birth) return null;

  for (const [period, range] of Object.entries(ERA_RANGES)) {
    if (birth >= range.start && birth <= range.end) {
      return {
        period,
        confidence: 'high',
        source: 'birth_year',
        label: range.label
      };
    }
  }

  // 범위 밖인 경우 (618년 이전 또는 907년 이후)
  if (birth < 618) return { period: 'pre_tang', confidence: 'high', source: 'birth_year', label: '당 이전' };
  if (birth > 907) return { period: 'post_tang', confidence: 'high', source: 'birth_year', label: '당 이후' };

  return null;
}

/**
 * 메인 처리 함수
 */
function addEraField() {
  console.log('🚀 시대 필드 추가 시작...\n');

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

  // 3. 시대 필드 추가
  console.log('⚙️  시대 필드 추가 중...\n');

  let processed = 0;
  let withBirth = 0;
  let withoutBirth = 0;
  let errors = [];

  for (const [titleId, author] of Object.entries(dbData.authors)) {
    try {
      const birth = author.life?.birth;

      if (birth !== null && birth !== undefined) {
        // 생년이 있는 경우: 자동 계산
        const era = calculateEraFromBirth(birth);
        if (era) {
          author.era = {
            period: era.period,
            confidence: era.confidence,
            source: era.source
          };
          withBirth++;
          console.log(`  ✓ ${titleId} ${author.name.zh} (${birth}년생) → ${era.label} (${era.period})`);
        }
      } else {
        // 생년이 없는 경우: 매핑 테이블 참조
        const eraData = UNKNOWN_ERA_MAP[titleId];
        if (eraData) {
          author.era = {
            period: eraData.period,
            confidence: eraData.confidence,
            source: eraData.source
          };
          withoutBirth++;
          console.log(`  ✓ ${titleId} ${author.name.zh} (생몰년 미상) → ${ERA_RANGES[eraData.period].label} (${eraData.period}) [${eraData.note}]`);
        } else {
          errors.push(`${titleId} ${author.name.zh}: 생몰년 미상이지만 매핑 데이터 없음`);
        }
      }

      processed++;
    } catch (error) {
      errors.push(`${titleId}: ${error.message}`);
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
  console.log(`총 작가 수:           ${dbData.count}명`);
  console.log(`처리 완료:            ${processed}명`);
  console.log(`  - 생년 기준:        ${withBirth}명`);
  console.log(`  - 조사 결과 기준:   ${withoutBirth}명`);

  if (errors.length > 0) {
    console.log(`\n⚠️  경고 (${errors.length}건):`);
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('\n✨ 에러 없이 완료!');
  }

  console.log('\n백업 파일:', BACKUP_PATH);
  console.log('═══════════════════════════════════════\n');
}

// 실행
if (require.main === module) {
  addEraField();
}

module.exports = { addEraField };
