/* =========================================================
   半日闲 · 条目数据
   契约（app.js / labs.js 唯一依赖）：
   {
     id:    唯一标识，与 GUIDE_LABS 的实验 key 对应
     cat:   'fun'(好玩) | 'food'(好吃)
     name:  条目名
     emoji: 卡片图标
     hook:  一句话爽点
     why:   「好玩/好吃在哪」科普正文（机制名会被 app.js 高亮）
     tags:  机制标签（不含 # 前缀，渲染时补充）
     lab:   对应实验 key（与 id 一致）
   }
   ========================================================= */
window.GUIDE_ITEMS = [
  /* ---------------- 好玩类 ---------------- */
  {
    id: "binge",
    cat: "fun",
    name: "熬夜刷剧",
    emoji: "📺",
    hook: "「这集结束就睡」——然后天亮了。",
    why: "每集结尾都留一个悬念，大脑被蔡格尼克效应拿捏：未完成的情节比已完成的更让人念念不忘。与此同时，追剧带来的多巴胺持续小额投放，让「再看一集」的边际成本看起来趋近于零。于是你用今天的精力，给明天的自己埋了一颗雷。",
    tags: ["多巴胺", "蔡格尼克效应", "时间黑洞", "成瘾指数"],
    lab: "binge"
  },
  {
    id: "blindbox",
    cat: "fun",
    name: "开盲盒",
    emoji: "🎁",
    hook: "不知道里面是什么，才是快乐的来源。",
    why: "盲盒卖的不是玩具，是变比率强化：奖励什么时候来、来多大，完全随机不可预测。赌博机用的就是同一套机制——不确定性把多巴胺峰值拉到最高。开盒前那 2 秒的期待，比拆到什么都上头。",
    tags: ["多巴胺", "变比率强化", "期待奖励", "成瘾指数"],
    lab: "blindbox"
  },
  {
    id: "cat",
    cat: "fun",
    name: "撸猫",
    emoji: "🐱",
    hook: "它不说话，却把你治愈了。",
    why: "指尖陷入绒毛、听到呼噜声，触觉与听觉的双重 ASMR 会触发催产素分泌——就是那种「爱」和「依恋」的化学物质。规律呼噜（约 25–50Hz）甚至被研究认为有助于减压，于是你一边嘴上说「不养」，一边手停不下来。",
    tags: ["催产素", "感官奖赏", "社交"],
    lab: "cat"
  },
  {
    id: "replay",
    cat: "fun",
    name: "再来一局",
    emoji: "🎮",
    hook: "就差一点！下一把肯定赢。",
    why: "电竞的爽，来自「操作即反馈」的毫秒级确认：每一次走位、补刀、极限反杀都在瞬间得到回应，大脑被密集的多巴胺小脉冲持续喂养，容易滑入心流。而差一点就赢的近因效应，比一路碾压更让人上头——你把它误判成「我其实很行」。再加上已经投入的时间（沉没成本），让你觉得现在停就是亏。结果段位没变，时间没了。",
    tags: ["多巴胺", "近因效应", "沉没成本", "成瘾指数", "时间黑洞"],
    lab: "replay"
  },
  {
    id: "slack",
    cat: "fun",
    name: "摸鱼",
    emoji: "🐟",
    hook: "在工作时间，偷偷快乐。",
    why: "摸鱼之所以爽，一半是任务切换带来的注意力残留被释放，一半是「偷偷」带来的轻微刺激。但这种快乐有利息：堆积的工作会在下班后反噬。风险与收益的博弈，是成年人最刺激的桌游。",
    tags: ["多巴胺", "时间黑洞", "社交"],
    lab: "slack"
  },
  {
    id: "shortvideo",
    cat: "fun",
    name: "刷短视频",
    emoji: "📱",
    hook: "就看一下，结果一下午没了。",
    why: "上滑即下一个，每一条都是经过算法优化的变比率强化：你永远不知道下一条有多好笑。大脑的判断阈值被一条接一条的短刺激不断拉低，时间感知彻底失灵。当你回过神，窗外已经换了个季节。",
    tags: ["多巴胺", "变比率强化", "时间黑洞", "成瘾指数"],
    lab: "shortvideo"
  },

  /* ---------------- 好吃类 ---------------- */
  {
    id: "milktea",
    cat: "food",
    name: "奶茶",
    emoji: "🧋",
    hook: "快乐水，加料加倍快乐。",
    why: "糖 + 脂肪 + 咖啡因，三件套精准打击奖励系统：糖脂协同让大脑的奖赏中枢比单独吃糖更兴奋，咖啡因再补一层清醒的愉悦，Q 弹珍珠提供咀嚼的感官奖赏。一杯下肚，是化学层面的全方位按摩。",
    tags: ["多巴胺", "糖脂协同", "感官奖赏", "期待奖励"],
    lab: "milktea"
  },
  {
    id: "luosifen",
    cat: "food",
    name: "螺蛳粉",
    emoji: "🍜",
    hook: "闻着想逃，吃着真香。",
    why: "螺蛳粉是鼻后嗅觉悖论的典型：臭来自发酵产生的硫化物，但香气分子与鲜味（如鸟苷酸）协同，经高温一激发，「闻着臭吃着香」就此诞生。更妙的是嗅觉疲劳——多闻几下，你的大脑就「适应」了臭味，只留下鲜。",
    tags: ["嗅觉悖论", "感官奖赏", "糖脂协同"],
    lab: "luosifen"
  },
  {
    id: "noodle",
    cat: "food",
    name: "泡面",
    emoji: "🍝",
    hook: "三分钟，等出了仪式感。",
    why: "泡面的快乐一半在等：热水激发面条与料包的美拉德反应，香气随等待逐渐攀升，期待奖励在临界点爆发。深夜、高盐高油、孤独一人——这是一份为「不想做饭又想被安慰」量身定制的碳水浪漫。",
    tags: ["美拉德反应", "期待奖励", "感官奖赏", "时间黑洞"],
    lab: "noodle"
  },
  {
    id: "fried",
    cat: "food",
    name: "炸鸡",
    emoji: "🍗",
    hook: "咔嚓一声，多巴胺到账。",
    why: "酥脆外壳被咬碎的声学反馈（咔嚓声约 70dB 最悦耳），加上脂肪与碳水的糖脂协同，构成顶级感官奖赏。大脑把「脆 = 新鲜 = 安全」写进了本能，所以你明知道会胖，手还是伸了出去。",
    tags: ["糖脂协同", "感官奖赏", "多巴胺"],
    lab: "fried"
  },
  {
    id: "hotpot",
    cat: "food",
    name: "火锅",
    emoji: "🌶️",
    hook: "越辣越爽，痛并快乐着。",
    why: "辣椒素激活舌头上的 TRPV1 受体，模拟「烧伤」痛觉。大脑收到疼痛信号后释放内啡肽充当天然镇痛与欣快剂——痛感被中和成爽感。再加上围炉的社交属性，火锅是生理与心理的双重高潮。",
    tags: ["内啡肽", "辣椒素", "社交", "感官奖赏"],
    lab: "hotpot"
  },
  {
    id: "dessert",
    cat: "food",
    name: "甜品",
    emoji: "🍰",
    hook: "第一口天堂，第二口……再来一块。",
    why: "糖分进入血液的速度越快，多巴胺冲得越猛——蛋糕正是「快糖」代表。但血糖随后骤降，低落感逼着你「再来一块」回血，形成跷跷板循环。甜品的陷阱，是它先给你翅膀，再收你过路费。",
    tags: ["多巴胺", "糖脂协同", "感官奖赏", "成瘾指数"],
    lab: "dessert"
  },
  {
    id: "sport",
    cat: "fun",
    name: "夜跑 / 运动",
    emoji: "🏃",
    hook: "难得的一次，身体反而感谢你。",
    why: "运动的爽是「事后才到账」的类型：中等强度有氧触发内啡肽与内源性大麻素，约 20–30 分钟后涌上所谓的「跑者高潮」——一种平静的欣快与掌控感，和电竞的即时刺激正好相反。而多巴胺在你「决定去跑」的那一刻就提前释放，先奖励你的行动力。",
    tags: ["内啡肽", "多巴胺", "感官奖赏"],
    lab: "sport"
  },

  /* ---------------- 更多运动类 ---------------- */
  {
    id: "basketball",
    cat: "fun",
    name: "打篮球",
    emoji: "🏀",
    hook: "空心入网那一刻，全场为你静止。",
    why: "5v5 攻防，运球突破、急停跳投、团队传导，把球送进篮筐得分。空心入网的瞬间反馈（操作性条件反射的密集奖赏）最上头，团队配合激发催产素与归属感，心率拉升后再叠加一层内啡肽——心流极易触发。",
    tags: ["多巴胺", "内啡肽", "社交", "心流", "感官奖赏"],
    lab: "basketball"
  },
  {
    id: "swimming",
    cat: "fun",
    name: "游泳",
    emoji: "🏊",
    hook: "入水一刻，世界被按下静音键。",
    why: "在水中靠划手、打腿、换气推进，自由泳/蛙泳/仰泳都对关节零冲击。水的包裹感直接压低皮质醇，规律呼吸激活副交感神经、像天然的镇静剂，漂浮的失重感是纯粹的感官奖赏，持续有氧再释放内啡肽。",
    tags: ["内啡肽", "感官奖赏", "副交感", "多巴胺"],
    lab: "swimming"
  },
  {
    id: "cycling",
    cat: "fun",
    name: "骑行",
    emoji: "🚴",
    hook: "风从耳边过，前方永远未知。",
    why: "踩踏前进，公路追速度、山地征服起伏、城市通勤也能骑。风掠过耳边的速度感直接刺激奖励系统，前方永远未知的下一条路是期待奖励，腿部匀速节奏易滑入心流，内啡肽随里程累积。",
    tags: ["内啡肽", "多巴胺", "期待奖励", "心流"],
    lab: "cycling"
  },
  {
    id: "gym",
    cat: "fun",
    name: "撸铁 / 健身",
    emoji: "🏋️",
    hook: "练完照镜子，自己又硬了一点。",
    why: "用杠铃哑铃做抗阻训练，遵循渐进超负荷、逐周加重。突破 PR（个人纪录）的瞬间是成就多巴胺的高峰，镜子里的肌肉生长是看得见的反馈，睾酮与多巴胺协同，让「练完很爽」变成正向循环。",
    tags: ["多巴胺", "内啡肽", "感官奖赏", "期待奖励"],
    lab: "gym"
  },
  {
    id: "badminton",
    cat: "fun",
    name: "羽毛球",
    emoji: "🏸",
    hook: "下一拍，说不定就钉地板得分。",
    why: "隔网对打，扣杀、网前小球、救球，反应与步伐是第一生产力。高速对抗里每一次得分都是密集的多巴胺脉冲，赢球的不确定性正是变比率强化，双打配合还顺带分泌社交激素。",
    tags: ["多巴胺", "内啡肽", "社交", "变比率强化", "心流"],
    lab: "badminton"
  },
  {
    id: "yoga",
    cat: "fun",
    name: "瑜伽",
    emoji: "🧘",
    hook: "慢下来，才听见身体的声音。",
    why: "体式 + 呼吸 + 冥想三位一体，慢下来与身体对话。它激活副交感神经，让抑制性递质 GABA 上升，带来一种平静的欣快；拉伸本身是感官奖赏，规律练习还能拉回血清素。",
    tags: ["内啡肽", "血清素", "副交感", "感官奖赏"],
    lab: "yoga"
  },

  /* ---------------- 常见宠物 ---------------- */
  {
    id: "dog",
    cat: "fun",
    name: "撸狗",
    emoji: "🐶",
    hook: "全世界只有它，把你回家当成今天最大的事。",
    why: "你一开门，它就把攒了一整天的热情全砸过来——这种被无条件欢迎的待遇会刺激催产素大量分泌，你们对视时双方的催产素水平还会同步升高，是极少见的双向奔赴。每天遛它既是社交，也是给它嗅闻世界的机会；回到家你自己的皮质醇也被带走一截，这才是真正的减压，副交感顺势接管。掌心传来的体温和那根停不下来的尾巴，是一份稳定的感官奖赏。",
    tags: ["催产素", "社交", "副交感", "减压", "感官奖赏"],
    lab: "dog"
  },
  {
    id: "aquarium",
    cat: "fun",
    name: "观赏鱼 / 水族箱",
    emoji: "🐠",
    hook: "什么都不用做，看着它就够了。",
    why: "水族箱是天然的减压装置：视线跟着鱼缓慢飘移时，注意力被温和地占据而不是被撕扯，副交感就此被激活，心率与皮质醇双双下降。规律的水流与过滤声接近白噪音，是极其省电的感官奖赏；每次撒一把饲料、鱼群从各个角落同时聚拢过来的那两秒，是一次小小的期待奖励。",
    tags: ["副交感", "减压", "感官奖赏", "期待奖励"],
    lab: "aquarium"
  },
  {
    id: "hamster",
    cat: "fun",
    name: "仓鼠 / 金丝熊",
    emoji: "🐹",
    hook: "腮帮子一鼓，烦恼就少了一半。",
    why: "仓鼠精准戳中人类的婴儿图式：圆脸、大眼、短手——这套幼态组合会直接启动你的养育本能，多巴胺和催产素一起上涨。它把瓜子塞满颊囊、再冲上跑轮狂奔的认真劲儿，把「囤积」这件小事演得像一场不需要你负责的直播，是成本极低的感官奖赏。",
    tags: ["婴儿图式", "多巴胺", "催产素", "感官奖赏"],
    lab: "hamster"
  },
  {
    id: "parrot",
    cat: "fun",
    name: "养鹦鹉",
    emoji: "🦜",
    hook: "它学会的第一句话，可能让你当场社死。",
    why: "鹦鹉的乐趣来自日积月累的不确定性：你永远不知道它今天会蹦出哪个词、什么时候开口，这种随机回应本身就是变比率强化。教它说话的过程又长又慢，每一次模糊的模仿都是一次小小的期待奖励，多巴胺跟着一点点续杯；那身原本用来吸引配偶的高饱和羽毛，顺手满足了视觉上的感官奖赏；毕竟它是极少数能跟你「对话」的宠物，社交回路会被反复点亮。",
    tags: ["变比率强化", "期待奖励", "多巴胺", "感官奖赏", "社交"],
    lab: "parrot"
  },
  {
    id: "rabbit",
    cat: "fun",
    name: "养兔子",
    emoji: "🐰",
    hook: "它不是在吃草，就是在去偷吃的路上。",
    why: "兔子的爽点藏在两个反差里：一是从飞机耳到四脚朝天摊平的信任切换，这一下彻底放松会换来一整套催产素，是全天然的减压；二是它咀嚼干草时那种永不停歇、极其规律的咔嚓声，规律重复的细微声响是最有效的感官奖赏。再加上高兴时突然原地起跳、空中拧身的兔子跳，会把你的多巴胺也一起弹起来。",
    tags: ["催产素", "减压", "感官奖赏", "多巴胺"],
    lab: "rabbit"
  },

  /* ---------------- 异宠 ---------------- */
  {
    id: "gecko",
    cat: "fun",
    name: "睫角守宫",
    emoji: "🦎",
    hook: "它不会爱你，但你还是会为它蜕下一张完整的皮而激动。",
    why: "守宫给的是「观察者型」快乐：它不亲人、不黏人，却把蜕皮、捕食、攀爬这些私密过程大方展示在你面前，这种不打扰你的陪伴能压低皮质醇、激活副交感，是一种安静的减压。而它这次肯不肯吃、皮蜕得干不干净，每次结果都不确定，长期下来就是教科书式的变比率强化；再配上脚掌刚毛能吸住竖直玻璃、倒挂也掉不下来的反重力画面，构成纯粹的感官奖赏。你掌控着温度、湿度与喂食节奏，小小的掌控感每天都在悄悄加分。",
    tags: ["副交感", "减压", "变比率强化", "感官奖赏", "掌控感"],
    lab: "gecko"
  },
  {
    id: "pacmanfrog",
    cat: "fun",
    name: "角蛙",
    emoji: "🐸",
    hook: "一块会呼吸的石头，张嘴能吞下一整只。",
    why: "角蛙主打静止与爆发的反差：它能一动不动蹲上一整天，让你几乎忘了它的存在，然后在你眨眼的一瞬间跃起、整只吞下猎物——长时间无事发生、忽然来一下的节奏，正是变比率强化的教科书。它圆鼓鼓的体型和天生上扬的嘴角是一次婴儿图式的偷袭；由你把控投喂时机与分量，顺带收获一份小小的掌控感。吞完后它满足地往土里一埋的画面，是不需要付出任何情绪就能领到的感官奖赏。",
    tags: ["变比率强化", "婴儿图式", "掌控感", "感官奖赏"],
    lab: "pacmanfrog"
  },
  {
    id: "cornsnake",
    cat: "fun",
    name: "玉米蛇",
    emoji: "🐍",
    hook: "冷血、无声，摸起来却意外地顺滑。",
    why: "蛇的乐趣首先是「安全的冒险」：理智上知道它无毒又温顺，本能却仍留着一点紧绷，这份轻微唤起让肾上腺素小剂量释放，大脑把它翻译成刺激而不是恐惧——害怕与安全同框，是最上头的组合之一。其次它的鳞片比想象中更凉、更干燥也更顺滑，是极其纯粹的感官奖赏；它慢慢缠上手臂时的重量与规律收紧，会带来一种被信任的掌控感。每次成功上手，多巴胺都会给这份勇敢发一次红包。",
    tags: ["肾上腺素", "感官奖赏", "掌控感", "多巴胺"],
    lab: "cornsnake"
  },
  {
    id: "sugarglider",
    cat: "fun",
    name: "蜜袋鼯",
    emoji: "🐿️",
    hook: "它会从柜顶展开翼膜，滑翔落到你肩膀上。",
    why: "蜜袋鼯把依恋演成了动作片：白天它睡在你的衣兜里，夜里睁眼就认人，这种强烈的个体依恋会释放催产素；它从高处展开翼膜、划出一道弧线精准降落到你身上，是一次带轨迹的期待奖励。它开心时咕咕叫、不服气时喷气抗议，情绪反馈即时又夸张，把你的社交回路反复点亮；而它柔软的毛和小手抓握的力道，是触觉上的感官奖赏，多巴胺也跟着补刀。",
    tags: ["催产素", "期待奖励", "社交", "感官奖赏", "多巴胺"],
    lab: "sugarglider"
  },
  {
    id: "hedgehog",
    cat: "fun",
    name: "非洲迷你刺猬",
    emoji: "🦔",
    hook: "先炸成一球刺，再慢慢把鼻子凑出来。",
    why: "刺猬的快乐在于反差解锁：受惊时它把全身的刺立起来缩成一个球；你耐心等着，刺慢慢伏下、露出湿润的鼻尖——从拒绝到接纳的过程，是一次延迟满足版的期待奖励。被扎到却扎不破的轻微刺痛会唤起小剂量肾上腺素；而它卷成球时那个圆滚滚的轮廓，还顺手触发了婴儿图式。等它彻底放松摊平的那几分钟，你收获的是最安静的减压。",
    tags: ["期待奖励", "肾上腺素", "婴儿图式", "减压"],
    lab: "hedgehog"
  },
  {
    id: "tarantula",
    cat: "fun",
    name: "捕鸟蛛",
    emoji: "🕷️",
    hook: "大多数人尖叫，你却在它旁边安静地笑。",
    why: "养蛛的核心是恐惧的安全化：明知它几乎不动、毒性有限，本能的紧张却还在，于是肾上腺素低剂量释放、多巴胺随后跟进，把生理唤起翻译成兴奋——这就是所谓的良性自虐。你能预判它下一步是踢毛还是扑食，这份预判带来掌控感；而它几小时一动不动的极慢节奏，会逼着你的呼吸一起放慢，是一种带距离感的减压。",
    tags: ["良性自虐", "肾上腺素", "多巴胺", "掌控感", "减压"],
    lab: "tarantula"
  },
  {
    id: "hermitcrab",
    cat: "fun",
    name: "寄居蟹",
    emoji: "🦀",
    hook: "为了一个更好的壳，它能连夜搬家。",
    why: "寄居蟹的爽点全在换壳这件小事上：你放进一个新壳，它可能几天纹丝不动，也可能半夜就把家搬了——结果完全不可预测，是标准的变比率强化。而想给每只都配一个更漂亮、更合适的壳这件事一旦开始就停不下来，收集欲在被持续喂养；你决定缸里放什么、湿度调多少，顺手收获一点掌控感。每次开缸发现它已经换了新壳，多巴胺准时到账。",
    tags: ["变比率强化", "收集欲", "掌控感", "多巴胺"],
    lab: "hermitcrab"
  },
  {
    id: "axolotl",
    cat: "fun",
    name: "六角恐龙（钝口螈）",
    emoji: "🦕",
    hook: "永远长不大，永远在笑。",
    why: "六角恐龙把婴儿图式拉到满格：圆脑袋、三对外鳃、天生上扬的嘴角，几乎是为触发人的养育本能而设计的组合，催产素与多巴胺一起上升。它终生保持幼态、不会真的「长大」，意味着你永远不用面对它变了这件事，这是一种极低波动的减压；它慢吞吞划水、偶尔浮上来换口气的样子，是不需要你付出任何东西就能领到的感官奖赏。",
    tags: ["婴儿图式", "催产素", "多巴胺", "减压", "感官奖赏"],
    lab: "axolotl"
  },

  /* ---------------- 社交桌游 ---------------- */
  {
    id: "werewolf",
    cat: "fun",
    name: "狼人杀",
    emoji: "🐺",
    hook: "天黑请闭眼——你永远不知道身边谁是狼。",
    why: "社交欺骗是最高级的心理博弈：你要在发言里伪装、在投票中读人，每一次「我怀疑 X」都是一次社会智商的小考。身份的不确定性（你是狼还是预言家？）直接触发变比率强化——不到天亮揭晓，多巴胺一直悬在半空。而放逐成功、揪出真狼的那一刻，团队归属与「我赢了对面」的双重奖励一起砸下，催产素与多巴胺齐飞。",
    tags: ["多巴胺", "变比率强化", "社交", "期待奖励"],
    lab: "werewolf"
  },
  {
    id: "jubensha",
    cat: "fun",
    name: "剧本杀",
    emoji: "🎭",
    hook: "搜完最后一张线索，凶手居然是……",
    why: "剧本杀把你看过的悬疑片变成「自己主演」：线索碎片一块块拼上，收集欲被持续喂养；当你在投票环节指认真凶、逻辑闭环那一刻，是解谜型的多巴胺高峰。而最上头的是「入戏」——你短暂成了另一个人，平时社交回避的人也能在角色里放心开口，催产素在共演里悄悄分泌。",
    tags: ["多巴胺", "收集欲", "社交", "期待奖励"],
    lab: "jubensha"
  },
  {
    id: "mahjong",
    cat: "fun",
    name: "打麻将",
    emoji: "🀄",
    hook: "就差一张，听牌了！",
    why: "麻将的爽，是东亚人最熟悉的变比率强化：每一次摸牌都是一次开奖，胡牌的概率低而随机，差一张的近因效应（就差一点）比一帆风顺更让人上头。洗牌的哗啦声、码牌的触感是天然的感官奖赏；而和牌瞬间全桌的「哇」、推倒长城的脆响，把社交与成就一起点燃。",
    tags: ["多巴胺", "变比率强化", "感官奖赏", "社交", "近因效应"],
    lab: "mahjong"
  },
  {
    id: "cards",
    cat: "fun",
    name: "掼蛋 / 斗地主",
    emoji: "🃏",
    hook: "王炸！这把稳了。",
    why: "扑克是概率与演技的合谋：你手里的牌型好坏未知（变比率强化），而出牌时的「演」——虚张声势还是真有炸弹——把社交博弈推到顶点。每一轮出牌都是一次即时反馈，赢下一把的掌控感叠加底牌揭晓的期待奖励；和牌友插科打诨，催产素顺带补齐。",
    tags: ["多巴胺", "变比率强化", "社交", "掌控感", "期待奖励"],
    lab: "cards"
  },

  /* ---------------- 户外运动 ---------------- */
  {
    id: "hiking",
    cat: "fun",
    name: "爬山 / 徒步",
    emoji: "🥾",
    hook: "一步步踩上去，山顶会自己奖励你。",
    why: "爬山徒步的爽是延迟到账型：前半段腿酸、喘，多巴胺只在「又到一个观景台」的节点小额发放；真正的高潮在登顶那一刻——视野炸开，内啡肽与内源性大麻素涌上「山顶高潮」，加上「我一步步走上来」的掌控感。下山时副交感接管，心率回落、风景尽收，是天然的减压。路上每一步都是即时反馈，远处那个山顶则是持续的期待奖励。",
    tags: ["内啡肽", "多巴胺", "感官奖赏", "期待奖励", "掌控感", "副交感"],
    lab: "hiking"
  },

  {
    id: "perler",
    cat: "fun",
    name: "拼豆",
    emoji: "🟪",
    hook: "一颗一颗，把一下午熨进一幅不会动的画。",
    why: "拼豆卖的是「心流」：把彩色小珠按图摆好，是低门槛、高反馈的手作——每放一颗都有「位置对了」的即时确认，大脑被稳定的多巴胺小脉冲喂养，容易滑入忘我。最后那下熨斗把零散珠子融成定型的画，完成感（内啡肽）瞬间兑现。于是你花一下午，换一张冰箱贴，和一句「又浪费了一天」的自嘲。",
    tags: ["多巴胺", "心流", "感官奖赏", "时间黑洞", "完成感"],
    lab: "perler"
  },

  /* ---------------- 场景卡（通勤 / 午休 / 周末） ---------------- */
  {
    id: "podcast",
    cat: "fun",
    name: "通勤听播客",
    emoji: "🎧",
    hook: "地铁摇晃的 40 分钟，是只属于你的私人电台。",
    why: "通勤本是被位移「偷走」的死时间，戴上耳机切到喜欢的播客，大脑把被动通勤重新赋值为「主动获取」——你用听觉接管了这段省不下来的时间，掌控感回来了。主播的声音提供低频社交陪伴（催产素），而「又学到点什么 / 笑了一下」的微小确定性，让多巴胺在拥堵里稳稳到账。于是你甚至开始期待那班地铁。",
    tags: ["掌控感", "社交陪伴", "多巴胺", "碎片时间"],
    lab: "podcast"
  },
  {
    id: "craft",
    cat: "fun",
    name: "午休小手工",
    emoji: "✂️",
    hook: "别人刷手机，你用 15 分钟折出一只能拍照的星星。",
    why: "午休是大脑从专注切回「默认模式网络」的黄金修复期。比起继续盯屏（仍在消耗注意力），做点低门槛、有成品的手工，让手脑进入轻量心流：每一次折叠都是毫秒级反馈，多巴胺小额连发；而「下班前桌上多了个自己做的东西」带来真实的掌控感与内啡肽的踏实。屏幕之外的世界，原来 15 分钟就够回血。",
    tags: ["心流", "掌控感", "内啡肽", "碎片时间"],
    lab: "craft"
  },
  {
    id: "homecook",
    cat: "food",
    name: "周末做一顿饭",
    emoji: "🍳",
    hook: "不为了省外卖钱，就为听油下锅那一声响。",
    why: "工作日吃饭是「填饱」，周末做饭是「重连」。切菜节奏、火候判断、味道调试，是一条完整操作链，极易打成心流；当一道菜从生到熟、从你手里端上桌，掌控感被具象成盘里的颜色与香气（感官奖赏）。花时间照料自己这件事本身就在分泌内啡肽——你用一下午，把「被生活推着走」扳成了「我在过生活」。",
    tags: ["心流", "感官奖赏", "内啡肽", "沉浸"],
    lab: "homecook"
  },
  {
    id: "origami",
    cat: "fun",
    name: "随手折纸",
    emoji: "📜",
    hook: "一张纸，三两下，桌上多了个能立起来的小东西。",
    why: "折纸是「低门槛心流」的教科书：每一步折叠都有即时、看得见的反馈，大脑被密集的多巴胺小脉冲喂养；而成品从平面变立体，把掌控感具象成你手里的造型。它几乎零成本、随时能停，是碎片时间最干净的「做点什么」。",
    tags: ["心流", "掌控感", "多巴胺", "碎片时间"],
    lab: "origami"
  },
  {
    id: "meditation",
    cat: "fun",
    name: "冥想呼吸",
    emoji: "🧘",
    hook: "什么也不做，只是把注意力放回呼吸上。",
    why: "冥想不是放空，而是把飘走的念头轻轻拉回。专注呼吸会激活副交感神经、降低皮质醇（压力激素），内啡肽与 GABA 带来安稳的松弛感。每天几分钟像给大脑重启——你不需要「学会」，只需要「开始数呼吸」。",
    tags: ["内啡肽", "感官奖赏", "松弛", "碎片时间"],
    lab: "meditation"
  },
  {
    id: "jigsaw",
    cat: "fun",
    name: "拼一幅图",
    emoji: "🧩",
    hook: "把一千块碎片，一点点拼回它本来的样子。",
    why: "拼图是慢反馈的心流：每一块归位都是一次小而确定的「对了」，多巴胺随进度稳步累积；整幅图逐渐浮现，把延迟满足变成可见的奖赏。它不费脑却占住注意力，是放空大脑又不至于罪恶的沉浸方式。",
    tags: ["心流", "掌控感", "多巴胺", "沉浸"],
    lab: "jigsaw"
  },
  {
    id: "coffee",
    cat: "food",
    name: "手冲一杯咖啡",
    emoji: "☕",
    hook: "不为了提神，就为看水穿过粉层、滴成一杯。",
    why: "手冲是一条有节奏的仪式链：称豆、磨粉、注水、等待萃取，每一步都有感官反馈（香气、声音、颜色）。它把「喝咖啡」从功能变成过程，心流与感官奖赏双双在线；亲手做出的一杯，比外卖多一层「我照料了自己」的内啡肽。",
    tags: ["心流", "感官奖赏", "内啡肽", "沉浸"],
    lab: "coffee"
  },

  /* ---------------- 拓展：钓鱼 / 射箭 / 室内 · 室外 · 高空 · 低空 ---------------- */
  {
    id: "fishing",
    cat: "fun",
    name: "钓鱼",
    emoji: "🎣",
    hook: "浮漂沉下去那一下，心跳比鱼还快。",
    why: "等鱼咬钩是典型的变比率强化：你不知道下一秒会不会有口，这种不确定性把多巴胺吊到最高。而当浮漂猛地一顿，期待瞬间兑现成成就感——哪怕钓上来的是只拖鞋。水面本身还是天然的注意力重置键，刷不掉的信息流在这里被按了暂停。",
    tags: ["低空", "多巴胺", "变比率强化", "感官奖赏"],
    lab: "fishing"
  },
  {
    id: "archery",
    cat: "fun",
    name: "射箭",
    emoji: "🏹",
    hook: "松手那一刻，世界只剩靶心。",
    why: "拉弓到撒放是教科书级的心流：呼吸、瞄准、释放被压缩成一次干净的闭环，每次命中都给大脑一记即时多巴胺。而弓弦震动的本体感觉加上箭稳稳扎进黄心的视觉确认，构成了一套让人上瘾的操作性条件反射。",
    tags: ["低空", "多巴胺", "心流", "操作性条件反射"],
    lab: "archery"
  },
  {
    id: "skateboard",
    cat: "fun",
    name: "滑板",
    emoji: "🛹",
    hook: "摔了九十九次，第一百次站上去了。",
    why: "滑板是近因效应的最佳代言：你记不住九十九次摔，只记得最后一次成功 ollie 的爽。每次落地都是一次即时反馈，多巴胺随动作小额投放；而失败的成本反而让成功更值钱——这正是游戏的爽点设计。",
    tags: ["低空", "多巴胺", "近因效应", "心流"],
    lab: "skateboard"
  },
  {
    id: "ski",
    cat: "fun",
    name: "滑雪",
    emoji: "⛷️",
    hook: "从山顶冲下去，风替你做决定。",
    why: "高速下滑时，大脑交出了控制权，进入心流加内啡肽双发状态：感官被速度填满，判断力让位给身体本能，恐惧被转化成了爽。每一次稳稳卡宾转弯，都是一次掌控感的即时确认。",
    tags: ["低空", "内啡肽", "心流", "掌控感"],
    lab: "ski"
  },
  {
    id: "surf",
    cat: "fun",
    name: "冲浪",
    emoji: "🏄",
    hook: "等一个浪，比追一个浪更上头。",
    why: "冲浪的爽一半在等：你盯着海面，大脑被变比率强化反复吊胃口，不知道下一个浪会不会是今天最猛的那个。而当板子被浪推起、你站上去的瞬间，期待奖励一次性结清，内啡肽随着失重感涌上来。",
    tags: ["低空", "多巴胺", "变比率强化", "内啡肽"],
    lab: "surf"
  },
  {
    id: "climbing",
    cat: "fun",
    name: "攀岩",
    emoji: "🧗",
    hook: "离地三米，手机信号就没了。",
    why: "攀岩把心流逼到极致：你只能关注下一个支点，过去和未来同时被切断。每向上挪一步都是一次即时掌控感，而离地带来的轻微恐惧被身体转化成了高度专注——这是城市里买不到的全神贯注。",
    tags: ["高空", "心流", "掌控感", "内啡肽"],
    lab: "climbing"
  },
  {
    id: "skydive",
    cat: "fun",
    name: "跳伞",
    emoji: "🪂",
    hook: "跳出机舱那秒，你终于不内耗了。",
    why: "自由落体是内啡肽的核爆现场：极端的感官刺激让大脑来不及焦虑，只来得及哇。落地后的巨大放松感来自应激后的反跳——皮质醇退潮，内啡肽漫上来，于是你一边腿软一边已经在想下一次。",
    tags: ["高空", "内啡肽", "感官奖赏", "心流"],
    lab: "skydive"
  },
  {
    id: "billiards",
    cat: "fun",
    name: "台球",
    emoji: "🎱",
    hook: "一杆清台，比升职还爽三秒。",
    why: "俯身、运杆、击球，台球是慢节奏的操作性条件反射：每一次走位成功都给一次精准反馈，多巴胺随我算到了的掌控感到账。而轮到你出杆的等待，又恰到好处地吊着期待。",
    tags: ["室内", "多巴胺", "操作性条件反射", "掌控感"],
    lab: "billiards"
  },
  {
    id: "frisbee",
    cat: "fun",
    name: "飞盘",
    emoji: "🥏",
    hook: "接住的瞬间，你们击了个掌。",
    why: "飞盘把社交奖赏和操作性条件反射打包了：每一次稳稳接住都是一次即时反馈，而传接之间的击掌与欢呼，是催产素在到账。它几乎零门槛，却能让一群陌生人迅速变成队友。",
    tags: ["室外", "多巴胺", "社交", "操作性条件反射"],
    lab: "frisbee"
  },
  {
    id: "camping",
    cat: "fun",
    name: "露营",
    emoji: "⛺",
    hook: "把被子搬进山里，星星就是天花板。",
    why: "露营是注意力残留的强制清退：离开屏幕、生一团火、听虫鸣，副交感神经系统终于上线，皮质醇往下掉。搭帐篷的琐碎动作本身也是心流——你用双手，把一天的紧绷拆掉了。",
    tags: ["室外", "内啡肽", "副交感", "心流"],
    lab: "camping"
  },
  {
    id: "paragliding",
    cat: "fun",
    name: "滑翔伞",
    emoji: "🪂",
    hook: "被一阵风托起来，城市缩成沙盘。",
    why: "滑翔伞是失重加掌控的矛盾体：你放手交给风，却又靠身体微调方向——这种被托住的失控感，是内啡肽和心流一起上桌。",
    tags: ["高空", "内啡肽", "心流"],
    lab: "paragliding"
  },
  {
    id: "balloon",
    cat: "fun",
    name: "热气球",
    emoji: "🎈",
    hook: "火苗一窜，篮子就离地了。",
    why: "热气球没有操控杆，只有升降——它把交出控制做到了极致，你只能看云从指尖过。慢到极致的飞行，反而最治愈。",
    tags: ["高空", "内啡肽", "感官奖赏"],
    lab: "balloon"
  },
  {
    id: "coaster",
    cat: "fun",
    name: "过山车",
    emoji: "🎢",
    hook: "爬到最高点的那两秒最爽。",
    why: "恐惧在顶点囤积，俯冲时一次性释放成内啡肽。过山车是安全的失控：你知道会停，所以才敢把嗓子喊破。",
    tags: ["高空", "内啡肽", "感官奖赏"],
    lab: "coaster"
  },
  {
    id: "gokart",
    cat: "fun",
    name: "卡丁车",
    emoji: "🏎️",
    hook: "贴地飞行，方向盘比人生靠谱。",
    why: "卡丁车的爽来自低速高刺激：速度感被放得很大，每一次过弯都是一次操作性条件反射的即时反馈，多巴胺随轮胎尖叫到账。",
    tags: ["低空", "多巴胺", "操作性条件反射"],
    lab: "gokart"
  },
  {
    id: "kite",
    cat: "fun",
    name: "放风筝",
    emoji: "🪁",
    hook: "线在手里，风替你飞。",
    why: "放风筝是把不可控驯服成可控的微型练习：你得读风、收放线，每一次风筝稳稳停在天上，都是一次安静的掌控感。",
    tags: ["低空", "掌控感", "心流"],
    lab: "kite"
  },
  {
    id: "rafting",
    cat: "fun",
    name: "漂流",
    emoji: "🛶",
    hook: "浪把你按进水里又抛起来。",
    why: "漂流的爽是被自然推着走：你不用做决定，只要抓紧、尖叫、然后笑——应激后的内啡肽反跳，让狼狈也变得上头。",
    tags: ["低空", "内啡肽", "感官奖赏"],
    lab: "rafting"
  },
  {
    id: "lego",
    cat: "fun",
    name: "乐高拼装",
    emoji: "🧱",
    hook: "一块块拼上去，图纸变成实物。",
    why: "乐高是可见进度的爽：每一步都有即时反馈，完成时的整体感是多巴胺加掌控感的双重结算，特别适合用来从焦虑里把注意力捞回来。",
    tags: ["室内", "多巴胺", "掌控感", "心流"],
    lab: "lego"
  },
  {
    id: "karaoke",
    cat: "fun",
    name: "家庭 K 歌",
    emoji: "🎤",
    hook: "关上门，你是唯一的主唱。",
    why: "唱歌是低门槛的内啡肽释放：深呼吸加发声本身就在放松膈肌，而唱准副歌的瞬间，操作性条件反射给你一记我唱对了的爽。",
    tags: ["室内", "内啡肽", "操作性条件反射"],
    lab: "karaoke"
  },
  {
    id: "reading",
    cat: "fun",
    name: "窝着看书",
    emoji: "📚",
    hook: "陷进沙发，让别人的故事替你活一遍。",
    why: "阅读是叙事传输：你沉浸进情节，现实的压力被暂时卸载，副交感上线，心率和皮质醇一起往下走。",
    tags: ["室内", "副交感", "叙事传输"],
    lab: "reading"
  },
  {
    id: "darts",
    cat: "fun",
    name: "飞镖",
    emoji: "🎯",
    hook: "三镖定胜负，准头全在手腕。",
    why: "飞镖是小剂量操作性条件反射：每一次扎进红心都是一次即时反馈，而轮到你投的等待，刚好把期待吊在半空。",
    tags: ["室内", "多巴胺", "操作性条件反射"],
    lab: "darts"
  },
  {
    id: "plants",
    cat: "fun",
    name: "养多肉",
    emoji: "🪴",
    hook: "你浇一次水，它默默长一片叶。",
    why: "养植物是慢反馈的治愈：它的变化太慢，反而逼你放下即时满足，转而去享受它在就好的陪伴感——皮质醇就在这份不急着要结果里降下来。",
    tags: ["室内", "副交感", "陪伴感"],
    lab: "plants"
  },
  {
    id: "picnic",
    cat: "fun",
    name: "野餐",
    emoji: "🧺",
    hook: "把饭铺在草地上，普通的三明治都变香。",
    why: "野餐是把日常换个场景的低成本快乐：环境新鲜感加上和谁一起吃，让同一顿饭的多巴胺被悄悄加价。",
    tags: ["室外", "多巴胺", "社交"],
    lab: "picnic"
  },
  {
    id: "beach",
    cat: "fun",
    name: "赶海",
    emoji: "🦀",
    hook: "退潮后的滩涂，是个免费盲盒。",
    why: "赶海是现实版的开盲盒：你永远不知道翻过石头是螃蟹、贝壳还是空——变比率强化让你弯腰一下午都不累。",
    tags: ["室外", "多巴胺", "变比率强化"],
    lab: "beach"
  },
  {
    id: "stargaze",
    cat: "fun",
    name: "观星",
    emoji: "🔭",
    hook: "抬头那刻，发愁的事突然变小了。",
    why: "观星是天然的视角重置：当宇宙尺度压进来，日常的焦虑被稀释，副交感接管，你只剩哇和好小。",
    tags: ["室外", "副交感", "视角重置"],
    lab: "stargaze"
  },
  {
    id: "skip",
    cat: "fun",
    name: "打水漂",
    emoji: "💧",
    hook: "扁石头擦过水面，哗啦一串涟漪。",
    why: "打水漂是手腕力道与水面的即时对话：扁平石片以约 20° 的入射角擦过水面，每次接触都被表面张力「弹」回去，离心力再把石头压回空中，于是一跳、两跳、三跳……你能亲眼看见自己的动作变成水面上的一串涟漪——这种「我的动作→即时反馈」的闭环，正是掌控感（自我效能）的来源，血清素都跟着稳了。而到底能跳几下永远带点随机，你总期待「下一颗更扁」，变比率强化把多巴胺小脉冲一个接一个喂给你。最后那声闷闷的「扑通」沉底，反而成了整段最难忘的注脚。顺手摸到的凉丝丝的水，是免费的感官奖赏。",
    tags: ["室外", "多巴胺", "掌控感", "心流", "变比率强化", "感官奖赏"],
    lab: "skip"
  },
  {
    id: "walk",
    cat: "fun",
    name: "散步 / 快走",
    emoji: "🚶",
    hook: "下楼走一圈，烦心事自己就散了。",
    why: "散步是被低估的免费处方：慢走把交感神经调回副交感，心率和皮质醇悄悄往下走，脑子从「战斗模式」切回「发呆模式」。阳光会推高血清素、顺便补点维 D，阴天也能靠规律步频催出内啡肽。最妙的是它几乎零门槛——下楼就能走，边走边冒出来的念头，往往比坐着苦想更管用（默认模式网络在溜达时最活跃）。",
    tags: ["室外", "减压", "副交感", "血清素", "内啡肽", "心流"],
    lab: "walk"
  },
  {
    id: "rope",
    cat: "fun",
    name: "跳绳",
    emoji: "🪢",
    hook: "一根绳，两分钟就上头。",
    why: "跳绳是单位时间性价比最高的快乐有氧：一会儿就能把心率拉进燃脂区，内啡肽随之涌上来，那种「轻飘飘的爽」和跑步一个配方。绳子打地的稳定节奏是天然的节奏奖赏，数到几十下不断，掌控感（自我效能）直接拉满；想再快一点、再连一点，又给你持续的多巴胺小目标。一根绳、一块空地就够了。",
    tags: ["室内外", "内啡肽", "节奏奖赏", "掌控感", "多巴胺"],
    lab: "rope"
  },
  {
    id: "tabletennis",
    cat: "fun",
    name: "乒乓球",
    emoji: "🏓",
    hook: "球台两边，快乐就在一来一回。",
    why: "乒乓球是毫秒级的反应游戏：球一来你就得判断旋转、落点、出手，每一次成功回球都是一次即时正反馈，心流很容易就进来。比分你永远猜不准下一分归谁，变比率强化把多巴胺喂得停不下来；赢下关键一分的多巴胺峰值，和输球想「再来」的近因效应，正好凑成让人上桌就下不来的循环。约上朋友，还是现成的社交。",
    tags: ["室内外", "多巴胺", "变比率强化", "心流", "社交"],
    lab: "tabletennis"
  },
  {
    id: "football",
    cat: "fun",
    name: "踢足球",
    emoji: "⚽",
    hook: "野球场一开，班上的破事全忘了。",
    why: "足球把奔跑、配合和进球打包成一颗多巴胺礼盒：长距离跑动催出内啡肽，传切跑位带来掌控感与心流，而进球那一刻的全队欢呼，是社交绑定 + 多巴胺峰值的双重暴击。哪怕只是野球场踢着玩，脚尖把球黏住的那个瞬间，也会让你忘记白天的烦恼。",
    tags: ["室外", "多巴胺", "内啡肽", "社交", "心流"],
    lab: "football"
  },
  {
    id: "tennis",
    cat: "fun",
    name: "打网球",
    emoji: "🎾",
    hook: "发球、救球、再发球，自己跟自己较劲。",
    why: "网球是自己和自己拉锯的有氧博弈：底线对拉时心率起伏像坐过山车，内啡肽在线；每一拍落点的掌控感、打出制胜分的多巴胺，和「下一球能不能 ACE」的变比率强化，让你一个人也能打得很上头。整套动作自带节奏，容易滑进心流。",
    tags: ["室外", "多巴胺", "内啡肽", "心流", "变比率强化"],
    lab: "tennis"
  },

  /* ---------------- 怀旧：上个世纪的玩法（怕以后没了，先记下来） ---------------- */
  {
    id: "pog",
    cat: "fun",
    name: "拍画片",
    emoji: "🃏",
    hook: "把洋画拍得翻过来，那一巴掌的脆响比中奖还爽。",
    why: "拍画片是纯粹的变比率强化：你永远不知道这一下能不能翻过来，不确定性把每一次出掌都变成一次小赌注。而巴掌拍在水泥地上的脆响加上赢来一沓战利品的掌控感，是那个没有屏幕的童年最上头的多巴胺。",
    tags: ["怀旧", "室外", "变比率强化", "多巴胺", "操作性条件反射"],
    lab: "pog"
  },
  {
    id: "shuttlecock",
    cat: "fun",
    name: "踢毽子",
    emoji: "🪶",
    hook: "毽子落回脚背的那一下，节奏就接上了。",
    why: "踢毽子是身体版的操作性条件反射：脚背、脚侧、膝盖轮流接住落下的毽子，每一次稳稳接住都是一次即时反馈，连续的计数还会把人带进心流。它没有裁判没有输赢，只是你和一团羽毛的默契。",
    tags: ["怀旧", "室外", "操作性条件反射", "心流", "多巴胺"],
    lab: "shuttlecock"
  },
  {
    id: "rubberband",
    cat: "fun",
    name: "跳皮筋",
    emoji: "🪢",
    hook: "一二三四五六七，马兰开花二十一。",
    why: "跳皮筋把口令和跳跃绑成了节奏奖赏：童谣的拍子替你数着步点，身体跟着节奏自动运转，焦虑和杂念被节拍挡在外面。一群人轮流撑皮筋、轮着跳，社交和心流一起在线。",
    tags: ["怀旧", "室外", "节奏奖赏", "心流", "多巴胺"],
    lab: "rubberband"
  },
  {
    id: "top",
    cat: "fun",
    name: "抽陀螺",
    emoji: "🌀",
    hook: "鞭子一甩，陀螺转得越久你越得意。",
    why: "抽陀螺是延迟满足的爽：你得先绕绳、甩腕让它立起来，再用一鞭一鞭的精准维持旋转——每一次加鞭都是一次操作性条件反射的确认。陀螺嗡嗡转着，时间也跟着慢下来。",
    tags: ["怀旧", "室外", "操作性条件反射", "感官奖赏", "多巴胺"],
    lab: "top"
  },
  {
    id: "marbles",
    cat: "fun",
    name: "弹玻璃球",
    emoji: "🔵",
    hook: "瞄准、弹指，把别人的珠子弹进坑里。",
    why: "弹珠是精确到毫米的操作性条件反射：你趴在地上眯着眼算角度，弹出的那一刻全凭手感。赢了对方的珠子是变比率强化——你永远想再来一颗，把兜里赢成一小袋。",
    tags: ["怀旧", "室外", "变比率强化", "操作性条件反射", "多巴胺"],
    lab: "marbles"
  },
  {
    id: "paperplane",
    cat: "fun",
    name: "折纸飞机",
    emoji: "✈️",
    hook: "哈一口气，松手，看它滑过半个球场。",
    why: "折纸飞机把掌控感折进了纸里：你调整机头、机翼的弧度，赌它能飞更远。而当它真的滑翔出去，那种我造的东西会飞的成就感，是心流加多巴胺的双重结算。",
    tags: ["怀旧", "室外", "心流", "掌控感", "多巴胺"],
    lab: "paperplane"
  },
  {
    id: "hoop",
    cat: "fun",
    name: "滚铁环",
    emoji: "⚪",
    hook: "铁钩一推，铁圈咕噜咕噜跟着你跑。",
    why: "滚铁环练的是细腻的平衡：推力稍大就冲、稍小就倒，你用手里的铁钩和圈保持着一种微妙的谈判。这种低刺激高专注的玩法，反而最容易让人忘了回家吃饭。",
    tags: ["怀旧", "室外", "操作性条件反射", "心流"],
    lab: "hoop"
  },
  {
    id: "hopscotch",
    cat: "fun",
    name: "跳房子",
    emoji: "⬛",
    hook: "单脚跳，捡起瓦片，再原路跳回来。",
    why: "跳房子是规则清晰的节奏奖赏：格子、瓦片、单双脚的切换构成一套不用教的仪式，每跳一格都是一次即时反馈。它便宜到只需要一块粉笔，却能让一下午都有奔头。",
    tags: ["怀旧", "室外", "节奏奖赏", "多巴胺"],
    lab: "hopscotch"
  },
  {
    id: "beanbag",
    cat: "fun",
    name: "丢沙包",
    emoji: "🎯",
    hook: "中间的人左躲右闪，就为不被砸中出局。",
    why: "丢沙包把操作性条件反射和社交绑在一起：场上的要闪、场边的要砸，每一次惊险躲过都是一次多巴胺小脉冲，而被砸中的懊恼反而让下一局更想上。一群人的午后就这么过去了。",
    tags: ["怀旧", "室外", "操作性条件反射", "社交", "多巴胺"],
    lab: "beanbag"
  },
  {
    id: "stones",
    cat: "fun",
    name: "抓石子",
    emoji: "🪨",
    hook: "五颗小石子在手里翻飞，漏一颗就重来。",
    why: "抓石子是手眼协调的操作性条件反射：抛起、抓取、接住要在半秒里完成，每一次稳稳接住都是一次即时反馈。它零成本、随身带，是课间十分钟最容易被忽略的专注训练。",
    tags: ["怀旧", "室外", "操作性条件反射", "心流"],
    lab: "stones"
  },
  {
    id: "stringfig",
    cat: "fun",
    name: "翻花绳",
    emoji: "🧵",
    hook: "十指翻绕，绳子在两人手里变出花样。",
    why: "翻花绳是两人协作的心流：一根线在指尖绕来绕去，变成梯子、面条、降落伞，每一次成功翻出花样都是一次共同的操作性条件反射。它不耗钱不耗电，只耗一点耐心和默契。",
    tags: ["怀旧", "室内", "心流", "操作性条件反射"],
    lab: "stringfig"
  },
  {
    id: "cockfight",
    cat: "fun",
    name: "斗鸡",
    emoji: "🐔",
    hook: "单脚独立，膝盖互顶，看谁先落地。",
    why: "斗鸡（撞拐）是孩子的力量博弈：你金鸡独立、用膝盖去顶对方，平衡和蛮力同时在线。赢的那一下伴随一阵欢呼，多巴胺和社交奖赏一起到账——当然，放学回家多半要挨说腿青了。",
    tags: ["怀旧", "室外", "多巴胺", "社交"],
    lab: "cockfight"
  },
  {
    id: "eaglechick",
    cat: "fun",
    name: "老鹰捉小鸡",
    emoji: "🐥",
    hook: "鸡妈妈张开手，老鹰绕来绕去想抓最后那只。",
    why: "老鹰捉小鸡是集体即兴的社交爽点：你当老鹰时全神贯注算路线，当小鸡时死死拽着前面人的衣角。追逐里的尖叫和笑声，是廉价的、没有屏幕的多巴胺。",
    tags: ["怀旧", "室外", "社交", "多巴胺"],
    lab: "eaglechick"
  },
  {
    id: "hideseek",
    cat: "fun",
    name: "捉迷藏",
    emoji: "🫥",
    hook: "数到一百，屏住呼吸，听见脚步越来越近。",
    why: "捉迷藏把 suspense 做成了游戏：躲的人等着被找到的紧张、找的人发现目标瞬间的惊喜，都是即时兑现的多巴胺。它不需要任何道具，却能让整片院子变成冒险场。",
    tags: ["怀旧", "室外", "多巴胺", "社交"],
    lab: "hideseek"
  },
  {
    id: "cards90",
    cat: "fun",
    name: "集卡（小浣熊）",
    emoji: "🍜",
    hook: "拆开干脆面，先摸卡不先吃面。",
    why: "90 后的集卡是现实版的开盲盒：你永远不知道下一包里是哪张，变比率强化让你一包接一包地买。凑齐一套的满足感，比面本身香——这也是最早的为爱发电。",
    tags: ["怀旧", "室内", "变比率强化", "多巴胺"],
    lab: "cards90"
  },
  {
    id: "comic",
    cat: "fun",
    name: "看连环画",
    emoji: "📖",
    hook: "租一本小人书，蹲在书摊能看一下午。",
    why: "看连环画是低成本的叙事传输：你沉浸进一格格的画面，现实的压力被暂时卸载，副交感上线。几分钱租一本、和同学传着看，是那个没有短视频的童年最便宜的逃离。",
    tags: ["怀旧", "室内", "叙事传输", "多巴胺"],
    lab: "comic"
  },
  {
    id: "snowball",
    cat: "fun",
    name: "打雪仗",
    emoji: "❄️",
    hook: "攥个雪球，趁人不备砸他后背。",
    why: "打雪仗把社交和感官奖赏打包：雪的冰凉、砸中的脆响、四散逃开的笑声，每一次命中都是一次即时多巴胺。它只在冬天出现，所以每次下雪都像过节。",
    tags: ["怀旧", "室外", "多巴胺", "社交", "感官奖赏"],
    lab: "snowball"
  },
  {
    id: "firecracker",
    cat: "fun",
    name: "放鞭炮",
    emoji: "🧨",
    hook: "点着引信撒腿就跑，啪的一声回头笑。",
    why: "放鞭炮是浓缩的感官奖赏：引信嗤嗤的期待、炸响瞬间的惊与爽，是变比率强化里最响的一下。它只在过年出现，所以那一声炮响，是童年关于年最具体的记忆。",
    tags: ["怀旧", "室外", "感官奖赏", "多巴胺"],
    lab: "firecracker"
  }
];

