const TUBE_CAPACITY = 4;
const MAX_LEVEL = 200;
const EMPTY_TUBES = 2;

const LEVEL_CONFIG = [
  { maxLevel: 5,   colorCount: 3  },
  { maxLevel: 15,  colorCount: 4  },
  { maxLevel: 35,  colorCount: 5  },
  { maxLevel: 60,  colorCount: 6  },
  { maxLevel: 90,  colorCount: 7  },
  { maxLevel: 120, colorCount: 8  },
  { maxLevel: 150, colorCount: 9  },
  { maxLevel: 200, colorCount: 10 }
];

const WATER_COLORS = [
  { id: 0, name: '红', light: '#FF6B8A', dark: '#E8506E', highlight: 'rgba(255,255,255,0.35)' },
  { id: 1, name: '蓝', light: '#5BA8E8', dark: '#4088C8', highlight: 'rgba(255,255,255,0.35)' },
  { id: 2, name: '绿', light: '#5EC89A', dark: '#40A878', highlight: 'rgba(255,255,255,0.35)' },
  { id: 3, name: '黄', light: '#FFD060', dark: '#E8B040', highlight: 'rgba(255,255,255,0.40)' },
  { id: 4, name: '紫', light: '#B890D8', dark: '#9870B8', highlight: 'rgba(255,255,255,0.35)' },
  { id: 5, name: '橙', light: '#FFA060', dark: '#E88040', highlight: 'rgba(255,255,255,0.35)' },
  { id: 6, name: '粉', light: '#FF8CB8', dark: '#E87098', highlight: 'rgba(255,255,255,0.35)' },
  { id: 7, name: '青', light: '#50C8D8', dark: '#38A8B8', highlight: 'rgba(255,255,255,0.35)' },
  { id: 8, name: '棕', light: '#C89068', dark: '#A87048', highlight: 'rgba(255,255,255,0.30)' },
  { id: 9, name: '灰', light: '#A0A8B8', dark: '#808898', highlight: 'rgba(255,255,255,0.30)' }
];

const WATER_COLORS_DARK = [
  { id: 0, name: '红', light: '#E86080', dark: '#C05070', highlight: 'rgba(255,255,255,0.25)' },
  { id: 1, name: '蓝', light: '#4890C8', dark: '#3070A8', highlight: 'rgba(255,255,255,0.25)' },
  { id: 2, name: '绿', light: '#48B888', dark: '#309868', highlight: 'rgba(255,255,255,0.25)' },
  { id: 3, name: '黄', light: '#E8B040', dark: '#C89020', highlight: 'rgba(255,255,255,0.30)' },
  { id: 4, name: '紫', light: '#9878B8', dark: '#785898', highlight: 'rgba(255,255,255,0.25)' },
  { id: 5, name: '橙', light: '#E88848', dark: '#C86828', highlight: 'rgba(255,255,255,0.25)' },
  { id: 6, name: '粉', light: '#E878A8', dark: '#C85888', highlight: 'rgba(255,255,255,0.25)' },
  { id: 7, name: '青', light: '#40B0C0', dark: '#2890A0', highlight: 'rgba(255,255,255,0.25)' },
  { id: 8, name: '棕', light: '#B88058', dark: '#986038', highlight: 'rgba(255,255,255,0.20)' },
  { id: 9, name: '灰', light: '#9098A8', dark: '#707888', highlight: 'rgba(255,255,255,0.20)' }
];

function getColorCountForLevel(level) {
  for (const config of LEVEL_CONFIG) {
    if (level <= config.maxLevel) {
      return config.colorCount;
    }
  }
  return 10;
}

function getTubeCountForLevel(level) {
  return getColorCountForLevel(level) + EMPTY_TUBES;
}

function getTopColor(tube) {
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] !== null) return tube[i];
  }
  return null;
}

function getTopConsecutiveCount(tube) {
  const topColor = getTopColor(tube);
  if (topColor === null) return 0;
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === topColor) count++;
    else break;
  }
  return count;
}

function getEmptySlotCount(tube) {
  return tube.filter(c => c === null).length;
}

function canPour(fromTube, toTube) {
  const fromTop = getTopColor(fromTube);
  if (fromTop === null) return false;
  const toEmpty = getEmptySlotCount(toTube);
  if (toEmpty === 0) return false;
  const toTop = getTopColor(toTube);
  if (toTop === null) return true;
  return toTop === fromTop;
}

function pour(fromTube, toTube) {
  const fromTop = getTopColor(fromTube);
  const pourCount = Math.min(
    getTopConsecutiveCount(fromTube),
    getEmptySlotCount(toTube)
  );

  const newFrom = [...fromTube];
  const newTo = [...toTube];

  for (let i = 0; i < pourCount; i++) {
    const topIndex = newFrom.lastIndexOf(fromTop);
    newFrom[topIndex] = null;
  }

  for (let i = 0; i < pourCount; i++) {
    const firstEmpty = newTo.indexOf(null);
    newTo[firstEmpty] = fromTop;
  }

  return { newFrom, newTo, count: pourCount, color: fromTop };
}

