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

  /* tab switching — accessible tablist: roving tabindex + arrow/Home/End keys */
  (function () {
    const tabs = [...document.querySelectorAll('.extab')];
    function activate(tab) {
      tabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      document.querySelectorAll('.expanel').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        else return;
        e.preventDefault();
        tabs[j].click();   // selection follows focus (also runs the lazy "more" builder)
        tabs[j].focus();
      });
    });
  })();

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
      <div class="snap-compare"><div class="figure-title">Child count trend: ${r[0]} and the United States, side by side</div>
        <div class="figure-sub">Students served, ages 3&ndash;21, selected school years.</div>
        <div class="split cols2" style="margin-top:10px">
          <div><div class="figure-sub" style="margin:0 0 4px;font-weight:700;color:var(--ink)">${r[0]}</div><div id="snapTrend" class="chartbox"></div></div>
          <div><div class="figure-sub" style="margin:0 0 4px;font-weight:700;color:var(--ink)">United States</div><div id="snapTrendUS" class="chartbox"></div></div>
        </div></div>
      ${(CAT && CAT.state[r[1]]) ? `<div class="snap-compare"><div class="figure-title">${r[0]}: students served by disability category</div>
        <div class="figure-sub">All 13 primary categories, ages 3&ndash;21, School&nbsp;Year 2024&ndash;25. Tap a bar for the category profile.</div>
        <div id="snapCats" class="chartbox"></div></div>` : ''}`;
      const yrLab = ['2000\u201301', '2010\u201311', '2022\u201323', '2024\u201325'], yrXs = [2000, 2010, 2022, 2024];
      const mkTrend = (vals, color, endLab) => C.lineChart({
        labels: yrLab, xs: yrXs, xTicks: [2000, 2010, 2024],
        series: [{ values: vals, color, area: true, areaOpacity: .12, highlight: true, endLabel: endLab }],
        yMin: 0, yMax: Math.max(...vals) * 1.15, yTicks: 3, yFmt: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v),
        height: 250, width: 360, padL: 48,
      });
      const sVals = [r[2], r[3], r[4], r[5]];
      const st = mkTrend(sVals, P.greenD, I.nf(r[5])); $('#snapTrend').appendChild(st.node); st.reveal();
      const usVals = [I.ALL[3], I.ALL[6], I.ALL[18], I.ALL[20]].map(v => v * 1000);   // national totals, same years
      const us = mkTrend(usVals, P.navy, (usVals[3] / 1e6).toFixed(1) + 'M'); $('#snapTrendUS').appendChild(us.node); us.reveal();
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
    let sortK = 5, sortDir = -1, filter = '', focusK = null;
    const exv = (r, f) => EX[r[1]] && EX[r[1]][f] != null ? EX[r[1]][f] : null;
    const cell = (r, k) => k === 'name' ? r[0] : k === 'g' ? (r[5] - r[2]) / r[2] * 100
      : k === 'grad' ? exv(r, 'gradPct') : k === 'drop' ? exv(r, 'dropPct') : r[k];
    const dash = '<span style="color:var(--faint)">&ndash;</span>';
    const STR = new Set(['name', 'g', 'grad', 'drop']);
    function build() {
      const thead = tbl.querySelector('thead'), tb = tbl.querySelector('tbody');
      thead.innerHTML = '<tr>' + cols.map(c => {
        const on = c.k === sortK, sortAttr = on ? ` aria-sort="${sortDir < 0 ? 'descending' : 'ascending'}"` : '';
        return `<th data-k="${c.k}" tabindex="0" aria-label="${c.t}, activate to sort"${sortAttr}>${c.t}${on ? '<span class="ar" aria-hidden="true">' + (sortDir < 0 ? '\u2193' : '\u2191') + '</span>' : ''}</th>`;
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
      thead.querySelectorAll('th').forEach(th => {
        const doSort = () => {
          const raw = th.dataset.k, k = STR.has(raw) ? raw : +raw;
          if (sortK === k) sortDir *= -1; else { sortK = k; sortDir = (k === 'name') ? 1 : -1; }
          focusK = th.dataset.k; build();                       // keep keyboard focus on the column after re-render
        };
        th.addEventListener('click', doSort);
        th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); } });
      });
      if (focusK != null) { const el = thead.querySelector(`th[data-k="${focusK}"]`); if (el) el.focus(); focusK = null; }
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
        if (sa != null) bits.push(`<b>${I.nf(sa)}</b> school-age`);
        const ex = LEAEXIT[normN(nces)];                        // per-district exiting (2023-24)
        if (ex && ex[2] >= 20) {
          if (ex[0] != null) bits.push(`<b>${Math.round(ex[0])}%</b> grad`);
          if (ex[1] != null) bits.push(`<b>${Math.round(ex[1])}%</b> dropout`);
        }
        const meta = `<span class="lea-nces">NCES&nbsp;${nces}</span>${bits.length ? ' &middot; ' + bits.join(' &middot; ') : ''}`;
        return `<div class="lea-row">
          <div class="lea-id"><span class="nm">${nm}</span><span class="lea-meta">${meta}</span></div>
          <div class="v">${I.nf(tot)}<small>served</small></div></div>`;
      });
      if (otherN > 0 && other > 0) rows.push(`<div class="lea-row is-other">
          <div class="lea-id"><span class="nm">All other districts</span><span class="lea-meta">${I.nf(otherN)} additional districts and programs</span></div>
          <div class="v">${I.nf(other)}<small>served</small></div></div>`);
      const SN = window.IDEAStory || {};
      lout.innerHTML = summary + `<div class="lea-list">${rows.join('')}</div>` + (SN.suppNoteHTML ? SN.suppNoteHTML('childcount') + SN.suppNoteHTML('exiting') : '');
    }
    lsel.addEventListener('change', renderLea); renderLea();
  }

  /* ---- Other Section 618 collections (exiting / discipline / personnel) ----
     Surfaced directly in the page flow (no longer behind a tab); built on load. */
  (function () {
    if (!$('#moreExit') && !$('#morePersonnel')) return;
    let built = false;
    function buildMore() {
      if (built) return; built = true;
      const S = window.IDEAStory || {};
      const popup = html => S.openModal && S.openModal(html);

      // A. Graduation with a regular diploma, by disability (Exiting, 2023-24)
      const exBox = $('#moreExit');
      if (exBox && X.EXIT_DIS) {
        const items = X.EXIT_DIS.slice().sort((a, b) => b[1] - a[1]).map(([d, g]) => ({
          label: d, value: g, color: P.green,
        }));
        const ch = C.barsH({ items, labelW: 232, barH: 17, gap: 9, padR: 54, xMax: 100, valueFmt: v => v.toFixed(1) + '%',
          onClick: it => { const r = X.EXIT_DIS.find(x => x[0] === it.label) || [it.label, it.value, null];
            popup(`<div class="m-kicker">Exiting · by disability</div><h3 class="m-title">${it.label}</h3>
              <div class="m-grid"><div><span class="mv">${(+r[1]).toFixed(1)}%</span><span class="ml">graduated with a regular diploma</span></div>
              ${r[2] != null ? `<div><span class="mv">${(+r[2]).toFixed(1)}%</span><span class="ml">dropped out</span></div>` : ''}</div>
              <p class="m-src">U.S. Department of Education, IDEA Part B Exiting Collection, School Year 2023–24 (students ages 14–21 who exited school).</p>`); } });
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
          label: o.label, value: o.value, highlight: o.label === 'Emotional disturbance' || o.label === 'Autism',
          color: o.label === 'Emotional disturbance' ? P.navy : (o.label === 'Autism' ? P.accent : P.green),
        }));
        const ch = C.barsH({ items, labelW: 232, barH: 17, gap: 9, padR: 60, xMax: 120, valueFmt: v => v.toFixed(0),
          onClick: it => popup(`<div class="m-kicker">Discipline · by disability</div><h3 class="m-title">${it.label}</h3>
            <div class="m-grid"><div><span class="mv">${it.value}</span><span class="ml">disciplinary removals per 100 students served</span></div></div>
            <p class="m-src">U.S. Department of Education, IDEA Part B Discipline Collection and Child Count, School Year 2023–24. Each removal is counted separately, so a student may be counted more than once.</p>`) });
        ddBox.appendChild(ch.node); ch.reveal();
        window.IDEAStory && window.IDEAStory.expbar('moreDiscDis', 'idea-discipline-per-100-2023-24', [['Disability category', 'Removals per 100 served'], ...items.map(d => [d.label, d.value])]);
      }

      // C. Disproportionality index: removal share ÷ enrollment share, by race (1.0 = proportional)
      const drBox = $('#moreDiscRace'), discTot = X.DISC_NAT && X.DISC_NAT.rem;
      if (drBox && X.DISC_RACE && discTot) {
        const race = I.DEMO['All Disabilities'].race, totServed = I.DEMO['All Disabilities'].total;
        const map = { 'White': 'White', 'Hispanic/Latino': 'Hispanic', 'Black or African American': 'Black',
          'Asian': 'Asian', 'American Indian or Alaska Native': 'AIAN', 'Native Hawaiian or Other Pacific Islander': 'NHPI' };
        const items = X.DISC_RACE.map(([rk, rem]) => {
          const dk = map[rk]; if (!dk || race[dk] == null) return null;
          const a = +(race[dk] / totServed * 100).toFixed(1), b = +(rem / discTot * 100).toFixed(1);
          return { label: I.RACE_LBL[dk] || rk, a, b, ratio: +(b / a).toFixed(2) };
        }).filter(Boolean).sort((x, y) => y.ratio - x.ratio);
        const ch = C.barsH({
          items: items.map(d => ({ label: d.label, value: d.ratio,
            color: d.ratio >= 1.06 ? P.accent : (d.ratio <= 0.94 ? P.green : P.sage) })),
          labelW: 196, barH: 22, gap: 13, padR: 66, xMax: Math.max(1.8, Math.max(...items.map(d => d.ratio)) * 1.08),
          valueFmt: v => v.toFixed(2) + '×',
          onClick: it => { const d = items.find(x => x.label === it.label);
            popup(`<div class="m-kicker">Discipline · disproportionality</div><h3 class="m-title">${d.label}</h3>
              <div class="m-grid"><div><span class="mv">${d.a}%</span><span class="ml">of all students served</span></div>
              <div><span class="mv">${d.b}%</span><span class="ml">of all disciplinary removals</span></div>
              <div><span class="mv"${d.ratio >= 1.06 ? ' style="color:var(--accent)"' : ''}>${d.ratio.toFixed(2)}×</span><span class="ml">removals relative to enrollment share (1.0 = proportional)</span></div></div>
              <p class="m-src">U.S. Department of Education, IDEA Part B Discipline Collection (removals, 2023–24) and Child Count (students served, 2024–25).</p>`); } });
        drBox.appendChild(ch.node); ch.reveal();
        window.IDEAStory && window.IDEAStory.expbar('moreDiscRace', 'idea-discipline-disproportionality-2023-24', [['Race/ethnicity', 'Share of students served %', 'Share of removals %', 'Removals ÷ enrollment share'], ...items.map(d => [d.label, d.a, d.b, d.ratio])]);
        const lg = $('#moreRaceLegend');
        if (lg) lg.innerHTML = `<span class="k"><span class="sw" style="background:${P.accent}"></span>Over-represented (above 1.0×)</span><span class="k"><span class="sw" style="background:${P.green}"></span>Under-represented (below 1.0×)</span>`;
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
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', buildMore);
    else buildMore();
  })();
})();
