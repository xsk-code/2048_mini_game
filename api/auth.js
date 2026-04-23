var { request } = require('./client');

var currentUser = null;

function login() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (loginRes) {
        request('/login', {
          method: 'POST',
          data: { code: loginRes.code }
        }).then(function (result) {
          try {
            wx.setStorageSync('auth_token', result.token);
          } catch (e) {
            console.error('Failed to save auth token:', e);
          }
          currentUser = result.userInfo;
          resolve(result);
        }).catch(reject);
      },
      fail: function (err) {
        reject(new Error(err.errMsg || 'wx.login failed'));
      }
    });
  });
}

function ensureLogin() {
  var token = '';
  try { token = wx.getStorageSync('auth_token') || ''; } catch (e) {}
  if (token && currentUser) {
    return Promise.resolve(currentUser);
  }
  return login().then(function (result) {
    return result.userInfo;
  });
}

function getCurrentUser() {
  return currentUser;
}

function isLoggedIn() {
  var token = '';
  try { token = wx.getStorageSync('auth_token') || ''; } catch (e) {}
  return !!token;
}

function logout() {
  try { wx.removeStorageSync('auth_token'); } catch (e) {}
  currentUser = null;
}

module.exports = {
  login: login,
  ensureLogin: ensureLogin,
  getCurrentUser: getCurrentUser,
  isLoggedIn: isLoggedIn,
  logout: logout
};
