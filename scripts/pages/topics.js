GVG.page((D) => {
  const { esc, norm, links, avatar, plural, highlight, $, $$, param } = GVG;
  const app = $('#topics-app');
  const concepts = Object.entries(D.concepts).sort((a, b) => a[0].localeCompare(b[0], 'ru', { sensitivity: 'base' }));

  const themeCard = (t) => `
    <article class="card theme-card" id="${t.id}">
      <h2>${esc(t.title)}</h2>
      <p>${esc(t.description)}</p>
      <h4>Персоналии · ${t.people.length}</h4>
      <div class="people-row">${t.people.map((id) => D.personById[id]).map((p) => `<a class="person-chip" href="${links.person(p.id)}">${avatar(p)}${esc(p.name)}</a>`).join('')}</div>
      ${t.meetings.length ? `<h4>Встречи</h4><div class="chips">${t.meetings.map((n) => D.meetingById[n]).map((m) =>
        `<a class="chip chip-sm" data-seg="${m.segment}" href="${links.meeting(m.id)}"><i class="dot"></i>${m.id}. ${esc(m.short)}</a>`).join('')}</div>` : ''}
      <p style="margin:16px 0 0"><a class="small" href="people.html?theme=${t.id}">Все персоналии темы в каталоге →</a></p>
    </article>`;

  app.innerHTML = `
    <div class="topics-layout">
      <nav class="topics-nav" aria-label="Темы">
        <h3>Темы</h3>
        ${D.themes.map((t) => `<a href="#${t.id}" data-nav-id="${t.id}"><span>${esc(t.title)}</span><span class="muted">${t.people.length}</span></a>`).join('')}
        <h3>Словарь</h3>
        <a href="#concepts" data-nav-id="concepts"><span>Понятия A–Я</span><span class="muted">${concepts.length}</span></a>
      </nav>
      <div>
        ${D.themes.map(themeCard).join('')}
        <section class="card theme-card" id="concepts">
          <h2>Словарь понятий</h2>
          <p>${concepts.length} ${plural(concepts.length, 'понятие', 'понятия', 'понятий')} из программ встреч. Цифра справа — номер встречи, где понятие обсуждалось.</p>
          <div class="toolbar" style="margin:14px 0 18px">
            <label class="field"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <span class="visually-hidden">Фильтр понятий</span><input type="search" id="c-q" placeholder="Фильтр понятий…"></label>
          </div>
          <div class="concepts-index" id="c-index"></div>
        </section>
      </div>
    </div>`;

  function renderConcepts(q = '') {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const list = concepts.filter(([c]) => words.every((w) => norm(c).includes(w)));
    const groups = {};
    list.forEach(([c, ms]) => {
      const l = c[0].toUpperCase();
      (groups[l] = groups[l] || []).push([c, ms]);
    });
    $('#c-index').innerHTML = list.length ? Object.entries(groups).map(([l, items]) => `
      <div class="concept-group"><h3>${esc(l)}</h3>
        ${items.map(([c, ms]) => `<div class="concept" data-concept="${esc(c)}"><span>${highlight(c, q)}</span>
          <span class="refs">${ms.map((n) => `<a data-seg="${D.meetingById[n].segment}" href="${links.meeting(n)}#concepts" title="Встреча ${n}: ${esc(D.meetingById[n].short)}">${n}</a>`).join('')}</span></div>`).join('')}
      </div>`).join('') : '<p class="muted">Ничего не найдено.</p>';
  }
  renderConcepts();
  $('#c-q').addEventListener('input', (e) => renderConcepts(e.target.value));

  const want = param('concept');
  if (want) {
    const el = $$('.concept').find((x) => x.dataset.concept === want);
    if (el) {
      el.classList.add('flash');
      setTimeout(() => el.scrollIntoView({ block: 'center' }), 60);
    }
  } else if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) setTimeout(() => el.scrollIntoView(), 60);
  }

  // Подсветка текущей темы в боковой навигации
  const navLinks = Object.fromEntries($$('[data-nav-id]').map((a) => [a.dataset.navId, a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      Object.values(navLinks).forEach((a) => a.classList.remove('active'));
      navLinks[e.target.id]?.classList.add('active');
    });
  }, { rootMargin: '-90px 0px -65% 0px' });
  $$('.theme-card').forEach((c) => io.observe(c));
});
