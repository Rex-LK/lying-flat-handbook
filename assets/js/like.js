/* =========================================================
   点赞功能 · 真实全局计数（第三方 BaaS：Supabase）
   ---------------------------------------------------------
   零依赖：直接调 Supabase REST API，无需引入任何 SDK。
   全部经典脚本（无 module / 无 fetch 之外的依赖），file:// 下也能跑。

   【一次性配置步骤】
     1. 注册 https://supabase.com （免费层即可；国内慢可在建项目时选新加坡区域）
     2. 打开 SQL Editor，粘贴本文件底部「Supabase SQL」整段执行
     3. 把下面两个常量填上你的项目配置：
          - SUPABASE_URL      ：项目 URL，形如 https://abcd1234.supabase.co
          - SUPABASE_ANON_KEY ：Project Settings → API → anon public key（可公开，放前端安全）

   【安全说明】anon key 本就可公开。真正的写权限靠 RLS 策略锁定：
     匿名只能 SELECT 计数、EXECUTE increment_like（函数内 security definer 代写库），
     不能直接 INSERT/UPDATE 表，避免被任意篡改。

   【防刷/去重】本机用 localStorage 记已赞 id，禁止同一浏览器重复 +1；
     服务端无用户标识，故不防跨设备刷量——小站点够用，要更严格可加后端签名。
   ========================================================= */
(function () {
  "use strict";

  // ↓↓↓↓↓ 在这里填你自己的 Supabase 配置 ↓↓↓↓↓
  var SUPABASE_URL = "";        // 例如 https://abcd1234.supabase.co
  var SUPABASE_ANON_KEY = "";   // Project Settings → API → anon public
  // ↑↑↑↑↑

  var TABLE = "likes";
  var LS_KEY = "lfh_liked_v1";

  function loadLiked() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveLiked(map) { localStorage.setItem(LS_KEY, JSON.stringify(map)); }

  var LikeStore = {
    configured: function () { return !!(SUPABASE_URL && SUPABASE_ANON_KEY); },

    hasLiked: function (id) { return !!loadLiked()[id]; },
    _mark: function (id) { var m = loadLiked(); m[id] = 1; saveLiked(m); },
    _unmark: function (id) { var m = loadLiked(); delete m[id]; saveLiked(m); },

    _headers: function () {
      return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
    },

    // 批量拉取计数：ids -> { item_id: count }
    hydrate: function (ids, cb) {
      cb = cb || function () {};
      if (!this.configured() || !ids.length) { cb({}); return; }
      var url = SUPABASE_URL + "/rest/v1/" + TABLE +
        "?select=item_id,count&item_id=in.(" + ids.map(encodeURIComponent).join(",") + ")";
      fetch(url, { headers: this._headers() })
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          var map = {};
          (rows || []).forEach(function (r) { map[r.item_id] = r.count; });
          cb(map);
        })
        .catch(function () { cb({}); });
    },

    // 点赞自增，回调返回最新计数（失败返回 null）
    like: function (id, cb) {
      cb = cb || function () {};
      if (!this.configured()) { cb(null); return; }
      var url = SUPABASE_URL + "/rest/v1/rpc/increment_like";
      fetch(url, {
        method: "POST",
        headers: this._headers(),
        body: JSON.stringify({ p_item: id })
      })
        .then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); })
        .then(function (data) {
          var c = (typeof data === "number") ? data : (data && data.count != null ? data.count : null);
          cb(c);
        })
        .catch(function () { cb(null); });
    }
  };

  window.LikeStore = LikeStore;

  // 轻量居中提示（未配置 / 网络失败时点有用）
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

/*
  ===== Supabase SQL（整段粘贴到 SQL Editor 执行）=====
  create table if not exists public.likes (
    item_id text primary key,
    count   int4 not null default 0
  );

  alter table public.likes enable row level security;

  drop policy if exists "anon read likes" on public.likes;
  create policy "anon read likes" on public.likes
    for select using (true);

  create or replace function public.increment_like(p_item text)
  returns int4
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare new_count int4;
  begin
    insert into public.likes (item_id, count) values (p_item, 1)
    on conflict (item_id) do update set count = public.likes.count + 1
    returning count into new_count;
    return new_count;
  end;
  $$;

  grant execute on function public.increment_like(text) to anon, authenticated;
  grant select on public.likes to anon, authenticated;
  ====================================================
*/
