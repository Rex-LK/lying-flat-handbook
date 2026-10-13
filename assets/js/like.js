/* =========================================================
   点赞功能 · 真实全局计数（Edge One 边缘函数 + KV）
   ---------------------------------------------------------
   零前端依赖：浏览器只调同源接口 /api/like（GET 查 / POST 增），
   真正的计数存在 Edge One 边缘 KV 里，由边缘函数读写。
   全部经典脚本（无 module / 无 fetch 之外的依赖），file:// 下也能跑。

   【前端配置】一般不用改：
     - 主站部署在 Edge One 域名 → API_BASE 留空，直接用同源 /api/like
     - 也想让 Git Pages 域名能用 → 把 API_BASE 填成你的 Edge One 站点地址
       （如 https://lfh.example.com），边缘函数已返回 CORS 头

   【边缘函数】见仓库 edge/like-worker.js，按 Edge One 控制台文档
   创建函数 + 一个 KV 命名空间（变量名 LIKE_KV），绑定到路由 /api/like。

   【安全/防刷】前端无密钥；本机用 localStorage 防同一浏览器重复 +1，
   服务端无用户标识，不防跨设备刷量（小站点够用，要严可加签名）。
   ========================================================= */
(function () {
  "use strict";

  // 点赞接口基址：留空 = 同源相对路径（部署在 Edge One 域名时直接可用）
  var API_BASE = "";
  var LS_KEY = "lfh_liked_v1";

  function loadLiked() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveLiked(m) { localStorage.setItem(LS_KEY, JSON.stringify(m)); }

  function req(path, opts) { return fetch((API_BASE || "") + path, opts || {}); }

  var LikeStore = {
    configured: function () { return true; }, // 边缘函数存在即可用；未部署时请求失败会自动降级

    hasLiked: function (id) { return !!loadLiked()[id]; },
    _mark: function (id) { var m = loadLiked(); m[id] = 1; saveLiked(m); },
    _unmark: function (id) { var m = loadLiked(); delete m[id]; saveLiked(m); },

    // 批量拉取计数：ids -> { id: count }
    hydrate: function (ids, cb) {
      cb = cb || function () {};
      if (!ids.length) { cb({}); return; }
      req("/api/like?ids=" + ids.map(encodeURIComponent).join(","))
        .then(function (r) { return r.json(); })
        .then(function (map) { cb(map && typeof map === "object" ? map : {}); })
        .catch(function () { cb({}); });
    },

    // 点赞自增，回调返回最新计数（失败返回 null）
    like: function (id, cb) {
      cb = cb || function () {};
      req("/api/like?id=" + encodeURIComponent(id), { method: "POST" })
        .then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); })
        .then(function (d) { cb(d && typeof d.count === "number" ? d.count : null); })
        .catch(function () { cb(null); });
    }
  };

  window.LikeStore = LikeStore;

  // 轻量居中提示（未部署函数 / 网络失败时点有用）
  window.toast = function (msg) {
    var el = document.getElementById("lfh-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "lfh-toast";
      el.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);" +
        "background:rgba(20,22,32,.95);color:#fff;padding:10px 18px;border-radius:999px;" +
        "border:1px solid rgba(255,46,136,.4);box-shadow:0 0 24px rgba(255,46,136,.3);" +
        "font-size:13px;z-index:9999;opacity:0;transition:opacity .25s;pointer-events:none;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = "0"; }, 2200);
  };
})();
