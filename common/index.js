const { getTheme } = require('./themes');
const { SCENE } = require('./constants');
const { getSoundManager } = require('../sound-manager');
const { getAllModes, getModesByGameType } = require('../mode-config');
const { loadAllGameTypesInfo, loadAllModesInfo } = require('../storage');

class BaseGame {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    this.systemInfo = wx.getSystemInfoSync();
    this.dpr = this.systemInfo.pixelRatio || 1;
    this.screenWidth = this.systemInfo.screenWidth;
    this.screenHeight = this.systemInfo.screenHeight;
    
    this.safeArea = this.systemInfo.safeArea || { top: 0, bottom: this.screenHeight, height: this.screenHeight };
    this.statusBarHeight = this.systemInfo.statusBarHeight || 0;
    this.menuButtonRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    
    this.canvas.width = this.screenWidth * this.dpr;
    this.canvas.height = this.screenHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    
    this.isDark = false;
    this.loadTheme();
    this.setupShareMenu();
    
    this.currentScene = SCENE.HOME;
    
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMoving = false;
    
    this.modeCards = [];
    this.gameTypeCards = [];
    
    this.soundManager = getSoundManager();
    
    this.calculateDimensions();
    this.setupTouchEvents();
  }
  
  rpx(pxValue) {
    return Math.round((pxValue / 750) * this.screenWidth);
  }
  
  get theme() {
    return getTheme(this.isDark);
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
    this.popstarCellGap = this.boardSize * 0.006;
    
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
    this.homeBtnSize = this.rpx(88);
    this.soundBtnSize = this.rpx(88);
    this.leaderboardBtnSize = this.rpx(88);

    this.scoreCardWidth = this.rpx(160);
    this.scoreCardHeight = this.rpx(96);
    
    this.boardRadius = this.rpx(20);
    this.cellRadius = this.rpx(12);
    this.popstarCellRadius = this.rpx(5);
    
    this.cardWidth = this.rpx(600);
    this.cardHeight = this.rpx(180);
    this.cardRadius = this.rpx(32);
    this.cardGap = this.rpx(32);
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
        query: `score=0&best=0`
      };
    });

    wx.onShareTimeline(() => {
      return {
        title: '快来玩2048小游戏合集！',
        query: `score=0&best=0`
      };
    });
  }
  
  initHome() {
    this.currentScene = SCENE.HOME;
    this.recalculateHomeLayout();
  }
  
  recalculateHomeLayout() {
    const gameTypesInfo = loadAllGameTypesInfo();
    const totalCardsHeight = gameTypesInfo.length * this.cardHeight + (gameTypesInfo.length - 1) * this.cardGap;
    const headerHeight = this.titleFontSize + this.subtitleFontSize + this.rpx(16) + this.rpx(60);
    
    const totalContentHeight = headerHeight + totalCardsHeight;
    const startY = (this.screenHeight - totalContentHeight) / 2;
    
    let currentY = startY;
    
    this.homeTitleY = currentY + this.titleFontSize / 2;
    this.homeSubtitleY = this.homeTitleY + this.titleFontSize / 2 + this.rpx(16) + this.subtitleFontSize / 2;
    
    currentY += headerHeight;
    
    this.gameTypeCards = gameTypesInfo.map((gameType, index) => {
      const card = {
        ...gameType,
        x: this.gameX + (this.gameWidth - this.cardWidth) / 2,
        y: currentY + index * (this.cardHeight + this.cardGap),
        width: this.cardWidth,
        height: this.cardHeight
      };
      return card;
    });
  }
  
  setupTouchEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      
      this.handleTouchStart(touch.clientX, touch.clientY);
    });
    
    wx.onTouchEnd((e) => {
      this.handleTouchEnd(e);
      
      this.touchStartX = 0;
      this.touchStartY = 0;
    });
  }
  
  handleTouchStart(x, y) {
    this.checkButtonClick(x, y);
  }
  
  handleTouchEnd(e) {
  }
  
  checkButtonClick(x, y) {
    let buttonClicked = false;
    
    if (this.currentScene === SCENE.HOME) {
      for (const card of this.gameTypeCards) {
        if (x >= card.x && x <= card.x + card.width &&
            y >= card.y && y <= card.y + card.height) {
          this.enterGameType(card.id);
          buttonClicked = true;
          break;
        }
      }
      if (!buttonClicked && this.leaderboardBtn) {
        if (x >= this.leaderboardBtn.x && x <= this.leaderboardBtn.x + this.leaderboardBtn.width &&
            y >= this.leaderboardBtn.y && y <= this.leaderboardBtn.y + this.leaderboardBtn.height) {
          this.enterLeaderboard();
          buttonClicked = true;
        }
      }
    } else if (this.currentScene === SCENE.HOME_2048_MODE) {
      const backBtnSize = this.rpx(88);
      const backBtnX = this.gameX;
      const backBtnY = this.homeTitleY - this.rpx(40);
      
      if (x >= backBtnX && x <= backBtnX + backBtnSize &&
          y >= backBtnY && y <= backBtnY + backBtnSize) {
        this.goBackHome();
        buttonClicked = true;
      } else {
        for (const card of this.modeCards) {
          if (x >= card.x && x <= card.x + card.width &&
              y >= card.y && y <= card.y + card.height) {
            this.enterMode(card.id);
            buttonClicked = true;
            break;
          }
        }
      }
    }
    
    if (buttonClicked) {
      this.soundManager.playButtonClick();
    }
    
    return buttonClicked;
  }
  
  enterGameType(gameTypeId) {
  }
  
  enterMode(modeId) {
  }
  
  enterLeaderboard() {
  }
  
  goBackHome() {
    this.initHome();
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
    const theme = this.theme;
    this.ctx.fillStyle = theme.background;
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
  }
  
  drawHomeTitle() {
    const theme = this.theme;
    const ctx = this.ctx;
    
    const titleX = this.gameX + this.gameWidth / 2;
    
    const gradient = ctx.createLinearGradient(titleX - this.rpx(120), this.homeTitleY - this.rpx(50), titleX + this.rpx(120), this.homeTitleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.titleFontSize * 1.1)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (this.currentScene === SCENE.HOME) {
      ctx.fillText('MINI GAMES', titleX, this.homeTitleY);
    } else {
      ctx.fillText('2048', titleX, this.homeTitleY);
    }
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.subtitleFontSize)}px system-ui`;
    ctx.letterSpacing = `${this.rpx(4)}px`;
    
    if (this.currentScene === SCENE.HOME) {
      ctx.fillText('CHOOSE YOUR GAME', titleX, this.homeSubtitleY);
    } else {
      ctx.fillText('CHOOSE YOUR MODE', titleX, this.homeSubtitleY);
    }
  }
  
  drawGameTypeCards() {
    const theme = this.theme;
    const ctx = this.ctx;
    const gameTypesInfo = loadAllGameTypesInfo();
    
    for (const card of this.gameTypeCards) {
      const gameTypeInfo = gameTypesInfo.find(g => g.id === card.id) || card;
      const hasSave = gameTypeInfo.hasSave;
      const bestScore = gameTypeInfo.bestScore;
      
      ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.15)';
      ctx.shadowBlur = this.isDark ? this.rpx(16) : this.rpx(12);
      ctx.shadowOffsetY = this.isDark ? this.rpx(6) : this.rpx(4);
      
      const cardGradient = ctx.createLinearGradient(card.x, card.y, card.x + card.width, card.y + card.height);
      cardGradient.addColorStop(0, theme.cardGradient[0]);
      cardGradient.addColorStop(1, theme.cardGradient[1]);
      
      ctx.fillStyle = cardGradient;
      this.drawRoundedRect(card.x, card.y, card.width, card.height, this.cardRadius);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      const stripWidth = this.rpx(8);
      const stripX = card.x + this.rpx(28);
      const stripGradient = ctx.createLinearGradient(stripX, card.y + this.rpx(28), stripX, card.y + card.height - this.rpx(28));
      stripGradient.addColorStop(0, theme.cardAccent[0]);
      stripGradient.addColorStop(1, theme.cardAccent[1]);
      
      ctx.fillStyle = stripGradient;
      this.drawRoundedRect(stripX, card.y + this.rpx(28), stripWidth, card.height - this.rpx(56), this.rpx(4));
      ctx.fill();
      
      const labelX = card.x + this.rpx(56);
      const centerY = card.y + card.height / 2;
      
      ctx.fillStyle = theme.titleText;
      ctx.font = `bold ${Math.round(this.rpx(44))}px system-ui`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.label, labelX, centerY - this.rpx(18));
      
      ctx.fillStyle = theme.subtitleText;
      ctx.font = `${Math.round(this.rpx(20))}px system-ui`;
      ctx.fillText(card.subtitle, labelX, centerY + this.rpx(18));
      
      const statsX = card.x + card.width - this.rpx(32);
      
      ctx.fillStyle = theme.scoreLabel;
      ctx.font = `${Math.round(this.rpx(16))}px system-ui`;
      ctx.textAlign = 'right';
      ctx.fillText('BEST', statsX, centerY - this.rpx(16));
      
      ctx.fillStyle = theme.scoreValue;
      ctx.font = `bold ${Math.round(this.rpx(30))}px system-ui`;
      ctx.fillText(bestScore.toString(), statsX, centerY + this.rpx(12));
      
      if (hasSave) {
        const saveBadgeX = card.x + card.width - this.rpx(100);
        const saveBadgeY = card.y + this.rpx(20);
        const badgeWidth = this.rpx(72);
        const badgeHeight = this.rpx(36);
        
        const badgeGradient = ctx.createLinearGradient(saveBadgeX, saveBadgeY, saveBadgeX + badgeWidth, saveBadgeY);
        badgeGradient.addColorStop(0, theme.cardAccent[0]);
        badgeGradient.addColorStop(1, theme.cardAccent[1]);
        
        ctx.fillStyle = badgeGradient;
        this.drawRoundedRect(saveBadgeX, saveBadgeY, badgeWidth, badgeHeight, this.rpx(18));
        ctx.fill();
        
        ctx.fillStyle = this.isDark ? '#0D1B2A' : '#FFFFFF';
        ctx.font = `bold ${Math.round(this.rpx(16))}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('继续', saveBadgeX + badgeWidth / 2, saveBadgeY + badgeHeight / 2);
      }
    }
  }
  
  drawBackButton() {
    const theme = this.theme;
    const ctx = this.ctx;
    
    const backBtnSize = this.rpx(88);
    const backBtnX = this.gameX;
    const backBtnY = this.homeTitleY - this.rpx(40);
    
    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(backBtnX, backBtnY, backBtnSize, backBtnSize, Math.round(backBtnSize / 2));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `bold ${Math.round(this.rpx(32))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', backBtnX + backBtnSize / 2, backBtnY + backBtnSize / 2);
  }
  
  getSafeTopPadding() {
    if (this.menuButtonRect) {
      return this.menuButtonRect.bottom + this.rpx(16);
    }
    if (this.safeArea && this.safeArea.top > 0) {
      return this.safeArea.top + this.rpx(24);
    }
    return this.statusBarHeight + this.rpx(32);
  }

  drawLeaderboardButton() {
    const theme = this.theme;
    const ctx = this.ctx;

    const btnX = this.gameX + this.gameWidth - this.leaderboardBtnSize;
    const btnY = this.safeArea.bottom - this.leaderboardBtnSize - this.rpx(24);

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(btnX, btnY, this.leaderboardBtnSize, this.leaderboardBtnSize, Math.round(this.leaderboardBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = theme.titleText;
    ctx.font = Math.round(this.rpx(30)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', btnX + this.leaderboardBtnSize / 2, btnY + this.leaderboardBtnSize / 2);

    this.leaderboardBtn = { x: btnX, y: btnY, width: this.leaderboardBtnSize, height: this.leaderboardBtnSize };
  }
  
  drawModeCards() {
    const theme = this.theme;
    const ctx = this.ctx;
    const modesInfo = loadAllModesInfo();
    
    for (const card of this.modeCards) {
      const modeInfo = modesInfo.find(m => m.id === card.id) || card;
      const hasSave = modeInfo.hasSave;
      const bestScore = modeInfo.bestScore;
      
      ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.15)';
      ctx.shadowBlur = this.isDark ? this.rpx(16) : this.rpx(12);
      ctx.shadowOffsetY = this.isDark ? this.rpx(6) : this.rpx(4);
      
      const cardGradient = ctx.createLinearGradient(card.x, card.y, card.x + card.width, card.y + card.height);
      cardGradient.addColorStop(0, theme.cardGradient[0]);
      cardGradient.addColorStop(1, theme.cardGradient[1]);
      
      ctx.fillStyle = cardGradient;
      this.drawRoundedRect(card.x, card.y, card.width, card.height, this.cardRadius);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      const stripWidth = this.rpx(8);
      const stripX = card.x + this.rpx(28);
      const stripGradient = ctx.createLinearGradient(stripX, card.y + this.rpx(28), stripX, card.y + card.height - this.rpx(28));
      stripGradient.addColorStop(0, theme.cardAccent[0]);
      stripGradient.addColorStop(1, theme.cardAccent[1]);
      
      ctx.fillStyle = stripGradient;
      this.drawRoundedRect(stripX, card.y + this.rpx(28), stripWidth, card.height - this.rpx(56), this.rpx(4));
      ctx.fill();
      
      const labelX = card.x + this.rpx(56);
      const centerY = card.y + card.height / 2;
      
      ctx.fillStyle = theme.titleText;
      ctx.font = `bold ${Math.round(this.rpx(44))}px system-ui`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.label, labelX, centerY - this.rpx(18));
      
      ctx.fillStyle = theme.subtitleText;
      ctx.font = `${Math.round(this.rpx(20))}px system-ui`;
      ctx.fillText(`目标: ${card.targetTile}`, labelX, centerY + this.rpx(18));
      
      const statsX = card.x + card.width - this.rpx(32);
      
      ctx.fillStyle = theme.scoreLabel;
      ctx.font = `${Math.round(this.rpx(16))}px system-ui`;
      ctx.textAlign = 'right';
      ctx.fillText('BEST', statsX, centerY - this.rpx(16));
      
      ctx.fillStyle = theme.scoreValue;
      ctx.font = `bold ${Math.round(this.rpx(30))}px system-ui`;
      ctx.fillText(bestScore.toString(), statsX, centerY + this.rpx(12));
      
      if (hasSave) {
        const saveBadgeX = card.x + card.width - this.rpx(100);
        const saveBadgeY = card.y + this.rpx(20);
        const badgeWidth = this.rpx(72);
        const badgeHeight = this.rpx(36);
        
        const badgeGradient = ctx.createLinearGradient(saveBadgeX, saveBadgeY, saveBadgeX + badgeWidth, saveBadgeY);
        badgeGradient.addColorStop(0, theme.cardAccent[0]);
        badgeGradient.addColorStop(1, theme.cardAccent[1]);
        
        ctx.fillStyle = badgeGradient;
        this.drawRoundedRect(saveBadgeX, saveBadgeY, badgeWidth, badgeHeight, this.rpx(18));
        ctx.fill();
        
        ctx.fillStyle = this.isDark ? '#0D1B2A' : '#FFFFFF';
        ctx.font = `bold ${Math.round(this.rpx(16))}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('继续', saveBadgeX + badgeWidth / 2, saveBadgeY + badgeHeight / 2);
      }
    }
  }
  
  renderHome() {
    this.drawBackground();
    this.drawHomeTitle();
    this.drawGameTypeCards();
    this.drawLeaderboardButton();
  }
  
  render() {
    if (this.currentScene === SCENE.HOME) {
      this.renderHome();
    }
  }
  
  gameLoop() {
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

module.exports = {
  BaseGame
};
