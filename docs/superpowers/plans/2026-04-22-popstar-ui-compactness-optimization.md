# 消灭星星 UI 饱满度优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化消灭星星棋盘的视觉饱满度，解决格子间隔过大、星星样式单薄导致的松散感

**Architecture:** 分三阶段优化——先缩减棋盘间距（布局层），再增强星星视觉层次（渲染层），最后优化空格背景与高亮反馈（交互层）。所有改动集中在 `game.js` 的布局计算和渲染方法中，不涉及逻辑层 `popstar-logic.js`。

**Tech Stack:** 微信小游戏 Canvas 2D API（`wx.createCanvas()` + `ctx` 绑定），rpx 自适应单位系统

---

## 问题诊断

### 当前数值分析（以 boardSize = 640rpx 为基准）

| 指标 | 2048 (4×4) | 消灭星星 (10×10) | 差异倍数 |
|------|-----------|-----------------|---------|
| cellGap | 16rpx (2.5%) | 16rpx (2.5%) | 1× |
| cellSize | 140rpx | 46.4rpx | 0.33× |
| gap/cell 比例 | 11.4% | **34.5%** | **3×** |
| 间隔总占比 | 12.5% | **27.5%** | 2.2× |
| 圆角半径 | 12rpx | 7.2rpx (12×0.6) | — |
| 圆角/cellSize | 8.6% | **15.5%** | 1.8× |
| 星星图标字号 | — | 16.2rpx (35%) | — |

**核心问题：** `cellGap` 为 2048 和消灭星星共用（`boardSize * 0.025`），10×10 网格下间隔占比是 4×4 的 3 倍，导致视觉松散。星星仅用纯色圆角矩形 + 小号 ★ 文字，缺乏层次感。

### 问题根因定位

| # | 问题 | 根因代码位置 | 说明 |
|---|------|------------|------|
| 1 | 间隔过大 | [game.js:213](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L213) `this.cellGap = this.boardSize * 0.025` | 2048/Popstar 共用同一 gap |
| 2 | 星星单薄 | [game.js:1652](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1652) `this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, this.cellRadius * 0.6)` + 纯色 `ctx.fillStyle = style.bg` | 无渐变、无高光、无内阴影 |
| 3 | 图标过小 | [game.js:1657](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1657) `cellSize * 0.35` | ★ 字号仅占格子 35% |
| 4 | 圆角过大 | [game.js:1652](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1652) `this.cellRadius * 0.6` | 圆角占 cellSize 15.5%，视觉上"削掉"太多面积 |
| 5 | 空格背景噪点 | [game.js:1597-1604](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1597) 每个空格绘制 `theme.cellBg` | 消灭星星不需要 2048 式的空格占位背景 |

---

## 优化目标

| 指标 | 当前值 | 目标值 | 改善幅度 |
|------|--------|--------|---------|
| gap/cell 比例 | 34.5% | ~6.5% | ↓ 81% |
| 间隔总占比 | 27.5% | ~6.6% | ↓ 76% |
| cellSize | 46.4rpx | ~59.3rpx | ↑ 28% |
| 星星图标占比 | 35% | 50% | ↑ 43% |
| 圆角/cellSize | 15.5% | ~8.4% | ↓ 46% |

---

## File Structure

| 文件 | 改动类型 | 职责 |
|------|---------|------|
| `game.js` | **修改** | 布局计算、渲染方法、主题配置 |

不涉及 `popstar-logic.js`、`sound-manager.js`、`storage.js` 等其他文件。

---

### Task 1: 引入独立 popstarCellGap，缩减棋盘间隔

**Files:**
- Modify: `game.js:213`（布局计算区）
- Modify: `game.js:510-511`（popstarCellSize getter）

**目标：** 将消灭星星的格子间隔从 `boardSize * 0.025` 缩减至 `boardSize * 0.006`，使 gap/cell 比例从 34.5% 降至 ~6.5%，与典型 PopStar 游戏的 5~10% 区间吻合，星星面积占比从 55% 提升至 ~84%。

