const { SCENE } = require('../common/constants');
const { getTheme } = require('../common/themes');
const { POPSTAR_GRID_SIZE, getColorCount, createBoard, findConnected, hasValidMoves, calculateScore, calculateBonus, getTargetScore, countRemainingStars, isBoardFull, processElimination } = require('../popstar-logic');
const { loadPopstarBestScore, savePopstarBestScore, loadPopstarSaveState, savePopstarSaveState, clearPopstarSaveState, hasPopstarSaveState } = require('../storage');
const { ensureLogin } = require('../api/auth');
const { submitScore } = require('../api/leaderboard');

class GamePopstar {
  constructor(baseGame) {
    this.base = baseGame;
    this.ctx = baseGame.ctx;
    
    this.popstarBoard = [];
    this.popstarScore = 0;
    this.popstarTotalScore = 0;
    this.popstarLevel = 1;
    this.popstarTargetScore = 1000;
    this.popstarBestScore = 0;
    this.popstarIsGameOver = false;
    this.popstarIsLevelClear = false;
    this.popstarHighlighted = new Set();
    
    this.popstarConfirmContinueBtn = null;
    this.popstarConfirmNewBtn = null;
    this.popstarConfirmBackBtn = null;
  }
  
  get popstarGridSize() {
    return POPSTAR_GRID_SIZE;
  }
  
  get popstarCellSize() {
    return (this.base.boardSize - this.base.popstarCellGap * (this.popstarGridSize + 1)) / this.popstarGridSize;
  }
  
  initPopstarConfirm() {
    this.base.currentScene = SCENE.POPSTAR_CONFIRM;
    const savedState = loadPopstarSaveState();
    if (savedState) {
      this.popstarLevel = savedState.level || 1;
      this.popstarScore = savedState.score || 0;
    }
  }
  
  enterPopstarGame() {
    const savedState = loadPopstarSaveState();
    
    if (savedState) {
      this.popstarBoard = savedState.board;
      this.popstarScore = savedState.score;
      this.popstarTotalScore = savedState.totalScore || 0;
      this.popstarLevel = savedState.level || 1;
      this.popstarTargetScore = savedState.targetScore || 1000;
      this.popstarIsGameOver = savedState.isGameOver || false;
      this.popstarIsLevelClear = savedState.isLevelClear || false;
    } else {
      this.initPopstarGame();
    }
    
    this.popstarBestScore = loadPopstarBestScore();
    this.base.currentScene = SCENE.GAME_POPSTAR;
  }
  
  startNewPopstarGame() {
    clearPopstarSaveState();
    this.initPopstarGame();
    this.base.currentScene = SCENE.GAME_POPSTAR;
  }
  
  createFullPopstarBoard(colorCount) {
    let board;
    let attempts = 0;
    do {
      board = createBoard(colorCount);
      attempts++;
    } while (!isBoardFull(board) && attempts < 10);
    return board;
  }
  
  initPopstarGame() {
    this.popstarLevel = 1;
    const colorCount = getColorCount(this.popstarLevel);
    this.popstarBoard = this.createFullPopstarBoard(colorCount);
    this.popstarScore = 0;
    this.popstarTotalScore = 0;
    this.popstarTargetScore = getTargetScore(this.popstarLevel);
    this.popstarIsGameOver = false;
    this.popstarIsLevelClear = false;
    this.popstarHighlighted = new Set();
    this.popstarBestScore = loadPopstarBestScore();
  }
  
  nextPopstarLevel() {
    this.popstarLevel++;
    const colorCount = getColorCount(this.popstarLevel);
    this.popstarScore = 0;
    this.popstarTargetScore = getTargetScore(this.popstarLevel);
    this.popstarBoard = this.createFullPopstarBoard(colorCount);
    this.popstarIsGameOver = false;
    this.popstarIsLevelClear = false;
    this.popstarHighlighted = new Set();
  }
  
  restartCurrentPopstarLevel() {
    const colorCount = getColorCount(this.popstarLevel);
    this.popstarScore = 0;
    this.popstarTargetScore = getTargetScore(this.popstarLevel);
    this.popstarBoard = this.createFullPopstarBoard(colorCount);
    this.popstarIsGameOver = false;
    this.popstarIsLevelClear = false;
    this.popstarHighlighted = new Set();
  }
  
