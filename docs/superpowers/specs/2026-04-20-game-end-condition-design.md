# 2048 End Condition Design

**Date:** 2026-04-20

## Goal

修正当前小游戏的结束条件，使其符合用户选定的规则：

- 合成出 `2048` 时不弹胜利遮罩
- 游戏继续无缝进行
- 只有在棋盘已满且不存在任何可合并相邻格时才结束

## Current Root Cause

当前 `game.js` 在每次有效移动后会扫描棋盘：

- 一旦发现 `2048`，就把 `hasWon` 设为 `true`
- 渲染层会把 `hasWon` 当成覆盖层触发条件
- 交互层也会因为 `hasWon` 进入特殊分支

这会让玩家在达到 `2048` 时被打断，体验上等同于“提前结束”。

## Chosen Approach

采用用户选定的极简方案：

- 删除 `2048` 达成后的胜利弹层流程
- 保留提示文案 `Join the numbers and get to the 2048!`
- 结束条件只保留 `isGameOver`
- `isGameOver` 仅由棋盘是否还能移动决定

## Files

- 修改 `game.js`
  - 移除 `hasWon / keepPlaying` 对交互与渲染的影响
  - 改为只根据棋盘可移动性更新 `isGameOver`
- 新增 `game-logic.js`
  - 放置纯函数，便于测试结束条件
- 新增 `tests/game-logic.test.js`
  - 覆盖“到 2048 不结束”和“无路可走才结束”

## Testing

- `node --test tests/game-logic.test.js`
- `node --check game.js`
