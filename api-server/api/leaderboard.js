const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

const VALID_GAME_TYPES = ['2048-4x4', '2048-5x5', '2048-6x6', 'popstar', 'watersort'];

module.exports = async (req, res) => {
  console.log('Leaderboard API called with query:', req.query);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameType, limit } = req.query;
  console.log('gameType:', gameType, 'limit:', limit);

  if (!VALID_GAME_TYPES.includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  const queryLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  try {
    console.log('Querying Supabase for scores...');
    
    const { data: scores, error } = await supabaseAdmin
      .from('scores')
      .select('id, score, user_id, game_type, created_at')
      .eq('game_type', gameType)
      .order('score', { ascending: false });

    console.log('Supabase scores error:', error);
    console.log('Supabase scores data:', scores ? scores.length + ' records' : 'null');

    if (error) {
      console.error('Leaderboard query error:', error);
      return res.status(500).json({ error: 'Database query failed: ' + error.message });
    }

    const scoresArray = scores || [];
    console.log('Scores array length:', scoresArray.length);

    const userIds = [...new Set(scoresArray.map(s => s.user_id))];
    console.log('Unique userIds:', userIds.length);

    var usersMap = {};
    if (userIds.length > 0) {
      console.log('Querying users for userIds:', userIds);
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      console.log('Users query error:', usersError);
      console.log('Users data:', users ? users.length + ' records' : 'null');

      if (usersError) {
        console.error('Users query error:', usersError);
        return res.status(500).json({ error: 'Failed to fetch user info' });
      }

      if (users) {
        for (var k = 0; k < users.length; k++) {
          usersMap[users[k].id] = users[k];
        }
      }
    }

    var seen = new Set();
    var list = [];
    for (var i = 0; i < scoresArray.length; i++) {
      var entry = scoresArray[i];
      console.log('Processing score entry:', entry.id, 'user_id:', entry.user_id);
      
      if (seen.has(entry.user_id)) continue;
      seen.add(entry.user_id);
      
      var user = usersMap[entry.user_id] || {};
      console.log('User data for', entry.user_id, ':', user);
      
      list.push({
        user_id: entry.user_id,
        rank: list.length + 1,
        nickname: user.nickname || '未知玩家',
        avatarUrl: user.avatar_url || '',
        score: entry.score
      });
      if (list.length >= queryLimit) break;
    }

    console.log('Final list:', list.length, 'items');

    let myRank = null;
    const currentUser = verifyToken(req);
    console.log('Verified token user:', currentUser);
    
    if (currentUser) {
      const { data: myAllScores, error: myError } = await supabaseAdmin
        .from('scores')
        .select('score')
        .eq('user_id', currentUser.userId)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(1);

      console.log('My scores error:', myError);
      console.log('My scores data:', myAllScores);

      if (myAllScores && myAllScores.length > 0) {
        const myBestScore = myAllScores[0].score;
        console.log('My best score:', myBestScore);

        const { data: allRankScores } = await supabaseAdmin
          .from('scores')
          .select('score, user_id')
          .eq('game_type', gameType)
          .order('score', { ascending: false });

        console.log('All rank scores:', allRankScores ? allRankScores.length : 'null');

        var rankSeen = new Set();
        var rank = 0;
        const rankScores = allRankScores || [];
        for (var j = 0; j < rankScores.length; j++) {
          var rankEntry = rankScores[j];
          if (rankSeen.has(rankEntry.user_id)) continue;
          rankSeen.add(rankEntry.user_id);
          rank++;
          if (rankEntry.user_id === currentUser.userId) {
            myRank = {
              rank: rank,
              score: myBestScore
            };
            break;
          }
        }
        console.log('My rank:', myRank);
      }
    }

    console.log('Returning response with list:', list.length, 'items, myRank:', myRank);
    return res.status(200).json({ list, myRank });
  } catch (err) {
    console.error('Leaderboard unexpected error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};
