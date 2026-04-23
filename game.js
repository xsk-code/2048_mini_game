const { canBoardMove, createEmptyBoard } = require('./game-logic');
const { getModeById, getDefaultMode, getAllModes, getModesByGameType } = require('./mode-config');
const { 
  loadBestScore, 
  saveBestScore, 
  loadSaveState, 
  saveSaveState, 
  hasSaveState,
  loadAllModesInfo,
  loadPopstarBestScore,
  savePopstarBestScore,
  loadPopstarSaveState,
  savePopstarSaveState,
  clearPopstarSaveState,
  hasPopstarSaveState,
  loadAllGameTypesInfo,
  loadWatersortBestScore,
  saveWatersortBestScore,
  loadWatersortSaveState,
  saveWatersortSaveState,
  clearWatersortSaveState,
  hasWatersortSaveState,
  loadWatersortBestMoves,
  saveWatersortBestMoves
} = require('./storage');
const { 
  POPSTAR_GRID_SIZE,
  getColorCount,
  createBoard,
  findConnected,
  canEliminate,
  hasValidMoves,
  calculateScore,
  calculateBonus,
  getTargetScore,
  countRemainingStars,
  isBoardFull,
  processElimination
} = require('./popstar-logic');
const {
  TUBE_CAPACITY,
  MAX_LEVEL,
  WATER_COLORS,
  WATER_COLORS_DARK,
  getColorCountForLevel,
  getTubeCountForLevel,
  getTopColor,
  getTopConsecutiveCount,
  getEmptySlotCount,
  canPour,
  pour,
  isTubeComplete,
  isLevelComplete,
  cloneTubes,
  undoMove,
  resetLevel,
  generateLevel
} = require('./watersort-logic');
const { getSoundManager } = require('./sound-manager');

const SCENE = {
  HOME: 'home',
  HOME_2048_MODE: 'home_2048_mode',
  GAME_2048: 'game_2048',
  GAME_POPSTAR: 'game_popstar',
  POPSTAR_CONFIRM: 'popstar_confirm',
  GAME_WATERSORT: 'game_watersort',
  WATERSORT_CONFIRM: 'watersort_confirm'
};

