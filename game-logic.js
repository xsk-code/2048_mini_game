const TARGET_TILE = 2048;

function hasTargetTile(board, targetTile = TARGET_TILE) {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
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

function getBoardProgress(board, targetTile = TARGET_TILE) {
  return {
    hasTargetTile: hasTargetTile(board, targetTile),
    isGameOver: !canBoardMove(board)
  };
}

module.exports = {
  TARGET_TILE,
  canBoardMove,
  getBoardProgress,
  hasTargetTile
};
