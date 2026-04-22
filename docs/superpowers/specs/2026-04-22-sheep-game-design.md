# 羊了个羊（Sheep Game）游戏接入设计

**日期：** 2026-04-22

## 1. 目标

在现有 2048 + 消灭星星 + 水排序小游戏项目中接入第四个游戏——羊了个羊（Sheep Game），实现四游戏共存，用户可在主页选择不同游戏类型。

## 2. 不在本次范围内

- 不增加联网能力（无排行榜、无社交分享、无广告）
- 不引入新的外部依赖
- 不做整仓级重构
- 不增加复杂动画系统（使用 Canvas 2D 基础动画）
- 不做省份对抗、好友排行等社交功能
- 不做广告系统（道具获取改为免费 + 冷却时间）

## 3. 羊了个羊玩法规则

### 3.1 核心规则

| 规则项 | 详情 |
|--------|------|
| 牌面 | 多层卡牌堆叠，上层部分遮挡下层，仅未被遮挡的卡牌可点击 |
| 槽位 | 底部 7 格槽位，点击卡牌后卡牌进入槽位 |
| 消除 | 槽位中出现 3 张相同图案的卡牌时自动消除 |
| 胜利 | 所有卡牌消除完毕即通关 |
| 失败 | 槽位填满 7 格且无法消除时游戏失败 |
| 道具 | 每局可使用 3 种道具各 1 次（移出、撤回、洗牌） |

### 3.2 堆叠规则

- 卡牌按**层**堆叠，每层卡牌以网格方式排列
- 上层卡牌与下层卡牌有**半格偏移**（类似砖墙交错），形成遮挡关系
- 一张卡牌被遮挡的面积超过 50% 时不可点击
- 卡牌尺寸为网格单元的 1×1，上层卡牌偏移 0.5 格放置

```
层2（顶层）:  ·[A]·[B]·[C]·     ← 可见可点击
层1（中层）: [D]·[E]·[F]·[G]    ← 部分被层2遮挡
层0（底层）:  ·[H]·[I]·[J]·     ← 大部分被层1遮挡
```

### 3.3 消除规则细节

- 卡牌进入槽位时，**追加到末尾**
- 新卡牌进入后，系统扫描槽位中是否有 3 张相同图案
- 如果有，这 3 张卡牌**立即消除**（从槽位移除）
- 消除后槽位空出，后面的卡牌不移动位置（保持插入顺序）
- 如果新卡牌与槽位中已有 2 张相同图案，则凑成 3 张消除

### 3.4 道具系统

| 道具 | 效果 | 使用限制 |
|------|------|----------|
| **移出** | 将槽位中最后 3 张卡牌移到临时暂存区（暂存区最多 3 张） | 每局 1 次 |
| **撤回** | 将最后放入槽位的一张卡牌放回原位 | 每局 1 次 |
| **洗牌** | 将暂存区的卡牌放回槽位末尾，并重新排列槽位中卡牌的顺序 | 每局 1 次 |

> **暂存区说明**：使用"移出"道具后，最后 3 张卡牌移入暂存区。暂存区的卡牌在下次消除空出槽位后自动回到槽位末尾。如果暂存区已有 3 张卡牌，不能再使用"移出"。

### 3.5 关卡系统

采用**每日关卡**设计（与原版一致），每天更新一关：

| 关卡类型 | 说明 |
|----------|------|
| 每日关卡 | 每天固定一关，所有玩家面对相同布局 |
| 教学关卡 | 首次进入时强制完成的教学关（3种图案，2层，极简） |

**每日关卡难度参数**：

| 参数 | 范围 | 说明 |
|------|------|------|
| 图案种类 | 6 - 12 | 种类越多越难 |
| 堆叠层数 | 3 - 6 | 层数越多越难 |
| 卡牌总数 | 36 - 144 | 必须是 3 的倍数 |
| 遮挡密度 | 30% - 60% | 被遮挡卡牌占比 |

难度按星期循环：

| 星期 | 图案种类 | 层数 | 卡牌总数 | 难度 |
|------|----------|------|----------|------|
| 周一 | 6 | 3 | 54 | ★☆☆☆☆ |
| 周二 | 7 | 3 | 63 | ★★☆☆☆ |
| 周三 | 8 | 4 | 72 | ★★★☆☆ |
| 周四 | 9 | 4 | 90 | ★★★☆☆ |
| 周五 | 10 | 5 | 108 | ★★★★☆ |
| 周六 | 11 | 5 | 126 | ★★★★★ |
| 周日 | 12 | 6 | 144 | ★★★★★ |

### 3.6 关卡生成算法

采用**逆向生成法**确保每关必定有解：

```
1. 根据日期种子确定难度参数（图案种类 N、层数 L、卡牌总数 T）
2. T 必须是 3 的倍数，每种图案恰好出现 3 的倍数次
3. 逆向构造：
   a. 从空牌面开始
   b. 每次取 3 张同图案卡牌作为一组"消除逆操作"
   c. 将这 3 张卡牌放置到牌面的不同位置（当前最顶层）
   d. 确保放置后不会产生完全不可见的卡牌
   e. 重复直到所有卡牌放置完毕
4. 验证正向可解性（模拟求解验证）
5. 如果不可解，重新生成
```

