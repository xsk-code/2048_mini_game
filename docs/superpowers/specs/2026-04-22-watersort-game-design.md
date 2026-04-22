# 水排序（Water Sort Puzzle）游戏接入设计

**日期：** 2026-04-22

## 1. 目标

在现有 2048 + 消灭星星小游戏项目中接入第三个游戏——水排序（Water Sort Puzzle），实现三游戏共存，用户可在主页选择不同游戏类型。

## 2. 不在本次范围内

- 不增加联网能力
- 不引入新的外部依赖
- 不做整仓级重构
- 不增加复杂动画系统（使用 Canvas 2D 基础动画）
- 不为水排序增加多种模式（如限时模式、对战模式等），仅实现经典关卡模式

## 3. 水排序玩法规则

### 3.1 核心规则

| 规则项 | 详情 |
|--------|------|
| 容器 | N 个试管 + 2 个空试管，每个试管容量为 4 层 |
| 初始状态 | 每种颜色恰好填满一个试管（4 层），颜色随机分散在不同试管中 |
| 操作方式 | 点击源试管选中 → 点击目标试管倒入 |
| 倒入规则 | 只能将试管顶部**连续同色**的液体倒入目标试管；目标试管必须为空或顶部颜色与倒入颜色相同 |
| 倒入量 | 倒入量 = min(源试管顶部连续同色层数, 目标试管剩余空位数) |
| 无效操作 | 目标试管空间不足、顶部颜色不匹配时，操作无效 |
| 胜利条件 | 每个试管内只有一种颜色（或为空），即所有颜色归位 |
| 失败条件 | 无（水排序不会出现死局，因为可以无限撤销） |
| 撤销 | 支持撤销上一步操作（不限制次数） |
| 重置 | 支持重置当前关卡到初始状态 |

### 3.2 关卡系统

采用**关卡制**，难度递增：

| 关卡范围 | 颜色数量 | 试管总数 | 空试管数 | 说明 |
|----------|----------|----------|----------|------|
| 1 - 5 | 3 | 5 | 2 | 入门：3 色 5 管 |
| 6 - 15 | 4 | 6 | 2 | 简单：4 色 6 管 |
| 16 - 35 | 5 | 7 | 2 | 普通：5 色 7 管 |
| 36 - 60 | 6 | 8 | 2 | 困难：6 色 8 管 |
| 61 - 90 | 7 | 9 | 2 | 专家：7 色 9 管 |
| 91 - 120 | 8 | 10 | 2 | 大师：8 色 10 管 |
| 121 - 150 | 9 | 11 | 2 | 宗师：9 色 11 管 |
| 151+ | 10 | 12 | 2 | 传奇：10 色 12 管 |

> 关卡上限为 200 关，通关后显示祝贺界面。

### 3.3 关卡生成算法

关卡生成是水排序的核心难点。采用**逆向生成法**确保每关必定有解：

```
1. 确定颜色数 N 和试管数 T（T = N + 2）
2. 创建 N 个"已完成"的试管，每个试管 4 层同色
3. 创建 2 个空试管
4. 执行随机模拟操作（从已完成状态逆向打乱）：
   a. 随机选择一个非空试管作为源
   b. 随机选择一个目标试管（空或顶部颜色不同）
   c. 将源试管顶部连续同色液体倒入目标
   d. 重复打乱步骤 M 次（M = N × 20，确保充分打乱）
5. 验证打乱后的状态不是已完成状态
6. 输出最终试管布局
```

### 3.4 操作示例

```
初始状态（4色6管）：
试管1: [红, 蓝, 绿, 黄]  ← 顶部为黄
试管2: [蓝, 红, 黄, 绿]  ← 顶部为绿
试管3: [绿, 黄, 红, 蓝]  ← 顶部为蓝
试管4: [红, 蓝, 绿, 黄]  ← 顶部为黄
试管5: []                 ← 空试管
试管6: []                 ← 空试管

操作：点击试管1 → 点击试管5
结果：试管1的顶部4层全部倒入试管5（因为试管5为空，可以全部倒入）
试管1: []
试管5: [红, 蓝, 绿, 黄]

操作：点击试管5 → 点击试管1
结果：试管5的顶部4层全部倒回试管1（撤销效果）
```

## 4. 数据模型

### 4.1 核心数据结构

