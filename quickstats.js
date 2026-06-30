/* ============================================================
   quickstats.js — "Quick statistics finder"
   A searchable popup of the counts leadership asks for most. Every
   figure is computed live from the data already in this story, each
   with a plain-language question, its value, a one-line note, and a
   source. Click a card to copy the number; "View in story" jumps to
   the matching section. Opens from the topbar (or "/" then type).
   ============================================================ */
(function () {
  const I = window.IDEA; if (!I) return;
  const nf = I.nf;
  const last = I.YEARS.length - 1;
  const X = window.IDEA_X || {};
  const DET = window.IDEA2 && window.IDEA2.DET;
  const money = v => v == null ? 'n/a' : v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + ' billion'
    : v >= 1e6 ? '$' + (v / 1e6).toFixed(0) + ' million' : '$' + Math.round(v).toLocaleString('en-US');

  /* ---- compute the figures, once ---- */
  const all = I.DEMO['All Disabilities'], aut = I.DEMO['Autism'];
  const totalServed = all.total;
  const autShare = aut.total / totalServed * 100;
  const inclShare = I.D.inclShare[I.D.inclShare.length - 1];
  const inclTot = Object.keys(I.INCL).reduce((s, k) => s + I.INCL[k][1], 0);
  const sldShare = I.INCL['Specific learning disability'][1] / inclTot * 100;
  const largest = I.STATES.reduce((b, r) => r[5] > b[5] ? r : b, I.STATES[0]);
  const growth = (I.ALL[last] - I.ALL[3]) / I.ALL[3] * 100;
  const maleShare = all.male / (all.male + all.female) * 100;
  const enrollPct = I.D.latestEnrollPct;
  const metB = DET ? DET.levels[0].partB : null;
  const intB = DET ? (DET.levels.find(l => l.key === 'int') || {}).partB : null;
  const totB = DET ? DET.totalB : null;
  const leaCount = X.LEA ? Object.values(X.LEA).reduce((s, d) => s + (d.count || 0), 0) : null;
  const fundUS = (window.MOE && window.MOE.US) ? window.MOE.US.f611 + window.MOE.US.f619 : null;
  const exUS = window.LEAEXIT && window.LEAEXIT.US;   // [grad%, drop%, base], SY 2023-24, reporting LEAs

  /* ---- tiny inline graphs for the cards ---- */
  function spark(vals, color) {
    vals = (vals || []).filter(v => v != null);
    if (vals.length < 2) return '';
    color = color || '#2f8f57';
    const w = 150, h = 38, pad = 3;
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), rng = (max - min) || 1;
    const xy = vals.map((v, i) => [pad + i / (vals.length - 1) * (w - 2 * pad), h - pad - (v - min) / rng * (h - 2 * pad)]);
    const line = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = 'M' + pad + ' ' + (h - pad) + ' L' + xy.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' L' + (w - pad) + ' ' + (h - pad) + ' Z';
    const last = xy[xy.length - 1];
    return '<svg class="qs-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">'
      + '<path d="' + area + '" fill="' + color + '" fill-opacity="0.13"/>'
      + '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>'
      + '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.4" fill="#103d2c"/></svg>';
  }
  function miniBars(vals, color) {
    if (!vals || !vals.length) return '';
    color = color || '#2f8f57';
    const w = 150, h = 38, n = vals.length, gap = 3, bw = (w - (n - 1) * gap) / n;
    const max = Math.max.apply(null, vals) || 1;
    const bars = vals.map((v, i) => { const bh = Math.max(2, v / max * (h - 3)); return '<rect x="' + (i * (bw + gap)).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="' + color + '" fill-opacity="' + (0.5 + 0.5 * v / max).toFixed(2) + '"/>'; }).join('');
    return '<svg class="qs-spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + bars + '</svg>';
  }
  const SPARK = {
    served: spark(I.ALL), enroll: spark(I.ENROLL_PCT), autism: spark(I.DIS['Autism']),
    incl: spark(I.D.inclShare), cats: miniBars(Object.keys(I.INCL).map(k => I.INCL[k][1]).sort((a, b) => b - a)),
  };

  /* ---- the curated list ---- */
  const STATS = [
    { c: 'Headline', q: 'How many children and students does IDEA serve?', v: nf(totalServed), copy: String(totalServed), g: SPARK.served,
      n: 'Served under IDEA, Part&nbsp;B, ages 3 through 21, School Year 2024–25.', s: 'IDEA Part B Child Count, SY 2024–25.', go: 'rise', t: 'total served child count part b how many students children overall national' },
    { c: 'Headline', q: 'How many infants and toddlers are in early intervention?', v: nf(I.PARTC.total), copy: String(I.PARTC.total),
      n: 'Served under IDEA, Part&nbsp;C, birth through age 2, School Year 2024–25.', s: 'IDEA Part C Child Count, SY 2024–25.', go: 'partc', t: 'part c infants toddlers early intervention birth to 2 babies' },
    { c: 'Headline', q: 'What share of public-school enrollment is served?', v: enrollPct.toFixed(1) + '%', copy: enrollPct.toFixed(1) + '%', g: SPARK.enroll,
      n: 'Students served as a percent of public-school enrollment (latest published, 2022–23).', s: 'IDEA Part B Child Count with NCES enrollment.', go: 'rise', t: 'percent enrollment share rate prevalence of all kids' },
    { c: 'Headline', q: 'How much has the count grown since 2000–01?', v: '+' + growth.toFixed(0) + '%', copy: '+' + growth.toFixed(0) + '%', g: SPARK.served,
      n: 'Change in the number served, ages 3–21, from 2000–01 to 2024–25.', s: 'IDEA Part B Child Count.', go: 'rise', t: 'growth change trend over time increase since 2000 history' },
    { c: 'Disability', q: 'How many students are served under autism?', v: nf(aut.total), copy: String(aut.total), g: SPARK.autism,
      n: 'Reported under autism as the primary disability, ages 3–21, 2024–25 (' + autShare.toFixed(1) + '% of all served).', s: 'IDEA Part B Child Count, SY 2024–25.', go: 'who', t: 'autism asd autistic count number served how many' },
    { c: 'Disability', q: 'What is the most common disability category?', v: 'Specific learning disability', copy: 'Specific learning disability (' + sldShare.toFixed(1) + '%)', g: SPARK.cats,
      n: sldShare.toFixed(1) + '% of school-age students served, the largest of the categories, 2024–25.', s: 'IDEA Part B Child Count, SY 2024–25.', go: 'cats', t: 'most common prevalent category sld specific learning disability largest top' },
    { c: 'Disability', q: 'How many disability categories are there?', v: String(Object.keys(I.DIS).length), copy: String(Object.keys(I.DIS).length),
      n: 'Primary disability categories reported under IDEA, Part&nbsp;B.', s: 'IDEA Part B Child Count.', go: 'cats', t: 'how many categories disability types list count' },
    { c: 'Classrooms', q: 'How many are in a regular classroom most of the day?', v: inclShare.toFixed(1) + '%', copy: inclShare.toFixed(1) + '%', g: SPARK.incl,
      n: 'Educated inside the regular class 80% or more of the day, school-age, 2024–25.', s: 'IDEA Part B Educational Environments, SY 2024–25.', go: 'env', t: 'inclusion regular class 80 percent least restrictive environment lre classroom mainstream' },
    { c: 'Outcomes', q: 'What is the graduation rate (regular diploma)?', v: (exUS ? exUS[0].toFixed(1) : I.ARC.exit.gradDiplomaPct.toFixed(1)) + '%', copy: (exUS ? exUS[0].toFixed(1) : I.ARC.exit.gradDiplomaPct.toFixed(1)) + '%',
      n: 'Of students ages 14–21 who exited school, the share who graduated with a regular high school diploma' + (exUS ? ' (2023–24)' : ' (2022–23)') + '.', s: 'IDEA Part B Exiting Collection.', go: 'exiting', t: 'graduation rate graduated diploma exiting outcomes finished school' },
    { c: 'Outcomes', q: 'What is the dropout rate?', v: (exUS ? exUS[1].toFixed(1) : I.ARC.exit.dropoutPct.toFixed(1)) + '%', copy: (exUS ? exUS[1].toFixed(1) : I.ARC.exit.dropoutPct.toFixed(1)) + '%',
      n: 'Of students ages 14–21 who exited school, the share who dropped out' + (exUS ? ' (2023–24)' : ' (2022–23)') + '.', s: 'IDEA Part B Exiting Collection.', go: 'exiting', t: 'dropout rate dropped out left school exiting outcomes' },
    { c: 'Who', q: 'What share of students served are male?', v: maleShare.toFixed(1) + '%', copy: maleShare.toFixed(1) + '%',
      n: 'Reported male, of all students served, 2024–25. About two-thirds.', s: 'IDEA Part B Child Count, SY 2024–25.', go: 'who', t: 'male female sex boys girls gender share split' },
    { c: 'States', q: 'Which state serves the most students?', v: largest[0], copy: largest[0] + ' (' + nf(largest[5]) + ')',
      n: nf(largest[5]) + ' served, ages 3–21, 2024–25, the most of any state.', s: 'IDEA Part B Child Count, SY 2024–25.', go: 'explore', t: 'largest state most students california biggest by state rank' },
    { c: 'Determinations', q: 'How many states meet Part B requirements?', v: metB != null ? metB + ' of ' + totB : 'n/a', copy: metB + ' of ' + totB,
      n: 'States and reporting entities that met requirements under Part&nbsp;B, 2026 determinations.', s: '2026 Determination Letters on State Implementation of IDEA.', go: 'det', t: 'determinations meets requirements states 2026 compliance results' },
    { c: 'Determinations', q: 'How many states need intervention (Part B)?', v: intB != null ? String(intB) : 'n/a', copy: String(intB),
      n: 'States and entities at "needs intervention," the most serious Part&nbsp;B level short of substantial, 2026.', s: '2026 Determination Letters on State Implementation of IDEA.', go: 'det', t: 'needs intervention determinations worst lowest level states 2026' },
    { c: 'Part C', q: 'Where do most infants & toddlers get services?', v: 'Home (' + I.ARC.partcSettings[0][1].toFixed(1) + '%)', copy: 'Home (' + I.ARC.partcSettings[0][1].toFixed(1) + '%)',
      n: 'Primary early-intervention setting for ' + I.ARC.partcSettings[0][1].toFixed(1) + '% of infants and toddlers under Part&nbsp;C.', s: 'IDEA Part C Settings Collection.', go: 'partc', t: 'part c setting home community based where services early intervention location' },
    { c: 'Funding', q: 'What is the reported Part B funding?', v: money(fundUS), copy: money(fundUS),
      n: 'Reported Sections 611 + 619 allocations across reporting LEAs, 2021–22 (includes ARP funds).', s: 'IDEA Part B MOE Reduction and CEIS Collection, SY 2021–22.', go: 'alloc', t: 'funding money allocation 611 619 dollars federal grant budget' },
  ];
  if (leaCount) STATS.push({ c: 'States', q: 'How many school districts report data?', v: nf(leaCount), copy: String(leaCount),
    n: 'Local educational agencies (school districts and programs) that reported a child count, 2024–25.', s: 'IDEA Part B Child Count, SY 2024–25.', go: 'explore', t: 'districts leas how many school districts report local educational agencies count' });

  const CATS = ['Headline', 'Disability', 'Classrooms', 'Who', 'Outcomes', 'States', 'Determinations', 'Part C', 'Funding'];

  /* ---- styles ---- */
  const css = document.createElement('style');
  css.textContent = `
  #qs-btn{ display:inline-flex; align-items:center; gap:7px; font:inherit; font-size:13px; font-weight:700; color:var(--green-d);
    background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px 12px; cursor:pointer; white-space:nowrap; transition:all .14s; }
  #qs-btn:hover{ border-color:var(--green); background:color-mix(in srgb,var(--green-l) 12%,var(--card)); }
  #qs-btn svg{ flex:none; }
  @media (max-width:720px){ #qs-btn .qs-lab{ display:none; } #qs-btn{ padding:8px; } }
  .qs-bg{ position:fixed; inset:0; z-index:210; display:flex; align-items:flex-start; justify-content:center; padding:48px 18px;
    background:rgba(11,22,18,.5); -webkit-backdrop-filter:blur(7px) saturate(118%); backdrop-filter:blur(7px) saturate(118%);
    opacity:0; pointer-events:none; transition:opacity .22s ease; overflow:auto; }
  .qs-bg.show{ opacity:1; pointer-events:auto; }
  .qs-card{ position:relative; width:min(760px,100%); background:var(--card); border:1px solid color-mix(in srgb,var(--line) 75%,transparent);
    border-radius:20px; box-shadow:0 2px 4px rgba(16,30,25,.05),0 22px 44px -14px rgba(16,30,25,.34),0 48px 90px -28px rgba(16,30,25,.3);
    padding:26px 26px 22px; opacity:0; transform:translateY(20px) scale(.97); transition:opacity .26s ease,transform .34s cubic-bezier(.16,1,.3,1); }
  .qs-bg.show .qs-card{ opacity:1; transform:none; }
  .qs-x{ position:absolute; top:15px; right:15px; width:33px; height:33px; display:inline-flex; align-items:center; justify-content:center; border:none;
    background:color-mix(in srgb,var(--line) 50%,transparent); color:var(--muted); font-size:19px; cursor:pointer; border-radius:50%; transition:background .16s,color .16s,transform .25s; }
  .qs-x:hover{ background:var(--green-d); color:#fff; transform:rotate(90deg); }
  .qs-search{ display:flex; align-items:center; gap:10px; margin:14px 0 6px; padding:11px 14px; background:var(--cream);
    border:1px solid var(--line); border-radius:11px; }
  .qs-search input{ flex:1; font:inherit; font-size:15px; color:var(--ink); background:none; border:none; outline:none; }
  .qs-search svg{ color:var(--muted); flex:none; }
  .qs-chips{ display:flex; flex-wrap:wrap; gap:6px; margin:10px 0 4px; }
  .qs-chip{ font:inherit; font-size:12px; font-weight:600; cursor:pointer; border:1px solid var(--line); background:var(--cream);
    color:var(--muted); padding:5px 11px; border-radius:999px; transition:all .14s; }
  .qs-chip.on{ background:var(--green-d); color:#fff; border-color:var(--green-d); }
  .qs-list{ display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-top:14px; max-height:54vh; overflow:auto; padding:2px; }
  @media (max-width:620px){ .qs-list{ grid-template-columns:1fr; } }
  .qs-item{ text-align:left; cursor:pointer; background:var(--cream); border:1px solid var(--line); border-radius:13px; padding:14px 15px;
    transition:border-color .15s,box-shadow .15s,transform .1s; position:relative; }
  .qs-item:hover{ border-color:color-mix(in srgb,var(--green) 40%,var(--line)); box-shadow:0 2px 12px -5px rgba(16,61,44,.22); }
  .qs-item:active{ transform:translateY(1px); }
  .qs-q{ font-size:12.5px; font-weight:600; color:var(--muted); line-height:1.35; }
  .qs-v{ font-family:var(--font-display); font-weight:800; font-size:23px; letter-spacing:-.02em; color:var(--green-d); margin:7px 0 5px; line-height:1.05; }
  .qs-n{ font-size:11.5px; color:var(--faint); line-height:1.45; }
  .qs-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:9px; }
  .qs-src{ font-size:10px; color:var(--faint); font-style:italic; }
  .qs-go{ font-size:11px; font-weight:700; color:var(--green); white-space:nowrap; }
  .qs-copied{ position:absolute; top:11px; right:12px; font-size:10.5px; font-weight:700; color:#fff; background:var(--green);
    border-radius:6px; padding:3px 7px; opacity:0; transform:translateY(-3px); transition:opacity .15s,transform .15s; pointer-events:none; }
  .qs-item.copied .qs-copied{ opacity:1; transform:none; }
  .qs-none{ grid-column:1/-1; padding:24px 8px; text-align:center; color:var(--faint); font-size:14px; }
  .qs-hint{ margin-top:12px; font-size:11px; color:var(--faint); text-align:center; }
  .qs-spark{ display:block; width:100%; height:34px; margin:8px 0 4px; overflow:visible; }`;
  document.head.appendChild(css);

  /* ---- the topbar button ---- */
  const tools = document.querySelector('.tb-tools');
  const btn = document.createElement('button');
  btn.id = 'qs-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Quick statistics finder');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m21 21-4.35-4.35"/><path d="M7.6 12.4v-1.6M10.5 12.4V8.6M13.4 12.4v-2.7"/></svg><span class="qs-lab">Quick stats</span>';
  if (tools) tools.insertBefore(btn, tools.firstChild); else document.body.appendChild(btn);

  /* ---- popup ---- */
  let bg = null, listEl = null, input = null, activeCat = 'All';
  function build() {
    bg = document.createElement('div'); bg.className = 'qs-bg';
    bg.innerHTML = `<div class="qs-card" role="dialog" aria-modal="true" aria-label="Quick statistics finder">
      <button class="qs-x" aria-label="Close">×</button>
      <div class="m-kicker">Quick statistics finder</div>
      <h3 class="m-title" style="margin-bottom:4px">The numbers people ask for, in one place</h3>
      <p class="m-dek" style="font-size:13.5px">Search a question or a keyword. Click any card to copy the figure.</p>
      <div class="qs-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        <input id="qs-input" type="search" placeholder="e.g. autism, graduation rate, funding, biggest state" aria-label="Search quick statistics" autocomplete="off">
      </div>
      <div class="qs-chips" id="qs-chips"></div>
      <div class="qs-list" id="qs-list"></div>
      <div class="qs-hint">Figures are computed from the data in this story. Every card names its source.</div>
    </div>`;
    document.body.appendChild(bg);
    input = bg.querySelector('#qs-input'); listEl = bg.querySelector('#qs-list');
    const chips = bg.querySelector('#qs-chips');
    ['All', ...CATS].forEach(c => {
      const b = document.createElement('button'); b.className = 'qs-chip' + (c === 'All' ? ' on' : ''); b.textContent = c; b.type = 'button';
      b.addEventListener('click', () => { activeCat = c; chips.querySelectorAll('.qs-chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); render(); });
      chips.appendChild(b);
    });
    bg.querySelector('.qs-x').addEventListener('click', close);
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    render();
  }
  function render() {
    const q = (input.value || '').trim().toLowerCase();
    const hits = STATS.filter(s => (activeCat === 'All' || s.c === activeCat) &&
      (!q || (s.q + ' ' + s.t + ' ' + s.v + ' ' + s.c).toLowerCase().includes(q)));
    if (!hits.length) { listEl.innerHTML = '<div class="qs-none">No matching statistic. Try a broader word like “autism”, “state”, or “funding”.</div>'; return; }
    listEl.innerHTML = hits.map((s, i) => `<button class="qs-item" data-i="${STATS.indexOf(s)}">
      <span class="qs-copied">Copied</span>
      <div class="qs-q">${s.q}</div>
      <div class="qs-v">${s.v}</div>
      ${s.g || ''}
      <div class="qs-n">${s.n}</div>
      <div class="qs-foot"><span class="qs-src">${s.s}</span>${s.go ? '<span class="qs-go">View in story →</span>' : ''}</div>
    </button>`).join('');
    listEl.querySelectorAll('.qs-item').forEach(el => {
      const s = STATS[+el.dataset.i];
      el.addEventListener('click', e => {
        if (e.target.closest('.qs-go')) { close(); const t = document.getElementById(s.go); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        try { navigator.clipboard && navigator.clipboard.writeText(s.copy || s.v); } catch (err) {}
        el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1100);
      });
    });
  }
  function open() { if (!bg) build(); bg.classList.add('show'); document.documentElement.style.overflow = 'hidden'; setTimeout(() => input && input.focus(), 40); }
  function close() { if (bg) bg.classList.remove('show'); document.documentElement.style.overflow = ''; }
  btn.addEventListener('click', open);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && bg && bg.classList.contains('show')) close(); });
  window.IDEAQuickStats = { open };
})();
