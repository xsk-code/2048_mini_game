const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

const VALID_GAME_TYPES = ['2048-4x4', '2048-5x5', '2048-6x6', 'popstar', 'watersort'];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameType, limit } = req.query;

  if (!VALID_GAME_TYPES.includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  const queryLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  try {
    const { data: scores, error } = await supabaseAdmin
      .from('scores')
      .select('score, user_id, users(nickname, avatar_url)')
      .eq('game_type', gameType)
      .order('score', { ascending: false });

    if (error) {
      console.error('Leaderboard query error:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    var seen = new Set();
    var list = [];
    for (var i = 0; i < scores.length; i++) {
      var entry = scores[i];
      if (seen.has(entry.user_id)) continue;
      seen.add(entry.user_id);
      list.push({
        user_id: entry.user_id,
        rank: list.length + 1,
        nickname: entry.users.nickname,
        avatarUrl: entry.users.avatar_url,
        score: entry.score
      });
      if (list.length >= queryLimit) break;
    }

    let myRank = null;
    const user = verifyToken(req);
    if (user) {
      const { data: myAllScores, error: myError } = await supabaseAdmin
        .from('scores')
        .select('score')
        .eq('user_id', user.userId)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(1);

      if (myAllScores && myAllScores.length > 0) {
        const myBestScore = myAllScores[0].score;

        const { data: allRankScores } = await supabaseAdmin
          .from('scores')
          .select('score, user_id')
          .eq('game_type', gameType)
          .order('score', { ascending: false });

        var rankSeen = new Set();
        var rank = 0;
        for (var j = 0; j < allRankScores.length; j++) {
          var rankEntry = allRankScores[j];
          if (rankSeen.has(rankEntry.user_id)) continue;
          rankSeen.add(rankEntry.user_id);
          rank++;
          if (rankEntry.user_id === user.userId) {
            myRank = {
              rank: rank,
              score: myBestScore
            };
            break;
          }
        }
      }
    }

    return res.status(200).json({ list, myRank });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
