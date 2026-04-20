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
    this.dpr = this.systemInfo.pixelRatio || 1;
    this.screenWidth = this.systemInfo.screenWidth;
    this.screenHeight = this.systemInfo.screenHeight;
    
    this.canvas.width = this.screenWidth * this.dpr;
    this.canvas.height = this.screenHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    
    this.isDark = false;
    this.loadTheme();
    this.setupShareMenu();
    
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
  
  rpx(pxValue) {
    return Math.round((pxValue / 750) * this.screenWidth);
  }
  
  calculateDimensions() {
    const screenWidth = this.screenWidth;
    const screenHeight = this.screenHeight;
    
    this.rpxScale = screenWidth / 750;
    
    this.maxGameWidth = this.rpx(700);
    this.maxBoardWidth = this.rpx(640);
    
    this.paddingV = this.rpx(32);
    this.paddingH = this.rpx(40);
    
    this.gameWidth = Math.min(screenWidth - this.paddingH * 2, this.maxGameWidth);
    this.gameX = (screenWidth - this.gameWidth) / 2;
    
    this.boardSize = Math.min(this.gameWidth, this.maxBoardWidth);
    this.boardX = this.gameX + (this.gameWidth - this.boardSize) / 2;
    
    this.cellGap = this.boardSize * 0.025;
    this.cellSize = (this.boardSize - this.cellGap * (GRID_SIZE + 1)) / GRID_SIZE;
    
    this.titleFontSize = this.rpx(88);
    this.subtitleFontSize = this.rpx(20);
    this.scoreLabelFontSize = this.rpx(12);
    this.scoreValueFontSize = this.rpx(28);
    this.hintFontSize = this.rpx(20);
    this.actionBtnFontSize = this.rpx(22);
    
    this.scoreCardPaddingV = this.rpx(16);
    this.scoreCardPaddingH = this.rpx(20);
    this.scoreCardRadius = this.rpx(20);
    this.scoreCardsGap = this.rpx(40);

    this.headerSectionMarginBottom = this.rpx(40);
    this.titleRowMarginBottom = this.rpx(40);
    this.hintMarginBottom = this.rpx(32);
    this.actionSectionMarginTop = this.rpx(44);
    this.actionBtnsGap = this.rpx(24);

    this.newGameBtnWidth = this.rpx(220);
    this.newGameBtnHeight = this.rpx(80);
    this.themeBtnSize = this.rpx(88);

    this.scoreCardWidth = this.rpx(160);
    this.scoreCardHeight = this.rpx(96);
    
    this.boardRadius = this.rpx(20);
    this.cellRadius = this.rpx(12);
    
    const titleHeight = this.titleFontSize + this.subtitleFontSize + this.rpx(16);
    const scoreCardsHeight = this.scoreCardHeight;
    const headerSectionHeight = titleHeight + this.titleRowMarginBottom + scoreCardsHeight;
    
    const hintHeight = this.hintFontSize + this.hintMarginBottom;
    
    const actionSectionHeight = this.newGameBtnHeight;
    
    const totalContentHeight = 
      headerSectionHeight + this.headerSectionMarginBottom +
      hintHeight +
      this.boardSize +
      this.actionSectionMarginTop + actionSectionHeight;
    
    this.gameStartY = (screenHeight - totalContentHeight) / 2;
    
    let currentY = this.gameStartY;
    
    this.titleY = currentY + this.titleFontSize / 2;
    this.subtitleY = this.titleY + this.titleFontSize / 2 + this.rpx(16) + this.subtitleFontSize / 2;
    
    currentY += titleHeight + this.titleRowMarginBottom;
    
    this.scoreCardsY = currentY;
    
    currentY += scoreCardsHeight + this.headerSectionMarginBottom;
    
    this.hintY = currentY + this.hintFontSize / 2;
    currentY += this.hintFontSize + this.hintMarginBottom;
    
    this.boardY = currentY;
    currentY += this.boardSize + this.actionSectionMarginTop;
    
    this.actionY = currentY;
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

  setupShareMenu() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    wx.onShareAppMessage(() => {
      return {
        title: '2048 - 马卡龙与夜晚',
        imageUrl: '',
        query: `score=${this.score}&best=${this.bestScore}`
      };
    });

    wx.onShareTimeline(() => {
      return {
        title: `我的2048得分是${this.score}，最高记录${this.bestScore}！来挑战我吧~`,
        query: `score=${this.score}&best=${this.bestScore}`
      };
    });
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
    const totalActionWidth = this.newGameBtnWidth + this.actionBtnsGap + this.themeBtnSize;
    const actionStartX = this.gameX + (this.gameWidth - totalActionWidth) / 2;
    
    const newGameBtnX = actionStartX;
    const newGameBtnY = this.actionY;
    if (x >= newGameBtnX && x <= newGameBtnX + this.newGameBtnWidth && 
        y >= newGameBtnY && y <= newGameBtnY + this.newGameBtnHeight) {
      this.initGame();
      return;
    }
    
    const themeBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap;
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
      x: Math.round(this.boardX + this.cellGap + x * (this.cellSize + this.cellGap)),
      y: Math.round(this.boardY + this.cellGap + y * (this.cellSize + this.cellGap))
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
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    radius = Math.round(radius);
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
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
  }
  
  drawTitle() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const titleX = this.gameX + this.gameWidth / 2;
    
    const gradient = ctx.createLinearGradient(titleX - this.rpx(100), this.titleY - this.rpx(40), titleX + this.rpx(100), this.titleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.titleFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2048', titleX, this.titleY);
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.subtitleFontSize)}px system-ui`;
    ctx.letterSpacing = `${this.rpx(4)}px`;
    ctx.fillText('MACARON & NIGHT', titleX, this.subtitleY);
  }
  
  drawScoreCards() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const totalWidth = this.scoreCardWidth * 2 + this.scoreCardsGap;
    const startX = this.gameX + (this.gameWidth - totalWidth) / 2;
    
    this.drawScoreCard('SCORE', this.score, startX, this.scoreCardsY, this.scoreCardWidth, this.scoreCardHeight);
    this.drawScoreCard('BEST', this.bestScore, startX + this.scoreCardWidth + this.scoreCardsGap, this.scoreCardsY, this.scoreCardWidth, this.scoreCardHeight);
  }
  
  drawScoreCard(label, value, x, y, width, height) {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = this.isDark ? this.rpx(12) : this.rpx(8);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

    ctx.fillStyle = theme.scoreCardBg;
    this.drawRoundedRect(x, y, width, height, this.scoreCardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const accentWidth = Math.round(width * 0.4);
    const accentX = x + Math.round((width - accentWidth) / 2);
    const accentGradient = ctx.createLinearGradient(accentX, y, accentX + accentWidth, y);
    accentGradient.addColorStop(0, this.isDark ? 'rgba(126, 184, 230, 0.3)' : 'rgba(126, 184, 230, 0.25)');
    accentGradient.addColorStop(0.5, this.isDark ? 'rgba(126, 184, 230, 0.6)' : 'rgba(126, 184, 230, 0.5)');
    accentGradient.addColorStop(1, this.isDark ? 'rgba(126, 184, 230, 0.3)' : 'rgba(126, 184, 230, 0.25)');

    ctx.fillStyle = accentGradient;
    this.drawRoundedRect(accentX, y + this.rpx(8), accentWidth, this.rpx(4), this.rpx(2));
    ctx.fill();

    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `bold ${Math.round(this.scoreLabelFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + this.scoreCardPaddingV + this.scoreLabelFontSize / 2);

    ctx.fillStyle = theme.scoreValue;
    ctx.font = `bold ${Math.round(this.scoreValueFontSize)}px system-ui`;
    ctx.fillText(value.toString(), x + width / 2, y + height - this.scoreCardPaddingV - this.scoreValueFontSize / 2);
  }
  
  drawHint() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    ctx.fillStyle = theme.hintText;
    ctx.font = `${Math.round(this.hintFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Join the numbers and get to the 2048!', this.gameX + this.gameWidth / 2, this.hintY);
  }
  
  drawBoard() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(16) : this.rpx(10);
    ctx.shadowOffsetY = this.isDark ? this.rpx(4) : this.rpx(2);

    ctx.fillStyle = theme.boardBg;
    this.drawRoundedRect(this.boardX, this.boardY, this.boardSize, this.boardSize, this.boardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pos = this.getTilePosition(x, y);
        ctx.fillStyle = theme.cellBg;
        this.drawRoundedRect(pos.x, pos.y, this.cellSize, this.cellSize, this.cellRadius);
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

      ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = this.isDark ? this.rpx(8) : this.rpx(6);
      ctx.shadowOffsetY = this.isDark ? this.rpx(2) : this.rpx(1);

      if (style.glow) {
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = this.isDark ? this.rpx(12) : this.rpx(10);
      }

      ctx.fillStyle = style.bg;
      this.drawRoundedRect(pos.x, pos.y, this.cellSize, this.cellSize, this.cellRadius);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

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

    const totalActionWidth = this.newGameBtnWidth + this.actionBtnsGap + this.themeBtnSize;
    const actionStartX = this.gameX + (this.gameWidth - totalActionWidth) / 2;

    const newGameBtnX = actionStartX;
    const newGameBtnY = this.actionY;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.25)';
    ctx.shadowBlur = this.isDark ? this.rpx(12) : this.rpx(8);
    ctx.shadowOffsetY = this.isDark ? this.rpx(4) : this.rpx(2);

    ctx.fillStyle = theme.buttonBg;
    this.drawRoundedRect(newGameBtnX, newGameBtnY, this.newGameBtnWidth, this.newGameBtnHeight, this.rpx(40));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = theme.buttonText;
    ctx.font = `bold ${Math.round(this.actionBtnFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${this.rpx(2)}px`;
    ctx.fillText('NEW GAME', newGameBtnX + this.newGameBtnWidth / 2, newGameBtnY + this.newGameBtnHeight / 2);

    const themeBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap;
    const themeBtnY = this.actionY;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(themeBtnX, themeBtnY, this.themeBtnSize, this.themeBtnSize, Math.round(this.themeBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${Math.round(this.rpx(32))}px system-ui`;
    ctx.fillText(this.isDark ? '☀️' : '🌙', themeBtnX + Math.round(this.themeBtnSize / 2), themeBtnY + Math.round(this.themeBtnSize / 2));
  }
  
  drawOverlay() {
    if (!this.isGameOver && !(this.hasWon && !this.keepPlaying)) return;

    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = this.isDark ? this.rpx(20) : this.rpx(12);
    ctx.shadowOffsetY = this.isDark ? this.rpx(6) : this.rpx(3);

    ctx.fillStyle = theme.overlayBg;
    this.drawRoundedRect(this.boardX, this.boardY, this.boardSize, this.boardSize, this.boardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

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

    const gradient = ctx.createLinearGradient(centerX - this.rpx(100), centerY - this.rpx(40), centerX + this.rpx(100), centerY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);

    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.rpx(36))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - this.rpx(20));

    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `${Math.round(this.rpx(16))}px system-ui`;
    ctx.fillText(subMessage, centerX, centerY + this.rpx(20));
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