- [ ] **Step 1: 在布局计算区新增 popstarCellGap 属性**

在 [game.js:213](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L213) `this.cellGap = this.boardSize * 0.025;` 之后新增：

```javascript
this.cellGap = this.boardSize * 0.025;
this.popstarCellGap = this.boardSize * 0.006;
```

- [ ] **Step 2: 修改 popstarCellSize getter 使用 popstarCellGap**

将 [game.js:510-511](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L510) 的 getter：

```javascript
get popstarCellSize() {
    return (this.boardSize - this.cellGap * (this.popstarGridSize + 1)) / this.popstarGridSize;
}
```

改为：

```javascript
get popstarCellSize() {
    return (this.boardSize - this.popstarCellGap * (this.popstarGridSize + 1)) / this.popstarGridSize;
}
```

- [ ] **Step 3: 更新 drawPopstarBoard 中的 cellGap 引用**

将 [game.js:1597-1604](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1597) 的 `drawPopstarBoard()` 方法中所有 `this.cellGap` 替换为 `this.popstarCellGap`：

```javascript
drawPopstarBoard() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(16) : this.rpx(10);
    ctx.shadowOffsetY = this.isDark ? this.rpx(4) : this.rpx(2);

    ctx.fillStyle = theme.boardBg;
    this.drawRoundedRect(this.boardX, this.boardY, this.boardSize, this.boardSize, this.boardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const cellSize = this.popstarCellSize;
    const gap = this.popstarCellGap;
    for (let y = 0; y < this.popstarGridSize; y++) {
      for (let x = 0; x < this.popstarGridSize; x++) {
        const posX = this.boardX + gap + x * (cellSize + gap);
        const posY = this.boardY + gap + y * (cellSize + gap);
        ctx.fillStyle = theme.cellBg;
        this.drawRoundedRect(posX, posY, cellSize, cellSize, this.popstarCellRadius);
        ctx.fill();
      }
    }
  }
```

注意：同时将 `this.cellRadius * 0.6` 替换为 `this.popstarCellRadius`（将在 Task 2 中定义）。

- [ ] **Step 4: 更新 getPopstarStarPosition 中的 cellGap 引用**

将 [game.js:1609-1615](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1609) 的方法改为：

```javascript
getPopstarStarPosition(row, col) {
    const cellSize = this.popstarCellSize;
    const gap = this.popstarCellGap;
    return {
      x: Math.round(this.boardX + gap + col * (cellSize + gap)),
      y: Math.round(this.boardY + gap + row * (cellSize + gap))
    };
  }
```

- [ ] **Step 5: 更新触摸事件中的 cellGap 引用**

将 [game.js:659](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L659) `handlePopstarTouchStart` 中的坐标计算：

```javascript
const cellX = Math.floor((x - this.boardX - this.cellGap) / (this.popstarCellSize + this.cellGap));
const cellY = Math.floor((y - this.boardY - this.cellGap) / (this.popstarCellSize + this.cellGap));
```

改为：

```javascript
const cellX = Math.floor((x - this.boardX - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
const cellY = Math.floor((y - this.boardY - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
```

- [ ] **Step 6: 更新 handlePopstarTouchEnd 中的 cellGap 引用**

将 [game.js:677](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L677) `handlePopstarTouchEnd` 中的坐标计算：

```javascript
const cellX = Math.floor((x - this.boardX - this.cellGap) / (this.popstarCellSize + this.cellGap));
const cellY = Math.floor((y - this.boardY - this.cellGap) / (this.popstarCellSize + this.cellGap));
```

改为：

```javascript
const cellX = Math.floor((x - this.boardX - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
const cellY = Math.floor((y - this.boardY - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
```

- [ ] **Step 7: 验证布局计算正确性**

运行项目，确认：
1. 消灭星星棋盘 10×10 格子完整显示，无溢出
2. 2048 棋盘布局不受影响（仍使用 `this.cellGap`）
3. 触摸点击能正确映射到对应格子

---

