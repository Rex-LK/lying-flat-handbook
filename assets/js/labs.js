/* =========================================================
   人生浪费指南 · 互动小实验注册表
   契约：window.GUIDE_LABS = { <itemId>: { init: function(container){...; return {destroy} } } }
   - 所有实验「鼠标点击」即可运行
   - init 返回的对象必须含 destroy()，关闭详情时由 app.js 调用以清理动画与监听
   - 全部原生 Canvas / DOM，无第三方库
   ========================================================= */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 工具 ---------- */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function makeCanvas(container) {
    var canvas = el("canvas");
    container.appendChild(canvas);
    var dims = { w: 0, h: 0, ctx: null };
    function fit() {
      var rect = container.getBoundingClientRect();
      var w = Math.max(rect.width, 1), h = Math.max(rect.height, 260);
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dims.w = w; dims.h = h; dims.ctx = ctx;
    }
    fit();
    var ro = (window.ResizeObserver) ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(container); else window.addEventListener("resize", fit);
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    return { canvas: canvas, dims: dims, ro: ro };
  }

  function loop(draw) {
    var raf = null, running = false;
    function step(t) { if (!running) return; draw(t); raf = requestAnimationFrame(step); }
    return {
      start: function () { if (running) return; running = true; raf = requestAnimationFrame(step); },
      stop: function () { running = false; if (raf) cancelAnimationFrame(raf); }
    };
  }

  function makeCenter(container) {
    var c = el("div", "lab-center");
    container.appendChild(c);
    return c;
  }
  function makeReadout(container) {
    var box = el("div", "lab-readout");
    box.style.position = "absolute";
    box.style.left = "0"; box.style.right = "0"; box.style.bottom = "12px";
    container.appendChild(box);
    return {
      set: function (items) {
        box.innerHTML = "";
        (items || []).forEach(function (it) {
          var m = el("div", "lab-metric" + (it.kind ? " " + it.kind : ""));
          m.innerHTML = '<b>' + it.val + '</b><span>' + it.label + '</span>';
          box.appendChild(m);
        });
      }
    };
  }
  function btn(label, cls, onClick) {
    var b = el("button", "lab-btn" + (cls ? " " + cls : ""), label);
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function captionOf(container) {
    var lab = container.parentElement;
    return lab ? lab.querySelector(".lab-caption") : null;
  }
  function setCaption(container, text) {
    var c = captionOf(container);
    if (c) c.textContent = text;
  }

  /* =======================================================
     1. 熬夜刷剧 —— 蔡格尼克效应 + 时间黑洞
     ======================================================= */
  function labBinge(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🌙 再看一集", "");
    center.appendChild(b);
    var p = 0;            // 0=傍晚 1=天亮
    var target = 0;
    var episodes = 0;
    var stars = [];
    for (var i = 0; i < 70; i++) stars.push({ x: Math.random(), y: Math.random() * 0.7, r: rand(0.5, 1.6), ph: rand(0, 6.28) });

    function sky(local) {
      // 关键帧：傍晚 -> 夜 -> 深夜 -> 黎明
      var keys = [
        { t: 0.0, top: [42, 26, 58], bot: [255, 126, 95] },
        { t: 0.34, top: [5, 6, 15], bot: [19, 26, 48] },
        { t: 0.7, top: [2, 3, 10], bot: [10, 15, 31] },
        { t: 1.0, top: [26, 42, 74], bot: [255, 178, 122] }
      ];
      var a = keys[0], c = keys[keys.length - 1];
      for (var k = 0; k < keys.length - 1; k++) {
        if (local >= keys[k].t && local <= keys[k + 1].t) { a = keys[k]; c = keys[k + 1]; break; }
      }
      var f = (c.t === a.t) ? 0 : (local - a.t) / (c.t - a.t);
      f = clamp(f, 0, 1);
      return {
        top: "rgb(" + Math.round(lerp(a.top[0], c.top[0], f)) + "," + Math.round(lerp(a.top[1], c.top[1], f)) + "," + Math.round(lerp(a.top[2], c.top[2], f)) + ")",
        bot: "rgb(" + Math.round(lerp(a.bot[0], c.bot[0], f)) + "," + Math.round(lerp(a.bot[1], c.bot[1], f)) + "," + Math.round(lerp(a.bot[2], c.bot[2], f)) + ")"
      };
    }

    b.addEventListener("click", function () {
      episodes++;
      target = clamp(target + 0.25, 0, 1.0);
      var hour = 22 + Math.round(target * 8); // 22:00 -> 06:00
      read.set([
        { val: (hour % 24) + ":00", label: "当前时间" },
        { val: episodes, label: "已看集数", kind: "warn" },
        { val: Math.round(target * 100) + "%", label: "夜色进度" }
      ]);
      if (target >= 1) setCaption(container, "天亮了 ☀️ 蔡格尼克效应大获全胜，明天的你已负债。");
      else setCaption(container, "又是「这集结束就睡」——未完的悬念正把你往床上钉。");
    });

    var lp = loop(function (t) {
      p += (target - p) * 0.06;
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var s = sky(p);
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, s.top); g.addColorStop(1, s.bot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // 星星（夜晚可见）
      var starA = clamp(1 - Math.abs(p - 0.5) * 2, 0, 1);
      stars.forEach(function (st) {
        var tw = 0.5 + 0.5 * Math.sin(t / 400 + st.ph);
        ctx.globalAlpha = starA * tw;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 6.29); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // 月亮 / 太阳
      var orbX = lerp(w * 0.2, w * 0.8, p), orbY = lerp(h * 0.3, h * 0.22, p);
      var isSun = p > 0.82;
      ctx.fillStyle = isSun ? "#FFD23F" : "#E9E6FF";
      ctx.shadowColor = isSun ? "#FFB020" : "#9C8CFF"; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(orbX, orbY, 18, 0, 6.29); ctx.fill();
      ctx.shadowBlur = 0;
      // 窗框
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 6;
      ctx.strokeRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.08); ctx.lineTo(w * 0.5, h * 0.92);
      ctx.moveTo(w * 0.08, h * 0.5); ctx.lineTo(w * 0.92, h * 0.5); ctx.stroke();
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     2. 开盲盒 —— 变比率强化
     ======================================================= */
  function labBlindbox(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🎁 开一盒", "cyan");
    center.appendChild(b);
    var particles = [];
    var shake = 0, open = 0, reveal = null;
    var total = 0, hidden = 0;
    var rarities = [
      { name: "普通", color: "#8A90A6", p: 0.60, glow: "rgba(138,144,166,0.5)" },
      { name: "稀有", color: "#00E5FF", p: 0.28, glow: "rgba(0,229,255,0.7)" },
      { name: "史诗", color: "#7C4DFF", p: 0.10, glow: "rgba(124,77,255,0.8)" },
      { name: "隐藏", color: "#FF2E88", p: 0.02, glow: "rgba(255,46,136,0.95)" }
    ];
    function pick() {
      var r = Math.random(); var acc = 0;
      for (var i = 0; i < rarities.length; i++) { acc += rarities[i].p; if (r <= acc) return rarities[i]; }
      return rarities[0];
    }
    b.addEventListener("click", function () {
      total++;
      var rb = pick();
      if (rb.name === "隐藏") hidden++;
      reveal = rb; shake = 1; open = 0;
      setCaption(container, "开盒前 2 秒的期待，才是变比率强化的精华——你永远不知道下一只多稀有。");
      read.set([
        { val: total, label: "已开盒", kind: "cyan" },
        { val: hidden, label: "隐藏款", kind: hidden ? "good" : "" },
        { val: reveal.name, label: "本盒稀有度", kind: reveal.name === "隐藏" ? "good" : "" }
      ]);
    });

    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h, cx = w / 2, cy = h / 2 - 10;
      ctx.clearRect(0, 0, w, h);
      var jit = shake > 0 ? Math.sin(t / 20) * shake * 6 : 0;
      ctx.save(); ctx.translate(cx + jit, cy);
      // 盒身
      var bw = 70, bh = 56;
      ctx.fillStyle = "#2A2F40"; ctx.strokeStyle = reveal ? reveal.glow : "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2; ctx.shadowColor = reveal ? reveal.glow : "transparent"; ctx.shadowBlur = reveal ? 24 : 0;
      roundRect(ctx, -bw / 2, -bh / 2 + 6, bw, bh, 8); ctx.fill(); ctx.stroke();
      // 盒盖（开启时飞起）
      ctx.shadowBlur = 0;
      var lidY = -bh / 2 + 6 - open * 60;
      ctx.fillStyle = "#343B52";
      roundRect(ctx, -bw / 2 - 4, lidY - 14, bw + 8, 16, 6); ctx.fill(); ctx.stroke();
      // 奖励球
      if (open > 0.4 && reveal) {
        ctx.globalAlpha = clamp((open - 0.4) / 0.6, 0, 1);
        ctx.fillStyle = reveal.color; ctx.shadowColor = reveal.glow; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(0, -4, 16 + open * 4, 0, 6.29); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      ctx.restore();
      // 粒子
      if (shake > 0) shake = Math.max(0, shake - 0.04);
      if (open < 1 && reveal && shake === 0) open = Math.min(1, open + 0.05);
      if (open > 0.6 && reveal && particles.length < 60 && Math.random() < 0.5) {
        particles.push({ x: cx, y: cy, vx: rand(-3, 3), vy: rand(-4, -1), life: 1, c: reveal.color });
      }
      particles.forEach(function (pt) {
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life -= 0.02;
        ctx.globalAlpha = clamp(pt.life, 0, 1);
        ctx.fillStyle = pt.c; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, 6.29); ctx.fill();
      });
      ctx.globalAlpha = 1;
      particles = particles.filter(function (p) { return p.life > 0; });
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     3. 撸猫 —— 催产素 + 感官奖赏
     ======================================================= */
  function labCat(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🖐️ 抚摸一下", "");
    center.appendChild(b);
    var oxy = 0, mood = 0, lastPet = -9999, ripples = [], hearts = [];
    b.addEventListener("click", function () {
      oxy = clamp(oxy + 12, 0, 100); mood = clamp(mood + 9, 0, 100); lastPet = performance.now();
      ripples.push({ r: 10, a: 1 });
      if (mood > 60 && hearts.length < 8) hearts.push({ x: rand(0.3, 0.7), y: 0.5, vy: -0.004, a: 1 });
      read.set([
        { val: Math.round(oxy) + "%", label: "催产素", kind: "good" },
        { val: Math.round(mood) + "%", label: "猫的心情", kind: "cyan" }
      ]);
      setCaption(container, mood > 80 ? "呼噜呼噜～催产素拉满，它已经把你当同类了。" : "指尖绒毛 + 呼噜 ASMR，依恋的化学物质正在分泌。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h, cx = w / 2, cy = h / 2 - 6;
      ctx.clearRect(0, 0, w, h);
      var purr = (t - lastPet < 1200) ? 1 + Math.sin(t / 40) * 0.04 : 1;
      // 头
      ctx.save(); ctx.translate(cx, cy); ctx.scale(purr, purr);
      ctx.fillStyle = "#3A3F55"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, 6.29); ctx.fill();
      // 耳朵
      ctx.beginPath(); ctx.moveTo(-34, -22); ctx.lineTo(-14, -44); ctx.lineTo(-6, -24); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(34, -22); ctx.lineTo(14, -44); ctx.lineTo(6, -24); ctx.closePath(); ctx.fill();
      // 眼
      ctx.fillStyle = "#00E5A0"; ctx.shadowColor = "#00E5A0"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(-14, -4, 5, 7, 0, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.ellipse(14, -4, 5, 7, 0, 0, 6.29); ctx.fill();
      ctx.shadowBlur = 0;
      // 鼻
      ctx.fillStyle = "#FF2E88"; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-5, 2); ctx.lineTo(5, 2); ctx.closePath(); ctx.fill();
      ctx.restore();
      // 呼噜波纹
      ripples.forEach(function (rp) { rp.r += 1.6; rp.a -= 0.02; });
      ripples = ripples.filter(function (r) { return r.a > 0; });
      ripples.forEach(function (rp) {
        ctx.globalAlpha = clamp(rp.a, 0, 1) * 0.5; ctx.strokeStyle = "#00E5A0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, rp.r, 0, 6.29); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // 爱心
      hearts.forEach(function (ht) { ht.y += ht.vy; ht.a -= 0.008; });
      hearts = hearts.filter(function (x) { return x.a > 0; });
      hearts.forEach(function (ht) {
        ctx.globalAlpha = clamp(ht.a, 0, 1); ctx.fillStyle = "#FF2E88";
        drawHeart(ctx, ht.x * w, ht.y * h, 10);
      });
      ctx.globalAlpha = 1;
      oxy = clamp(oxy - 0.03, 0, 100); mood = clamp(mood - 0.02, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     4. 再来一局 —— 近因效应 + 沉没成本
     ======================================================= */
  function labReplay(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🎮 再来一局", "amber");
    center.appendChild(b);
    var games = 0, wins = 0, streak = 0, time = 0;
    b.addEventListener("click", function () {
      games++; time += 15;
      var win = Math.random() < 0.45;
      if (win) { wins++; streak = 0; }
      else { streak++; }
      var rate = games ? Math.round(wins / games * 100) : 0;
      read.set([
        { val: games, label: "总场次" },
        { val: streak, label: "连败", kind: streak > 2 ? "bad" : "" },
        { val: rate + "%", label: "胜率", kind: rate < 50 ? "warn" : "good" },
        { val: time + "min", label: "已投入", kind: "warn" }
      ]);
      setCaption(container, win ? "赢了！但下一把的诱惑才刚开始。"
        : (streak > 0 && Math.random() < 0.6 ? "就差一点！近因效应让你误以为「下次必赢」。" : "输了。沉没成本说：现在停就是亏，再来。"));
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      // 手柄
      var cx = w / 2, cy = h / 2 - 20;
      ctx.fillStyle = "#2A2F40"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      roundRect(ctx, cx - 60, cy - 22, 120, 44, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FF2E88"; ctx.beginPath(); ctx.arc(cx - 34, cy, 7, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#00E5FF"; ctx.beginPath(); ctx.arc(cx + 30, cy - 6, 5, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 40, cy + 6, 5, 0, 6.29); ctx.fill();
      // 连败火焰
      if (streak > 0) {
        var fh = clamp(streak * 8, 0, 60);
        ctx.fillStyle = "rgba(255,77,109,0.85)";
        ctx.shadowColor = "#FF4D6D"; ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 24); ctx.quadraticCurveTo(cx, cy - 24 - fh, cx + 8, cy - 24); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     5. 摸鱼 —— 时间黑洞 + 多巴胺
     ======================================================= */
  function labSlack(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🐟 摸一会儿鱼", "cyan");
    center.appendChild(b);
    var progress = 0, risk = 0, duration = 0, boss = 0, fishX = 0.2, fishDir = 1;
    b.addEventListener("click", function () {
      progress = clamp(progress + rand(6, 14), 0, 100);
      duration += 5;
      if (Math.random() < 0.22) { boss = 1; progress = clamp(progress * 0.5, 0, 100); risk = 100; }
      else risk = clamp(risk - 30 + rand(0, 25), 0, 100);
      read.set([
        { val: Math.round(progress) + "%", label: "摸鱼进度", kind: "cyan" },
        { val: Math.round(risk) + "%", label: "被发现风险", kind: risk > 60 ? "bad" : "" },
        { val: duration + "min", label: "今日摸鱼", kind: "warn" }
      ]);
      setCaption(container, boss ? "⚠️ 老板来了！风险拉满，进度腰斩。" : "任务切换的注意力残留被释放，偷偷的快乐到账。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      // 水波背景
      ctx.strokeStyle = "rgba(0,229,255,0.12)"; ctx.lineWidth = 1;
      for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 8) {
          var y = h * (0.3 + i * 0.14) + Math.sin(x / 40 + t / 500 + i) * 6;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // 鱼游动
      fishX += fishDir * 0.0025; if (fishX > 0.85 || fishX < 0.15) fishDir *= -1;
      var fx = fishX * w, fy = h * 0.5;
      ctx.save(); ctx.translate(fx, fy); if (fishDir < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#FFB020"; ctx.shadowColor = "#FFB020"; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-36, -10); ctx.lineTo(-36, 10); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "#0B0D14"; ctx.beginPath(); ctx.arc(10, -3, 3, 0, 6.29); ctx.fill();
      ctx.restore();
      // 老板雷达
      if (boss > 0) {
        boss = Math.max(0, boss - 0.01);
        ctx.fillStyle = "rgba(255,77,109," + (0.15 + 0.15 * Math.sin(t / 80)) + ")";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#FF4D6D"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("⚠ 老板雷达扫描中", w / 2, h * 0.2);
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     6. 刷短视频 —— 变比率强化 + 时间黑洞
     ======================================================= */
  function labShortvideo(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("📱 上滑", "");
    center.appendChild(b);
    var count = 0, seconds = 0, offset = 0;
    b.addEventListener("click", function () {
      count++; seconds += Math.round(rand(20, 90)); offset += 64;
      read.set([
        { val: count, label: "已刷条数", kind: "cyan" },
        { val: Math.floor(seconds / 60) + "分" + (seconds % 60) + "秒", label: "吞噬时间", kind: "bad" }
      ]);
      setCaption(container, "下一条永远更上头——算法优化的变比率强化，正在偷走你的时间感知。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.fillStyle = "#05060f"; ctx.fillRect(0, 0, w, h);
      // 手机
      var pw = 120, ph = 210, px = (w - pw) / 2, py = (h - ph) / 2;
      ctx.fillStyle = "#11141d"; ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
      roundRect(ctx, px, py, pw, ph, 14); ctx.fill(); ctx.stroke();
      // 滚动短条
      ctx.save(); ctx.beginPath(); roundRect(ctx, px + 4, py + 4, pw - 8, ph - 8, 10); ctx.clip();
      var cols = ["#FF2E88", "#00E5FF", "#7C4DFF", "#00E5A0", "#FFB020"];
      for (var i = 0; i < 8; i++) {
        var yy = py + 10 + ((i * 64 - offset) % (ph + 64));
        if (yy < py - 60) yy += ph + 64;
        ctx.fillStyle = cols[(i + count) % cols.length]; ctx.globalAlpha = 0.8;
        roundRect(ctx, px + 10, yy, pw - 20, 52, 8); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("↓ 上滑", w / 2, py + ph - 12);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     7. 奶茶 —— 糖脂协同 + 期待奖励
     ======================================================= */
  function labMilktea(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var sugar = 0, caf = 0, kcal = 0, fill = 0;
    var pearls = [], drops = [];
    function addBtn(label, cls, fn) { var x = btn(label, cls, fn); center.appendChild(x); }
    addBtn("🟤 加珍珠", "", function () { pearls.push({ x: rand(0.35, 0.65), y: 0, vy: rand(0.4, 0.8) }); fill = clamp(fill + 3, 0, 100); kcal += 80; upd(); setCaption(container, "Q 弹珍珠：咀嚼的感官奖赏已到账。"); });
    addBtn("🥛 加奶盖", "cyan", function () { sugar += 8; kcal += 120; fill = clamp(fill + 6, 0, 100); upd(); setCaption(container, "奶盖脂肪 + 糖，糖脂协同让奖赏中枢比单吃糖更嗨。"); });
    addBtn("🍯 加糖", "amber", function () { sugar += 12; kcal += 60; upd(); setCaption(container, "一勺糖，多巴胺的小额投放 +1。"); });
    addBtn("☕ 加咖啡因", "", function () { caf += 50; upd(); setCaption(container, "咖啡因补一层清醒的愉悦，清醒地快乐着。"); });
    function upd() {
      read.set([
        { val: sugar + "g", label: "糖分", kind: "warn" },
        { val: caf + "mg", label: "咖啡因", kind: "cyan" },
        { val: kcal + "kcal", label: "热量", kind: "bad" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cupTop = h * 0.28, cupBot = h * 0.82, cupWTop = 70, cupWBot = 54;
      // 杯身
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - cupWTop, cupTop); ctx.lineTo(cx + cupWTop, cupTop);
      ctx.lineTo(cx + cupWBot, cupBot); ctx.lineTo(cx - cupWBot, cupBot); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 液体
      var liqH = (cupBot - cupTop) * (fill / 100);
      var grad = ctx.createLinearGradient(0, cupBot - liqH, 0, cupBot);
      grad.addColorStop(0, "#caa472"); grad.addColorStop(1, "#8a5a2b");
      ctx.fillStyle = grad;
      ctx.beginPath();
      var yTop = cupBot - liqH;
      var wt = lerp(cupWTop, cupWBot, (yTop - cupTop) / (cupBot - cupTop));
      ctx.moveTo(cx - wt, yTop); ctx.lineTo(cx + wt, yTop);
      ctx.lineTo(cx + cupWBot, cupBot); ctx.lineTo(cx - cupWBot, cupBot); ctx.closePath(); ctx.fill();
      // 珍珠下沉
      pearls.forEach(function (p) {
        p.y += p.vy; var yb = cupBot - 6; if (p.y > yb) p.y = yb;
        ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(cx + (p.x - 0.5) * (cupWBot * 1.4), p.y, 5, 0, 6.29); ctx.fill();
      });
      // 气泡
      if (Math.random() < 0.3) drops.push({ x: rand(-cupWBot, cupWBot), y: cupBot - liqH, vy: -0.5, a: 1 });
      drops.forEach(function (d) { d.y += d.vy; d.a -= 0.02; ctx.globalAlpha = clamp(d.a, 0, 1); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(cx + d.x, d.y, 2, 0, 6.29); ctx.fill(); });
      ctx.globalAlpha = 1; drops = drops.filter(function (d) { return d.a > 0; });
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     8. 螺蛳粉 —— 鼻后嗅觉悖论
     ======================================================= */
  function labLuosifen(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("👃 闻一下", "");
    center.appendChild(b);
    var adapt = 0, stink = [];
    b.addEventListener("click", function () {
      adapt = clamp(adapt + 18, 0, 100);
      for (var i = 0; i < 10; i++) stink.push({ x: 0.5, y: 0.55, vx: rand(-0.012, 0.012), vy: rand(-0.02, -0.006), a: 1, foul: adapt < 60 });
      read.set([
        { val: Math.round(adapt) + "%", label: "嗅觉适应度", kind: adapt > 60 ? "good" : "warn" }
      ]);
      setCaption(container, adapt > 75 ? "真香定律生效：臭味被适应，鲜味主导，越闻越香。" : "硫化物扑面——但再多闻几下，你的大脑就「闻不到」了。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, bowlY = h * 0.62;
      // 碗
      ctx.fillStyle = "#2A2F40"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, bowlY, 90, 34, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#5a3a1a"; ctx.beginPath(); ctx.ellipse(cx, bowlY, 78, 26, 0, 0, Math.PI * 2); ctx.fill();
      // 臭气 / 香气粒子
      stink.forEach(function (s) { s.x += s.vx; s.y += s.vy; s.a -= 0.012; });
      stink = stink.filter(function (s) { return s.a > 0; });
      stink.forEach(function (s) {
        ctx.globalAlpha = clamp(s.a, 0, 1) * 0.7;
        ctx.fillStyle = s.foul ? "#7CFC00" : "#FFB020";
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, 6, 0, 6.29); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // 鼻子
      ctx.font = "40px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(adapt > 75 ? "😋" : "😷", cx, bowlY - 70);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     9. 泡面 —— 美拉德反应 + 期待奖励
     ======================================================= */
  function labNoodle(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("⏱️ 开始泡（3 分钟）", "amber");
    center.appendChild(b);
    var cooking = false, cook = 0, aroma = 0, remain = 0;
    b.addEventListener("click", function () {
      if (cooking) return;
      cooking = true; cook = 0; aroma = 0; remain = 180;
      setCaption(container, "热水激发美拉德反应，香气随等待攀升——期待奖励在临界点爆发。");
      var iv = setInterval(function () {
        if (!cooking) { clearInterval(iv); return; }
        remain -= 1; cook = clamp(cook + 1 / 180, 0, 1); aroma = clamp(aroma + 0.6, 0, 100);
        read.set([
          { val: (remain > 0 ? Math.floor(remain / 60) + ":" + ("0" + (remain % 60)).slice(-2) : "0:00"), label: "剩余时间" },
          { val: Math.round(aroma) + "%", label: "香气", kind: "good" }
        ]);
        if (remain <= 0) {
          cooking = false; clearInterval(iv);
          setCaption(container, "叮！可以吃了。深夜碳水的浪漫，此刻到账。");
        }
      }, 16); // 加速：约 3 秒跑完
      b._iv = b._iv || null; b._timer = iv;
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cupTop = h * 0.32, cupBot = h * 0.8, cw = 64;
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - cw, cupTop); ctx.lineTo(cx + cw, cupTop); ctx.lineTo(cx + cw - 10, cupBot); ctx.lineTo(cx - cw + 10, cupBot); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 面条：未熟时抖动大，熟了变软
      ctx.strokeStyle = "#e8c46a"; ctx.lineWidth = 3;
      var amp = lerp(10, 2, cook);
      for (var i = 0; i < 6; i++) {
        ctx.beginPath();
        var bx = cx - 40 + i * 14;
        for (var y = cupTop + 6; y <= cupBot - 8; y += 6) {
          var xx = bx + Math.sin(y / 12 + t / (120 - cook * 80) + i) * amp * (1 - (y - cupTop) / (cupBot - cupTop));
          if (y === cupTop + 6) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
        }
        ctx.stroke();
      }
      // 蒸汽
      if (aroma > 0) {
        ctx.strokeStyle = "rgba(255,255,255," + (aroma / 300) + ")"; ctx.lineWidth = 2;
        for (var k = 0; k < 3; k++) {
          ctx.beginPath();
          var sx = cx - 20 + k * 20;
          for (var sy = cupTop; sy > cupTop - 50; sy -= 6) {
            var sxx = sx + Math.sin(sy / 10 + t / 300 + k) * 6;
            if (sy === cupTop) ctx.moveTo(sxx, sy); else ctx.lineTo(sxx, sy);
          }
          ctx.stroke();
        }
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); if (b._timer) clearInterval(b._timer); } };
  }

  /* =======================================================
     10. 炸鸡 —— 糖脂协同 + 感官奖赏
     ======================================================= */
  function labFried(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🍗 咬一口", "amber");
    center.appendChild(b);
    var crisp = 0, oil = 0, rings = [], drops = [];
    b.addEventListener("click", function () {
      crisp = clamp(crisp + 14, 0, 100); oil += 60;
      rings.push({ r: 20, a: 1 });
      for (var i = 0; i < 14; i++) drops.push({ x: 0.5, y: 0.5, vx: rand(-0.02, 0.02), vy: rand(-0.025, 0.005), a: 1 });
      read.set([
        { val: Math.round(crisp) + "%", label: "酥脆度", kind: "good" },
        { val: oil + "g", label: "油脂摄入", kind: "bad" }
      ]);
      setCaption(container, "咔嚓！70dB 的酥脆声学反馈 + 脂肪碳水，顶级感官奖赏。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h, cx = w / 2, cy = h / 2 - 6;
      ctx.clearRect(0, 0, w, h);
      // 鸡腿
      ctx.fillStyle = "#c8862f"; ctx.strokeStyle = "#8a5a1a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 6, 34, 26, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e7c27a"; ctx.beginPath(); ctx.arc(cx + 30, cy - 24, 12, 0, 6.29); ctx.fill(); ctx.stroke();
      // 酥脆声纹
      rings.forEach(function (r) { r.r += 2.2; r.a -= 0.025; });
      rings = rings.filter(function (r) { return r.a > 0; });
      rings.forEach(function (r) {
        ctx.globalAlpha = clamp(r.a, 0, 1); ctx.strokeStyle = "#FFB020"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy + 6, r.r, 0, 6.29); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // 油滴
      drops.forEach(function (d) { d.x += d.vx; d.y += d.vy; d.vy += 0.001; d.a -= 0.02; });
      drops = drops.filter(function (d) { return d.a > 0; });
      drops.forEach(function (d) {
        ctx.globalAlpha = clamp(d.a, 0, 1); ctx.fillStyle = "#FFB020";
        ctx.beginPath(); ctx.arc(d.x * w, d.y * h, 3, 0, 6.29); ctx.fill();
      });
      ctx.globalAlpha = 1;
      crisp = clamp(crisp - 0.05, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     11. 火锅 —— 辣椒素 TRPV1 + 内啡肽
     ======================================================= */
  function labHotpot(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var spicy = 0, endo = 0;
    var up = btn("🌶️ 加辣", "amber", function () { spicy = clamp(spicy + 15, 0, 100); setCaption(container, "辣椒素激活 TRPV1，大脑用内啡肽镇痛——痛被中和成爽。"); });
    var down = btn("💧 减辣", "cyan", function () { spicy = clamp(spicy - 15, 0, 100); });
    center.appendChild(up); center.appendChild(down);
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h * 0.55;
      // 锅
      ctx.fillStyle = "#3A1F1A"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy, 86, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,77,109," + (0.4 + spicy / 300) + ")";
      ctx.beginPath(); ctx.ellipse(cx, cy, 74, 22, 0, 0, Math.PI * 2); ctx.fill();
      // 沸腾气泡
      for (var i = 0; i < 12; i++) {
        var bx = cx + Math.sin(i * 2.1) * 60, by = cy + Math.cos(i * 1.3 + t / 400) * 14;
        ctx.globalAlpha = 0.5; ctx.fillStyle = "#FFB020";
        ctx.beginPath(); ctx.arc(bx, by - (t / 30 + i * 10) % 20, 2 + (i % 3), 0, 6.29); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 舌头火焰
      endo = lerp(endo, clamp(spicy * 0.9, 0, 100), 0.05);
      var ty = cy - 70;
      ctx.font = "34px sans-serif"; ctx.textAlign = "center"; ctx.fillText("👅", cx, ty);
      if (spicy > 0) {
        var fh = 10 + spicy / 4 + Math.sin(t / 90) * 4;
        ctx.fillStyle = "rgba(255,176,32,0.9)"; ctx.shadowColor = "#FFB020"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(cx - 10, ty - 6); ctx.quadraticCurveTo(cx, ty - 6 - fh, cx + 10, ty - 6); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
      }
      read.set([
        { val: Math.round(spicy) + "%", label: "辣度", kind: spicy > 60 ? "bad" : "warn" },
        { val: Math.round(endo) + "%", label: "内啡肽", kind: "good" }
      ]);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     12. 甜品 —— 多巴胺快糖 + 血糖跷跷板
     ======================================================= */
  function labDessert(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🍰 吃一口", "");
    center.appendChild(b);
    var sugar = 40, satisfy = 30, pieces = 0, craving = 0;
    b.addEventListener("click", function () {
      sugar = clamp(sugar + 45, 0, 100); satisfy = clamp(satisfy + 25, 0, 100); pieces++; craving = 0;
      read.set([
        { val: Math.round(sugar) + "%", label: "血糖", kind: sugar > 70 ? "bad" : "good" },
        { val: Math.round(satisfy) + "%", label: "满足感", kind: "good" },
        { val: pieces, label: "已吃块数", kind: "warn" }
      ]);
      setCaption(container, "快糖冲进血液，多巴胺猛拉——下一口「再来一块」已经在路上。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h * 0.42;
      // 蛋糕
      ctx.fillStyle = "#f7d9b0"; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
      roundRect(ctx, cx - 40, cy, 80, 40, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FF2E88"; roundRect(ctx, cx - 40, cy - 12, 80, 14, 6); ctx.fill();
      ctx.fillStyle = "#FFB020"; ctx.beginPath(); ctx.arc(cx, cy - 16, 5, 0, 6.29); ctx.fill();
      // 血糖竖条（数值 gauge，非折线）
      var gx = 30, gy = h * 0.2, gh = h * 0.55, gw = 16;
      ctx.fillStyle = "rgba(255,255,255,0.08)"; roundRect(ctx, gx, gy, gw, gh, 6); ctx.fill();
      var lvl = gh * (sugar / 100);
      var col = sugar > 70 ? "#FF4D6D" : sugar > 40 ? "#FFB020" : "#00E5A0";
      ctx.fillStyle = col; roundRect(ctx, gx, gy + gh - lvl, gw, lvl, 6); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("血糖", gx + gw / 2, gy + gh + 14);
      // 衰减 + 渴望
      sugar = clamp(sugar - 0.08, 0, 100); satisfy = clamp(satisfy - 0.04, 0, 100);
      if (sugar < 45 && pieces > 0) { craving += 0.02; }
      if (craving > 0.4 && Math.random() < 0.02) setCaption(container, "血糖塌了，低落感逼你「再来一块」回血——跷跷板循环。");
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* ---------- 通用绘制工具 ---------- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s, y - s * 0.3, x - s, y + s * 0.1);
    ctx.bezierCurveTo(x - s, y + s * 0.6, x, y + s * 0.9, x, y + s * 1.1);
    ctx.bezierCurveTo(x, y + s * 0.9, x + s, y + s * 0.6, x + s, y + s * 0.1);
    ctx.bezierCurveTo(x + s, y - s * 0.3, x, y, x, y + s * 0.3);
    ctx.closePath(); ctx.fill();
  }

  /* =======================================================
     13. 夜跑 / 运动 —— 内啡肽 + 跑者高潮
     ======================================================= */
  function labSport(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏃 开跑", "cyan");
    center.appendChild(b);
    var dist = 0, endo = 0, dopa = 0, runnerX = 0.1;
    b.addEventListener("click", function () {
      dist += 0.4; endo = clamp(endo + 14, 0, 100); dopa = clamp(dopa + 6, 0, 100);
      read.set([
        { val: dist.toFixed(1) + "km", label: "距离" },
        { val: Math.round(endo) + "%", label: "内啡肽", kind: "good" },
        { val: Math.round(dopa) + "%", label: "多巴胺", kind: "cyan" }
      ]);
      setCaption(container, endo > 70 ? "跑者高潮来了：平静的欣快与掌控感，和内啡肽一起涌上。" : "决定开跑的那一刻，多巴胺已经先奖励了你的行动力。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var gy = h * 0.72;
      ctx.strokeStyle = "rgba(0,229,160,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      runnerX += 0.004; if (runnerX > 1.1) runnerX = -0.1;
      var rx = runnerX * w, ry = gy - 26 - Math.abs(Math.sin(t / 120)) * 6;
      ctx.strokeStyle = "#00E5A0"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + 18); ctx.stroke();
      ctx.fillStyle = "#00E5A0"; ctx.beginPath(); ctx.arc(rx, ry - 6, 6, 0, 6.29); ctx.fill();
      var sw = Math.sin(t / 80) * 10;
      ctx.beginPath();
      ctx.moveTo(rx, ry + 18); ctx.lineTo(rx + sw, gy);
      ctx.moveTo(rx, ry + 18); ctx.lineTo(rx - sw, gy); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx, ry + 4); ctx.lineTo(rx - sw, ry + 12);
      ctx.moveTo(rx, ry + 4); ctx.lineTo(rx + sw, ry + 12); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath(); ctx.moveTo(w * 0.92, gy); ctx.lineTo(w * 0.92, gy - 40); ctx.stroke();
      ctx.fillStyle = "#FF2E88"; ctx.beginPath();
      ctx.moveTo(w * 0.92, gy - 40); ctx.lineTo(w * 0.92 + 16, gy - 34); ctx.lineTo(w * 0.92, gy - 28); ctx.closePath(); ctx.fill();
      endo = clamp(endo - 0.03, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     14. 打篮球 —— 操作性条件反射 + 催产素 + 内啡肽
     ======================================================= */
  function labBasketball(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏀 投一球", "amber");
    center.appendChild(b);
    var score = 0, shots = 0, ball = null, swish = 0;
    b.addEventListener("click", function () {
      shots++;
      var make = Math.random() < 0.6;
      if (make) { score++; swish = 1; }
      ball = { t: 0, make: make };
      read.set([
        { val: score, label: "进球", kind: "good" },
        { val: shots, label: "出手", kind: "cyan" },
        { val: (shots ? Math.round(score / shots * 100) : 0) + "%", label: "命中率" }
      ]);
      setCaption(container, make ? "空心入网！瞬间反馈 + 团队归属，多巴胺到账。" : "打铁了。再来一球——操作性条件反射让你停不下来。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var hx = w * 0.72, hy = h * 0.32;
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 3;
      ctx.strokeRect(hx - 30, hy - 30, 60, 20);
      ctx.fillStyle = "#FF2E88"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx, hy, 16, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = "rgba(0,229,255,0.15)";
      ctx.beginPath(); ctx.moveTo(0, h * 0.85); ctx.lineTo(w, h * 0.85); ctx.stroke();
      var bx, by;
      if (ball) {
        ball.t += 0.02; var p = ball.t;
        bx = lerp(0.2, hx / w, p) * w;
        by = lerp(0.85, hy / h, p) * h - Math.sin(p * Math.PI) * 120;
        if (p >= 1) ball = null;
      } else { bx = w * 0.2; by = h * 0.85; }
      ctx.fillStyle = "#FF8A3D"; ctx.shadowColor = "#FF8A3D"; ctx.shadowBlur = ball ? 16 : 0;
      ctx.beginPath(); ctx.arc(bx, by, 12, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
      if (swish > 0) { swish -= 0.03; ctx.fillStyle = "rgba(0,229,160," + clamp(swish, 0, 1) + ")"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center"; ctx.fillText("空心!", hx, hy - 24); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     15. 游泳 —— 副交感 + 内啡肽 + 感官奖赏
     ======================================================= */
  function labSwim(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏊 划一臂", "cyan");
    center.appendChild(b);
    var laps = 0, breath = 0, calm = 0, swimmerX = 0.15, ripples = [];
    b.addEventListener("click", function () {
      laps++; breath++; calm = clamp(calm + 12, 0, 100);
      ripples.push({ x: swimmerX, y: 0.6, r: 6, a: 1 });
      read.set([
        { val: laps, label: "划水次数", kind: "cyan" },
        { val: breath, label: "换气", kind: "good" },
        { val: Math.round(calm) + "%", label: "副交感", kind: "good" }
      ]);
      setCaption(container, calm > 70 ? "水的包裹感 + 规律呼吸，皮质醇在下降，副交感接管。" : "入水一刻，世界被按下静音键。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0a2a3a"); g.addColorStop(1, "#06303f");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,229,255,0.15)"; ctx.lineWidth = 1;
      for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 8) {
          var y = h * (0.2 + i * 0.15) + Math.sin(x / 30 + t / 500 + i) * 5;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      swimmerX += 0.003; if (swimmerX > 0.9) swimmerX = 0.1;
      var sx = swimmerX * w, sy = h * 0.6;
      ctx.save(); ctx.translate(sx, sy);
      ctx.fillStyle = "#00E5FF"; ctx.shadowColor = "#00E5FF"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#0B0D14"; ctx.beginPath(); ctx.arc(14, 0, 4, 0, 6.29); ctx.fill();
      ctx.restore(); ctx.shadowBlur = 0;
      ripples.forEach(function (r) { r.r += 1.4; r.a -= 0.02; });
      ripples = ripples.filter(function (r) { return r.a > 0; });
      ripples.forEach(function (r) {
        ctx.globalAlpha = clamp(r.a, 0, 1) * 0.5; ctx.strokeStyle = "#00E5FF"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(r.x * w, r.y * h, r.r, r.r * 0.5, 0, 0, 6.29); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      calm = clamp(calm - 0.02, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     16. 骑行 —— 速度感 + 期待奖励 + 心流
     ======================================================= */
  function labCycling(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🚴 踩一脚", "cyan");
    center.appendChild(b);
    var dist = 0, scroll = 0, speed = 0;
    b.addEventListener("click", function () {
      dist += 0.3; speed = clamp(speed + 8, 0, 100);
      read.set([
        { val: dist.toFixed(1) + "km", label: "里程", kind: "cyan" },
        { val: Math.round(speed) + "%", label: "速度/风感", kind: "good" }
      ]);
      setCaption(container, "风从耳边过，前方永远是下一条未知的路——期待奖励 + 心流。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var ground = h * 0.78;
      ctx.fillStyle = "#11141d"; ctx.fillRect(0, ground, w, h - ground);
      scroll += speed * 0.01 + 0.4;
      ctx.fillStyle = "rgba(124,77,255,0.4)";
      for (var i = 0; i < 12; i++) {
        var x = ((i * 120 - (scroll % 120)) % (w + 120)); if (x < -120) x += w + 120;
        ctx.fillRect(x, ground - 40, 8, 40);
        ctx.fillRect(x + 40, ground - 60, 6, 60);
      }
      var bx = w * 0.4, by = ground - 4;
      ctx.strokeStyle = "#FF2E88"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(bx - 18, by - 18, 12, 0, 6.29); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + 18, by - 18, 12, 0, 6.29); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - 18, by - 18); ctx.lineTo(bx, by - 30); ctx.lineTo(bx + 18, by - 18);
      ctx.moveTo(bx, by - 30); ctx.lineTo(bx - 4, by - 18); ctx.stroke();
      ctx.fillStyle = "#00E5FF"; ctx.beginPath(); ctx.arc(bx, by - 40, 6, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#00E5FF"; ctx.beginPath(); ctx.moveTo(bx, by - 34); ctx.lineTo(bx - 2, by - 20); ctx.stroke();
      if (speed > 0) {
        ctx.strokeStyle = "rgba(255,255,255," + (speed / 300) + ")"; ctx.lineWidth = 2;
        for (var k = 0; k < 4; k++) {
          var y = by - 50 + k * 8; var xoff = (t / 3 + k * 30) % w;
          ctx.beginPath(); ctx.moveTo(w - xoff, y); ctx.lineTo(w - xoff - 30, y); ctx.stroke();
        }
      }
      speed = clamp(speed - 0.15, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     17. 撸铁 / 健身 —— 成就多巴胺 + 可见反馈
     ======================================================= */
  function labGym(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏋️ 推一组", "amber");
    center.appendChild(b);
    var reps = 0, strength = 0, pr = 0, lift = 0;
    b.addEventListener("click", function () {
      reps++; strength = clamp(strength + 7, 0, 100); lift = 1;
      if (strength >= 60 && pr === 0) { pr = 1; setCaption(container, "PR！突破个人纪录，成就多巴胺瞬间拉满。"); }
      else setCaption(container, "镜子里的自己又硬了一点——看得见的反馈最上头。");
      read.set([
        { val: reps, label: "组数", kind: "cyan" },
        { val: Math.round(strength) + "%", label: "力量/围度", kind: "good" },
        { val: pr ? "已破" : "未破", label: "PR", kind: pr ? "good" : "" }
      ]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cy = h * 0.5, up = lift > 0 ? Math.sin((1 - lift) * Math.PI) * -20 : 0;
      if (lift > 0) lift -= 0.04;
      var barY = cy + up;
      ctx.strokeStyle = "#FFB020"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(w * 0.3, barY); ctx.lineTo(w * 0.7, barY); ctx.stroke();
      [-1, 1].forEach(function (s) {
        ctx.fillStyle = "#3A3F55";
        ctx.fillRect(w * 0.3 + s * 4 - 6, barY - 18, 12, 36);
        ctx.fillRect(w * 0.7 + s * 4 - 6, barY - 18, 12, 36);
      });
      ctx.fillStyle = "#00E5FF";
      ctx.beginPath(); ctx.arc(w * 0.45, barY, 5, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.55, barY, 5, 0, 6.29); ctx.fill();
      var gx = w * 0.5, gy = h * 0.78, gw = 160, gh = 10;
      ctx.fillStyle = "rgba(255,255,255,0.08)"; roundRect(ctx, gx - gw / 2, gy, gw, gh, 5); ctx.fill();
      ctx.fillStyle = "#00E5A0"; roundRect(ctx, gx - gw / 2, gy, gw * (strength / 100), gh, 5); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("力量/围度", gx, gy + 22);
      strength = clamp(strength - 0.03, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     18. 羽毛球 —— 变比率强化 + 社交激素
     ======================================================= */
  function labBadminton(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏸 扣杀", "cyan");
    center.appendChild(b);
    var rally = 0, wins = 0, shuttle = null;
    b.addEventListener("click", function () {
      rally++; var win = Math.random() < 0.5; if (win) wins++;
      shuttle = { t: 0, win: win };
      read.set([
        { val: rally, label: "回合", kind: "cyan" },
        { val: wins, label: "得分", kind: "good" },
        { val: (rally ? Math.round(wins / rally * 100) : 0) + "%", label: "得分率" }
      ]);
      setCaption(container, win ? "钉地板！得分的随机快感正是变比率强化。" : "出界了。下一拍说不定就赢——所以你接着打。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.2); ctx.lineTo(w * 0.5, h * 0.8); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(0,229,160,0.15)"; ctx.strokeRect(w * 0.1, h * 0.25, w * 0.8, h * 0.5);
      var sx, sy;
      if (shuttle) {
        shuttle.t += 0.025; var p = shuttle.t;
        sx = lerp(0.25, 0.75, p) * w;
        sy = shuttle.win ? lerp(0.35, 0.6, p) * h : lerp(0.35, 0.7, p) * h;
        if (p >= 1) shuttle = null;
      } else { sx = w * 0.25; sy = h * 0.35; }
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(t / 200) * 0.3);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#FF2E88"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(-5, 4); ctx.moveTo(0, -8); ctx.lineTo(5, 4); ctx.moveTo(0, -8); ctx.lineTo(0, 6); ctx.stroke();
      ctx.restore();
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     19. 瑜伽 —— 副交感 + GABA + 血清素
     ======================================================= */
  function labYoga(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🧘 深呼吸", "cyan");
    center.appendChild(b);
    var calm = 0;
    b.addEventListener("click", function () {
      calm = clamp(calm + 16, 0, 100);
      read.set([
        { val: Math.round(calm) + "%", label: "副交感/平静", kind: "good" },
        { val: Math.round(Math.min(100, calm * 1.1)) + "%", label: "GABA/血清素", kind: "cyan" }
      ]);
      setCaption(container, calm > 75 ? "副交感主导，GABA 上升——平静的欣快，和剧烈刺激正好相反。" : "吸气拉长脊柱，呼气放下紧绷。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h * 0.5;
      var pulse = 0.5 + 0.5 * Math.sin(t / 900);
      var r = 30 + pulse * 40;
      ctx.strokeStyle = "rgba(0,229,160," + (0.4 + pulse * 0.4) + ")"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.29); ctx.stroke();
      ctx.fillStyle = "rgba(0,229,160," + (0.06 + pulse * 0.06) + ")"; ctx.fill();
      ctx.font = "40px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🧘", cx, cy + 14);
      calm = clamp(calm - 0.015, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* ---------- 注册 ---------- */
  window.GUIDE_LABS = {
    binge: { init: labBinge },
    blindbox: { init: labBlindbox },
    cat: { init: labCat },
    replay: { init: labReplay },
    slack: { init: labSlack },
    shortvideo: { init: labShortvideo },
    milktea: { init: labMilktea },
    luosifen: { init: labLuosifen },
    noodle: { init: labNoodle },
    fried: { init: labFried },
    hotpot: { init: labHotpot },
    dessert: { init: labDessert },
    sport: { init: labSport },
    basketball: { init: labBasketball },
    swimming: { init: labSwim },
    cycling: { init: labCycling },
    gym: { init: labGym },
    badminton: { init: labBadminton },
    yoga: { init: labYoga }
  };
})();
