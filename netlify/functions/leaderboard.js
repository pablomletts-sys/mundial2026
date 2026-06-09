// netlify/functions/leaderboard.js
// GET /api/leaderboard

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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

  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, name, email, predicted, exact, winner_only, goal_diff, total_points, podium_champion, podium_points')
    .limit(200);

  if (error) return cors({ error: error.message }, 500);
  return cors(data);
};