const themes = {
  light: {
    background: '#E8E0D8',
    containerBg: '#E8E0D8',
    boardBg: '#D8D0C8',
    cellBg: '#E0D8D0',
    titleText: '#4A5E72',
    subtitleText: '#8BA8C4',
    scoreCardBg: '#D8D0C8',
    scoreLabel: '#7A96B0',
    scoreValue: '#4A5E72',
    hintText: '#8BA8C4',
    buttonBg: '#7EB8E6',
    buttonText: '#FFFFFF',
    themeBtnBg: '#D8D0C8',
    overlayBg: 'rgba(232, 224, 216, 0.95)',
    titleGradient: ['#7EB8E6', '#A8D4FF'],
    scoreGradient: ['#7EB8E6', '#A8D4FF'],
    cardGradient: ['#D8D0C8', '#E8E0D8'],
    cardAccent: ['#7EB8E6', '#A8D4FF'],
    tiles: {
      2: { bg: '#E8DCC8', text: '#6B5D4F', glow: null },
      4: { bg: '#C0D8C8', text: '#3A6B50', glow: null },
      8: { bg: '#E89060', text: '#FFFFFF', glow: null },
      16: { bg: '#E87030', text: '#FFFFFF', glow: null },
      32: { bg: '#E8A020', text: '#FFFFFF', glow: null },
      64: { bg: '#D04828', text: '#FFFFFF', glow: null },
      128: { bg: '#C8A830', text: '#FFFFFF', glow: '#C8A830' },
      256: { bg: '#38A878', text: '#FFFFFF', glow: '#38A878' },
      512: { bg: '#3878B8', text: '#FFFFFF', glow: '#3878B8' },
      1024: { bg: '#5848A8', text: '#FFFFFF', glow: '#5848A8' },
      2048: { bg: '#883898', text: '#FFFFFF', glow: '#883898' },
      4096: { bg: '#A83058', text: '#FFFFFF', glow: '#A83058' },
      8192: { bg: '#882028', text: '#FFFFFF', glow: '#882028' }
    },
    popstarStars: [
      { bg: '#FF8BA0', bgEnd: '#E86080', starBg: '#FFA8B8', starBgEnd: '#E86080', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(200, 50, 80, 0.55)', text: '#FFFFFF', glow: '#FF8BA0', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#7EB8E6', bgEnd: '#5090C8', starBg: '#9DD0FF', starBgEnd: '#5090C8', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(40, 90, 140, 0.55)', text: '#FFFFFF', glow: '#7EB8E6', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#88D8B0', bgEnd: '#50B888', starBg: '#A8E8C8', starBgEnd: '#50B888', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(40, 120, 80, 0.55)', text: '#FFFFFF', glow: '#88D8B0', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#FFD466', bgEnd: '#E8B030', starBg: '#FFE090', starBgEnd: '#E8B030', starHighlight: 'rgba(255, 255, 255, 0.6)', starShadow: 'rgba(160, 120, 20, 0.55)', text: '#6B5D4F', glow: '#FFD466', highlight: 'rgba(255, 255, 255, 0.30)' },
      { bg: '#B8A0D8', bgEnd: '#9070B0', starBg: '#D0B8F0', starBgEnd: '#9070B0', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(100, 60, 130, 0.55)', text: '#FFFFFF', glow: '#B8A0D8', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#FFB070', bgEnd: '#E88040', starBg: '#FFC898', starBgEnd: '#E88040', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(180, 80, 30, 0.55)', text: '#FFFFFF', glow: '#FFB070', highlight: 'rgba(255, 255, 255, 0.25)' }
    ],
    watersortTube: {
      wall: 'rgba(180, 200, 220, 0.6)',
      inner: 'rgba(240, 245, 250, 0.3)',
      highlight: 'rgba(255, 255, 255, 0.25)'
    },
    watersortLiquids: [
      { light: '#FF6B8A', dark: '#E8506E', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#5BA8E8', dark: '#4088C8', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#5EC89A', dark: '#40A878', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#FFD060', dark: '#E8B040', highlight: 'rgba(255,255,255,0.40)' },
      { light: '#B890D8', dark: '#9870B8', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#FFA060', dark: '#E88040', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#FF8CB8', dark: '#E87098', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#50C8D8', dark: '#38A8B8', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#C89068', dark: '#A87048', highlight: 'rgba(255,255,255,0.30)' },
      { light: '#A0A8B8', dark: '#808898', highlight: 'rgba(255,255,255,0.30)' }
    ]
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
    cardGradient: ['#1B3A5C', '#0D1B2A'],
    cardAccent: ['#88D8B0', '#6CD4A0'],
    tiles: {
      2: { bg: '#5A5048', text: '#D8D0C0', glow: null },
      4: { bg: '#3E5850', text: '#A8C8B8', glow: null },
      8: { bg: '#9A5838', text: '#FFFFFF', glow: null },
      16: { bg: '#AA5028', text: '#FFFFFF', glow: null },
      32: { bg: '#AA8020', text: '#FFFFFF', glow: null },
      64: { bg: '#C03820', text: '#FFFFFF', glow: null },
      128: { bg: '#B09028', text: '#FFFFFF', glow: '#B09028' },
      256: { bg: '#30A868', text: '#FFFFFF', glow: '#30A868' },
      512: { bg: '#3078B8', text: '#FFFFFF', glow: '#3078B8' },
      1024: { bg: '#5848A8', text: '#FFFFFF', glow: '#5848A8' },
      2048: { bg: '#883090', text: '#FFFFFF', glow: '#883090' },
      4096: { bg: '#A83058', text: '#FFFFFF', glow: '#A83058' },
      8192: { bg: '#902020', text: '#FFFFFF', glow: '#902020' }
    },
    popstarStars: [
      { bg: '#E87090', bgEnd: '#C05070', starBg: '#FF90B0', starBgEnd: '#C05070', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(150, 30, 60, 0.65)', text: '#FFFFFF', glow: '#E87090', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#5090C8', bgEnd: '#3070A8', starBg: '#70B0E8', starBgEnd: '#3070A8', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(20, 60, 100, 0.65)', text: '#FFFFFF', glow: '#5090C8', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#50B888', bgEnd: '#308868', starBg: '#70D8A8', starBgEnd: '#308868', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(20, 90, 60, 0.65)', text: '#FFFFFF', glow: '#50B888', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#E8B840', bgEnd: '#C89820', starBg: '#FFD060', starBgEnd: '#C89820', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(130, 100, 10, 0.65)', text: '#0D1B2A', glow: '#E8B840', highlight: 'rgba(255, 255, 255, 0.20)' },
      { bg: '#9078B8', bgEnd: '#705898', starBg: '#B098D8', starBgEnd: '#705898', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(70, 40, 100, 0.65)', text: '#FFFFFF', glow: '#9078B8', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#E89050', bgEnd: '#C87030', starBg: '#FFB070', starBgEnd: '#C87030', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(150, 70, 20, 0.65)', text: '#FFFFFF', glow: '#E89050', highlight: 'rgba(255, 255, 255, 0.15)' }
    ],
    watersortTube: {
      wall: 'rgba(100, 130, 170, 0.4)',
      inner: 'rgba(30, 50, 80, 0.3)',
      highlight: 'rgba(255, 255, 255, 0.15)'
    },
    watersortLiquids: [
      { light: '#E86080', dark: '#C05070', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#4890C8', dark: '#3070A8', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#48B888', dark: '#309868', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#E8B040', dark: '#C89020', highlight: 'rgba(255,255,255,0.30)' },
      { light: '#9078B8', dark: '#705898', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#E88848', dark: '#C86828', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#E878A8', dark: '#C85888', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#40B0C0', dark: '#2890A0', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#B88058', dark: '#986038', highlight: 'rgba(255,255,255,0.20)' },
      { light: '#9098A8', dark: '#707888', highlight: 'rgba(255,255,255,0.20)' }
    ]
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
    
    this.currentScene = SCENE.HOME;
    this.currentMode = null;
    
    this.board = [];
    this.score = 0;
    this.bestScore = 0;
    this.isGameOver = false;
    this.tiles = [];
    this.tileId = 0;
    
    this.popstarBoard = [];
    this.popstarScore = 0;
    this.popstarTotalScore = 0;
    this.popstarLevel = 1;
    this.popstarTargetScore = 1000;
    this.popstarBestScore = 0;
    this.popstarIsGameOver = false;
    this.popstarIsLevelClear = false;
    this.popstarHighlighted = new Set();
    
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
    this.watersortConfirmContinueBtn = null;
    this.watersortConfirmNewBtn = null;
    this.watersortConfirmBackBtn = null;
    
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMoving = false;
    
    this.animatingTiles = [];
    this.isAnimating = false;
    
    this.modeCards = [];
    this.gameTypeCards = [];
    
    this.soundManager = getSoundManager();
    
    this.calculateDimensions();
    this.initHome();
    this.setupTouchEvents();
    this.gameLoop();
  }
  
  rpx(pxValue) {
    return Math.round((pxValue / 750) * this.screenWidth);
  }
  
  get gridSize() {
    return this.currentMode ? this.currentMode.gridSize : 4;
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
    this.cellSize = (this.boardSize - this.cellGap * (this.gridSize + 1)) / this.gridSize;
    
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

    this.scoreCardWidth = this.rpx(160);
    this.scoreCardHeight = this.rpx(96);
    
    this.boardRadius = this.rpx(20);
    this.cellRadius = this.rpx(12);
    this.popstarCellRadius = this.rpx(5);
    
    this.cardWidth = this.rpx(600);
    this.cardHeight = this.rpx(180);
    this.cardRadius = this.rpx(32);
    this.cardGap = this.rpx(32);
    
    this.recalculateGameLayout();
  }
  
  recalculateGameLayout() {
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
    
    this.gameStartY = (this.screenHeight - totalContentHeight) / 2;
    
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
  
  recalculate2048ModeLayout() {
    const modes = getModesByGameType('2048');
    const totalCardsHeight = modes.length * this.cardHeight + (modes.length - 1) * this.cardGap;
    const headerHeight = this.titleFontSize + this.subtitleFontSize + this.rpx(16) + this.rpx(60);
    
    const totalContentHeight = headerHeight + totalCardsHeight;
    const startY = (this.screenHeight - totalContentHeight) / 2;
    
    let currentY = startY;
    
    this.homeTitleY = currentY + this.titleFontSize / 2;
    this.homeSubtitleY = this.homeTitleY + this.titleFontSize / 2 + this.rpx(16) + this.subtitleFontSize / 2;
    
    currentY += headerHeight;
    
    this.modeCards = modes.map((mode, index) => {
      const card = {
        ...mode,
        x: this.gameX + (this.gameWidth - this.cardWidth) / 2,
        y: currentY + index * (this.cardHeight + this.cardGap),
        width: this.cardWidth,
        height: this.cardHeight
      };
      return card;
    });
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
  
  initHome() {
    this.currentScene = SCENE.HOME;
    this.recalculateHomeLayout();
  }
  
  init2048ModeSelect() {
    this.currentScene = SCENE.HOME_2048_MODE;
    this.recalculate2048ModeLayout();
  }
  
  enterGameType(gameTypeId) {
    if (gameTypeId === '2048') {
      this.init2048ModeSelect();
    } else if (gameTypeId === 'popstar') {
      if (hasPopstarSaveState()) {
        this.initPopstarConfirm();
      } else {
        this.enterPopstarGame();
      }
    } else if (gameTypeId === 'watersort') {
      if (hasWatersortSaveState()) {
        this.initWatersortConfirm();
      } else {
        this.enterWatersortGame();
      }
    }
  }
  
  enterMode(modeId) {
    this.currentMode = getModeById(modeId);
    this.calculateDimensions();
    
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
    this.currentScene = SCENE.GAME_2048;
  }
  
  initPopstarConfirm() {
    this.currentScene = SCENE.POPSTAR_CONFIRM;
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
    this.currentScene = SCENE.GAME_POPSTAR;
  }
  
  startNewPopstarGame() {
    clearPopstarSaveState();
    this.initPopstarGame();
    this.currentScene = SCENE.GAME_POPSTAR;
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
  
  get popstarGridSize() {
    return POPSTAR_GRID_SIZE;
  }
  
  get popstarCellSize() {
    return (this.boardSize - this.popstarCellGap * (this.popstarGridSize + 1)) / this.popstarGridSize;
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
  
  initWatersortConfirm() {
    this.currentScene = SCENE.WATERSORT_CONFIRM;
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
    this.currentScene = SCENE.GAME_WATERSORT;
  }
  
  startNewWatersortGame() {
    clearWatersortSaveState();
    this.watersortLevel = 1;
    this.initWatersortGame();
    this.currentScene = SCENE.GAME_WATERSORT;
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
    this.currentScene = SCENE.GAME_WATERSORT;
  }
  
  resetWatersortLevel() {
    const result = resetLevel(this.watersortInitialTubes);
    this.watersortTubes = result.tubes;
    this.watersortHistory = result.history;
    this.watersortMoves = result.moves;
    this.watersortIsComplete = false;
    this.watersortSelectedTube = null;
    this.watersortTubeOffsets = new Array(this.watersortTubeCount).fill(0);
    this.soundManager.playWatersortUndo();
  }
  
  undoWatersortMove() {
    const result = undoMove(this.watersortTubes, this.watersortHistory);
    if (result) {
      this.watersortTubes = result.tubes;
      this.watersortHistory = result.history;
      this.watersortMoves--;
      if (this.watersortMoves < 0) this.watersortMoves = 0;
      this.watersortSelectedTube = null;
      this.soundManager.playWatersortUndo();
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
  
  goBackHome() {
    if (this.currentScene === SCENE.GAME_2048) {
      this.saveCurrentState();
      this.currentMode = null;
    } else if (this.currentScene === SCENE.GAME_POPSTAR) {
      this.savePopstarCurrentState();
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      this.saveWatersortCurrentState();
    } else if (this.currentScene === SCENE.HOME_2048_MODE) {
      // Do nothing, just go back to home
    }
    this.initHome();
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
  
  setupTouchEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      
      const buttonClicked = this.checkButtonClick(touch.clientX, touch.clientY);
      
      if (!buttonClicked && this.currentScene === SCENE.GAME_POPSTAR && !this.popstarIsGameOver && !this.popstarIsLevelClear) {
        this.handlePopstarTouchStart(touch.clientX, touch.clientY);
      }
    });
    
    wx.onTouchEnd((e) => {
      if (this.currentScene === SCENE.GAME_2048) {
        if (this.isGameOver) return;
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
      } else if (this.currentScene === SCENE.GAME_POPSTAR) {
        if (!this.popstarIsGameOver && !this.popstarIsLevelClear) {
          const touch = e.changedTouches[0];
          this.handlePopstarTouchEnd(touch.clientX, touch.clientY);
        }
      } else if (this.currentScene === SCENE.GAME_WATERSORT) {
        if (!this.watersortIsComplete && !this.watersortIsAnimating) {
          const touch = e.changedTouches[0];
          this.handleWatersortTouch(touch.clientX, touch.clientY);
        }
      }
      
      this.touchStartX = 0;
      this.touchStartY = 0;
    });
  }
  
  handlePopstarTouchStart(x, y) {
    const cellX = Math.floor((x - this.boardX - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
    const cellY = Math.floor((y - this.boardY - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
    
    if (cellX >= 0 && cellX < this.popstarGridSize && cellY >= 0 && cellY < this.popstarGridSize) {
      if (this.popstarBoard[cellY][cellX] !== null) {
        const connected = findConnected(this.popstarBoard, cellY, cellX);
        if (connected.size >= 2) {
          this.popstarHighlighted = connected;
        } else {
          this.popstarHighlighted = new Set();
          this.soundManager.playTap();
        }
      }
    }
  }
  
  handlePopstarTouchEnd(x, y) {
    if (this.popstarHighlighted.size > 0) {
      const cellX = Math.floor((x - this.boardX - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
      const cellY = Math.floor((y - this.boardY - this.popstarCellGap) / (this.popstarCellSize + this.popstarCellGap));
      
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
    
    this.soundManager.playElimination(count);
    
    this.popstarScore += scoreGain;
    this.popstarTotalScore += scoreGain;
    
    if (this.popstarScore > this.popstarBestScore) {
      this.popstarBestScore = this.popstarScore;
      savePopstarBestScore(this.popstarBestScore);
    }
    
    this.popstarBoard = processElimination(this.popstarBoard, positions);
    
    this.soundManager.playFall();
    
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
        this.soundManager.playLevelClear();
      } else {
        this.popstarIsGameOver = true;
        this.soundManager.playPopstarGameOver();
      }
      
      this.savePopstarCurrentState();
    }
  }
  
  checkButtonClick(x, y) {
    let buttonClicked = false;
    
    if (this.currentScene === SCENE.POPSTAR_CONFIRM) {
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
        this.goBackHome();
        buttonClicked = true;
      }
    } else if (this.currentScene === SCENE.WATERSORT_CONFIRM) {
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
        this.goBackHome();
        buttonClicked = true;
      }
    } else if (this.currentScene === SCENE.HOME) {
      for (const card of this.gameTypeCards) {
        if (x >= card.x && x <= card.x + card.width &&
            y >= card.y && y <= card.y + card.height) {
          this.enterGameType(card.id);
          buttonClicked = true;
          break;
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
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      buttonClicked = this.checkWatersortButtonClick(x, y);
    } else {
      const totalActionWidth = this.newGameBtnWidth + this.actionBtnsGap + this.homeBtnSize + this.actionBtnsGap + this.soundBtnSize + this.actionBtnsGap + this.themeBtnSize;
      const actionStartX = this.gameX + (this.gameWidth - totalActionWidth) / 2;
      
      const newGameBtnX = actionStartX;
      const newGameBtnY = this.actionY;
      if (x >= newGameBtnX && x <= newGameBtnX + this.newGameBtnWidth && 
          y >= newGameBtnY && y <= newGameBtnY + this.newGameBtnHeight) {
        if (this.currentScene === SCENE.GAME_2048) {
          this.initGame();
        } else if (this.currentScene === SCENE.GAME_POPSTAR) {
          if (this.popstarIsLevelClear) {
            this.nextPopstarLevel();
          } else {
            this.restartCurrentPopstarLevel();
          }
        }
        buttonClicked = true;
      }
      
      if (!buttonClicked) {
        const homeBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap;
        const homeBtnY = this.actionY;
        if (x >= homeBtnX && x <= homeBtnX + this.homeBtnSize && 
            y >= homeBtnY && y <= homeBtnY + this.homeBtnSize) {
          this.goBackHome();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        const soundBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap + this.homeBtnSize + this.actionBtnsGap;
        const soundBtnY = this.actionY;
        if (x >= soundBtnX && x <= soundBtnX + this.soundBtnSize && 
            y >= soundBtnY && y <= soundBtnY + this.soundBtnSize) {
          this.soundManager.toggle();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        const themeBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap + this.homeBtnSize + this.actionBtnsGap + this.soundBtnSize + this.actionBtnsGap;
        const themeBtnY = this.actionY;
        if (x >= themeBtnX && x <= themeBtnX + this.themeBtnSize && 
            y >= themeBtnY && y <= themeBtnY + this.themeBtnSize) {
          this.isDark = !this.isDark;
          this.saveTheme();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        if (this.currentScene === SCENE.GAME_2048 && this.isGameOver &&
            x >= this.boardX && x <= this.boardX + this.boardSize &&
            y >= this.boardY && y <= this.boardY + this.boardSize) {
          this.initGame();
          buttonClicked = true;
        }
      }
      
      if (!buttonClicked) {
        if (this.currentScene === SCENE.GAME_POPSTAR && (this.popstarIsGameOver || this.popstarIsLevelClear) &&
            x >= this.boardX && x <= this.boardX + this.boardSize &&
            y >= this.boardY && y <= this.boardY + this.boardSize) {
          if (this.popstarIsLevelClear) {
            this.nextPopstarLevel();
          } else {
            this.restartCurrentPopstarLevel();
          }
          buttonClicked = true;
        }
      }
    }
    
    if (buttonClicked) {
      this.soundManager.playButtonClick();
    }
    
    return buttonClicked;
  }
  
  checkWatersortButtonClick(x, y) {
    let clicked = false;
    
    const undoBtnWidth = this.rpx(120);
    const undoBtnHeight = this.rpx(64);
    const resetBtnWidth = this.rpx(120);
    const resetBtnHeight = this.rpx(64);
    const smallBtnSize = this.rpx(72);
    
    const totalActionWidth = undoBtnWidth + this.actionBtnsGap + resetBtnWidth + this.actionBtnsGap + smallBtnSize + this.actionBtnsGap + smallBtnSize + this.actionBtnsGap + smallBtnSize;
    const actionStartX = this.gameX + (this.gameWidth - totalActionWidth) / 2;
    const actionY = this.watersortActionY;
    
    let currentX = actionStartX;
    
    const undoBtnX = currentX;
    currentX += undoBtnWidth + this.actionBtnsGap;
    
    const resetBtnX = currentX;
    currentX += resetBtnWidth + this.actionBtnsGap;
    
    const homeBtnX = currentX;
    currentX += smallBtnSize + this.actionBtnsGap;
    
    const soundBtnX = currentX;
    currentX += smallBtnSize + this.actionBtnsGap;
    
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
      this.goBackHome();
      clicked = true;
    } else if (x >= soundBtnX && x <= soundBtnX + smallBtnSize && y >= actionY && y <= actionY + smallBtnSize) {
      this.soundManager.toggle();
      clicked = true;
    } else if (x >= themeBtnX && x <= themeBtnX + smallBtnSize && y >= actionY && y <= actionY + smallBtnSize) {
      this.isDark = !this.isDark;
      this.saveTheme();
      clicked = true;
    } else if (this.watersortIsComplete &&
        x >= this.boardX && x <= this.boardX + this.boardSize &&
        y >= this.boardY && y <= this.boardY + this.boardSize) {
      if (this.watersortLevel >= MAX_LEVEL) {
        this.goBackHome();
      } else {
        this.nextWatersortLevel();
      }
      clicked = true;
    }
    
    return clicked;
  }
  
  recalculateWatersortLayout() {
    const tubeCount = this.watersortTubeCount || 5;
    
    const maxCols = Math.min(tubeCount, 4);
    const rows = Math.ceil(tubeCount / maxCols);
    const cols = Math.min(tubeCount, maxCols);
    
    const maxTubeWidth = this.rpx(72);
    const tubeGap = this.rpx(24);
    const rowGap = this.rpx(32);
    
    const availableWidth = this.boardSize;
    const totalGapWidth = (cols - 1) * tubeGap;
    let tubeWidth = Math.min(maxTubeWidth, (availableWidth - totalGapWidth) / cols);
    
    const tubeHeight = tubeWidth * 3.2;
    const tubeWallWidth = this.rpx(2);
    const tubeOpenWidth = tubeWidth + this.rpx(4);
    
    const totalTubesWidth = cols * tubeWidth + (cols - 1) * tubeGap;
    const totalTubesHeight = rows * tubeHeight + (rows - 1) * rowGap;
    
    const titleHeight = this.titleFontSize + this.rpx(16);
    const scoreCardsHeight = this.scoreCardHeight;
    const headerHeight = titleHeight + this.titleRowMarginBottom + scoreCardsHeight;
    
    const undoBtnHeight = this.rpx(64);
    const actionHeight = undoBtnHeight;
    
    const totalContentHeight = headerHeight + this.headerSectionMarginBottom + totalTubesHeight + this.actionSectionMarginTop + actionHeight;
    const gameStartY = (this.screenHeight - totalContentHeight) / 2;
    
    let currentY = gameStartY;
    
    this.watersortTitleY = currentY + this.titleFontSize / 2;
    currentY += titleHeight + this.titleRowMarginBottom;
    
    this.watersortScoreCardsY = currentY;
    currentY += scoreCardsHeight + this.headerSectionMarginBottom;
    
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
      
      const tubeX = this.boardX + (this.boardSize - totalTubesWidth) / 2 + col * (tubeWidth + tubeGap);
      const tubeY = this.watersortTubeAreaY + row * (tubeHeight + rowGap);
      
      this.watersortTubesLayout.push({
        index: i,
        x: tubeX,
        y: tubeY,
        width: tubeWidth,
        height: tubeHeight,
        hitX: tubeX - this.rpx(8),
        hitY: tubeY - this.rpx(8),
        hitWidth: tubeWidth + this.rpx(16),
        hitHeight: tubeHeight + this.rpx(16)
      });
    }
    
    currentY += totalTubesHeight + this.actionSectionMarginTop;
    this.watersortActionY = currentY;
  }
  
  getWatersortLiquidColor(colorIndex) {
    const theme = this.isDark ? themes.dark : themes.light;
    const colors = theme.watersortLiquids;
    return colors[colorIndex] || colors[0];
  }
  
  drawWatersortTitle() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const gradient = ctx.createLinearGradient(
      this.gameX, this.watersortTitleY - this.rpx(40),
      this.gameX + this.rpx(180), this.watersortTitleY
    );
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.titleFontSize * 0.75)}px system-ui`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('WATER SORT', this.gameX, this.watersortTitleY);
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `bold ${Math.round(this.titleFontSize * 0.5)}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${this.watersortLevel}`, this.gameX + this.gameWidth, this.watersortTitleY);
  }
  
  drawWatersortScoreCards() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const scoreCardWidth = this.rpx(140);
    const scoreCardHeight = this.rpx(80);
    
    const totalWidth = scoreCardWidth * 2 + this.scoreCardsGap;
    const startX = this.gameX + (this.gameWidth - totalWidth) / 2;
    
    const bestMovesText = this.watersortBestMoves === Infinity ? '--' : this.watersortBestMoves.toString();
    
    this.drawWatersortScoreCard('MOVES', this.watersortMoves, startX, this.watersortScoreCardsY, scoreCardWidth, scoreCardHeight);
    this.drawWatersortScoreCard('BEST', bestMovesText, startX + scoreCardWidth + this.scoreCardsGap, this.watersortScoreCardsY, scoreCardWidth, scoreCardHeight);
  }
  
  drawWatersortScoreCard(label, value, x, y, width, height) {
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
    
    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `bold ${Math.round(this.scoreLabelFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height * 0.3);
    
    ctx.fillStyle = theme.scoreValue;
    ctx.font = `bold ${Math.round(this.scoreValueFontSize * 1.2)}px system-ui`;
    ctx.fillText(value.toString(), x + width / 2, y + height * 0.65);
  }
  
  drawWatersortTube(tubeIndex) {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    const tube = this.watersortTubes[tubeIndex];
    const layout = this.watersortTubesLayout[tubeIndex];
    const isSelected = this.watersortSelectedTube === tubeIndex;
    const isComplete = isTubeComplete(tube);
    
    const tubeWidth = layout.width;
    const tubeHeight = layout.height;
    const wallWidth = this.watersortTubeWallWidth;
    const openWidth = this.watersortTubeOpenWidth;
    
    const selectOffset = isSelected ? this.rpx(20) : 0;
    const baseX = layout.x;
    const baseY = layout.y - selectOffset;
    
    const liquidHeight = (tubeHeight - this.rpx(16)) / TUBE_CAPACITY;
    const liquidRadius = this.rpx(2);
    const bottomRadius = tubeWidth / 2;
    
    ctx.save();
    
    ctx.beginPath();
    ctx.moveTo(baseX + (tubeWidth - openWidth) / 2, baseY);
    ctx.lineTo(baseX + (tubeWidth - openWidth) / 2 + openWidth, baseY);
    ctx.lineTo(baseX + tubeWidth - wallWidth, baseY + this.rpx(8));
    ctx.lineTo(baseX + tubeWidth - wallWidth, baseY + tubeHeight - bottomRadius);
    ctx.quadraticCurveTo(
      baseX + tubeWidth - wallWidth, baseY + tubeHeight,
      baseX + tubeWidth / 2, baseY + tubeHeight
    );
    ctx.quadraticCurveTo(
      baseX + wallWidth, baseY + tubeHeight,
      baseX + wallWidth, baseY + tubeHeight - bottomRadius
    );
    ctx.lineTo(baseX + wallWidth, baseY + this.rpx(8));
    ctx.closePath();
    
    ctx.fillStyle = theme.watersortTube.inner;
    ctx.fill();
    
    ctx.strokeStyle = theme.watersortTube.wall;
    ctx.lineWidth = wallWidth;
    ctx.stroke();
    
    const liquidColors = theme.watersortLiquids;
    let hasLiquid = false;
    
    for (let layer = TUBE_CAPACITY - 1; layer >= 0; layer--) {
      const colorIndex = tube[layer];
      if (colorIndex === null) continue;
      
      hasLiquid = true;
      const liquidY = baseY + tubeHeight - this.rpx(8) - (TUBE_CAPACITY - layer) * liquidHeight;
      const color = liquidColors[colorIndex] || liquidColors[0];
      
      const isTopLayer = layer === tube.findIndex((c, i) => c !== null && tube.slice(i + 1).every(n => n === null || n === c));
      
      ctx.beginPath();
      
      if (layer === 0) {
        const radius = tubeWidth / 2 - wallWidth - this.rpx(4);
        ctx.moveTo(baseX + wallWidth + this.rpx(4), liquidY);
        ctx.lineTo(baseX + tubeWidth - wallWidth - this.rpx(4), liquidY);
        ctx.lineTo(baseX + tubeWidth - wallWidth - this.rpx(4), liquidY + liquidHeight - radius);
        ctx.quadraticCurveTo(
          baseX + tubeWidth - wallWidth - this.rpx(4),
          liquidY + liquidHeight,
          baseX + tubeWidth / 2,
          liquidY + liquidHeight
        );
        ctx.quadraticCurveTo(
          baseX + wallWidth + this.rpx(4),
          liquidY + liquidHeight,
          baseX + wallWidth + this.rpx(4),
          liquidY + liquidHeight - radius
        );
        ctx.closePath();
      } else {
        ctx.rect(
          baseX + wallWidth + this.rpx(4),
          liquidY,
          tubeWidth - wallWidth * 2 - this.rpx(8),
          liquidHeight
        );
      }
      
      const gradient = ctx.createLinearGradient(
        baseX + tubeWidth / 2, liquidY,
        baseX + tubeWidth / 2, liquidY + liquidHeight
      );
      gradient.addColorStop(0, color.light);
      gradient.addColorStop(1, color.dark);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      if (isTopLayer || isSelected) {
        ctx.fillStyle = color.highlight;
        ctx.fillRect(
          baseX + wallWidth + this.rpx(6),
          liquidY + this.rpx(2),
          (tubeWidth - wallWidth * 2 - this.rpx(12)) * 0.4,
          liquidHeight * 0.4
        );
      }
    }
    
    if (isComplete && hasLiquid && !tube.every(c => c === null)) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `bold ${Math.round(tubeWidth * 0.4)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', baseX + tubeWidth / 2, baseY + this.rpx(24));
    }
    
    ctx.restore();
  }
  
  drawWatersortTubes() {
    for (let i = 0; i < this.watersortTubeCount; i++) {
      this.drawWatersortTube(i);
    }
  }
  
  drawWatersortActionButtons() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const undoBtnWidth = this.rpx(120);
    const undoBtnHeight = this.rpx(64);
    const resetBtnWidth = this.rpx(120);
    const resetBtnHeight = this.rpx(64);
    const smallBtnSize = this.rpx(72);
    
    const totalActionWidth = undoBtnWidth + this.actionBtnsGap + resetBtnWidth + this.actionBtnsGap + smallBtnSize + this.actionBtnsGap + smallBtnSize + this.actionBtnsGap + smallBtnSize;
    const actionStartX = this.gameX + (this.gameWidth - totalActionWidth) / 2;
    const actionY = this.watersortActionY;
    
    let currentX = actionStartX;
    
    const hasHistory = this.watersortHistory.length > 0;
    
    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(126, 184, 230, 0.2)';
    ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);
    
    ctx.fillStyle = hasHistory ? theme.buttonBg : theme.themeBtnBg;
    this.drawRoundedRect(currentX, actionY, undoBtnWidth, undoBtnHeight, this.rpx(32));
    ctx.fill();
    
    ctx.fillStyle = hasHistory ? theme.buttonText : theme.subtitleText;
    ctx.font = `bold ${Math.round(this.actionBtnFontSize * 0.9)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↩ UNDO', currentX + undoBtnWidth / 2, actionY + undoBtnHeight / 2);
    
    currentX += undoBtnWidth + this.actionBtnsGap;
    
    ctx.fillStyle = theme.buttonBg;
    this.drawRoundedRect(currentX, actionY, resetBtnWidth, resetBtnHeight, this.rpx(32));
    ctx.fill();
    
    ctx.fillStyle = theme.buttonText;
    ctx.fillText('↺ RESET', currentX + resetBtnWidth / 2, actionY + resetBtnHeight / 2);
    
    currentX += resetBtnWidth + this.actionBtnsGap;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(currentX, actionY, smallBtnSize, smallBtnSize, Math.round(smallBtnSize / 2));
    ctx.fill();
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `${Math.round(this.rpx(28))}px system-ui`;
    ctx.fillText('🏠', currentX + smallBtnSize / 2, actionY + smallBtnSize / 2);
    
    currentX += smallBtnSize + this.actionBtnsGap;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(currentX, actionY, smallBtnSize, smallBtnSize, Math.round(smallBtnSize / 2));
    ctx.fill();
    
    const soundIcon = this.soundManager.isEnabled() ? '🔊' : '🔇';
    ctx.fillText(soundIcon, currentX + smallBtnSize / 2, actionY + smallBtnSize / 2);
    
    currentX += smallBtnSize + this.actionBtnsGap;
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(currentX, actionY, smallBtnSize, smallBtnSize, Math.round(smallBtnSize / 2));
    ctx.fill();
    
    ctx.fillText(this.isDark ? '☀️' : '🌙', currentX + smallBtnSize / 2, actionY + smallBtnSize / 2);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  
  drawWatersortOverlay() {
    if (!this.watersortIsComplete) return;
    
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
    
    const gradient = ctx.createLinearGradient(centerX - this.rpx(120), centerY - this.rpx(60), centerX + this.rpx(120), centerY - this.rpx(20));
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.rpx(32))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - this.rpx(50));
    
    ctx.fillStyle = theme.scoreValue;
    ctx.font = `bold ${Math.round(this.rpx(24))}px system-ui`;
    if (subMessage1) {
      ctx.fillText(subMessage1, centerX, centerY - this.rpx(10));
    }
    if (subMessage2) {
      ctx.fillText(subMessage2, centerX, centerY + this.rpx(20));
    }
    if (subMessage3) {
      ctx.fillText(subMessage3, centerX, centerY + this.rpx(50));
    }
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.rpx(16))}px system-ui`;
    ctx.fillText('Tap to continue', centerX, centerY + this.rpx(70));
  }
  
  drawWatersortConfirmDialog() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const dialogWidth = this.rpx(600);
    const dialogHeight = this.rpx(400);
    const dialogX = this.gameX + (this.gameWidth - dialogWidth) / 2;
    const dialogY = this.screenHeight / 2 - dialogHeight / 2;
    
    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = this.isDark ? this.rpx(20) : this.rpx(12);
    ctx.shadowOffsetY = this.isDark ? this.rpx(6) : this.rpx(3);
    
    ctx.fillStyle = theme.overlayBg;
    this.drawRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, this.rpx(32));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    const centerX = dialogX + dialogWidth / 2;
    const centerY = dialogY + dialogHeight / 2;
    
    const gradient = ctx.createLinearGradient(centerX - this.rpx(100), centerY - this.rpx(80), centerX + this.rpx(100), centerY - this.rpx(40));
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.rpx(36))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('继续游戏？', centerX, centerY - this.rpx(80));
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.rpx(20))}px system-ui`;
    ctx.fillText(`当前进度：第 ${this.watersortLevel} 关，步数 ${this.watersortMoves}`, centerX, centerY - this.rpx(30));
    
    const btnWidth = this.rpx(240);
    const btnHeight = this.rpx(72);
    const btnGap = this.rpx(40);
    const btnY = centerY + this.rpx(40);
    const continueBtnX = centerX - btnWidth - btnGap / 2;
    const newBtnX = centerX + btnGap / 2;
    const backBtnY = btnY + btnHeight + this.rpx(24);
    const backBtnWidth = this.rpx(120);
    const backBtnX = centerX - backBtnWidth / 2;
    
    this.watersortConfirmContinueBtn = { x: continueBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.watersortConfirmNewBtn = { x: newBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.watersortConfirmBackBtn = { x: backBtnX, y: backBtnY, width: backBtnWidth, height: btnHeight };
    
    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.25)';
    ctx.shadowBlur = this.isDark ? this.rpx(12) : this.rpx(8);
    ctx.shadowOffsetY = this.isDark ? this.rpx(4) : this.rpx(2);
    
    ctx.fillStyle = theme.buttonBg;
    this.drawRoundedRect(continueBtnX, btnY, btnWidth, btnHeight, this.rpx(36));
    ctx.fill();
    
    this.drawRoundedRect(newBtnX, btnY, btnWidth, btnHeight, this.rpx(36));
    ctx.fill();
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(backBtnX, backBtnY, backBtnWidth, btnHeight, this.rpx(36));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = theme.buttonText;
    ctx.font = `bold ${Math.round(this.rpx(22))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('继续进度', continueBtnX + btnWidth / 2, btnY + btnHeight / 2);
    ctx.fillText('从第一关开始', newBtnX + btnWidth / 2, btnY + btnHeight / 2);
    
    ctx.fillStyle = theme.titleText;
    ctx.fillText('返回', backBtnX + backBtnWidth / 2, backBtnY + btnHeight / 2);
  }
  
  renderWatersort() {
    this.drawBackground();
    this.drawWatersortTitle();
    this.drawWatersortScoreCards();
    this.drawWatersortTubes();
    this.drawWatersortActionButtons();
    this.drawWatersortOverlay();
  }
  
  renderWatersortConfirm() {
    this.drawBackground();
    this.drawHomeTitle();
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
            this.soundManager.playWatersortSelect();
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
            
            this.soundManager.playWatersortPour();
            
            const fromComplete = isTubeComplete(this.watersortTubes[this.watersortSelectedTube]);
            const toComplete = isTubeComplete(this.watersortTubes[i]);
            if (fromComplete || toComplete) {
              this.soundManager.playWatersortComplete();
            }
            
            this.saveWatersortCurrentState();
            
            if (isLevelComplete(this.watersortTubes)) {
              this.watersortIsComplete = true;
              this.soundManager.playWatersortLevelClear();
              
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
              this.soundManager.playWatersortSelect();
            } else {
              this.soundManager.playWatersortInvalid();
            }
          }
        }
        
        break;
      }
    }
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
        this.soundManager.play2048Merge();
      }
      
      setTimeout(() => {
        this.addRandomTile();
        this.saveCurrentState();

        if (!this.canMove()) {
          this.isGameOver = true;
          this.soundManager.play2048GameOver();
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
  
  drawHomeTitle() {
    const theme = this.isDark ? themes.dark : themes.light;
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
    const theme = this.isDark ? themes.dark : themes.light;
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
    
    const targetText = this.currentMode ? 
      `Join the numbers and get to the ${this.currentMode.targetTile}!` :
      'Join the numbers and get to the 2048!';
    
    ctx.fillStyle = theme.hintText;
    ctx.font = `${Math.round(this.hintFontSize)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(targetText, this.gameX + this.gameWidth / 2, this.hintY);
  }
  
  drawModeCards() {
    const theme = this.isDark ? themes.dark : themes.light;
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

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
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

    const totalActionWidth = this.newGameBtnWidth + this.actionBtnsGap + this.homeBtnSize + this.actionBtnsGap + this.soundBtnSize + this.actionBtnsGap + this.themeBtnSize;
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

    const homeBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap;
    const homeBtnY = this.actionY;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(homeBtnX, homeBtnY, this.homeBtnSize, this.homeBtnSize, Math.round(this.homeBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${Math.round(this.rpx(28))}px system-ui`;
    ctx.fillText('🏠', homeBtnX + Math.round(this.homeBtnSize / 2), homeBtnY + Math.round(this.homeBtnSize / 2));

    const soundBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap + this.homeBtnSize + this.actionBtnsGap;
    const soundBtnY = this.actionY;

    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
    ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(soundBtnX, soundBtnY, this.soundBtnSize, this.soundBtnSize, Math.round(this.soundBtnSize / 2));
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${Math.round(this.rpx(30))}px system-ui`;
    const soundIcon = this.soundManager.isEnabled() ? '🔊' : '🔇';
    ctx.fillText(soundIcon, soundBtnX + Math.round(this.soundBtnSize / 2), soundBtnY + Math.round(this.soundBtnSize / 2));

    const themeBtnX = actionStartX + this.newGameBtnWidth + this.actionBtnsGap + this.homeBtnSize + this.actionBtnsGap + this.soundBtnSize + this.actionBtnsGap;
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
    if (!this.isGameOver) return;

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

    const message = 'Game Over';
    const subMessage = `Score: ${this.score}`;

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
  
  drawPopstarTitle() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const titleX = this.gameX + this.gameWidth / 2;
    
    const gradient = ctx.createLinearGradient(titleX - this.rpx(100), this.titleY - this.rpx(40), titleX + this.rpx(100), this.titleY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.titleFontSize * 0.8)}px system-ui`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('POPSTAR', this.gameX, this.titleY);
    
    ctx.fillStyle = theme.titleText;
    ctx.font = `bold ${Math.round(this.titleFontSize * 0.5)}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${this.popstarLevel}`, this.gameX + this.gameWidth, this.titleY);
  }
  
  drawPopstarScoreCards() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const totalWidth = this.scoreCardWidth * 2 + this.scoreCardsGap;
    const startX = this.gameX + (this.gameWidth - totalWidth) / 2;
    
    this.drawScoreCard('SCORE', this.popstarScore, startX, this.scoreCardsY, this.scoreCardWidth, this.scoreCardHeight);
    this.drawScoreCard('TARGET', this.popstarTargetScore, startX + this.scoreCardWidth + this.scoreCardsGap, this.scoreCardsY, this.scoreCardWidth, this.scoreCardHeight);
  }
  
  drawPopstarBoard() {
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
  }
  
  getPopstarStarPosition(row, col) {
    const cellSize = this.popstarCellSize;
    const gap = this.popstarCellGap;
    return {
      x: Math.round(this.boardX + gap + col * (cellSize + gap)),
      y: Math.round(this.boardY + gap + row * (cellSize + gap))
    };
  }
  
  getPopstarStarStyle(colorIndex) {
    const theme = this.isDark ? themes.dark : themes.light;
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
  
  drawPopstarStars() {
    const ctx = this.ctx;
    const cellSize = this.popstarCellSize;
    const gap = this.popstarCellGap;
    const radius = this.popstarCellRadius;

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

        ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(8);
        ctx.shadowOffsetX = this.isDark ? this.rpx(2) : this.rpx(1);
        ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.isDark ? this.rpx(28) : this.rpx(22);
        }

        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + cellSize);
        gradient.addColorStop(0, style.bg);
        gradient.addColorStop(1, style.bgEnd);
        ctx.fillStyle = gradient;
        this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (isHighlighted) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          this.drawRoundedRect(pos.x, pos.y, cellSize, cellSize, radius);
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
        
        const starDropShadowColor = style.starShadow || (this.isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.55)');
        
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
          ctx.shadowBlur = this.rpx(32);
          ctx.shadowOffsetX = this.rpx(5);
          ctx.shadowOffsetY = this.rpx(14);
        } else {
          ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.18)';
          ctx.shadowBlur = this.rpx(22);
          ctx.shadowOffsetX = this.rpx(4);
          ctx.shadowOffsetY = this.rpx(10);
        }
        
        this.drawRoundedStarPath(ctx, starCenterX, starCenterY, starOuterRadius, starInnerRadius, outerCornerRadius, innerCornerRadius);
        ctx.fillStyle = starBaseGradient;
        ctx.fill();
        
        if (isHighlighted && style.glow) {
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = this.rpx(14);
          ctx.shadowOffsetX = this.rpx(3);
          ctx.shadowOffsetY = this.rpx(6);
        } else {
          ctx.shadowColor = starDropShadowColor;
          ctx.shadowBlur = this.rpx(10);
          ctx.shadowOffsetX = this.rpx(2);
          ctx.shadowOffsetY = this.rpx(4);
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
        const highlightOpacity = this.isDark ? 0.55 : 0.75;
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
        const edgeHighlightOpacity = this.isDark ? 0.35 : 0.45;
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

    const gradient = ctx.createLinearGradient(centerX - this.rpx(100), centerY - this.rpx(40), centerX + this.rpx(100), centerY);
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);

    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.rpx(32))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY - this.rpx(40));

    ctx.fillStyle = theme.scoreLabel;
    ctx.font = `${Math.round(this.rpx(16))}px system-ui`;
    ctx.fillText(subMessage1, centerX, centerY - this.rpx(10));
    
    if (subMessage2) {
      ctx.fillText(subMessage2, centerX, centerY + this.rpx(10));
    }
    
    ctx.fillText(subMessage3, centerX, centerY + this.rpx(30));
  }
  
  renderHome() {
    this.drawBackground();
    this.drawHomeTitle();
    this.drawGameTypeCards();
  }
  
  drawBackButton() {
    const theme = this.isDark ? themes.dark : themes.light;
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
  
  render2048ModeSelect() {
    this.drawBackground();
    this.drawBackButton();
    this.drawHomeTitle();
    this.drawModeCards();
  }
  
  render2048Game() {
    this.drawBackground();
    this.drawTitle();
    this.drawScoreCards();
    this.drawHint();
    this.drawBoard();
    this.drawTiles();
    this.drawActionButtons();
    this.drawOverlay();
  }
  
  renderPopstar() {
    this.drawBackground();
    this.drawPopstarTitle();
    this.drawPopstarScoreCards();
    this.drawPopstarBoard();
    this.drawPopstarStars();
    this.drawActionButtons();
    this.drawPopstarOverlay();
  }
  
  drawPopstarConfirmDialog() {
    const theme = this.isDark ? themes.dark : themes.light;
    const ctx = this.ctx;
    
    const dialogWidth = this.rpx(600);
    const dialogHeight = this.rpx(400);
    const dialogX = this.gameX + (this.gameWidth - dialogWidth) / 2;
    const dialogY = this.screenHeight / 2 - dialogHeight / 2;
    
    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = this.isDark ? this.rpx(20) : this.rpx(12);
    ctx.shadowOffsetY = this.isDark ? this.rpx(6) : this.rpx(3);
    
    ctx.fillStyle = theme.overlayBg;
    this.drawRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, this.rpx(32));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    const centerX = dialogX + dialogWidth / 2;
    const centerY = dialogY + dialogHeight / 2;
    
    const gradient = ctx.createLinearGradient(centerX - this.rpx(100), centerY - this.rpx(80), centerX + this.rpx(100), centerY - this.rpx(40));
    gradient.addColorStop(0, theme.titleGradient[0]);
    gradient.addColorStop(1, theme.titleGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.font = `bold ${Math.round(this.rpx(36))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('继续游戏？', centerX, centerY - this.rpx(80));
    
    ctx.fillStyle = theme.subtitleText;
    ctx.font = `${Math.round(this.rpx(20))}px system-ui`;
    ctx.fillText(`当前进度：第 ${this.popstarLevel} 关，得分 ${this.popstarScore}`, centerX, centerY - this.rpx(30));
    
    const btnWidth = this.rpx(240);
    const btnHeight = this.rpx(72);
    const btnGap = this.rpx(40);
    const btnY = centerY + this.rpx(40);
    const continueBtnX = centerX - btnWidth - btnGap / 2;
    const newBtnX = centerX + btnGap / 2;
    const backBtnY = btnY + btnHeight + this.rpx(24);
    const backBtnWidth = this.rpx(120);
    const backBtnX = centerX - backBtnWidth / 2;
    
    this.popstarConfirmContinueBtn = { x: continueBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.popstarConfirmNewBtn = { x: newBtnX, y: btnY, width: btnWidth, height: btnHeight };
    this.popstarConfirmBackBtn = { x: backBtnX, y: backBtnY, width: backBtnWidth, height: btnHeight };
    
    ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(126, 184, 230, 0.25)';
    ctx.shadowBlur = this.isDark ? this.rpx(12) : this.rpx(8);
    ctx.shadowOffsetY = this.isDark ? this.rpx(4) : this.rpx(2);
    
    ctx.fillStyle = theme.buttonBg;
    this.drawRoundedRect(continueBtnX, btnY, btnWidth, btnHeight, this.rpx(36));
    ctx.fill();
    
    this.drawRoundedRect(newBtnX, btnY, btnWidth, btnHeight, this.rpx(36));
    ctx.fill();
    
    ctx.fillStyle = theme.themeBtnBg;
    this.drawRoundedRect(backBtnX, backBtnY, backBtnWidth, btnHeight, this.rpx(36));
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = theme.buttonText;
    ctx.font = `bold ${Math.round(this.rpx(22))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('继续进度', continueBtnX + btnWidth / 2, btnY + btnHeight / 2);
    ctx.fillText('从第一关开始', newBtnX + btnWidth / 2, btnY + btnHeight / 2);
    
    ctx.fillStyle = theme.titleText;
    ctx.fillText('返回', backBtnX + backBtnWidth / 2, backBtnY + btnHeight / 2);
  }
  
  renderPopstarConfirm() {
    this.drawBackground();
    this.drawHomeTitle();
    this.drawPopstarConfirmDialog();
  }
  
  render() {
    if (this.currentScene === SCENE.HOME) {
      this.renderHome();
    } else if (this.currentScene === SCENE.HOME_2048_MODE) {
      this.render2048ModeSelect();
    } else if (this.currentScene === SCENE.GAME_2048) {
      this.render2048Game();
    } else if (this.currentScene === SCENE.GAME_POPSTAR) {
      this.renderPopstar();
    } else if (this.currentScene === SCENE.POPSTAR_CONFIRM) {
      this.renderPopstarConfirm();
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      this.renderWatersort();
    } else if (this.currentScene === SCENE.WATERSORT_CONFIRM) {
      this.renderWatersortConfirm();
    }
  }
  
  gameLoop() {
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

new Game2048();