  savePopstarCurrentState() {
    if (this.popstarBoard.length > 0) {
      savePopstarSaveState({
        board: this.popstarBoard,
        score: this.popstarScore,
        totalScore: this.popstarTotalScore,
        level: this.popstarLevel,
        targetScore: this.popstarTargetScore,
        isGameOver: this.popstarIsGameOver,
        isLevelClear: this.popstarIsLevelClear
      });
    }
  }

  submitScoreToServer() {
    const currentScore = this.popstarTotalScore;
    console.log('Submitting popstar score to server:', currentScore);

    ensureLogin().then(() => {
      return submitScore('popstar', currentScore);
    }).then((result) => {
      if (result.success) {
        console.log('Popstar score submitted. Best: ' + result.bestScore + ', Rank: ' + result.rank);
      }
    }).catch((err) => {
      console.error('Failed to submit popstar score:', err);
    });
  }
  
  handlePopstarTouchStart(x, y) {
    const cellX = Math.floor((x - this.base.boardX - this.base.popstarCellGap) / (this.popstarCellSize + this.base.popstarCellGap));
    const cellY = Math.floor((y - this.base.boardY - this.base.popstarCellGap) / (this.popstarCellSize + this.base.popstarCellGap));
    
    if (cellX >= 0 && cellX < this.popstarGridSize && cellY >= 0 && cellY < this.popstarGridSize) {
      if (this.popstarBoard[cellY][cellX] !== null) {
        const connected = findConnected(this.popstarBoard, cellY, cellX);
        if (connected.size >= 2) {
          this.popstarHighlighted = connected;
        } else {
          this.popstarHighlighted = new Set();
          this.base.soundManager.playTap();
        }
      }
    }
  }
  
  handlePopstarTouchEnd(x, y) {
    if (this.popstarHighlighted.size > 0) {
      const cellX = Math.floor((x - this.base.boardX - this.base.popstarCellGap) / (this.popstarCellSize + this.base.popstarCellGap));
      const cellY = Math.floor((y - this.base.boardY - this.base.popstarCellGap) / (this.popstarCellSize + this.base.popstarCellGap));
      
      let isInHighlighted = false;
      for (const pos of this.popstarHighlighted) {
        if (pos.row === cellY && pos.col === cellX) {
          isInHighlighted = true;
          break;
        }
      }
      
      if (isInHighlighted) {
        this.eliminatePopstarStars(this.popstarHighlighted);
      }
    }
    this.popstarHighlighted = new Set();
  }
  
  eliminatePopstarStars(positions) {
    const count = positions.size;
    const scoreGain = calculateScore(count);
    
    this.base.soundManager.playElimination(count);
    
    this.popstarScore += scoreGain;
    this.popstarTotalScore += scoreGain;
    
    if (this.popstarScore > this.popstarBestScore) {
      this.popstarBestScore = this.popstarScore;
      savePopstarBestScore(this.popstarBestScore);
    }
    
    this.popstarBoard = processElimination(this.popstarBoard, positions);
    
    this.base.soundManager.playFall();
    
    this.savePopstarCurrentState();
    
    if (!hasValidMoves(this.popstarBoard)) {
      const remaining = countRemainingStars(this.popstarBoard);
      const bonus = calculateBonus(remaining);
      
      if (bonus > 0) {
        this.popstarScore += bonus;
        this.popstarTotalScore += bonus;
      }
      
      if (this.popstarScore >= this.popstarTargetScore) {
        this.popstarIsLevelClear = true;
        this.base.soundManager.playLevelClear();
      } else {
        this.popstarIsGameOver = true;
        this.base.soundManager.playPopstarGameOver();
        this.submitScoreToServer();
      }
      
      this.savePopstarCurrentState();
    }
  }
  
  getPopstarStarPosition(row, col) {
    const cellSize = this.popstarCellSize;
    const gap = this.base.popstarCellGap;
    return {
      x: Math.round(this.base.boardX + gap + col * (cellSize + gap)),
      y: Math.round(this.base.boardY + gap + row * (cellSize + gap))
    };
  }
  
  getPopstarStarStyle(colorIndex) {
    const theme = getTheme(this.base.isDark);
    return theme.popstarStars[colorIndex] || theme.popstarStars[0];
  }
  