/* 标签由条目自动汇总（app.js 也会用，但先算好备用） */
window.GUIDE_TAGS = (function () {
  var set = {};
  window.GUIDE_ITEMS.forEach(function (it) {
    it.tags.forEach(function (t) { set[t] = (set[t] || 0) + 1; });
  });
  return Object.keys(set).map(function (t) { return { name: t, count: set[t] }; });
})();

/* 多巴胺指数（0-100）：分泌多巴胺的强度，越高越「上头」
   与 GUIDE_ITEMS 通过 id 关联，便于单独维护 */
window.GUIDE_DOPAMINE = {
  binge: 70,
  blindbox: 95,
  cat: 80,
  replay: 85,
  slack: 60,
  shortvideo: 92,
  milktea: 78,
  luosifen: 70,
  noodle: 72,
  fried: 82,
  hotpot: 88,
  dessert: 90,
  sport: 65,
  basketball: 80,
  swimming: 72,
  cycling: 75,
  gym: 82,
  badminton: 78,
  yoga: 68,

  /* 常见宠物 */
  dog: 82,
  aquarium: 55,
  hamster: 72,
  parrot: 70,
  rabbit: 68,

  /* 异宠 */
  gecko: 62,
  pacmanfrog: 58,
  cornsnake: 66,
  sugarglider: 78,
  hedgehog: 70,
  tarantula: 74,
  hermitcrab: 60,
  axolotl: 65,

  /* 社交桌游 */
  werewolf: 88,
  jubensha: 84,
  mahjong: 86,
  cards: 82,
  perler: 60,
  hiking: 75,
  podcast: 70,
  craft: 68,
  homecook: 75,
  origami: 55, meditation: 25, jigsaw: 50, coffee: 45,
  fishing: 78, archery: 82, skateboard: 80, ski: 75, surf: 78, climbing: 80, skydive: 70,
  billiards: 76, frisbee: 74, camping: 60, paragliding: 72, balloon: 55, coaster: 85,
  gokart: 82, kite: 50, rafting: 76, lego: 78, karaoke: 70, reading: 45, darts: 72,
  plants: 50, picnic: 65, beach: 80, stargaze: 48,
  pog: 88, shuttlecock: 70, rubberband: 65, top: 72, marbles: 85, paperplane: 68,
  hoop: 60, hopscotch: 62, beanbag: 75, stones: 66, stringfig: 64, cockfight: 78,
  eaglechick: 70, hideseek: 76, cards90: 90, comic: 72, snowball: 80, firecracker: 84
};