**关键约束**：
- 每种图案的总数必须是 3 的倍数（保证可以全部消除）
- 每张卡牌至少有 30% 的面积可见（否则游戏体验极差）
- 逆向生成时，新放置的卡牌必须位于当前最顶层

## 4. 数据模型

### 4.1 核心数据结构

```javascript
const SLOT_CAPACITY = 7;
const TEMP_CAPACITY = 3;

const CARD_ICONS = [
  { id: 0, name: '草', icon: '🌾' },
  { id: 1, name: '花', icon: '🌸' },
  { id: 2, name: '树', icon: '🌲' },
  { id: 3, name: '云', icon: '☁️' },
  { id: 4, name: '山', icon: '⛰️' },
  { id: 5, name: '月', icon: '🌙' },
  { id: 6, name: '星', icon: '⭐' },
  { id: 7, name: '水', icon: '💧' },
  { id: 8, name: '火', icon: '🔥' },
  { id: 9, name: '风', icon: '🍃' },
  { id: 10, name: '雪', icon: '❄️' },
  { id: 11, name: '雷', icon: '⚡' }
];

// 单张卡牌
// {
//   id: number,           // 唯一标识
//   type: number,         // 图案类型索引（0-11）
//   layer: number,        // 所在层（0=底层）
//   gridRow: number,      // 网格行坐标
//   gridCol: number,      // 网格列坐标
//   x: number,            // 渲染 x 坐标
//   y: number,            // 渲染 y 坐标
//   isRevealed: boolean,  // 是否可见（未被遮挡）
//   isRemoved: boolean    // 是否已被消除
// }

// 游戏状态
{
  cards: Card[],                    // 所有卡牌
  slot: Card[],                     // 槽位中的卡牌（最多7张）
  tempSlot: Card[],                 // 暂存区卡牌（最多3张）
  level: number,                    // 当前关卡（日期hash）
  iconCount: number,                // 图案种类数
  layerCount: number,               // 堆叠层数
  totalCards: number,               // 卡牌总数
  isGameOver: boolean,              // 是否失败
  isLevelClear: boolean,            // 是否通关
 道具使用记录: {
    hasUsedRemoveOut: boolean,      // 是否已使用"移出"
    hasUsedUndo: boolean,           // 是否已使用"撤回"
    hasUsedShuffle: boolean         // 是否已使用"洗牌"
  },
  lastMove: { cardId, fromSlotIndex } | null,  // 最后一步操作（用于撤回）
  initialCards: Card[]              // 初始状态（用于重置）
}
```

### 4.2 遮挡关系计算

卡牌的遮挡关系由层和位置决定：

```javascript
// 判断卡牌 A 是否遮挡卡牌 B
function doesCardCover(cardA, cardB) {
  // 只有上层的卡牌才能遮挡下层
  if (cardA.layer <= cardB.layer) return false;

  // 卡牌尺寸为 1×1 网格单元
  // 上层卡牌偏移 0.5 格
  // 遮挡条件：两张卡牌的渲染区域有重叠
  const cardWidth = gridUnitSize;
  const cardHeight = gridUnitSize;

  const ax = cardA.x;
  const ay = cardA.y;
  const bx = cardB.x;
  const by = cardB.y;

  // 矩形重叠判断
  const overlapX = Math.max(0, Math.min(ax + cardWidth, bx + cardWidth) - Math.max(ax, bx));
  const overlapY = Math.max(0, Math.min(ay + cardHeight, by + cardHeight) - Math.max(ay, by));
  const overlapArea = overlapX * overlapY;
  const cardArea = cardWidth * cardHeight;

  // 遮挡面积超过 50% 时，卡牌 B 不可点击
  return overlapArea > cardArea * 0.5;
}

// 更新所有卡牌的可见性
function updateRevealedState(cards) {
  for (const card of cards) {
    if (card.isRemoved) continue;
    card.isRevealed = true;
    for (const other of cards) {
      if (other.isRemoved || other.id === card.id) continue;
      if (doesCardCover(other, card)) {
        card.isRevealed = false;
        break;
      }
    }
  }
}
```

### 4.3 存档结构

```javascript
{
  cards: [...],           // 卡牌状态（含 isRemoved, isRevealed）
  slot: [...],            // 槽位卡牌 ID 列表
  tempSlot: [...],        // 暂存区卡牌 ID 列表
  level: number,          // 关卡标识
  iconCount: number,      // 图案种类数
  layerCount: number,     // 堆叠层数
  totalCards: number,     // 卡牌总数
  isGameOver: boolean,
  isLevelClear: boolean,
 道具: {
    hasUsedRemoveOut: boolean,
    hasUsedUndo: boolean,
    hasUsedShuffle: boolean
  },
  lastMove: {...},
  initialCards: [...],
  dateSeed: string        // 日期种子（如 "2026-04-22"）
}
```

## 5. 核心算法设计

### 5.1 算法清单

