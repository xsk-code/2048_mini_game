const { SCENE } = require('../common/constants');
const { getTheme } = require('../common/themes');
const { TUBE_CAPACITY, MAX_LEVEL, getTopColor, canPour, pour, isTubeComplete, isLevelComplete, cloneTubes, undoMove, resetLevel, generateLevel } = require('../watersort-logic');
const { loadWatersortBestScore, saveWatersortBestScore, loadWatersortSaveState, saveWatersortSaveState, clearWatersortSaveState, hasWatersortSaveState, loadWatersortBestMoves, saveWatersortBestMoves } = require('../storage');

class GameWatersort {
  constructor(baseGame) {
    this.base = baseGame;
    this.ctx = baseGame.ctx;
    
    this.watersortTubes = [];
    this.watersortLevel = 1;
    this.watersortColorCount = 0;
    this.watersortTubeCount = 0;
    this.watersortMoves = 0;
    this.watersortBestScore = 0;
    this.watersortBestMoves = Infinity;
    this.watersortSelectedTube = null;
    this.watersortHistory = [];
    this.watersortInitialTubes = [];
    this.watersortIsComplete = false;
    this.watersortIsAnimating = false;
    this.watersortPourAnimation = null;
    this.watersortTubeOffsets = [];
    this.watersortTubesLayout = [];
    
    this.watersortConfirmContinueBtn = null;
    this.watersortConfirmNewBtn = null;
    this.watersortConfirmBackBtn = null;
  }
  
  initWatersortConfirm() {
    this.base.currentScene = SCENE.WATERSORT_CONFIRM;
    const savedState = loadWatersortSaveState();
    if (savedState) {
      this.watersortLevel = savedState.level || 1;
      this.watersortMoves = savedState.moves || 0;
    }
  }
  
  enterWatersortGame() {
    const savedState = loadWatersortSaveState();
    
    if (savedState) {
      this.watersortTubes = savedState.tubes;
      this.watersortLevel = savedState.level || 1;
      this.watersortColorCount = savedState.colorCount || 0;
      this.watersortTubeCount = savedState.tubeCount || 0;
      this.watersortMoves = savedState.moves || 0;
      this.watersortHistory = savedState.history || [];
      this.watersortInitialTubes = savedState.initialTubes || [];
      this.watersortIsComplete = isLevelComplete(savedState.tubes);
    } else {
      this.initWatersortGame();
    }
    
    this.watersortBestScore = loadWatersortBestScore();
    this.watersortBestMoves = loadWatersortBestMoves(this.watersortLevel);
    this.watersortSelectedTube = null;
    this.watersortTubeOffsets = new Array(this.watersortTubeCount).fill(0);
    this.recalculateWatersortLayout();
    this.base.currentScene = SCENE.GAME_WATERSORT;
  }
  
  startNewWatersortGame() {
    clearWatersortSaveState();
    this.watersortLevel = 1;
    this.initWatersortGame();
    this.base.currentScene = SCENE.GAME_WATERSORT;
  }
  
  initWatersortGame() {
    const levelData = generateLevel(this.watersortLevel);
    this.watersortTubes = levelData.tubes;
    this.watersortColorCount = levelData.colorCount;
    this.watersortTubeCount = levelData.tubeCount;
    this.watersortMoves = 0;
    this.watersortHistory = [];
    this.watersortInitialTubes = levelData.initialTubes;
    this.watersortIsComplete = false;
    this.watersortSelectedTube = null;
    this.watersortTubeOffsets = new Array(this.watersortTubeCount).fill(0);
    this.watersortBestScore = loadWatersortBestScore();
    this.watersortBestMoves = loadWatersortBestMoves(this.watersortLevel);
    this.recalculateWatersortLayout();
  }
  
  nextWatersortLevel() {
    this.watersortLevel++;
    if (this.watersortLevel > MAX_LEVEL) {
      this.watersortLevel = MAX_LEVEL;
    }
    this.initWatersortGame();
    this.base.currentScene = SCENE.GAME_WATERSORT;
  }
  