/* 内啡肽指数（0-100）：分泌内啡肽的强度，越高越「爽/痛后快感」
   与 GUIDE_ITEMS 通过 id 关联，便于单独维护 */
window.GUIDE_ENDORPHIN = {
  binge: 25,
  blindbox: 20,
  cat: 45,
  replay: 30,
  slack: 25,
  shortvideo: 25,
  milktea: 30,
  luosifen: 35,
  noodle: 35,
  fried: 40,
  hotpot: 85,
  dessert: 35,
  sport: 90,
  basketball: 82,
  swimming: 80,
  cycling: 78,
  gym: 72,
  badminton: 75,
  yoga: 55,

  /* 常见宠物 */
  dog: 58,
  aquarium: 48,
  hamster: 40,
  parrot: 38,
  rabbit: 44,

  /* 异宠 */
  gecko: 36,
  pacmanfrog: 30,
  cornsnake: 50,
  sugarglider: 52,
  hedgehog: 45,
  tarantula: 54,
  hermitcrab: 36,
  axolotl: 42,

  /* 社交桌游 */
  werewolf: 38,
  jubensha: 40,
  mahjong: 36,
  cards: 34,
  perler: 55,
  hiking: 86,
  podcast: 35,
  craft: 55,
  homecook: 80,
  origami: 65, meditation: 80, jigsaw: 70, coffee: 75,
  fishing: 55, archery: 40, skateboard: 60, ski: 85, surf: 70, climbing: 75, skydive: 95,
  billiards: 35, frisbee: 50, camping: 80, paragliding: 90, balloon: 70, coaster: 80,
  gokart: 45, kite: 40, rafting: 75, lego: 40, karaoke: 60, reading: 55, darts: 30,
  plants: 60, picnic: 45, beach: 50, stargaze: 65,
  pog: 35, shuttlecock: 55, rubberband: 50, top: 45, marbles: 35, paperplane: 50,
  hoop: 55, hopscotch: 50, beanbag: 50, stones: 48, stringfig: 50, cockfight: 70,
  eaglechick: 55, hideseek: 55, cards90: 30, comic: 55, snowball: 75, firecracker: 40
};

