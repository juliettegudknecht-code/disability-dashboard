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

  // 2026 IDEA determinations (FFY 2024 submissions), counts of states + entities.
  const DET = {
    totalB: 64, totalC: 59,
    levels: [
      { key: 'meets', label: 'Meets requirements', color: '#2f8f57', partB: 22, partC: 22 },
      { key: 'na1', label: 'Needs assistance, one year', color: '#c9a23a', partB: 3, partC: 14 },
      { key: 'na2', label: 'Needs assistance, two or more years', color: '#cf6b35', partB: 33, partC: 22 },
      { key: 'int', label: 'Needs intervention', color: '#8f2d2d', partB: 6, partC: 1 },
    ],
    blurb: {
      'Meets requirements': 'The state meets the requirements and purposes of IDEA. This is the strongest of the four determination levels.',
      'Needs assistance, one year': 'The state needs assistance in implementing IDEA for the first year. The Department offers technical assistance.',
      'Needs assistance, two or more years': 'The state has needed assistance for two or more consecutive years, which carries additional required actions.',
      'Needs intervention': 'The state needs intervention in implementing IDEA. This is the most serious determination short of substantial intervention.',
    },
  };

  // U.S. population context, Census ACS 2024 vs IDEA SY 2024-25.
  const ACS = {
    byAge: [['Ages 5–9', 13.7], ['Ages 10–14', 13.9], ['Ages 15–17', 11.6]],
    served_5_17: 7234809, pop_5_17: 54564265, oneIn: 7.5, pct: 13.3, ideaMale: 64.7, usMale: 49.5,
  };

  window.IDEA2 = { GPRA, DET, ACS };

  /* (Federal performance targets / GPRA exhibit removed by request.) */

  /* ---- exhibit B · 2026 determinations ---------------------- */
  (function () {
    const box = document.getElementById('chart-det'); if (!box) return;
    const make = (part, total) => {
      const wrap = document.createElement('div'); wrap.className = 'det-donut';
      const cap = document.createElement('div'); cap.className = 'det-cap';
      cap.innerHTML = `<b>${part === 'partB' ? 'Part B' : 'Part C'}</b><span>${part === 'partB' ? 'ages 3–21' : 'birth–age 2'} · ${total} entities</span>`;
      const cb = document.createElement('div'); cb.className = 'chartbox'; cb.style.maxWidth = '176px';
      const d = C.donut({
        size: 172, stroke: 30,
        segments: DET.levels.map(l => ({ name: l.label, value: l[part], color: l.color })),
        onClick: seg => openDetModal(seg.name),
        centerValue: (total - DET.levels[0][part]) / total * 100, centerFmt: v => Math.round(v) + '%', centerSub: 'do not meet',
      });
      cb.appendChild(d.node); wrap.appendChild(cap); wrap.appendChild(cb);
      return { wrap, reveal: d.reveal };
    };
    const a = make('partB', DET.totalB), b = make('partC', DET.totalC);
    const row = document.createElement('div'); row.className = 'det-row';
    row.appendChild(a.wrap); row.appendChild(b.wrap); box.appendChild(row);
    S.onView(box, () => { a.reveal(); b.reveal(); });
    // scorecard: each level with a colored check (meets) or alert (does not meet) + counts
    const CHECK = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    const ALERT = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
    const sc = document.createElement('div'); sc.className = 'det-score';
    sc.innerHTML = `<div class="det-score-head"><span></span><span>Part&nbsp;B</span><span>Part&nbsp;C</span></div>` + DET.levels.map(l => `<button class="det-score-row" data-level="${l.label}" style="--c:${l.color}">
        <span class="det-score-lab"><span class="det-ic">${l.key === 'meets' ? CHECK : ALERT}</span>${l.label}</span>
        <span class="det-score-n">${l.partB}</span>
        <span class="det-score-n">${l.partC}</span>
      </button>`).join('');
    box.appendChild(sc);
    sc.querySelectorAll('.det-score-row').forEach(b2 => b2.addEventListener('click', () => openDetModal(b2.dataset.level)));
    S.legend('detLegend', DET.levels.map(l => [l.label, l.color]), name => openDetModal(name));
    S.hint('chart-det', 'Tap a slice, a key, or a row for what each level means');
    S.expbar && S.expbar('chart-det', 'idea-determinations-2026', [['Determination level', 'Part B (n=64)', 'Part C (n=59)'], ...DET.levels.map(l => [l.label, l.partB, l.partC])]);
  })();

  function openDetModal(name) {
    const l = DET.levels.find(x => x.label === name); if (!l) return;
    const D = window.DET2026 || { partB: {}, partC: {} };
    const re = l.key === 'meets' ? /^Meets/ : l.key === 'na1' ? /one year/ : l.key === 'na2' ? /two or more/ : /intervention/;
    const listFor = part => Object.keys(D[part]).filter(s => re.test(D[part][s])).sort();
    const chips = arr => arr.length ? `<div class="det-statelist">${arr.map(s => `<span>${s}</span>`).join('')}</div>` : '<p class="m-dek" style="font-size:13px;margin:0">None.</p>';
    S.openModal(`<div class="m-kicker">2026 IDEA determination</div><h3 class="m-title">${l.label}</h3>
      <p class="m-dek">${DET.blurb[l.label] || ''}</p>
      <div class="m-grid">
        <div><span class="mv">${l.partB}</span><span class="ml">Part B states and entities (of ${DET.totalB})</span></div>
        <div><span class="mv">${l.partC}</span><span class="ml">Part C states and entities (of ${DET.totalC})</span></div>
      </div>
      <div class="figure-sub" style="margin:18px 0 7px">Part&nbsp;B: states and entities at this level</div>${chips(listFor('partB'))}
      <div class="figure-sub" style="margin:16px 0 7px">Part&nbsp;C: states and entities at this level</div>${chips(listFor('partC'))}
      <p class="m-src">U.S. Department of Education, Office of Special Education Programs, 2026 Determination Letters on State Implementation of IDEA.</p>`);
  }

  /* ---- exhibit C · population context (ACS) ----------------- */
  (function () {
    const box = document.getElementById('chart-acs'); if (!box) return;
    // creative: a 1-in-7.5 pictograph of all children, then the age-band dip beneath
    const picWrap = document.createElement('div'); picWrap.className = 'chartbox';
    const pic = C.pictograph({ total: 30, a: 4, cols: 10, cell: 27, aColor: P.greenD, bColor: P.sage });
    picWrap.appendChild(pic.node);
    const cap = document.createElement('div'); cap.className = 'figure-sub'; cap.style.cssText = 'margin:12px 0 26px;max-width:60ch';
    cap.innerHTML = 'Each figure stands for about 1 in 30 of the roughly 54.6&nbsp;million U.S. children ages 5&ndash;17. The <b style="color:var(--green-d)">4 shaded green</b> represent the about <b style="color:var(--green-d)">1 in 7.5</b> (13.3%) served under IDEA, Part&nbsp;B.';
    const sub2 = document.createElement('div'); sub2.className = 'figure-title'; sub2.style.cssText = 'margin:0 0 2px'; sub2.textContent = 'The share served dips through the teen years';
    const sub2b = document.createElement('div'); sub2b.className = 'figure-sub'; sub2b.style.cssText = 'margin:0 0 10px'; sub2b.textContent = 'Percent of U.S. children served under IDEA, Part B, by age band, 2024–25.';
    const barsWrap = document.createElement('div'); barsWrap.className = 'chartbox';
    const ch = C.barsH({
      items: ACS.byAge.map(([k, v], i) => ({ label: k, value: v, color: i === 1 ? P.greenD : P.green })),
      labelW: 120, barH: 24, gap: 14, padR: 56, xMax: 20, valueFmt: v => v.toFixed(1) + '%',
    });
    barsWrap.appendChild(ch.node);
    box.appendChild(picWrap); box.appendChild(cap); box.appendChild(sub2); box.appendChild(sub2b); box.appendChild(barsWrap);
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
