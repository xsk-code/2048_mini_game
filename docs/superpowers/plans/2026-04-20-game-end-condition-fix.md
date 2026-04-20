# Game End Condition Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 2048 小游戏只在无路可走时结束，而不是在合成出 `2048` 时打断玩家。

**Architecture:** 抽出一个纯逻辑模块负责判断棋盘是否还能移动，再让 `game.js` 只消费这个结果。渲染层与交互层统一只处理 `isGameOver`，不再走胜利弹层分支。

**Tech Stack:** 微信小游戏 JavaScript、Node.js 内置测试器

---

### Task 1: Write the failing rule test

**Files:**
- Create: `tests/game-logic.test.js`

- [x] **Step 1: Write the failing test**

```js
const { getBoardProgress } = require('../game-logic');
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/game-logic.test.js`
Expected: FAIL with `Cannot find module '../game-logic'`

### Task 2: Implement board status helpers

**Files:**
- Create: `game-logic.js`
- Modify: `game.js`

- [ ] **Step 1: Add the pure helper module**

```js
function canBoardMove(board) {
  // Return true when an empty cell or merge is available.
}

function getBoardProgress(board) {
  return {
    hasTargetTile: false,
    isGameOver: false
  };
}
```

- [ ] **Step 2: Update runtime logic to use only `isGameOver`**

```js
if (!canBoardMove(this.board)) {
  this.isGameOver = true;
}
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `node --test tests/game-logic.test.js`
Expected: PASS

- [ ] **Step 4: Run syntax check**

Run: `node --check game.js`
Expected: no output, exit code 0
