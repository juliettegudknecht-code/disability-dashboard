/* ============================================================
   type.js — typewriter reveal of the hero headline.
   Types the main title on load with a blinking caret. Keeps the
   full text as the accessible name, and shows it instantly for
   anyone who prefers reduced motion.
   ============================================================ */
(function () {
  var el = document.querySelector('.hero-main');
  if (!el) return;
  var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    || document.documentElement.classList.contains('reduce-motion');
  var full = el.textContent;
  el.setAttribute('aria-label', full);          // accessible name stays complete while we type
  if (reduce) return;                            // reduced motion: leave the full title in place
  el.textContent = '';
  el.classList.add('typing');
  var i = 0;
  function step() {
    if (i <= full.length) { el.textContent = full.slice(0, i); i++; setTimeout(step, 30); }
    else { el.classList.remove('typing'); }
  }
  setTimeout(step, 340);                          // let the hero begin to fade in first
})();