### Task 2: 新增 popstarCellRadius，优化星星圆角比例

**Files:**
- Modify: `game.js:244`（布局计算区）

**目标：** 将消灭星星的圆角半径从 `cellRadius * 0.6 = 7.2rpx`（占 cellSize 15.5%）调整为独立计算的 `popstarCellRadius`，使圆角占比降至 ~8%。

- [ ] **Step 1: 在布局计算区新增 popstarCellRadius 属性**

在 [game.js:244](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L244) `this.cellRadius = this.rpx(12);` 之后新增：

```javascript
this.cellRadius = this.rpx(12);
this.popstarCellRadius = this.rpx(5);
```

`5rpx` 约为优化后 cellSize（~59.3rpx）的 8.4%，视觉上保留轻微圆角但不"削角"。

- [ ] **Step 2: 全局替换 popstar 渲染中的 cellRadius * 0.6**

在以下位置将 `this.cellRadius * 0.6` 替换为 `this.popstarCellRadius`：

1. `drawPopstarBoard()` 中的空格背景绘制（已在 Task 1 Step 3 中完成）
2. `drawPopstarStars()` 中的星星绘制（将在 Task 3 中完成）

- [ ] **Step 3: 验证圆角效果**

运行项目，确认星星圆角自然、不过度"削角"，与棋盘背景的圆角风格协调。

---

### Task 3: 增强星星视觉层次——渐变填充 + 内高光 + 图标放大

**Files:**
- Modify: `game.js:1622-1665`（drawPopstarStars 方法）
- Modify: `game.js:48-83`（themes.light.popstarStars 配置）
- Modify: `game.js:84-130`（themes.dark.popstarStars 配置）

**目标：** 将星星从纯色平面方块升级为带渐变、内高光、放大图标的立体方块，显著提升视觉饱满度。

- [ ] **Step 1: 扩展 popstarStars 主题配置，增加渐变色**

将 `themes.light.popstarStars` 从：

```javascript
popstarStars: [
  { bg: '#FF8BA0', text: '#FFFFFF', glow: '#FF8BA0' },
  { bg: '#7EB8E6', text: '#FFFFFF', glow: '#7EB8E6' },
  { bg: '#88D8B0', text: '#FFFFFF', glow: '#88D8B0' },
  { bg: '#FFD466', text: '#6B5D4F', glow: '#FFD466' },
  { bg: '#B8A0D8', text: '#FFFFFF', glow: '#B8A0D8' },
  { bg: '#FFB070', text: '#FFFFFF', glow: '#FFB070' }
]
```

改为：

```javascript
popstarStars: [
  { bg: '#FF8BA0', bgEnd: '#E86080', text: '#FFFFFF', glow: '#FF8BA0', highlight: 'rgba(255, 255, 255, 0.25)' },
  { bg: '#7EB8E6', bgEnd: '#5090C8', text: '#FFFFFF', glow: '#7EB8E6', highlight: 'rgba(255, 255, 255, 0.25)' },
  { bg: '#88D8B0', bgEnd: '#50B888', text: '#FFFFFF', glow: '#88D8B0', highlight: 'rgba(255, 255, 255, 0.25)' },
  { bg: '#FFD466', bgEnd: '#E8B030', text: '#6B5D4F', glow: '#FFD466', highlight: 'rgba(255, 255, 255, 0.30)' },
  { bg: '#B8A0D8', bgEnd: '#9070B0', text: '#FFFFFF', glow: '#B8A0D8', highlight: 'rgba(255, 255, 255, 0.25)' },
  { bg: '#FFB070', bgEnd: '#E88040', text: '#FFFFFF', glow: '#FFB070', highlight: 'rgba(255, 255, 255, 0.25)' }
]
```

将 `themes.dark.popstarStars` 从：