```javascript
const TUBE_CAPACITY = 4;

// 颜色定义
const WATER_COLORS = [
  { id: 0, name: '红', light: '#FF6B8A', dark: '#E8506E' },
  { id: 1, name: '蓝', light: '#5BA8E8', dark: '#4088C8' },
  { id: 2, name: '绿', light: '#5EC89A', dark: '#40A878' },
  { id: 3, name: '黄', light: '#FFD060', dark: '#E8B040' },
  { id: 4, name: '紫', light: '#B890D8', dark: '#9870B8' },
  { id: 5, name: '橙', light: '#FFA060', dark: '#E88040' },
  { id: 6, name: '粉', light: '#FF8CB8', dark: '#E87098' },
  { id: 7, name: '青', light: '#50C8D8', dark: '#38A8B8' },
  { id: 8, name: '棕', light: '#C89068', dark: '#A87048' },
  { id: 9, name: '灰', light: '#A0A8B8', dark: '#808898' }
];

// 试管：数组，从底到顶
// tube[0] = 底层颜色索引, tube[3] = 顶层颜色索引
// 空位用 null 表示
// 例: [0, 0, 1, 2] 表示底层红、红、蓝、顶层绿

// 游戏状态
{
  tubes: (number | null)[][],   // 试管数组
  level: number,                 // 当前关卡
  colorCount: number,            // 颜色数量
  tubeCount: number,             // 试管总数
  moves: number,                 // 当前步数
  selectedTube: number | null,   // 当前选中的试管索引
  history: { from: number, to: number, count: number }[],  // 操作历史（用于撤销）
  isComplete: boolean,           // 是否通关
  initialTubes: (number | null)[][],  // 初始状态（用于重置）
}
```

### 4.2 存档结构

```javascript
{
  tubes: [...],            // 当前试管状态
  level: number,           // 当前关卡
  colorCount: number,      // 颜色数量
  tubeCount: number,       // 试管总数
  moves: number,           // 当前步数
  selectedTube: null,      // 不保存选中状态
  history: [...],          // 操作历史
  isComplete: boolean,     // 是否通关
  initialTubes: [...],     // 初始状态
  bestMoves: number        // 最少步数记录
}
```

## 5. 核心算法设计

### 5.1 算法清单

| 算法 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `generateLevel(level)` | 关卡号 | `{ tubes, colorCount, tubeCount }` | 根据关卡号生成试管布局 |
| `getTopColor(tube)` | 试管 | `number \| null` | 获取试管顶部颜色索引 |
| `getTopConsecutiveCount(tube)` | 试管 | `number` | 获取顶部连续同色层数 |
| `canPour(fromTube, toTube)` | 源试管, 目标试管 | `boolean` | 判断是否可以倒入 |
| `pour(fromTube, toTube)` | 源试管, 目标试管 | `{ newFrom, newTo, count }` | 执行倒入操作，返回新试管状态 |
| `isTubeComplete(tube)` | 试管 | `boolean` | 试管是否已完成（空或4层同色） |
| `isLevelComplete(tubes)` | 所有试管 | `boolean` | 所有试管是否已完成 |
| `undo(history)` | 操作历史 | `{ tubes, history }` | 撤销上一步操作 |
| `resetLevel(initialTubes)` | 初始状态 | `{ tubes, history, moves }` | 重置到初始状态 |
| `getColorCountForLevel(level)` | 关卡号 | `number` | 获取关卡对应的颜色数量 |
| `getTubeCountForLevel(level)` | 关卡号 | `number` | 获取关卡对应的试管数量 |

### 5.2 核心算法伪代码

#### generateLevel（关卡生成 - 逆向打乱法）

```
function generateLevel(level):
    colorCount = getColorCountForLevel(level)
    tubeCount = getTubeCountForLevel(level)

    // 1. 创建已完成状态
    tubes = []
    for i from 0 to colorCount - 1:
        tubes.push([i, i, i, i])  // 每色一管，4层同色
    for i from 0 to tubeCount - colorCount - 1:
        tubes.push([null, null, null, null])  // 空试管

    // 2. 逆向打乱
    shuffleRounds = colorCount * 20
    for round from 0 to shuffleRounds - 1:
        // 随机选一个非空试管
        nonEmptyTubes = tubes.filter(t => getTopColor(t) !== null)
        if nonEmptyTubes is empty: break

        fromIndex = random nonEmpty tube index
        fromTube = tubes[fromIndex]
        topColor = getTopColor(fromTube)
        pourCount = getTopConsecutiveCount(fromTube)

        // 随机选一个目标试管（空或顶部颜色不同且有空位）
        validTargets = []
        for j from 0 to tubeCount - 1:
            if j === fromIndex: continue
            targetTop = getTopColor(tubes[j])
            emptySlots = tubes[j].filter(c => c === null).length
            if emptySlots > 0 and (targetTop === null or targetTop !== topColor):
                validTargets.push(j)

        if validTargets is empty: continue

        toIndex = random choice from validTargets
        result = pour(tubes[fromIndex], tubes[toIndex])
        tubes[fromIndex] = result.newFrom
        tubes[toIndex] = result.newTo

    // 3. 验证不是已完成状态
    if isLevelComplete(tubes):
        return generateLevel(level)  // 重新生成

    // 4. 保存初始状态
    initialTubes = deepClone(tubes)

    return { tubes, colorCount, tubeCount, initialTubes }
```

