const { getModeById, getDefaultMode, getAllModes, getGameTypeById } = require('./mode-config');

function getStorageAdapter() {
  if (typeof wx !== 'undefined' && wx.getStorageSync) {
    return {
      get: (key) => wx.getStorageSync(key),
      set: (key, value) => wx.setStorageSync(key, value),
      remove: (key) => wx.removeStorageSync(key)
    };
  }
  
  return {
    get: () => null,
    set: () => {},
    remove: () => {}
  };
}

const storage = getStorageAdapter();

function loadBestScore(modeId) {
  const mode = getModeById(modeId);
  try {
    const saved = storage.get(mode.bestScoreStorageKey);
    if (saved !== null && saved !== undefined) {
      return parseInt(saved, 10) || 0;
    }
  } catch (e) {
    console.error('Failed to load best score:', e);
  }
  return 0;
}

function saveBestScore(modeId, score) {
  const mode = getModeById(modeId);
  try {
    storage.set(mode.bestScoreStorageKey, score.toString());
  } catch (e) {
    console.error('Failed to save best score:', e);
  }
}

function loadSaveState(modeId) {
  const mode = getModeById(modeId);
  try {
    const saved = storage.get(mode.saveStateStorageKey);
    if (saved) {
      const state = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (state && state.board && state.score !== undefined) {
        return state;
      }
    }
  } catch (e) {
    console.error('Failed to load save state:', e);
  }
  return null;
}

