const { code2Session } = require('../lib/wechat');
const { supabaseAdmin } = require('../lib/supabase');
const { generateToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const { openid, unionid } = await code2Session(code);

    let { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();

    const isNewUser = !user;

    if (isNewUser) {
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const insertData = {
        openid,
        nickname: '玩家' + randomSuffix
      };
      if (unionid) insertData.unionid = unionid;

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('User insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      user = newUser;
    }

    const token = generateToken(user.id, openid);

    return res.status(200).json({
      token,
      isNewUser,
      userInfo: {
        nickname: user.nickname,
        avatarUrl: user.avatar_url
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed' });
  }
};
