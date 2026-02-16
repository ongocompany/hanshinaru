
import { useEffect, useRef } from 'react';
import Navigation from '../home/components/Navigation';
import Footer from '../home/components/Footer';

export default function HistoryPage() {
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
            src="https://readdy.ai/api/search-image?query=majestic%20ancient%20chinese%20tang%20dynasty%20imperial%20palace%20with%20grand%20architecture%20golden%20roofs%20and%20red%20pillars%20under%20dramatic%20sunset%20sky%2C%20cinematic%20wide%20angle%20view%2C%20historical%20epic%20atmosphere%2C%20rich%20warm%20colors%20with%20golden%20and%20crimson%20tones%2C%20misty%20mountains%20in%20background%2C%20traditional%20chinese%20painting%20aesthetic&width=1920&height=1080&seq=tanghistory001&orientation=landscape"
            alt="Tang Dynasty"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-8">
          <h1 
            className="text-8xl font-bold mb-6"
            style={{ fontFamily: "'adobe-fangsong-std', serif" }}
          >
            唐朝史
          </h1>
          <p className="text-6xl mb-4" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            당나라 역사
          </p>
          <p className="text-3xl font-light tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
            The History of Tang Dynasty
          </p>
          <div className="mt-8 text-xl" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            618 - 907
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section 
        ref={(el) => sectionsRef.current[0] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <h2 
                className="text-6xl font-bold mb-4 sticky top-24"
                style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#D4AF37' }}
              >
                概要
              </h2>
              <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                Overview
              </p>
            </div>
            <div className="col-span-8">
              <div className="space-y-6 text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <p>
                  <strong className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>當(唐)</strong>은 수나라(隋)를 이어 중국을 지배했던 왕조로, 618년 당 고조 이연에 의해 건국되어 907년 애종이 주전충에게 선양할 때까지 <strong>289년간</strong> 존속했다. 수도는 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>長安(장안)</strong>, 현재의 시안이었으며, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>洛陽(낙양)</span>을 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>東都(동도)</span>로 삼아 중시했다.
                </p>
                <p>
                  당나라는 <strong>중국 제국 역사의 황금기</strong>로 평가받는다. 정치적으로는 율령 체제를 완성하여 중앙 집권적인 통치 기구를 확립했고, 경제적으로는 균전제와 조용조 제도를 통해 안정을 꾀하다가 후기에는 양세법을 도입하여 사회 변화에 대응했다.
                </p>
                <p>
                  문화적으로는 개방적이고 국제적인 성격을 띠어 시(詩), 서예, 회화 등 예술이 크게 융성했으며, 특히 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>唐詩(당시)</strong>는 중국 문학의 정점으로 꼽힌다. 대외적으로는 돌궐, 토번, 고구려 등 주변국과 활발히 교류하거나 경쟁하며 동아시아 문화권의 기틀을 마련했다.
                </p>
              </div>
              
              <div className="mt-12 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=detailed%20historical%20map%20of%20tang%20dynasty%20china%20at%20its%20peak%20showing%20maximum%20territorial%20extent%20with%20provinces%20cities%20and%20trade%20routes%2C%20cartographic%20style%20with%20traditional%20chinese%20aesthetic%2C%20warm%20parchment%20colors%2C%20clear%20geographical%20labels%20in%20classical%20style&width=1200&height=700&seq=tanghistory002&orientation=landscape"
                  alt="Tang Dynasty Territory Map"
                  className="w-full h-auto"
                />
                <div className="bg-gray-50 px-6 py-4">
                  <p className="text-sm text-gray-600 text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    당나라 전성기 영토 지도 (최대 강역)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Period 1: Founding */}
      <section 
        ref={(el) => sectionsRef.current[1] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#D4AF37' }}>
                    01
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  建國與初唐
                </h2>
                <p className="text-xl text-gray-600 mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  건국과 초당
                </p>
                <p className="text-lg text-gray-500" style={{ fontFamily: "'Cinzel', serif" }}>
                  Founding and Early Tang
                </p>
                <div className="mt-6 text-base text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  618 - 712
                </div>
              </div>
            </div>
            <div className="col-span-8 space-y-12">
              {/* 당의 건국 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#D4AF37' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  당의 건국 (618)
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  수나라 양제의 폭정과 고구려 원정 실패로 인한 국력 소모로 각지에서 반란이 일어났다. 태원 유수였던 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李淵(이연, 당 고조)</strong>은 차남 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李世民(이세민)</span> 등의 보좌를 받아 거병하여 장안을 점령하고, 618년 수 공제로부터 선양을 받아 당을 건국했다.
                </p>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=emperor%20li%20yuan%20founding%20tang%20dynasty%20in%20grand%20throne%20room%20with%20officials%20bowing%2C%20traditional%20chinese%20historical%20painting%20style%2C%20solemn%20ceremonial%20atmosphere%2C%20rich%20imperial%20colors%20with%20gold%20and%20red%2C%20detailed%20period%20costumes%20and%20architecture&width=900&height=600&seq=tanghistory003&orientation=landscape"
                    alt="Tang Founding"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 현무문의 변 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#D4AF37' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  현무문의 변 (626)
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  통일 과정에서 큰 공을 세운 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>秦王(진왕)</span> 이세민과 황태자 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李建成(이건성)</span> 사이의 권력 투쟁이 격화되었다. 626년 이세민은 현무문에서 형 이건성과 동생 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李元吉(이원길)</span>을 살해하고 권력을 장악했다(현무문의 변). 이연은 곧 퇴위하고 이세민이 제2대 황제 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>太宗(태종)</strong>으로 즉위했다.
                </p>
              </div>

              {/* 정관의 치 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#D4AF37' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>貞觀之治</span> (정관의 치)
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  태종은 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>魏徵(위징)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>房玄齡(방현령)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>杜如晦(두여회)</span> 등 유능한 인재를 등용하고 간언을 받아들여 정치를 쇄신했다. 율령 격식을 정비하여 3성 6부제를 확립하고, 균전제와 부병제를 실시하여 제국의 기틀을 다졌다. 대외적으로는 동돌궐을 정벌하여 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>'天可汗(천가한)'</strong>이라는 칭호를 얻었다.
                </p>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=emperor%20taizong%20of%20tang%20dynasty%20in%20imperial%20study%20room%20consulting%20with%20wise%20ministers%20and%20scholars%2C%20classical%20chinese%20painting%20style%2C%20harmonious%20governance%20scene%2C%20warm%20scholarly%20atmosphere%2C%20traditional%20architecture%20with%20scrolls%20and%20books&width=900&height=600&seq=tanghistory004&orientation=landscape"
                    alt="Reign of Taizong"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 고종의 통치 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#D4AF37' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  고종의 통치
                </h3>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  태종의 뒤를 이은 고종은 서돌궐을 평정하고, 신라와 연합하여 백제(660)와 고구려(668)를 멸망시키는 등 당나라의 영토를 최대로 확장했다. 그러나 말년에는 황후인 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>武則天(무측천, 측천무후)</strong>이 실권을 장악하기 시작했다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Period 2: Wu Zhou and High Tang */}
      <section 
        ref={(el) => sectionsRef.current[2] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                    02
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  武周與盛唐
                </h2>
                <p className="text-xl text-gray-600 mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  무주 혁명과 성당
                </p>
                <p className="text-lg text-gray-500" style={{ fontFamily: "'Cinzel', serif" }}>
                  Wu Zhou and High Tang
                </p>
                <div className="mt-6 text-base text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  690 - 765
                </div>
              </div>
            </div>
            <div className="col-span-8 space-y-12">
              {/* 측천무후의 집권 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  측천무후의 집권
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  고종 사후 중종과 예종을 차례로 폐위시킨 무측천은 690년 스스로 황제에 올라 국호를 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>周(주)</strong>로 고쳤다(무주 혁명). 그녀는 <strong>중국 역사상 유일한 여황제</strong>로, 공포 정치를 펼치기도 했으나 과거제를 강화하여 문벌 귀족 세력을 억누르고 신진 관료를 등용하여 왕권을 강화했다.
                </p>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=empress%20wu%20zetian%20on%20imperial%20throne%20in%20magnificent%20palace%20hall%2C%20powerful%20and%20authoritative%20presence%2C%20traditional%20chinese%20historical%20painting%20style%2C%20dramatic%20lighting%20with%20golden%20accents%2C%20ornate%20imperial%20regalia%20and%20architecture&width=900&height=600&seq=tanghistory005&orientation=landscape"
                    alt="Empress Wu Zetian"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 개원의 치 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>開元之治</span> (개원의 치)
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  712년 예종의 아들 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李隆基(이융기, 현종)</span>가 위황후 일파를 제거하고 즉위했다. 현종은 초기에 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>姚崇(요숭)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>宋璟(송경)</span> 등 명신을 기용하여 정치를 개혁하고, 부병제의 붕괴에 대응하여 모병제를 도입하는 등 국력을 크게 신장시켰다. 이 시기 당나라는 정치적 안정과 경제적 번영을 누리며 <strong>문화의 절정기</strong>를 맞이했다(성당, High Tang).
                </p>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=prosperous%20tang%20dynasty%20changan%20city%20street%20scene%20with%20merchants%20scholars%20and%20international%20traders%2C%20bustling%20marketplace%20atmosphere%2C%20vibrant%20colors%2C%20traditional%20chinese%20architecture%2C%20cosmopolitan%20golden%20age%20setting&width=900&height=600&seq=tanghistory006&orientation=landscape"
                    alt="Kaiyuan Era Prosperity"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Period 3: An Lushan Rebellion */}
      <section 
        ref={(el) => sectionsRef.current[3] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                    03
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  安史之亂與中唐
                </h2>
                <p className="text-xl text-gray-600 mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  안사의 난과 중당
                </p>
                <p className="text-lg text-gray-500" style={{ fontFamily: "'Cinzel', serif" }}>
                  An Lushan Rebellion
                </p>
                <div className="mt-6 text-base text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  755 - 835
                </div>
              </div>
            </div>
            <div className="col-span-8 space-y-12">
              {/* 안사의 난 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  안사의 난 (755~763)
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  현종 말기, 정치는 부패하고 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>楊貴妃(양귀비)</span> 일족이 권력을 전횡했다. 변방의 절도사 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>安祿山(안녹산)</strong>과 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>史思明(사사명)</strong>이 755년 반란을 일으켜 장안과 낙양이 함락되었다. 현종은 촉으로 피난을 갔고, 태자 숙종이 즉위하여 위구르의 도움을 받아 반란을 진압했다. 이 난으로 당나라는 쇠퇴의 길로 접어들었다.
                </p>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=dramatic%20battle%20scene%20of%20an%20lushan%20rebellion%20with%20tang%20dynasty%20soldiers%20and%20rebels%20fighting%2C%20chaotic%20warfare%20atmosphere%2C%20traditional%20chinese%20historical%20painting%20style%2C%20dark%20stormy%20skies%2C%20intense%20action%20and%20movement&width=900&height=600&seq=tanghistory007&orientation=landscape"
                    alt="An Lushan Rebellion"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 정치/사회적 변화 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  정치/사회적 변화
                </h3>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  안사의 난 이후 중앙 정부의 통제력이 약화되면서 지방의 절도사들이 독자적인 세력을 구축하는 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>藩鎭(번진)</strong>의 할거가 심화되었다. 또한 북방 민족의 압박으로 인구가 강남으로 이동하면서 강남 지역의 경제적 중요성이 커졌다.
                </p>
              </div>

              {/* 재정 위기와 개혁 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  재정 위기와 개혁
                </h3>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  전란으로 호구 파악이 불가능해져 기존의 조용조 체제가 붕괴되었다. 이에 덕종 때인 780년, 재상 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>楊炎(양염)</span>의 건의로 자산을 기준으로 세금을 걷는 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>兩稅法(양세법)</strong>을 시행하여 재정 위기를 타개하려 했다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Period 4: Late Tang and Fall */}
      <section 
        ref={(el) => sectionsRef.current[4] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    04
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  衰退與滅亡
                </h2>
                <p className="text-xl text-gray-600 mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  쇠퇴와 멸망
                </p>
                <p className="text-lg text-gray-500" style={{ fontFamily: "'Cinzel', serif" }}>
                  Late Tang and Fall
                </p>
                <div className="mt-6 text-base text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  836 - 907
                </div>
              </div>
            </div>
            <div className="col-span-8 space-y-12">
              {/* 원화 중흥 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>元和中興</span> (원화 중흥)
                </h3>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  헌종은 번진 세력을 무력으로 제압하고 중앙 집권을 회복하려 노력하여 일시적인 중흥을 이룩했다.
                </p>
              </div>

              {/* 정치적 혼란 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  정치적 혼란
                </h3>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  그러나 헌종 이후 환관들이 황제의 폐립에 관여할 정도로 권력이 비대해졌고(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>甘露之變</span>, 감로의 변), 조정 신료들은 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>牛李黨爭(우이당쟁)</strong>이라 불리는 붕당 싸움에 몰두하여 정치는 더욱 혼란해졌다.
                </p>
              </div>

              {/* 민란과 멸망 */}
              <div>
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  민란과 멸망
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  토지 겸병과 가혹한 세금으로 농민들의 삶이 피폐해지자, 875년 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>黃巢之亂(황소의 난)</strong>이 일어났다. 황소의 난은 당나라 전역을 휩쓸며 통치 기반을 완전히 무너뜨렸다. 결국 907년, 황소의 난 진압 과정에서 성장한 절도사 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>朱全忠(주전충)</span>이 애종을 폐위시키고 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>後梁(후량)</span>을 건국함으로써 당나라는 멸망했다.
                </p>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=peasant%20rebellion%20in%20late%20tang%20dynasty%20with%20farmers%20uprising%20against%20imperial%20forces%2C%20dramatic%20historical%20scene%2C%20traditional%20chinese%20painting%20style%2C%20turbulent%20atmosphere%20with%20smoke%20and%20chaos%2C%20muted%20earth%20tones&width=900&height=600&seq=tanghistory008&orientation=landscape"
                    alt="Huang Chao Rebellion"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Economy and Trade Section */}
      <section 
        ref={(el) => sectionsRef.current[5] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#D4AF37' }}
            >
              經濟與貿易
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Economy and Trade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* 농업과 수공업 */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-plant-line text-3xl" style={{ color: '#D4AF37' }}></i>
              </div>
              <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                농업과 수공업
              </h3>
              <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                화북 지방의 밭농사와 강남 지방의 벼농사가 발달했으며, 특히 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>茶(차)</span> 재배가 확산되어 대중적인 음료가 되었다. 수공업에서는 비단 직조 기술이 정교해졌고, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>唐三彩(당삼채)</span>와 같은 도자기 산업이 번영했다.
              </p>
            </div>

            {/* 상업과 도시 발달 */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-store-2-line text-3xl" style={{ color: '#D4AF37' }}></i>
              </div>
              <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                상업과 도시 발달
              </h3>
              <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                대운하를 통해 강남의 물자가 북쪽으로 운송되면서 상업이 활발해졌다. 장안과 낙양에는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>市廛(시전)</span>이 설치되어 엄격한 관리 하에 매매가 이루어졌으나, 후기에는 야시장도 등장했다.
              </p>
            </div>

            {/* 대외 무역 */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-ship-line text-3xl" style={{ color: '#D4AF37' }}></i>
              </div>
              <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                대외 무역
              </h3>
              <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                실크로드(육로)를 통해 서역의 상인들이 장안을 왕래하며 서역의 문물(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>胡風</span>, 호풍)을 전했다. 또한 해상 실크로드가 활성화되어 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>廣州(광저우)</span> 등에 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>市舶司(시박사)</span>가 설치되었다.
              </p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://readdy.ai/api/search-image?query=ancient%20silk%20road%20trade%20routes%20map%20showing%20tang%20dynasty%20land%20and%20maritime%20trade%20paths%20connecting%20china%20to%20central%20asia%20middle%20east%20and%20beyond%2C%20historical%20cartography%20style%2C%20warm%20vintage%20colors%2C%20detailed%20route%20markings&width=1200&height=600&seq=tanghistory009&orientation=landscape"
              alt="Silk Road Trade Routes"
              className="w-full h-auto"
            />
            <div className="bg-white px-6 py-4">
              <p className="text-sm text-gray-600 text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                당나라 대외 무역로 (육상 및 해상 실크로드)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutions Section */}
      <section 
        ref={(el) => sectionsRef.current[6] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}
            >
              制度與行政
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Institutions and Administration
            </p>
          </div>

          <div className="space-y-12">
            {/* 중앙 정치 제도 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                <i className="ri-government-line"></i>
                중앙 정치 제도
              </h3>
              <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <strong className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>三省六部制(3성 6부제)</strong>를 완비했다. <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>中書省(중서성)</span>(정책 입안), <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>門下省(문하성)</span>(심의 및 거부권), <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>尚書省(상서성)</span>(정책 집행)이 권력을 분담하고 견제했다. 상서성 아래에는 이(인사), 호(재정), 예(의례/교육), 병(군사), 형(사법), 공(토목)의 6부를 두어 행정 실무를 담당하게 했다.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 text-center">
                  <div className="text-5xl mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>中書省</div>
                  <p className="text-base text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>정책 입안</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center">
                  <div className="text-5xl mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>門下省</div>
                  <p className="text-base text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>심의 및 거부권</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center">
                  <div className="text-5xl mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>尚書省</div>
                  <p className="text-base text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>정책 집행</p>
                </div>
              </div>
            </div>

            {/* 관리 선발 제도 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                <i className="ri-book-open-line"></i>
                관리 선발 제도
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <strong className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>科擧制(과거제)</strong>가 정착되어 문벌 귀족 중심의 사회에서 능력 중심의 관료제 사회로 이행하는 계기가 되었다. 특히 시와 문장 실력을 중시하는 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>進士科(진사과)</strong>가 가장 권위 있었다.
              </p>
            </div>

            {/* 토지 및 조세 제도 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                <i className="ri-landscape-line"></i>
                토지 및 조세 제도
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>
                    均田制 (균전제)
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    성인 남자에게 토지를 지급하고, 죽으면 국가에 반납하게 한 제도.
                  </p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>
                    租庸調 (조용조)
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    균전제를 바탕으로 곡물(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>租</span>), 노동력(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>庸</span>), 직물(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>調</span>)을 납부하게 한 세금 제도.
                  </p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>
                    兩稅法 (양세법)
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    안사의 난 이후 균전제가 붕괴되자, 자산의 많고 적음에 따라 여름과 가을 두 번에 걸쳐 세금을 걷는 제도로 전환했다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Military Section */}
      <section 
        ref={(el) => sectionsRef.current[7] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}
            >
              軍事與征伐
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Military and Conquests
            </p>
          </div>

          <div className="space-y-12">
            {/* 군사 제도 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                군사 제도
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                초기에는 병농일치의 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>府兵制(부병제)</strong>를 실시하여, 평시에는 농사를 짓고 농한기에 훈련을 받으며, 전쟁 시 징집되었다. 그러나 균전제의 붕괴와 장기적인 변방 수비의 필요성으로 인해 직업 군인을 모집하는 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>募兵制(모병제)</strong>로 전환되었다. 이는 절도사가 사병(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>私兵</span>)을 양성하여 중앙 정부에 대항하는 원인이 되었다.
              </p>
            </div>

            {/* 주요 대외 관계 */}
            <div>
              <h3 className="text-4xl font-bold mb-8 text-center" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                주요 대외 관계
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    돌궐 (Turk)
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    태종 때 동돌궐을 정복하고 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>羈縻政策(기미정책)</span>(현지 족장을 통해 간접 통치)을 실시했다. 고종 때는 서돌궐을 멸망시켰다.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    토번 (Tibet)
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    티베트 고원의 강국으로 당과 화친과 대립을 반복했다. 태종 때 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>文成公主(문성공주)</span>가 토번의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>松贊干布(송첸캄포)</span>에게 시집가 불교와 당의 문화를 전했다.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    고구려/백제/신라
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    당은 고구려 원정에 실패한 후 신라와 연합(나당 연합)하여 백제와 고구려를 차례로 멸망시켰다. 이후 한반도 지배권을 두고 신라와 나당 전쟁을 벌였으나 패배하여 대동강 이남의 지배권을 신라에 넘겨주었다.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>都護府</span> (도호부)
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    정복한 지역을 다스리기 위해 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>安西(안서)</span>(서역), <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>安東(안동)</span>(고구려 옛 땅), <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>安南(안남)</span>(베트남), 안북, 단우, 북정 등 6도호부를 설치하여 통치했다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Successors and Impact Section */}
      <section 
        ref={(el) => sectionsRef.current[8] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}
            >
              後續王朝與影響
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Successors and Impact on Chinese History
            </p>
          </div>

          <div className="space-y-12">
            {/* 오대십국 시대 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#8B4513' }}>
                <i className="ri-time-line"></i>
                <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>五代十國</span> 시대
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                당 멸망 후 각지의 절도사들이 독립하여 5개의 왕조(중원)와 10개의 나라(지방)가 난립하는 분열기가 이어졌다. 이는 당나라 말기 번진 할거의 연장선이었다.
              </p>
            </div>

            {/* 제도적 유산 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#8B4513' }}>
                <i className="ri-building-line"></i>
                제도적 유산
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                당의 3성 6부제, 과거제, 주현제 등은 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>宋(송)</span>나라를 거쳐 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>明(명)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>淸(청)</span>에 이르기까지 중국 왕조 통치 체제의 기본 골격이 되었다. 특히 과거제는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>士大夫(사대부)</span> 계층을 형성하는 기반이 되었다.
              </p>
            </div>

            {/* 문화적 유산 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#8B4513' }}>
                <i className="ri-quill-pen-line"></i>
                문화적 유산
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李白(이백)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>杜甫(두보)</span>로 대표되는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>唐詩(당시)</span>는 중국 문학의 최고봉으로 후대에 끊임없이 애송되고 모방되었다. 불교의 토착화(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>禪宗</span>, 선종의 발달)와 유교, 도교의 조화는 중국 사상사의 중요한 흐름을 형성했다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* East Asia Impact Section */}
      <section 
        ref={(el) => sectionsRef.current[9] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}
            >
              東亞影響
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Impact on Korea and East Asia
            </p>
          </div>

          <div className="space-y-12">
            {/* 동아시아 문화권의 완성 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                동아시아 문화권의 완성
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                당의 율령, 유교, 불교, 한자는 한국(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>新羅(신라)</span>/<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>渤海(발해)</span>), 일본, 베트남 등에 전파되어 동아시아 공통의 문화를 형성했다.
              </p>
            </div>

            {/* 한국 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                <i className="ri-map-pin-line"></i>
                한국 (삼국 및 남북국 시대)
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    정치/군사
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    나당 연합과 나당 전쟁을 통해 신라의 삼국 통일 과정에 깊이 개입했다. 발해와는 초기 대립했으나 점차 교류하며 문물을 수용했다(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>渤海館</span>, 발해관).
                  </p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    문화 교류
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                    수많은 유학생(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>崔致遠(최치원)</span> 등)과 승려(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>慧超(혜초)</span> 등)가 당나라에 왕래하며 선진 문물을 수용했다. <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>新羅坊(신라방)</span>(거주지), <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>新羅所(신라소)</span>(관청), <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>新羅院(신라원)</span>(사찰) 등 신라인의 집단 거주지가 형성될 정도로 교류가 활발했다.
                  </p>
                </div>
              </div>
            </div>

            {/* 일본 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                <i className="ri-ship-2-line"></i>
                일본
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>遣唐使(견당사)</span>를 파견하여 당의 문물을 적극적으로 수입했다. 이를 바탕으로 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>大化改新(다이카 개신)</span>을 단행하여 율령 국가 체제를 정비하고, 하쿠호 문화와 덴표 문화를 꽃피웠다. <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>阿倍仲麻呂(아베 노 나카마로, 조형)</span> 같은 인물은 당의 관료로 활동하기도 했다.
              </p>
            </div>

            {/* 베트남 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#1E5631' }}>
                <i className="ri-compass-line"></i>
                베트남
              </h3>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>安南都護府(안남도호부)</span>가 설치되어 당의 직접 지배를 받았으며, 이 과정에서 중국의 제도와 문화가 깊이 이식되었다.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://readdy.ai/api/search-image?query=east%20asian%20cultural%20exchange%20map%20showing%20tang%20dynasty%20connections%20with%20korea%20japan%20vietnam%20through%20diplomatic%20missions%20trade%20routes%20and%20cultural%20transmission%2C%20historical%20cartography%20style%2C%20warm%20educational%20colors%2C%20clear%20route%20markings%20and%20labels&width=1200&height=600&seq=tanghistory010&orientation=landscape"
              alt="East Asian Cultural Exchange"
              className="w-full h-auto"
            />
            <div className="bg-white px-6 py-4">
              <p className="text-sm text-gray-600 text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                동아시아 문화권 교류도 (견당사, 신라방, 무역로 등)
              </p>
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
