const test = require('node:test');
const assert = require('node:assert/strict');

const { getBoardProgress } = require('../game-logic');

test('reaching 2048 does not end the game when moves are still available', () => {
  const board = [
    [{ value: 2 }, { value: 4 }, { value: 8 }, { value: 16 }],
    [{ value: 32 }, { value: 64 }, { value: 128 }, { value: 256 }],
    [{ value: 512 }, { value: 1024 }, { value: 2048 }, null],
    [{ value: 2 }, { value: 4 }, { value: 8 }, { value: 16 }]
  ];

  assert.deepEqual(getBoardProgress(board), {
    hasTargetTile: true,
    isGameOver: false
  });
});

test('game ends only when the board is full and no merges are available', () => {
  const board = [
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }],
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }]
  ];

  assert.deepEqual(getBoardProgress(board), {
    hasTargetTile: false,
    isGameOver: true
  });
});
