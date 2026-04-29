// 한시 시대 데이터 — 사이드바 시대 메뉴 + 시대별 페이지에서 사용
// 슬러그 명명: 한자 음가 영문화 (학계·국제 표준)

export interface Era {
  slug: string;            // URL slug
  country: 'CN' | 'KR';
  name_ko: string;         // 한국어 표기
  name_zh: string;         // 한자 표기
  period: string;          // 연대 표시 (페이지 헤더용)
  era_period_match?: string[]; // poets.era_period 매칭에 쓰는 후보 문자열들
  sort_order: number;      // 사이드바 정렬 순서
  description?: string;    // 시대 배경 (큐레이션 콘텐츠 — placeholder는 페이지에서 처리)
  characteristics?: string;// 한시 특징
}

export const eras: Era[] = [
  // 중국 (CN) — 시간순
  {
    slug: 'qian-han',
    country: 'CN',
    name_ko: '전한·후한',
    name_zh: '兩漢',
    period: 'BCE 202 — CE 220',
    era_period_match: ['전한', '후한', '한대', '兩漢', '前漢', '後漢'],
    sort_order: 1,
  },
  {
    slug: 'wei-jin',
    country: 'CN',
    name_ko: '위진남북조',
    name_zh: '魏晉南北朝',
    period: '220 — 589',
    era_period_match: ['위진', '남북조', '위진남북조', '魏晉', '南北朝'],
    sort_order: 2,
  },
  {
    slug: 'tang',
    country: 'CN',
    name_ko: '당',
    name_zh: '唐',
    period: '618 — 907',
    era_period_match: ['당', '당대', '초당', '성당', '중당', '만당', '당나라', '唐'],
    sort_order: 3,
  },
  {
    slug: 'song',
    country: 'CN',
    name_ko: '송',
    name_zh: '宋',
    period: '960 — 1279',
    era_period_match: ['송', '송대', '북송', '남송', '宋'],
    sort_order: 4,
  },
  {
    slug: 'yuan',
    country: 'CN',
    name_ko: '원',
    name_zh: '元',
    period: '1271 — 1368',
    era_period_match: ['원', '원대', '元'],
    sort_order: 5,
  },
  {
    slug: 'ming',
    country: 'CN',
    name_ko: '명',
    name_zh: '明',
    period: '1368 — 1644',
    era_period_match: ['명', '명대', '明'],
    sort_order: 6,
  },
  {
    slug: 'qing',
    country: 'CN',
    name_ko: '청',
    name_zh: '淸',
    period: '1644 — 1912',
    era_period_match: ['청', '청대', '淸'],
    sort_order: 7,
  },

  // 한국 (KR) — 시간순
  {
    slug: 'silla',
    country: 'KR',
    name_ko: '신라',
    name_zh: '新羅',
    period: 'BCE 57 — CE 935',
    era_period_match: ['신라', '신라 말', '통일신라', '新羅'],
    sort_order: 1,
  },
  {
    slug: 'goryeo',
    country: 'KR',
    name_ko: '고려',
    name_zh: '高麗',
    period: '918 — 1392',
    era_period_match: ['고려', '고려 전기', '고려 중기', '고려 후기', '高麗'],
    sort_order: 2,
  },
  {
    slug: 'joseon',
    country: 'KR',
    name_ko: '조선',
    name_zh: '朝鮮',
    period: '1392 — 1897',
    era_period_match: ['조선', '조선 전기', '조선 중기', '조선 후기', '근대 전환기', '근대', '朝鮮'],
    sort_order: 3,
  },
];

// 헬퍼: 국가별 + 정렬된 시대 목록
export function getErasByCountry(country: 'CN' | 'KR'): Era[] {
  return eras
    .filter((e) => e.country === country)
    .sort((a, b) => a.sort_order - b.sort_order);
}

// 헬퍼: 슬러그로 시대 찾기
export function findEraBySlug(country: 'CN' | 'KR', slug: string): Era | undefined {
  return eras.find((e) => e.country === country && e.slug === slug);
}
