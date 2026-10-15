/* =========================================================
   半日闲 · 应用层
   渲染卡片 / 标签云 / 分类；实时搜索高亮；标签多选；hash 状态；
   详情弹层与实验懒挂载 / 销毁。
   全部经典脚本（无 module / 无 fetch），file:// 下完整可用。
   ========================================================= */
(function () {
  "use strict";

  var ITEMS = window.GUIDE_ITEMS || [];
  var TAGS = window.GUIDE_TAGS || [];
  var LABS = window.GUIDE_LABS || {};
  var currentItem = null; // 当前打开的条目，供分享海报使用

  // 机制标签 → 好处 / 促进指标 / 提高什么的友好说明（弹窗「这项能给你什么」用）
  // 只收「正向收益」类机制；时间黑洞 / 成瘾指数 / 沉没成本 等提醒类不在其中
  var MECH = {
    "多巴胺":     { desc: "快乐激素，带来即时的愉悦与行动动力", raise: "愉悦感 / 动力" },
    "内啡肽":     { desc: "运动后的天然愉悦感，缓解不适、提升耐受", raise: "愉悦感 / 抗压" },
    "血清素":     { desc: "情绪稳定剂，改善心情与睡眠质量", raise: "情绪稳定 / 睡眠" },
    "副交感":     { desc: "激活放松系统，心率与皮质醇下降", raise: "放松度" },
    "减压":       { desc: "直接拉低压力水平", raise: "抗压" },
    "心流":       { desc: "进入专注沉浸，忘记时间与烦恼", raise: "专注力" },
    "掌控感":     { desc: "自我效能感，觉得自己「能行」", raise: "自信" },
    "变比率强化": { desc: "不确定的奖励最让人上头，乐于再来一次", raise: "新鲜感" },
    "期待奖励":   { desc: "对「下一次」的期待本身就很爽", raise: "期待感" },
    "感官奖赏":   { desc: "触觉 / 听觉 / 味觉等直接快感", raise: "感官满足" },
    "节奏奖赏":   { desc: "稳定节奏带来舒适与掌控", raise: "节奏感" },
    "社交":       { desc: "人与人的连接，催产素上线", raise: "社交连接" },
    "操作性条件反射": { desc: "动作→反馈循环，越做越顺手", raise: "熟练度" },
    "近因效应":   { desc: "最近一次成功最难忘，推着你继续", raise: "动力" },
    "视角重置":   { desc: "拉远看问题，焦虑被稀释", raise: "豁达度" },
    "叙事传输":   { desc: "代入故事，暂时逃离现实", raise: "共情 / 抽离" },
    "糖脂协同":   { desc: "糖 + 脂肪双重刺激奖励中枢", raise: "满足感" },
    "蔡格尼克效应": { desc: "未完成的情节最让人惦记，欲罢不能", raise: "投入度" },
    "怀旧":       { desc: "熟悉的老玩法带来安全感与温暖", raise: "归属感" }
  };

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
    if (!tagcloudEl) return;
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
    if (!genrebarEl) return;
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

  function render() { renderCards(); renderActiveFilters(); }

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
     今日盲盒 · 闲趣抽签机
     以「日期」为种子抽一个条目：同一天结果稳定，零点自动换新；
     未开盒时是一个晃动的礼物盒，点击后有开盒动画，不喜欢可「换一个」。
     ========================================================= */
  var LUCKY_TEASERS = [
    "盲盒卖的是不确定性——开盒前那两秒最上头。",
    "不知道里面是什么，才是快乐的来源。",
    "变比率强化：下一个说不定更爽。",
    "抽到什么算什么，反正都是闲着。",
    "今天也要好好浪费时间呀。"
  ];
  var LUCKY_FORTUNES = [
    "今日宜偷闲，忌加班。",
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
    return ITEMS[hashSeed(dayKey() + "|banrixian") % ITEMS.length];
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
     时段爽感 —— 哪个项目在哪些时间段进行最爽
     回答「此刻 / 某个时段，最适合玩哪个项目」。
     依赖：window.GUIDE_TIMES[id] = [时段键]，时段键见 SLOT_DEFS。
     ========================================================= */
  var TIMES = window.GUIDE_TIMES || {};
  var SLOT_DEFS = [
    { key: "dawn",    icon: "🌅", label: "清晨", range: "05:00–09:00" },
    { key: "morning", icon: "🌞", label: "上午", range: "09:00–12:00" },
    { key: "noon",    icon: "☀️", label: "午后", range: "12:00–17:00" },
    { key: "evening", icon: "🌇", label: "傍晚", range: "17:00–19:00" },
    { key: "night",   icon: "🌃", label: "夜晚", range: "19:00–23:00" },
    { key: "late",    icon: "🌙", label: "深夜", range: "23:00–05:00" }
  ];
  var SLOT_KEYS = SLOT_DEFS.map(function (s) { return s.key; });
  var slotState = { key: "night", touched: false };

  var slotsEl = $("times-slots");
  var timesGridEl = $("times-grid");
  var timesNowEl = $("times-now");
  var timesClockEl = $("times-clock");
  var clockNowEl = $("clock-now");
  var clockJobEl = $("clock-job");
  var clockDescEl = $("clock-desc");
  var TIMES_READY = !!timesGridEl && Object.keys(TIMES).length > 0;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function nowHour() { return new Date().getHours(); }
  function slotOfHour(h) {
    if (h >= 5 && h < 9) return "dawn";
    if (h >= 9 && h < 12) return "morning";
    if (h >= 12 && h < 17) return "noon";
    if (h >= 17 && h < 19) return "evening";
    if (h >= 19 && h < 23) return "night";
    return "late";
  }
  function slotDef(key) {
    for (var i = 0; i < SLOT_DEFS.length; i++) if (SLOT_DEFS[i].key === key) return SLOT_DEFS[i];
    return SLOT_DEFS[4];
  }
  function itemsInSlot(key) {
    return ITEMS.filter(function (it) { var ts = TIMES[it.id]; return ts && ts.indexOf(key) >= 0; });
  }
  function slotTop(key, n) {
    return itemsInSlot(key).slice()
      .sort(function (a, b) { return (window.GUIDE_DOPAMINE[b.id] || 0) - (window.GUIDE_DOPAMINE[a.id] || 0); })
      .slice(0, n || 99);
  }

  /* ---------- 时段档 chips ---------- */
  function renderTimesSlots() {
    if (!slotsEl) return;
    slotsEl.innerHTML = "";
    SLOT_DEFS.forEach(function (s) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ts-chip" + (slotState.key === s.key ? " is-active" : "");
      chip.setAttribute("data-slot", s.key);
      chip.innerHTML = '<span class="ts-ico">' + s.icon + "</span>" + s.label + "<small>" + s.range + "</small>";
      chip.addEventListener("click", function () { slotState.touched = true; selectSlot(s.key); });
      slotsEl.appendChild(chip);
    });
  }

  /* ---------- 项目网格 ---------- */
  function renderTimes() {
    if (!TIMES_READY) return;
    var list = slotTop(slotState.key, 24);
    var def = slotDef(slotState.key);
    if (!timesGridEl) return;
    if (!list.length) {
      timesGridEl.innerHTML = '<div class="times-none">这个时段暂时没有特别标注的项目，换个时段看看～</div>';
      return;
    }
    timesGridEl.innerHTML = '<div class="times-cap">' + def.icon + " " + def.label +
      "（" + def.range + "）最对味的项目，按多巴胺指数排序：</div>" +
      list.map(function (it) {
        var tags = (it.tags || []).slice(0, 3).map(function (t) {
          return '<span class="card-tag">#' + escapeHtml(t) + "</span>";
        }).join("");
        return '<button class="ts-card" type="button" data-id="' + it.id + '">' +
          '<span class="ts-emoji">' + it.emoji + "</span>" +
          '<span class="ts-main"><b>' + escapeHtml(it.name) + "</b>" +
          "<small>" + escapeHtml(it.hook || "") + "</small></span>" +
          '<span class="ts-tags">' + tags + "</span></button>";
      }).join("");
    Array.prototype.forEach.call(timesGridEl.querySelectorAll(".ts-card"), function (el) {
      el.addEventListener("click", function () {
        var item = null;
        for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === el.getAttribute("data-id")) { item = ITEMS[i]; break; }
        if (item) openModal(item);
      });
    });
  }

  function selectSlot(key) {
    slotState.key = key;
    renderTimesSlots();
    renderTimes();
    updateClockTimes();
  }

  /* ---------- 此刻面板 ---------- */
  function updateClockTimes() {
    var d = new Date();
    if (clockNowEl) clockNowEl.textContent = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    var top = slotTop(slotOfHour(d.getHours()), 3);
    if (!top || !top.length) return;
    if (clockJobEl) clockJobEl.textContent = top.map(function (t) { return t.emoji + " " + t.name; }).join(" · ");
    if (clockDescEl) clockDescEl.textContent = "（" + slotDef(slotOfHour(d.getHours())).label + "推荐）";
  }

  /* ---------- 导航锚点滚动 ---------- */
  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var y = target.getBoundingClientRect().top + (window.pageYOffset || 0) - 68;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  var topnavEl = $("topnav");
  if (topnavEl) {
    topnavEl.addEventListener("click", function (e) {
      var b = e.target.closest(".nav-btn");
      if (!b) return;
      Array.prototype.forEach.call(topnavEl.children, function (c) { c.classList.toggle("is-active", c === b); });
      scrollToSection(b.getAttribute("data-goto"));
    });
  }

  if (TIMES_READY) {
    renderTimesSlots();
    selectSlot(slotOfHour(nowHour()));
    updateClockTimes();
    if (timesNowEl) {
      timesNowEl.addEventListener("click", function () { slotState.touched = false; selectSlot(slotOfHour(nowHour())); });
    }
    if (timesClockEl) {
      var gotoClock = function () { slotState.touched = false; selectSlot(slotOfHour(nowHour())); scrollToSection("times"); };
      timesClockEl.addEventListener("click", gotoClock);
      timesClockEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); gotoClock(); }
      });
    }
    setInterval(function () {
      updateClockTimes();
      if (!slotState.touched && slotState.key !== slotOfHour(nowHour())) selectSlot(slotOfHour(nowHour()));
    }, 60000);
  }

  /* ---------- 详情弹层 ---------- */
  // 弹窗「📈 这项能给你什么」：把条目的机制标签翻译成好处 / 促进指标 / 提高什么
  function renderBenefit(item) {
    var box = $("modal-benefit");
    if (!box) return;
    var keys = (item.tags || []).filter(function (t) { return MECH[t]; });
    if (!keys.length) { box.hidden = true; box.innerHTML = ""; return; }
    var raise = [];
    var rows = keys.map(function (t) {
      var m = MECH[t];
      if (m.raise && raise.indexOf(m.raise) < 0) raise.push(m.raise);
      return "<li><b>" + escapeHtml(t) + "</b>：" + escapeHtml(m.desc) + "</li>";
    }).join("");
    var promote = keys.map(escapeHtml).join(" · ");
    var raiseLine = raise.length ? '<div class="bn-raise">常提高：' + raise.map(escapeHtml).join(" · ") + "</div>" : "";
    box.hidden = false;
    box.innerHTML =
      '<div class="bn-head">📈 这项能给你什么</div>' +
      '<div class="bn-promote">促进指标：' + promote + "</div>" +
      raiseLine +
      '<ul class="bn-list">' + rows + "</ul>";
  }

  // 由条目机制标签推断最适合的摸鱼人格
  function personaKeyFor(item) {
    var t = item.tags || []; function h(n) { return t.indexOf(n) >= 0; }
    if (h("催产素") || h("副交感") || h("减压")) return "he";
    if (h("糖脂协同") || h("美拉德反应")) return "fo";
    if (h("社交")) return "so";
    if (h("血清素") || h("内啡肽")) return "mi";
    if (h("变比率强化") || h("收集欲") || h("期待奖励")) return "co";
    if (h("心流")) return "fl";
    if (h("掌控感")) return "ct";
    if (h("蔡格尼克效应") || h("时间黑洞")) return "ge";
    if (h("肾上腺素") || h("良性自虐") || h("嗅觉悖论")) return "qu";
    if (h("多巴胺")) return "fo";
    return "he";
  }
  function personaName(item) {
    var k = personaKeyFor(item);
    var T = window.GUIDE_PERSONA && window.GUIDE_PERSONA.TYPES;
    return (T && T[k] && T[k].name) ? T[k].name : "治愈躺平型";
  }
  function playFor(item) {
    var t = item.tags || []; function h(n) { return t.indexOf(n) >= 0; }
    if (h("社交")) return "喊上搭子，开一局，输赢都是快乐";
    if (h("糖脂协同") || h("美拉德反应")) return "趁热下嘴，香味不等人";
    if (h("催产素") || h("副交感") || h("减压")) return "上手就好，让它替你回血";
    if (h("内啡肽") || h("心流")) return "换上装备，动起来就对了";
    if (h("变比率强化") || h("期待奖励")) return "开之前先吸口气，最爽的是期待";
    if (h("蔡格尼克效应") || h("时间黑洞")) return "记得设个闹钟，不然天亮了";
    if (h("掌控感")) return "按你的节奏，越顺手越上头";
    if (h("血清素")) return "走个仪式，把脑子调成静音";
    if (h("感官奖赏")) return "慢点感受，别急着结束";
    if (h("多巴胺")) return "打开就玩，别想太多";
    return "点开卡片，照着互动小实验玩一遍";
  }
  function jokeFor(item) {
    if (item.cat === "food") return "热量正在赶来的路上，请系好安全带。";
    var t = item.tags || []; function h(n) { return t.indexOf(n) >= 0; }
    if (h("时间黑洞") || h("蔡格尼克效应")) return "本活动已通过「不务正业」认证，请放心沉迷。";
    if (h("催产素") || h("副交感") || h("减压")) return "它不回你消息，但会用一生治愈你。";
    if (h("内啡肽")) return "动完这趟，今天的 KPI 就算你达标了。";
    if (h("社交")) return "人一多，快乐自动凑单。";
    if (h("变比率强化") || h("期待奖励")) return "中奖概率由玄学赞助，心情由你包邮。";
    if (h("多巴胺")) return "大脑说不要，手说拿来。";
    return "认真虚度，是一种被严重低估的能力。";
  }
  function principleOf(item) {
    var w = item.why || "";
    if (item.cat === "food") {
      // 美食显示前两段，更饱满
      var parts = w.split("。");
      var s = (parts[0] || "") + (parts[1] ? "。" + parts[1] : "");
      if (s.length > 96) s = s.slice(0, 96) + "…";
      return s;
    }
    var idx = w.indexOf("。");
    var s2 = idx > 0 ? w.slice(0, idx) : w;
    if (s2.length > 50) s2 = s2.slice(0, 50) + "…";
    return s2;
  }
  function principleLabel(item) { return item.cat === "food" ? "🍜 好吃在哪" : "🧩 上头原理"; }
  function foodMore(item) {
    var M = {
      milktea: "加料是灵魂：珍珠、芋圆、椰果随便堆。别信「三分糖」——一杯下肚仍顶一碗饭的热量，配炸鸡快乐直接翻倍。",
      luosifen: "标配炸蛋鸭脚，吸满汤底才够味。闻着臭别慌，多闻几下大脑就「适应」了；怕辣配冰豆奶，香辣一次拉满。",
      noodle: "料包是本体，加个蛋、添根肠立刻升级成豪华版。深夜来一碗，高盐高油是安慰，也是明天秤上的债。",
      fried: "去皮能省一半热量——但没人这么干。刚出锅趁热吃，咔嚓声才是灵魂；配冰啤或气泡水，油腻感瞬间被冲淡。",
      hotpot: "辣度自己定，怕辣直接点鸳鸯锅。越煮越上头，辣到顶不住时，一杯奶茶比白水更解辣。",
      dessert: "黑巧比奶油蛋糕友好一点，但都是糖。最佳吃法是饭后浅尝一口，空腹开吃易被血糖逼着「再来一块」。",
      homecook: "从一道番茄炒蛋开始，别一上来挑战佛跳墙。切菜、颠勺、尝咸淡，一下午的节奏全在你手里。",
      coffee: "豆水比 1:15、水温 90℃ 是起点，画圈注水最解压。别用沸水冲细粉，第一杯留给自己，别急着外卖。"
    };
    return M[item.id] || "";
  }
  function almanacFor(item) {
    if (item.cat === "food") return "今日宜：放纵味蕾　不宜：计算热量";
    var t = item.tags || []; function h(n) { return t.indexOf(n) >= 0; }
    if (h("副交感") || h("减压") || h("催产素")) return "今日宜：瘫着回血　不宜：卷自己";
    if (h("内啡肽")) return "今日宜：动一动　不宜：久坐不动";
    if (h("社交")) return "今日宜：找搭子　不宜：独自内耗";
    if (h("时间黑洞") || h("蔡格尼克效应")) return "今日宜：续命熬夜　不宜：早睡（开玩笑）";
    if (h("心流") || h("掌控感")) return "今日宜：沉浸造物　不宜：被打断";
    return "今日宜：虚度光阴　不宜：努力";
  }
  window.BX_HELPERS = { personaName: personaName, playFor: playFor, jokeFor: jokeFor, principleOf: principleOf, almanacFor: almanacFor, principleLabel: principleLabel, foodMore: foodMore };

  // 点击「分享海报」：用当前条目拼内容，调用 GUIDE_POSTER 弹预览层
  function shareItem(item) {
    var d = dopaOf(item.id);
    var e = (window.GUIDE_ENDORPHIN && window.GUIDE_ENDORPHIN[item.id]) || 0;
    if (window.GUIDE_POSTER && window.GUIDE_POSTER.open) {
      window.GUIDE_POSTER.open({
        kicker: "半日闲 · 慢生活研究所",
        emoji: item.emoji,
        title: item.name,
        sub: item.hook,
        dopa: d, endo: e,
        persona: personaName(item),
        play: playFor(item),
        joke: jokeFor(item),
        principle: principleOf(item),
        principleLabel: principleLabel(item),
        food: foodMore(item),
        almanac: almanacFor(item),
        ambEmoji: item.emoji,
        tags: item.tags.slice(0, 5),
        footer: "点开就玩它的互动小实验 · 零依赖纯静态"
      });
    }
  }

  function openModal(item) {
    destroyLab();
    currentItem = item;
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
    // 好处 / 促进指标
    renderBenefit(item);
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
    if (stage) {
      stage.innerHTML = "";
      // 按钮 / 读数层现在位于实验框外，需单独清理，避免残留叠加
      var host = stage.parentElement;
      if (host) {
        var olds = host.querySelectorAll(".lab-center, .lab-readout");
        for (var i = olds.length - 1; i >= 0; i--) olds[i].parentNode.removeChild(olds[i]);
      }
    }
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
    var rules = (window.GUIDE_RULES && window.GUIDE_RULES[item.id]) || h.rules || "";
    box.innerHTML =
      '<div class="how-head">📋 怎么玩' + (audNote ? ' <span class="how-aud">' + escapeHtml(audNote) + "</span>" : "") + "</div>" +
      needHtml +
      '<ol class="how-steps">' + stepsHtml + "</ol>" +
      (tip ? '<div class="how-tip">💡 ' + escapeHtml(tip) + "</div>" : "") +
      (rules ? '<div class="how-rules">📜 <b>规则：</b>' + escapeHtml(rules) + "</div>" : "") +
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
    var targets = [items, tags, labs, SLOT_KEYS.length];
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

  /* ---------- 时段模块挂载 ---------- */
  function mountTimes() {
    var navCount = $("nav-times-count");
    if (navCount) navCount.textContent = SLOT_KEYS.length;
  }

  /* ---------- 摸鱼人格 ---------- */
  function mountPersona() {
    if (window.GUIDE_PERSONA && window.GUIDE_PERSONA.setOnPickItem) window.GUIDE_PERSONA.setOnPickItem(openModal);
    var box = $("persona-box");
    if (box && window.GUIDE_PERSONA) window.GUIDE_PERSONA.mount(box);
  }

  /* ---------- 首屏轮播 ---------- */
  function mountCarousel() {
    if (!window.GUIDE_CAROUSEL) return;
    if (window.GUIDE_CAROUSEL.setOnPickItem) window.GUIDE_CAROUSEL.setOnPickItem(openModal);
    var el = $("hero-carousel");
    if (el) window.GUIDE_CAROUSEL.mount(el);
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
    mountTimes();
    mountPersona();
    mountCarousel();
    $("modal-share").addEventListener("click", function () { if (currentItem) shareItem(currentItem); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
