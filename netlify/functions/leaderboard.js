import { getSupabase } from './_supabase.js';

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'GET') return cors({ error: 'Method not allowed' }, 405);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, name, email, predicted, exact, winner_only, goal_diff, total_points, podium_champion, podium_points')
      .limit(200);
    if (error) return cors({ error: error.message }, 500);
    return cors(data || []);
  } catch (err) {
    console.error('leaderboard error:', err.message);
    return cors({ error: err.message }, 500);
  }
};
