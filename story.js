/* ============================================================
   story.js — builds every exhibit, runs the scroll animation,
   wires the toggles, the state-map tooltip, PNG/CSV export, and
   the Tweaks panel.
   ============================================================ */
(function () {
  const I = window.IDEA, C = window.Charts, P = I.PAL, A = I.ARC, X = window.IDEA_X || {};
  document.documentElement.classList.add('js');

  /* enriched lookups (from enrich.js), keyed by disability category */
  const EXITD = {}; (X.EXIT_DIS || []).forEach(([d, g, dr, t]) => { EXITD[d] = { g, dr, t }; });
  const DISCD = {}; (X.DISC_DIS || []).forEach(([d, v]) => { DISCD[d] = v; });

  const FMT = {
    int:  v => Math.round(v).toLocaleString('en-US'),
    pct1: v => v.toFixed(1) + '%',
  };

  /* shared "in view" observer */
  const jobs = new WeakMap();
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (e.isIntersecting && jobs.has(e.target)) {
        const fn = jobs.get(e.target); jobs.delete(e.target); io.unobserve(e.target); fn();
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -5% 0px' });
  const onView = (node, fn) => { if (node) { jobs.set(node, fn); io.observe(node); } };

  document.querySelectorAll('.reveal').forEach(el => onView(el, () => el.classList.add('in')));
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count), fmt = FMT[el.dataset.fmt] || FMT.int;
    onView(el, () => C.countUp(el, to, fmt, 1300));
  });

  const mount = (id, chart) => {
    const box = document.getElementById(id);
    if (box && chart) { box.appendChild(chart.node); onView(box, chart.reveal); }
    return box;
  };
  const expbar = (id, name, csv) => {
    const box = document.getElementById(id), fig = box && box.closest('.figure');
    if (fig && C.addExportBar) C.addExportBar(fig, name, csv);
  };
  const swatch = (color, line) => {
    const sp = document.createElement('span'); sp.className = 'sw' + (line ? ' line' : '');
    sp.style.background = color; return sp;
  };
  const legend = (id, items, onClick) => {
    const box = document.getElementById(id); if (!box) return;
    box.innerHTML = '';
    items.forEach(([t, c, line], i) => {
      const k = document.createElement('span'); k.className = 'k' + (onClick ? ' click' : '');
      k.appendChild(swatch(c, line)); k.appendChild(document.createTextNode(t));
      if (onClick) {
        k.tabIndex = 0; k.setAttribute('role', 'button');
        const fire = () => onClick(t, i);
        k.addEventListener('click', fire);
        k.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      }
      box.appendChild(k);
    });
  };
  // a small "tap to explore" affordance dropped right under a chartbox
  const hint = (boxId, text) => {
    const box = document.getElementById(boxId); if (!box || box.nextElementSibling?.classList?.contains('fig-hint')) return;
    const el = document.createElement('div'); el.className = 'fig-hint';
    el.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11.5 9 5a1.8 1.8 0 0 1 3.6 0v6"/><path d="M12.6 11V8.2a1.7 1.7 0 0 1 3.4 0V11"/><path d="M16 10.5a1.7 1.7 0 0 1 3.4 0V15a5.5 5.5 0 0 1-5.5 5.5h-1.4a5 5 0 0 1-3.6-1.5l-3-3.1a1.8 1.8 0 0 1 2.6-2.5L9 14.5"/></svg>${text}`;
    box.insertAdjacentElement('afterend', el);
  };

  /* scroll-spy: highlight the current section in the top nav */
  (function () {
    const links = [...document.querySelectorAll('#topnav a')];
    if (!links.length) return;
    const targets = links.map(a => document.querySelector(a.getAttribute('href')));
    const spy = () => { const yv = window.scrollY + 130; let idx = 0; targets.forEach((t, i) => { if (t && t.offsetTop <= yv) idx = i; }); links.forEach((a, i) => a.classList.toggle('active', i === idx)); };
    window.addEventListener('scroll', spy, { passive: true }); window.addEventListener('resize', spy); spy();
  })();

  /* shared click-to-open detail popup */
  let modalEl = null;
  function openModal(html) {
    if (!modalEl) {
      modalEl = document.createElement('div'); modalEl.className = 'modal-bg';
      modalEl.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Close">\u00d7</button><div class="modal-body"></div></div>';
      document.body.appendChild(modalEl);
      const close = () => modalEl.classList.remove('show');
      modalEl.addEventListener('click', e => { if (e.target === modalEl) close(); });
      modalEl.querySelector('.modal-x').addEventListener('click', close);
      window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    modalEl.querySelector('.modal-body').innerHTML = html;
    modalEl.classList.add('show');
  }
  function detLevel(name) { const D = window.DET2026; return D ? { b: D.partB[name], c: D.partC[name] } : {}; }
  function detClass(s) { return !s ? '' : /^Meets/.test(s) ? 'det-meets' : /intervention/i.test(s) ? 'det-int' : /two or more/i.test(s) ? 'det-na2' : 'det-na1'; }
  function openStateModal(ab) {
    const r = I.STATES.find(x => x[1] === ab); if (!r) return;
    const served = r[5], pe = r[6], growth = (r[5] - r[2]) / r[2] * 100;
    const rank = I.STATES.slice().sort((a, b) => b[5] - a[5]).findIndex(x => x[1] === ab) + 1;
    const ex = (X.EXIT_STATE || {})[ab], dt = detLevel(r[0]);
    openModal(`<div class="m-kicker">State snapshot</div><h3 class="m-title">${r[0]}</h3>
      <div class="m-grid">
        <div><span class="mv">${I.nf(served)}</span><span class="ml">students served, ages 3\u201321 (2024\u201325)</span></div>
        <div><span class="mv">${pe.toFixed(1)}%</span><span class="ml">of public-school enrollment (2022\u201323)</span></div>
        <div><span class="mv" style="color:var(--accent)">${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%</span><span class="ml">change since 2000\u201301</span></div>
        <div><span class="mv">#${rank}</span><span class="ml">national rank by number served</span></div>
        ${ex && ex.gradPct != null ? `<div><span class="mv">${ex.gradPct.toFixed(1)}%</span><span class="ml">graduated with a regular diploma, of those who exited school (2023\u201324)</span></div>` : ''}
        ${ex && ex.dropPct != null ? `<div><span class="mv" style="color:var(--accent)">${ex.dropPct.toFixed(1)}%</span><span class="ml">dropped out, of those who exited school (2023\u201324)</span></div>` : ''}
      </div>
      ${dt.b ? `<div class="m-det"><div class="figure-sub" style="margin:16px 0 8px">2026 IDEA determination</div>
        <div class="det-pills"><span class="det-pill ${detClass(dt.b)}">Part&nbsp;B: ${dt.b}</span>${dt.c ? `<span class="det-pill ${detClass(dt.c)}">Part&nbsp;C: ${dt.c}</span>` : ''}</div></div>` : ''}
      <p class="m-src">IDEA Part B Child Count, Exiting, and Discipline Collections${dt.b ? '; 2026 Determination Letters on State Implementation of IDEA' : ''}.</p>`);
  }
  function openCatModal(cat) {
    if (!I.DIS[cat]) { openModal(`<div class="m-kicker">Disability category</div><h3 class="m-title">${cat}</h3><p class="m-dek">This grouping combines several smaller categories. Pick an individual category to see its detail.</p>`); return; }
    const last = I.YEARS.length - 1, series = I.DIS[cat];
    const count = series[last] * 1000;
    const totalLast = Object.keys(I.DIS).reduce((sx, k) => sx + (I.DIS[k][last] || 0), 0);
    const share = series[last] / totalLast * 100;
    const inclRow = I.ARC.inclByCat.find(x => x[0] === cat), incl = inclRow ? inclRow[1] : null;
    const v2000 = series[3], chg = v2000 ? (series[last] - v2000) / v2000 * 100 : null;
    const exd = EXITD[cat], remd = DISCD[cat];
    openModal(`<div class="m-kicker">Disability category</div><h3 class="m-title">${cat}</h3>
      <div class="m-grid">
        <div><span class="mv">${I.nf(count)}</span><span class="ml">served, ages 3\u201321 (2024\u201325)</span></div>
        <div><span class="mv">${share.toFixed(1)}%</span><span class="ml">of all students served</span></div>
        ${incl != null ? `<div><span class="mv">${incl.toFixed(0)}%</span><span class="ml">in regular class 80%+ of day (SY 2023\u201324)</span></div>` : ''}
        ${chg != null ? `<div><span class="mv" style="color:var(--accent)">${chg >= 0 ? '+' : ''}${chg.toFixed(0)}%</span><span class="ml">change since 2000\u201301</span></div>` : ''}
      </div>
      <div id="m-trend" class="chartbox"></div>
      ${exd ? `<div class="figure-sub" style="margin:16px 0 8px">Of students ages 14–21 who exited school, 2023–24</div>
      <div class="m-grid">
        <div><span class="mv">${exd.g.toFixed(1)}%</span><span class="ml">graduated with a regular high school diploma</span></div>
        <div><span class="mv" style="color:var(--accent)">${exd.dr.toFixed(1)}%</span><span class="ml">dropped out</span></div>
      </div>` : ''}
      ${remd != null ? `<p class="m-dek" style="margin-top:14px;font-size:13px">Nationally, ${I.nf(remd)} disciplinary removals were reported for students in this category in 2023–24.</p>` : ''}
      <p class="m-src">IDEA Part B Child Count, Exiting, and Discipline Collections.</p>`);
    const host = document.getElementById('m-trend');
    if (host) {
      const start = 3, vv = series.slice(start).map(v => v == null ? null : v / 1000);
      const t = C.lineChart({ labels: I.YEARS.slice(start), xs: I.YEARS.slice(start).map(y => +y.slice(0, 4)), xTicks: [2000, 2008, 2016, 2024],
        series: [{ values: vv, color: P.accent, area: true, areaOpacity: .12, highlight: true }],
        yMin: 0, yMax: Math.max(...vv.filter(v => v != null)) * 1.15, yTicks: 3, yFmt: v => v >= 1 ? v.toFixed(1) + 'M' : (v * 1000).toFixed(0) + 'k', height: 200, width: 430, padL: 46 });
      host.appendChild(t.node); t.reveal();
    }
  }

  /* educational-environment detail (drilldown from the classrooms exhibit) */
  const ENV_BUCKETS = {
    'Regular class, 80%+ of day': { keys: ['Inside regular class 80% or more of the day'], blurb: 'Students educated inside the regular classroom at least 80 percent of the school day. This is the least restrictive of the placement categories and the most common.' },
    '40–79% of day': { keys: ['Inside regular class 40% through 79% of the day'], blurb: 'Students inside the regular classroom 40 to 79 percent of the day, typically splitting time between the general classroom and a resource or special-education setting.' },
    'Less than 40% of day': { keys: ['Inside regular class less than 40% of the day'], blurb: 'Students inside the regular classroom less than 40 percent of the day, receiving most instruction in a separate special-education classroom.' },
    'Other settings': { keys: ['Separate School', 'Residential Facility', 'Parentally Placed in Private Schools', 'Homebound / Hospital', 'Correctional Facilities'], blurb: 'Students served outside regular school buildings: separate day schools, residential facilities, parentally placed private schools, homebound or hospital settings, and correctional facilities.' },
  };
  function openEnvModal(name) {
    const b = ENV_BUCKETS[name]; if (!b) return;
    const tot = I.D.envTotal;
    const sumAt = i => b.keys.reduce((s, k) => s + I.ENV[k][i], 0);
    const share = I.ENV_LBL.map((_, i) => +(sumAt(i) / tot[i] * 100).toFixed(1));
    const last = share.length - 1, cntLast = sumAt(last) * 1000;
    const chg = +(share[last] - share[0]).toFixed(1);
    openModal(`<div class="m-kicker">Educational environment</div><h3 class="m-title">${name}</h3>
      <p class="m-dek">${b.blurb}</p>
      <div class="m-grid">
        <div><span class="mv">${share[last]}%</span><span class="ml">of school-age students served (2024–25)</span></div>
        <div><span class="mv">${I.nf(Math.round(cntLast))}</span><span class="ml">students in this setting (2024–25)</span></div>
        <div><span class="mv" style="color:var(--accent)">${chg >= 0 ? '+' : ''}${chg} pts</span><span class="ml">change in share since 2012–13</span></div>
      </div>
      <div class="figure-sub" style="margin:16px 0 4px">Share over time</div>
      <div id="m-envtrend" class="chartbox"></div>
      <p class="m-src">IDEA Part B Child Count and Educational Environments Collection, School Years 2012–13 through 2024–25.</p>`);
    const host = document.getElementById('m-envtrend');
    if (host) {
      const t = C.lineChart({ labels: I.ENV_LBL, xs: I.ENV_LBL.map(y => +y.slice(0, 4)), xTicks: [2012, 2016, 2020, 2024],
        series: [{ values: share, color: P.greenD, area: true, areaOpacity: .12, highlight: true, endLabel: share[last] + '%' }],
        yMin: 0, yMax: Math.max(...share) * 1.25, yTicks: 3, yFmt: v => v.toFixed(0) + '%', height: 200, width: 430, padL: 42 });
      host.appendChild(t.node); t.reveal();
    }
  }

  /* race / ethnicity detail (drilldown from the Who exhibit) */
  const DISC_RACE_MAP = { White: 'White', Hispanic: 'Hispanic/Latino', Black: 'Black or African American', Asian: 'Asian', AIAN: 'American Indian or Alaska Native', NHPI: 'Native Hawaiian or Other Pacific Islander' };
  function openRaceModal(key, profile) {
    profile = profile || 'All Disabilities';
    const d = I.DEMO[profile]; if (!d || d.race[key] == null) return;
    const cnt = d.race[key], share = cnt / d.total * 100;
    const discTot = X.DISC_NAT && X.DISC_NAT.rem;
    const drRow = (X.DISC_RACE || []).find(r => r[0] === DISC_RACE_MAP[key]);
    const remShare = (profile === 'All Disabilities' && drRow && discTot) ? drRow[1] / discTot * 100 : null;
    openModal(`<div class="m-kicker">Race and ethnicity · ${profile === 'Autism' ? 'autism' : 'all disabilities'}</div><h3 class="m-title">${I.RACE_LBL[key]}</h3>
      <div class="m-grid">
        <div><span class="mv">${I.nf(cnt)}</span><span class="ml">students served (2024–25)</span></div>
        <div><span class="mv">${share.toFixed(1)}%</span><span class="ml">of ${profile === 'Autism' ? 'students served under autism' : 'all students served'}</span></div>
        ${remShare != null ? `<div><span class="mv" style="color:var(--accent)">${remShare.toFixed(1)}%</span><span class="ml">of all disciplinary removals (2023–24)</span></div>` : ''}
      </div>
      ${remShare != null ? `<p class="m-dek" style="margin-top:14px;font-size:13.5px">Students in this group make up ${share.toFixed(1)} percent of those served but ${remShare.toFixed(1)} percent of disciplinary removals, ${remShare > share + 0.5 ? 'a larger share of removals than of enrollment' : remShare < share - 0.5 ? 'a smaller share of removals than of enrollment' : 'about the same share in both'}.</p>` : ''}
      <p class="m-src">IDEA Part B Child Count, School Year 2024–25${remShare != null ? ', and Discipline Collection, School Year 2023–24' : ''}.</p>`);
  }

  /* Part C setting detail */
  const PARTC_BLURB = { 'Home': 'Early intervention delivered primarily in the child’s home, by far the most common Part C setting.', 'Community-based setting': 'Services delivered in community settings such as child-care centers, family day care, or early-childhood programs.', 'Other setting': 'Services delivered in other settings, including service-provider locations and hospitals.' };
  function openPartcModal(name, pctVal) {
    const total = I.ARC.partcTotal;
    openModal(`<div class="m-kicker">Part C early intervention</div><h3 class="m-title">${name}</h3>
      <p class="m-dek">${PARTC_BLURB[name] || ''}</p>
      <div class="m-grid">
        <div><span class="mv">${pctVal}%</span><span class="ml">of infants and toddlers served (fall 2023)</span></div>
        <div><span class="mv">${I.nf(Math.round(total * pctVal / 100))}</span><span class="ml">children, of about ${I.nf(total)} served</span></div>
      </div>
      <p class="m-src">IDEA Part C Child Count and Settings Collection.</p>`);
  }

  /* exiting detail */
  function openExitModal(name) {
    const e = I.ARC.exit, isGrad = /graduat/i.test(name);
    const prev = isGrad ? e.gradPrev : e.dropoutPrev, now = isGrad ? e.gradDiplomaPct : e.dropoutPct;
    openModal(`<div class="m-kicker">Exiting services</div><h3 class="m-title">${name}</h3>
      <p class="m-dek">${isGrad ? 'Share of students ages 14 through 21 who exited special education and school by graduating with a regular high school diploma.' : 'Share of students ages 14 through 21 who exited special education and school by dropping out.'}</p>
      <div class="m-grid">
        <div><span class="mv">${now.toFixed(1)}%</span><span class="ml">in 2022–23</span></div>
        <div><span class="mv">${prev.toFixed(1)}%</span><span class="ml">in 2014–15</span></div>
        <div><span class="mv" style="color:var(--accent)">${now - prev >= 0 ? '+' : ''}${(now - prev).toFixed(1)} pts</span><span class="ml">change</span></div>
      </div>
      <p class="m-src">IDEA Part B Exiting Collection, School Years 2014–15 and 2022–23.</p>`);
  }

  /* sex + age detail (drilldown from the Who exhibit) */
  function openSexModal(profile) {
    const d = I.DEMO[profile], tot = d.male + d.female, mp = d.male / tot * 100, fp = d.female / tot * 100;
    openModal(`<div class="m-kicker">By sex · ${profile === 'Autism' ? 'autism' : 'all disabilities'}</div><h3 class="m-title">Students served, by sex</h3>
      <div class="m-grid">
        <div><span class="mv">${I.nf(d.male)}</span><span class="ml">male (${mp.toFixed(1)}%)</span></div>
        <div><span class="mv">${I.nf(d.female)}</span><span class="ml">female (${fp.toFixed(1)}%)</span></div>
      </div>
      <p class="m-dek" style="margin-top:14px;font-size:13.5px">About ${mp.toFixed(0)} percent of ${profile === 'Autism' ? 'students served under autism' : 'all students served'} were reported male in School Year 2024–25.</p>
      <p class="m-src">IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25. Sex shares exclude a small number of records reported without sex.</p>`);
  }
  function openAgeModal(age, count, profile) {
    const d = I.DEMO[profile], ages = Object.keys(d.ages).map(Number).sort((a, b) => a - b);
    const total = ages.reduce((s, a) => s + d.ages[a], 0), share = count / total * 100;
    const counts = ages.map(a => d.ages[a]), peak = Math.max(...counts), peakAge = ages[counts.indexOf(peak)];
    openModal(`<div class="m-kicker">By age · ${profile === 'Autism' ? 'autism' : 'all disabilities'}</div><h3 class="m-title">Age ${age}</h3>
      <div class="m-grid">
        <div><span class="mv">${I.nf(count)}</span><span class="ml">served at age ${age} (2024–25)</span></div>
        <div><span class="mv">${share.toFixed(1)}%</span><span class="ml">of those served, ages 3–21</span></div>
      </div>
      <p class="m-dek" style="margin-top:14px;font-size:13.5px">Among ${profile === 'Autism' ? 'students served under autism' : 'all students served'}, the single year of age with the most students is age ${peakAge}.</p>
      <p class="m-src">IDEA Part B Child Count and Educational Environments Collection, School Year 2024–25.</p>`);
  }

  const startYears = I.YEARS.map(y => +y.slice(0, 4));
  const IDEA_MARKS = [
    { year: 1990, label: ['1990', 'Renamed IDEA'], row: 0 },
    { year: 1997, label: ['1997', 'IDEA amended'], row: 1 },
    { year: 2004, label: ['2004', 'Reauthorized'], row: 0 },
  ];

  /* ========================================================== *
   * EXHIBIT 1 · CHILD COUNT OVER TIME (count / % toggle)       *
   * ========================================================== */
  const riseBox = document.getElementById('chart-rise');
  let riseShown = false;
  function buildRise(unit) {
    riseBox.innerHTML = '';
    let chart;
    if (unit === 'rate') {
      const idx = I.ENROLL_PCT.map((v, i) => v == null ? null : i).filter(v => v != null);
      chart = C.lineChart({
        labels: idx.map(i => I.YEARS[i]), xs: idx.map(i => startYears[i]),
        xTicks: [1980, 1990, 2000, 2010, 2020],
        series: [{ values: idx.map(i => I.ENROLL_PCT[i]), color: P.greenD, area: true, areaOpacity: .12, highlight: true, endLabel: '15.2%' }],
        yMin: 0, yMax: 16, yTicks: 4, yFmt: v => v.toFixed(0) + '%', vmarkers: IDEA_MARKS,
        annotations: [{ atIndex: 0, value: I.ENROLL_PCT[0], text: ['1975: law enacted', '8.3% of enrollment'], dx: 8, dy: 24, anchor: 'start', color: P.navy }],
      });
      document.getElementById('riseTitle').textContent = 'Percentage of children and students ages 3 through 21 served under IDEA, Part B, of public school enrollment, by year: School year 1976–77 through 2022–23';
      document.getElementById('riseSub').textContent = 'Served as a percent of public-school enrollment, by school year.';
    } else {
      chart = C.lineChart({
        labels: I.YEARS, xs: startYears, xTicks: [1980, 1990, 2000, 2010, 2020, 2024],
        series: [{ values: I.ALL.map(v => v / 1000), color: P.greenD, area: true, areaOpacity: .12, highlight: true, endLabel: '8.2M' }],
        yMin: 0, yMax: 9, yTicks: 3, yFmt: v => v.toFixed(0) + 'M', vmarkers: IDEA_MARKS,
        annotations: [{ atIndex: 0, value: I.ALL[0] / 1000, text: ['1975: law enacted', 'first count, 3.7M'], dx: 8, dy: 26, anchor: 'start', color: P.navy }],
      });
      document.getElementById('riseTitle').textContent = 'Number of children and students ages 3 through 21 served under IDEA, Part B, by year: School year 1976–77 through 2024–25';
      document.getElementById('riseSub').textContent = 'Children and students served under IDEA, Part B, ages 3 through 21, in millions, by school year.';
    }
    riseBox.appendChild(chart.node);
    if (riseShown) chart.reveal(); else onView(riseBox, () => { riseShown = true; chart.reveal(); });
  }
  buildRise('count');
  document.getElementById('riseToggle').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    riseShown = true;
    document.querySelectorAll('#riseToggle button').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
    buildRise(b.dataset.unit);
  });
  expbar('chart-rise', 'idea-child-count-1976-2025', () => {
    const rows = [['School year', 'Served (ages 3-21)', 'Percent of public-school enrollment']];
    I.YEARS.forEach((y, i) => rows.push([y, I.ALL[i] * 1000, I.ENROLL_PCT[i] == null ? '' : I.ENROLL_PCT[i]]));
    return rows;
  });

  /* ========================================================== *
   * EXHIBIT 2 · CATEGORIES (fall 2023 share)                   *
   * ========================================================== */
  mount('chart-cats', C.barsH({
    onClick: d => openCatModal(d.label),
    labelW: 234, barH: 22, gap: 12, padR: 58,
    items: A.catShare.map(([k, v]) => ({
      label: k, value: v,
      color: k === 'Other disabilities combined' ? P.gray : P.green,
    })),
    xMax: 40, valueFmt: v => v.toFixed(1) + '%',
  }));
  expbar('chart-cats', 'idea-categories-fall-2023', [['Disability category', 'Percent of school-age served (fall 2023)'], ...A.catShare]);
  hint('chart-cats', 'Tap any category bar to open its profile');

  /* ========================================================== *
   * EXHIBIT 3 · AUTISM TREND                                    *
   * ========================================================== */
  (function () {
    const start = 3, labels = I.YEARS.slice(start), xs = startYears.slice(start);
    const others = ['Specific learning disability', 'Speech or language impairment', 'Other health impairment', 'Intellectual disability', 'Emotional disturbance', 'Developmental delay'];
    const series = others.map(k => ({ values: I.DIS[k].slice(start).map(v => v == null ? null : v / 1000), color: P.gray, width: 1.6 }));
    series.push({ values: I.DIS['Autism'].slice(start).map(v => v == null ? null : v / 1000), color: P.navy, width: 3.4, highlight: true, endLabel: 'Autism' });
    mount('chart-autism', C.lineChart({
      labels, xs, xTicks: [2000, 2008, 2012, 2016, 2020, 2024],
      series, yMin: 0, yMax: 3, yTicks: 3, yFmt: v => v.toFixed(0) + 'M',
    }));
    legend('autismLegend', [['Autism', P.navy, true], ['Other IDEA primary disability categories', P.gray, true]], t => { if (t === 'Autism') openCatModal('Autism'); });
    hint('chart-autism', 'Tap the Autism key for its detail');
    expbar('chart-autism', 'idea-categories-by-year', () => {
      const cats = Object.keys(I.DIS);
      const rows = [['School year'].concat(cats)];
      I.YEARS.forEach((y, i) => rows.push([y].concat(cats.map(k => I.DIS[k][i] == null ? '' : I.DIS[k][i] * 1000))));
      return rows;
    });
  })();

  /* ========================================================== *
   * EXHIBIT 4 · ENVIRONMENTS OVER TIME (stacked area)          *
   * ========================================================== */
  (function () {
    const yrs = I.ENV_LBL.map(y => +y.slice(0, 4)), tot = I.D.envTotal;
    const b80 = I.ENV['Inside regular class 80% or more of the day'];
    const b40 = I.ENV['Inside regular class 40% through 79% of the day'];
    const b0 = I.ENV['Inside regular class less than 40% of the day'];
    const sh = arr => arr.map((v, i) => +(v / tot[i] * 100).toFixed(2));
    const other = I.ENV_LBL.map((_, i) => +((tot[i] - b80[i] - b40[i] - b0[i]) / tot[i] * 100).toFixed(2));
    const series = [
      { name: 'Regular class, 80%+ of day', values: sh(b80), color: P.greenD },
      { name: '40\u201379% of day', values: sh(b40), color: P.green },
      { name: 'Less than 40% of day', values: sh(b0), color: P.greenL },
      { name: 'Other settings', values: other, color: P.sage },
    ];
    mount('chart-env', C.stackedArea({
      labels: I.ENV_LBL, xs: yrs, xTicks: [2012, 2015, 2018, 2021, 2024],
      series, yMax: 100, yTicks: 4, yFmt: v => v.toFixed(0) + '%', height: 340,
      onClick: ser => openEnvModal(ser.name),
    }));
    legend('envLegend', series.map(x => [x.name, x.color]), name => openEnvModal(name));
    hint('chart-env', 'Tap a band or a key below to open that setting');
    expbar('chart-env', 'idea-environments-over-time', () => {
      const rows = [['School year'].concat(series.map(x => x.name))];
      I.ENV_LBL.forEach((y, i) => rows.push([y].concat(series.map(x => x.values[i]))));
      return rows;
    });
  })();

  /* ========================================================== *
   * EXHIBIT 5 · ENVIRONMENTS BY CATEGORY (fall 2023)           *
   * ========================================================== */
  mount('chart-envcat', C.barsH({
    onClick: d => openCatModal(d.label),
    labelW: 236, barH: 18, gap: 9, padR: 54,
    items: A.inclByCat.map(([k, v]) => ({
      label: k, value: v, highlight: k === 'All disabilities',
      color: k === 'All disabilities' ? P.accent : P.green,
    })),
    xMax: 100, valueFmt: v => v.toFixed(1) + '%',
  }));
  expbar('chart-envcat', 'idea-inclusion-by-category-fall-2023', [['Disability category', 'Percent in regular class 80%+ (fall 2023)'], ...A.inclByCat]);
  hint('chart-envcat', 'Tap any category bar to open its profile');

  /* ========================================================== *
   * EXHIBIT 6 · WHO IS SERVED (sex / race / age toggle)        *
   * ========================================================== */
  (function () {
    let profile = 'All Disabilities';
    const sexBox = document.getElementById('chart-sex'), raceBox = document.getElementById('chart-race'), ageBox = document.getElementById('chart-age');
    const seen = {};
    let interacted = false;
    const fmtCount = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.round(v / 1e3) + 'k';
    function play(box, chart, key) {
      box.innerHTML = ''; box.appendChild(chart.node);
      if (interacted || seen[key]) chart.reveal();
      else onView(box, () => { seen[key] = true; chart.reveal(); });
    }
    function buildAll() {
      const d = I.DEMO[profile], tot = d.male + d.female;
      const mp = d.male / tot * 100, gp = d.female / tot * 100;
      play(sexBox, C.pictograph({ total: 10, a: Math.round(mp / 10), cols: 10, cell: 38, aColor: P.blue, bColor: P.purple }), 'sex');
      document.getElementById('whoSexSub').textContent =
        'Each figure \u2248 10% of students served, School Year 2024\u201325. Boys ' + mp.toFixed(0) + '% (blue), girls ' + gp.toFixed(0) + '% (purple).';
      const races = Object.keys(d.race).map(k => ({ k, v: d.race[k] })).sort((a, b) => b.v - a.v);
      play(raceBox, C.barsH({
        onClick: it => openRaceModal(it.key, profile),
        labelW: 200, barH: 19, gap: 9, padR: 58,
        items: races.map((r, i) => ({ label: I.RACE_LBL[r.k], value: r.v, color: i === 0 ? P.greenD : P.green, key: r.k })),
        xMax: profile === 'Autism' ? 500000 : 3700000, valueFmt: fmtCount,
      }), 'race');
      const ages = Object.keys(d.ages).map(Number).sort((a, b) => a - b);
      const counts = ages.map(a => d.ages[a]), pmax = Math.max(...counts), pAge = ages[counts.indexOf(pmax)];
      play(ageBox, C.columns({
        labels: ages.map(String), values: counts,
        yMax: profile === 'Autism' ? 120000 : 700000, yTicks: 3, yFmt: v => v === 0 ? '0' : (v / 1000).toFixed(0) + 'k',
        xEvery: 2, padL: 44, height: 300, onClick: d => openAgeModal(+d.label, d.value, profile),
        peakLabel: (pmax >= 1000 ? (pmax / 1000).toFixed(0) + 'k' : pmax) + ' at age ' + pAge,
      }), 'age');
    }
    buildAll();
    sexBox.style.cursor = 'pointer'; sexBox.setAttribute('role', 'button'); sexBox.tabIndex = 0;
    const fireSex = () => openSexModal(profile);
    sexBox.addEventListener('click', fireSex);
    sexBox.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fireSex(); } });
    hint('chart-sex', 'Tap the figure for the male and female split');
    hint('chart-age', 'Tap any age column for detail');
    document.getElementById('whoProfile').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      interacted = true;
      profile = b.dataset.p;
      document.querySelectorAll('#whoProfile button').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      buildAll();
    });
    expbar('chart-sex', 'idea-demographics', () => {
      const d = I.DEMO[profile], rows = [[profile + ' \u2014 School Year 2024-25'], [], ['Sex', 'Count'], ['Male', d.male], ['Female', d.female], [], ['Race/ethnicity', 'Count']];
      Object.keys(d.race).forEach(k => rows.push([I.RACE_LBL[k], d.race[k]]));
      rows.push([], ['Age', 'Count']);
      Object.keys(d.ages).forEach(a => rows.push([a, d.ages[a]]));
      return rows;
    });
    hint('chart-race', 'Tap a race or ethnicity bar for detail');
  })();

  /* ========================================================== *
   * EXHIBIT 7 · STATE TILE MAP                                  *
   * ========================================================== */
  (function () {
    const pct = {}, name = {}, cnt = {};
    I.STATES.forEach(r => { pct[r[1]] = r[6]; name[r[1]] = r[0]; cnt[r[1]] = r[5]; });
    const vals = Object.values(pct), min = Math.floor(Math.min(...vals)), max = Math.ceil(Math.max(...vals));
    const stops = [{ t: 0, color: '#eaf0e9' }, { t: .5, color: '#5aa377' }, { t: 1, color: '#0f3d2c' }];
    const map = window.USMAP
      ? C.choropleth({ values: pct, min, max, stops, fmt: v => v != null ? v.toFixed(1) + '%' : 'n/a', nameOf: a => name[a] || a, onClick: ab => openStateModal(ab) })
      : C.tileMap({ values: pct, min, max, stops, fmt: v => v.toFixed(1) + '%', nameOf: a => name[a] });
    const box = mount('chart-map', map);
    document.getElementById('mapRamp').style.background = `linear-gradient(90deg, ${stops.map(s => s.color + ' ' + (s.t * 100) + '%').join(', ')})`;
    document.getElementById('mapLo').textContent = min + '%';
    document.getElementById('mapHi').textContent = max + '%';
    const mapSel = document.getElementById('mapStateSel');
    if (mapSel) {
      I.STATES.slice().sort((a, b) => a[0].localeCompare(b[0])).forEach(r => mapSel.add(new Option(r[0], r[1])));
      mapSel.addEventListener('change', () => { if (mapSel.value) { openStateModal(mapSel.value); mapSel.value = ''; } });
    }
    const tip = document.getElementById('maptip');
    const show = (ab, x, y) => {
      tip.innerHTML = `<b>${name[ab]}</b><br>${pct[ab].toFixed(1)}% <span style="color:var(--faint)">of enrollment</span><br><span class="v">${I.nf(cnt[ab])}</span> students served`;
      tip.style.left = Math.min(window.innerWidth - 240, x + 14) + 'px'; tip.style.top = (y + 14) + 'px'; tip.classList.add('show');
    };
    const hide = () => tip.classList.remove('show');
    const tileSel = '.tile, path[data-abbr]';
    box.addEventListener('mousemove', e => { const g = e.target.closest(tileSel); g ? show(g.dataset.abbr, e.clientX, e.clientY) : hide(); });
    box.addEventListener('mouseleave', hide);
    box.querySelectorAll(tileSel).forEach(g => {
      if (g.classList.contains('tile')) g.addEventListener('click', () => openStateModal(g.dataset.abbr));
      g.addEventListener('focus', () => { const r = g.getBoundingClientRect(); show(g.dataset.abbr, r.left, r.bottom); });
      g.addEventListener('blur', hide);
    });
    expbar('chart-map', 'idea-by-state-2022-23', [['State', 'Abbr', 'Percent of enrollment (2022-23)', 'Served (2024-25)'], ...I.STATES.map(r => [r[0], r[1], r[6], r[5]])]);
    hint('chart-map', 'Tap any state for its snapshot');
  })();

  /* ========================================================== *
   * EXHIBIT 8 · PART C DONUT                                    *
   * ========================================================== */
  (function () {
    const cols = { 'Home': P.greenD, 'Community-based setting': P.green, 'Other setting': P.greenL };
    const segs = A.partcSettings.map(([k, v]) => ({ name: k, value: v, color: cols[k] }));
    mount('chart-partc', C.donut({
      size: 300, stroke: 46, segments: segs, onClick: seg => openPartcModal(seg.name, seg.value),
      centerValue: A.partcTotal, centerFmt: v => Math.round(v / 1000) + 'K', centerSub: 'infants & toddlers',
    }));
    const lg = document.getElementById('partcLegend'); lg.innerHTML = '';
    segs.forEach(seg => {
      const row = document.createElement('div'); row.className = 'partc-row'; row.tabIndex = 0; row.setAttribute('role', 'button');
      row.style.cssText = 'display:flex;align-items:baseline;gap:13px;padding:15px 0;border-bottom:1px solid var(--line);cursor:pointer';
      row.innerHTML = `<span style="width:13px;height:13px;border-radius:4px;flex:none;background:${seg.color};transform:translateY(2px)"></span>
        <span style="flex:1"><b style="font-family:var(--font-display);font-weight:700">${seg.name}</b><br>
        <span style="color:var(--muted);font-size:13px">about ${I.nf(Math.round(A.partcTotal * seg.value / 100))} children</span></span>
        <span style="font-family:var(--font-display);font-weight:800;font-size:24px;letter-spacing:-.02em">${seg.value}%</span>`;
      const fire = () => openPartcModal(seg.name, seg.value);
      row.addEventListener('click', fire);
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      lg.appendChild(row);
    });
    expbar('chart-partc', 'idea-partc-settings-fall-2023', [['Primary early intervention setting', 'Percent (fall 2023)'], ...A.partcSettings]);
    hint('chart-partc', 'Tap a slice or a setting for detail');
  })();

  /* ========================================================== *
   * EXHIBIT 9 · EXITING (graduation vs dropout, dumbbell)      *
   * ========================================================== */
  (function () {
    mount('chart-exit', C.dumbbell({
      labelW: 240, rowH: 64, ticks: 4, xMin: 0, xMax: 100, aColor: P.greenL, bColor: P.greenD,
      onClick: it => openExitModal(it.label),
      items: [
        { label: 'Graduated, regular diploma', a: A.exit.gradPrev, b: A.exit.gradDiplomaPct, showA: true },
        { label: 'Dropped out', a: A.exit.dropoutPrev, b: A.exit.dropoutPct },
      ],
      showValues: true, valueFmt: v => v.toFixed(1) + '%',
    }));
    legend('exitLegend', [['School Year 2014\u201315', P.greenL], ['School Year 2022\u201323', P.greenD]]);
    hint('chart-exit', 'Tap a row for the graduation or dropout trend');
    expbar('chart-exit', 'idea-exiting-grad-dropout', [['Category', '2014-15 %', '2022-23 %'], ['Graduated, regular diploma', A.exit.gradPrev, A.exit.gradDiplomaPct], ['Dropped out', A.exit.dropoutPrev, A.exit.dropoutPct]]);
  })();

  /* ========================================================== *
   * TWEAKS PANEL                                               *
   * ========================================================== */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "#cf6b35",
    "headline": "Archivo",
    "bg": "#f4f4ef"
  }/*EDITMODE-END*/;
  (function () {
    const t = Object.assign({}, TWEAK_DEFAULTS), root = document.documentElement.style;
    const apply = () => {
      root.setProperty('--accent', t.accent);
      root.setProperty('--font-display', t.headline === 'serif' ? 'Georgia' : 'Archivo');
      root.setProperty('--cream', t.bg);
    };
    apply();
    const panel = document.createElement('div'); panel.id = 'tweaks';
    panel.innerHTML = `
      <div class="tk-head"><b>Tweaks</b><button class="tk-x" aria-label="Close">\u00d7</button></div>
      <div class="tk-body">
        <div class="tk-sec">Highlight color</div>
        <div class="tk-row"><div class="tk-sw" data-key="accent">
          ${['#cf6b35', '#2a5fb0', '#7a4fa3', '#2f8f57'].map(c => `<button data-v="${c}" style="background:${c}"></button>`).join('')}</div></div>
        <div class="tk-sec">Headline type</div>
        <div class="tk-row"><div class="tk-segs" data-key="headline">
          <button data-v="Archivo">Grotesk</button><button data-v="serif">Serif</button></div></div>
        <div class="tk-sec">Background</div>
        <div class="tk-row"><div class="tk-segs" data-key="bg">
          <button data-v="#f4f4ef">Warm</button><button data-v="#ffffff">White</button></div></div>
      </div>`;
    document.body.appendChild(panel);
    const syncUI = () => {
      panel.querySelectorAll('.tk-sw[data-key="accent"] button').forEach(b => b.classList.toggle('on', b.dataset.v.toLowerCase() === t.accent.toLowerCase()));
      panel.querySelectorAll('.tk-segs').forEach(seg => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === t[seg.dataset.key])));
    };
    syncUI();
    const set = (key, v) => { t[key] = v; apply(); syncUI(); window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: v } }, '*'); };
    panel.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) set(b.parentElement.dataset.key, b.dataset.v); });
    panel.querySelector('.tk-x').addEventListener('click', () => { panel.classList.remove('show'); window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); });
    window.addEventListener('message', e => {
      const ty = e.data && e.data.type;
      if (ty === '__activate_edit_mode') panel.classList.add('show');
      else if (ty === '__deactivate_edit_mode') panel.classList.remove('show');
    });
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    const head = panel.querySelector('.tk-head');
    head.addEventListener('mousedown', e => {
      const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const move = ev => { panel.style.left = (ev.clientX - dx) + 'px'; panel.style.top = (ev.clientY - dy) + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto'; };
      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    });
  })();

  /* hero stats jump to their exhibit */
  (function () {
    const targets = ['#rise', '#partc', '#env'];
    document.querySelectorAll('.hero-stats .hstat').forEach((el, i) => {
      const sel = targets[i]; if (!sel || !document.querySelector(sel)) return;
      el.classList.add('hstat-link'); el.tabIndex = 0; el.setAttribute('role', 'link');
      const go = () => document.querySelector(sel).scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  })();

  /* shared helpers + drilldowns, for builder.js and extra.js */
  window.IDEAStory = {
    onView, mount, legend, hint, expbar, swatch,
    openModal, openStateModal, openCatModal, openEnvModal, openRaceModal, openPartcModal, openExitModal,
  };
})();
