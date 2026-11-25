/*
 * Pointer motion for Option 2: the hero ticket tilts a little toward the
 * pointer and a gold glare follows it. Mouse and trackpad only; touch screens
 * and reduced-motion users get the still ticket.
 */
(function () {
  'use strict';
  var t = document.querySelector('.ticket');
  if (!t || !window.matchMedia) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var raf = 0, x = 0, y = 0;
  function apply() {
    raf = 0;
    var r = t.getBoundingClientRect();
    var px = Math.min(1, Math.max(0, (x - r.left) / r.width));
    var py = Math.min(1, Math.max(0, (y - r.top) / r.height));
    t.style.setProperty('--bfp-rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
    t.style.setProperty('--bfp-ry', ((px - 0.5) * 7).toFixed(2) + 'deg');
    t.style.setProperty('--bfp-mx', (px * 100).toFixed(1) + '%');
    t.style.setProperty('--bfp-my', (py * 100).toFixed(1) + '%');
  }
  t.addEventListener('pointerenter', function () { t.classList.add('is-hover'); });
  t.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  t.addEventListener('pointerleave', function () {
    t.classList.remove('is-hover');
    t.style.setProperty('--bfp-rx', '0deg');
    t.style.setProperty('--bfp-ry', '0deg');
  });
})();