| 算法 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `generateLevel(dateSeed)` | 日期种子 | `{ cards, iconCount, layerCount }` | 根据日期生成关卡 |
| `getDifficultyForDate(dateSeed)` | 日期种子 | `{ iconCount, layerCount, totalCards }` | 获取日期对应难度 |
| `updateRevealedState(cards)` | 卡牌数组 | 更新 isRevealed | 更新可见性 |
| `canClickCard(card, cards)` | 卡牌 + 全部卡牌 | `boolean` | 卡牌是否可点击 |
| `addCardToSlot(card, slot)` | 卡牌 + 槽位 | `{ newSlot, eliminated }` | 添加卡牌到槽位并检查消除 |
| `checkSlotElimination(slot)` | 槽位 | `{ newSlot, eliminated }` | 检查并执行三消 |
| `isLevelComplete(cards)` | 卡牌数组 | `boolean` | 是否通关 |
| `isGameOver(slot, tempSlot)` | 槽位 + 暂存区 | `boolean` | 是否失败 |
| `useRemoveOut(slot, tempSlot)` | 槽位 + 暂存区 | `{ newSlot, newTempSlot }` | 使用"移出"道具 |
| `useUndo(lastMove, slot, cards)` | 上一步 + 槽位 + 卡牌 | `{ newSlot, newCards }` | 使用"撤回"道具 |
| `useShuffle(slot)` | 槽位 | `newSlot` | 使用"洗牌"道具 |
| `returnTempToSlot(slot, tempSlot)` | 槽位 + 暂存区 | `{ newSlot, newTempSlot }` | 暂存区卡牌回到槽位 |
| `hashDate(dateString)` | 日期字符串 | `number` | 日期哈希（用于种子随机数） |

### 5.2 核心算法伪代码

#### generateLevel（关卡生成 - 逆向生成法）

```
function generateLevel(dateSeed):
    difficulty = getDifficultyForDate(dateSeed)
    { iconCount, layerCount, totalCards } = difficulty

    // 1. 确定每种图案的数量（必须是3的倍数）
    groupsPerIcon = totalCards / iconCount / 3  // 每种图案的消除组数
    cardTypes = []
    for i from 0 to iconCount - 1:
        for g from 0 to groupsPerIcon - 1:
            cardTypes.push(i, i, i)  // 每组3张同图案

    // 2. 使用日期种子初始化随机数生成器
    rng = seededRandom(hashDate(dateSeed))

    // 3. 逆向放置卡牌
    cards = []
    cardId = 0

    // 将卡牌按3张一组打乱顺序
    shuffle(cardTypes, rng)

    // 逐组放置（每组3张同图案，模拟消除的逆操作）
    groupIndex = 0
    for layer from layerCount - 1 down to 0:
        // 计算当前层可放置的卡牌数
        maxCardsInLayer = calculateLayerCapacity(layer, layerCount)

        for position in layerPositions:
            if groupIndex * 3 >= cardTypes.length: break

            cardType = cardTypes[groupIndex * 3]  // 同组3张
            for offset from 0 to 2:
                card = {
                    id: cardId++,
                    type: cardType,
                    layer: layer,
                    gridRow: position.row + (offset % 2) * 0.5,
                    gridCol: position.col + Math.floor(offset / 2) * 0.5,
                    isRevealed: true,
                    isRemoved: false
                }
                cards.push(card)

            groupIndex++

    // 4. 计算每张卡牌的渲染坐标
    for card of cards:
        { x, y } = calculateCardPosition(card, gridUnitSize)
        card.x = x
        card.y = y

    // 5. 更新可见性
    updateRevealedState(cards)

    // 6. 验证至少有1张可见卡牌
    if no card is revealed:
        return generateLevel(dateSeed + "_retry")

    return { cards, iconCount, layerCount, totalCards }
```

#### addCardToSlot（添加卡牌到槽位）

```
function addCardToSlot(card, slot):
    // 卡牌加入槽位末尾
    newSlot = [...slot, card]

    // 检查是否有3张同图案
    eliminated = checkSlotElimination(newSlot)

    return { newSlot: eliminated.newSlot, eliminatedCards: eliminated.eliminated }
```

#### checkSlotElimination（三消检查）

```
function checkSlotElimination(slot):
    // 统计每种图案的数量
    typeCount = {}
    for card of slot:
        typeCount[card.type] = (typeCount[card.type] || 0) + 1

    // 找到可以消除的图案（数量 >= 3）
    for type, count of typeCount:
        if count >= 3:
            // 移除前3张该图案的卡牌
            removed = 0
            newSlot = slot.filter(card => {
                if (card.type === type && removed < 3:
                    removed++
                    return false  // 移除
                }
                return true  // 保留
            })
            return { newSlot, eliminated: type }

    return { newSlot: slot, eliminated: null }
```

#### isGameOver（判断失败）

```
function isGameOver(slot, tempSlot):
    // 槽位满7格且暂存区满3格
    if slot.length >= SLOT_CAPACITY and tempSlot.length >= TEMP_CAPACITY:
        // 检查槽位中是否有可消除的组合
        typeCount = {}
        for card of slot:
            typeCount[card.type] = (typeCount[card.type] || 0) + 1
        for type, count of typeCount:
            if count >= 3: return false  // 还能消除，不算失败
        return true  // 无法消除，失败
    return false
```

#### useRemoveOut（移出道具）

```
function useRemoveOut(slot, tempSlot):
    if tempSlot.length >= TEMP_CAPACITY: return null  // 暂存区已满
    if slot.length < 3: return null  // 槽位不足3张

    // 将槽位最后3张移到暂存区
    newSlot = slot.slice(0, -3)
    newTempSlot = [...tempSlot, ...slot.slice(-3)]

    return { newSlot, newTempSlot }
```

