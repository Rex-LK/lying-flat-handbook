/* =========================================================
   今日盲盒 + 摸鱼人格：合并卡片的圆形切换
   —— 两个面板共用一张卡片，点圆钮切换，高度按内容自适应
   ========================================================= */
(function () {
  var duo = document.querySelector(".duo");
  if (!duo) return;
  var btns = duo.querySelectorAll(".duo-btn");
  var panels = duo.querySelectorAll(".duo-panel");

  function show(name) {
    Array.prototype.forEach.call(btns, function (b) {
      var on = b.getAttribute("data-duo") === name;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    Array.prototype.forEach.call(panels, function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
    });
  }

  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener("click", function () {
      show(b.getAttribute("data-duo"));
    });
  });

  /* 顶部导航「今日盲盒 / 摸鱼人格」联动：
     捕获阶段先切换面板，随后 app.js 的 scrollToSection 才能拿到正确的可见位置。
     这样点导航按钮既能切页、又能平滑滚到合并卡片。 */
  document.addEventListener(
    "click",
    function (e) {
      var nav = e.target && e.target.closest ? e.target.closest(".nav-btn[data-goto]") : null;
      if (!nav) return;
      var g = nav.getAttribute("data-goto");
      if (g === "lucky" || g === "persona") show(g);
    },
    true
  );

  window.__duoShow = show;
})();
