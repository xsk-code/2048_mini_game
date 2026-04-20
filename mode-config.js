const modes = [
  {
    id: '4x4',
    label: '4×4',
    gridSize: 4,
    targetTile: 2048,
    bestScoreStorageKey: '2048-best-4x4',
    saveStateStorageKey: '2048-save-4x4'
  },
  {
    id: '5x5',
    label: '5×5',
    gridSize: 5,
    targetTile: 4096,
    bestScoreStorageKey: '2048-best-5x5',
    saveStateStorageKey: '2048-save-5x5'
  },
  {
    id: '6x6',
    label: '6×6',
    gridSize: 6,
    targetTile: 8192,
    bestScoreStorageKey: '2048-best-6x6',
    saveStateStorageKey: '2048-save-6x6'
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

module.exports = {
  modes,
  getModeById,
  getModeByGridSize,
  getDefaultMode,
  getAllModes
};
