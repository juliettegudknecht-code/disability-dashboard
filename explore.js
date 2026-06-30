/* ============================================================
   explore.js — the interactive "Explore" section:
   State snapshot, all-states table (SEA), and a districts (LEA)
   placeholder ready for data. Uses the same STATES data + chart kit.
   ============================================================ */
(function () {
  const I = window.IDEA, C = window.Charts, P = I.PAL, X = window.IDEA_X || {}, $ = s => document.querySelector(s);
  const CAT = window.CATDATA || null;
  // render a state's (or district's) full category breakdown into a host element
  function catBars(host, vec, total, openCat) {
    if (!host || !CAT || !vec) return;
    const items = CAT.cats.map((c, i) => ({ label: c, value: vec[i] })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    if (!items.length) { host.innerHTML = '<div class="map-empty">No category detail reported.</div>'; return; }
    const ch = C.barsH({
      onClick: openCat ? (it => window.IDEAStory && window.IDEAStory.openCatModal && window.IDEAStory.openCatModal(it.label)) : null,
      items: items.map(d => ({ label: d.label, value: d.value, color: P.green })),
      labelW: 220, barH: 15, gap: 8, padR: 66, xMax: items[0].value * 1.02,
      valueFmt: v => v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'k' : Math.round(v),
    });
    host.appendChild(ch.node); ch.reveal();
  }

  /* tab switching */
  document.querySelectorAll('.extab').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.extab').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
    b.classList.add('on'); b.setAttribute('aria-selected', 'true');
    document.querySelectorAll('.expanel').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  }));

  /* ---- State snapshot --------------------------------------- */
  const sel = $('#exStateSel'), out = $('#exStateOut');
  const detCls = s => !s ? '' : /^Meets/.test(s) ? 'det-meets' : /intervention/i.test(s) ? 'det-int' : /two or more/i.test(s) ? 'det-na2' : 'det-na1';
  if (sel && out) {
    sel.add(new Option('Choose a state', ''));
    I.STATES.forEach((r, i) => sel.add(new Option(r[0], i)));
    sel.value = String(I.STATES.reduce((bi, r, i, a) => r[5] > a[bi][5] ? i : bi, 0)); // open on the largest state
    const ranked = I.STATES.slice().sort((a, b) => b[5] - a[5]);
    function render() {
      if (sel.value === '') { out.innerHTML = '<div class="focus-empty">Choose a state above to see its snapshot.</div>'; return; }
      const r = I.STATES[+sel.value];
      const dt = window.DET2026 ? { b: window.DET2026.partB[r[0]], c: window.DET2026.partC[r[0]] } : {};
      const served = r[5], pe = r[6], growth = (r[5] - r[2]) / r[2] * 100;
      const rank = ranked.findIndex(x => x[1] === r[1]) + 1;
      const ex = (X.EXIT_STATE || {})[r[1]], dc = (X.DISC_STATE || {})[r[1]];
      const cell = (k, v, sub, cls) => `<div class="snap-cell"><div class="k">${k}</div><div class="v ${cls || ''}">${v}</div><div class="sub">${sub}</div></div>`;
      const extraCells = [];
      if (ex && ex.gradPct != null) extraCells.push(cell('Graduated with a regular diploma', ex.gradPct.toFixed(1) + '%', 'of students ages 14&ndash;21 who exited school'));
      if (ex && ex.dropPct != null) extraCells.push(cell('Dropped out', ex.dropPct.toFixed(1) + '%', 'of students ages 14&ndash;21 who exited school', 'accent'));
      if (dc && dc.g10 != null) extraCells.push(cell('Removed more than 10 days', I.nf(dc.g10), 'students with disciplinary removals over&nbsp;10 days'));
      const extra = extraCells.length ? `<div class="snap-compare"><div class="figure-title">Exiting and discipline</div>
        <div class="figure-sub">Latest reported figures, School&nbsp;Year 2023&ndash;24.</div>
        <div class="snap-grid" style="margin-top:12px">${extraCells.join('')}</div></div>` : '';
      const detBlock = dt.b ? `<div class="snap-compare"><div class="figure-title">2026 IDEA determination</div>
        <div class="figure-sub">Annual determination on the state's implementation of IDEA.</div>
        <div class="det-pills" style="margin-top:11px"><span class="det-pill ${detCls(dt.b)}">Part&nbsp;B: ${dt.b}</span>${dt.c ? `<span class="det-pill ${detCls(dt.c)}">Part&nbsp;C: ${dt.c}</span>` : ''}</div></div>` : '';
      out.innerHTML = `<div class="snap-grid">
        <div class="snap-cell"><div class="k">Students served, ages 3&ndash;21</div><div class="v">${I.nf(served)}</div><div class="sub">School Year 2024&ndash;25</div></div>
        <div class="snap-cell"><div class="k">Percent of public-school enrollment</div><div class="v">${pe.toFixed(1)}%</div><div class="sub">School Year 2022&ndash;23</div></div>
        <div class="snap-cell"><div class="k">Growth since 2000&ndash;01</div><div class="v accent">${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%</div><div class="sub">2000&ndash;01 to 2024&ndash;25</div></div>
        <div class="snap-cell"><div class="k">National rank by number served</div><div class="v">#${rank}</div><div class="sub">of 51 states and DC</div></div>
      </div>${extra}${detBlock}
      <div class="snap-compare"><div class="figure-title">${r[0]}: child count trend</div>
        <div class="figure-sub">Students served, ages 3&ndash;21, selected school years.</div>
        <div id="snapTrend" class="chartbox"></div></div>
      ${(CAT && CAT.state[r[1]]) ? `<div class="snap-compare"><div class="figure-title">${r[0]}: students served by disability category</div>
        <div class="figure-sub">All 13 primary categories, ages 3&ndash;21, School&nbsp;Year 2024&ndash;25. Tap a bar for the category profile.</div>
        <div id="snapCats" class="chartbox"></div></div>` : ''}`;
      const vals = [r[2], r[3], r[4], r[5]];
      const trend = C.lineChart({
        labels: ['2000\u201301', '2010\u201311', '2022\u201323', '2024\u201325'], xs: [2000, 2010, 2022, 2024], xTicks: [2000, 2010, 2022, 2024],
        series: [{ values: vals, color: P.greenD, area: true, areaOpacity: .12, highlight: true, endLabel: I.nf(r[5]) }],
        yMin: 0, yMax: Math.max(...vals) * 1.15, yTicks: 3, yFmt: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v),
        height: 300, width: 740, padL: 50,
      });
      $('#snapTrend').appendChild(trend.node); trend.reveal();
      if (CAT && CAT.state[r[1]]) { const vec = CAT.state[r[1]]; catBars($('#snapCats'), vec, vec.reduce((a, b) => a + b, 0), true); }
    }
    sel.addEventListener('change', render); render();
  }

  /* ---- All-states table (SEA) ------------------------------- */
  const tbl = $('#seaTable');
  if (tbl) {
    const EX = X.EXIT_STATE || {};
    const cols = [{ k: 'name', t: 'State' }, { k: 2, t: '2000\u201301' }, { k: 3, t: '2010\u201311' },
      { k: 4, t: '2022\u201323' }, { k: 5, t: '2024\u201325' }, { k: 'g', t: 'Growth' }, { k: 6, t: '% enroll' },
      { k: 'grad', t: 'Grad %' }, { k: 'drop', t: 'Dropout %' }];
    let sortK = 5, sortDir = -1, filter = '';
    const exv = (r, f) => EX[r[1]] && EX[r[1]][f] != null ? EX[r[1]][f] : null;
    const cell = (r, k) => k === 'name' ? r[0] : k === 'g' ? (r[5] - r[2]) / r[2] * 100
      : k === 'grad' ? exv(r, 'gradPct') : k === 'drop' ? exv(r, 'dropPct') : r[k];
    const dash = '<span style="color:var(--faint)">&ndash;</span>';
    const STR = new Set(['name', 'g', 'grad', 'drop']);
    function build() {
      const thead = tbl.querySelector('thead'), tb = tbl.querySelector('tbody');
      thead.innerHTML = '<tr>' + cols.map(c => {
        const on = c.k === sortK; return `<th data-k="${c.k}">${c.t}${on ? '<span class="ar">' + (sortDir < 0 ? '\u2193' : '\u2191') + '</span>' : ''}</th>`;
      }).join('') + '</tr>';
      const rows = I.STATES.filter(r => r[0].toLowerCase().includes(filter)).sort((a, b) => {
        const av = cell(a, sortK), bv = cell(b, sortK);
        if (typeof av === 'string') return sortDir * av.localeCompare(bv);
        const an = av == null, bn = bv == null;               // suppressed values sort to the bottom
        if (an && bn) return 0; if (an) return 1; if (bn) return -1;
        return sortDir * (av - bv);
      });
      tb.innerHTML = rows.map(r => {
        const g = (r[5] - r[2]) / r[2] * 100, gp = exv(r, 'gradPct'), dp = exv(r, 'dropPct');
        return `<tr><td class="nm">${r[0]}</td><td>${I.nf(r[2])}</td><td>${I.nf(r[3])}</td><td>${I.nf(r[4])}</td><td>${I.nf(r[5])}</td><td class="pos">${g >= 0 ? '+' : ''}${g.toFixed(0)}%</td><td>${r[6].toFixed(1)}%</td><td>${gp != null ? gp.toFixed(1) + '%' : dash}</td><td>${dp != null ? dp.toFixed(1) + '%' : dash}</td></tr>`;
      }).join('');
      thead.querySelectorAll('th').forEach(th => th.addEventListener('click', () => {
        const raw = th.dataset.k, k = STR.has(raw) ? raw : +raw;
        if (sortK === k) sortDir *= -1; else { sortK = k; sortDir = (k === 'name') ? 1 : -1; }
        build();
      }));
    }
    build();
    const search = $('#seaSearch');
    if (search) search.addEventListener('input', e => { filter = e.target.value.toLowerCase().trim(); build(); });
  }

  /* ---- Districts (LEA): each state's largest districts ------ */
  const lsel = $('#leaStateSel'), lout = $('#leaOut');
  if (lsel && lout) {
    const LEAX = X.LEA || {};
    const LEAEXIT = (window.LEAEXIT && window.LEAEXIT.byNces) || {};
    const normN = n => { const z = String(n).replace(/\D/g, ''); return z ? String(parseInt(z, 10)) : ''; };
    I.STATES.forEach((r, i) => lsel.add(new Option(r[0], i)));
    const def = I.STATES.findIndex(r => r[1] === 'CA'); lsel.value = def < 0 ? 0 : def;
    function renderLea() {
      const r = I.STATES[+lsel.value], ab = r[1], d = LEAX[ab];
      if (!d || !d.rows || !d.rows.length) {
        lout.innerHTML = `<div class="lea-row"><span class="nm">No district-level data is reported for ${r[0]}.</span></div>`;
        return;
      }
      const stateTotal = r[5], shownTot = d.shownTot;             // anchor to the SEA state count
      const n = d.count, shown = d.rows.length;
      const other = stateTotal - shownTot, otherN = n - shown;
      let sumTxt;
      if (n === 1) sumTxt = `${r[0]} reports a single statewide education agency for School&nbsp;Year 2024&ndash;25.`;
      else if (shown >= n) sumTxt = `All ${I.nf(n)} school districts in ${r[0]} that reported a child count for School&nbsp;Year 2024&ndash;25 are listed below, ranked by number of students served.`;
      else sumTxt = `${I.nf(n)} school districts in ${r[0]} reported a child count for School&nbsp;Year 2024&ndash;25. The ${shown} largest by number of students served are listed below.`;
      const summary = `<div class="figure-sub" style="margin:0 0 14px">${sumTxt}</div>`;
      const rows = d.rows.map(x => {
        const [nm, nces, tot, sa, ec, aut] = x, bits = [];
        if (sa != null) bits.push(`${I.nf(sa)} school age`);
        if (aut != null && aut > 0) bits.push(`${I.nf(aut)} autism`);
        const ex = LEAEXIT[normN(nces)];                        // per-district exiting (2023-24)
        if (ex && ex[2] >= 20) {
          if (ex[0] != null) bits.push(`${Math.round(ex[0])}% graduated`);
          if (ex[1] != null) bits.push(`${Math.round(ex[1])}% dropped out`);
        }
        return `<div class="lea-row">
          <span class="nm">${nm}<small>NCES&nbsp;${nces}${bits.length ? ' &middot; ' + bits.join(' &middot; ') : ''}</small></span>
          <span class="v">${I.nf(tot)}<small> served</small></span></div>`;
      });
      if (otherN > 0 && other > 0) rows.push(`<div class="lea-row">
          <span class="nm" style="color:var(--muted)">All other districts<small>${I.nf(otherN)} additional districts and programs</small></span>
          <span class="v" style="color:var(--faint)">${I.nf(other)}<small> served</small></span></div>`);
      const SN = window.IDEAStory || {};
      lout.innerHTML = summary + `<div class="lea-list">${rows.join('')}</div>` + (SN.suppNoteHTML ? SN.suppNoteHTML('childcount') + SN.suppNoteHTML('exiting') : '');
    }
    lsel.addEventListener('change', renderLea); renderLea();
  }

  /* ---- Other collections tab (exiting / discipline / personnel) ---- */
  (function () {
    const moreTab = [...document.querySelectorAll('.extab')].find(b => b.dataset.tab === 'more');
    if (!moreTab) return;
    let built = false;
    function buildMore() {
      if (built) return; built = true;

      // A. Graduation with a regular diploma, by disability (Exiting, 2023-24)
      const exBox = $('#moreExit');
      if (exBox && X.EXIT_DIS) {
        const items = X.EXIT_DIS.slice().sort((a, b) => b[1] - a[1]).map(([d, g]) => ({
          label: d, value: g, color: P.green,
        }));
        const ch = C.barsH({ items, labelW: 232, barH: 17, gap: 9, padR: 54, xMax: 100, valueFmt: v => v.toFixed(1) + '%' });
        exBox.appendChild(ch.node); ch.reveal();
        window.IDEAStory && window.IDEAStory.expbar('moreExit', 'idea-exiting-by-disability-2023-24', [['Disability category', 'Graduated regular diploma %', 'Dropped out %'], ...X.EXIT_DIS.map(r => [r[0], r[1], r[2]])]);
      }

      // B. Disciplinary removals per 100 students served, by disability (2023-24)
      const ddBox = $('#moreDiscDis');
      if (ddBox && X.DISC_DIS) {
        const yi = I.YEARS.indexOf('2023-24');
        const items = X.DISC_DIS.map(([d, rem]) => {
          const cc = I.DIS[d] && I.DIS[d][yi] != null ? I.DIS[d][yi] * 1000 : null;
          return cc ? { label: d, value: +(rem / cc * 100).toFixed(1) } : null;
        }).filter(Boolean).sort((a, b) => b.value - a.value).map(o => ({
          label: o.label, value: o.value, highlight: o.label === 'Emotional disturbance',
          color: o.label === 'Emotional disturbance' ? P.navy : (o.label === 'Autism' ? P.greenD : P.green),
        }));
        const ch = C.barsH({ items, labelW: 232, barH: 17, gap: 9, padR: 60, xMax: 120, valueFmt: v => v.toFixed(0) });
        ddBox.appendChild(ch.node); ch.reveal();
        window.IDEAStory && window.IDEAStory.expbar('moreDiscDis', 'idea-discipline-per-100-2023-24', [['Disability category', 'Removals per 100 served'], ...items.map(d => [d.label, d.value])]);
      }

      // C. Disproportionality: share of students served vs share of removals, by race
      const drBox = $('#moreDiscRace'), discTot = X.DISC_NAT && X.DISC_NAT.rem;
      if (drBox && X.DISC_RACE && discTot) {
        const race = I.DEMO['All Disabilities'].race, totServed = I.DEMO['All Disabilities'].total;
        const map = { 'White': 'White', 'Hispanic/Latino': 'Hispanic', 'Black or African American': 'Black',
          'Asian': 'Asian', 'American Indian or Alaska Native': 'AIAN', 'Native Hawaiian or Other Pacific Islander': 'NHPI' };
        const items = X.DISC_RACE.map(([rk, rem]) => {
          const dk = map[rk]; if (!dk || race[dk] == null) return null;
          return { label: I.RACE_LBL[dk] || rk, a: +(race[dk] / totServed * 100).toFixed(1), b: +(rem / discTot * 100).toFixed(1) };
        }).filter(Boolean).sort((x, y) => y.a - x.a);
        const ch = C.dumbbell({ items, labelW: 196, rowH: 42, ticks: 5, xMin: 0, xMax: 50,
          aColor: P.greenL, bColor: P.accent, showValues: true, valueFmt: v => v.toFixed(0) + '%' });
        drBox.appendChild(ch.node); ch.reveal();
        window.IDEAStory && window.IDEAStory.expbar('moreDiscRace', 'idea-discipline-by-race-2023-24', [['Race/ethnicity', 'Share of students served %', 'Share of removals %'], ...items.map(d => [d.label, d.a, d.b])]);
        const lg = $('#moreRaceLegend');
        if (lg) lg.innerHTML = `<span class="k"><span class="sw" style="background:${P.greenL}"></span>Share of students served (2024&ndash;25)</span><span class="k"><span class="sw" style="background:${P.accent}"></span>Share of disciplinary removals (2023&ndash;24)</span>`;
      }

      // D. Personnel certification (2023-24)
      const pBox = $('#morePersonnel'), pers = X.PERSONNEL || {};
      if (pBox) {
        const cells = [];
        if (pers.teachers) cells.push(`<div class="snap-cell"><div class="k">Special education teachers</div><div class="v">${pers.teachers.pct.toFixed(1)}%</div><div class="sub">fully certified &middot; ${I.nf(Math.round(pers.teachers.total))} FTE</div></div>`);
        if (pers.paras) cells.push(`<div class="snap-cell"><div class="k">Paraprofessionals</div><div class="v">${pers.paras.pct.toFixed(1)}%</div><div class="sub">qualified &middot; ${I.nf(Math.round(pers.paras.total))} FTE</div></div>`);
        pBox.innerHTML = `<div class="snap-grid">${cells.join('')}</div>`;
      }
    }
    moreTab.addEventListener('click', buildMore);
  })();
})();
