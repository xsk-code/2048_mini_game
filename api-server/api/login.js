const { code2Session } = require('../lib/wechat');
const { supabaseAdmin } = require('../lib/supabase');
const { generateToken } = require('../lib/auth');

module.exports = async (req, res) => {
  console.log('Login API called');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  console.log('Login code received:', code ? 'provided' : 'missing');
  
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    console.log('Calling WeChat code2Session...');
    const { openid, unionid } = await code2Session(code);
    console.log('WeChat openid:', openid, 'unionid:', unionid);

    console.log('Querying Supabase for user with openid...');
    let { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();

    console.log('Fetch user result:', user ? 'found' : 'not found');
    console.log('Fetch user error:', fetchError);

    const isNewUser = !user;

    if (isNewUser) {
      console.log('Creating new user...');
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const insertData = {
        openid,
        nickname: '玩家' + randomSuffix
      };
      if (unionid) insertData.unionid = unionid;

      console.log('Insert data:', insertData);

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert error:', insertError);
      console.log('Inserted user:', newUser);

      if (insertError) {
        console.error('User insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create user: ' + insertError.message });
      }
      user = newUser;
    }

    console.log('Generating token for user:', user.id);
    const token = generateToken(user.id, openid);
    console.log('Token generated:', token ? 'success' : 'failed');

    return res.status(200).json({
      token,
      isNewUser,
      userInfo: {
        nickname: user.nickname,
        avatarUrl: user.avatar_url
      }
    });
  } catch (err) {
    console.error('Login unexpected error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
};
