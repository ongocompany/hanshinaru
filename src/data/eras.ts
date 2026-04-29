// 한시 시대 데이터 — 사이드바 시대 메뉴 + 시대별 페이지에서 사용
// 슬러그 명명: 한자 음가 영문화 (학계·국제 표준)
//
// D 라운드 cycle 3a (2026-04-29) — 사조/시기 분화로 재구조화:
//   CN 10: 한·위진·당(4분화)·송·원·명·청
//   KR 6:  국가형성기~신라말기 → 고려 초중기 → 여말선초 → 조선 중기 → 조선 후기 → 근대
//
// `era_period_match`: jds `poets.era_period` 자동 매칭 폴백용. 본격 큐레이션은 ID 풀(data/curation/) 기반.

export interface Era {
  slug: string;
  country: 'CN' | 'KR';
  name_ko: string;
  name_zh: string;
  period: string;
  era_period_match?: string[];
  sort_order: number;
  description?: string;
  characteristics?: string;
  /** jds 데이터 0 — 별 세션 데이터 수집 후 큐레이션 가능. true면 페이지 placeholder 유지 */
  data_pending?: boolean;
}

export const eras: Era[] = [
  // ─── 중국 (CN) — 시간순 10개 ───────────────────────────────────────
  {
    slug: 'qian-han', country: 'CN', name_ko: '전한·후한', name_zh: '兩漢',
    period: 'BCE 202 — CE 220',
    era_period_match: ['전한', '후한', '한대', '兩漢', '前漢', '後漢'],
    sort_order: 1, data_pending: true,
  },
  {
    slug: 'wei-jin', country: 'CN', name_ko: '위진남북조', name_zh: '魏晉南北朝',
    period: '220 — 589',
    era_period_match: ['위진', '남북조', '위진남북조', '魏晉', '南北朝'],
    sort_order: 2, data_pending: true,
  },
  {
    slug: 'chu-tang', country: 'CN', name_ko: '초당', name_zh: '初唐',
    period: '618 — 712',
    era_period_match: ['초당'],
    sort_order: 3,
  },
  {
    slug: 'sheng-tang', country: 'CN', name_ko: '성당', name_zh: '盛唐',
    period: '712 — 766',
    era_period_match: ['성당'],
    sort_order: 4,
  },
  {
    slug: 'zhong-tang', country: 'CN', name_ko: '중당', name_zh: '中唐',
    period: '766 — 835',
    era_period_match: ['중당'],
    sort_order: 5,
  },
  {
    slug: 'wan-tang', country: 'CN', name_ko: '만당', name_zh: '晚唐',
    period: '836 — 907',
    era_period_match: ['만당'],
    sort_order: 6,
  },
  {
    slug: 'song', country: 'CN', name_ko: '송', name_zh: '宋',
    period: '960 — 1279',
    era_period_match: ['송', '송대', '북송', '남송', '宋'],
    sort_order: 7, data_pending: true,
  },
  {
    slug: 'yuan', country: 'CN', name_ko: '원', name_zh: '元',
    period: '1271 — 1368',
    era_period_match: ['원', '원대', '元'],
    sort_order: 8, data_pending: true,
  },
  {
    slug: 'ming', country: 'CN', name_ko: '명', name_zh: '明',
    period: '1368 — 1644',
    era_period_match: ['명', '명대', '明'],
    sort_order: 9, data_pending: true,
  },
  {
    slug: 'qing', country: 'CN', name_ko: '청', name_zh: '淸',
    period: '1644 — 1912',
    era_period_match: ['청', '청대', '淸'],
    sort_order: 10, data_pending: true,
  },

  // ─── 한국 (KR) — 시기 분화 6개 ─────────────────────────────────────
  {
    slug: 'ancient-silla', country: 'KR', name_ko: '국가형성기~신라말기', name_zh: '古代~新羅末',
    period: '? — 935',
    era_period_match: ['고구려', '백제', '신라', '통일신라', '신라 말'],
    sort_order: 1,
  },
  {
    slug: 'goryeo-early-mid', country: 'KR', name_ko: '고려 초중기', name_zh: '高麗 初中期',
    period: '918 — 1259',
    era_period_match: ['고려 전기', '고려 중기', '고려'],
    sort_order: 2,
  },
  {
    slug: 'goryeo-mal-joseon-cho', country: 'KR', name_ko: '여말선초', name_zh: '麗末鮮初',
    period: '1259 — 1567',
    era_period_match: ['고려 후기', '고려 말', '고려 말~조선 초', '고려 말 조선 초', '조선 전기'],
    sort_order: 3,
  },
  {
    slug: 'joseon-jung', country: 'KR', name_ko: '조선 중기', name_zh: '朝鮮 中期',
    period: '1567 — 1724',
    era_period_match: ['조선 중기', '조선 중기~후기', '조선 전기~후기'],
    sort_order: 4,
  },
  {
    slug: 'joseon-hu', country: 'KR', name_ko: '조선 후기', name_zh: '朝鮮 後期',
    period: '1724 — 1864',
    era_period_match: ['조선 후기'],
    sort_order: 5,
  },
  {
    slug: 'geundae', country: 'KR', name_ko: '근대', name_zh: '近代',
    period: '1864 — 1950',
    era_period_match: ['근대 전환기', '근대'],
    sort_order: 6,
  },
];

export function getErasByCountry(country: 'CN' | 'KR'): Era[] {
  return eras
    .filter((e) => e.country === country)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function findEraBySlug(country: 'CN' | 'KR', slug: string): Era | undefined {
  return eras.find((e) => e.country === country && e.slug === slug);
}
