GVG.page((D) => {
  const { esc, norm, links, SEGMENTS, avatar, yearsOf, $, $$, param, cssVar, openDrawer } = GVG;
  const P = D.people;
  const byId = D.personById;
  const state = { seg: 'all', q: '' };
  const segColor = (s) => cssVar('--' + s);
  const hay = Object.fromEntries(P.map((p) => [p.id, norm([p.name, p.full, (p.fields || []).join(' '), (p.keywords || []).join(' '), p.country, (p.institutions || []).join(' ')].join(' '))]));
  const visible = (p) => (state.seg === 'all' || p.segment === state.seg) && norm(state.q).split(/\s+/).filter(Boolean).every((w) => hay[p.id].includes(w));
  const listeners = [];
  const onFilter = (fn) => listeners.push(fn);

  /* ---------- Досье ---------- */
  function openPerson(id) {
    const p = byId[id];
    if (!p) return;
    const m = p.meeting ? D.meetingById[p.meeting] : null;
    let place = p.birth?.short || p.birth?.place || '';
    const dp = p.death?.short || p.death?.place;
    if (!p.alive && dp && dp !== place) place += ' → ' + dp;
    let h = '';
    if (p.fields?.length) h += `<h4>Области</h4><div class="chips">${p.fields.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</div>`;
    if (p.keywords?.length) h += `<h4>Ключевые слова</h4><p>${esc(p.keywords.join('; '))}</p>`;
    if (p.contribution) h += `<h4>Вклад</h4><p>${esc(p.contribution)}</p>`;
    if (p.works) h += `<h4>Основные труды</h4><p>${esc(p.works)}</p>`;
    if (p.role) h += `<div class="callout" data-seg="${p.segment}" style="font-style:normal;margin-top:16px"><b>Роль в истории ИИ / КТМ</b>${esc(p.role)}</div>`;
    if (p.institutions?.length) h += `<h4>Университеты и центры</h4><p>${esc(p.institutions.join(' · '))}</p>`;
    if (p.awards?.length) h += `<h4>Награды</h4><p>${esc(p.awards.join('; '))}</p>`;
    if (p.note) h += `<h4>Примечания</h4><p>${esc(p.note)}</p>`;
    const ext = [p.sep && `<a href="${esc(p.sep)}" target="_blank" rel="noopener">Stanford Encyclopedia</a>`,
      p.wiki && `<a href="${esc(p.wiki)}" target="_blank" rel="noopener">Википедия</a>`].filter(Boolean);
    if (ext.length) h += `<h4>Ссылки</h4><p>${ext.join(' · ')}</p>`;
    h += `<a class="btn btn-primary" href="${links.person(p.id)}">Полное досье →</a>`;
    if (m) h += ` <a class="btn btn-ghost" href="${links.meeting(m.id)}">Встреча ${m.id}</a>`;
    openDrawer({
      seg: p.segment,
      kicker: SEGMENTS[p.segment].title + (m ? ` · встреча ${m.id} · ${m.short}` : ''),
      title: p.full || p.name,
      sub: yearsOf(p) + (place ? ' · ' + place : ''),
      body: h
    });
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-person]');
    if (t) { e.preventDefault(); openPerson(t.dataset.person); }
  });
  const chip = (p) => `<button type="button" class="person-chip" data-person="${p.id}">${avatar(p)}${esc(p.name)}</button>`;

  /* ---------- Фильтр ---------- */
  const segs = ['all', 'phil', 'tech', 'synth', 'base'];
  $('#seg-filter').innerHTML = segs.map((s) => `<button class="chip chip-sm" data-seg-f="${s}">${s === 'all' ? 'Все' : `<i class="dot" data-seg="${s}"></i>${SEGMENTS[s].short}`}</button>`).join('');
  $('#seglegend').innerHTML = ['phil', 'tech', 'synth', 'base'].map((s) => `<span><i class="dot" data-seg="${s}"></i>${SEGMENTS[s].title} (${SEGMENTS[s].range})</span>`).join('');
  function applyFilter() {
    $$('[data-seg-f]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.segF === state.seg));
    const n = P.filter(visible).length;
    $('#atlas-count').textContent = n === P.length ? `${P.length} персоналий` : `показано ${n} из ${P.length}`;
    listeners.forEach((fn) => fn());
  }
  $$('[data-seg-f]').forEach((b) => b.addEventListener('click', () => { state.seg = b.dataset.segF; applyFilter(); }));
  $('#atlas-q').addEventListener('input', (e) => { state.q = e.target.value; applyFilter(); });

  /* ---------- KPI ---------- */
  (function () {
    const alive = P.filter((p) => p.alive).length;
    const countries = new Set(P.map((p) => p.country)).size;
    const women = P.filter((p) => p.gender === 'Ж');
    const minYear = Math.min(...P.map((p) => p.birth?.year ?? 9999));
    const inst = new Set(P.flatMap((p) => p.institutions || [])).size;
    const k = [
      [P.length, 'персоналий — от Платона до Бендер', 'phil'],
      [alive, 'живы на июнь 2026 (статус выверен)', 'tech'],
      [countries, 'стран происхождения', 'synth'],
      ['≈' + (2026 - minYear), 'лет охвата: от «Кратила» до «стохастических попугаев»'],
      [D.edges.length, 'связей в графе: ученичество, соавторство, споры'],
      [inst, 'университетов и центров в биографиях'],
      [women.length, `женщины (${women.map((p) => p.name).join(', ')}) — зеркало истории дисциплины`]
    ];
    $('#kpis').innerHTML = k.map(([v, l, s]) => `<div class="kpi"${s ? ` data-seg="${s}"` : ''}><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
  })();

  /* ---------- Линия времени ---------- */
  (function () {
    const Y0 = 1850, Y1 = 2030, W = (v) => ((v - Y0) / (Y1 - Y0)) * 100;
    const eras = [
      { a: 1916, b: 1957, t: 'структурализм', c: 'var(--philT)' },
      { a: 1957, b: 1990, t: 'когнитивный и символический ИИ', c: 'var(--techT)' },
      { a: 1990, b: 2013, t: 'статистический поворот', c: 'var(--techT2)' },
      { a: 2013, b: 2027, t: 'нейросетевая эпоха', c: 'var(--synthT)' }
    ];
    $('#tlEras').innerHTML = eras.map((e) => `<div class="tl-era" style="left:${W(e.a)}%;width:${W(e.b) - W(e.a)}%;background:${e.c}">${e.t}</div>`).join('');
    const eraBg = eras.map((e) => `<i style="left:${W(e.a)}%;width:${W(e.b) - W(e.a)}%;background:${e.c}"></i>`).join('');
    const rows = P.filter((p) => p.birth?.year > 0).sort((a, b) => a.birth.year - b.birth.year);
    $('#tlGrid').innerHTML = rows.map((p) => {
      const end = p.alive ? 2026 : (p.death?.year || 2026);
      const l = W(Math.max(p.birth.year, Y0)), w = W(end) - l;
      return `<div class="tl-row" data-row="${p.id}"><button class="tl-name" type="button" data-person="${p.id}">${esc(p.name)}</button>
        <div class="tl-track">${eraBg}<button type="button" class="tl-bar ${p.alive ? 'alive' : ''}" data-seg="${p.segment}" data-person="${p.id}"
        style="left:${l}%;width:${w}%" title="${esc(p.full)} · ${esc(yearsOf(p))}" aria-label="${esc(p.full)}, ${esc(yearsOf(p))}"></button></div></div>`;
    }).join('');
    $('#tlAxis').innerHTML = [1850, 1875, 1900, 1925, 1950, 1975, 2000, 2026].map((y) => `<div class="tl-tick" style="left:${W(y)}%">${y}</div>`).join('');
    const ev = [[1916, '«Курс» Соссюра'], [1957, '«Синтаксические структуры»'], [1966, 'ELIZA'], [1980, '«Китайская комната»'], [2013, 'word2vec'], [2017, 'трансформеры'], [2020, 'Climbing towards NLU']];
    $('#tlEvents').innerHTML = ev.map((e) => `<div class="tl-ev" style="left:${W(e[0])}%"><i></i><span>${e[0]}<br>${e[1]}</span></div>`).join('');
    const ancient = P.filter((p) => p.birth?.year < 0);
    const nob = P.filter((p) => p.birth?.year == null);
    $('#tlFoot').innerHTML =
      (ancient.length ? `Вне шкалы: ${ancient.map((p) => `<button type="button" data-person="${p.id}">${esc(p.name)}</button> (${esc(yearsOf(p))})`).join(', ')} — в начале маршрута. ` : '') +
      (nob.length ? `Год рождения публично не документирован: ${nob.map((p) => `<button type="button" data-person="${p.id}">${esc(p.name)}</button>`).join(', ')}.` : '');
    onFilter(() => $$('#tlGrid .tl-row').forEach((r) => r.classList.toggle('dim', !visible(byId[r.dataset.row]))));
  })();

  /* ---------- Карта ----------
     Раньше карта не показывалась: подложка грузилась только с tile.openstreetmap.org,
     а этот сервер отклоняет запросы без заголовка Referer (файл, открытый с диска,
     предпросмотр в песочнице) — оставался серый прямоугольник. Теперь контуры стран
     встроены в сайт (data/geo), а тайлы — лишь необязательный слой поверх. */
  (function () {
    const map = L.map('map', { scrollWheelZoom: false, worldCopyJump: true, zoomSnap: 0.5 }).setView([45, 5], 3);
    map.on('focus click', () => map.scrollWheelZoom.enable());
    map.on('blur mouseout', () => map.scrollWheelZoom.disable());
    map.attributionControl.setPrefix(false);
    const landPane = map.createPane('land');
    landPane.style.zIndex = 250;
    fetch('data/geo/countries-50m.json').then((r) => r.json()).then((topo) => {
      L.geoJSON(topojson.feature(topo, topo.objects.countries), {
        pane: 'land', interactive: false, style: { className: 'gvg-land', weight: 0.7, fillOpacity: 1 }
      }).addTo(map);
    }).catch(() => { $('#mapNote').textContent = 'Не удалось загрузить контуры стран.'; });

    let tiles = null, tileErrors = 0, tileLoads = 0;
    const note = $('#mapNote');
    function setTiles(on) {
      if (tiles) { map.removeLayer(tiles); tiles = null; }
      if (!on) return;
      tileErrors = 0; tileLoads = 0;
      const style = GVG.currentTheme() === 'dark' ? 'dark_all' : 'light_all';
      tiles = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`, {
        maxZoom: 18, subdomains: 'abcd', className: 'gvg-tiles',
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'
      });
      tiles.on('tileload', () => { tileLoads++; note.textContent = ''; });
      tiles.on('tileerror', () => {
        tileErrors++;
        if (tileErrors >= 4 && tileLoads === 0) {
          setTiles(false);
          $('#cbTiles').checked = false;
          note.textContent = 'Тайлы недоступны — показана встроенная карта.';
        }
      });
      tiles.addTo(map);
    }
    const cbTiles = $('#cbTiles');
    cbTiles.checked = /^https?:$/.test(location.protocol);
    cbTiles.addEventListener('change', () => setTiles(cbTiles.checked));
    setTiles(cbTiles.checked);
    document.addEventListener('gvg:theme', () => { if (cbTiles.checked) setTiles(true); });

    const gB = L.layerGroup().addTo(map), gD = L.layerGroup().addTo(map), gM = L.layerGroup().addTo(map);
    const pop = (p) => `<b>${esc(p.full)}</b><br>${esc(yearsOf(p))}${p.birth?.place ? '<br>● ' + esc(p.birth.place) : ''}${!p.alive && p.death?.place ? '<br>○ ' + esc(p.death.place) : ''}<br><button class="pop-link" data-person="${p.id}">открыть досье</button>`;
    function draw() {
      [gB, gD, gM].forEach((g) => g.clearLayers());
      P.filter(visible).forEach((p) => {
        const s = 'seg-' + p.segment;
        const bc = p.birth?.coords, dc = !p.alive && p.death?.coords;
        if (bc && dc && (bc[0] !== dc[0] || bc[1] !== dc[1])) L.polyline([bc, dc], { className: `mk-m ${s}`, interactive: false }).addTo(gM);
        if (dc) L.circleMarker(dc, { radius: 7, className: `mk-d ${s}` }).bindPopup(pop(p)).addTo(gD);
        if (bc) L.circleMarker(bc, { radius: 7, className: `mk-b ${s}` }).bindPopup(pop(p)).addTo(gB);
      });
    }
    draw();
    const pts = P.flatMap((p) => [p.birth?.coords, !p.alive && p.death?.coords]).filter(Boolean);
    if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 5 });
    onFilter(draw);
    const bind = (id, g) => $(id).addEventListener('change', (e) => (e.target.checked ? map.addLayer(g) : map.removeLayer(g)));
    bind('#cbBirth', gB); bind('#cbDeath', gD); bind('#cbMigr', gM);
    new ResizeObserver(() => map.invalidateSize()).observe($('#map'));
  })();

  /* ---------- Граф ---------- */
  (function () {
    const svgEl = $('#net');
    const svg = d3.select(svgEl);
    const Wd = svgEl.clientWidth || 1000, H = svgEl.clientHeight || 580;
    svg.attr('viewBox', [0, 0, Wd, H]);
    const root = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.4, 3]).on('zoom', (e) => root.attr('transform', e.transform));
    svg.call(zoom);
    $('#netReset').addEventListener('click', () => svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity));
    const nodes = P.map((p) => ({ id: p.id, n: p.name, seg: p.segment }));
    const links = D.edges.map((e) => ({ source: e.source, target: e.target, t: e.type, l: e.label }));
    const deg = {};
    const nb = {};
    links.forEach((l) => {
      deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1;
      (nb[l.source] = nb[l.source] || new Set()).add(l.target); (nb[l.target] = nb[l.target] || new Set()).add(l.source);
    });
    const eStyle = { teacher: ['var(--ink)', null], coauthor: ['var(--tech)', null], colleague: ['var(--ghost)', null], opponent: ['var(--phil)', '5 5'], idea: ['var(--synth)', '2 7'] };
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((d) => (d.t === 'idea' ? 150 : 80)).strength((d) => (d.t === 'idea' ? 0.25 : 0.6)))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(Wd / 2, H / 2))
      .force('x', d3.forceX(Wd / 2).strength(0.04)).force('y', d3.forceY(H / 2).strength(0.06))
      .force('collide', d3.forceCollide(30));
    const link = root.append('g').selectAll('line').data(links).join('line')
      .style('stroke', (d) => eStyle[d.t][0]).attr('stroke-width', 2.2)
      .attr('stroke-dasharray', (d) => eStyle[d.t][1]).attr('opacity', 0.75);
    link.append('title').text((d) => d.l);
    const node = root.append('g').selectAll('g').data(nodes).join('g').style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('click', (e, d) => openPerson(d.id))
      .on('mouseenter', (e, d) => focus(d.id))
      .on('mouseleave', () => focus(null));
    node.append('circle').attr('r', (d) => 7 + Math.min(8, (deg[d.id] || 0) * 1.6))
      .style('fill', (d) => `var(--${d.seg})`).style('stroke', 'var(--surface)').attr('stroke-width', 2);
    node.append('text').text((d) => d.n).attr('dx', 12).attr('dy', 4);
    node.append('title').text((d) => byId[d.id].full);
    sim.on('tick', () => {
      link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
    let hovered = null;
    function focus(id) { hovered = id; paint(); }
    function paint() {
      const on = (id) => visible(byId[id]) && (!hovered || id === hovered || nb[hovered]?.has(id));
      node.attr('opacity', (d) => (on(d.id) ? 1 : 0.13));
      link.attr('opacity', (d) => {
        const a = d.source.id, b = d.target.id;
        if (hovered) return a === hovered || b === hovered ? 0.95 : 0.06;
        return visible(byId[a]) && visible(byId[b]) ? 0.75 : 0.06;
      });
    }
    onFilter(paint);
  })();

  /* ---------- Графики (перерисовываются при смене темы) ---------- */
  const charts = [];
  function drawCharts() {
    charts.splice(0).forEach((c) => c.destroy());
    Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
    Chart.defaults.color = cssVar('--muted');
    Chart.defaults.borderColor = cssVar('--hair');
    const grid = { color: cssVar('--hair') };
    const alpha = (c, a = 'CC') => (c.startsWith('#') && c.length === 7 ? c + a : c);
    const hbar = (id, labels, data, colors, extra = {}) => charts.push(new Chart($(id), {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4 }] },
      options: Object.assign({
        indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid, ticks: { precision: 0 } }, y: { grid: { display: false }, ticks: { autoSkip: false, font: { size: 11.5 } } } }
      }, extra)
    }));

    // Встречи
    const ms = D.meetings.filter((m) => D.peopleByMeeting[m.id]);
    charts.push(new Chart($('#meetingChart'), {
      type: 'bar',
      data: { labels: ms.map((m) => `${m.id}. ${m.short}`), datasets: [{ data: ms.map((m) => D.peopleByMeeting[m.id].length), backgroundColor: ms.map((m) => alpha(segColor(m.segment))), borderRadius: 5 }] },
      options: {
        maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: (c) => D.peopleByMeeting[ms[c.dataIndex].id].map((p) => p.name).join(', ') } } },
        scales: { y: { grid, ticks: { precision: 0 } }, x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 50, minRotation: 30 } } },
        onClick: (e, el) => { if (el.length) location.href = links.meeting(ms[el[0].index].id); },
        onHover: (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; }
      }
    }));

    // Век рождения по линиям
    const cents = ['до XIX', 'XIX', '1900–1939', '1940–1969', '1970+'];
    const bucket = (y) => (y < 1800 ? 0 : y < 1900 ? 1 : y < 1940 ? 2 : y < 1970 ? 3 : 4);
    charts.push(new Chart($('#centuryChart'), {
      type: 'bar',
      data: {
        labels: cents,
        datasets: ['phil', 'tech', 'synth', 'base'].map((s) => ({
          label: SEGMENTS[s].title, backgroundColor: alpha(segColor(s)), borderRadius: 3,
          data: cents.map((_, i) => P.filter((p) => p.segment === s && p.birth?.year != null && bucket(p.birth.year) === i).length)
        }))
      },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid, ticks: { precision: 0 } } } }
    }));

    // Темы
    const palette = [segColor('phil'), segColor('tech'), segColor('synth')];
    hbar('#themeChart', D.themes.map((t) => t.title), D.themes.map((t) => t.people.length), D.themes.map((t, i) => alpha(palette[i % 3])), {
      onClick: (e, el) => { if (el.length) selectTheme(el[0].index); }
    });

    // Университеты
    hbar('#instChart', INST.map((x) => x[0]), INST.map((x) => x[1].length), INST.map(() => alpha(segColor('tech'))), {
      onClick: (e, el) => { if (el.length) selectInst(el[0].index); }
    });

    // Продолжительность жизни
    const dead = P.filter((p) => !p.alive && p.birth?.year != null && p.death?.year != null)
      .map((p) => ({ p, v: p.death.year - p.birth.year })).sort((a, b) => b.v - a.v);
    hbar('#lifeChart', dead.map((d) => d.p.name + (d.p.birth.year < 0 ? ' ≈' : '')), dead.map((d) => d.v), dead.map((d) => alpha(segColor(d.p.segment))), {
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.x + ' лет' } } },
      scales: { x: { grid, max: 110 }, y: { grid: { display: false }, ticks: { autoSkip: false, font: { size: 11 } } } },
      onClick: (e, el) => { if (el.length) openPerson(dead[el[0].index].p.id); }
    });

    // Страны
    const cc = {};
    P.forEach((p) => (cc[p.country] = (cc[p.country] || 0) + 1));
    const cs = Object.entries(cc).sort((a, b) => b[1] - a[1]);
    hbar('#countryChart', cs.map((c) => c[0]), cs.map((c) => c[1]), cs.map(() => alpha(segColor('tech'))));

    // Живы / ушли
    const alive = P.filter((p) => p.alive).length;
    charts.push(new Chart($('#aliveChart'), {
      type: 'doughnut',
      data: { labels: [`Живы (${alive})`, `Ушли (${P.length - alive})`], datasets: [{ data: [alive, P.length - alive], backgroundColor: [alpha(segColor('tech')), cssVar('--ghost')], borderColor: cssVar('--surface'), borderWidth: 2 }] },
      options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right' } } }
    }));

    // Возраст к первой главной работе
    const pts = P.map((p) => {
      const m = String(p.works || '').match(/\((\d{4})/) || String(p.works || '').match(/\b(1[89]\d\d|20[0-2]\d)\b/);
      if (!m || !(p.birth?.year > 0)) return null;
      const y = +m[1];
      return { x: y, y: y - p.birth.year, p, work: String(p.works).split(';')[0].trim() };
    }).filter(Boolean);
    charts.push(new Chart($('#ageChart'), {
      type: 'scatter',
      data: {
        datasets: ['phil', 'tech', 'synth', 'base'].map((s) => ({
          label: SEGMENTS[s].title, data: pts.filter((d) => d.p.segment === s),
          backgroundColor: alpha(segColor(s)), borderColor: segColor(s), pointRadius: 6, pointHoverRadius: 9
        }))
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } }, tooltip: { callbacks: { label: (c) => `${c.raw.p.name}: ${c.raw.y} лет — ${c.raw.work}` } } },
        scales: { x: { grid, title: { display: true, text: 'год публикации' }, ticks: { callback: (v) => v } }, y: { grid, title: { display: true, text: 'возраст автора' } } },
        onClick: (e, el) => { if (el.length) openPerson(pts.filter((d) => d.p.segment === ['phil', 'tech', 'synth', 'base'][el[0].datasetIndex])[el[0].index].p.id); },
        onHover: (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; }
      }
    }));
  }

  /* ---------- Темы и университеты: чипы участников ---------- */
  function selectTheme(i) {
    $$('#themeChips .chip').forEach((b, j) => b.setAttribute('aria-pressed', i === j));
    $('#themeMembers').innerHTML = D.themes[i].people.map((id) => byId[id]).map(chip).join('');
  }
  $('#themeChips').innerHTML = D.themes.map((t, i) => `<button type="button" class="chip" data-i="${i}">${esc(t.title)} <small>${t.people.length}</small></button>`).join('');
  $$('#themeChips .chip').forEach((b) => b.addEventListener('click', () => selectTheme(+b.dataset.i)));
  selectTheme(0);

  const instMap = {};
  P.forEach((p) => (p.institutions || []).forEach((i) => (instMap[i] = instMap[i] || []).push(p)));
  const INST = Object.entries(instMap).filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'ru'));
  let instSel = 0;
  function selectInst(i) {
    instSel = i;
    $$('#instChips .chip').forEach((b, j) => b.setAttribute('aria-pressed', i === j));
    const list = INST[i][1].filter(visible);
    $('#instMembers').innerHTML = list.length ? list.map(chip).join('') : '<span class="muted small">Под текущий фильтр никто не подходит.</span>';
  }
  $('#instChips').innerHTML = INST.map(([n, l], i) => `<button type="button" class="chip chip-sm" data-i="${i}">${esc(n)} <small>${l.length}</small></button>`).join('');
  $$('#instChips .chip').forEach((b) => b.addEventListener('click', () => selectInst(+b.dataset.i)));
  selectInst(0);
  onFilter(() => selectInst(instSel));

  drawCharts();
  document.addEventListener('gvg:theme', () => requestAnimationFrame(drawCharts));
  applyFilter();

  const want = param('person');
  if (want && byId[want]) openPerson(want);
});
