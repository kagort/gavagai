/* ==========================================================================
   gavagAI — общее ядро сайта: данные, шапка/подвал, поиск, вспомогательные функции.
   Каждая страница вызывает GVG.page(fn): шапка рисуется сразу, fn получает данные.
   ========================================================================== */
(function () {
  'use strict';

  const SEGMENTS = {
    phil:  { title: 'Философские основания', short: 'Философия', range: 'встречи 1–4' },
    tech:  { title: 'Технический поворот',   short: 'Технологии', range: 'встречи 5–8' },
    synth: { title: 'Синтез',                short: 'Синтез',     range: 'встречи 9–11' },
    base:  { title: 'База КТМ',              short: 'База',       range: 'вне программы' }
  };

  const NAV = [
    { href: 'index.html',    label: 'Главная' },
    { href: 'meetings.html', label: 'Встречи' },
    { href: 'people.html',   label: 'Персоналии' },
    { href: 'topics.html',   label: 'Темы' },
    { href: 'metro.html',    label: 'Схема линии' },
    { href: 'atlas.html',    label: 'Атлас' }
  ];

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  /* ---------- Утилиты ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"“”„()]/g, ' ');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const param = (name) => new URLSearchParams(location.search).get(name);

  function parseDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function fmtDate(iso, opts = {}) {
    if (!iso) return '';
    const d = parseDate(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}${opts.year === false ? '' : ' ' + d.getFullYear()}`;
  }
  function yearsOf(p) {
    const b = p.birth || {}, d = p.death || {};
    if (b.year != null && b.year < 0) return `ок. ${-b.year} — ${-(d.year || 0)} до н. э.`;
    const by = b.year ?? '?';
    if (p.alive) return b.year != null ? `род. ${by}` : 'годы жизни не документированы';
    return `${by} — ${d.year ?? '?'}`;
  }
  function initials(p) {
    const parts = (p.full || p.name).split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (p.name || '?').slice(0, 2);
  }
  function avatar(p, cls = '') {
    const inner = p.img
      ? `<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.remove()">`
      : '';
    return `<span class="avatar ${cls}" data-seg="${p.segment}" aria-hidden="true">${inner || esc(initials(p))}</span>`;
  }
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function slug(s) {
    return norm(s).replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
  }
  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }
  /* Лёгкая inline-разметка: *курсив*, **жирный** — для названий литературы */
  function inlineMd(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*([^*]+?)\*/g, '<i>$1</i>').replace(/\*/g, '');
  }
  function highlight(text, query) {
    const safe = esc(text);
    const words = norm(query).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return safe;
    const src = norm(text);
    const marks = [];
    words.forEach((w) => {
      let i = src.indexOf(w);
      while (i !== -1) { marks.push([i, i + w.length]); i = src.indexOf(w, i + w.length); }
    });
    if (!marks.length) return safe;
    marks.sort((a, b) => a[0] - b[0]);
    let out = '', pos = 0;
    marks.forEach(([a, b]) => {
      if (a < pos) return;
      out += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>';
      pos = b;
    });
    return out + esc(text.slice(pos));
  }

  const links = {
    meeting: (id) => `meeting.html?id=${id}`,
    person: (id) => `person.html?id=${encodeURIComponent(id)}`,
    theme: (id) => `topics.html#${encodeURIComponent(id)}`,
    concept: (c) => `topics.html?concept=${encodeURIComponent(c)}#concepts`
  };

  /* ---------- Данные ---------- */
  let dataPromise = null;
  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  }
  function load() {
    if (dataPromise) return dataPromise;
    dataPromise = Promise.all([
      getJSON('data/meetings.json'), getJSON('data/people.json'),
      getJSON('data/themes.json'), getJSON('data/edges.json')
    ]).then(([m, p, t, e]) => build(m.meetings, p.people, t.themes, e.edges));
    return dataPromise;
  }

  function build(meetings, people, themes, edges) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    meetings.sort((a, b) => a.id - b.id);
    let nextFound = false;
    meetings.forEach((m) => {
      const d = parseDate(m.date);
      m.past = d < today;
      m.isToday = +d === +today;
      if (!m.past && !nextFound) { m.next = true; nextFound = true; }
    });
    const personById = Object.fromEntries(people.map((p) => [p.id, p]));
    const meetingById = Object.fromEntries(meetings.map((m) => [m.id, m]));
    const themeById = Object.fromEntries(themes.map((t) => [t.id, t]));
    const themesByPerson = {};
    themes.forEach((t) => t.people.forEach((id) => (themesByPerson[id] = themesByPerson[id] || []).push(t)));
    const peopleByMeeting = {};
    people.forEach((p) => { if (p.meeting) (peopleByMeeting[p.meeting] = peopleByMeeting[p.meeting] || []).push(p); });
    const concepts = {};
    meetings.forEach((m) => (m.concepts || []).forEach((c) => {
      const key = c.trim();
      (concepts[key] = concepts[key] || []).push(m.id);
    }));
    const edgesByPerson = {};
    edges.forEach((e) => {
      (edgesByPerson[e.source] = edgesByPerson[e.source] || []).push({ ...e, other: e.target, dir: 'out' });
      (edgesByPerson[e.target] = edgesByPerson[e.target] || []).push({ ...e, other: e.source, dir: 'in' });
    });
    const chrono = people.slice().sort((a, b) => (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999));
    return {
      meetings, people, themes, edges, personById, meetingById, themeById, themesByPerson,
      peopleByMeeting, concepts, edgesByPerson, chrono,
      nextMeeting: meetings.find((m) => m.next) || null
    };
  }

  /* ---------- Тема оформления ---------- */
  function currentTheme() {
    const t = document.documentElement.dataset.theme;
    if (t) return t;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('gvg-theme', next); } catch (e) { /* приватный режим */ }
    document.dispatchEvent(new CustomEvent('gvg:theme', { detail: next }));
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /* ---------- Шапка и подвал ---------- */
  const ICON_SEARCH = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  function renderChrome() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const current = document.body.dataset.nav || page;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    const header = $('#site-header');
    if (header) {
      header.innerHTML = `
        <a class="skip-link" href="#main">К содержанию</a>
        <div class="site-header"><div class="wrap">
          <a class="brand" href="index.html" aria-label="gavagAI — на главную">
            <span class="brand-name">gavag<b>AI</b></span>
          </a>
          <nav class="nav" aria-label="Разделы">
            ${NAV.map((n) => `<a href="${n.href}"${n.href === current ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}
          </nav>
          <div class="header-actions">
            <button class="search-trigger" type="button" data-open-search aria-label="Поиск по сайту">
              ${ICON_SEARCH}<span>Поиск</span><kbd>${isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
            <button class="icon-btn theme-toggle" type="button" aria-label="Сменить тему оформления" title="Светлая / тёмная тема">
              <svg class="i-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              <svg class="i-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
          </div>
        </div></div>`;
      $('.theme-toggle', header).addEventListener('click', toggleTheme);
    }
    const footer = $('#site-footer');
    if (footer) {
      footer.innerHTML = `
        <footer class="site-footer"><div class="wrap">
          <div>Научно-практический семинар «gavagAI» · ПГУ · 2025/26<br>
          <span class="small">Материалы — для образовательных целей; внешние ссылки ведут на сторонние ресурсы.</span></div>
          <nav aria-label="Разделы (подвал)">${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join('')}</nav>
        </div></footer>`;
    }
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-search]')) { e.preventDefault(); openSearch(); }
    });
  }

  /* ---------- Глобальный поиск ---------- */
  let searchIndex = null, palette = null, selected = 0, lastFocus = null;

  function buildIndex(D) {
    const items = [];
    D.meetings.forEach((m) => items.push({
      type: 'Встречи', title: `${m.id}. ${m.title}`, sub: `${fmtDate(m.date)} · ${SEGMENTS[m.segment].title}`,
      href: links.meeting(m.id), seg: m.segment, icon: m.id,
      text: norm([m.title, m.short, m.goal, (m.summary || []).join(' '), m.authors, (m.concepts || []).join(' '),
        (m.literature || []).map((l) => l.title).join(' '), (m.additional || []).map((l) => l.title).join(' '), (m.plan || []).join(' ')].join(' '))
    }));
    D.people.forEach((p) => items.push({
      type: 'Персоналии', title: p.full || p.name, sub: `${yearsOf(p)} · ${(p.fields || []).slice(0, 2).join(', ')}`,
      href: links.person(p.id), seg: p.segment, icon: initials(p),
      text: norm([p.name, p.full, (p.fields || []).join(' '), (p.keywords || []).join(' '), p.contribution, p.works, p.role, p.country, p.birth?.place].join(' '))
    }));
    D.themes.forEach((t) => items.push({
      type: 'Темы', title: t.title, sub: t.description, href: links.theme(t.id), icon: '#',
      text: norm(t.title + ' ' + t.description)
    }));
    Object.entries(D.concepts).forEach(([c, ms]) => items.push({
      type: 'Понятия', title: c, sub: 'встреч' + (ms.length > 1 ? 'и ' : 'а ') + ms.join(', '), href: links.concept(c),
      seg: D.meetingById[ms[0]].segment, icon: 'Aa', text: norm(c)
    }));
    D.meetings.forEach((m) => [...(m.literature || []), ...(m.additional || [])].forEach((l) => items.push({
      type: 'Литература', title: l.title.replace(/\*/g, ''), sub: `встреча ${m.id} · ${host(l.url)}`, href: l.url, external: true,
      seg: m.segment, icon: '↗', text: norm(l.title)
    })));
    items.forEach((it) => (it.ntitle = norm(it.title)));
    return items;
  }

  function search(q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length || !searchIndex) return [];
    const res = [];
    for (const it of searchIndex) {
      let score = 0, ok = true;
      for (const w of words) {
        if (it.ntitle.startsWith(w)) score += 12;
        else if (it.ntitle.includes(' ' + w)) score += 9;
        else if (it.ntitle.includes(w)) score += 6;
        else if (it.text.includes(w)) score += 2;
        else { ok = false; break; }
      }
      if (ok) res.push({ it, score });
    }
    const order = ['Персоналии', 'Встречи', 'Темы', 'Понятия', 'Литература'];
    res.sort((a, b) => b.score - a.score);
    const groups = {};
    res.forEach(({ it }) => { (groups[it.type] = groups[it.type] || []).push(it); });
    return order.filter((g) => groups[g]).map((g) => [g, groups[g].slice(0, g === 'Литература' ? 5 : 8)]);
  }

  function ensurePalette() {
    if (palette) return palette;
    palette = document.createElement('div');
    palette.className = 'modal';
    palette.setAttribute('role', 'dialog');
    palette.setAttribute('aria-modal', 'true');
    palette.setAttribute('aria-label', 'Поиск по сайту');
    palette.innerHTML = `
      <div class="modal-box">
        <label class="palette-input">${ICON_SEARCH}
          <input type="search" placeholder="Встречи, персоналии, понятия, литература…" autocomplete="off" spellcheck="false"
                 role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list">
          <kbd>Esc</kbd>
        </label>
        <div class="palette-results" id="palette-list" role="listbox"></div>
        <div class="palette-hint"><span><kbd>↑</kbd> <kbd>↓</kbd> выбор</span><span><kbd>Enter</kbd> открыть</span><span><kbd>Esc</kbd> закрыть</span></div>
      </div>`;
    document.body.appendChild(palette);
    const input = $('input', palette);
    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('keydown', (e) => {
      const opts = $$('.palette-item', palette);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!opts.length) return;
        selected = (selected + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        markSelected();
      } else if (e.key === 'Enter') {
        const a = opts[selected];
        if (a) { e.preventDefault(); a.click(); }
      }
    });
    palette.addEventListener('click', (e) => { if (e.target === palette) closeSearch(); });
    palette.addEventListener('mousemove', (e) => {
      const a = e.target.closest('.palette-item');
      if (!a) return;
      const i = $$('.palette-item', palette).indexOf(a);
      if (i !== selected) { selected = i; markSelected(false); }
    });
    return palette;
  }
  function markSelected(scroll = true) {
    $$('.palette-item', palette).forEach((a, i) => {
      a.setAttribute('aria-selected', i === selected ? 'true' : 'false');
      if (i === selected && scroll) a.scrollIntoView({ block: 'nearest' });
    });
  }
  function renderResults(q) {
    const box = $('.palette-results', palette);
    selected = 0;
    if (!searchIndex) { box.innerHTML = '<div class="palette-empty">Загрузка…</div>'; return; }
    if (!q.trim()) {
      box.innerHTML = `<div class="palette-group">Быстрые переходы</div>` + NAV.slice(1).map((n) =>
        `<a class="palette-item" role="option" href="${n.href}"><span class="pi-icon">→</span><span class="pi-text"><span class="pi-title">${n.label}</span></span></a>`).join('');
      markSelected(false);
      return;
    }
    const groups = search(q);
    if (!groups.length) { box.innerHTML = `<div class="palette-empty">Ничего не найдено по запросу «${esc(q)}»</div>`; return; }
    box.innerHTML = groups.map(([g, list]) => `<div class="palette-group">${g}</div>` + list.map((it) => `
      <a class="palette-item" role="option" href="${esc(it.href)}"${it.external ? ' target="_blank" rel="noopener"' : ''}>
        <span class="pi-icon" ${it.seg ? `data-seg="${it.seg}"` : ''}>${esc(it.icon)}</span>
        <span class="pi-text"><span class="pi-title">${highlight(it.title, q)}</span><span class="pi-sub">${esc(it.sub)}</span></span>
      </a>`).join('')).join('');
    markSelected(false);
  }
  function openSearch(initial = '') {
    ensurePalette();
    lastFocus = document.activeElement;
    palette.classList.add('open');
    document.body.style.overflow = 'hidden';
    const input = $('input', palette);
    input.value = initial;
    renderResults(initial);
    input.focus();
    load().then((D) => {
      if (!searchIndex) { searchIndex = buildIndex(D); renderResults(input.value); }
    }).catch(() => {});
  }
  function closeSearch() {
    if (!palette || !palette.classList.contains('open')) return;
    palette.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape') { closeSearch(); closeDrawer(); }
  });

  /* ---------- Выезжающая панель (метро, атлас) ---------- */
  let drawer = null, backdrop = null, drawerFocus = null;
  function ensureDrawer() {
    if (drawer) return;
    backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'drawer-title');
    drawer.innerHTML = `<div class="drawer-head"><button class="drawer-close" type="button" aria-label="Закрыть">✕</button>
      <div class="kicker"></div><h2 id="drawer-title"></h2><div class="sub"></div></div><div class="drawer-body"></div>`;
    document.body.append(backdrop, drawer);
    backdrop.addEventListener('click', closeDrawer);
    $('.drawer-close', drawer).addEventListener('click', closeDrawer);
  }
  function openDrawer({ seg, kicker, title, sub, body }) {
    ensureDrawer();
    drawer.dataset.seg = seg || 'base';
    $('.kicker', drawer).textContent = kicker || '';
    $('h2', drawer).textContent = title || '';
    $('.sub', drawer).textContent = sub || '';
    const b = $('.drawer-body', drawer);
    b.innerHTML = body || '';
    b.scrollTop = 0;
    if (!drawer.classList.contains('open')) drawerFocus = document.activeElement;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    $('.drawer-close', drawer).focus();
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    if (drawerFocus && document.contains(drawerFocus)) drawerFocus.focus();
  }

  /* ---------- Markdown ---------- */
  function renderMarkdown(md) {
    const clean = md
      .replace(/!\\?\[\\?\[[^\]\\]*\\?\]\\?\]/g, '')          // встраивания Obsidian ![[...]]
      .replace(/<\/strong><\/summary>/g, '');
    const html = window.marked ? window.marked.parse(clean, { gfm: true, breaks: false }) : `<pre>${esc(clean)}</pre>`;
    const box = document.createElement('div');
    box.innerHTML = html;
    const used = {};
    $$('h1, h2, h3, h4', box).forEach((h) => {
      let id = slug(h.textContent);
      if (used[id]) id += '-' + (++used[id]); else used[id] = 1;
      h.id = id;
    });
    $$('a[href]', box).forEach((a) => {
      const href = a.getAttribute('href');
      if (/\.md$/i.test(href)) { a.classList.add('md-link'); a.dataset.md = href; }
      else if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    });
    $$('img', box).forEach((img) => { img.loading = 'lazy'; img.setAttribute('onerror', 'this.remove()'); });
    return box;
  }
  let mdModal = null;
  async function openMdModal(url, title) {
    if (!mdModal) {
      mdModal = document.createElement('div');
      mdModal.className = 'modal';
      mdModal.setAttribute('role', 'dialog');
      mdModal.setAttribute('aria-modal', 'true');
      mdModal.innerHTML = `<div class="modal-box"><div class="modal-head"><h2></h2><button class="icon-btn" type="button" aria-label="Закрыть">✕</button></div><div class="modal-body prose"></div></div>`;
      document.body.appendChild(mdModal);
      const close = () => { mdModal.classList.remove('open'); document.body.style.overflow = ''; };
      $('button', mdModal).addEventListener('click', close);
      mdModal.addEventListener('click', (e) => { if (e.target === mdModal) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }
    $('h2', mdModal).textContent = title;
    const body = $('.modal-body', mdModal);
    body.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка…</div>';
    mdModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('button', mdModal).focus();
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      body.innerHTML = '';
      body.appendChild(renderMarkdown(await r.text()));
    } catch (err) {
      body.innerHTML = `<p class="muted">Не удалось загрузить <code>${esc(url)}</code>.</p>`;
    }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.md-link');
    if (a) { e.preventDefault(); openMdModal(a.dataset.md, a.textContent); }
  });

  /* ---------- Точка входа страницы ---------- */
  function page(fn) {
    const run = () => {
      renderChrome();
      if (!fn) return;
      const main = $('#main');
      load().then((D) => fn(D)).catch((err) => {
        console.error(err);
        if (main) main.innerHTML = `<div class="wrap"><div class="empty" style="margin-top:48px">
          Не удалось загрузить данные сайта.<br><span class="small">${esc(err.message)}</span><br>
          <span class="small">Если вы открыли файл напрямую с диска, запустите локальный сервер: <code>python3 -m http.server</code></span></div></div>`;
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }

  window.GVG = {
    SEGMENTS, NAV, esc, norm, $, $$, param, fmtDate, parseDate, yearsOf, initials, avatar, plural, slug, host, inlineMd,
    highlight, links, load, page, openSearch, openDrawer, closeDrawer, renderMarkdown, openMdModal, cssVar, currentTheme
  };
})();
