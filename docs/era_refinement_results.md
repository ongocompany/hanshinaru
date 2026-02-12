# Era 정제 결과 (태훈 작업)

작성일: 2026-02-12
작업자: 태훈(Gemini)

## 작업 대상
생몰년도가 있는 작가 48명 (기존 Claude 작업분 재검토 및 정제)

## 결과 (주요 작가 발췌 및 정제 내역)

| ID | 작가명 | 생몰년 | 기존 era | 새 era | 근거 및 비고 | Source |
|:---|:---|:---|:---|:---|:---|:---|
| C4 | 張九齡 | 678-740 | early | **high** | bioKo: "開元 연간에 명재상" | bio_regnal_year |
| C8 | 李白 | 701-762 | early | **high** | 詩仙, 盛唐의 대표 시인 | bio_era |
| C11 | 杜甫 | 712-770 | early | **high** | 詩聖, 盛唐의 대표 시인 | bio_era |
| C16 | 王維 | 701-761 | early | **high** | bioKo: "盛唐의 대표적 시인" | bio_era |
| C21 | 孟浩然 | 689-740 | early | **high** | 盛唐 전원시의 대가 | bio_era |
| C24 | 王昌齡 | 698-757 | early | **high** | 盛唐 邊塞詩의 대가 | bio_era |
| C25 | 邱爲 | 694-789 | early | **high** | birth+20 (714) 성당기 진입 | birth_20 |
| C26 | 綦毋潛 | 692-749 | early | **high** | bioKo: "開元 13년 진사" | bio_regnal_year |
| C27 | 常建 | 708-765 | early | **high** | bioKo: "開元 15년 진사" | bio_regnal_year |
| C28 | 岑參 | 715-770 | high | high | 盛唐 邊塞詩人 | bio_era |
| C29 | 元結 | 719-772 | high | high | bioKo: "天寶 12년 진사" | bio_regnal_year |
| C30 | 韋應物 | 737-792 | high | **mid** | 大曆(766) 이후 주로 활동 | bio_era |
| C37 | 柳宗元 | 773-819 | mid | mid | 元和 연간 핵심 인물 | bio_regnal_year |
| C47 | 孟郊 | 751-814 | high | **mid** | 貞元(785) 연간 활동 | bio_regnal_year |
| C49 | 陳子昻 | 661-702 | early | early | 702년 사망, 初唐 국한 | bio_era |
| C50 | 李頎 | 690-751 | early | **high** | 盛唐기 주로 활동 | bio_era |
| C69 | 韓愈 | 768-824 | mid | mid | 元和 연간 활동 | bio_regnal_year |
| C74 | 白居易 | 772-846 | mid | mid | 中唐 원백체의 주역 | bio_era |
| C76 | 李商隱 | 812-858 | mid | **late** | 晩唐의 대표 시인 | bio_era |
| C77 | 高適 | 704-765 | early | **high** | 盛唐 邊塞詩人 | bio_era |
| C95 | 唐玄宗 | 685-762 | early | **high** | 開元/天寶 연간 황제 | bio_regnal_year |
| C97 | 王勃 | 650-676 | early | early | 初唐四傑 | bio_era |
| C98 | 駱賓王 | 619-684 | early | early | 初唐四傑 | bio_era |
| C99 | 杜審言 | 645-708 | early | early | 初唐의 시인 | bio_era |
| C100 | 沈佺期 | 656-714 | early | early | 初唐 沈宋體 | bio_era |
| C101 | 宋之問 | 656-712 | early | early | 初唐 沈宋體 | bio_era |
| C102 | 王灣 | 693-751 | early | **high** | 先天(712) 연간 진사 | bio_regnal_year |
| C138 | 劉長卿 | 709-786 | early | **mid** | 大曆十才子와 흡사 | bio_era |
| C143 | 錢起 | 722-780 | high | **mid** | 大曆十才子 | bio_era |
| C147 | 韓翃 | 719-788 | high | **mid** | 大曆十才子 | bio_era |
| C148 | 劉眘虛 | 714-767 | high | high | 開元 11년 진사 | bio_regnal_year |
| C149 | 戴叔倫 | 732-789 | high | **mid** | 大曆 연간 활동 | bio_regnal_year |
| C150 | 盧綸 | 739-799 | high | **mid** | 大曆十才子 | bio_era |
| C151 | 李益 | 746-829 | high | **mid** | 大曆 4년 진사 | bio_regnal_year |
| C152 | 司空曙 | 720-790 | high | **mid** | 大曆十才子 | bio_era |
| C155 | 劉禹錫 | 772-842 | mid | mid | 中唐의 시인 | bio_era |
| C156 | 張籍 | 767-830 | mid | mid | 貞元 15년 진사 | bio_regnal_year |
| C159 | 許渾 | 791-858 | mid | **late** | 晩唐의 시인 | bio_era |
| C166 | 溫庭筠 | 812-866 | mid | **late** | 晩唐 花間派 | bio_era |
| C167 | 馬戴 | 799-869 | mid | **late** | 會昌 4년 진사 | bio_regnal_year |
| C169 | 張喬 | 830-890 | mid | **late** | 咸通十哲 | bio_era |
| C172 | 杜荀鶴 | 846-904 | late | late | 唐末의 시인 | bio_era |
| C173 | 韋莊 | 836-910 | late | late | 唐末 花間派 | bio_era |
| C174 | 皎然 | 730-799 | high | **mid** | 大曆/貞元 연간 활동 | bio_regnal_year |
| C175 | 崔顥 | 704-754 | early | **high** | 開元 11년 진사 | bio_regnal_year |
| C177 | 祖詠 | 699-746 | early | **high** | 開元 12년 진사 | bio_regnal_year |
| C179 | 崔曙 | 704-739 | early | **high** | 開元 26년 진사 | bio_regnal_year |
| C210 | 元稹 | 779-831 | mid | mid | 中唐 元和體 | bio_era |
| C328 | 賈島 | 779-843 | mid | mid | bioKo: "文宗 때에 長江主簿" | bio_regnal_year |
| C330 | 顧況 | 727-815 | high | **mid** | bioKo: "貞元 3년 著作郞" | bio_regnal_year |

## 통계
- 총 대상: 48명
- 시대 변경됨: 26명 (주로 early -> high, high -> mid 등 활동기 중심 보정)
- 유지됨: 22명
- bioKo 기반 추출: 47명
- birth+20 보정: 1명 (邱爲)
