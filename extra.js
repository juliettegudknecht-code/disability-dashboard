/* ============================================================
   extra.js — three additional exhibits folded in from the
   IDEA Section 618 Data Tool, rebuilt in the data-story chart kit:
     · Federal performance targets vs. reported results (GPRA)
     · 2026 IDEA determinations, by part
     · U.S. population context (Census ACS)
   All figures are reported values lifted verbatim from the Data
   Tool; every figure carries a source naming the collection and
   year. Funding (MOE/CEIS) was intentionally left out: the Tool's
   national Section 611 total reflects only reporting LEAs and does
   not reconcile to the national appropriation.
   ============================================================ */
(function () {
  const I = window.IDEA, C = window.Charts, P = I.PAL, S = window.IDEAStory;
  if (!I || !C || !S) return;

  /* ---- data (verbatim from the Data Tool) ------------------- */

  // GPRA: federal targets and reported actuals for students with disabilities.
  // rows are [year, target, actual]; actual is null where not yet reported.
  const GPRA = [
    { label: '4th-grade reading, at or above Basic', unit: '%', rows: [[2013, 40, 31], [2015, 40, 33], [2017, 40, 32], [2019, 40, 30], [2022, 40, 27], [2024, 40, null]], note: 'NAEP reading' },
    { label: '8th-grade math, at or above Basic', unit: '%', rows: [[2013, 38, 34], [2015, 38, 32], [2017, 38, 30], [2019, 38, 32], [2022, 38, 23], [2024, 38, null]], note: 'NAEP mathematics' },
    { label: 'State reading, proficient or advanced', unit: '%', rows: [[2021, 35, 19], [2022, 35, 18]], note: 'State assessments, grades 3–8' },
    { label: 'State math, proficient or advanced', unit: '%', rows: [[2021, 35, 16.95], [2022, 35, 15]], note: 'State assessments, grades 3–8' },
    { label: 'Graduated with a regular diploma', unit: '%', rows: [[2021, 75, 74], [2022, 75, 75]], note: 'Students with IEPs' },
    { label: 'Enrolled or employed within a year', unit: '%', rows: [[2020, 80, 74], [2021, 80, 77]], note: 'Of youth who left high school' },
  ];
  GPRA.forEach(m => {
    const withA = m.rows.filter(r => r[2] != null);
    const last = withA[withA.length - 1];
    m.target = m.rows[m.rows.length - 1][1];
    m.actual = last[2]; m.actualYear = last[0];
  });

  // IDEA determinations, two most recent rounds, counted live from the per-entity maps in det.js.
  const DET_LEVELS = [
    { key: 'meets', label: 'Meets requirements', color: '#2f8f57', re: /^Meets/ },
    { key: 'na1', label: 'Needs assistance, one year', color: '#c9a23a', re: /one year/ },
    { key: 'na2', label: 'Needs assistance, two or more years', color: '#cf6b35', re: /two or more/ },
    { key: 'int', label: 'Needs intervention', color: '#8f2d2d', re: /intervention/ },
  ];
  const DET_MAPS = { '2026': window.DET2026 || { partB: {}, partC: {} }, '2025': window.DET2025 || { partB: {}, partC: {} } };
  const DET_BASIS = { '2026': 'Federal Fiscal Year 2024', '2025': 'Federal Fiscal Year 2023' };
  const DET_BLURB = {
    'Meets requirements': 'The state meets the requirements and purposes of IDEA. This is the strongest of the four determination levels.',
    'Needs assistance, one year': 'The state needs assistance in implementing IDEA for the first year. The Department offers technical assistance.',
    'Needs assistance, two or more years': 'The state has needed assistance for two or more consecutive years. The Department must then take one or more enforcement actions, such as requiring the state to access technical assistance, designating it a high-risk grantee, or directing the use of state set-aside funds to the areas needing assistance.',
    'Needs intervention': 'The state needs intervention in implementing IDEA. This is the most serious determination short of substantial intervention; three or more consecutive years at this level triggers required enforcement actions.',
  };
  const detCountBy = (obj, re) => Object.values(obj).filter(v => re.test(v)).length;
  function detLevelsFor(year) { const m = DET_MAPS[year]; return DET_LEVELS.map(l => ({ key: l.key, label: l.label, color: l.color, partB: detCountBy(m.partB, l.re), partC: detCountBy(m.partC, l.re) })); }
  const detTotals = year => ({ B: Object.keys(DET_MAPS[year].partB).length, C: Object.keys(DET_MAPS[year].partC).length });

  // U.S. population context, Census ACS 2024 vs IDEA SY 2024-25.
  const ACS = {
    byAge: [['Ages 5–9', 13.7], ['Ages 10–14', 13.9], ['Ages 15–17', 11.6]],
    served_5_17: 7234809, pop_5_17: 54564265, oneIn: 7.5, pct: 13.3, ideaMale: 64.7, usMale: 49.5,
  };

  // keep the shape quickstats expects (latest = 2026), plus per-year access
  window.IDEA2 = { GPRA, DET: { levels: detLevelsFor('2026'), totalB: detTotals('2026').B, totalC: detTotals('2026').C, levelsFor: detLevelsFor, totals: detTotals, blurb: DET_BLURB }, ACS };

  /* (Federal performance targets / GPRA exhibit removed by request.) */

  /* ---- exhibit B · IDEA determinations, 2025 and 2026 ---------------------- */
  (function () {
    const box = document.getElementById('chart-det'); if (!box) return;
    let year = '2026', shown = false;
    const seg = document.createElement('div'); seg.className = 'seg det-yeartoggle'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Determination year');
    seg.innerHTML = ['2026', '2025'].map((y, i) => `<button type="button" data-year="${y}" class="${i === 0 ? 'on' : ''}" aria-pressed="${i === 0}">${y} determinations</button>`).join('');
    const holder = document.createElement('div');
    box.appendChild(seg); box.appendChild(holder);
    const CHECK = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    const ALERT = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
    function build() {
      const LV = detLevelsFor(year), T = detTotals(year);
      holder.innerHTML = '';
      const make = (part, total) => {
        const wrap = document.createElement('div'); wrap.className = 'det-donut';
        const cap = document.createElement('div'); cap.className = 'det-cap';
        cap.innerHTML = `<b>${part === 'partB' ? 'Part B' : 'Part C'}</b><span>${part === 'partB' ? 'ages 3–21' : 'birth–age 2'} · ${total} entities</span>`;
        const cb = document.createElement('div'); cb.className = 'chartbox'; cb.style.maxWidth = '176px';
        const d = C.donut({ size: 172, stroke: 30,
          segments: LV.map(l => ({ name: l.label, value: l[part], color: l.color })),
          onClick: seg2 => openDetModal(seg2.name, year),
          centerValue: (total - LV[0][part]) / total * 100, centerFmt: v => Math.round(v) + '%', centerSub: 'do not meet' });
        cb.appendChild(d.node); wrap.appendChild(cap); wrap.appendChild(cb);
        return { wrap, reveal: d.reveal };
      };
      const a = make('partB', T.B), b = make('partC', T.C);
      const row = document.createElement('div'); row.className = 'det-row';
      row.appendChild(a.wrap); row.appendChild(b.wrap); holder.appendChild(row);
      const sc = document.createElement('div'); sc.className = 'det-score';
      const pct = (n, tot) => tot ? Math.round(n / tot * 100) + '%' : '';
      sc.innerHTML = `<div class="det-score-head"><span></span><span>Part&nbsp;B</span><span>Part&nbsp;C</span></div>` + LV.map(l => `<button class="det-score-row" data-level="${l.label}" style="--c:${l.color}">
          <span class="det-score-lab"><span class="det-ic">${l.key === 'meets' ? CHECK : ALERT}</span>${l.label}</span>
          <span class="det-score-n">${l.partB}<small>${pct(l.partB, T.B)}</small></span>
          <span class="det-score-n">${l.partC}<small>${pct(l.partC, T.C)}</small></span>
        </button>`).join('');
      holder.appendChild(sc);
      sc.querySelectorAll('.det-score-row').forEach(b2 => b2.addEventListener('click', () => openDetModal(b2.dataset.level, year)));
      S.legend('detLegend', LV.map(l => [l.label, l.color]), name => openDetModal(name, year));
      S.expbar && S.expbar('chart-det', 'idea-determinations-' + year, [['Determination level', `Part B (n=${T.B})`, `Part C (n=${T.C})`], ...LV.map(l => [l.label, l.partB, l.partC])]);
      requestAnimationFrame(() => { a.reveal(); b.reveal(); });
    }
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; year = b.dataset.year;
      seg.querySelectorAll('button').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); build(); });
    S.onView(box, () => { if (!shown) { shown = true; build(); } });
    S.hint('chart-det', 'Toggle 2025 or 2026, and tap a slice, a key, or a row for what each level means');
  })();

  function openDetModal(name, year) {
    year = year || '2026';
    const LV = detLevelsFor(year), l = LV.find(x => x.label === name); if (!l) return;
    const D = DET_MAPS[year], T = detTotals(year);
    const re = l.key === 'meets' ? /^Meets/ : l.key === 'na1' ? /one year/ : l.key === 'na2' ? /two or more/ : /intervention/;
    const listFor = part => Object.keys(D[part]).filter(s => re.test(D[part][s])).sort();
    const chips = arr => arr.length ? `<div class="det-statelist">${arr.map(s => `<span>${s}</span>`).join('')}</div>` : '<p class="m-dek" style="font-size:13px;margin:0">None.</p>';
    S.openModal(`<div class="m-kicker">${year} IDEA determination</div><h3 class="m-title">${l.label}</h3>
      <p class="m-dek">${DET_BLURB[l.label] || ''}</p>
      <div class="m-grid">
        <div><span class="mv">${l.partB}</span><span class="ml">Part B states and entities (of ${T.B})</span></div>
        <div><span class="mv">${l.partC}</span><span class="ml">Part C states and entities (of ${T.C})</span></div>
      </div>
      <div class="figure-sub" style="margin:18px 0 7px">Part&nbsp;B: states and entities at this level</div>${chips(listFor('partB'))}
      <div class="figure-sub" style="margin:16px 0 7px">Part&nbsp;C: states and entities at this level</div>${chips(listFor('partC'))}
      <p class="m-src">U.S. Department of Education, Office of Special Education Programs, ${year} Determination Letters on State Implementation of IDEA (based on ${DET_BASIS[year]} SPP/APR).</p>`);
  }

  /* ---- exhibit C · population context (ACS) ----------------- */
  (function () {
    const box = document.getElementById('chart-acs'); if (!box) return;
    // a clear "1 in 7.5": a big ratio callout over a row of ~8 figures, one shaded
    const ratio = document.createElement('div'); ratio.style.cssText = 'font-family:var(--font-display);font-weight:800;letter-spacing:-.02em;line-height:1.05;margin:2px 0 16px';
    ratio.innerHTML = '<span style="font-size:clamp(32px,4.4vw,50px);color:var(--accent)">1 in 7.5</span><span style="font-size:clamp(13px,1.3vw,16px);color:var(--muted);font-weight:600;margin-left:11px">children ages 5&ndash;17 are served under IDEA, Part&nbsp;B</span>';
    const picWrap = document.createElement('div'); picWrap.className = 'chartbox';
    const pic = C.pictograph({ total: 8, a: 1, cols: 8, cell: 44, aColor: P.greenD, bColor: P.sage });
    picWrap.appendChild(pic.node);
    const cap = document.createElement('div'); cap.className = 'figure-sub'; cap.style.cssText = 'margin:10px 0 26px;max-width:62ch';
    cap.innerHTML = 'That is about 13.3% of the roughly 54.6&nbsp;million U.S. children ages 5&ndash;17, close to the <b style="color:var(--green-d)">1 shaded green</b> of every 8 shown here.';
    const sub2 = document.createElement('div'); sub2.className = 'figure-title'; sub2.style.cssText = 'margin:0 0 2px'; sub2.textContent = 'The share served dips through the teen years';
    const sub2b = document.createElement('div'); sub2b.className = 'figure-sub'; sub2b.style.cssText = 'margin:0 0 10px'; sub2b.textContent = 'Percent of U.S. children served under IDEA, Part B, by age band, 2024–25.';
    const barsWrap = document.createElement('div'); barsWrap.className = 'chartbox';
    const ch = C.barsH({
      items: ACS.byAge.map(([k, v], i) => ({ label: k, value: v, color: i === 1 ? P.greenD : P.green })),
      labelW: 120, barH: 24, gap: 14, padR: 56, xMax: 20, valueFmt: v => v.toFixed(1) + '%',
    });
    barsWrap.appendChild(ch.node);
    box.appendChild(ratio); box.appendChild(picWrap); box.appendChild(cap); box.appendChild(sub2); box.appendChild(sub2b); box.appendChild(barsWrap);
    S.onView(box, () => { pic.reveal(); ch.reveal(); });
    S.expbar && S.expbar('chart-acs', 'idea-population-context', [['Age band', 'Percent of U.S. children served under IDEA Part B (2024-25)'], ...ACS.byAge]);
  })();

  /* ---- intellectual disability vs autism (click-to-open popup) ---- */
  function openIdSubModal() {
    const start = 3; // from School Year 2000-01, when autism was first reported separately
    const labels = I.YEARS.slice(start), xs = labels.map(y => +y.slice(0, 4));
    const aut = I.DIS['Autism'].slice(start), idd = I.DIS['Intellectual disability'].slice(start);
    const last = labels.length - 1;
    const autChg = ((aut[last] || 0) - (aut[0] || 0)) * 1000, idChg = ((idd[last] || 0) - (idd[0] || 0)) * 1000;
    S.openModal(`<div class="m-kicker">Disability categories</div><h3 class="m-title">Autism and intellectual disability</h3>
      <p class="m-dek">Some of autism's rise <strong>could</strong> reflect a change in which category is recorded. As autism identification grew by about ${(autChg / 1e6).toFixed(1)} million since School Year 2000–01, the number served under intellectual disability fell by about ${I.nf(Math.abs(Math.round(idChg)))}. Part of the increase in autism as a primary identification could reflect students who, in earlier years, would have been reported under intellectual disability. This is not an exact science: shifts in identification could account for some of the growth, but not most of it.</p>
      <div class="legend" id="m-idsubLegend"></div>
      <div class="figure-sub" style="margin:6px 0 2px">Number served, by school year</div>
      <div id="m-idsub" class="chartbox"></div>
      <p class="m-src">IDEA Part B Child Count and Educational Environments Collection, School Years 2000–01 through 2024–25.</p>`);
    const host = document.getElementById('m-idsub');
    const yFmt = v => v >= 1000 ? (v / 1000).toFixed(1) + 'M' : Math.round(v) + 'k';
    const ch = C.lineChart({
      labels, xs, xTicks: [2000, 2012, 2024],
      series: [
        { values: aut, color: P.navy, width: 2.6, highlight: true, endLabel: 'Autism' },
        { values: idd, color: P.green, width: 2, endLabel: 'Intellectual disability' },
      ], yMin: 0, yMax: 1400, yTicks: 3, yFmt, height: 240, width: 430, padL: 44,
    });
    host.appendChild(ch.node); ch.reveal();
    const lg = document.getElementById('m-idsubLegend');
    if (lg) [['Autism', P.navy], ['Intellectual disability', P.green]].forEach(([t, c]) => { const k = document.createElement('span'); k.className = 'k'; const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = c; k.appendChild(sw); k.appendChild(document.createTextNode(t)); lg.appendChild(k); });
  }
  window.IDEAExtra = { openIdSubModal };
  (function () { const b = document.getElementById('idsubBtn'); if (b) b.addEventListener('click', openIdSubModal); })();
})();
