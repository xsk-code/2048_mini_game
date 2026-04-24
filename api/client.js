var BASE_URL = 'https://2048minigame.vercel.app/api';

function request(path, options) {
  options = options || {};
  var isRetry = options._isRetry || false;
  var token = '';
  try {
    token = wx.getStorageSync('auth_token') || '';
  } catch (e) {
    console.error('Failed to read auth token:', e);
  }

  return new Promise(function (resolve, reject) {
    wx.request({
      url: BASE_URL + path,
      method: options.method || 'GET',
      data: options.data || {},
      header: Object.assign(
        { 'Content-Type': 'application/json' },
        token ? { 'Authorization': 'Bearer ' + token } : {}
      ),
      success: function (res) {
        if (res.statusCode === 401) {
          if (isRetry) {
            reject(new Error('Unauthorized'));
            return;
          }
          try { wx.removeStorageSync('auth_token'); } catch (e) {}
          var { login } = require('./auth');
          login().then(function () {
            var retryOptions = Object.assign({}, options);
            retryOptions._isRetry = true;
            request(path, retryOptions).then(resolve).catch(reject);
          }).catch(function () {
            reject(new Error('Unauthorized'));
          });
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error((res.data && res.data.error) || 'Request failed'));
        }
      },
      fail: function (err) {
        reject(new Error(err.errMsg || 'Network error'));
      }
    });
  });
}

module.exports = { request: request };
