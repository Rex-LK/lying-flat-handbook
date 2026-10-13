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
  var GENRE_ORDER = ["美食", "宠物", "异宠", "电竞", "娱乐", "潮玩", "职场", "运动", "桌游"];
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

  // 受众 / 耗时维度（与 GUIDE_ITEMS 通过 id 关联）
  var AUD_LABEL = { busy: "忙里偷闲党", bored: "闲得发慌党", both: "通用" };
  function audOf(item) { return (window.GUIDE_AUDIENCE && window.GUIDE_AUDIENCE[item.id]) || "both"; }
  function durOf(item) { return (window.GUIDE_DURATION && window.GUIDE_DURATION[item.id]) || 60; }
  function fmtDur(m) { return m >= 60 ? (Math.round(m / 6) / 10) + " 小时" : m + " 分钟"; }
  // 成本 / 门槛维度
  function costOf(item) { return (window.GUIDE_COST && window.GUIDE_COST[item.id]); }
  function levelOf(item) { return (window.GUIDE_LEVEL && window.GUIDE_LEVEL[item.id]); }
  function howOf(item) { return (window.GUIDE_HOW && window.GUIDE_HOW[item.id]) || null; }
  var COST_META = { 0: { i: "💰", t: "免费" }, 1: { i: "💰", t: "小钱" }, 2: { i: "🛒", t: "需准备" } };
  var LEVEL_META = { 0: { i: "🎯", t: "新手友好" }, 1: { i: "🎯", t: "要上手" }, 2: { i: "🏆", t: "需钻研" } };
  // 我的待玩清单（localStorage）
  function getMylist() { try { return JSON.parse(localStorage.getItem("lfh_mylist") || "[]") || []; } catch (e) { return []; } }
  function inMylist(id) { return getMylist().indexOf(id) >= 0; }
  function toggleMylist(id) {
    var l = getMylist(), i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else l.push(id);
    try { localStorage.setItem("lfh_mylist", JSON.stringify(l)); } catch (e) {}
  }
  function updateMylistCount() {
    var el = $("mylist-count"); if (el) el.textContent = getMylist().length;
    var btn = $("mylist-btn"); if (btn) btn.classList.toggle("is-active", state.mylist);
  }
  function getHowDone(id) { try { return JSON.parse(localStorage.getItem("lfh_how_" + id) || "[]") || []; } catch (e) { return []; } }
  function saveHowDone(id, box) {
    var idx = [];
    Array.prototype.forEach.call(box.querySelectorAll(".how-step input"), function (cb) {
      if (cb.checked) idx.push(parseInt(cb.closest(".how-step").getAttribute("data-i"), 10));
    });
    try { localStorage.setItem("lfh_how_" + id, JSON.stringify(idx)); } catch (e) {}
  }
  // 卡片上的成本/门槛小徽章
  function metaBadges(item) {
    var c = costOf(item), l = levelOf(item), h = "";
    if (c != null) h += '<span class="card-meta card-cost c' + c + '">' + COST_META[c].i + " " + COST_META[c].t + "</span>";
    if (l != null) h += '<span class="card-meta card-level l' + l + '">' + LEVEL_META[l].i + " " + LEVEL_META[l].t + "</span>";
    return h;
  }
  // 按受众重排：上班族优先短耗时、无聊族优先长耗时
  function sortByAudience(list) {
    if (state.aud === "busy") list.sort(function (a, b) { return durOf(a) - durOf(b); });
    else if (state.aud === "bored") list.sort(function (a, b) { return durOf(b) - durOf(a); });
    return list;
  }

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
  var audSwitchEl = $("aud-switch");
  var genrebarEl = $("genrebar");
  var modalEl = $("modal");
  var topbarEl = $("topbar");
  var shareBtnEl = $("share-btn");
  var toTopEl = $("to-top");

  /* ---------- 状态 ---------- */
  var state = { q: "", tags: [], cat: "all", genres: [], aud: "all", mylist: false };
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
      if (state.aud !== "all") { var a = audOf(item); if (a !== state.aud && a !== "both") return false; }
      if (state.genres.length && state.genres.indexOf(genreOf(item)) < 0) return false;
      if (state.tags.length && !state.tags.every(function (t) { return item.tags.indexOf(t) >= 0; })) return false;
      if (state.mylist && !inMylist(item.id)) return false;
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
    var list = sortByAudience(filterItems());
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
        '<span class="card-time">⏱ 约 ' + fmtDur(durOf(item)) + "</span>" +
        metaBadges(item) +
        '<h3 class="card-name">' + highlight(item.name, terms) + "</h3>" +
        '<p class="card-hook">' + highlight(item.hook, terms) + "</p>" +
        '<div class="card-tags">' + tagsHtml + "</div>" +
        '<div class="card-dopamine">' + brainMeters(item) + "</div>" +
        '<div class="card-foot">' +
          '<span class="card-play">点击运行实验 →</span>' +
          '<button class="card-like" type="button" data-like="' + item.id + '" aria-label="点赞">' +
            '<span class="like-ico">🤍</span><span class="like-count">0</span>' +
          '</button>' +
        '</div>';
      card.addEventListener("click", function (e) {
        var tg = e.target.closest(".card-tag");
        if (tg) { toggleTag(tg.getAttribute("data-tag")); return; }
        var lk = e.target.closest(".card-like");
        if (lk) { onLikeClick(lk, item.id); return; }
        openModal(item);
      });
      card.addEventListener("keydown", function (e) {
        if (e.target.closest && e.target.closest(".card-like")) return; // 让赞按钮自己处理
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(item); }
      });
      cardsEl.appendChild(card);
    });
    hydrateCounts(list);
    var filtered = state.q || state.tags.length || state.genres.length || state.cat !== "all" || state.aud !== "all" || state.mylist;
    resultCountEl.textContent = "共 " + list.length + " 个玩法" + (filtered ? (state.mylist ? "（我的清单）" : "（已筛选）") : "");
  }

  // 拉取并填充当前卡片的点赞数 + 本机已赞态
  function hydrateCounts(list) {
    if (!window.LikeStore || !LikeStore.configured()) return;
    var ids = list.map(function (it) { return it.id; });
    LikeStore.hydrate(ids, function (map) {
      Array.prototype.forEach.call(cardsEl.querySelectorAll(".card-like"), function (btn) {
        var id = btn.getAttribute("data-like");
        var c = map[id];
        if (c != null) btn.querySelector(".like-count").textContent = c;
        if (LikeStore.hasLiked(id)) {
          btn.classList.add("liked");
          btn.querySelector(".like-ico").textContent = "❤️";
          btn.disabled = true;
        }
      });
    });
  }

  // 点击点赞：乐观更新 + 本机去重 + 失败回滚
  function onLikeClick(btn, id) {
    if (!window.LikeStore) return;
    if (LikeStore.hasLiked(id)) return;
    if (!LikeStore.configured()) { window.toast("点赞服务还没配置，让站长填一下 Supabase～"); return; }
    var countEl = btn.querySelector(".like-count");
    var icoEl = btn.querySelector(".like-ico");
    var prev = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = prev + 1;
    icoEl.textContent = "❤️";
    btn.classList.add("liked");
    btn.disabled = true;
    LikeStore._mark(id);
    LikeStore.like(id, function (newCount) {
      if (newCount == null) {
        countEl.textContent = prev;
        icoEl.textContent = "🤍";
        btn.classList.remove("liked");
        btn.disabled = false;
        LikeStore._unmark(id);
        window.toast("点赞没发出去，网络抽风了，稍后再试");
      } else if (typeof newCount === "number") {
        countEl.textContent = newCount;
      }
    });
  }

  function render() { renderCards(); renderActiveFilters(); renderJobs(); }

  // 当前生效的筛选条件一览，点击单项可移除，或一键清除全部
  function renderActiveFilters() {
    var parts = [];
    if (state.cat !== "all") parts.push({ type: "cat", val: state.cat, label: CAT_LABEL[state.cat] });
    if (state.aud !== "all") parts.push({ type: "aud", val: state.aud, label: AUD_LABEL[state.aud] });
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

  /* =========================================================
     今日盲盒 · 躺平抽签机
     以「日期」为种子抽一个条目：同一天结果稳定，零点自动换新；
     未开盒时是一个晃动的礼物盒，点击后有开盒动画，不喜欢可「换一个」。
     ========================================================= */
  var LUCKY_TEASERS = [
    "盲盒卖的是不确定性——开盒前那两秒最上头。",
    "不知道里面是什么，才是快乐的来源。",
    "变比率强化：下一个说不定更爽。",
    "抽到什么算什么，反正都是躺平。",
    "今天也要好好浪费时间呀。"
  ];
  var LUCKY_FORTUNES = [
    "今日宜躺平，忌加班。",
    "抽中这条，说明宇宙让你歇会儿。",
    "别问为什么，问就是命中注定。",
    "今日运势：多巴胺在线，烦恼离线。",
    "这条很对你胃口，照做就行。",
    "今日份的快乐已到账，请查收。",
    "勉强算个好兆头，先开心为敬。"
  ];
  var LUCKY_KEY = "lfh-lucky-v1";
  var luckyBoxEl = $("lucky-box");
  var luckySubEl = $("lucky-sub");
  var LUCKY_READY = ITEMS.length > 0 && !!luckyBoxEl;
  var luckyState = { opened: false, item: null, used: [], draws: 0 };
  var luckyTimer = null;

  function itemById(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }
  function dayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function dayText() {
    var d = new Date();
    return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日";
  }
  // 简单字符串哈希（FNV-1a），保证同一天算出的下标稳定
  function hashSeed(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }
  // 今日主推：由日期决定，同一天永远是同一个
  function dailyItem() {
    return ITEMS[hashSeed(dayKey() + "|lying-flat") % ITEMS.length];
  }
  // 换一个：随机挑一个今天没抽过的；全抽完则重新洗牌
  function nextItem() {
    var pool = ITEMS.filter(function (it) { return luckyState.used.indexOf(it.id) < 0; });
    if (!pool.length) { luckyState.used = []; pool = ITEMS.slice(); }
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function loadLucky() {
    try { var raw = window.localStorage.getItem(LUCKY_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function saveLucky() {
    try {
      window.localStorage.setItem(LUCKY_KEY, JSON.stringify({
        date: dayKey(),
        id: luckyState.item ? luckyState.item.id : "",
        used: luckyState.used,
        draws: luckyState.draws
      }));
    } catch (e) {}
  }
  function sparksHtml() {
    var colors = ["var(--cyan)", "var(--pink)", "var(--amber)"], s = "";
    for (var i = 0; i < 10; i++) {
      s += '<span class="lb-spark" style="--a:' + (i * 36) + 'deg;--d:' + (54 + (i % 4) * 16) +
        "px;background:" + colors[i % 3] + '"></span>';
    }
    return s;
  }
  function sealedHtml() {
    return '<button class="lb-sealed" id="lb-open" type="button">' +
      '<span class="lb-gift">🎁</span>' +
      '<span class="lb-hint">点击开启今日盲盒</span>' +
      '<span class="lb-date">' + dayText() + ' · 今日限定</span>' +
      "</button>";
  }
  /* ---------- 盲盒下方：相关推荐（每次 3 个 + 换一批） ---------- */
  function dopaOf(id) { return (window.GUIDE_DOPAMINE && window.GUIDE_DOPAMINE[id]) || 0; }
  function sharedTags(a, b) {
    var n = 0;
    for (var i = 0; i < a.tags.length; i++) if (b.tags.indexOf(a.tags[i]) >= 0) n++;
    return n;
  }
  function shuffleArr(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  // 候选排序：标签重合度为主、多巴胺为辅
  function rankedPool(item) {
    var arr = ITEMS.filter(function (it) { return it.id !== item.id; });
    arr.sort(function (a, b) {
      var oa = sharedTags(item, a), ob = sharedTags(item, b);
      if (ob !== oa) return ob - oa;
      return dopaOf(b) - dopaOf(a);
    });
    return arr;
  }
  var luckyRecoOrder = [];  // 候选 id 顺序（按相关度）
  var luckyRecoCursor = 0;  // 当前批次起点
  function resetRecos() { luckyRecoOrder = []; luckyRecoCursor = 0; }
  function ensureRecoOrder(item) {
    if (luckyRecoOrder.length) return;
    luckyRecoOrder = rankedPool(item).map(function (it) { return it.id; });
    luckyRecoCursor = 0;
  }
  function currentRecos(item) {
    ensureRecoOrder(item);
    var n = luckyRecoOrder.length, out = [];
    for (var i = 0; i < 3 && i < n; i++) {
      var it = itemById(luckyRecoOrder[(luckyRecoCursor + i) % n]);
      if (it) out.push(it);
    }
    return out;
  }
  function recoCardHtml(it) {
    return '<button class="lb-reco" type="button" data-reco="' + it.id + '">' +
      '<span class="lb-reco-emoji">' + it.emoji + "</span>" +
      '<span class="lb-reco-body"><b>' + escapeHtml(it.name) + "</b>" +
      '<small>' + escapeHtml(it.hook) + "</small></span>" +
      '<span class="lb-reco-go">打开 →</span></button>';
  }
  function recosHtml(item) { return currentRecos(item).map(recoCardHtml).join(""); }
  function shuffleRecos() {
    var n = luckyRecoOrder.length;
    if (!n) return;
    luckyRecoCursor = (luckyRecoCursor + 3) % n;
    if (luckyRecoCursor === 0) shuffleArr(luckyRecoOrder); // 绕完一圈换新顺序，增加变化
    var list = document.getElementById("lb-recos-list");
    if (list) list.innerHTML = recosHtml(luckyState.item);
  }

  function openedHtml(item) {
    var tagsHtml = item.tags.map(function (t) {
      return '<button class="lb-tag" type="button" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + "</button>";
    }).join("");
    return '<div class="lb-open">' +
      '<span class="lb-flash"></span>' + sparksHtml() +
      '<div class="lb-result">' +
        '<div class="lb-emoji">' + item.emoji + "</div>" +
        '<div class="lb-meta">' +
          '<span class="card-cat ' + item.cat + '">' + CAT_LABEL[item.cat] + "</span>" +
          '<span class="lb-genre">' + escapeHtml(genreOf(item)) + "</span>" +
          '<h3 class="lb-name">' + escapeHtml(item.name) + "</h3>" +
          '<p class="lb-hook">' + escapeHtml(item.hook) + "</p>" +
          '<p class="lb-fortune">🥠 ' + LUCKY_FORTUNES[Math.floor(Math.random() * LUCKY_FORTUNES.length)] + "</p>" +
          '<div class="lb-tags">' + tagsHtml + "</div>" +
          '<div class="lb-dopamine">' + brainMeters(item) + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="lb-actions">' +
        '<button class="lb-btn lb-again" id="lb-again" type="button">🔁 换一个</button>' +
        '<button class="lb-btn lb-play" id="lb-play" type="button">🧪 打开它的实验</button>' +
        '<button class="lb-btn lb-poster" id="lb-poster" type="button">🖼️ 今日签</button>' +
        '<span class="lb-count">今日第 <b>' + luckyState.draws + "</b> 抽</span>" +
      "</div>" +
      '<div class="lb-recos">' +
        '<div class="lb-recos-head">' +
          '<span class="lb-recos-title">🔎 顺着这条，再看看这几个</span>' +
          '<button class="lb-btn lb-shuffle" id="lb-shuffle" type="button">🎲 换一批</button>' +
        "</div>" +
        '<div class="lb-recos-list" id="lb-recos-list">' + recosHtml(item) + "</div>" +
      "</div>" +
      "</div>";
  }
  function renderLucky() {
    if (!LUCKY_READY) return;
    luckyBoxEl.classList.remove("is-reveal");
    luckyBoxEl.innerHTML = luckyState.opened ? openedHtml(luckyState.item) : sealedHtml();
    if (luckySubEl && luckyState.opened) {
      luckySubEl.textContent = dayText() + " 的盲盒已开启。不喜欢就点「换一个」，今天抽到满意为止。";
    }
  }
  function openBox(item, animate) {
    if (!LUCKY_READY || !item) return;
    luckyState.item = item;
    resetRecos();
    luckyState.opened = true;
    if (luckyState.used.indexOf(item.id) < 0) luckyState.used.push(item.id);
    luckyState.draws += 1;
    saveLucky();
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduced) { renderLucky(); return; }
    clearTimeout(luckyTimer);
    luckyBoxEl.classList.remove("is-reveal");
    luckyBoxEl.classList.add("is-opening");
    luckyBoxEl.innerHTML = sealedHtml();
    luckyTimer = setTimeout(function () {
      luckyBoxEl.classList.remove("is-opening");
      renderLucky();
      void luckyBoxEl.offsetWidth; // 强制重排，重启揭晓动画
      luckyBoxEl.classList.add("is-reveal");
    }, 520);
  }
  function mountLucky() {
    if (!LUCKY_READY) return;
    var saved = loadLucky();
    if (saved && saved.date === dayKey()) {
      var it = itemById(saved.id);
      if (it) {
        luckyState.item = it;
        luckyState.opened = true;
        luckyState.used = saved.used && saved.used.length ? saved.used.slice() : [it.id];
        luckyState.draws = saved.draws || 1;
      }
    }
    if (!luckyState.item) luckyState.item = dailyItem();
    if (luckySubEl && !luckyState.opened) {
      luckySubEl.textContent = "每天零点自动换一个推荐。" +
        LUCKY_TEASERS[hashSeed(dayKey()) % LUCKY_TEASERS.length];
    }
    renderLucky();
  }

  if (LUCKY_READY) {
    luckyBoxEl.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("#lb-open")) { openBox(luckyState.item || dailyItem(), true); return; }
      if (t.closest("#lb-again")) { openBox(nextItem(), true); return; }
      if (t.closest("#lb-play")) { if (luckyState.item) openModal(luckyState.item); return; }
      if (t.closest("#lb-poster")) { if (luckyState.item && window.GUIDE_PERSONA) window.GUIDE_PERSONA.posterFromItem(luckyState.item); return; }
      if (t.closest("#lb-shuffle")) { shuffleRecos(); return; }
      var rc = t.closest("[data-reco]");
      if (rc) { var rit = itemById(rc.getAttribute("data-reco")); if (rit) openModal(rit); return; }
      var tg = t.closest(".lb-tag");
      if (tg) { toggleTag(tg.getAttribute("data-tag")); scrollToSection("entries"); }
    });
  }

  /* ---------- 复制分享链接 / 回到顶部 ---------- */
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    try {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  }
  if (shareBtnEl) {
    shareBtnEl.addEventListener("click", function () {
      copyText(location.href).then(function () {
        var old = shareBtnEl.textContent;
        shareBtnEl.textContent = "✅ 已复制";
        shareBtnEl.classList.add("is-copied");
        setTimeout(function () { shareBtnEl.textContent = old; shareBtnEl.classList.remove("is-copied"); }, 1600);
      }).catch(function () {
        shareBtnEl.textContent = "⚠️ 复制失败";
        setTimeout(function () { shareBtnEl.textContent = "🔗 复制分享链接"; }, 1600);
      });
    });
  }
  if (toTopEl) {
    toTopEl.addEventListener("click", function () {
      toTopEl.classList.add("is-launch");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(function () { toTopEl.classList.remove("is-launch"); }, 600);
    });
    window.addEventListener("scroll", function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      toTopEl.classList.toggle("is-show", y > 600);
    }, { passive: true });
  }

  /* =========================================================
     职业爽感时刻表
     每行一个职业 × 每列一天 24 小时的热力表，
     回答「哪些职业在什么时候能发挥最大爽感」。
     ========================================================= */
  var JOBS = window.GUIDE_JOBS || [];
  var JOB_FIELD_ORDER = ["技术派", "创意派", "现场派", "助人派", "奔走派", "生意派", "匠心派"];
  var jobState = { field: "", open: null, hour: 0, touched: false };

  var topnavEl = $("topnav");
  var jobFieldsEl = $("jobs-fields");
  var jobsGridEl = $("jobs-grid");
  var jobsRankEl = $("jobs-rank");
  var hourRangeEl = $("hour-range");
  var hourLabelEl = $("hour-label");
  var hourNowEl = $("hour-now");
  var jobsClockEl = $("jobs-clock");
  var clockNowEl = $("clock-now");
  var clockJobEl = $("clock-job");
  var clockDescEl = $("clock-desc");
  var JOBS_READY = JOBS.length > 0 && !!jobsGridEl;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function hourText(h) { return pad2(h) + ":00"; }
  function nowHour() { return new Date().getHours(); }

  // 某小时到某个时段窗口的距离（支持跨零点），在窗口内为 0
  function windowDistance(h, win) {
    var inside = win.from <= win.to ? (h >= win.from && h <= win.to) : (h >= win.from || h <= win.to);
    if (inside) return 0;
    return Math.min((win.from - h + 24) % 24, (h - win.to + 24) % 24);
  }

  // 某职业在某小时的爽感强度 0-100： Baseline + 各时段的高斯衰减
  function jobHeat(job, h) {
    var v = 6; // 底线：毕竟是在上班
    job.peaks.forEach(function (win) {
      var d = windowDistance(h, win);
      v = Math.max(v, win.heat * Math.exp(-(d * d) / 6));
    });
    return Math.round(v);
  }

  // 热度 → 颜色（蓝 → 紫 → 洋红的热力渐变）
  function heatStyle(v) {
    var t = Math.max(0, Math.min(100, v)) / 100;
    var hue = Math.round(220 + t * 125);
    var alpha = (0.10 + 0.72 * t).toFixed(2);
    return "background:hsla(" + hue + ",85%,58%," + alpha + ")";
  }

  function isPeakHour(job, h) {
    return job.peaks.some(function (win) { return windowDistance(h, win) === 0; });
  }

  function matchJob(job, q) {
    q = String(q).toLowerCase();
    var hay = [job.name, job.field, job.peak, job.moment, job.why, job.tags.join(" ")].join(" ").toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function jobMatches(job) {
    if (jobState.field && job.field !== jobState.field) return false;
    if (state.tags.length && !state.tags.every(function (t) { return job.tags.indexOf(t) >= 0; })) return false;
    if (state.q && !matchJob(job, state.q)) return false;
    return true;
  }

  function visibleJobs() { return JOBS.filter(jobMatches); }

  /* ---------- 领域筛选 chips ---------- */
  function renderJobFields() {
    var counts = {};
    JOBS.forEach(function (j) { counts[j.field] = (counts[j.field] || 0) + 1; });
    var fields = JOB_FIELD_ORDER.filter(function (f) { return counts[f]; }).concat(
      Object.keys(counts).filter(function (f) { return JOB_FIELD_ORDER.indexOf(f) < 0; })
    );
    jobFieldsEl.innerHTML = "";
    var all = document.createElement("button");
    all.className = "jf-chip" + (jobState.field ? "" : " is-active");
    all.type = "button";
    all.innerHTML = '全部领域<span class="tag-count">' + JOBS.length + "</span>";
    all.addEventListener("click", function () { jobState.field = ""; renderJobFields(); renderJobs(); });
    jobFieldsEl.appendChild(all);
    fields.forEach(function (f) {
      var chip = document.createElement("button");
      chip.className = "jf-chip" + (jobState.field === f ? " is-active" : "");
      chip.type = "button";
      chip.innerHTML = escapeHtml(f) + '<span class="tag-count">' + counts[f] + "</span>";
      chip.addEventListener("click", function () {
        jobState.field = (jobState.field === f) ? "" : f;
        renderJobFields();
        renderJobs();
      });
      jobFieldsEl.appendChild(chip);
    });
  }

  /* ---------- 详情：职业卡展开内容 ---------- */
  function jobDetailHtml(job) {
    var terms = state.q ? [state.q].concat(state.tags) : state.tags.slice();
    var why = escapeHtml(job.why);
    job.tags.forEach(function (t) {
      why = why.replace(new RegExp("(" + escapeReg(escapeHtml(t)) + ")", "g"), '<span class="mech">$1</span>');
    });
    var peaks = job.peaks.map(function (win) {
      return '<span class="jd-win">' + hourText(win.from) + "–" + hourText(win.to === 24 ? 24 : win.to) +
        '<b> ' + win.heat + "</b></span>";
    }).join("");
    var tags = job.tags.map(function (t) {
      return '<span class="card-tag tag-click" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + "</span>";
    }).join("");
    return '<div class="jd-head">' +
        '<div class="jd-emoji">' + job.emoji + "</div>" +
        '<div class="jd-title"><span class="jd-field">' + escapeHtml(job.field) + "</span>" +
          "<h3>" + highlight(job.name, terms) + "</h3>" +
          '<p class="jd-moment">' + highlight(job.moment, terms) + "</p></div>" +
        '<span class="jd-badge">爽感峰值 <b>' + escapeHtml(job.peak) + "</b></span>" +
      "</div>" +
      '<p class="jd-why">' + why + "</p>" +
      '<div class="jd-meters">' + meter("🧠 多巴胺指数", job.score.dopamine, "") +
        meter("💜 内啡肽指数", job.score.endorphin, " endorphin") + "</div>" +
      '<div class="jd-row"><span class="jd-key">高光时刻</span><div class="jd-wins">' + peaks + "</div></div>" +
      '<div class="jd-row"><span class="jd-key">爽点机制</span><div class="jd-tags">' + tags + "</div></div>" +
      '<div class="jd-hint">点机制标签可回看「同机制」的颓废条目 →</div>';
  }

  /* ---------- 热力表 ---------- */
  function renderJobs() {
    if (!JOBS_READY) return;
    var list = visibleJobs();
    var terms = state.q ? [state.q].concat(state.tags) : state.tags.slice();
    var nowH = nowHour();
    jobsGridEl.innerHTML = "";

    if (!list.length) {
      jobsGridEl.innerHTML = '<div class="jobs-none">没有匹配的职业，换个关键词或清除筛选试试。</div>';
      jobsRankEl.innerHTML = "";
      return;
    }

    // 表头：24 小时刻度
    var head = document.createElement("div");
    head.className = "jr-row jr-head";
    head.innerHTML = '<span class="jr-name jr-name-head">职业 / 时段</span>';
    for (var h = 0; h < 24; h++) {
      var hc = document.createElement("button");
      hc.className = "jh-hour" + (h === nowH ? " is-now" : "");
      hc.type = "button";
      hc.setAttribute("data-h", h);
      hc.textContent = (h % 2 === 0) ? String(h) : "";
      hc.title = "查看 " + hourText(h) + " 的爽感排行";
      (function (hh) {
        hc.addEventListener("click", function () { jobState.touched = true; selectHour(hh); });
      })(h);
      head.appendChild(hc);
    }
    jobsGridEl.appendChild(head);

    list.forEach(function (job) {
      var block = document.createElement("div");
      block.className = "jr-block";

      var row = document.createElement("div");
      row.className = "jr-row";
      var name = document.createElement("button");
      name.className = "jr-name";
      name.type = "button";
      name.innerHTML = '<span class="jr-emoji">' + job.emoji + "</span>" +
        '<span class="jr-text"><b>' + highlight(job.name, terms) + "</b>" +
        "<small>" + escapeHtml(job.field) + " · " + escapeHtml(job.peak) + "</small></span>" +
        '<span class="jr-arrow">' + (jobState.open === job.id ? "▲" : "▼") + "</span>";
      name.addEventListener("click", function () { toggleJob(job.id); });
      row.appendChild(name);

      for (var h = 0; h < 24; h++) {
        var v = jobHeat(job, h);
        var cell = document.createElement("button");
        cell.className = "jc" + (v >= 82 ? " is-hot" : "") + (isPeakHour(job, h) ? " is-peak" : "");
        cell.type = "button";
        cell.setAttribute("data-h", h);
        cell.setAttribute("aria-label", job.name + " " + hourText(h) + " 爽感 " + v);
        cell.title = hourText(h) + " · 爽感 " + v;
        cell.style.cssText = heatStyle(v);
        (function (jj, hh) {
          cell.addEventListener("click", function () {
            jobState.touched = true;
            selectHour(hh);
            toggleJob(jj.id, true);
          });
        })(job, h);
        row.appendChild(cell);
      }
      block.appendChild(row);

      if (jobState.open === job.id) {
        var detail = document.createElement("div");
        detail.className = "jr-detail";
        detail.id = "jd-" + job.id;
        detail.innerHTML = jobDetailHtml(job);
        block.appendChild(detail);
        Array.prototype.forEach.call(detail.querySelectorAll(".tag-click"), function (el) {
          el.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleTag(el.getAttribute("data-tag"));
            scrollToSection("entries");
          });
        });
      }
      jobsGridEl.appendChild(block);
    });

    highlightHour();
    renderRank();
  }

  function toggleJob(id, forceOpen) {
    jobState.open = (jobState.open === id && !forceOpen) ? null : id;
    renderJobs();
  }

  /* ---------- 小时联动 ---------- */
  function selectHour(h) {
    jobState.hour = h;
    if (hourRangeEl) hourRangeEl.value = h;
    if (hourLabelEl) hourLabelEl.textContent = hourText(h);
    highlightHour();
    renderRank();
  }

  function highlightHour() {
    if (!jobsGridEl) return;
    Array.prototype.forEach.call(jobsGridEl.querySelectorAll(".is-sel"), function (el) { el.classList.remove("is-sel"); });
    Array.prototype.forEach.call(jobsGridEl.querySelectorAll('[data-h="' + jobState.hour + '"]'), function (el) {
      el.classList.add("is-sel");
    });
  }

  function renderRank() {
    if (!jobsRankEl) return;
    var list = visibleJobs().map(function (j) { return { job: j, heat: jobHeat(j, jobState.hour) }; })
      .sort(function (a, b) { return b.heat - a.heat; })
      .slice(0, 6);
    if (!list.length) {
      jobsRankEl.innerHTML = '<div class="rank-none">这个点整，暂时没人爽 🫠</div>';
      return;
    }
    jobsRankEl.innerHTML = '<div class="rank-head"><span>' + hourText(jobState.hour) + " 的爽感排行</span>" +
      "<small>越靠前 = 此刻越接近该职业的高光时刻</small></div>" +
      list.map(function (x, i) {
        return '<button class="rank-item' + (i === 0 ? " is-top" : "") + (jobState.open === x.job.id ? " is-open" : "") +
          '" type="button" data-job="' + x.job.id + '">' +
          '<span class="rank-no">' + (i + 1) + "</span>" +
          '<span class="rank-emoji">' + x.job.emoji + "</span>" +
          '<span class="rank-main"><b>' + escapeHtml(x.job.name) + "</b><small>" + escapeHtml(x.job.moment) + "</small></span>" +
          '<span class="rank-heat" style="' + heatStyle(x.heat) + '">' + x.heat + "</span>" +
          "</button>";
      }).join("");
    Array.prototype.forEach.call(jobsRankEl.querySelectorAll(".rank-item"), function (el) {
      el.addEventListener("click", function () { toggleJob(el.getAttribute("data-job")); });
    });
  }

  /* ---------- 此刻面板 ---------- */
  function updateClock() {
    var d = new Date();
    if (clockNowEl) clockNowEl.textContent = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    if (!JOBS.length) return;
    var top = JOBS.slice().sort(function (a, b) { return jobHeat(b, d.getHours()) - jobHeat(a, d.getHours()); })[0];
    if (!top) return;
    if (clockJobEl) clockJobEl.textContent = top.emoji + " " + top.name;
    if (clockDescEl) clockDescEl.textContent = top.moment;
  }

  /* ---------- 导航锚点滚动 ---------- */
  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var y = target.getBoundingClientRect().top + (window.pageYOffset || 0) - 68;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  if (topnavEl) {
    topnavEl.addEventListener("click", function (e) {
      var b = e.target.closest(".nav-btn");
      if (!b) return;
      Array.prototype.forEach.call(topnavEl.children, function (c) { c.classList.toggle("is-active", c === b); });
      scrollToSection(b.getAttribute("data-goto"));
    });
  }

  if (JOBS_READY) {
    if (hourRangeEl) {
      hourRangeEl.addEventListener("input", function () {
        jobState.touched = true;
        selectHour(parseInt(hourRangeEl.value, 10));
      });
    }
    if (hourNowEl) {
      hourNowEl.addEventListener("click", function () { jobState.touched = false; selectHour(nowHour()); });
    }
    // 点顶部「此刻最爽」卡片：跳到职业区并定位到此刻那一列
    if (jobsClockEl) {
      var gotoClock = function () {
        jobState.touched = false;
        selectHour(nowHour());
        scrollToSection("jobs");
      };
      jobsClockEl.addEventListener("click", gotoClock);
      jobsClockEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); gotoClock(); }
      });
    }
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
    // 成本 / 门槛 / 耗时 元信息
    renderModalMeta(item);
    // 「怎么玩」教学清单（含受众专属路径）
    renderHow(item);
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

  // 弹窗元信息：耗时 / 成本 / 门槛 / 受众
  function renderModalMeta(item) {
    var el = $("modal-meta"); if (!el) return;
    var c = costOf(item), l = levelOf(item), a = audOf(item);
    var parts = ['<span class="mm">⏱ 约 ' + fmtDur(durOf(item)) + "</span>"];
    if (c != null) parts.push('<span class="mm c' + c + '">' + COST_META[c].i + " " + COST_META[c].t + "</span>");
    if (l != null) parts.push('<span class="mm l' + l + '">' + LEVEL_META[l].i + " " + LEVEL_META[l].t + "</span>");
    if (a !== "both") parts.push('<span class="mm">👤 ' + AUD_LABEL[a] + "</span>");
    el.innerHTML = parts.join("");
  }

  // 「怎么玩」教学清单：根据当前受众选择步骤，并支持勾选与本地保存
  function renderHow(item) {
    var box = $("modal-how"); if (!box) return;
    var h = howOf(item);
    if (!h) { box.hidden = true; return; }
    box.hidden = false;
    var aud = state.aud;
    var steps = (aud === "busy" && h.busy) ? h.busy
      : (aud === "bored" && h.bored) ? h.bored
      : h.steps;
    var audNote = (aud === "busy" && h.busy) ? "为你：忙里偷闲党精简版"
      : (aud === "bored" && h.bored) ? "为你：闲得发慌党沉浸版"
      : "";
    var need = h.need || [];
    var saved = getHowDone(item.id);
    var stepsHtml = (steps || []).map(function (s, i) {
      var on = saved.indexOf(i) >= 0;
      return '<li class="how-step' + (on ? " done" : "") + '" data-i="' + i + '">' +
        '<label><input type="checkbox"' + (on ? " checked" : "") + "><span>" + escapeHtml(s) + "</span></label></li>";
    }).join("");
    var needHtml = need.length
      ? '<div class="how-need">准备：' + need.map(function (n) { return "<span>" + escapeHtml(n) + "</span>"; }).join("") + "</div>"
      : "";
    var tip = (aud === "busy" && h.busyTip) ? h.busyTip
      : (aud === "bored" && h.boredTip) ? h.boredTip
      : h.tip;
    box.innerHTML =
      '<div class="how-head">📋 怎么玩' + (audNote ? ' <span class="how-aud">' + escapeHtml(audNote) + "</span>" : "") + "</div>" +
      needHtml +
      '<ol class="how-steps">' + stepsHtml + "</ol>" +
      (tip ? '<div class="how-tip">💡 ' + escapeHtml(tip) + "</div>" : "") +
      '<button class="save-todo" id="save-todo" type="button"></button>';
    Array.prototype.forEach.call(box.querySelectorAll(".how-step input"), function (cb) {
      cb.addEventListener("change", function () {
        cb.closest(".how-step").classList.toggle("done", cb.checked);
        saveHowDone(item.id, box);
      });
    });
    wireSaveTodo(item);
  }

  // 我的待玩清单：弹窗内的加入/移除按钮
  function wireSaveTodo(item) {
    var btn = $("save-todo"); if (!btn) return;
    function paint() {
      if (inMylist(item.id)) { btn.classList.add("on"); btn.textContent = "✅ 已在我的待玩清单"; }
      else { btn.classList.remove("on"); btn.textContent = "📌 加入我的待玩清单"; }
    }
    paint();
    btn.onclick = function () {
      toggleMylist(item.id);
      paint();
      updateMylistCount();
      window.toast(inMylist(item.id) ? "已加入你的待玩清单 📌" : "已从清单移除");
    };
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

  /* ---------- 受众切换 ---------- */
  audSwitchEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".cat-btn");
    if (!btn) return;
    state.aud = btn.getAttribute("data-aud");
    Array.prototype.forEach.call(audSwitchEl.children, function (b) { b.classList.toggle("is-active", b === btn); });
    syncHash();
    render();
  });

  /* ---------- 我的待玩清单 ---------- */
  var mylistBtnEl = $("mylist-btn");
  if (mylistBtnEl) mylistBtnEl.addEventListener("click", function () {
    state.mylist = !state.mylist;
    updateMylistCount();
    syncHash();
    render();
  });

  // 筛选状态条：点单项移除，点「清除全部」重置
  activeFiltersEl.addEventListener("click", function (e) {
    if (e.target.closest("#af-clear")) {
      state.q = ""; searchEl.value = ""; searchClearEl.hidden = true;
      state.cat = "all"; state.tags = []; state.genres = []; state.aud = "all"; state.mylist = false;
      syncHash();
      Array.prototype.forEach.call(catSwitchEl.children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-cat") === "all"); });
      Array.prototype.forEach.call(audSwitchEl.children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-aud") === "all"); });
      updateMylistCount();
      renderTagCloud(); renderGenreBar(); render();
      return;
    }
    var chip = e.target.closest(".af-chip");
    if (!chip) return;
    var type = chip.getAttribute("data-type"), val = chip.getAttribute("data-val");
    if (type === "cat") {
      state.cat = "all";
      Array.prototype.forEach.call(catSwitchEl.children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-cat") === "all"); });
    } else if (type === "aud") {
      state.aud = "all";
      Array.prototype.forEach.call(audSwitchEl.children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-aud") === "all"); });
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
    if (state.aud && state.aud !== "all") parts.push("aud=" + state.aud);
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
      else if (k === "aud") { state.aud = v || "all"; }
    });
    // 同步分类按钮
    Array.prototype.forEach.call(catSwitchEl.children, function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-cat") === state.cat);
    });
    Array.prototype.forEach.call(audSwitchEl.children, function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-aud") === state.aud);
    });
  }

  window.addEventListener("hashchange", function () {
    var prev = { q: state.q, tags: state.tags.slice(), cat: state.cat, genres: state.genres.slice(), aud: state.aud };
    readHash();
    var changed = prev.q !== state.q || prev.tags.join() !== state.tags.join() ||
      prev.cat !== state.cat || prev.genres.join() !== state.genres.join() || prev.aud !== state.aud;
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
    var targets = [items, tags, labs, JOBS.length];
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

  /* ---------- 职业模块挂载 ---------- */
  function mountJobs() {
    if (!JOBS_READY) return;
    var navCount = $("nav-job-count");
    if (navCount) navCount.textContent = JOBS.length;
    renderJobFields();
    selectHour(nowHour());
    updateClock();
    renderJobs();
    // 每分钟刷新「此刻」；用户没手动拖过时间轴时，自动跟随真实时间
    setInterval(function () {
      updateClock();
      if (!jobState.touched && nowHour() !== jobState.hour) selectHour(nowHour());
    }, 60000);
  }

  /* ---------- 摸鱼人格 ---------- */
  function mountPersona() {
    if (window.GUIDE_PERSONA && window.GUIDE_PERSONA.setOnPickItem) window.GUIDE_PERSONA.setOnPickItem(openModal);
    var box = $("persona-box");
    if (box && window.GUIDE_PERSONA) window.GUIDE_PERSONA.mount(box);
  }

  /* ---------- 启动 ---------- */
  function init() {
    readHash();
    renderTagCloud();
    renderGenreBar();
    render();
    updateMylistCount();
    animateStats();
    mountLucky();
    mountJobs();
    mountPersona();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