/* 类别分类（美食 / 宠物 / 电竞 / 娱乐 / 潮玩 / 职场 / 运动）
   与 GUIDE_ITEMS 通过 id 关联，便于单独维护 */
window.GUIDE_GENRES = {
  binge: "娱乐",
  blindbox: "潮玩",
  cat: "宠物",
  replay: "电竞",
  slack: "职场",
  shortvideo: "娱乐",
  milktea: "美食",
  luosifen: "美食",
  noodle: "美食",
  fried: "美食",
  hotpot: "美食",
  dessert: "美食",
  sport: "运动",
  basketball: "运动",
  swimming: "运动",
  cycling: "运动",
  gym: "运动",
  badminton: "运动",
  yoga: "运动",

  /* 常见宠物 */
  dog: "宠物",
  aquarium: "宠物",
  hamster: "宠物",
  parrot: "宠物",
  rabbit: "宠物",

  /* 异宠 */
  gecko: "异宠",
  pacmanfrog: "异宠",
  cornsnake: "异宠",
  sugarglider: "异宠",
  hedgehog: "异宠",
  tarantula: "异宠",
  hermitcrab: "异宠",
  axolotl: "异宠",

  /* 社交桌游 */
  werewolf: "桌游",
  jubensha: "桌游",
  mahjong: "桌游",
  cards: "桌游",
  perler: "潮玩",
  hiking: "运动",
  podcast: "娱乐",
  craft: "潮玩",
  homecook: "美食",
  /* 拓展：室内 · 室外 · 高空 · 低空 */
  fishing: "运动", archery: "运动", skateboard: "运动", ski: "运动", surf: "运动", climbing: "运动",
  skydive: "运动", billiards: "运动", frisbee: "运动", camping: "运动", paragliding: "运动",
  gokart: "运动", kite: "运动",
  balloon: "娱乐", coaster: "娱乐", karaoke: "娱乐", reading: "娱乐", darts: "娱乐",
  picnic: "娱乐", beach: "娱乐", stargaze: "娱乐",
  lego: "潮玩",
  /* 怀旧：上个世纪的玩法 */
  pog: "怀旧", shuttlecock: "怀旧", rubberband: "怀旧", top: "怀旧", marbles: "怀旧", paperplane: "怀旧",
  hoop: "怀旧", hopscotch: "怀旧", beanbag: "怀旧", stones: "怀旧", stringfig: "怀旧", cockfight: "怀旧",
  eaglechick: "怀旧", hideseek: "怀旧", cards90: "怀旧", comic: "怀旧", snowball: "怀旧", firecracker: "怀旧"
};

