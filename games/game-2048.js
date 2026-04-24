const { SCENE, GAME_TYPE_MAP } = require('../common/constants');
const { getTheme } = require('../common/themes');
const { getModeById, getModesByGameType } = require('../mode-config');
const { canBoardMove, createEmptyBoard } = require('../game-logic');
const { loadBestScore, saveBestScore, loadSaveState, saveSaveState, hasSaveState, loadAllModesInfo } = require('../storage');
const { ensureLogin } = require('../api/auth');
const { submitScore } = require('../api/leaderboard');

class Game2048 {
  constructor(baseGame) {
    this.base = baseGame;
    this.ctx = baseGame.ctx;
    
    this.currentMode = null;
    this.board = [];
    this.score = 0;
    this.bestScore = 0;
    this.isGameOver = false;
    this.tiles = [];
    this.tileId = 0;
    
    this.animatingTiles = [];
    this.isAnimating = false;
    this.isMoving = false;
  }
  
  get gridSize() {
    return this.currentMode ? this.currentMode.gridSize : 4;
  }
  
  get cellSize() {
    return (this.base.boardSize - this.base.cellGap * (this.gridSize + 1)) / this.gridSize;
  }
  
  init2048ModeSelect() {
    this.base.currentScene = SCENE.HOME_2048_MODE;
    this.recalculate2048ModeLayout();
  }
  
  recalculate2048ModeLayout() {
    const modes = getModesByGameType('2048');
    const totalCardsHeight = modes.length * this.base.cardHeight + (modes.length - 1) * this.base.cardGap;
    const headerHeight = this.base.titleFontSize + this.base.subtitleFontSize + this.base.rpx(16) + this.base.rpx(60);
    
    const totalContentHeight = headerHeight + totalCardsHeight;
    const startY = (this.base.screenHeight - totalContentHeight) / 2;
    
    let currentY = startY;
    
    this.base.homeTitleY = currentY + this.base.titleFontSize / 2;
    this.base.homeSubtitleY = this.base.homeTitleY + this.base.titleFontSize / 2 + this.base.rpx(16) + this.base.subtitleFontSize / 2;
    
    currentY += headerHeight;
    
    this.base.modeCards = modes.map((mode, index) => {
      const card = {
        ...mode,
        x: this.base.gameX + (this.base.gameWidth - this.base.cardWidth) / 2,
        y: currentY + index * (this.base.cardHeight + this.base.cardGap),
        width: this.base.cardWidth,
        height: this.base.cardHeight
      };
      return card;
    });
  }
  
  enterMode(modeId) {
    this.currentMode = getModeById(modeId);
    this.base.calculateDimensions();
    
    const savedState = loadSaveState(modeId);
    
    if (savedState) {
      this.board = savedState.board;
      this.score = savedState.score;
      this.isGameOver = savedState.isGameOver || false;
      this.tileId = savedState.tileId || 0;
      this.tiles = this.getTiles();
    } else {
      this.initGame();
    }
    
    this.bestScore = loadBestScore(modeId);
    this.base.currentScene = SCENE.GAME_2048;
    this.recalculateGameLayout();
  }
  
  initGame() {
    this.board = createEmptyBoard(this.gridSize);
    this.score = 0;
    this.isGameOver = false;
    this.tiles = [];
    this.tileId = 0;
    this.animatingTiles = [];
    this.isAnimating = false;
    
    if (this.currentMode) {
      this.bestScore = loadBestScore(this.currentMode.id);
    }
    
    this.addRandomTile();
    this.addRandomTile();
    this.recalculateGameLayout();
  }
  
