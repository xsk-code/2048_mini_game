# 消灭星星（PopStar）游戏接入设计

**日期：** 2026-04-22

## 1. 目标

在现有 2048 小游戏项目中接入第二个游戏——消灭星星（PopStar），实现多游戏共存，用户可在主页选择不同游戏类型。

## 2. 不在本次范围内

- 不增加联网能力
- 不引入新的外部依赖
- 不做整仓级重构
- 不增加复杂动画系统
- 不为消灭星星增加多种模式（如限时模式、对战模式等），仅实现经典模式

## 3. 消灭星星玩法规则

### 3.1 核心规则

| 规则项 | 详情 |
|--------|------|
| 棋盘 | 10×10 网格，填满 5 种颜色的星星 |
| 消除条件 | 点击 2 个及以上横向/纵向相连的同色星星即可消除 |
| 计分公式 | 单次消除分数 = 消除星星数² × 5（如消除 10 个得 500 分） |
| 重力下落 | 消除后上方星星自动下落填补空缺 |
| 列合并 | 同列全部消除后，右侧列向左合并靠拢 |
| 关卡结束 | 屏幕中不再有可相连的同色星星时，关卡结束 |
| 剩余奖励 | 剩余星星 < 10 个：奖励分 = 2000 - 剩余数 × 5；≥ 10 个：无奖励 |
| 通关条件 | 累计得分 ≥ 目标分数即可进入下一关 |

### 3.2 计分示例

| 消除数量 | 单次得分 | 计算过程 |
|----------|----------|----------|
| 2 | 20 | 2² × 5 |
| 5 | 125 | 5² × 5 |
| 10 | 500 | 10² × 5 |
| 20 | 2000 | 20² × 5 |

### 3.3 剩余奖励示例

| 剩余数量 | 奖励分数 | 计算过程 |
|----------|----------|----------|
| 0 | 2000 | 2000 - 0 × 5 |
| 5 | 1975 | 2000 - 5 × 5 |
| 9 | 1955 | 2000 - 9 × 5 |
| 10 | 0 | ≥ 10 无奖励 |

### 3.4 关卡目标分

| 关卡 | 目标分 | 计算公式 |
|------|--------|----------|
| 1 | 1000 | 1000 + (1-1) × 500 |
| 2 | 1500 | 1000 + (2-1) × 500 |
| 3 | 2000 | 1000 + (3-1) × 500 |
| N | 1000 + (N-1) × 500 | 递增 |

## 4. 整体架构设计

### 4.1 场景状态机扩展

当前项目有 `HOME → GAME` 两个场景，需扩展为支持多游戏类型：

```
HOME (游戏选择主页)
  ├── 2048 GAME (4×4 / 5×5 / 6×6)
  └── POPSTAR GAME (消灭星星)
```

### 4.2 场景枚举

```javascript
const SCENE = {
  HOME: 'home',
  GAME_2048: 'game_2048',
  GAME_POPSTAR: 'game_popstar'
};
```

### 4.3 新增文件结构

```
2048minigame/
├── game.js                  # 主入口（扩展场景调度）
├── game-logic.js            # 2048 逻辑（保持不变）
├── popstar-logic.js         # 🆕 消灭星星核心逻辑
├── mode-config.js           # 扩展：增加游戏类型配置
├── storage.js               # 扩展：增加消灭星星存档支持
├── game.json                # 保持不变
├── storage.js               # 保持不变
└── tests/
    ├── game-logic.test.js   # 保持不变
    ├── mode-config.test.js  # 保持不变
    └── popstar-logic.test.js # 🆕 消灭星星逻辑测试
```

## 5. 消灭星星核心逻辑设计

### 5.1 数据模型

```javascript
const STAR_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const POPSTAR_GRID_SIZE = 10;

// 棋盘：10×10 二维数组
// board[row][col] = 0 | 1 | 2 | 3 | 4 | null
// 0-4 代表颜色索引，null 代表空格

// 游戏状态
{
  board: (number | null)[][],  // 10×10 颜色索引数组
  score: number,               // 当前关卡累计分
  totalScore: number,          // 跨关卡总分
  level: number,               // 当前关卡
  targetScore: number,         // 当前关卡目标分
  isGameOver: boolean,         // 是否无法继续消除
  isLevelClear: boolean        // 是否通关
}
```

