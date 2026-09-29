GVG.page(async (D) => {
  const { esc, links, SEGMENTS, avatar, yearsOf, $, param, renderMarkdown } = GVG;
  const app = $('#person-app');
  const aliases = { platon: 'plato' };
  const id = param('id');
  const p = D.personById[id] || D.personById[aliases[id]];
  if (!p) {
    app.innerHTML = `<div class="empty" style="margin-top:48px">Персоналия не найдена. <a href="people.html">Ко всем персоналиям</a></div>`;
    return;
  }
  document.title = `${p.full || p.name} — gavagAI`;
  const seg = SEGMENTS[p.segment];
  const m = p.meeting ? D.meetingById[p.meeting] : null;
  const themes = D.themesByPerson[p.id] || [];
  const idx = D.chrono.indexOf(p);
  const prev = D.chrono[idx - 1], next = D.chrono[idx + 1];
  const REL = { teacher: 'учитель → ученик', coauthor: 'соавторы', colleague: 'коллеги', opponent: 'оппоненты', idea: 'идейная линия' };
  const rels = (D.edgesByPerson[p.id] || []).map((e) => {
    const o = D.personById[e.other];
    let type = REL[e.type];
    if (e.type === 'teacher') type = e.dir === 'out' ? 'ученик' : 'учитель';
    return `<li><span class="rel-type">${type}</span><a class="person-chip" href="${links.person(o.id)}">${avatar(o)}${esc(o.full || o.name)}</a><span class="muted small">${esc(e.label)}</span></li>`;
  }).join('');

  const place = (x) => [x?.date, x?.place].filter(Boolean).join(', ');
  const split = (s) => String(s || '').split(';').map((x) => x.trim()).filter(Boolean);
  const facts = [
    ['Годы жизни', yearsOf(p)],
    ['Родился', place(p.birth)],
    ['Умер', p.alive ? '' : place(p.death)],
    ['Причина смерти', p.alive ? '' : p.death?.cause],
    ['Страна', p.country],
    ['Национальность', p.nationality],
    ['Гражданство', p.citizenship]
  ].filter(([, v]) => v);
  const career = [['Образование', p.alma], ['Аффилиация', p.affiliation], ['Научные связи', p.relations]].filter(([, v]) => v);
  const notes = [p.note, p.xlsxNote && p.xlsxNote !== p.note ? p.xlsxNote : ''].filter(Boolean);
  const extLinks = [p.wiki && `<a href="${esc(p.wiki)}" target="_blank" rel="noopener">Википедия ↗</a>`,
    p.sep && `<a href="${esc(p.sep)}" target="_blank" rel="noopener">Stanford Encyclopedia ↗</a>`].filter(Boolean);

  app.innerHTML = `
    <nav class="crumbs" aria-label="Навигация" style="margin-top:28px"><a href="index.html">Главная</a>›<a href="people.html">Персоналии</a>›<span>${esc(p.name)}</span></nav>
    <header class="dossier-head" data-seg="${p.segment}" style="padding-top:12px">
      ${avatar(p)}
      <div>
        <div class="badge">${seg.title}</div>
        <h1>${esc(p.full || p.name)}</h1>
        <div class="sub">${esc(yearsOf(p))}${p.birth?.short || p.birth?.place ? ' · ' + esc(p.birth.short || p.birth.place) : ''}${!p.alive && (p.death?.short || p.death?.place) && (p.death.short || p.death.place) !== (p.birth?.short || p.birth?.place) ? ' → ' + esc(p.death.short || p.death.place) : ''}</div>
        <div class="chips">
          ${m ? `<a class="chip" data-seg="${m.segment}" href="${links.meeting(m.id)}"><i class="dot"></i>Встреча ${m.id}: ${esc(m.short)}</a>` : ''}
          ${themes.map((t) => `<a class="chip" href="${links.theme(t.id)}"># ${esc(t.title)}</a>`).join('')}
        </div>
      </div>
    </header>
    <div class="layout" data-seg="${p.segment}">
      <div>
        ${p.role ? `<section class="block"><div class="role-box"><b>Роль в истории ИИ и вычислительной теории сознания</b>${esc(p.role)}</div></section>` : ''}
        ${p.contribution ? `<section class="block"><h2>Вклад в науку</h2><ul class="plan" style="counter-reset:none">${split(p.contribution).map((x) => `<li style="counter-increment:none">${esc(x)}</li>`).join('')}</ul></section>` : ''}
        ${p.works ? `<section class="block"><h2>Основные труды</h2><ul class="lit-list">${split(p.works).map((w) => `<li><div>${esc(w)}</div></li>`).join('')}</ul></section>` : ''}
        ${p.keywords?.length ? `<section class="block"><h2>Ключевые слова</h2><div class="chips">${p.keywords.map((k) => `<button type="button" class="chip chip-sm" data-open-search-q="${esc(k)}">${esc(k)}</button>`).join('')}</div></section>` : ''}
        ${p.bio ? `<section class="block" id="bio"><h2>Биография</h2><div class="notes-card"><div class="prose" id="bio-body"><div class="loading"><div class="spinner"></div>Загрузка…</div></div></div></section>` : ''}
        ${rels ? `<section class="block"><h2>Связи внутри семинара</h2><ul class="rel-list">${rels}</ul></section>` : ''}
        ${career.length ? `<section class="block"><h2>Образование и карьера</h2><dl class="kv">${career.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></section>` : ''}
        ${p.awards?.length ? `<section class="block"><h2>Награды и премии</h2><ul class="plan" style="counter-reset:none">${p.awards.map((a) => `<li style="counter-increment:none">${esc(a)}</li>`).join('')}</ul></section>` : ''}
        ${notes.length ? `<section class="block"><h2>Примечания</h2>${notes.map((n) => `<p class="muted">${esc(n)}</p>`).join('')}</section>` : ''}
      </div>
      <aside>
        <div class="card aside-card"><h3>Досье</h3><dl class="kv" style="grid-template-columns:1fr;gap:0">
          ${facts.map(([k, v]) => `<dt>${k}</dt><dd style="margin-bottom:10px">${esc(v)}</dd>`).join('')}</dl>
          ${p.fields?.length ? `<h3 style="margin-top:6px">Области</h3><div class="chips">${p.fields.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</div>` : ''}
          ${p.institutions?.length ? `<h3 style="margin-top:16px">Университеты и центры</h3><div class="chips">${p.institutions.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</div>` : ''}
        </div>
        ${extLinks.length ? `<div class="card aside-card"><h3>Ссылки</h3><div style="display:grid;gap:6px">${extLinks.join('')}</div></div>` : ''}
        <a class="btn btn-ghost btn-sm" href="atlas.html?person=${encodeURIComponent(p.id)}">Открыть в атласе →</a>
      </aside>
    </div>
    <nav class="pager" aria-label="Соседи по линии времени">
      ${prev ? `<a class="card card-link" href="${links.person(prev.id)}"><small>← раньше</small><b>${esc(prev.full || prev.name)}</b></a>` : '<span></span>'}
      ${next ? `<a class="card card-link next" href="${links.person(next.id)}"><small>позже →</small><b>${esc(next.full || next.name)}</b></a>` : ''}
    </nav>`;

  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-search-q]');
    if (b) GVG.openSearch(b.dataset.openSearchQ);
  });

  if (p.bio) {
    const body = $('#bio-body');
    try {
      const r = await fetch(p.bio);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      body.innerHTML = '';
      body.appendChild(renderMarkdown(await r.text()));
    } catch (err) {
      body.innerHTML = `<p class="muted">Не удалось загрузить биографию (${esc(err.message)}).</p>`;
    }
  }
});
