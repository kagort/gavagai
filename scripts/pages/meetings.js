GVG.page((D) => {
  const { esc, norm, fmtDate, links, SEGMENTS, plural, highlight, $, $$, param } = GVG;
  const app = $('#meetings-app');
  const state = { q: param('q') || '', seg: param('seg') || 'all', audio: param('filter') === 'audio', notes: param('filter') === 'notes' };

  const hay = Object.fromEntries(D.meetings.map((m) => [m.id, norm([
    m.title, m.short, m.goal, (m.summary || []).join(' '), m.authors, (m.concepts || []).join(' '), (m.plan || []).join(' '),
    [...(m.literature || []), ...(m.additional || [])].map((l) => l.title).join(' '),
    (D.peopleByMeeting[m.id] || []).map((p) => p.name + ' ' + p.full).join(' ')
  ].join(' '))]));

  app.innerHTML = `
    <div class="toolbar" role="search">
      <label class="field"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="visually-hidden">Поиск по встречам</span>
        <input type="search" id="m-q" placeholder="Тема, автор, понятие…" value="${esc(state.q)}"></label>
      <div class="chips" role="group" aria-label="Линия">
        <button class="chip" data-seg-filter="all">Все</button>
        ${['phil', 'tech', 'synth'].map((s) => `<button class="chip" data-seg-filter="${s}"><i class="dot" data-seg="${s}"></i>${SEGMENTS[s].title}</button>`).join('')}
      </div>
      <div class="chips" role="group" aria-label="Материалы">
        <button class="chip" data-toggle="audio">🎧 С аудио</button>
        <button class="chip" data-toggle="notes">📝 С конспектом</button>
      </div>
      <span class="result-count" id="m-count" aria-live="polite"></span>
    </div>
    <div id="m-list"></div>`;

  function card(m) {
    const people = D.peopleByMeeting[m.id] || [];
    const q = state.q;
    const meta = [
      m.literature?.length ? `<span>📚 ${m.literature.length + (m.additional?.length || 0)} ${plural(m.literature.length + (m.additional?.length || 0), 'источник', 'источника', 'источников')}</span>` : '',
      people.length ? `<span>👤 ${people.slice(0, 4).map((p) => esc(p.name)).join(', ')}${people.length > 4 ? ' и др.' : ''}</span>` : '',
      m.audio ? '<span>🎧 аудио</span>' : '',
      m.notes ? '<span>📝 конспект</span>' : ''
    ].join('');
    const status = m.next ? `<span class="status-pill next">${m.isToday ? 'сегодня' : 'следующая'}</span>` : (!m.past ? '<span class="status-pill">впереди</span>' : '');
    const desc = m.goal || (m.summary || [])[0] || '';
    return `
      <a class="card card-link m-card" data-seg="${m.segment}" href="${links.meeting(m.id)}">
        <span class="num-bullet">${m.id}</span>
        <div>
          <h3>${highlight(m.title, q)}</h3>
          <p>${highlight(desc.length > 240 ? desc.slice(0, 237) + '…' : desc, q)}</p>
          <div class="m-meta">${meta}</div>
        </div>
        <div class="m-side"><b>${fmtDate(m.date, { year: false })}</b>${m.date.slice(0, 4)}${m.time ? ' · ' + esc(m.time) : ''}<br>${status}</div>
      </a>`;
  }

  function render() {
    const words = norm(state.q).split(/\s+/).filter(Boolean);
    const list = D.meetings.filter((m) =>
      (state.seg === 'all' || m.segment === state.seg) &&
      (!state.audio || m.audio) && (!state.notes || m.notes) &&
      words.every((w) => hay[m.id].includes(w)));
    $$('[data-seg-filter]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.segFilter === state.seg));
    $$('[data-toggle]').forEach((b) => b.setAttribute('aria-pressed', !!state[b.dataset.toggle]));
    $('#m-count').textContent = `${list.length} ${plural(list.length, 'встреча', 'встречи', 'встреч')}`;
    if (!list.length) { $('#m-list').innerHTML = '<div class="empty">Ничего не найдено. Попробуйте изменить запрос или фильтры.</div>'; return; }
    const groups = ['phil', 'tech', 'synth'].map((s) => [s, list.filter((m) => m.segment === s)]).filter(([, l]) => l.length);
    $('#m-list').innerHTML = groups.map(([s, l]) => `
      <h2 class="m-group-title" data-seg="${s}">${SEGMENTS[s].title} <span class="muted small" style="font-family:var(--font);font-weight:400">· ${SEGMENTS[s].range}</span></h2>
      <div class="m-list">${l.map(card).join('')}</div>`).join('');
    const url = new URL(location.href);
    url.search = '';
    if (state.q) url.searchParams.set('q', state.q);
    if (state.seg !== 'all') url.searchParams.set('seg', state.seg);
    if (state.audio) url.searchParams.set('filter', 'audio');
    else if (state.notes) url.searchParams.set('filter', 'notes');
    history.replaceState(null, '', url);
  }

  $('#m-q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
  $$('[data-seg-filter]').forEach((b) => b.addEventListener('click', () => { state.seg = b.dataset.segFilter; render(); }));
  $$('[data-toggle]').forEach((b) => b.addEventListener('click', () => { state[b.dataset.toggle] = !state[b.dataset.toggle]; render(); }));
  render();
});
