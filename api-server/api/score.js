const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

const VALID_GAME_TYPES = ['2048-4x4', '2048-5x5', '2048-6x6', 'popstar', 'watersort'];

const MAX_SCORES = {
  '2048-4x4': 4000000,
  '2048-5x5': 16000000,
  '2048-6x6': 64000000,
  'popstar': 10000000,
  'watersort': 10000
};

module.exports = async (req, res) => {
  console.log('Score API called');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  console.log('Verified user:', user);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { gameType, score } = req.body || {};
  console.log('gameType:', gameType, 'score:', score);

  if (!VALID_GAME_TYPES.includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  const maxScore = MAX_SCORES[gameType] || 9999999;
  if (score > maxScore) {
    return res.status(400).json({ error: 'Score exceeds maximum possible value' });
  }

  try {
    console.log('Querying existing scores for user:', user.userId);
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('scores')
      .select('score')
      .eq('user_id', user.userId)
      .eq('game_type', gameType)
      .order('score', { ascending: false })
      .limit(1);

    console.log('Existing scores error:', existingError);
    console.log('Existing scores:', existing);

    console.log('Inserting new score...');
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('scores')
      .insert({
        user_id: user.userId,
        game_type: gameType,
        score
      })
      .select()
      .single();

    console.log('Insert error:', insertError);
    console.log('Inserted data:', inserted);

    if (insertError) {
      console.error('Score insert error:', insertError);
      return res.status(500).json({ error: 'Failed to submit score: ' + insertError.message });
    }

    const bestScore = existing && existing.length > 0
      ? Math.max(existing[0].score, score)
      : score;
    console.log('Best score:', bestScore);

    console.log('Calculating rank...');
    const { count, error: rankError } = await supabaseAdmin
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('game_type', gameType)
      .gt('score', bestScore);

    console.log('Rank count error:', rankError);
    console.log('Rank count:', count);

    const rank = (count || 0) + 1;
    console.log('Final rank:', rank);

    return res.status(200).json({
      success: true,
      bestScore,
      rank
    });
  } catch (err) {
    console.error('Score submit unexpected error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: 'Failed to submit score: ' + err.message });
  }
};
