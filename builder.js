/* ============================================================
   builder.js — a floating "Chart builder" that pops up from the
   corner and lets anyone build a chart from any data used in this
   story: pick a topic, a chart type, and a few options, then export
   PNG or CSV. Reuses the data-story chart kit (window.Charts).
   ============================================================ */
(function () {
  const I = window.IDEA, X = window.IDEA_X || {}, C = window.Charts, P = I.PAL;
  if (!I || !C) return;
  const S = window.IDEAStory || {};
  const abbrByName = {}; I.STATES.forEach(r => abbrByName[r[0]] = r[1]);
  const drillCat = it => S.openCatModal && S.openCatModal(it.label || it.name);
  const drillState = it => { const ab = typeof it === 'string' ? it : (abbrByName[it.label] || it.label); S.openStateModal && S.openStateModal(ab); };
  const cats = Object.keys(I.DIS);
  const COLORS = [P.greenD, P.navy, P.green, P.greenL, P.accent, P.purple, P.blue, '#b08a3e', P.gray];
  const TYPE_LABEL = { line: 'Line', area: 'Area', columns: 'Columns', bars: 'Bars', donut: 'Donut', dumbbell: 'Dumbbell', bubbles: 'Bubbles', funnel: 'Funnel', map: 'Map', heatmap: 'Heatmap' };
  const yr4 = y => +String(y).slice(0, 4);
  const shortYr = y => '’' + String(y).slice(2, 4);
  function tickYears(xs) {
    const a = Math.min(...xs), b = Math.max(...xs), out = [];
    for (let y = Math.ceil(a / 5) * 5; y <= b; y += 5) out.push(y);
    if (!out.length) return [a, b];
    if (out[0] - a > 2) out.unshift(a); if (b - out[out.length - 1] > 2) out.push(b);
    return out;
  }
  const moneyNo = v => Math.round(v).toLocaleString('en-US');

  /* ---- topic registry --------------------------------------- */
  const TOPICS = [
    /* national child count over time */
    {
      id: 'count', label: 'Children served over time', types: ['line', 'area', 'columns'],
      opts: [{ key: 'measure', kind: 'toggle', label: 'Measure', choices: [['count', 'Number (millions)'], ['pct', '% of enrollment']], def: 'count' }],
      render(sel, type) {
        const isPct = sel.measure === 'pct';
        const raw = isPct ? I.ENROLL_PCT : I.ALL.map(v => v / 1000);
        const idx = raw.map((v, i) => v == null ? null : i).filter(v => v != null);
        const labels = idx.map(i => I.YEARS[i]), xs = idx.map(i => yr4(I.YEARS[i])), vals = idx.map(i => raw[i]);
        const yFmt = isPct ? (v => v.toFixed(0) + '%') : (v => v.toFixed(0) + 'M');
        const last = vals[vals.length - 1];
        let ch;
        if (type === 'columns') ch = C.columns({ labels, values: vals, yFmt, xEvery: Math.ceil(labels.length / 8), height: 340 });
        else ch = C.lineChart({ labels, xs, xTicks: tickYears(xs), series: [{ values: vals, color: P.greenD, area: type === 'area', areaOpacity: .14, highlight: true, endLabel: isPct ? last.toFixed(1) + '%' : last.toFixed(1) + 'M' }], yMin: 0, yMax: isPct ? 16 : 9, yTicks: isPct ? 4 : 3, yFmt, height: 360 });
        return {
          node: ch.node, reveal: ch.reveal,
          title: (isPct ? 'Percentage of children and students ages 3 through 21 served under IDEA, Part B, of public school enrollment, by year: School year ' : 'Number of children and students ages 3 through 21 served under IDEA, Part B, by year: School year ') + labels[0] + ' through ' + labels[labels.length - 1],
          sub: isPct ? 'Percent of enrollment, by school year.' : 'In millions, by school year.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection' + (isPct ? '; NCES public-school enrollment' : '') + '. School Years ' + labels[0] + ' through ' + labels[labels.length - 1] + '.',
          csv: [['School year', isPct ? 'Percent of enrollment' : 'Served (ages 3-21)'], ...idx.map(i => [I.YEARS[i], isPct ? I.ENROLL_PCT[i] : I.ALL[i] * 1000])],
        };
      },
    },
    /* disability categories over time */
    {
      id: 'cats-trend', label: 'Disability categories over time', types: ['line', 'area'],
      opts: [
        { key: 'cats', kind: 'multi', label: 'Categories', choices: cats.map(c => [c, c]), def: ['Autism', 'Specific learning disability', 'Other health impairment', 'Intellectual disability'] },
        { key: 'unit', kind: 'toggle', label: 'Unit', choices: [['count', 'Number (millions)'], ['share', 'Share of all served']], def: 'count' },
      ],
      render(sel, type) {
        const chosen = (sel.cats && sel.cats.length) ? sel.cats : ['Autism'];
        const start = 3, labels = I.YEARS.slice(start), xs = labels.map(yr4);
        const totals = I.YEARS.map((_, i) => cats.reduce((s, k) => s + (I.DIS[k][i] || 0), 0));
        const share = sel.unit === 'share';
        const series = chosen.map((c, i) => ({
          name: c, color: COLORS[i % COLORS.length], width: i === 0 ? 3 : 2, highlight: i === 0,
          values: I.DIS[c].slice(start).map((v, j) => type === 'area' ? (v == null ? 0 : share ? +(v / totals[start + j] * 100).toFixed(2) : v / 1000) : (v == null ? null : share ? +(v / totals[start + j] * 100).toFixed(2) : v / 1000)),
        }));
        const yFmt = share ? (v => v.toFixed(0) + '%') : (v => v >= 1 ? v.toFixed(1) + 'M' : (v * 1000).toFixed(0) + 'k');
        let ch;
        if (type === 'area') ch = C.stackedArea({ labels, xs, xTicks: tickYears(xs), series, yMax: share ? 100 : Math.ceil(Math.max(...series.reduce((a, s) => s.values.map((v, i) => v + (a[i] || 0)), [])) ) || 10, yTicks: 4, yFmt, height: 360 });
        else ch = C.lineChart({ labels, xs, xTicks: tickYears(xs), series, yMin: 0, yTicks: 4, yFmt, height: 380 });
        return {
          node: ch.node, reveal: ch.reveal,
          title: (share ? 'Percentage' : 'Number') + ' of children and students ages 3 through 21 served under IDEA, Part B, by year and disability category: School year 2000–01 through 2024–25',
          sub: (share ? 'Share of all students served' : 'Number served, in millions') + ', by school year, School Years 2000–01 through 2024–25.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection. School Years 2000–01 through 2024–25.',
          legend: chosen.map((c, i) => [c, COLORS[i % COLORS.length]]),
          csv: [['School year', ...chosen], ...labels.map((y, j) => [y, ...chosen.map(c => I.DIS[c][start + j] == null ? '' : I.DIS[c][start + j] * 1000)])],
        };
      },
    },
    /* disability categories, most recent year */
    {
      id: 'cats-latest', label: 'Disability categories, most recent year', types: ['bars', 'columns', 'donut', 'bubbles'],
      opts: [{ key: 'focus', kind: 'select', label: 'Highlight', choices: [['none', 'None'], ...cats.map(c => [c, c])], def: 'none' }],
      render(sel, type) {
        const last = I.YEARS.length - 1;
        const items = cats.map(c => ({ k: c, v: (I.DIS[c][last] || 0) * 1000 })).filter(d => d.v > 0).sort((a, b) => b.v - a.v);
        const col = d => d.k === sel.focus ? P.navy : P.green;
        const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : Math.round(v / 1e3) + 'k';
        const oc = (d, i) => S.openCatModal && S.openCatModal(items[i].k);
        let ch;
        if (type === 'donut') ch = C.donut({ size: 320, stroke: 46, onClick: oc, segments: items.map((d, i) => ({ name: d.k, value: d.v, color: d.k === sel.focus ? P.navy : COLORS[(i + 2) % COLORS.length] })), centerValue: items.reduce((s, d) => s + d.v, 0), centerFmt: v => (v / 1e6).toFixed(1) + 'M', centerSub: 'served, ages 3–21' });
        else if (type === 'bubbles') ch = C.bubbles({ onClick: oc, items: items.map(d => ({ label: d.k.split(' ').slice(0, 2).join(' '), value: d.v, color: col(d), highlight: d.k === sel.focus })), valueFmt: fmt });
        else if (type === 'columns') ch = C.columns({ labels: items.map(d => d.k.split(' ')[0]), values: items.map(d => d.v), yFmt: fmt, xEvery: 1, height: 340, onClick: oc, highlight: items.findIndex(d => d.k === sel.focus) });
        else ch = C.barsH({ onClick: oc, items: items.map(d => ({ label: d.k, value: d.v, color: col(d), highlight: d.k === sel.focus })), labelW: 232, barH: 18, gap: 9, padR: 64, valueFmt: fmt });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Number of children and students ages 3 through 21 served under IDEA, Part B, by disability category: School year 2024–25',
          sub: 'Number served, School Year 2024–25.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25.',
          csv: [['Disability category', 'Served (ages 3-21), 2024-25'], ...items.map(d => [d.k, d.v])],
        };
      },
    },
    /* educational environments over time */
    {
      id: 'env-trend', label: 'Where students spend the day, over time', types: ['area', 'line'],
      render(sel, type) {
        const labels = I.ENV_LBL, xs = labels.map(yr4), tot = I.D.envTotal;
        const groups = [
          { name: 'Regular class, 80%+ of day', keys: ['Inside regular class 80% or more of the day'], color: P.greenD },
          { name: '40–79% of day', keys: ['Inside regular class 40% through 79% of the day'], color: P.green },
          { name: 'Less than 40% of day', keys: ['Inside regular class less than 40% of the day'], color: P.greenL },
          { name: 'Other settings', keys: ['Separate School', 'Residential Facility', 'Parentally Placed in Private Schools', 'Homebound / Hospital', 'Correctional Facilities'], color: P.sage },
        ];
        const series = groups.map(g => ({ name: g.name, color: g.color, values: labels.map((_, i) => +(g.keys.reduce((s, k) => s + I.ENV[k][i], 0) / tot[i] * 100).toFixed(2)) }));
        let ch;
        if (type === 'line') ch = C.lineChart({ labels, xs, xTicks: tickYears(xs), series: series.map((s, i) => ({ ...s, highlight: i === 0, width: i === 0 ? 3 : 2 })), yMin: 0, yMax: 80, yTicks: 4, yFmt: v => v.toFixed(0) + '%', height: 360 });
        else ch = C.stackedArea({ labels, xs, xTicks: tickYears(xs), series, yMax: 100, yTicks: 4, yFmt: v => v.toFixed(0) + '%', height: 360 });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Percentage of students ages 5 (school age) through 21 served under IDEA, Part B, by year and educational environment: School year 2012–13 through 2024–25',
          sub: 'Share of school-age students served under IDEA, Part B, by educational environment, by school year.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection. School Years 2012–13 through 2024–25.',
          legend: series.map(s => [s.name, s.color]),
          csv: [['School year', ...series.map(s => s.name)], ...labels.map((y, i) => [y, ...series.map(s => s.values[i])])],
        };
      },
    },
    /* inclusion by disability */
    {
      id: 'incl', label: 'Time in regular class, by disability', types: ['bars', 'columns', 'bubbles'],
      render(sel, type) {
        const items = I.ARC.inclByCat.slice().sort((a, b) => b[1] - a[1]);
        const col = k => k === 'All disabilities' ? P.accent : P.green;
        const oc = (d, i) => { const k = items[i][0]; if (k !== 'All disabilities' && S.openCatModal) S.openCatModal(k); };
        let ch;
        if (type === 'bubbles') ch = C.bubbles({ onClick: oc, items: items.map(([k, v]) => ({ label: k.split(' ').slice(0, 2).join(' '), value: v, color: col(k), highlight: k === 'All disabilities' })), valueFmt: v => v.toFixed(0) + '%' });
        else if (type === 'columns') ch = C.columns({ labels: items.map(d => d[0].split(' ')[0]), values: items.map(d => d[1]), yMax: 100, yFmt: v => v + '%', xEvery: 1, height: 340, onClick: oc });
        else ch = C.barsH({ onClick: oc, items: items.map(([k, v]) => ({ label: k, value: v, color: col(k), highlight: k === 'All disabilities' })), labelW: 236, barH: 18, gap: 9, padR: 54, xMax: 100, valueFmt: v => v.toFixed(1) + '%' });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Percentage of students ages 5 (school age) through 21 served under IDEA, Part B, inside the regular class 80 percent or more of the day, by disability category: Fall 2023',
          sub: 'Percent of school-age students served, School Year 2023–24.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection, School Year 2023–24.',
          csv: [['Disability category', 'Percent in regular class 80%+'], ...items],
        };
      },
    },
    /* demographics: race / ethnicity */
    {
      id: 'race', label: 'Who is served, by race and ethnicity', types: ['bars', 'columns', 'donut', 'bubbles'],
      opts: [{ key: 'profile', kind: 'toggle', label: 'Group', choices: [['All Disabilities', 'All disabilities'], ['Autism', 'Autism']], def: 'All Disabilities' }],
      render(sel, type) {
        const d = I.DEMO[sel.profile], races = Object.keys(d.race).map(k => ({ k, v: d.race[k] })).sort((a, b) => b.v - a.v);
        const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : Math.round(v / 1e3) + 'k';
        const oc = (x, i) => S.openRaceModal && S.openRaceModal(races[i].k, sel.profile);
        let ch;
        if (type === 'donut') ch = C.donut({ size: 320, stroke: 46, onClick: oc, segments: races.map((r, i) => ({ name: I.RACE_LBL[r.k], value: r.v, color: COLORS[i % COLORS.length] })), centerValue: d.total, centerFmt: v => (v / 1e6).toFixed(1) + 'M', centerSub: 'served' });
        else if (type === 'bubbles') ch = C.bubbles({ onClick: oc, items: races.map((r) => ({ label: I.RACE_LBL[r.k], value: r.v, color: P.green })), valueFmt: fmt });
        else if (type === 'columns') ch = C.columns({ labels: races.map(r => r.k), values: races.map(r => r.v), yFmt: fmt, xEvery: 1, height: 340, onClick: oc });
        else ch = C.barsH({ onClick: oc, items: races.map((r) => ({ label: I.RACE_LBL[r.k], value: r.v, color: P.green })), labelW: 210, barH: 20, gap: 10, padR: 58, valueFmt: fmt });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Number of children and students ages 3 through 21 served under IDEA, Part B, by race/ethnicity' + (sel.profile === 'Autism' ? ', under the primary disability category of autism' : '') + ': School year 2024–25',
          sub: 'Number served, School Year 2024–25.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25.',
          csv: [['Race/ethnicity', 'Served, 2024-25'], ...races.map(r => [I.RACE_LBL[r.k], r.v])],
        };
      },
    },
    /* demographics: age */
    {
      id: 'age', label: 'Who is served, by age', types: ['columns', 'line'],
      opts: [{ key: 'profile', kind: 'toggle', label: 'Group', choices: [['All Disabilities', 'All disabilities'], ['Autism', 'Autism']], def: 'All Disabilities' }],
      render(sel, type) {
        const d = I.DEMO[sel.profile], ages = Object.keys(d.ages).map(Number).sort((a, b) => a - b), vals = ages.map(a => d.ages[a]);
        const yFmt = v => v >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : Math.round(v);
        let ch;
        if (type === 'line') ch = C.lineChart({ labels: ages.map(String), xs: ages, xTicks: ages.filter((_, i) => i % 3 === 0), series: [{ values: vals, color: P.greenD, area: true, areaOpacity: .14, highlight: true }], yMin: 0, yTicks: 3, yFmt, height: 340 });
        else ch = C.columns({ labels: ages.map(String), values: vals, yFmt, xEvery: 2, height: 340, onClick: (x, i) => S.openAgeModal && S.openAgeModal(ages[i], vals[i], sel.profile) });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Number of children and students ages 3 through 21 served under IDEA, Part B, by single year of age' + (sel.profile === 'Autism' ? ', under the primary disability category of autism' : '') + ': School year 2024–25',
          sub: 'Number served at each age, School Year 2024–25.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25.',
          csv: [['Age', 'Served, 2024-25'], ...ages.map(a => [a, d.ages[a]])],
        };
      },
    },
    /* states */
    {
      id: 'states', label: 'By state', types: ['bars', 'columns', 'map', 'heatmap'],
      opts: [
        { key: 'metric', kind: 'select', label: 'Measure', choices: [['served', 'Number served (2024–25)'], ['pct', '% of enrollment (2022–23)'], ['growth', 'Growth since 2000–01']], def: 'served' },
        { key: 'topn', kind: 'select', label: 'Show', choices: [['10', 'Top 10'], ['15', 'Top 15'], ['25', 'Top 25'], ['all', 'All 51']], def: '15' },
      ],
      render(sel, type) {
        const metricVal = r => sel.metric === 'served' ? r[5] : sel.metric === 'pct' ? r[6] : (r[5] - r[2]) / r[2] * 100;
        const fmt = sel.metric === 'served' ? (v => v >= 1e3 ? Math.round(v / 1e3) + 'k' : Math.round(v)) : (v => v.toFixed(sel.metric === 'pct' ? 1 : 0) + '%');
        const mlabel = sel.metric === 'served' ? 'Number served, ages 3 through 21, School Year 2024–25' : sel.metric === 'pct' ? 'Students served as a percent of public-school enrollment, School Year 2022–23' : 'Growth in number served, 2000–01 to 2024–25';
        const src = 'U.S. Department of Education, OSEP, IDEA Part B Child Count and Educational Environments Collection' + (sel.metric === 'pct' ? ', with NCES public-school enrollment' : '') + '.';
        let ch;
        if (type === 'map') {
          const v = {}; I.STATES.forEach(r => v[r[1]] = metricVal(r));
          const arr = Object.values(v), min = Math.min(...arr), max = Math.max(...arr);
          const stops = [{ t: 0, color: '#eaf0e9' }, { t: .5, color: '#5aa377' }, { t: 1, color: '#0f3d2c' }];
          ch = window.USMAP ? C.choropleth({ values: v, min, max, stops, fmt, nameOf: a => (I.STATES.find(r => r[1] === a) || [a])[0], onClick: ab => drillState(ab) }) : C.tileMap({ values: v, min, max, stops, fmt, nameOf: a => (I.STATES.find(r => r[1] === a) || [a])[0] });
        } else if (type === 'heatmap') {
          const ranked = I.STATES.slice().sort((a, b) => metricVal(b) - metricVal(a));
          const n = sel.topn === 'all' ? 51 : +sel.topn, rows = ranked.slice(0, n);
          ch = C.heatmap({ rowLabels: rows.map(r => r[0]), colLabels: ['2000–01', '2010–11', '2022–23', '2024–25'], matrix: rows.map(r => [r[2], r[3], r[4], r[5]]), valueFmt: v => Math.round(v / 1e3) + 'k', showValues: true, cellH: 24, labelW: 150 });
        } else {
          const ranked = I.STATES.slice().sort((a, b) => metricVal(b) - metricVal(a));
          const n = sel.topn === 'all' ? 51 : +sel.topn, rows = ranked.slice(0, n);
          const ocs = (x, i) => drillState(rows[i][1]);
          if (type === 'columns') ch = C.columns({ labels: rows.map(r => r[1]), values: rows.map(metricVal), yFmt: fmt, xEvery: 1, height: 360, onClick: ocs });
          else ch = C.barsH({ onClick: ocs, items: rows.map((r, i) => ({ label: r[0], value: metricVal(r), color: i === 0 ? P.greenD : P.green })), labelW: 150, barH: 18, gap: 8, padR: 64, valueFmt: fmt });
        }
        return {
          node: ch.node, reveal: ch.reveal,
          title: mlabel + ', by State',
          sub: mlabel + '.', source: src + ' (50 states and the District of Columbia).',
          csv: [['State', 'Abbr', 'Value'], ...I.STATES.map(r => [r[0], r[1], metricVal(r)])],
        };
      },
    },
    /* exiting */
    {
      id: 'exiting', label: 'Graduation and dropout, by disability', types: ['bars', 'columns', 'dumbbell'],
      opts: [{ key: 'metric', kind: 'toggle', label: 'Measure', choices: [['grad', 'Graduated, regular diploma'], ['drop', 'Dropped out']], def: 'grad' }],
      render(sel, type) {
        const rows = (X.EXIT_DIS || []).slice();
        const get = r => sel.metric === 'grad' ? r[1] : r[2];
        const sorted = rows.sort((a, b) => get(b) - get(a));
        const oc = (x, i) => S.openCatModal && S.openCatModal(sorted[i][0]);
        let ch;
        if (type === 'dumbbell') ch = C.dumbbell({ onClick: oc, items: sorted.map(r => ({ label: r[0], a: r[2], b: r[1] })), labelW: 232, rowH: 30, ticks: 4, xMin: 0, xMax: 100, aColor: P.accent, bColor: P.greenD, valueFmt: v => v.toFixed(0) + '%' });
        else if (type === 'columns') ch = C.columns({ labels: sorted.map(r => r[0].split(' ')[0]), values: sorted.map(get), yMax: 100, yFmt: v => v + '%', xEvery: 1, height: 340, onClick: oc });
        else ch = C.barsH({ onClick: oc, items: sorted.map(r => ({ label: r[0], value: get(r), color: P.green })), labelW: 232, barH: 16, gap: 8, padR: 54, xMax: 100, valueFmt: v => v.toFixed(1) + '%' });
        return {
          node: ch.node, reveal: ch.reveal,
          title: (type === 'dumbbell' ? 'Dropout (clay) and graduation (green)' : sel.metric === 'grad' ? 'Graduated with a regular high school diploma' : 'Dropped out') + ', by disability category',
          sub: 'Percent of students ages 14 through 21 who exited school, School Year 2023–24.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Exiting Collection, School Year 2023–24.',
          csv: [['Disability category', 'Graduated regular diploma %', 'Dropped out %'], ...rows.map(r => [r[0], r[1], r[2]])],
        };
      },
    },
    /* discipline */
    {
      id: 'discipline', label: 'Disciplinary removals, by disability', types: ['bars', 'columns'],
      opts: [{ key: 'metric', kind: 'toggle', label: 'Measure', choices: [['per100', 'Per 100 students served'], ['total', 'Total removals']], def: 'per100' }],
      render(sel, type) {
        const yi = I.YEARS.indexOf('2023-24');
        const items = (X.DISC_DIS || []).map(([d, rem]) => {
          const cc = I.DIS[d] && I.DIS[d][yi] != null ? I.DIS[d][yi] * 1000 : null;
          return { label: d, total: rem, per100: cc ? +(rem / cc * 100).toFixed(1) : null };
        }).filter(d => d[sel.metric] != null).sort((a, b) => b[sel.metric] - a[sel.metric]);
        const fmt = sel.metric === 'per100' ? (v => v.toFixed(0)) : (v => v >= 1e3 ? Math.round(v / 1e3) + 'k' : Math.round(v));
        const oc = (x, i) => S.openCatModal && S.openCatModal(items[i].label);
        let ch;
        if (type === 'columns') ch = C.columns({ labels: items.map(d => d.label.split(' ')[0]), values: items.map(d => d[sel.metric]), yFmt: fmt, xEvery: 1, height: 340, onClick: oc });
        else ch = C.barsH({ onClick: oc, items: items.map(d => ({ label: d.label, value: d[sel.metric], color: P.green })), labelW: 232, barH: 16, gap: 8, padR: 60, valueFmt: fmt });
        return {
          node: ch.node, reveal: ch.reveal,
          title: sel.metric === 'per100' ? 'Disciplinary removals per 100 students served, by disability' : 'Total disciplinary removals, by disability',
          sub: 'By primary disability category, School Year 2023–24. Each removal is counted separately.',
          source: 'U.S. Department of Education, OSEP, IDEA Part B Discipline Collection and Child Count, School Year 2023–24.',
          csv: [['Disability category', 'Total removals', 'Per 100 served'], ...items.map(d => [d.label, d.total, d.per100])],
        };
      },
    },
    /* personnel: teachers fully certified, by state */
    {
      id: 'personnel', label: 'Teachers fully certified, by state', types: ['bars', 'columns', 'map'],
      render(sel, type) {
        const pers = (window.DMS && window.DMS.personnel && window.DMS.personnel.byState) || {};
        const rows = I.STATES.filter(r => pers[r[1]] != null).map(r => ({ name: r[0], ab: r[1], v: pers[r[1]] })).sort((a, b) => b.v - a.v);
        const fmt = v => v.toFixed(1) + '%';
        let ch;
        if (type === 'map') {
          const vals = {}; rows.forEach(x => vals[x.ab] = x.v); const arr = rows.map(x => x.v), min = Math.min(...arr), max = Math.max(...arr);
          const stops = [{ t: 0, color: '#e7efe9' }, { t: .5, color: '#5aa377' }, { t: 1, color: '#0f3d2c' }];
          ch = window.USMAP ? C.choropleth({ values: vals, min, max, stops, fmt, nameOf: a => (I.STATES.find(r => r[1] === a) || [a])[0], onClick: ab => drillState(ab) }) : C.tileMap({ values: vals, min, max, stops, fmt, nameOf: a => (I.STATES.find(r => r[1] === a) || [a])[0] });
        } else if (type === 'columns') ch = C.columns({ labels: rows.map(x => x.ab), values: rows.map(x => x.v), yMax: 100, yFmt: v => v + '%', xEvery: 2, height: 340, onClick: (x, i) => drillState(rows[i].ab) });
        else ch = C.barsH({ onClick: (x, i) => drillState(rows[i].ab), items: rows.map(x => ({ label: x.name, value: x.v, color: P.green })), labelW: 150, barH: 15, gap: 6, padR: 56, xMax: 100, valueFmt: fmt });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Percentage of special education teachers who are fully certified, by State: School year 2022–23',
          sub: 'Full-time-equivalent special education teachers fully certified.',
          source: 'U.S. Department of Education, EDFacts IDEA Part B Personnel Collection, School Year 2022–23; 47th Annual Report to Congress.',
          csv: [['State', 'Percent of teachers fully certified (2022-23)'], ...rows.map(x => [x.name, x.v])],
        };
      },
    },
    /* IDEA determinations by level and year */
    {
      id: 'determinations', label: 'State determinations, by level', types: ['bars', 'columns'],
      opts: [
        { key: 'year', kind: 'toggle', label: 'Year', choices: [['2026', '2026'], ['2025', '2025']], def: '2026' },
        { key: 'part', kind: 'toggle', label: 'IDEA part', choices: [['partB', 'Part B'], ['partC', 'Part C']], def: 'partB' },
      ],
      render(sel, type) {
        const map = (sel.year === '2025' ? window.DET2025 : window.DET2026) || { partB: {}, partC: {} };
        const obj = map[sel.part] || {};
        const LV = [['Meets requirements', /^Meets/, P.green], ['Needs assistance, one year', /one year/, '#c9a23a'], ['Needs assistance, two or more years', /two or more/, P.accent], ['Needs intervention', /intervention/, '#8f2d2d']];
        const items = LV.map(([lab, re, col]) => ({ label: lab, value: Object.values(obj).filter(v => re.test(v)).length, color: col }));
        const total = Object.keys(obj).length;
        let ch;
        if (type === 'columns') ch = C.columns({ labels: items.map(d => d.label.replace('Needs assistance, ', 'NA ').replace('Needs intervention', 'Intervention').replace('Meets requirements', 'Meets')), values: items.map(d => d.value), colors: items.map(d => d.color), yFmt: v => Math.round(v), xEvery: 1, height: 320 });
        else ch = C.barsH({ items, labelW: 260, barH: 26, gap: 15, padR: 48, valueFmt: v => Math.round(v) });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Number of states and reporting entities at each IDEA ' + (sel.part === 'partB' ? 'Part B' : 'Part C') + ' determination level: ' + sel.year,
          sub: 'Of ' + total + ' states and reporting entities, based on ' + (sel.year === '2025' ? 'FFY 2023' : 'FFY 2024') + ' SPP/APR.',
          source: 'U.S. Department of Education, OSEP, ' + sel.year + ' Determination Letters on State Implementation of IDEA.',
          csv: [['Determination level', 'States and entities'], ...items.map(d => [d.label, d.value])],
        };
      },
    },
    /* part C settings */
    {
      id: 'partc', label: 'Part C early-intervention settings', types: ['donut', 'bars', 'columns'],
      render(sel, type) {
        const segs = I.ARC.partcSettings, cols = { 'Home': P.greenD, 'Community-based setting': P.green, 'Other setting': P.greenL };
        const oc = (x, i) => S.openPartcModal && S.openPartcModal(segs[i][0], segs[i][1]);
        let ch;
        if (type === 'columns') ch = C.columns({ labels: segs.map(s => s[0].split(' ')[0]), values: segs.map(s => s[1]), yMax: 100, yFmt: v => v + '%', xEvery: 1, height: 320, onClick: oc });
        else if (type === 'bars') ch = C.barsH({ onClick: oc, items: segs.map(s => ({ label: s[0], value: s[1], color: cols[s[0]] || P.green })), labelW: 180, barH: 24, gap: 14, padR: 56, xMax: 100, valueFmt: v => v.toFixed(1) + '%' });
        else ch = C.donut({ size: 320, stroke: 48, onClick: oc, segments: segs.map(s => ({ name: s[0], value: s[1], color: cols[s[0]] || P.green })), centerValue: I.ARC.partcTotal, centerFmt: v => Math.round(v / 1e3) + 'K', centerSub: 'infants & toddlers' });
        return {
          node: ch.node, reveal: ch.reveal,
          title: 'Percentage of infants and toddlers birth through age 2 served under IDEA, Part C, by primary early intervention services setting: School year 2024–25',
          sub: 'Percent of infants and toddlers served under IDEA, Part C, SY 2024–25.',
          source: 'U.S. Department of Education, OSEP, IDEA Part C Child Count and Settings Collection, School Year 2024–25.',
          csv: [['Primary setting', 'Percent'], ...segs],
        };
      },
    },
  ];

  /* ---- panel chrome ----------------------------------------- */
  const fab = document.createElement('button');
  fab.id = 'cb-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Open the chart builder');
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7"/><path d="M20 7.5 21.5 6M21.5 6 20 4.5M21.5 6h-3.2"/></svg><span>Build a chart</span>`;
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.id = 'cb-panel';
  panel.innerHTML = `
    <div class="cb-head">
      <div><b>Chart builder</b><span>Build any chart from the data in this story</span></div>
      <button class="cb-x" aria-label="Close">×</button>
    </div>
    <div class="cb-body">
      <label class="cb-field"><span>Topic</span>
        <select id="cb-topic"></select></label>
      <div id="cb-opts"></div>
      <div class="cb-field"><span>Chart type</span><div id="cb-types" class="cb-types"></div></div>
      <div class="cb-field"><span>Options</span><div class="cb-optrow">
        <div class="cb-seg" id="cb-labels"><button type="button" data-v="on" class="on">Value labels on</button><button type="button" data-v="off">Labels off</button></div>
        <div class="cb-seg" id="cb-legendtog"><button type="button" data-v="on" class="on">Legend on</button><button type="button" data-v="off">Legend off</button></div>
      </div></div>
      <div class="cb-preview">
        <input id="cb-title" class="cb-title-input" aria-label="Chart title (editable)" placeholder="Chart title">
        <div class="figure-sub" id="cb-sub"></div>
        <div class="legend" id="cb-legend"></div>
        <div id="cb-chart" class="chartbox"></div>
        <div class="source" id="cb-source"></div>
      </div>
    </div>
    <div class="cb-foot">
      <button id="cb-png" type="button">Download PNG</button>
      <button id="cb-csv" type="button">Download CSV</button>
    </div>`;
  document.body.appendChild(panel);

  const topicSel = panel.querySelector('#cb-topic');
  TOPICS.forEach((t, i) => topicSel.add(new Option(t.label, i)));
  const state = {}; // per-topic option selections
  let curType = null, lastCsv = null, lastName = 'chart';
  const OPT = { labels: true, legend: true };   // global display options (labels, legend)

  function optDefaults(t) {
    const s = {}; (t.opts || []).forEach(o => s[o.key] = Array.isArray(o.def) ? o.def.slice() : o.def); return s;
  }
  function buildOptsUI(t) {
    const host = panel.querySelector('#cb-opts'); host.innerHTML = '';
    (t.opts || []).forEach(o => {
      const wrap = document.createElement('div'); wrap.className = 'cb-field';
      const lab = document.createElement('span'); lab.textContent = o.label; wrap.appendChild(lab);
      if (o.kind === 'select') {
        const sel = document.createElement('select');
        o.choices.forEach(([v, l]) => sel.add(new Option(l, v)));
        sel.value = state[t.id][o.key];
        sel.addEventListener('change', () => { state[t.id][o.key] = sel.value; draw(); });
        wrap.appendChild(sel);
      } else if (o.kind === 'toggle') {
        const seg = document.createElement('div'); seg.className = 'cb-seg';
        o.choices.forEach(([v, l]) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = l;
          b.classList.toggle('on', state[t.id][o.key] === v);
          b.addEventListener('click', () => { state[t.id][o.key] = v; seg.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); draw(); });
          seg.appendChild(b);
        });
        wrap.appendChild(seg);
      } else if (o.kind === 'multi') {
        const chips = document.createElement('div'); chips.className = 'cb-chips';
        o.choices.forEach(([v, l]) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = l;
          b.classList.toggle('on', state[t.id][o.key].includes(v));
          b.addEventListener('click', () => {
            const arr = state[t.id][o.key], k = arr.indexOf(v);
            if (k >= 0) { if (arr.length > 1) arr.splice(k, 1); } else arr.push(v);
            b.classList.toggle('on', arr.includes(v)); draw();
          });
          chips.appendChild(b);
        });
        wrap.appendChild(chips);
      }
      host.appendChild(wrap);
    });
  }
  function buildTypeUI(t) {
    const host = panel.querySelector('#cb-types'); host.innerHTML = '';
    if (!t.types.includes(curType)) curType = t.types[0];
    t.types.forEach(ty => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = TYPE_LABEL[ty] || ty;
      b.classList.toggle('on', ty === curType);
      b.addEventListener('click', () => { curType = ty; host.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); draw(); });
      host.appendChild(b);
    });
  }
  function draw() {
    const t = TOPICS[+topicSel.value];
    const res = t.render(state[t.id], curType);
    panel.querySelector('#cb-title').value = (res.title || '').replace(/&nbsp;/g, ' ');
    panel.querySelector('#cb-sub').textContent = res.sub || '';
    panel.querySelector('#cb-source').innerHTML = '<span class="src-k">Source</span> ' + (res.source || '');
    const lg = panel.querySelector('#cb-legend'); lg.innerHTML = '';
    if (OPT.legend) (res.legend || []).forEach(([txt, c]) => { const k = document.createElement('span'); k.className = 'k'; const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = c; k.appendChild(sw); k.appendChild(document.createTextNode(txt)); lg.appendChild(k); });
    const host = panel.querySelector('#cb-chart'); host.innerHTML = ''; host.appendChild(res.node);
    host.classList.toggle('cb-nolabels', !OPT.labels);
    res.reveal && res.reveal();
    lastCsv = res.csv; lastName = 'idea-' + t.id + '-' + curType;
  }
  function selectTopic() {
    const t = TOPICS[+topicSel.value];
    if (!state[t.id]) state[t.id] = optDefaults(t);
    curType = t.types[0];
    buildOptsUI(t); buildTypeUI(t); draw();
  }
  topicSel.addEventListener('change', selectTopic);
  function wireSeg(id, key) { const seg = panel.querySelector(id); if (!seg) return;
    seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { OPT[key] = b.dataset.v === 'on'; seg.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); draw(); })); }
  wireSeg('#cb-labels', 'labels'); wireSeg('#cb-legendtog', 'legend');

  panel.querySelector('#cb-png').addEventListener('click', () => {
    const src = (panel.querySelector('#cb-source').textContent || '').replace(/^\s*source\s*/i, '').replace(/\s+/g, ' ').trim();
    C.exportPNG(panel.querySelector('#cb-chart svg.cv'), lastName, { title: panel.querySelector('#cb-title').value, source: src });
  });
  panel.querySelector('#cb-csv').addEventListener('click', () => { if (lastCsv && lastCsv.length) C.exportCSVFile(lastName, lastCsv); });

  function open() { panel.classList.add('show'); fab.classList.add('hidden'); if (!curType) selectTopic(); }
  function close() { panel.classList.remove('show'); fab.classList.remove('hidden'); }
  fab.addEventListener('click', open);
  fab.addEventListener('mouseenter', open);   // hovering the corner button opens the builder
  panel.querySelector('.cb-x').addEventListener('click', close);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('show')) close(); });

  selectTopic();
})();