  recalculateGameLayout() {
    const base = this.base;
    const titleHeight = base.titleFontSize + base.subtitleFontSize + base.rpx(16);
    const scoreCardsHeight = base.scoreCardHeight;
    const headerSectionHeight = titleHeight + base.titleRowMarginBottom + scoreCardsHeight;
    
    const hintHeight = base.hintFontSize + base.hintMarginBottom;
    
    const actionSectionHeight = base.newGameBtnHeight;
    
    const totalContentHeight = 
      headerSectionHeight + base.headerSectionMarginBottom +
      hintHeight +
      base.boardSize +
      base.actionSectionMarginTop + actionSectionHeight;
    
    base.gameStartY = (base.screenHeight - totalContentHeight) / 2;
    
    let currentY = base.gameStartY;
    
    base.titleY = currentY + base.titleFontSize / 2;
    base.subtitleY = base.titleY + base.titleFontSize / 2 + base.rpx(16) + base.subtitleFontSize / 2;
    
    currentY += titleHeight + base.titleRowMarginBottom;
    
    base.scoreCardsY = currentY;
    
    currentY += scoreCardsHeight + base.headerSectionMarginBottom;
    
    base.hintY = currentY + base.hintFontSize / 2;
    currentY += base.hintFontSize + base.hintMarginBottom;
    
    base.boardY = currentY;
    currentY += base.boardSize + base.actionSectionMarginTop;
    
    base.actionY = currentY;
  }
  