### 5.2 核心算法

| 算法 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `findConnected(board, row, col)` | 棋盘 + 起始坐标 | `Set<{row, col}>` | BFS 查找与起点相连的同色星星集合 |
| `canEliminate(board, row, col)` | 棋盘 + 坐标 | `boolean` | 该位置的同色连通块 ≥ 2 则可消除 |
| `eliminate(board, positions)` | 棋盘 + 消除坐标集 | 新棋盘 | 将指定位置置空 |
| `applyGravity(board)` | 棋盘 | 新棋盘 | 每列内星星下落填补空缺 |
| `collapseColumns(board)` | 棋盘 | 新棋盘 | 空列消除，右侧列左移 |
| `hasValidMoves(board)` | 棋盘 | `boolean` | 是否还存在 ≥ 2 的同色连通块 |
| `calculateScore(count)` | 消除数量 | 分数 | `count * count * 5` |
| `calculateBonus(remaining)` | 剩余星星数 | 奖励分 | `< 10 ? 2000 - remaining * 5 : 0` |
| `getTargetScore(level)` | 关卡号 | 目标分 | `1000 + (level - 1) * 500` |
| `createBoard()` | 无 | 10×10 棋盘 | 随机填充 5 色星星 |
| `countRemainingStars(board)` | 棋盘 | 剩余数量 | 统计非空格子数 |

### 5.3 核心算法伪代码

#### findConnected（BFS 连通块查找）

```
function findConnected(board, row, col):
    if board[row][col] is null: return empty set

    color = board[row][col]
    visited = new Set()
    queue = [{row, col}]
    visited.add({row, col})

    while queue is not empty:
        current = queue.dequeue()
        for each neighbor (up, down, left, right):
            if neighbor is within bounds
               and not visited
               and board[neighbor.row][neighbor.col] === color:
                visited.add(neighbor)
                queue.enqueue(neighbor)

    return visited
```

#### applyGravity（重力下落）

```
function applyGravity(board):
    for each column col from 0 to 9:
        writePos = 9  // 从底部开始
        for readPos from 9 down to 0:
            if board[readPos][col] is not null:
                board[writePos][col] = board[readPos][col]
                if writePos !== readPos:
                    board[readPos][col] = null
                writePos--
        // writePos 以上全部置 null（已在循环中处理）
    return board
```

#### collapseColumns（列合并）

```
function collapseColumns(board):
    writeCol = 0
    for readCol from 0 to 9:
        if column readCol has any non-null cell:
            if writeCol !== readCol:
                copy column readCol to column writeCol
                clear column readCol
            writeCol++
    return board
```

### 5.4 游戏流程

```
1. 初始化：生成 10×10 随机棋盘，关卡 1，目标 1000 分
2. 玩家点击星星 → 查找连通块
3. 连通块 < 2 → 无反应
4. 连通块 ≥ 2 → 高亮预览 → 点击确认消除
5. 计算得分 → 消除 → 重力下落 → 列合并
6. 检查是否还有可消除的组
7. 无可消除 → 关卡结束
   - 计算剩余奖励
   - 总分 ≥ 目标 → 通关 → 下一关
   - 总分 < 目标 → 游戏结束
```

## 6. 交互设计

### 6.1 与 2048 的核心差异

| 维度 | 2048 | 消灭星星 |
|------|------|----------|
| 操作方式 | 滑动手势 | 点击 |
| 反馈方式 | 方块滑动动画 | 星星消除 + 下落动画 |
| 预览机制 | 无 | 点击时高亮同色连通块 |
| 游戏节奏 | 每步生成新方块 | 不生成新内容，只做物理下落 |
| 结束条件 | 棋盘满且无法合并 | 无可消除的同色连通块 |
| 关卡系统 | 无限模式 | 关卡制，有目标分数 |

### 6.2 触摸事件处理

消灭星星场景下，触摸处理逻辑与 2048 完全不同：

