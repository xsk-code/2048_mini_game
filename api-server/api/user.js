const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { nickname, avatarUrl } = req.body || {};

  const updateData = {};
  if (nickname !== undefined) {
    if (typeof nickname !== 'string' || nickname.length === 0 || nickname.length > 64) {
      return res.status(400).json({ error: 'Invalid nickname' });
    }
    updateData.nickname = nickname;
  }
  if (avatarUrl !== undefined) {
    if (typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid avatarUrl' });
    }
    updateData.avatar_url = avatarUrl;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateData.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.userId)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    return res.status(200).json({
      success: true,
      userInfo: {
        nickname: data.nickname,
        avatarUrl: data.avatar_url
      }
    });
  } catch (err) {
    console.error('User update error:', err.message);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};