#### canPour（判断是否可以倒入）

```
function canPour(fromTube, toTube):
    fromTopColor = getTopColor(fromTube)
    if fromTopColor is null: return false  // 源试管为空

    toTopColor = getTopColor(toTube)
    toEmptySlots = toTube.filter(c => c === null).length

    if toEmptySlots === 0: return false  // 目标试管已满

    if toTopColor is null: return true   // 目标试管为空，可以倒入

    if toTopColor === fromTopColor: return true  // 顶部颜色相同

    return false  // 顶部颜色不同
```

#### pour（执行倒入）

```
function pour(fromTube, toTube):
    fromTopColor = getTopColor(fromTube)
    pourCount = getTopConsecutiveCount(fromTube)
    toEmptySlots = toTube.filter(c => c === null).length
    actualPourCount = min(pourCount, toEmptySlots)

    newFrom = [...fromTube]
    newTo = [...toTube]

    // 从源试管顶部移除
    for i from 0 to actualPourCount - 1:
        fromTopIndex = newFrom.lastIndexOf(fromTopColor)
        newFrom[fromTopIndex] = null

    // 向目标试管顶部添加
    for i from 0 to actualPourCount - 1:
        toFirstEmpty = newTo.indexOf(null)
        newTo[toFirstEmpty] = fromTopColor

    return { newFrom, newTo, count: actualPourCount }
```

#### isLevelComplete（判断通关）

```
function isLevelComplete(tubes):
    for each tube in tubes:
        if tube is empty: continue  // 空试管算完成
        if tube is [c, c, c, c] where c is same color: continue  // 4层同色算完成
        return false  // 其他情况未完成
    return true
```

#### undo（撤销操作）

```
function undo(tubes, history):
    if history is empty: return null

    lastMove = history.pop()
    { from, to, count } = lastMove

    // 逆向操作：从 to 倒回 from
    newTubes = deepClone(tubes)
    fromColor = getTopColor(newTubes[to])  // 目标试管顶部就是要倒回的颜色

    // 从 to 移除
    for i from 0 to count - 1:
        topIndex = newTubes[to].lastIndexOf(fromColor)
        newTubes[to][topIndex] = null

    // 向 from 添加
    for i from 0 to count - 1:
        firstEmpty = newTubes[from].indexOf(null)
        newTubes[from][firstEmpty] = fromColor

    return { tubes: newTubes, history }
```

## 6. 音效系统设计

### 6.1 水排序音效清单

| 音效 ID | 触发时机 | 描述 | 音色方向 |
|---------|----------|------|----------|
| `watersort_select` | 点击选中试管 | 选中反馈 | 清脆短促的"叮"声 |
| `watersort_pour` | 液体倒入目标试管 | 倒入反馈 | 柔和的"咕嘟"水声 |
| `watersort_invalid` | 无效操作 | 错误提示 | 低沉短促的"嗡"声 |
| `watersort_complete` | 单个试管归位完成 | 进度反馈 | 清亮的"叮咚"双音 |
| `watersort_levelclear` | 关卡通关 | 通关庆祝 | 欢快的上行旋律（4-5 音符） |
| `watersort_undo` | 撤销操作 | 撤销反馈 | 轻柔的"嘶"声 |

### 6.2 音效文件规格

| 参数 | 要求 |
|------|------|
| 格式 | MP3 |
| 采样率 | 44100 Hz |
| 比特率 | 128 kbps |
| 时长 | 单次音效 ≤ 1 秒，旋律音效 ≤ 2 秒 |
| 声道 | 单声道 |
| 总体积 | 全部音效文件 ≤ 150 KB |

### 6.3 音效文件目录

```
2048minigame/
├── audio/
│   ├── ... (现有音效)
│   ├── watersort_select.mp3
│   ├── watersort_pour.mp3
│   ├── watersort_invalid.mp3
│   ├── watersort_complete.mp3
│   ├── watersort_levelclear.mp3
│   └── watersort_undo.mp3
```

## 7. UI 设计方案

### 7.1 设计理念

水排序的视觉核心是**试管与液体**，需要营造"透明玻璃管 + 彩色液体"的视觉感受。与 2048 的方块感和消灭星星的星星感形成鲜明区分，同时保持同一套双主题体系。

**关键词**：透明感、流体感、清新、解压

### 7.2 游戏界面布局

