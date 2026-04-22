const POPSTAR_GRID_SIZE = 10;
const STAR_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

function getColorCount(level) {
  if (level >= 26) {
    return 6;
  }
  return 5;
}

function createBoard(colorCount = 5) {
  const board = [];
  for (let row = 0; row < POPSTAR_GRID_SIZE; row++) {
    const rowArr = [];
    for (let col = 0; col < POPSTAR_GRID_SIZE; col++) {
      rowArr.push(Math.floor(Math.random() * colorCount));
    }
    board.push(rowArr);
  }
  return board;
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function findConnected(board, row, col) {
  if (board[row][col] === null) {
    return new Set();
  }
  
  const color = board[row][col];
  const visited = new Set();
  const queue = [{ row, col }];
  
  function posKey(r, c) {
    return `${r},${c}`;
  }
  
  visited.add(posKey(row, col));
  
  while (queue.length > 0) {
    const current = queue.shift();
    const { row: r, col: c } = current;
    
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];
    
    for (const dir of directions) {
      const newRow = r + dir.dr;
      const newCol = c + dir.dc;
      const key = posKey(newRow, newCol);
      
      if (newRow >= 0 && newRow < POPSTAR_GRID_SIZE &&
          newCol >= 0 && newCol < POPSTAR_GRID_SIZE &&
          !visited.has(key) &&
          board[newRow][newCol] === color) {
        visited.add(key);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }
  
  const result = new Set();
  visited.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    result.add({ row: r, col: c });
  });
  
  return result;
}

function canEliminate(board, row, col) {
  const connected = findConnected(board, row, col);
  return connected.size >= 2;
}

function eliminate(board, positions) {
  const newBoard = cloneBoard(board);
  for (const pos of positions) {
    newBoard[pos.row][pos.col] = null;
  }
  return newBoard;
}

function applyGravity(board) {
  const newBoard = cloneBoard(board);
  
  for (let col = 0; col < POPSTAR_GRID_SIZE; col++) {
    let writePos = POPSTAR_GRID_SIZE - 1;
    
    for (let readPos = POPSTAR_GRID_SIZE - 1; readPos >= 0; readPos--) {
      if (newBoard[readPos][col] !== null) {
        if (writePos !== readPos) {
          newBoard[writePos][col] = newBoard[readPos][col];
          newBoard[readPos][col] = null;
        }
        writePos--;
      }
    }
  }
  
  return newBoard;
}

function collapseColumns(board) {
  const newBoard = cloneBoard(board);
  let writeCol = 0;
  
  for (let readCol = 0; readCol < POPSTAR_GRID_SIZE; readCol++) {
    let hasStar = false;
    for (let row = 0; row < POPSTAR_GRID_SIZE; row++) {
      if (newBoard[row][readCol] !== null) {
        hasStar = true;
        break;
      }
    }
    
    if (hasStar) {
      if (writeCol !== readCol) {
        for (let row = 0; row < POPSTAR_GRID_SIZE; row++) {
          newBoard[row][writeCol] = newBoard[row][readCol];
          newBoard[row][readCol] = null;
        }
      }
      writeCol++;
    }
  }
  
  return newBoard;
}

function hasValidMoves(board) {
  for (let row = 0; row < POPSTAR_GRID_SIZE; row++) {
    for (let col = 0; col < POPSTAR_GRID_SIZE; col++) {
      if (board[row][col] !== null) {
        if (canEliminate(board, row, col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function calculateScore(count) {
  return count * count * 5;
}

function calculateBonus(remaining) {
  if (remaining < 10) {
    return 2000 - remaining * 5;
  }
  return 0;
}

function getTargetScore(level) {
  if (level <= 10) {
    return 1000 + (level - 1) * 300;
  } else if (level <= 20) {
    return 3700 + (level - 10) * 500;
  } else if (level <= 50) {
    return 8700 + (level - 20) * 800;
  } else {
    return 32700 + (level - 50) * 1200;
  }
}

function countRemainingStars(board) {
  let count = 0;
  for (let row = 0; row < POPSTAR_GRID_SIZE; row++) {
    for (let col = 0; col < POPSTAR_GRID_SIZE; col++) {
      if (board[row][col] !== null) {
        count++;
      }
    }
  }
  return count;
}

function processElimination(board, positions) {
  let newBoard = eliminate(board, positions);
  newBoard = applyGravity(newBoard);
  newBoard = collapseColumns(newBoard);
  return newBoard;
}

module.exports = {
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
};
