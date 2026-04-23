const { BaseGame } = require('./common/index');
const { SCENE } = require('./common/constants');
const { getModeById, getModesByGameType, getAllModes } = require('./mode-config');
const { hasPopstarSaveState, hasWatersortSaveState, getAllModesInfo } = require('./storage');
const { Game2048 } = require('./games/game-2048');
const { GamePopstar } = require('./games/game-popstar');
const { GameWatersort } = require('./games/game-watersort');
const { LeaderboardScene } = require('./scenes/leaderboard');

class MiniGames extends BaseGame {
  constructor() {
    super();
    
    this.game2048 = new Game2048(this);
    this.gamePopstar = new GamePopstar(this);
    this.gameWatersort = new GameWatersort(this);
    this.leaderboardScene = new LeaderboardScene(this);
    
    this.initHome();
    this.gameLoop();
  }
  
  enterGameType(gameTypeId) {
    if (gameTypeId === '2048') {
      this.game2048.init2048ModeSelect();
    } else if (gameTypeId === 'popstar') {
      if (hasPopstarSaveState()) {
        this.gamePopstar.initPopstarConfirm();
      } else {
        this.gamePopstar.enterPopstarGame();
      }
    } else if (gameTypeId === 'watersort') {
      if (hasWatersortSaveState()) {
        this.gameWatersort.initWatersortConfirm();
      } else {
        this.gameWatersort.enterWatersortGame();
      }
    }
  }
  
  enterMode(modeId) {
    this.game2048.enterMode(modeId);
  }
  
  enterLeaderboard() {
    this.leaderboardScene.initLeaderboard();
  }
  
  goBackHome() {
    if (this.currentScene === SCENE.GAME_2048) {
      this.game2048.saveCurrentState();
      this.game2048.currentMode = null;
    } else if (this.currentScene === SCENE.GAME_POPSTAR) {
      this.gamePopstar.savePopstarCurrentState();
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      this.gameWatersort.saveWatersortCurrentState();
    } else if (this.currentScene === SCENE.HOME_2048_MODE) {
    }
    this.initHome();
  }
  
  handleTouchStart(x, y) {
    const buttonClicked = this.checkButtonClick(x, y);
    
    if (!buttonClicked && this.currentScene === SCENE.GAME_POPSTAR && !this.gamePopstar.popstarIsGameOver && !this.gamePopstar.popstarIsLevelClear) {
      this.gamePopstar.handlePopstarTouchStart(x, y);
    }
  }
  
  handleTouchEnd(e) {
    if (this.currentScene === SCENE.GAME_2048) {
      this.game2048.handleTouchEnd(e);
    } else if (this.currentScene === SCENE.GAME_POPSTAR) {
      if (!this.gamePopstar.popstarIsGameOver && !this.gamePopstar.popstarIsLevelClear) {
        const touch = e.changedTouches[0];
        this.gamePopstar.handlePopstarTouchEnd(touch.clientX, touch.clientY);
      }
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      if (!this.gameWatersort.watersortIsComplete && !this.gameWatersort.watersortIsAnimating) {
        const touch = e.changedTouches[0];
        this.gameWatersort.handleWatersortTouch(touch.clientX, touch.clientY);
      }
    }
  }
  
  checkButtonClick(x, y) {
    let buttonClicked = false;
    
    if (this.currentScene === SCENE.POPSTAR_CONFIRM) {
      buttonClicked = this.gamePopstar.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.WATERSORT_CONFIRM) {
      buttonClicked = this.gameWatersort.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.HOME) {
      buttonClicked = super.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.HOME_2048_MODE) {
      buttonClicked = super.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.GAME_2048) {
      buttonClicked = this.game2048.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.GAME_POPSTAR) {
      buttonClicked = this.gamePopstar.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      buttonClicked = this.gameWatersort.checkButtonClick(x, y);
    } else if (this.currentScene === SCENE.LEADERBOARD) {
      buttonClicked = this.leaderboardScene.checkButtonClick(x, y);
    }
    
    if (buttonClicked) {
      this.soundManager.playButtonClick();
    }
    
    return buttonClicked;
  }
  
  render() {
    if (this.currentScene === SCENE.HOME) {
      this.renderHome();
    } else if (this.currentScene === SCENE.HOME_2048_MODE) {
      this.game2048.render2048ModeSelect();
    } else if (this.currentScene === SCENE.GAME_2048) {
      this.game2048.render2048Game();
    } else if (this.currentScene === SCENE.GAME_POPSTAR) {
      this.gamePopstar.renderPopstar();
    } else if (this.currentScene === SCENE.POPSTAR_CONFIRM) {
      this.gamePopstar.renderPopstarConfirm();
    } else if (this.currentScene === SCENE.GAME_WATERSORT) {
      this.gameWatersort.renderWatersort();
    } else if (this.currentScene === SCENE.WATERSORT_CONFIRM) {
      this.gameWatersort.renderWatersortConfirm();
    } else if (this.currentScene === SCENE.LEADERBOARD) {
      this.leaderboardScene.renderLeaderboard();
    }
  }
}

new MiniGames();
