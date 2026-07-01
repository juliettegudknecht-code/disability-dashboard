/* ============================================================
   interactive.js — Focus Mode popup, the MOE/CEIS money flow,
   and the top search. The single state map lives in story.js
   (Exhibit 7, choropleth + dropdown).
   ============================================================ */
(function () {
  const I = window.IDEA, C = window.Charts, P = I.PAL, S = window.IDEAStory, MOE = window.MOE;
  if (!I || !C || !S) return;
  const cats = Object.keys(I.DIS);
  const CAT = window.CATDATA || null;   // per-state & per-district counts by disability category (SY 2024-25)
  const detOf = name => { const D = window.DET2026; return D ? { b: D.partB[name], c: D.partC[name] } : {}; };
  const detClass = s => !s ? '' : /^Meets/.test(s) ? 'det-meets' : /intervention/i.test(s) ? 'det-int' : /two or more/i.test(s) ? 'det-na2' : 'det-na1';

  /* ===== FOCUS MODE (popup launched by the topbar button) ==== */
  (function () {
    const btn = document.getElementById('focusBtn'); if (!btn) return;
    let pop = null, catSel, stSel, out;
    function build() {
      pop = document.createElement('div'); pop.className = 'focuspop';
      pop.innerHTML = `<div class="focuspop-card" role="dialog" aria-modal="true" aria-label="Focus mode">
        <button class="focuspop-x" aria-label="Close">×</button>
        <div class="focuspop-head">
          <h3 class="m-title" style="margin-bottom:6px">Focus on a category, a state, or both</h3>
          <p class="m-dek">Pick any primary disability category and any state. Leave one blank to focus on just the other; choose both to see how many students that state serves under that category.</p>
        </div>
        <div class="focus-controls">
          <label><span class="src-k">Disability category</span>
            <select id="focusCat" class="ex-select"><option value="">Choose a disability category</option></select></label>
          <label><span class="src-k">State</span>
            <select id="focusState" class="ex-select"><option value="">Choose a state</option></select></label>
        </div>
        <div id="focusOut" class="focus-out"></div>
        <div class="source"><span class="src-k">Source</span> U.S. Department of Education, OSEP, IDEA Part&nbsp;B Child Count and Educational Environments Collection, School Years 2000&ndash;01 through 2024&ndash;25; NCES public-school enrollment (2022&ndash;23); 2026 Determination Letters on State Implementation of IDEA.</div>
      </div>`;
      document.body.appendChild(pop);
      catSel = pop.querySelector('#focusCat'); stSel = pop.querySelector('#focusState'); out = pop.querySelector('#focusOut');
      cats.forEach(c => catSel.add(new Option(c, c)));
      I.STATES.slice().sort((a, b) => a[0].localeCompare(b[0])).forEach(r => stSel.add(new Option(r[0], r[1])));
      catSel.value = '';   // open empty: "Choose a disability category or a state above to begin."
      stSel.value = '';
      catSel.addEventListener('change', render); stSel.addEventListener('change', render);
      pop.querySelector('.focuspop-x').addEventListener('click', close);
      pop.addEventListener('click', e => { if (e.target === pop) close(); });
      render();
    }
    function catCol(cat) {
      const last = I.YEARS.length - 1, ser = I.DIS[cat];
      const cnt = (CAT && CAT.nat && CAT.nat[cat] != null) ? CAT.nat[cat] : (ser[last] || 0) * 1000;
      const totalLast = cats.reduce((s, k) => s + (I.DIS[k][last] || 0), 0);
      const share = ser[last] / totalLast * 100;
      const inclRow = I.ARC.inclByCat.find(x => x[0] === cat), incl = inclRow ? inclRow[1] : null;
      const v2000 = ser[3], chg = v2000 ? (ser[last] - v2000) / v2000 * 100 : null;
      return `<div class="focus-col">
        <div class="focus-h">Disability category</div><div class="focus-name">${cat}</div>
        <div class="snap-grid">
          <div class="snap-cell"><div class="k">Served, ages 3–21</div><div class="v">${I.nf(Math.round(cnt))}</div><div class="sub">School Year 2024–25</div></div>
          <div class="snap-cell"><div class="k">Share of all served</div><div class="v">${share.toFixed(1)}%</div><div class="sub">School Year 2024–25</div></div>
          ${incl != null ? `<div class="snap-cell"><div class="k">In regular class 80%+</div><div class="v">${incl.toFixed(0)}%</div><div class="sub">School Year 2023–24</div></div>` : ''}
          ${chg != null ? `<div class="snap-cell"><div class="k">Change since 2000–01</div><div class="v accent">${chg >= 0 ? '+' : ''}${chg.toFixed(0)}%</div><div class="sub">2000–01 to 2024–25</div></div>` : ''}
        </div>
        <div class="figure-sub" style="margin:15px 0 2px">Number served over time</div>
        <div id="focusCatTrend" class="chartbox"></div>
        <button class="focus-more" data-kind="cat">Open the full ${cat} profile</button>
      </div>`;
    }
    function stateCol(r) {
      const served = r[5], pe = r[6], growth = (r[5] - r[2]) / r[2] * 100;
      const rank = I.STATES.slice().sort((a, b) => b[5] - a[5]).findIndex(x => x[1] === r[1]) + 1;
      const dt = detOf(r[0]);
      return `<div class="focus-col">
        <div class="focus-h">State</div><div class="focus-name">${r[0]}</div>
        <div class="snap-grid">
          <div class="snap-cell"><div class="k">Served, ages 3–21</div><div class="v">${I.nf(served)}</div><div class="sub">School Year 2024–25</div></div>
          <div class="snap-cell"><div class="k">Percent of enrollment</div><div class="v">${pe.toFixed(1)}%</div><div class="sub">School Year 2022–23</div></div>
          <div class="snap-cell"><div class="k">National rank</div><div class="v">#${rank}</div><div class="sub">of 51 by number served</div></div>
          <div class="snap-cell"><div class="k">Change since 2000–01</div><div class="v accent">${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%</div><div class="sub">2000–01 to 2024–25</div></div>
        </div>
        ${dt.b ? `<div class="figure-sub" style="margin:14px 0 6px">2026 IDEA determination</div>
          <div class="det-pills"><span class="det-pill ${detClass(dt.b)}">Part&nbsp;B: ${dt.b}</span>${dt.c ? `<span class="det-pill ${detClass(dt.c)}">Part&nbsp;C: ${dt.c}</span>` : ''}</div>` : ''}
        <div class="figure-sub" style="margin:15px 0 2px">Number served over time</div>
        <div id="focusStTrend" class="chartbox"></div>
        <button class="focus-more" data-kind="state">Open the full ${r[0]} snapshot</button>
      </div>`;
    }
    function intersectCol(cat, r) {
      const vec = CAT && CAT.state[r[1]];
      const idx = CAT ? CAT.cats.indexOf(cat) : -1;
      const cnt = (vec && idx >= 0) ? vec[idx] : null;
      const stateTot = vec ? vec.reduce((a, b) => a + b, 0) : r[5];
      const natCat = (CAT && CAT.nat && CAT.nat[cat] != null) ? CAT.nat[cat] : (I.DIS[cat] ? (I.DIS[cat][I.YEARS.length - 1] || 0) * 1000 : null);
      const shareState = (cnt != null && stateTot) ? cnt / stateTot * 100 : null;
      const shareNat = (cnt != null && natCat) ? cnt / natCat * 100 : null;
      return `<div class="focus-col" style="grid-column:1/-1">
        <div class="focus-h">${cat} in ${r[0]}</div>
        <div class="focus-name">${cnt != null ? I.nf(cnt) : 'Not reported'}</div>
        <div class="snap-grid">
          <div class="snap-cell"><div class="k">Served under primary disability category of ${cat}</div><div class="v">${cnt != null ? I.nf(cnt) : 'n/a'}</div><div class="sub">${r[0]}, ages 3–21, 2024–25</div></div>
          ${shareState != null ? `<div class="snap-cell"><div class="k">Share of ${r[0]}'s students served</div><div class="v">${shareState.toFixed(1)}%</div><div class="sub">of ${I.nf(stateTot)} served</div></div>` : ''}
          ${shareNat != null ? `<div class="snap-cell"><div class="k">Share of all U.S. ${cat.toLowerCase()}</div><div class="v accent">${shareNat.toFixed(1)}%</div><div class="sub">of ${I.nf(Math.round(natCat))} served nationally</div></div>` : ''}
        </div>
        <div class="figure-sub" style="margin:16px 0 2px">${r[0]}: every disability category, with ${cat.toLowerCase()} highlighted</div>
        <div id="focusIntCats" class="chartbox"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="focus-more" data-kind="cat">Open the full ${cat} profile</button>
          <button class="focus-more" data-kind="state">Open the full ${r[0]} snapshot</button>
        </div>
      </div>`;
    }
    function render() {
      const cat = catSel.value, r = stSel.value ? I.STATES.find(x => x[1] === stSel.value) : null;
      if (!cat && !r) { out.innerHTML = `<div class="focus-empty">Choose a disability category or a state above to begin.</div>`; return; }
      if (cat && r) {
        // BOTH chosen -> the disability's count IN that state
        out.innerHTML = intersectCol(cat, r);
        const vec = CAT && CAT.state[r[1]];
        if (vec) {
          const items = CAT.cats.map((c, i) => ({ label: c, value: vec[i] })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
          const ch = C.barsH({ onClick: it => S.openCatModal(it.label), items: items.map(d => ({ label: d.label, value: d.value, color: d.label === cat ? P.navy : P.green, highlight: d.label === cat })), labelW: 204, barH: 14, gap: 7, padR: 62, xMax: items[0].value * 1.02, valueFmt: v => v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'k' : Math.round(v) });
          const host = document.getElementById('focusIntCats'); if (host) { host.appendChild(ch.node); ch.reveal(); }
        }
      } else {
        // ONE chosen -> that single profile
        out.innerHTML = (cat ? catCol(cat) : '') + (r ? stateCol(r) : '');
        if (cat) {
          const ser = I.DIS[cat], cv = ser.slice(3).map(v => v == null ? null : v / 1000);
          const t1 = C.lineChart({ labels: I.YEARS.slice(3), xs: I.YEARS.slice(3).map(y => +y.slice(0, 4)), xTicks: [2000, 2012, 2024],
            series: [{ values: cv, color: P.greenD, area: true, areaOpacity: .12, highlight: true }],
            yMin: 0, yMax: Math.max(...cv.filter(v => v != null)) * 1.25 || 1, yTicks: 3, yFmt: v => v >= 1 ? v.toFixed(1) + 'M' : (v * 1000).toFixed(0) + 'k', height: 190, width: 430, padL: 46 });
          const ctEl = document.getElementById('focusCatTrend');
          ctEl.appendChild(t1.node); t1.reveal();
          ctEl.classList.add('focus-drill'); ctEl.title = 'Open the full ' + cat + ' profile';
          ctEl.addEventListener('click', () => S.openCatModal(cat));
        }
        if (r) {
          const sv = [r[2], r[3], r[4], r[5]];
          const t2 = C.lineChart({ labels: ['2000–01', '2010–11', '2022–23', '2024–25'], xs: [2000, 2010, 2022, 2024], xTicks: [2000, 2010, 2024],
            series: [{ values: sv, color: P.green, area: true, areaOpacity: .12, highlight: true, endLabel: I.nf(r[5]) }],
            yMin: 0, yMax: Math.max(...sv) * 1.2, yTicks: 3, yFmt: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v), height: 190, width: 430, padL: 50 });
          const stEl = document.getElementById('focusStTrend');
          stEl.appendChild(t2.node); t2.reveal();
          stEl.classList.add('focus-drill'); stEl.title = 'Open the full ' + r[0] + ' snapshot';
          stEl.addEventListener('click', () => S.openStateModal(r[1]));
        }
      }
      out.querySelectorAll('.focus-more').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.kind === 'cat') S.openCatModal(catSel.value); else S.openStateModal(stSel.value);
      }));
    }
    function open(presetCat, presetState) {
      if (!pop) build();
      if (presetCat != null) catSel.value = presetCat;
      if (presetState != null) stSel.value = presetState;
      if (presetCat != null || presetState != null) render();
      pop.classList.add('show'); document.documentElement.style.overflow = 'hidden';
    }
    function close() { pop.classList.remove('show'); document.documentElement.style.overflow = ''; }
    btn.addEventListener('click', () => open());
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && pop && pop.classList.contains('show')) close(); });
    window.IDEAFocus = { open };
  })();

  /* ===== UNIFIED MAP: states -> districts (LEA) + funding ==== */
  (function () {
    const box = document.getElementById('chart-map'); if (!box || !window.USMAP) return;
    const LEAALL = (window.LEAALL && window.LEAALL.states) || {};
    const stops = [{ t: 0, color: '#eaf0e9' }, { t: .5, color: '#5aa377' }, { t: 1, color: '#0f3d2c' }];
    const $ = id => document.getElementById(id);
    const metricSel = $('umapMetric'), crumbEl = $('umapCrumb'), titleEl = $('umapTitle'),
      drillEl = $('mapDrill'), srcEl = $('umapSource'), loEl = $('mapLo'), hiEl = $('mapHi'), rampEl = $('mapRamp'), tip = $('maptip');
    const byAbbr = {}, nameOf = {};
    I.STATES.forEach(r => { byAbbr[r[1]] = r; nameOf[r[1]] = r[0]; });
    const fmtMoney = v => v == null ? 'n/a' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v);
    const moneyOf = name => { const m = MOE && MOE.states[name]; return m ? m.f611 + m.f619 : null; };
    const normNces = n => { const d = String(n).replace(/\D/g, ''); return d ? String(parseInt(d, 10)) : ''; };
    const LEAEXIT = (window.LEAEXIT && window.LEAEXIT.byNces) || {};
    const CAT = window.CATDATA || null;
    function renderCatBars(host, vec) {                                  // full disability-category breakdown
      if (!host || !CAT || !vec) return;
      const items = CAT.cats.map((c, i) => ({ label: c, value: vec[i] })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
      if (!items.length) { host.innerHTML = '<div class="map-empty">No category detail reported.</div>'; return; }
      const ch = C.barsH({ onClick: it => S.openCatModal && S.openCatModal(it.label), items: items.map(d => ({ label: d.label, value: d.value, color: P.green })), labelW: 204, barH: 14, gap: 7, padR: 60, xMax: items[0].value * 1.02, valueFmt: v => v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'k' : Math.round(v) });
      host.innerHTML = ''; host.appendChild(ch.node); ch.reveal();
    }

    const MONEY_BLURB = {
      'Section 611, school-age (3–21)': 'Section 611 is the larger Part B grant to states. It funds special education and related services for school-age children, ages 3 through 21.',
      'Section 619, preschool (3–5)': 'Section 619 is a smaller, separate Part B grant. It funds special education and related services for preschool children, ages 3 through 5.',
      'Special education & related services': 'The share of the reported allocation that pays for special education and related services, after any amount set aside for Coordinated Early Intervening Services (CEIS).',
      'Reserved for CEIS': 'Coordinated Early Intervening Services (CEIS): funds a district may set aside, sometimes required because of significant disproportionality, for students not yet identified as needing special education.',
      'Total reported IDEA, Part B funding': 'The Sections 611 and 619 grant funds reported by districts for School Year 2021–22 (FFY 2021, including American Rescue Plan supplemental funds). This is the amount that funnels down into the uses below.',
    };
    function openMoneyModal(node, selLabel) {
      S.openModal(`<div class="m-kicker">IDEA, Part&nbsp;B funding · ${selLabel}</div><h3 class="m-title">${node.label}</h3>
        <p class="m-dek">${MONEY_BLURB[node.label] || ''}</p>
        <div class="m-grid"><div><span class="mv">${fmtMoney(node.value)}</span><span class="ml">reported, School Year 2021–22</span></div>
        <div><span class="mv">${node.pct < 10 ? node.pct.toFixed(1) : Math.round(node.pct)}%</span><span class="ml">of the reported allocation</span></div></div>
        <p class="m-src">IDEA Part B Maintenance of Effort (MOE) Reduction and Coordinated Early Intervening Services (CEIS) Collection, School Year 2021–22.</p>`);
    }
    function renderFlow(host, st, label) {
      if (!host) return;
      if (!st || (st.f611 + st.f619) <= 0) { host.innerHTML = '<div class="map-empty">No 2021–22 funding reported for this selection.</div>'; return; }
      const total = st.f611 + st.f619, ceis = Math.min((st.ceisReq || 0) + (st.ceisVol || 0), total), services = Math.max(0, total - ceis);
      // a money funnel: the total narrows down to where it actually lands
      const items = [{ label: 'Total reported IDEA, Part B funding', value: total, color: P.navy, highlight: true },
        { label: 'Special education & related services', value: services, color: P.green }];
      if (ceis > 0) items.push({ label: 'Reserved for CEIS', value: ceis, color: P.accent });
      const ch = C.funnel({ items, width: 720, labelW: 262, padR: 108, barH: 50, gap: 26, valueFmt: fmtMoney,
        onClick: d => openMoneyModal({ label: d.label, value: d.value, pct: total ? d.value / total * 100 : 0 }, label) });
      host.innerHTML = ''; host.appendChild(ch.node); ch.reveal();
    }

    const METRICS = {
      pct: { val: r => r[6], fmt: v => v == null ? 'n/a' : v.toFixed(1) + '%', title: 'Percentage of students served under IDEA, Part B, of public school enrollment, by State: School year 2022–23', src: 'IDEA Part B Child Count and Educational Environments Collection, with NCES public-school enrollment. School Year 2022–23 (50 states and the District of Columbia).' },
      served: { val: r => r[5], fmt: v => v == null ? 'n/a' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(v), title: 'Number of children and students ages 3 through 21 served under IDEA, Part B, by State: School year 2024–25', src: 'IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25.' },
      fund: { val: r => moneyOf(r[0]), fmt: fmtMoney, title: 'Reported IDEA, Part B funding (Sections 611 and 619), by State: School year 2021–22', src: 'IDEA Part B Maintenance of Effort (MOE) Reduction and CEIS Collection, School Year 2021–22 (FFY 2021 allocations include American Rescue Plan funds). Totals reflect only reporting LEAs.' },
      fundper: { val: r => {                                            // avg reported funding per student, averaged across the State's districts
        const list = LEAALL[r[1]] || [], byN = (MOE && MOE.byNces) || {}; let sum = 0, n = 0, matched = 0;
        list.forEach(x => { const served = x[2], f = byN[normNces(x[1])];
          if (f > 0 && served > 0) matched++;                           // LEA present in BOTH the funding + child-count files
          if (served >= 50 && f > 0) { sum += f / served; n++; }        // tiny programs skew the ratio, so exclude < 50 served
        });
        // grey out (return null) when a State is too suppressed to trust: under a quarter of its LEAs match across files
        if (!list.length || matched / list.length < 0.25 || n < 3) return null;
        return sum / n;
      }, fmt: v => v == null ? 'n/a' : '$' + Math.round(v).toLocaleString('en-US'), title: 'Average reported IDEA, Part B funding per student served, averaged across a State’s districts', src: 'IDEA Part B MOE Reduction and CEIS Collection (reported funding, SY 2021–22, includes ARP) divided by students served (SY 2024–25), per reporting district with at least 50 students, then averaged across the State. States are greyed out (not shaded) when fewer than a quarter of their districts match across the funding and child-count files, so a reliable average cannot be formed.' },
      altdip: { val: r => { const e = (window.SEA && window.SEA.exit) || {}; const s = e[r[1]]; return s ? (s.altPct || 0) : null; }, fmt: v => v == null ? 'n/a' : v.toFixed(1) + '%', title: 'Students who graduated with an alternate diploma, as a percent of those who exited school, by State: School year 2023–24', src: 'IDEA Part B Exiting Collection, School Year 2023–24 (All Disabilities; share of students ages 14–21 who exited school). Most States report none; only a few award alternate diplomas.' },
    };
    let metric = 'fundper';
    let choro = null;

    function setCrumb(items) {
      crumbEl.innerHTML = items.map((it, i) => (it[1] && i !== items.length - 1) ? `<button class="crumb-link" data-i="${i}">${it[0]}</button>` : `<span class="crumb-cur">${it[0]}</span>`).join('<span class="crumb-sep">›</span>');
      crumbEl.querySelectorAll('.crumb-link').forEach(b => b.addEventListener('click', () => items[+b.dataset.i][1]()));
    }
    function renderMap() {
      const M = METRICS[metric], vals = {}, list = [], greyed = [];
      I.STATES.forEach(r => { const v = M.val(r); vals[r[1]] = v; if (v != null) list.push(v); else greyed.push(r[0]); });
      const min = Math.min(...list), max = Math.max(...list);
      choro = C.choropleth({ values: vals, min, max, stops, emptyFill: '#c9c8c0', fmt: M.fmt, nameOf: a => nameOf[a] || a, onClick: ab => drillState(ab) });
      box.innerHTML = ''; box.appendChild(choro.node); choro.reveal();
      titleEl.textContent = M.title;
      rampEl.style.background = `linear-gradient(90deg, ${stops.map(s => s.color + ' ' + (s.t * 100) + '%').join(', ')})`;
      loEl.textContent = M.fmt(min); hiEl.textContent = M.fmt(max);
      const greyNote = greyed.length ? ` <span style="display:inline-block;margin-top:6px"><span class="src-k" style="background:#c9c8c0;color:#444;border-radius:4px;padding:1px 6px;margin-right:6px;text-transform:none;letter-spacing:0">Greyed out (${greyed.length})</span>${greyed.join(', ')}: too suppressed or too few matching districts to shade reliably.</span>` : '';
      srcEl.innerHTML = '<span class="src-k">Source</span> U.S. Department of Education, OSEP, ' + M.src + greyNote;
      box.querySelectorAll('path[data-abbr]').forEach(p => {
        p.addEventListener('mousemove', e => { const ab = p.dataset.abbr; tip.innerHTML = `<b>${nameOf[ab]}</b><br><span class="v">${M.fmt(vals[ab])}</span>`; tip.style.left = Math.min(window.innerWidth - 220, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; tip.classList.add('show'); });
        p.addEventListener('mouseleave', () => tip.classList.remove('show'));
      });
    }
    function showUS() {
      choro && choro.select(null);
      setCrumb([['United States', null]]);
      drillEl.innerHTML = `<div class="figure-title" style="margin:8px 0 2px">Where the money goes, nationwide</div><div class="figure-sub" style="margin:0 0 4px">Reported IDEA, Part&nbsp;B funding (Sections 611 and 619), School Year 2021–22, summed across every reporting district.</div><div id="drillFlow" class="chartbox"></div><p class="map-hint2">Tap any state on the map to drill into its districts and funding.</p>`;
      drillEl.classList.add('show');
      renderFlow($('drillFlow'), MOE && MOE.US, 'United States, reporting LEAs');
    }
    function drillState(ab) {
      const r = byAbbr[ab]; if (!r) return;
      tip.classList.remove('show');
      choro && choro.select(ab);                          // glowing gold + sparkles on the chosen state
      setCrumb([['United States', showUS], [r[0], null]]);
      const d25 = window.DET2025 ? { b: window.DET2025.partB[r[0]], c: window.DET2025.partC[r[0]] } : {};
      const d26 = window.DET2026 ? { b: window.DET2026.partB[r[0]], c: window.DET2026.partC[r[0]] } : {};
      const rank = I.STATES.slice().sort((a, b) => b[5] - a[5]).findIndex(x => x[1] === ab) + 1;
      const growth = (r[5] - r[2]) / r[2] * 100;
      const dShort = s => !s ? '' : /^Meets/.test(s) ? 'Meets requirements' : /intervention/i.test(s) ? 'Needs intervention' : /two or more/i.test(s) ? 'Needs assistance (2+ yrs)' : 'Needs assistance (1 yr)';
      const dWord = (part, lvl) => lvl ? `<span class="det-word ${detClass(lvl)}">Part ${part}: ${dShort(lvl)}</span>` : '';
      const dLine = (yr, dd) => (dd.b || dd.c) ? `<p class="snap-det"><b class="snap-detyr">${yr}</b> ${dWord('B', dd.b)}${dd.b && dd.c ? '<span class="snap-dot">·</span>' : ''}${dWord('C', dd.c)}</p>` : '';
      let html = `<div class="drill-head"><h3>${r[0]}</h3></div>
        <div class="snap-links" style="margin:-4px 0 14px"><a href="#" class="drill-snaplink">Open ${r[0]}’s full snapshot →</a></div>
        <div class="snap-stats">
          <div class="stat"><div class="stat-v">${I.nf(r[5])}</div><div class="stat-k">Students served, ages 3–21 · 2024–25</div></div>
          <div class="stat"><div class="stat-v">${r[6].toFixed(1)}%</div><div class="stat-k">Percent of public-school enrollment · 2022–23</div></div>
          <div class="stat"><div class="stat-v">#${rank}</div><div class="stat-k">Rank by students served</div></div>
          <div class="stat"><div class="stat-v accent">${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%</div><div class="stat-k">Change since 2000–01</div></div>
        </div>`;
      if (d25.b || d26.b || d25.c || d26.c) html += `<div class="figure-sub" style="margin:16px 0 4px">IDEA determinations</div>${dLine('2026', d26)}${dLine('2025', d25)}`;
      html += `<div class="figure-sub" style="margin:18px 0 4px">Reported IDEA, Part B funding (Sections 611 and 619), 2021–22</div><div id="drillFlow" class="chartbox"></div>`;
      const nDist = (LEAALL[ab] || []).length;
      html += `<div class="figure-sub" style="margin:18px 0 8px">All ${I.nf(nDist)} districts and programs in ${r[0]}, by students served (2024–25)</div>
        <input id="drillDistSearch" class="ex-search" type="search" placeholder="Search ${r[0]} districts" style="margin-bottom:10px;width:100%;max-width:360px">
        <div id="drillDist" class="dist-list"></div>`;
      drillEl.innerHTML = html; drillEl.classList.add('show');
      const sl = drillEl.querySelector('.drill-snaplink');
      if (sl) sl.addEventListener('click', e => { e.preventDefault(); if (window.IDEAExplore && window.IDEAExplore.showState) window.IDEAExplore.showState(ab); });
      renderFlow($('drillFlow'), MOE && MOE.states[r[0]], r[0] + ', all reporting districts');
      renderDistList($('drillDist'), ab, r);
      drillEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function fundMapFor(name) { const top = (MOE && MOE.states[name]) ? MOE.states[name].top : []; const m = {}; top.forEach(x => { m[String(x[1])] = x; }); return m; }
    function renderDistList(host, ab, r) {
      if (!host) return;
      const list = LEAALL[ab], fundByNces = fundMapFor(r[0]);
      if (!list || !list.length) { host.innerHTML = '<div class="map-empty">No district-level data is reported for this state.</div>'; return; }
      const rowHTML = (x, i) => {
        const nm = x[0], tot = x[2], f = fundByNces[normNces(x[1])];
        const served = tot == null ? 'count suppressed' : I.nf(tot) + ' served';
        const ex = LEAEXIT[normNces(x[1])];                              // per-district exiting (2023-24)
        const gradTxt = (ex && ex[0] != null && ex[2] >= 20) ? ' · ' + Math.round(ex[0]) + '% grad' : '';
        return `<button class="dist-row" data-i="${i}"><span class="nm">${nm}</span><span class="meta">${served}${f ? ' · ' + fmtMoney(f[2]) + ' funding' : ''}${gradTxt}</span></button>`;
      };
      function paint(q) {
        const ql = (q || '').trim().toLowerCase();
        const idx = list.map((x, i) => i).filter(i => !ql || list[i][0].toLowerCase().includes(ql));
        host.innerHTML = idx.length ? idx.map(i => rowHTML(list[i], i)).join('') : '<div class="map-empty">No districts match that search.</div>';
        host.querySelectorAll('.dist-row[data-i]').forEach(b => b.addEventListener('click', () => drillDistrict(ab, r, +b.dataset.i, fundByNces)));
      }
      paint('');
      const si = document.getElementById('drillDistSearch');
      if (si) si.addEventListener('input', () => paint(si.value));
    }
    function drillDistrict(ab, r, i, fundByNces) {
      const x = LEAALL[ab][i], nm = x[0], nces = x[1], tot = x[2], sa = x[3], aut = x[4], f = fundByNces[normNces(nces)];
      const exd = LEAEXIT[normNces(nces)];                                // per-district exiting (2023-24)
      const exShow = exd && exd[2] >= 20;
      setCrumb([['United States', showUS], [r[0], () => drillState(ab)], [nm, null]]);
      let html = `<div class="drill-head"><h3>${nm}</h3><div class="sub">${r[0]} · NCES ${nces}</div></div>
        <div class="snap-grid">
          <div class="snap-cell"><div class="k">Students served, 3–21</div><div class="v">${tot == null ? 'n/a' : I.nf(tot)}</div><div class="sub">2024–25</div></div>
          ${sa != null ? `<div class="snap-cell"><div class="k">School age (5–21)</div><div class="v">${I.nf(sa)}</div><div class="sub">2024–25</div></div>` : ''}
          ${exShow && exd[0] != null ? `<div class="snap-cell"><div class="k">Graduated, regular diploma</div><div class="v">${exd[0].toFixed(1)}%</div><div class="sub">of those who exited, 2023–24</div></div>` : ''}
          ${exShow && exd[1] != null ? `<div class="snap-cell"><div class="k">Dropped out</div><div class="v accent">${exd[1].toFixed(1)}%</div><div class="sub">of those who exited, 2023–24</div></div>` : ''}
        </div>`;
      const cvec = CAT && CAT.lea[normNces(nces)];
      if (cvec) html += `<div class="figure-sub" style="margin:18px 0 6px">Students served by disability category, 2024–25</div><div id="drillCats" class="chartbox"></div>${S.suppNoteHTML ? S.suppNoteHTML('childcount') : ''}`;
      if (f) html += `<div class="figure-sub" style="margin:18px 0 4px">Reported IDEA, Part B funding (Sections 611 and 619), 2021–22</div><div id="drillFlow2" class="chartbox"></div>`;
      else html += `<p class="map-empty" style="margin-top:16px">No 2021–22 funding is reported for this district.</p>`;
      if (exShow) html += `<p class="source" style="margin-top:14px"><span class="src-k">Exiting source</span> U.S. Department of Education, OSEP, EDFacts, IDEA Part&nbsp;B Exiting LEA Collection, School Year 2023–24. Graduation and dropout are shares of students who exited school; districts with very few exiters are omitted.</p>`;
      drillEl.innerHTML = html;
      if (cvec) renderCatBars($('drillCats'), cvec);
      if (f) renderFlow($('drillFlow2'), { f611: f[3], f619: f[4], ceisReq: f[5], ceisVol: 0 }, nm);
      drillEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    metricSel && metricSel.addEventListener('change', () => { metric = metricSel.value; renderMap(); });
    S.onView(box, () => { renderMap(); showUS(); });
    S.expbar && S.expbar('chart-map', 'idea-states-map', () => {
      const M = METRICS[metric];
      return [['State', 'Abbr', M.title.split(':')[0].trim()], ...I.STATES.map(r => [r[0], r[1], M.val(r)])];
    });
    // exposed so the top search can jump straight into a state or district on the map
    window.IDEAUMAP = {
      toState: function (ab) { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); drillState(ab); },
      toDistrict: function (ab, nces) {
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const r = byAbbr[ab]; if (!r) return;
        const list = LEAALL[ab] || [], i = list.findIndex(x => normNces(x[1]) === normNces(nces));
        if (i >= 0) drillDistrict(ab, r, i, fundMapFor(r[0])); else drillState(ab);
      }
    };
  })();

  /* ===== SCATTER: funding vs students served (states / all districts / one state) ===== */
  (function () {
    const box = document.getElementById('chart-scatter'); if (!box || !MOE || !C.scatter) return;
    const $ = id => document.getElementById(id);
    const viewSel = $('scatterView'), stateSel = $('scatterState'), stateWrap = $('scatterStateWrap'),
      titleEl = $('scatterTitle'), subEl = $('scatterSub'), srcEl = $('scatterSource'), tip = $('maptip');
    const LEAALL = (window.LEAALL && window.LEAALL.states) || {}, byNces = MOE.byNces || {};
    const nameOf = {}; I.STATES.forEach(r => { nameOf[r[1]] = r[0]; });
    const norm = n => { const d = String(n).replace(/\D/g, ''); return d ? String(parseInt(d, 10)) : ''; };
    const detByNces = MOE.detByNces || {}, detByState = MOE.detByState || {};
    const DET_COLOR = { 1: P.green, 2: '#c9a23a', 3: P.accent, 4: '#8f2d2d' };
    const DET_LABEL = { 1: 'Meets requirements', 2: 'Needs assistance', 3: 'Needs intervention', 4: 'Needs substantial intervention' };
    const detColor = lvl => DET_COLOR[lvl] || P.gray;
    const detLabel = lvl => lvl ? DET_LABEL[lvl] : 'Not reported';
    const hiddenLevels = new Set();   // determination levels toggled off via the legend
    const fmtMoney = v => v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? '$' + Math.round(v / 1e6) + 'M' : v >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v);
    const fmtNum = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : Math.round(v);
    if (stateSel) { stateSel.innerHTML = ''; I.STATES.slice().sort((a, b) => a[0].localeCompare(b[0])).forEach(r => stateSel.add(new Option(r[0], r[1]))); stateSel.value = 'CA'; }

    function statePoints() {
      return I.STATES.map(r => {
        const m = MOE.states[r[0]], lvl = detByState[r[0]];
        return { x: r[5], y: m ? m.f611 + m.f619 : 0, label: r[0], ab: r[1], color: detColor(lvl), highlight: true, moe: detLabel(lvl), lvl: lvl || 0 };
      }).filter(p => p.y > 0);
    }
    function districtPoints(ab) {
      const out = [], keys = ab ? [ab] : Object.keys(LEAALL);
      keys.forEach(k => (LEAALL[k] || []).forEach(x => {
        const served = x[2], nn = norm(x[1]), fund = byNces[nn];
        if (served > 0 && fund > 0) out.push({ x: served, y: fund, label: x[0], ab: k, state: nameOf[k], color: detColor(detByNces[nn]), moe: detLabel(detByNces[nn]), lvl: detByNces[nn] || 0 });
      }));
      return out;
    }
    function openDistrict(p) {
      S.openModal(`<div class="m-kicker">${p.state || nameOf[p.ab] || ''} · district</div><h3 class="m-title">${p.label}</h3>
        <div class="m-grid"><div><span class="mv">${I.nf(p.x)}</span><span class="ml">students served, 3–21 (2024–25)</span></div>
        <div><span class="mv">${fmtMoney(p.y)}</span><span class="ml">reported Part B funding (2021–22)</span></div></div>
        ${p.moe ? `<p class="m-dek" style="margin-top:14px;font-size:13.5px">MOE-reduction determination (34 CFR 300.600(a)(2)): <strong>${p.moe}</strong>.</p>` : ''}
        <p class="m-src">IDEA Part B Child Count (2024–25); IDEA Part B MOE Reduction and CEIS Collection (2021–22).</p>`);
    }
    function render() {
      const view = viewSel ? viewSel.value : 'states';
      stateWrap.hidden = view !== 'state';
      let points, title, sub, onClick;
      if (view === 'states') {
        points = statePoints();
        title = 'Reported IDEA, Part B funding against students served, by State';
        sub = 'Each dot is a state or DC. Tap a state to drop into its districts.';
        onClick = p => { viewSel.value = 'state'; stateSel.value = p.ab; render(); };
      } else if (view === 'all') {
        points = districtPoints(null);
        title = 'Reported IDEA, Part B funding against students served, by district';
        sub = 'Each dot is one of ' + I.nf(points.length) + ' districts nationwide with both figures reported. Tap a dot to open it.';
        onClick = openDistrict;
      } else {
        const ab = stateSel.value; points = districtPoints(ab);
        title = 'Reported IDEA, Part B funding against students served: districts in ' + nameOf[ab];
        sub = I.nf(points.length) + ' districts in ' + nameOf[ab] + ' with both figures reported. Tap a dot to open it.';
        onClick = openDistrict;
      }
      titleEl.textContent = title;
      subEl.textContent = sub + ' Colored by each district’s determination under 34 CFR 300.600(a)(2), which controls whether it may reduce Maintenance of Effort (SY 2021–22). Tap a determination in the key to hide or show those dots.';
      const shownPoints = points.filter(p => !hiddenLevels.has(p.lvl));
      const lg = $('scatterLegend');
      if (lg) {
        const LEG = [[1, 'Meets requirements', DET_COLOR[1]], [2, 'Needs assistance', DET_COLOR[2]], [3, 'Needs intervention', DET_COLOR[3]], [4, 'Needs substantial intervention', DET_COLOR[4]], [0, 'Not reported', P.gray]];
        lg.innerHTML = LEG.map(([k, t, c]) => `<span class="k click det-toggle${hiddenLevels.has(k) ? ' off' : ''}" data-lvl="${k}" role="button" tabindex="0"><span class="sw" style="background:${c}"></span>${t}</span>`).join('');
        lg.querySelectorAll('.det-toggle').forEach(el => {
          const toggle = () => { const k = +el.dataset.lvl; hiddenLevels.has(k) ? hiddenLevels.delete(k) : hiddenLevels.add(k); render(); };
          el.addEventListener('click', toggle);
          el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        });
      }
      srcEl.innerHTML = '<span class="src-k">Source</span> U.S. Department of Education, OSEP, IDEA Part B Child Count (School Year 2024–25) and IDEA Part B Maintenance of Effort (MOE) Reduction and CEIS Collection (School Year 2021–22). Section 611 + 619 funding (FFY 2021) includes American Rescue Plan (ARP) Act supplemental funds. Districts with a suppressed count or no reported funding are not plotted.';
      const ch = C.scatter({
        points: shownPoints, logX: true, logY: true, width: 760, height: 440,
        xAxisLabel: 'Students served, ages 3–21 (log scale)', yAxisLabel: 'IDEA Part B funding (log scale)',
        xFmt: fmtNum, yFmt: fmtMoney,
        r: view === 'all' ? 2.6 : view === 'state' ? 5 : 6, dotOpacity: view === 'all' ? .4 : .65,
        onClick,
        onHover: (p, cx, cy) => { tip.innerHTML = `<b>${p.label}</b>${p.state ? '<br><span style="color:var(--faint)">' + p.state + '</span>' : ''}<br><span class="v">${I.nf(p.x)}</span> served &middot; <span class="v">${fmtMoney(p.y)}</span>${p.moe ? '<br><span style="color:var(--faint)">MOE determination: ' + p.moe + '</span>' : ''}`; tip.style.left = Math.min(window.innerWidth - 230, cx + 14) + 'px'; tip.style.top = (cy + 14) + 'px'; tip.classList.add('show'); },
        onLeave: () => tip.classList.remove('show'),
      });
      box.innerHTML = ''; box.appendChild(ch.node); ch.reveal();
    }
    viewSel && viewSel.addEventListener('change', render);
    stateSel && stateSel.addEventListener('change', () => { if (viewSel.value === 'state') render(); });
    S.onView(box, render);
    /* zoom controls: scale the plot up and scroll to explore the dense cluster */
    (function () {
      let zoom = 1;
      const fig = box.closest('.figure') || box.parentElement;
      const ctrls = document.createElement('div'); ctrls.className = 'scatter-zoom';
      ctrls.innerHTML = '<button type="button" data-z="in" aria-label="Zoom in">+</button>'
        + '<button type="button" data-z="out" aria-label="Zoom out">−</button>'
        + '<button type="button" data-z="reset" aria-label="Reset zoom">↺</button>';
      fig.appendChild(ctrls);
      const place = () => { ctrls.style.top = (box.offsetTop + 8) + 'px'; };
      const applyZoom = () => {
        const svg = box.querySelector('.cv-scatter');
        if (svg) { svg.style.width = (100 * zoom) + '%'; svg.style.maxWidth = 'none'; svg.style.height = 'auto'; }
        box.classList.toggle('zoomed', zoom > 1); place();
      };
      ctrls.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.z === 'in') zoom = Math.min(5, +(zoom + 0.5).toFixed(1));
        else if (b.dataset.z === 'out') zoom = Math.max(1, +(zoom - 0.5).toFixed(1));
        else zoom = 1;
        applyZoom();
      });
      new MutationObserver(applyZoom).observe(box, { childList: true });
      place();
    })();
    S.expbar && S.expbar('chart-scatter', 'idea-funding-vs-served', () => {
      const view = viewSel ? viewSel.value : 'all';
      const pts = view === 'state' ? districtPoints(stateSel.value) : districtPoints(null);
      return [['District', 'State', 'Students served (3-21)', 'Part B funding ($)', 'MOE determination'], ...pts.map(p => [p.label, p.state || '', p.x, p.y, p.moe])];
    });
  })();

  /* ===== TOP SEARCH ========================================= */
  (function () {
    const toggle = document.getElementById('searchToggle'), bar = document.getElementById('searchBar'),
      input = document.getElementById('searchInput'), close = document.getElementById('searchClose'), out = document.getElementById('searchResults');
    if (!toggle || !bar || !input || !out) return;
    const SECTIONS = [
      ['Trends: children served over time', 'rise'], ['Disability categories', 'cats'], ['Autism over time', 'autism'],
      ['Autism and intellectual disability', 'autism'], ['Classrooms (educational environments)', 'env'],
      ['Time in regular class, by disability', 'envcat'], ['Who is served (sex, race, age)', 'who'],
      ['States and districts map', 'explore'], ['Funding vs students served', 'alloc'], ['Part C early intervention', 'partc'], ['Exiting (graduation and dropout)', 'exiting'],
      ['2026 IDEA determinations', 'det'], ['Population context (Census ACS)', 'acs'], ['Funding (money flow)', 'moneyflow'],
      ['Explore the data', 'explore'],
    ];
    const index = [];
    I.STATES.forEach(r => index.push({ type: 'State', label: r[0], act: () => S.openStateModal(r[1]) }));
    cats.forEach(c => index.push({ type: 'Disability category', label: c, act: () => S.openCatModal(c) }));
    SECTIONS.forEach(([label, id]) => index.push({ type: 'Section', label, act: () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }));
    // every school district (LEA) is searchable; a hit drills the Explore map into it
    const LEAALL = (window.LEAALL && window.LEAALL.states) || {};
    Object.keys(LEAALL).forEach(ab => (LEAALL[ab] || []).forEach(x => index.push({
      type: 'District · ' + ab, label: x[0],
      act: () => { if (window.IDEAUMAP) window.IDEAUMAP.toDistrict(ab, x[1]); }
    })));
    function open() { bar.hidden = false; toggle.setAttribute('aria-expanded', 'true'); setTimeout(() => input.focus(), 30); }
    function shut() { bar.hidden = true; toggle.setAttribute('aria-expanded', 'false'); input.value = ''; out.innerHTML = ''; }
    function run() {
      const q = input.value.trim().toLowerCase();
      if (!q) { out.innerHTML = ''; return; }
      const hits = index.filter(x => x.label.toLowerCase().includes(q)).slice(0, 12);
      out.innerHTML = hits.length ? hits.map((h, i) => `<button class="search-hit" data-i="${index.indexOf(h)}"><span class="sh-t">${h.label}</span><span class="sh-k">${h.type}</span></button>`).join('') : '<div class="search-none">No matches.</div>';
    }
    toggle.addEventListener('click', () => bar.hidden ? open() : shut());
    close.addEventListener('click', shut);
    input.addEventListener('input', run);
    input.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); else if (e.key === 'Enter') { const first = out.querySelector('.search-hit'); if (first) first.click(); } });
    out.addEventListener('click', e => { const b = e.target.closest('.search-hit'); if (!b) return; const item = index[+b.dataset.i]; shut(); item.act(); });
  })();
})();
