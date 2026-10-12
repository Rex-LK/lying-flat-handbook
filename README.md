# 人生浪费指南 · 躺平研究所

一份面向普通人的轻松科普网站：把当代人最常见的「好玩行为」和「好吃的东西」逐条拆解，
讲清楚它们到底**爽在哪个机制上**，并给每条打上可检索的机制标签。每个条目配一个
**鼠标点击即可运行**的原生互动小实验，用动画直观演示该机制。

零构建、零运行时依赖，clone 下来双击 `index.html` 就能看，也能直接部署到 GitHub Pages。

[![在线体验](https://img.shields.io/badge/在线体验-GitHub%20Pages-00e5ff?style=for-the-badge&logo=github)](https://rex-lk.github.io/lying-flat-handbook/)

🔗 **点这里直接体验 → <https://rex-lk.github.io/lying-flat-handbook/>**

## ✨ 特性

- **32 个条目**：好玩类（熬夜刷剧 / 开盲盒 / 撸猫 / 再来一局 / 摸鱼 / 刷短视频 / 各类运动）、
  好吃类（奶茶 / 螺蛳粉 / 泡面 / 炸鸡 / 火锅 / 甜品），
  以及**宠物专区**：常见宠物（撸狗 / 观赏鱼 / 仓鼠 / 鹦鹉 / 兔子）+
  **异宠**（睫角守宫 / 角蛙 / 玉米蛇 / 蜜袋鼯 / 非洲迷你刺猬 / 捕鸟蛛 / 寄居蟹 / 六角恐龙）
- **科普正文**：每条给出一句话爽点 + 通俗科学解释（变比率强化、蔡格尼克效应、催产素、糖脂协同、辣椒素 TRPV1、鼻后嗅觉悖论、美拉德反应、内啡肽跑者高潮、时间黑洞、婴儿图式、良性自虐、收集欲、肾上腺素、掌控感等）
- **类别分类**：每条归属一个类别（美食 / 宠物 / **异宠** / 电竞 / 娱乐 / 潮玩 / 职场 / 运动），类别栏可多选筛选，与机制标签、好玩/好吃 互不冲突
- **机制标签**：每条挂多个标签（如 `#多巴胺` `#内啡肽` `#糖脂协同` `#时间黑洞`），标签即筛选入口
- **多巴胺 / 内啡肽双指数**：每条标注「🧠 多巴胺指数」与「💜 内啡肽指数」（均 0–100，越高越上头 / 越爽），卡片与详情页以进度条直观对比，两项共用同一 UI 风格（多巴胺=青→粉、内啡肽=绿→紫）
- **互动小实验**：每条一个可点击实验区（原生 JS / Canvas 动画），点击即时产生可视化反馈
- **实时搜索**：顶部搜索框输入即过滤，匹配标题、科普正文、标签，命中词高亮
- **🧑‍💼 职业爽感时刻表**：17 个职业 × 24 小时的热力表，回答「哪些职业在什么时候能发挥最大的爽感」
  - 每行一个职业（按 技术派 / 创意派 / 现场派 / 助人派 / 奔走派 / 生意派 / 匠心派 分组），每列一个小时，格子颜色越热 = 此刻越接近高光时刻
  - 时间轴可拖动、也可「回到此刻」；右上角实时显示「此刻最爽的是谁」，下方同步给出**该小时爽感排行 Top 6**
  - 点职业名展开详情：爽感峰值时刻、画面感爽点、机制科普（机制名高亮）、多巴胺 / 内啡肽指数、全天高光时刻
  - 点详情里的机制标签可反向筛选「同一机制」的条目；搜索框也会同时过滤职业行
- **多维度筛选**：标签云（机制）+ 类别栏（美食/宠物/电竞…）+ 分类切换（全部 / 好玩 / 好吃）可叠加使用
- **可分享状态**：搜索词、标签、类别、分类写入 URL hash，刷新保持、链接可分享

## 🚀 本地查看（最简单）

直接**双击 `index.html`**，用浏览器打开即可，离线、断网均完整可用。

> 因为全部资源使用相对路径、且不使用 ES Module / fetch，所以 `file://` 协议下功能完整。

## 🌐 在线体验链接

本仓库远端为 `origin → https://github.com/Rex-LK/lying-flat-handbook.git`，
开启 Pages 后，**把它发给任何人，点开就能玩**：

**https://rex-lk.github.io/lying-flat-handbook/**

建议再做一步：打开 GitHub 仓库首页 → 右侧 **About → ⚙️（设置齿轮）** → 勾选
`Use your GitHub Pages website` 并填入上面这个地址。这样别人在仓库简介里就能直接点进去。

> Pages 还没开启时的临时预览（第三方服务，无需任何设置即可打开）：
> https://htmlpreview.github.io/?https://github.com/Rex-LK/lying-flat-handbook/blob/main/index.html

## 🚀 开启 Pages（只需做一次）

1. 推送代码（远端已配置，通常只需后三行）：
   ```bash
   git add .
   git commit -m "人生浪费指南"
   git branch -M main
   git push -u origin main
   ```
2. 打开仓库 **Settings → Pages**，Build and deployment → Source 选
   `Deploy from a branch`，Branch 选 `main`、目录选 `/ (root)`，保存。
3. 等 1–2 分钟，访问上面的地址即可；以后每次 `git push` 都会自动更新线上版本。

> 仓库根目录已包含 `.nojekyll`，会跳过 Jekyll 处理，避免资源被忽略。
> 所有资源均使用相对路径，部署在子路径（`user.github.io/repo/`）也无需任何修改。

## 🧩 如何新增一个职业（爽感时刻表）

在 `assets/js/data.js` 的 `window.GUIDE_JOBS` 数组里追加一条即可，无需改动其它文件：

```js
{
  id: 'myJob', emoji: '🧪', name: '示例职业', field: '技术派',
  peak: '03:00–05:00',                       // 爽感峰值时刻（展示文案）
  moment: '一句话画面感爽点',
  why: '「爽在哪」科普正文，机制名会被高亮…',
  tags: ['心流', '掌控感'],                    // 沿用条目词表，可反向筛选条目
  score: { dopamine: 78, endorphin: 33 },     // 两个指数
  peaks: [{ from: 3, to: 5, heat: 88 }]       // 爽感时段窗口，支持跨零点；heat=强度
}
```

## 🧩 如何新增一个条目

1. 在 `assets/js/data.js` 的 `window.GUIDE_ITEMS` 数组里追加一条：
   ```js
   {
     id: 'myItem',            // 唯一 id
     cat: 'fun',              // 'fun'(好玩) 或 'food'(好吃)
     name: '示例行为',
     emoji: '🎲',
     hook: '一句话爽点',
     why: '「好玩/好吃在哪」科普正文…',
     tags: ['多巴胺', '变比率强化'],
     lab: 'myItem'            // 对应 labs.js 中的实验 key
   }
   ```
2. 在 `assets/js/labs.js` 的 `window.GUIDE_LABS` 里注册同名实验：
   ```js
   myItem: {
     init: function (container) {
       // 绑定点击、启动动画，返回一个带 destroy() 的对象
       return {
         destroy: function () { /* 清理监听 + 停止动画 */ }
       };
     }
   }
   ```
3. 无需改动 `app.js` —— 渲染、搜索、筛选、hash 路由会自动覆盖新条目。

## 📁 目录结构

```
指南/
├── index.html            # 唯一页面
├── assets/
│   ├── css/style.css     # 暗色霓虹主题
│   └── js/
│       ├── data.js       # 32 条条目数据 + 17 条职业数据 + 标签
│       ├── labs.js       # 32 个互动实验
│       └── app.js        # 渲染 / 搜索 / 筛选 / hash 路由 / 职业时刻表
├── README.md
├── .nojekyll
└── .gitignore
```

## 🛠 技术说明

- 纯静态：HTML5 + 原生 CSS（变量 / Grid / Flex / 关键帧）+ 原生 JavaScript（经典 `<script>` 顺序加载）
- 图形：Canvas 2D + inline SVG + emoji，无任何图片外链、字体外链或 CDN 依赖
- 实验在详情弹层展开时才初始化（懒挂载），关闭时销毁，避免后台动画空转
- 尊重 `prefers-reduced-motion`，降级为仅保留数值与颜色变化
