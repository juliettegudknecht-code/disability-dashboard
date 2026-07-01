/* ============================================================
   access.js — the "Access" panel: reader accessibility settings,
   built for a range of access needs, not only smaller/larger text.
   Reading aids (type, spacing, underline, a reading ruler), color
   and contrast, and motion/focus controls (reduce motion, fewer
   distractions, a strong focus outline). Every choice persists in
   localStorage and is applied as a class on <html>; an inline
   script in the <head> re-applies saved choices before first paint.
   ============================================================ */
(function () {
  const KEY = 'idea618_a11y', root = document.documentElement;
  const DEFAULTS = { reduce: false, text: 'md', contrast: false, readable: false, links: false,
    calm: false, spacing: false, distraction: false, focusring: false, ruler: false };
  function load() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  let s = load();

  /* reading ruler: a guide band that tracks the pointer */
  let ruler = null, rulerMove = null;
  function setRuler(on) {
    if (on) {
      if (!ruler) { ruler = document.createElement('div'); ruler.id = 'a11y-ruler'; ruler.setAttribute('aria-hidden', 'true'); document.body.appendChild(ruler); }
      ruler.style.top = (window.innerHeight / 2 - 21) + 'px';
      if (!rulerMove) { rulerMove = e => { if (ruler) ruler.style.top = (e.clientY - 21) + 'px'; }; window.addEventListener('pointermove', rulerMove, { passive: true }); }
    } else if (rulerMove) { window.removeEventListener('pointermove', rulerMove); rulerMove = null; }
  }

  function apply() {
    root.classList.toggle('reduce-motion', !!s.reduce);
    root.classList.toggle('text-lg', s.text === 'lg');
    root.classList.toggle('text-xl', s.text === 'xl');
    root.classList.toggle('high-contrast', !!s.contrast);
    root.classList.toggle('readable-font', !!s.readable);
    root.classList.toggle('underline-links', !!s.links);
    root.classList.toggle('calm-color', !!s.calm);
    root.classList.toggle('line-spacing', !!s.spacing);
    root.classList.toggle('fewer-distractions', !!s.distraction);
    root.classList.toggle('strong-focus', !!s.focusring);
    root.classList.toggle('reading-ruler', !!s.ruler);
    setRuler(!!s.ruler);
  }
  apply();

  /* ---- styles for the button + panel ---- */
  const css = document.createElement('style');
  css.textContent = `
  #a11y-btn{ display:inline-flex; align-items:center; gap:7px; font:inherit; font-size:13px; font-weight:700; color:var(--green-d);
    background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px 12px; cursor:pointer; white-space:nowrap; transition:all .14s; }
  #a11y-btn:hover{ border-color:var(--green); background:color-mix(in srgb,var(--green-l) 12%,var(--card)); }
  #a11y-btn svg{ flex:none; }
  #a11y-btn.on{ background:var(--green-d); color:#fff; border-color:var(--green-d); }
  @media (max-width:720px){ #a11y-btn .a11y-lab{ display:none; } #a11y-btn{ padding:8px; } }
  .a11y-bg{ position:fixed; inset:0; z-index:220; display:flex; align-items:flex-start; justify-content:center; padding:44px 18px;
    background:rgba(11,22,18,.5); -webkit-backdrop-filter:blur(7px) saturate(118%); backdrop-filter:blur(7px) saturate(118%);
    opacity:0; pointer-events:none; transition:opacity .22s ease; overflow:auto; }
  .a11y-bg.show{ opacity:1; pointer-events:auto; }
  .a11y-card{ position:relative; width:min(520px,100%); background:var(--card); border:1px solid color-mix(in srgb,var(--line) 75%,transparent);
    border-radius:20px; box-shadow:0 2px 4px rgba(16,30,25,.05),0 22px 44px -14px rgba(16,30,25,.34),0 48px 90px -28px rgba(16,30,25,.3);
    padding:26px 26px 20px; opacity:0; transform:translateY(20px) scale(.97); transition:opacity .26s ease,transform .34s cubic-bezier(.16,1,.3,1); }
  .a11y-bg.show .a11y-card{ opacity:1; transform:none; }
  .a11y-x{ position:absolute; top:15px; right:15px; width:33px; height:33px; display:inline-flex; align-items:center; justify-content:center; border:none;
    background:color-mix(in srgb,var(--line) 50%,transparent); color:var(--muted); font-size:19px; cursor:pointer; border-radius:50%; transition:background .16s,color .16s,transform .25s; }
  .a11y-x:hover{ background:var(--green-d); color:#fff; transform:rotate(90deg); }
  .a11y-group{ font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--faint); margin:20px 0 2px; }
  .a11y-group:first-of-type{ margin-top:16px; }
  .a11y-row{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding:13px 2px; border-top:1px solid var(--line); }
  .a11y-name{ font-family:var(--font-display); font-weight:700; font-size:14.5px; color:var(--ink); display:flex; align-items:center; gap:9px; }
  .a11y-name .a11y-ic{ flex:none; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px;
    color:var(--green-d); background:color-mix(in srgb,var(--green-l) 22%,transparent); }
  .a11y-desc{ font-size:12px; color:var(--muted); margin-top:3px; line-height:1.4; max-width:36ch; }
  .a11y-switch{ flex:none; width:46px; height:27px; border-radius:999px; border:1px solid var(--line); background:color-mix(in srgb,var(--line) 55%,var(--card));
    position:relative; cursor:pointer; transition:background .2s,border-color .2s; padding:0; }
  .a11y-switch .a11y-knob{ position:absolute; top:2px; left:2px; width:21px; height:21px; border-radius:50%; background:#fff;
    box-shadow:0 1px 3px rgba(16,30,25,.3); transition:transform .22s cubic-bezier(.4,0,.2,1); }
  .a11y-switch[aria-checked="true"]{ background:var(--green-d); border-color:var(--green-d); }
  .a11y-switch[aria-checked="true"] .a11y-knob{ transform:translateX(19px); }
  .a11y-switch:focus-visible{ outline:2px solid var(--green-d); outline-offset:2px; }
  .a11y-seg{ flex:none; display:inline-flex; background:var(--cream); border:1px solid var(--line); border-radius:9px; padding:3px; gap:2px; }
  .a11y-seg button{ font:inherit; font-weight:800; font-family:var(--font-display); line-height:1; color:var(--muted); border:none; background:none;
    border-radius:6px; padding:6px 12px; cursor:pointer; transition:background .15s,color .15s; }
  .a11y-seg button.on{ background:var(--green-d); color:#fff; }
  .a11y-seg button[data-t="md"]{ font-size:13px; } .a11y-seg button[data-t="lg"]{ font-size:16px; } .a11y-seg button[data-t="xl"]{ font-size:19px; }
  .a11y-foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:18px; padding-top:14px; border-top:1px solid var(--line); }
  .a11y-note{ font-size:11px; color:var(--faint); line-height:1.5; max-width:32ch; }
  .a11y-reset{ font:inherit; font-size:12.5px; font-weight:700; color:var(--green-d); background:var(--cream); border:1px solid var(--line);
    border-radius:8px; padding:8px 14px; cursor:pointer; white-space:nowrap; transition:all .14s; }
  .a11y-reset:hover{ border-color:var(--green); background:color-mix(in srgb,var(--green-l) 14%,var(--cream)); }`;
  document.head.appendChild(css);

  /* ---- topbar button ---- */
  const tools = document.querySelector('.tb-tools');
  const btn = document.createElement('button');
  btn.id = 'a11y-btn'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Accessibility settings'); btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="7.2" r="1.3" fill="currentColor" stroke="none"/><path d="M6.5 9.5c1.8.8 3.6 1.1 5.5 1.1s3.7-.3 5.5-1.1"/><path d="M12 10.6V15M12 15l-2.4 4M12 15l2.4 4"/></svg><span class="a11y-lab">Access</span>';
  if (tools) tools.insertBefore(btn, tools.firstChild); else document.body.appendChild(btn);

  /* ---- controls, grouped by need ---- */
  const IC = {
    readable: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    spacing: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 4v16M2 6l2-2 2 2M2 18l2 2 2-2"/></svg>',
    links: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17V9a5 5 0 0 1 10 0v8M4 21h16"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></svg>',
    contrast: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg>',
    calm: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10z"/></svg>',
    reduce: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
    distraction: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
    focusring: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  };
  const GROUPS = [
    { title: 'Reading', items: [
      { type: 'text' },
      { k: 'readable', name: 'Readable type', desc: 'A plainer typeface with more space between letters.', ic: IC.readable },
      { k: 'spacing', name: 'More line spacing', desc: 'Extra space between lines and words, so text is easier to track.', ic: IC.spacing },
      { k: 'ruler', name: 'Reading ruler', desc: 'A guide band follows your pointer to help you keep your place.', ic: IC.ruler },
      { k: 'links', name: 'Underline links', desc: 'Underline links in the text so they stand out.', ic: IC.links },
    ] },
    { title: 'Color & contrast', items: [
      { k: 'contrast', name: 'High contrast', desc: 'Darker text and stronger lines against a white page.', ic: IC.contrast },
      { k: 'calm', name: 'Reduce color', desc: 'Mute the color throughout for a calmer, lower-key page.', ic: IC.calm },
    ] },
    { title: 'Motion & focus', items: [
      { k: 'reduce', name: 'Reduce motion', desc: 'Turn off animations and page transitions.', ic: IC.reduce },
      { k: 'distraction', name: 'Fewer distractions', desc: 'Hide floating buttons and stop looping effects for a calmer page.', ic: IC.distraction },
      { k: 'focusring', name: 'Stronger focus outline', desc: 'A thick, high-visibility outline on whatever has keyboard focus.', ic: IC.focusring },
    ] },
  ];

  let bg = null, card = null, lastFocus = null;

  function render() {
    if (!card) return;
    card.querySelectorAll('.a11y-switch').forEach(sw => sw.setAttribute('aria-checked', s[sw.dataset.k] ? 'true' : 'false'));
    card.querySelectorAll('.a11y-seg button').forEach(b => b.classList.toggle('on', b.dataset.t === s.text));
    const anyOn = s.text !== 'md' || ['reduce', 'contrast', 'readable', 'links', 'calm', 'spacing', 'distraction', 'focusring', 'ruler'].some(k => s[k]);
    btn.classList.toggle('on', anyOn);
  }

  function build() {
    bg = document.createElement('div'); bg.className = 'a11y-bg';
    const textRow = `<div class="a11y-row">
        <div class="a11y-txt">
          <div class="a11y-name"><span class="a11y-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg></span>Text size</div>
          <div class="a11y-desc">Enlarge every figure, label, and paragraph.</div>
        </div>
        <div class="a11y-seg" role="group" aria-label="Text size">
          <button type="button" data-t="md" aria-label="Default text size">A</button>
          <button type="button" data-t="lg" aria-label="Large text size">A</button>
          <button type="button" data-t="xl" aria-label="Larger text size">A</button>
        </div>
      </div>`;
    const rowHtml = o => `<div class="a11y-row">
        <div class="a11y-txt">
          <div class="a11y-name"><span class="a11y-ic">${o.ic}</span>${o.name}</div>
          <div class="a11y-desc">${o.desc}</div>
        </div>
        <button class="a11y-switch" role="switch" aria-checked="false" data-k="${o.k}" aria-label="${o.name}"><span class="a11y-knob"></span></button>
      </div>`;
    const groupsHtml = GROUPS.map(g => `<div class="a11y-group">${g.title}</div>` +
      g.items.map(it => it.type === 'text' ? textRow : rowHtml(it)).join('')).join('');
    bg.innerHTML = `<div class="a11y-card" role="dialog" aria-modal="true" aria-labelledby="a11y-title">
      <button class="a11y-x" aria-label="Close accessibility settings">×</button>
      <div class="m-kicker">Accessibility</div>
      <h3 class="m-title" id="a11y-title" style="margin-bottom:4px">Set this page up for how you read</h3>
      <p class="m-dek" style="font-size:13.5px">These controls are here to make the data usable however you need it — for low vision, dyslexia, ADHD, sensory sensitivity, or keyboard use. Your choices are saved on this device.</p>
      ${groupsHtml}
      <div class="a11y-foot">
        <span class="a11y-note">Your system’s reduced-motion setting is always honored.</span>
        <button class="a11y-reset" type="button">Reset to default</button>
      </div>
    </div>`;
    document.body.appendChild(bg);
    card = bg.querySelector('.a11y-card');
    bg.querySelector('.a11y-x').addEventListener('click', close);
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    card.querySelectorAll('.a11y-switch').forEach(sw => sw.addEventListener('click', () => {
      const k = sw.dataset.k; s[k] = !s[k]; apply(); persist(); render();
    }));
    card.querySelectorAll('.a11y-seg button').forEach(b => b.addEventListener('click', () => {
      s.text = b.dataset.t; apply(); persist(); render();
    }));
    bg.querySelector('.a11y-reset').addEventListener('click', () => { s = Object.assign({}, DEFAULTS); apply(); persist(); render(); });
    bg.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const f = [...card.querySelectorAll('button')].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    render();
  }

  function open() {
    if (!bg) build(); else render();
    lastFocus = document.activeElement;
    bg.classList.add('show'); btn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => { const x = bg.querySelector('.a11y-x'); if (x) x.focus(); }, 40);
  }
  function close() {
    if (bg) bg.classList.remove('show'); btn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener('click', open);
  render();
  window.IDEAAccess = { open };
})();
