const { getModeById, getDefaultMode, getAllModes } = require('./mode-config');

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

module.exports = {
  loadBestScore,
  saveBestScore,
  loadSaveState,
  saveSaveState,
  clearSaveState,
  hasSaveState,
  loadAllModesInfo
};
