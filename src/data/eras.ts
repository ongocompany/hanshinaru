export interface EraDefinition {
  slug: string;
  label: string;
  country: 'CN' | 'KR';
  yearRange: string;
  description: string;
  matchPeriods: string[];
}

export const CN_ERAS: EraDefinition[] = [
  {
    slug: 'pre-han',
    label: '선진~한대',
    country: 'CN',
    yearRange: '~ 220',
    description: '시경(詩經)·초사(楚辭)에서 한대 악부(樂府)까지. 한시의 발원기.',
    matchPeriods: ['선진', '한', '진', '서한', '동한'],
  },
  {
    slug: 'wei-jin',
    label: '위진남북조',
    country: 'CN',
    yearRange: '220 ~ 589',
    description: '건안풍골(建安風骨)과 도연명(陶淵明)의 전원시. 율시(律詩) 형식이 다듬어지는 시기.',
    matchPeriods: ['위', '진', '남북조', '동진', '서진', '송', '제', '양', '진(陳)', '북위', '북제', '북주'],
  },
  {
    slug: 'tang',
    label: '당대',
    country: 'CN',
    yearRange: '618 ~ 907',
    description: '한시의 황금기. 이백·두보·왕유 등 시 4만여 수 수록.',
    matchPeriods: ['당', '초당', '성당', '중당', '만당'],
  },
  {
    slug: 'song',
    label: '송대',
    country: 'CN',
    yearRange: '960 ~ 1279',
    description: '소식(蘇軾)·육유(陸游) 등의 송시(宋詩). 사(詞) 문학 융성.',
    matchPeriods: ['송', '북송', '남송'],
  },
  {
    slug: 'ming-qing',
    label: '명청',
    country: 'CN',
    yearRange: '1368 ~ 1912',
    description: '복고운동과 성령파(性靈派). 청대 학술시(學術詩)와 손수의 당시삼백수 편찬.',
    matchPeriods: ['원', '명', '청'],
  },
];

export const KR_ERAS: EraDefinition[] = [
  {
    slug: 'ancient',
    label: '고대~통일신라',
    country: 'KR',
    yearRange: '~ 935',
    description: '을지문덕·최치원 등 한반도 한시 발원기. 신라 향가 한역(漢譯)도 포함.',
    matchPeriods: ['고구려', '백제', '신라', '통일신라', '신라 말'],
  },
  {
    slug: 'goryeo',
    label: '고려',
    country: 'KR',
    yearRange: '918 ~ 1392',
    description: '정지상·이규보·이제현 등. 한국 한시가 독자적 미학을 구축한 시기.',
    matchPeriods: ['고려', '고려 전기', '고려 중기', '고려 후기', '고려 말', '고려 말~조선 초'],
  },
  {
    slug: 'joseon-early',
    label: '조선 전기',
    country: 'KR',
    yearRange: '1392 ~ 1567',
    description: '서거정·김종직 등 관각문학(館閣文學). 사림파(士林派)의 등장.',
    matchPeriods: ['조선 전기'],
  },
  {
    slug: 'joseon-mid',
    label: '조선 중기',
    country: 'KR',
    yearRange: '1567 ~ 1724',
    description: '이이·이황·허난설헌·정철. 임진왜란·병자호란을 거친 시대 정신.',
    matchPeriods: ['조선 중기', '조선 전기~후기'],
  },
  {
    slug: 'joseon-late',
    label: '조선 후기',
    country: 'KR',
    yearRange: '1724 ~ 1894',
    description: '실학파·북학파 시인들. 정약용·김삿갓·신위 등.',
    matchPeriods: ['조선 후기', '조선 중기~후기'],
  },
  {
    slug: 'modern',
    label: '근대',
    country: 'KR',
    yearRange: '1894 ~',
    description: '개화기·일제강점기까지. 한시의 마지막 풍경.',
    matchPeriods: ['근대', '근대 전환기'],
  },
];

export function findEraBySlug(slug: string): EraDefinition | null {
  return [...CN_ERAS, ...KR_ERAS].find((e) => e.slug === slug) ?? null;
}
