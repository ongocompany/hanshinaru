import { useEffect, useRef } from 'react';
import Navigation from '../home/components/Navigation';
import Footer from '../home/components/Footer';

export default function TangPoetry300Page() {
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
            src="https://readdy.ai/api/search-image?query=ancient%20chinese%20poetry%20book%20with%20elegant%20calligraphy%20and%20traditional%20binding%2C%20classical%20scholarly%20atmosphere%20with%20ink%20brush%20and%20scrolls%2C%20warm%20golden%20lighting%2C%20traditional%20chinese%20painting%20aesthetic%20with%20soft%20colors%2C%20cultural%20heritage%20theme&width=1920&height=1080&seq=tangpoetry001&orientation=landscape"
            alt="Tang Poetry 300"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-8">
          <h1 
            className="text-8xl font-bold mb-6"
            style={{ fontFamily: "'adobe-fangsong-std', serif" }}
          >
            唐詩三百首
          </h1>
          <p className="text-6xl mb-4" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            당시삼백수
          </p>
          <p className="text-3xl font-light tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
            Three Hundred Tang Poems
          </p>
          <div className="mt-8 text-xl" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            清 · 孫洙 編
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
                  <strong className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首(당시삼백수)》</strong>는 중국 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>唐(당)</span>나라에서 널리 읽혔던 한시(漢詩) 가운데 300수(首)를 가려 뽑은 것으로, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>淸(청)</span>나라 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>孫洙(손수)</span>가 편찬하였다.
                </p>
                <p>
                  이 책은 시가(詩家)의 전문적인 시선집(詩選集)이라기 보다는 <strong>아동들의 시가학습(詩歌學習)을 위해</strong> 만든 것인데, 총 <strong>77명 작가의 310수</strong>가 수록되어 있으며, 작가들은 당나라의 중요 시인들은 물론이고, 제왕(帝王)·사대부·승려·가녀(歌女)·무명씨(無名氏) 등이 광범위하게 포함되어 있다.
                </p>
                <p>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首》</span>가 나오기 이전 아동들의 시 학습 교본은 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《千家詩(천가시)》</span>였는데, 이 책이 아동들의 학습 교본으로 적합지 않다고 판단하여 새롭게 편찬된 것이다. 하지만 당시(唐詩) 가운데 인구에 회자되는 작품만을 뽑았기 때문에 아동뿐만 아니라 일반인에게도 널리 읽히게 되어 <strong>당시선집(唐詩選集) 중에서 가장 많이 읽히고</strong> 후대에 미친 영향력도 크다.
                </p>
              </div>
              
              <div className="mt-12 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=traditional%20chinese%20poetry%20anthology%20book%20cover%20with%20elegant%20calligraphy%20title%20three%20hundred%20tang%20poems%2C%20classical%20design%20with%20red%20and%20gold%20colors%2C%20ornate%20traditional%20patterns%2C%20scholarly%20aesthetic%20with%20vintage%20paper%20texture&width=1200&height=700&seq=tangpoetry002&orientation=landscape"
                  alt="Tang Poetry 300 Book"
                  className="w-full h-auto"
                />
                <div className="bg-gray-50 px-6 py-4">
                  <p className="text-sm text-gray-600 text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    당시삼백수 고서(古書)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editor Section */}
      <section 
        ref={(el) => sectionsRef.current[1] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <h2 
                  className="text-6xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}
                >
                  編者
                </h2>
                <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  Editor
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-12">
              {/* 기본 정보 */}
              <div className="bg-white rounded-2xl p-10 shadow-md">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                      姓名
                    </h3>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>孫洙(손수)</span>
                    </p>
                    <p className="text-gray-600 text-sm mt-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      1711~1778
                    </p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                      字·別號
                    </h3>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      자는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>臨西(임서)</span>
                    </p>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      호는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>蘅堂(형당)</span>·<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>退士(퇴사)</span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                      出生地域
                    </h3>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>江蘇省(강소성) 無錫(무석)</span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#C41E3A' }}>
                      主要著作
                    </h3>
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《蘅塘漫稿(현당만고)》</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 생애 및 활동 */}
              <div>
                <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#C41E3A' }}>
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  주요 활동 및 생애
                </h3>
                <div className="space-y-6 text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                  <p>
                    손수는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>乾隆(건륭)</span> 9년(1744)에 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>擧人(거인)</span>이 되어 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>景山官學敎習(경산관학교습)</span>과 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>上元縣敎諭(상원현교유)</span>를 역임했고, 1751년에 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>進士(진사)</span>가 되어 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>大城(대성)</span>·<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>盧龍(노룡)</span>·<span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>鄒平(추평)</span>의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>縣令(현령)</span>을 지냈다.
                  </p>
                  <p>
                    부임하는 곳에서는 반드시 백성의 질고를 살피고 평시에 고을 사람들과 부자(父子)처럼 생활했으며, 혹 곤장을 칠 일이 있으면 그가 먼저 눈물을 흘렸기 때문에 백성들이 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>感泣(감읍)</span>하여 스스로 잘못을 뉘우쳤다고 한다.
                  </p>
                  <p>
                    공무(公務)의 여가에는 독서를 그치지 않아서 마치 일개 서생(書生)과 같았으며 관직에서 물러난 후에도 여전히 청빈(淸貧)하게 살았다고 한다.
                  </p>
                </div>
                <div className="mt-8 rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://readdy.ai/api/search-image?query=qing%20dynasty%20chinese%20scholar%20official%20in%20traditional%20robes%20studying%20poetry%20books%20in%20classical%20study%20room%2C%20serene%20scholarly%20atmosphere%2C%20traditional%20chinese%20painting%20style%2C%20warm%20candlelight%2C%20books%20and%20scrolls%20surrounding%2C%20contemplative%20mood&width=900&height=600&seq=tangpoetry003&orientation=landscape"
                    alt="Sun Zhu"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bibliography Section */}
      <section 
        ref={(el) => sectionsRef.current[2] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4">
              <div className="sticky top-24">
                <h2 
                  className="text-6xl font-bold mb-4"
                  style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}
                >
                  書誌事項
                </h2>
                <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  Bibliography
                </p>
              </div>
            </div>
            <div className="col-span-8 space-y-8">
              <div className="space-y-6 text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <p>
                  서명 그대로 당나라 때 유행한 시 300수를 뽑았다는 의미인데, 실제로는 <strong>310수</strong>가 실려 있다. 손수가 직접 지은 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈唐詩三百首題辭(당시삼백수제사)〉</span>에 의하면, 그때 당시에 아동들의 시 학습 교본은 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《千家詩(천가시)》</span>였는데 이 책이 아동들의 학습 교본으로 적합지 않다고 판단하여 새롭게 편찬하였다고 하였다.
                </p>
                <p>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首》</span>는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>乾隆(건륭)</span> 29년(1764)년 처음 편찬되었고, 이후 1831년 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>陳婉俊(진완준)</span>의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首補註(당시삼백수보주)》</span>가 나왔으며, 1835년에는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>章燮(장섭)</span>의 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首註疏(당시삼백수주소)》</span>가 나왔다.
                </p>
                <p>
                  장섭의 주소본(註疏本)은 원래에 310수에 11수를 더하여 <strong>321수</strong>로 만들고 상세한 주석을 붙였는데, 손수가 편찬한 원본은 없어지고 우리가 지금 보는 것은 장섭의 주소본이다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-3xl font-bold mb-6" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2E5090' }}>
                  版本 變遷
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>1764년</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                        <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>孫洙(손수)</span> 원본 편찬 (310수)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>1831년</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                        <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>陳婉俊(진완준)</span> <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首補註》</span> 간행
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#2E5090' }}>1835년</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                        <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>章燮(장섭)</span> <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首註疏》</span> 간행 (321수)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section 
        ref={(el) => sectionsRef.current[3] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}
            >
              內容
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Content
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <p className="text-gray-800 mb-8" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                310수의 시를 각 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>詩體(시체)</span>별로 구분하여 수록하였는데, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>古體詩(고체시)</span>와 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>近體詩(근체시)</span>, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>樂府詩(악부시)</span>를 포괄하였으며, 또한 당나라 전 시기의 시를 골고루 안배하였다. 시의 내용면에서도 당대(唐代)의 사회생활과 시가(詩歌)의 풍모를 어느 정도 반영했다고 말할 수 있다.
              </p>

              <h3 className="text-4xl font-bold mb-6" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                詩體別 收錄 現況
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>五言古詩</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>35수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>오언고시</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>五言古樂府</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>11수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>오언고악부</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>七言古詩</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>28수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>칠언고시</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>七言古樂府</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>16수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>칠언고악부</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>五言律詩</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>80수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>오언율시</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>七言律詩</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>53수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>칠언율시</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>七言律詩樂府</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>1수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>칠언율시악부</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>五言絶句</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>29수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>오언절구</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>五言絶句樂府</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>8수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>오언절구악부</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>七言絶句</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>51수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>칠언절구</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>七言絶句樂府</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>9수</span>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>칠언절구악부</p>
                </div>
              </div>
            </div>

            {/* 주요 작가별 수록 현황 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-8" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                主要 作家別 收錄 現況
              </h3>
              <p className="text-gray-700 mb-8" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                작가별로 10수 이상 실려 있는 시인을 살펴보면 다음과 같다:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-white rounded-xl border-l-4 border-amber-500">
                  <div>
                    <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>杜甫</span>
                    <span className="text-lg ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>두보</span>
                  </div>
                  <span className="text-4xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#D4AF37' }}>39수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-white rounded-xl border-l-4 border-amber-400">
                  <div>
                    <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李白</span>
                    <span className="text-lg ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>이백</span>
                  </div>
                  <span className="text-4xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#D4AF37' }}>34수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border-l-4 border-gray-400">
                  <div>
                    <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>王維</span>
                    <span className="text-lg ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>왕유</span>
                  </div>
                  <span className="text-4xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>29수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border-l-4 border-gray-400">
                  <div>
                    <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李商隱</span>
                    <span className="text-lg ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>이상은</span>
                  </div>
                  <span className="text-4xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: '#4A5D23' }}>24수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>孟浩然</span>
                    <span className="text-base ml-2 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>맹호연</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>15수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>韋應物</span>
                    <span className="text-base ml-2 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>위응물</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>12수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>劉長卿</span>
                    <span className="text-base ml-2 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>유장경</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>11수</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>杜牧</span>
                    <span className="text-base ml-2 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>두목</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>10수</span>
                </div>
              </div>
            </div>

            {/* 장섭이 추가한 시 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <h3 className="text-4xl font-bold mb-6" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#4A5D23' }}>
                章燮 添加 作品
              </h3>
              <p className="text-gray-700 mb-6" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.8' }}>
                이 숫자는 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>章燮(장섭)</span>이 편찬한 주소본(註疏本)의 숫자인데, 장섭이 첨가한 시는 다음과 같다:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>張九齡</span>
                  <div className="flex-1">
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈感遇(감우)〉</span> 2수
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>李白</span>
                  <div className="flex-1">
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈子夜四時歌(자야사시가)〉</span> 3수, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈長干行(장간행)〉</span> 1수, <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈行路難(행로난)〉</span> 2수
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl" style={{ fontFamily: "'adobe-fangsong-std', serif" }}>杜甫</span>
                  <div className="flex-1">
                    <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                      <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈詠懷古跡(영회고적)〉</span> 3수
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value and Impact Section */}
      <section 
        ref={(el) => sectionsRef.current[4] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#8B4513' }}
            >
              價値與影響
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Value and Impact
            </p>
          </div>

          <div className="space-y-12">
            {/* 편찬 목적과 성과 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#8B4513' }}>
                <i className="ri-book-2-line"></i>
                편찬 목적과 성과
              </h3>
              <div className="space-y-6 text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <p>
                  이 책은 시가(詩家)의 전문적인 시선집이 아니고 <strong>아동들의 시가학습(詩歌學習)을 위하여</strong> 만든 것이다. 당시 아동들의 학습 교본은 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《千家詩》</span>였던 듯한데, 이 책이 동몽교본(童蒙敎本)으로 적합지 않다고 판단하여 자신이 새롭게 편찬한 것이다.
                </p>
                <p>
                  그러나 당시(唐詩) 가운데 인구에 회자되는 작품만을 뽑았기 때문에 아동들뿐만 아니라 일반인에게도 널리 읽히게 되어 <strong>당시선집(唐詩選集) 중에서 가장 많이 읽히고</strong> 후대에 미친 영향력도 큰 책이 되었다.
                </p>
              </div>
            </div>

            {/* 한국에서의 영향 */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "'Noto Serif KR', serif", color: '#8B4513' }}>
                <i className="ri-map-pin-line"></i>
                한국에서의 영향
              </h3>
              <div className="space-y-6 text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', lineHeight: '1.9' }}>
                <p>
                  우리나라에서는 조선 중기 이후 당시에 대한 관심이 증가했고, 이에 따라 중국 당시 선집(選集)들이 활발하게 유입되었다. 하지만 청나라 때 간행된 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首》</span>의 유입과 그 영향을 확인할 수 있는 자료는 없다.
                </p>
                <p>
                  오히려 <strong>현대에 들어와</strong> 당시 학습을 위해 <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>《唐詩三百首》</span>를 활용하는 빈도가 높아졌다.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://readdy.ai/api/search-image?query=students%20studying%20classical%20chinese%20poetry%20in%20traditional%20korean%20hanok%20classroom%2C%20peaceful%20learning%20atmosphere%2C%20traditional%20books%20and%20scrolls%2C%20warm%20natural%20lighting%2C%20cultural%20education%20scene%20with%20respectful%20mood&width=1200&height=600&seq=tangpoetry004&orientation=landscape"
                alt="Poetry Education"
                className="w-full h-auto"
              />
              <div className="bg-gray-50 px-6 py-4">
                <p className="text-sm text-gray-600 text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  당시 학습 장면
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Famous Quotes Section */}
      <section 
        ref={(el) => sectionsRef.current[5] = el}
        className="fade-in-section py-24 px-8"
        style={{ backgroundColor: 'rgb(250, 248, 245)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}
            >
              名言
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              Famous Quotes
            </p>
          </div>

          <div className="space-y-8">
            {/* 이백 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <div className="mb-6">
                <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>李白</span>
                <span className="text-xl ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>이백</span>
                <span className="text-lg ml-3 text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈月下獨酌(월하독작)〉</span>
                </span>
              </div>
              <div className="border-l-4 border-amber-500 pl-6 py-4 bg-amber-50 rounded-r-xl">
                <p className="text-4xl mb-4" style={{ fontFamily: "'adobe-fangsong-std', serif", lineHeight: '1.8' }}>
                  擧杯邀明月 對影成三人
                </p>
                <p className="text-xl text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  잔 들어 밝은 달을 부르고, 그림자 마주하니 세 사람이 되었네.
                </p>
              </div>
            </div>

            {/* 두보 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <div className="mb-6">
                <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>杜甫</span>
                <span className="text-xl ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>두보</span>
                <span className="text-lg ml-3 text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈夢李白(몽이백)〉</span>
                </span>
              </div>
              <div className="border-l-4 border-amber-500 pl-6 py-4 bg-amber-50 rounded-r-xl">
                <p className="text-4xl mb-4" style={{ fontFamily: "'adobe-fangsong-std', serif", lineHeight: '1.8' }}>
                  死別已呑聲 生別長惻惻
                </p>
                <p className="text-xl text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  사별은 소리 삼켜 울면 그만이지만 생이별은 길이길이 슬프다네.
                </p>
              </div>
            </div>

            {/* 맹호연 */}
            <div className="bg-white rounded-2xl p-10 shadow-md">
              <div className="mb-6">
                <span className="text-3xl font-bold" style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#1E5631' }}>孟浩然</span>
                <span className="text-xl ml-3 text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>맹호연</span>
                <span className="text-lg ml-3 text-gray-500" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  <span style={{ fontFamily: "'adobe-fangsong-std', serif" }}>〈春曉(춘효)〉</span>
                </span>
              </div>
              <div className="border-l-4 border-amber-500 pl-6 py-4 bg-amber-50 rounded-r-xl">
                <p className="text-4xl mb-4" style={{ fontFamily: "'adobe-fangsong-std', serif", lineHeight: '1.8' }}>
                  春眠不覺曉 處處聞啼鳥
                </p>
                <p className="text-xl text-gray-700" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  봄잠에 취하여 새벽인 줄 몰랐는데, 여기저기서 새소리 들려온다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* References Section */}
      <section 
        ref={(el) => sectionsRef.current[6] = el}
        className="fade-in-section py-24 px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 
              className="text-6xl font-bold mb-4"
              style={{ fontFamily: "'adobe-fangsong-std', serif", color: '#2C2C2C' }}
            >
              參考文獻
            </h2>
            <p className="text-2xl text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              References
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-10">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-1" style={{ color: '#D4AF37' }}>•</span>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                  譯註 唐詩三百首 (송재소 외 역주, 전통문화연구회)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-1" style={{ color: '#D4AF37' }}>•</span>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                  韓譯唐詩三百首 (邱燮友 편저, 安秉烈 역, 계명대학교 출판부)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-1" style={{ color: '#D4AF37' }}>•</span>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                  唐詩三百首 (신동준, 인간사랑)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-1" style={{ color: '#D4AF37' }}>•</span>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                  〈《唐詩三百首》 選本的流變〉 (王莉娜, 長沙理工大學)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-1" style={{ color: '#D4AF37' }}>•</span>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                  〈《唐詩三百首》 硏究〉 (鄒坤峰, 上海師範大學 碩士學位論文)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-1" style={{ color: '#D4AF37' }}>•</span>
                <p className="text-gray-800" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px' }}>
                  〈《唐詩三百首》의 連作詩 選錄 양상 연구〉 (김준연, 《중국어문논총》46)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              【이성민】
            </p>
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
