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

  /* =======================================================
     20. 撸狗 —— 催产素双向奔赴 + 减压
     ======================================================= */
  function labDog(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var oxy = 25, calm = 20, pets = 0, gaze = 0, hearts = [];
    center.appendChild(btn("🐶 撸一把", "", function () {
      pets++;
      oxy = clamp(oxy + 14, 0, 100); calm = clamp(calm + 10, 0, 100);
      if (oxy > 65 && hearts.length < 6) hearts.push({ x: rand(0.3, 0.7), y: 0.4, vy: -0.004, a: 1 });
      upd();
      setCaption(container, oxy > 80 ? "催产素拉满：它把攒了一整天的热情全砸给你了。" : "掌心下的体温 + 停不下来的尾巴，皮质醇正在下降，这才是真正的减压。");
    }));
    center.appendChild(btn("👀 对视 3 秒", "cyan", function () {
      oxy = clamp(oxy + 18, 0, 100); gaze = 1; upd();
      setCaption(container, "对视会让双方的催产素同步升高——人和狗之间罕见的双向奔赴。");
    }));
    function upd() {
      read.set([
        { val: Math.round(oxy) + "%", label: "催产素", kind: "good" },
        { val: Math.round(calm) + "%", label: "减压/副交感", kind: "cyan" },
        { val: pets, label: "撸的次数", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h, cx = w / 2, cy = h * 0.38;
      ctx.clearRect(0, 0, w, h);
      // 尾巴（不受位移影响，单独摇晃）
      ctx.save(); ctx.translate(cx + 46, cy + 44); ctx.rotate(Math.sin(t / 70) * (0.35 + oxy / 220) - 0.5);
      ctx.strokeStyle = "#8A5A2B"; ctx.lineWidth = 9; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -12, 32, -26); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#C98A4B"; ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 46, 44, 34, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      [-1, 1].forEach(function (s) {
        ctx.fillStyle = "#B57A3E";
        roundRect(ctx, cx + s * 24 - 9, cy + 64, 18, 26, 8); ctx.fill();
      });
      var bob = Math.sin(t / 320) * 2;
      ctx.fillStyle = "#C98A4B";
      ctx.beginPath(); ctx.ellipse(cx, cy + bob, 44, 40, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      [-1, 1].forEach(function (s) {
        ctx.fillStyle = "#8A5A2B";
        ctx.beginPath(); ctx.ellipse(cx + s * 42, cy + 10 + bob, 13, 30, s * 0.22, 0, 6.29); ctx.fill();
      });
      var happy = oxy > 55;
      [-1, 1].forEach(function (s) {
        var ex = cx + s * 16, ey = cy - 6 + bob;
        if (happy) {
          ctx.strokeStyle = "#1b1108"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ex, ey + 3, 6, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
        } else {
          ctx.fillStyle = "#1b1108"; ctx.beginPath(); ctx.ellipse(ex, ey, 6, 7, 0, 0, 6.29); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex + s * 2, ey - 2, 2, 0, 6.29); ctx.fill();
        }
      });
      ctx.fillStyle = "#2a1a10";
      ctx.beginPath(); ctx.ellipse(cx, cy + 14 + bob, 8, 6, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 20 + bob); ctx.lineTo(cx - 8, cy + 27 + bob);
      ctx.moveTo(cx, cy + 20 + bob); ctx.lineTo(cx + 8, cy + 27 + bob); ctx.stroke();
      if (oxy > 70) {
        ctx.fillStyle = "#FF6FA5";
        roundRect(ctx, cx - 7, cy + 25 + bob, 14, 12 + Math.sin(t / 180) * 2, 6); ctx.fill();
      }
      if (gaze > 0) {
        gaze -= 0.01;
        ctx.strokeStyle = "rgba(255,46,136," + clamp(gaze, 0, 1) * 0.55 + ")"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy + bob, 54 + (1 - gaze) * 12, 0, 6.29); ctx.stroke();
      }
      hearts.forEach(function (ht) { ht.y += ht.vy; ht.a -= 0.008; });
      hearts = hearts.filter(function (x) { return x.a > 0; });
      hearts.forEach(function (ht) {
        ctx.globalAlpha = clamp(ht.a, 0, 1); ctx.fillStyle = "#FF2E88";
        drawHeart(ctx, ht.x * w, ht.y * h, 10);
      });
      ctx.globalAlpha = 1;
      oxy = clamp(oxy - 0.035, 0, 100); calm = clamp(calm - 0.02, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     21. 观赏鱼 / 水族箱 —— 副交感 + 期待奖励
     ======================================================= */
  function labAquarium(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var calm = 18, feeds = 0, eaten = 0;
    var COLORS = ["#FF8A3D", "#00E5FF", "#FF2E88", "#FFD23F", "#7C4DFF", "#00E5A0", "#FF6FA5"];
    var fish = [], foods = [], bubbles = [];
    for (var i = 0; i < 7; i++) {
      fish.push({ x: rand(0.12, 0.88), y: rand(0.14, 0.6), vx: rand(-0.0015, 0.0015), vy: 0, c: COLORS[i % COLORS.length], s: rand(0.85, 1.3) });
    }
    center.appendChild(btn("👀 看一会儿", "cyan", function () {
      calm = clamp(calm + 18, 0, 100); upd();
      setCaption(container, calm > 70 ? "视线跟着鱼慢慢飘：心率与皮质醇一起下降，副交感正在接管。" : "注意力被温和地占据，而不是被撕扯——这就是水族箱的减压魔法。");
    }));
    center.appendChild(btn("🍚 撒一把饲料", "", function () {
      feeds++;
      for (var k = 0; k < 14; k++) foods.push({ x: rand(0.18, 0.82), y: 0.08, vy: rand(0.002, 0.005) });
      upd();
      setCaption(container, "撒下去的两秒钟，鱼群从各个角落同时聚拢——一次小小的期待奖励。");
    }));
    function upd() {
      read.set([
        { val: Math.round(calm) + "%", label: "副交感/平静", kind: "good" },
        { val: feeds, label: "投喂次数", kind: "cyan" },
        { val: eaten, label: "抢食成功", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#08304a"); g.addColorStop(1, "#04131e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,229,160,0.35)"; ctx.lineWidth = 4; ctx.lineCap = "round";
      for (var k = 0; k < 6; k++) {
        var bx = w * (0.07 + k * 0.17), by = h * 0.72;
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + Math.sin(t / 700 + k) * 10, by - 32, bx + Math.sin(t / 700 + k) * 16, by - 62);
        ctx.stroke();
      }
      ctx.fillStyle = "#0d2b33"; ctx.fillRect(0, h * 0.72, w, h * 0.28);
      foods.forEach(function (f) { f.y += f.vy; });
      foods = foods.filter(function (f) { return f.y < 0.71; });
      foods.forEach(function (f) {
        ctx.fillStyle = "#e8c46a";
        ctx.beginPath(); ctx.arc(f.x * w, f.y * h, 3, 0, 6.29); ctx.fill();
      });
      fish.forEach(function (fs) {
        var tx = null, ty = null, best = 0.02;
        foods.forEach(function (f) {
          var d = (f.x - fs.x) * (f.x - fs.x) + (f.y - fs.y) * (f.y - fs.y);
          if (d < best) { best = d; tx = f.x; ty = f.y; }
        });
        if (tx !== null) {
          fs.vx = lerp(fs.vx, (tx - fs.x) * 0.03, 0.25);
          fs.vy = lerp(fs.vy, (ty - fs.y) * 0.03, 0.25);
        } else {
          fs.vx = lerp(fs.vx, Math.sin(t / 900 + fs.s * 5) * 0.0018, 0.03);
          fs.vy = lerp(fs.vy, Math.cos(t / 1300 + fs.s * 3) * 0.0007, 0.03);
        }
        fs.x = clamp(fs.x + fs.vx, 0.06, 0.94);
        fs.y = clamp(fs.y + fs.vy, 0.1, 0.66);
        for (var j = foods.length - 1; j >= 0; j--) {
          var dx = (foods[j].x - fs.x) * w, dy = (foods[j].y - fs.y) * h;
          if (dx * dx + dy * dy < 100) { foods.splice(j, 1); eaten++; upd(); }
        }
        var px = fs.x * w, py = fs.y * h;
        ctx.save(); ctx.translate(px, py); if (fs.vx < 0) ctx.scale(-1, 1);
        ctx.fillStyle = fs.c; ctx.shadowColor = fs.c; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(0, 0, 16 * fs.s, 8 * fs.s, 0, 0, 6.29); ctx.fill();
        var fin = Math.sin(t / 110 + fs.s) * 4;
        ctx.beginPath();
        ctx.moveTo(-14 * fs.s, 0);
        ctx.lineTo(-24 * fs.s, -8 * fs.s + fin);
        ctx.lineTo(-24 * fs.s, 8 * fs.s + fin);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#04131e"; ctx.beginPath(); ctx.arc(9 * fs.s, -2 * fs.s, 2.2, 0, 6.29); ctx.fill();
        ctx.restore();
      });
      if (Math.random() < 0.14) bubbles.push({ x: rand(0.1, 0.9), y: 0.7, r: rand(2, 5), vy: rand(0.0005, 0.0016) });
      bubbles.forEach(function (b) {
        b.y -= b.vy;
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x * w, b.y * h, b.r, 0, 6.29); ctx.stroke();
      });
      bubbles = bubbles.filter(function (b) { return b.y > 0.03; });
      calm = clamp(calm - 0.02, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     22. 仓鼠 —— 婴儿图式 + 感官奖赏
     ======================================================= */
  function labHamster(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var seeds = 0, chew = 0, spin = 0, dist = 0, laps = 0, wheelA = 0;
    center.appendChild(btn("🌻 喂一颗瓜子", "amber", function () {
      seeds = Math.min(seeds + 1, 6); chew = 1; spin = clamp(spin + 45, 0, 100);
      upd();
      setCaption(container, seeds > 3 ? "腮帮子鼓成两个球——婴儿图式命中，养育本能被一键启动。" : "它把瓜子塞进颊囊，转头冲上跑轮：多巴胺和催产素一起涨。");
    }));
    center.appendChild(btn("🎡 拨一下跑轮", "cyan", function () {
      spin = clamp(spin + 30, 0, 100);
      setCaption(container, "看它认真狂奔的那股劲儿，像一场不需要你负责的解压直播。");
    }));
    function upd() {
      read.set([
        { val: seeds + "/6", label: "颊囊存量", kind: "warn" },
        { val: laps, label: "跑轮圈数", kind: "cyan" },
        { val: Math.round(Math.min(100, seeds * 15 + 20)) + "%", label: "幼态暴击", kind: "good" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var ground = h * 0.68;
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(w, ground); ctx.stroke();
      var wx = w * 0.76, wy = ground - 38, wr = 38;
      wheelA += spin * 0.03 + 0.008;
      ctx.strokeStyle = "#5A6070"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, 6.29); ctx.stroke();
      ctx.save(); ctx.translate(wx, wy); ctx.rotate(wheelA);
      for (var i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * Math.PI / 4) * wr, Math.sin(i * Math.PI / 4) * wr);
        ctx.stroke();
      }
      ctx.restore();
      var cx = w * 0.34, cy = ground - 26 + Math.sin(t / 200) * 1.5;
      ctx.fillStyle = "#E7C08A"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, 30, 24, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      [-1, 1].forEach(function (s) {
        ctx.fillStyle = "#D9A96F";
        ctx.beginPath(); ctx.arc(cx + s * 19, cy - 20, 8, 0, 6.29); ctx.fill();
      });
      var puff = seeds * 2.2 + (chew > 0 ? Math.abs(Math.sin(t / 90)) * 2.4 : 0);
      [-1, 1].forEach(function (s) {
        ctx.fillStyle = "#F5DCB0";
        ctx.beginPath(); ctx.ellipse(cx + s * (17 + puff / 2), cy + 7, 9 + puff, 8 + puff, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = "#1b1108";
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.arc(cx + s * 9, cy - 5, 3.2, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = "#FF6FA5";
      ctx.beginPath(); ctx.arc(cx, cy + 4, 3, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#fff";
      roundRect(ctx, cx - 4, cy + 7, 8, 2 + (chew > 0 ? Math.abs(Math.sin(t / 110)) * 3 : 1), 1); ctx.fill();
      chew = Math.max(0, chew - 0.02);
      spin = clamp(spin - 0.07, 0, 100);
      dist += spin * 0.0006;
      if (Math.floor(dist) !== laps) { laps = Math.floor(dist); upd(); }
      if (seeds > 0 && Math.random() < 0.004) { seeds--; upd(); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     23. 养鹦鹉 —— 变比率强化 + 期待奖励
     ======================================================= */
  function labParrot(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var WORDS = ["你好", "恭喜发财", "宝宝乖", "我爱你", "谁是大笨蛋", "起床了！", "干饭了", "喵～"];
    var said = 0, learned = [], surprise = 0, bubble = null;
    center.appendChild(btn("🗣️ 教它说话", "cyan", function () {
      said++;
      if (Math.random() < 0.62) {
        var wd = WORDS[Math.floor(rand(0, WORDS.length))];
        if (learned.indexOf(wd) < 0) learned.push(wd);
        bubble = { text: wd, life: 1 };
        surprise = clamp(surprise + 26, 0, 100);
        setCaption(container, "它真的开口了！这种完全随机的回应，就是变比率强化的日常版。");
      } else {
        bubble = { text: "……", life: 1 };
        setCaption(container, "它只是歪头看你。正因为不确定它何时开口，期待奖励才一直在攒。");
      }
      upd();
    }));
    function upd() {
      read.set([
        { val: learned.length, label: "学会的词", kind: "good" },
        { val: said, label: "教学回合", kind: "cyan" },
        { val: Math.round(surprise) + "%", label: "惊喜指数", kind: surprise > 60 ? "warn" : "" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, py = h * 0.44;
      ctx.strokeStyle = "#8A7A55"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx - 66, py + 46); ctx.lineTo(cx + 66, py + 46); ctx.stroke();
      ["#FF2E88", "#FFD23F", "#7C4DFF"].forEach(function (c, i) {
        ctx.strokeStyle = c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx, py + 28); ctx.lineTo(cx - 8 + i * 7, py + 60); ctx.stroke();
      });
      ctx.fillStyle = "#00C2A8"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, py, 26, 34, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#009E86";
      ctx.beginPath(); ctx.ellipse(cx - 15, py + 4, 10, 22, 0.2, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#FF8A3D"; ctx.lineWidth = 3;
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(cx + s * 9, py + 30); ctx.lineTo(cx + s * 9, py + 46); ctx.stroke();
      });
      var bob = bubble ? Math.sin(t / 90) * 3 : Math.sin(t / 520) * 1.5;
      ctx.fillStyle = "#00C2A8";
      ctx.beginPath(); ctx.arc(cx + 2, py - 34 + bob, 20, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#FFD23F"; ctx.lineWidth = 3;
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + 2 + i * 5, py - 50 + bob);
        ctx.lineTo(cx + 2 + i * 9, py - 62 + bob);
        ctx.stroke();
      }
      ctx.fillStyle = "#FF8A3D";
      ctx.beginPath();
      ctx.moveTo(cx + 17, py - 39 + bob);
      ctx.quadraticCurveTo(cx + 34, py - 34 + bob, cx + 17, py - 27 + bob);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.arc(cx + 8, py - 38 + bob, 3.4, 0, 6.29); ctx.fill();
      if (bubble) {
        bubble.life -= 0.006;
        if (bubble.life <= 0) bubble = null;
        else {
          var btx = Math.min(cx + 38, w - 108), bty = py - 84 + bob;
          ctx.globalAlpha = clamp(bubble.life, 0, 1);
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          roundRect(ctx, btx, bty, 96, 30, 10); ctx.fill();
          ctx.fillStyle = "#0b0d14"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(bubble.text, btx + 48, bty + 20);
          ctx.globalAlpha = 1;
        }
      }
      surprise = clamp(surprise - 0.05, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     24. 养兔子 —— 催产素 + 规律感官奖赏
     ======================================================= */
  function labRabbit(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var trust = 20, chews = 0, binkies = 0, jump = 0, chewT = 0;
    center.appendChild(btn("🥬 喂一把干草", "", function () {
      trust = clamp(trust + 12, 0, 100);
      chews += 8; chewT = performance.now() + 2200;
      if (Math.random() < 0.22 + trust / 380) { jump = 1; binkies++; }
      upd();
      setCaption(container, trust > 70 ? "从飞机耳到四脚朝天摊平——这份信任直接换来一整套催产素。" : "咔嚓咔嚓：规律重复的细微声响，是最省电的感官奖赏。");
    }));
    function upd() {
      read.set([
        { val: Math.round(trust) + "%", label: "信任/放松", kind: "good" },
        { val: chews, label: "咀嚼次数", kind: "cyan" },
        { val: binkies, label: "兔子跳", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var ground = h * 0.72;
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(w, ground); ctx.stroke();
      ctx.strokeStyle = "rgba(232,196,106,0.6)"; ctx.lineWidth = 2;
      for (var k = 0; k < 12; k++) {
        var hx = w * 0.62 + (k % 6) * 10, hy = ground - 4 - Math.floor(k / 6) * 5;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 8, hy - 4); ctx.stroke();
      }
      var cx = w * 0.4, cy = h * 0.5;
      var offY = jump > 0 ? -Math.sin((1 - jump) * Math.PI) * 52 : 0;
      var rot = jump > 0 ? Math.sin((1 - jump) * Math.PI * 2) * 0.3 : 0;
      ctx.save(); ctx.translate(cx, cy + offY); ctx.rotate(rot);
      ctx.fillStyle = "#F4F1EA"; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 16, 34, 30, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(32, 20, 9, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#F4F1EA";
      ctx.beginPath(); ctx.arc(-6, -16, 22, 0, 6.29); ctx.fill(); ctx.stroke();
      var spread = lerp(1.25, 0.16, trust / 100);
      [-1, 1].forEach(function (s) {
        ctx.save(); ctx.translate(-6 + s * 9, -32); ctx.rotate(s * spread + Math.sin(t / 700 + s) * 0.06);
        ctx.fillStyle = "#F4F1EA";
        ctx.beginPath(); ctx.ellipse(0, -20, 7, 22, 0, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#FFC2CF";
        ctx.beginPath(); ctx.ellipse(0, -20, 3.5, 15, 0, 0, 6.29); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = "#2b2018";
      ctx.beginPath(); ctx.arc(-14, -18, 3.4, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(2, -18, 3.4, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#FF6FA5";
      ctx.beginPath(); ctx.arc(-6, -10, 3.4, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#2b2018";
      roundRect(ctx, -13, -6, 14, 2 + (t < chewT ? Math.abs(Math.sin(t / 100)) * 3.5 : 0.8), 1); ctx.fill();
      ctx.restore();
      if (jump > 0) {
        jump = Math.max(0, jump - 0.025);
        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("兔子跳！", cx, cy - 70);
      }
      trust = clamp(trust - 0.015, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     25. 睫角守宫 —— 观察者型快乐 + 变比率强化
     ======================================================= */
  function labGecko(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var feeds = 0, hits = 0, misses = 0, shed = 40, sheds = 0;
    var phase = "idle", phaseT = 0, waitUntil = 0, cricketX = 0.86;
    center.appendChild(btn("🦗 投喂蟋蟀", "", function () {
      if (phase !== "idle") return;
      feeds++; cricketX = 0.86;
      phase = "wait"; waitUntil = performance.now() + rand(400, 1600);
      upd();
      setCaption(container, "它在暗处锁定目标……等待本身就是不确定性的一部分。");
    }));
    center.appendChild(btn("💧 喷一次水", "cyan", function () {
      shed = clamp(shed + rand(6, 22), 0, 100);
      if (shed >= 100) {
        sheds++; shed = 30;
        setCaption(container, "一张完整的皮！不确定的结果 + 长期的等待，正是教科书式的变比率强化。");
      } else {
        setCaption(container, "湿度上来，今晚更容易蜕得干净——温度、湿度、喂食节奏都由你掌控。");
      }
      upd();
    }));
    function upd() {
      var total = hits + misses;
      read.set([
        { val: feeds, label: "投喂次数", kind: "cyan" },
        { val: (total ? Math.round(hits / total * 100) : 0) + "%", label: "捕食成功率", kind: "good" },
        { val: Math.round(shed) + "%", label: "蜕皮完整度", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#141026"); g.addColorStop(1, "#07070f");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,229,255,0.15)";
      for (var k = 0; k < 14; k++) {
        ctx.beginPath();
        ctx.arc((k * 97) % Math.max(w - 6, 1) + 6, (k * 63 + t / 40) % h, 2.5, 0, 6.29);
        ctx.fill();
      }
      var branchY = h * 0.5;
      ctx.strokeStyle = "#5A4632"; ctx.lineWidth = 10; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, branchY); ctx.lineTo(w, branchY - 10); ctx.stroke();
      if (phase === "wait") {
        cricketX = lerp(cricketX, 0.62, 0.02);
        if (performance.now() >= waitUntil) { phase = "strike"; phaseT = 0; }
      } else if (phase === "strike") {
        phaseT += 0.09;
        if (phaseT >= 1) {
          if (Math.random() < 0.78) {
            hits++;
            setCaption(container, "一口吞下！不动声色半小时，攻击只用一瞬——静止与爆发的反差最上头。");
          } else {
            misses++;
            setCaption(container, "扑空了。是它失手还是位置不好？不确定，所以你明天还会再来一次。");
          }
          phase = "result"; phaseT = 0; upd();
        }
      } else if (phase === "result") {
        phaseT += 0.025;
        if (phaseT >= 1) { phase = "idle"; phaseT = 0; }
      }
      if (phase === "wait" || phase === "strike") {
        var cxx = cricketX * w, cyy = branchY - 16 + Math.sin(t / 90) * 3;
        ctx.fillStyle = "#7CFC00"; ctx.shadowColor = "#7CFC00"; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.ellipse(cxx, cyy, 9, 6, 0, 0, 6.29); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#7CFC00"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cxx - 8, cyy - 3); ctx.lineTo(cxx - 18, cyy - 10); ctx.stroke();
      }
      var lunge = phase === "strike" ? Math.sin(phaseT * Math.PI) * 26 : 0;
      ctx.save(); ctx.translate(w * 0.36 + lunge, branchY - 6);
      ctx.strokeStyle = "#A05A20"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-30, 6);
      ctx.quadraticCurveTo(-54, 6 + Math.sin(t / 400) * 6, -70, -8); ctx.stroke();
      ctx.fillStyle = "#B5651D"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 19, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#7A4413";
      for (var i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 11, -16); ctx.lineTo(i * 11 + 5, -25); ctx.lineTo(i * 11 + 10, -16);
        ctx.closePath(); ctx.fill();
      }
      [-1, 1].forEach(function (s) {
        ctx.strokeStyle = "#A05A20"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(s * 18, 12); ctx.lineTo(s * 26, 22); ctx.stroke();
        ctx.fillStyle = "#FFD23F";
        ctx.beginPath(); ctx.arc(s * 26, 22, 4, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = "#C57A2C";
      ctx.beginPath(); ctx.ellipse(30, -4, 20, 16, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFB020"; ctx.shadowColor = "#FFB020"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(38, -6, 7, 0, 6.29); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.ellipse(39, -6, 2.2, 5, 0, 0, 6.29); ctx.fill();
      if (phase === "wait" && Math.sin(t / 200) > 0.9) {
        ctx.strokeStyle = "#FF6FA5"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(48, -1); ctx.lineTo(56, 0); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(phase === "wait" ? "夜行 🌙 正在锁定…" : (phase === "strike" ? "捕食中！" : "静止观察中（它在悄悄压低你的皮质醇）"), 14, 22);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     26. 角蛙 —— 静止 + 爆发的变比率强化
     ======================================================= */
  function labPacmanfrog(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var idle = 0, swallows = 0, mouth = 0, control = 10;
    var phase = "idle", phaseT = 0, waitUntil = 0, worm = null;
    center.appendChild(btn("🐛 放一条虫", "", function () {
      if (phase !== "idle") return;
      control = clamp(control + 8, 0, 100);
      worm = { x: 0.78 };
      phase = "wait"; waitUntil = performance.now() + rand(500, 2200);
      setCaption(container, "它连眼都不眨。长时间无事发生、忽然来一下，才是角蛙的节奏。");
      upd();
    }));
    center.appendChild(btn("🪨 陪它一起发呆", "cyan", function () {
      idle += 15; control = clamp(control + 4, 0, 100);
      setCaption(container, "什么都不做也很爽：这种低波动的陪伴本身就是一次减压。");
      upd();
    }));
    function upd() {
      read.set([
        { val: Math.round(idle) + "s", label: "静止时长", kind: "cyan" },
        { val: swallows, label: "整只吞下", kind: "good" },
        { val: Math.round(control) + "%", label: "掌控感", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var ground = h * 0.66;
      ctx.fillStyle = "#3a2a1c"; ctx.fillRect(0, ground, w, h - ground);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (var k = 0; k < 40; k++) ctx.fillRect((k * 137) % w, ground + ((k * 53) % Math.max(h - ground - 2, 1)), 3, 2);
      if (phase === "idle") idle += 0.016;
      else if (phase === "wait") {
        idle += 0.005;
        if (worm) worm.x = lerp(worm.x, 0.63, 0.02);
        if (performance.now() >= waitUntil) { phase = "strike"; phaseT = 0; }
      } else if (phase === "strike") {
        phaseT += 0.07;
        mouth = Math.sin(clamp(phaseT, 0, 1) * Math.PI);
        if (phaseT >= 1) {
          swallows++; worm = null; mouth = 0;
          phase = "result"; phaseT = 0;
          setCaption(container, "整只下肚。圆滚滚的肚子 + 永远上扬的嘴角，是一次婴儿图式的偷袭。");
          upd();
        }
      } else if (phase === "result") {
        phaseT += 0.03;
        if (phaseT >= 1) phase = "idle";
      }
      var lean = phase === "strike" ? Math.sin(phaseT * Math.PI) * 22 : 0;
      ctx.save(); ctx.translate(w / 2 + lean, ground - 40);
      var bodyR = 46 + Math.sin(t / 700) * 1.5;
      ctx.fillStyle = "#6FA34A"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, bodyR, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(60,40,20,0.35)";
      ctx.beginPath(); ctx.ellipse(-14, -16, 14, 9, 0.4, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, 8, 11, 7, -0.3, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#4E7A33";
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s * 16, -34); ctx.lineTo(s * 22, -48); ctx.lineTo(s * 9, -40);
        ctx.closePath(); ctx.fill();
      });
      [-1, 1].forEach(function (s) {
        ctx.fillStyle = "#FFD23F";
        ctx.beginPath(); ctx.arc(s * 18, -30, 9, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#0b0d14";
        ctx.beginPath(); ctx.ellipse(s * 18, -30, 3, 5, 0, 0, 6.29); ctx.fill();
      });
      var mOpen = mouth * 30;
      ctx.fillStyle = "#40203a";
      ctx.beginPath();
      ctx.moveTo(-38, 8);
      ctx.quadraticCurveTo(0, 10 + mOpen, 38, 8);
      ctx.quadraticCurveTo(0, 22 + mOpen * 0.6, -38, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      if (worm) {
        ctx.strokeStyle = "#B57A3E"; ctx.fillStyle = "#D9A96F"; ctx.lineWidth = 2;
        for (var i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(worm.x * w - i * 6 + Math.sin(t / 120 + i) * 3, ground - 10, 5 - i * 0.6, 0, 6.29);
          ctx.fill(); ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(phase === "wait" ? "纹丝不动……它记得你看它的每一秒" : (phase === "strike" ? "爆发！" : "一块会呼吸的石头"), 14, 22);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     27. 玉米蛇 —— 安全冒险：肾上腺素 + 掌控感
     ======================================================= */
  function labCornsnake(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var adr = 12, control = 20, touch = 0, flick = 0, coil = 0;
    center.appendChild(btn("🖐️ 上手摸一下", "amber", function () {
      touch++; adr = clamp(adr + 20, 0, 100); control = clamp(control + 14, 0, 100);
      coil = 1; upd();
      setCaption(container, adr > 55 ? "轻微紧张 + 绝对安全：肾上腺素被大脑翻译成刺激，这就是「安全的冒险」。"
        : "鳞片比想象中更凉、更干燥也更顺滑——极其纯粹的感官奖赏。");
    }));
    center.appendChild(btn("👅 等它吐信", "cyan", function () {
      flick = 1; control = clamp(control + 6, 0, 100);
      setCaption(container, "分叉的舌头是在「闻」空气。你预判它下一步的动作，这份预判就是掌控感。");
      upd();
    }));
    function upd() {
      read.set([
        { val: Math.round(adr) + "%", label: "肾上腺素", kind: adr > 55 ? "bad" : "warn" },
        { val: Math.round(control) + "%", label: "掌控感", kind: "good" },
        { val: touch, label: "上手次数", kind: "cyan" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "#4a3a28"; ctx.lineWidth = 12; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.6); ctx.lineTo(w * 0.95, h * 0.52); ctx.stroke();
      var pts = [], n = 34;
      for (var i = 0; i <= n; i++) {
        pts.push({
          x: w * 0.1 + (w * 0.72) * (i / n),
          y: h * 0.58 - Math.sin(i / 5 + t / 500) * 22 - (i / n) * 6
        });
      }
      var grad = ctx.createLinearGradient(0, h * 0.4, 0, h * 0.75);
      grad.addColorStop(0, "#FF8A3D"); grad.addColorStop(1, "#C25A1E");
      ctx.strokeStyle = grad; ctx.lineWidth = 24; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(90,40,10,0.45)"; ctx.lineWidth = 2;
      for (var k = 0; k < pts.length; k += 2) {
        ctx.beginPath();
        ctx.moveTo(pts[k].x - 11, pts[k].y - 4); ctx.lineTo(pts[k].x + 11, pts[k].y - 4);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y + 9);
      for (var q = 1; q < pts.length; q++) ctx.lineTo(pts[q].x, pts[q].y + 9);
      ctx.stroke();
      var hd = pts[pts.length - 1];
      ctx.save(); ctx.translate(hd.x + 10, hd.y - 2);
      ctx.fillStyle = "#FF9A4D"; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 13, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.arc(4, -3, 3.2, 0, 6.29); ctx.fill();
      if (flick > 0) {
        flick -= 0.01;
        ctx.strokeStyle = "#FF2E88"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 2); ctx.lineTo(30, -1);
        ctx.moveTo(16, 2); ctx.lineTo(30, 5);
        ctx.stroke();
      }
      ctx.restore();
      if (coil > 0) {
        coil = Math.max(0, coil - 0.008);
        var ax = w * 0.36, ay = h * 0.42;
        ctx.strokeStyle = "rgba(0,229,255," + (coil * 0.7) + ")"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ax, ay, 26 + Math.sin(t / 200) * 2, 0, 6.29); ctx.stroke();
        ctx.fillStyle = "rgba(0,229,255," + (coil * 0.8) + ")";
        ctx.font = "12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("被缠绕的信任感", ax, ay - 34);
      }
      adr = clamp(adr - 0.06, 0, 100); control = clamp(control - 0.02, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     28. 蜜袋鼯 —— 依恋催产素 + 滑翔的期待奖励
     ======================================================= */
  function labSugarglider(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var flights = 0, bond = 20, totalM = 0, fly = null, hearts = [];
    center.appendChild(btn("🪂 让它起飞", "cyan", function () {
      if (fly) return;
      fly = { p: 0 }; flights++;
      bond = clamp(bond + 10, 0, 100);
      if (hearts.length < 6) hearts.push({ x: 0.6, y: 0.6, vy: -0.004, a: 1 });
      setCaption(container, "它展开翼膜、划出一道弧线精准降落到你身上——一次带轨迹的期待奖励。");
      upd();
    }));
    center.appendChild(btn("🫳 把手伸过去", "", function () {
      bond = clamp(bond + 8, 0, 100);
      setCaption(container, "白天它睡在你的衣兜里，夜里睁眼就认人：强烈的个体依恋会释放催产素。");
      upd();
    }));
    function upd() {
      read.set([
        { val: flights, label: "滑翔次数", kind: "cyan" },
        { val: Math.round(bond) + "%", label: "依恋值", kind: "good" },
        { val: totalM.toFixed(1) + "m", label: "累计滑翔", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#101a2e"); g.addColorStop(1, "#070b16");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var px0 = w * 0.14, py0 = h * 0.24, px1 = w * 0.72, py1 = h * 0.58;
      ctx.fillStyle = "#3A3F55";
      roundRect(ctx, px0 - 46, py0 + 12, 92, 12, 4); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("柜顶", px0, py0 + 6);
      ctx.fillStyle = "#2A2F40";
      ctx.beginPath(); ctx.ellipse(px1, py1 + 70, 46, 60, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(px1, py1 + 22, 18, 0, 6.29); ctx.fill();
      ctx.fillStyle = "rgba(0,229,255,0.5)";
      ctx.fillText("你", px1, py1 + 100);
      var gx = px0 + 40, gy = py0 + 6;
      if (fly) {
        fly.p += 0.011;
        if (fly.p >= 1) { fly = null; totalM += 1.4; upd(); }
        else {
          var p = fly.p;
          gx = lerp(px0 + 40, px1 - 6, p);
          gy = lerp(py0 + 6, py1 - 6, p) + Math.sin(p * Math.PI) * 34;
        }
      }
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(fly ? Math.sin(fly.p * Math.PI) * 0.4 : Math.sin(t / 400) * 0.08);
      var stretch = fly ? Math.sin(fly.p * Math.PI) * 0.6 + 0.4 : 0.12;
      ctx.fillStyle = "rgba(220,210,235,0.75)"; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6 - 30 * stretch, 6); ctx.lineTo(14, 10); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(6 + 30 * stretch, 6); ctx.lineTo(-14, 10); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#C9B79A";
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 11, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#A8946F"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-16, 2); ctx.quadraticCurveTo(-36, 4 + Math.sin(t / 300) * 6, -46, -6); ctx.stroke();
      ctx.fillStyle = "#3A3F55";
      ctx.beginPath(); ctx.arc(13, -3, 8, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.arc(15, -4, 2.4, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -4, 2.4, 0, 6.29); ctx.fill();
      ctx.restore();
      hearts.forEach(function (ht) { ht.y += ht.vy; ht.a -= 0.008; });
      hearts = hearts.filter(function (x) { return x.a > 0; });
      hearts.forEach(function (ht) {
        ctx.globalAlpha = clamp(ht.a, 0, 1); ctx.fillStyle = "#FF2E88";
        drawHeart(ctx, ht.x * w, ht.y * h, 10);
      });
      ctx.globalAlpha = 1;
      bond = clamp(bond - 0.012, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     29. 非洲迷你刺猬 —— 反差解锁的期待奖励
     ======================================================= */
  function labHedgehog(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var alertLevel = 0, relax = 0, coils = 0, done = 0;
    center.appendChild(btn("🤲 靠近一点点", "", function () {
      if (alertLevel < 90) coils++;
      alertLevel = 100; relax = 0; done = 0;
      upd();
      setCaption(container, "刺全部立起！从拒绝到接纳的过程，才是它给你的延迟满足版期待奖励。");
    }));
    function upd() {
      read.set([
        { val: Math.round(relax) + "%", label: "放松进度", kind: relax > 60 ? "good" : "" },
        { val: Math.round(alertLevel) + "%", label: "警惕度", kind: alertLevel > 60 ? "bad" : "cyan" },
        { val: coils, label: "炸球次数", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h * 0.48;
      alertLevel = clamp(alertLevel - 0.12, 0, 100);
      if (alertLevel < 45) {
        var before = Math.floor(relax / 10);
        relax = clamp(relax + 0.14, 0, 100);
        if (Math.floor(relax / 10) !== before) upd();
        if (relax >= 99 && !done) {
          done = 1;
          setCaption(container, "刺全部伏下、鼻尖探出来：圆滚滚的轮廓触发了婴儿图式，顺手把今天的压力带走。");
        }
      }
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(cx, cy + 40, 46, 8, 0, 0, 6.29); ctx.fill();
      var ball = alertLevel > 45;
      var r = lerp(38, 30, relax / 100);
      ctx.fillStyle = "#C9A87C"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, r + 6, r, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      var spikeLen = lerp(8, 26, alertLevel / 100);
      for (var i = 0; i < 26; i++) {
        var a = (i / 26) * Math.PI * 2 - Math.PI / 2;
        var rx = Math.cos(a) * r, ry = Math.sin(a) * r;
        if (ry < 0) {
          ctx.strokeStyle = i % 2 ? "#8A6A46" : "#5A4632";
          ctx.lineWidth = 2.4; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx + rx, cy + ry);
          ctx.lineTo(cx + rx * (1 + spikeLen / r * 0.42), cy + ry - spikeLen);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      if (!ball) {
        ctx.fillStyle = "#EBD9BB";
        ctx.beginPath(); ctx.ellipse(cx + 26, cy + 6, 18, 15, -0.2, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#0b0d14";
        ctx.beginPath(); ctx.arc(cx + 30, cy + 1, 2.6, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#FF6FA5";
        ctx.beginPath(); ctx.arc(cx + 42, cy + 8, 3.4, 0, 6.29); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
        for (var k = -1; k <= 1; k++) {
          ctx.beginPath(); ctx.moveTo(cx + 40, cy + 10); ctx.lineTo(cx + 52, cy + 10 + k * 6); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(relax > 80 ? "彻底放松 —— 最安静的减压正在进行" : "正在慢慢把鼻子凑出来…", cx, cy - 56);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("球形态：耐心等，别碰它", cx, cy - 56);
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     30. 捕鸟蛛 —— 良性自虐：恐惧的安全化
     ======================================================= */
  function drawLeg(ctx, x0, y0, ang, l1, l2, bend, ph) {
    var jx = x0 + Math.cos(ang) * l1, jy = y0 + Math.sin(ang) * l1;
    var a2 = ang + bend + Math.sin(ph) * 0.06;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(jx, jy);
    ctx.lineTo(jx + Math.cos(a2) * l2, jy + Math.sin(a2) * l2); ctx.stroke();
  }

  function labTarantula(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var adr = 15, control = 15, feeds = 0, molts = 0, pounce = 0, moltSkin = 0, hairs = [];
    center.appendChild(btn("🦗 投一只蟋蟀", "", function () {
      feeds++; adr = clamp(adr + 14, 0, 100); control = clamp(control + 10, 0, 100);
      pounce = 1;
      if (feeds % 3 === 0) { molts++; moltSkin = 1; }
      setCaption(container, feeds % 3 === 0 ? "它蜕壳了：旧壳留在原地，你又一次完整记录了这个过程。"
        : "你能预判它是踢毛还是扑食，这份预判就是掌控感——肾上腺素则把它翻译成兴奋。");
      upd();
    }));
    center.appendChild(btn("✋ 慢慢靠近", "amber", function () {
      adr = clamp(adr + 22, 0, 100); control = clamp(control + 8, 0, 100);
      for (var i = 0; i < 12; i++) hairs.push({ x: 0.5, y: 0.5, vx: rand(-0.02, 0.02), vy: rand(-0.02, 0), a: 1 });
      setCaption(container, "明知它几乎不动、毒性有限，本能的紧张却还在——良性自虐正是这么成立的。");
      upd();
    }));
    function upd() {
      read.set([
        { val: Math.round(adr) + "%", label: "肾上腺素", kind: adr > 60 ? "bad" : "warn" },
        { val: Math.round(control) + "%", label: "掌控感", kind: "good" },
        { val: molts, label: "蜕壳次数", kind: "cyan" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#2b2018"; ctx.fillRect(0, h * 0.7, w, h * 0.3);
      ctx.fillStyle = "#1a120c";
      ctx.beginPath(); ctx.ellipse(w * 0.16, h * 0.7, 36, 18, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("躲避穴", w * 0.16, h * 0.72);
      if (moltSkin > 0) {
        moltSkin = Math.max(0, moltSkin - 0.004);
        ctx.globalAlpha = clamp(moltSkin, 0, 1) * 0.6;
        ctx.fillStyle = "#8A6A46";
        ctx.beginPath(); ctx.ellipse(w * 0.74, h * 0.7 - 8, 22, 14, 0, 0, 6.29); ctx.fill();
        ctx.globalAlpha = 1;
      }
      var cx = w / 2, cy = h * 0.6;
      var leanFor = pounce > 0 ? Math.sin((1 - pounce) * Math.PI) * 14 : 0;
      ctx.strokeStyle = "#4a3320"; ctx.lineWidth = 5; ctx.lineCap = "round";
      for (var i = 0; i < 4; i++) {
        var side = i < 2 ? -1 : 1, idx = i % 2;
        drawLeg(ctx, cx + side * 8, cy + 2, (side < 0 ? Math.PI : 0) + (idx * 0.45 - 0.2) * side,
          22 + idx * 4, 26, (side < 0 ? 1 : -1) * 0.9, t / 700 + i);
      }
      ctx.save(); ctx.translate(cx + leanFor, cy);
      ctx.fillStyle = "#5A3A22"; ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(-22, 0, 26, 20, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(230,200,160,0.5)"; ctx.lineWidth = 1;
      for (var k = 0; k < 16; k++) {
        var ka = (k / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(-22 + Math.cos(ka) * 22, Math.sin(ka) * 17);
        ctx.lineTo(-22 + Math.cos(ka) * 26, Math.sin(ka) * 20);
        ctx.stroke();
      }
      ctx.fillStyle = "#6E4726";
      ctx.beginPath(); ctx.ellipse(6, 0, 18, 14, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.arc(12, -4, 2.6, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(4, -5, 2.6, 0, 6.29); ctx.fill();
      ctx.restore();
      hairs.forEach(function (hr) { hr.x += hr.vx; hr.y += hr.vy; hr.a -= 0.02; });
      hairs = hairs.filter(function (x) { return x.a > 0; });
      hairs.forEach(function (hr) {
        ctx.globalAlpha = clamp(hr.a, 0, 1); ctx.strokeStyle = "#E6C8A0"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(hr.x * w, hr.y * h); ctx.lineTo(hr.x * w + 6, hr.y * h + 4); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (pounce > 0) pounce = Math.max(0, pounce - 0.02);
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("极慢的节奏：它会几个小时一动不动，逼着你的呼吸一起放慢", w / 2, 22);
      adr = clamp(adr - 0.05, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     31. 寄居蟹 —— 换壳的随机性 + 收集欲
     ======================================================= */
  function drawShell(ctx, x, y, s, c, rot, ghost) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (ghost) ctx.globalAlpha = 0.45;
    ctx.fillStyle = c; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.8, 0, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var a = 0; a < Math.PI * 4; a += 0.3) {
      var rr = s * 0.12 * a / 2;
      var xx = Math.cos(a) * rr, yy = Math.sin(a) * rr * 0.8;
      if (a === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function labHermitcrab(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var swaps = 0, collect = 10, explore = 0;
    var crabX = 0.3, target = 0.3, shell = { size: 20, c: "#8A6A46" };
    var newShell = null, state = "wander", timer = 0, note = "它在缸里慢慢巡查……";
    var SHELLS = ["#FF8A3D", "#7C4DFF", "#00C2A8", "#FFD23F", "#FF6FA5"];
    center.appendChild(btn("🐚 放一个新壳", "", function () {
      if (newShell) return;
      newShell = { size: shell.size + rand(4, 9), c: SHELLS[Math.floor(rand(0, SHELLS.length))], x: 0.72 };
      target = 0.62; state = "approach"; note = "它发现了新壳，正在慢慢靠近……";
      upd();
      setCaption(container, "放下去之后它可能几天不动，也可能半夜就搬了家——完全的不可预测，标准的变比率强化。");
    }));
    function upd() {
      read.set([
        { val: swaps, label: "换新壳", kind: "good" },
        { val: Math.round(collect) + "%", label: "收集欲", kind: "warn" },
        { val: Math.round(explore) + "s", label: "探索用时", kind: "cyan" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#1a1208"); g.addColorStop(1, "#2b2018");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var ground = h * 0.66;
      ctx.fillStyle = "#3a2a1c"; ctx.fillRect(0, ground, w, h - ground);
      if (state === "approach") {
        explore += 0.016;
        crabX = lerp(crabX, target, 0.03);
        if (Math.abs(crabX - target) < 0.01) { state = "inspect"; timer = rand(0.6, 3.2); note = "正在用螯测量尺寸……"; }
      } else if (state === "inspect") {
        explore += 0.016; timer -= 0.016;
        if (timer <= 0) { state = "swap"; note = "搬家！"; }
      } else if (state === "swap") {
        crabX = lerp(crabX, 0.72, 0.05);
        if (Math.abs(crabX - 0.72) < 0.012) {
          shell = { size: newShell.size, c: newShell.c };
          newShell = null; swaps++;
          collect = clamp(collect + 18, 0, 100);
          state = "wander"; target = rand(0.2, 0.5); note = "住进去了，继续巡查……";
          upd();
          setCaption(container, "换新家了。想给它配一个更漂亮、更合适的壳——这件事一旦开始就停不下来。");
        }
      } else {
        crabX = lerp(crabX, target, 0.01);
        if (Math.abs(crabX - target) < 0.02) target = rand(0.15, 0.55);
      }
      drawShell(ctx, w * 0.2, ground - 14, 18, "#6E4B30", 0.2, true);
      if (newShell) drawShell(ctx, newShell.x * w, ground - newShell.size * 0.8 + 4, newShell.size, newShell.c, 0);
      var px = crabX * w, py = ground - 10;
      ctx.save(); ctx.translate(px, py); if (target < crabX) ctx.scale(-1, 1);
      drawShell(ctx, -6, -shell.size * 0.5, shell.size, shell.c, 0.15);
      ctx.strokeStyle = "#C25A1E"; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-2 + i * 7, 4);
        ctx.lineTo(2 + i * 7, 14 + Math.sin(t / 160) * 1.2);
        ctx.stroke();
      }
      ctx.fillStyle = "#D96A28";
      ctx.beginPath(); ctx.ellipse(8, 0, 14, 10, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#C25A1E"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(20, -2); ctx.lineTo(30, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, 4); ctx.lineTo(30, 2); ctx.stroke();
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.arc(14, -3, 2.2, 0, 6.29); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(note, w / 2, 22);
      collect = clamp(collect - 0.01, 0, 100);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     32. 六角恐龙 —— 婴儿图式满格 + 极低波动减压
     ======================================================= */
  function labAxolotl(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var len = 8, satiety = 20, baby = 60, gulp = 0, bubbles = [], shrimp = null, floatY = 0;
    center.appendChild(btn("🦐 喂一只虾", "", function () {
      satiety = clamp(satiety + 22, 0, 100);
      baby = clamp(baby + randomBaby(), 0, 100);
      gulp = 1; shrimp = { x: 0.78, y: 0.5 };
      upd();
      setCaption(container, "圆脑袋 + 三对外鳃 + 天生上扬的嘴角：婴儿图式拉满，养育本能被直接触发。");
    }));
    function randomBaby() { return 3; }
    center.appendChild(btn("👀 静静看它游", "cyan", function () {
      baby = clamp(baby + 2, 0, 100);
      setCaption(container, "它终生保持幼态、不会真的长大——你永远不用面对「它变了」这件事，极低波动的减压。");
      upd();
    }));
    function upd() {
      read.set([
        { val: len.toFixed(1) + "cm", label: "体长", kind: "cyan" },
        { val: Math.round(satiety) + "%", label: "满足度", kind: "good" },
        { val: Math.round(baby) + "%", label: "幼态指数", kind: "warn" }
      ]);
    }
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0e2f42"); g.addColorStop(1, "#061620");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (Math.random() < 0.12) bubbles.push({ x: rand(0.1, 0.9), y: 0.72, r: rand(2, 5), vy: rand(0.0005, 0.0014) });
      bubbles.forEach(function (b) {
        b.y -= b.vy;
        ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x * w, b.y * h, b.r, 0, 6.29); ctx.stroke();
      });
      bubbles = bubbles.filter(function (b) { return b.y > 0.03; });
      if (shrimp) {
        shrimp.x = lerp(shrimp.x, 0.62, 0.03);
        if (shrimp.x < 0.63) { shrimp = null; len += 0.2; upd(); }
        else {
          ctx.fillStyle = "#FFB8A0";
          ctx.beginPath();
          ctx.ellipse(shrimp.x * w, shrimp.y * h, 8, 5, 0, 0, 6.29); ctx.fill();
        }
      }
      floatY = Math.sin(t / 1400) * 6;
      var cx = w / 2, cy = h * 0.46 + floatY;
      ctx.save(); ctx.translate(cx, cy);
      // 身体（波动）
      ctx.strokeStyle = "rgba(255,180,200,0.9)"; ctx.lineWidth = 26; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      for (var i = 0; i <= 26; i++) {
        var p = i / 26;
        var bx = lerp(-58, 42, p);
        var by = Math.sin(p * 3.4 + t / 420) * (2 + p * 10);
        if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
      }
      ctx.stroke();
      // 尾鳍
      ctx.fillStyle = "rgba(255,200,215,0.55)";
      ctx.beginPath();
      ctx.moveTo(-58, 0);
      ctx.quadraticCurveTo(-84, -18, -96, -2);
      ctx.quadraticCurveTo(-84, 18, -58, 0);
      ctx.fill();
      // 四肢
      ctx.strokeStyle = "#FF9FC0"; ctx.lineWidth = 5; ctx.lineCap = "round";
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(6, 10 * s); ctx.lineTo(2, 22 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-28, 10 * s); ctx.lineTo(-32, 22 * s); ctx.stroke();
      });
      // 头
      var headR = 26 + (gulp > 0 ? Math.sin(gulp * Math.PI) * 4 : 0);
      ctx.fillStyle = "#FFC2D6"; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(46, 0, headR, 0, 6.29); ctx.fill(); ctx.stroke();
      // 外鳃（三对）
      [-1, 1].forEach(function (s) {
        for (var gi = 0; gi < 3; gi++) {
          var ax = 40 - gi * 12, ay = s * 22;
          ctx.strokeStyle = "#FF6FA5"; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(ax - 4, ay + s * 14, ax + 2, ay + s * 24);
          ctx.stroke();
          ctx.fillStyle = "#FF9FC0";
          ctx.beginPath(); ctx.arc(ax - 3 + gi * 2, ay + s * 18, 3.4, 0, 6.29); ctx.fill();
        }
      });
      // 眼睛 + 微笑
      ctx.save(); ctx.translate(46, 0);
      ctx.scale(1, 1);
      ctx.fillStyle = "#0b0d14";
      ctx.beginPath(); ctx.arc(10, -8, 3, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(10, 8, 3, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#0b0d14"; ctx.lineWidth = 2;
      var smile = gulp > 0 ? 4 : 8;
      ctx.beginPath();
      ctx.moveTo(18, -6); ctx.quadraticCurveTo(24, 0, 18, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20 - smile * 0.2, 2); ctx.lineTo(20 + smile * 0.6, 2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      if (gulp > 0) gulp = Math.max(0, gulp - 0.02);
      satiety = clamp(satiety - 0.02, 0, 100);
      baby = clamp(baby - 0.008, 0, 100);
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
    yoga: { init: labYoga },

    /* 常见宠物 */
    dog: { init: labDog },
    aquarium: { init: labAquarium },
    hamster: { init: labHamster },
    parrot: { init: labParrot },
    rabbit: { init: labRabbit },

    /* 异宠 */
    gecko: { init: labGecko },
    pacmanfrog: { init: labPacmanfrog },
    cornsnake: { init: labCornsnake },
    sugarglider: { init: labSugarglider },
    hedgehog: { init: labHedgehog },
    tarantula: { init: labTarantula },
    hermitcrab: { init: labHermitcrab },
    axolotl: { init: labAxolotl }
  };
})();
