const contents = (window && window.contents) ? window.contents : [];

// 콘텐츠 렌더링 함수
function renderContent(nav, subnav) {
  const filtered = contents.filter(item => item.nav === nav && item.subnav === subnav);

  const isArt = nav === 'art';
  const isText = nav === 'text';

  const containerIds = isArt
    ? ['works', 'drawings']
    : isText
      ? ['reviews', 'texts']
      : [];

  // 모든 콘텐츠 영역 초기화
  containerIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '';
      el.style.display = 'none';
    }
  });

  const containerId = subnav;
  const container = document.getElementById(containerId);
  if (!container) return;

  container.style.display = 'grid';
  container.innerHTML = filtered.map(item => `
    <a class="thumbnail" id="thumb-${item.id}" 
       href="./detail.html?id=${item.id}&nav=${item.nav}&subnav=${item.subnav}">
     ${item.img ? `<img src="${item.img}" loading="lazy" alt="${item.title}" />` : ''}
     <p>${item.title}</p>
     ${item.subtitle ? `<h1>${item.subtitle}</h1>` : ''}
    </a>
  `).join('');


  // ✅ 썸네일 스크롤 복원 처리 (헤더/네비 높이만큼 보정)
  // {
  //   const params = new URLSearchParams(window.location.search);
  //   const targetId = params.get('id') || localStorage.getItem('scrollToId');

  //   if (targetId) {
  //     // 레이아웃/이미지 렌더가 끝난 다음에 계산해야 정확함
  //     requestAnimationFrame(() => {
  //       const targetEl = document.getElementById(`thumb-${targetId}`);
  //       if (!targetEl) return;

  //       // 현재 화면에서 실제로 보이는 fixed 바들의 총 높이 계산
  //       const fixedOffset = Array.from(document.querySelectorAll('header, nav, .subnav'))
  //         .filter(el => {
  //           const cs = window.getComputedStyle(el);
  //           // fixed이고, 표시 중이며, 높이가 있는 요소만 카운트
  //           return cs.position === 'fixed' && el.offsetParent !== null && el.offsetHeight > 0;
  //         })
  //         .reduce((sum, el) => sum + el.offsetHeight, 0);

  //       // 요소의 문서 기준 Y좌표 - fixed 총 높이 - 여유 여백(8px)
  //       const top = targetEl.getBoundingClientRect().top + window.pageYOffset - fixedOffset - 8;

  //       // 일부 브라우저는 'instant' 미지원 → auto로 폴백
  //       const behavior = ('scrollBehavior' in document.documentElement.style) ? 'auto' : undefined;
  //       window.scrollTo({ top, left: 0, behavior });

  //       localStorage.removeItem('scrollToId'); // 사용 후 제거
  //     });
  //   }
  // }

}

// 탭 활성화 함수
function setActiveTab(tabElement, groupSelector) {
  document.querySelectorAll(groupSelector).forEach(el => el.classList.remove('active'));
  tabElement.classList.add('active');
}

// 현재 선택된 탭 값 가져오기
function getActiveTabValue(groupSelector, attribute) {
  const active = document.querySelector(`${groupSelector}.active`);
  return active ? active.getAttribute(attribute) : null;
}

// nav/subnav 기반 콘텐츠 업데이트
function updateContentFromTabs() {
  const nav = getActiveTabValue('.tab', 'data-tab');
  const subnav = getActiveTabValue('.subtab', 'data-subtab');
  if (nav && subnav) {
    renderContent(nav, subnav);
  }
}
// ✅ 스크롤 초기화: 문서/리스트 모두 맨 위로
// ✅ iOS Safari까지 확실히 스크롤 최상단으로
function resetScrollToTop() {
  // 사파리의 히스토리 자동 복원 비활성화
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch { }

  const hardScrollTop = () => {
    // 문서 레벨
    try { window.scrollTo(0, 0); } catch { }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { }
    // iOS가 참조하는 스크롤링 엘리먼트들 모두 초기화
    const se = document.scrollingElement || document.documentElement;
    try { se.scrollTop = 0; } catch { }
    try { document.documentElement.scrollTop = 0; } catch { }
    try { document.body.scrollTop = 0; } catch { }

    // 내부 스크롤 컨테이너(있다면)도 초기화
    document.querySelectorAll('.content-area, .content, .content-list').forEach(el => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  };

  // 레이아웃이 갱신된 뒤 여러 타이밍에서 재시도 (iOS 안정화)
  requestAnimationFrame(() => {
    hardScrollTop();           // 1차
    setTimeout(hardScrollTop, 0);    // 2차(마이크로틱 이후)
    setTimeout(hardScrollTop, 80);   // 3차(이미지/폰트 늦게 반영 대비)
  });
}


// 초기화
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const navParam = params.get('nav') || 'art';
  const subnavParam = params.get('subnav'); // 있을 수도, 없을 수도 있음

  // nav 탭 초기화
  const navTab = document.querySelector(`.tab[data-tab="${navParam}"]`);
  if (navTab) {
    setActiveTab(navTab, '.tab');

    // 해당 페이지 보여주기
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const page = document.getElementById(`${navParam}Page`);
    if (page) page.style.display = 'block';

    // 서브네비 설정
    const subnavEl = document.getElementById(`${navParam}Subnav`);
    document.getElementById('artSubnav').style.display = 'none';
    document.getElementById('textSubnav').style.display = 'none';

    if (subnavEl) {
      subnavEl.style.display = 'flex';

      // 서브탭 선택: 있으면 그걸, 없으면 첫 번째
      const targetSubtab = subnavParam
        ? subnavEl.querySelector(`.subtab[data-subtab="${subnavParam}"]`)
        : subnavEl.querySelector('.subtab');

      if (targetSubtab) {
        setActiveTab(targetSubtab, '.subtab');
        renderContent(navParam, targetSubtab.dataset.subtab);
      }
    }
  }

  // nav 탭 클릭 이벤트
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setActiveTab(tab, '.tab');
      const target = tab.dataset.tab;

      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      document.getElementById(`${target}Page`).style.display = 'block';

      // subnav 표시
      document.getElementById('artSubnav').style.display = 'none';
      document.getElementById('textSubnav').style.display = 'none';

      const subnavEl = document.getElementById(`${target}Subnav`);
      if (subnavEl) {
        subnavEl.style.display = 'flex';

        const firstSubtab = subnavEl.querySelector('.subtab');
        if (firstSubtab) {
          setActiveTab(firstSubtab, '.subtab');
          renderContent(target, firstSubtab.dataset.subtab);
          resetScrollToTop();
        } else {
          // (CV/Contact처럼 subnav가 없는 페이지도 초기화)
          resetScrollToTop();
        }
      }
    });
  });

  // subnav 탭 클릭 이벤트
  document.querySelectorAll('.subtab').forEach(subtab => {
    subtab.addEventListener('click', () => {
      setActiveTab(subtab, '.subtab');
      updateContentFromTabs();
      resetScrollToTop();
    });
  });


});


