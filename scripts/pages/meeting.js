GVG.page(async (D) => {
  const { esc, fmtDate, links, SEGMENTS, plural, inlineMd, host, avatar, $, $$, param, renderMarkdown } = GVG;
  const app = $('#meeting-app');
  const m = D.meetingById[Number(param('id'))];
  if (!m) {
    app.innerHTML = `<div class="empty" style="margin-top:48px">Встреча не найдена. <a href="meetings.html">Ко всем встречам</a></div>`;
    return;
  }
  document.title = `${m.id}. ${m.short} — gavagAI`;
  const seg = SEGMENTS[m.segment];
  const people = D.peopleByMeeting[m.id] || [];
  const prev = D.meetingById[m.id - 1], next = D.meetingById[m.id + 1];
  const themes = D.themes.filter((t) => t.meetings.includes(m.id));

  const lit = (list) => `<ul class="lit-list">${list.map((l) => `
    <li><div><a href="${esc(l.url)}" target="_blank" rel="noopener">${inlineMd(l.title)}</a><span class="host">${esc(host(l.url))}</span></div></li>`).join('')}</ul>`;

  const status = m.next ? (m.isToday ? 'сегодня' : 'следующая встреча') : (m.past ? 'состоялась' : 'впереди');
  const blocks = [];
  if (m.summary?.length) {
    blocks.push(`<section class="block summary" id="summary"><h2>Кратко</h2>
      ${m.summary.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
      ${m.question ? `<div class="callout" data-seg="${m.segment}"><b>Точка маршрута</b>${esc(m.question)}</div>` : ''}</section>`);
  }
  if (m.goal) blocks.push(`<section class="block" id="goal"><h2>Цель</h2><p style="font-size:17px">${esc(m.goal).replace(/\n/g, '<br>')}</p></section>`);
  if (m.plan?.length) blocks.push(`<section class="block" id="plan"><h2>План занятия</h2><ol class="plan">${m.plan.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></section>`);
  if (m.literature?.length) blocks.push(`<section class="block" id="literature"><h2>Основная литература <span class="count">${m.literature.length}</span></h2>${lit(m.literature)}</section>`);
  if (m.additional?.length) blocks.push(`<section class="block" id="additional"><h2>Дополнительные материалы <span class="count">${m.additional.length}</span></h2>${lit(m.additional)}</section>`);
  if (m.concepts?.length) blocks.push(`<section class="block" id="concepts"><h2>Ключевые понятия <span class="count">${m.concepts.length}</span></h2>
    <div class="chips">${m.concepts.map((c) => `<a class="chip chip-sm" href="${links.concept(c)}">${esc(c)}</a>`).join('')}</div></section>`);
  if (people.length) blocks.push(`<section class="block" id="people"><h2>Персоналии <span class="count">${people.length}</span></h2>
    <div class="people-row">${people.map((p) => `<a class="person-chip" href="${links.person(p.id)}">${avatar(p)}${esc(p.name)}</a>`).join('')}</div>
    ${m.authors ? `<p class="muted small" style="margin-top:12px">${esc(m.authors)}</p>` : ''}</section>`);
  if (m.notes) blocks.push(`<section class="block" id="notes"><h2>Конспект встречи</h2><div class="notes-card"><div class="prose" id="notes-body"><div class="loading"><div class="spinner"></div>Загрузка конспекта…</div></div></div></section>`);
  else if (m.past) blocks.push(`<section class="block" id="notes"><h2>Конспект встречи</h2><div class="empty">Конспект этой встречи готовится.</div></section>`);

  const sectionsToc = [['summary', 'Кратко'], ['goal', 'Цель'], ['plan', 'План'], ['literature', 'Литература'], ['additional', 'Дополнительно'],
    ['concepts', 'Понятия'], ['people', 'Персоналии'], ['notes', 'Конспект']].filter(([id]) => blocks.some((b) => b.includes(`id="${id}"`)));

  app.innerHTML = `
    <header class="page-head meeting-head" data-seg="${m.segment}">
      <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a>›<a href="meetings.html">Встречи</a>›<span>${m.id}</span></nav>
      <div class="num-row"><span class="num-bullet">${m.id}</span>
        <div><div class="badge">${seg.title} · ${seg.range}</div><div class="muted small">Станция «${esc(m.short)}»</div></div></div>
      <h1>${esc(m.title)}</h1>
      <div class="facts">
        <span>📅 <b>${fmtDate(m.date)}</b>${m.time ? ', ' + esc(m.time) : ''}</span>
        <span>● ${status}</span>
        ${m.tags?.length ? `<span>${m.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ')}</span>` : ''}
      </div>
    </header>
    <div class="layout" data-seg="${m.segment}">
      <div>${blocks.join('')}</div>
      <aside>
        ${m.audio ? `<div class="card aside-card audio-card"><h3>Аудиозапись</h3><audio controls preload="none" src="${esc(m.audio)}"></audio>
          <a class="small" href="${esc(m.audio)}" download>Скачать mp3</a></div>` : ''}
        <nav class="card aside-card" aria-label="Разделы страницы"><h3>На странице</h3>
          <div class="toc"><ol>${sectionsToc.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ol></div></nav>
        <div class="card aside-card toc-card" id="notes-toc" hidden><h3>Содержание конспекта</h3><div class="toc"><ol></ol></div></div>
        ${themes.length ? `<div class="card aside-card"><h3>Темы</h3><div class="chips">${themes.map((t) => `<a class="chip chip-sm" href="${links.theme(t.id)}">${esc(t.title)}</a>`).join('')}</div></div>` : ''}
        <a class="btn btn-ghost btn-sm" href="metro.html#station-${m.id}">Показать на схеме линии →</a>
      </aside>
    </div>
    <nav class="pager" aria-label="Соседние встречи">
      ${prev ? `<a class="card card-link" href="${links.meeting(prev.id)}"><small>← Встреча ${prev.id}</small><b>${esc(prev.short)}</b></a>` : '<span></span>'}
      ${next ? `<a class="card card-link next" href="${links.meeting(next.id)}"><small>Встреча ${next.id} →</small><b>${esc(next.short)}</b></a>` : ''}
    </nav>`;

  if (m.notes) {
    const body = $('#notes-body');
    try {
      const r = await fetch(m.notes);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const box = renderMarkdown(await r.text());
      body.innerHTML = '';
      body.appendChild(box);
      buildNotesToc(body);
    } catch (err) {
      body.innerHTML = `<p class="muted">Не удалось загрузить конспект (${esc(err.message)}).</p>`;
    }
  }

  function buildNotesToc(body) {
    const heads = $$('h1, h2', body).filter((h) => h.textContent.trim());
    if (heads.length < 2) return;
    const top = heads.some((h) => h.tagName === 'H1') ? 'H1' : 'H2';
    const tocBox = $('#notes-toc');
    tocBox.hidden = false;
    $('ol', tocBox).innerHTML = heads.map((h) =>
      `<li class="${h.tagName === top ? '' : 'lvl-2'}"><a href="#${h.id}">${esc(h.textContent.trim())}</a></li>`).join('');
    const tocLinks = $$('a', tocBox);
    const byId = Object.fromEntries(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove('active'));
        const a = byId[e.target.id];
        if (a) { a.classList.add('active'); const c = a.closest('.toc'); c.scrollTop = a.offsetTop - c.clientHeight / 2; }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
  }
});