/* =========================================================
   受众 & 耗时维度（高速上班族 / 无聊族 可以做什么）
   与 GUIDE_ITEMS 通过 id 关联，便于单独维护：
   - GUIDE_AUDIENCE: id -> "busy"(高速上班族) | "bored"(无聊族) | "both"(通用)
   - GUIDE_DURATION: id -> 预计耗时（分钟，用于排序与卡片展示）
   ========================================================= */
window.GUIDE_AUDIENCE = {
  /* 高速上班族：忙、碎片时间，优先短耗时 */
  blindbox: "busy", slack: "busy", shortvideo: "busy", milktea: "busy",
  luosifen: "busy", noodle: "busy", fried: "busy", dessert: "busy", dog: "busy",
  /* 无聊族：闲、有大把时间，优先沉浸/长耗时 */
  binge: "bored", replay: "bored", hotpot: "bored", aquarium: "bored",
  parrot: "bored", gecko: "bored", pacmanfrog: "bored", cornsnake: "bored",
  sugarglider: "bored", hedgehog: "bored", tarantula: "bored", hermitcrab: "bored",
  axolotl: "bored", werewolf: "bored", jubensha: "bored", mahjong: "bored",
  cards: "bored", perler: "bored", hiking: "bored",
  /* 通用：两类人都能做 */
  cat: "both", sport: "both", basketball: "both", swimming: "both", cycling: "both",
  gym: "both", badminton: "both", yoga: "both", hamster: "both", rabbit: "both",
  podcast: "busy", craft: "busy", homecook: "both",
  fishing: "both", archery: "both", skateboard: "both", ski: "both", climbing: "both",
  billiards: "both", frisbee: "both", camping: "both", gokart: "both", kite: "both",
  lego: "both", karaoke: "both", reading: "both", darts: "both", plants: "both",
  picnic: "both", stargaze: "both",
  surf: "bored", skydive: "bored", paragliding: "bored", rafting: "bored", beach: "bored",
  balloon: "bored", coaster: "both",
  pog: "both", shuttlecock: "both", rubberband: "both", top: "both", paperplane: "both", hoop: "both",
  stringfig: "both", comic: "both",
  marbles: "bored", hopscotch: "bored", beanbag: "bored", stones: "bored", cockfight: "bored",
  eaglechick: "bored", hideseek: "bored", cards90: "bored", snowball: "bored", firecracker: "bored"
};

window.GUIDE_DURATION = {
  binge: 150, blindbox: 15, cat: 20, replay: 90, slack: 20, shortvideo: 15,
  milktea: 15, luosifen: 30, noodle: 20, fried: 25, hotpot: 90, dessert: 15,
  sport: 45, basketball: 60, swimming: 45, cycling: 60, gym: 60, badminton: 60,
  yoga: 45, dog: 25, aquarium: 40, hamster: 20, parrot: 30, rabbit: 20, gecko: 30,
  pacmanfrog: 20, cornsnake: 25, sugarglider: 30, hedgehog: 20, tarantula: 20,
  hermitcrab: 25, axolotl: 30, werewolf: 90, jubensha: 180, mahjong: 150,
  cards: 60, perler: 60, hiking: 180,
  podcast: 40, craft: 15, homecook: 120,
  fishing: 120, archery: 60, skateboard: 90, ski: 240, surf: 180, climbing: 120, skydive: 180,
  billiards: 90, frisbee: 60, camping: 1440, paragliding: 120, balloon: 240, coaster: 30,
  gokart: 30, kite: 60, rafting: 120, lego: 180, karaoke: 90, reading: 60, darts: 45,
  plants: 30, picnic: 120, beach: 120, stargaze: 90,
  pog: 45, shuttlecock: 30, rubberband: 30, top: 40, marbles: 40, paperplane: 20,
  hoop: 40, hopscotch: 30, beanbag: 45, stones: 25, stringfig: 30, cockfight: 20,
  eaglechick: 30, hideseek: 40, cards90: 15, comic: 60, snowball: 60, firecracker: 20
};

/* =========================================================
   成本 & 门槛维度（帮助人快速判断「我现在能不能玩、要不要花钱」）
   与 GUIDE_ITEMS 通过 id 关联：
   - GUIDE_COST:  id -> 0 免费 | 1 小钱 | 2 需准备/装备
   - GUIDE_LEVEL: id -> 0 新手友好 | 1 要上手 | 2 需钻研
   ========================================================= */
window.GUIDE_COST = {
  binge: 0, blindbox: 1, cat: 1, replay: 1, slack: 0, shortvideo: 0, milktea: 1, luosifen: 1,
  noodle: 1, fried: 1, hotpot: 1, dessert: 1, sport: 0, basketball: 2, swimming: 2, cycling: 2,
  gym: 2, badminton: 2, yoga: 2, dog: 2, aquarium: 2, hamster: 2, parrot: 2, rabbit: 2,
  gecko: 2, pacmanfrog: 2, cornsnake: 2, sugarglider: 2, hedgehog: 2, tarantula: 2, hermitcrab: 2,
  axolotl: 2, werewolf: 1, jubensha: 1, mahjong: 2, cards: 0, perler: 1, hiking: 0,
  podcast: 0, craft: 1, homecook: 1, origami: 0, meditation: 0, jigsaw: 1, coffee: 1,
  fishing: 1, archery: 2, skateboard: 1, ski: 2, surf: 2, climbing: 2, skydive: 2,
  billiards: 1, frisbee: 0, camping: 1, paragliding: 2, balloon: 2, coaster: 1,
  gokart: 1, kite: 0, rafting: 1, lego: 1, karaoke: 0, reading: 0, darts: 0,
  plants: 0, picnic: 0, beach: 0, stargaze: 0,
  pog: 0, shuttlecock: 0, rubberband: 0, top: 1, marbles: 0, paperplane: 0,
  hoop: 1, hopscotch: 0, beanbag: 0, stones: 0, stringfig: 0, cockfight: 0,
  eaglechick: 0, hideseek: 0, cards90: 1, comic: 1, snowball: 0, firecracker: 1
};

window.GUIDE_LEVEL = {
  binge: 0, blindbox: 0, cat: 0, replay: 1, slack: 0, shortvideo: 0, milktea: 0, luosifen: 0,
  noodle: 0, fried: 0, hotpot: 1, dessert: 0, sport: 0, basketball: 1, swimming: 1, cycling: 1,
  gym: 1, badminton: 1, yoga: 0, dog: 1, aquarium: 2, hamster: 0, parrot: 2, rabbit: 0,
  gecko: 2, pacmanfrog: 1, cornsnake: 2, sugarglider: 2, hedgehog: 1, tarantula: 1, hermitcrab: 1,
  axolotl: 2, werewolf: 1, jubensha: 1, mahjong: 1, cards: 0, perler: 0, hiking: 1,
  podcast: 0, craft: 0, homecook: 1, origami: 0, meditation: 0, jigsaw: 1, coffee: 1,
  fishing: 0, archery: 1, skateboard: 1, ski: 1, surf: 2, climbing: 1, skydive: 2,
  billiards: 1, frisbee: 0, camping: 1, paragliding: 2, balloon: 0, coaster: 0,
  gokart: 0, kite: 0, rafting: 1, lego: 1, karaoke: 0, reading: 0, darts: 0,
  plants: 0, picnic: 0, beach: 0, stargaze: 0,
  pog: 0, shuttlecock: 0, rubberband: 0, top: 1, marbles: 0, paperplane: 0,
  hoop: 0, hopscotch: 0, beanbag: 0, stones: 0, stringfig: 0, cockfight: 0,
  eaglechick: 0, hideseek: 0, cards90: 0, comic: 0, snowball: 0, firecracker: 0
};

/* =========================================================
   「怎么玩」教学（项目核心：教人们如何进行这项娱乐）
   与 GUIDE_ITEMS 通过 id 关联：
   { need:[准备], steps:[步骤], tip:提示,
     busy:[忙里偷闲党精简步骤], bored:[闲得发慌党沉浸步骤] }
   ========================================================= */
