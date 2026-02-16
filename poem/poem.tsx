import { useEffect, useRef } from 'react';
import Navigation from '../home/components/Navigation';
import Footer from '../home/components/Footer';

export default function PoemPage() {
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
            src="https://readdy.ai/api/search-image?query=ancient%20chinese%20scholar%20writing%20poetry%20with%20brush%20calligraphy%20in%20traditional%20study%20room%20with%20scrolls%20and%20moonlight%20through%20window%2C%20classical%20chinese%20painting%20aesthetic%2C%20serene%20contemplative%20atmosphere%2C%20warm%20candlelight%20and%20soft%20shadows%2C%20elegant%20minimalist%20composition&width=1920&height=1080&seq=tangpoem001&orientation=landscape"
            alt="Tang Poetry"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-8">
          <h1 
            className="text-8xl font-bold mb-8"
            style={{ fontFamily: "'adobe-fangsong-std', serif" }}
          >
            當詩
          </h1>
          <p className="text-2xl max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            형식미와 서정의 완벽한 조화
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section 
        ref={(el) => sectionsRef.current[0] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-800 text-center text-xl leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            당나라의 시가 천 년을 넘어 사랑받는 이유는 무엇일까? 위대한 시인들이 좋은 작품을 많이 남긴것도 이유이지만 당시대에 접어들어 그 감정을 담아내는 그릇(형식)이 완성되었기 때문이기도 하다.
          </p>
        </div>
      </section>

      {/* Section 1: Why Tang Poetry */}
      <section 
        ref={(el) => sectionsRef.current[1] = el}
        className="fade-in-section py-16 px-8"
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
                  爲何唐詩
                </h2>
                <p className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  왜 당나라 시인가?
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-8">
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                청나라 때 편찬된 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《全唐詩(전당시)》</strong>에는 무려 2,200여 명의 시인이 남긴 4만 8,900여 수의 시가 수록되어 있다. 양적으로도 방대하지만, 질적으로도 중국 문학의 정점이다.
              </p>
              <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                남북조 시대의 귀족적 유미주의와 북방 민족의 질박한 기상이 융합되었고, 과거 제도를 통해 시를 잘 짓는 것이 곧 출세의 길이었기에 전 계층이 시를 즐겼다. 당나라는 시가 곧 생활이자 스펙인 사회였다.
              </p>
              <div className="rounded-xl overflow-hidden shadow-md mt-8">
                <img
                  src="https://readdy.ai/api/search-image?query=ancient%20chinese%20imperial%20examination%20hall%20with%20scholars%20writing%20poetry%20and%20calligraphy%2C%20traditional%20architecture%20with%20rows%20of%20desks%2C%20solemn%20academic%20atmosphere%2C%20warm%20natural%20lighting%2C%20historical%20painting%20style%20with%20detailed%20period%20costumes&width=900&height=600&seq=tangpoem002&orientation=landscape"
                  alt="Imperial Examination"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Forms and Types */}
      <section 
        ref={(el) => sectionsRef.current[2] = el}
        className="fade-in-section py-16 px-8 bg-white"
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
                  詩之形態
                </h2>
                <p className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  시의 형태와 종류
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-12">
              <div>
                <p className="text-gray-800 mb-8" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                  당나라 시는 크게 형식의 제약이 적은 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>古體詩(고체시)</strong>와 엄격한 규칙을 따르는 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>近體詩(근체시)</strong>로 나뉜다. 당나라 시의 진정한 혁신은 바로 이 '근체시'의 완성에 있다.
                </p>

                <h3 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                  근체시: 음악이 된 언어
                </h3>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                  근체시는 글자 수(5언, 7언), 구절 수, 압운, 그리고 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>平仄(평측)</strong>이라는 성조 규칙을 철저히 지켜야 한다. 이것은 시를 눈으로 읽는 텍스트가 아니라, 귀로 듣는 음악으로 만들었다.
                </p>

                <div className="bg-gray-50 rounded-xl p-8 mb-8">
                  <h4 className="text-3xl font-bold mb-4" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                    平仄與四聲
                  </h4>
                  <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                    중국어는 높낮이가 있는 언어이다. 당나라 시인들은 이 소리의 높낮이를 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>平聲(평성)</strong>과 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>仄聲(측성)</strong>으로 나누어 배열함으로써 리듬감을 만들어냈다.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-6">
                      <h5 className="text-2xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>四聲 (사성)</h5>
                      <p className="text-gray-700 mb-4" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                        당시의 표준음인 중고음(中古音)에는 평(平), 상(上), 거(去), 입(入)의 네 가지 성조가 있었다.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                          <div>
                            <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>平聲(평성)</strong>: 평탄하고 길게 뻗는 소리. (음악의 멜로디와 여운 담당)
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <div>
                            <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>上聲(상성)</strong>: 처음은 낮았다가 끝이 올라가는 소리.
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                          <div>
                            <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>去聲(거성)</strong>: 높고 맑게 먼 곳으로 보내는 소리.
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                          <div>
                            <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>入聲(입성)</strong>: 'ㄱ, ㄹ, ㅂ(k, t, p)' 받침처럼 짧고 급하게 닫히는 소리. (음악의 비트와 리듬 담당)
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-8">
                  <h4 className="text-3xl font-bold mb-4" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                    韻書之活用
                  </h4>
                  <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                    이 복잡한 소리의 규칙을 지키기 위해 시인들은 '운서'라는 발음 사전을 달달 외워야 했다.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-6">
                      <h5 className="text-2xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>切韻</h5>
                      <p className="text-gray-600 text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>수나라 때 육법언이 편찬</p>
                    </div>
                    <div className="bg-white rounded-lg p-6">
                      <h5 className="text-2xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>唐韻</h5>
                      <p className="text-gray-600 text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>과거 시험의 표준 참고서</p>
                    </div>
                    <div className="bg-white rounded-lg p-6">
                      <h5 className="text-2xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>廣韻</h5>
                      <p className="text-gray-600 text-base" style={{ fontFamily: "'Noto Serif KR', serif" }}>송나라 때 집대성</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2-2: Jueju and Lushi */}
      <section 
        ref={(el) => sectionsRef.current[3] = el}
        className="fade-in-section py-16 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <h3 
                  className="text-4xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  絶句與律詩
                </h3>
                <p className="text-lg text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  근체시의 양대 산맥
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-10">
              <div className="bg-white rounded-xl p-8 shadow-md">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                  <span className="w-3 h-3 bg-current rounded-full"></span>
                  絶句 (절구)
                </h4>
                <p className="text-gray-800 mb-4" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                  기승전결(起承轉結)의 4구(행)로 이루어진 짧은 시.
                </p>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  <strong>특징:</strong> 순간의 감정을 포착하거나 여운을 남기는 데 탁월하다. (오언절구, 칠언절구)
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                  <span className="w-3 h-3 bg-current rounded-full"></span>
                  律詩 (율시)
                </h4>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                  8구(행)로 이루어진 정형시. 총 4개의 연구(聯句)로 구성된다.
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>首聯 (수련 - 1,2구)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px' }}>시상을 불러일으킨다.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>頷聯 (함련 - 3,4구)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px' }}>반드시 <strong>대구(對句)</strong>를 이뤄야 한다. (예: "하늘" vs "땅", "높다" vs "깊다")</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>頸聯 (경련 - 5,6구)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px' }}>역시 반드시 대구를 이뤄야 한다. 시의 주제가 심화되는 부분이다.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>尾聯 (미련 - 7,8구)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px' }}>시상을 마무리한다.</p>
                  </div>
                </div>
                <p className="text-gray-700 mt-6 italic" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  <strong>미학:</strong> 함련과 경련의 정교한 대구(Parallelism)는 언어 건축의 백미라 불린다. 두보가 이 형식의 완성자이다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md">
                <h4 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                  고체시와 악부
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>古體詩 (고체시)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      평측의 제약 없이 자유롭게 쓴 시. 이백의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《將進酒(장진주)》</span>처럼 호방한 기상을 표현할 때 주로 쓰였다.
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xl font-bold mb-2" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>樂府 (악부)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      민가(Folk song)에서 유래하여 음악성을 강조한 시. 사회 비판적 내용을 담는 그릇으로도 쓰였다. (백거이의 신악부 운동)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2-4: Form Aesthetics */}
      <section 
        ref={(el) => sectionsRef.current[4] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <h3 
                  className="text-4xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  形式之美學
                </h3>
                <p className="text-lg text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  그릇이 내용을 결정하다
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-10">
              <p className="text-gray-800 text-xl" style={{ fontFamily: "'Noto Serif KR', serif", lineHeight: '1.9' }}>
                "형식이 내용을 지배한다"는 말은 당나라 시에서 가장 잘 드러난다. 시인들은 자신이 표현하고자 하는 주제와 감정의 결에 따라 엄격한 근체시를 택할지, 자유로운 고체시(악부)를 택할지를 전략적으로 결정했다.
              </p>

              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                  근체시: '절제'와 '함축'의 미학
                </h4>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                  근체시는 평측의 조화와 엄격한 <strong>대우(對偶, 대구)</strong>를 요구한다. 특히 율시의 허리 부분(함련, 경련)에서 필수적인 대구법은 시의 내용을 <strong>'서사(스토리텔링)'보다는 '묘사(이미지)'</strong>에 집중하게 만들었다.
                </p>
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>정적인 회화성</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      "<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>江碧鳥逾白(강벽조유백), 山靑花欲燃(산청화욕연)</span>"(두보)처럼, 대구는 시간의 흐름을 멈추고 공간적인 병치를 보여주는 데 탁월하다. 때문에 근체시는 산수 자연의 묘사, 이별의 순간적 감정, 정제된 회고를 담는 데 주로 쓰였다.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>논리의 압축</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      좁은 우리 안에 갇힌 호랑이가 더 사납듯, 글자 수와 평측의 제약은 시어를 극도로 정제하여 폭발적인 함축미를 낳았다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>
                  고체시와 악부: '서사'와 '분출'의 미학
                </h4>
                <p className="text-gray-800 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.9' }}>
                  반면, 평측의 제약이 없고 길이에 제한이 없는 고체시나 악부시는 시간의 흐름에 따른 이야기나 논리적인 주장을 펼치기에 적합했다.
                </p>
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>역동적인 서사성</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      백거이의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《長恨歌(장한가)》</span>나 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《琵琶行(비파행)》</span> 같은 장편 서사시가 모두 고체시(가행) 형식을 띤 것은 우연이 아니다.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>감정의 직설적 분출</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      이백의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《將進酒(장진주)》</span>가 대표적이다. 술에 취해 솟구치는 격정을 "<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>君不見(군불견)</span>!"라고 외치며 시작하기 위해서는, 평측 따위는 무시하고 호흡을 길게 혹은 짧게 맘대로 조절할 수 있는 자유로운 형식이 필수적이었다.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h5 className="text-xl font-bold mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>사회 비판과 철학</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      두보의 '삼리삼별(반전 시)'이나 한유의 철학적인 시들처럼, 현실의 부조리를 고발하거나 복잡한 논리를 전개할 때도 시인들은 제약이 덜한 고체시를 선호했다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-8 border-l-4 border-amber-500">
                <p className="text-gray-800 text-lg italic" style={{ fontFamily: "'Noto Serif KR', serif", lineHeight: '1.9' }}>
                  결국, 당나라 시인들에게 형식은 단순한 규칙이 아니라, '그림을 그릴 것인가(근체시)' 아니면 '이야기를 할 것인가(고체시)'를 결정하는 붓의 선택과도 같았다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Themes */}
      <section 
        ref={(el) => sectionsRef.current[5] = el}
        className="fade-in-section py-16 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    03
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  主題與情緖
                </h2>
                <p className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  주요 주제와 정서
                </p>
              </div>
            </div>
            <div className="col-span-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    <i className="ri-landscape-line"></i>
                    山水田園
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                    복잡한 관직 생활에서 벗어나 자연 속의 은둔, 불교적 깨달음을 노래했다. (왕유, 맹호연)
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    <i className="ri-sword-line"></i>
                    邊塞
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                    변방의 사막, 전쟁의 공포, 장수의 기개를 다뤘다. 당시 당나라의 영토 확장이 활발했음을 보여준다. (고적, 잠참)
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    <i className="ri-user-heart-line"></i>
                    離別
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                    교통이 불편한 시대, 친구와의 이별은 곧 생이별과 같았다. 버드나무 가지를 꺾어주며(절류) 다시 만날 날을 기약하는 시가 가장 많다.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    <i className="ri-emotion-sad-line"></i>
                    宮怨與閨怨
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                    임금의 사랑을 잃은 궁녀의 한이나, 전장에 나간 남편을 기다리는 여인의 외로움을 노래했다.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                    <i className="ri-book-2-line"></i>
                    詠史與社會批判
                  </h4>
                  <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                    옛 역사를 빌려 현실 정치를 풍자하거나, 안사의 난과 같은 전란의 참상을 고발했다. (두보, 백거이)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: How Poetry Was Enjoyed */}
      <section 
        ref={(el) => sectionsRef.current[6] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                    04
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  詩之享有
                </h2>
                <p className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  시를 향유하던 방식
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-8">
              <p className="text-gray-800 text-xl mb-8" style={{ fontFamily: "'Noto Serif KR', serif", lineHeight: '1.9' }}>
                시는 읽는 것이 아니라 사는 것
              </p>

              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                  <i className="ri-book-open-line"></i>
                  科擧試驗
                </h4>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  시를 잘 짓는 것이 곧 고위 관료가 되는 길이었다. 때문에 황제부터 시골 서생까지 시를 공부했다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                  <i className="ri-group-line"></i>
                  社交與疏通
                </h4>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  잔치, 환송회 등에서 즉석에서 시를 짓고 주고받는 것이 일상이었다. 술자리에서 시를 짓지 못하면 벌주를 마셨다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                  <i className="ri-music-line"></i>
                  音樂之結合
                </h4>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  당나라 시는 묵독용 텍스트가 아니라, 기녀들이 비파를 타며 부르던 '유행가 가사'였다. 시인의 명성은 기녀들이 얼마나 그 시인의 시를 노래로 많이 부르느냐에 달려 있었다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}>
                  <i className="ri-edit-line"></i>
                  題壁文化
                </h4>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  명승지, 역관, 사찰의 벽에 시를 적어 놓는 문화가 있었다. 이는 당대 사람들의 '오프라인 게시판' 역할을 하며 시를 대중과 공유하는 수단이 되었다.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden shadow-md mt-8">
                <img
                  src="https://readdy.ai/api/search-image?query=tang%20dynasty%20banquet%20scene%20with%20scholars%20composing%20poetry%20while%20musicians%20play%20traditional%20instruments%20and%20courtesans%20perform%2C%20elegant%20gathering%20atmosphere%2C%20traditional%20chinese%20painting%20style%2C%20warm%20candlelight%20and%20lanterns%2C%20rich%20cultural%20details&width=900&height=600&seq=tangpoem003&orientation=landscape"
                  alt="Poetry Gathering"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: After Tang */}
      <section 
        ref={(el) => sectionsRef.current[7] = el}
        className="fade-in-section py-16 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>
                    05
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  唐後變遷
                </h2>
                <p className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  당나라 이후 중국 시문학의 변천
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-10">
              <p className="text-gray-800 text-xl" style={{ fontFamily: "'Noto Serif KR', serif", lineHeight: '1.9' }}>
                당나라 시가 '서정(감정)'의 정점을 찍자, 후대 왕조들은 다른 길을 모색했다.
              </p>

              <div className="bg-white rounded-xl p-8 shadow-md">
                <h4 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>
                  <span className="w-3 h-3 bg-current rounded-full"></span>
                  宋 (송나라)
                </h4>
                <div className="space-y-6">
                  <div>
                    <h5 className="text-2xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>宋詩 (송시)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      당나라의 '정(情)' 대신 철학적 '이(理, 이치)'와 논리를 중시했다. 시가 산문화되는 경향을 보였다. (소동파, 황정견)
                    </p>
                  </div>
                  <div>
                    <h5 className="text-2xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>詞 (사)</h5>
                    <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                      원래는 연회에서 부르던 노래 가사였다. 구절의 길이가 들쑥날쑥한 장단구(長短句) 형식을 띠며, 당나라 시를 대신하여 인간의 내면적 감정을 담아내는 새로운 서정 장르로 자리 잡았다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>
                  <span className="w-3 h-3 bg-current rounded-full"></span>
                  元 (원나라)
                </h4>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  몽골의 지배 하에서 과거 제도가 폐지되자, 문인들은 연극과 오페라 형식인 <strong style={{ fontFamily: "'adobe-fangsong-std', serif" }}>曲(곡)</strong>과 잡극(희곡)에 몰두했다. 구어체가 대거 유입되었다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md">
                <h4 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>
                  <span className="w-3 h-3 bg-current rounded-full"></span>
                  明/淸 (명/청나라)
                </h4>
                <p className="text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', lineHeight: '1.8' }}>
                  소설(<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>三國志演義(삼국지연의)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>水滸傳(수호전)</span> 등)이 문학의 주류로 부상했다. 시의 경우 당나라 시풍을 모방하거나 복고하려는 움직임(전후칠자 등)이 강했으나, 당나라 때만큼의 독창성을 보여주지는 못했다는 평을 받는다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conclusion */}
      <section 
        ref={(el) => sectionsRef.current[8] = el}
        className="fade-in-section py-16 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <div className="mb-6">
                  <span className="text-7xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#D4AF37' }}>
                    06
                  </span>
                </div>
                <h2 
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
                >
                  永恆現在
                </h2>
                <p className="text-xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  영원한 현재진행형
                </p>
              </div>
            </div>
            <div className="col-span-8">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-10 shadow-lg">
                <p className="text-gray-800 text-xl leading-relaxed mb-6" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  당나라 시는 한국(신라~조선), 일본, 베트남 등 동아시아 한자 문화권의 지식인들에게 공통의 교양이었다.
                </p>
                <p className="text-gray-800 text-xl leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  천 년 전 장안의 달빛 아래서 읊조린 그들의 노래는 오늘날에도 여전히 유효한 미적 감동을 전달한다.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden shadow-md mt-10">
                <img
                  src="https://readdy.ai/api/search-image?query=moonlit%20night%20over%20ancient%20chinese%20city%20with%20traditional%20architecture%20silhouettes%2C%20poetic%20and%20contemplative%20atmosphere%2C%20traditional%20chinese%20ink%20painting%20style%2C%20serene%20blue%20and%20silver%20tones%2C%20misty%20ethereal%20quality%2C%20timeless%20beauty&width=900&height=600&seq=tangpoem004&orientation=landscape"
                  alt="Eternal Poetry"
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
