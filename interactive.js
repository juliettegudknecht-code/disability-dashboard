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

  /* ===== MONEY FLOW (MOE / CEIS, reported 611 + 619) ========= */
  (function () {
    const box = document.getElementById('chart-moe'); if (!box || !MOE) return;
    const stSel = document.getElementById('moeState'), dSel = document.getElementById('moeDistrict'), cap = document.getElementById('moeCap');
    if (stSel) {
      stSel.add(new Option('United States (reporting LEAs)', '__US__'));
      Object.keys(MOE.states).sort().forEach(n => stSel.add(new Option(n, n)));
      stSel.value = '__US__';
    }
    const fmtMoney = v => v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(0) + 'K' : '$' + Math.round(v);
    const MONEY_BLURB = {
      'Section 611 — school-age (3–21)': 'Section 611 is the larger Part B grant to states. It funds special education and related services for school-age children, ages 3 through 21.',
      'Section 619 — preschool (3–5)': 'Section 619 is a smaller, separate Part B grant. It funds special education and related services for preschool children, ages 3 through 5.',
      'Special education & related services': 'The share of the reported allocation that pays for special education and related services, after any amount set aside for Coordinated Early Intervening Services (CEIS).',
      'Reserved for CEIS': 'Coordinated Early Intervening Services (CEIS): funds a district may set aside, sometimes required because of significant disproportionality, for students not yet identified as needing special education.',
    };
    function openMoneyModal(node, selLabel) {
      S.openModal(`<div class="m-kicker">IDEA, Part&nbsp;B funding · ${selLabel}</div><h3 class="m-title">${node.label}</h3>
        <p class="m-dek">${MONEY_BLURB[node.label] || ''}</p>
        <div class="m-grid">
          <div><span class="mv">${fmtMoney(node.value)}</span><span class="ml">reported, School Year 2021–22</span></div>
          <div><span class="mv">${node.pct < 10 ? node.pct.toFixed(1) : Math.round(node.pct)}%</span><span class="ml">of the reported allocation</span></div>
        </div>
        <p class="m-src">IDEA Part B Maintenance of Effort (MOE) Reduction and Coordinated Early Intervening Services (CEIS) Collection, School Year 2021–22.</p>`);
    }
    function dataFor() {
      const sk = stSel ? stSel.value : '__US__', di = dSel ? dSel.value : 'all';
      if (sk === '__US__') return { label: 'United States, reporting LEAs', f611: MOE.US.f611, f619: MOE.US.f619, ceis: MOE.US.ceisReq + MOE.US.ceisVol };
      const st = MOE.states[sk];
      if (di === 'all' || di == null) return { label: sk + ', all reporting districts', f611: st.f611, f619: st.f619, ceis: st.ceisReq + st.ceisVol };
      const row = st.top[+di];
      return { label: row[0] + ', ' + sk, f611: row[3], f619: row[4], ceis: row[5] };
    }
    function render() {
      box.innerHTML = '';
      const d = dataFor(), total = d.f611 + d.f619, ceis = Math.min(d.ceis, total), services = Math.max(0, total - ceis);
      const right = [{ label: 'Special education & related services', value: services, color: P.green }];
      if (ceis > 0) right.push({ label: 'Reserved for CEIS', value: ceis, color: P.accent });
      const ch = C.moneyFlow({
        left: [{ label: 'Section 611 — school-age (3–21)', value: d.f611, color: P.greenD }, { label: 'Section 619 — preschool (3–5)', value: d.f619, color: P.greenL }],
        right, total, totalLabel: 'Reported allocation', fmt: fmtMoney, width: 760, height: 340,
        onClick: node => openMoneyModal(node, d.label),
      });
      box.appendChild(ch.node); ch.reveal();
      if (cap) cap.textContent = d.label + ' — reported Section 611 and 619 allocations, School Year 2021–22.';
    }
    function fillDistricts() {
      if (!dSel) return; dSel.innerHTML = '';
      const sk = stSel.value;
      if (sk === '__US__') { dSel.add(new Option('All reporting LEAs', 'all')); dSel.disabled = true; return; }
      dSel.disabled = false; dSel.add(new Option('All districts in ' + sk, 'all'));
      MOE.states[sk].top.forEach((row, i) => dSel.add(new Option(row[0], i)));
    }
    if (stSel) stSel.addEventListener('change', () => { fillDistricts(); render(); });
    if (dSel) dSel.addEventListener('change', render);
    fillDistricts(); S.onView(box, render);
    S.expbar && S.expbar('chart-moe', 'idea-moe-ceis-flow', () => { const d = dataFor(); return [['Selection', 'Section 611 ($)', 'Section 619 ($)', 'CEIS reserved ($)'], [d.label, d.f611, d.f619, d.ceis]]; });
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
      ['States map and explore', 'explore'], ['Part C early intervention', 'partc'], ['Exiting (graduation and dropout)', 'exiting'],
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
