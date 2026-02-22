/**
 * 커뮤니티 더미 게시글 시드 스크립트
 * 사용법: /community/forum/ 페이지 브라우저 콘솔에서 실행
 * 로그인 상태에서만 작동
 */
(async function seedPosts() {
  if (!window.sb) { console.error('Supabase 미로드'); return; }

  var { data: { user } } = await window.sb.auth.getUser();
  if (!user) { console.error('로그인 필요'); return; }

  var uid = user.id;

  var posts = [
    {
      board: 'forum',
      author_id: uid,
      title: '왕유의 한강임범, 화경의 삼매에 대하여',
      body: '<p>"강물 흐르는 곳은 하늘과 땅 바깥이요, 산빛은 유무(有無)의 경계에 있다"는 구절을 두고 역대 시화에서 수많은 논평이 이어졌습니다.</p><p>왕세정은 <strong>화경의 삼매</strong>에 들어간 듯하다 했고, 관세명은 이백·두보와 비교하며 각각의 기운이 다르다 했지요.</p><p>여러분은 이 구절을 어떻게 해석하시나요?</p>',
      tags: ['왕유', '한강임범', '시평'],
      links: ['https://ko.wikipedia.org/wiki/왕유']
    },
    {
      board: 'forum',
      author_id: uid,
      title: '칠언율시 평측 규칙이 헷갈립니다',
      body: '<p>칠언율시를 공부하고 있는데, <strong>평측 규칙</strong>에서 "일삼오불론(一三五不論), 이사육분명(二四六分明)"이라는 원칙이 항상 적용되는 건 아닌 것 같습니다.</p><p>예외 상황이 어떤 경우에 발생하는지 아시는 분 계신가요?</p><ul><li>고평(孤平) 금지 규칙</li><li>삼련조(三連調) 회피</li><li>구미(句尾) 처리</li></ul>',
      tags: ['칠언율시', '평측', '질문'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '이백과 두보, 누가 더 위대한 시인인가?',
      body: '<p>천 년 넘게 이어져 온 논쟁이죠. <em>시선(詩仙)</em>과 <em>시성(詩聖)</em>.</p><p>이백의 자유분방한 낭만주의와 두보의 깊은 사실주의. 여러분은 어느 쪽에 더 끌리시나요?</p><blockquote>人生得意須盡歡，莫使金樽空對月 — 李白</blockquote><blockquote>國破山河在，城春草木深 — 杜甫</blockquote>',
      tags: ['이백', '두보', '토론'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '당시삼백수 번역본 비교 — 어떤 책이 좋을까?',
      body: '<p>당시삼백수를 본격적으로 공부하려고 합니다. 시중에 나온 번역본들을 비교해봤는데:</p><ol><li>김원중 역 — 학술적, 주석 풍부</li><li>류성준 역 — 읽기 편함, 감상 위주</li><li>일본어판 이와나미 문고 — 원문+현대어역</li></ol><p>다른 분들은 어떤 번역본으로 공부하셨나요?</p>',
      tags: ['당시삼백수', '번역', '추천'],
      links: ['https://www.yes24.com/']
    },
    {
      board: 'forum',
      author_id: uid,
      title: '한시 초보 입문 순서 추천 부탁드립니다',
      body: '<p>한시를 처음 배우려고 합니다. 어디서부터 시작하면 좋을까요?</p><p>주변에서 <strong>오언절구</strong>부터 시작하라고 하는데, 혹시 체계적인 학습 순서가 있으면 알려주세요.</p>',
      tags: ['입문', '질문', '학습'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '시경(詩經)과 초사(楚辭)의 차이점',
      body: '<p>중국 고전시의 두 원류인 <strong>시경</strong>과 <strong>초사</strong>를 비교해봅니다.</p><p>시경은 북방 민가에서 출발한 현실주의적 전통이고, 초사는 남방 무속 문화에서 탄생한 낭만주의적 전통이라 할 수 있습니다.</p><p>이 두 전통은 이후 중국 시문학 전체를 관통하는 양대 흐름이 되었죠.</p>',
      tags: ['시경', '초사', '시문학사'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '온라인 한시 사전 모음 공유',
      body: '<p>한시 공부하면서 유용하게 쓰는 온라인 자료들 정리해봤습니다.</p><ul><li><strong>한전 고전종합DB</strong> — 한국 고전 원문 검색</li><li><strong>漢典</strong> — 한자 자전/사전</li><li><strong>搜韻</strong> — 운서 검색, 평측 확인</li><li><strong>全唐詩</strong> 온라인 DB — 당시 전문 검색</li></ul><p>다른 유용한 사이트 있으면 댓글로 공유해주세요!</p>',
      tags: ['자료공유', '사전', '도구'],
      links: ['https://db.itkc.or.kr/', 'https://www.zdic.net/']
    },
    {
      board: 'forum',
      author_id: uid,
      title: '소동파의 적벽부를 읽고',
      body: '<p>소동파의 <em>전적벽부</em>를 다시 읽었습니다. 매번 읽을 때마다 새로운 감동이 있네요.</p><p>"강 위의 맑은 바람과 산 사이의 밝은 달은, 귀로 얻으면 소리가 되고 눈으로 만나면 빛깔이 되나니, 이를 취하여도 금하는 이 없고 이를 써도 다함이 없으니, 이것은 조물주의 다함없는 보물이라."</p><p>이 대목은 읽을 때마다 가슴이 시원해집니다.</p>',
      tags: ['소동파', '적벽부', '감상'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '한시에서 대구(對句)의 기법과 아름다움',
      body: '<p>한시, 특히 율시에서 <strong>대구(對句)</strong>는 핵심적인 수사 기법입니다.</p><p>함련(頷聯)과 경련(頸聯)에서 대구를 이루는 것이 원칙인데, 좋은 대구의 조건은:</p><ol><li>글자의 품사가 대응</li><li>의미가 상호 보완</li><li>소리의 평측이 반대</li></ol><blockquote>星垂平野闊，月湧大江流 — 杜甫, 旅夜書懷</blockquote><p>이 구절은 대구의 정수라 할 수 있죠.</p>',
      tags: ['대구', '수사법', '율시'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '한국 한시 전통 — 퇴계 이황의 도산십이곡',
      body: '<p>한시는 중국만의 것이 아닙니다. 한국에도 깊은 한시 전통이 있죠.</p><p>퇴계 이황 선생의 <strong>도산십이곡(陶山十二曲)</strong>은 한국 한시의 정수를 보여줍니다. 물론 엄밀히 말하면 시조이지만, 한시적 정신이 깊이 배어 있습니다.</p><p>한국의 한시 전통에 대해 이야기 나눠보면 좋겠습니다.</p>',
      tags: ['한국한시', '퇴계', '토론'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: 'AI로 한시 짓기 — 가능한가?',
      body: '<p>요즘 ChatGPT 등 AI로 한시를 짓는 시도가 많은데요.</p><p>AI가 평측과 압운은 맞출 수 있지만, 시의 <strong>의경(意境)</strong>이나 <strong>기운(氣韻)</strong>까지 표현할 수 있을까요?</p><p>직접 AI에게 오언절구를 시켜봤는데, 형식은 맞지만 뭔가 2% 부족한 느낌이었습니다. 여러분의 생각은?</p>',
      tags: ['AI', '토론', '현대'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '병음(拼音) 공부 없이 한시를 읽을 수 있을까?',
      body: '<p>한국어 독음으로만 한시를 감상하는 것과, 중국어 원음으로 감상하는 것은 큰 차이가 있을까요?</p><p>특히 <strong>압운</strong>이나 <strong>성조</strong>의 맛을 느끼려면 중국어가 필수인지 궁금합니다.</p>',
      tags: ['병음', '발음', '질문'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '이번 주말 한시 낭송회 정보',
      body: '<p>서울 종로구 인사동에서 이번 주말(2/22~23) <strong>한시 낭송회</strong>가 열린다고 합니다.</p><p>관심 있으신 분들은 아래 링크에서 신청하세요. 참가비는 무료입니다.</p>',
      tags: ['행사', '낭송회', '서울'],
      links: ['https://example.com/event']
    },
    {
      board: 'forum',
      author_id: uid,
      title: '맹호연의 춘면 — 가장 사랑받는 오언절구',
      body: '<p><strong>春曉</strong></p><p>春眠不覺曉，處處聞啼鳥。<br>夜來風雨聲，花落知多少。</p><p>이 시처럼 단순하면서도 깊은 여운을 남기는 시가 또 있을까요? 20글자 안에 봄의 정취를 완벽하게 담았습니다.</p>',
      tags: ['맹호연', '춘면', '오언절구', '감상'],
      links: []
    },
    {
      board: 'forum',
      author_id: uid,
      title: '한시 학습 앱 추천',
      body: '<p>혹시 한시 학습에 도움되는 앱이나 웹사이트 추천해주실 수 있나요?</p><p>평측 자동 분석이나 운서 검색 기능이 있으면 좋겠습니다.</p>',
      tags: ['앱', '추천', '질문'],
      links: []
    }
  ];

  console.log('시드 시작: ' + posts.length + '개 게시글 삽입...');

  var hasTagsColumn = true;

  for (var i = 0; i < posts.length; i++) {
    var payload = Object.assign({}, posts[i]);

    // tags/links 컬럼이 없으면 제거
    if (!hasTagsColumn) {
      delete payload.tags;
      delete payload.links;
    }

    var { error } = await window.sb.from('posts').insert(payload);

    // PGRST204 = 컬럼 없음 → tags/links 빼고 재시도
    if (error && error.code === 'PGRST204') {
      hasTagsColumn = false;
      delete payload.tags;
      delete payload.links;
      var retry = await window.sb.from('posts').insert(payload);
      if (retry.error) {
        console.error('실패 #' + (i+1) + ':', retry.error.message);
      } else {
        console.log('✓ #' + (i+1) + ' ' + posts[i].title + ' (tags 미지원)');
      }
    } else if (error) {
      console.error('실패 #' + (i+1) + ':', error.message);
    } else {
      console.log('✓ #' + (i+1) + ' ' + posts[i].title);
    }
    // rate limit 방지
    await new Promise(function(r) { setTimeout(r, 200); });
  }

  console.log('완료! 새로고침하면 게시글이 보입니다.');
  location.reload();
})();
