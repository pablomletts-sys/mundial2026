// netlify/functions/matches.js
// GET  /api/matches          → all matches (with user's predictions if token present)
// GET  /api/matches?group=A  → filter by group
// PUT  /api/matches/:id      → admin only: set result

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret-change-me';

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getUser(event) {
  try {
    const auth = event.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});

  const user = getUser(event);

  // ── GET all matches ───────────────────────────────────────
  if (event.httpMethod === 'GET') {
    const { group, phase } = event.queryStringParameters || {};

    let query = supabase.from('matches').select('*').order('match_date').order('kickoff_time');
    if (group) query = query.eq('group_label', group);
    if (phase) query = query.eq('phase', phase);

    const { data: matches, error } = await query;
    if (error) return cors({ error: error.message }, 500);

    // If user is logged in, attach their predictions
    if (user) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('match_id, pred_home, pred_away, points')
        .eq('user_id', user.id);

      const predMap = {};
      (preds || []).forEach(p => { predMap[p.match_id] = p; });

      return cors(matches.map(m => ({
        ...m,
        my_prediction: predMap[m.id] || null,
      })));
    }

    return cors(matches);
  }

  // ── PUT result (admin only) ───────────────────────────────
  if (event.httpMethod === 'PUT') {
    if (!user || user.role !== 'admin') return cors({ error: 'No autorizado' }, 403);

    const pathParts = event.path.split('/');
    const matchId = parseInt(pathParts[pathParts.length - 1]);
    const { result_home, result_away } = JSON.parse(event.body || '{}');

    if (isNaN(matchId)) return cors({ error: 'ID inválido' }, 400);
    if (result_home === undefined || result_away === undefined) return cors({ error: 'Faltan datos' }, 400);

    // Save result
    const { error: updateErr } = await supabase
      .from('matches')
      .update({ result_home, result_away, status: 'finished' })
      .eq('id', matchId);

    if (updateErr) return cors({ error: updateErr.message }, 500);

    // Recalculate points via stored procedure
    const { error: calcErr } = await supabase.rpc('recalculate_points', { p_match_id: matchId });
    if (calcErr) console.error('Points calc error:', calcErr);

    return cors({ ok: true, match_id: matchId, result_home, result_away });
  }

  return cors({ error: 'Method not allowed' }, 405);
};