- **2048**：计算滑动方向向量
- **消灭星星**：计算点击坐标 → 映射到棋盘格子 → 查找连通块 → 消除

在 `setupTouchEvents` 中根据 `currentScene` 分发不同处理逻辑。

### 6.3 高亮预览

当玩家手指按下某个星星时：

1. 找到该位置的同色连通块
2. 如果连通块 ≥ 2，高亮显示这些星星（添加半透明覆盖层或缩放效果）
3. 手指抬起时执行消除

## 7. UI 布局修改方案

### 7.1 主页改造

当前主页是纯 2048 模式选择（3 张卡片）。改造为**两级主页**：

**第一级：游戏类型选择**

```
┌─────────────────────────────────┐
│         MINI GAMES              │
│       CHOOSE YOUR GAME          │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │  ★  2048               │    │  ← 游戏类型卡片 1
│  │     4×4 | 5×5 | 6×6    │    │     点击进入 2048 模式选择
│  │     BEST: 1234          │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ✦  消灭星星            │    │  ← 游戏类型卡片 2
│  │     POPSTAR              │    │     点击直接进入游戏
│  │     BEST: 5678           │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**第二级：2048 模式选择（保持现有设计不变）**

选择两级主页的理由：

1. 层次清晰，不会让主页过于拥挤
2. 2048 已有成熟的模式选择页，保持不变
3. 消灭星星无需模式选择，直接进入
4. 未来增加新游戏也容易扩展

### 7.2 消灭星星游戏界面布局

```
┌─────────────────────────────────┐
│  POPSTAR          LEVEL 3       │  ← 标题 + 关卡
├─────────────────────────────────┤
│  SCORE: 1250  │  TARGET: 2000   │  ← 分数卡
├─────────────────────────────────┤
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│  │🔴│🔵│🟢│🟡│🟣│🔴│🔵│🟢│🟡│🟣││  ← 10×10 星星棋盘
│  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤│     每格比 2048 更小
│  │🟢│🟡│🟣│🔴│🔵│🟢│🟡│🟣│🔴│🔵││
│  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤│
│  │...（10 行）                ││
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
├─────────────────────────────────┤
│  [NEW GAME]  🏠  🌙             │  ← 操作按钮（复用现有样式）
└─────────────────────────────────┘
```

### 7.3 星星视觉设计

消灭星星的星星需要与 2048 的方块风格区分，但保持同一套主题体系。

**马卡龙主题（Light）**：

| 颜色 | 背景色 | 文字色 | 说明 |
|------|--------|--------|------|
| 红 | `#FF8BA0` | `#FFFFFF` | 珊瑚粉 |
| 蓝 | `#7EB8E6` | `#FFFFFF` | 天蓝 |
| 绿 | `#88D8B0` | `#FFFFFF` | 薄荷绿 |
| 黄 | `#FFD466` | `#6B5D4F` | 柠檬黄 |
| 紫 | `#B8A0D8` | `#FFFFFF` | 薰衣草 |

**暗夜主题（Dark）**：

| 颜色 | 背景色 | 文字色 | 说明 |
|------|--------|--------|------|
| 红 | `#E87090` | `#FFFFFF` | 玫红 |
| 蓝 | `#5090C8` | `#FFFFFF` | 钴蓝 |
| 绿 | `#50B888` | `#FFFFFF` | 翡翠 |
| 黄 | `#E8B840` | `#0D1B2A` | 琥珀 |
| 紫 | `#9078B8` | `#FFFFFF` | 紫晶 |

每颗星星绘制为**圆角方块 + 星形图标**，高亮时添加发光效果。

### 7.4 关卡结算界面

当关卡结束时（无可消除组），弹出结算覆盖层：

**通关时**：

```
┌─────────────────────────────────┐
│                                 │
│      ═══ LEVEL CLEAR ═══       │
│                                 │
│      Score:  1250               │
│      Bonus:  +1975              │
│      Total:  3225               │
│                                 │
│      [NEXT LEVEL]  [HOME]       │
│                                 │
└─────────────────────────────────┘
```

**未通关时**：

