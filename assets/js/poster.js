/* =========================================================
   半日闲 · 分享海报生成（复用 persona.js 的赛博霓虹视觉）
   对外：window.GUIDE_POSTER.open(cfg)
   cfg = { kicker, emoji, title, sub, lines:[], tags:[], footer }
   点击后弹出预览层，可 保存图片 / 复制图片 / 系统分享（移动端）
   零依赖纯静态，file:// 下完整可用。
   ========================================================= */
(function () {
  "use strict";

  var FONT = '"Source Han Sans SC","PingFang SC","Microsoft YaHei",system-ui,-apple-system,"Segoe UI",sans-serif';
  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",' + FONT;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
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

  // 生成 750×1120 的海报画布（与今日签同款版式）
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

  function saveCanvas(cv, name) {
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

  function toBlob(cv, cb) {
    if (cv.toBlob) cv.toBlob(cb, "image/png");
    else {
      var data = cv.toDataURL("image/png");
      var bin = atob(data.split(",")[1]); var len = bin.length;
      var arr = new Uint8Array(len); for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
      cb(new Blob([arr], { type: "image/png" }));
    }
  }

  var overlay = null, lastCv = null, lastName = "banrixian.png", prevOverflow = "";

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "poster-modal";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="poster-backdrop" data-pclose></div>' +
      '<div class="poster-card">' +
        '<div class="poster-preview"><img id="poster-img" alt="分享海报"></div>' +
        '<div class="poster-actions">' +
          '<button type="button" class="poster-btn save">💾 保存图片</button>' +
          '<button type="button" class="poster-btn copy">📋 复制图片</button>' +
          '<button type="button" class="poster-btn share" hidden>📤 系统分享</button>' +
          '<button type="button" class="poster-btn close" data-pclose>✕ 关闭</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) {
      if (e.target.getAttribute("data-pclose") !== null) hide();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay && !overlay.hidden) {
        e.preventDefault(); e.stopPropagation(); hide();
      }
    }, true);
    overlay.querySelector(".poster-btn.save").addEventListener("click", function () {
      if (lastCv) saveCanvas(lastCv, lastName);
    });
    overlay.querySelector(".poster-btn.copy").addEventListener("click", function () {
      copyImage(this);
    });
    overlay.querySelector(".poster-btn.share").addEventListener("click", function () {
      shareImage();
    });
    return overlay;
  }

  function hide() {
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = prevOverflow;
  }

  function flash(btn, txt) {
    if (!btn) return;
    var o = btn.textContent; btn.textContent = txt;
    setTimeout(function () { btn.textContent = o; }, 1600);
  }

  function copyImage(btn) {
    if (!lastCv || !lastCv.toBlob || !navigator.clipboard || !window.ClipboardItem) {
      flash(btn, "请右键 / 长按保存"); return;
    }
    toBlob(lastCv, function (b) {
      navigator.clipboard.write([new ClipboardItem({ "image/png": b })])
        .then(function () { flash(btn, "已复制 ✓"); })
        .catch(function () { flash(btn, "复制失败，请保存"); });
    });
  }

  function shareImage() {
    if (!lastCv || !navigator.share) { flash(null, ""); return; }
    toBlob(lastCv, function (b) {
      var file = new File([b], lastName, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "半日闲", text: "今天也在好好虚度 ✨" }).catch(function () {});
      } else {
        navigator.share({ title: "半日闲", text: "今天也在好好虚度 ✨" }).catch(function () {});
      }
    });
  }

  function open(cfg) {
    var cv = makePoster(cfg);
    lastCv = cv;
    lastName = "半日闲-" + (cfg.title || "poster") + ".png";
    var ov = ensureOverlay();
    ov.querySelector("#poster-img").src = cv.toDataURL("image/png");
    var shareBtn = ov.querySelector(".poster-btn.share");
    shareBtn.hidden = !(navigator.share && navigator.canShare);
    ov.hidden = false;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  window.GUIDE_POSTER = { open: open };
})();