```javascript
popstarStars: [
  { bg: '#E87090', text: '#FFFFFF', glow: '#E87090' },
  { bg: '#5090C8', text: '#FFFFFF', glow: '#5090C8' },
  { bg: '#50B888', text: '#FFFFFF', glow: '#50B888' },
  { bg: '#E8B840', text: '#0D1B2A', glow: '#E8B840' },
  { bg: '#9078B8', text: '#FFFFFF', glow: '#9078B8' },
  { bg: '#E89050', text: '#FFFFFF', glow: '#E89050' }
]
```

改为：

```javascript
popstarStars: [
  { bg: '#E87090', bgEnd: '#C05070', text: '#FFFFFF', glow: '#E87090', highlight: 'rgba(255, 255, 255, 0.15)' },
  { bg: '#5090C8', bgEnd: '#3070A8', text: '#FFFFFF', glow: '#5090C8', highlight: 'rgba(255, 255, 255, 0.15)' },
  { bg: '#50B888', bgEnd: '#308868', text: '#FFFFFF', glow: '#50B888', highlight: 'rgba(255, 255, 255, 0.15)' },
  { bg: '#E8B840', bgEnd: '#C89820', text: '#0D1B2A', glow: '#E8B840', highlight: 'rgba(255, 255, 255, 0.20)' },
  { bg: '#9078B8', bgEnd: '#705898', text: '#FFFFFF', glow: '#9078B8', highlight: 'rgba(255, 255, 255, 0.15)' },
  { bg: '#E89050', bgEnd: '#C87030', text: '#FFFFFF', glow: '#E89050', highlight: 'rgba(255, 255, 255, 0.15)' }
]
```

新增字段说明：
- `bgEnd`：渐变终止色（从 `bg` 到 `bgEnd` 的上→下渐变，模拟光照）
- `highlight`：内高光覆盖层颜色（半透明白色，绘制在星星上半部分）

- [ ] **Step 2: 重写 drawPopstarStars 方法，增加渐变 + 内高光 + 放大图标**

将 [game.js:1622-1665](file:///Users/sankan/Coding/SoloCoder/2048minigame/game.js#L1622) 的 `drawPopstarStars()` 方法重写为：

```javascript
drawPopstarStars() {
    const ctx = this.ctx;
    const cellSize = this.popstarCellSize;
    const gap = this.popstarCellGap;
    const radius = this.popstarCellRadius;

    for (let row = 0; row < this.popstarGridSize; row++) {
      for (let col = 0; col < this.popstarGridSize; col++) {
        const colorIndex = this.popstarBoard[row][col];
        if (colorIndex === null) continue;

        const pos = this.getPopstarStarPosition(row, col);
        const style = this.getPopstarStarStyle(colorIndex);
        
        let isHighlighted = false;
        for (const hPos of this.popstarHighlighted) {
          if (hPos.row === row && hPos.col === col) {
            isHighlighted = true;
            break;
          }
        }

        ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = this.isDark ? this.rpx(8) : this.rpx(6);
        ctx.shadowOffsetY = this.isDark ? this.rpx(2) : this.rpx(1);

        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.isDark ? this.rpx(20) : this.rpx(16);
        }

        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + cellSize);
        gradient.addColorStop(0, style.bg);
        gradient.addColorStop(1, style.bgEnd);
        ctx.fillStyle = gradient;
        this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = style.highlight;
        ctx.beginPath();
        const hlHeight = cellSize * 0.45;
        ctx.moveTo(pos.x + radius, pos.y);
        ctx.lineTo(pos.x + cellSize - radius, pos.y);
        ctx.quadraticCurveTo(pos.x + cellSize, pos.y, pos.x + cellSize, pos.y + radius);
        ctx.lineTo(pos.x + cellSize, pos.y + hlHeight);
        ctx.lineTo(pos.x, pos.y + hlHeight);
        ctx.lineTo(pos.x, pos.y + radius);
        ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = style.text;
        ctx.font = `bold ${Math.round(cellSize * 0.5)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', pos.x + cellSize / 2, pos.y + cellSize / 2 + cellSize * 0.03);
      }
    }
  }