#### useUndo（撤回道具）

```
function useUndo(lastMove, slot, cards):
    if lastMove is null: return null

    // 将最后加入的卡牌从槽位移回原位
    cardId = lastMove.cardId
    newSlot = slot.filter(c => c.id !== cardId)

    // 恢复卡牌到牌面
    for card of cards:
        if card.id === cardId:
            card.isRemoved = false
            break

    updateRevealedState(cards)

    return { newSlot, newCards: cards }
```

#### useShuffle（洗牌道具）

```
function useShuffle(slot):
    if slot.length === 0: return null

    // 重新排列槽位中卡牌的顺序，使相同图案的卡牌相邻
    // 策略：按图案类型排序，使三消更容易触发
    newSlot = [...slot].sort((a, b) => a.type - b.type)

    // 排序后检查是否触发消除
    result = checkSlotElimination(newSlot)

    return result.newSlot
```

### 5.3 种子随机数生成器

使用日期作为种子，确保同一天所有玩家面对相同关卡：

```javascript
function hashDate(dateString) {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
```

## 6. 音效系统设计

### 6.1 羊了个羊音效清单

| 音效 ID | 触发时机 | 描述 | 音色方向 |
|---------|----------|------|----------|
| `sheep_click` | 点击可见卡牌 | 点击反馈 | 清脆的"嗒"声 |
| `sheep_eliminate` | 三张卡牌消除 | 消除反馈 | 欢快的"咩"声 + 叮咚 |
| `sheep_slot_full` | 槽位满且无法消除 | 失败提示 | 低沉的"嗡"声 |
| `sheep_levelclear` | 通关 | 通关庆祝 | 欢快的上行旋律 |
| `sheep_undo` | 使用撤回道具 | 撤回反馈 | 轻柔的"嘶"声 |
| `sheep_removeout` | 使用移出道具 | 移出反馈 | "嗖"的滑出声 |
| `sheep_shuffle` | 使用洗牌道具 | 洗牌反馈 | 洗牌的"哗啦"声 |
| `sheep_blocked` | 点击被遮挡的卡牌 | 无效操作 | 短促的"嘟"声 |

### 6.2 音效文件目录

```
2048minigame/
├── audio/
│   ├── ... (现有音效)
│   ├── sheep_click.mp3
│   ├── sheep_eliminate.mp3
│   ├── sheep_slot_full.mp3
│   ├── sheep_levelclear.mp3
│   ├── sheep_undo.mp3
│   ├── sheep_removeout.mp3
│   ├── sheep_shuffle.mp3
│   └── sheep_blocked.mp3
```

## 7. UI 设计方案

### 7.1 设计理念

羊了个羊的视觉核心是**卡牌堆叠**，需要营造"层叠纸牌"的视觉感受。与 2048 的方块、消灭星星的星星、水排序的试管形成鲜明区分。

**关键词**：层叠、遮挡、可爱、魔性

### 7.2 游戏界面布局

```
┌─────────────────────────────────────┐
│  SHEEP GAME         4/22            │  ← 标题 + 日期
├─────────────────────────────────────┤
│                                     │
│        ┌──┐ ┌──┐ ┌──┐              │  ← 层3（顶层）
│      ┌──┐ ┌──┐ ┌──┐ ┌──┐          │  ← 层2
│    ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐      │  ← 层1
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │  ← 层0（底层）
│                                     │
│  ┌─────────────────────────────┐    │  ← 卡牌堆叠区域
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──┬──┬──┬──┬──┬──┬──┐           │  ← 槽位区域（7格）
│  │🌾│🌸│🌾│🌲│🌸│🌾│  │           │
│  └──┴──┴──┴──┴──┴──┴──┘           │
│  ┌──┬──┬──┐                        │  ← 暂存区（3格，有卡牌时显示）
│  │☁️│🌙│  │                        │
│  └──┴──┴──┘                        │
│                                     │
│  [移出] [撤回] [洗牌]  🏠 🔊 🌙   │  ← 道具 + 操作按钮
└─────────────────────────────────────┘
```

### 7.3 卡牌视觉设计

#### 卡牌结构

```
┌─────────┐  ← 圆角矩形
│         │
│   🌾    │  ← 图案居中
│         │
└─────────┘
```

#### 卡牌绘制参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 卡牌宽度 | rpx(80) | 根据屏幕宽度动态调整 |
| 卡牌高度 | rpx(90) | 略高于宽 |
| 卡牌圆角 | rpx(12) | 圆角矩形 |
| 图案字号 | rpx(36) | Emoji 图案 |
| 层间偏移 | rpx(20) | 上层相对下层偏移量（半格） |
| 遮挡阴影 | rgba(0,0,0,0.15) | 被遮挡卡牌的阴影 |

#### 卡牌状态

| 状态 | 视觉表现 |
|------|----------|
| 可见可点击 | 正常颜色 + 完整图案 |
| 被遮挡 | 灰色半透明 + 图案模糊 |
| 选中/悬停 | 轻微放大 + 亮边框 |
| 已消除 | 缩小消失动画 |
| 在槽位中 | 缩小到槽位尺寸 |

#### 层叠视觉效果

通过**阴影深度**区分层级：

