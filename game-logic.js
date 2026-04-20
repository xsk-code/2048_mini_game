const DEFAULT_TARGET_TILE = 2048;

function hasTargetTile(board, targetTile = DEFAULT_TARGET_TILE) {
  const gridSize = board.length;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (board[y][x]?.value === targetTile) {
        return true;
      }
    }
  }

  return false;
}

function canBoardMove(board) {
  const gridSize = board.length;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = board[y][x];

      if (!tile) {
        return true;
      }

      if (x < gridSize - 1 && tile.value === board[y][x + 1]?.value) {
        return true;
      }

      if (y < gridSize - 1 && tile.value === board[y + 1][x]?.value) {
        return true;
      }
    }
  }

  return false;
}

function getBoardProgress(board, targetTile = DEFAULT_TARGET_TILE) {
  return {
    hasTargetTile: hasTargetTile(board, targetTile),
    isGameOver: !canBoardMove(board)
  };
}

function createEmptyBoard(gridSize) {
  return Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
}

module.exports = {
  DEFAULT_TARGET_TILE,
  canBoardMove,
  getBoardProgress,
  hasTargetTile,
  createEmptyBoard
};