  drawRoundedStarPath(ctx, cx, cy, outerRadius, innerRadius, outerCornerRadius, innerCornerRadius) {
    const points = 5;
    const step = Math.PI / points;
    let rotation = -Math.PI / 2;
    
    const vertices = [];
    for (let i = 0; i < points * 2; i++) {
      const isOuter = i % 2 === 0;
      const radius = isOuter ? outerRadius : innerRadius;
      const x = cx + Math.cos(rotation) * radius;
      const y = cy + Math.sin(rotation) * radius;
      vertices.push({ x, y, isOuter });
      rotation += step;
    }
    
    ctx.beginPath();
    
    for (let i = 0; i < vertices.length; i++) {
      const prevIndex = (i - 1 + vertices.length) % vertices.length;
      const currIndex = i;
      const nextIndex = (i + 1) % vertices.length;
      
      const prev = vertices[prevIndex];
      const curr = vertices[currIndex];
      const next = vertices[nextIndex];
      
      const cornerRadius = curr.isOuter ? outerCornerRadius : innerCornerRadius;
      
      if (cornerRadius <= 0) {
        if (i === 0) {
          ctx.moveTo(curr.x, curr.y);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
        continue;
      }
      
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      const dx2 = curr.x - next.x;
      const dy2 = curr.y - next.y;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      const maxRadius = Math.min(len1, len2) * 0.4;
      const actualRadius = Math.min(cornerRadius, maxRadius);
      
      if (actualRadius <= 0) {
        if (i === 0) {
          ctx.moveTo(curr.x, curr.y);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
        continue;
      }
      
      const t1 = actualRadius / len1;
      const startX = curr.x - dx1 * t1;
      const startY = curr.y - dy1 * t1;
      
      const t2 = actualRadius / len2;
      const endX = curr.x - dx2 * t2;
      const endY = curr.y - dy2 * t2;
      
      if (i === 0) {
        ctx.moveTo(startX, startY);
      } else {
        ctx.lineTo(startX, startY);
      }
      
      ctx.quadraticCurveTo(curr.x, curr.y, endX, endY);
    }
    
    ctx.closePath();
  }
  
  drawPopstarTitle() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const titleX = this.base.gameX + this.base.gameWidth / 2;
    
    const gradient = ctx.createLinearGradient(titleX - this.base.rpx(100), this.base.titleY - this.base.rpx(40), titleX + this.base.rpx(100), this.base.titleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.titleFontSize * 0.8)}px system-ui`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('POPSTAR', this.base.gameX, this.base.titleY);
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `bold ${Math.round(this.base.titleFontSize * 0.5)}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${this.popstarLevel}`, this.base.gameX + this.base.gameWidth, this.base.titleY);
  }
  
  drawPopstarScoreCards() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const totalWidth = this.base.scoreCardWidth * 2 + this.base.scoreCardsGap;
    const startX = this.base.gameX + (this.base.gameWidth - totalWidth) / 2;
    
    this.drawScoreCard('SCORE', this.popstarScore, startX, this.base.scoreCardsY, this.base.scoreCardWidth, this.base.scoreCardHeight);
    this.drawScoreCard('TARGET', this.popstarTargetScore, startX + this.base.scoreCardWidth + this.base.scoreCardsGap, this.base.scoreCardsY, this.base.scoreCardWidth, this.base.scoreCardHeight);
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
  
  drawPopstarBoard() {
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
  }
  
  drawPopstarStars() {
    const ctx = this.ctx;
    const cellSize = this.popstarCellSize;
    const gap = this.base.popstarCellGap;
    const radius = this.base.popstarCellRadius;

    for (let row = 0; row < this.popstarGridSize; row++) {
      for (let col = 0; col < this.popstarGridSize; col++) {
        const colorIndex = this.popstarBoard[row][col];
        if (colorIndex === null) continue;

        const pos = this.getPopstarStarPosition(row, col);
        const style = this.getPopstarStarStyle(colorIndex);
        
        let isHighlighted = false;
        for (const hPos of this.popstarHighlighted) {
          if (hPos.row === row && hPos.col === col) {
            isHighlighted = true;
            break;
          }
        }

        const scale = isHighlighted ? 1.12 : 1;
        const starCenterX = pos.x + cellSize / 2;
        const starCenterY = pos.y + cellSize / 2;
        const starOuterRadius = cellSize * 0.44 * scale;
        const starInnerRadius = cellSize * 0.22 * scale;
        const outerCornerRadius = cellSize * 0.06 * scale;
        const innerCornerRadius = cellSize * 0.03 * scale;

        ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = this.base.isDark ? this.base.rpx(10) : this.base.rpx(8);
        ctx.shadowOffsetX = this.base.isDark ? this.base.rpx(2) : this.base.rpx(1);
        ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(3) : this.base.rpx(2);

        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.base.isDark ? this.base.rpx(28) : this.base.rpx(22);
        }

        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + cellSize);
        gradient.addColorStop(0, style.bg);
        gradient.addColorStop(1, style.bgEnd);
        ctx.fillStyle = gradient;
        this.base.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (isHighlighted) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          this.base.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
          ctx.fill();
        }

        ctx.fillStyle = style.highlight;
        ctx.beginPath();
        const hlHeight = cellSize * 0.45;
        ctx.moveTo(pos.x + radius, pos.y);
        ctx.lineTo(pos.x + cellSize - radius, pos.y);
        ctx.quadraticCurveTo(pos.x + cellSize, pos.y, pos.x + cellSize, pos.y + radius);
        ctx.lineTo(pos.x + cellSize, pos.y + hlHeight);
        ctx.lineTo(pos.x, pos.y + hlHeight);
        ctx.lineTo(pos.x, pos.y + radius);
        ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        
        const starDropShadowColor = style.starShadow || (this.base.isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.55)');
        
        const starBaseGradient = ctx.createLinearGradient(
          starCenterX - starOuterRadius * 0.6,
          starCenterY - starOuterRadius * 0.6,
          starCenterX + starOuterRadius * 0.4,
          starCenterY + starOuterRadius * 0.4
        );
        starBaseGradient.addColorStop(0, style.starBg || style.bg);
        starBaseGradient.addColorStop(0.5, style.starBgEnd || style.bgEnd);
        starBaseGradient.addColorStop(1, style.bgEnd);
        
        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.base.rpx(32);
          ctx.shadowOffsetX = this.base.rpx(5);
          ctx.shadowOffsetY = this.base.rpx(14);
        } else {
          ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.18)';
          ctx.shadowBlur = this.base.rpx(22);
          ctx.shadowOffsetX = this.base.rpx(4);
          ctx.shadowOffsetY = this.base.rpx(10);
        }
        
        this.drawRoundedStarPath(ctx, starCenterX, starCenterY, starOuterRadius, starInnerRadius, outerCornerRadius, innerCornerRadius);
        ctx.fillStyle = starBaseGradient;
        ctx.fill();
        
        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.base.rpx(14);
          ctx.shadowOffsetX = this.base.rpx(3);
          ctx.shadowOffsetY = this.base.rpx(6);
        } else {
          ctx.shadowColor = starDropShadowColor;
          ctx.shadowBlur = this.base.rpx(10);
          ctx.shadowOffsetX = this.base.rpx(2);
          ctx.shadowOffsetY = this.base.rpx(4);
        }
        
        this.drawRoundedStarPath(ctx, starCenterX, starCenterY, starOuterRadius, starInnerRadius, outerCornerRadius, innerCornerRadius);
        ctx.fillStyle = starBaseGradient;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.globalCompositeOperation = 'source-atop';
        
        const innerHighlightGradient = ctx.createLinearGradient(
          starCenterX - starOuterRadius * 0.9,
          starCenterY - starOuterRadius * 0.9,
          starCenterX + starOuterRadius * 0.3,
          starCenterY + starOuterRadius * 0.3
        );
        const highlightOpacity = this.base.isDark ? 0.55 : 0.75;
        innerHighlightGradient.addColorStop(0, `rgba(255, 255, 255, ${highlightOpacity})`);
        innerHighlightGradient.addColorStop(0.2, `rgba(255, 255, 255, ${highlightOpacity * 0.8})`);
        innerHighlightGradient.addColorStop(0.4, `rgba(255, 255, 255, ${highlightOpacity * 0.5})`);
        innerHighlightGradient.addColorStop(0.6, `rgba(255, 255, 255, ${highlightOpacity * 0.2})`);
        innerHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = innerHighlightGradient;
        this.drawRoundedStarPath(ctx, starCenterX, starCenterY, starOuterRadius, starInnerRadius, outerCornerRadius, innerCornerRadius);
        ctx.fill();
        
        const edgeHighlightGradient = ctx.createLinearGradient(
          starCenterX - starOuterRadius,
          starCenterY - starOuterRadius,
          starCenterX + starOuterRadius * 0.2,
          starCenterY + starOuterRadius * 0.2
        );
        const edgeHighlightOpacity = this.base.isDark ? 0.35 : 0.45;
        edgeHighlightGradient.addColorStop(0, `rgba(255, 255, 255, ${edgeHighlightOpacity})`);
        edgeHighlightGradient.addColorStop(0.3, `rgba(255, 255, 255, ${edgeHighlightOpacity * 0.6})`);
        edgeHighlightGradient.addColorStop(0.6, `rgba(255, 255, 255, ${edgeHighlightOpacity * 0.3})`);
        edgeHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = edgeHighlightGradient;
        this.drawRoundedStarPath(ctx, starCenterX, starCenterY, starOuterRadius, starInnerRadius, outerCornerRadius, innerCornerRadius);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
        
        ctx.restore();
      }
    }
  }
  
  drawPopstarOverlay() {
    if (!this.popstarIsGameOver && !this.popstarIsLevelClear) return;

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
    
    const remaining = countRemainingStars(this.popstarBoard);
    const bonus = calculateBonus(remaining);

    let message, subMessage1, subMessage2, subMessage3;
    
    if (this.popstarIsLevelClear) {
      message = 'LEVEL CLEAR';
      subMessage1 = `Score: ${this.popstarScore}`;
      subMessage2 = bonus > 0 ? `Bonus: +${bonus}` : '';
      subMessage3 = `Total: ${this.popstarTotalScore}`;
    } else {
      message = 'GAME OVER';
      subMessage1 = `Score: ${this.popstarScore}`;
      subMessage2 = bonus > 0 ? `Bonus: +${bonus}` : '';
      subMessage3 = `Target: ${this.popstarTargetScore}`;
    }

    const gradient = ctx.createLinearGradient(centerX - this.base.rpx(100), centerY - this.base.rpx(40), centerX + this.base.rpx(100), centerY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);

    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.rpx(32))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - this.base.rpx(40));

    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `${Math.round(this.base.rpx(16))}px system-ui`;
    ctx.fillText(subMessage1, centerX, centerY - this.base.rpx(10));
    
    if (subMessage2) {
      ctx.fillText(subMessage2, centerX, centerY + this.base.rpx(10));
    }
    
    ctx.fillText(subMessage3, centerX, centerY + this.base.rpx(30));
  }
  
  drawPopstarConfirmDialog() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const dialogWidth = this.base.rpx(600);
    const dialogHeight = this.base.rpx(400);
    const dialogX = this.base.gameX + (this.base.gameWidth - dialogWidth) / 2;
    const dialogY = this.base.screenHeight / 2 - dialogHeight / 2;
    
    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(20) : this.base.rpx(12);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(6) : this.base.rpx(3);
    
    ctx.fillStyle = theme.overlayBg;
    this.base.drawRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, this.base.rpx(32));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    const centerX = dialogX + dialogWidth / 2;
    const centerY = dialogY + dialogHeight / 2;
    
    const gradient = ctx.createLinearGradient(centerX - this.base.rpx(100), centerY - this.base.rpx(80), centerX + this.base.rpx(100), centerY - this.base.rpx(40));
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.rpx(36))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('继续游戏？', centerX, centerY - this.base.rpx(80));
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.base.rpx(20))}px system-ui`;
    ctx.fillText(`当前进度：第 ${this.popstarLevel} 关，得分 ${this.popstarScore}`, centerX, centerY - this.base.rpx(30));
    
    const btnWidth = this.base.rpx(240);
    const btnHeight = this.base.rpx(72);
    const btnGap = this.base.rpx(40);
    const btnY = centerY + this.base.rpx(40);
    const continueBtnX = centerX - btnWidth - btnGap / 2;
    const newBtnX = centerX + btnGap / 2;
    const backBtnY = btnY + btnHeight + this.base.rpx(24);
    const backBtnWidth = this.base.rpx(120);
    const backBtnX = centerX - backBtnWidth / 2;
    
    this.popstarConfirmContinueBtn = { x: continueBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.popstarConfirmNewBtn = { x: newBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.popstarConfirmBackBtn = { x: backBtnX, y: backBtnY, width: backBtnWidth, height: btnHeight };
    
    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.25)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(12) : this.base.rpx(8);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(4) : this.base.rpx(2);
    
    ctx.fillStyle = theme.buttonBg;
    this.base.drawRoundedRect(continueBtnX, btnY, btnWidth, btnHeight, this.base.rpx(36));
    ctx.fill();
    
    this.base.drawRoundedRect(newBtnX, btnY, btnWidth, btnHeight, this.base.rpx(36));
    ctx.fill();
    
    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(backBtnX, backBtnY, backBtnWidth, btnHeight, this.base.rpx(36));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = theme.buttonText;
    ctx.font = `bold ${Math.round(this.base.rpx(22))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('继续进度', continueBtnX + btnWidth / 2, btnY + btnHeight / 2);
    ctx.fillText('从第一关开始', newBtnX + btnWidth / 2, btnY + btnHeight / 2);
    
    ctx.fillStyle = theme.titleText;
    ctx.fillText('返回', backBtnX + backBtnWidth / 2, backBtnY + btnHeight / 2);
  }
  
  renderPopstar() {
    this.base.drawBackground();
    this.drawPopstarTitle();
    this.drawPopstarScoreCards();
    this.drawPopstarBoard();
    this.drawPopstarStars();
    this.base.drawActionButtons();
    this.drawPopstarOverlay();
  }
  
  renderPopstarConfirm() {
    this.base.drawBackground();
    this.base.drawHomeTitle();
    this.drawPopstarConfirmDialog();
  }
  
  checkButtonClick(x, y) {
    let buttonClicked = false;
    
    if (this.base.currentScene === SCENE.POPSTAR_CONFIRM) {
      if (this.popstarConfirmContinueBtn &&
          x >= this.popstarConfirmContinueBtn.x && x <= this.popstarConfirmContinueBtn.x + this.popstarConfirmContinueBtn.width &&
          y >= this.popstarConfirmContinueBtn.y && y <= this.popstarConfirmContinueBtn.y + this.popstarConfirmContinueBtn.height) {
        this.enterPopstarGame();
        buttonClicked = true;
      } else if (this.popstarConfirmNewBtn &&
          x >= this.popstarConfirmNewBtn.x && x <= this.popstarConfirmNewBtn.x + this.popstarConfirmNewBtn.width &&
          y >= this.popstarConfirmNewBtn.y && y <= this.popstarConfirmNewBtn.y + this.popstarConfirmNewBtn.height) {
        this.startNewPopstarGame();
        buttonClicked = true;
      } else if (this.popstarConfirmBackBtn &&
          x >= this.popstarConfirmBackBtn.x && x <= this.popstarConfirmBackBtn.x + this.popstarConfirmBackBtn.width &&
          y >= this.popstarConfirmBackBtn.y && y <= this.popstarConfirmBackBtn.y + this.popstarConfirmBackBtn.height) {
        this.base.goBackHome();
        buttonClicked = true;
      }
    } else if (this.base.currentScene === SCENE.GAME_POPSTAR) {
      const totalActionWidth = this.base.newGameBtnWidth + this.base.actionBtnsGap + this.base.homeBtnSize + this.base.actionBtnsGap + this.base.soundBtnSize + this.base.actionBtnsGap + this.base.themeBtnSize;
      const actionStartX = this.base.gameX + (this.base.gameWidth - totalActionWidth) / 2;
      
      const newGameBtnX = actionStartX;
      const newGameBtnY = this.base.actionY;
      if (x >= newGameBtnX && x <= newGameBtnX + this.base.newGameBtnWidth && 
          y >= newGameBtnY && y <= newGameBtnY + this.base.newGameBtnHeight) {
        if (this.popstarIsLevelClear) {
          this.nextPopstarLevel();
        } else {
          this.restartCurrentPopstarLevel();
        }
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
        if ((this.popstarIsGameOver || this.popstarIsLevelClear) &&
            x >= this.base.boardX && x <= this.base.boardX + this.base.boardSize &&
            y >= this.base.boardY && y <= this.base.boardY + this.base.boardSize) {
          if (this.popstarIsLevelClear) {
            this.nextPopstarLevel();
          } else {
            this.restartCurrentPopstarLevel();
          }
          buttonClicked = true;
        }
      }
    }
    
    return buttonClicked;
  }
}

module.exports = {
  GamePopstar
};
