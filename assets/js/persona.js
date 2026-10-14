/* =========================================================
   半日闲 · 摸鱼人格测试 + 分享海报 / 今日签
   - 10 题小测 → 10 型人格 → 推荐条目组合
   - canvas 生成本地海报（今日签 / 人格结果），一键保存 PNG
   零依赖纯静态，file:// 下完整可用。
   对外：window.GUIDE_PERSONA
   ========================================================= */
(function () {
  "use strict";

  var ITEMS = window.GUIDE_ITEMS || [];
  var FONT = '"Source Han Sans SC","PingFang SC","Microsoft YaHei",system-ui,-apple-system,"Segoe UI",sans-serif';
  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",' + FONT;
  var hook = { onPickItem: null }; // 由 app.js 注入 openModal

  /* ---------- 人格类型 ---------- */
  var TYPES = {
    ge: {
      emoji: "🌙", name: "夜行蔡格尼克型", tagline: "未完成的，最让人上头",
      tags: ["蔡格尼克效应", "多巴胺", "时间黑洞"],
      desc: "悬念和「就差一点」是你的开关：追剧追到天亮、刷到下一条永远更好笑。大脑被未闭合的情节反复钓鱼，多巴胺小额续杯到透支。给自己设一个「这集真的睡」的硬停点，是唯一的解。"
    },
    so: {
      emoji: "🎭", name: "社交博弈型", tagline: "人越多，快乐倍率越高",
      tags: ["社交", "变比率强化", "催产素"],
      desc: "一个人没意思，一群人才能点燃你：狼人杀的身份博弈、麻将的变比率开奖、剧本杀的共演，把多巴胺和催产素一起拉满。你的快乐有带宽需求，记得定期给社交账户充值。"
    },
    co: {
      emoji: "🎁", name: "收集囤积型", tagline: "下一个说不定更稀有",
      tags: ["变比率强化", "收集欲", "期待奖励"],
      desc: "开盒前那两秒是你的人生高光：盲盒、拆快递、凑齐一整套。不确定性把多巴胺顶到峰值，而「收集欲」一旦启动就很难体面收场。允许自己上头，但给冲动消费设个冷静期。"
    },
    ct: {
      emoji: "🧭", name: "掌控布局型", tagline: "一切按我的节奏来",
      tags: ["掌控感", "心流", "血清素"],
      desc: "混乱让你焦虑，秩序让你平静：收纳、规划、把一件事做到漂亮，是你的快乐来源。即时反馈堆出心流，掌控感是最硬的通货。别忘了，计划表本身也会变成新的摸鱼方式。"
    },
    he: {
      emoji: "🐱", name: "治愈躺平型", tagline: "被温柔接住的那一秒",
      tags: ["催产素", "副交感", "减压", "感官奖赏"],
      desc: "毛茸茸、呼噜声、一缸慢悠悠的鱼，是你的充电桩。触觉与听觉的双重 ASMR 触发催产素，副交感接管、皮质醇下降——你不需要刺激，你需要的是被接住。这不是偷懒，是刚需。"
    },
    qu: {
      emoji: "🦎", name: "猎奇探索型", tagline: "越怪越上头",
      tags: ["肾上腺素", "良性自虐", "嗅觉悖论", "婴儿图式"],
      desc: "安全的冒险最对你胃口：异宠、螺蛳粉、鬼屋、恐怖片。轻微害怕被翻译成兴奋，痛与爽的边界来回横跳。你是「良性自虐」的资深用户，靠一点点可控的危险确认自己活着。"
    },
    fo: {
      emoji: "🍰", name: "味觉信徒型", tagline: "好吃，是最诚实的多巴胺",
      tags: ["感官奖赏", "多巴胺"],
      desc: "你的快乐开关长在舌头上：一口惊艳的甜、一碗滚烫的汤，味觉直接给大脑发奖。比起囤东西，你更信「进嘴的才是自己的」。适度放纵就好，毕竟胰岛也是会记仇的。"
    },
    mi: {
      emoji: "🧘", name: "玄学养生型", tagline: "把身体调成静音模式",
      tags: ["血清素", "副交感", "减压"],
      desc: "香薰、冥想、塔罗、早睡打卡——你用一套仪式把焦虑调成静音。副交感接管后皮质醇下跌，血清素慢慢回血。信不信另说，仪式本身已经帮你喘了口气。"
    },
    fl: {
      emoji: "🎨", name: "沉浸造物型", tagline: "做着做着，世界就消失了",
      tags: ["心流", "多巴胺"],
      desc: "画画、拼模型、做视频、写代码——一件能越做越深的小事，是你的充电桩。心流状态里时间被折叠，即时反馈堆出满足感。小心别一沉浸就忘了吃饭。"
    },
    sh: {
      emoji: "📸", name: "高光表演型", tagline: "被看见，才真的爽",
      tags: ["社交", "多巴胺"],
      desc: "你不是爱炫耀，是需要回声：一个被点赞的瞬间、一段被共鸣的吐槽，镜像神经元替你把快乐翻倍。适度晒是给社交账户续费，过度晒容易被拉黑。"
    }
  };
  var TYPE_ORDER = ["ge", "so", "co", "ct", "he", "qu", "fo", "mi", "fl", "sh"];

  /* ---------- 题库（每选项给类型加分） ---------- */
  var QUESTIONS = [
    {
      q: "夜深了，此刻的你最可能在？",
      opts: [
        { t: "追剧 / 刷视频，告诉自己“最后一点”", s: { ge: 2 } },
        { t: "在群里吆喝人：再来一局", s: { so: 2 } },
        { t: "拆刚到的新盲盒 / 快递", s: { co: 2 } },
        { t: "抱着猫 / 盯着鱼缸发呆", s: { he: 2 } }
      ]
    },
    {
      q: "朋友周末约你，你更心动哪个？",
      opts: [
        { t: "狼人杀 / 剧本杀 / 麻将局", s: { so: 2 } },
        { t: "密室 / 鬼屋 / 探险", s: { qu: 2 } },
        { t: "出门爬山 / 骑行 / 徒步", s: { qu: 1, ct: 1 } },
        { t: "在家把乱糟糟的空间收拾干净", s: { ct: 2 } }
      ]
    },
    {
      q: "哪种瞬间最让你爽到？",
      opts: [
        { t: "悬念揭晓、“就差一点”的那一下", s: { ge: 2 } },
        { t: "开奖般的随机惊喜", s: { co: 2 } },
        { t: "把一件事彻底拿捏的确定感", s: { ct: 2 } },
        { t: "毛茸茸 / 软乎乎的触感", s: { he: 2 } }
      ]
    },
    {
      q: "失业 / 长假在家的你，更像哪种状态？",
      opts: [
        { t: "越躺越晚，昼夜彻底颠倒", s: { ge: 2 } },
        { t: "怕冷场，天天找事约人聚", s: { so: 2 } },
        { t: "囤 / 收集完全停不下来", s: { co: 2 } },
        { t: "沉迷研究某个冷门新爱好", s: { qu: 2 } }
      ]
    },
    {
      q: "你的人生信条更接近？",
      opts: [
        { t: "未完成的更迷人", s: { ge: 2 } },
        { t: "人生在于随机应变", s: { co: 1, so: 1 } },
        { t: "一切尽在掌握", s: { ct: 2 } },
        { t: "温柔地对待自己", s: { he: 2 } }
      ]
    },
    {
      q: "最能给你回血的是？",
      opts: [
        { t: "深夜无人打扰的独处时光", s: { ge: 2 } },
        { t: "一群人的热闹与共鸣", s: { so: 2 } },
        { t: "未知揭晓前的那两秒", s: { co: 2 } },
        { t: "远方、山顶、新鲜的刺激", s: { qu: 2 } }
      ]
    },
    {
      q: "犒劳自己时，你最爽的是？",
      opts: [
        { t: "吃到一口惊艳的好东西", s: { fo: 2 } },
        { t: "买到稀有 / 限定的收藏", s: { co: 2 } },
        { t: "给房间添了件称心的好物并摆好", s: { ct: 2 } },
        { t: "飞去一个从没去过的地方", s: { qu: 2 } }
      ]
    },
    {
      q: "你的放松「仪式感」更接近？",
      opts: [
        { t: "点香薰 / 冥想 / 泡澡，把脑子清空", s: { mi: 2 } },
        { t: "撸猫撸到睡着", s: { he: 2 } },
        { t: "戴上耳机彻底沉浸在一首歌 / 一部作品里", s: { fl: 2 } },
        { t: "深夜一个人安静刷剧到天亮", s: { ge: 2 } }
      ]
    },
    {
      q: "朋友圈 / 社交平台上，你最在意？",
      opts: [
        { t: "有人点赞共鸣的那一瞬", s: { sh: 2 } },
        { t: "晒出限量收藏被羡慕", s: { so: 1, co: 1 } },
        { t: "记下自己的小成就 / 整理", s: { ct: 2 } },
        { t: "分享一个奇怪的新发现", s: { qu: 2 } }
      ]
    },
    {
      q: "一个完美的周末夜晚，你在？",
      opts: [
        { t: "打磨自己的小爱好作品", s: { fl: 2 } },
        { t: "组局把朋友都叫来", s: { so: 2 } },
        { t: "试做一道新菜或甜品", s: { fo: 2 } },
        { t: "算算塔罗 / 养生打卡，安心入睡", s: { mi: 2 } }
      ]
    }
  ];

  /* ---------- 工具 ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function byId(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; }
  function dopa(id) { return (window.GUIDE_DOPAMINE && window.GUIDE_DOPAMINE[id]) || 0; }
  function endo(id) { return (window.GUIDE_ENDORPHIN && window.GUIDE_ENDORPHIN[id]) || 0; }
  function dayKey() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function dayText() { var d = new Date(); return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日"; }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    try {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  }

  function score(ans) {
    var sum = {};
    for (var i = 0; i < ans.length; i++) {
      var o = QUESTIONS[i].opts[ans[i]];
      if (!o) continue;
      for (var k in o.s) sum[k] = (sum[k] || 0) + o.s[k];
    }
    var best = "ge", bestV = -1;
    TYPE_ORDER.forEach(function (k) { if ((sum[k] || 0) > bestV) { bestV = sum[k] || 0; best = k; } });
    return { key: best, sum: sum };
  }
  function recommend(key) {
    var tg = TYPES[key].tags;
    var arr = ITEMS.filter(function (it) { return it.tags.some(function (x) { return tg.indexOf(x) >= 0; }); });
    arr.sort(function (a, b) { return dopa(b.id) - dopa(a.id); });
    var out = arr.slice(0, 3);
    if (out.length < 3) {
      var rest = ITEMS.filter(function (it) { return out.indexOf(it) < 0; });
      for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
      out = out.concat(rest.slice(0, 3 - out.length));
    }
    return out;
  }

  /* ---------- 渲染 ---------- */
  var box = null, st = "intro", idx = 0, ans = [], key = "ge", res = null;

  function tplIntro() {
    return '' +
      '<div class="pz-card">' +
        '<span class="pz-kicker">🧭 摸鱼人格</span>' +
        '<h3 class="pz-title">10 道题，测出你的<span class="glow-pink">闲趣人格</span></h3>' +
        '<p class="pz-sub">没有对错，只有你更被哪种「爽点机制」拿捏。测完给你一组推荐，或许哪天真想在生活里试一个。</p>' +
        '<button class="lab-btn pz-start" type="button" data-act="start">开始测试 →</button>' +
        '<span class="pz-note">约 1 分钟 · 结果存在本地，不上传</span>' +
      '</div>';
  }
  function tplQuiz() {
    var q = QUESTIONS[idx];
    var prog = Math.round(idx / QUESTIONS.length * 100);
    var opts = q.opts.map(function (o, i) {
      return '<button class="pz-opt" type="button" data-act="opt" data-o="' + i + '"><b>' + String.fromCharCode(65 + i) + '</b><span>' + escapeHtml(o.t) + '</span></button>';
    }).join("");
    return '' +
      '<div class="pz-card">' +
        '<div class="pz-prog"><span class="pz-prog-bar" style="width:' + prog + '%"></span></div>' +
        '<div class="pz-qcount">第 ' + (idx + 1) + ' / ' + QUESTIONS.length + ' 题</div>' +
        '<h3 class="pz-q">' + escapeHtml(q.q) + '</h3>' +
        '<div class="pz-opts">' + opts + '</div>' +
      '</div>';
  }
  function tplResult() {
    var t = TYPES[key];
    var recs = recommend(key);
    var sum = res.sum || {};
    var bars = TYPE_ORDER.map(function (k) {
      var v = sum[k] || 0, mx = QUESTIONS.length * 2;
      return '<div class="pz-bar' + (k === key ? " is-top" : "") + '"><span class="pz-bar-name">' + TYPES[k].emoji + " " + escapeHtml(TYPES[k].name) + '</span><span class="pz-bar-track"><span class="pz-bar-fill" style="width:' + Math.round(v / mx * 100) + '%"></span></span></div>';
    }).join("");
    var items = recs.map(function (it) {
      return '<button class="pz-item" type="button" data-act="item" data-id="' + it.id + '">' +
        '<span class="pz-item-emoji">' + it.emoji + '</span>' +
        '<span class="pz-item-body"><b>' + escapeHtml(it.name) + '</b><small>' + escapeHtml(it.hook) + '</small></span>' +
        '<span class="pz-item-go">打开 →</span></button>';
    }).join("");
    return '' +
      '<div class="pz-card pz-result">' +
        '<span class="pz-kicker">你的摸鱼人格</span>' +
        '<div class="pz-emoji">' + t.emoji + '</div>' +
        '<h3 class="pz-title">' + escapeHtml(t.name) + '</h3>' +
        '<p class="pz-tagline">“' + escapeHtml(t.tagline) + '”</p>' +
        '<p class="pz-desc">' + escapeHtml(t.desc) + '</p>' +
        '<div class="pz-bars">' + bars + '</div>' +
        '<div class="pz-recs"><div class="pz-recs-label">从这几条开始，或许想真的试一个：</div>' + items + '</div>' +
        '<div class="pz-actions">' +
          '<button class="lab-btn" type="button" data-act="poster">🖼️ 生成海报</button>' +
          '<button class="lb-btn" type="button" data-act="copy">📋 复制结果</button>' +
          '<button class="lb-btn" type="button" data-act="retry">🔁 重新测</button>' +
        '</div>' +
      '</div>';
  }
  function draw() {
    if (!box) return;
    box.innerHTML = st === "quiz" ? tplQuiz() : (st === "result" ? tplResult() : tplIntro());
  }

  function mount(target) {
    box = target;
    if (!box) return;
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "start") { st = "quiz"; idx = 0; ans = []; draw(); }
      else if (act === "opt") {
        ans[idx] = parseInt(b.getAttribute("data-o"), 10);
        idx++;
        if (idx >= QUESTIONS.length) { res = score(ans); key = res.key; st = "result"; }
        draw();
      } else if (act === "retry") { st = "intro"; idx = 0; ans = []; res = null; draw(); }
      else if (act === "copy") {
        var t = TYPES[key];
        copyText("我的摸鱼人格：" + t.emoji + " " + t.name + "（" + t.tagline + "）\n来测测你是哪种 → " + location.href)
          .then(function () { var o = b.textContent; b.textContent = "✅ 已复制"; setTimeout(function () { b.textContent = o; }, 1600); })
          .catch(function () { var o = b.textContent; b.textContent = "⚠️ 复制失败"; setTimeout(function () { b.textContent = o; }, 1600); });
      } else if (act === "poster") { posterFromType(key); }
      else if (act === "item") { var it = byId(b.getAttribute("data-id")); if (it && hook.onPickItem) hook.onPickItem(it); }
    });
    draw();
  }

  /* ---------- 海报 ---------- */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function glow(ctx, W, H, x, y, r, color) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function wrap(ctx, text, maxW) {
    var lines = [], line = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === "\n") { lines.push(line); line = ""; continue; }
      var test = line + ch;
      if (ctx.measureText(test).width > maxW) { lines.push(line); line = ch; } else { line = test; }
    }
    if (line) lines.push(line);
    return lines;
  }
  // 指标进度条（多巴胺 / 内啡肽）
  function bar(ctx, x, y, w, label, val, color) {
    ctx.textAlign = "left"; ctx.fillStyle = "#D7DAE6"; ctx.font = "600 18px " + EMOJI_FONT;
    ctx.fillText(label, x, y);
    ctx.textAlign = "right"; ctx.fillStyle = color; ctx.font = "700 18px " + FONT;
    ctx.fillText(String(val), x + w, y);
    var by = y + 14, bh = 14;
    ctx.fillStyle = "rgba(255,255,255,0.08)"; rr(ctx, x, by, w, bh, 7); ctx.fill();
    var pct = Math.min(100, Math.max(0, val)) / 100;
    var fw = Math.max(10, Math.round(w * pct));
    ctx.fillStyle = color; rr(ctx, x, by, fw, bh, 7); ctx.fill();
    ctx.textAlign = "left";
    return by + bh + 24;
  }
  // 标签下方空白处的氛围装饰：当前条目的 emoji 点缀 + 星尘 + 霓虹流光带
  function drawAmbience(ctx, W, y0, y1, emoji) {
    var h = y1 - y0;
    var midY = Math.round(y0 + h * 0.52);
    var g = ctx.createLinearGradient(64, 0, W - 64, 0);
    g.addColorStop(0, "rgba(0,229,255,0)");
    g.addColorStop(0.5, "rgba(0,229,255,0.30)");
    g.addColorStop(1, "rgba(0,229,255,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(64, midY); ctx.lineTo(W - 64, midY); ctx.stroke();
    if (emoji) {
      var spots = [[0.16,0.30,60,0.20],[0.5,0.72,44,0.16],[0.82,0.32,66,0.22],[0.66,0.6,38,0.15]];
      spots.forEach(function (p) {
        var x = 64 + p[0] * (W - 128);
        var y = y0 + 8 + p[1] * (h - 16);
        ctx.save();
        ctx.globalAlpha = p[3];
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = p[2] + "px " + EMOJI_FONT;
        ctx.fillText(emoji, x, y);
        ctx.restore();
      });
    }
    var stars = [
      [0.10, 0.30, 2.0, "rgba(0,229,255,0.9)"],
      [0.24, 0.72, 1.6, "rgba(255,46,136,0.85)"],
      [0.40, 0.24, 1.4, "rgba(255,255,255,0.9)"],
      [0.55, 0.80, 2.0, "rgba(124,77,255,0.9)"],
      [0.68, 0.38, 1.5, "rgba(0,229,160,0.9)"],
      [0.82, 0.66, 1.8, "rgba(0,229,255,0.85)"],
      [0.92, 0.28, 1.3, "rgba(255,255,255,0.8)"],
      [0.33, 0.56, 1.2, "rgba(255,176,32,0.85)"]
    ];
    stars.forEach(function (s) {
      var x = 64 + s[0] * (W - 128);
      var y = y0 + 10 + s[1] * (h - 20);
      var rg = ctx.createRadialGradient(x, y, 0, x, y, s[2] * 7);
      rg.addColorStop(0, s[3]); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, y, s[2] * 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath(); ctx.arc(x, y, s[2], 0, Math.PI * 2); ctx.fill();
    });
  }
  function makePoster(cfg) {
    var W = 750, H = 1120, dpr = 2;
    var cv = document.createElement("canvas"); cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0B0D14"; ctx.fillRect(0, 0, W, H);
    glow(ctx, W, H, W * 0.15, H * 0.12, 460, "rgba(255,46,136,0.22)");
    glow(ctx, W, H, W * 0.92, H * 0.86, 480, "rgba(0,229,255,0.16)");
    glow(ctx, W, H, W * 0.85, H * 0.2, 320, "rgba(124,77,255,0.18)");
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2;
    rr(ctx, 28, 28, W - 56, H - 56, 34); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#00E5FF"; ctx.font = "600 20px " + FONT;
    ctx.fillText(cfg.kicker || "半日闲 · 慢生活研究所", W / 2, 100);
    if (cfg.date) { ctx.fillStyle = "#8A90A6"; ctx.font = "16px " + FONT; ctx.fillText(cfg.date, W / 2, 132); }
    ctx.font = "120px " + EMOJI_FONT; ctx.fillText(cfg.emoji || "🍵", W / 2, 248);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "800 44px " + FONT; ctx.fillText(cfg.title, W / 2, 320);
    ctx.fillStyle = "#9AA0B4"; ctx.font = "400 21px " + FONT;
    var subLines = wrap(ctx, cfg.sub || "", W - 120);
    var sy = 356;
    subLines.forEach(function (l) { ctx.fillText(l, W / 2, sy); sy += 28; });
    var divY = Math.max(sy + 18, 398);
    ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(64, divY); ctx.lineTo(W - 64, divY); ctx.stroke();
    var cx = 64, cw = W - 128, y = divY + 46;
    ctx.textAlign = "left";
    if (cfg.dopa != null) y = bar(ctx, cx, y, cw, "🧠 多巴胺", cfg.dopa, "rgba(0,229,160,1)");
    if (cfg.endo != null) y = bar(ctx, cx, y, cw, "💜 内啡肽", cfg.endo, "rgba(0,229,255,1)");
    if (cfg.persona) {
      ctx.textAlign = "left";
      ctx.font = "600 19px " + EMOJI_FONT; ctx.fillStyle = "#FF2E88";
      ctx.fillText("🎯 适合人格", cx, y);
      ctx.fillStyle = "#FFFFFF"; ctx.font = "700 21px " + FONT;
      ctx.fillText(cfg.persona, cx + 124, y);
      y += 38;
    }
    if (cfg.play) {
      ctx.textAlign = "left";
      ctx.font = "600 19px " + EMOJI_FONT; ctx.fillStyle = "#7C4DFF";
      ctx.fillText("🎮 玩法", cx, y);
      ctx.fillStyle = "#D7DAE6"; ctx.font = "400 19px " + FONT;
      wrap(ctx, cfg.play, cw - 92).forEach(function (l) { ctx.fillText(l, cx + 92, y); y += 27; });
      y += 16;
    }
    if (cfg.principle) {
      ctx.textAlign = "left";
      ctx.font = "600 19px " + EMOJI_FONT; ctx.fillStyle = "#FFC107";
      ctx.fillText(cfg.principleLabel || "🧩 上头原理", cx, y);
      ctx.fillStyle = "#C9CDDA"; ctx.font = "400 18px " + FONT;
      wrap(ctx, cfg.principle, cw - 104).forEach(function (l) { ctx.fillText(l, cx + 104, y); y += 26; });
      y += 14;
    }
    if (cfg.food) {
      ctx.textAlign = "left";
      ctx.font = "600 19px " + EMOJI_FONT; ctx.fillStyle = "#FF8A65";
      ctx.fillText("🍽️ 食话", cx, y);
      ctx.fillStyle = "#FFCCBC"; ctx.font = "400 18px " + FONT;
      wrap(ctx, cfg.food, cw - 96).forEach(function (l) { ctx.fillText(l, cx + 96, y); y += 26; });
      y += 14;
    }
    if (cfg.almanac) {
      ctx.textAlign = "left";
      ctx.font = "600 18px " + EMOJI_FONT; ctx.fillStyle = "#FFB300";
      ctx.fillText("📅 今日宜忌", cx, y);
      ctx.fillStyle = "#E6C97A"; ctx.font = "400 18px " + FONT;
      ctx.fillText(cfg.almanac, cx + 118, y);
      y += 34;
    }
    if (cfg.joke) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#9AA0B4"; ctx.font = "italic 17px " + FONT;
      wrap(ctx, "“" + cfg.joke + "”", cw).forEach(function (l) { ctx.fillText(l, cx, y); y += 25; });
      y += 8;
    }
    if (cfg.lines && cfg.lines.length) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#D7DAE6"; ctx.font = "400 18px " + FONT;
      cfg.lines.forEach(function (p) {
        wrap(ctx, p, cw).forEach(function (l) { ctx.fillText(l, cx, y); y += 26; });
        y += 4;
      });
    }
    ctx.textAlign = "left";
    var tx = cx; y += 4;
    (cfg.tags || []).forEach(function (t) {
      ctx.font = "600 18px " + FONT;
      var tw = ctx.measureText("#" + t).width + 26;
      if (tx + tw > W - 64) { tx = 64; y += 40; }
      ctx.fillStyle = "rgba(255,255,255,0.06)"; rr(ctx, tx, y - 22, tw, 30, 15); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1; rr(ctx, tx, y - 22, tw, 30, 15); ctx.stroke();
      ctx.fillStyle = "#00E5FF"; ctx.fillText("#" + t, tx + 13, y);
      tx += tw + 10;
    });
    var ambTop = y + 26, ambBottom = H - 74;
    if (ambBottom - ambTop > 66) drawAmbience(ctx, W, ambTop, ambBottom, cfg.ambEmoji);
    ctx.textAlign = "center";
    ctx.fillStyle = "#8A90A6"; ctx.font = "15px " + FONT;
    if (cfg.footer) ctx.fillText(cfg.footer, W / 2, H - 56);
    ctx.fillStyle = "#00E5FF"; ctx.font = "600 15px " + FONT;
    ctx.fillText(location.host ? location.host : "local · 双击即用", W / 2, H - 32);
    return cv;
  }
  function download(cv, name) {
    function saveUrl(url) {
      var a = document.createElement("a"); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    if (cv.toBlob) {
      cv.toBlob(function (b) {
        var url = URL.createObjectURL(b); saveUrl(url);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      }, "image/png");
    } else { saveUrl(cv.toDataURL("image/png")); }
  }

  function posterFromItem(item) {
    if (!item) return;
    var H = window.BX_HELPERS;
    var cv = makePoster({
      kicker: "🎁 今日盲盒 · 今日签",
      date: dayText(),
      emoji: item.emoji,
      title: item.name,
      sub: item.hook,
      dopa: dopa(item.id), endo: endo(item.id),
      persona: H ? H.personaName(item) : "",
      play: H ? H.playFor(item) : "",
      joke: H ? H.jokeFor(item) : "",
      principle: H ? H.principleOf(item) : "",
      principleLabel: H ? H.principleLabel(item) : "",
      food: H ? H.foodMore(item) : "",
      almanac: H ? H.almanacFor(item) : "",
      ambEmoji: item.emoji,
      tags: item.tags.slice(0, 4),
      footer: "点开就能玩它的互动小实验 →"
    });
    download(cv, "今日签-" + item.name + "-" + dayKey() + ".png");
  }
  function posterFromType(k) {
    var t = TYPES[k]; if (!t) return;
    var recs = recommend(k);
    var cv = makePoster({
      kicker: "🧭 我的摸鱼人格",
      date: dayText(),
      emoji: t.emoji,
      title: t.name,
      sub: "“" + t.tagline + "”",
      lines: [t.desc].concat(recs.map(function (r) { return "· " + r.emoji + " " + r.name; })),
      tags: t.tags.slice(0, 4),
      ambEmoji: t.emoji,
      footer: "来测测你是哪种 →"
    });
    download(cv, "摸鱼人格-" + t.name + "-" + dayKey() + ".png");
  }

  window.GUIDE_PERSONA = {
    mount: mount,
    posterFromItem: posterFromItem,
    posterFromType: posterFromType,
    TYPES: TYPES,
    score: score,
    recommend: recommend,
    setOnPickItem: function (fn) { hook.onPickItem = fn; },
    makePoster: makePoster
  };
})();
