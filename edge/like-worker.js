/**
 * EdgeOne 边缘函数 · 点赞计数
 * -------------------------------------------------------------
 * 部署步骤（在 EdgeOne 控制台）：
 *   1. 创建「KV 存储」命名空间（如 like-kv）
 *   2. 创建「边缘函数」，运行时选 JavaScript，把本文件内容粘贴进去
 *   3. 在函数配置里把第 1 步的 KV 绑定到变量名 LIKE_KV
 *   4. 触发规则：把 /api/like* 路由指向这个函数（「边缘函数」里绑定路径 /api/like）
 *
 * 接口约定（前端就是这么调用的）：
 *   GET  /api/like?ids=a,b,c        -> { a: 3, b: 1, c: 0 }   批量查
 *   GET  /api/like?id=a             -> { count: 3 }           单条查
 *   POST /api/like?id=a             -> { count: 4 }           自增并返回新值
 *
 * 注意：EdgeOne 边缘函数 / KV 的入口与绑定写法可能随控制台版本变化，
 *       下方采用 Service Worker 风格（addEventListener('fetch')）。
 *       若你的环境是 ES Module 风格（export default { fetch(req, env){...} }），
 *       把 LIKE_KV 改成 env.LIKE_KV，并把函数体包进 export default 即可。
 */

addEventListener('fetch', function (event) {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  var cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  var url = new URL(request.url);
  var id = url.searchParams.get('id');
  var ids = url.searchParams.get('ids');

  // 批量查询
  if (ids) {
    var list = ids.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var out = {};
    await Promise.all(list.map(async function (k) {
      var v = await LIKE_KV.get(k);
      out[k] = v == null ? 0 : (parseInt(v, 10) || 0);
    }));
    return new Response(JSON.stringify(out), { headers: cors });
  }

  // 单条查询
  if (id && request.method === 'GET') {
    var vv = await LIKE_KV.get(id);
    return new Response(JSON.stringify({ count: vv == null ? 0 : (parseInt(vv, 10) || 0) }), { headers: cors });
  }

  // 自增
  if (id && request.method === 'POST') {
    var cur = parseInt(await LIKE_KV.get(id) || '0', 10);
    if (isNaN(cur)) cur = 0;
    cur += 1;
    await LIKE_KV.put(id, String(cur));
    return new Response(JSON.stringify({ count: cur }), { headers: cors });
  }

  return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: cors });
}