```

关键改动说明：
1. **渐变填充**：`createLinearGradient` 从 `bg`（顶部亮）到 `bgEnd`（底部暗），模拟从上到下的光照
2. **内高光**：在星星上半 45% 区域绘制半透明白色覆盖层，顶部跟随圆角弧线，底部直线截断，模拟光泽反射
3. **图标放大**：字号从 `cellSize * 0.35` 增至 `cellSize * 0.5`（从 35% 到 50%）
4. **图标微调**：Y 轴偏移 `cellSize * 0.03`，视觉居中补偿
5. **圆角**：使用 `this.popstarCellRadius`（Task 2 定义的 5rpx）

- [ ] **Step 3: 验证星星视觉效果**

运行项目，确认：
1. 星星有从亮到暗的渐变，呈现立体感
2. 内高光自然，不过度刺眼
3. ★ 图标清晰可见，大小适中
4. 高亮选中效果（glow）仍正常工作
5. Light/Dark 主题下均表现良好

---

### Task 4: 优化空格背景，消除视觉噪点

**Files:**
- Modify: `game.js:1582-1607`（drawPopstarBoard 方法）

**目标：** 消灭星星不需要 2048 式的空格占位背景（空格即消除后的空白），移除空格背景绘制以减少视觉噪点，让棋盘背景更干净。

- [ ] **Step 1: 移除 drawPopstarBoard 中的空格背景绘制**

将 `drawPopstarBoard()` 方法中的空格背景循环删除。修改后：

```javascript
drawPopstarBoard() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(16) : this.rpx(10);
    ctx.shadowOffsetY = this.isDark ? this.rpx(4) : this.rpx(2);

    ctx.fillStyle = theme.boardBg;
    this.drawRoundedRect(this.boardX, this.boardY, this.boardSize, this.boardSize, this.boardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
```

移除的代码块：

```javascript
    const cellSize = this.popstarCellSize;
    const gap = this.popstarCellGap;
    for (let y = 0; y < this.popstarGridSize; y++) {
      for (let x = 0; x < this.popstarGridSize; x++) {
        const posX = this.boardX + gap + x * (cellSize + gap);
        const posY = this.boardY + gap + y * (cellSize + gap);
        ctx.fillStyle = theme.cellBg;
        this.drawRoundedRect(posX, posY, cellSize, cellSize, this.popstarCellRadius);
        ctx.fill();
      }
    }
```

**理由：** 2048 需要空格背景因为每个格子都有"空/有"两种状态，视觉上需要占位。消灭星星的空格是消除后的空白区域，用棋盘背景色自然填充即可，不需要额外的格子背景。移除后：
- 消除后的空白区域直接显示棋盘底色，更干净
- 减少每帧 100 次 `drawRoundedRect` 调用，性能微幅提升
- 星星与棋盘的对比度更强，视觉更聚焦

- [ ] **Step 2: 验证空格效果**

运行项目，确认：
1. 消除星星后空白区域显示棋盘底色，干净无噪点
2. 星星与空白区域对比清晰
3. 棋盘整体视觉更紧凑

---

### Task 5: 优化高亮预览效果

**Files:**
- Modify: `game.js:1622-1665`（drawPopstarStars 中 isHighlighted 分支）

**目标：** 增强高亮预览的视觉反馈，让玩家更清楚地看到即将消除的星星组。

- [ ] **Step 1: 在 drawPopstarStars 中增强高亮效果**

在 Task 3 重写的 `drawPopstarStars()` 方法中，`isHighlighted` 分支增加缩放 + 亮度提升效果。将高亮分支从：

```javascript
if (isHighlighted && style.glow) {
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = this.isDark ? this.rpx(20) : this.rpx(16);
}
```

改为：

```javascript
if (isHighlighted && style.glow) {
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = this.isDark ? this.rpx(24) : this.rpx(18);
}
```

并在渐变填充后、内高光绘制前，为高亮星星增加亮度覆盖层：

```javascript
if (isHighlighted) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
    ctx.fill();
}
```

完整的 `drawPopstarStars` 高亮处理逻辑应为：

```javascript
        ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = this.isDark ? this.rpx(8) : this.rpx(6);
        ctx.shadowOffsetY = this.isDark ? this.rpx(2) : this.rpx(1);

        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.isDark ? this.rpx(24) : this.rpx(18);
        }

        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + cellSize);
        gradient.addColorStop(0, style.bg);
        gradient.addColorStop(1, style.bgEnd);
        ctx.fillStyle = gradient;
        this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        if (isHighlighted) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
          ctx.fill();
        }

        ctx.fillStyle = style.highlight;
        ctx.beginPath();
        const hlHeight = cellSize * 0.45;
        ctx.moveTo(pos.x + radius, pos.y);
        ctx.lineTo(pos.x + cellSize - radius, pos.y);
        ctx.quadraticCurveTo(pos.x + cellSize, pos.y, pos.x + cellSize, pos.y + radius);
        ctx.lineTo(pos.x + cellSize, pos.y + hlHeight);
        ctx.lineTo(pos.x, pos.y + hlHeight);
        ctx.lineTo(pos.x, pos.y + radius);
        ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
        ctx.closePath();
        ctx.fill();
