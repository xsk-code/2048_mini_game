var { SCENE, GAME_TYPE_MAP } = require('../common/constants');
var { getTheme } = require('../common/themes');
var { getLeaderboard } = require('../api/leaderboard');
var { isLoggedIn, getCurrentUser, ensureLogin } = require('../api/auth');

var LEADERBOARD_TABS = [
  { key: '2048-4x4', label: '4×4' },
  { key: '2048-5x5', label: '5×5' },
  { key: '2048-6x6', label: '6×6' },
  { key: 'popstar', label: '星星' },
  { key: 'watersort', label: '水排序' }
];

function LeaderboardScene(baseGame) {
  this.base = baseGame;
  this.ctx = baseGame.ctx;

  this.currentTab = '2048-4x4';
  this.leaderboardData = [];
  this.myRank = null;
  this.isLoading = false;
  this.loadError = null;

  this.tabButtons = [];
  this.backButton = null;
  this.refreshButton = null;
}

LeaderboardScene.prototype.initLeaderboard = function () {
  this.base.currentScene = SCENE.LEADERBOARD;
  this.currentTab = '2048-4x4';
  this.leaderboardData = [];
  this.myRank = null;
  this.loadError = null;
  this.recalculateLayout();
  this.fetchLeaderboard();
};

LeaderboardScene.prototype.getSafeTopPadding = function () {
  var base = this.base;
  if (base.menuButtonRect) {
    return base.menuButtonRect.bottom + base.rpx(16);
  }
  if (base.safeArea && base.safeArea.top > 0) {
    return base.safeArea.top + base.rpx(24);
  }
  return base.statusBarHeight + base.rpx(32);
};

LeaderboardScene.prototype.recalculateLayout = function () {
  var base = this.base;
  var safeTopPadding = this.getSafeTopPadding();
  var headerHeight = base.rpx(120);
  var tabHeight = base.rpx(72);
  var tabMarginTop = base.rpx(20);

  this.titleY = safeTopPadding + base.rpx(36);
  this.tabY = safeTopPadding + headerHeight + tabMarginTop;
  this.listStartY = this.tabY + tabHeight + base.rpx(24);
  this.listEndY = base.safeArea.bottom - base.rpx(160);
  this.myRankCardY = base.safeArea.bottom - base.rpx(140);

  var tabCount = LEADERBOARD_TABS.length;
  var tabWidth = (base.gameWidth - base.rpx(16) * (tabCount - 1)) / tabCount;
  this.tabButtons = LEADERBOARD_TABS.map(function (tab, index) {
    return {
      key: tab.key,
      label: tab.label,
      x: base.gameX + index * (tabWidth + base.rpx(16)),
      y: this.tabY,
      width: tabWidth,
      height: tabHeight
    };
  }.bind(this));

  this.backButton = {
    x: base.gameX,
    y: this.titleY - base.rpx(30),
    width: base.rpx(64),
    height: base.rpx(64)
  };

  this.refreshButton = {
    x: base.gameX + base.gameWidth - base.rpx(64),
    y: this.titleY - base.rpx(30),
    width: base.rpx(64),
    height: base.rpx(64)
  };
};

LeaderboardScene.prototype.fetchLeaderboard = function () {
  this.isLoading = true;
  this.loadError = null;

  var self = this;
  getLeaderboard(this.currentTab, 50).then(function (data) {
    var allScores = data.list || [];
    var seen = new Set();
    var uniqueList = [];
    for (var i = 0; i < allScores.length; i++) {
      var entry = allScores[i];
      if (seen.has(entry.user_id)) continue;
      seen.add(entry.user_id);
      uniqueList.push({
        rank: uniqueList.length + 1,
        nickname: entry.nickname,
        avatarUrl: entry.avatarUrl,
        score: entry.score
      });
    }
    self.leaderboardData = uniqueList;
    self.myRank = data.myRank || null;
    self.isLoading = false;
  }).catch(function (err) {
    console.error('Failed to fetch leaderboard:', err);
    self.loadError = err.message || '加载失败';
    self.isLoading = false;
  });
};

