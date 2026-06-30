/* ============================================================
   charts.js — small hand-built animated SVG chart kit.
   Every builder returns { node, reveal } :
     node    an <svg> (or wrapper) to drop into the page
     reveal() plays the entrance animation once, when scrolled in
   No chart library, no canvas — just SVG + CSS transitions so the
   markup stays readable and easy to edit.
   ============================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const P = window.IDEA.PAL;

  /* tiny element helper */
  function mk(tag, attrs, kids) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach(c => c && e.appendChild(c));
    return e;
  }
  function svgRoot(w, h, cls) {
    const s = mk('svg', { viewBox: `0 0 ${w} ${h}`, class: 'cv ' + (cls || ''),
      preserveAspectRatio: 'xMidYMid meet', role: 'img' });
    s.style.width = '100%'; s.style.height = 'auto'; s.style.overflow = 'visible';
    return s;
  }
  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* make any SVG node behave like a button: pointer cursor, keyboard focus,
     a native tooltip, and click/Enter/Space firing the same handler. */
  function clickify(node, tip, fire) {
    node.classList.add('cv-click');
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    if (tip) {
      node.setAttribute('aria-label', tip);
      const t = mk('title'); t.textContent = tip; node.appendChild(t);
    }
    node.addEventListener('click', fire);
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  }

  /* count-up number animation */
  function countUp(el, to, fmt, dur) {
    fmt = fmt || (v => Math.round(v).toLocaleString('en-US'));
    if (reduced()) { el.textContent = fmt(to); return; }
    dur = dur || 1100;
    const t0 = performance.now();
    function step(t) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(to * e);
      if (k < 1) requestAnimationFrame(step);
      else el.textContent = fmt(to);
    }
    requestAnimationFrame(step);
  }

  function niceMax(v) {
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * pow;
  }

  /* ---------------------------------------------------------- *
   * LINE CHART (multi-series, optional area fill)              *
   * ---------------------------------------------------------- */
  function lineChart(opts) {
    const w = opts.width || 820, h = opts.height || 404;
    const padL = opts.padL ?? 52, padR = opts.padR ?? 18, padT = 16, padB = 38;
    const labels = opts.labels;
    const n = labels.length;
    const yMax = opts.yMax || niceMax(Math.max(...opts.series.flatMap(s => s.values.filter(v => v != null))));
    const yMin = opts.yMin || 0;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const xs = opts.xs;                 // optional numeric x (e.g., year) per point
    const xMinV = xs ? Math.min(...xs) : 0, xMaxV = xs ? Math.max(...xs) : (n - 1);
    const xVal = v => padL + ((v - xMinV) / (xMaxV - xMinV || 1)) * plotW;
    const x = i => xs ? xVal(xs[i]) : padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = v => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    const s = svgRoot(w, h, 'cv-line');

    // y gridlines + labels
    const ticks = opts.yTicks || 4;
    const tickEls = [];
    for (let t = 0; t <= ticks; t++) {
      const val = yMin + (yMax - yMin) * (t / ticks);
      const yy = y(val);
      s.appendChild(mk('line', { x1: padL, x2: w - padR, y1: yy, y2: yy,
        stroke: P.line, 'stroke-width': 1 }));
      const lab = mk('text', { x: padL - 8, y: yy + 3.5, 'text-anchor': 'end',
        class: 'cv-axt', text: (opts.yFmt || (v => Math.round(v).toLocaleString()))(val) });
      s.appendChild(lab); tickEls.push(lab);
    }
    // x labels (time-tick mode when xs+xTicks given, else every-n index labels)
    if (xs && opts.xTicks) {
      opts.xTicks.forEach(yr => s.appendChild(mk('text', { x: xVal(yr), y: h - 12,
        'text-anchor': 'middle', class: 'cv-axt', text: String(yr) })));
    } else {
      const every = opts.xEvery || Math.ceil(n / 8);
      for (let i = 0; i < n; i++) {
        if (i % every !== 0 && i !== n - 1) continue;
        s.appendChild(mk('text', { x: x(i), y: h - 12, 'text-anchor': 'middle',
          class: 'cv-axt', text: labels[i] }));
      }
    }
    const markers = [];

    const paths = [], fills = [], dots = [];
    opts.series.forEach(ser => {
      const pts = ser.values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
      if (!pts.length) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      if (ser.area) {
        const f = mk('path', { d: d + ` L${pts[pts.length-1][0].toFixed(1)} ${y(yMin)} L${pts[0][0].toFixed(1)} ${y(yMin)} Z`,
          fill: ser.color, 'fill-opacity': ser.areaOpacity ?? 0.14, stroke: 'none' });
        f.style.opacity = 0; s.appendChild(f); fills.push(f);
      }
      const path = mk('path', { d, fill: 'none', stroke: ser.color,
        'stroke-width': ser.width || (ser.highlight ? 3.4 : 2),
        'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      if (ser.dash) path.setAttribute('stroke-dasharray', ser.dash);
      s.appendChild(path); paths.push(path);
      // end dot + inline label for highlighted series
      if (ser.highlight || ser.dot) {
        const last = pts[pts.length - 1];
        const dot = mk('circle', { cx: last[0], cy: last[1], r: 4.5, fill: ser.color });
        dot.style.opacity = 0; s.appendChild(dot); dots.push(dot);
        if (ser.endLabel) {
          const tx = mk('text', { x: last[0] - 6, y: last[1] - 9, 'text-anchor': 'end',
            class: 'cv-end', fill: ser.color, text: ser.endLabel });
          tx.style.opacity = 0; s.appendChild(tx); dots.push(tx);
        }
      }
    });

    // milestone markers: a dot on the curve with a year + note tucked beneath it
    const mser = opts.series[opts.markerSeries || 0] || { values: [] };
    const valAt = yr => {
      if (!xs) return null;
      for (let i = 1; i < xs.length; i++) if (xs[i] >= yr) {
        const v0 = mser.values[i - 1], v1 = mser.values[i];
        if (v0 == null || v1 == null) return null;
        return v0 + (v1 - v0) * ((yr - xs[i - 1]) / (xs[i] - xs[i - 1] || 1));
      }
      return mser.values[mser.values.length - 1];
    };
    (opts.vmarkers || []).forEach(m => {
      const mx = xs ? xVal(m.year) : x(m.frac);
      const cv = valAt(m.year), cy = cv == null ? padT + 10 : y(cv);
      const g = mk('g', { class: 'cv-vmark' });
      g.appendChild(mk('circle', { cx: mx, cy, r: 4, fill: m.color || P.navy, stroke: P.cream, 'stroke-width': 2 }));
      (m.label || []).forEach((ln, i) => g.appendChild(mk('text', { x: mx, y: cy + 18 + i * 13, 'text-anchor': 'middle', class: i ? 'cv-vmark-sub' : 'cv-vmark-t', text: ln })));
      g.style.opacity = 0; s.appendChild(g); markers.push(g);
    });

    // annotations {atIndex, value, text:[lines], color, anchor}
    const annos = [];
    (opts.annotations || []).forEach(a => {
      const ax = x(a.atIndex), ay = y(a.value);
      const dot = mk('circle', { cx: ax, cy: ay, r: 4, fill: a.color || P.ink });
      const g = mk('g', { class: 'cv-anno' });
      g.appendChild(dot);
      (a.text || []).forEach((ln, i) => {
        g.appendChild(mk('text', { x: ax + (a.dx ?? 8), y: ay + (a.dy ?? -10) + i * 14,
          'text-anchor': a.anchor || 'start', class: i ? 'cv-anno-sub' : 'cv-anno-t',
          text: ln }));
      });
      g.style.opacity = 0; s.appendChild(g); annos.push(g);
    });

    let played = false;
    function reveal() {
      if (played) return; played = true;
      const drawDur = 1500, pStag = 140, rm = reduced();
      paths.forEach((p, i) => {
        if (rm) return;
        const L = p.getTotalLength();
        p.style.transition = 'none';
        const base = p.getAttribute('stroke-dasharray');
        p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        // keep dashed styling for dashed lines after draw
        void p.getBoundingClientRect();
        p.style.transition = `stroke-dashoffset ${drawDur}ms cubic-bezier(.33,.08,.24,1) ${i * pStag}ms`;
        p.style.strokeDashoffset = 0;
        if (base) setTimeout(() => { p.style.strokeDasharray = base; }, drawDur + 60 + i * pStag);
      });
      // when the last line finishes drawing
      const lastDone = rm ? 0 : drawDur + (paths.length - 1) * pStag;
      // area fills wipe in left-to-right, in lockstep with the line being drawn
      fills.forEach(f => {
        f.style.opacity = f.getAttribute('fill-opacity') || 1;
        if (rm) { f.style.clipPath = 'none'; return; }
        f.style.clipPath = 'inset(0 100% 0 0)';
        void f.getBoundingClientRect();
        f.style.transition = `clip-path ${drawDur}ms cubic-bezier(.33,.08,.24,1)`;
        f.style.clipPath = 'inset(0 -1% 0 0)';
      });
      // end dots + labels land with the line tip; markers and annotations follow
      [...dots, ...markers, ...annos].forEach((d, i) => {
        d.style.transition = `opacity .5s ease ${lastDone + (rm ? 0 : i * 80)}ms`;
        d.style.opacity = 1;
      });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * HORIZONTAL BARS                                            *
   * ---------------------------------------------------------- */
  function barsH(opts) {
    const items = opts.items;
    const w = opts.width || 820;
    const labelW = opts.labelW ?? 210;
    const barH = opts.barH ?? 26, gap = opts.gap ?? 16, padT = 6, padB = 4;
    const rowH = barH + gap;
    const h = padT + items.length * rowH + padB;
    const xMax = opts.xMax || niceMax(Math.max(...items.map(d => d.value)));
    const plotW = w - labelW - (opts.padR ?? 64);
    const scale = v => (v / xMax) * plotW;
    const fmt = opts.valueFmt || (v => Math.round(v).toLocaleString());
    const s = svgRoot(w, h, 'cv-bars');
    const anim = [];
    items.forEach((d, i) => {
      const yTop = padT + i * rowH;
      const cy = yTop + barH / 2;
      const row = mk('g', { class: 'cv-row' + (opts.onClick ? ' click' : '') });
      row.appendChild(mk('text', { x: labelW - 12, y: cy + 4, 'text-anchor': 'end',
        class: d.highlight ? 'cv-rowlab hi' : 'cv-rowlab', text: d.label }));
      row.appendChild(mk('rect', { x: labelW, y: yTop, width: plotW, height: barH, rx: 3, fill: P.line, 'fill-opacity': .5 }));
      const fullW = Math.max(2, scale(d.value));
      const bar = mk('rect', { x: labelW, y: yTop, width: 0, height: barH, rx: 3, class: 'cv-bar',
        fill: d.color || (d.highlight ? P.accent : P.green) });
      row.appendChild(bar);
      const inside = false;   // always place the value label outside the bar, in ink (no white-on-bar)
      const val = mk('text', { x: labelW + fullW + 10, y: cy + 4,
        'text-anchor': 'start', class: 'cv-barval',
        fill: P.ink, text: '' });
      val.style.opacity = 0; row.appendChild(val);
      if (opts.onClick) {
        row.appendChild(mk('rect', { x: 0, y: yTop, width: w, height: barH, fill: 'transparent' }));
        row.setAttribute('tabindex', '0'); row.setAttribute('role', 'button');
        const fire = () => opts.onClick(d, i);
        row.addEventListener('click', fire);
        row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      }
      s.appendChild(row);
      anim.push({ bar, fullW, val, value: d.value });
    });
    let played = false;
    function reveal() {
      if (played) return; played = true;
      anim.forEach((a, i) => {
        const delay = reduced() ? 0 : i * 80;
        a.bar.style.transition = `width 1s cubic-bezier(.22,.61,.36,1) ${delay}ms`;
        requestAnimationFrame(() => { a.bar.style.width = a.fullW; });
        setTimeout(() => { a.val.style.opacity = 1; countUp(a.val, a.value, fmt, 900); },
          delay + (reduced() ? 0 : 350));
      });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * DUMBBELL (two points per row, connected)                  *
   * ---------------------------------------------------------- */
  function dumbbell(opts) {
    const items = opts.items; // {label, a, b, sub}
    const w = opts.width || 820, labelW = opts.labelW ?? 210;
    const rowH = opts.rowH ?? 40, padT = 28, padB = 26;
    const h = padT + items.length * rowH + padB;
    const xMin = opts.xMin ?? 0, xMax = opts.xMax || niceMax(Math.max(...items.flatMap(d => [d.a, d.b])));
    const plotW = w - labelW - (opts.padR ?? 60);
    const X = v => labelW + ((v - xMin) / (xMax - xMin)) * plotW;
    const s = svgRoot(w, h, 'cv-dumbbell');
    // axis ticks
    const ticks = opts.ticks || 4;
    for (let t = 0; t <= ticks; t++) {
      const v = xMin + (xMax - xMin) * t / ticks, xx = X(v);
      s.appendChild(mk('line', { x1: xx, x2: xx, y1: padT - 8, y2: h - padB + 4, stroke: P.line }));
      s.appendChild(mk('text', { x: xx, y: h - padB + 18, 'text-anchor': 'middle',
        class: 'cv-axt', text: (opts.valueFmt || (v => Math.round(v).toLocaleString()))(v) }));
    }
    const anim = [];
    items.forEach((d, i) => {
      const cy = padT + i * rowH + rowH / 2;
      s.appendChild(mk('text', { x: labelW - 12, y: cy + 4, 'text-anchor': 'end',
        class: d.highlight ? 'cv-rowlab hi' : 'cv-rowlab', text: d.label }));
      const line = mk('line', { x1: X(d.a), y1: cy, x2: X(d.a), y2: cy,
        stroke: d.highlight ? P.accent : P.green, 'stroke-width': 3, 'stroke-linecap': 'round' });
      s.appendChild(line);
      const c1 = mk('circle', { cx: X(d.a), cy, r: 5.5, fill: opts.aColor || P.greenL, stroke: P.cream, 'stroke-width': 1.5 });
      const c2 = mk('circle', { cx: X(d.a), cy, r: 6.5, fill: d.highlight ? P.accent : (opts.bColor || P.greenD), stroke: P.cream, 'stroke-width': 1.5 });
      c1.style.opacity = 0; c2.style.opacity = 0;
      s.appendChild(c1); s.appendChild(c2);
      const rec = { line, c1, c2, toX: X(d.b) };
      if (opts.showValues) {
        const fmtV = opts.valueFmt || (v => Math.round(v).toLocaleString());
        const va = mk('text', { x: X(d.a), y: cy - 12, 'text-anchor': 'middle', class: 'cv-dbval', fill: P.green, text: fmtV(d.a) });
        const vb = mk('text', { x: X(d.b), y: cy + 19, 'text-anchor': 'middle', class: 'cv-dbval', fill: P.greenD, text: fmtV(d.b) });
        va.style.opacity = 0; vb.style.opacity = 0; s.appendChild(va); s.appendChild(vb);
        rec.va = va; rec.vb = vb;
      }
      anim.push(rec);
    });
    if (opts.onClick) items.forEach((d, i) => {
      const hit = mk('rect', { x: 0, y: padT + i * rowH, width: w, height: rowH, fill: 'transparent' });
      clickify(hit, d.label, () => opts.onClick(d, i));
      s.appendChild(hit);
    });
    let played = false;
    function reveal() {
      if (played) return; played = true;
      anim.forEach((a, i) => {
        const delay = reduced() ? 0 : 120 + i * 70;
        a.c1.style.transition = `opacity .4s ease ${delay}ms`; a.c1.style.opacity = 1;
        if (a.va) { a.va.style.transition = `opacity .4s ease ${delay}ms`; a.va.style.opacity = 1; }
        a.line.style.transition = `all .9s cubic-bezier(.22,.61,.36,1) ${delay}ms`;
        a.c2.style.transition = `opacity .4s ease ${delay}ms, cx .9s cubic-bezier(.22,.61,.36,1) ${delay}ms`;
        if (a.vb) a.vb.style.transition = `opacity .5s ease ${delay + 450}ms`;
        requestAnimationFrame(() => {
          a.line.setAttribute('x2', a.toX);
          a.c2.setAttribute('cx', a.toX);
          a.c2.style.opacity = 1;
          if (a.vb) a.vb.style.opacity = 1;
        });
      });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * DONUT                                                      *
   * ---------------------------------------------------------- */
  function donut(opts) {
    const size = opts.size || 300, sw = opts.stroke || 40, r = (size - sw) / 2 - 4;
    const cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
    const total = opts.segments.reduce((s, d) => s + d.value, 0);
    const s = svgRoot(size, size, 'cv-donut');
    s.appendChild(mk('circle', { cx, cy, r, fill: 'none', stroke: P.line, 'stroke-width': sw }));
    let acc = 0; const arcs = [];
    opts.segments.forEach(seg => {
      const frac = seg.value / total;
      const arc = mk('circle', { cx, cy, r, fill: 'none', stroke: seg.color,
        'stroke-width': sw, 'stroke-dasharray': `${C} ${C}`, 'stroke-dashoffset': C,
        transform: `rotate(${-90 + acc * 360} ${cx} ${cy})`, 'stroke-linecap': 'butt' });
      s.appendChild(arc);
      arcs.push({ arc, len: C * frac, C });
      acc += frac;
    });
    // clickable pie wedges (transparent), drawn under the centre label
    if (opts.onClick) {
      let wacc = 0;
      opts.segments.forEach((seg, si) => {
        const f0 = wacc, f1 = wacc + seg.value / total; wacc = f1;
        const a0 = -Math.PI / 2 + f0 * 2 * Math.PI, a1 = -Math.PI / 2 + f1 * 2 * Math.PI;
        const rr = r + sw / 2;
        const x0 = cx + rr * Math.cos(a0), y0 = cy + rr * Math.sin(a0);
        const x1 = cx + rr * Math.cos(a1), y1 = cy + rr * Math.sin(a1);
        const large = (f1 - f0) > 0.5 ? 1 : 0;
        const wedge = mk('path', { d: `M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${rr} ${rr} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`, fill: 'transparent' });
        clickify(wedge, seg.name || '', () => opts.onClick(seg, si));
        s.appendChild(wedge);
      });
    }
    const big = mk('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'cv-donut-big', text: '' });
    const sub = mk('text', { x: cx, y: cy + 20, 'text-anchor': 'middle', class: 'cv-donut-sub', text: opts.centerSub || '' });
    s.appendChild(big); s.appendChild(sub);
    let played = false;
    function reveal() {
      if (played) return; played = true;
      arcs.forEach((a, i) => {
        a.arc.style.transition = reduced() ? 'none' : `stroke-dashoffset 1s cubic-bezier(.4,0,.2,1) ${i * 200}ms`;
        requestAnimationFrame(() => { a.arc.style.strokeDashoffset = a.C - a.len; });
      });
      if (opts.centerValue != null) countUp(big, opts.centerValue, opts.centerFmt, 1100);
      else big.textContent = opts.centerBig || '';
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * TILE-GRID MAP (statebins)                                  *
   * ---------------------------------------------------------- */
  const GRID = {
    AK:[0,0], ME:[0,11], VT:[1,10], NH:[1,11],
    WA:[2,1], ID:[2,2], MT:[2,3], ND:[2,4], MN:[2,5], IL:[2,6], WI:[2,7], MI:[2,8], NY:[2,10], MA:[2,11],
    OR:[3,1], NV:[3,2], WY:[3,3], SD:[3,4], IA:[3,5], IN:[3,6], OH:[3,7], PA:[3,8], NJ:[3,9], CT:[3,10], RI:[3,11],
    CA:[4,1], UT:[4,2], CO:[4,3], NE:[4,4], MO:[4,5], KY:[4,6], WV:[4,7], VA:[4,8], MD:[4,9], DE:[4,10],
    AZ:[5,2], NM:[5,3], KS:[5,4], AR:[5,5], TN:[5,6], NC:[5,7], SC:[5,8], DC:[5,9],
    OK:[6,4], LA:[6,5], MS:[6,6], AL:[6,7], GA:[6,8],
    HI:[7,0], TX:[7,3], FL:[7,8],
  };
  function tileMap(opts) {
    const rows = 8, cols = 12, cell = 52, gap = 6, padT = 6;
    const w = cols * cell, h = rows * cell + padT;
    const s = svgRoot(w, h, 'cv-map');
    const vals = opts.values; // {abbr: value}
    const stops = opts.stops; // [{t, color}] from 0..1
    const min = opts.min, max = opts.max;
    const colorFor = v => {
      const t = Math.max(0, Math.min(1, (v - min) / (max - min)));
      return lerpStops(stops, t);
    };
    const tiles = [];
    Object.keys(GRID).forEach(ab => {
      const [r, c] = GRID[ab];
      const xx = c * cell, yy = padT + r * cell;
      const v = vals[ab];
      const g = mk('g', { class: 'tile', tabindex: 0, role: 'img',
        'aria-label': `${opts.nameOf ? opts.nameOf(ab) : ab}: ${opts.fmt ? opts.fmt(v) : v}` });
      const rect = mk('rect', { x: xx, y: yy, width: cell - gap, height: cell - gap, rx: 5,
        fill: v == null ? P.line : colorFor(v) });
      rect.style.opacity = 0; rect.style.transformBox = 'fill-box'; rect.style.transformOrigin = 'center';
      const t = mk('text', { x: xx + (cell - gap) / 2, y: yy + (cell - gap) / 2 + 4, 'text-anchor': 'middle',
        class: 'cv-tilet', fill: v != null && colorContrast(colorFor(v)) ? '#fff' : P.ink, text: ab });
      t.style.opacity = 0;
      g.appendChild(rect); g.appendChild(t);
      g.dataset.abbr = ab;
      s.appendChild(g);
      tiles.push({ g, rect, t });
    });
    let played = false;
    function reveal() {
      if (played) return; played = true;
      tiles.forEach((tl, i) => {
        const d = reduced() ? 0 : 40 + (i % 12) * 25 + Math.floor(i / 12) * 60;
        tl.rect.style.transition = `opacity .5s ease ${d}ms`;
        tl.t.style.transition = `opacity .5s ease ${d + 120}ms`;
        requestAnimationFrame(() => { tl.rect.style.opacity = 1; tl.t.style.opacity = 1; });
      });
    }
    return { node: s, reveal, tiles };
  }

  function lerpStops(stops, t) {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i].t) {
        const a = stops[i - 1], b = stops[i];
        const k = (t - a.t) / (b.t - a.t || 1);
        return lerpHex(a.color, b.color, k);
      }
    }
    return stops[stops.length - 1].color;
  }
  function lerpHex(h1, h2, k) {
    const a = hx(h1), b = hx(h2);
    const r = Math.round(a[0] + (b[0] - a[0]) * k);
    const g = Math.round(a[1] + (b[1] - a[1]) * k);
    const bl = Math.round(a[2] + (b[2] - a[2]) * k);
    return `rgb(${r},${g},${bl})`;
  }
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
  function colorContrast(c) {
    let r, g, b;
    if (c.startsWith('rgb')) { [r, g, b] = c.match(/\d+/g).map(Number); }
    else { [r, g, b] = hx(c); }
    return (0.299 * r + 0.587 * g + 0.114 * b) < 150; // true => dark bg => use white text
  }

  /* ---------------------------------------------------------- *
   * STACKED AREA (100% composition over time, wipe reveal)     *
   * ---------------------------------------------------------- */
  function stackedArea(opts) {
    const w = opts.width || 820, padL = opts.padL ?? 44, padR = opts.padR ?? 16, padT = 14, padB = 34;
    const h = opts.height || 340, n = opts.labels.length, xs = opts.xs;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const xMinV = xs ? Math.min(...xs) : 0, xMaxV = xs ? Math.max(...xs) : n - 1;
    const X = i => xs ? padL + ((xs[i] - xMinV) / (xMaxV - xMinV || 1)) * plotW : padL + (i / (n - 1)) * plotW;
    const Xv = yr => padL + ((yr - xMinV) / (xMaxV - xMinV || 1)) * plotW;
    const yMax = opts.yMax || 100, Y = v => padT + plotH - (v / yMax) * plotH;
    const s = svgRoot(w, h, 'cv-stack');
    const ticks = opts.yTicks || 4;
    for (let t = 0; t <= ticks; t++) {
      const val = yMax * t / ticks, yy = Y(val);
      s.appendChild(mk('line', { x1: padL, x2: w - padR, y1: yy, y2: yy, stroke: P.line }));
      s.appendChild(mk('text', { x: padL - 8, y: yy + 3.5, 'text-anchor': 'end', class: 'cv-axt', text: (opts.yFmt || (v => v))(val) }));
    }
    (opts.xTicks || []).forEach(yr => s.appendChild(mk('text', { x: Xv(yr), y: h - 12, 'text-anchor': 'middle', class: 'cv-axt', text: String(yr) })));
    const clipId = 'sc' + Math.random().toString(36).slice(2);
    const clip = mk('clipPath', { id: clipId });
    const cr = mk('rect', { x: padL, y: 0, width: 0, height: h });
    clip.appendChild(cr); s.appendChild(clip);
    const areaG = mk('g', { 'clip-path': `url(#${clipId})` });
    const cum = new Array(n).fill(0);
    opts.series.forEach((ser, si) => {
      const top = [], bot = [];
      for (let i = 0; i < n; i++) { const y0 = cum[i], y1 = cum[i] + ser.values[i]; bot.push([X(i), Y(y0)]); top.push([X(i), Y(y1)]); cum[i] = y1; }
      const d = 'M' + top.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ') + ' L ' + bot.reverse().map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ') + ' Z';
      const band = mk('path', { d, fill: ser.color, 'fill-opacity': ser.opacity ?? 0.92 });
      if (opts.onClick) clickify(band, ser.name || '', () => opts.onClick(ser, si));
      areaG.appendChild(band);
    });
    s.appendChild(areaG);
    let played = false;
    function reveal() {
      if (played) return; played = true;
      if (reduced()) { cr.setAttribute('width', plotW); return; }
      const t0 = performance.now(), dur = 1100;
      (function step(t) { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        cr.setAttribute('width', (plotW * e).toFixed(1)); if (k < 1) requestAnimationFrame(step); })(t0);
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * COLUMNS (vertical histogram, grows up; peak highlighted)   *
   * ---------------------------------------------------------- */
  function columns(opts) {
    const w = opts.width || 820, padL = opts.padL ?? 44, padR = opts.padR ?? 14, padT = opts.padT ?? 26, padB = 28;
    const h = opts.height || 300, labels = opts.labels, vals = opts.values, n = vals.length;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const yMax = opts.yMax || niceMax(Math.max(...vals)), Y = v => padT + plotH - (v / yMax) * plotH;
    const s = svgRoot(w, h, 'cv-cols');
    const ticks = opts.yTicks || 3;
    for (let t = 0; t <= ticks; t++) {
      const val = yMax * t / ticks, yy = Y(val);
      s.appendChild(mk('line', { x1: padL, x2: w - padR, y1: yy, y2: yy, stroke: P.line }));
      s.appendChild(mk('text', { x: padL - 8, y: yy + 3.5, 'text-anchor': 'end', class: 'cv-axt', text: (opts.yFmt || (v => v))(val) }));
    }
    const step = plotW / n, bw = step * 0.66, every = opts.xEvery || 2;
    const maxIdx = vals.indexOf(Math.max(...vals));
    const peak = opts.highlight != null ? opts.highlight : -1;   // no auto-accent unless explicitly asked
    const bars = [], valLabels = [];
    const colFmt = opts.valueFmt || opts.yFmt || (v => Math.round(v).toLocaleString());
    for (let i = 0; i < n; i++) {
      const cx = padL + step * i + step / 2, bh = Math.max(1, (vals[i] / yMax) * plotH), top = padT + plotH - bh;
      const fillC = opts.colors ? opts.colors[i] : (i === peak ? P.accent : P.green);
      const rect = mk('rect', { x: cx - bw / 2, y: top, width: bw, height: bh, rx: 2.5, fill: fillC });
      rect.style.transformBox = 'fill-box'; rect.style.transformOrigin = 'bottom'; rect.style.transform = 'scaleY(0)';
      s.appendChild(rect); bars.push(rect);
      if (vals[i] > 0 && !(opts.peakLabel && i === maxIdx)) {   // value label above each bar, in ink
        const vl = mk('text', { x: cx, y: top - 5, 'text-anchor': 'middle', class: 'cv-colval', fill: P.ink, text: colFmt(vals[i]) });
        vl.style.opacity = 0; s.appendChild(vl); valLabels.push(vl);
      }
      if (i % every === 0 || i === n - 1) s.appendChild(mk('text', { x: cx, y: h - 10, 'text-anchor': 'middle', class: 'cv-axt', text: labels[i] }));
    }
    // clickable full-height hit columns, layered on top so the whole column is a target
    if (opts.onClick) {
      for (let i = 0; i < n; i++) {
        const cx = padL + step * i + step / 2;
        const hit = mk('rect', { x: cx - step / 2, y: padT, width: step, height: plotH, fill: 'transparent' });
        clickify(hit, (opts.tipPrefix || '') + labels[i], () => opts.onClick({ label: labels[i], value: vals[i] }, i));
        s.appendChild(hit);
      }
    }
    let pk = null;
    if (opts.peakLabel) {
      const cx = padL + step * maxIdx + step / 2;
      pk = mk('text', { x: cx, y: Y(vals[maxIdx]) - 8, 'text-anchor': 'middle', class: 'cv-end', fill: P.accent, text: opts.peakLabel });
      pk.style.opacity = 0; s.appendChild(pk);
    }
    let played = false;
    function reveal() {
      if (played) return; played = true;
      bars.forEach((b, i) => {
        const d = reduced() ? 0 : i * 30;
        b.style.transition = `transform .65s cubic-bezier(.22,.61,.36,1) ${d}ms`;
        requestAnimationFrame(() => { b.style.transform = 'scaleY(1)'; });
      });
      valLabels.forEach((vl, i) => { vl.style.transition = `opacity .4s ease ${reduced() ? 0 : i * 30 + 280}ms`; requestAnimationFrame(() => { vl.style.opacity = 1; }); });
      if (pk) { pk.style.transition = `opacity .5s ease ${reduced() ? 0 : n * 30 + 120}ms`; requestAnimationFrame(() => { pk.style.opacity = 1; }); }
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * PICTOGRAPH (icon array, two-color split, staggered reveal) *
   * ---------------------------------------------------------- */
  function pictograph(opts) {
    const total = opts.total || 10, a = Math.max(0, Math.min(total, opts.a)), cols = opts.cols || total;
    const rows = Math.ceil(total / cols), cell = opts.cell || 50, padL = 2, padT = 2;
    const w = opts.width || (cols * cell + padL * 2), h = rows * cell + padT + 4;
    const s = svgRoot(w, h, 'cv-picto');
    const icons = [];
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const col = i < a ? (opts.aColor || P.blue) : (opts.bColor || P.purple);
      const k = (cell * 0.6) / 24;
      const g = mk('g', { transform: `translate(${padL + c * cell + cell / 2}, ${padT + r * cell + cell / 2}) scale(${k})` });
      const ic = mk('g', { transform: 'translate(-12,-12)' });
      ic.appendChild(mk('circle', { cx: 12, cy: 7.5, r: 3.8, fill: col }));
      ic.appendChild(mk('path', { d: 'M5 20.5 C5 14.6 8 12.4 12 12.4 C16 12.4 19 14.6 19 20.5 Z', fill: col }));
      g.appendChild(ic); g.style.opacity = 0; s.appendChild(g); icons.push(g);
    }
    let played = false;
    function reveal() {
      if (played) return; played = true;
      icons.forEach((g, i) => { const d = reduced() ? 0 : i * 60; g.style.transition = `opacity .45s ease ${d}ms`; requestAnimationFrame(() => { g.style.opacity = 1; }); });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * HEATMAP (rows x cols matrix, sequential colour, fade-in)   *
   * ---------------------------------------------------------- */
  function heatmap(opts) {
    const rowLabels = opts.rowLabels, colLabels = opts.colLabels, M = opts.matrix;
    const rows = rowLabels.length, cols = colLabels.length;
    const w = opts.width || 820, labelW = opts.labelW ?? 188, padR = opts.padR ?? 12;
    const padT = opts.padT ?? 26, gap = opts.gap ?? 3;
    const cellW = (w - labelW - padR) / cols, cellH = opts.cellH ?? 30;
    const h = padT + rows * cellH + 4;
    const stops = opts.stops || [{ t: 0, color: '#eef3ec' }, { t: .5, color: '#5aa377' }, { t: 1, color: '#103d2c' }];
    const flat = M.flat().filter(v => v != null);
    const min = opts.min != null ? opts.min : Math.min(...flat);
    const max = opts.max != null ? opts.max : Math.max(...flat);
    const colorFor = v => lerpStops(stops, Math.max(0, Math.min(1, (v - min) / (max - min || 1))));
    const fmt = opts.valueFmt || (v => Math.round(v).toLocaleString());
    const s = svgRoot(w, h, 'cv-heat');
    const colEvery = opts.colEvery || (cols > 16 ? 2 : 1);
    for (let c = 0; c < cols; c++) {
      if (c % colEvery !== 0 && c !== cols - 1) continue;
      s.appendChild(mk('text', { x: labelW + c * cellW + cellW / 2, y: padT - 10, 'text-anchor': 'middle', class: 'cv-axt', text: colLabels[c] }));
    }
    const cells = [];
    for (let r = 0; r < rows; r++) {
      const yy = padT + r * cellH;
      s.appendChild(mk('text', { x: labelW - 10, y: yy + cellH / 2 + 4, 'text-anchor': 'end', class: 'cv-rowlab', text: rowLabels[r] }));
      for (let c = 0; c < cols; c++) {
        const v = M[r][c], xx = labelW + c * cellW;
        const fill = v == null ? P.line : colorFor(v);
        const rect = mk('rect', { x: xx + gap / 2, y: yy + gap / 2, width: cellW - gap, height: cellH - gap, rx: 2.5, fill });
        rect.style.opacity = 0;
        if (opts.onClick && v != null) clickify(rect, rowLabels[r] + ' · ' + colLabels[c], () => opts.onClick({ row: rowLabels[r], col: colLabels[c], value: v, r, c }, r, c));
        s.appendChild(rect);
        if (opts.showValues && v != null && cellW > 34) {
          const t = mk('text', { x: xx + cellW / 2, y: yy + cellH / 2 + 3.5, 'text-anchor': 'middle', class: 'cv-tilet', fill: colorContrast(fill) ? '#fff' : P.ink, text: fmt(v) });
          t.style.opacity = 0; s.appendChild(t); cells.push(t);
        }
        cells.push(rect);
      }
    }
    let played = false;
    function reveal() {
      if (played) return; played = true;
      cells.forEach((el, i) => { const d = reduced() ? 0 : (i % cols) * 18 + Math.floor(i / cols) * 40; el.style.transition = `opacity .5s ease ${d}ms`; requestAnimationFrame(() => { el.style.opacity = 1; }); });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * BUBBLES (proportional circle grid, scale-in)               *
   * ---------------------------------------------------------- */
  function bubbles(opts) {
    const items = opts.items;
    const w = opts.width || 720, h = opts.height || 380;
    const s = svgRoot(w, h, 'cv-bubble');
    const maxV = Math.max(...items.map(d => d.value));
    const rMax = opts.rMax || Math.min(w, h) / 4.0;
    const rOf = v => Math.max(13, Math.sqrt(v / maxV) * rMax);
    // circle-pack: place the biggest at the centre, then nestle each next one
    // against the cluster at the spot closest to the centre that doesn't overlap
    const order = items.map((d, i) => ({ d, i, r: rOf(d.value) })).sort((a, b) => b.r - a.r);
    const placed = [];
    order.forEach((o, k) => {
      if (k === 0) { o.x = 0; o.y = 0; placed.push(o); return; }
      let best = null;
      for (let pi = 0; pi < placed.length; pi++) {
        const p = placed[pi];
        for (let a = 0; a < 6.2832; a += Math.PI / 18) {
          const dist = p.r + o.r + 1.5;
          const x = p.x + Math.cos(a) * dist, y = p.y + Math.sin(a) * dist;
          const ok = placed.every(q => { const dx = x - q.x, dy = y - q.y; return dx * dx + dy * dy >= (q.r + o.r - 0.5) * (q.r + o.r - 0.5); });
          if (ok) { const d2 = x * x + y * y; if (!best || d2 < best.d2) best = { x, y, d2 }; }
        }
      }
      o.x = best ? best.x : 0; o.y = best ? best.y : 0; placed.push(o);
    });
    // fit the cluster into the viewport
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    placed.forEach(o => { minX = Math.min(minX, o.x - o.r); maxX = Math.max(maxX, o.x + o.r); minY = Math.min(minY, o.y - o.r); maxY = Math.max(maxY, o.y + o.r); });
    const bbw = maxX - minX || 1, bbh = maxY - minY || 1, pad = 8;
    const sc = Math.min((w - 2 * pad) / bbw, (h - 2 * pad) / bbh);
    const ox = (w - bbw * sc) / 2 - minX * sc, oy = (h - bbh * sc) / 2 - minY * sc;
    const fmt = opts.valueFmt || (v => Math.round(v).toLocaleString());
    const blobs = [];
    placed.forEach(o => {
      const cx = o.x * sc + ox, cy = o.y * sc + oy, rad = o.r * sc, d = o.d;
      const fill = d.color || (d.highlight ? P.accent : P.green);
      const light = colorContrast(fill);
      const circ = mk('circle', { cx, cy, r: rad, fill, 'fill-opacity': d.highlight ? 1 : .92, stroke: '#fff', 'stroke-width': 1.5 });
      circ.style.transformBox = 'fill-box'; circ.style.transformOrigin = 'center'; circ.style.transform = 'scale(0)';
      if (opts.onClick) clickify(circ, d.label, () => opts.onClick(d, o.i));
      s.appendChild(circ); blobs.push(circ);
      if (rad > 30) {
        const lab = mk('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'cv-bub-lab', fill: light ? '#fff' : P.ink, text: d.label });
        const vt = mk('text', { x: cx, y: cy + 13, 'text-anchor': 'middle', class: 'cv-bub-val', fill: light ? 'rgba(255,255,255,.85)' : P.muted, text: fmt(d.value) });
        lab.style.opacity = 0; vt.style.opacity = 0; s.appendChild(lab); s.appendChild(vt); blobs.push(lab, vt);
      } else if (rad > 15) {
        const vt = mk('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'cv-bub-val', fill: light ? '#fff' : P.ink, text: fmt(d.value) });
        vt.style.opacity = 0; s.appendChild(vt); blobs.push(vt);
      }
    });
    let played = false;
    function reveal() {
      if (played) return; played = true;
      blobs.forEach((el, i) => {
        const dl = reduced() ? 0 : i * 30;
        if (el.tagName === 'circle') { el.style.transition = `transform .6s cubic-bezier(.34,1.3,.5,1) ${dl}ms`; requestAnimationFrame(() => { el.style.transform = 'scale(1)'; }); }
        else { el.style.transition = `opacity .5s ease ${dl + 200}ms`; requestAnimationFrame(() => { el.style.opacity = 1; }); }
      });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * FUNNEL (centred proportional bars, width grows)            *
   * ---------------------------------------------------------- */
  function funnel(opts) {
    const items = opts.items, n = items.length;
    const w = opts.width || 760, labelW = opts.labelW ?? 220, padR = opts.padR ?? 70;
    const barH = opts.barH ?? 34, gap = opts.gap ?? 14, padT = 6;
    const h = padT + n * (barH + gap);
    const plotW = w - labelW - padR, cxp = labelW + plotW / 2;
    const maxV = Math.max(...items.map(d => d.value));
    const fmt = opts.valueFmt || (v => Math.round(v).toLocaleString());
    const s = svgRoot(w, h, 'cv-funnel');
    const anim = [];
    const widths = items.map(d => Math.max(6, (d.value / maxV) * plotW));
    // connectors (drawn first, under the bars)
    for (let i = 0; i < n - 1; i++) {
      const y0 = padT + i * (barH + gap) + barH, y1 = padT + (i + 1) * (barH + gap);
      const w0 = widths[i] / 2, w1 = widths[i + 1] / 2;
      s.appendChild(mk('path', { d: `M${cxp - w0} ${y0} L${cxp + w0} ${y0} L${cxp + w1} ${y1} L${cxp - w1} ${y1} Z`, fill: P.sage, 'fill-opacity': .35 }));
    }
    items.forEach((d, i) => {
      const yTop = padT + i * (barH + gap), cy = yTop + barH / 2;
      s.appendChild(mk('text', { x: labelW - 14, y: cy + 4, 'text-anchor': 'end', class: d.highlight ? 'cv-rowlab hi' : 'cv-rowlab', text: d.label }));
      const fw = widths[i], fill = d.color || (d.highlight ? P.accent : P.green);
      const bar = mk('rect', { x: cxp, y: yTop, width: 0, height: barH, rx: 3, fill });
      s.appendChild(bar);
      const val = mk('text', { x: cxp + fw / 2 + 12, y: cy + 4, 'text-anchor': 'start', class: 'cv-barval', fill: P.ink, text: '' });
      val.style.opacity = 0; s.appendChild(val);
      if (opts.onClick) {
        const hit = mk('rect', { x: 0, y: yTop, width: w, height: barH, fill: 'transparent' });
        clickify(hit, d.label, () => opts.onClick(d, i)); s.appendChild(hit);
      }
      anim.push({ bar, fw, cxp, val, value: d.value });
    });
    let played = false;
    function reveal() {
      if (played) return; played = true;
      anim.forEach((a, i) => {
        const delay = reduced() ? 0 : i * 90;
        a.bar.style.transition = `width 1s cubic-bezier(.22,.61,.36,1) ${delay}ms, x 1s cubic-bezier(.22,.61,.36,1) ${delay}ms`;
        requestAnimationFrame(() => { a.bar.setAttribute('x', a.cxp - a.fw / 2); a.bar.setAttribute('width', a.fw); });
        setTimeout(() => { a.val.style.opacity = 1; countUp(a.val, a.value, fmt, 800); }, delay + (reduced() ? 0 : 320));
      });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * MONEY FLOW (3-stage sankey: sources -> total -> uses)      *
   * ---------------------------------------------------------- */
  function moneyFlow(opts) {
    const w = opts.width || 760, h = opts.height || 360, padT = 34, padB = 22;
    const T = h - padT - padB;                 // full vertical extent = the total
    const left = opts.left.filter(d => d.value > 0), right = opts.right.filter(d => d.value > 0);
    const total = opts.total != null ? opts.total : left.reduce((s, d) => s + d.value, 0);
    const fmt = opts.fmt || (v => '$' + Math.round(v).toLocaleString());
    const s = svgRoot(w, h, 'cv-flow');
    const lx = 188, lw = 24, cx = w / 2 - 14, cw = 28, rx = w - 188, rw = 24;
    const hOf = v => (v / total) * T;
    const ribLayer = mk('g'), nodeLayer = mk('g'), txtLayer = mk('g');
    s.appendChild(ribLayer); s.appendChild(nodeLayer); s.appendChild(txtLayer);
    const anim = [];
    function side(items, isLeft) {
      let nodeY = padT, centerY = padT;
      const nx = isLeft ? lx : rx, nw = isLeft ? lw : rw;
      items.forEach(d => {
        const hgt = Math.max(1, hOf(d.value));
        const ny0 = nodeY, ny1 = nodeY + hgt; nodeY = ny1;
        const cy0 = centerY, cy1 = centerY + hgt; centerY = cy1;
        const col = d.color || (isLeft ? P.green : P.greenL);
        const node = mk('rect', { x: isLeft ? nx - nw : nx, y: ny0, width: nw, height: hgt, rx: 3, fill: col });
        nodeLayer.appendChild(node);
        const sx = isLeft ? nx : (cx + cw), ex = isLeft ? cx : nx;
        const sy0 = isLeft ? ny0 : cy0, sy1 = isLeft ? ny1 : cy1;
        const ey0 = isLeft ? cy0 : ny0, ey1 = isLeft ? cy1 : ny1;
        const xm = (sx + ex) / 2;
        const rib = mk('path', { d: `M${sx} ${sy0} C${xm} ${sy0} ${xm} ${ey0} ${ex} ${ey0} L${ex} ${ey1} C${xm} ${ey1} ${xm} ${sy1} ${sx} ${sy1} Z`, fill: col, 'fill-opacity': .4 });
        rib.style.opacity = 0; ribLayer.appendChild(rib); anim.push(rib);
        const pct = total ? d.value / total * 100 : 0;
        const tx = isLeft ? nx - nw - 10 : nx + nw + 10, anchor = isLeft ? 'end' : 'start', mid = (ny0 + ny1) / 2;
        const lab = mk('text', { x: tx, y: mid - 1, 'text-anchor': anchor, class: 'cv-flow-lab', text: d.label });
        const val = mk('text', { x: tx, y: mid + 14, 'text-anchor': anchor, class: 'cv-flow-val', text: fmt(d.value) + '  ·  ' + (pct < 10 ? pct.toFixed(1) : Math.round(pct)) + '%' });
        lab.style.opacity = 0; val.style.opacity = 0; txtLayer.appendChild(lab); txtLayer.appendChild(val); anim.push(lab, val);
        if (opts.onClick) { const fire = () => opts.onClick({ label: d.label, value: d.value, pct, side: isLeft ? 'source' : 'use' }); clickify(node, d.label, fire); clickify(rib, d.label, fire); }
      });
    }
    side(left, true); side(right, false);
    // center total bar + caption on top
    nodeLayer.appendChild(mk('rect', { x: cx, y: padT, width: cw, height: T, rx: 4, fill: P.navy }));
    txtLayer.appendChild(mk('text', { x: cx + cw / 2, y: padT - 12, 'text-anchor': 'middle', class: 'cv-flow-tot', text: opts.totalLabel || 'Total' }));
    txtLayer.appendChild(mk('text', { x: cx + cw / 2, y: padT + T + 16, 'text-anchor': 'middle', class: 'cv-flow-totv', text: fmt(total) }));
    let played = false;
    function reveal() {
      if (played) return; played = true;
      anim.forEach((r, i) => { r.style.transition = `opacity .7s ease ${120 + i * 35}ms`; requestAnimationFrame(() => { r.style.opacity = r.tagName === 'path' ? .4 : 1; }); });
    }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * CHOROPLETH (geographic US map, value-shaded, clickable)    *
   * ---------------------------------------------------------- */
  function choropleth(opts) {
    const M = window.USMAP; if (!M) return { node: mk('text', { text: 'map unavailable' }), reveal() {} };
    const vb = M.viewBox.split(/\s+/).map(Number);
    const s = svgRoot(vb[2], vb[3], 'cv-choro');
    s.setAttribute('viewBox', M.viewBox);
    const vals = opts.values, stops = opts.stops, min = opts.min, max = opts.max;
    const colorFor = v => v == null ? (opts.emptyFill || P.line) : lerpStops(stops, Math.max(0, Math.min(1, (v - min) / (max - min || 1))));
    const shapes = [];
    Object.keys(M.paths).forEach(ab => {
      const v = vals[ab];
      const p = mk('path', { d: M.paths[ab], fill: colorFor(v), stroke: opts.stroke || '#fbfbf9', 'stroke-width': opts.strokeW || 1.1, 'vector-effect': 'non-scaling-stroke' });
      p.dataset.abbr = ab; p.style.opacity = 0;
      p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button');
      p.setAttribute('aria-label', `${(opts.nameOf ? opts.nameOf(ab) : ab)}: ${opts.fmt ? opts.fmt(v) : v}`);
      if (opts.onClick) {
        const fire = () => opts.onClick(ab);
        p.addEventListener('click', fire);
        p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      }
      s.appendChild(p); shapes.push(p);
    });
    let played = false;
    function reveal() {
      if (played) return; played = true;
      shapes.forEach((p, i) => { const d = reduced() ? 0 : i * 12; p.style.transition = `opacity .5s ease ${d}ms`; requestAnimationFrame(() => { p.style.opacity = 1; }); });
    }
    // ---- selected-state highlight: glowing gold + twinkling sparkles ----
    let sparkLayer = null;
    function star(x, y, r) {
      const k = r * 0.34;
      return `M${x} ${(y - r).toFixed(1)} L${(x + k).toFixed(1)} ${(y - k).toFixed(1)} L${(x + r).toFixed(1)} ${y} L${(x + k).toFixed(1)} ${(y + k).toFixed(1)} L${x} ${(y + r).toFixed(1)} L${(x - k).toFixed(1)} ${(y + k).toFixed(1)} L${(x - r).toFixed(1)} ${y} L${(x - k).toFixed(1)} ${(y - k).toFixed(1)} Z`;
    }
    function select(ab) {
      if (sparkLayer) { sparkLayer.remove(); sparkLayer = null; }
      let sel = null;
      shapes.forEach(p => { const on = p.dataset.abbr === ab; p.classList.toggle('cv-choro-sel', on); if (on) sel = p; });
      if (!sel) return;
      sel.parentNode.appendChild(sel);                 // bring selection to the front
      if (reduced()) return;
      try {
        const bb = sel.getBBox(), r = Math.max(3, bb.width * 0.04);
        sparkLayer = mk('g', { class: 'cv-spark-layer' });
        for (let i = 0; i < 5; i++) {
          const sx = bb.x + (0.15 + 0.7 * Math.random()) * bb.width, sy = bb.y + (0.15 + 0.7 * Math.random()) * bb.height;
          const rr = r * (0.6 + Math.random() * 0.8);
          const st = mk('path', { d: star(sx, sy, rr), class: 'cv-spark', fill: i % 2 ? '#fff6da' : '#ffcf6b' });
          st.style.animationDelay = (Math.random() * 1.3).toFixed(2) + 's';
          sparkLayer.appendChild(st);
        }
        s.appendChild(sparkLayer);
      } catch (e) { /* getBBox may fail if detached */ }
    }
    return { node: s, reveal, shapes, select };
  }

  /* ---------------------------------------------------------- *
   * SCATTER (x vs y dots, optional log axes, hover + click)    *
   * ---------------------------------------------------------- */
  function scatter(opts) {
    const w = opts.width || 760, h = opts.height || 440, padL = opts.padL ?? 66, padR = 16, padT = 16, padB = 52;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const pts = opts.points.filter(p => p.x > 0 && p.y > 0);
    const logX = opts.logX, logY = opts.logY;
    const xsv = pts.map(p => p.x), ysv = pts.map(p => p.y);
    const xMin = opts.xMin != null ? opts.xMin : (logX ? Math.min(...xsv) : 0), xMax = opts.xMax != null ? opts.xMax : Math.max(...xsv);
    const yMin = opts.yMin != null ? opts.yMin : (logY ? Math.min(...ysv) : 0), yMax = opts.yMax != null ? opts.yMax : Math.max(...ysv);
    const L = Math.log10, lo = (v, mn) => L(Math.max(v, mn));
    const X = logX ? (v => padL + (lo(v, xMin) - L(xMin)) / (L(xMax) - L(xMin)) * plotW) : (v => padL + (v - xMin) / (xMax - xMin) * plotW);
    const Y = logY ? (v => padT + plotH - (lo(v, yMin) - L(yMin)) / (L(yMax) - L(yMin)) * plotH) : (v => padT + plotH - (v - yMin) / (yMax - yMin) * plotH);
    const s = svgRoot(w, h, 'cv-scatter');
    const xFmt = opts.xFmt || (v => v), yFmt = opts.yFmt || (v => v);
    const logTicks = (mn, mx) => { const out = []; for (let p = Math.floor(L(mn)); p <= Math.ceil(L(mx)); p++) out.push(Math.pow(10, p)); return out.filter(v => v >= mn * 0.9 && v <= mx * 1.1); };
    const xticks = logX ? logTicks(xMin, xMax) : Array.from({ length: 5 }, (_, i) => xMin + (xMax - xMin) * i / 4);
    const yticks = logY ? logTicks(yMin, yMax) : Array.from({ length: 5 }, (_, i) => yMin + (yMax - yMin) * i / 4);
    yticks.forEach(v => { const yy = Y(v); s.appendChild(mk('line', { x1: padL, x2: w - padR, y1: yy, y2: yy, stroke: P.line })); s.appendChild(mk('text', { x: padL - 8, y: yy + 3.5, 'text-anchor': 'end', class: 'cv-axt', text: yFmt(v) })); });
    xticks.forEach(v => { const xx = X(v); s.appendChild(mk('line', { x1: xx, x2: xx, y1: padT, y2: padT + plotH, stroke: P.line })); s.appendChild(mk('text', { x: xx, y: h - padB + 16, 'text-anchor': 'middle', class: 'cv-axt', text: xFmt(v) })); });
    if (opts.xAxisLabel) s.appendChild(mk('text', { x: padL + plotW / 2, y: h - 6, 'text-anchor': 'middle', class: 'cv-axt-bold', text: opts.xAxisLabel }));
    if (opts.yAxisLabel) s.appendChild(mk('text', { x: 14, y: padT + plotH / 2, 'text-anchor': 'middle', class: 'cv-axt-bold', transform: `rotate(-90 14 ${padT + plotH / 2})`, text: opts.yAxisLabel }));
    const g = mk('g', { class: 'cv-dots' }); g.style.opacity = 0;
    const px = [], py = [];
    pts.forEach((p, i) => {
      const cx = X(p.x), cy = Y(p.y); px.push(cx); py.push(cy);
      const c = mk('circle', { cx, cy, r: p.r || opts.r || 3.5, fill: p.color || P.green, 'fill-opacity': p.highlight ? 1 : (opts.dotOpacity ?? .5), stroke: p.highlight ? P.cream : 'none', 'stroke-width': 1 });
      c.dataset.i = i; g.appendChild(c);
    });
    s.appendChild(g);
    // nearest-point hover + click via one listener
    const pt = s.createSVGPoint();
    const nearest = e => {
      pt.x = e.clientX; pt.y = e.clientY; const loc = pt.matrixTransform(s.getScreenCTM().inverse());
      let bi = -1, bd = 14 * 14;
      for (let i = 0; i < px.length; i++) { const dx = px[i] - loc.x, dy = py[i] - loc.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = i; } }
      return bi;
    };
    if (opts.onHover) {
      s.addEventListener('mousemove', e => { const i = nearest(e); if (i >= 0) opts.onHover(pts[i], e.clientX, e.clientY); else opts.onLeave && opts.onLeave(); });
      s.addEventListener('mouseleave', () => opts.onLeave && opts.onLeave());
    }
    if (opts.onClick) { s.style.cursor = 'pointer'; s.addEventListener('click', e => { const i = nearest(e); if (i >= 0) opts.onClick(pts[i], i); }); }
    let played = false;
    function reveal() { if (played) return; played = true; g.style.transition = reduced() ? 'none' : 'opacity .7s ease'; requestAnimationFrame(() => { g.style.opacity = 1; }); }
    return { node: s, reveal };
  }

  /* ---------------------------------------------------------- *
   * EXPORT (PNG raster of an SVG + CSV download)               *
   * ---------------------------------------------------------- */
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function exportCSS() {
    const v = cssVar;
    return `text{font-family:'Public Sans',system-ui,sans-serif}
.cv-axt{fill:${v('--faint')};font-size:11.5px;font-weight:500}
.cv-rowlab{fill:${v('--ink')};font-size:13px;font-weight:500}
.cv-rowlab.hi{fill:${v('--accent')};font-weight:700}
.cv-barval{font-size:13px;font-weight:700}
.cv-colval{font-size:10px;font-weight:700}
.cv-bub-lab{font-size:11.5px;font-weight:700}
.cv-bub-val{font-size:10.5px;font-weight:600}
.cv-end{font-size:13px;font-weight:700}
.cv-anno-t{fill:${v('--ink')};font-size:13px;font-weight:700}
.cv-anno-sub{fill:${v('--muted')};font-size:11.5px;font-weight:500}
.cv-vmark-t{fill:${v('--ink')};font-size:12px;font-weight:700}
.cv-vmark-sub{fill:${v('--muted')};font-size:10.5px;font-weight:500}
.cv-dbval{font-size:12.5px;font-weight:700}
.cv-tilet{font-size:12px;font-weight:700}
.cv-donut-big{fill:${v('--ink')};font-family:'Archivo',sans-serif;font-weight:800;font-size:28px}
.cv-donut-sub{fill:${v('--muted')};font-size:11px}`;
  }
  function download(blob, name) {
    const u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1500);
  }
  function wrapText(txt, maxChars) {
    const words = (txt || '').split(/\s+/).filter(Boolean), lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur ? cur + ' ' : '') + w; });
    if (cur) lines.push(cur); return lines;
  }
  function exportPNG(svg, name, opts) {
    if (!svg) return;
    opts = opts || {};
    const vb = svg.viewBox.baseVal;
    const W = Math.round(vb && vb.width ? vb.width : (svg.getBoundingClientRect().width || 820));
    const H = Math.round(vb && vb.height ? vb.height : (svg.getBoundingClientRect().height || 460));
    const pad = 26, lineH = 21;
    const titleLines = opts.title ? wrapText(opts.title, Math.floor((W - pad * 2) / 8.1)) : [];
    const srcLines = opts.source ? wrapText('SOURCE: ' + opts.source, Math.floor((W - pad * 2) / 6.0)) : [];
    const topPad = titleLines.length ? titleLines.length * lineH + 16 : 0;
    const botPad = srcLines.length ? srcLines.length * 15 + 14 : 0;
    const OW = W + pad * 2, OH = topPad + H + botPad + pad * 2;
    const out = mk('svg', { xmlns: NS, viewBox: `0 0 ${OW} ${OH}`, width: OW, height: OH });
    const st = document.createElementNS(NS, 'style');
    st.textContent = exportCSS() + `\n.exp-title{fill:${cssVar('--ink')};font-family:'Archivo',sans-serif;font-weight:800;font-size:15px}\n.exp-src{fill:${cssVar('--faint')};font-size:11px}`;
    out.appendChild(st);
    out.appendChild(mk('rect', { x: 0, y: 0, width: OW, height: OH, fill: cssVar('--cream') || '#f4f4ef' }));
    titleLines.forEach((ln, i) => out.appendChild(mk('text', { x: pad, y: pad + 16 + i * lineH, class: 'exp-title', text: ln })));
    const clone = svg.cloneNode(true);
    clone.setAttribute('x', pad); clone.setAttribute('y', pad + topPad);
    clone.setAttribute('width', W); clone.setAttribute('height', H); clone.style.overflow = 'visible';
    out.appendChild(clone);
    srcLines.forEach((ln, i) => out.appendChild(mk('text', { x: pad, y: pad + topPad + H + 18 + i * 15, class: 'exp-src', text: ln })));
    const xml = new XMLSerializer().serializeToString(out);
    const img = new Image(), scale = 2;
    img.onload = function () {
      const c = document.createElement('canvas'); c.width = OW * scale; c.height = OH * scale;
      const x = c.getContext('2d'); x.setTransform(scale, 0, 0, scale, 0, 0);
      x.drawImage(img, 0, 0);
      c.toBlob(b => download(b, (name || 'chart') + '.png'), 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  }
  function toCSV(rows) {
    return rows.map(r => r.map(c => {
      c = c == null ? '' : String(c);
      return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
    }).join(',')).join('\n');
  }
  function exportCSVFile(name, rows) { download(new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }), (name || 'data') + '.csv'); }
  function addExportBar(figureEl, name, getCsv) {
    if (!figureEl || figureEl.querySelector('.fig-export')) return;
    const bar = document.createElement('div'); bar.className = 'fig-export';
    const png = document.createElement('button'); png.type = 'button'; png.textContent = 'PNG'; png.title = 'Download chart as PNG image';
    bar.appendChild(png);
    const grab = sel => { const e = figureEl.querySelector(sel); return e ? (e.textContent || '').replace(/^\s*source\s*/i, '').replace(/\s+/g, ' ').trim() : ''; };
    png.onclick = () => exportPNG(figureEl.querySelector('svg.cv'), name, { title: grab('.figure-title'), source: grab('.source') });
    if (getCsv) {
      const csv = document.createElement('button'); csv.type = 'button'; csv.textContent = 'CSV'; csv.title = 'Download the data as CSV';
      bar.appendChild(csv);
      csv.onclick = () => { const rows = typeof getCsv === 'function' ? getCsv() : getCsv; if (rows && rows.length) exportCSVFile(name, rows); };
    }
    figureEl.appendChild(bar);
  }

  window.Charts = { lineChart, barsH, stackedArea, columns, pictograph, dumbbell, donut, tileMap, heatmap, bubbles, funnel, moneyFlow, choropleth, scatter, countUp, colorFor: lerpStops, exportPNG, exportCSVFile, addExportBar };
})();
