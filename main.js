import { contents } from './data.js';

// 콘텐츠 렌더링 함수
function renderContent(nav, subnav) {
  const filtered = contents.filter(item => item.nav === nav && item.subnav === subnav);

  const isArt = nav === 'art';
  const isText = nav === 'text';

  const containerIds = isArt
    ? ['works', 'drawing']
    : isText
      ? ['text']
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
  <div class="thumbnail" id="thumb-${item.id}" onclick="location.href='./detail.html?id=${item.id}&nav=${item.nav}&subnav=${item.subnav}'">
    ${item.img ? `<img src="${item.img}" loading="lazy" alt="${item.title}" />` : ''}
    <p>${item.title}</p>
    ${item.subtitle ? `<h1>${item.subtitle}</h1>` : ''}
  </div>
`).join('');


  // ✅ 썸네일 스크롤 복원 처리
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id') || localStorage.getItem('scrollToId');

  if (targetId) {
    setTimeout(() => {
      const targetEl = document.getElementById(`thumb-${targetId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ block: 'start' });
        localStorage.removeItem('scrollToId'); // 사용 후 제거
      }
    }, 100);
  }

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

    if (navParam === 'text') {
      // ✅ Text는 subnav 없음: 바로 statement 렌더링
      renderContent('text', 'text');
    } else if (subnavEl) {
      // Art에만 subnav 표시
      subnavEl.style.display = 'flex';
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
      if (target === 'text') {
        // ✅ Text는 subnav 없이 바로 statement
        renderContent('text', 'text');
      } else if (subnavEl) {
        subnavEl.style.display = 'flex';
        const firstSubtab = subnavEl.querySelector('.subtab');
        if (firstSubtab) {
          setActiveTab(firstSubtab, '.subtab');
          renderContent(target, firstSubtab.dataset.subtab);
        }
      }
    });
  });

  // subnav 탭 클릭 이벤트
  document.querySelectorAll('.subtab').forEach(subtab => {
    subtab.addEventListener('click', () => {
      setActiveTab(subtab, '.subtab');
      updateContentFromTabs();
    });
  });
});