function saveSaveState(modeId, state) {
  const mode = getModeById(modeId);
  try {
    const saveData = {
      modeId: modeId,
      board: state.board,
      score: state.score,
      isGameOver: state.isGameOver || false,
      tileId: state.tileId || 0
    };
    storage.set(mode.saveStateStorageKey, JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function clearSaveState(modeId) {
  const mode = getModeById(modeId);
  try {
    storage.remove(mode.saveStateStorageKey);
  } catch (e) {
    console.error('Failed to clear save state:', e);
  }
}

function hasSaveState(modeId) {
  return loadSaveState(modeId) !== null;
}

function loadAllModesInfo() {
  const modes = getAllModes();
  return modes.map(mode => ({
    ...mode,
    bestScore: loadBestScore(mode.id),
    hasSave: hasSaveState(mode.id)
  }));
}

function loadPopstarBestScore() {
  const gameType = getGameTypeById('popstar');
  try {
    const saved = storage.get(gameType.bestScoreStorageKey);
    if (saved !== null && saved !== undefined) {
      return parseInt(saved, 10) || 0;
    }
  } catch (e) {
    console.error('Failed to load popstar best score:', e);
  }
  return 0;
}

function savePopstarBestScore(score) {
  const gameType = getGameTypeById('popstar');
  try {
    storage.set(gameType.bestScoreStorageKey, score.toString());
  } catch (e) {
    console.error('Failed to save popstar best score:', e);
  }
}

function loadPopstarSaveState() {
  const gameType = getGameTypeById('popstar');
  try {
    const saved = storage.get(gameType.saveStateStorageKey);
    if (saved) {
      const state = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (state && state.board && state.score !== undefined) {
        return state;
      }
    }
  } catch (e) {
    console.error('Failed to load popstar save state:', e);
  }
  return null;
}

function savePopstarSaveState(state) {
  const gameType = getGameTypeById('popstar');
  try {
    const saveData = {
      board: state.board,
      score: state.score,
      totalScore: state.totalScore || 0,
      level: state.level || 1,
      targetScore: state.targetScore || 1000,
      isGameOver: state.isGameOver || false,
      isLevelClear: state.isLevelClear || false
    };
    storage.set(gameType.saveStateStorageKey, JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to save popstar state:', e);
  }
}

function clearPopstarSaveState() {
  const gameType = getGameTypeById('popstar');
  try {
    storage.remove(gameType.saveStateStorageKey);
  } catch (e) {
    console.error('Failed to clear popstar save state:', e);
  }
}

function hasPopstarSaveState() {
  return loadPopstarSaveState() !== null;
}

function loadWatersortBestScore() {
  const gameType = getGameTypeById('watersort');
  try {
    const saved = storage.get(gameType.bestScoreStorageKey);
    if (saved !== null && saved !== undefined) {
      return parseInt(saved, 10) || 0;
    }
  } catch (e) {
    console.error('Failed to load watersort best score:', e);
  }
  return 0;
}

function saveWatersortBestScore(level) {
  const gameType = getGameTypeById('watersort');
  try {
    storage.set(gameType.bestScoreStorageKey, level.toString());
  } catch (e) {
    console.error('Failed to save watersort best score:', e);
  }
}

function loadWatersortSaveState() {
  const gameType = getGameTypeById('watersort');
  try {
    const saved = storage.get(gameType.saveStateStorageKey);
    if (saved) {
      const state = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (state && state.tubes && state.level !== undefined) {
        return state;
      }
    }
  } catch (e) {
    console.error('Failed to load watersort save state:', e);
  }
  return null;
}

function saveWatersortSaveState(state) {
  const gameType = getGameTypeById('watersort');
  try {
    const saveData = {
      tubes: state.tubes,
      level: state.level,
      colorCount: state.colorCount,
      tubeCount: state.tubeCount,
      moves: state.moves,
      history: state.history,
      initialTubes: state.initialTubes,
      isComplete: state.isComplete || false
    };
    storage.set(gameType.saveStateStorageKey, JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to save watersort state:', e);
  }
}

function clearWatersortSaveState() {
  const gameType = getGameTypeById('watersort');
  try {
    storage.remove(gameType.saveStateStorageKey);
  } catch (e) {
    console.error('Failed to clear watersort save state:', e);
  }
}

function hasWatersortSaveState() {
  return loadWatersortSaveState() !== null;
}

function loadWatersortBestMoves(level) {
  try {
    const saved = storage.get(`watersort-best-moves-${level}`);
    if (saved !== null && saved !== undefined) {
      return parseInt(saved, 10) || Infinity;
    }
  } catch (e) {
    console.error('Failed to load watersort best moves:', e);
  }
  return Infinity;
}

function saveWatersortBestMoves(level, moves) {
  try {
    const currentBest = loadWatersortBestMoves(level);
    if (moves < currentBest) {
      storage.set(`watersort-best-moves-${level}`, moves.toString());
    }
  } catch (e) {
    console.error('Failed to save watersort best moves:', e);
  }
}

function loadAuthToken() {
  try {
    const saved = storage.get('auth_token');
    if (saved !== null && saved !== undefined) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load auth token:', e);
  }
  return '';
}

function saveAuthToken(token) {
  try {
    storage.set('auth_token', token);
  } catch (e) {
    console.error('Failed to save auth token:', e);
  }
}

function clearAuthToken() {
  try {
    storage.remove('auth_token');
  } catch (e) {
    console.error('Failed to clear auth token:', e);
  }
}

function loadAllGameTypesInfo() {
  const game2048Info = {
    id: '2048',
    label: '2048',
    subtitle: '4×4 | 5×5 | 6×6',
    icon: '★',
    bestScore: Math.max(...getAllModes().map(m => loadBestScore(m.id))),
    hasSave: getAllModes().some(m => hasSaveState(m.id))
  };
  
  const popstarInfo = {
    id: 'popstar',
    label: '消灭星星',
    subtitle: 'POPSTAR',
    icon: '✦',
    bestScore: loadPopstarBestScore(),
    hasSave: hasPopstarSaveState()
  };
  
  const watersortInfo = {
    id: 'watersort',
    label: '水排序',
    subtitle: 'WATER SORT',
    icon: '💧',
    bestScore: loadWatersortBestScore(),
    hasSave: hasWatersortSaveState()
  };
  
  return [game2048Info, popstarInfo, watersortInfo];
}

module.exports = {
  loadBestScore,
  saveBestScore,
  loadSaveState,
  saveSaveState,
  clearSaveState,
  hasSaveState,
  loadAllModesInfo,
  loadPopstarBestScore,
  savePopstarBestScore,
  loadPopstarSaveState,
  savePopstarSaveState,
  clearPopstarSaveState,
  hasPopstarSaveState,
  loadWatersortBestScore,
  saveWatersortBestScore,
  loadWatersortSaveState,
  saveWatersortSaveState,
  clearWatersortSaveState,
  hasWatersortSaveState,
  loadWatersortBestMoves,
  saveWatersortBestMoves,
  loadAllGameTypesInfo,
  loadAuthToken,
  saveAuthToken,
  clearAuthToken
};