  addRandomTile() {
    const emptyCells = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
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
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const tile = this.board[y]?.[x];
        if (tile) {
          result.push({ ...tile, x, y });
        }
      }
    }
    return result;
  }
  
  moveInDirection(direction) {
    if (this.isGameOver) return;
    if (this.isMoving) return;
    
    this.isMoving = true;
    
    const board = JSON.parse(JSON.stringify(this.board));
    let scoreGain = 0;
    
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (board[y][x]) {
          board[y][x].merged = false;
          board[y][x].isNew = false;
        }
      }
    }
    
    const oldBoard = JSON.stringify(board);
    
    if (direction === 'left') {
      for (let y = 0; y < this.gridSize; y++) {
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
        while (newRow.length < this.gridSize) newRow.push(null);
        board[y] = newRow;
      }
    } else if (direction === 'right') {
      for (let y = 0; y < this.gridSize; y++) {
        const row = board[y].filter(t => t !== null).reverse();
        const newRow = [];
        let i = 0;
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: row[i].value * 2,
              x: this.gridSize - 1 - newRow.length,
              y,
              merged: true,
              isNew: false
            };
            newRow.push(merged);
            scoreGain += merged.value;
            i += 2;
          } else {
            row[i].x = this.gridSize - 1 - newRow.length;
            row[i].y = y;
            newRow.push(row[i]);
            i++;
          }
        }
        while (newRow.length < this.gridSize) newRow.push(null);
        board[y] = newRow.reverse();
      }
    } else if (direction === 'up') {
      for (let x = 0; x < this.gridSize; x++) {
        const col = [];
        for (let y = 0; y < this.gridSize; y++) {
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
        while (newCol.length < this.gridSize) newCol.push(null);
        for (let y = 0; y < this.gridSize; y++) {
          board[y][x] = newCol[y];
        }
      }
    } else if (direction === 'down') {
      for (let x = 0; x < this.gridSize; x++) {
        const col = [];
        for (let y = this.gridSize - 1; y >= 0; y--) {
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
              y: this.gridSize - 1 - newCol.length,
              merged: true,
              isNew: false
            };
            newCol.push(merged);
            scoreGain += merged.value;
            i += 2;
          } else {
            col[i].x = x;
            col[i].y = this.gridSize - 1 - newCol.length;
            newCol.push(col[i]);
            i++;
          }
        }
        while (newCol.length < this.gridSize) newCol.push(null);
        for (let y = 0; y < this.gridSize; y++) {
          board[y][x] = newCol[this.gridSize - 1 - y];
        }
      }
    }
    
    const newBoard = JSON.stringify(board);
    if (newBoard !== oldBoard) {
      this.board = board;
      this.score += scoreGain;
      this.tiles = this.getTiles();
      this.updateBestScore();
      
      if (scoreGain > 0) {
        this.base.soundManager.play2048Merge();
      }
      
      setTimeout(() => {
        this.addRandomTile();
        this.saveCurrentState();

        if (!this.canMove()) {
          this.isGameOver = true;
          this.base.soundManager.play2048GameOver();
          this.submitScoreToServer();
        }
        this.isMoving = false;
      }, 160);
    } else {
      this.isMoving = false;
    }
  }
  
  canMove() {
    return canBoardMove(this.board);
  }
  
  updateBestScore() {
    if (this.currentMode && this.score > this.bestScore) {
      this.bestScore = this.score;
      saveBestScore(this.currentMode.id, this.bestScore);
    }
  }
  
  saveCurrentState() {
    if (this.currentMode && this.board.length > 0) {
      saveSaveState(this.currentMode.id, {
        board: this.board,
        score: this.score,
        isGameOver: this.isGameOver,
        tileId: this.tileId
      });
    }
  }

  submitScoreToServer() {
    if (!this.currentMode) return;
    const gameType = GAME_TYPE_MAP[this.currentMode.id];
    if (!gameType) return;

    const currentScore = this.score;
    console.log('Submitting score to server:', currentScore, 'gameType:', gameType);

    ensureLogin().then(() => {
      return submitScore(gameType, currentScore);
    }).then((result) => {
      if (result.success) {
        console.log('Score submitted. Best: ' + result.bestScore + ', Rank: ' + result.rank);
      }
    }).catch((err) => {
      console.error('Failed to submit score:', err);
    });
  }
  
  getTilePosition(x, y) {
    return {
      x: Math.round(this.base.boardX + this.base.cellGap + x * (this.cellSize + this.base.cellGap)),
      y: Math.round(this.base.boardY + this.base.cellGap + y * (this.cellSize + this.base.cellGap))
    };
  }
  
  getTileStyle(value) {
    const theme = getTheme(this.base.isDark);
    return theme.tiles[value] || theme.tiles[2048];
  }
  
  getFontSize(value) {
    if (value < 100) return this.cellSize * 0.4;
    if (value < 1000) return this.cellSize * 0.35;
    return this.cellSize * 0.28;
  }
  
  drawTitle() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const titleX = this.base.gameX + this.base.gameWidth / 2;
    
    const gradient = ctx.createLinearGradient(titleX - this.base.rpx(100), this.base.titleY - this.base.rpx(40), titleX + this.base.rpx(100), this.base.titleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.titleFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2048', titleX, this.base.titleY);
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.base.subtitleFontSize)}px system-ui`;
    ctx.letterSpacing = `${this.base.rpx(4)}px`;
    ctx.fillText('MACARON & NIGHT', titleX, this.base.subtitleY);
  }
  
  drawScoreCards() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const totalWidth = this.base.scoreCardWidth * 2 + this.base.scoreCardsGap;
    const startX = this.base.gameX + (this.base.gameWidth - totalWidth) / 2;
    
    this.drawScoreCard('SCORE', this.score, startX, this.base.scoreCardsY, this.base.scoreCardWidth, this.base.scoreCardHeight);
    this.drawScoreCard('BEST', this.bestScore, startX + this.base.scoreCardWidth + this.base.scoreCardsGap, this.base.scoreCardsY, this.base.scoreCardWidth, this.base.scoreCardHeight);
  }
  
  drawScoreCard(label, value, x, y, width, height) {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(12) : this.base.rpx(8);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(3) : this.base.rpx(2);

    ctx.fillStyle = theme.scoreCardBg;
    this.base.drawRoundedRect(x, y, width, height, this.base.scoreCardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const accentWidth = Math.round(width * 0.4);
    const accentX = x + Math.round((width - accentWidth) / 2);
    const accentGradient = ctx.createLinearGradient(accentX, y, accentX + accentWidth, y);
    accentGradient.addColorStop(0, this.base.isDark ? 'rgba(126, 184, 230, 0.3)' : 'rgba(126, 184, 230, 0.25)');
    accentGradient.addColorStop(0.5, this.base.isDark ? 'rgba(126, 184, 230, 0.6)' : 'rgba(126, 184, 230, 0.5)');
    accentGradient.addColorStop(1, this.base.isDark ? 'rgba(126, 184, 230, 0.3)' : 'rgba(126, 184, 230, 0.25)');

    ctx.fillStyle = accentGradient;
    this.base.drawRoundedRect(accentX, y + this.base.rpx(8), accentWidth, this.base.rpx(4), this.base.rpx(2));
    ctx.fill();

    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `bold ${Math.round(this.base.scoreLabelFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + this.base.scoreCardPaddingV + this.base.scoreLabelFontSize / 2);

    ctx.fillStyle = theme.scoreValue;
    ctx.font = `bold ${Math.round(this.base.scoreValueFontSize)}px system-ui`;
    ctx.fillText(value.toString(), x + width / 2, y + height - this.base.scoreCardPaddingV - this.base.scoreValueFontSize / 2);
  }
  
  drawHint() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const targetText = this.currentMode ? 
      `Join the numbers and get to the ${this.currentMode.targetTile}!` :
      'Join the numbers and get to the 2048!';
    
    ctx.fillStyle = theme.hintText;
    ctx.font = `${Math.round(this.base.hintFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(targetText, this.base.gameX + this.base.gameWidth / 2, this.base.hintY);
  }
  
  drawBoard() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(16) : this.base.rpx(10);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(4) : this.base.rpx(2);

    ctx.fillStyle = theme.boardBg;
    this.base.drawRoundedRect(this.base.boardX, this.base.boardY, this.base.boardSize, this.base.boardSize, this.base.boardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const pos = this.getTilePosition(x, y);
        ctx.fillStyle = theme.cellBg;
        this.base.drawRoundedRect(pos.x, pos.y, this.cellSize, this.cellSize, this.base.cellRadius);
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

      ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = this.base.isDark ? this.base.rpx(8) : this.base.rpx(6);
      ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(2) : this.base.rpx(1);

      if (style.glow) {
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = this.base.isDark ? this.base.rpx(12) : this.base.rpx(10);
      }

      ctx.fillStyle = style.bg;
      this.base.drawRoundedRect(pos.x, pos.y, this.cellSize, this.cellSize, this.base.cellRadius);
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
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;

    const totalActionWidth = this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap + this.base.soundBtnSize + this.base.actionBtnsGap + this.base.themeBtnSize;
    const actionStartX = this.base.gameX + (this.base.gameWidth - totalActionWidth) / 2;

    const newGameBtnX = actionStartX;
    const newGameBtnY = this.base.actionY;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.25)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(12) : this.base.rpx(8);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(4) : this.base.rpx(2);

    ctx.fillStyle = theme.buttonBg;
    this.base.drawRoundedRect(newGameBtnX, newGameBtnY, this.base.newGameBtnWidth, this.base.newGameBtnHeight, this.base.rpx(40));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = theme.buttonText;
    ctx.font = `bold ${Math.round(this.base.actionBtnFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${this.base.rpx(2)}px`;
    ctx.fillText('NEW GAME', newGameBtnX + this.base.newGameBtnWidth / 2, newGameBtnY + this.base.newGameBtnHeight / 2);

    const homeBtnX = actionStartX + this.base.newGameBtnWidth + this.base.actionBtnsGap;
    const homeBtnY = this.base.actionY;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(10) : this.base.rpx(6);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(3) : this.base.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(homeBtnX, homeBtnY, this.base.homeBtnSize, this.base.homeBtnSize, Math.round(this.base.homeBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${Math.round(this.base.rpx(28))}px system-ui`;
    ctx.fillText('🏠', homeBtnX + Math.round(this.base.homeBtnSize / 2), homeBtnY + Math.round(this.base.homeBtnSize / 2));

    const soundBtnX = actionStartX + this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap;
    const soundBtnY = this.base.actionY;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(10) : this.base.rpx(6);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(3) : this.base.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(soundBtnX, soundBtnY, this.base.soundBtnSize, this.base.soundBtnSize, Math.round(this.base.soundBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${Math.round(this.base.rpx(30))}px system-ui`;
    const soundIcon = this.base.soundManager.isEnabled() ? '🔊' : '🔇';
    ctx.fillText(soundIcon, soundBtnX + Math.round(this.base.soundBtnSize / 2), soundBtnY + Math.round(this.base.soundBtnSize / 2));

    const themeBtnX = actionStartX + this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap + this.base.soundBtnSize + this.base.actionBtnsGap;
    const themeBtnY = this.base.actionY;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(10) : this.base.rpx(6);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(3) : this.base.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(themeBtnX, themeBtnY, this.base.themeBtnSize, this.base.themeBtnSize, Math.round(this.base.themeBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${Math.round(this.base.rpx(32))}px system-ui`;
    ctx.fillText(this.base.isDark ? '☀️' : '🌙', themeBtnX + Math.round(this.base.themeBtnSize / 2), themeBtnY + Math.round(this.base.themeBtnSize / 2));
  }
  
  drawOverlay() {
    if (!this.isGameOver) return;

    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;

    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(20) : this.base.rpx(12);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(6) : this.base.rpx(3);

    ctx.fillStyle = theme.overlayBg;
    this.base.drawRoundedRect(this.base.boardX, this.base.boardY, this.base.boardSize, this.base.boardSize, this.base.boardRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const centerX = this.base.boardX + this.base.boardSize / 2;
    const centerY = this.base.boardY + this.base.boardSize / 2;

    const message = 'Game Over';
    const subMessage = `Score: ${this.score}`;

    const gradient = ctx.createLinearGradient(centerX - this.base.rpx(100), centerY - this.base.rpx(40), centerX + this.base.rpx(100), centerY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);

    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.rpx(36))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - this.base.rpx(20));

    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `${Math.round(this.base.rpx(16))}px system-ui`;
    ctx.fillText(subMessage, centerX, centerY + this.base.rpx(20));
  }
  
  render2048ModeSelect() {
    this.base.drawBackground();
    this.base.drawBackButton();
    this.base.drawHomeTitle();
    this.base.drawModeCards();
  }
  
  render2048Game() {
    this.base.drawBackground();
    this.drawTitle();
    this.drawScoreCards();
    this.drawHint();
    this.drawBoard();
    this.drawTiles();
    this.drawActionButtons();
    this.drawOverlay();
  }
  
  handleTouchEnd(e) {
    if (this.base.currentScene === SCENE.GAME_2048) {
      if (this.isGameOver) return;
      if (!this.base.touchStartX || !this.base.touchStartY) return;
      
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      
      const dx = touchEndX - this.base.touchStartX;
      const dy = touchEndY - this.base.touchStartY;
      
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
    }
  }
  
  checkButtonClick(x, y) {
    let buttonClicked = false;
    
    if (this.base.currentScene === SCENE.GAME_2048) {
      const totalActionWidth = this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap + this.base.soundBtnSize + this.base.actionBtnsGap + this.base.themeBtnSize;
      const actionStartX = this.base.gameX + (this.base.gameWidth - totalActionWidth) / 2;
      
      const newGameBtnX = actionStartX;
      const newGameBtnY = this.base.actionY;
      if (x >= newGameBtnX && x <= newGameBtnX + this.base.newGameBtnWidth && 
          y >= newGameBtnY && y <= newGameBtnY + this.base.newGameBtnHeight) {
        this.initGame();
        buttonClicked = true;
      }
      
      if (!buttonClicked) {
        const homeBtnX = actionStartX + this.base.newGameBtnWidth + this.base.actionBtnsGap;
        const homeBtnY = this.base.actionY;
        if (x >= homeBtnX && x <= homeBtnX + this.base.homeBtnSize && 
            y >= homeBtnY && y <= homeBtnY + this.base.homeBtnSize) {
          this.base.goBackHome();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        const soundBtnX = actionStartX + this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap;
        const soundBtnY = this.base.actionY;
        if (x >= soundBtnX && x <= soundBtnX + this.base.soundBtnSize && 
            y >= soundBtnY && y <= soundBtnY + this.base.soundBtnSize) {
          this.base.soundManager.toggle();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        const themeBtnX = actionStartX + this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap + this.base.soundBtnSize + this.base.actionBtnsGap;
        const themeBtnY = this.base.actionY;
        if (x >= themeBtnX && x <= themeBtnX + this.base.themeBtnSize && 
            y >= themeBtnY && y <= themeBtnY + this.base.themeBtnSize) {
          this.base.isDark = !this.base.isDark;
          this.base.saveTheme();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        if (this.isGameOver &&
            x >= this.base.boardX && x <= this.base.boardX + this.base.boardSize &&
            y >= this.base.boardY && y <= this.base.boardY + this.base.boardSize) {
          this.initGame();
          buttonClicked = true;
        }
      }
    }
    
    return buttonClicked;
  }
}

module.exports = {
  Game2048
};
