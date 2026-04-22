const test = require('node:test');
const assert = require('node:assert/strict');

const { 
  POPSTAR_GRID_SIZE,
  STAR_COLORS,
  getColorCount,
  createBoard,
  cloneBoard,
  findConnected,
  canEliminate,
  eliminate,
  applyGravity,
  collapseColumns,
  hasValidMoves,
  calculateScore,
  calculateBonus,
  getTargetScore,
  countRemainingStars,
  processElimination
} = require('../popstar-logic');

test('POPSTAR_GRID_SIZE should be 10', () => {
  assert.equal(POPSTAR_GRID_SIZE, 10);
});

test('STAR_COLORS should have 6 colors', () => {
  assert.equal(STAR_COLORS.length, 6);
});

test('getColorCount should return 5 for level 1-25', () => {
  assert.equal(getColorCount(1), 5);
  assert.equal(getColorCount(10), 5);
  assert.equal(getColorCount(25), 5);
});

test('getColorCount should return 6 for level 26+', () => {
  assert.equal(getColorCount(26), 6);
  assert.equal(getColorCount(50), 6);
  assert.equal(getColorCount(100), 6);
});

test('createBoard should create 10x10 board', () => {
  const board = createBoard();
  assert.equal(board.length, 10);
  assert.equal(board[0].length, 10);
});

test('createBoard with 5 colors should be filled with color indices 0-4', () => {
  const board = createBoard(5);
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = board[row][col];
      assert.ok(cell >= 0 && cell <= 4, `Cell (${row},${col}) should be 0-4, got ${cell}`);
    }
  }
});

test('createBoard with 6 colors should be filled with color indices 0-5', () => {
  const board = createBoard(6);
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = board[row][col];
      assert.ok(cell >= 0 && cell <= 5, `Cell (${row},${col}) should be 0-5, got ${cell}`);
    }
  }
});

test('cloneBoard should create deep copy', () => {
  const board = createBoard();
  const cloned = cloneBoard(board);
  
  assert.notEqual(board, cloned);
  
  board[0][0] = 999;
  assert.notEqual(cloned[0][0], 999);
});

test('findConnected should find connected same color stars', () => {
  const board = [
    [0, 0, 1, 1, 1, null, null, null, null, null],
    [0, 1, 1, 1, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  const connected = findConnected(board, 0, 2);
  
  assert.equal(connected.size, 5);
  
  const expectedPositions = [
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 0, col: 4 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 3 }
  ];
  
  for (const pos of connected) {
    const isExpected = expectedPositions.some(
      p => p.row === pos.row && p.col === pos.col
    );
    assert.ok(isExpected, `Found unexpected position: (${pos.row},${pos.col})`);
  }
});

test('findConnected should return empty set for null cell', () => {
  const board = createBoard();
  board[0][0] = null;
  
  const connected = findConnected(board, 0, 0);
  assert.equal(connected.size, 0);
});

test('findConnected should return single cell if no neighbors', () => {
  const board = [
    [0, 1, null, null, null, null, null, null, null, null],
    [1, 0, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  const connected = findConnected(board, 0, 0);
  assert.equal(connected.size, 1);
});

test('canEliminate should return true for 2+ connected stars', () => {
  const board = [
    [0, 0, 1, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  assert.equal(canEliminate(board, 0, 0), true);
});

test('canEliminate should return false for single star', () => {
  const board = [
    [0, 1, null, null, null, null, null, null, null, null],
    [1, 0, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  assert.equal(canEliminate(board, 0, 0), false);
});

test('eliminate should set specified positions to null', () => {
  const board = [
    [0, 0, 1, null, null, null, null, null, null, null],
    [0, 1, 1, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  const positions = new Set([
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 }
  ]);
  
  const newBoard = eliminate(board, positions);
  
  assert.equal(newBoard[0][0], null);
  assert.equal(newBoard[0][1], null);
  assert.equal(newBoard[1][0], null);
  
  assert.equal(newBoard[0][2], 1);
  assert.equal(newBoard[1][1], 1);
  assert.equal(newBoard[1][2], 1);
});

test('applyGravity should make stars fall down', () => {
  const board = [
    [null, 0, null, null, null, null, null, null, null, null],
    [0, null, 1, null, null, null, null, null, null, null],
    [null, 0, null, null, null, null, null, null, null, null],
    [null, null, 1, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  const result = applyGravity(board);
  
  assert.equal(result[7][0], 0);
  assert.equal(result[8][0], null);
  
  assert.equal(result[7][1], 0);
  assert.equal(result[8][1], 0);
  
  assert.equal(result[7][2], 1);
  assert.equal(result[8][2], 1);
});

test('collapseColumns should move empty columns to right', () => {
  const board = [
    [null, 0, null, 1, null, null, null, null, null, null],
    [null, 0, null, 1, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  const result = collapseColumns(board);
  
  assert.equal(result[0][0], 0);
  assert.equal(result[1][0], 0);
  
  assert.equal(result[0][1], 1);
  assert.equal(result[1][1], 1);
  
  assert.equal(result[0][2], null);
  assert.equal(result[0][3], null);
});

test('hasValidMoves should return true when there are eliminable groups', () => {
  const board = [
    [0, 0, 1, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  assert.equal(hasValidMoves(board), true);
});

test('hasValidMoves should return false when no eliminable groups', () => {
  const board = [
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
  ];
  
  assert.equal(hasValidMoves(board), false);
});

test('calculateScore should return count squared times 5', () => {
  assert.equal(calculateScore(2), 20);
  assert.equal(calculateScore(5), 125);
  assert.equal(calculateScore(10), 500);
  assert.equal(calculateScore(20), 2000);
});

test('calculateBonus should return correct bonus for remaining < 10', () => {
  assert.equal(calculateBonus(0), 2000);
  assert.equal(calculateBonus(5), 1975);
  assert.equal(calculateBonus(9), 1955);
});

test('calculateBonus should return 0 for remaining >= 10', () => {
  assert.equal(calculateBonus(10), 0);
  assert.equal(calculateBonus(20), 0);
});

test('getTargetScore should return correct target for level 1-10', () => {
  assert.equal(getTargetScore(1), 1000);
  assert.equal(getTargetScore(5), 2200);
  assert.equal(getTargetScore(10), 3700);
});

test('getTargetScore should return correct target for level 11-20', () => {
  assert.equal(getTargetScore(11), 4200);
  assert.equal(getTargetScore(15), 6200);
  assert.equal(getTargetScore(20), 8700);
});

test('getTargetScore should return correct target for level 21-50', () => {
  assert.equal(getTargetScore(21), 9500);
  assert.equal(getTargetScore(30), 16700);
  assert.equal(getTargetScore(50), 32700);
});

test('getTargetScore should return correct target for level 51+', () => {
  assert.equal(getTargetScore(51), 33900);
  assert.equal(getTargetScore(100), 92700);
});

test('countRemainingStars should count non-null cells', () => {
  const board = [
    [0, 0, null, null, null, null, null, null, null, null],
    [0, null, 1, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  assert.equal(countRemainingStars(board), 4);
});

test('processElimination should eliminate, apply gravity, and collapse columns', () => {
  const board = [
    [0, 0, 1, 1, null, null, null, null, null, null],
    [0, 1, 1, null, null, null, null, null, null, null],
    [2, 2, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];
  
  const positions = new Set([
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 }
  ]);
  
  const result = processElimination(board, positions);
  
  assert.equal(result[7][0], 2);
  assert.equal(result[8][0], 2);
  assert.equal(result[9][0], null);
});
