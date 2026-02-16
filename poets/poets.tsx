
import { useEffect, useRef } from 'react';
import Navigation from '../home/components/Navigation';
import Footer from '../home/components/Footer';

export default function PoetsPage() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
        }
      });
    }, observerOptions);

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=ancient%20chinese%20poets%20writing%20calligraphy%20in%20traditional%20study%20room%20with%20scrolls%20and%20ink%20brushes%2C%20classical%20scholarly%20atmosphere%20with%20warm%20golden%20lighting%2C%20traditional%20chinese%20painting%20aesthetic%2C%20cultural%20heritage%20theme%20with%20elegant%20composition&width=1920&height=1080&seq=poets001&orientation=landscape"
            alt="Tang Dynasty Poets"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-8">
          <h1 
            className="text-9xl font-bold mb-6"
            style={{ fontFamily: "'adobe-fangsong-std', serif" }}
          >
            當詩人
          </h1>
          <p className="text-2xl font-light max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif", lineHeight: '1.9' }}>
            중국 역사상 가장 화려하고 국제적인 문화를 꽃 피웠던 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>唐</span>, 하지만 그에 못지 않게 잦은 변란과 역사적 변고 속에서 당대의 시인들은 정신적 도피처이자 현실에 대한 처절한 절규로 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>詩</span>를 선택했다.
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section 
        ref={(el) => sectionsRef.current[0] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-xl text-gray-700 leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
              명나라 고병<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(高棅)</span>의 분류법에 따라 당나라 시의 역사를 <strong>초당, 성당, 중당, 만당</strong>의 네 시기로 나누어,<br />
              그 시대를 품미한 시인들과 그들의 삶을 따라가 본다.
            </p>
          </div>
        </div>
      </section>

      {/* Early Tang Section */}
      <section 
        ref={(el) => sectionsRef.current[1] = el}
        className="fade-in-section py-16 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-4">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                    01
                  </span>
                </div>
                <h2 
                  className="text-6xl font-bold mb-3"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}
                >
                  初唐
                </h2>
                <p className="text-2xl text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  초당 (618~712)
                </p>
                <p className="text-xl text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  새로운 형식을 찾아서
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-6">
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                당나라 건국 초기, 문단은 여전히 남북조 시대의 화려하지만 내용이 빈약한 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>궁체시(宮體詩)</span>가 지배하고 있었다. 초당의 시인들은 이러한 유약함을 버리고 시에 '뼈대(기골)'를 세우기 시작했다.
              </p>

              {/* 왕발 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center">
                      <span className="text-4xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>王勃</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                      王勃 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>왕발</span>
                    </h3>
                    <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      6세에 글을 지은 신동이자 <strong>'초당사걸(初唐四傑)'</strong>의 으뜸. 20대 후반에 요절했으나, 그의 천재성은 강렬한 흔적을 남겼다.
                    </p>
                    <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl mb-1" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《登王閣序》</p>
                      <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                        "지는 노을은 외로운 오리 한 마리와 나란히 날고<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(落霞與孤鶩齊飛)</span>..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 진자앙 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center">
                      <span className="text-3xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>陳子昂</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                      陳子昂 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>진자앙</span>
                    </h3>
                    <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      "한나라와 위나라의 품골로 돌아가자"고 외치며 복고주의를 제창했다. 그의 등장은 성당 시의 황금기를 여는 전주곡이었다.
                    </p>
                    <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl mb-1" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《登幽州臺歌》</p>
                      <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                        광활한 시공간 속 인간의 고독을 노래한 짧지만 웅장한 시이다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 장약허 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center">
                      <span className="text-3xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>張若虛</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                      張若虛 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>장약허</span>
                    </h3>
                    <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      평생 단 두 편의 시만 남겼으나, 그중 한 편으로 당나라 시 전체를 압도했다는 평가를 받는다.
                    </p>
                    <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl mb-1" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《春江花月夜》</p>
                      <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                        달, 강, 꽃, 밤을 소재로 인생의 무상함과 우주의 영원함을 절묘하게 엮어냈다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 초당사걸 */}
              <div className="bg-gradient-to-r from-amber-50 to-white rounded-xl p-6 border-l-4 border-amber-600">
                <h4 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#8B4513' }}>
                  <i className="ri-team-line"></i>
                  시인들의 관계: 초당사걸<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(初唐四傑)</span>
                </h4>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>王勃, 楊炯, 盧照鄰, 駱賓王</span> 네 사람을 일컫는다. 이들은 귀족 중심의 문학 품토에서 벗어나 하급 관리로서 겪는 현실과 기개를 시에 담았다. 서로 경쟁하면서도 당나라 시의 엄격한 형식(근체시)을 정착시키는 데 함께 기여했다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High Tang Section */}
      <section 
        ref={(el) => sectionsRef.current[2] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-4">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                    02
                  </span>
                </div>
                <h2 
                  className="text-6xl font-bold mb-3"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}
                >
                  盛唐
                </h2>
                <p className="text-2xl text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  성당 (713~765)
                </p>
                <p className="text-xl text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  시의 황금시대
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-6">
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                당 현종의 '개원의 치'로 국력은 정점에 달했고, 과거 제도의 정착으로 수많은 인재가 배출되었다. 그러나 시대의 끝자락에 터진 <strong>'안사의 난(755)'</strong>은 시인들의 운명을 송두리째 바꿔놓았다.
              </p>

              {/* 이백 */}
              <div className="bg-gradient-to-br from-red-50 to-amber-50 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-amber-200 to-red-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-5xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>李白</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-4xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                        李白
                      </h3>
                      <span className="px-3 py-1 bg-red-600 text-white rounded-full text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                        詩仙
                      </span>
                    </div>
                    <p className="text-xl text-gray-600 mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      이백 - 시선(詩仙)
                    </p>
                    <p className="text-gray-800 mb-4" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      하늘에서 유배 온 신선. 술과 달, 그림자를 벗 삼아 거침없는 낭만을 노래했다.
                    </p>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                      <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《將進酒》, 《望廬山瀑布》, 《靜夜思》</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 두보 */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-slate-300 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-5xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C5282' }}>杜甫</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-4xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C5282' }}>
                        杜甫
                      </h3>
                      <span className="px-3 py-1 bg-slate-600 text-white rounded-full text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                        詩聖
                      </span>
                    </div>
                    <p className="text-xl text-gray-600 mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      두보 - 시성(詩聖)
                    </p>
                    <p className="text-gray-800 mb-4" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      평생 가난과 전란 속에 살았던 현실주의자. 나라를 걱정하고 백성의 고통을 대변했다.
                    </p>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-slate-500">
                      <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《春望》, 《登高》, 《江村》</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 왕유 */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-green-200 to-teal-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-5xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2F855A' }}>王維</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-4xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2F855A' }}>
                        王維
                      </h3>
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                        詩佛
                      </span>
                    </div>
                    <p className="text-xl text-gray-600 mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      왕유 - 시불(詩佛)
                    </p>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      시인이자 화가. "시 속에 그림이 있고<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(詩中有畫)</span>, 그림 속에 시가 있다<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(畫中有詩)</span>"는 평을 듣는다. 불교에 심취해 '시불(詩佛)'로 불린다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 안사의 난 */}
              <div className="bg-red-50 rounded-xl p-6 border-l-4 border-red-600">
                <h4 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                  <i className="ri-sword-line"></i>
                  역사적 사건: 안사의 난<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(安史之亂)</span>
                </h4>
                <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  당나라를 멸망 직전으로 몰고 간 이 반란은 시의 색깔을 바꾸었다.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      <strong>이백</strong>은 반란군 연루 의혹으로 유배를 가는 고초를 겪었다.
                    </p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      <strong>두보</strong>는 포로로 잡히거나 가족과 생이별하며 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《春望》</span>("나라는 깨어졌으나 산하는 그대로인데...") 같은 피눈물 나는 걸작을 남겼다.
                    </p>
                  </li>
                </ul>
              </div>

              {/* 이백과 두보 */}
              <div className="bg-gradient-to-r from-red-50 via-amber-50 to-slate-50 rounded-xl p-6 border-l-4 border-amber-600">
                <h4 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#92400E' }}>
                  <i className="ri-heart-line"></i>
                  시인들의 관계: 이백과 두보
                </h4>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  중국 문학사에서 가장 위대한 만남이다. 44세의 이백과 33세의 무명 시인 두보는 낙양에서 만나 짧은 여행을 함께했다. 자유분방한 이백에게 두보는 깊은 감명을 받았고, 평생 이백을 그리워하는 시를 썼다. (반면 이백이 두보에게 쓴 시는 상대적으로 적다.)
                </p>
              </div>

              <div className="rounded-xl overflow-hidden shadow-md">
                <img
                  src="https://readdy.ai/api/search-image?query=two%20ancient%20chinese%20poets%20li%20bai%20and%20du%20fu%20meeting%20and%20traveling%20together%20in%20classical%20landscape%2C%20traditional%20chinese%20painting%20style%2C%20warm%20friendship%20atmosphere%2C%20historical%20cultural%20scene%20with%20mountains%20and%20rivers&width=1200&height=600&seq=poets002&orientation=landscape"
                  alt="Li Bai and Du Fu"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Tang Section */}
      <section 
        ref={(el) => sectionsRef.current[3] = el}
        className="fade-in-section py-16 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-4">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                    03
                  </span>
                </div>
                <h2 
                  className="text-6xl font-bold mb-3"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}
                >
                  中唐
                </h2>
                <p className="text-2xl text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  중당 (766~835)
                </p>
                <p className="text-xl text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  변화와 사회 비판
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-6">
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                전란 후 국운은 기울었고 사회 모순은 심해졌다. 시인들은 성당의 웅장함을 흉내 내기보다, 아주 쉬운 언어로 사회를 고발하거나 반대로 아주 기이한 표현을 쓰는 쪽으로 갈라졌다.
              </p>

              {/* 백거이 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      <span className="text-3xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>白居易</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                      白居易 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>백거이</span>
                    </h3>
                    <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      "글을 모르는 노파도 이해할 수 있게 썼다"는 일화가 있을 정도로 쉬운 시를 추구했다. 신악부 운동을 통해 부패한 정치를 비판했다.
                    </p>
                    <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-slate-500">
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>
                        《長恨歌》(현종과 양귀비의 사랑), 《琵琶行》
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 한유 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      <span className="text-4xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>韓愈</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                      韓愈 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>한유</span>
                    </h3>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      "문장은 모름지기 선진(先秦)과 양한(兩漢) 시대로 돌아가야 한다"며 고문 부흥 운동을 이끌었다. 시에서도 철학적이고 산문적인 기풍을 도입했다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 이하 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center">
                      <span className="text-4xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#57534E' }}>李賀</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#57534E' }}>
                        李賀
                      </h3>
                      <span className="px-3 py-1 bg-stone-600 text-white rounded-full text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                        詩鬼
                      </span>
                    </div>
                    <p className="text-xl text-gray-600 mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      이하 - 시귀(詩鬼)
                    </p>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      27세에 요절한 천재. 귀신, 죽음, 환상 등 기괴하고 탐미적인 시어들을 구사했다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 원백과 한유-유종원 */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border-l-4 border-slate-600">
                <h4 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                  <i className="ri-team-line"></i>
                  시인들의 관계
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                      元白(원백)
                    </h5>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>元稹</span>과 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>白居易</span>: '원백'이라 불리며 평생의 지기였다. 서로 좌천되어 멀리 떨어져 있을 때 주고받은 시들은 애절한 우정의 대명사이다.
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                      韓愈와 柳宗元
                    </h5>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      정치적 개혁을 꿈꾸다 함께 좌천되었지만, 문학적으로 서로를 격려하며 고문 운동을 완성한 동지이다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Late Tang Section */}
      <section 
        ref={(el) => sectionsRef.current[4] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-4">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5568' }}>
                    04
                  </span>
                </div>
                <h2 
                  className="text-6xl font-bold mb-3"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5568' }}
                >
                  晩唐
                </h2>
                <p className="text-2xl text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  만당 (836~907)
                </p>
                <p className="text-xl text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  황혼의 미학
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-6">
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                당나라의 몰락이 가속화되던 시기이다. 시인들은 거창한 구국(救國)의 이념보다는 개인의 내면, 과거에 대한 회상, 퇴폐적이고 감상적인 미학에 빠져들었다.
              </p>

              {/* 이상은 */}
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <span className="text-3xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5568' }}>李商隱</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5568' }}>
                      李商隱 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>이상은</span>
                    </h3>
                    <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      만당 최고의 시인. 당쟁(우이당쟁)의 틈바구니에서 불우한 관직 생활을 했다. 그의 시는 화려하지만 난해하고, 몽환적인 사랑을 다룬 '무제(無題)' 시가 유명하다.
                    </p>
                    <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-gray-500">
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《錦瑟》, 《夜雨寄北》</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 두목 */}
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5568' }}>杜牧</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5568' }}>
                      杜牧 <span className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>두목</span>
                    </h3>
                    <p className="text-gray-800 mb-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      호방하고 품류를 즐겼던 시인으로, 역사적 사건을 재해석하는 영사(詠史)시에 능했다.
                    </p>
                    <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-gray-500">
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>대표작</p>
                      <p className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《江南春》, 《山行》</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 소이두 */}
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border-l-4 border-gray-600">
                <h4 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5568' }}>
                  <i className="ri-star-line"></i>
                  시인들의 관계: 소이두<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(小李杜)</span>
                </h4>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  성당 시대의 큰 별 '이백과 두보<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(李杜)</span>'에 비견하여, 만당의 <strong>이상은<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(李)</span>과 두목<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(杜)</span></strong>을 합쳐 '소이두'라 부른다. 전성기의 기백은 사라졌지만, 섬세하고 감각적인 시풍으로 당나라 시의 마지막 불꽃을 태웠다는 평가를 받는다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conclusion Section */}
      <section 
        ref={(el) => sectionsRef.current[5] = el}
        className="fade-in-section py-16 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <div className="sticky top-24">
                <h2 
                  className="text-5xl font-bold mb-3"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}
                >
                  後代影響
                </h2>
                <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  후대에 미친 영향과 평가
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-6">
              {/* 송나라 이후의 평가 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                  <i className="ri-book-open-line"></i>
                  송나라 이후의 평가
                </h3>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  후대 사람들은 당나라 시<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(唐詩)</span>를 '<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>情(정, 감정)</span>'이 위주가 된 시, 송나라 시<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>(宋詩)</span>를 '<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>理(이, 이치)</span>'가 위주가 된 시로 구분하며, 서정시의 정점은 역시 당나라라고 평가했다.
                </p>
              </div>

              {/* 동아시아에 미친 영향 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                  <i className="ri-global-line"></i>
                  동아시아에 미친 영향
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                      한국
                    </h4>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      신라의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>崔致遠(최치원)</span>부터 고려, 조선의 선비들에 이르기까지, 시를 짓는다는 것은 곧 당나라 시를 배운다는 것을 의미했다. 특히 두보의 시는 언해(한글 번역)되어 교과서처럼 쓰였다.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                      일본
                    </h4>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      헤이안 시대부터 당나라 시는 귀족들의 필수 교양이었으며, 백거이의 시는 일본 문학(겐지모노가타리 등)에 지대한 영향을 미쳤다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 마무리 */}
              <div className="bg-gradient-to-r from-amber-50 to-red-50 rounded-xl p-6 border-l-4 border-amber-600">
                <p className="text-xl text-gray-800 text-center leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif", lineHeight: '1.8' }}>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>當詩三百首</span>에 담긴 이별의 아픔, 권력 무상, 자연에 대한 경외는<br />
                  천 년이 지난 오늘날 현대인의 마음에도 깊은 울림을 준다.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden shadow-md">
                <img
                  src="https://readdy.ai/api/search-image?query=ancient%20chinese%20poetry%20manuscript%20with%20beautiful%20calligraphy%20and%20traditional%20scrolls%2C%20cultural%20heritage%20preservation%20scene%2C%20warm%20nostalgic%20lighting%2C%20classical%20aesthetic%20with%20historical%20atmosphere&width=1200&height=600&seq=poets003&orientation=landscape"
                  alt="Tang Poetry Legacy"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .fade-in-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fade-in-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