```
┌─────────────────────────────────────┐
│  WATER SORT        LEVEL 15         │  ← 标题 + 关卡号
├─────────────────────────────────────┤
│  MOVES: 12    │    BEST: 8          │  ← 步数卡 + 最少步数
├─────────────────────────────────────┤
│                                     │
│   ┃   ┃   ┃   ┃   ┃   ┃   ┃       │  ← 试管区域
│   ┃   ┃ 🟦┃   ┃ 🟩┃   ┃   ┃       │     试管从上到下
│ 🟥┃ 🟦┃ 🟦┃ 🟩┃ 🟩┃   ┃   ┃       │     液体从底到顶
│ 🟥┃ 🟦┃ 🟥┃ 🟩┃ 🟩┃   ┃   ┃       │     空试管透明
│ 🟥┃ 🟥┃ 🟩┃ 🟦┃ 🟦┃   ┃   ┃       │
│  ▔   ▔   ▔   ▔   ▔   ▔   ▔       │  ← 试管底部圆弧
│                                     │
├─────────────────────────────────────┤
│  [↩ UNDO]  [↺ RESET]  🏠  🔊  🌙  │  ← 操作按钮
└─────────────────────────────────────┘
```

### 7.3 试管视觉设计

试管是水排序的核心视觉元素，需要精心设计：

#### 试管结构

```
     ┌───┐  ← 开口（顶部略宽）
     │   │
     │液 │  ← 液体层（带圆角）
     │体 │
     │   │
     └─┘   ← 底部圆弧
```

#### 试管绘制参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 试管宽度 | 根据试管数量动态计算 | 确保所有试管在屏幕内 |
| 试管高度 | 宽度 × 3.2 | 保持细长比例 |
| 液体层高度 | (试管高度 - 上下边距) / 4 | 4 层等分 |
| 液体层圆角 | 2px | 层间微圆角 |
| 试管壁宽度 | 2px | 玻璃管壁 |
| 底部圆弧半径 | 试管宽度 / 2 | 半圆底 |
| 开口宽度 | 试管宽度 + 4px | 顶部略外扩 |

#### 选中状态

选中的试管整体上移 20px，顶部液体层添加微光效果：

```
     ┌───┐
     │✨ │  ← 顶部液体发光
     │液 │
     │体 │  ← 整体上移 20px
     │   │
     └─┘
```

#### 完成状态

已归位的试管（4层同色）添加✓标记和微光：

```
     ┌───┐
     │ ✓ │  ← 顶部显示 ✓
     │同 │
     │色 │  ← 液体带微光
     │同 │
     └─┘
```

### 7.4 颜色方案

#### 马卡龙主题（Light）

| 颜色 | 主色 | 渐变终止色 | 高光色 | 说明 |
|------|------|-----------|--------|------|
| 红 | `#FF6B8A` | `#E8506E` | `rgba(255,255,255,0.35)` | 珊瑚红 |
| 蓝 | `#5BA8E8` | `#4088C8` | `rgba(255,255,255,0.35)` | 天空蓝 |
| 绿 | `#5EC89A` | `#40A878` | `rgba(255,255,255,0.35)` | 薄荷绿 |
| 黄 | `#FFD060` | `#E8B040` | `rgba(255,255,255,0.40)` | 柠檬黄 |
| 紫 | `#B890D8` | `#9870B8` | `rgba(255,255,255,0.35)` | 薰衣草 |
| 橙 | `#FFA060` | `#E88040` | `rgba(255,255,255,0.35)` | 蜜橙 |
| 粉 | `#FF8CB8` | `#E87098` | `rgba(255,255,255,0.35)` | 樱花粉 |
| 青 | `#50C8D8` | `#38A8B8` | `rgba(255,255,255,0.35)` | 湖水青 |
| 棕 | `#C89068` | `#A87048` | `rgba(255,255,255,0.30)` | 焦糖棕 |
| 灰 | `#A0A8B8` | `#808898` | `rgba(255,255,255,0.30)` | 雾霾灰 |

#### 暗夜主题（Dark）

| 颜色 | 主色 | 渐变终止色 | 高光色 | 说明 |
|------|------|-----------|--------|------|
| 红 | `#E86080` | `#C84060` | `rgba(255,255,255,0.25)` | 玫红 |
| 蓝 | `#4890C8` | `#3070A8` | `rgba(255,255,255,0.25)` | 钴蓝 |
| 绿 | `#48B888` | `#309868` | `rgba(255,255,255,0.25)` | 翡翠 |
| 黄 | `#E8B040` | `#C89020` | `rgba(255,255,255,0.30)` | 琥珀 |
| 紫 | `#9878B8` | `#785898` | `rgba(255,255,255,0.25)` | 紫晶 |
| 橙 | `#E88848` | `#C86828` | `rgba(255,255,255,0.25)` | 焦橙 |
| 粉 | `#E878A8` | `#C85888` | `rgba(255,255,255,0.25)` | 桃粉 |
| 青 | `#40B0C0` | `#2890A0` | `rgba(255,255,255,0.25)` | 深青 |
| 棕 | `#B88058` | `#986038` | `rgba(255,255,255,0.20)` | 古铜 |
| 灰 | `#9098A8` | `#707888` | `rgba(255,255,255,0.20)` | 银灰 |

