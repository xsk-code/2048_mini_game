const GRID_SIZE = 4;

const themes = {
  light: {
    background: '#F0F8FF',
    containerBg: '#F0F8FF',
    boardBg: '#E6F0F8',
    cellBg: '#F0F5FA',
    titleText: '#4A5E72',
    subtitleText: '#8BA8C4',
    scoreCardBg: '#E6F0F8',
    scoreLabel: '#7A96B0',
    scoreValue: '#4A5E72',
    hintText: '#8BA8C4',
    buttonBg: '#7EB8E6',
    buttonText: '#FFFFFF',
    themeBtnBg: '#E6F0F8',
    overlayBg: 'rgba(240, 248, 255, 0.95)',
    titleGradient: ['#7EB8E6', '#A8D4FF'],
    scoreGradient: ['#7EB8E6', '#A8D4FF'],
    tiles: {
      2: { bg: '#EEF5FF', text: '#4A5E72', glow: null },
      4: { bg: '#E4F0FF', text: '#4A5E72', glow: null },
      8: { bg: '#C0E0FF', text: '#FFFFFF', glow: null },
      16: { bg: '#A0C8FF', text: '#FFFFFF', glow: null },
      32: { bg: '#80B0FF', text: '#FFFFFF', glow: null },
      64: { bg: '#6092FF', text: '#FFFFFF', glow: null },
      128: { bg: '#A0E0C0', text: '#4A5E72', glow: '#88D8B0' },
      256: { bg: '#60D0A0', text: '#FFFFFF', glow: '#6CD4A0' },
      512: { bg: '#30C080', text: '#FFFFFF', glow: '#4CD090' },
      1024: { bg: '#00B090', text: '#FFFFFF', glow: '#3CAC78' },
      2048: { bg: '#0090B0', text: '#FFFFFF', glow: '#2E8B57' }
    }
  },
  dark: {
    background: '#0D1B2A',
    containerBg: '#0D1B2A',
    boardBg: '#1B3A5C',
    cellBg: '#0D1B2A',
    titleText: '#E8F0F8',
    subtitleText: '#6A8AAA',
    scoreCardBg: '#1B3A5C',
    scoreLabel: '#7A96B0',
    scoreValue: '#E8F0F8',
    hintText: '#6A8AAA',
    buttonBg: '#7EB8E6',
    buttonText: '#0D1B2A',
    themeBtnBg: '#1B3A5C',
    overlayBg: 'rgba(13, 27, 42, 0.95)',
    titleGradient: ['#88D8B0', '#6CD4A0'],
    scoreGradient: ['#7EB8E6', '#A8D4FF'],
    tiles: {
      2: { bg: '#2D2D3A', text: '#E8F0F8', glow: null },
      4: { bg: '#3D3D52', text: '#E8F0F8', glow: null },
      8: { bg: '#6B5B95', text: '#FFFFFF', glow: null },
      16: { bg: '#7B68A0', text: '#FFFFFF', glow: null },
      32: { bg: '#9B8DC0', text: '#FFFFFF', glow: null },
      64: { bg: '#BBADD0', text: '#FFFFFF', glow: null },
      128: { bg: '#88D8B0', text: '#1A1A2E', glow: '#88D8B0' },
      256: { bg: '#6CD4A0', text: '#FFFFFF', glow: '#6CD4A0' },
      512: { bg: '#4CD090', text: '#FFFFFF', glow: '#4CD090' },
      1024: { bg: '#3CAC78', text: '#FFFFFF', glow: '#3CAC78' },
      2048: { bg: '#2E8B57', text: '#FFFFFF', glow: '#2E8B57' }
    }
  }
};

class Game2048 {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    this.systemInfo = wx.getSystemInfoSync();
    this.canvas.width = this.systemInfo.screenWidth;
    this.canvas.height = this.systemInfo.screenHeight;
    
    this.isDark = false;
    this.loadTheme();
    
    this.board = [];
    this.score = 0;
    this.bestScore = 0;
    this.isGameOver = false;
    this.hasWon = false;
    this.keepPlaying = false;
    this.tiles = [];
    this.tileId = 0;
    
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMoving = false;
    
    this.animatingTiles = [];
    this.isAnimating = false;
    