| 层级 | 阴影偏移 | 阴影模糊 | 阴影颜色 |
|------|----------|----------|----------|
| 底层(0) | 1px, 1px | 2px | rgba(0,0,0,0.1) |
| 中层(1) | 2px, 2px | 4px | rgba(0,0,0,0.15) |
| 中层(2) | 3px, 3px | 6px | rgba(0,0,0,0.2) |
| 顶层(3+) | 4px, 4px | 8px | rgba(0,0,0,0.25) |

### 7.4 颜色方案

#### 马卡龙主题（Light）

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | `#FFF8F0` | 暖白 |
| 卡牌正面 | `#FFFFFF` | 纯白 |
| 卡牌背面（遮挡） | `#E8E0D8` | 灰米色 |
| 槽位背景 | `#F0E8E0` | 浅米色 |
| 槽位边框 | `#D8D0C8` | 米色边框 |
| 暂存区背景 | `#F5EDE5` | 浅暖灰 |
| 标题文字 | `#5D4E54` | 深棕灰 |
| 副标题文字 | `#8B7A80` | 中棕灰 |
| 按钮背景 | `#FF9E7A` | 珊瑚橙 |
| 按钮文字 | `#FFFFFF` | 白色 |
| 道具按钮（可用） | `#7EB8E6` | 天蓝 |
| 道具按钮（已用） | `#D8D0C8` | 灰色 |

#### 暗夜主题（Dark）

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | `#0D1B2A` | 深蓝黑 |
| 卡牌正面 | `#1B3A5C` | 深蓝 |
| 卡牌背面（遮挡） | `#0A1520` | 极深蓝 |
| 槽位背景 | `#152840` | 深蓝灰 |
| 槽位边框 | `#2A4A6A` | 蓝灰边框 |
| 暂存区背景 | `#122035` | 深蓝 |
| 标题文字 | `#E8F0F8` | 亮白蓝 |
| 副标题文字 | `#6A8AAA` | 中蓝灰 |
| 按钮背景 | `#E87050` | 深珊瑚 |
| 按钮文字 | `#FFFFFF` | 白色 |
| 道具按钮（可用） | `#5090C8` | 钴蓝 |
| 道具按钮（已用） | `#1B3A5C` | 深蓝灰 |

#### 图案配色

图案使用 Emoji 渲染，无需额外配色。但卡牌背景可以根据图案类型添加微妙的底色提示：

| 图案 | 底色提示（Light） | 底色提示（Dark） |
|------|-------------------|-------------------|
| 🌾 草 | `rgba(144,238,144,0.15)` | `rgba(80,180,80,0.15)` |
| 🌸 花 | `rgba(255,182,193,0.15)` | `rgba(220,100,130,0.15)` |
| 🌲 树 | `rgba(34,139,34,0.15)` | `rgba(30,120,30,0.15)` |
| ☁️ 云 | `rgba(200,220,240,0.15)` | `rgba(100,140,180,0.15)` |
| ⛰️ 山 | `rgba(160,140,120,0.15)` | `rgba(120,100,80,0.15)` |
| 🌙 月 | `rgba(255,255,180,0.15)` | `rgba(200,200,100,0.15)` |
| ⭐ 星 | `rgba(255,215,0,0.15)` | `rgba(220,180,0,0.15)` |
| 💧 水 | `rgba(100,180,255,0.15)` | `rgba(60,130,200,0.15)` |
| 🔥 火 | `rgba(255,100,50,0.15)` | `rgba(220,70,30,0.15)` |
| 🍃 风 | `rgba(144,238,144,0.15)` | `rgba(80,180,80,0.15)` |
| ❄️ 雪 | `rgba(200,230,255,0.15)` | `rgba(120,170,220,0.15)` |
| ⚡ 雷 | `rgba(255,255,100,0.15)` | `rgba(200,200,50,0.15)` |

### 7.5 槽位区域设计

槽位是游戏的核心交互区域，需要醒目且清晰：

```
┌────┬────┬────┬────┬────┬────┬────┐
│ 🌾 │ 🌸 │ 🌾 │ 🌲 │ 🌸 │ 🌾 │    │
└────┴────┴────┴────┴────┴────┴────┘
  ↑                              ↑
 第1格                          第7格（空）
```

- 每格宽度 = (游戏宽度 - 间距) / 7
- 卡牌在槽位中缩小显示（约为原尺寸的 80%）
- 槽位有明显的边框和背景色
- 即将消除的 3 张卡牌短暂高亮闪烁

### 7.6 暂存区设计

暂存区在槽位下方，仅在暂存区有卡牌时显示：

```
┌────┬────┬────┐
│ ☁️ │ 🌙 │    │
└────┴────┴────┘
```

- 样式与槽位一致但更小
- 暂存区为空时隐藏，节省空间

