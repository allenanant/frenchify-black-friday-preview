/*
 * Shared behaviour for the three Black Friday preview pages.
 * No tracking, no form, no network calls until someone presses play.
 *
 * Markup contracts:
 *   Countdown   <div data-countdown="2026-11-29T01:00:00Z">
 *                 <span data-cd="d"></span> <span data-cd="h"></span>
 *                 <span data-cd="m"></span> <span data-cd="s"></span>
 *                 <span data-cd="phrase"></span>   (e.g. "3 days, 13 hours")
 *               </div>
 *   CTA         <a href="#" data-cta>Reserve My Free Spot</a>
 *   Video       <button type="button" data-video-wistia="giyksplji4">poster + play</button>
 *               <button type="button" data-video-playlist="PLIX434...">poster + play</button>
 *               The element must be position:relative with a fixed aspect ratio.
 *   Option bar  injected automatically; set <body data-option="1|2|3">.
 */
(function () {
  'use strict';

  var pad = function (n) { return String(n).padStart(2, '0'); };

  // ---- Countdown -------------------------------------------------------
  function tickAll() {
    var now = Date.now();
    document.querySelectorAll('[data-countdown]').forEach(function (root) {
      var target = Date.parse(root.getAttribute('data-countdown'));
      var ms = Math.max(0, target - now);
      var t = Math.floor(ms / 1000);
      var d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600),
          m = Math.floor((t % 3600) / 60), s = t % 60;
      var set = function (k, v) {
        root.querySelectorAll('[data-cd="' + k + '"]').forEach(function (el) {
          if (el.textContent === v) return;
          el.textContent = v;
          // Big countdown digits drop in when they change (motion-2.css).
          if (el.classList.contains('cd-num')) {
            el.classList.remove('bfp-tick');
            void el.offsetWidth;
            el.classList.add('bfp-tick');
          }
        });
      };
      set('d', pad(d)); set('h', pad(h)); set('m', pad(m)); set('s', pad(s));
      var phrase;
      if (ms === 0) phrase = 'Live now';
      else if (d > 0) phrase = d + (d === 1 ? ' day, ' : ' days, ') + h + (h === 1 ? ' hour' : ' hours');
      else phrase = h + (h === 1 ? ' hour, ' : ' hours, ') + m + (m === 1 ? ' minute' : ' minutes');
      set('phrase', phrase);
    });
  }

  // ---- Preview-only CTA ------------------------------------------------
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText =
        'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:60;' +
        'max-width:min(92vw,460px);padding:14px 18px;border-radius:14px;' +
        'background:#F7F8FA;color:#0B1220;font:500 15px/1.45 Inter,system-ui,sans-serif;' +
        'box-shadow:0 12px 40px -12px rgba(0,0,0,.55);text-align:center;opacity:0;' +
        'transition:opacity .18s ease-out';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; }, 3200);
  }

  document.addEventListener('click', function (e) {
    var cta = e.target.closest('[data-cta]');
    if (cta) {
      e.preventDefault();
      toast('Preview only. On the live page, this button opens the sign-up form.');
      return;
    }
    var v = e.target.closest('[data-video-wistia],[data-video-playlist]');
    if (v && !v.dataset.playing) {
      e.preventDefault();
      var src = v.hasAttribute('data-video-wistia')
        ? 'https://fast.wistia.net/embed/iframe/' + v.getAttribute('data-video-wistia') + '?autoplay=1&playsinline=1'
        : 'https://www.youtube-nocookie.com/embed/videoseries?list=' + v.getAttribute('data-video-playlist') + '&autoplay=1';
      v.dataset.playing = '1';
      v.innerHTML =
        '<iframe src="' + src + '" title="Video" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" ' +
        'allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:inherit"></iframe>';
    }
  });

  // ---- Option switcher -------------------------------------------------
  function optionBar() {
    var cur = document.body.getAttribute('data-option');
    if (!cur) return;
    var bar = document.createElement('nav');
    bar.setAttribute('aria-label', 'Preview options');
    bar.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:50;display:flex;align-items:center;gap:6px;' +
      'padding:6px 6px 6px 14px;border-radius:999px;background:rgba(10,13,22,.82);' +
      'border:1px solid rgba(247,248,250,.16);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
      'font:600 13px/1 Inter,system-ui,sans-serif;color:rgba(247,248,250,.7)';
    var html = '<a href="../" style="color:inherit;text-decoration:none;margin-right:6px">Preview</a>';
    ['1', '2', '3'].forEach(function (n) {
      var on = n === cur;
      html += '<a href="../option-' + n + '/" aria-current="' + (on ? 'page' : 'false') + '" ' +
        'style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;' +
        'text-decoration:none;color:' + (on ? '#0B1220' : '#F7F8FA') + ';background:' + (on ? '#F7F8FA' : 'transparent') + '">' + n + '</a>';
    });
    bar.innerHTML = html;
    document.body.appendChild(bar);
  }

  function start() {
    tickAll();
    setInterval(tickAll, 1000);
    optionBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