LeaderboardScene.prototype.switchTab = function (tabKey) {
  if (tabKey === this.currentTab) return;
  this.currentTab = tabKey;
  this.leaderboardData = [];
  this.myRank = null;
  this.fetchLeaderboard();
};

LeaderboardScene.prototype.renderLeaderboard = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  base.drawBackground();
  this.drawTitle();
  this.drawTabs();
  this.drawList();
  this.drawMyRank();
};

LeaderboardScene.prototype.drawTitle = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  var gradient = ctx.createLinearGradient(
    base.gameX + base.gameWidth / 2 - base.rpx(100), this.titleY - base.rpx(30),
    base.gameX + base.gameWidth / 2 + base.rpx(100), this.titleY
  );
  gradient.addColorStop(0, theme.titleGradient[0]);
  gradient.addColorStop(1, theme.titleGradient[1]);

  ctx.fillStyle = gradient;
  ctx.font = 'bold ' + Math.round(base.rpx(44)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('排行榜', base.gameX + base.gameWidth / 2, this.titleY);

  ctx.fillStyle = theme.themeBtnBg;
  base.drawRoundedRect(
    this.backButton.x, this.backButton.y,
    this.backButton.width, this.backButton.height,
    Math.round(this.backButton.width / 2)
  );
  ctx.fill();
  ctx.fillStyle = theme.titleText;
  ctx.font = 'bold ' + Math.round(base.rpx(28)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('←', this.backButton.x + this.backButton.width / 2, this.backButton.y + this.backButton.height / 2);

  ctx.fillStyle = theme.themeBtnBg;
  base.drawRoundedRect(
    this.refreshButton.x, this.refreshButton.y,
    this.refreshButton.width, this.refreshButton.height,
    Math.round(this.refreshButton.width / 2)
  );
  ctx.fill();
  ctx.fillStyle = theme.titleText;
  ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↻', this.refreshButton.x + this.refreshButton.width / 2, this.refreshButton.y + this.refreshButton.height / 2);
};

LeaderboardScene.prototype.drawTabs = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  for (var i = 0; i < this.tabButtons.length; i++) {
    var tab = this.tabButtons[i];
    var isActive = tab.key === this.currentTab;

    if (isActive) {
      var tabGradient = ctx.createLinearGradient(tab.x, tab.y, tab.x + tab.width, tab.y);
      tabGradient.addColorStop(0, theme.cardAccent[0]);
      tabGradient.addColorStop(1, theme.cardAccent[1]);
      ctx.fillStyle = tabGradient;
    } else {
      ctx.fillStyle = theme.themeBtnBg;
    }

    base.drawRoundedRect(tab.x, tab.y, tab.width, tab.height, base.rpx(36));
    ctx.fill();

    ctx.fillStyle = isActive
      ? (base.isDark ? '#0D1B2A' : '#FFFFFF')
      : theme.subtitleText;
    ctx.font = 'bold ' + Math.round(base.rpx(22)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tab.label, tab.x + tab.width / 2, tab.y + tab.height / 2);
  }
};

LeaderboardScene.prototype.drawList = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  if (this.isLoading) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('加载中...', base.gameX + base.gameWidth / 2, (this.listStartY + this.listEndY) / 2);
    return;
  }

  if (this.loadError) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.loadError, base.gameX + base.gameWidth / 2, (this.listStartY + this.listEndY) / 2);
    return;
  }

  if (this.leaderboardData.length === 0) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无数据', base.gameX + base.gameWidth / 2, (this.listStartY + this.listEndY) / 2);
    return;
  }

  var rowHeight = base.rpx(72);
  var maxVisible = Math.floor((this.listEndY - this.listStartY) / rowHeight);
  var visibleCount = Math.min(this.leaderboardData.length, maxVisible);

  for (var i = 0; i < visibleCount; i++) {
    var entry = this.leaderboardData[i];
    var rowY = this.listStartY + i * rowHeight;

    if (i % 2 === 0) {
      ctx.fillStyle = base.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
      base.drawRoundedRect(base.gameX, rowY, base.gameWidth, rowHeight, base.rpx(8));
      ctx.fill();
    }

    var rankText = '';
    if (entry.rank === 1) rankText = '🥇';
    else if (entry.rank === 2) rankText = '🥈';
    else if (entry.rank === 3) rankText = '🥉';
    else rankText = entry.rank.toString();

    ctx.fillStyle = entry.rank <= 3 ? theme.scoreValue : theme.titleText;
    ctx.font = 'bold ' + Math.round(base.rpx(26)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankText, base.gameX + base.rpx(48), rowY + rowHeight / 2);

    ctx.fillStyle = theme.titleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(entry.nickname, base.gameX + base.rpx(96), rowY + rowHeight / 2);

    ctx.fillStyle = theme.scoreValue;
    ctx.font = 'bold ' + Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(entry.score.toString(), base.gameX + base.gameWidth - base.rpx(24), rowY + rowHeight / 2);
  }
};