    this.calculateDimensions();
    this.initGame();
    this.setupTouchEvents();
    this.gameLoop();
  }
  
  calculateDimensions() {
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    
    this.padding = screenWidth * 0.05;
    
    this.headerHeight = 100;
    this.scoreCardHeight = 60;
    this.headerMarginBottom = 32;
    
    this.hintHeight = 30;
    this.hintMarginBottom = 28;
    
    this.boardSize = Math.min(
      screenWidth - this.padding * 2,
      screenHeight * 0.5
    );
    this.cellGap = this.boardSize * 0.025;
    this.cellSize = (this.boardSize - this.cellGap * (GRID_SIZE + 1)) / GRID_SIZE;
    
    this.boardX = (screenWidth - this.boardSize) / 2;
    
    let currentY = this.padding;
    this.headerY = currentY;
    currentY += this.headerHeight + this.headerMarginBottom;
    
    this.hintY = currentY;
    currentY += this.hintHeight + this.hintMarginBottom;
    
    this.boardY = currentY;
    currentY += this.boardSize + 36;
    
    this.actionY = currentY;
    
    this.themeBtnSize = 44;
    this.newGameBtnWidth = 140;
    this.newGameBtnHeight = 44;
  }
  
  loadTheme() {
    try {
      const savedTheme = wx.getStorageSync('2048-theme');
      if (savedTheme === 'dark') {
        this.isDark = true;
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
  }
  
  saveTheme() {
    try {
      wx.setStorageSync('2048-theme', this.isDark ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }
  
  loadBestScore() {
    try {
      const saved = wx.getStorageSync('2048-best');
      if (saved) {
        this.bestScore = parseInt(saved, 10) || 0;
      }
    } catch (e) {
      console.error('Failed to load best score:', e);
    }
  }
  
  saveBestScore() {
    try {
      wx.setStorageSync('2048-best', this.bestScore.toString());
    } catch (e) {
      console.error('Failed to save best score:', e);
    }
  }
  
  initGame() {
    this.board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    this.score = 0;
    this.isGameOver = false;
    this.hasWon = false;
    this.keepPlaying = false;
    this.tiles = [];
    this.tileId = 0;
    this.animatingTiles = [];
    this.isAnimating = false;
    
    this.loadBestScore();
    this.addRandomTile();
    this.addRandomTile();
  }
  
  addRandomTile() {
    const emptyCells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!this.board[y][x]) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) return false;
    
    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    
    const tile = {
      id: ++this.tileId,
      value,
      x,
      y,
      isNew: true,
      merged: false
    };
    
    this.board[y][x] = tile;
    this.tiles = this.getTiles();
    
    return true;
  }
  
  getTiles() {
    const result = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.board[y]?.[x];
        if (tile) {
          result.push({ ...tile, x, y });
        }
      }
    }
    return result;
  }
  
  setupTouchEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      
      this.checkButtonClick(touch.clientX, touch.clientY);
    });
    
    wx.onTouchEnd((e) => {
      if (this.isGameOver && !this.keepPlaying) return;
      if (!this.touchStartX || !this.touchStartY) return;
      
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      
      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;
      
      const minSwipe = 30;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) {
          this.moveInDirection(dx > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(dy) > minSwipe) {
          this.moveInDirection(dy > 0 ? 'down' : 'up');
        }
      }
      
      this.touchStartX = 0;
      this.touchStartY = 0;
    });
  }
  
  checkButtonClick(x, y) {
    const totalActionWidth = this.newGameBtnWidth + 20 + this.themeBtnSize;
    const actionStartX = this.boardX + (this.boardSize - totalActionWidth) / 2;
    
    const newGameBtnX = actionStartX;
    const newGameBtnY = this.actionY;
    if (x >= newGameBtnX && x <= newGameBtnX + this.newGameBtnWidth && 
        y >= newGameBtnY && y <= newGameBtnY + this.newGameBtnHeight) {
      this.initGame();
      return;
    }
    
    const themeBtnX = actionStartX + this.newGameBtnWidth + 20;
    const themeBtnY = this.actionY;
    if (x >= themeBtnX && x <= themeBtnX + this.themeBtnSize && 
        y >= themeBtnY && y <= themeBtnY + this.themeBtnSize) {
      this.isDark = !this.isDark;
      this.saveTheme();
      return;
    }
    
    if (this.isGameOver || (this.hasWon && !this.keepPlaying)) {
      if (x >= this.boardX && x <= this.boardX + this.boardSize && 
          y >= this.boardY && y <= this.boardY + this.boardSize) {
        if (this.isGameOver) {
          this.initGame();
        } else if (this.hasWon && !this.keepPlaying) {
          this.keepPlaying = true;
        }
      }
    }
  }
  
  moveInDirection(direction) {
    if (this.isGameOver && !this.keepPlaying) return;
    if (this.isMoving) return;
    
    this.isMoving = true;
    
    const board = JSON.parse(JSON.stringify(this.board));
    let scoreGain = 0;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (board[y][x]) {
          board[y][x].merged = false;
          board[y][x].isNew = false;
        }
      }
    }
    
    const oldBoard = JSON.stringify(board);
    
    if (direction === 'left') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = board[y].filter(t => t !== null);
        const newRow = [];
        let i = 0;
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: row[i].value * 2,
              x: newRow.length,
              y,
              merged: true,
              isNew: false
            };
            newRow.push(merged);
            scoreGain += merged.value;
            i += 2;
          } else {
            row[i].x = newRow.length;
            row[i].y = y;
            newRow.push(row[i]);
            i++;
          }
        }
        while (newRow.length < GRID_SIZE) newRow.push(null);
        board[y] = newRow;
      }
    } else if (direction === 'right') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = board[y].filter(t => t !== null).reverse();
        const newRow = [];
        let i = 0;
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: row[i].value * 2,
              x: GRID_SIZE - 1 - newRow.length,
              y,
              merged: true,
              isNew: false
            };
            newRow.push(merged);
            scoreGain += merged.value;
            i += 2;
          } else {
            row[i].x = GRID_SIZE - 1 - newRow.length;
            row[i].y = y;
            newRow.push(row[i]);
            i++;
          }
        }
        while (newRow.length < GRID_SIZE) newRow.push(null);
        board[y] = newRow.reverse();
      }
    } else if (direction === 'up') {
      for (let x = 0; x < GRID_SIZE; x++) {
        const col = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          if (board[y][x]) col.push(board[y][x]);
        }
        const newCol = [];
        let i = 0;
        while (i < col.length) {
          if (i + 1 < col.length && col[i].value === col[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: col[i].value * 2,
              x,
              y: newCol.length,
              merged: true,
              isNew: false
            };
            newCol.push(merged);
            scoreGain += merged.value;
            i += 2;
          } else {
            col[i].x = x;
            col[i].y = newCol.length;
            newCol.push(col[i]);
            i++;
          }
        }
        while (newCol.length < GRID_SIZE) newCol.push(null);
        for (let y = 0; y < GRID_SIZE; y++) {
          board[y][x] = newCol[y];
        }
      }
    } else if (direction === 'down') {
      for (let x = 0; x < GRID_SIZE; x++) {
        const col = [];
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
          if (board[y][x]) col.push(board[y][x]);
        }
        const newCol = [];
        let i = 0;
        while (i < col.length) {
          if (i + 1 < col.length && col[i].value === col[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: col[i].value * 2,
              x,
              y: GRID_SIZE - 1 - newCol.length,
              merged: true,
              isNew: false
            };
            newCol.push(merged);
            scoreGain += merged.value;
            i += 2;
          } else {
            col[i].x = x;
            col[i].y = GRID_SIZE - 1 - newCol.length;
            newCol.push(col[i]);
            i++;
          }
        }
        while (newCol.length < GRID_SIZE) newCol.push(null);
        for (let y = 0; y < GRID_SIZE; y++) {
          board[y][x] = newCol[GRID_SIZE - 1 - y];
        }
      }
    }
    
    const newBoard = JSON.stringify(board);
    if (newBoard !== oldBoard) {
      this.board = board;
      this.score += scoreGain;
      this.tiles = this.getTiles();
      this.updateBestScore();
      
      setTimeout(() => {
        this.addRandomTile();
        
        if (!this.hasWon && !this.keepPlaying) {
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (board[y][x]?.value === 2048) {
                this.hasWon = true;
                this.isMoving = false;
                return;
              }
            }
          }
        }
        
        if (!this.canMove()) {
          this.isGameOver = true;
        }
        this.isMoving = false;
      }, 160);
    } else {
      this.isMoving = false;
    }
  }
  
  canMove() {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!this.board[y][x]) return true;
        if (x < GRID_SIZE - 1 && this.board[y][x]?.value === this.board[y][x + 1]?.value) return true;
        if (y < GRID_SIZE - 1 && this.board[y][x]?.value === this.board[y + 1][x]?.value) return true;
      }
    }
    return false;
  }
  
  updateBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
    }
  }
  
  getTilePosition(x, y) {
    return {
      x: this.boardX + this.cellGap + x * (this.cellSize + this.cellGap),
      y: this.boardY + this.cellGap + y * (this.cellSize + this.cellGap)
    };
  }
  
  getTileStyle(value) {
    const theme = this.isDark ? themes.dark : themes.light;
    return theme.tiles[value] || theme.tiles[2048];
  }
  
  getFontSize(value) {
    if (value < 100) return this.cellSize * 0.4;
    if (value < 1000) return this.cellSize * 0.35;
    return this.cellSize * 0.28;
  }
  
  drawRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  drawBackground() {
    const theme = this.isDark ? themes.dark : themes.light;
    this.ctx.fillStyle = theme.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawTitle() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const titleX = this.boardX;
    const titleY = this.headerY + 40;
    
    const gradient = ctx.createLinearGradient(titleX, titleY - 40, titleX + 150, titleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('2048', titleX, titleY);
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('MACARON & NIGHT', titleX, titleY + 30);
  }
  
  drawScoreCards() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const cardWidth = 100;
    const cardHeight = 60;
    const gap = 20;
    const startX = this.boardX + this.boardSize - cardWidth * 2 - gap;
    const startY = this.headerY + 10;
    
    this.drawScoreCard('SCORE', this.score, startX, startY, cardWidth, cardHeight);
    this.drawScoreCard('BEST', this.bestScore, startX + cardWidth + gap, startY, cardWidth, cardHeight);
  }
  
  drawScoreCard(label, value, x, y, width, height) {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    ctx.fillStyle = theme.scoreCardBg;
    this.drawRoundedRect(x, y, width, height, 8);
    ctx.fill();
    
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, theme.scoreGradient[0]);
    gradient.addColorStop(1, theme.scoreGradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, 4);
    
    ctx.fillStyle = theme.scoreLabel;
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + 18);
    
    ctx.fillStyle = theme.scoreValue;
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(value.toString(), x + width / 2, y + 42);
  }
  
  drawHint() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    ctx.fillStyle = theme.hintText;
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Join the numbers and get to the 2048!', this.boardX + this.boardSize / 2, this.hintY);
  }
  
  drawBoard() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    ctx.fillStyle = theme.boardBg;
    this.drawRoundedRect(this.boardX, this.boardY, this.boardSize, this.boardSize, 12);
    ctx.fill();
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pos = this.getTilePosition(x, y);
        ctx.fillStyle = theme.cellBg;
        this.drawRoundedRect(pos.x, pos.y, this.cellSize, this.cellSize, 8);
        ctx.fill();
      }
    }
  }
  
  drawTiles() {
    const ctx = this.ctx;
    
    for (const tile of this.tiles) {
      if (!tile) continue;
      
      const pos = this.getTilePosition(tile.x, tile.y);
      const style = this.getTileStyle(tile.value);
      const fontSize = this.getFontSize(tile.value);
      
      if (style.glow) {
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = 15;
      }
      
      ctx.fillStyle = style.bg;
      this.drawRoundedRect(pos.x, pos.y, this.cellSize, this.cellSize, 8);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = style.text;
      ctx.font = `bold ${Math.round(fontSize)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tile.value.toString(), pos.x + this.cellSize / 2, pos.y + this.cellSize / 2);
    }
  }
  
  drawActionButtons() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const totalActionWidth = this.newGameBtnWidth + 20 + this.themeBtnSize;
    const actionStartX = this.boardX + (this.boardSize - totalActionWidth) / 2;
    
    const newGameBtnX = actionStartX;
    const newGameBtnY = this.actionY;
    
    ctx.fillStyle = theme.buttonBg;
    this.drawRoundedRect(newGameBtnX, newGameBtnY, this.newGameBtnWidth, this.newGameBtnHeight, 8);
    ctx.fill();
    
    ctx.fillStyle = theme.buttonText;
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW GAME', newGameBtnX + this.newGameBtnWidth / 2, newGameBtnY + this.newGameBtnHeight / 2);
    
    const themeBtnX = actionStartX + this.newGameBtnWidth + 20;
    const themeBtnY = this.actionY;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(themeBtnX, themeBtnY, this.themeBtnSize, this.themeBtnSize, 22);
    ctx.fill();
    
    ctx.font = '20px system-ui';
    ctx.fillText(this.isDark ? '☀️' : '🌙', themeBtnX + this.themeBtnSize / 2, themeBtnY + this.themeBtnSize / 2);
  }
  
  drawOverlay() {
    if (!this.isGameOver && !(this.hasWon && !this.keepPlaying)) return;
    
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    ctx.fillStyle = theme.overlayBg;
    this.drawRoundedRect(this.boardX, this.boardY, this.boardSize, this.boardSize, 12);
    ctx.fill();
    
    const centerX = this.boardX + this.boardSize / 2;
    const centerY = this.boardY + this.boardSize / 2;
    
    let message, subMessage;
    if (this.isGameOver) {
      message = 'Game Over';
      subMessage = `Score: ${this.score}`;
    } else {
      message = 'You Win!';
      subMessage = 'Tap to continue';
    }
    
    const gradient = ctx.createLinearGradient(centerX - 100, centerY - 40, centerX + 100, centerY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - 20);
    
    ctx.fillStyle = theme.scoreLabel;
    ctx.font = '16px system-ui';
    ctx.fillText(subMessage, centerX, centerY + 20);
  }
  
  render() {
    this.drawBackground();
    this.drawTitle();
    this.drawScoreCards();
    this.drawHint();
    this.drawBoard();
    this.drawTiles();
    this.drawActionButtons();
    this.drawOverlay();
  }
  
  gameLoop() {
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

new Game2048();