#### 试管壁颜色

| 主题 | 试管壁色 | 试管内壁色 | 说明 |
|------|----------|-----------|------|
| Light | `rgba(180, 200, 220, 0.6)` | `rgba(240, 245, 250, 0.3)` | 半透明玻璃感 |
| Dark | `rgba(100, 130, 170, 0.4)` | `rgba(30, 50, 80, 0.3)` | 暗色玻璃感 |

### 7.5 液体绘制细节

每层液体使用渐变填充，模拟真实液体的光泽感：

```
┌─────────────────┐  ← 顶部：高光条（半透明白色）
│ ████████████████ │  ← 主体：从主色到终止色的垂直渐变
│ ████████████████ │
└─────────────────┘  ← 底部：无特殊处理
```

**液体层间**：相邻同色层之间不留间隙，不同色层之间留 1px 间隙。

### 7.6 动画设计

| 动画类型 | 时长 | 缓动函数 | 描述 |
|---------|------|---------|------|
| 试管选中上移 | 150ms | ease-out | 选中试管上移 20px |
| 试管取消选中 | 150ms | ease-out | 试管回到原位 |
| 液体倒入 | 300ms | ease-in-out | 液体从源试管顶部飞到目标试管顶部 |
| 液体落入 | 200ms | ease-in | 液体落入目标试管底部 |
| 试管完成闪光 | 400ms | ease-out | 试管完成时闪一下白光 |
| 通关庆祝 | 800ms | ease-out | 所有试管同时闪光 + 文字弹出 |

> 注：由于使用 Canvas 2D 渲染，动画通过 `requestAnimationFrame` + 状态插值实现，不做复杂物理动画。

### 7.7 操作按钮区域

水排序的操作按钮与 2048/消灭星星有所不同，需要增加 UNDO 和 RESET：

```
┌──────────────────────────────────────────────┐
│  [↩ UNDO]  [↺ RESET]  🏠  🔊  🌙          │
└──────────────────────────────────────────────┘
```

| 按钮 | 宽度 | 高度 | 说明 |
|------|------|------|------|
| UNDO | rpx(160) | rpx(72) | 撤销上一步，无历史时灰色 |
| RESET | rpx(160) | rpx(72) | 重置当前关卡到初始状态 |
| 🏠 | rpx(88) | rpx(88) | 返回主页 |
| 🔊 | rpx(88) | rpx(88) | 音效开关 |
| 🌙 | rpx(88) | rpx(88) | 主题切换 |

### 7.8 通关界面

```
┌─────────────────────────────────┐
│                                 │
│     ═══ LEVEL CLEAR ═══        │
│                                 │
│     Moves:  12                  │
│     Best:   8                   │
│                                 │
│     [NEXT LEVEL]  [HOME]        │
│                                 │
└─────────────────────────────────┘
```

### 7.9 全部通关界面

当玩家完成第 200 关时，显示特殊祝贺：

```
┌─────────────────────────────────┐
│                                 │
│    🎉 CONGRATULATIONS 🎉       │
│                                 │
│    You completed all 200        │
│    levels!                      │
│                                 │
│    [PLAY AGAIN]    [HOME]       │
│                                 │
└─────────────────────────────────┘
```

## 8. 交互设计

### 8.1 与现有游戏的交互差异

| 维度 | 2048 | 消灭星星 | 水排序 |
|------|------|----------|--------|
| 操作方式 | 滑动手势 | 点击 | 点击选中 + 点击倒入 |
| 反馈方式 | 方块滑动 | 星星消除+下落 | 液体倒入动画 |
| 预览机制 | 无 | 高亮连通块 | 选中试管上移 |
| 撤销 | 无 | 无 | 支持无限撤销 |
| 游戏节奏 | 每步生成新方块 | 不生成新内容 | 不生成新内容 |
| 结束条件 | 棋盘满且无法合并 | 无可消除组 | 所有颜色归位 |
| 关卡系统 | 无限模式 | 关卡制 | 关卡制（200关） |

### 8.2 触摸事件处理

水排序场景下的触摸处理：

1. **点击试管** → 判断是否在试管区域内
2. **无选中试管** → 选中该试管（上移动画）
3. **已有选中试管** →
   - 点击同一试管 → 取消选中
   - 点击不同试管 → 尝试倒入操作
     - 可以倒入 → 执行倒入 + 动画 + 检查通关
     - 不可倒入 → 播放无效音效 + 选中切换到新试管

### 8.3 试管点击区域

试管的点击区域比视觉区域略大（增加 8px 边距），确保手指粗的玩家也能准确点击：

