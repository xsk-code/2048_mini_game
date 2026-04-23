const gameTypes = [
  {
    id: '2048',
    label: '2048',
    subtitle: '4×4 | 5×5 | 6×6',
    icon: '★',
    bestScoreStorageKey: '2048-best-overall',
    saveStateStorageKey: '2048-save-state'
  },
  {
    id: 'popstar',
    label: '消灭星星',
    subtitle: 'POPSTAR',
    icon: '✦',
    bestScoreStorageKey: 'popstar-best',
    saveStateStorageKey: 'popstar-save'
  },
  {
    id: 'watersort',
    label: '水排序',
    subtitle: 'WATER SORT',
    icon: '💧',
    bestScoreStorageKey: 'watersort-best',
    saveStateStorageKey: 'watersort-save'
  }
];

const modes = [
  {
    id: '4x4',
    label: '4×4',
    gridSize: 4,
    targetTile: 2048,
    bestScoreStorageKey: '2048-best-4x4',
    saveStateStorageKey: '2048-save-4x4',
    gameType: '2048'
  },
  {
    id: '5x5',
    label: '5×5',
    gridSize: 5,
    targetTile: 4096,
    bestScoreStorageKey: '2048-best-5x5',
    saveStateStorageKey: '2048-save-5x5',
    gameType: '2048'
  },
  {
    id: '6x6',
    label: '6×6',
    gridSize: 6,
    targetTile: 8192,
    bestScoreStorageKey: '2048-best-6x6',
    saveStateStorageKey: '2048-save-6x6',
    gameType: '2048'
  }
];

function getModeById(id) {
  return modes.find(m => m.id === id) || modes[0];
}

function getModeByGridSize(gridSize) {
  return modes.find(m => m.gridSize === gridSize) || modes[0];
}

function getDefaultMode() {
  return modes[0];
}

function getAllModes() {
  return [...modes];
}

function getGameTypeById(id) {
  return gameTypes.find(g => g.id === id) || gameTypes[0];
}

function getAllGameTypes() {
  return [...gameTypes];
}

function getModesByGameType(gameTypeId) {
  return modes.filter(m => m.gameType === gameTypeId);
}

module.exports = {
  modes,
  gameTypes,
  getModeById,
  getModeByGridSize,
  getDefaultMode,
  getAllModes,
  getGameTypeById,
  getAllGameTypes,
  getModesByGameType
};