window.GUIDE_HOW = {
  binge: { need:["一部剧","舒服的坐姿"], steps:["挑一部攒了很久的，别纠结从哪集开始","关掉「这集结束就睡」的念头，先爽了再说","备好水和毯子，手机调勿扰"], tip:"定个最晚停的时间，明天的活留给明天的自己。", bored:["挑一部长剧，备好熬夜装备","连看几集把情绪一次喂饱","看完写两句感想，仪式感拉满"] },
  blindbox: { need:["一个盲盒"], steps:["先摇先掂，给期待加点戏","拆前默念：抽到啥都算赢","拆完拍个照，是雷也值一笑"], busy:["通勤或午休顺手抽一个，30 秒快乐","别囤，一次一个最上头"], tip:"快乐在「未知」不在「拥有」，别为隐藏款上头。" },
  cat: { need:["一只猫，或一家猫咖"], steps:["伸手让它闻，别急着撸","从下巴和脸颊顺毛轻揉","听它呼噜，你就赢了"], tip:"它想走就放它走，强撸会失去信任。" },
  replay: { need:["一款游戏","不被打扰的时间"], steps:["先定「就两把」的底线","每把复盘一个点：刚才哪步能更好","到点停，把「差一点」留给下次"], bored:["约朋友开黑，把输赢变社交","挑战一个一直打不过的关卡"], tip:"近因效应会骗你「我很行」，输了就停最省钱。" },
  slack: { need:["一份正经工作","一个摸鱼借口"], steps:["挑老板不在的空档，做点自己的小事","设 15 分钟闹钟，到点切回正事","做完默默收尾，别留痕迹"], busy:["会议里假装记笔记实则放空","等加载时做三个深呼吸"], tip:"摸鱼有利息，堆的活会在下班后反噬。" },
  shortvideo: { need:["手机","一点碎片时间"], steps:["先定「只看 5 条」的限额","每刷几条抬头看远处，打断自动播放","最好笑的一条存下来，其余放过"], busy:["等车、排队时刷，别带上床","开个定时关闭，防天亮"], tip:"算法专治自律，靠限额不靠意志。" },
  milktea: { need:["一家奶茶店","口渴的借口"], steps:["挑一个没试过的小料组合","第一口慢慢喝，记住这个味道","顺便走走，别边工作边吨"], busy:["下午三点来一杯，续命专用"], tip:"三分糖起步，快乐和血糖都稳一点。" },
  luosifen: { need:["一包螺蛳粉","能通风的厨房"], steps:["粉先泡软再煮，口感更弹","酸笋别怕，它是灵魂","配个青菜，罪恶感减半"], busy:["午休煮一袋，15 分钟回血"], tip:"味道很猛，注意同事关系。" },
  noodle: { need:["一把面","一个锅"], steps:["水开下面，计时比感觉准","调自己喜欢的酱：酱油+醋+辣","最后来勺面汤，比高汤还鲜"], busy:["煮面前先烧水，利用等待回消息"], tip:"剩一点汤拌开，是这碗面的精华。" },
  fried: { need:["想炸的东西","油+锅"], steps:["油温拿筷子试：冒小泡就下","一次别太多，分批炸更脆","炸完吸油，趁热吃"], busy:["买现成炸物，省油省事"], tip:"油温不够会吸油变腻，宁热勿温。" },
  hotpot: { need:["锅+底料","一堆食材"], steps:["先下耐煮的（萝卜、菌菇）吊汤","荤素岔开下，别一锅炖","蘸料按自己口味调，别抄别人的"], bored:["约三五人，边煮边聊一下午","自己调个「深水炸弹」蘸料挑战"], tip:"先煮点东西垫胃，别空腹猛涮。" },
  dessert: { need:["甜品店或食材","一点馋"], steps:["挑一个没吃过的","第一口专心吃，别刷手机","和朋友分着吃，快乐翻倍"], busy:["午休买一块，五分钟治愈"], tip:"甜是即时的多巴胺，别用它填情绪。" },
  sport: { need:["一身能动的衣服","一块空地"], steps:["别想「练什么」，先出门走起来","找个能说话但不轻松的强度","结束后拉伸，明天不酸"], tip:"动起来比动多久重要，5 分钟也算数。" },
  basketball: { need:["一颗球","半场"], steps:["先投篮找手感，别急着对抗","约朋友打半场最省力","输赢不重要，流汗就行"], tip:"护好膝盖，热身别省。" },
  swimming: { need:["泳衣","泳池"], steps:["先热身再下水，防抽筋","别追求速度，匀速最省力","游完拉伸肩颈"], tip:"不会换气就从浮板开始。" },
  cycling: { need:["一辆车","头盔"], steps:["先调坐垫高度，膝盖微屈最佳","挑一条绿道，别硬刚马路","匀速踩，欣赏路两边"], tip:"遵守交规，夜骑开灯。" },
  gym: { need:["健身卡","一份计划"], steps:["新手先学动作再加重","全身分化练，别只练胸","记录重量，看到进步"], tip:"动作标准比重量重要，伤了就得停。" },
  badminton: { need:["拍+球","场地"], steps:["先对拉找手感","约水平相近的，打着不累","打完拉伸手臂"], tip:"手腕别硬掰，易伤。" },
  yoga: { need:["一张垫子","瑜伽服"], steps:["从基础体式开始，别硬掰","关注呼吸，不在动作多标准","每次 15 分钟也有效"], tip:"疼就停，瑜伽不是受苦。" },
  dog: { need:["一只狗，或朋友家的"], steps:["先让它闻手背再摸","遛弯让它 sniff 探索，别拽","回家擦脚，仪式感"], busy:["午休溜一圈，狗累你回血"], tip:"没养就撸别人的，别冲动养。" },
  aquarium: { need:["缸+过滤","鱼和水草"], steps:["先养水一周再放鱼","少喂食，喂多水易坏","每周换 1/3 水"], bored:["布置造景一下午，像搭微观世界","观察鱼群行为能看很久"], tip:"新手从孔雀鱼开始，皮实好养。" },
  hamster: { need:["笼子","垫料"], steps:["笼子越大越好，给个跑轮","喂粮+偶尔蔬果","别强行抓，让它熟悉你的手"], tip:"夜行动物，白天别硬撸。" },
  parrot: { need:["笼子","鹦鹉粮"], steps:["先静养几天，别急着摸","用食物建立信任","教简单口令，每天几分钟"], bored:["训练说话能玩好几个月","做益智玩具消耗它的精力"], tip:"寿命长，养前想清楚。" },
  rabbit: { need:["笼子/围栏","兔粮+草"], steps:["主食是提摩西草不是菜","放风让它蹦，别关死","定点厕所从小教"], tip:"兔子怕热，夏天要降温。" },
  gecko: { need:["饲养箱","加热+UVB"], steps:["温度是第一要务，备加热垫","放 hide 躲避，给它安全感","喂昆虫，钙粉必撒"], bored:["布置生态箱能折腾一下午"], tip:"守宫要恒温，温差易生病。" },
  pacmanfrog: { need:["饲养箱","水盆"], steps:["保持湿度，垫料微潮","喂蟋蟀，别喂太大","少打扰，它是伏击型"], tip:"它不动别以为死了。" },
  cornsnake: { need:["饲养箱","加热"], steps:["备好温控，蛇怕温差","喂冻鼠，解冻再喂","蜕皮期保湿别捞"], bored:["造景+记录蜕皮，养成系"], tip:"新手友好蛇，但别裸手喂。" },
  sugarglider: { need:["大笼","专门粮"], steps:["必须成对养，单只易抑郁","夜行，晚上陪玩","用 pouch 建立依恋"], bored:["训练上手能玩很久"], tip:"寿命 10 年+，慎重。" },
  hedgehog: { need:["饲养箱","跑轮"], steps:["温度 27 度上下，怕冷","喂专门粮+虫","用气味建立信任，别硬抓"], tip:"冬天必须保温，易冬眠死亡。" },
  tarantula: { need:["饲养盒","底材"], steps:["懒人宠物，喂虫少管","保持湿度别过湿","别上手，看就行"], tip:"毒性弱但咬了也疼，观赏为主。" },
  hermitcrab: { need:["缸","若干空壳"], steps:["备多个空壳供它换","保持湿度，给海水盆","别单养，群养更活跃"], tip:"换壳时会躲，别惊扰。" },
  axolotl: { need:["缸","冷水机可选"], steps:["水温别超 22 度，它怕热","喂红虫/虾，别喂太大","低水流，过滤器要温和"], bored:["造景+记录生长，养成系"], tip:"水质是第一，勤换水。" },
  werewolf: { need:["一套狼人杀","6-12 人"], steps:["先看规则，别一上来就玩","从神职以外的角色入门","发言别太长，听别人逻辑"], bored:["组织一局能玩一晚上","复盘谁是狼，提升神技"], tip:"别首夜就自爆，乐趣在推理。" },
  jubensha: { need:["一个剧本","4-8 人"], steps:["挑新手本，别一上来硬核","先读自己本，别剧透","沉浸角色，别跳戏"], bored:["约一整天，沉浸式演完","换不同本体验不同人生"], tip:"别场外，剧透毁所有快乐。" },
  mahjong: { need:["一副麻将","4 人"], steps:["先学番种和碰杠胡","从广东/四川规则选一种","输赢看淡，搓的是氛围"], bored:["约一桌能搓一下午"], tip:"别上头加注，娱乐为主。" },
  cards: { need:["一副扑克"], steps:["挑一种想玩的（斗地主/掼蛋）","先学规则再上桌","约两三朋友就能开"], tip:"斗地主三人，掼蛋四人。" },
  perler: { need:["拼豆+模板","烫纸"], steps:["按图纸摆豆，别急","熨烫时隔纸轻压","冷却后揭下就是成品"], bored:["拼一大幅能坐一下午"], tip:"豆别摆太松，烫完会散。" },
  hiking: { need:["鞋+水","一条路线"], steps:["先查路线和里程，别野路乱闯","轻装，水比装备重要","按自己节奏走，别追人"], bored:["挑一条长线走一整天","沿途拍照记录风景"], tip:"天黑前下山，定位要开。" },
  podcast: { need:["耳机","播客 App"], steps:["按兴趣挑一档，别贪多","通勤/家务时听最省时间","听到有用就记下"], busy:["通勤路上听一期，碎片变收获"], tip:"倍速别太快，听懂才值。" },
  craft: { need:["材料包","半小时"], steps:["挑低门槛的（戳戳绣/流体熊）","跟着教程一步步来","做完摆桌上，成就感拉满"], busy:["午休做一个小挂件，15 分钟回血"], tip:"成品不重要，过程在养心。" },
  homecook: { need:["食材","厨房"], steps:["先想好做几道，别贪多","从一道简单的练手","享受切菜和火候的节奏"], tip:"做给自己吃，不求好看求开心。" },
  origami: { need:["一张纸"], steps:["从千纸鹤/纸飞机入门","跟着视频一步步折","折完摆一排，看着就爽"], tip:"纸越方越容易对齐。" },
  meditation: { need:["一个安静角落"], steps:["坐舒服，闭眼","把注意力放呼吸，数到 10 再循环","念头飘走就轻轻拉回"], tip:"不用「学会」，开始数呼吸就行。" },
  jigsaw: { need:["一盒拼图","平整桌面"], steps:["先拼边框定范围","按颜色分区找","卡住就换块，别死磕"], bored:["挑 1000 片以上，沉浸一下午"], tip:"倒出来铺满桌，过程比完成爽。" },
  coffee: { need:["手冲壶","咖啡粉"], steps:["粉水比 1:15 起步","先润湿粉床闷蒸 30 秒","绕圈注水，看它滴成一杯"], tip:"水温 90 度左右，别用沸水。" },
  fishing: { need:["鱼竿或一根线","一片有水的地方"], steps:["找安静的水边，别挑人吵的","挂饵抛竿，然后……等","浮漂一顿就提竿，别犹豫"], tip:"钓不到也别急，发呆本身就是目的。", bored:["守一下午看水面发呆","拍张浮漂特写发朋友圈"] },
  archery: { need:["弓+箭","一片安全靶场"], steps:["先练站姿和举弓，别急着射","瞄准黄心，呼气末撒放","看箭扎哪，再调"], tip:"新手从反曲弓或复合弓入门，别上来就传统弓。", bored:["打一局靶纸挑战","练到稳定进黄心"] },
  skateboard: { need:["一块板","一片平地"], steps:["先练上板站稳，别急着动","推起来找平衡","想练招先练 ollie"], tip:"护具比酷重要，摔的是地砖不是草坪。", bored:["刷街一圈","练会一个动作爽一周"] },
  ski: { need:["雪场+雪具","一件厚外套"], steps:["先学犁式刹车，能停才敢滑","再学卡宾转弯","跟教练或朋友，别野雪独行"], tip:"第一次去选初级道，摔也摔不狠。", bored:["滑一整天不重样","挑战一条新雪道"] },
  surf: { need:["冲浪板","一片有浪的海"], steps:["先在沙滩练趴板划水","看浪，挑小一点的上","站起来那下别慌"], tip:"新手选软板+教练，安全又快上手。", bored:["追一上午浪","等一个完美浪够吹一个月"] },
  climbing: { need:["攀岩馆或岩壁","一双岩鞋"], steps:["先爬最简单的线找脚感","只盯下一个支点，别看下面","下来再想动作"], tip:"室内馆最安全，新手友好。", bored:["磕一条线一下午","解锁难点超有成就感"] },
  skydive: { need:["跳伞基地","一点勇气"], steps:["先双人跳一次找感觉","想 solo 报 AFF 课程","听教练，别自由发挥"], tip:"第一次务必双人带跳，安全第一。", bored:["跳完吹一年","存钱约下一次"] },
  billiards: { need:["一张台球桌","球杆"], steps:["先学架杆出杆直","练直线球再学走位","约朋友打一局"], tip:"杆法先别贪，把球打直最爽。", bored:["约一局打一晚上","练到一杆清台"] },
  frisbee: { need:["一个飞盘","一片草坪"], steps:["先练平抛，别用力过猛","和人对传找手感","人多了玩飞盘高尔夫"], tip:"逆风别扔太高，容易飞回来。", bored:["约一群人传一下午","玩到接住每个盘"] },
  camping: { need:["帐篷+睡袋","一片营地"], steps:["先近郊营地练手","搭帐篷生火煮点吃的","关灯看星星"], tip:"第一次别野营，去正规营地最省心。", bored:["住一晚把手机扔一边","布置营地折腾大半天"] },
  paragliding: { need:["滑翔伞基地","一阵合适的风"], steps:["先体验双人飞行","想自己飞就报班","看教练脸色选天气"], tip:"风太强或太弱都别上，听地面的。", bored:["飞完看照片爽一周","约下次不同山头"] },
  balloon: { need:["热气球体验","清晨好天气"], steps:["天亮前到场地","看点火升空","在空中飘一小时"], tip:"选日出场，光线温度都最好。", bored:["飘完发九宫格","记住那片云"] },
  coaster: { need:["一张乐园票","一点胆量"], steps:["先坐温和的找感觉","再挑战最高的","尖叫就完了"], tip:"吃饱别坐，容易还回去。", bored:["连刷几遍最爱的","打卡全园过山车"] },
  gokart: { need:["卡丁车场","一点驾驶欲"], steps:["先慢圈找刹车点","再加速过弯","和朋友比一圈"], tip:"别一上来全油门，先认赛道。", bored:["刷圈速一下午","和朋友对飙"] },
  kite: { need:["一个风筝","一片有风的开阔地"], steps:["迎风小跑把风筝放起","收放线找平衡","稳住别让它栽"], tip:"风太大反而难控，小风最舒服。", bored:["放一下午看它飘","换个造型大风筝"] },
  rafting: { need:["漂流艇","一段河道"], steps:["穿好救生衣听讲解","抓紧扶手过激流","平缓段就泼水玩"], tip:"选难度合适的段，别逞强上野河。", bored:["漂一上午尖叫连连","和水仗队友玩到湿透"] },
  lego: { need:["一套乐高","一桌平整空间"], steps:["按分包拆，别混","跟着图纸一步步","卡住就看图别硬掰"], tip:"按编号分拣零件，后期最省心。", bored:["拼一大幅坐一下午","拼完摆展示柜"] },
  karaoke: { need:["唱歌 App 或麦克风","关好的门"], steps:["先点会唱的热身","再挑战高音","录下来自己听"], tip:"跑调也没人笑，关起门是你主场。", bored:["唱一歌单一下午","练会一首能镇场"] },
  reading: { need:["一本书","一个舒服的角落"], steps:["别挑太厚的开篇","陷进沙发读","读不进就换一本"], tip:"睡前别刷手机，换成书睡得香。", bored:["连读几章停不下来","读完写两句感想"] },
  darts: { need:["一副飞镖","一块镖盘"], steps:["站好距离握稳","瞄准红心出镖","算总分玩 501"], tip:"手腕别抖，动作越轻越准。", bored:["约一局 501","练到常进红心"] },
  plants: { need:["一盆多肉","一点阳光"], steps:["少浇水，多肉怕涝","给足光照别闷","偶尔擦擦叶子"], tip:"宁干勿湿，浇多必烂根。", bored:["拼一窗台多肉","看它默默长新叶"] },
  picnic: { need:["一块野餐垫","做的/买的吃的"], steps:["找片树荫铺开","把吃的摆好看","吃完顺手收干净"], tip:"防蚊和垃圾袋别忘了，留给草地体面。", bored:["躺一下午晒太阳","换个公园换心情"] },
  beach: { need:["一双不怕水的鞋","查好退潮时间"], steps:["退潮前去滩涂","翻石头看下面","小桶装战利品"], tip:"看准潮位表，别被涨潮困住。", bored:["赶一潮坑玩半天","收获够发一圈"] },
  stargaze: { need:["一片没光害的夜空","一点耐心"], steps:["远离城市灯光","躺好别仰酸脖子","用 App 认星座"], tip:"挑无月夜，星星最多最亮。", bored:["认完四季星座","等一颗流星许愿"] },
  pog: { need:["几张洋画(画片)","一片平整水泥地"], steps:["把洋画放地上","巴掌扇下去让对手的翻面","翻过来就归你"], tip:"手掌沾点汗更响，但别真吐地上。", bored:["攒一厚沓显摆","和人对战一下午"] },
  shuttlecock: { need:["一个毽子"], steps:["用脚背颠着踢","换脚侧、膝盖轮流接","数连续踢了多少个"], tip:"毽子歪了就用手接，别硬来。", bored:["挑战连续一百个","和人对踢传接"] },
  rubberband: { need:["一根皮筋(猴皮筋)"], steps:["两人撑皮筋，一人跳","跟着童谣节奏跳","升级高度越来越难"], tip:"皮筋别勒太紧，腿容易红。", bored:["边跳边唱一下午","挑战最高那档"] },
  top: { need:["一个陀螺","一根鞭子"], steps:["绕绳把陀螺甩立","鞭子抽让它转久","比谁转得久"], tip:"地面要平，砖地最好转。", bored:["雕个陀螺能玩很久","和人对抽比久"] },
  marbles: { need:["几颗玻璃球","一个小坑"], steps:["画个坑当目标","瞄准把珠子弹进坑","赢来的珠子归你"], tip:"趴低眯眼，角度要算准。", bored:["赢一小袋珠子","换不同场地玩"] },
  paperplane: { need:["一张纸"], steps:["折出机头和机翼","机头哈口气","迎风轻轻掷出"], tip:"机翼对称才飞得稳。", bored:["和同学比谁飞远","调角度挑战远纪录"] },
  hoop: { need:["一个铁环","一根铁钩"], steps:["铁钩勾住铁环","推着它往前滚","用钩控制方向别倒"], tip:"推力要稳，猛了就冲出去。", bored:["滚着环绕小区","和同伴赛一段"] },
  hopscotch: { need:["粉笔","一块瓦片"], steps:["地上画格子","单脚跳着扔瓦片","捡起瓦片原路跳回"], tip:"格子别画太密，脚站不下。", bored:["画一大片连跳","加难度单脚全程"] },
  beanbag: { need:["几个沙包","三五个人"], steps:["两人场边扔，中间的人躲","被砸中出局","场内全出换人"], tip:"沙包别装太满，砸着疼。", bored:["约一群人玩一下午","换规则加难度"] },
  stones: { need:["五颗小石子"], steps:["抛起一颗，抓地上的","再接住落下的","漏了就重来"], tip:"石子大小均匀最好抓。", bored:["练到不停不漏","换花样翻接"] },
  stringfig: { need:["一根首尾相连的线"], steps:["线套在两手手指","翻绕变出花样","两人交替翻"], tip:"线别太粗，手指才好绕。", bored:["翻出梯子面条","和人对翻不重样"] },
  cockfight: { need:["一条腿","一群人"], steps:["单脚独立，手抱另腿","用膝盖互顶","谁先落地谁输"], tip:"地面软点，摔了不疼。", bored:["分组车轮战","和最强那个磕"] },
  eaglechick: { need:["一群人"], steps:["一人当鸡妈妈张开手","一人当老鹰","小鸡排队躲，被抓到换人"], tip:"别推太狠，容易摔。", bored:["玩到天黑","换人当老鹰"] },
  hideseek: { need:["一片能躲的地方"], steps:["一人蒙眼数数","其他人藏","找到就换人"], tip:"别藏太绝，找的人会急。", bored:["藏到最刁钻的角落","和伙伴轮换找"] },
  cards90: { need:["几包小浣熊干脆面","收集册"], steps:["拆面先摸卡","按编号凑一套","和同学换重复的"], tip:"面可以送人，卡自己留。", bored:["凑齐一整套","和同学换缺的"] },
  comic: { need:["几分钱","一个书摊"], steps:["租一本连环画","蹲着看完","和同学传着看"], tip:"别弄脏，老板不让续租。", bored:["攒零花钱租一摞","和伙伴轮流看"] },
  snowball: { need:["一场雪","几个人"], steps:["攥个雪球","趁人不备砸","躲着反击"], tip:"别往脸上砸，更别塞领口。", bored:["打一大架雪仗","堆完雪人再打"] },
  firecracker: { need:["几挂小鞭炮","一根香"], steps:["香点引信","撒腿跑","回头听响"], tip:"一定要跑远，别拿手里炸。", bored:["攒一挂过年放","和伙伴比谁响"] }
};

  /* 初学者规则：让普通人照着就能简单入门（与「怎么玩」步骤互补） */
  window.GUIDE_RULES = {
    paragliding: "双人体验最省心：听教练系好坐带，起飞助跑几步、身体后仰交给风；落地时双腿前伸成元宝姿势。风太强或太弱都别上，全程听地面指挥。",
    balloon: "选清晨无风日，由基地工作人员点火充气；升空后别探身出篮，降落时屈膝下蹲。票价含保险，第一次别自己操作。",
    coaster: "先坐温和的练胆，再挑战最高的；全程压好安全压杆、手扶稳；吃饱或头晕时别坐。尖叫随便，别松手。",
    gokart: "先在维修区练刹车点，再加速过弯；同向行驶别逆行，超车只走直线段；长发扎起、鞋要包脚。第一次别一上来全油门。",
    kite: "逆风或侧风最好放，迎风小跑送上天；线别缠人，风太大反而难控，收线慢放别勒手。开阔无电线处玩。",
    rafting: "穿好救生衣、听船长讲解再上艇；过激流抓紧扶手绳，平缓段才能泼水；选正规河道别逞强上野河。不会游泳也能玩，但必须穿救生衣。",
    lego: "按编号把零件分袋，跟着图纸一包包拼；卡住看图示别硬掰，用拆件器；拼大幅先平铺大底。拼完摆展示柜。",
    karaoke: "点会唱的热身，再挑战高音；录音自己听找问题；跑调也没人笑，关起门是你主场。麦离嘴一拳，别贴脸喊。",
    reading: "别挑太厚的开篇，陷进沙发就读；读不进就换一本不强撑；睡前用书的代替刷手机。一次只读一本。",
    darts: "站投掷线后，手腕稳、动作越轻越准；先练直抛再练花样；计分玩 501（从 501 倒扣到 0 并最后精准归零）。墙上挂盘，别朝人扔。",
    plants: "多肉宁干勿湿，土干透再浇透；给足光照别闷卫生间；用透气颗粒土。浇多必烂根，冬天少浇。一片叶掉下都能叶插。",
    picnic: "找片树荫铺开野餐垫，吃的摆好看再吃；带防蚊和垃圾袋，吃完顺手收干净；生食熟食分开装。风大用重物压角。",
    beach: "查好退潮时间，退潮前去滩涂翻石头；穿不怕水的鞋防扎；小桶装战利品，不拿保护物种；看准潮位表别被涨潮困住。",
    stargaze: "挑无月、没光害的夜；躺好别仰酸脖子，用认星 App 辅助；先找北斗再找北极星。手机开红光模式护夜视。",
    hoop: "铁钩勾住铁环底部，往前推别太猛；用钩轻带方向防倒；平整路面玩，砖地最顺。比谁推得远不掉。",
    hopscotch: "粉笔在地上画格子（单双交错）；单脚跳着把瓦片踢进格、再捡回原路跳；踩线或踩格外出局。格子别太密。",
    beanbag: "两人场边轮流扔，中间的人躲；被砸中出局，全出换人；可加接住沙包复活队友规则。沙包别装太满。",
    stones: "五颗小石子，抛起一颗同时抓地上的、再接住落下的；漏接重来，连续不漏算赢。石子大小均匀最好抓。",
    stringfig: "一根首尾相连的线套在两手手指；按套路翻绕变出梯子、面条、降落伞；两人可交替翻。线别太粗。",
    cockfight: "单脚独立、手抱另腿，用膝盖互顶；谁先双脚落地或放手谁输；可分组车轮战。地面软点，别往人要害顶。",
    eaglechick: "一人当鸡妈妈张开双臂护住，一人当老鹰，其余排队长队拽着前面衣角；老鹰抓到队尾小鸡则互换角色。别推太狠。",
    hideseek: "一人蒙眼数到一百，其他人藏；找的人喊出名字算抓到，被抓的下一轮当找的。别藏太绝让人找不到你着急。",
    cards90: "买小浣熊干脆面，拆包先摸卡；按编号凑一套，重复的跟同学换缺的；面可以送人卡自己留。别为卡硬吃面。",
    comic: "几分钱租一本连环画，蹲书摊看完；和同学传着看更划算；别弄脏弄折，老板不让续租。攒零花钱能租一摞。",
    snowball: "攥松雪球趁人不备砸；只砸身子别朝脸、更别塞领口；四散逃着反击。地面滑注意别摔，玩完堆个雪人。",
    firecracker: "用长香点引信，点着立刻撒腿跑远；别拿手里炸、别对人；小孩要有大人陪。一定要跑，别好奇回头看。"
  };

