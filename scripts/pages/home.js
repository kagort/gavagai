GVG.page((D) => {
  const { esc, fmtDate, links, SEGMENTS, plural } = GVG;
  const withAudio = D.meetings.filter((m) => m.audio).length;
  const done = D.meetings.filter((m) => m.past).length;
  const concepts = Object.keys(D.concepts).length;
  const final = D.meetings[D.meetings.length - 1];

  const stats = [
    [D.meetings.length, plural(D.meetings.length, 'встреча', 'встречи', 'встреч') + ` · ${done} позади`, 'meetings.html'],
    [D.people.length, 'персоналий в досье', 'people.html'],
    [D.themes.length + ' / ' + concepts, 'тем и понятий', 'topics.html'],
    [withAudio, plural(withAudio, 'аудиозапись', 'аудиозаписи', 'аудиозаписей') + ' встреч', 'meetings.html?filter=audio']
  ];

  const strip = D.meetings.map((m) => `
    <li data-seg="${m.segment}" class="${m.past ? 'past' : 'future'}">
      <a href="${links.meeting(m.id)}" title="${esc(m.title)}">
        <span class="ls-n">${m.id}</span>
        <span class="ls-t">${esc(m.short)}</span>
        <span class="ls-d">${fmtDate(m.date, { year: false })}</span>
      </a>
    </li>`).join('');

  const segText = {
    phil: 'Что такое язык и знак, структура и смысл, речевое действие и когнитивная способность.',
    tech: 'Как язык стал данными: от машинного перевода и корпусов к эмбеддингам, трансформерам и онтологиям.',
    synth: 'Чувства, опыт и заземлённость смысла — и финальные мини-проекты участников.'
  };
  const cols = ['phil', 'tech', 'synth'].map((s) => `
    <div class="card seg-col" data-seg="${s}">
      <div class="badge">${SEGMENTS[s].range}</div>
      <h3>${SEGMENTS[s].title}</h3>
      <p>${segText[s]}</p>
      <ol>${D.meetings.filter((m) => m.segment === s).map((m) => `
        <li><a href="${links.meeting(m.id)}"><b>${m.id}</b><span>${esc(m.short)}</span><small>${fmtDate(m.date, { year: false })}</small></a></li>`).join('')}
      </ol>
    </div>`).join('');

  let status;
  if (D.nextMeeting) {
    const m = D.nextMeeting;
    status = `Следующая остановка — <a href="${links.meeting(m.id)}">встреча ${m.id} «${esc(m.short)}»</a>, ${fmtDate(m.date)}.`;
  } else {
    status = `Сезон завершён ${fmtDate(final.date)}. Сезон 2026/27 проектируется.`;
  }

  const questions = [
    'Возможна ли grounded-семантика для LLM и что именно для неё потребовалось бы?',
    'Как соотносятся векторные и онтологические представления смысла — и существует ли третий путь?',
    'Является ли вопрос «понимает ли машина?» эмпирическим или концептуальным?'
  ];

  document.getElementById('home-dynamic').innerHTML = `
    <div class="stats">${stats.map(([v, l, h]) => `<a class="stat" href="${h}"><b>${esc(v)}</b><span>${l}</span></a>`).join('')}</div>

    <section class="section" aria-labelledby="h-line">
      <div class="section-head">
        <div><h2 id="h-line">Линия «Гавагай»</h2><p>${status}</p></div>
        <a class="btn btn-ghost btn-sm" href="metro.html">Открыть схему →</a>
      </div>
      <nav class="line-strip" aria-label="Встречи сезона"><ol>${strip}</ol></nav>
    </section>

    <section class="section" aria-labelledby="h-segs">
      <div class="section-head"><div><h2 id="h-segs">Три линии программы</h2><p>Программа движется от философских оснований через технический поворот к синтезу.</p></div></div>
      <div class="seg-cols">${cols}</div>
    </section>

    <section class="section" aria-labelledby="h-explore">
      <div class="section-head"><div><h2 id="h-explore">Интерактивные карты</h2><p>Два способа увидеть семинар целиком.</p></div></div>
      <div class="explore">
        <a class="card card-link" href="metro.html">
          <div><div class="kicker">Схема линии</div><h3>Семинар как линия метро</h3>
          <p>Одиннадцать станций-встреч, пересадки между философией и технологиями. Нажмите на станцию — откроется краткое содержание.</p></div>
          <span class="arrow" aria-hidden="true">→</span>
        </a>
        <a class="card card-link" href="atlas.html">
          <div><div class="kicker">Атлас персоналий</div><h3>Дашборд: время, география, связи</h3>
          <p>Линия времени, карта судеб, граф научных связей, университеты, темы и биографическая статистика ${D.people.length} персоналий.</p></div>
          <span class="arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="section" aria-labelledby="h-q">
      <div class="section-head"><div><h2 id="h-q">Три вопроса года</h2><p>Вокруг них строились финальные мини-проекты участников.</p></div></div>
      <ol class="questions">${questions.map((q) => `<li>${q}</li>`).join('')}</ol>
    </section>`;
});