LeaderboardScene.prototype.drawMyRank = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  var cardX = base.gameX;
  var cardY = this.myRankCardY;
  var cardWidth = base.gameWidth;
  var cardHeight = base.rpx(120);

  ctx.shadowColor = base.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = base.isDark ? base.rpx(10) : base.rpx(6);
  ctx.shadowOffsetY = base.isDark ? base.rpx(3) : base.rpx(2);

  var cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY);
  cardGradient.addColorStop(0, theme.cardGradient[0]);
  cardGradient.addColorStop(1, theme.cardGradient[1]);
  ctx.fillStyle = cardGradient;
  base.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, base.rpx(20));
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (!isLoggedIn()) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(22)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击登录查看你的排名', cardX + cardWidth / 2, cardY + cardHeight / 2);
    return;
  }

  if (!this.myRank) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(22)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无排名', cardX + cardWidth / 2, cardY + cardHeight / 2);
    return;
  }

  var user = getCurrentUser() || {};
  ctx.fillStyle = theme.scoreLabel;
  ctx.font = Math.round(base.rpx(16)) + 'px system-ui';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MY RANK', cardX + base.rpx(24), cardY + base.rpx(36));

  ctx.fillStyle = theme.titleText;
  ctx.font = 'bold ' + Math.round(base.rpx(32)) + 'px system-ui';
  ctx.fillText('#' + this.myRank.rank, cardX + base.rpx(24), cardY + base.rpx(72));

  ctx.fillStyle = theme.scoreValue;
  ctx.font = 'bold ' + Math.round(base.rpx(28)) + 'px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText(this.myRank.score.toString(), cardX + cardWidth - base.rpx(24), cardY + cardHeight / 2);
};

LeaderboardScene.prototype.checkButtonClick = function (x, y) {
  var base = this.base;

  if (x >= this.backButton.x && x <= this.backButton.x + this.backButton.width &&
      y >= this.backButton.y && y <= this.backButton.y + this.backButton.height) {
    base.initHome();
    return true;
  }

  if (x >= this.refreshButton.x && x <= this.refreshButton.x + this.refreshButton.width &&
      y >= this.refreshButton.y && y <= this.refreshButton.y + this.refreshButton.height) {
    this.fetchLeaderboard();
    return true;
  }

  for (var i = 0; i < this.tabButtons.length; i++) {
    var tab = this.tabButtons[i];
    if (x >= tab.x && x <= tab.x + tab.width &&
        y >= tab.y && y <= tab.y + tab.height) {
      this.switchTab(tab.key);
      return true;
    }
  }

  if (!isLoggedIn()) {
    var cardX = base.gameX;
    var cardY = this.myRankCardY;
    var cardWidth = base.gameWidth;
    var cardHeight = base.rpx(120);
    if (x >= cardX && x <= cardX + cardWidth &&
        y >= cardY && y <= cardY + cardHeight) {
      var self = this;
      ensureLogin().then(function () {
        self.fetchLeaderboard();
      }).catch(function (err) {
        console.error('Login failed:', err);
      });
      return true;
    }
  }

  return false;
};

module.exports = { LeaderboardScene: LeaderboardScene };