/* =========================================================
   职业爽感时刻表 —— 哪些职业在什么时候能发挥最大爽感
   契约（app.js 职业模块唯一依赖）：
   {
     id:     唯一标识
     emoji:  职业图标
     name:   职业名
     field:  领域（用于领域筛选）
     peak:   主爽点时刻文案，如 "23:00–02:00"
     moment: 一句画面感爽点
     why:    「爽在哪」科普正文（机制名会被 app.js 高亮）
     tags:   机制标签（沿用条目词表，可反向筛选条目）
     score:  { dopamine, endorphin } 两个指数（0-100）
     peaks:  爽感时段窗口 [{ from: 23, to: 2, heat: 96 }]，支持跨零点
             from/to 为 0-23 的整点边界，heat 为该时段的爽感强度
   }
   ========================================================= */
window.GUIDE_JOBS = [
  /* ---------------- 技术派 ---------------- */
  {
    id: "coder",
    emoji: "💻",
    name: "程序员",
    field: "技术派",
    peak: "23:00–02:00",
    moment: "凌晨一点十七分，绿色的 PASS 终于刷满整屏。",
    why: "深夜没人打扰，消息不再切断注意力的连续体——这是心流最便宜的入场券。报错被逐个消灭、测试由红转绿，每一次修复都是一次即时到账的掌控感。而多巴胺其实更早登场：在你笃定「我大概知道怎么改」的预判瞬间就已经先付了款，所以等到真跑通那一刻，反而是一种安静的满足。",
    tags: ["心流", "掌控感", "多巴胺"],
    score: { dopamine: 82, endorphin: 30 },
    peaks: [{ from: 23, to: 2, heat: 96 }]
  },
  {
    id: "analyst",
    emoji: "📊",
    name: "数据分析师",
    field: "技术派",
    peak: "14:00–17:00",
    moment: "下午三点半，那行 p 值终于小于 0.05。",
    why: "跑数前的漫长等待，是蔡格尼克效应布下的钩子：未完成的悬置最磨人，也最让人惦记。结果一旦跳出来，无论好坏都是一次期待奖励的兑现；猜想被数据证实的那一刻，多巴胺替你的判断力盖了章；而把一堆杂乱数据驯服成一张能讲故事的图，本身就把掌控感拉满——你替混乱的世界做了一次主。",
    tags: ["期待奖励", "蔡格尼克效应", "掌控感", "多巴胺"],
    score: { dopamine: 76, endorphin: 32 },
    peaks: [{ from: 14, to: 17, heat: 88 }]
  },

  /* ---------------- 创意派 ---------------- */
  {
    id: "designer",
    emoji: "🎨",
    name: "设计师",
    field: "创意派",
    peak: "22:00–01:00",
    moment: "甲方睡了，画布终于没人指手画脚。",
    why: "白天的修改意见会不断打断心流所需的连续性，等外界安静下来，视觉与操作之间才重新形成毫秒级的闭环。自己给自己定标准的那一刻，掌控感回到手上；而当配色、留白与节奏终于对齐，眼睛往往比大脑先一步领到感官奖赏。",
    tags: ["心流", "掌控感", "感官奖赏"],
    score: { dopamine: 74, endorphin: 34 },
    peaks: [{ from: 22, to: 1, heat: 92 }]
  },
  {
    id: "musician",
    emoji: "🎵",
    name: "独立音乐人",
    field: "创意派",
    peak: "01:00–03:00",
    moment: "凌晨两点，一段旋律在第三次循环里突然对了。",
    why: "创作最上头的，是「终于对上了」那一瞬：脑海里预演的声响与现实重合，多巴胺立刻补票。反复试奏让身体记忆接管，人滑进心流，呼吸跟着节拍一起慢下来；而低频的压迫感与泛音的空气感，是语言解释不清、身体却秒懂的感官奖赏。",
    tags: ["多巴胺", "心流", "感官奖赏"],
    score: { dopamine: 80, endorphin: 40 },
    peaks: [{ from: 1, to: 3, heat: 90 }]
  },
  {
    id: "photographer",
    emoji: "📷",
    name: "摄影师",
    field: "创意派",
    peak: "05:00–07:00",
    moment: "日出前最后两分钟，云层突然被撕开一道口子。",
    why: "蹲守一整个清晨只为一张片子，是典型的期待奖励：等待越久，兑现时越猛。光线、构图与时机三点一线时，你把不可控的世界按进了一个可控的方框，掌控感由此而生；而日出那半分钟的天色骤变，是眼睛能领到的纯度最高的感官奖赏。",
    tags: ["期待奖励", "掌控感", "感官奖赏"],
    score: { dopamine: 78, endorphin: 36 },
    peaks: [{ from: 5, to: 7, heat: 93 }, { from: 16, to: 18, heat: 70 }]
  },

  /* ---------------- 现场派 ---------------- */
  {
    id: "chef",
    emoji: "👨‍🍳",
    name: "厨师",
    field: "现场派",
    peak: "12:00–13:30",
    moment: "午市最爆的那四十分钟，锅起火落，出餐像流水。",
    why: "高峰期的后厨是被压缩过的时间：订单不断涌入，只能靠动作序列与肌肉记忆顶住，这时最容易滑进心流。火候就在你手上，掌控感精确到秒；出餐窗口的催促把肾上腺素抬到一个舒服的剂量；而锅气炸开的声音与香气，是这份工作附赠的感官奖赏。",
    tags: ["心流", "掌控感", "肾上腺素", "感官奖赏"],
    score: { dopamine: 80, endorphin: 45 },
    peaks: [{ from: 11, to: 14, heat: 92 }, { from: 18, to: 21, heat: 80 }]
  },
  {
    id: "barista",
    emoji: "☕",
    name: "咖啡师",
    field: "现场派",
    peak: "07:00–09:00",
    moment: "早高峰的第一杯，萃取流速刚好拖成漂亮的鼠尾。",
    why: "开门前那段备料是没有观众的仪式，等第一位客人推门进来，期待奖励才真正落账。研磨、压粉、萃取、拉花是一条毫秒级反馈的操作链，极易打成心流；对方接杯时的那句「谢谢」，是每天最早的一份社交回响；而油脂的香气与杯壁的温度，是鼻子和手掌共同领到的感官奖赏。",
    tags: ["期待奖励", "心流", "社交", "感官奖赏"],
    score: { dopamine: 68, endorphin: 40 },
    peaks: [{ from: 7, to: 9, heat: 88 }]
  },
  {
    id: "streamer",
    emoji: "🎤",
    name: "主播",
    field: "现场派",
    peak: "21:00–24:00",
    moment: "弹幕刷屏的那一分钟，打赏特效突然连成一串。",
    why: "直播是发放倍率不定的变比率强化：你不知道下一个礼物什么时候来、值多少钱，正是这份不确定性把多巴胺顶到峰值。弹幕与连麦让社交回路持续通电；而「下播前说不定还能冲一波」的念头，会把收播时间一推再推——这大概是成瘾指数最诚实的一次显形。",
    tags: ["变比率强化", "社交", "多巴胺", "成瘾指数"],
    score: { dopamine: 88, endorphin: 30 },
    peaks: [{ from: 21, to: 24, heat: 94 }]
  },
  {
    id: "detective",
    emoji: "👮",
    name: "刑警",
    field: "现场派",
    peak: "02:00–04:00",
    moment: "凌晨三点，两条看似无关的线索终于咬住了同一辆车。",
    why: "悬着的案子是蔡格尼克效应的实体化：没有闭合的叙事会长期占据大脑内存，直到某一刻严丝合缝地对上，那份闭合感几乎带物理量。收网前的蹲守把肾上腺素压成一触即发的状态；把不可控的嫌疑人变成可控的时刻表，靠的是纯熟的掌控感；结案那一刻，多巴胺一次性结算。",
    tags: ["蔡格尼克效应", "肾上腺素", "掌控感", "多巴胺"],
    score: { dopamine: 78, endorphin: 50 },
    peaks: [{ from: 2, to: 4, heat: 91 }, { from: 20, to: 23, heat: 58 }]
  },

  /* ---------------- 助人派 ---------------- */
  {
    id: "teacher",
    emoji: "👩‍🏫",
    name: "教师",
    field: "助人派",
    peak: "09:30–10:30",
    moment: "第二节课，前排那个孩子的眼睛突然亮了。",
    why: "讲明白的那一刻，对方的困惑从脸上退潮，你收到的是最直接的社交反馈。被信任与被需要会把催产素推上去，让原本疲惫的状态软化下来；再叠一层「我把有用的东西交出去了」的多巴胺——这大概是非对抗性领域里最干净的成就感，也是老师第二天还能早起的理由。",
    tags: ["社交", "催产素", "多巴胺"],
    score: { dopamine: 70, endorphin: 45 },
    peaks: [{ from: 9, to: 11, heat: 86 }, { from: 15, to: 16, heat: 55 }]
  },
  {
    id: "doctor",
    emoji: "🩺",
    name: "医生",
    field: "助人派",
    peak: "03:00–05:00",
    moment: "凌晨四点，监护仪上的直线重新变回起伏的波形。",
    why: "抢救的那几分钟里肾上腺素接管一切：视野收窄、时间变慢，动作精准到没有杂念。流程熟到成为肌肉记忆时，掌控感压住了慌乱；等患者指标回稳、你可以摘下手套走出那扇门，脱力般的松弛会把积攒的压力一点点放走——那一口长气，就是减压的全部含义。",
    tags: ["肾上腺素", "掌控感", "减压"],
    score: { dopamine: 72, endorphin: 55 },
    peaks: [{ from: 3, to: 5, heat: 90 }, { from: 8, to: 10, heat: 62 }]
  },

  /* ---------------- 奔走派 ---------------- */
  {
    id: "rider",
    emoji: "🛵",
    name: "外卖骑手",
    field: "奔走派",
    peak: "17:30–19:30",
    moment: "晚高峰爆单，连着五单顺路，一路绿灯。",
    why: "抢单像开盲盒：单价、距离、顺不顺路全都随机，这就是变比率强化的工作版。把一整片区域的路线压进脑子里、用最短路径串起来，是每天都要重算一次的掌控感；送达后系统立刻结算的提示音是即时多巴胺；而偶尔一笔大额打赏的悬念，给每一单都挂上了期待奖励。",
    tags: ["变比率强化", "掌控感", "多巴胺", "期待奖励"],
    score: { dopamine: 76, endorphin: 38 },
    peaks: [{ from: 17, to: 20, heat: 90 }, { from: 11, to: 13, heat: 78 }]
  },
  {
    id: "trucker",
    emoji: "🚛",
    name: "货车司机",
    field: "奔走派",
    peak: "00:00–04:00",
    moment: "凌晨两点的高速，只剩你和一条向前的白线。",
    why: "空旷路面上，引擎的低频、白线的节奏与被拉直的时间感会让人慢慢滑进心流。夜路没什么车要应付，副交感接管后呼吸变深，这是一种在路上的减压。夜色、仪表盘的光与驾驶室的包裹感，构成长途专属的感官奖赏；而「这一段路交给我」的判断权，就是落到实处的掌控感。",
    tags: ["心流", "副交感", "减压", "感官奖赏", "掌控感"],
    score: { dopamine: 55, endorphin: 48 },
    peaks: [{ from: 0, to: 4, heat: 82 }]
  },

  /* ---------------- 生意派 ---------------- */
  {
    id: "sales",
    emoji: "💼",
    name: "销售",
    field: "生意派",
    peak: "18:00–22:00",
    moment: "月末最后一天晚上九点，对方终于说：合同我签了。",
    why: "一整月的关系铺垫、报价拉扯与反复跟进，把沉没成本堆得老高，于是签单那一刻的释放格外猛。对方说出「行」之前的几十秒，是期待奖励最浓的时候；一次成交既是业绩也是社会认可，多巴胺与社交回路同时点火；而下一笔还在路上，让你始终舍不得真的停下。",
    tags: ["沉没成本", "期待奖励", "多巴胺", "社交"],
    score: { dopamine: 85, endorphin: 35 },
    peaks: [{ from: 18, to: 22, heat: 93 }]
  },
  {
    id: "trader",
    emoji: "📈",
    name: "交易员",
    field: "生意派",
    peak: "09:30–11:30",
    moment: "开盘四十分钟，仓位终于按剧本走了一波。",
    why: "报价跳动本身就是变比率强化的教科书：盈亏的大小与到来的时机全不可控，多巴胺只对「也许下一条就赢」负责。盯盘时肾上腺素维持在细水长流的低剂量滴注，把警觉翻译成快感；深夜盯外盘之所以更难戒，是因为这条路通向的是「一个人也能撑起来」的成瘾指数。",
    tags: ["变比率强化", "肾上腺素", "多巴胺", "成瘾指数"],
    score: { dopamine: 90, endorphin: 28 },
    peaks: [{ from: 9, to: 12, heat: 86 }, { from: 21, to: 24, heat: 76 }]
  },

  /* ---------------- 匠心派 ---------------- */
  {
    id: "maker",
    emoji: "🔧",
    name: "手艺人",
    field: "匠心派",
    peak: "15:00–17:00",
    moment: "下午四点收尾，最后一遍砂纸打下去，纹理全出来了。",
    why: "手工的魅力在于反馈的速度：推一下刨子、走一遍砂纸，木头的纹路立刻给出回应，这种即时确认最容易堆成心流。从毛料到成品的全过程都由你说了算，掌控感是这行最硬的通货；木头的气味、打磨的沙沙声与成品握在手里的分量，是三重感官奖赏；做完一件还想凑齐一整套，那是收集欲在悄悄加码。",
    tags: ["心流", "掌控感", "感官奖赏", "收集欲"],
    score: { dopamine: 70, endorphin: 52 },
    peaks: [{ from: 15, to: 17, heat: 87 }]
  },
  {
    id: "organizer",
    emoji: "🧹",
    name: "收纳整理师",
    field: "匠心派",
    peak: "10:00–11:30",
    moment: "上午十一点，最后一个抽屉拉上时严丝合缝。",
    why: "把失控的空间重新编成系统，是纯粹的掌控感：每一件物品被安排到该在的位置，像替大脑做了一次外部清理。视觉上从杂乱到对齐的转变本身就是感官奖赏；规律而重复的分类动作，会被血清素换算成一种安静的笃定；而按类别成套配齐收纳盒的执着，是收集欲最体面的出口。",
    tags: ["掌控感", "感官奖赏", "血清素", "收集欲"],
    score: { dopamine: 62, endorphin: 44 },
    peaks: [{ from: 10, to: 12, heat: 85 }]
  },

  /* ---------------- 助人派（补） ---------------- */
  {
    id: "therapist",
    emoji: "🛋️",
    name: "心理咨询师",
    field: "助人派",
    peak: "21:00–23:00",
    moment: "晚上九点，来访者说「我好像想通了」的那一刻。",
    why: "咨询最上头的是「被需要」：对方把最乱的线头交到你手里，你陪他一点点理顺，信任落地的瞬间催产素悄悄上升。而当来访者自己说出「我懂了」，你收获的是不带炫耀的掌控感——不是你替他想通，是他借你理清。钟点一到、门关上，把别人的情绪留在房间里，是这份工作最干净的减压。",
    tags: ["催产素", "掌控感", "减压", "社交"],
    score: { dopamine: 66, endorphin: 48 },
    peaks: [{ from: 21, to: 23, heat: 80 }]
  },

  /* ---------------- 现场派（补） ---------------- */
  {
    id: "bartender",
    emoji: "🍸",
    name: "调酒师",
    field: "现场派",
    peak: "21:00–01:00",
    moment: "吧台最满的那阵，雪克杯一摇，全场目光都跟过来。",
    why: "点单像开盲盒：谁会来、点什么、给多少小费全随机，这份不确定性把多巴胺顶到小高峰。摇酒、滤酒、装饰是一条毫秒级反馈的操作链，极易打成心流；而客人接过酒时那句「漂亮」和吧台此起彼伏的闲聊，是社交回路最稳的供电。深夜打烊前最后一杯自己喝的，是留给自己的奖励。",
    tags: ["变比率强化", "心流", "社交", "多巴胺"],
    score: { dopamine: 82, endorphin: 38 },
    peaks: [{ from: 21, to: 1, heat: 88 }]
  },

  /* ---------------- 创意派（补） ---------------- */
  {
    id: "writer",
    emoji: "✍️",
    name: "作家 / 自由撰稿",
    field: "创意派",
    peak: "23:00–02:00",
    moment: "凌晨一点，那句话终于写出了想要的重量。",
    why: "深夜没人催稿、没人改需求，注意力才重新连成线——心流最便宜的入场券。把脑子里模糊的感觉落成准确的字，每一次「就是它」都是一次即时到账的掌控感；而多巴胺其实更早登场：在你笃定「下一句该这么写」的预判里就已经先付了款。截稿压境时肾上腺素会上来，但真正爽的是交稿后那一口长气。",
    tags: ["心流", "掌控感", "多巴胺", "肾上腺素", "减压"],
    score: { dopamine: 76, endorphin: 34 },
    peaks: [{ from: 23, to: 2, heat: 84 }]
  },

  /* ---------------- 奔走派（补） ---------------- */
  {
    id: "guide",
    emoji: "🗺️",
    name: "导游",
    field: "奔走派",
    peak: "09:00–17:00",
    moment: "下午景点揭幕那刻，全团同时「哇」了一声。",
    why: "带团是发放倍率不定的期待奖励：下个景点美不美、客人买不买账、会不会突发状况，全不可控，所以揭晓那一刻最爽。把一车人的节奏、路线、情绪都安排明白，是每天都在重算的掌控感；被围着想听你讲、合影时被需要，社交回路持续通电。而站在风景里上班这件事本身，就是免费的感官奖赏。",
    tags: ["期待奖励", "掌控感", "社交", "感官奖赏"],
    score: { dopamine: 74, endorphin: 40 },
    peaks: [{ from: 9, to: 17, heat: 78 }]
  }
];
