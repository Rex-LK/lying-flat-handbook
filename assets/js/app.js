/* =========================================================
   人生浪费指南 · 应用层
   渲染卡片 / 标签云 / 分类；实时搜索高亮；标签多选；hash 状态；
   详情弹层与实验懒挂载 / 销毁。
   全部经典脚本（无 module / 无 fetch），file:// 下完整可用。
   ========================================================= */
(function () {
  "use strict";

  var ITEMS = window.GUIDE_ITEMS || [];
  var TAGS = window.GUIDE_TAGS || [];
  var LABS = window.GUIDE_LABS || {};

  var CAT_LABEL = { fun: "好玩", food: "好吃" };

  // 多巴胺 / 内啡肽 指数（0-100）：分泌强度，越高越「上头 / 爽」
  function meter(label, v, extra) {
    return '<div class="dopa-meter">' +
      '<span class="dopa-label">' + label + '</span>' +
      '<span class="dopa-bar"><span class="dopa-fill' + (extra || "") + '" style="width:' + v + '%"></span></span>' +
      '<span class="dopa-val' + (extra || "") + '">' + v + '</span>' +
      '</div>';
  }
  function brainMeters(item) {
    var d = (window.GUIDE_DOPAMINE && window.GUIDE_DOPAMINE[item.id]) || 0;
    var e = (window.GUIDE_ENDORPHIN && window.GUIDE_ENDORPHIN[item.id]) || 0;
    return meter("🧠 多巴胺指数", d, "") + meter("💜 内啡肽指数", e, " endorphin");
  }

  // 类别分类（与 GUIDE_GENRES 关联）
  var GENRE_ORDER = ["美食", "宠物", "电竞", "娱乐", "潮玩", "职场", "运动"];
  function genreOf(item) {
    return (window.GUIDE_GENRES && window.GUIDE_GENRES[item.id]) || "";
  }
  var GENRES = (function () {
    var set = {};
    ITEMS.forEach(function (it) { var g = genreOf(it); if (g) set[g] = (set[g] || 0) + 1; });
    return GENRE_ORDER.filter(function (g) { return set[g]; }).concat(
      Object.keys(set).filter(function (g) { return GENRE_ORDER.indexOf(g) < 0; })
    ).map(function (g) { return { name: g, count: set[g] }; });
  })();

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var cardsEl = $("cards");
  var tagcloudEl = $("tagcloud");
  var searchEl = $("search");
  var searchClearEl = $("search-clear");
  var resultCountEl = $("result-count");
  var activeFiltersEl = $("active-filters");
  var emptyEl = $("empty");
  var catSwitchEl = $("cat-switch");
  var genrebarEl = $("genrebar");
  var modalEl = $("modal");
  var topbarEl = $("topbar");

  /* ---------- 状态 ---------- */
  var state = { q: "", tags: [], cat: "all", genres: [] };
  var activeLab = null; // 当前挂载的实验 {destroy}

  /* ---------- 工具 ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // 在纯文本中高亮若干关键词，返回安全 HTML
  function highlight(text, terms) {
    var safe = escapeHtml(text);
    (terms || []).forEach(function (term) {
      if (!term) return;
      var re = new RegExp("(" + escapeReg(escapeHtml(term)) + ")", "gi");
      safe = safe.replace(re, "<mark>$1</mark>");
    });
    return safe;
  }

  function matchItem(item, q) {
    if (!q) return true;
    q = q.toLowerCase();
    if (item.name.toLowerCase().indexOf(q) >= 0) return true;
    if (item.hook.toLowerCase().indexOf(q) >= 0) return true;
    if (item.why.toLowerCase().indexOf(q) >= 0) return true;
    if (item.tags.join(" ").toLowerCase().indexOf(q) >= 0) return true;
    return false;
  }

  function filterItems() {
    return ITEMS.filter(function (item) {
      if (state.cat !== "all" && item.cat !== state.cat) return false;
      if (state.genres.length && state.genres.indexOf(genreOf(item)) < 0) return false;
      if (state.tags.length && !state.tags.every(function (t) { return item.tags.indexOf(t) >= 0; })) return false;
      if (!matchItem(item, state.q)) return false;
      return true;
    });
  }

  // 切换某个标签（点击顶部标签云或卡片上的 #标签 都会调用）
  function toggleTag(name) {
    var i = state.tags.indexOf(name);
    if (i >= 0) state.tags.splice(i, 1); else state.tags.push(name);
    syncHash();
    renderTagCloud();
    render();
  }

  /* ---------- 渲染：标签云 ---------- */
  function renderTagCloud() {
    tagcloudEl.innerHTML = "";
    TAGS.slice().sort(function (a, b) { return b.count - a.count; }).forEach(function (tg) {
      var chip = document.createElement("button");
      chip.className = "tag-chip" + (state.tags.indexOf(tg.name) >= 0 ? " is-active" : "");
      chip.type = "button";
      chip.innerHTML = "#" + escapeHtml(tg.name) + '<span class="tag-count">' + tg.count + "</span>";
      chip.addEventListener("click", function () { toggleTag(tg.name); });
      tagcloudEl.appendChild(chip);
    });
  }

  /* ---------- 渲染：类别栏 ---------- */
  function renderGenreBar() {
    genrebarEl.innerHTML = "";
    var label = document.createElement("span");
    label.className = "genre-label";
    label.textContent = "类别";
    genrebarEl.appendChild(label);
    GENRES.forEach(function (g) {
      var chip = document.createElement("button");
      chip.className = "genre-chip" + (state.genres.indexOf(g.name) >= 0 ? " is-active" : "");
      chip.type = "button";
      chip.innerHTML = escapeHtml(g.name) + '<span class="tag-count">' + g.count + "</span>";
      chip.addEventListener("click", function () {
        // 单选：再次点击当前项则取消，否则只保留这一项（一次只能选一个类别）
        state.genres = (state.genres[0] === g.name) ? [] : [g.name];
        syncHash();
        renderGenreBar();
        render();
      });
      genrebarEl.appendChild(chip);
    });
  }

  /* ---------- 渲染：卡片 ---------- */
  function renderCards() {
    var list = filterItems();
    cardsEl.innerHTML = "";
    emptyEl.hidden = list.length > 0;
    var terms = state.q ? [state.q].concat(state.tags) : state.tags.slice();
    list.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      var tagsHtml = item.tags.map(function (t) {
        return '<span class="card-tag tag-click" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + "</span>";
      }).join("");
      card.innerHTML =
        '<div class="card-emoji">' + item.emoji + "</div>" +
        '<span class="card-cat ' + item.cat + '">' + CAT_LABEL[item.cat] + "</span>" +
        '<span class="card-genre">' + escapeHtml(genreOf(item)) + "</span>" +
        '<h3 class="card-name">' + highlight(item.name, terms) + "</h3>" +
        '<p class="card-hook">' + highlight(item.hook, terms) + "</p>" +
        '<div class="card-tags">' + tagsHtml + "</div>" +
        '<div class="card-dopamine">' + brainMeters(item) + "</div>" +
        '<span class="card-play">点击运行实验 →</span>';
      card.addEventListener("click", function (e) {
        var tg = e.target.closest(".card-tag");
        if (tg) { toggleTag(tg.getAttribute("data-tag")); return; }
        openModal(item);
      });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(item); } });
      cardsEl.appendChild(card);
    });
    resultCountEl.textContent = "共 " + list.length + " 个颓废方式" + (state.q || state.tags.length || state.genres.length || state.cat !== "all" ? "（已筛选）" : "");
  }

  function render() { renderCards(); renderActiveFilters(); }

  // 当前生效的筛选条件一览，点击单项可移除，或一键清除全部
  function renderActiveFilters() {
    var parts = [];
    if (state.cat !== "all") parts.push({ type: "cat", val: state.cat, label: CAT_LABEL[state.cat] });
    state.genres.forEach(function (g) { parts.push({ type: "genre", val: g, label: g }); });
    state.tags.forEach(function (t) { parts.push({ type: "tag", val: t, label: "#" + t }); });
    if (!parts.length) { activeFiltersEl.innerHTML = ""; return; }
    activeFiltersEl.innerHTML =
      '<span class="af-label">筛选中：</span>' +
      parts.map(function (p) {
        return '<button class="af-chip" type="button" data-type="' + p.type + '" data-val="' + escapeHtml(p.val) + '">' +
          escapeHtml(p.label) + ' <span class="af-x">×</span></button>';
      }).join("") +
      '<button class="af-clear" type="button" id="af-clear">清除全部</button>';
  }

  /* ---------- 详情弹层 ---------- */
  function openModal(item) {
    destroyLab();
    $("modal-emoji").textContent = item.emoji;
    var catEl = $("modal-cat");
    catEl.className = "modal-cat " + item.cat;
    catEl.textContent = CAT_LABEL[item.cat];
    $("modal-genre").textContent = genreOf(item);
    $("modal-title").textContent = item.name;
    $("modal-hook").textContent = item.hook;
    // 科普正文：把标签机制名高亮为 .mech
    var why = escapeHtml(item.why);
    item.tags.forEach(function (t) {
      var re = new RegExp("(" + escapeReg(escapeHtml(t)) + ")", "g");
      why = why.replace(re, '<span class="mech">$1</span>');
    });
    $("modal-explain").innerHTML = why;
    // 标签
    var tagsBox = $("modal-tags");
    tagsBox.innerHTML = "";
    item.tags.forEach(function (t) {
      var s = document.createElement("span");
      s.className = "card-tag";
      s.textContent = "#" + t;
      tagsBox.appendChild(s);
    });
    // 多巴胺指数
    $("modal-dopamine").innerHTML = brainMeters(item);
    // 先显示弹层，再挂载实验（否则 lab-stage 处于 display:none，canvas 量到 0×0）
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
    // 挂载实验（懒挂载）
    var stage = $("lab-stage");
    stage.innerHTML = "";
    var lab = LABS[item.lab];
    if (lab && lab.init) {
      try { activeLab = lab.init(stage); } catch (e) { stage.textContent = "实验加载失败：" + e.message; }
    } else {
      stage.textContent = "该条目暂无实验 🛠";
    }
  }

  function closeModal() {
    destroyLab();
    modalEl.hidden = true;
    document.body.style.overflow = "";
  }

  function destroyLab() {
    if (activeLab && activeLab.destroy) { try { activeLab.destroy(); } catch (e) {} }
    activeLab = null;
    var stage = $("lab-stage");
    if (stage) stage.innerHTML = "";
  }

  modalEl.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modalEl.hidden) closeModal();
  });

  /* ---------- 搜索 ---------- */
  var searchTimer = null;
  searchEl.addEventListener("input", function () {
    searchClearEl.hidden = !searchEl.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.q = searchEl.value.trim();
      syncHash();
      render();
    }, 120);
  });
  searchClearEl.addEventListener("click", function () {
    searchEl.value = ""; searchClearEl.hidden = true; state.q = ""; syncHash(); render(); searchEl.focus();
  });

  /* ---------- 分类切换 ---------- */
  catSwitchEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".cat-btn");
    if (!btn) return;
    state.cat = btn.getAttribute("data-cat");
    Array.prototype.forEach.call(catSwitchEl.children, function (b) { b.classList.toggle("is-active", b === btn); });
    syncHash();
    render();
  });

  // 筛选状态条：点单项移除，点「清除全部」重置
  activeFiltersEl.addEventListener("click", function (e) {
    if (e.target.closest("#af-clear")) {
      state.q = ""; searchEl.value = ""; searchClearEl.hidden = true;
      state.cat = "all"; state.tags = []; state.genres = [];
      syncHash();
      Array.prototype.forEach.call(catSwitchEl.children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-cat") === "all"); });
      renderTagCloud(); renderGenreBar(); render();
      return;
    }
    var chip = e.target.closest(".af-chip");
    if (!chip) return;
    var type = chip.getAttribute("data-type"), val = chip.getAttribute("data-val");
    if (type === "cat") {
      state.cat = "all";
      Array.prototype.forEach.call(catSwitchEl.children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-cat") === "all"); });
    } else if (type === "genre") {
      state.genres = state.genres.filter(function (g) { return g !== val; });
    } else if (type === "tag") {
      state.tags = state.tags.filter(function (t) { return t !== val; });
    }
    syncHash();
    renderTagCloud(); renderGenreBar(); render();
  });

  /* ---------- hash 状态 ---------- */
  function syncHash() {
    var parts = [];
    if (state.q) parts.push("q=" + encodeURIComponent(state.q));
    if (state.tags.length) parts.push("tag=" + state.tags.map(encodeURIComponent).join(","));
    if (state.genres.length) parts.push("genre=" + state.genres.map(encodeURIComponent).join(","));
    if (state.cat && state.cat !== "all") parts.push("cat=" + state.cat);
    var hash = parts.length ? "#" + parts.join("&") : "#";
    history.replaceState(null, "", hash);
  }

  function readHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return;
    h.split("&").forEach(function (kv) {
      var pair = kv.split("=");
      var k = pair[0], v = decodeURIComponent(pair[1] || "");
      if (k === "q") { state.q = v; searchEl.value = v; searchClearEl.hidden = !v; }
      else if (k === "tag") { state.tags = v ? v.split(",").filter(Boolean) : []; }
      else if (k === "genre") { state.genres = v ? v.split(",").filter(Boolean) : []; }
      else if (k === "cat") { state.cat = v || "all"; }
    });
    // 同步分类按钮
    Array.prototype.forEach.call(catSwitchEl.children, function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-cat") === state.cat);
    });
  }

  window.addEventListener("hashchange", function () {
    var prev = { q: state.q, tags: state.tags.slice(), cat: state.cat, genres: state.genres.slice() };
    readHash();
    var changed = prev.q !== state.q || prev.tags.join() !== state.tags.join() ||
      prev.cat !== state.cat || prev.genres.join() !== state.genres.join();
    if (changed) { renderGenreBar(); render(); }
  });

  /* ---------- 顶栏吸顶阴影 ---------- */
  window.addEventListener("scroll", function () {
    topbarEl.classList.toggle("is-stuck", window.scrollY > 10);
  }, { passive: true });

  /* ---------- Hero 数字滚动 ---------- */
  function animateStats() {
    var items = ITEMS.length;
    var tags = TAGS.length;
    var labs = Object.keys(LABS).length;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var bs = document.querySelectorAll("#hero-stats b");
    var targets = [items, tags, labs];
    if (reduced) {
      bs.forEach(function (b, i) { b.textContent = targets[i]; });
      return;
    }
    bs.forEach(function (b, i) {
      var target = targets[i], cur = 0, step = Math.max(1, Math.round(target / 24));
      var iv = setInterval(function () {
        cur = Math.min(target, cur + step);
        b.textContent = cur;
        if (cur >= target) clearInterval(iv);
      }, 24);
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    readHash();
    renderTagCloud();
    renderGenreBar();
    render();
    animateStats();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
