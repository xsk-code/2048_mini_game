const axios = require('axios');

const WX_APPID = process.env.WX_APPID;
const WX_SECRET = process.env.WX_SECRET;

if (!WX_APPID || !WX_SECRET) {
  console.warn('Warning: WeChat environment variables not fully configured');
}

async function code2Session(code) {
  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const response = await axios.get(url, {
    params: {
      appid: WX_APPID,
      secret: WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    }
  });

  if (response.data.errcode) {
    throw new Error(`WeChat API error: ${response.data.errcode} - ${response.data.errmsg}`);
  }

  return {
    openid: response.data.openid,
    sessionKey: response.data.session_key,
    unionid: response.data.unionid || null
  };
}

module.exports = { code2Session };
