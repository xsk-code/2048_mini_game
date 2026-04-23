# Mini Games - 微信小游戏合集

一款包含三款经典益智游戏的微信小游戏合集：**2048**、**消灭星星**、**水排序**。

## 项目概述

本项目是一个微信小游戏合集，采用原生微信小游戏 API 开发，支持 Canvas 2D 渲染。

### 游戏特性

| 游戏 | 描述 |
|-----|------|
| **2048** | 经典数字拼图游戏，滑动合并相同数字方块，目标达到 2048 |
| **消灭星星** | 点击消除相连同色星星，支持关卡系统和分数计算 |
| **水排序** | 将试管中不同颜色的液体按颜色分类，支持撤销和重置功能 |

### 设计特色

- 🌓 **双主题系统**：支持马卡龙（亮色）和暗夜（暗色）主题自由切换
- 💾 **进度保存**：所有游戏进度自动保存到本地存储
- 🎨 **流畅动画**：方块移动、星星消除、液体倾倒都有精心设计的动画效果
- 🔊 **音效系统**：支持点击、合并、消除等多种音效

## 项目结构

```
2048minigame/
├── common/                    # 共用代码目录
│   ├── index.js              # 入口文件，导出 BaseGame 类
│   ├── constants.js          # 常量定义（场景、游戏类型）
│   └── themes.js             # 主题配置（马卡龙/暗夜双主题）
├── games/                     # 各游戏独立代码目录
│   ├── game-2048.js          # 2048 游戏逻辑
│   ├── game-popstar.js       # 消灭星星游戏逻辑
│   └── game-watersort.js     # 水排序游戏逻辑
├── game-logic.js             # 2048 核心算法
├── popstar-logic.js          # 消灭星星核心算法
├── watersort-logic.js        # 水排序核心算法
├── mode-config.js            # 游戏模式配置
├── storage.js                # 本地存储管理
├── sound-manager.js          # 音效管理器
├── game.js                   # 主入口文件
├── game.json                 # 游戏配置
├── project.config.json       # 项目配置
├── tests/                    # 测试文件目录
│   ├── game-logic.test.js
│   ├── mode-config.test.js
│   ├── popstar-logic.test.js
│   └── watersort-logic.test.js
└── audio/                    # 音效资源目录
```

## 架构说明

### 模块化设计

本项目采用模块化架构，将共用代码和各游戏独立代码分离：

#### 1. 共用层 (common/)

- **BaseGame** (`common/index.js`)：所有游戏的基类，包含：
  - Canvas 初始化与系统信息获取
  - 主题加载/保存与切换
  - 分享菜单设置
  - rpx 响应式单位计算
  - 尺寸计算 (`calculateDimensions`)
  - 触摸事件框架
  - 基础绘制方法 (`drawRoundedRect`, `drawBackground` 等)
  - 主菜单和模式选择渲染

- **Constants** (`common/constants.js`)：
  - `SCENE`：场景常量（主菜单、游戏中、确认对话框等）
  - `GAME_TYPES`：游戏类型常量

- **Themes** (`common/themes.js`)：
  - `themes`：包含 light/dark 两套完整主题配置
  - `getTheme(isDark)`：获取当前主题的辅助函数

#### 2. 游戏层 (games/)

每个游戏都有独立的类，通过构造函数接收 `BaseGame` 实例：

- **Game2048** (`games/game-2048.js`)：
  - 棋盘初始化与随机方块生成
  - 四方向移动逻辑
  - 动画系统
  - 分数与最高分管理
  - 游戏状态渲染

- **GamePopstar** (`games/game-popstar.js`)：
  - 关卡系统
  - 星星消除逻辑（连通区域检测）
  - 重力与列塌陷处理
  - 星星路径绘制
  - 确认对话框（继续游戏/新游戏）

- **GameWatersort** (`games/game-watersort.js`)：
  - 关卡生成
  - 倒水逻辑
  - 撤销/重置功能
  - 试管和液体渲染
  - 确认对话框

#### 3. 核心算法层

- `game-logic.js`：2048 核心移动、合并、胜利判定算法
- `popstar-logic.js`：消灭星星连通区域检测、消除、计分算法
- `watersort-logic.js`：水排序关卡生成、倒水判定、胜利检测算法

#### 4. 主入口 (`game.js`)

```javascript
class MiniGames extends BaseGame {
  constructor() {
    super();
    this.game2048 = new Game2048(this);
    this.gamePopstar = new GamePopstar(this);
    this.gameWatersort = new GameWatersort(this);
    // ...
  }
}
```

主入口类 `MiniGames` 继承 `BaseGame`，并组合三个独立游戏实例，通过场景切换机制协调各游戏的渲染和交互。

## 开发说明

### 环境要求

- 微信开发者工具
- Node.js（用于运行测试）

### 运行项目

1. 使用微信开发者工具打开项目目录
2. 在模拟器或真机中预览

### 运行测试

```bash
node --test
```

### 新增游戏模式

如需新增 2048 游戏模式，编辑 `mode-config.js`：

```javascript
{
  id: 'mode-5x5',
  label: '5×5',
  subtitle: '更大棋盘',
  gridSize: 5,
  targetTile: 4096,
  gameType: '2048'
}
```

## 技术栈

- **框架**：微信小游戏原生 API
- **语言**：JavaScript (CommonJS)
- **渲染**：Canvas 2D
- **存储**：微信本地存储 API (`wx.setStorageSync`/`wx.getStorageSync`)

## 重构说明

### 重构前

- 所有三款游戏的代码全部集中在 `game.js` 一个文件中（约 3000 行）
- 共用代码（主题、常量、基础渲染）重复出现
- 难以维护和扩展

### 重构后

- **模块化架构**：共用代码提取到 `common/` 目录，各游戏独立到 `games/` 目录
- **职责分离**：
  - `BaseGame`：负责所有游戏共用的基础功能
  - 各游戏类：只负责自身游戏特有逻辑
  - 核心算法层：纯函数，便于测试和复用
- **易于扩展**：新增游戏只需创建新的游戏类，无需修改现有代码
- **代码量**：主入口 `game.js` 从 ~3000 行减少到 ~120 行

## 许可证

MIT License
