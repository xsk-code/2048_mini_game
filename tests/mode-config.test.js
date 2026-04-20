const test = require('node:test');
const assert = require('node:assert/strict');

const { 
  modes, 
  getModeById, 
  getModeByGridSize, 
  getDefaultMode, 
  getAllModes 
} = require('../mode-config');

const { createEmptyBoard, canBoardMove, getBoardProgress } = require('../game-logic');

test('mode config should have exactly 3 modes', () => {
  assert.equal(modes.length, 3);
});

test('modes should have correct ids', () => {
  assert.equal(modes[0].id, '4x4');
  assert.equal(modes[1].id, '5x5');
  assert.equal(modes[2].id, '6x6');
});

test('modes should have correct grid sizes', () => {
  assert.equal(modes[0].gridSize, 4);
  assert.equal(modes[1].gridSize, 5);
  assert.equal(modes[2].gridSize, 6);
});

test('modes should have correct target tiles', () => {
  assert.equal(modes[0].targetTile, 2048);
  assert.equal(modes[1].targetTile, 4096);
  assert.equal(modes[2].targetTile, 8192);
});

test('modes should have unique bestScoreStorageKey', () => {
  const keys = modes.map(m => m.bestScoreStorageKey);
  const uniqueKeys = new Set(keys);
  assert.equal(uniqueKeys.size, keys.length);
});

test('modes should have unique saveStateStorageKey', () => {
  const keys = modes.map(m => m.saveStateStorageKey);
  const uniqueKeys = new Set(keys);
  assert.equal(uniqueKeys.size, keys.length);
});

test('getModeById should return correct mode', () => {
  const mode4x4 = getModeById('4x4');
  assert.equal(mode4x4.gridSize, 4);
  assert.equal(mode4x4.targetTile, 2048);
  
  const mode5x5 = getModeById('5x5');
  assert.equal(mode5x5.gridSize, 5);
  assert.equal(mode5x5.targetTile, 4096);
  
  const mode6x6 = getModeById('6x6');
  assert.equal(mode6x6.gridSize, 6);
  assert.equal(mode6x6.targetTile, 8192);
});

test('getModeById with invalid id should return default mode', () => {
  const mode = getModeById('invalid');
  assert.equal(mode.id, '4x4');
});

test('getModeByGridSize should return correct mode', () => {
  const mode4 = getModeByGridSize(4);
  assert.equal(mode4.id, '4x4');
  
  const mode5 = getModeByGridSize(5);
  assert.equal(mode5.id, '5x5');
  
  const mode6 = getModeByGridSize(6);
  assert.equal(mode6.id, '6x6');
});

test('getDefaultMode should return 4x4 mode', () => {
  const defaultMode = getDefaultMode();
  assert.equal(defaultMode.id, '4x4');
  assert.equal(defaultMode.gridSize, 4);
});

test('getAllModes should return copy of modes', () => {
  const allModes = getAllModes();
  assert.equal(allModes.length, 3);
  assert.notEqual(allModes, modes);
});

test('createEmptyBoard should create correct size board', () => {
  const board4 = createEmptyBoard(4);
  assert.equal(board4.length, 4);
  assert.equal(board4[0].length, 4);
  
  const board5 = createEmptyBoard(5);
  assert.equal(board5.length, 5);
  assert.equal(board5[0].length, 5);
  
  const board6 = createEmptyBoard(6);
  assert.equal(board6.length, 6);
  assert.equal(board6[0].length, 6);
});

test('createEmptyBoard should be filled with null', () => {
  const board = createEmptyBoard(4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      assert.equal(board[y][x], null);
    }
  }
});

test('canBoardMove should work with different grid sizes', () => {
  const fullBoardNoMoves = [
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }]
  ];
  assert.equal(canBoardMove(fullBoardNoMoves), false);
  
  const boardWithEmptyCell = [
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 2 }, { value: 4 }, null, { value: 4 }, { value: 2 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }]
  ];
  assert.equal(canBoardMove(boardWithEmptyCell), true);
  
  const boardWithMergeable = [
    [{ value: 2 }, { value: 2 }, { value: 2 }, { value: 4 }, { value: 2 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }],
    [{ value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }],
    [{ value: 2 }, { value: 4 }, { value: 2 }, { value: 4 }, { value: 2 }]
  ];
  assert.equal(canBoardMove(boardWithMergeable), true);
});

test('getBoardProgress should use correct target tile', () => {
  const boardWith2048 = [
    [{ value: 2 }, { value: 4 }, { value: 8 }, { value: 16 }],
    [{ value: 32 }, { value: 64 }, { value: 128 }, { value: 256 }],
    [{ value: 512 }, { value: 1024 }, { value: 2048 }, null],
    [{ value: 2 }, { value: 4 }, { value: 8 }, { value: 16 }]
  ];
  
  let progress = getBoardProgress(boardWith2048, 2048);
  assert.equal(progress.hasTargetTile, true);
  assert.equal(progress.isGameOver, false);
  
  progress = getBoardProgress(boardWith2048, 4096);
  assert.equal(progress.hasTargetTile, false);
  assert.equal(progress.isGameOver, false);
});

test('storage keys should be properly isolated between modes', () => {
  const keyPrefixes = modes.map(m => ({
    best: m.bestScoreStorageKey,
    save: m.saveStateStorageKey
  }));
  
  assert.equal(keyPrefixes[0].best, '2048-best-4x4');
  assert.equal(keyPrefixes[1].best, '2048-best-5x5');
  assert.equal(keyPrefixes[2].best, '2048-best-6x6');
  
  assert.equal(keyPrefixes[0].save, '2048-save-4x4');
  assert.equal(keyPrefixes[1].save, '2048-save-5x5');
  assert.equal(keyPrefixes[2].save, '2048-save-6x6');
  
  const allKeys = [
    keyPrefixes[0].best, keyPrefixes[0].save,
    keyPrefixes[1].best, keyPrefixes[1].save,
    keyPrefixes[2].best, keyPrefixes[2].save
  ];
  const uniqueKeys = new Set(allKeys);
  assert.equal(uniqueKeys.size, allKeys.length);
});