```
视觉区域: ┌───┐
点击区域: ┌─────┐  (每侧多 4px)
          │┌───┐│
          ││   ││
          │└───┘│
          └─────┘
```

## 9. 整体架构设计

### 9.1 场景状态机扩展

```
HOME (游戏选择主页)
  ├── 2048 MODE SELECT → GAME_2048
  ├── POPSTAR CONFIRM → GAME_POPSTAR
  └── WATER SORT CONFIRM → GAME_WATERSORT
```

### 9.2 场景枚举扩展

```javascript
const SCENE = {
  HOME: 'home',
  HOME_2048_MODE: 'home_2048_mode',
  GAME_2048: 'game_2048',
  GAME_POPSTAR: 'game_popstar',
  POPSTAR_CONFIRM: 'popstar_confirm',
  GAME_WATERSORT: 'game_watersort',        // 🆕
  WATERSORT_CONFIRM: 'watersort_confirm'    // 🆕
};
```

### 9.3 新增文件结构

```
2048minigame/
├── game.js                  # 主入口（扩展场景调度）
├── game-logic.js            # 2048 逻辑（保持不变）
├── popstar-logic.js         # 消灭星星逻辑（保持不变）
├── watersort-logic.js       # 🆕 水排序核心逻辑
├── mode-config.js           # 扩展：增加水排序游戏类型配置
├── storage.js               # 扩展：增加水排序存档支持
├── sound-manager.js         # 扩展：增加水排序音效
├── game.json                # 保持不变
└── tests/
    ├── game-logic.test.js   # 保持不变
    ├── mode-config.test.js  # 保持不变
    ├── popstar-logic.test.js # 保持不变
    └── watersort-logic.test.js # 🆕 水排序逻辑测试
```

## 10. 代码改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `watersort-logic.js` | **新增** | 水排序核心逻辑：关卡生成、倒入判断、撤销、通关判定 |
| `game.js` | **修改** | 新增 `SCENE.GAME_WATERSORT` 和 `SCENE.WATERSORT_CONFIRM`；新增水排序场景的渲染、触摸处理、布局计算；主页增加水排序卡片 |
| `mode-config.js` | **修改** | 增加水排序游戏类型配置 |
| `storage.js` | **修改** | 增加水排序的存档/最高分/最少步数存储支持 |
| `sound-manager.js` | **修改** | 增加水排序音效配置 |
| `game-logic.js` | **不变** | 2048 逻辑保持原样 |
| `popstar-logic.js` | **不变** | 消灭星星逻辑保持原样 |
| `audio/*.mp3` | **新增** | 6 个水排序音效文件 |

### 10.1 game.js 主要改动点

1. **场景枚举**：`SCENE` 增加 `GAME_WATERSORT` 和 `WATERSORT_CONFIRM`
2. **状态变量**：增加水排序相关状态（tubes, level, moves, history, selectedTube 等）
3. **布局计算**：增加水排序试管区域的布局计算
4. **触摸处理**：增加水排序的点击选中/倒入逻辑
5. **渲染方法**：增加水排序场景的渲染（试管、液体、按钮等）
6. **主题扩展**：`themes` 对象增加水排序颜色配置
7. **主页卡片**：`loadAllGameTypesInfo` 增加水排序信息

### 10.2 mode-config.js 改动

```javascript
const gameTypes = [
  { id: '2048', label: '2048', subtitle: '4×4 | 5×5 | 6×6', icon: '★', ... },
  { id: 'popstar', label: '消灭星星', subtitle: 'POPSTAR', icon: '✦', ... },
  { id: 'watersort', label: '水排序', subtitle: 'WATER SORT', icon: '💧',  // 🆕
    bestScoreStorageKey: 'watersort-best',
    saveStateStorageKey: 'watersort-save' }
];
```

### 10.3 storage.js 改动

增加以下函数（参照 popstar 的模式）：

- `loadWatersortBestScore()` — 加载最高通关关卡
- `saveWatersortBestScore(level)` — 保存最高通关关卡
- `loadWatersortSaveState()` — 加载游戏存档
- `saveWatersortSaveState(state)` — 保存游戏存档
- `clearWatersortSaveState()` — 清除存档
- `hasWatersortSaveState()` — 是否有存档
- `loadWatersortBestMoves(level)` — 加载某关卡最少步数
- `saveWatersortBestMoves(level, moves)` — 保存某关卡最少步数

`loadAllGameTypesInfo` 增加水排序信息：

```javascript
const watersortInfo = {
  id: 'watersort',
  label: '水排序',
  subtitle: 'WATER SORT',
  icon: '💧',
  bestScore: loadWatersortBestScore(),
  hasSave: hasWatersortSaveState()
};
```

### 10.4 sound-manager.js 改动

