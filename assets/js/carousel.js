/* =========================================================
   首屏轮播：自动播放，循环介绍不同的玩法条目
   - 数据来自 window.GUIDE_ITEMS
   - 点击任意一屏 → 交给 app.js 的 openModal 打开详情
   - 悬停 / 聚焦暂停，支持左右箭头、圆点、手机滑动
   - 尊重 prefers-reduced-motion：开启时不自动播放
   ========================================================= */
(function () {
  "use strict";

  var ITEMS = window.GUIDE_ITEMS || [];
  var DUR = window.GUIDE_DURATION || {};
  var CAT_LABEL = { fun: "好玩", food: "好吃" };
  var AUTO_MS = 4200;

  var openItem = null;   // 由 app.js 注入（openModal）
  var root = null;
  var track = null;
  var slides = [];
  var dotsEl = null;
  var index = 0;
  var timer = null;
  var paused = false;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function shuffle(a) {
    var arr = a.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function fmtDur(m) { return m >= 60 ? (Math.round(m / 6) / 10) + " 小时" : m + " 分钟"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 每次进来随机挑一部分，保证轮播介绍的玩法有变化
  function pick() {
    if (!ITEMS.length) return [];
    return shuffle(ITEMS).slice(0, Math.min(8, ITEMS.length));
  }

  function build(list) {
    root.innerHTML =
      '<div class="hc-viewport"><div class="hc-track" id="hc-track"></div></div>' +
      '<button class="hc-arrow hc-prev" type="button" aria-label="上一个">‹</button>' +
      '<button class="hc-arrow hc-next" type="button" aria-label="下一个">›</button>' +
      '<div class="hc-dots" id="hc-dots"></div>';

    track = root.querySelector("#hc-track");
    dotsEl = root.querySelector("#hc-dots");

    list.forEach(function (item, i) {
      var slide = document.createElement("article");
      slide.className = "hc-slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-label", (i + 1) + " / " + list.length);
      var dur = DUR[item.id] || 60;
      slide.innerHTML =
        '<div class="hc-emoji">' + esc(item.emoji) + "</div>" +
        '<div class="hc-body">' +
          '<span class="hc-kicker">' + esc(CAT_LABEL[item.cat] || "") + " · 约 " + fmtDur(dur) + "</span>" +
          '<h2 class="hc-name">' + esc(item.name) + "</h2>" +
          '<p class="hc-hook">' + esc(item.hook) + "</p>" +
        "</div>" +
        '<span class="hc-go">进来看看 →</span>';
      slide.addEventListener("click", function () { if (openItem) openItem(item); });
      track.appendChild(slide);
      slides.push(slide);

      var dot = document.createElement("button");
      dot.className = "hc-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", "跳到第 " + (i + 1) + " 个");
      (function (k) { dot.addEventListener("click", function () { go(k, true); }); })(i);
      dotsEl.appendChild(dot);
    });

    root.querySelector(".hc-prev").addEventListener("click", function () { go(index - 1, true); });
    root.querySelector(".hc-next").addEventListener("click", function () { go(index + 1, true); });

    // 悬停 / 聚焦时暂停自动播放
    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    root.addEventListener("focusin", function () { paused = true; });
    root.addEventListener("focusout", function () { paused = false; });

    // 手机滑动切换
    var startX = null, dx = 0;
    root.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; dx = 0; paused = true; }, { passive: true });
    root.addEventListener("touchmove", function (e) { if (startX != null) dx = e.touches[0].clientX - startX; }, { passive: true });
    root.addEventListener("touchend", function () {
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
      startX = null; paused = false;
    });

    // 切到后台时停，回来再继续
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (!reduce && !paused) start();
    });

    go(0, false);
    if (!reduce) start();
  }

  function go(k, user) {
    if (!slides.length) return;
    index = ((k % slides.length) + slides.length) % slides.length;
    track.style.transform = "translateX(" + (-index * 100) + "%)";
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
    Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.classList.toggle("is-active", i === index); });
    if (user) { stop(); if (!reduce && !paused) start(); }
  }
  function start() { stop(); timer = setInterval(function () { if (!paused) go(index + 1, false); }, AUTO_MS); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  window.GUIDE_CAROUSEL = {
    setOnPickItem: function (fn) { openItem = fn; },
    mount: function (el) {
      root = el;
      var list = pick();
      if (!list.length) { root.hidden = true; return; }
      build(list);
    }
  };
})();
