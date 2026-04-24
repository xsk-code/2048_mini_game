var { request } = require('./client');

var currentUser = null;

function saveUserInfoToStorage(userInfo) {
  try {
    wx.setStorageSync('user_info', userInfo);
  } catch (e) {
    console.error('Failed to save user info:', e);
  }
}

function loadUserInfoFromStorage() {
  try {
    var stored = wx.getStorageSync('user_info');
    if (stored && typeof stored === 'object') {
      return stored;
    }
  } catch (e) {
    console.error('Failed to load user info:', e);
  }
  return null;
}

function clearUserInfoFromStorage() {
  try {
    wx.removeStorageSync('user_info');
  } catch (e) {
    console.error('Failed to clear user info:', e);
  }
}

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
          saveUserInfoToStorage(currentUser);
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
  
  if (token) {
    if (currentUser) {
      return Promise.resolve(currentUser);
    }
    var storedUser = loadUserInfoFromStorage();
    if (storedUser) {
      currentUser = storedUser;
      return Promise.resolve(currentUser);
    }
  }
  
  return login().then(function (result) {
    return result.userInfo;
  });
}

function getCurrentUser() {
  if (!currentUser) {
    currentUser = loadUserInfoFromStorage();
  }
  return currentUser;
}

function isLoggedIn() {
  var token = '';
  try { token = wx.getStorageSync('auth_token') || ''; } catch (e) {}
  return !!token;
}

function logout() {
  try { wx.removeStorageSync('auth_token'); } catch (e) {}
  clearUserInfoFromStorage();
  currentUser = null;
}

function updateUserInfo(newInfo) {
  return request('/user', {
    method: 'POST',
    data: newInfo
  }).then(function (result) {
    if (result.success && result.userInfo) {
      currentUser = Object.assign({}, currentUser, result.userInfo);
      saveUserInfoToStorage(currentUser);
    }
    return result;
  });
}

module.exports = {
  login: login,
  ensureLogin: ensureLogin,
  getCurrentUser: getCurrentUser,
  isLoggedIn: isLoggedIn,
  logout: logout,
  updateUserInfo: updateUserInfo
};
