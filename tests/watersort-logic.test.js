const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TUBE_CAPACITY,
  MAX_LEVEL,
  EMPTY_TUBES,
  LEVEL_CONFIG,
  WATER_COLORS,
  WATER_COLORS_DARK,
  getColorCountForLevel,
  getTubeCountForLevel,
  getTopColor,
  getTopConsecutiveCount,
  getEmptySlotCount,
  canPour,
  pour,
  isTubeComplete,
  isLevelComplete,
  cloneTubes,
  undoMove,
  resetLevel,
  generateLevel
} = require('../watersort-logic');

test('TUBE_CAPACITY should be 4', () => {
  assert.equal(TUBE_CAPACITY, 4);
});

test('MAX_LEVEL should be 200', () => {
  assert.equal(MAX_LEVEL, 200);
});

test('EMPTY_TUBES should be 2', () => {
  assert.equal(EMPTY_TUBES, 2);
});

test('WATER_COLORS should have 10 colors', () => {
  assert.equal(WATER_COLORS.length, 10);
});

test('WATER_COLORS_DARK should have 10 colors', () => {
  assert.equal(WATER_COLORS_DARK.length, 10);
});

test('getColorCountForLevel should return correct color count for each level range', () => {
  assert.equal(getColorCountForLevel(1), 3);
  assert.equal(getColorCountForLevel(5), 3);
  assert.equal(getColorCountForLevel(6), 4);
  assert.equal(getColorCountForLevel(15), 4);
  assert.equal(getColorCountForLevel(16), 5);
  assert.equal(getColorCountForLevel(35), 5);
  assert.equal(getColorCountForLevel(36), 6);
  assert.equal(getColorCountForLevel(60), 6);
  assert.equal(getColorCountForLevel(61), 7);
  assert.equal(getColorCountForLevel(90), 7);
  assert.equal(getColorCountForLevel(91), 8);
  assert.equal(getColorCountForLevel(120), 8);
  assert.equal(getColorCountForLevel(121), 9);
  assert.equal(getColorCountForLevel(150), 9);
  assert.equal(getColorCountForLevel(151), 10);
  assert.equal(getColorCountForLevel(200), 10);
  assert.equal(getColorCountForLevel(201), 10);
});

test('getTubeCountForLevel should return colorCount + 2', () => {
  assert.equal(getTubeCountForLevel(1), 5);
  assert.equal(getTubeCountForLevel(10), 6);
  assert.equal(getTubeCountForLevel(50), 8);
  assert.equal(getTubeCountForLevel(200), 12);
});

test('getTopColor should return null for empty tube', () => {
  const emptyTube = [null, null, null, null];
  assert.equal(getTopColor(emptyTube), null);
});

test('getTopColor should return top color for non-empty tube', () => {
  const tube1 = [0, 0, 1, 2];
  assert.equal(getTopColor(tube1), 2);
  
  const tube2 = [1, 1, 1, 1];
  assert.equal(getTopColor(tube2), 1);
  
  const tube3 = [null, 0, 0, 0];
  assert.equal(getTopColor(tube3), 0);
});

test('getTopConsecutiveCount should return 0 for empty tube', () => {
  const emptyTube = [null, null, null, null];
  assert.equal(getTopConsecutiveCount(emptyTube), 0);
});

test('getTopConsecutiveCount should count consecutive same colors from top', () => {
  const tube1 = [0, 0, 1, 2];
  assert.equal(getTopConsecutiveCount(tube1), 1);
  
  const tube2 = [0, 1, 1, 1];
  assert.equal(getTopConsecutiveCount(tube2), 3);
  
  const tube3 = [1, 1, 1, 1];
  assert.equal(getTopConsecutiveCount(tube3), 4);
  
  const tube4 = [null, 0, 1, 1];
  assert.equal(getTopConsecutiveCount(tube4), 2);
});

test('getEmptySlotCount should return correct count', () => {
  assert.equal(getEmptySlotCount([null, null, null, null]), 4);
  assert.equal(getEmptySlotCount([0, null, null, null]), 3);
  assert.equal(getEmptySlotCount([0, 1, null, null]), 2);
  assert.equal(getEmptySlotCount([0, 1, 2, null]), 1);
  assert.equal(getEmptySlotCount([0, 1, 2, 3]), 0);
});

test('canPour should return false when pouring from empty tube', () => {
  const empty = [null, null, null, null];
  const target = [0, 0, null, null];
  assert.equal(canPour(empty, target), false);
});

test('canPour should return false when target is full', () => {
  const from = [0, 0, 1, 2];
  const full = [0, 0, 0, 0];
  assert.equal(canPour(from, full), false);
});

test('canPour should return true when target is empty', () => {
  const from = [0, 0, 1, 2];
  const empty = [null, null, null, null];
  assert.equal(canPour(from, empty), true);
});

test('canPour should return true when top colors match', () => {
  const from = [0, 1, 2, 2];
  const to = [0, null, null, 2];
  assert.equal(canPour(from, to), true);
});

test('canPour should return false when top colors do not match', () => {
  const from = [0, 1, 2, 0];
  const to = [0, null, null, 1];
  assert.equal(canPour(from, to), false);
});

test('pour should pour all matching colors when space allows', () => {
  const from = [0, 1, 1, 2];
  const to = [null, null, null, null];
  
  const result = pour(from, to);
  
  assert.deepEqual(result.newFrom, [0, 1, 1, null]);
  assert.deepEqual(result.newTo, [2, null, null, null]);
  assert.equal(result.count, 1);
});