`SOUND_CONFIG` 增加水排序音效：

```javascript
const SOUND_CONFIG = {
  ...existing,
  watersort_select: 'audio/watersort_select.mp3',
  watersort_pour: 'audio/watersort_pour.mp3',
  watersort_invalid: 'audio/watersort_invalid.mp3',
  watersort_complete: 'audio/watersort_complete.mp3',
  watersort_levelclear: 'audio/watersort_levelclear.mp3',
  watersort_undo: 'audio/watersort_undo.mp3'
};
```

SoundManager 增加水排序专用方法：

```javascript
playWatersortSelect() { this.play('watersort_select', { volume: 0.6 }); }
playWatersortPour() { this.play('watersort_pour', { volume: 0.7 }); }
playWatersortInvalid() { this.play('watersort_invalid', { volume: 0.5 }); }
playWatersortComplete() { this.play('watersort_complete', { volume: 0.8 }); }
playWatersortLevelClear() { this.play('watersort_levelclear', { volume: 1.0 }); }
playWatersortUndo() { this.play('watersort_undo', { volume: 0.5 }); }
```

## 11. watersort-logic.js 详细设计

### 11.1 模块导出

```javascript
module.exports = {
  TUBE_CAPACITY,
  WATER_COLORS,
  getColorCountForLevel,
  getTubeCountForLevel,
  generateLevel,
  getTopColor,
  getTopConsecutiveCount,
  canPour,
  pour,
  isTubeComplete,
  isLevelComplete,
  cloneTubes,
  undoMove,
  resetLevel,
  MAX_LEVEL
};
```

### 11.2 常量

```javascript
const TUBE_CAPACITY = 4;
const MAX_LEVEL = 200;
const EMPTY_TUBES = 2;

const LEVEL_CONFIG = [
  { maxLevel: 5,   colorCount: 3  },
  { maxLevel: 15,  colorCount: 4  },
  { maxLevel: 35,  colorCount: 5  },
  { maxLevel: 60,  colorCount: 6  },
  { maxLevel: 90,  colorCount: 7  },
  { maxLevel: 120, colorCount: 8  },
  { maxLevel: 150, colorCount: 9  },
  { maxLevel: 200, colorCount: 10 }
];
```

### 11.3 关卡配置函数

```javascript
function getColorCountForLevel(level) {
  for (const config of LEVEL_CONFIG) {
    if (level <= config.maxLevel) {
      return config.colorCount;
    }
  }
  return 10;
}

function getTubeCountForLevel(level) {
  return getColorCountForLevel(level) + EMPTY_TUBES;
}
```

### 11.4 试管操作函数

```javascript
function getTopColor(tube) {
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] !== null) return tube[i];
  }
  return null;
}

function getTopConsecutiveCount(tube) {
  const topColor = getTopColor(tube);
  if (topColor === null) return 0;
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === topColor) count++;
    else break;
  }
  return count;
}

function getEmptySlotCount(tube) {
  return tube.filter(c => c === null).length;
}

function canPour(fromTube, toTube) {
  const fromTop = getTopColor(fromTube);
  if (fromTop === null) return false;
  const toEmpty = getEmptySlotCount(toTube);
  if (toEmpty === 0) return false;
  const toTop = getTopColor(toTube);
  if (toTop === null) return true;
  return toTop === fromTop;
}

function pour(fromTube, toTube) {
  const fromTop = getTopColor(fromTube);
  const pourCount = Math.min(
    getTopConsecutiveCount(fromTube),
    getEmptySlotCount(toTube)
  );

  const newFrom = [...fromTube];
  const newTo = [...toTube];

  for (let i = 0; i < pourCount; i++) {
    const topIndex = newFrom.lastIndexOf(fromTop);
    newFrom[topIndex] = null;
  }

  for (let i = 0; i < pourCount; i++) {
    const firstEmpty = newTo.indexOf(null);
    newTo[firstEmpty] = fromTop;
  }

  return { newFrom, newTo, count: pourCount };
}

function isTubeComplete(tube) {
  if (getEmptySlotCount(tube) === TUBE_CAPACITY) return true;
  const topColor = getTopColor(tube);
  if (topColor === null) return true;
  return tube.every(c => c === topColor);
}

function isLevelComplete(tubes) {
  return tubes.every(tube => isTubeComplete(tube));
}

function cloneTubes(tubes) {
  return tubes.map(tube => [...tube]);
}
```

### 11.5 撤销与重置