function isTubeComplete(tube) {
  const nonNull = tube.filter(c => c !== null);
  if (nonNull.length === 0) return true;
  if (nonNull.length === TUBE_CAPACITY) {
    return nonNull.every(c => c === nonNull[0]);
  }
  return nonNull.every(c => c === nonNull[0]);
}

function isLevelComplete(tubes) {
  return tubes.every(tube => isTubeComplete(tube));
}

function cloneTubes(tubes) {
  return tubes.map(tube => [...tube]);
}

function undoMove(tubes, history) {
  if (history.length === 0) return null;

  const lastMove = history[history.length - 1];
  const { from, to, count, color } = lastMove;

  const newTubes = cloneTubes(tubes);
  const newHistory = history.slice(0, -1);

  for (let i = 0; i < count; i++) {
    const topIndex = newTubes[to].lastIndexOf(color);
    if (topIndex !== -1) newTubes[to][topIndex] = null;
  }

  for (let i = 0; i < count; i++) {
    const firstEmpty = newTubes[from].indexOf(null);
    if (firstEmpty !== -1) newTubes[from][firstEmpty] = color;
  }

  return { tubes: newTubes, history: newHistory };
}

function resetLevel(initialTubes) {
  return {
    tubes: cloneTubes(initialTubes),
    history: [],
    moves: 0
  };
}

function generateLevel(level) {
  const colorCount = getColorCountForLevel(level);
  const tubeCount = getTubeCountForLevel(level);

  let tubes;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    tubes = [];
    for (let i = 0; i < colorCount; i++) {
      tubes.push(Array(TUBE_CAPACITY).fill(i));
    }
    for (let i = 0; i < tubeCount - colorCount; i++) {
      tubes.push(Array(TUBE_CAPACITY).fill(null));
    }

    const shuffleRounds = colorCount * 80;
    let lastMoveCount = 0;
    let hasMixedTube = false;
    
    for (let round = 0; round < shuffleRounds; round++) {
      const nonEmpty = [];
      for (let i = 0; i < tubeCount; i++) {
        if (getTopColor(tubes[i]) !== null) {
          nonEmpty.push(i);
        }
      }
      if (nonEmpty.length === 0) break;

      let moveFound = false;
      for (let attempt = 0; attempt < 15 && !moveFound; attempt++) {
        const fromIndex = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
        const topColor = getTopColor(tubes[fromIndex]);

        const nonEmptyDifferentTopTargets = [];
        const emptyTargets = [];
        
        for (let j = 0; j < tubeCount; j++) {
          if (j === fromIndex) continue;
          const toTop = getTopColor(tubes[j]);
          const toEmpty = getEmptySlotCount(tubes[j]);
          
          if (toEmpty > 0) {
            if (toTop === null) {
              emptyTargets.push(j);
            } else if (toTop !== topColor) {
              nonEmptyDifferentTopTargets.push(j);
            }
          }
        }

        let toIndex;
        
        if (!hasMixedTube && nonEmptyDifferentTopTargets.length > 0) {
          toIndex = nonEmptyDifferentTopTargets[Math.floor(Math.random() * nonEmptyDifferentTopTargets.length)];
          hasMixedTube = true;
        } else if (nonEmptyDifferentTopTargets.length > 0 && Math.random() < 0.5) {
          toIndex = nonEmptyDifferentTopTargets[Math.floor(Math.random() * nonEmptyDifferentTopTargets.length)];
        } else if (emptyTargets.length > 0) {
          toIndex = emptyTargets[Math.floor(Math.random() * emptyTargets.length)];
        } else if (nonEmptyDifferentTopTargets.length > 0) {
          toIndex = nonEmptyDifferentTopTargets[Math.floor(Math.random() * nonEmptyDifferentTopTargets.length)];
        } else {
          continue;
        }

        const result = pour(tubes[fromIndex], tubes[toIndex]);
        
        if (result.count > 0) {
          tubes[fromIndex] = result.newFrom;
          tubes[toIndex] = result.newTo;
          moveFound = true;
          lastMoveCount++;
        }
      }
    }

    if (!isLevelComplete(tubes) && lastMoveCount > 0) {
      break;
    }
    attempts++;
  }

  if (attempts >= maxAttempts) {
    tubes = [];
    for (let i = 0; i < colorCount; i++) {
      tubes.push(Array(TUBE_CAPACITY).fill(i));
    }
    for (let i = 0; i < tubeCount - colorCount; i++) {
      tubes.push(Array(TUBE_CAPACITY).fill(null));
    }
    
    if (colorCount >= 2) {
      let result = pour(tubes[0], tubes[colorCount]);
      tubes[0] = result.newFrom;
      tubes[colorCount] = result.newTo;
      
      result = pour(tubes[1], tubes[colorCount]);
      tubes[1] = result.newFrom;
      tubes[colorCount] = result.newTo;
    }
  }

  const initialTubes = cloneTubes(tubes);

  return { tubes, colorCount, tubeCount, initialTubes };
}

module.exports = {
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
};
