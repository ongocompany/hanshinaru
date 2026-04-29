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
    description: '당 현종(玄宗) 개원·천보 연간(712~756)을 정점으로 하는 시기. 정치·경제·문화 모든 면에서 당대(唐代)의 절정을 이루었으며, 안사의 난(755~763)을 분기점으로 시풍도 크게 전환된다. 장안과 낙양은 당시 동아시아 한문 문화권의 중심이었고, 시인들은 궁정·관료·은거·변새(邊塞) 등 다양한 삶의 자리에서 한시의 외연을 넓혔다.',
    characteristics: '이백(701~762)의 호방·낭만, 두보(712~770)의 침울·사실, 왕유(699~759)의 산수·선정(禪境), 맹호연(689~740)의 전원, 고적(704~765)·잠삼(715~770)의 변새시 등 서로 다른 풍격이 동시에 정점에 도달한 시기.\n율시·절구의 형식이 완성되었으며, 칠언율시가 본격적으로 자리 잡았다. 한시사 전체에서 형식의 완성도와 정서의 깊이가 가장 균형을 이룬 시기로 평가된다.',
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
    description: '영·정조(1724~1800) 문예 부흥기를 지나 19세기 세도정치기까지를 아우른다. 17세기 후반 김창협(金昌協)·김창흡(金昌翕) 형제를 중심으로 형성된 백악시단(白嶽詩壇)이 진경시(眞景詩) 운동을 일으켜 조선 자체의 산수·풍속을 한시에 담기 시작했고, 18세기에는 박지원·정약용·이덕무·박제가 등 실학파 문인들이 사실적 묘사와 사회 비판을 한시에 끌어들였다.',
    characteristics: '명·청 의고풍에서 벗어나 조선의 산하·풍속·언어를 그대로 담는 "조선풍(朝鮮風)"이 자리잡은 시기. 이병연(李秉淵)이 정선(鄭敾)의 진경산수에 화답하여 진경시를 본격화했고, 정약용은 「애절양(哀絶陽)」 등 사회시를 통해 백성의 고통을 직시했다.\n한시가 더 이상 중국 시의 모방이 아닌 조선의 자기 표현 매체로 성숙한 시기로, 한시사의 자생적 전환점이 된다.',
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
