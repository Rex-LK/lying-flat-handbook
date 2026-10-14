/* =========================================================
   半日闲 · 互动小实验注册表
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

  // 控件层（按钮 / 读数）统一放到实验框下方、「怎么玩」上方
  function insertBelowStage(container, node) {
    var host = container.parentElement || container;
    var cap = host.querySelector(".lab-caption");
    if (cap) host.insertBefore(node, cap); else host.appendChild(node);
    return node;
  }
  function makeCenter(container) {
    var c = el("div", "lab-center");
    insertBelowStage(container, c);
    return c;
  }
  function makeReadout(container) {
    var box = el("div", "lab-readout");
    insertBelowStage(container, box);
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
  /* ---------- 轻量音效（Web Audio 合成，无需素材） ---------- */
  var soundOn = true, _ac = null;
  function audioCtx() {
    if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _ac = null; } }
    if (_ac && _ac.state === "suspended") _ac.resume();
    return _ac;
  }
  function beep(freq, dur, type, vol, when) {
    if (!soundOn) return;
    var ac = audioCtx(); if (!ac) return;
    var t0 = ac.currentTime + (when || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol || 0.07, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function hashText(s) { var h = 0; for (var i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function sfxClick(seed) {
    var base = 380 + (hashText(seed || "") % 9) * 26; // 380~598Hz，按文案分布
    beep(base, 0.06, "triangle", 0.05);
    beep(base * 1.5, 0.05, "sine", 0.03, 0.004);
  }
  function sfxPet() { beep(170, 0.26, "sine", 0.09); beep(230, 0.22, "sine", 0.05, 0.02); }
  function sfxFeed() { beep(520, 0.07, "square", 0.05); beep(700, 0.07, "square", 0.05, 0.07); }
  function sfxToy() { beep(320, 0.1, "sine", 0.07); beep(620, 0.09, "sine", 0.05, 0.05); }
  function sfxFrisbee() { beep(240, 0.2, "sawtooth", 0.05); }
  (function bindSoundToggle() {
    var sb = document.getElementById("lab-sound");
    if (!sb) return;
    sb.addEventListener("click", function () {
      soundOn = !soundOn;
      sb.textContent = soundOn ? "🔊" : "🔇";
      if (soundOn) audioCtx();
    });
  })();

  function btn(label, cls, onClick) {
    var b = el("button", "lab-btn" + (cls ? " " + cls : ""), label);
    b.addEventListener("click", function () { sfxClick(label); if (onClick) onClick(); });
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
    var oxy = 0, mood = 0, full = 0, play = 0;
    var lastPet = -9999, lastFeed = -9999, lastToy = -9999;
    var ripples = [], hearts = [], eats = [], blink = 1, blinkT = 0;
    var toy = { active: false, x: 0.5, y: 0.45, vx: 0.003, vy: 0, life: 0, spin: 0 };
    function upd() {
      read.set([
        { val: Math.round(oxy) + "%", label: "催产素", kind: "good" },
        { val: Math.round(mood) + "%", label: "猫的心情", kind: "cyan" },
        { val: Math.round(full) + "%", label: "饱腹度", kind: "warn" },
        { val: Math.round(play) + "%", label: "玩耍欲", kind: "amber" }
      ]);
    }
    function pet() {
      oxy = clamp(oxy + 12, 0, 100); mood = clamp(mood + 9, 0, 100); lastPet = performance.now();
      ripples.push({ r: 10, a: 1 });
      if (mood > 60 && hearts.length < 8) hearts.push({ x: rand(0.3, 0.7), y: 0.42, vy: -0.004, a: 1 });
      sfxPet();
      upd();
      setCaption(container, mood > 80 ? "呼噜呼噜～催产素拉满，它已经把你当同类了。" : "指尖绒毛 + 呼噜 ASMR，依恋的化学物质正在分泌。");
    }
    function feed() {
      full = clamp(full + 24, 0, 100); mood = clamp(mood + 4, 0, 100); lastFeed = performance.now();
      for (var i = 0; i < 6; i++) eats.push({ x: rand(0.44, 0.56), y: 0.82, vy: -0.002, a: 1 });
      sfxFeed();
      upd();
      setCaption(container, full > 85 ? "碗见底了，它满意地舔了舔嘴——被投喂的安全感也是奖赏。" : "闻到猫粮味了，它凑过来小口小口地吃。");
    }
    function toyPlay() {
      play = clamp(play + 20, 0, 100); mood = clamp(mood + 7, 0, 100); lastToy = performance.now();
      toy.active = true; toy.life = 1; toy.x = rand(0.2, 0.8); toy.y = rand(0.3, 0.55);
      toy.vx = (Math.random() < 0.5 ? -1 : 1) * rand(0.002, 0.005); toy.vy = 0;
      sfxToy();
      upd();
      setCaption(container, "毛线球滚开了！它压低身子、尾巴尖抖啊抖，狩猎本能上线。");
    }
    center.appendChild(btn("🖐️ 抚摸", "cyan", pet));
    center.appendChild(btn("🍖 喂食", "amber", feed));
    center.appendChild(btn("🧶 玩具", "pink", toyPlay));
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h, cx = w / 2, cy = h * 0.40;
      ctx.clearRect(0, 0, w, h);
      var petP = clamp(1 - (t - lastPet) / 1300, 0, 1);
      var feedP = clamp(1 - (t - lastFeed) / 1100, 0, 1);
      var toyP = clamp(1 - (t - lastToy) / 1600, 0, 1);
      // 毛线球
      if (toy.active) {
        toy.x += toy.vx; toy.y += toy.vy; toy.vy += 0.00018; toy.spin += 0.15;
        if (toy.y > 0.72) { toy.y = 0.72; toy.vy *= -0.5; }
        if (toy.x < 0.1 || toy.x > 0.9) toy.vx *= -1;
        toy.life -= 0.004; if (toy.life <= 0) toy.active = false;
        ctx.save(); ctx.translate(toy.x * w, toy.y * h); ctx.rotate(toy.spin);
        ctx.fillStyle = "#FF6FA5"; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.29); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-5, -4, 4, 0, 6.29); ctx.arc(4, 3, 4, 0, 6.29); ctx.stroke();
        ctx.restore();
      }
      // 食盆
      if (feedP > 0.02 || full > 0) {
        ctx.fillStyle = "#5A6178"; ctx.beginPath(); ctx.ellipse(cx, h * 0.84, 34, 12, 0, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#3A3F55"; ctx.beginPath(); ctx.ellipse(cx, h * 0.83, 30, 9, 0, 0, 6.29); ctx.fill();
        if (full > 4) { ctx.fillStyle = "#FFB020"; for (var k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - 18 + k * 9, h * 0.82, 3, 0, 6.29); ctx.fill(); } }
      }
      eats.forEach(function (e) { e.y += e.vy; e.a -= 0.02; }); eats = eats.filter(function (e) { return e.a > 0; });
      eats.forEach(function (e) { ctx.globalAlpha = clamp(e.a, 0, 1); ctx.fillStyle = "#FFB020"; ctx.beginPath(); ctx.arc(e.x * w, e.y * h, 2.5, 0, 6.29); ctx.fill(); }); ctx.globalAlpha = 1;
      // 眨眼
      blinkT++; if (blinkT > 160) { blink = 0; if (blinkT > 175) { blink = 1; blinkT = 0; } }
      var lean = feedP * 18, tilt = toyP * (toy.x < 0.5 ? -0.18 : 0.18);
      var breathe = 1 + petP * Math.sin(t / 40) * 0.04;
      ctx.save(); ctx.translate(cx, cy + lean);
      // 尾巴
      ctx.save(); ctx.translate(-34, 30); ctx.rotate(Math.sin(t / (play > 30 ? 55 : 95)) * (0.3 + play / 200) - 0.4);
      ctx.strokeStyle = "#3A3F55"; ctx.lineWidth = 9; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-22, -6, -30, -22); ctx.stroke(); ctx.restore();
      // 身体
      ctx.fillStyle = "#3A3F55"; ctx.beginPath(); ctx.ellipse(0, 34, 30, 26, 0, 0, 6.29); ctx.fill();
      // 头
      ctx.save(); ctx.rotate(tilt); ctx.scale(breathe, breathe);
      ctx.fillStyle = "#3A3F55"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 38, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-32, -20); ctx.lineTo(-13, -42); ctx.lineTo(-5, -22); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(32, -20); ctx.lineTo(13, -42); ctx.lineTo(5, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#00E5A0"; ctx.shadowColor = "#00E5A0"; ctx.shadowBlur = 12;
      if (petP > 0.25 || mood > 80) {
        ctx.shadowBlur = 0; ctx.strokeStyle = "#00E5A0"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(-13, -3, 6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        ctx.beginPath(); ctx.arc(13, -3, 6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      } else if (blink < 0.5) {
        ctx.shadowBlur = 0; ctx.strokeStyle = "#00E5A0"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-17, -3); ctx.lineTo(-9, -3); ctx.moveTo(9, -3); ctx.lineTo(17, -3); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(-13, -4, 5, 7, 0, 0, 6.29); ctx.fill();
        ctx.beginPath(); ctx.ellipse(13, -4, 5, 7, 0, 0, 6.29); ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FF2E88"; ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-5, 1); ctx.lineTo(5, 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, 6); ctx.lineTo(-26, 2); ctx.moveTo(-4, 9); ctx.lineTo(-26, 12);
      ctx.moveTo(4, 6); ctx.lineTo(26, 2); ctx.moveTo(4, 9); ctx.lineTo(26, 12); ctx.stroke();
      ctx.restore();
      ctx.restore();
      // 呼噜波纹
      ripples.forEach(function (rp) { rp.r += 1.6; rp.a -= 0.02; }); ripples = ripples.filter(function (r) { return r.a > 0; });
      ripples.forEach(function (rp) {
        ctx.globalAlpha = clamp(rp.a, 0, 1) * 0.5; ctx.strokeStyle = "#00E5A0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy + lean, rp.r, 0, 6.29); ctx.stroke();
      }); ctx.globalAlpha = 1;
      // 爱心
      hearts.forEach(function (ht) { ht.y += ht.vy; ht.a -= 0.008; }); hearts = hearts.filter(function (x) { return x.a > 0; });
      hearts.forEach(function (ht) {
        ctx.globalAlpha = clamp(ht.a, 0, 1); ctx.fillStyle = "#FF2E88";
        drawHeart(ctx, ht.x * w, ht.y * h, 10);
      }); ctx.globalAlpha = 1;
      oxy = clamp(oxy - 0.03, 0, 100); mood = clamp(mood - 0.02, 0, 100); full = clamp(full - 0.05, 0, 100); play = clamp(play - 0.04, 0, 100);
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
    var oxy = 25, calm = 20, full = 0, play = 0, pets = 0, hearts = [];
    var lastPet = -9999, lastFeed = -9999, lastToy = -9999;
    var ball = { active: false, x: 0.5, y: 0.66, vx: 0.004, vy: 0, life: 0 };
    function upd() {
      read.set([
        { val: Math.round(oxy) + "%", label: "催产素", kind: "good" },
        { val: Math.round(calm) + "%", label: "减压/副交感", kind: "cyan" },
        { val: Math.round(full) + "%", label: "饱腹度", kind: "warn" },
        { val: pets, label: "抚摸次数", kind: "amber" }
      ]);
    }
    function pet() {
      pets++; oxy = clamp(oxy + 14, 0, 100); calm = clamp(calm + 10, 0, 100); lastPet = performance.now();
      if (oxy > 65 && hearts.length < 6) hearts.push({ x: rand(0.3, 0.7), y: 0.32, vy: -0.004, a: 1 });
      sfxPet();
      upd();
      setCaption(container, oxy > 80 ? "催产素拉满：它把攒了一整天的热情全砸给你了。" : "掌心下的体温 + 停不下来的尾巴，皮质醇正在下降，这才是真正的减压。");
    }
    function feed() {
      full = clamp(full + 24, 0, 100); oxy = clamp(oxy + 4, 0, 100); lastFeed = performance.now();
      sfxFeed();
      upd();
      setCaption(container, full > 85 ? "狗碗空了，它满足地打了个嗝——被投喂的安全感也是奖赏。" : "闻到肉味了，它凑过来吧唧吧唧地吃，尾巴摇成螺旋桨。");
    }
    function toyPlay() {
      play = clamp(play + 22, 0, 100); oxy = clamp(oxy + 6, 0, 100); lastToy = performance.now();
      ball.active = true; ball.life = 1; ball.x = rand(0.15, 0.85); ball.y = 0.66;
      ball.vx = (Math.random() < 0.5 ? -1 : 1) * rand(0.003, 0.006); ball.vy = 0;
      sfxFrisbee();
      upd();
      setCaption(container, "飞盘抛出去了！它弓着背、耳朵竖起，眼睛死死盯着目标。");
    }
    center.appendChild(btn("🖐️ 抚摸", "cyan", pet));
    center.appendChild(btn("🦴 喂食", "amber", feed));
    center.appendChild(btn("🥏 玩具", "pink", toyPlay));
    upd();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h, cx = w / 2, cy = h * 0.38;
      ctx.clearRect(0, 0, w, h);
      var petP = clamp(1 - (t - lastPet) / 1300, 0, 1);
      var feedP = clamp(1 - (t - lastFeed) / 1100, 0, 1);
      var toyP = clamp(1 - (t - lastToy) / 1600, 0, 1);
      var wag = (play > 30 || petP > 0.3) ? 0.55 : 0.35;
      // 飞盘
      if (ball.active) {
        ball.x += ball.vx; ball.y += ball.vy; ball.vy += 0.00022;
        if (ball.y > 0.74) { ball.y = 0.74; ball.vy *= -0.5; }
        if (ball.x < 0.08 || ball.x > 0.92) ball.vx *= -1;
        ball.life -= 0.004; if (ball.life <= 0) ball.active = false;
        ctx.save(); ctx.translate(ball.x * w, ball.y * h);
        ctx.fillStyle = "#FFD23F"; ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, 6.29); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, 6.29); ctx.stroke();
        ctx.restore();
      }
      // 食盆
      if (feedP > 0.02 || full > 0) {
        ctx.fillStyle = "#5A6178"; ctx.beginPath(); ctx.ellipse(cx, h * 0.86, 38, 13, 0, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#3A3F55"; ctx.beginPath(); ctx.ellipse(cx, h * 0.85, 33, 10, 0, 0, 6.29); ctx.fill();
        if (full > 4) { ctx.fillStyle = "#FFB020"; for (var k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - 20 + k * 10, h * 0.84, 3.2, 0, 6.29); ctx.fill(); } }
      }
      // 尾巴
      ctx.save(); ctx.translate(cx + 46, cy + 44); ctx.rotate(Math.sin(t / 60) * wag - 0.5);
      ctx.strokeStyle = "#8A5A2B"; ctx.lineWidth = 9; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -12, 32, -26); ctx.stroke(); ctx.restore();
      // 身体
      ctx.fillStyle = "#C98A4B"; ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 46, 44, 34, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      [-1, 1].forEach(function (s) { ctx.fillStyle = "#B57A3E"; roundRect(ctx, cx + s * 24 - 9, cy + 64, 18, 26, 8); ctx.fill(); });
      var bob = Math.sin(t / 320) * 2 + feedP * 6;
      var tilt = toyP * (ball.x < 0.5 ? -0.12 : 0.12);
      ctx.save(); ctx.translate(cx, cy + bob); ctx.rotate(tilt);
      ctx.fillStyle = "#C98A4B";
      ctx.beginPath(); ctx.ellipse(0, 0, 44, 40, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      [-1, 1].forEach(function (s) { ctx.fillStyle = "#8A5A2B"; ctx.beginPath(); ctx.ellipse(s * 42, 10, 13, 30, s * 0.22, 0, 0, 6.29); ctx.fill(); });
      var happy = oxy > 55 || toyP > 0.3;
      [-1, 1].forEach(function (s) {
        var ex = s * 16, ey = -6;
        if (happy) {
          ctx.strokeStyle = "#1b1108"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ex, ey + 3, 6, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
        } else {
          ctx.fillStyle = "#1b1108"; ctx.beginPath(); ctx.ellipse(ex, ey, 6, 7, 0, 0, 6.29); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex + s * 2, ey - 2, 2, 0, 6.29); ctx.fill();
        }
      });
      ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.ellipse(0, 14, 8, 6, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(-8, 27); ctx.moveTo(0, 20); ctx.lineTo(8, 27); ctx.stroke();
      if (happy) { ctx.fillStyle = "#FF6FA5"; roundRect(ctx, -7, 25, 14, 12 + Math.sin(t / 180) * 2, 6); ctx.fill(); }
      if (petP > 0.3 || toyP > 0.3) {
        var g = clamp(petP > toyP ? petP : toyP, 0, 1);
        ctx.strokeStyle = "rgba(255,46,136," + g * 0.5 + ")"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 54, 0, 6.29); ctx.stroke();
      }
      ctx.restore();
      hearts.forEach(function (ht) { ht.y += ht.vy; ht.a -= 0.008; }); hearts = hearts.filter(function (x) { return x.a > 0; });
      hearts.forEach(function (ht) {
        ctx.globalAlpha = clamp(ht.a, 0, 1); ctx.fillStyle = "#FF2E88";
        drawHeart(ctx, ht.x * w, ht.y * h, 10);
      }); ctx.globalAlpha = 1;
      oxy = clamp(oxy - 0.035, 0, 100); calm = clamp(calm - 0.02, 0, 100); full = clamp(full - 0.05, 0, 100); play = clamp(play - 0.04, 0, 100);
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

  /* =======================================================
     23. 社交桌游 —— 狼人杀 / 剧本杀 / 麻将 / 扑克
     ======================================================= */
  function labWerewolf(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var bRole = btn("🃏 发身份", "");
    var bVote = btn("🌙 天黑投票", "cyan");
    center.appendChild(bRole); center.appendChild(bVote);
    var roles = [
      { name: "狼人", emoji: "🐺" }, { name: "预言家", emoji: "🔮" },
      { name: "女巫", emoji: "🧪" }, { name: "平民", emoji: "🧑" }
    ];
    var N = 6, myRole = null, day = 0, out = [], ended = false, verdict = "";
    bRole.addEventListener("click", function () {
      myRole = roles[Math.floor(Math.random() * roles.length)];
      out = []; day = 1; ended = false; verdict = "";
      setCaption(container, "身份已发：你是「" + myRole.name + "」。不到天亮，没人知道谁在撒谎——这就是变比率强化的社交版。");
      read.set([
        { val: day, label: "第几天" },
        { val: myRole.name, label: "你的身份", kind: "cyan" },
        { val: 0, label: "已放逐" }
      ]);
    });
    bVote.addEventListener("click", function () {
      if (!myRole) { setCaption(container, "先点「发身份」拿到你的角色。"); return; }
      if (ended) { setCaption(container, "本局已结束：" + verdict + " 再点「发身份」开新局。"); return; }
      var pool = [];
      for (var i = 0; i < N; i++) if (out.indexOf(i) < 0) pool.push(i);
      out.push(pool[Math.floor(Math.random() * pool.length)]); day++;
      var win = Math.random() < 0.34;
      if (win || day >= 6) {
        ended = true;
        verdict = win ? (myRole.name === "狼人" ? "狼人屠城，你赢了 🐺" : "好人放逐真狼，你赢了 🎉") : "平局收场，意犹未尽。";
        setCaption(container, verdict + " 社交博弈的多巴胺，就藏在「不敢确定」的那几晚。");
      } else {
        setCaption(container, "第 " + day + " 天，又放逐了一人。真凶还在装好人，期待奖励持续挂账。");
      }
      read.set([
        { val: day, label: "第几天" },
        { val: myRole.name, label: "你的身份", kind: "cyan" },
        { val: out.length, label: "已放逐" }
      ]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0a1024"); g.addColorStop(1, "#141a33");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#E9E6FF"; ctx.shadowColor = "#9C8CFF"; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(w * 0.8, h * 0.22, 16, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
      var gap = w / (N + 1);
      for (var i = 0; i < N; i++) {
        var x = gap * (i + 1), y = h * 0.6, dead = out.indexOf(i) >= 0;
        ctx.globalAlpha = dead ? 0.28 : 1;
        ctx.font = "30px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(dead ? "💀" : "🧑", x, y);
        if (dead) { ctx.strokeStyle = "rgba(255,77,109,0.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, y - 22); ctx.lineTo(x + 14, y - 2); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(myRole ? ("你是 " + myRole.emoji + " " + myRole.name) : "点「发身份」开局", w / 2, h * 0.32);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labJubensha(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var bSearch = btn("🔍 搜证", "");
    var bAccuse = btn("🎯 指认凶手", "cyan");
    center.appendChild(bSearch); center.appendChild(bAccuse);
    var pool = [
      { emoji: "🔪", text: "凶器" }, { emoji: "📜", text: "遗书" }, { emoji: "🕐", text: "时间线" },
      { emoji: "💊", text: "毒药" }, { emoji: "👁", text: "目击者" }, { emoji: "🧥", text: "外套纤维" }
    ];
    var found = [], solved = false;
    bSearch.addEventListener("click", function () {
      if (solved) { setCaption(container, "真相已破，点「发身份」重开一局。"); return; }
      if (found.length >= pool.length) { setCaption(container, "线索已搜尽，该去投票指认了。"); return; }
      var left = pool.filter(function (c) { return found.indexOf(c.text) < 0; });
      var c = left[Math.floor(Math.random() * left.length)];
      found.push(c.text);
      setCaption(container, "搜到【" + c.emoji + c.text + "】。线索碎片越多，解谜的多巴胺越满——收集欲正在喂养你。");
      read.set([
        { val: found.length + "/" + pool.length, label: "线索" },
        { val: solved ? "已破案" : "未破案", label: "状态", kind: solved ? "good" : "" }
      ]);
    });
    bAccuse.addEventListener("click", function () {
      if (solved) return;
      if (found.length < 3) { setCaption(container, "线索不足（至少 3 条），先去搜证。"); return; }
      var hit = Math.random() < (found.length / pool.length) * 0.9 + 0.1;
      if (hit) { solved = true; setCaption(container, "指认正确！逻辑闭环的那一刻，解谜型多巴胺直接拉满 🎉"); }
      else { setCaption(container, "指认错误，真凶在笑。再搜几条线索，期待奖励还在挂账。"); }
      read.set([
        { val: found.length + "/" + pool.length, label: "线索" },
        { val: solved ? "已破案" : "未破案", label: "状态", kind: solved ? "good" : "" }
      ]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, "#1a1430"); g.addColorStop(1, "#0a0d18");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var n = pool.length, gap = w / (n + 1);
      for (var i = 0; i < n; i++) {
        var x = gap * (i + 1), y = h * 0.42, got = found.indexOf(pool[i].text) >= 0;
        ctx.globalAlpha = got ? 1 : 0.22;
        ctx.fillStyle = got ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)";
        roundRect(ctx, x - 18, y - 22, 36, 44, 8); ctx.fill();
        ctx.fillStyle = got ? "#fff" : "rgba(255,255,255,0.4)";
        ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(pool[i].emoji, x, y);
      }
      ctx.globalAlpha = 1; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = solved ? "#00E5A0" : "rgba(255,255,255,0.85)";
      ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(solved ? "🎉 真相大白" : "搜证拼图，越凑越上头", w / 2, h * 0.82);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labMahjong(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🀄 摸牌", "cyan");
    center.appendChild(b);
    var bAgain = btn("🔁 再来一局", "");
    bAgain.style.display = "none";
    center.appendChild(bAgain);
    // 麻将牌面：只保留万/条/筒 1-9 三种花色，每次随机抽，避免一直同一种牌
    var TILES = ["🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
                 "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘",
                 "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"];
    function rndTile() { return TILES[Math.floor(Math.random() * TILES.length)]; }
    var hand = 0, handTiles = [], wins = 0, listening = false, glow = 0, settled = false, lastWin = false, resultText = "";
    function refresh() {
      read.set([
        { val: hand, label: "手牌数" },
        { val: wins, label: "胡牌", kind: wins ? "good" : "" },
        { val: settled ? (lastWin ? "胡了" : "没胡") : (listening ? "听牌" : "—"), label: "状态", kind: settled ? (lastWin ? "good" : "") : (listening ? "cyan" : "") }
      ]);
    }
    b.addEventListener("click", function () {
      if (settled) return;
      if (hand >= 13) {
        // 摸到第 14 张：判定胡牌，然后「停住」定格，等用户点「再来一局」才重开
        handTiles.push(rndTile()); hand = 14; listening = false; settled = true;
        lastWin = Math.random() < 0.32;
        if (lastWin) {
          wins++; glow = 1; resultText = "🀄 胡了！点「再来一局」继续";
          setCaption(container, "胡了！🀄 推倒长城的脆响 + 全桌的「哇」，社交与成就一起点燃。点「再来一局」继续。");
        } else {
          resultText = "就差这一张……点「再来一局」";
          setCaption(container, "就差这一张没胡。近因效应让人更想再来一局——点「再来一局」继续。");
        }
        b.style.display = "none"; bAgain.style.display = "";
      } else {
        handTiles.push(rndTile()); hand++;
        if (hand === 13) { listening = true; setCaption(container, "听牌了！🀄 就等那一张——变比率强化的最高潮。"); }
        else setCaption(container, "摸牌如开奖，每一次都是随机奖励的期待。");
      }
      refresh();
    });
    bAgain.addEventListener("click", function () {
      hand = 0; handTiles = []; listening = false; settled = false; lastWin = false; glow = 0; resultText = "";
      b.style.display = ""; bAgain.style.display = "none";
      setCaption(container, "新的一局，重新摸牌——每一次都是随机奖励的期待。");
      refresh();
    });
    refresh();
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0c1a14"); g.addColorStop(1, "#08110d");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      glow = Math.max(0, glow - 0.03);
      var total = 14, cw = 26, gp = 4, startX = w / 2 - (total * (cw + gp)) / 2 + cw / 2;
      for (var i = 0; i < total; i++) {
        var x = startX + i * (cw + gp), y = h * 0.5, filled = i < hand;
        if (filled) {
          ctx.fillStyle = "#f4f5fb";
          ctx.strokeStyle = glow > 0 ? "rgba(0,229,160," + (0.4 + glow * 0.6) + ")" : "rgba(0,0,0,0.25)";
          ctx.lineWidth = 2;
          roundRect(ctx, x - cw / 2, y - 34, cw, 50, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#0b0d14"; ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(handTiles[i] || "🀄", x, y);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5;
          roundRect(ctx, x - cw / 2, y - 34, cw, 50, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("🀫", x, y);
        }
      }
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(settled ? resultText : (listening ? "🀄 听牌中，就差一张！" : "点「摸牌」，每一次都是开奖"), w / 2, h * 0.82);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labCards(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var bDeal = btn("🃏 发底牌", "");
    var bFlop = btn("🎲 翻牌/开牌", "cyan");
    center.appendChild(bDeal); center.appendChild(bFlop);
    var ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    var suits = [{ s: "♠", c: "#1b1f2b" }, { s: "♥", c: "#FF4D6D" }, { s: "♦", c: "#FF4D6D" }, { s: "♣", c: "#1b1f2b" }];
    function rc() { return { r: ranks[Math.floor(Math.random() * ranks.length)], su: suits[Math.floor(Math.random() * suits.length)] }; }
    var hole = [], comm = [], wins = 0, rounds = 0, name = "—";
    function drawCard(ctx, x, y, c, face) {
      var cw = 30, ch = 44;
      ctx.fillStyle = "#f4f5fb"; ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1.5;
      roundRect(ctx, x - cw / 2, y - ch / 2, cw, ch, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = face ? c.su.c : "rgba(0,0,0,0.25)";
      ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(face ? (c.r + c.su.s) : "?", x - cw / 2 + 3, y - ch / 2 + 2);
    }
    bDeal.addEventListener("click", function () {
      hole = [rc(), rc()]; comm = []; rounds++; name = "—";
      setCaption(container, "底牌到手，但赢面未知——开牌前的期待，正是变比率强化的精华。");
      read.set([
        { val: rounds, label: "本局", kind: "cyan" },
        { val: wins, label: "赢牌", kind: wins ? "good" : "" },
        { val: name, label: "牌型" }
      ]);
    });
    bFlop.addEventListener("click", function () {
      if (!hole.length) { setCaption(container, "先点「发底牌」。"); return; }
      comm.push(rc());
      if (comm.length >= 3 || Math.random() < 0.4) {
        var types = ["高牌", "一对", "两对", "三条", "顺子", "同花", "葫芦", "炸弹/王炸"];
        name = types[Math.floor(Math.random() * types.length)];
        if (Math.random() < 0.4) { wins++; setCaption(container, name + "！这把稳了 🎉 掌控感 + 期待奖励一起到账。"); }
        else setCaption(container, name + "。对面可能更大……下一把再来。");
      } else setCaption(container, "翻一张公共牌，牌型正在成型。");
      read.set([
        { val: rounds, label: "本局", kind: "cyan" },
        { val: wins, label: "赢牌", kind: wins ? "good" : "" },
        { val: name, label: "牌型" }
      ]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0c1a12"); g.addColorStop(1, "#07110b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var y = h * 0.5, hx = w / 2 - 40;
      drawCard(ctx, hx, y, suits[0], hole[0]); drawCard(ctx, hx + 36, y, suits[1], hole[1]);
      var cx = w / 2 + 40;
      for (var i = 0; i < comm.length; i++) drawCard(ctx, cx + i * 30, y, comm[i].su, comm[i]);
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(hole.length ? "你的底牌 + 公共牌" : "点「发底牌」开局", w / 2, h * 0.82);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     24. 爬山 / 徒步 —— 一个人在轨迹上行走
     ======================================================= */
  /* =======================================================
     24. 爬山 / 徒步 —— 雪山场景，点哪走到哪
     ======================================================= */
  function labHiking(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var bReset = btn("🔁 回到山脚", "");
    center.appendChild(bReset);

    var hx = 0, hy = 0, target = null, reached = true, reachedName = "", moving = false, legPhase = 0, endo = 0, walkDist = 0;
    var spots = [
      { x: 0.30, y: 0.64, emoji: "🏕️", name: "营地" },
      { x: 0.64, y: 0.60, emoji: "🏞️", name: "冰湖" },
      { x: 0.50, y: 0.50, emoji: "🔭", name: "观景台" }
    ];
    function drawHiker(ctx, x, y, ang, ph) {
      ctx.save(); ctx.translate(x, y);
      ctx.rotate(clamp(ang * 0.5, -0.5, 0.6));
      var bob = Math.sin(ph) * 2.2; ctx.translate(0, bob);
      ctx.strokeStyle = "#0b0d14"; ctx.lineWidth = 3; ctx.lineCap = "round";
      var sw = Math.sin(ph) * 6;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(sw, 6); ctx.moveTo(0, -10); ctx.lineTo(-sw, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -26); ctx.stroke();
      ctx.fillStyle = "#FFB020"; roundRect(ctx, -7, -24, 8, 12, 3); ctx.fill();
      var aw = Math.sin(ph + 3.14) * 5;
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(aw + 4, -12); ctx.stroke();
      ctx.fillStyle = "#FFE0BD"; ctx.beginPath(); ctx.arc(2, -32, 5, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#FF4D6D"; ctx.beginPath(); ctx.arc(2, -34, 5.5, Math.PI, 0); ctx.fill();
      ctx.restore();
    }
    function drawPeak(ctx, cx, baseY, hgt, light, dark) {
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx - hgt * 0.6, baseY); ctx.lineTo(cx, baseY - hgt); ctx.lineTo(cx + hgt * 0.6, baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(cx, baseY - hgt); ctx.lineTo(cx + hgt * 0.6, baseY); ctx.lineTo(cx + hgt * 0.2, baseY); ctx.closePath(); ctx.fill();
    }
    function reset() {
      hx = mc.dims.w * 0.5; hy = mc.dims.h * 0.9; target = null; reached = true; reachedName = ""; moving = false; walkDist = 0; endo = 0; legPhase = 0;
      setCaption(container, "点雪面任意一处，他就踩着雪走过去——路线随你选。");
      read.set([{ val: "0m", label: "已步行", kind: "cyan" }, { val: "—", label: "目标" }, { val: "0%", label: "内啡肽", kind: "good" }]);
    }
    bReset.addEventListener("click", reset);
    mc.canvas.addEventListener("click", function (e) {
      var x = e.offsetX, y = e.offsetY;
      var snowTop = mc.dims.h * 0.46;
      if (y < snowTop + 8) y = snowTop + 8;
      var hit = null, best = 1e9;
      spots.forEach(function (s) {
        var sx = s.x * mc.dims.w, sy = s.y * mc.dims.h, d = Math.hypot(sx - x, sy - y);
        if (d < best) { best = d; hit = s; }
      });
      if (hit && best < mc.dims.w * 0.07) { x = hit.x * mc.dims.w; y = hit.y * mc.dims.h; reachedName = hit.name; }
      else reachedName = "";
      target = { x: x, y: y }; reached = false; moving = true;
      setCaption(container, reachedName ? ("朝「" + reachedName + "」出发，雪面吱吱响。") : "出发！每一步都是即时反馈。");
    });
    reset();

    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      // 天空
      var sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#3a4a86"); sky.addColorStop(0.5, "#8fb4e6"); sky.addColorStop(1, "#dcecff");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      // 太阳
      ctx.fillStyle = "#FFE9A8"; ctx.shadowColor = "#FFD23F"; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(w * 0.8, h * 0.18, 26, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
      // 远雪峰
      drawPeak(ctx, w * 0.22, h * 0.5, 120, "#e8eefc", "#c2cfe6");
      drawPeak(ctx, w * 0.5, h * 0.46, 155, "#f3f7ff", "#cdd9ee");
      drawPeak(ctx, w * 0.78, h * 0.52, 110, "#e8eefc", "#c2cfe6");
      // 雪地
      var snowTop = h * 0.46;
      var g = ctx.createLinearGradient(0, snowTop, 0, h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#d4e2f4");
      ctx.fillStyle = g; ctx.fillRect(0, snowTop, w, h - snowTop);
      // 路线（从山脚向各景点蜿蜒的虚线）
      ctx.strokeStyle = "rgba(120,140,175,0.55)"; ctx.lineWidth = 4; ctx.setLineDash([10, 9]); ctx.lineCap = "round"; ctx.lineJoin = "round";
      spots.forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.9);
        ctx.quadraticCurveTo((w * 0.5 + s.x * w) / 2, h * 0.7, s.x * w, s.y * h); ctx.stroke();
      });
      ctx.setLineDash([]);
      // 景点标记
      spots.forEach(function (s) {
        ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(s.emoji, s.x * w, s.y * h);
        ctx.fillStyle = "rgba(40,60,90,0.75)"; ctx.font = "11px sans-serif"; ctx.fillText(s.name, s.x * w, s.y * h + 16);
        ctx.fillStyle = "#fff";
      });
      // 目标标记
      if (target && !reached) {
        var pr = 8 + Math.sin(t / 150) * 4;
        ctx.strokeStyle = "rgba(255,46,136,0.9)"; ctx.lineWidth = 2; ctx.textBaseline = "alphabetic";
        ctx.beginPath(); ctx.arc(target.x, target.y, pr, 0, 6.29); ctx.stroke();
        ctx.fillStyle = "#FF2E88"; ctx.font = "16px sans-serif"; ctx.textAlign = "center"; ctx.fillText("📍", target.x, target.y - 14);
      }
      // 移动
      var ang = 0;
      if (target) {
        var dx = target.x - hx, dy = target.y - hy, d = Math.hypot(dx, dy);
        if (d > 3) {
          var sp = w * 0.004;
          var st = Math.min(sp, d); hx += dx / d * st; hy += dy / d * st;
          legPhase += 0.28; moving = true; walkDist += st; endo = clamp(endo + 0.04, 0, 100);
          ang = Math.atan2(dy, dx);
        } else if (!reached) {
          reached = true; moving = false;
          setCaption(container, reachedName ? ("到达「" + reachedName + "」🎉 内啡肽与「我走过来」的掌控感一起到账。") : "到达！雪原尽头，视野安静地铺开。");
        }
      }
      drawHiker(ctx, hx, hy, moving ? ang : 0, legPhase);
      read.set([{ val: Math.round(walkDist * 0.12) + "m", label: "已步行", kind: "cyan" }, { val: reachedName || (target ? "前往中" : "—"), label: "目标" }, { val: Math.round(endo) + "%", label: "内啡肽", kind: "good" }]);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }
  function drawCloud(ctx, x, y, s) {
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath();
    ctx.arc(x, y, 18 * s, 0, 6.29); ctx.arc(x + 20 * s, y + 4 * s, 22 * s, 0, 6.29); ctx.arc(x + 44 * s, y, 16 * s, 0, 6.29); ctx.fill();
  }
  function drawRidge(ctx, w, h, baseY, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * baseY);
    ctx.lineTo(w * 0.3, h * (baseY - 0.12)); ctx.lineTo(w * 0.6, h * (baseY - 0.02)); ctx.lineTo(w * 0.85, h * (baseY - 0.16)); ctx.lineTo(w, h * (baseY - 0.04)); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  function drawTree(ctx, x, y) {
    ctx.fillStyle = "#5a3b22"; ctx.fillRect(x - 2, y - 2, 4, 10);
    ctx.fillStyle = "#2f7d4f"; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 10, y - 2); ctx.lineTo(x + 10, y - 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - 32); ctx.lineTo(x - 8, y - 14); ctx.lineTo(x + 8, y - 14); ctx.closePath(); ctx.fill();
  }

  /* =======================================================
     24. 拼豆 —— 心流 + 完成感（内啡肽）
     ======================================================= */
  function labPerler(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var palette = [
      { name: "红", hex: "#FF4D6D" }, { name: "橙", hex: "#FF9F45" },
      { name: "黄", hex: "#FFD23F" }, { name: "绿", hex: "#3DDC84" },
      { name: "青", hex: "#00E5C0" }, { name: "蓝", hex: "#3D8BFF" },
      { name: "紫", hex: "#9C6CFF" }, { name: "粉", hex: "#FF8FD0" },
      { name: "白", hex: "#F4F6FF" }, { name: "黑", hex: "#2A2E3A" }
    ];
    var cur = 0, cols = 12, rows = 12, n = cols * rows;
    var cells = []; for (var i = 0; i < n; i++) cells.push(-1);
    var ironing = false, ironT = 0;

    function layout() {
      var w = mc.dims.w, h = mc.dims.h;
      var pad = 14, top = 22;
      var avail = Math.min(w - pad * 2, h - top - 150);
      var cell = avail / Math.max(cols, rows);
      var gw = cell * cols, gh = cell * rows;
      return { ox: (w - gw) / 2, oy: top + (h - top - 150 - gh) / 2, cell: cell };
    }
    function cellAt(px, py) {
      var L = layout();
      var c = Math.floor((px - L.ox) / L.cell);
      var r = Math.floor((py - L.oy) / L.cell);
      if (c < 0 || c >= cols || r < 0 || r >= rows) return -1;
      return r * cols + c;
    }
    function filled() { var k = 0; for (var i = 0; i < n; i++) if (cells[i] >= 0) k++; return k; }

    mc.canvas.addEventListener("click", function (e) {
      if (ironing) return;
      var rect = mc.canvas.getBoundingClientRect();
      var idx = cellAt(e.clientX - rect.left, e.clientY - rect.top);
      if (idx < 0) return;
      cells[idx] = cur;
      updateRead();
    });

    var bColor = btn("🎨 换色：" + palette[cur].name, "");
    var bIron = btn("🔥 熨烫定型", "cyan");
    center.appendChild(bColor); center.appendChild(bIron);

    bColor.addEventListener("click", function () {
      if (ironing) return;
      cur = (cur + 1) % palette.length;
      bColor.textContent = "🎨 换色：" + palette[cur].name;
      setCaption(container, "当前颜色：" + palette[cur].name + "。挑张图，一颗一颗摆，别问为什么。");
      updateRead();
    });
    bIron.addEventListener("click", function () {
      if (ironing) return;
      if (filled() === 0) { setCaption(container, "先摆几颗珠子再熨，不然熨了个寂寞。"); return; }
      ironing = true; ironT = 0;
      setCaption(container, "熨斗压下，珠子开始融化融合……定型那一刻，内啡肽到账。");
      updateRead();
    });

    function updateRead() {
      read.set([
        { val: filled() + "/" + n, label: "已拼珠子" },
        { val: palette[cur].name, label: "当前色", kind: "cyan" },
        { val: ironing ? "定型中" : "摆放中", label: "状态" }
      ]);
    }
    updateRead();
    setCaption(container, "点格子摆珠，点「换色」切颜色，摆满意后「熨烫定型」。心流就是这么悄悄把你一下午吃掉的。");

    var lp = loop(function () {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var L = layout();
      if (ironing) ironT = Math.min(1, ironT + 0.012);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var ci = cells[r * cols + c];
          var x = L.ox + c * L.cell + L.cell / 2, y = L.oy + r * L.cell + L.cell / 2;
          if (ci < 0) {
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.beginPath(); ctx.arc(x, y, L.cell * 0.34, 0, 6.2832); ctx.fill();
          } else if (ironing) {
            var grow = ironT * L.cell * 0.18;
            ctx.fillStyle = palette[ci].hex;
            roundRect(ctx, x - L.cell / 2 + 1 - grow, y - L.cell / 2 + 1 - grow, L.cell - 2 + grow * 2, L.cell - 2 + grow * 2, 5);
            ctx.fill();
          } else {
            ctx.fillStyle = palette[ci].hex;
            ctx.beginPath(); ctx.arc(x, y, L.cell * 0.36, 0, 6.2832); ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(x, y, L.cell * 0.36, 0, 6.2832); ctx.stroke();
          }
        }
      }
      if (ironing && ironT >= 1) {
        ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("🎉 定型完成 · " + filled() + " 颗焊进了一幅画", w / 2, h - 96);
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* ---------- 注册 ---------- */
  /* =======================================================
    X. 手冲咖啡 —— 萃取窗口 + 分段注水
    ======================================================= */
  function labCoffee(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var grind = 1, temp = 92, brewing = false, done = false, prog = 0, startT = 0, lastScore = null;
    var drops = [];
    function grLabel(g) { return g === 0 ? "细" : g === 1 ? "中" : "粗"; }
    var gBtns = [
      btn("研磨·细", "", function () { grind = 0; upd(); }),
      btn("研磨·中", "", function () { grind = 1; upd(); }),
      btn("研磨·粗", "", function () { grind = 2; upd(); })
    ];
    var tBtns = [
      btn("88°C", "", function () { temp = 88; upd(); }),
      btn("92°C", "", function () { temp = 92; upd(); }),
      btn("96°C", "", function () { temp = 96; upd(); })
    ];
    gBtns.forEach(function (b) { center.appendChild(b); });
    tBtns.forEach(function (b) { center.appendChild(b); });
    var brewBtn = btn("☕ 开始冲煮", "cyan");
    center.appendChild(brewBtn);

    function upd() {
      gBtns.forEach(function (b, i) { b.classList.toggle("active", grind === i); });
      tBtns.forEach(function (b, i) { b.classList.toggle("active", temp === [88, 92, 96][i]); });
      brewBtn.disabled = brewing;
      read.set([
        { val: grLabel(grind), label: "研磨度", kind: grind === 1 ? "good" : "" },
        { val: temp + "°C", label: "水温", kind: (temp >= 90 && temp <= 93) ? "good" : "warn" },
        { val: done && lastScore != null ? Math.round(lastScore) + "分" : "—", label: "风味", kind: done ? (lastScore >= 80 ? "good" : lastScore >= 60 ? "" : "bad") : "" }
      ]);
    }
    function score() {
      var s = 100;
      s -= Math.abs(grind - 1) * 22;
      if (temp < 90) s -= (90 - temp) * 1.6;
      else if (temp > 93) s -= (temp - 93) * 2.2;
      return clamp(Math.round(s), 0, 100);
    }
    function flavorText(s) {
      if (s >= 82) return "干净明亮、甜感清晰——中研磨+合适水温，正好打在萃取窗口里。";
      if (s >= 62) return grind === 2 ? "有点尖酸：研磨偏粗、萃取不足，味道单薄。" : (temp > 93 ? "边缘微苦：水温偏高，下次降两度。" : "还行，但没到最佳窗口。");
      return grind === 0 ? "过萃发苦：研磨太细/水温太高，把苦涩全逼出来了。" : "萃取严重不足：又粗又凉，像在喝褐色温水。";
    }
    brewBtn.addEventListener("click", function () {
      if (brewing) return;
      brewing = true; done = false; prog = 0; startT = 0; lastScore = null; drops = []; upd();
      setCaption(container, "闷蒸 30 秒让咖啡呼吸，再分段绕圈注水——看它一滴一滴落成一杯。");
    });
    var lp = loop(function (t) {
      if (brewing && !startT) startT = t;
      if (brewing) {
        var dur = 4200;
        prog = clamp((t - startT) / dur, 0, 1);
        if (prog < 0.92 && Math.random() < 0.5) drops.push({ y: 0.30, a: 1, sp: rand(0.01, 0.02) + prog * 0.01 });
        if (prog >= 1) {
          brewing = false; done = true; lastScore = score(); upd();
          setCaption(container, "☕ 冲好了：" + flavorText(lastScore) + "（怎么玩里写了：粉水比 1:15，水温约 90°C）");
        }
      }
      drops.forEach(function (d) { d.y += d.sp; d.a -= 0.015; });
      drops = drops.filter(function (d) { return d.a > 0 && d.y < 0.96; });
      draw(prog, brewing, t);
    });
    function draw(p, pouring, t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2;
      var dripperTop = h * 0.20, dripperBot = h * 0.46, dwTop = 78, dwBot = 30;
      var serverTop = h * 0.50, serverBot = h * 0.86, swTop = 64, swBot = 52;
      if (pouring && p < 0.9) {
        ctx.strokeStyle = "rgba(180,210,255,0.7)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, dripperTop - 26); ctx.lineTo(cx, dripperTop); ctx.stroke();
      }
      // 滤杯 V60 锥
      ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - dwTop, dripperTop); ctx.lineTo(cx + dwTop, dripperTop);
      ctx.lineTo(cx + dwBot, dripperBot); ctx.lineTo(cx - dwBot, dripperBot); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 咖啡粉床
      var bedY = (dripperTop + dripperBot) / 2;
      var bwt = lerp(dwTop, dwBot, (bedY - dripperTop) / (dripperBot - dripperTop));
      ctx.fillStyle = "#5b3a1e";
      ctx.beginPath();
      ctx.moveTo(cx - bwt, bedY); ctx.lineTo(cx + bwt, bedY);
      ctx.lineTo(cx + dwBot, dripperBot); ctx.lineTo(cx - dwBot, dripperBot); ctx.closePath(); ctx.fill();
      // 下落液滴
      drops.forEach(function (d) {
        ctx.globalAlpha = clamp(d.a, 0, 1);
        ctx.fillStyle = "#6b4226";
        ctx.beginPath(); ctx.arc(cx, d.y * h, 2.4, 0, 6.29); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // 下壶
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - swTop, serverTop); ctx.lineTo(cx + swTop, serverTop);
      ctx.lineTo(cx + swBot, serverBot); ctx.lineTo(cx - swBot, serverBot); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 壶中咖啡液
      var liqH = (serverBot - serverTop) * p;
      if (liqH > 0) {
        var sy = serverBot - liqH;
        var swt = lerp(swTop, swBot, (sy - serverTop) / (serverBot - serverTop));
        var grad = ctx.createLinearGradient(0, sy, 0, serverBot);
        grad.addColorStop(0, "#7a4a26"); grad.addColorStop(1, "#3d2412");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - swt, sy); ctx.lineTo(cx + swt, sy);
        ctx.lineTo(cx + swBot, serverBot); ctx.lineTo(cx - swBot, serverBot); ctx.closePath(); ctx.fill();
      }
      // 蒸汽
      if (done && p >= 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
        for (var k = 0; k < 3; k++) {
          var sx = cx + (k - 1) * 16;
          ctx.beginPath();
          for (var yy = 0; yy <= 20; yy += 4) {
            var ox = Math.sin((yy + t * 0.004 + k) * 0.5) * 5;
            if (yy === 0) ctx.moveTo(sx + ox, serverTop - 6 - yy); else ctx.lineTo(sx + ox, serverTop - 6 - yy);
          }
          ctx.stroke();
        }
      }
    }
    upd();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     补充实验：让全部条目都有互动小实验
     ======================================================= */

  // —— 通勤听播客：随机抽一期 + 动态均衡器 ——
  function labPodcast(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var topics = ["深度长访谈", "相声 / 脱口秀", "悬疑故事会", "冷知识科普", "职场吐槽局", "播客剧", "历史八卦", "放松白噪音", "创投闲聊", "影评唠嗑"];
    var pick = null;
    var b = btn("🎲 抽一期", "cyan");
    center.appendChild(b);
    b.addEventListener("click", function () {
      pick = topics[Math.floor(Math.random() * topics.length)];
      var dur = 18 + Math.floor(Math.random() * 55);
      read.set([
        { val: pick, label: "本期主题" },
        { val: dur + " 分钟", label: "单集时长", kind: "warn" }
      ]);
      setCaption(container, "戴上耳机，把被动通勤重新赋值为「主动获取」——低频社交陪伴 + 微小确定性，多巴胺稳稳到账。");
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(124,77,255,0.05)"; ctx.fillRect(0, 0, w, h);
      var n = 28, bw = w / n;
      for (var i = 0; i < n; i++) {
        var amp = (pick ? 0.5 + 0.5 * Math.sin(t / 120 + i * 0.5) : 0.12) * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.3)));
        var bh = amp * h * 0.6;
        var x = i * bw + bw * 0.2, y = (h - bh) / 2;
        ctx.fillStyle = pick ? "rgba(0,229,255,0.85)" : "rgba(255,255,255,0.18)";
        roundRect(ctx, x, y, bw * 0.6, bh, 3); ctx.fill();
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  // —— 周末做一顿饭：开火下锅，气泡渐满 ——
  function labHomecook(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var dishes = ["番茄牛腩", "葱油拌面", "可乐鸡翅", "咖喱鸡", "蒜蓉西兰花", "煎三文鱼", "麻婆豆腐", "罗宋汤"];
    var heating = false, prog = 0, startT = 0, bubbles = [];
    function upd() { read.set([{ val: Math.round(prog * 100) + "%", label: "火候", kind: prog > 0.85 ? "good" : "warn" }]); }
    upd();
    var b = btn("🍳 开火下锅", "amber");
    center.appendChild(b);
    b.addEventListener("click", function () {
      heating = !heating;
      b.textContent = heating ? "🔥 关火" : "🍳 开火下锅";
      if (heating && prog >= 1) { prog = 0; bubbles = []; }
      startT = 0;
      setCaption(container, heating ? "油热了，下食材——听那一声响，心流与感官奖赏双双在线。" : "关火，盛盘。");
    });
    var lp = loop(function (t) {
      if (heating && !startT) startT = t;
      if (heating) {
        prog = clamp((t - startT) / 4200, 0, 1);
        if (prog < 0.96 && Math.random() < 0.4) bubbles.push({ x: rand(0.3, 0.7), y: 0.9, vy: rand(0.01, 0.03) });
        if (prog >= 1) {
          heating = false; b.textContent = "🍳 开火下锅";
          var d = dishes[Math.floor(Math.random() * dishes.length)];
          setCaption(container, "出锅！今天你亲手做了一道「" + d + "」——花时间照料自己，内啡肽到账。");
        }
        upd();
      }
      bubbles.forEach(function (p) { p.y -= p.vy; });
      bubbles = bubbles.filter(function (p) { return p.y > 0.45; });
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, py = h * 0.5, r = Math.min(w, h) * 0.28;
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, py, r, 0, 6.2832); ctx.fill(); ctx.stroke();
      var liq = r * 0.92 * prog;
      if (liq > 0) {
        var g = ctx.createRadialGradient(cx, py, 4, cx, py, liq);
        g.addColorStop(0, "#ff9a3c"); g.addColorStop(1, "#c0451b");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, py, liq, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,240,200,0.85)";
      bubbles.forEach(function (p) { ctx.beginPath(); ctx.arc(cx + (p.x - 0.5) * r * 1.6, py + (p.y - 0.5) * r * 1.6, 2.4, 0, 6.2832); ctx.fill(); });
      if (heating) {
        ctx.fillStyle = "rgba(255,77,109," + (0.12 + 0.1 * Math.sin(t / 90)) + ")";
        ctx.beginPath(); ctx.arc(cx, py + r + 6, r * 0.7, 0, 6.2832); ctx.fill();
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  // —— 冥想呼吸：跟随圆圈吸气 / 呼气 ——
  function labMeditation(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var running = false, t0 = 0, rounds = 0, phase = "准备";
    var b = btn("▶ 开始呼吸", "cyan");
    center.appendChild(b);
    b.addEventListener("click", function () {
      running = !running;
      b.textContent = running ? "⏸ 暂停" : "▶ 开始呼吸";
      setCaption(container, running ? "跟着圆圈：放大=吸气，缩小=呼气。专注呼吸，皮质醇在降。" : "停。把这份松弛带回日常。");
    });
    var lp = loop(function (t) {
      if (running && !t0) t0 = t;
      var tt = running ? (t - t0) : 0;
      var cyc = 6000;
      var k = (tt % cyc) / cyc;
      var breathe = 0.5 - 0.5 * Math.cos(k * 6.2832);
      phase = k < 0.5 ? "吸气" : "呼气";
      if (running && k < 0.02) rounds++;
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cyy = h / 2, base = Math.min(w, h) * 0.16;
      var rad = base + breathe * Math.min(w, h) * 0.22;
      var g = ctx.createRadialGradient(cx, cyy, 6, cx, cyy, rad);
      g.addColorStop(0, "rgba(0,229,255,0.55)"); g.addColorStop(1, "rgba(124,77,255,0.12)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cyy, rad, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "600 " + Math.round(Math.min(w, h) * 0.07) + "px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(phase, cx, cyy);
      read.set([
        { val: phase, label: "当前", kind: phase === "吸气" ? "cyan" : "" },
        { val: rounds + " 轮", label: "已完成", kind: "good" }
      ]);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  // —— 折纸类通用：点一下折一步，最后成型 ——
  function foldToy(container, steps, finalEmoji, doneCaption) {
    var center = makeCenter(container);
    var cap = el("div");
    cap.style.textAlign = "center";
    container.appendChild(cap);
    var emo = el("div");
    emo.textContent = "📄";
    emo.style.fontSize = "64px";
    emo.style.transition = "transform .35s ease, opacity .35s ease";
    cap.appendChild(emo);
    var tip = el("div");
    tip.style.color = "var(--text-dim)";
    tip.style.marginTop = "10px";
    tip.style.fontSize = "14px";
    cap.appendChild(tip);
    var stage = 0, done = false;
    function render() {
      if (done) {
        emo.textContent = finalEmoji;
        emo.style.transform = "scale(1.15) rotate(6deg)";
        tip.textContent = doneCaption;
        return;
      }
      tip.textContent = (stage + 1) + " / " + steps.length + " · " + steps[stage];
    }
    render();
    var b = btn("✂️ 折一下", "amber");
    center.appendChild(b);
    var again = btn("🔁 重新来", "");
    center.appendChild(again);
    b.addEventListener("click", function () {
      if (done) return;
      stage++;
      emo.style.transform = "scale(0.9) rotate(" + (stage * 24) + "deg)";
      setTimeout(function () { emo.style.transform = "scale(1)"; }, 180);
      if (stage >= steps.length) { done = true; setCaption(container, doneCaption); }
      else setCaption(container, steps[stage - 1] + "——每折一下都是毫秒级反馈，多巴胺小额连发。");
      render();
    });
    again.addEventListener("click", function () {
      stage = 0; done = false; emo.style.transform = "scale(1)"; render();
      setCaption(container, "从头折，慢就是快。");
    });
    return { destroy: function () {} };
  }
  function labCraft(container) {
    return foldToy(container,
      ["对折出中线", "两角向中心折", "翻面再折一次", "撑开压成方块", "拉出星星的角"],
      "⭐", "15 分钟，桌上多了个你自己折的星星——碎片时间最干净的「做点什么」。");
  }
  function labOrigami(container) {
    return foldToy(container,
      ["对角折出十字", "四角向中心聚", "翻面收成底座", "拉起头部与翅膀", "捏出尖尖的喙"],
      "🕊️", "一只纸鹤落进手心——低门槛心流，把掌控感折进了立体。");
  }

  // —— 拼一幅图：3x3 滑动拼图（保证可解） ——
  function labJigsaw(container) {
    var center = makeCenter(container);
    var cap = el("div");
    cap.style.textAlign = "center";
    container.appendChild(cap);
    var grid = el("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(3, 54px)";
    grid.style.gap = "6px";
    grid.style.justifyContent = "center";
    grid.style.margin = "8px auto 0";
    cap.appendChild(grid);
    var state = [];
    function blankIdx() { return state.indexOf(0); }
    function isSolved() { for (var i = 0; i < 8; i++) if (state[i] !== i + 1) return false; return true; }
    function shuffle() {
      state = [1, 2, 3, 4, 5, 6, 7, 8, 0];
      var b = 8;
      for (var n = 0; n < 80; n++) {
        var nei = [];
        if (b % 3 > 0) nei.push(b - 1);
        if (b % 3 < 2) nei.push(b + 1);
        if (b >= 3) nei.push(b - 3);
        if (b < 6) nei.push(b + 3);
        var pk = nei[Math.floor(Math.random() * nei.length)];
        var tmp = state[b]; state[b] = state[pk]; state[pk] = tmp; b = pk;
      }
    }
    function render() {
      grid.innerHTML = "";
      state.forEach(function (v, i) {
        var cell = el("button", "lab-cell");
        cell.type = "button";
        cell.textContent = v === 0 ? "" : v;
        cell.style.width = "54px"; cell.style.height = "54px";
        cell.style.borderRadius = "10px"; cell.style.border = "1px solid var(--glass-line)";
        cell.style.fontSize = "20px"; cell.style.fontWeight = "700";
        if (v === 0) { cell.style.background = "transparent"; cell.style.cursor = "default"; }
        else { cell.style.background = "rgba(124,77,255,0.18)"; cell.style.color = "#fff"; cell.style.cursor = "pointer"; }
        cell.addEventListener("click", function () { move(i); });
        grid.appendChild(cell);
      });
    }
    function move(i) {
      var b = blankIdx();
      if (i === b) return;
      var adj = (i % 3 === b % 3 && Math.abs(i - b) === 3) || (Math.floor(i / 3) === Math.floor(b / 3) && Math.abs(i - b) === 1);
      if (!adj) return;
      var tmp = state[i]; state[i] = state[b]; state[b] = tmp;
      if (isSolved()) setCaption(container, "拼好了！⛰️ 一千块碎片回到它本来的样子，延迟满足变成可见的奖赏。");
      else setCaption(container, "每一块归位，都是一次小而确定的「对了」。");
      render();
    }
    var again = btn("🔀 打乱重拼", "");
    center.appendChild(again);
    again.addEventListener("click", function () { shuffle(); render(); setCaption(container, "已打乱，点数字块挪到空格，拼回 1–8。"); });
    shuffle(); render();
    setCaption(container, "点数字块挪到空格，把 1–8 排好序就赢。");
    return { destroy: function () {} };
  }

  /* =======================================================
     拓展实验：钓鱼 / 射箭 / 室内·室外·高空·低空
     ======================================================= */
  function labFishing(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🎣 抛竿", "cyan");
    center.appendChild(b);
    var caught = 0, casts = 0, biting = false, biteT = 0, timer = null;
    function cast() {
      casts++; biting = false;
      setCaption(container, "抛竿，盯着浮漂……鱼什么时候开口全看运气（变比率强化）。");
      read.set([{ val: casts, label: "抛竿", kind: "cyan" }, { val: caught, label: "钓到", kind: "good" }]);
      clearTimeout(timer);
      timer = setTimeout(function () { biting = true; biteT = 0; setCaption(container, "浮漂一顿！快提竿——期待被拉到最高。"); }, rand(1400, 4200));
    }
    b.addEventListener("click", function () {
      if (biting) {
        biting = false; clearTimeout(timer); caught++;
        beep(520, 0.08, "sine", 0.06);
        var fish = ["鲫鱼", "鲤鱼", "小龙虾", "空钩", "拖鞋"];
        setCaption(container, "提竿！上钩的是「" + fish[Math.floor(rand(0, fish.length))] + "」。期待奖励一次性结清。");
        read.set([{ val: casts, label: "抛竿", kind: "cyan" }, { val: caught, label: "钓到", kind: "good" }]);
      } else { cast(); }
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#06303f"); g.addColorStop(1, "#04222e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,229,255,0.12)"; ctx.lineWidth = 1;
      for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 10) { var y = h * (0.45 + i * 0.13) + Math.sin(x / 26 + t / 600 + i) * 4; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      var fx = w * 0.5, fy = h * 0.5;
      if (biting) { biteT += 0.06; fy += Math.sin(biteT * 8) * 6 + 10; ctx.fillStyle = "rgba(0,229,160,0.95)"; }
      else { fy += Math.sin(t / 500) * 3; ctx.fillStyle = "#FF2E88"; }
      ctx.beginPath(); ctx.ellipse(fx, fy, 7, 4, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, 0); ctx.stroke();
    });
    lp.start();
    return { destroy: function () { lp.stop(); clearTimeout(timer); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labArchery(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏹 拉弓射箭", "amber");
    center.appendChild(b);
    var hits = 0, shots = 0, flash = 0, flashR = 0;
    b.addEventListener("click", function () {
      shots++; var r = Math.random();
      var zone = r < 0.25 ? "红心" : r < 0.6 ? "黄心" : r < 0.85 ? "外环" : "脱靶";
      if (zone !== "脱靶") { hits++; flash = 1; flashR = r < 0.25 ? 10 : r < 0.6 ? 22 : 34; beep(zone === "红心" ? 880 : 660, 0.07, "triangle", 0.06); }
      setCaption(container, zone === "红心" ? "正中红心！操作性条件反射瞬间到账。" : zone === "脱靶" ? "偏了，再来一箭——不确定性让你停不下来。" : "稳稳扎进" + zone + "，心流又满一格。");
      read.set([{ val: shots, label: "出手", kind: "cyan" }, { val: hits, label: "命中", kind: "good" }, { val: (shots ? Math.round(hits / shots * 100) : 0) + "%", label: "命中率" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var cx = w * 0.68, cy = h * 0.5;
      [["#FF2E88", 46], ["#FFD23F", 34], ["#00E5FF", 22], ["#ffffff", 10]].forEach(function (rg) {
        ctx.beginPath(); ctx.arc(cx, cy, rg[1], 0, 6.29); ctx.fillStyle = rg[0]; ctx.globalAlpha = 0.85; ctx.fill();
      }); ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, h * 0.82); ctx.lineTo(w, h * 0.82); ctx.stroke();
      if (flash > 0) { flash -= 0.02; ctx.strokeStyle = "rgba(0,229,160," + clamp(flash, 0, 1) + ")"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, flashR, 0, 6.29); ctx.stroke(); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labSkateboard(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🛹 踩一脚", "cyan");
    center.appendChild(b);
    var ok = 0, fail = 0, hop = 0, x = 0.12;
    b.addEventListener("click", function () {
      if (Math.random() < 0.55) { ok++; hop = 1; beep(500, 0.06, "square", 0.05); setCaption(container, "ollie 站上去了！近因效应让你只记得这一下爽。"); }
      else { fail++; hop = 0.4; setCaption(container, "摔了——但下一把肯定行，游戏的爽点就在这。"); }
      read.set([{ val: ok, label: "站上去", kind: "good" }, { val: fail, label: "摔了", kind: "cyan" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var ground = h * 0.78; ctx.fillStyle = "#11141d"; ctx.fillRect(0, ground, w, h - ground);
      x += 0.004; if (x > 0.92) x = 0.12;
      var sx = x * w, sy = ground - 14 - (hop > 0 ? Math.sin(hop * Math.PI) * 26 : 0);
      if (hop > 0) hop -= 0.03;
      ctx.fillStyle = "#FF8A3D"; ctx.shadowColor = "#FF8A3D"; ctx.shadowBlur = 12;
      ctx.fillRect(sx - 14, sy, 28, 8); ctx.fillRect(sx - 12, sy + 8, 4, 8); ctx.fillRect(sx + 8, sy + 8, 4, 8); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(124,77,255,0.3)"; ctx.lineWidth = 6;
      for (var i = 0; i < 8; i++) { var lx = ((i * 140 - (t / 8) % 140) % (w + 140)); if (lx < -140) lx += w + 140; ctx.fillRect(lx, ground - 26, 6, 26); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labSki(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("⛷️ 滑一段", "cyan");
    center.appendChild(b);
    var turns = 0, fall = 0, speed = 0;
    b.addEventListener("click", function () {
      if (Math.random() < 0.8) { turns++; speed = clamp(speed + 10, 0, 100); beep(420 + turns * 8, 0.05, "sine", 0.05); setCaption(container, "卡宾转弯，风灌进领口——心流加内啡肽双发。"); }
      else { fall++; speed = 0; setCaption(container, "摔了，雪软不疼。起来再滑，掌控感马上回来。"); }
      read.set([{ val: turns, label: "转弯", kind: "good" }, { val: fall, label: "摔", kind: "cyan" }, { val: Math.round(speed) + "%", label: "速度感" }]);
    });
    var scroll = 0;
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      scroll += speed * 0.01 + 0.3;
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
      for (var i = 0; i < 6; i++) {
        var yy = h * (0.2 + i * 0.13), off = (scroll + i * 40) % 80;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy + Math.sin((scroll + i * 30) / 60) * 10); ctx.stroke();
      }
      var sx = w * 0.45, sy = h * 0.6;
      ctx.fillStyle = "#00E5FF"; ctx.shadowColor = "#00E5FF"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(sx, sy, 10, 5, 0, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labSurf(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🏄 划水等浪", "cyan");
    center.appendChild(b);
    var rides = 0, paddle = 0, waiting = false, timer = null;
    function wait() {
      waiting = true; b.textContent = "🏄 等浪…";
      setCaption(container, "趴板上划水，盯着海面——变比率强化反复吊你胃口。");
      clearTimeout(timer);
      timer = setTimeout(function () { waiting = false; b.textContent = "🏄 冲！"; setCaption(container, "一个浪推起来了！站上去——期待奖励一次性结清。"); }, rand(1500, 4000));
    }
    b.addEventListener("click", function () {
      if (waiting) return;
      if (b.textContent.indexOf("冲") >= 0) {
        rides++; beep(600, 0.08, "sine", 0.06); b.textContent = "🏄 划水等浪";
        setCaption(container, "站上浪壁，内啡肽随失重涌上来。再来一个？");
      } else { paddle++; wait(); }
      read.set([{ val: rides, label: "冲浪", kind: "good" }, { val: paddle, label: "划水", kind: "cyan" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#06303f"); g.addColorStop(1, "#04222e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var riding = b.textContent.indexOf("冲") >= 0;
      ctx.strokeStyle = "rgba(0,229,255,0.25)"; ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        var phase = t / 500 + i * 2; ctx.beginPath();
        for (var x = 0; x <= w; x += 10) {
          var y = h * (0.55 + i * 0.15) + Math.sin(x / 40 + phase) * 10 + (riding ? -Math.sin(x / 20 + phase * 2) * 16 : 0);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        } ctx.stroke();
      }
      var sx = w * 0.3, sy = h * 0.5;
      ctx.fillStyle = "#FF8A3D"; ctx.shadowColor = "#FF8A3D"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(sx, sy, 16, 7, 0, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
    });
    lp.start();
    return { destroy: function () { lp.stop(); clearTimeout(timer); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labClimbing(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🧗 挪一步", "amber");
    center.appendChild(b);
    var height = 0, slip = 0;
    b.addEventListener("click", function () {
      if (Math.random() < 0.85) { height += Math.round(rand(0.4, 1.2) * 10) / 10; beep(380 + height * 10, 0.05, "triangle", 0.05); setCaption(container, "又上一个支点，全神贯注——心流把手机信号都屏蔽了。"); }
      else { slip++; height = Math.max(0, height - 0.5); setCaption(container, "脚滑了一下，抓稳。害怕转成了专注，这很攀岩。"); }
      read.set([{ val: height.toFixed(1) + "m", label: "高度", kind: "good" }, { val: slip, label: "脚滑", kind: "cyan" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (var i = 0; i < 5; i++) {
        var cxp = w * (0.2 + i * 0.15);
        for (var j = 0; j < 9; j++) {
          var cyp = h * (0.12 + j * 0.1) - height * 8;
          if (cyp > -20 && cyp < h + 20) { ctx.beginPath(); ctx.arc(cxp, cyp, 5, 0, 6.29); ctx.fill(); }
        }
      }
      var clx = w * 0.45, cly = clamp(h * 0.7 - height * 40, 20, h * 0.9);
      ctx.fillStyle = "#FF2E88"; ctx.shadowColor = "#FF2E88"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(clx, cly, 9, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labSkydive(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🪂 跳出机舱", "amber");
    center.appendChild(b);
    var jumped = false, open = false, alt = 4000, fun = 0;
    b.addEventListener("click", function () {
      if (!jumped) { jumped = true; open = false; alt = 4000; b.textContent = "🪂 开伞"; setCaption(container, "自由落体！极端的感官刺激让大脑来不及焦虑，只来得及哇。"); }
      else if (!open) { open = true; fun++; beep(300, 0.1, "sine", 0.06); b.textContent = "🪂 再来一次"; setCaption(container, "伞开了，应激反跳——皮质醇退潮，内啡肽漫上来。腿软但想再来。"); }
      else { jumped = false; open = false; b.textContent = "🪂 跳出机舱"; setCaption(container, "回到地面，回味刚才的哇。"); }
      read.set([{ val: jumped ? (open ? "已开伞" : "自由落体") : "地面", label: "状态", kind: "cyan" }, { val: fun, label: "爽次数", kind: "good" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0a1530"); g.addColorStop(1, "#1a2a4a"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (open) alt = Math.max(0, alt - 30); else if (jumped) alt = Math.max(0, alt - 60);
      var px = w * 0.5, py = open ? h * 0.32 : (jumped ? h * 0.25 + Math.sin(t / 200) * 4 : h * 0.2);
      ctx.fillStyle = "#FF8A3D"; ctx.shadowColor = "#FF8A3D"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
      if (open) { ctx.strokeStyle = "#00E5FF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py - 30, 26, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px - 26, py - 30); ctx.lineTo(px, py - 6); ctx.lineTo(px + 26, py - 30); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "12px sans-serif"; ctx.textAlign = "left"; ctx.fillText("高度 " + Math.round(alt) + "m", 12, 20);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labBilliards(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🎱 击球", "amber");
    center.appendChild(b);
    var pot = 0, shots = 0, flash = 0, fx = 0, fy = 0;
    b.addEventListener("click", function () {
      shots++; var make = Math.random() < 0.6;
      if (make) { pot++; flash = 1; fx = mc.dims.w * 0.5; fy = mc.dims.h * 0.5; beep(700, 0.06, "sine", 0.05); }
      setCaption(container, make ? "空心入袋！走位和落袋的即时反馈，多巴胺到账。" : "母球停了，目标球没进——再算一次。");
      read.set([{ val: pot, label: "进球", kind: "good" }, { val: shots, label: "出杆", kind: "cyan" }, { val: (shots ? Math.round(pot / shots * 100) : 0) + "%", label: "进球率" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0e5a3a"; ctx.fillRect(w * 0.08, h * 0.18, w * 0.84, h * 0.64);
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 4; ctx.strokeRect(w * 0.08, h * 0.18, w * 0.84, h * 0.64);
      ctx.fillStyle = "#000";
      [[0.08, 0.18], [0.5, 0.15], [0.92, 0.18], [0.08, 0.82], [0.5, 0.85], [0.92, 0.82]].forEach(function (p) { ctx.beginPath(); ctx.arc(w * p[0], h * p[1], 8, 0, 6.29); ctx.fill(); });
      var cols = ["#FF2E88", "#FFD23F", "#00E5FF", "#fff", "#FF8A3D"];
      cols.forEach(function (c, i) { var a = t / 1000 + i; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w * 0.5 + Math.cos(a) * 40, h * 0.5 + Math.sin(a) * 30, 7, 0, 6.29); ctx.fill(); });
      if (flash > 0) { flash -= 0.03; ctx.strokeStyle = "rgba(0,229,160," + clamp(flash, 0, 1) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx, fy, 18, 0, 6.29); ctx.stroke(); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labFrisbee(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🥏 传一盘", "cyan");
    center.appendChild(b);
    var catchN = 0, drop = 0, flying = null;
    b.addEventListener("click", function () {
      if (flying) return;
      flying = { p: 0 };
      setCaption(container, "盘出手了，划过一道弧线……");
      setTimeout(function () {
        if (Math.random() < 0.7) { catchN++; beep(560, 0.06, "sine", 0.05); setCaption(container, "稳稳接住！社交奖赏加操作性条件反射，击掌走起。"); }
        else { drop++; setCaption(container, "脱手了，捡回来再传——催产素还在。"); }
        flying = null; read.set([{ val: catchN, label: "接住", kind: "good" }, { val: drop, label: "脱手", kind: "cyan" }]);
      }, 600);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0c2a18"; ctx.fillRect(0, h * 0.8, w, h * 0.2);
      ctx.fillStyle = "#FF8A3D";
      ctx.beginPath(); ctx.arc(w * 0.15, h * 0.72, 9, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.85, h * 0.72, 9, 0, 6.29); ctx.fill();
      if (flying) {
        flying.p += 0.03; var p = flying.p;
        var fx = lerp(w * 0.15, w * 0.85, p), fy = lerp(h * 0.6, h * 0.6, p) - Math.sin(p * Math.PI) * 60;
        ctx.fillStyle = "#FFD23F"; ctx.shadowColor = "#FFD23F"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(fx, fy, 9, 3, 0, 0, 6.29); ctx.fill(); ctx.shadowBlur = 0;
        if (p >= 1) flying = null;
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labCamping(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("⛺ 生火 / 看星", "amber");
    center.appendChild(b);
    var fire = 0, stars = 0, built = false;
    b.addEventListener("click", function () {
      if (!built) { built = true; setCaption(container, "帐篷搭好了，手机信号也没了——注意力残留强制清退。"); }
      else { fire = clamp(fire + 15, 0, 100); stars++; beep(300 + fire, 0.05, "sine", 0.04); setCaption(container, "火苗窜起来，副交感上线，皮质醇往下掉。"); }
      read.set([{ val: built ? "已搭" : "没搭", label: "帐篷", kind: "cyan" }, { val: Math.round(fire) + "%", label: "火堆", kind: "good" }, { val: stars, label: "数过的星", kind: "cyan" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h;
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0a1230"); g.addColorStop(1, "#1a2440"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (var i = 0; i < 30; i++) { var sx = (i * 53) % w, sy = (i * 97) % (h * 0.6); ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t / 700 + i)); ctx.fillRect(sx, sy, 2, 2); }
      ctx.globalAlpha = 1;
      if (built) { var tx = w * 0.3, ty = h * 0.7; ctx.fillStyle = "#FF8A3D"; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 30, ty + 30); ctx.lineTo(tx + 30, ty + 30); ctx.closePath(); ctx.fill(); }
      if (fire > 0) { var fx = w * 0.65, fy = h * 0.78; ctx.fillStyle = "rgba(255,140,60," + clamp(fire / 100, 0, 1) + ")"; var fh = 10 + fire / 100 * 20 + Math.sin(t / 150) * 4; ctx.beginPath(); ctx.ellipse(fx, fy - fh / 2, 8, fh / 2, 0, 0, 6.29); ctx.fill(); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  /* =======================================================
     怀旧实验：拍画片 / 踢毽子 / 跳皮筋 / 抽陀螺 / 弹珠 / 折纸飞机
     ======================================================= */
  function labPog(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🃏 拍一下", "amber");
    center.appendChild(b);
    var win = 0, slap = 0, flash = 0;
    b.addEventListener("click", function () {
      slap++;
      if (Math.random() < 0.5) { win++; flash = 1; beep(300, 0.05, "square", 0.06); setCaption(container, "脆响！翻过来了——变比率强化让你想再来一掌。"); }
      else { setCaption(container, "没翻过来，再一巴掌——不确定性才上头。"); }
      read.set([{ val: slap, label: "拍了", kind: "cyan" }, { val: win, label: "赢的", kind: "good" }, { val: (slap ? Math.round(win / slap * 100) : 0) + "%", label: "翻面率" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#cfcfe0"; ctx.fillRect(w * 0.5 - 22, h * 0.5 - 30, 44, 60);
      ctx.fillStyle = "#FF2E88"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("★", w * 0.5, h * 0.5 + 8);
      if (flash > 0) { flash -= 0.02; ctx.fillStyle = "rgba(0,229,160," + clamp(flash, 0, 1) + ")"; ctx.font = "bold 18px sans-serif"; ctx.fillText("翻!", w * 0.5, h * 0.5 - 40); }
      ctx.fillStyle = "rgba(255,138,61,0.85)"; ctx.fillRect(w * 0.5 - 10, h * 0.5 - 46 + Math.sin(t / 200) * 3, 20, 14);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labShuttlecock(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🪶 踢一脚", "cyan");
    center.appendChild(b);
    var keep = 0, drop = 0, air = 0;
    b.addEventListener("click", function () {
      if (Math.random() < 0.82) { keep++; air = 1; beep(440 + keep * 6, 0.05, "sine", 0.05); setCaption(container, "稳稳接住，连续第 " + keep + " 个——操作性条件反射把节奏接上了。"); }
      else { drop++; keep = 0; setCaption(container, "掉了，捡起来重数。童年就是这样一次次重来。"); }
      read.set([{ val: keep, label: "连续", kind: "good" }, { val: drop, label: "掉了", kind: "cyan" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var gy = h * 0.8; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      var ky = gy - 40 - (air > 0 ? Math.abs(Math.sin(t / 180)) * 30 : 0);
      ctx.fillStyle = "#FFD23F"; ctx.beginPath(); ctx.arc(w * 0.5, ky, 6, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#fff"; for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + t / 300; ctx.beginPath(); ctx.moveTo(w * 0.5, ky); ctx.lineTo(w * 0.5 + Math.cos(a) * 12, ky + Math.sin(a) * 12); ctx.stroke(); }
      if (air > 0) air -= 0.02;
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labRubberband(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🪢 跳一下", "cyan");
    center.appendChild(b);
    var n = 0, fail = 0;
    var rhyme = ["一二三四五六七", "马兰开花二十一", "二五六二五七"];
    b.addEventListener("click", function () {
      if (Math.random() < 0.8) { n++; beep(520, 0.05, "triangle", 0.05); setCaption(container, rhyme[n % 3] + "——节奏奖赏把杂念挡在门外。"); }
      else { fail++; n = 0; setCaption(container, "踩到皮筋了，笑着重来。"); }
      read.set([{ val: n, label: "连跳", kind: "good" }, { val: fail, label: "踩线", kind: "cyan" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var gy = h * 0.78;
      ctx.strokeStyle = "#FF2E88"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.2, gy); ctx.lineTo(w * 0.8, gy - Math.sin(t / 400) * 20); ctx.stroke();
      ctx.fillStyle = "#00E5FF"; ctx.beginPath(); ctx.arc(w * 0.2, gy, 7, 0, 6.29); ctx.fill(); ctx.beginPath(); ctx.arc(w * 0.8, gy, 7, 0, 6.29); ctx.fill();
      var jy = gy - 50 - Math.abs(Math.sin(t / 200)) * 24;
      ctx.fillStyle = "#FF8A3D"; ctx.beginPath(); ctx.arc(w * 0.5, jy, 8, 0, 6.29); ctx.fill();
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labTop(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🌀 抽一鞭", "amber");
    center.appendChild(b);
    var spin = 0, best = 0;
    b.addEventListener("click", function () {
      spin += rand(40, 90); if (spin > best) best = Math.round(spin); beep(200, 0.06, "sawtooth", 0.05);
      setCaption(container, "鞭子一甩，嗡——陀螺转得越久你越得意。");
      read.set([{ val: Math.round(spin) + "°/s", label: "转速", kind: "cyan" }, { val: best + "°/s", label: "最久", kind: "good" }]);
    });
    var ang = 0;
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var gy = h * 0.72; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      ang += spin / 60; if (spin > 0) spin -= 0.4; if (spin < 0) spin = 0;
      var cx = w * 0.5, cy = gy - 14;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = "#FF8A3D"; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#FFD23F"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.29); ctx.stroke();
      ctx.restore();
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labMarbles(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("🔵 弹一颗", "amber");
    center.appendChild(b);
    var win = 0, shoot = 0, flash = 0, fx = 0, fy = 0;
    b.addEventListener("click", function () {
      shoot++;
      if (Math.random() < 0.45) { win++; flash = 1; fx = mc.dims.w * 0.6; fy = mc.dims.h * 0.6; beep(700, 0.06, "sine", 0.05); setCaption(container, "进坑了！赢来的珠子归你——变比率强化让你想再弹一颗。"); }
      else { setCaption(container, "擦边没进，调整角度再来。"); }
      read.set([{ val: shoot, label: "弹了", kind: "cyan" }, { val: win, label: "赢的", kind: "good" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var gx = w * 0.6, gy = h * 0.6;
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, 14, 0, 6.29); ctx.stroke();
      var cols = ["#FF2E88", "#00E5FF", "#FFD23F", "#fff"];
      cols.forEach(function (c, i) { var a = t / 900 + i; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w * 0.3 + Math.cos(a) * 20, h * 0.6 + Math.sin(a) * 14, 7, 0, 6.29); ctx.fill(); });
      if (flash > 0) { flash -= 0.03; ctx.strokeStyle = "rgba(0,229,160," + clamp(flash, 0, 1) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx, fy, 18, 0, 6.29); ctx.stroke(); }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function labPaperplane(container) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn("✈️ 掷一架", "cyan");
    center.appendChild(b);
    var best = 0, flying = null;
    b.addEventListener("click", function () {
      if (flying) return;
      var d = Math.round(rand(3, 12) * 10) / 10; flying = { p: 0, d: d }; if (d > best) best = d;
      beep(500, 0.05, "sine", 0.05);
      setCaption(container, "哈口气，松手——它滑了 " + d + " 米。我造的东西会飞，成就感拉满。");
      read.set([{ val: d + "m", label: "这架", kind: "cyan" }, { val: best + "m", label: "最远", kind: "good" }]);
    });
    var lp = loop(function (t) {
      var ctx = mc.dims.ctx, w = mc.dims.w, h = mc.dims.h; ctx.clearRect(0, 0, w, h);
      var gy = h * 0.5;
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      if (flying) {
        flying.p += 0.02; var p = flying.p;
        var px = lerp(w * 0.1, w * 0.9, p), py = gy - Math.sin(p * Math.PI) * 60;
        ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 8;
        ctx.save(); ctx.translate(px, py); ctx.rotate(-Math.sin(p * Math.PI) * 0.6);
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(16, 0); ctx.lineTo(0, 8); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
        ctx.restore(); ctx.shadowBlur = 0;
        if (p >= 1) flying = null;
      }
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

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
    coffee: { init: labCoffee },
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
    axolotl: { init: labAxolotl },

    /* 社交桌游 */
    werewolf: { init: labWerewolf },
    jubensha: { init: labJubensha },
    mahjong: { init: labMahjong },
    cards: { init: labCards },
    hiking: { init: labHiking },
    perler: { init: labPerler },

    /* 补充：让全部条目都有实验 */
    podcast: { init: labPodcast },
    craft: { init: labCraft },
    homecook: { init: labHomecook },
    origami: { init: labOrigami },
    meditation: { init: labMeditation },
    jigsaw: { init: labJigsaw },

    /* 拓展：钓鱼 / 射箭 / 室内·室外·高空·低空 */
    fishing: { init: labFishing },
    archery: { init: labArchery },
    skateboard: { init: labSkateboard },
    ski: { init: labSki },
    surf: { init: labSurf },
    climbing: { init: labClimbing },
    skydive: { init: labSkydive },
    billiards: { init: labBilliards },
    frisbee: { init: labFrisbee },
    camping: { init: labCamping },

    /* 怀旧：上个世纪的玩法 */
    pog: { init: labPog },
    shuttlecock: { init: labShuttlecock },
    rubberband: { init: labRubberband },
    top: { init: labTop },
    marbles: { init: labMarbles },
    paperplane: { init: labPaperplane }
  };

  /* =======================================================
     通用实验工厂：为未单独编写实验的条目生成轻量互动
     cfg = { emoji, btn, cls, scene, init(), play(state,b) -> {caption, readout, sound} }
     ======================================================= */
  function genericLab(container, cfg) {
    var mc = makeCanvas(container);
    var center = makeCenter(container);
    var read = makeReadout(container);
    var b = btn(cfg.btn || "玩一下", cfg.cls || "cyan");
    center.appendChild(b);
    var state = cfg.init ? cfg.init() : {};
    b.addEventListener("click", function () {
      var res = cfg.play(state, b);
      if (res.caption) setCaption(container, res.caption);
      if (res.readout) read.set(res.readout);
      if (res.sound) beep(res.sound[0], res.sound[1], res.sound[2], res.sound[3]);
    });
    var lp = loop(function (t) {
      if (cfg.draw) cfg.draw(mc.dims.ctx, mc.dims.w, mc.dims.h, t, state, b);
      else defaultLabDraw(mc.dims.ctx, mc.dims.w, mc.dims.h, t, cfg, state);
    });
    lp.start();
    return { destroy: function () { lp.stop(); if (mc.ro) mc.ro.disconnect(); } };
  }

  function defaultLabDraw(ctx, w, h, t, cfg, state) {
    var bg = SCENE_BG[cfg.scene || "dark"] || SCENE_BG.dark;
    var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (cfg.scene === "ground" || cfg.scene === "water") {
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.moveTo(0, h * 0.8); ctx.lineTo(w, h * 0.8); ctx.stroke();
    }
    if (cfg.scene === "water") {
      ctx.strokeStyle = "rgba(0,229,255,0.18)"; ctx.lineWidth = 2;
      for (var j = 0; j < 3; j++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 12) { var y = h * (0.4 + j * 0.15) + Math.sin(x / 40 + t / 500 + j) * 6; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
    if (cfg.scene === "night") {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (var i = 0; i < 30; i++) { var sx = (i * 53) % w, sy = (i * 97) % (h * 0.6); ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t / 700 + i)); ctx.fillRect(sx, sy, 2, 2); }
      ctx.globalAlpha = 1;
    }
    var bob = Math.sin(t / 380) * 6;
    ctx.font = "42px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(cfg.emoji || "✨", w * 0.5, h * 0.45 + bob);
    if (cfg.decor) cfg.decor(ctx, w, h, t, state);
  }

  var SCENE_BG = {
    sky: ["#0a1530", "#27406b"],
    water: ["#06303f", "#04222e"],
    ground: ["#13241a", "#1d3326"],
    indoor: ["#1a1530", "#26204a"],
    night: ["#070b1c", "#141d3a"],
    dark: ["#0a0f1f", "#0f1530"]
  };

  var CFG = {
    paragliding: { emoji: "🪂", btn: "🪂 起飞", cls: "amber", scene: "sky",
      init: function () { return { flights: 0, best: 0 }; },
      play: function (s) { s.flights++; var alt = Math.round(rand(800, 2500)); if (alt > s.best) s.best = alt; return { caption: "借着一阵风离地，" + alt + " 米高的安静你试过吗。", readout: [{ val: s.flights, label: "飞行", kind: "cyan" }, { val: s.best + "m", label: "最高", kind: "good" }], sound: [300, 0.08, "sine", 0.05] }; } },
    balloon: { emoji: "🎈", btn: "🎈 点火升空", cls: "amber", scene: "sky",
      init: function () { return { ascents: 0 }; },
      play: function (s) { s.ascents++; return { caption: "火苗一窜，篮子缓缓离地——慢到极致的飞行最治愈。", readout: [{ val: s.ascents, label: "升空", kind: "good" }], sound: [260, 0.1, "sine", 0.05] }; } },
    coaster: { emoji: "🎢", btn: "🎢 冲一圈", cls: "amber", scene: "ground",
      init: function () { return { rides: 0 }; },
      play: function (s) { s.rides++; return { caption: "爬到最高点那两秒最爽，俯冲时尖叫就完了。", readout: [{ val: s.rides, label: "圈数", kind: "good" }], sound: [880, 0.05, "square", 0.06] }; } },
    gokart: { emoji: "🏎️", btn: "🏎️ 踩油门", cls: "cyan", scene: "ground",
      init: function () { return { laps: 0, best: 99 }; },
      play: function (s) { s.laps++; var tt = Math.round(rand(28, 55)); if (tt < s.best) s.best = tt; return { caption: "贴地飞行，" + tt + " 秒一圈，方向盘比人生靠谱。", readout: [{ val: s.laps, label: "圈数", kind: "cyan" }, { val: s.best + "s", label: "最快", kind: "good" }], sound: [440, 0.05, "sawtooth", 0.05] }; } },
    kite: { emoji: "🪁", btn: "🪁 放起来", cls: "cyan", scene: "sky",
      init: function () { return { up: 0 }; },
      play: function (s) { s.up++; return { caption: "迎风小跑，线一绷紧它就上天了。", readout: [{ val: s.up, label: "放飞", kind: "good" }], sound: [520, 0.05, "triangle", 0.04] }; } },
    rafting: { emoji: "🛶", btn: "🛶 划一段", cls: "cyan", scene: "water",
      init: function () { return { runs: 0 }; },
      play: function (s) { s.runs++; return { caption: "浪把你按进水里又抛起来，狼狈也上头。", readout: [{ val: s.runs, label: "漂程", kind: "cyan" }], sound: [360, 0.06, "sine", 0.05] }; } },
    lego: { emoji: "🧱", btn: "🧱 拼一块", cls: "amber", scene: "indoor",
      init: function () { return { pieces: 0, done: 0 }; },
      play: function (s) { s.pieces += Math.round(rand(20, 200)); if (Math.random() < 0.25) s.done++; return { caption: "一块块拼上去，图纸慢慢变成实物。", readout: [{ val: s.pieces, label: "积木数", kind: "cyan" }, { val: s.done, label: "完成", kind: "good" }], sound: [700, 0.04, "square", 0.04] }; } },
    karaoke: { emoji: "🎤", btn: "🎤 唱一首", cls: "amber", scene: "indoor",
      init: function () { return { songs: 0 }; },
      play: function (s) { s.songs++; var sc = Math.round(rand(70, 99)); return { caption: "关上门你是唯一主唱，这遍唱到 " + sc + " 分。", readout: [{ val: s.songs, label: "首数", kind: "cyan" }, { val: sc, label: "评分", kind: "good" }], sound: [600, 0.05, "sine", 0.05] }; } },
    reading: { emoji: "📚", btn: "📚 翻几页", cls: "cyan", scene: "indoor",
      init: function () { return { pages: 0 }; },
      play: function (s) { s.pages += Math.round(rand(5, 30)); return { caption: "陷进沙发，又读了 " + s.pages + " 页。", readout: [{ val: s.pages, label: "页数", kind: "cyan" }], sound: [400, 0.04, "sine", 0.04] }; } },
    darts: { emoji: "🎯", btn: "🎯 投一镖", cls: "amber", scene: "indoor",
      init: function () { return { thr: 0, hit: 0 }; },
      play: function (s) { s.thr++; var ok = Math.random() < 0.5; if (ok) s.hit++; return { caption: ok ? "扎进红心！" : "擦边，再来一镖。", readout: [{ val: s.thr, label: "出手", kind: "cyan" }, { val: s.hit, label: "命中", kind: "good" }], sound: [700, 0.05, "sine", 0.05] }; } },
    plants: { emoji: "🪴", btn: "🪴 浇次水", cls: "cyan", scene: "indoor",
      init: function () { return { water: 0, grow: 0 }; },
      play: function (s) { s.water++; if (Math.random() < 0.3) s.grow++; return { caption: "少浇点，它默默长了一片新叶。", readout: [{ val: s.water, label: "浇水", kind: "cyan" }, { val: s.grow, label: "新叶", kind: "good" }], sound: [300, 0.04, "sine", 0.03] }; } },
    picnic: { emoji: "🧺", btn: "🧺 铺开", cls: "cyan", scene: "ground",
      init: function () { return { trips: 0 }; },
      play: function (s) { s.trips++; return { caption: "把吃的铺在草地上，普通三明治都香了。", readout: [{ val: s.trips, label: "出摊", kind: "good" }], sound: [500, 0.05, "triangle", 0.04] }; } },
    beach: { emoji: "🦀", btn: "🦀 翻石头", cls: "cyan", scene: "water",
      init: function () { return { catches: 0 }; },
      play: function (s) { s.catches++; return { caption: "退潮的滩涂是个免费盲盒，这波收获 " + s.catches + " 件。", readout: [{ val: s.catches, label: "战利品", kind: "good" }], sound: [420, 0.05, "sine", 0.04] }; } },
    stargaze: { emoji: "🔭", btn: "🔭 看一会", cls: "cyan", scene: "night",
      init: function () { return { seen: 0 }; },
      play: function (s) { s.seen++; return { caption: "抬头那刻发愁的事变小了，又认出 " + s.seen + " 个星座。", readout: [{ val: s.seen, label: "星座", kind: "good" }], sound: [330, 0.05, "sine", 0.04] }; } },
    skip: { emoji: "💧", btn: "💧 甩出去", cls: "cyan", scene: "water",
      init: function () { return { throws: 0, best: 0, total: 0 }; },
      play: function (s) { s.throws++; var n = Math.random() < 0.18 ? 0 : 1 + Math.floor(Math.pow(Math.random(), 1.8) * 11); s.total += n; if (n > s.best) s.best = n; var cap = n === 0 ? "直接沉了——换块更扁的石头。" : (n >= 8 ? "哗啦啦连跳 " + n + " 下！这把能吹一年。" : "在水面跳了 " + n + " 下，水花清脆。"); return { caption: cap, readout: [{ val: s.throws, label: "出手", kind: "cyan" }, { val: s.best, label: "最佳连跳", kind: "good" }], sound: [n === 0 ? 200 : 560, 0.05, "sine", 0.04] }; } },
    walk: { emoji: "🚶", btn: "🚶 走一圈", cls: "cyan", scene: "ground",
      init: function () { return { steps: 0, best: 0 }; },
      play: function (s) { var st = Math.round(rand(800, 2600)); s.steps += st; if (st > s.best) s.best = st; return { caption: "绕着小区走了一圈，脑子忽然通了。", readout: [{ val: s.steps, label: "累计步数", kind: "cyan" }, { val: s.best, label: "单圈最多", kind: "good" }], sound: [400, 0.05, "sine", 0.04] }; } },
    rope: { emoji: "🪢", btn: "🪢 跳一组", cls: "amber", scene: "indoor",
      init: function () { return { jumps: 0, best: 0 }; },
      play: function (s) { var j = Math.round(rand(20, 130)); s.jumps += j; if (j > s.best) s.best = j; return { caption: "绳子打地节奏一稳，连跳了 " + j + " 下没断。", readout: [{ val: s.jumps, label: "累计跳", kind: "cyan" }, { val: s.best, label: "最长连跳", kind: "good" }], sound: [520, 0.05, "triangle", 0.04] }; } },
    tabletennis: { emoji: "🏓", btn: "🏓 打一局", cls: "amber", scene: "indoor",
      init: function () { return { rally: 0, win: 0 }; },
      play: function (s) { s.rally++; var w = Math.random() < 0.5; if (w) s.win++; return { caption: w ? "一拍抽杀得分！" : "搓球下网，再来一球。", readout: [{ val: s.rally, label: "回合数", kind: "cyan" }, { val: s.win, label: "得分", kind: "good" }], sound: [700, 0.05, "sine", 0.05] }; } },
    football: { emoji: "⚽", btn: "⚽ 踢一场", cls: "cyan", scene: "ground",
      init: function () { return { kick: 0, goals: 0 }; },
      play: function (s) { s.kick++; var g = Math.random() < 0.3; if (g) s.goals++; return { caption: g ? "弧线球钻进死角，进了！" : "打在门将怀里，再补一脚。", readout: [{ val: s.kick, label: "出脚", kind: "cyan" }, { val: s.goals, label: "进球", kind: "good" }], sound: [440, 0.05, "sawtooth", 0.05] }; } },
    tennis: { emoji: "🎾", btn: "🎾 挥两拍", cls: "cyan", scene: "ground",
      init: function () { return { rally: 0, ace: 0 }; },
      play: function (s) { s.rally++; var a = Math.random() < 0.25; if (a) s.ace++; return { caption: a ? "发球直接得分（ACE）！" : "底线对拉 5 拍，汗下来了。", readout: [{ val: s.rally, label: "对拉", kind: "cyan" }, { val: s.ace, label: "ACE", kind: "good" }], sound: [600, 0.05, "sine", 0.05] }; } },
    hoop: { emoji: "⚪", btn: "⚪ 推一段", cls: "cyan", scene: "ground",
      init: function () { return { dist: 0 }; },
      play: function (s) { s.dist += Math.round(rand(20, 80)); return { caption: "铁钩一推，铁圈咕噜咕噜跟了你 " + s.dist + " 米。", readout: [{ val: s.dist + "m", label: "距离", kind: "good" }], sound: [380, 0.05, "sawtooth", 0.04] }; } },
    hopscotch: { emoji: "⬛", btn: "⬛ 跳一轮", cls: "cyan", scene: "ground",
      init: function () { return { rounds: 0 }; },
      play: function (s) { s.rounds++; return { caption: "单脚跳捡瓦片，又连跳了 " + s.rounds + " 轮。", readout: [{ val: s.rounds, label: "轮", kind: "good" }], sound: [520, 0.05, "triangle", 0.04] }; } },
    beanbag: { emoji: "🎯", btn: "🎯 躲一下", cls: "amber", scene: "ground",
      init: function () { return { dodges: 0 }; },
      play: function (s) { s.dodges++; return { caption: "左躲右闪，惊险躲过 " + s.dodges + " 发。", readout: [{ val: s.dodges, label: "躲过", kind: "good" }], sound: [440, 0.05, "sine", 0.04] }; } },
    stones: { emoji: "🪨", btn: "🪨 抓一把", cls: "cyan", scene: "indoor",
      init: function () { return { ok: 0, drop: 0 }; },
      play: function (s) { var got = Math.random() < 0.8; if (got) s.ok++; else s.drop++; return { caption: got ? "稳稳接住，连续 " + s.ok + " 次。" : "漏了，重来。", readout: [{ val: s.ok, label: "接住", kind: "good" }, { val: s.drop, label: "掉", kind: "cyan" }], sound: [600, 0.04, "square", 0.04] }; } },
    stringfig: { emoji: "🧵", btn: "🧵 翻一下", cls: "cyan", scene: "indoor",
      init: function () { return { moves: 0 }; },
      play: function (s) { s.moves++; return { caption: "十指翻绕，又变出一个花样（第 " + s.moves + " 个）。", readout: [{ val: s.moves, label: "花样", kind: "good" }], sound: [500, 0.04, "triangle", 0.04] }; } },
    cockfight: { emoji: "🐔", btn: "🐔 顶一下", cls: "amber", scene: "ground",
      init: function () { return { win: 0, lose: 0 }; },
      play: function (s) { var w = Math.random() < 0.6; if (w) s.win++; else s.lose++; return { caption: w ? "膝盖一顶，对方先落地！" : "被顶倒了，换条腿再来。", readout: [{ val: s.win, label: "赢", kind: "good" }, { val: s.lose, label: "输", kind: "cyan" }], sound: [300, 0.06, "square", 0.05] }; } },
    eaglechick: { emoji: "🐥", btn: "🐥 追一下", cls: "amber", scene: "ground",
      init: function () { return { caught: 0, escaped: 0 }; },
      play: function (s) { var c = Math.random() < 0.5; if (c) s.caught++; else s.escaped++; return { caption: c ? "逮到最后那只小鸡！" : "又让小鸡溜了。", readout: [{ val: s.caught, label: "抓到", kind: "good" }, { val: s.escaped, label: "逃脱", kind: "cyan" }], sound: [440, 0.05, "sine", 0.04] }; } },
    hideseek: { emoji: "🫥", btn: "🫥 找一下", cls: "cyan", scene: "ground",
      init: function () { return { found: 0, hidden: 0 }; },
      play: function (s) { var f = Math.random() < 0.5; if (f) s.found++; else s.hidden++; return { caption: f ? "数到一百，把你揪出来了！" : "屏住呼吸，没被找到。", readout: [{ val: s.found, label: "找到", kind: "good" }, { val: s.hidden, label: "藏住", kind: "cyan" }], sound: [380, 0.05, "sine", 0.04] }; } },
    cards90: { emoji: "🍜", btn: "🍜 拆一包", cls: "amber", scene: "indoor",
      init: function () { return { packs: 0, got: 0 }; },
      play: function (s) { s.packs++; var ng = Math.random() < 0.4; if (ng) s.got++; return { caption: ng ? "拆开干脆面先摸卡，这包抽到新卡！" : "拆开干脆面先摸卡，这包重复的。", readout: [{ val: s.packs, label: "拆包", kind: "cyan" }, { val: s.got, label: "新卡", kind: "good" }], sound: [700, 0.04, "square", 0.04] }; } },
    comic: { emoji: "📖", btn: "📖 读一本", cls: "cyan", scene: "indoor",
      init: function () { return { books: 0 }; },
      play: function (s) { s.books++; return { caption: "蹲在书摊又看完一本（第 " + s.books + " 本）。", readout: [{ val: s.books, label: "本数", kind: "good" }], sound: [400, 0.04, "sine", 0.03] }; } },
    snowball: { emoji: "❄️", btn: "❄️ 砸一发", cls: "cyan", scene: "ground",
      init: function () { return { hit: 0, hitme: 0 }; },
      play: function (s) { var hd = Math.random() < 0.6; if (hd) s.hit++; else s.hitme++; return { caption: hd ? "雪球正中后背！" : "被砸了，反击！", readout: [{ val: s.hit, label: "砸中", kind: "good" }, { val: s.hitme, label: "被砸", kind: "cyan" }], sound: [520, 0.05, "sine", 0.04] }; } },
    firecracker: { emoji: "🧨", btn: "🧨 点一个", cls: "amber", scene: "ground",
      init: function () { return { bang: 0 }; },
      play: function (s) { s.bang++; return { caption: "点着引信撒腿跑，啪——第 " + s.bang + " 声。", readout: [{ val: s.bang, label: "响声", kind: "good" }], sound: [120, 0.08, "square", 0.07] }; } }
  };
  Object.keys(CFG).forEach(function (k) { window.GUIDE_LABS[k] = { init: function (c) { return genericLab(c, CFG[k]); } }; });
})();