test('pour should pour multiple consecutive colors', () => {
  const from = [0, 1, 1, 1];
  const to = [null, null, null, null];
  
  const result = pour(from, to);
  
  assert.deepEqual(result.newFrom, [0, null, null, null]);
  assert.deepEqual(result.newTo, [1, 1, 1, null]);
  assert.equal(result.count, 3);
});

test('pour should partially pour when space is limited', () => {
  const from = [0, 1, 1, 1];
  const to = [null, null, 1, 1];
  
  const result = pour(from, to);
  
  assert.deepEqual(result.newFrom, [0, 1, null, null]);
  assert.deepEqual(result.newTo, [1, 1, 1, 1]);
  assert.equal(result.count, 2);
});

test('pour should return color in result', () => {
  const from = [0, 0, 0, 0];
  const to = [null, null, null, null];
  
  const result = pour(from, to);
  
  assert.equal(result.color, 0);
});

test('isTubeComplete should return true for empty tube', () => {
  assert.equal(isTubeComplete([null, null, null, null]), true);
});

test('isTubeComplete should return true for tube with all same colors', () => {
  assert.equal(isTubeComplete([0, 0, 0, 0]), true);
  assert.equal(isTubeComplete([1, 1, 1, 1]), true);
});

test('isTubeComplete should return false for partially filled same colors', () => {
  assert.equal(isTubeComplete([null, 0, 0, 0]), false);
  assert.equal(isTubeComplete([null, null, 1, 1]), false);
});

test('isTubeComplete should return false for mixed colors', () => {
  assert.equal(isTubeComplete([0, 0, 1, 1]), false);
  assert.equal(isTubeComplete([0, 1, 2, 3]), false);
  assert.equal(isTubeComplete([null, 0, 1, 1]), false);
});

test('isLevelComplete should return true when all tubes are complete', () => {
  const tubes = [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    [null, null, null, null],
    [null, null, null, null]
  ];
  assert.equal(isLevelComplete(tubes), true);
});

test('isLevelComplete should return false when any tube is not complete', () => {
  const tubes = [
    [0, 0, 0, 0],
    [1, 1, 0, 1],
    [2, 2, 2, 2],
    [null, null, null, null],
    [null, null, null, null]
  ];
  assert.equal(isLevelComplete(tubes), false);
});

test('cloneTubes should create deep copy', () => {
  const tubes = [
    [0, 0, 1, 2],
    [null, null, null, null],
    [1, 1, 1, 1]
  ];
  
  const cloned = cloneTubes(tubes);
  
  assert.notEqual(tubes, cloned);
  assert.notEqual(tubes[0], cloned[0]);
  
  tubes[0][3] = 999;
  assert.notEqual(cloned[0][3], 999);
});

test('undoMove should return null when history is empty', () => {
  const tubes = [[0, 0, 1, 2]];
  const history = [];
  
  const result = undoMove(tubes, history);
  
  assert.equal(result, null);
});

test('undoMove should reverse the last pour operation', () => {
  const tubes = [
    [0, 1, null, null],
    [1, 1, 1, null],
    [null, null, null, null]
  ];
  
  const history = [{
    from: 0,
    to: 1,
    count: 2,
    color: 1
  }];
  
  const result = undoMove(tubes, history);
  
  assert.deepEqual(result.tubes[0], [0, 1, 1, 1]);
  assert.deepEqual(result.tubes[1], [1, null, null, null]);
  assert.deepEqual(result.history, []);
});

test('resetLevel should reset to initial state', () => {
  const initialTubes = [
    [0, 0, 1, 2],
    [1, 1, 0, 0],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ];
  
  const result = resetLevel(initialTubes);
  
  assert.deepEqual(result.tubes, initialTubes);
  assert.deepEqual(result.history, []);
  assert.equal(result.moves, 0);
});

test('generateLevel should generate valid level structure', () => {
  const level = 1;
  const result = generateLevel(level);
  
  assert.ok(Array.isArray(result.tubes));
  assert.equal(result.tubes.length, getTubeCountForLevel(level));
  assert.equal(result.colorCount, getColorCountForLevel(level));
  assert.ok(Array.isArray(result.initialTubes));
});

test('generateLevel should not generate already completed level', () => {
  for (let i = 0; i < 20; i++) {
    const result = generateLevel(3);
    assert.equal(isLevelComplete(result.tubes), false);
  }
});

test('generateLevel should have correct number of each color', () => {
  const result = generateLevel(10);
  const colorCount = result.colorCount;
  
  const colorCounts = {};
  for (const tube of result.tubes) {
    for (const color of tube) {
      if (color !== null) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
  }
  
  for (let i = 0; i < colorCount; i++) {
    assert.equal(colorCounts[i], 4, `Color ${i} should have 4 layers`);
  }
});

test('generateLevel should have correct number of empty tubes', () => {
  for (let level = 1; level <= 30; level += 5) {
    const result = generateLevel(level);
    const emptyCount = result.tubes.filter(t => t.every(c => c === null)).length;
    assert.equal(emptyCount, EMPTY_TUBES);
  }
});

test('generateLevel stability test - 100 levels', () => {
  for (let i = 0; i < 100; i++) {
    const level = Math.floor(Math.random() * 200) + 1;
    const result = generateLevel(level);
    
    assert.ok(result.tubes.length > 0);
    assert.equal(result.colorCount, getColorCountForLevel(level));
    assert.equal(result.tubeCount, getTubeCountForLevel(level));
  }
});