### 7.7 道具按钮设计

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  ↗ 移出   │  │  ↩ 撤回   │  │  🔀 洗牌  │
│   (1/1)  │  │   (1/1)  │  │   (1/1)  │
└──────────┘  └──────────┘  └──────────┘
```

- 可用时：主题色背景 + 白色文字
- 已用时：灰色背景 + 灰色文字 + 禁用样式
- 显示剩余使用次数

### 7.8 动画设计

| 动画类型 | 时长 | 缓动函数 | 描述 |
|---------|------|---------|------|
| 卡牌点击飞入槽位 | 250ms | ease-out | 卡牌从原位飞到槽位 |
| 三消消除 | 300ms | ease-in | 3张卡牌缩小 + 淡出 |
| 卡牌露出 | 150ms | ease-out | 被遮挡卡牌变为可见时轻微放大 |
| 槽位满失败 | 500ms | ease-in | 槽位抖动 + 变红 |
| 通关庆祝 | 800ms | ease-out | 所有卡牌飞散 + 文字弹出 |
| 道具使用 | 200ms | ease-out | 对应的视觉反馈 |

### 7.9 通关界面

```
┌─────────────────────────────────┐
│                                 │
│    🎉 LEVEL CLEAR 🎉           │
│                                 │
│    日期: 2026-04-22             │
│    难度: ★★★☆☆                 │
│                                 │
│    [BACK HOME]                  │
│                                 │
└─────────────────────────────────┘
```

### 7.10 失败界面

```
┌─────────────────────────────────┐
│                                 │
│    😵 GAME OVER                │
│                                 │
│    剩余卡牌: 42                 │
│    已消除: 30                   │
│                                 │
│    [RETRY]       [HOME]         │
│                                 │
└─────────────────────────────────┘
```

## 8. 交互设计

### 8.1 与现有游戏的交互差异

| 维度 | 2048 | 消灭星星 | 水排序 | 羊了个羊 |
|------|------|----------|--------|----------|
| 操作方式 | 滑动 | 点击 | 点击选中+点击倒入 | 点击 |
| 核心机制 | 数字合并 | 颜色消除 | 液体排序 | 堆叠消除 |
| 预览机制 | 无 | 高亮连通块 | 选中试管上移 | 被遮挡卡牌灰显 |
| 撤销 | 无 | 无 | 无限撤销 | 1次撤回道具 |
| 游戏节奏 | 每步生成新方块 | 不生成新内容 | 不生成新内容 | 不生成新内容 |
| 结束条件 | 棋盘满且无法合并 | 无可消除组 | 所有颜色归位 | 槽位满或全部消除 |
| 关卡系统 | 无限模式 | 关卡制 | 关卡制(200关) | 每日一关 |

### 8.2 触摸事件处理

羊了个羊场景下的触摸处理：

1. **点击卡牌** → 判断是否在卡牌区域内
2. **卡牌被遮挡** → 播放 blocked 音效，无其他操作
3. **卡牌可见** →
   - 卡牌飞入槽位动画
   - 检查三消
   - 更新遮挡关系
   - 检查通关/失败
4. **点击槽位** → 无操作（槽位仅展示）
5. **点击道具按钮** → 执行对应道具效果

### 8.3 卡牌点击区域

卡牌的点击区域仅限可见部分。由于上层卡牌遮挡下层，被遮挡的卡牌不可点击：

- 点击坐标映射到卡牌时，从**最高层**开始检测
- 如果点击位置在多张卡牌的区域内，只响应最上层的卡牌
- 被遮挡卡牌（isRevealed === false）不响应点击

## 9. 整体架构设计

### 9.1 场景状态机扩展

```
HOME (游戏选择主页)
  ├── 2048 MODE SELECT → GAME_2048
  ├── POPSTAR CONFIRM → GAME_POPSTAR
  ├── WATERSORT CONFIRM → GAME_WATERSORT
  └── SHEEP CONFIRM → GAME_SHEEP
```

### 9.2 场景枚举扩展

```javascript
const SCENE = {
  HOME: 'home',
  HOME_2048_MODE: 'home_2048_mode',
  GAME_2048: 'game_2048',
  GAME_POPSTAR: 'game_popstar',
  POPSTAR_CONFIRM: 'popstar_confirm',
  GAME_WATERSORT: 'game_watersort',
  WATERSORT_CONFIRM: 'watersort_confirm',
  GAME_SHEEP: 'game_sheep',          // 🆕
  SHEEP_CONFIRM: 'sheep_confirm'     // 🆕
};
```

### 9.3 新增文件结构

```
2048minigame/
├── game.js                  # 主入口（扩展场景调度）
├── game-logic.js            # 2048 逻辑（保持不变）
├── popstar-logic.js         # 消灭星星逻辑（保持不变）
├── watersort-logic.js       # 水排序逻辑（保持不变）
├── sheep-logic.js           # 🆕 羊了个羊核心逻辑
├── mode-config.js           # 扩展：增加羊了个羊游戏类型配置
├── storage.js               # 扩展：增加羊了个羊存档支持
├── sound-manager.js         # 扩展：增加羊了个羊音效
├── game.json                # 保持不变
└── tests/
    ├── game-logic.test.js   # 保持不变
    ├── mode-config.test.js  # 保持不变
    ├── popstar-logic.test.js # 保持不变
    ├── watersort-logic.test.js # 保持不变
    └── sheep-logic.test.js  # 🆕 羊了个羊逻辑测试
