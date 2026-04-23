var { request } = require('./client');

function submitScore(gameType, score) {
  return request('/score', {
    method: 'POST',
    data: { gameType: gameType, score: score }
  });
}

function getLeaderboard(gameType, limit) {
  limit = limit || 50;
  return request('/leaderboard?gameType=' + gameType + '&limit=' + limit);
}

module.exports = {
  submitScore: submitScore,
  getLeaderboard: getLeaderboard
};