  resetWatersortLevel() {
    const result = resetLevel(this.watersortInitialTubes);
    this.watersortTubes = result.tubes;
    this.watersortHistory = result.history;
    this.watersortMoves = result.moves;
    this.watersortIsComplete = false;
    this.watersortSelectedTube = null;
    this.watersortTubeOffsets = new Array(this.watersortTubeCount).fill(0);
  }
  
  undoWatersortMove() {
    const result = undoMove(this.watersortTubes, this.watersortHistory);
    if (result) {
      this.watersortTubes = result.tubes;
      this.watersortHistory = result.history;
      this.watersortMoves--;
      if (this.watersortMoves < 0) this.watersortMoves = 0;
      this.watersortSelectedTube = null;
    }
  }
  
  saveWatersortCurrentState() {
    if (this.watersortTubes.length > 0) {
      saveWatersortSaveState({
        tubes: this.watersortTubes,
        level: this.watersortLevel,
        colorCount: this.watersortColorCount,
        tubeCount: this.watersortTubeCount,
        moves: this.watersortMoves,
        history: this.watersortHistory,
        initialTubes: this.watersortInitialTubes,
        isComplete: this.watersortIsComplete
      });
    }
  }
  
  recalculateWatersortLayout() {
    const tubeCount = this.watersortTubeCount || 5;
    
    const maxCols = tubeCount <= 7 ? tubeCount : Math.ceil(tubeCount / 2);
    const rows = Math.ceil(tubeCount / maxCols);
    const cols = Math.min(tubeCount, maxCols);
    
    const maxTubeWidth = this.base.rpx(72);
    const minTubeWidth = this.base.rpx(56);
    const tubeGap = this.base.rpx(24);
    const rowGap = this.base.rpx(32);
    
    const availableWidth = this.base.boardSize;
    const totalGapWidth = (cols - 1) * tubeGap;
    let tubeWidth = Math.max(minTubeWidth, Math.min(maxTubeWidth, (availableWidth - totalGapWidth) / cols));
    
    const tubeHeight = tubeWidth * 3.0;
    const tubeWallWidth = this.base.rpx(2);
    const tubeOpenWidth = tubeWidth + this.base.rpx(6);
    
    const totalTubesWidth = cols * tubeWidth + (cols - 1) * tubeGap;
    const totalTubesHeight = rows * tubeHeight + (rows - 1) * rowGap;
    
    const titleHeight = this.base.titleFontSize + this.base.rpx(16);
    const scoreCardsHeight = this.base.scoreCardHeight;
    const headerHeight = titleHeight + this.base.titleRowMarginBottom + scoreCardsHeight;
    
    const undoBtnHeight = this.base.rpx(64);
    const actionHeight = undoBtnHeight;
    
    const totalContentHeight = headerHeight + this.base.headerSectionMarginBottom + totalTubesHeight + this.base.actionSectionMarginTop + actionHeight;
    const gameStartY = (this.base.screenHeight - totalContentHeight) / 2;
    
    let currentY = gameStartY;
    
    this.watersortTitleY = currentY + this.base.titleFontSize / 2;
    currentY += titleHeight + this.base.titleRowMarginBottom;
    
    this.watersortScoreCardsY = currentY;
    currentY += scoreCardsHeight + this.base.headerSectionMarginBottom;
    
    this.watersortTubeAreaY = currentY;
    this.watersortTubeWidth = tubeWidth;
    this.watersortTubeHeight = tubeHeight;
    this.watersortTubeGap = tubeGap;
    this.watersortRowGap = rowGap;
    this.watersortTubeWallWidth = tubeWallWidth;
    this.watersortTubeOpenWidth = tubeOpenWidth;
    
    this.watersortTubesLayout = [];
    for (let i = 0; i < tubeCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const tubeX = this.base.boardX + (this.base.boardSize - totalTubesWidth) / 2 + col * (tubeWidth + tubeGap);
      const tubeY = this.watersortTubeAreaY + row * (tubeHeight + rowGap);
      
      this.watersortTubesLayout.push({
        index: i,
        x: tubeX,
        y: tubeY,
        width: tubeWidth,
        height: tubeHeight,
        row: row,
        col: col,
        cols: cols,
        hitX: tubeX - this.base.rpx(8),
        hitY: tubeY - this.base.rpx(8),
        hitWidth: tubeWidth + this.base.rpx(16),
        hitHeight: tubeHeight + this.base.rpx(16)
      });
    }
    
    currentY += totalTubesHeight + this.base.actionSectionMarginTop;
    this.watersortActionY = currentY;
  }
  
