/* ============================================================
   interactive.js — Focus Mode popup, the MOE/CEIS money flow,
   and the top search. The single state map lives in story.js
   (Exhibit 7, choropleth + dropdown).
   ============================================================ */
(function () {
  const I = window.IDEA, C = window.Charts, P = I.PAL, S = window.IDEAStory, MOE = window.MOE;
  if (!I || !C || !S) return;
  const cats = Object.keys(I.DIS);
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
          <div class="m-kicker">Focus mode</div>
          <h3 class="m-title" style="margin-bottom:6px">Focus on a category, a state, or both</h3>
          <p class="m-dek">Pick any primary disability category and any state. Leave one blank to focus on just the other.</p>
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
      catSel.value = 'Specific learning disability';   // both populated by default
      stSel.value = 'CA';
      catSel.addEventListener('change', render); stSel.addEventListener('change', render);
      pop.querySelector('.focuspop-x').addEventListener('click', close);
      pop.addEventListener('click', e => { if (e.target === pop) close(); });
      render();
    }
    function catCol(cat) {
      const last = I.YEARS.length - 1, ser = I.DIS[cat];
      const cnt = (ser[last] || 0) * 1000;
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
    function render() {
      const cat = catSel.value, r = stSel.value ? I.STATES.find(x => x[1] === stSel.value) : null;
      if (!cat && !r) { out.innerHTML = `<div class="focus-empty">Choose a disability category or a state above to begin.</div>`; return; }
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

    const MONEY_BLURB = {
      'Section 611 — school-age (3–21)': 'Section 611 is the larger Part B grant to states. It funds special education and related services for school-age children, ages 3 through 21.',
      'Section 619 — preschool (3–5)': 'Section 619 is a smaller, separate Part B grant. It funds special education and related services for preschool children, ages 3 through 5.',
      'Special education & related services': 'The share of the reported allocation that pays for special education and related services, after any amount set aside for Coordinated Early Intervening Services (CEIS).',
      'Reserved for CEIS': 'Coordinated Early Intervening Services (CEIS): funds a district may set aside, sometimes required because of significant disproportionality, for students not yet identified as needing special education.',
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
      const right = [{ label: 'Special education & related services', value: services, color: P.green }];
      if (ceis > 0) right.push({ label: 'Reserved for CEIS', value: ceis, color: P.accent });
      const ch = C.moneyFlow({ left: [{ label: 'Section 611 — school-age (3–21)', value: st.f611, color: P.greenD }, { label: 'Section 619 — preschool (3–5)', value: st.f619, color: P.greenL }], right, total, totalLabel: 'Reported allocation', fmt: fmtMoney, width: 720, height: 320, onClick: node => openMoneyModal(node, label) });
      host.innerHTML = ''; host.appendChild(ch.node); ch.reveal();
    }

    const METRICS = {
      pct: { val: r => r[6], fmt: v => v == null ? 'n/a' : v.toFixed(1) + '%', title: 'Percentage of students served under IDEA, Part B, of public school enrollment, by State: School year 2022–23', src: 'IDEA Part B Child Count and Educational Environments Collection, with NCES public-school enrollment. School Year 2022–23 (50 states and the District of Columbia).' },
      served: { val: r => r[5], fmt: v => v == null ? 'n/a' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(v), title: 'Number of children and students ages 3 through 21 served under IDEA, Part B, by State: School year 2024–25', src: 'IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25.' },
      fund: { val: r => moneyOf(r[0]), fmt: fmtMoney, title: 'Reported IDEA, Part B funding (Sections 611 and 619), by State: School year 2021–22', src: 'IDEA Part B Maintenance of Effort (MOE) Reduction and CEIS Collection, School Year 2021–22 (FFY 2021 allocations include American Rescue Plan funds). Totals reflect only reporting LEAs.' },
    };
    let metric = 'pct';

    function setCrumb(items) {
      crumbEl.innerHTML = items.map((it, i) => (it[1] && i !== items.length - 1) ? `<button class="crumb-link" data-i="${i}">${it[0]}</button>` : `<span class="crumb-cur">${it[0]}</span>`).join('<span class="crumb-sep">›</span>');
      crumbEl.querySelectorAll('.crumb-link').forEach(b => b.addEventListener('click', () => items[+b.dataset.i][1]()));
    }
    function renderMap() {
      const M = METRICS[metric], vals = {}, list = [];
      I.STATES.forEach(r => { const v = M.val(r); vals[r[1]] = v; if (v != null) list.push(v); });
      const min = Math.min(...list), max = Math.max(...list);
      const ch = C.choropleth({ values: vals, min, max, stops, fmt: M.fmt, nameOf: a => nameOf[a] || a, onClick: ab => drillState(ab) });
      box.innerHTML = ''; box.appendChild(ch.node); ch.reveal();
      titleEl.textContent = M.title;
      rampEl.style.background = `linear-gradient(90deg, ${stops.map(s => s.color + ' ' + (s.t * 100) + '%').join(', ')})`;
      loEl.textContent = M.fmt(min); hiEl.textContent = M.fmt(max);
      srcEl.innerHTML = '<span class="src-k">Source</span> U.S. Department of Education, OSEP, ' + M.src;
      box.querySelectorAll('path[data-abbr]').forEach(p => {
        p.addEventListener('mousemove', e => { const ab = p.dataset.abbr; tip.innerHTML = `<b>${nameOf[ab]}</b><br><span class="v">${M.fmt(vals[ab])}</span>`; tip.style.left = Math.min(window.innerWidth - 220, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; tip.classList.add('show'); });
        p.addEventListener('mouseleave', () => tip.classList.remove('show'));
      });
    }
    function showUS() {
      setCrumb([['United States', null]]);
      drillEl.innerHTML = `<div class="figure-sub" style="margin:8px 0 4px">National reported IDEA, Part B funding (Sections 611 and 619), 2021–22 — reporting LEAs</div><div id="drillFlow" class="chartbox"></div><p class="map-hint2">Tap any state on the map to drill into its districts and funding.</p>`;
      drillEl.classList.add('show');
      renderFlow($('drillFlow'), MOE && MOE.US, 'United States, reporting LEAs');
    }
    function drillState(ab) {
      const r = byAbbr[ab]; if (!r) return;
      tip.classList.remove('show');
      setCrumb([['United States', showUS], [r[0], null]]);
      const dt = window.DET2026 ? { b: window.DET2026.partB[r[0]], c: window.DET2026.partC[r[0]] } : {};
      const rank = I.STATES.slice().sort((a, b) => b[5] - a[5]).findIndex(x => x[1] === ab) + 1;
      const growth = (r[5] - r[2]) / r[2] * 100;
      let html = `<div class="drill-head"><h3>${r[0]}</h3></div>
        <div class="snap-grid">
          <div class="snap-cell"><div class="k">Students served, 3–21</div><div class="v">${I.nf(r[5])}</div><div class="sub">2024–25</div></div>
          <div class="snap-cell"><div class="k">Percent of enrollment</div><div class="v">${r[6].toFixed(1)}%</div><div class="sub">2022–23</div></div>
          <div class="snap-cell"><div class="k">National rank</div><div class="v">#${rank}</div><div class="sub">by number served</div></div>
          <div class="snap-cell"><div class="k">Change since 2000–01</div><div class="v accent">${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%</div><div class="sub">2000–01 to 2024–25</div></div>
        </div>`;
      if (dt.b) html += `<div class="figure-sub" style="margin:16px 0 6px">2026 IDEA determination</div><div class="det-pills"><span class="det-pill ${detClass(dt.b)}">Part&nbsp;B: ${dt.b}</span>${dt.c ? `<span class="det-pill ${detClass(dt.c)}">Part&nbsp;C: ${dt.c}</span>` : ''}</div>`;
      html += `<div class="figure-sub" style="margin:18px 0 4px">Reported IDEA, Part B funding (Sections 611 and 619), 2021–22</div><div id="drillFlow" class="chartbox"></div>`;
      const nDist = (LEAALL[ab] || []).length;
      html += `<div class="figure-sub" style="margin:18px 0 8px">All ${I.nf(nDist)} districts and programs in ${r[0]}, by students served (2024–25)</div><div id="drillDist" class="dist-list"></div>`;
      drillEl.innerHTML = html; drillEl.classList.add('show');
      renderFlow($('drillFlow'), MOE && MOE.states[r[0]], r[0] + ', all reporting districts');
      renderDistList($('drillDist'), ab, r);
      drillEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function fundMapFor(name) { const top = (MOE && MOE.states[name]) ? MOE.states[name].top : []; const m = {}; top.forEach(x => { m[String(x[1])] = x; }); return m; }
    function renderDistList(host, ab, r) {
      if (!host) return;
      const list = LEAALL[ab], fundByNces = fundMapFor(r[0]);
      if (!list || !list.length) { host.innerHTML = '<div class="map-empty">No district-level data is reported for this state.</div>'; return; }
      host.innerHTML = list.map((x, i) => {
        const nm = x[0], tot = x[2], f = fundByNces[normNces(x[1])];
        const served = tot == null ? 'count suppressed' : I.nf(tot) + ' served';
        const ex = LEAEXIT[normNces(x[1])];                              // per-district exiting (2023-24)
        const gradTxt = (ex && ex[0] != null && ex[2] >= 20) ? ' · ' + Math.round(ex[0]) + '% grad' : '';
        return `<button class="dist-row" data-i="${i}"><span class="nm">${nm}</span><span class="meta">${served}${f ? ' · ' + fmtMoney(f[2]) + ' funding' : ''}${gradTxt}</span></button>`;
      }).join('');
      host.querySelectorAll('.dist-row[data-i]').forEach(b => b.addEventListener('click', () => drillDistrict(ab, r, +b.dataset.i, fundByNces)));
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
          ${aut != null && aut > 0 ? `<div class="snap-cell"><div class="k">Served under autism</div><div class="v">${I.nf(aut)}</div><div class="sub">2024–25</div></div>` : ''}
          ${exShow && exd[0] != null ? `<div class="snap-cell"><div class="k">Graduated, regular diploma</div><div class="v">${exd[0].toFixed(1)}%</div><div class="sub">of those who exited, 2023–24</div></div>` : ''}
          ${exShow && exd[1] != null ? `<div class="snap-cell"><div class="k">Dropped out</div><div class="v accent">${exd[1].toFixed(1)}%</div><div class="sub">of those who exited, 2023–24</div></div>` : ''}
        </div>`;
      if (f) html += `<div class="figure-sub" style="margin:18px 0 4px">Reported IDEA, Part B funding (Sections 611 and 619), 2021–22</div><div id="drillFlow2" class="chartbox"></div>`;
      else html += `<p class="map-empty" style="margin-top:16px">No 2021–22 funding is reported for this district.</p>`;
      if (exShow) html += `<p class="source" style="margin-top:14px"><span class="src-k">Exiting source</span> U.S. Department of Education, OSEP, EDFacts, IDEA Part&nbsp;B Exiting LEA Collection, School Year 2023–24. Graduation and dropout are shares of students who exited school; districts with very few exiters are omitted.</p>`;
      drillEl.innerHTML = html;
      if (f) renderFlow($('drillFlow2'), { f611: f[3], f619: f[4], ceisReq: f[5], ceisVol: 0 }, nm);
      drillEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    metricSel && metricSel.addEventListener('change', () => { metric = metricSel.value; renderMap(); });
    S.onView(box, () => { renderMap(); showUS(); });
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
    const fmtMoney = v => v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? '$' + Math.round(v / 1e6) + 'M' : v >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v);
    const fmtNum = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : Math.round(v);
    if (stateSel) { stateSel.innerHTML = ''; I.STATES.slice().sort((a, b) => a[0].localeCompare(b[0])).forEach(r => stateSel.add(new Option(r[0], r[1]))); stateSel.value = 'CA'; }

    function statePoints() {
      return I.STATES.map(r => {
        const m = MOE.states[r[0]], lvl = detByState[r[0]];
        return { x: r[5], y: m ? m.f611 + m.f619 : 0, label: r[0], ab: r[1], color: detColor(lvl), highlight: true, moe: detLabel(lvl) };
      }).filter(p => p.y > 0);
    }
    function districtPoints(ab) {
      const out = [], keys = ab ? [ab] : Object.keys(LEAALL);
      keys.forEach(k => (LEAALL[k] || []).forEach(x => {
        const served = x[2], nn = norm(x[1]), fund = byNces[nn];
        if (served > 0 && fund > 0) out.push({ x: served, y: fund, label: x[0], ab: k, state: nameOf[k], color: detColor(detByNces[nn]), moe: detLabel(detByNces[nn]) });
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
      subEl.textContent = sub + (view === 'states'
        ? ' Each state is shaded by its most common district determination under 34 CFR 300.600(a)(2) (the determination that controls Maintenance of Effort reduction, SY 2021–22).'
        : ' Colored by each district’s determination under 34 CFR 300.600(a)(2), which controls whether it may reduce Maintenance of Effort (SY 2021–22). Determinations vary district by district within a state.');
      const lg = $('scatterLegend');
      if (lg) lg.innerHTML = [['Meets requirements', DET_COLOR[1]], ['Needs assistance', DET_COLOR[2]], ['Needs intervention', DET_COLOR[3]], ['Needs substantial intervention', DET_COLOR[4]], ['Not reported', P.gray]].map(([t, c]) => `<span class="k"><span class="sw" style="background:${c}"></span>${t}</span>`).join('');
      srcEl.innerHTML = '<span class="src-k">Source</span> U.S. Department of Education, OSEP, IDEA Part B Child Count (School Year 2024–25) and IDEA Part B Maintenance of Effort (MOE) Reduction and CEIS Collection (School Year 2021–22). Section 611 + 619 funding (FFY 2021) includes American Rescue Plan (ARP) Act supplemental funds. Districts with a suppressed count or no reported funding are not plotted.';
      const ch = C.scatter({
        points, logX: true, logY: true, width: 760, height: 440,
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
  })();

  /* ===== TOP SEARCH ========================================= */
  (function () {
    const toggle = document.getElementById('searchToggle'), bar = document.getElementById('searchBar'),
      input = document.getElementById('searchInput'), close = document.getElementById('searchClose'), out = document.getElementById('searchResults');
    if (!toggle || !bar || !input || !out) return;
    const SECTIONS = [
      ['Trends — children served over time', 'rise'], ['Disability categories', 'cats'], ['Autism over time', 'autism'],
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
