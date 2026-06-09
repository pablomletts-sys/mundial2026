import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret';

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getUser(event) {
  try {
    const token = (event.headers.authorization || '').replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false }, global: { fetch } }
    );

    const user = getUser(event);

    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      let query = supabase.from('matches').select('*').order('match_date').order('kickoff_time');
      if (params.group) query = query.eq('group_label', params.group);
      if (params.phase) query = query.eq('phase', params.phase);

      const { data: matches, error } = await query;
      if (error) return cors({ error: error.message }, 500);

      if (user) {
        const { data: preds } = await supabase
          .from('predictions')
          .select('match_id, pred_home, pred_away, points')
          .eq('user_id', user.id);
        const predMap = {};
        (preds || []).forEach(p => { predMap[p.match_id] = p; });
        return cors((matches || []).map(m => ({ ...m, my_prediction: predMap[m.id] || null })));
      }
      return cors(matches || []);
    }

    if (event.httpMethod === 'PUT') {
      if (!user || user.role !== 'admin') return cors({ error: 'No autorizado' }, 403);
      const parts = event.path.split('/');
      const matchId = parseInt(parts[parts.length - 1]);
      const { result_home, result_away } = JSON.parse(event.body || '{}');
      if (isNaN(matchId)) return cors({ error: 'ID inválido' }, 400);

      await supabase.from('matches')
        .update({ result_home, result_away, status: 'finished' })
        .eq('id', matchId);

      await supabase.rpc('recalculate_points', { p_match_id: matchId });
      return cors({ ok: true });
    }

    return cors({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('Matches error:', err);
    return cors({ error: err.message }, 500);
  }
};