```

- [ ] **Step 2: 验证高亮效果**

运行项目，确认：
1. 点击可消除的星星组时，高亮组有明显的发光 + 亮度提升
2. 发光效果不会过于刺眼
3. 手指抬起后高亮正常消失

---

### Task 6: 全量回归验证

**Files:**
- 无文件修改，纯验证

**目标：** 确保所有优化不引入回归问题。

- [ ] **Step 1: 运行现有测试套件**

Run: `node --test tests/popstar-logic.test.js tests/game-logic.test.js tests/mode-config.test.js`
Expected: 全部 PASS

- [ ] **Step 2: 手动验证 2048 游戏不受影响**

确认 2048 的以下功能正常：
1. 棋盘布局（cellGap、cellSize 未变）
2. 方块渲染（圆角、颜色、字号）
3. 滑动手势
4. 分数显示

- [ ] **Step 3: 手动验证消灭星星完整游戏流程**

确认以下流程正常：
1. 新游戏开始 → 10×10 棋盘完整显示
2. 点击星星 → 高亮预览正常
3. 确认消除 → 星星消失、下落、列合并
4. 分数计算正确
5. 关卡结束 → 结算界面正常
6. Light/Dark 主题切换 → 颜色正确
7. 触摸坐标映射准确（点击位置与消除位置一致）

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat(popstar): optimize board density and star visual fullness

- Introduce popstarCellGap (0.012 vs 0.025) for tighter 10x10 grid
- Add popstarCellRadius (5rpx) for proportionate corner rounding
- Enhance star rendering with gradient fill, inner highlight, larger icon
- Remove empty cell backgrounds for cleaner board appearance
- Improve highlight preview with glow + brightness overlay"
```

---

## 优化效果对比总结

### 布局参数对比（boardSize = 640rpx）

| 参数 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| cellGap | 16rpx (2.5%) | 3.8rpx (0.6%) | ↓ 76% |
| cellSize | 46.4rpx | 59.3rpx | ↑ 28% |
| gap/cell 比例 | 34.5% | 6.5% | ↓ 81% |
| 间隔总占比 | 27.5% | 6.6% | ↓ 76% |
| 圆角半径 | 7.2rpx (15.5%) | 5rpx (8.4%) | ↓ 31% |
| ★ 字号占比 | 35% | 50% | ↑ 43% |
| 星星面积占比 | ~55% | ~84% | ↑ 53% |

### 视觉层次对比

| 层次 | 优化前 | 优化后 |
|------|--------|--------|
| 星星填充 | 纯色平面 | 上→下渐变（亮→暗） |
| 光泽效果 | 无 | 上半部 45% 半透明白色高光 |
| 立体感 | 仅靠阴影 | 渐变 + 高光 + 阴影三重叠加 |
| 高亮反馈 | 发光阴影 | 发光阴影 + 亮度覆盖层 |
| 空格背景 | 每格绘制 cellBg | 移除，直接显示棋盘底色 |
