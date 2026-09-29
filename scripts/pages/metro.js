GVG.page((D) => {
  const { esc, fmtDate, links, SEGMENTS, plural, avatar, $, $$, openDrawer } = GVG;

  // Координаты станций на схеме и положение подписи (above / below)
  const POS = {
    1: [150, 150, 'above'], 2: [370, 150, 'below'], 3: [590, 150, 'above'], 4: [810, 150, 'below'],
    5: [810, 310, 'below'], 6: [590, 310, 'above'], 7: [370, 310, 'below'], 8: [150, 310, 'above'],
    9: [280, 470, 'above'], 10: [530, 470, 'below'], 11: [770, 470, 'above']
  };
  const col = (s) => `var(--${s})`;
  const last = D.meetings[D.meetings.length - 1];
  const here = D.nextMeeting || last;
  const seasonOver = !D.nextMeeting;
  const pastCount = D.meetings.filter((m) => m.past).length;

  // Где кончается «построенный» участок синтеза: после последней прошедшей станции ряда 3
  const row3 = D.meetings.filter((m) => m.id >= 9);
  const lastPast3 = row3.filter((m) => m.past).pop();
  const builtTo = lastPast3 ? Math.min(POS[lastPast3.id][0] + 50, 770) : 110;

  function station(m) {
    const [x, y, side] = POS[m.id];
    const isHere = m === here;
    const terminal = m.id === last.id;
    const nameY = side === 'above' ? y - 38 : y + 42;
    const dateY = side === 'above' ? y - 20 : y + 60;
    let date = fmtDate(m.date);
    if (terminal) date += ' · конечная';
    if (isHere) date += seasonOver ? ' · сезон завершён' : (m.isToday ? ' · сегодня' : ' · следующая');
    const core = terminal
      ? `<rect class="core" x="${x - 13}" y="${y - 13}" width="26" height="26" rx="6" stroke="${col(m.segment)}" stroke-width="5"/>`
      : `<circle class="core" cx="${x}" cy="${y}" r="11" stroke="${col(m.segment)}" stroke-width="5"/>`;
    const pulse = isHere ? `
      <circle cx="${x}" cy="${y}" r="13" fill="var(--phil)" opacity=".35">
        <animate attributeName="r" values="13;26;13" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".35;0;.35" dur="2.2s" repeatCount="indefinite"/>
      </circle>` : '';
    const dotHere = isHere ? `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--phil)" pointer-events="none"/>` : '';
    return `
      <g class="station" id="station-${m.id}" data-id="${m.id}" tabindex="0" role="button"
         aria-label="Станция ${m.id}: ${esc(m.short)}, ${fmtDate(m.date)}${isHere ? ', вы здесь' : ''}">
        ${pulse}${core}${dotHere}
        <text class="st-name" x="${x}" y="${nameY}" text-anchor="middle">${esc(m.short)}</text>
        <text class="st-date" x="${x}" y="${dateY}" text-anchor="middle">${esc(date)}</text>
      </g>`;
  }

  $('#metro-map').innerHTML = `
    <svg viewBox="0 70 1060 510" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Схема семинара в виде линии метро">
      <path d="M 95 150 H 900 L 950 200 V 225" fill="none" stroke="var(--phil)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 950 225 V 260 L 900 310 H 160 L 110 360 V 392" fill="none" stroke="var(--tech)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 110 392 V 420 L 160 470 H ${Math.max(builtTo, 160)}" fill="none" stroke="var(--synth)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      ${builtTo < 770 ? `<path d="M ${builtTo} 470 H 770" fill="none" stroke="var(--synth)" stroke-width="10" stroke-linecap="round" stroke-dasharray="4 18"/>` : ''}
      <path d="M 800 470 H 1020" fill="none" stroke="var(--ghost)" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16"/>
      <text class="st-ghost" x="915" y="505" text-anchor="middle">сезон 2026/27 · проектируется</text>
      <line x1="95" y1="132" x2="95" y2="168" stroke="var(--phil)" stroke-width="10" stroke-linecap="round"/>
      ${D.meetings.filter((m) => POS[m.id]).map(station).join('')}
    </svg>`;

  $('#metro-note').innerHTML = seasonOver
    ? `<b>${pastCount} ${plural(pastCount, 'станция', 'станции', 'станций')} позади</b><br>сезон завершён ${fmtDate(last.date)}<br>следующий сезон — 2026/27`
    : `<b>${pastCount} ${plural(pastCount, 'станция', 'станции', 'станций')} позади</b><br>следующая — ${esc(here.short)}, ${fmtDate(here.date, { year: false })}<br>конечная — ${fmtDate(last.date)}`;

  function open(id) {
    const m = D.meetingById[id];
    if (!m) return;
    const seg = SEGMENTS[m.segment];
    const people = D.peopleByMeeting[m.id] || [];
    let body = '';
    if (m.tags?.length) body += `<div class="chips" style="margin-bottom:14px">${m.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`;
    body += (m.summary || []).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    if (people.length) body += `<h4>Персоналии</h4><div class="people-row">${people.map((p) => `<a class="person-chip" href="${links.person(p.id)}">${avatar(p)}${esc(p.name)}</a>`).join('')}</div>`;
    else if (m.authors) body += `<p class="muted small">${esc(m.authors)}</p>`;
    if (m.question) body += `<div class="callout" data-seg="${m.segment}" style="margin-top:18px"><b>Точка маршрута</b>${esc(m.question)}</div>`;
    body += `<a class="btn btn-primary" href="${links.meeting(m.id)}">Все материалы встречи →</a>`;
    openDrawer({
      seg: m.segment,
      kicker: `${m.id === last.id ? 'Конечная' : 'Станция ' + m.id} · ${seg.title}`,
      title: m.title,
      sub: fmtDate(m.date) + (m === here ? (seasonOver ? ' · сезон завершён' : ' · вы здесь') : ''),
      body
    });
    history.replaceState(null, '', '#station-' + m.id);
  }

  $$('.station').forEach((g) => {
    g.addEventListener('click', () => open(+g.dataset.id));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(+g.dataset.id); }
    });
  });
  const h = location.hash.match(/^#station-(\d+)$/);
  if (h) {
    const g = document.getElementById('station-' + h[1]);
    if (g) g.scrollIntoView({ block: 'center', inline: 'center' });
    open(+h[1]);
  }
});