```
┌─────────────────────────────────┐
│                                 │
│      ═══ GAME OVER ═══         │
│                                 │
│      Score:  800                │
│      Bonus:  +0                 │
│      Total:  800                │
│      Target: 1000               │
│                                 │
│      [RETRY]       [HOME]       │
│                                 │
└─────────────────────────────────┘
```

## 8. 代码改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `game.js` | **大幅修改** | 新增 `SCENE.GAME_POPSTAR`；新增 PopStar 场景的渲染、触摸处理、布局计算；主页改为游戏类型选择 |
| `popstar-logic.js` | **新增** | 消灭星星核心逻辑：连通块查找、消除、重力、列合并、结束判定、计分 |
| `mode-config.js` | **修改** | 增加游戏类型配置（gameType），增加消灭星星的配置项 |
| `storage.js` | **修改** | 增加消灭星星的存档/最高分存储支持 |
| `game-logic.js` | **不变** | 2048 逻辑保持原样 |

### 8.1 game.js 主要改动点

1. **场景枚举**：`SCENE` 增加 `GAME_POPSTAR`
2. **主页渲染**：`renderHome()` 改为游戏类型选择，点击 2048 进入模式选择子页，点击消灭星星直接进入游戏
3. **新增主页子场景**：2048 模式选择页（复用现有 `drawModeCards`）
4. **新增 PopStar 渲染**：`drawPopstarBoard()`、`drawPopstarStars()`、`drawPopstarOverlay()`
5. **触摸事件分发**：根据 `currentScene` 分别处理滑动（2048）和点击（消灭星星）
6. **布局计算**：新增消灭星星场景的尺寸计算（10×10 棋盘，格子更小）
7. **主题扩展**：`themes` 对象增加 `popstarColors` 配置

### 8.2 mode-config.js 改动

```javascript
const gameTypes = [
  {
    id: '2048',
    label: '2048',
    subtitle: '4×4 | 5×5 | 6×6',
    bestScoreStorageKey: '2048-best',
    saveStateStorageKey: '2048-save'
  },
  {
    id: 'popstar',
    label: '消灭星星',
    subtitle: 'POPSTAR',
    bestScoreStorageKey: 'popstar-best',
    saveStateStorageKey: 'popstar-save'
  }
];
```

### 8.3 storage.js 改动

增加消灭星星的存档支持：

- `loadPopstarBestScore()`：读取消灭星星最高分
- `savePopstarBestScore(score)`：保存消灭星星最高分
- `loadPopstarSaveState()`：读取消灭星星存档
- `savePopstarSaveState(state)`：保存消灭星星存档

## 9. 实施阶段

| 阶段 | 任务 | 优先级 |
|------|------|--------|
| Phase 1 | `popstar-logic.js` 核心算法实现 + 单元测试 | P0 |
| Phase 2 | 主页改造为游戏类型选择 | P0 |
| Phase 3 | 消灭星星场景渲染 + 触摸交互 | P0 |
| Phase 4 | 关卡系统 + 结算界面 | P1 |
| Phase 5 | 动画效果（消除闪烁、下落、列合并） | P1 |
| Phase 6 | 存档 + 最高分持久化 | P1 |

## 10. 风险与控制

### 风险 1：game.js 继续膨胀

控制方式：

- 消灭星星的纯逻辑全部放在 `popstar-logic.js`
- `game.js` 只做场景调度、渲染和交互协调
- 考虑将 PopStar 渲染逻辑抽为独立方法组，与 2048 渲染逻辑分离

### 风险 2：10×10 棋盘在小屏设备上格子过小

控制方式：

- 格子尺寸自适应屏幕宽度
- 星星使用鲜明的颜色区分，不依赖文字可读性
- 高亮预览提供充足的视觉反馈

### 风险 3：两个游戏的触摸事件冲突

控制方式：

- 严格按 `currentScene` 分发触摸逻辑
- 2048 场景只处理滑动
- 消灭星星场景只处理点击

### 风险 4：关卡系统增加状态复杂度

控制方式：

- 关卡状态（level、totalScore、targetScore）统一管理
- 存档包含完整关卡信息，恢复时不丢失进度
- 关卡目标分使用简单公式，无需额外配置表
