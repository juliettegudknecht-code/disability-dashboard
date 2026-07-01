/* ============================================================
   brain.js — Ambient "second brain" neural web for the main site.
   A single fixed, full-viewport canvas behind all content: sparse
   drifting nodes + distance-based synapse links + two slow green/navy
   glow blobs. A calm, far sparser cousin of the password-gate field,
   tuned so it never competes with the charts, tables, or prose.

   Hard constraints honored:
     - Behind everything (#brainCanvas z-index:-1), pointer-events:none.
     - Honors prefers-reduced-motion: draws one static frame, no loop.
     - Pauses on document.hidden and when the canvas is scrolled far
       off-screen (IntersectionObserver on a sentinel is unnecessary —
       the canvas is fixed and always on-screen — so we pause purely on
       visibility + a frame throttle).
     - Node count capped and scaled to viewport area; DPR clamped.
     - Opacity fades slightly as you scroll deeper so late, chart-dense
       sections stay especially clean.
     - No deps, no per-frame DOM writes, degrades if canvas unsupported.
   ============================================================ */
(function () {
  var cv = document.getElementById('brainCanvas');
  if (!cv || !cv.getContext) return;                 // graceful degrade
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = !!(mq && mq.matches);

  var W = 0, H = 0, DPR = 1, t = 0, raf = 0, running = false;
  var pts = [], blobs = [];
  var scrollFade = 1;          // 1 at top -> ~0.55 deep down
  var frameSkip = 0;           // render every other frame (~30fps) to spare the CPU

  // Palette (site vars). Nodes lean green with a little navy/blue.
  var NODE_COLORS = ['#86c195', '#2f8f57', '#4f7fbf', '#103d2c'];
  var LINK_RGB = '150,206,178';   // soft sage for synapses

  // Distances kept generous+sparse so lines are rare and calm.
  var LINK_D2 = 30000;            // squared px threshold for a link (~173px)

  function build() {
    DPR = Math.min(1.75, window.devicePixelRatio || 1);   // clamp DPR for fill-rate
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var big = Math.max(W, H);
    // Two slow blobs only (green + navy). Very low alpha over cream.
    blobs = [
      { x: W * 0.20, y: H * 0.28, r: big * 0.52, c: 'rgba(47,143,87,0.10)',  ph: 0.0, sp: 0.007, ax: W * 0.06, ay: H * 0.05 },
      { x: W * 0.82, y: H * 0.70, r: big * 0.50, c: 'rgba(16,50,74,0.075)', ph: 2.4, sp: 0.006, ax: W * 0.07, ay: H * 0.05 }
    ];

    // Sparse node target: roughly a third of the gate's density, hard-capped.
    var target = reduce ? 0 : Math.max(14, Math.min(38, Math.round(W * H / 46000)));
    while (pts.length < target) {
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.16,     // slower drift than the gate
        vy: (Math.random() - 0.5) * 0.16,
        r: 1 + Math.random() * 1.5,
        c: NODE_COLORS[(Math.random() * NODE_COLORS.length) | 0]
      });
    }
    pts.length = target;
  }

  function drawBlobs(moving) {
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var cx = b.x + (moving ? Math.cos(t * b.sp + b.ph) * b.ax : 0);
      var cy = b.y + (moving ? Math.sin(t * b.sp * 0.9 + b.ph) * b.ay : 0);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawNodes(moving) {
    var i, j, p, q, dx, dy, d, a;
    // synapse links first (under the dots)
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (moving) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (j = i + 1; j < pts.length; j++) {
        q = pts[j];
        dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
        if (d < LINK_D2) {
          a = (1 - d / LINK_D2) * 0.16 * scrollFade;   // very faint links
          ctx.strokeStyle = 'rgba(' + LINK_RGB + ',' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    // nodes
    ctx.globalAlpha = 0.5 * scrollFade;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paint(moving) {
    ctx.clearRect(0, 0, W, H);
    drawBlobs(moving);
    drawNodes(moving);
  }

  function frame() {
    if (!running) return;
    // ~30fps: skip every other rAF tick to halve cost on a chart-heavy page.
    frameSkip ^= 1;
    if (frameSkip) { raf = requestAnimationFrame(frame); return; }
    t++;
    paint(true);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  // ---- scroll-depth fade (rAF-throttled read, no layout thrash) ----
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var p = Math.min(1, (window.pageYOffset || doc.scrollTop || 0) / max);
      scrollFade = 1 - p * 0.45;      // 1.0 at top -> 0.55 at the very bottom
      ticking = false;
    });
  }

  // ---- resize (debounced) ----
  var rz;
  function onResize() {
    clearTimeout(rz);
    rz = setTimeout(function () {
      build();
      if (reduce || !running) paint(false);   // refresh the static frame too
    }, 180);
  }

  // ---- pause when the tab is hidden ----
  function onVis() {
    if (document.hidden) stop();
    else start();
  }

  // react to a live change of the reduced-motion setting
  function onMqChange(e) {
    reduce = e.matches;
    build();
    if (reduce) { stop(); paint(false); }
    else start();
  }

  // ---- init ----
  build();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  if (mq) { (mq.addEventListener ? mq.addEventListener('change', onMqChange)
                                 : mq.addListener && mq.addListener(onMqChange)); }

  if (reduce) paint(false);   // one calm static frame, no animation loop
  else start();
})();
