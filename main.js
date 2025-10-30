/***************************************
 * AUTO NAV / SUBNAV + STATIC CV & CONTACT
 * 기존 UI / 스타일 변경 없음
 ***************************************/

const CONTENTS = (window && window.contents) ? window.contents : [];

// -----------------------------
// 기본 유틸
// -----------------------------
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const cap = (s = '') => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const uniq = (arr) => [...new Set(arr)];

// -----------------------------
// data.js 기반 nav / subnav 추출
// -----------------------------
function getNavList() {
  return uniq(CONTENTS.map(c => c.nav).filter(Boolean));
}
function getSubnavList(nav) {
  return uniq(CONTENTS.filter(c => c.nav === nav && c.subnav).map(c => c.subnav));
}

// -----------------------------
// NAV 자동 생성
// -----------------------------
function buildNavUI() {
  const navs = getNavList();
  const navEl = document.querySelector('nav'); // 기존 nav 그대로 사용
  if (!navEl) return;

  const dynamicTabs = navs.map(n => `<a class="tab" data-tab="${n}">${cap(n)}</a>`).join('');
  const staticTabs = `
    <a class="tab" data-tab="cv">CV</a>
    <a class="tab" data-tab="contact">Contact</a>
  `;

  navEl.innerHTML = dynamicTabs + staticTabs;

  $$('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const nav = tab.dataset.tab;
      e.preventDefault();

      // ✅ CV / CONTACT 처리
      if (nav === 'cv' || nav === 'contact') {
        showOnlyPage(`${nav}Page`);
        setActiveNav(nav);
        hideSubnav(); // ← 서브탭 숨김
        return;
      }

      // ✅ subnav 없고 콘텐츠 1개면 detail로 이동
      const related = CONTENTS.filter(i => i.nav === nav);
      const uniqueSubs = [...new Set(related.map(i => i.subnav).filter(Boolean))];
      if (uniqueSubs.length === 0 && related.length === 1) {
        const target = related[0];
        const isGithubPages = window.location.pathname.includes('/jangdaeun/');
        const basePath = isGithubPages ? '/jangdaeun/' : './';
        window.location.href = `${basePath}detail.html?id=${encodeURIComponent(target.id)}&nav=${encodeURIComponent(nav)}`;
        return;
      }


      // 일반 nav 처리
      showOnlyPage('artPage'); // navPage 없을 경우 기본 artPage에 렌더
      setActiveNav(nav);
      renderSubnav(nav);
      const subs = getSubnavList(nav);
      const firstSub = subs[0] || '';
      if (subs.length) setActiveSub(firstSub);
      renderList(nav, firstSub);
      resetScrollToTop();
    });
  });
}

// -----------------------------
// SUBNAV 자동 생성
// -----------------------------
function renderSubnav(nav) {
  const artSN = $('#artSubnav');
  const textSN = $('#textSubnav');
  const wrap = artSN || textSN;
  if (!wrap) return;

  if (artSN && textSN) {
    artSN.style.display = 'none';
    textSN.style.display = 'none';
  }

  const subs = getSubnavList(nav);
  if (!subs.length) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }

  wrap.style.display = 'flex';
  wrap.innerHTML = subs.map(s => `<div class="subtab" data-subtab="${s}">${cap(s)}</div>`).join('');

  $$('.subtab').forEach(sub => {
    sub.addEventListener('click', () => {
      const s = sub.dataset.subtab;
      setActiveSub(s);
      renderList(nav, s);
      resetScrollToTop();
    });
  });
}

// ✅ subnav 강제 숨김 함수
function hideSubnav() {
  const artSN = $('#artSubnav');
  const textSN = $('#textSubnav');
  if (artSN) artSN.style.display = 'none';
  if (textSN) textSN.style.display = 'none';
}

// -----------------------------
// 리스트 렌더링
// -----------------------------
function renderList(nav, sub) {
  const visiblePage = [...$$('.page')].find(p => p.style.display !== 'none') || $('#artPage');
  if (!visiblePage) return;

  const lists = [...visiblePage.querySelectorAll('.content-list')];
  lists.forEach(el => { el.innerHTML = ''; el.style.display = 'none'; });

  const container = lists[0] || null;
  if (!container) return;

  const data = sub
    ? CONTENTS.filter(c => c.nav === nav && c.subnav === sub)
    : CONTENTS.filter(c => c.nav === nav);

  container.style.display = 'grid';
  container.innerHTML = data.map(item => `
    <a class="thumbnail" id="thumb-${item.id}"
       href="./detail.html?id=${encodeURIComponent(item.id)}&nav=${encodeURIComponent(item.nav)}&subnav=${encodeURIComponent(item.subnav || '')}">
      ${item.img ? `<img src="${item.img}" loading="lazy" alt="${item.title || ''}" />` : ''}
      ${item.title ? `<p>${item.title}</p>` : ''}
      ${item.subtitle ? `<h1>${item.subtitle}</h1>` : ''}
    </a>
  `).join('') || `<p class="empty">No contents yet.</p>`;
}

// -----------------------------
// 활성화 / 표시 / 스크롤 초기화
// -----------------------------
function setActiveNav(nav) {
  $$('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === nav));
}
function setActiveSub(sub) {
  $$('.subtab').forEach(el => el.classList.toggle('active', el.dataset.subtab === sub));
}
function showOnlyPage(showId) {
  $$('.page').forEach(p => p.style.display = 'none');
  const el = document.getElementById(showId);
  if (el) el.style.display = 'block';
}
function resetScrollToTop() {
  const se = document.scrollingElement || document.documentElement;
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    se.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

// -----------------------------
// 초기화
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  buildNavUI();

  const url = new URL(location.href);
  let nav = url.searchParams.get('nav');
  let sub = url.searchParams.get('subnav') || '';
  const navs = getNavList();

  // ✅ CV / CONTACT 초기 진입 처리
  if (nav === 'cv') {
    showOnlyPage('cvPage');
    setActiveNav('cv');
    hideSubnav();
    return;
  }
  if (nav === 'contact') {
    showOnlyPage('contactPage');
    setActiveNav('contact');
    hideSubnav();
    return;
  }

  if (!nav || !navs.includes(nav)) nav = navs[0];

  // ✅ subnav 없고 콘텐츠 1개면 detail로 바로 이동
  {
    const related = CONTENTS.filter(i => i.nav === nav);
    const uniqueSubs = [...new Set(related.map(i => i.subnav).filter(Boolean))];
    if (uniqueSubs.length === 0 && related.length === 1) {
      const target = related[0];
      const isGithubPages = window.location.pathname.includes('/jangdaeun/');
      const basePath = isGithubPages ? '/jangdaeun/' : './';
      window.location.href = `${basePath}detail.html?id=${encodeURIComponent(target.id)}&nav=${encodeURIComponent(nav)}`;
      return;
    }
  }


  // 일반 nav 처리
  showOnlyPage('artPage');
  setActiveNav(nav);
  renderSubnav(nav);
  const subs = getSubnavList(nav);
  if (subs.length) {
    if (!sub || !subs.includes(sub)) sub = subs[0];
    setActiveSub(sub);
  } else {
    sub = '';
  }
  renderList(nav, sub);
});
