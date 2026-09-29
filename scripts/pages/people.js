GVG.page((D) => {
  const { esc, norm, links, SEGMENTS, plural, highlight, avatar, yearsOf, $, $$, param } = GVG;
  const app = $('#people-app');
  const state = {
    q: param('q') || '', seg: param('seg') || 'all', theme: param('theme') || '', meeting: param('meeting') || '',
    status: param('status') || '', sort: param('sort') || 'chrono', letter: ''
  };
  const hay = Object.fromEntries(D.people.map((p) => [p.id, norm([p.name, p.full, (p.fields || []).join(' '), (p.keywords || []).join(' '),
    p.contribution, p.works, p.country, p.nationality, p.birth?.place, p.alma, p.affiliation, (p.institutions || []).join(' ')].join(' '))]));
  const letterOf = (p) => norm(p.name)[0].toUpperCase();
  const letters = [...new Set(D.people.map(letterOf))].sort((a, b) => a.localeCompare(b, 'ru'));

  app.innerHTML = `
    <div class="toolbar" role="search">
      <label class="field"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="visually-hidden">Поиск персоналий</span>
        <input type="search" id="p-q" placeholder="Имя, область, ключевое слово, университет…" value="${esc(state.q)}"></label>
      <div class="chips" role="group" aria-label="Линия">
        <button class="chip" data-seg-filter="all">Все</button>
        ${Object.keys(SEGMENTS).map((s) => `<button class="chip" data-seg-filter="${s}"><i class="dot" data-seg="${s}"></i>${SEGMENTS[s].short}</button>`).join('')}
      </div>
    </div>
    <div class="toolbar" style="margin-top:-8px">
      <select class="select" id="p-theme" aria-label="Тема"><option value="">Все темы</option>
        ${D.themes.map((t) => `<option value="${t.id}">${esc(t.title)} (${t.people.length})</option>`).join('')}</select>
      <select class="select" id="p-meeting" aria-label="Встреча"><option value="">Все встречи</option>
        ${D.meetings.filter((m) => D.peopleByMeeting[m.id]).map((m) => `<option value="${m.id}">${m.id}. ${esc(m.short)}</option>`).join('')}</select>
      <select class="select" id="p-status" aria-label="Статус"><option value="">Живы и ушедшие</option><option value="alive">Ныне живущие</option><option value="dead">Ушедшие</option></select>
      <select class="select" id="p-sort" aria-label="Сортировка"><option value="chrono">По году рождения</option><option value="alpha">По алфавиту</option><option value="meeting">По встречам</option></select>
      <span class="result-count" id="p-count" aria-live="polite"></span>
    </div>
    <div class="alpha" role="group" aria-label="Первая буква фамилии">
      ${letters.map((l) => `<button type="button" data-letter="${l}">${l}</button>`).join('')}
    </div>
    <div id="p-grid"></div>`;

  $('#p-theme').value = state.theme;
  $('#p-meeting').value = state.meeting;
  $('#p-status').value = state.status;
  $('#p-sort').value = state.sort;

  function card(p) {
    const m = p.meeting ? D.meetingById[p.meeting] : null;
    return `
      <a class="card card-link p-card" data-seg="${p.segment}" href="${links.person(p.id)}">
        ${avatar(p)}
        <div>
          <h3>${highlight(p.full || p.name, state.q)}</h3>
          <div class="years">${esc(yearsOf(p))}${p.country ? ' · ' + esc(p.country) : ''}</div>
          <div class="fields">${highlight((p.fields || []).slice(0, 3).join(' · '), state.q)}</div>
          <div class="badge">${m ? `встреча ${m.id} · ${esc(m.short)}` : SEGMENTS[p.segment].title}</div>
        </div>
      </a>`;
  }

  function render() {
    const words = norm(state.q).split(/\s+/).filter(Boolean);
    const theme = state.theme ? D.themeById[state.theme] : null;
    let list = D.people.filter((p) =>
      (state.seg === 'all' || p.segment === state.seg) &&
      (!theme || theme.people.includes(p.id)) &&
      (!state.meeting || String(p.meeting) === state.meeting) &&
      (!state.status || (state.status === 'alive') === !!p.alive) &&
      (!state.letter || letterOf(p) === state.letter) &&
      words.every((w) => hay[p.id].includes(w)));
    const by = {
      chrono: (a, b) => (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999) || a.name.localeCompare(b.name, 'ru'),
      alpha: (a, b) => a.name.localeCompare(b.name, 'ru'),
      meeting: (a, b) => (a.meeting || 99) - (b.meeting || 99) || (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999)
    };
    list = list.sort(by[state.sort] || by.chrono);
    $$('[data-seg-filter]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.segFilter === state.seg));
    $$('[data-letter]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.letter === state.letter));
    $('#p-count').textContent = `${list.length} ${plural(list.length, 'персоналия', 'персоналии', 'персоналий')}`;
    $('#p-grid').innerHTML = list.length ? `<div class="p-grid">${list.map(card).join('')}</div>`
      : '<div class="empty">Никого не нашли. Попробуйте изменить запрос или сбросить фильтры.</div>';
    const url = new URL(location.href);
    url.search = '';
    ['q', 'seg', 'theme', 'meeting', 'status', 'sort'].forEach((k) => {
      if (state[k] && !(k === 'seg' && state[k] === 'all') && !(k === 'sort' && state[k] === 'chrono')) url.searchParams.set(k, state[k]);
    });
    history.replaceState(null, '', url);
  }

  $('#p-q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
  $$('[data-seg-filter]').forEach((b) => b.addEventListener('click', () => { state.seg = b.dataset.segFilter; render(); }));
  $$('[data-letter]').forEach((b) => b.addEventListener('click', () => { state.letter = state.letter === b.dataset.letter ? '' : b.dataset.letter; render(); }));
  [['#p-theme', 'theme'], ['#p-meeting', 'meeting'], ['#p-status', 'status'], ['#p-sort', 'sort']].forEach(([sel, k]) =>
    $(sel).addEventListener('change', (e) => { state[k] = e.target.value; render(); }));
  render();
});