  getWatersortLiquidColor(colorIndex) {
    const theme = getTheme(this.base.isDark);
    const colors = theme.watersortLiquids;
    return colors[colorIndex] || colors[0];
  }
  
  drawWatersortTubes() {
    for (let i = 0; i < this.watersortTubeCount; i++) {
      this.drawWatersortTube(i);
    }
  }
  
  drawWatersortTube(tubeIndex) {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    const tube = this.watersortTubes[tubeIndex];
    const layout = this.watersortTubesLayout[tubeIndex];
    const isSelected = this.watersortSelectedTube === tubeIndex;
    const isComplete = isTubeComplete(tube);
    
    const tubeWidth = layout.width;
    const tubeHeight = layout.height;
    const wallWidth = this.watersortTubeWallWidth;
    const openWidth = this.watersortTubeOpenWidth;
    
    const selectOffset = isSelected ? this.base.rpx(24) : 0;
    const baseX = layout.x;
    const baseY = layout.y - selectOffset;
    
    const liquidHeight = (tubeHeight - this.base.rpx(16)) / TUBE_CAPACITY;
    const liquidRadius = this.base.rpx(2);
    const bottomRadius = tubeWidth / 2;
    
    ctx.save();
    
    ctx.beginPath();
    ctx.ellipse(
      baseX + tubeWidth / 2,
      baseY + tubeHeight + this.base.rpx(4),
      tubeWidth * 0.4,
      this.base.rpx(3),
      0, 0, Math.PI * 2
    );
    ctx.fillStyle = theme.watersortTube.shadow;
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(baseX + (tubeWidth - openWidth) / 2, baseY);
    ctx.lineTo(baseX + (tubeWidth - openWidth) / 2 + openWidth, baseY);
    ctx.lineTo(baseX + tubeWidth - wallWidth, baseY + this.base.rpx(8));
    ctx.lineTo(baseX + tubeWidth - wallWidth, baseY + tubeHeight - bottomRadius);
    ctx.quadraticCurveTo(
      baseX + tubeWidth - wallWidth, baseY + tubeHeight,
      baseX + tubeWidth / 2, baseY + tubeHeight
    );
    ctx.quadraticCurveTo(
      baseX + wallWidth, baseY + tubeHeight,
      baseX + wallWidth, baseY + tubeHeight - bottomRadius
    );
    ctx.lineTo(baseX + wallWidth, baseY + this.base.rpx(8));
    ctx.closePath();
    
    ctx.fillStyle = theme.watersortTube.inner;
    ctx.fill();
    
    ctx.strokeStyle = theme.watersortTube.wall;
    ctx.lineWidth = wallWidth;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(
      baseX + tubeWidth / 2,
      baseY + this.base.rpx(2),
      openWidth / 2,
      this.base.rpx(2),
      0, 0, Math.PI * 2
    );
    ctx.strokeStyle = theme.watersortTube.rim;
    ctx.lineWidth = this.base.rpx(1.5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(baseX + tubeWidth * 0.18, baseY + this.base.rpx(12));
    ctx.lineTo(baseX + tubeWidth * 0.18, baseY + tubeHeight * 0.65);
    ctx.strokeStyle = theme.watersortTube.highlight;
    ctx.lineWidth = this.base.rpx(3);
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(baseX + tubeWidth * 0.75, baseY + this.base.rpx(16));
    ctx.lineTo(baseX + tubeWidth * 0.75, baseY + tubeHeight * 0.4);
    ctx.strokeStyle = this.base.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = this.base.rpx(1.5);
    ctx.lineCap = 'round';
    ctx.stroke();
    
    const liquidColors = theme.watersortLiquids;
    let hasLiquid = false;
    
    let topMostIndex = -1;
    for (let i = tube.length - 1; i >= 0; i--) {
      if (tube[i] !== null) {
        topMostIndex = i;
        break;
      }
    }
    
    const liquidLeft = baseX + wallWidth + this.base.rpx(4);
    const liquidRight = baseX + tubeWidth - wallWidth - this.base.rpx(4);
    const liquidCenterX = (liquidLeft + liquidRight) / 2;
    
    for (let layer = 0; layer < TUBE_CAPACITY; layer++) {
      const colorIndex = tube[layer];
      if (colorIndex === null) continue;
      
      hasLiquid = true;
      const liquidY = baseY + tubeHeight - this.base.rpx(8) - (layer + 1) * liquidHeight;
      const color = liquidColors[colorIndex] || liquidColors[0];
      
      const isTopLayer = layer === topMostIndex;
      const isBottomLayer = layer === 0;
      
      const meniscusHeight = isTopLayer ? liquidHeight * 0.3 : 0;
      
      const nextColorIndex = layer + 1 < TUBE_CAPACITY ? tube[layer + 1] : null;
      const isFusedWithAbove = nextColorIndex !== null && nextColorIndex === colorIndex;
      
      ctx.beginPath();
      
      if (isTopLayer) {
        ctx.moveTo(liquidLeft, liquidY + meniscusHeight);
        ctx.quadraticCurveTo(
          liquidCenterX, liquidY,
          liquidRight, liquidY + meniscusHeight
        );
        ctx.lineTo(liquidRight, liquidY + liquidHeight);
        ctx.lineTo(liquidLeft, liquidY + liquidHeight);
        ctx.closePath();
      } else if (isBottomLayer) {
        const radius = tubeWidth / 2 - wallWidth - this.base.rpx(4);
        ctx.moveTo(liquidLeft, liquidY);
        ctx.lineTo(liquidRight, liquidY);
        ctx.lineTo(liquidRight, liquidY + liquidHeight - radius);
        ctx.quadraticCurveTo(
          liquidRight,
          liquidY + liquidHeight,
          liquidCenterX,
          liquidY + liquidHeight
        );
        ctx.quadraticCurveTo(
          liquidLeft,
          liquidY + liquidHeight,
          liquidLeft,
          liquidY + liquidHeight - radius
        );
        ctx.closePath();
      } else {
        ctx.rect(liquidLeft, liquidY, liquidRight - liquidLeft, liquidHeight);
      }
      
      const gradient = ctx.createLinearGradient(
        liquidCenterX, liquidY,
        liquidCenterX, liquidY + liquidHeight
      );
      gradient.addColorStop(0, color.light);
      gradient.addColorStop(1, color.dark);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.save();
      ctx.beginPath();
      if (isTopLayer) {
        ctx.moveTo(liquidLeft, liquidY + meniscusHeight);
        ctx.quadraticCurveTo(
          liquidCenterX, liquidY,
          liquidRight, liquidY + meniscusHeight
        );
        ctx.lineTo(liquidRight, liquidY + liquidHeight);
        ctx.lineTo(liquidLeft, liquidY + liquidHeight);
        ctx.closePath();
      } else if (isBottomLayer) {
        const radius = tubeWidth / 2 - wallWidth - this.base.rpx(4);
        ctx.moveTo(liquidLeft, liquidY);
        ctx.lineTo(liquidRight, liquidY);
        ctx.lineTo(liquidRight, liquidY + liquidHeight - radius);
        ctx.quadraticCurveTo(
          liquidRight,
          liquidY + liquidHeight,
          liquidCenterX,
          liquidY + liquidHeight
        );
        ctx.quadraticCurveTo(
          liquidLeft,
          liquidY + liquidHeight,
          liquidLeft,
          liquidY + liquidHeight - radius
        );
        ctx.closePath();
      } else {
        ctx.rect(liquidLeft, liquidY, liquidRight - liquidLeft, liquidHeight);
      }
      ctx.clip();
      
      const refractGradient = ctx.createLinearGradient(
        liquidLeft, liquidY,
        liquidLeft + (liquidRight - liquidLeft) * 0.35, liquidY
      );
      refractGradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      refractGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = refractGradient;
      ctx.fillRect(liquidLeft, liquidY, liquidRight - liquidLeft, liquidY + liquidHeight);
      
      ctx.restore();
      
      if (isTopLayer && meniscusHeight > 0) {
        ctx.beginPath();
        ctx.moveTo(liquidLeft + this.base.rpx(1), liquidY + meniscusHeight - this.base.rpx(1));
        ctx.quadraticCurveTo(
          liquidCenterX, liquidY - this.base.rpx(1),
          liquidRight - this.base.rpx(1), liquidY + meniscusHeight - this.base.rpx(1)
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = this.base.rpx(1.5);
        ctx.stroke();
      }
      
      if (isTopLayer || isSelected) {
        ctx.fillStyle = color.highlight;
        ctx.beginPath();
        ctx.arc(
          liquidLeft + (liquidRight - liquidLeft) * 0.25,
          liquidY + liquidHeight * 0.3,
          this.base.rpx(3),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    
    if (isSelected) {
      ctx.beginPath();
      ctx.ellipse(
        baseX + tubeWidth / 2,
        baseY + this.base.rpx(2),
        openWidth / 2 + this.base.rpx(4),
        this.base.rpx(6),
        0, 0, Math.PI * 2
      );
      const glowGradient = ctx.createRadialGradient(
        baseX + tubeWidth / 2, baseY,
        0,
        baseX + tubeWidth / 2, baseY,
        openWidth / 2 + this.base.rpx(6)
      );
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }
    
    if (isComplete && hasLiquid && !tube.every(c => c === null)) {
      ctx.beginPath();
      ctx.arc(baseX + tubeWidth / 2, baseY + this.base.rpx(20), this.base.rpx(10), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = this.base.rpx(1.5);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `bold ${Math.round(tubeWidth * 0.3)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', baseX + tubeWidth / 2, baseY + this.base.rpx(20));
    }
    
    ctx.restore();
  }
  
  drawWatersortTitle() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const titleX = this.base.gameX + this.base.gameWidth / 2;
    
    const gradient = ctx.createLinearGradient(titleX - this.base.rpx(100), this.watersortTitleY - this.base.rpx(40), titleX + this.base.rpx(100), this.watersortTitleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.titleFontSize * 0.75)}px system-ui`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('WATER SORT', this.base.gameX, this.watersortTitleY);
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `bold ${Math.round(this.base.titleFontSize * 0.5)}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${this.watersortLevel}`, this.base.gameX + this.base.gameWidth, this.watersortTitleY);
  }
  
  drawWatersortScoreCards() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const scoreCardWidth = this.base.rpx(140);
    const scoreCardHeight = this.base.rpx(80);
    
    const totalWidth = scoreCardWidth * 2 + this.base.scoreCardsGap;
    const startX = this.base.gameX + (this.base.gameWidth - totalWidth) / 2;
    
    const bestMovesText = this.watersortBestMoves === Infinity ? '--' : this.watersortBestMoves.toString();
    
    this.drawWatersortScoreCard('MOVES', this.watersortMoves, startX, this.watersortScoreCardsY, scoreCardWidth, scoreCardHeight);
    this.drawWatersortScoreCard('BEST', bestMovesText, startX + scoreCardWidth + this.base.scoreCardsGap, this.watersortScoreCardsY, scoreCardWidth, scoreCardHeight);
  }
  
  drawWatersortScoreCard(label, value, x, y, width, height) {
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
    
    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `bold ${Math.round(this.base.scoreLabelFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height * 0.3);
    
    ctx.fillStyle = theme.scoreValue;
    ctx.font = `bold ${Math.round(this.base.scoreValueFontSize * 1.2)}px system-ui`;
    ctx.fillText(value.toString(), x + width / 2, y + height * 0.65);
  }
  
  drawWatersortActionButtons() {
    const theme = getTheme(this.base.isDark);
    const ctx = this.ctx;
    
    const undoBtnWidth = this.base.rpx(120);
    const undoBtnHeight = this.base.rpx(64);
    const resetBtnWidth = this.base.rpx(120);
    const resetBtnHeight = this.base.rpx(64);
    const smallBtnSize = this.base.rpx(72);
    
    const totalActionWidth = undoBtnWidth + this.base.actionBtnsGap + resetBtnWidth + this.base.actionBtnsGap + smallBtnSize + this.base.actionBtnsGap + smallBtnSize + this.base.actionBtnsGap + smallBtnSize;
    const actionStartX = this.base.gameX + (this.base.gameWidth - totalActionWidth) / 2;
    const actionY = this.watersortActionY;
    
    let currentX = actionStartX;
    
    const hasHistory = this.watersortHistory.length > 0;
    
    ctx.shadowColor = this.base.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(126, 184, 230, 0.2)';
    ctx.shadowBlur = this.base.isDark ? this.base.rpx(10) : this.base.rpx(6);
    ctx.shadowOffsetY = this.base.isDark ? this.base.rpx(3) : this.base.rpx(2);
    
    ctx.fillStyle = hasHistory ? theme.buttonBg : theme.themeBtnBg;
    this.base.drawRoundedRect(currentX, actionY, undoBtnWidth, undoBtnHeight, this.base.rpx(32));
    ctx.fill();
    
    ctx.fillStyle = hasHistory ? theme.buttonText : theme.subtitleText;
    ctx.font = `bold ${Math.round(this.base.actionBtnFontSize * 0.9)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↩ UNDO', currentX + undoBtnWidth / 2, actionY + undoBtnHeight / 2);
    
    currentX += undoBtnWidth + this.base.actionBtnsGap;
    
    ctx.fillStyle = theme.buttonBg;
    this.base.drawRoundedRect(currentX, actionY, resetBtnWidth, resetBtnHeight, this.base.rpx(32));
    ctx.fill();
    
    ctx.fillStyle = theme.buttonText;
    ctx.fillText('↺ RESET', currentX + resetBtnWidth / 2, actionY + resetBtnHeight / 2);
    
    currentX += resetBtnWidth + this.base.actionBtnsGap;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(currentX, actionY, smallBtnSize, smallBtnSize, Math.round(smallBtnSize / 2));
    ctx.fill();
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `${Math.round(this.base.rpx(28))}px system-ui`;
    ctx.fillText('🏠', currentX + smallBtnSize / 2, actionY + smallBtnSize / 2);
    
    currentX += smallBtnSize + this.base.actionBtnsGap;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(currentX, actionY, smallBtnSize, smallBtnSize, Math.round(smallBtnSize / 2));
    ctx.fill();
    
    const soundIcon = this.base.soundManager.isEnabled() ? '🔊' : '🔇';
    ctx.fillText(soundIcon, currentX + smallBtnSize / 2, actionY + smallBtnSize / 2);
    
    currentX += smallBtnSize + this.base.actionBtnsGap;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.base.drawRoundedRect(currentX, actionY, smallBtnSize, smallBtnSize, Math.round(smallBtnSize / 2));
    ctx.fill();
    
    ctx.fillText(this.base.isDark ? '☀️' : '🌙', currentX + smallBtnSize / 2, actionY + smallBtnSize / 2);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  
  drawWatersortOverlay() {
    if (!this.watersortIsComplete) return;
    
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
    
    let message, subMessage1, subMessage2, subMessage3;
    
    if (this.watersortLevel >= MAX_LEVEL) {
      message = '🎉 CONGRATULATIONS 🎉';
      subMessage1 = `You completed all ${MAX_LEVEL} levels!`;
      subMessage2 = `Moves: ${this.watersortMoves}`;
      subMessage3 = '';
    } else {
      message = '═ LEVEL CLEAR ═';
      subMessage1 = `Moves: ${this.watersortMoves}`;
      if (this.watersortBestMoves === Infinity || this.watersortMoves < this.watersortBestMoves) {
        subMessage2 = 'NEW BEST!';
      } else {
        subMessage2 = `Best: ${this.watersortBestMoves}`;
      }
      subMessage3 = '';
    }
    
    const gradient = ctx.createLinearGradient(centerX - this.base.rpx(120), centerY - this.base.rpx(60), centerX + this.base.rpx(120), centerY - this.base.rpx(20));
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.base.rpx(32))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - this.base.rpx(50));
    
    ctx.fillStyle = theme.scoreValue;
    ctx.font = `bold ${Math.round(this.base.rpx(24))}px system-ui`;
    if (subMessage1) {
      ctx.fillText(subMessage1, centerX, centerY - this.base.rpx(10));
    }
    if (subMessage2) {
      ctx.fillText(subMessage2, centerX, centerY + this.base.rpx(10));
    }
    if (subMessage3) {
      ctx.fillText(subMessage3, centerX, centerY + this.base.rpx(30));
    }
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.base.rpx(16))}px system-ui`;
    ctx.fillText('Tap to continue', centerX, centerY + this.base.rpx(70));
  }
  
  drawWatersortConfirmDialog() {
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
    ctx.fillText(`当前进度：第 ${this.watersortLevel} 关，步数 ${this.watersortMoves}`, centerX, centerY - this.base.rpx(30));
    
    const btnWidth = this.base.rpx(240);
    const btnHeight = this.base.rpx(72);
    const btnGap = this.base.rpx(40);
    const btnY = centerY + this.base.rpx(40);
    const continueBtnX = centerX - btnWidth - btnGap / 2;
    const newBtnX = centerX + btnGap / 2;
    const backBtnY = btnY + btnHeight + this.base.rpx(24);
    const backBtnWidth = this.base.rpx(120);
    const backBtnX = centerX - backBtnWidth / 2;
    
    this.watersortConfirmContinueBtn = { x: continueBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.watersortConfirmNewBtn = { x: newBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.watersortConfirmBackBtn = { x: backBtnX, y: backBtnY, width: backBtnWidth, height: btnHeight };
    
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
  
  renderWatersort() {
    this.base.drawBackground();
    this.drawWatersortTitle();
    this.drawWatersortScoreCards();
    this.drawWatersortTubes();
    this.drawWatersortActionButtons();
    this.drawWatersortOverlay();
  }
  
  renderWatersortConfirm() {
    this.base.drawBackground();
    this.base.drawHomeTitle();
    this.drawWatersortConfirmDialog();
  }
  
  handleWatersortTouch(x, y) {
    if (this.watersortIsAnimating || this.watersortIsComplete) return;
    
    for (let i = 0; i < this.watersortTubeCount; i++) {
      const layout = this.watersortTubesLayout[i];
      
      if (x >= layout.hitX && x <= layout.hitX + layout.hitWidth &&
          y >= layout.hitY && y <= layout.hitY + layout.hitHeight) {
        
        if (this.watersortSelectedTube === null) {
          const tube = this.watersortTubes[i];
          if (getTopColor(tube) !== null) {
            this.watersortSelectedTube = i;
          }
        } else if (this.watersortSelectedTube === i) {
          this.watersortSelectedTube = null;
        } else {
          const fromTube = this.watersortTubes[this.watersortSelectedTube];
          const toTube = this.watersortTubes[i];
          
          if (canPour(fromTube, toTube)) {
            const result = pour(fromTube, toTube);
            
            this.watersortTubes[this.watersortSelectedTube] = result.newFrom;
            this.watersortTubes[i] = result.newTo;
            this.watersortHistory.push({
              from: this.watersortSelectedTube,
              to: i,
              count: result.count,
              color: result.color
            });
            this.watersortMoves++;
            
            this.saveWatersortCurrentState();
            
            if (isLevelComplete(this.watersortTubes)) {
              this.watersortIsComplete = true;
              
              saveWatersortBestMoves(this.watersortLevel, this.watersortMoves);
              this.watersortBestMoves = loadWatersortBestMoves(this.watersortLevel);
              
              if (this.watersortLevel > this.watersortBestScore) {
                this.watersortBestScore = this.watersortLevel;
                saveWatersortBestScore(this.watersortLevel);
              }
              
              this.saveWatersortCurrentState();
            }
            
            this.watersortSelectedTube = null;
          } else {
            const tube = this.watersortTubes[i];
            if (getTopColor(tube) !== null) {
              this.watersortSelectedTube = i;
            }
          }
        }
        
        break;
      }
    }
  }
  
  checkWatersortButtonClick(x, y) {
    let clicked = false;
    
    const undoBtnWidth = this.base.rpx(120);
    const undoBtnHeight = this.base.rpx(64);
    const resetBtnWidth = this.base.rpx(120);
    const resetBtnHeight = this.base.rpx(64);
    const smallBtnSize = this.base.rpx(72);
    
    const totalActionWidth = undoBtnWidth + this.base.actionBtnsGap + resetBtnWidth + this.base.actionBtnsGap + smallBtnSize + this.base.actionBtnsGap + smallBtnSize + this.base.actionBtnsGap + smallBtnSize;
    const actionStartX = this.base.gameX + (this.base.gameWidth - totalActionWidth) / 2;
    const actionY = this.watersortActionY;
    
    let currentX = actionStartX;
    
    const undoBtnX = currentX;
    currentX += undoBtnWidth + this.base.actionBtnsGap;
    
    const resetBtnX = currentX;
    currentX += resetBtnWidth + this.base.actionBtnsGap;
    
    const homeBtnX = currentX;
    currentX += smallBtnSize + this.base.actionBtnsGap;
    
    const soundBtnX = currentX;
    currentX += smallBtnSize + this.base.actionBtnsGap;
    
    const themeBtnX = currentX;
    
    if (x >= undoBtnX && x <= undoBtnX + undoBtnWidth && y >= actionY && y <= actionY + undoBtnHeight) {
      if (this.watersortHistory.length > 0) {
        this.undoWatersortMove();
        this.saveWatersortCurrentState();
      }
      clicked = true;
    } else if (x >= resetBtnX && x <= resetBtnX + resetBtnWidth && y >= actionY && y <= actionY + resetBtnHeight) {
      this.resetWatersortLevel();
      this.saveWatersortCurrentState();
      clicked = true;
    } else if (x >= homeBtnX && x <= homeBtnX + smallBtnSize && y >= actionY && y <= actionY + smallBtnSize) {
      this.base.goBackHome();
      clicked = true;
    } else if (x >= soundBtnX && x <= soundBtnX + smallBtnSize && y >= actionY && y <= actionY + smallBtnSize) {
      this.base.soundManager.toggle();
      clicked = true;
    } else if (x >= themeBtnX && x <= themeBtnX + smallBtnSize && y >= actionY && y <= actionY + smallBtnSize) {
      this.base.isDark = !this.base.isDark;
      this.base.saveTheme();
      clicked = true;
    } else if (this.watersortIsComplete &&
        x >= this.base.boardX && x <= this.base.boardX + this.base.boardSize &&
        y >= this.base.boardY && y <= this.base.boardY + this.base.boardSize) {
      if (this.watersortLevel >= MAX_LEVEL) {
        this.base.goBackHome();
      } else {
        this.nextWatersortLevel();
      }
      clicked = true;
    }
    
    return clicked;
  }
  
  checkButtonClick(x, y) {
    let buttonClicked = false;
    
    if (this.base.currentScene === SCENE.WATERSORT_CONFIRM) {
      if (this.watersortConfirmContinueBtn &&
          x >= this.watersortConfirmContinueBtn.x && x <= this.watersortConfirmContinueBtn.x + this.watersortConfirmContinueBtn.width &&
          y >= this.watersortConfirmContinueBtn.y && y <= this.watersortConfirmContinueBtn.y + this.watersortConfirmContinueBtn.height) {
        this.enterWatersortGame();
        buttonClicked = true;
      } else if (this.watersortConfirmNewBtn &&
          x >= this.watersortConfirmNewBtn.x && x <= this.watersortConfirmNewBtn.x + this.watersortConfirmNewBtn.width &&
          y >= this.watersortConfirmNewBtn.y && y <= this.watersortConfirmNewBtn.y + this.watersortConfirmNewBtn.height) {
        this.startNewWatersortGame();
        buttonClicked = true;
      } else if (this.watersortConfirmBackBtn &&
          x >= this.watersortConfirmBackBtn.x && x <= this.watersortConfirmBackBtn.x + this.watersortConfirmBackBtn.width &&
          y >= this.watersortConfirmBackBtn.y && y <= this.watersortConfirmBackBtn.y + this.watersortConfirmBackBtn.height) {
        this.base.goBackHome();
        buttonClicked = true;
      }
    } else if (this.base.currentScene === SCENE.GAME_WATERSORT) {
      buttonClicked = this.checkWatersortButtonClick(x, y);
    }
    
    return buttonClicked;
  }
}

module.exports = {
  GameWatersort
};