```

## 10. 代码改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `sheep-logic.js` | **新增** | 羊了个羊核心逻辑：关卡生成、遮挡计算、三消判定、道具系统 |
| `game.js` | **修改** | 新增 `SCENE.GAME_SHEEP` 和 `SCENE.SHEEP_CONFIRM`；新增羊了个羊场景的渲染、触摸处理、布局计算；主页增加羊了个羊卡片 |
| `mode-config.js` | **修改** | 增加羊了个羊游戏类型配置 |
| `storage.js` | **修改** | 增加羊了个羊的存档支持 |
| `sound-manager.js` | **修改** | 增加羊了个羊音效配置 |
| `game-logic.js` | **不变** | 2048 逻辑保持原样 |
| `popstar-logic.js` | **不变** | 消灭星星逻辑保持原样 |
| `watersort-logic.js` | **不变** | 水排序逻辑保持原样 |
| `audio/*.mp3` | **新增** | 8 个羊了个羊音效文件 |

### 10.1 mode-config.js 改动

```javascript
const gameTypes = [
  { id: '2048', label: '2048', subtitle: '4×4 | 5×5 | 6×6', icon: '★', ... },
  { id: 'popstar', label: '消灭星星', subtitle: 'POPSTAR', icon: '✦', ... },
  { id: 'watersort', label: '水排序', subtitle: 'WATER SORT', icon: '💧', ... },
  { id: 'sheep', label: '羊了个羊', subtitle: 'SHEEP GAME', icon: '🐑',  // 🆕
    bestScoreStorageKey: 'sheep-best',
    saveStateStorageKey: 'sheep-save' }
];
```

### 10.2 storage.js 改动

增加以下函数：

- `loadSheepBestDate()` — 加载最高通关日期
- `saveSheepBestDate(dateStr)` — 保存最高通关日期
- `loadSheepSaveState()` — 加载游戏存档
- `saveSheepSaveState(state)` — 保存游戏存档
- `clearSheepSaveState()` — 清除存档
- `hasSheepSaveState()` — 是否有存档

`loadAllGameTypesInfo` 增加羊了个羊信息：

```javascript
const sheepInfo = {
  id: 'sheep',
  label: '羊了个羊',
  subtitle: 'SHEEP GAME',
  icon: '🐑',
  bestScore: loadSheepBestDate(),
  hasSave: hasSheepSaveState()
};
```

### 10.3 sound-manager.js 改动

`SOUND_CONFIG` 增加羊了个羊音效：

```javascript
const SOUND_CONFIG = {
  ...existing,
  sheep_click: 'audio/sheep_click.mp3',
  sheep_eliminate: 'audio/sheep_eliminate.mp3',
  sheep_slot_full: 'audio/sheep_slot_full.mp3',
  sheep_levelclear: 'audio/sheep_levelclear.mp3',
  sheep_undo: 'audio/sheep_undo.mp3',
  sheep_removeout: 'audio/sheep_removeout.mp3',
  sheep_shuffle: 'audio/sheep_shuffle.mp3',
  sheep_blocked: 'audio/sheep_blocked.mp3'
};
```

## 11. sheep-logic.js 详细设计

### 11.1 模块导出

```javascript
module.exports = {
  SLOT_CAPACITY,
  TEMP_CAPACITY,
  CARD_ICONS,
  SeededRandom,
  hashDate,
  getDifficultyForDate,
  generateLevel,
  updateRevealedState,
  canClickCard,
  addCardToSlot,
  checkSlotElimination,
  isLevelComplete,
  isGameOver,
  useRemoveOut,
  useUndo,
  useShuffle,
  returnTempToSlot,
  cloneCards
};
```

### 11.2 常量

```javascript
const SLOT_CAPACITY = 7;
const TEMP_CAPACITY = 3;

const CARD_ICONS = [
  { id: 0, name: '草', icon: '🌾' },
  { id: 1, name: '花', icon: '🌸' },
  { id: 2, name: '树', icon: '🌲' },
  { id: 3, name: '云', icon: '☁️' },
  { id: 4, name: '山', icon: '⛰️' },
  { id: 5, name: '月', icon: '🌙' },
  { id: 6, name: '星', icon: '⭐' },
  { id: 7, name: '水', icon: '💧' },
  { id: 8, name: '火', icon: '🔥' },
  { id: 9, name: '风', icon: '🍃' },
  { id: 10, name: '雪', icon: '❄️' },
  { id: 11, name: '雷', icon: '⚡' }
];

const WEEKLY_DIFFICULTY = [
  { day: 1, iconCount: 6,  layerCount: 3, totalCards: 54  },  // 周一
  { day: 2, iconCount: 7,  layerCount: 3, totalCards: 63  },  // 周二
  { day: 3, iconCount: 8,  layerCount: 4, totalCards: 72  },  // 周三
  { day: 4, iconCount: 9,  layerCount: 4, totalCards: 90  },  // 周四
  { day: 5, iconCount: 10, layerCount: 5, totalCards: 108 },  // 周五
  { day: 6, iconCount: 11, layerCount: 5, totalCards: 126 },  // 周六
  { day: 0, iconCount: 12, layerCount: 6, totalCards: 144 }   // 周日
];
```

### 11.3 难度配置

```javascript
function getDifficultyForDate(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const config = WEEKLY_DIFFICULTY.find(d => d.day === dayOfWeek);
  return {
    iconCount: config.iconCount,
    layerCount: config.layerCount,
    totalCards: config.totalCards
  };
}
```

### 11.4 关卡生成核心

```javascript
function generateLevel(dateString) {
  const difficulty = getDifficultyForDate(dateString);
  const { iconCount, layerCount, totalCards } = difficulty;
  const rng = new SeededRandom(hashDate(dateString));

  // 确保每种图案数量是3的倍数
  const groupsPerIcon = totalCards / iconCount / 3;
  let cardTypes = [];
  for (let i = 0; i < iconCount; i++) {
    for (let g = 0; g < groupsPerIcon; g++) {
      cardTypes.push(i, i, i);
    }
  }

  // 打乱卡牌类型顺序
  cardTypes = rng.shuffle(cardTypes);

  // 生成层叠布局
  const cards = [];
  let cardId = 0;
  let typeIndex = 0;

  // 计算每层的网格参数
  const baseGridCols = Math.ceil(Math.sqrt(totalCards / layerCount)) + 1;
  const baseGridRows = Math.ceil(totalCards / layerCount / baseGridCols) + 1;

  for (let layer = 0; layer < layerCount; layer++) {
    // 每层卡牌数量递减（顶层少，底层多）
    const layerCards = Math.ceil(totalCards / layerCount);
    const offset = layer * 0.5; // 半格偏移

    for (let i = 0; i < layerCards && typeIndex < cardTypes.length; i++) {
      const row = Math.floor(i / baseGridCols) + offset;
      const col = (i % baseGridCols) + offset;

      cards.push({
        id: cardId++,
        type: cardTypes[typeIndex++],
        layer: layer,
        gridRow: row,
        gridCol: col,
        x: 0,
        y: 0,
        isRevealed: true,
        isRemoved: false
      });
    }
  }

  // 计算渲染坐标
  calculateCardPositions(cards);

  // 更新可见性
  updateRevealedState(cards);

  return { cards, iconCount, layerCount, totalCards };
}
```

## 12. 测试用例设计

### 12.1 sheep-logic.test.js 核心测试

| 测试项 | 验证内容 |
|--------|----------|
| `hashDate` | 相同日期返回相同哈希；不同日期返回不同哈希 |
| `SeededRandom` | 相同种子产生相同序列；不同种子产生不同序列 |
| `getDifficultyForDate` | 各星期返回正确难度参数 |
| `generateLevel` | 卡牌总数正确；每种图案数量是3的倍数；至少有1张可见卡牌 |
| `updateRevealedState` | 顶层卡牌可见；被遮挡卡牌不可见；移除遮挡后变为可见 |
| `canClickCard` | 可见卡牌可点击；被遮挡卡牌不可点击；已移除卡牌不可点击 |
| `addCardToSlot` | 卡牌正确加入槽位；3张同图案自动消除；不同图案不消除 |
| `checkSlotElimination` | 3张同图案消除；不足3张不消除；多组可消除时只消一组 |
| `isLevelComplete` | 所有卡牌移除时通关；有卡牌未移除时不通关 |
| `isGameOver` | 槽位满7格且无法消除时失败；有可消除组合时不失败 |
| `useRemoveOut` | 最后3张移到暂存区；暂存区满时不可使用 |
| `useUndo` | 最后一张卡牌放回原位；无操作时不可使用 |
| `useShuffle` | 槽位卡牌重新排序；空槽位不可使用 |
| `关卡生成稳定性` | 连续生成7天关卡不崩溃；每个关卡卡牌总数正确 |

## 13. 开发里程碑

| 阶段 | 任务 | 交付物 |
|------|------|--------|
| Phase 1 | 核心逻辑实现 | `sheep-logic.js` + 单元测试 |
| Phase 2 | 配置与存储扩展 | `mode-config.js` + `storage.js` + `sound-manager.js` 改动 |
| Phase 3 | UI 渲染实现 | 卡牌绘制、层叠效果、槽位区域、道具按钮 |
| Phase 4 | 交互与动画 | 触摸处理、卡牌飞入动画、三消动画、遮挡更新 |
| Phase 5 | 道具系统 | 移出、撤回、洗牌道具实现 |
| Phase 6 | 集成与测试 | 主页卡片、场景切换、全链路测试 |
| Phase 7 | 音效与打磨 | 音效接入、动画调优、边界情况处理 |

## 14. 主页卡片设计

羊了个羊在主页的卡片信息：

```
┌─────────────────────────────────┐
│  🐑  羊了个羊                   │
│      SHEEP GAME                 │
│      BEST: 4/22                 │
│                    [继续]        │  ← 有存档时显示
└─────────────────────────────────┘
```

- `BEST` 显示最高通关日期（如 4/22 表示 4月22日的每日关卡已通关）
- 有存档时显示"继续"徽章
- 点击后若有存档，弹出确认对话框

## 15. 与原版羊了个羊的差异

| 维度 | 原版 | 本项目 |
|------|------|--------|
| 社交功能 | 省份对抗、好友排行 | 无（纯单机） |
| 广告系统 | 看广告获取道具/复活 | 无广告，道具免费（每局各1次） |
| 复活机制 | 看广告复活 | 无复活（失败即重试） |
| 关卡设计 | 每日1关 + 极难第二关 | 每日1关，按星期难度递增 |
| 难度设计 | 第二关极难（0.1%通关率） | 渐进难度，保证可解 |
| 分享机制 | 分享获取道具 | 无分享 |
| 皮肤系统 | 角色皮肤 | 无 |

---

*文档版本：v1.0*
*创建日期：2026-04-22*