```javascript
function undoMove(tubes, history) {
  if (history.length === 0) return null;

  const lastMove = history[history.length - 1];
  const { from, to, count, color } = lastMove;

  const newTubes = cloneTubes(tubes);
  const newHistory = history.slice(0, -1);

  for (let i = 0; i < count; i++) {
    const topIndex = newTubes[to].lastIndexOf(color);
    if (topIndex !== -1) newTubes[to][topIndex] = null;
  }

  for (let i = 0; i < count; i++) {
    const firstEmpty = newTubes[from].indexOf(null);
    if (firstEmpty !== -1) newTubes[from][firstEmpty] = color;
  }

  return { tubes: newTubes, history: newHistory };
}

function resetLevel(initialTubes) {
  return {
    tubes: cloneTubes(initialTubes),
    history: [],
    moves: 0
  };
}
```

### 11.6 关卡生成

```javascript
function generateLevel(level) {
  const colorCount = getColorCountForLevel(level);
  const tubeCount = getTubeCountForLevel(level);

  let tubes = [];
  for (let i = 0; i < colorCount; i++) {
    tubes.push(Array(TUBE_CAPACITY).fill(i));
  }
  for (let i = 0; i < tubeCount - colorCount; i++) {
    tubes.push(Array(TUBE_CAPACITY).fill(null));
  }

  const shuffleRounds = colorCount * 25;
  for (let round = 0; round < shuffleRounds; round++) {
    const nonEmpty = [];
    for (let i = 0; i < tubeCount; i++) {
      if (getTopColor(tubes[i]) !== null) nonEmpty.push(i);
    }
    if (nonEmpty.length === 0) break;

    const fromIndex = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
    const topColor = getTopColor(tubes[fromIndex]);

    const validTargets = [];
    for (let j = 0; j < tubeCount; j++) {
      if (j === fromIndex) continue;
      const toTop = getTopColor(tubes[j]);
      const toEmpty = getEmptySlotCount(tubes[j]);
      if (toEmpty > 0 && (toTop === null || toTop !== topColor)) {
        validTargets.push(j);
      }
    }
    if (validTargets.length === 0) continue;

    const toIndex = validTargets[Math.floor(Math.random() * validTargets.length)];
    const result = pour(tubes[fromIndex], tubes[toIndex]);
    tubes[fromIndex] = result.newFrom;
    tubes[toIndex] = result.newTo;
  }

  if (isLevelComplete(tubes)) {
    return generateLevel(level);
  }

  const initialTubes = cloneTubes(tubes);

  return { tubes, colorCount, tubeCount, initialTubes };
}
```

## 12. 测试用例设计

### 12.1 watersort-logic.test.js 核心测试

| 测试项 | 验证内容 |
|--------|----------|
| `getColorCountForLevel` | 各关卡范围返回正确颜色数 |
| `getTubeCountForLevel` | 各关卡范围返回正确试管数 |
| `getTopColor` | 空试管返回 null；非空试管返回顶部颜色 |
| `getTopConsecutiveCount` | 连续同色计数正确；不连续时只计顶部 |
| `canPour` | 空到空不可倒；非空到空可倒；同色可倒；异色不可倒；满管不可倒 |
| `pour` | 倒入数量正确；部分倒入（空间不足时）；试管状态更新正确 |
| `isTubeComplete` | 空试管完成；4层同色完成；混合不完成 |
| `isLevelComplete` | 全部完成返回 true；有一个未完成返回 false |
| `generateLevel` | 生成的试管数量正确；颜色分布正确；不是已完成状态 |
| `undoMove` | 撤销后恢复原状态；空历史不可撤销 |
| `resetLevel` | 重置后恢复初始状态；历史清空；步数归零 |
| `关卡生成稳定性` | 连续生成 100 个关卡不崩溃；每个关卡都有解 |

## 13. 开发里程碑

| 阶段 | 任务 | 交付物 |
|------|------|--------|
| Phase 1 | 核心逻辑实现 | `watersort-logic.js` + 单元测试 |
| Phase 2 | 配置与存储扩展 | `mode-config.js` + `storage.js` + `sound-manager.js` 改动 |
| Phase 3 | UI 渲染实现 | 试管绘制、液体绘制、选中状态、按钮区域 |
| Phase 4 | 交互与动画 | 触摸处理、倒入动画、通关检测、撤销/重置 |
| Phase 5 | 集成与测试 | 主页卡片、场景切换、全链路测试 |
| Phase 6 | 音效与打磨 | 音效接入、动画调优、边界情况处理 |

## 14. 主页卡片设计

水排序在主页的卡片信息：

```
┌─────────────────────────────────┐
│  💧  水排序                     │
│      WATER SORT                 │
│      BEST: LV.35               │
│                    [继续]        │  ← 有存档时显示
└─────────────────────────────────┘
```

- `BEST` 显示最高通关关卡号（如 LV.35 表示通关到第 35 关）
- 有存档时显示"继续"徽章
- 点击后若有存档，弹出确认对话框（与消灭星星一致的模式）

---

*文档版本：v1.0*
*创建日期：2026-04-22*
