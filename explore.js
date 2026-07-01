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

  /* promo button: jump to the State snapshot tab and focus its picker */
  (function () {
    const b = document.getElementById('statePromoBtn'); if (!b) return;
    b.addEventListener('click', () => {
      const tab = document.getElementById('extab-state'); if (tab) tab.click();
      const panel = document.getElementById('expanel-state') || document.querySelector('.explore');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { const s = document.getElementById('exStateSel'); if (s) s.focus(); }, 400);
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
    // clean typographic stats (no boxes): value over a plain label
    const stat = (v, k, cls) => `<div class="stat"><div class="stat-v${cls ? ' ' + cls : ''}">${v}</div><div class="stat-k">${k}</div></div>`;
    const detShort = s => !s ? '' : /^Meets/.test(s) ? 'Meets requirements' : /intervention/i.test(s) ? 'Needs intervention'
      : /two or more/i.test(s) ? 'Needs assistance (2+ yrs)' : 'Needs assistance (1 yr)';
    const chev = '<svg class="chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    const DMS = window.DMS || {};
    const PERS = (DMS.personnel && DMS.personnel.byState) || {};
    const detWord = (part, lvl) => lvl ? `<span class="det-word ${detCls(lvl)}">Part&nbsp;${part}: ${detShort(lvl)}</span>` : '';
    function render() {
      if (sel.value === '') { out.innerHTML = '<div class="focus-empty">Choose a state above to see its snapshot.</div>'; return; }
      const r = I.STATES[+sel.value], ab = r[1];
      const d25 = window.DET2025 ? { b: window.DET2025.partB[r[0]], c: window.DET2025.partC[r[0]] } : {};
      const d26 = window.DET2026 ? { b: window.DET2026.partB[r[0]], c: window.DET2026.partC[r[0]] } : {};
      const served = r[5], pe = r[6], growth = (r[5] - r[2]) / r[2] * 100;
      const rank = ranked.findIndex(x => x[1] === r[1]) + 1;
      const ex = (X.EXIT_STATE || {})[r[1]], dc = (X.DISC_STATE || {})[r[1]];

      // key SPP/APR-related figures for this state
      const stats = [
        stat(I.nf(served), 'Students served, ages 3&ndash;21 &middot; SY&nbsp;2024&ndash;25'),
        stat('#' + rank + ' of 51', 'Rank by students served'),
        stat(pe.toFixed(1) + '%', 'Percent of public-school enrollment &middot; 2022&ndash;23'),
        stat((growth >= 0 ? '+' : '') + growth.toFixed(0) + '%', 'Change since 2000&ndash;01', 'accent'),
      ];
      if (ex && ex.gradPct != null) stats.push(stat(ex.gradPct.toFixed(1) + '%', 'Graduated with a regular diploma, of those who exited &middot; 2023&ndash;24 (Indicator&nbsp;1)'));
      if (ex && ex.dropPct != null) stats.push(stat(ex.dropPct.toFixed(1) + '%', 'Dropped out, of those who exited &middot; 2023&ndash;24 (Indicator&nbsp;2)', 'accent'));
      if (dc && dc.g10 != null) stats.push(stat(I.nf(dc.g10), 'Removed more than 10 days &middot; 2023&ndash;24 (discipline)'));
      if (PERS[ab] != null) stats.push(stat(PERS[ab].toFixed(1) + '%', 'Special education teachers fully certified &middot; 2022&ndash;23'));

      // general supervision: BOTH the 2025 and 2026 determinations, the enforcement
      // consequence, key OSEP monitoring (DMS) findings, and source links
      let gsBlock = '';
      if (d25.b || d25.c || d26.b || d26.c) {
        const yrLine = (yr, dd) => (dd.b || dd.c) ? `<p class="snap-det"><b class="snap-detyr">${yr}</b> ${detWord('B', dd.b)}${dd.b && dd.c ? '<span class="snap-dot">&middot;</span>' : ''}${detWord('C', dd.c)}</p>` : '';
        const dlines = yrLine('2026', d26) + yrLine('2025', d25);
        const latestB = d26.b || d25.b;
        let note = '';
        if (latestB && /two or more/i.test(latestB)) note = `<p class="snap-note">${r[0]} has needed assistance under Part&nbsp;B for two or more consecutive years, so the Department must take enforcement action, for example requiring technical assistance, designating the state a high-risk grantee, or directing state set-aside funds to the areas needing assistance.</p>`;
        else if (latestB && /intervention/i.test(latestB)) note = `<p class="snap-note">${r[0]} needs intervention under Part&nbsp;B, the most serious determination short of substantial intervention.</p>`;
        const reps = (DMS.reports || {})[ab];
        let dmsBlock = '';
        if (reps && reps.length) {
          const findings = reps.flatMap(rep => (rep.insights || []).slice(0, 2)).map(t => `<li>${t}</li>`).join('');
          if (findings) dmsBlock = `<div class="snap-sub2">What OSEP monitoring found &middot; DMS, ${reps[0].date}</div><ul class="snap-findings">${findings}</ul>`;
        }
        const links = [`<a href="${DMS.sppLetter ? DMS.sppLetter(ab, 'B') : '#'}" target="_blank" rel="noopener noreferrer">${r[0]}&rsquo;s SPP/APR (FFY&nbsp;2023) &rarr;</a>`];
        if (reps && reps.length) reps.forEach(rep => links.push(`<a href="${rep.url}" target="_blank" rel="noopener noreferrer">OSEP DMS report &middot; Part&nbsp;${rep.part} &middot; ${rep.date} &rarr;</a>`));
        else if (DMS.db) links.push(`<a href="${DMS.db}" target="_blank" rel="noopener noreferrer">OSEP monitoring (DMS) &rarr;</a>`);
        gsBlock = `<div class="snap-block"><div class="figure-title">General supervision</div>
          <div class="figure-sub" style="margin:0 0 8px">IDEA determinations are OSEP&rsquo;s yearly judgment, made from each state&rsquo;s SPP/APR; monitoring (DMS) is its on-site review.</div>
          ${dlines}${note}${dmsBlock}<div class="snap-links">${links.join('')}</div>
          <div class="source"><span class="src-k">Source</span> 2025 and 2026 Determination Letters on State Implementation of IDEA; FFY&nbsp;2023 SPP/APR; OSEP Differentiated Monitoring and Support (DMS) reports.</div></div>`;
      }

      out.innerHTML = `<div class="snap-head">
          <div class="snap-eyebrow">State snapshot &middot; IDEA Part&nbsp;B</div>
          <div class="snap-name">${r[0]}</div>
        </div>
        <div class="snap-stats">${stats.join('')}</div>
        ${gsBlock}
        <div class="snap-block">
          <div class="figure-title">Students served over time</div>
          <div class="figure-sub">Children and students ages 3&ndash;21, selected school years, with ${r[0]} beside the national total.</div>
          <div class="split cols2" style="margin-top:12px">
            <div><div class="snap-sublab">${r[0]}</div><div id="snapTrend" class="chartbox"></div></div>
            <div><div class="snap-sublab">United States</div><div id="snapTrendUS" class="chartbox"></div></div>
          </div>
        </div>
        ${(CAT && CAT.state[r[1]]) ? `<details class="snap-cats"><summary>Students served by disability category${chev}</summary>
          <div class="figure-sub" style="margin:0 0 10px">All 13 primary categories, ages 3&ndash;21, School&nbsp;Year 2024&ndash;25. Tap a bar for the category profile.</div>
          <div id="snapCats" class="chartbox"></div>
          ${(window.IDEAStory && window.IDEAStory.suppNoteHTML) ? window.IDEAStory.suppNoteHTML('childcount') : ''}</details>` : ''}`;

      const yrLab = ['2000\u201301', '2010\u201311', '2022\u201323', '2024\u201325'], yrXs = [2000, 2010, 2022, 2024];
      const mkTrend = (vals, color, endLab) => C.lineChart({
        labels: yrLab, xs: yrXs, xTicks: [2000, 2010, 2024],
        series: [{ values: vals, color, area: true, areaOpacity: .16, highlight: true, endDotR: 6, endLabel: endLab }],
        yMin: 0, yMax: Math.max(...vals) * 1.15, yTicks: 3, yFmt: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v),
        height: 250, width: 360, padL: 48,
      });
      const sVals = [r[2], r[3], r[4], r[5]];
      const st = mkTrend(sVals, P.greenD, I.nf(r[5])); $('#snapTrend').appendChild(st.node); st.reveal();
      const usVals = [I.ALL[3], I.ALL[6], I.ALL[18], I.ALL[20]].map(v => v * 1000);   // national totals, same years
      const us = mkTrend(usVals, P.navy, (usVals[3] / 1e6).toFixed(1) + 'M'); $('#snapTrendUS').appendChild(us.node); us.reveal();

      // category breakdown is collapsed by default; build it (with its bar animation) on first open
      const details = out.querySelector('.snap-cats');
      if (details && CAT && CAT.state[r[1]]) {
        let built = false;
        details.addEventListener('toggle', () => {
          if (!details.open || built) return; built = true;
          const vec = CAT.state[r[1]]; catBars($('#snapCats'), vec, vec.reduce((a, b) => a + b, 0), true);
        });
      }
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

      // A. Graduation + dropout by disability, as a stacked bar (Exiting, 2023-24)
      const exBox = $('#moreExit');
      if (exBox && X.EXIT_DIS) {
        const items = X.EXIT_DIS.slice().sort((a, b) => b[1] - a[1]).map(r => ({
          label: r[0], grad: +r[1], drop: r[2] != null ? +r[2] : null,
          parts: [{ value: +r[1], color: P.green, name: 'Graduated' }].concat(r[2] != null ? [{ value: +r[2], color: P.accent, name: 'Dropped out' }] : []),
        }));
        const ch = C.stackedBarsH({
          items, labelW: 232, barH: 20, gap: 11, padR: 150, xMax: 100,
          valueFmt: v => v.toFixed(0) + '%',
          endLabel: d => d.grad.toFixed(0) + '% grad' + (d.drop != null ? '  ·  ' + d.drop.toFixed(0) + '% drop' : ''),
          onClick: d => popup(`<div class="m-kicker">Exiting · by disability</div><h3 class="m-title">${d.label}</h3>
              <div class="m-grid"><div><span class="mv">${d.grad.toFixed(1)}%</span><span class="ml">graduated with a regular diploma</span></div>
              ${d.drop != null ? `<div><span class="mv">${d.drop.toFixed(1)}%</span><span class="ml">dropped out</span></div>` : ''}</div>
              <p class="m-dek" style="margin-top:12px;font-size:13px">The remaining students exited for other reasons (for example, reaching the maximum age, moving, or receiving a certificate).</p>
              <p class="m-src">U.S. Department of Education, IDEA Part B Exiting Collection, School Year 2023&ndash;24 (students ages 14&ndash;21 who exited school).</p>`),
        });
        exBox.appendChild(ch.node); ch.reveal();
        S.legend && S.legend('moreExitLegend', [['Graduated, regular diploma', P.green], ['Dropped out', P.accent]]);
        S.expbar && S.expbar('moreExit', 'idea-exiting-by-disability-2023-24', [['Disability category', 'Graduated regular diploma %', 'Dropped out %'], ...X.EXIT_DIS.map(r => [r[0], r[1], r[2]])]);
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
          color: o.label === 'Emotional disturbance' ? P.navy : P.green,
        }));
        const ch = C.barsH({ items, labelW: 232, barH: 17, gap: 9, padR: 60, xMax: 120, valueFmt: v => v.toFixed(0),
          onClick: it => popup(`<div class="m-kicker">Discipline · by disability</div><h3 class="m-title">${it.label}</h3>
            <div class="m-grid"><div><span class="mv">${it.value}</span><span class="ml">disciplinary removals per 100 students served</span></div></div>
            <p class="m-src">U.S. Department of Education, IDEA Part B Discipline Collection and Child Count, School Year 2023–24. Each removal is counted separately, so a student may be counted more than once.</p>`) });
        ddBox.appendChild(ch.node); ch.reveal();
        window.IDEAStory && window.IDEAStory.expbar('moreDiscDis', 'idea-discipline-per-100-2023-24', [['Disability category', 'Removals per 100 served'], ...items.map(d => [d.label, d.value])]);
        S.suppNoteTextTo && S.suppNoteTextTo(ddBox.closest('.figure'), 'OSEP suppresses small cells in the IDEA Discipline collection to protect student privacy, so removals for small categories may be omitted. Removals are counted as events, not students, so a student removed more than once is counted each time.');
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
          labelW: 300, barH: 22, gap: 13, padR: 60, xMax: Math.max(1.8, Math.max(...items.map(d => d.ratio)) * 1.08),
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
        S.suppNoteTextTo && S.suppNoteTextTo(drBox.closest('.figure'), 'Students of two or more races and students whose race was not reported are not shown. OSEP suppresses small cells in the Discipline collection, so counts for small groups may be omitted.');
      }

      // D. Personnel certification (2023-24), clickable for the fuller staff picture
      const pBox = $('#morePersonnel'), pers = X.PERSONNEL || {};
      if (pBox) {
        const cells = [];
        if (pers.teachers) cells.push(`<div class="snap-cell"><div class="k">Special education teachers</div><div class="v">${pers.teachers.pct.toFixed(1)}%</div><div class="sub">fully certified &middot; ${I.nf(Math.round(pers.teachers.total))} FTE</div></div>`);
        if (pers.paras) cells.push(`<div class="snap-cell"><div class="k">Paraprofessionals</div><div class="v">${pers.paras.pct.toFixed(1)}%</div><div class="sub">qualified &middot; ${I.nf(Math.round(pers.paras.total))} FTE</div></div>`);
        pBox.innerHTML = `<div class="snap-grid">${cells.join('')}</div>`;
        const nat = (window.DMS && window.DMS.personnel && window.DMS.personnel.national) || {};
        function openPersonnelModal() {
          S.openModal && S.openModal(`<div class="m-kicker">Personnel &middot; IDEA Part&nbsp;B</div><h3 class="m-title">The staff who serve students with disabilities</h3>
            <p class="m-dek">Under IDEA, states report the qualifications of everyone who provides special education and related services. Most are fully certified or qualified for their role.</p>
            <div class="m-grid">
              ${pers.teachers ? `<div><span class="mv">${pers.teachers.pct.toFixed(1)}%</span><span class="ml">of special education teachers fully certified (${I.nf(Math.round(pers.teachers.total))} FTE)</span></div>` : ''}
              ${pers.paras ? `<div><span class="mv">${pers.paras.pct.toFixed(1)}%</span><span class="ml">of paraprofessionals qualified (${I.nf(Math.round(pers.paras.total))} FTE)</span></div>` : ''}
              ${nat.relatedPct != null ? `<div><span class="mv">${nat.relatedPct}%</span><span class="ml">of related-services staff fully certified (${I.nf(nat.relatedFTE)} FTE), fall 2022</span></div>` : ''}
            </div>
            <p class="m-dek" style="margin-top:14px;font-size:13px">Related-services staff include speech-language pathologists, school psychologists, occupational and physical therapists, counselors, audiologists, and interpreters. "Fully certified" follows 34&nbsp;CFR&nbsp;300.156: full state certification (including approved alternate routes), no emergency or temporary waiver.</p>
            <p class="m-src">U.S. Department of Education, IDEA Part&nbsp;B Personnel Collection, School Year 2023&ndash;24; related-services figure from the 47th Annual Report to Congress on the Implementation of IDEA (Exhibit 45, fall 2022).</p>`);
        }
        pBox.style.cursor = 'pointer'; pBox.tabIndex = 0; pBox.setAttribute('role', 'button');
        pBox.addEventListener('click', openPersonnelModal);
        pBox.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPersonnelModal(); } });
        S.hint && S.hint('morePersonnel', 'Tap for related-services staff and what “fully certified” means');
      }
    }
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', buildMore);
    else buildMore();
  })();
})();
