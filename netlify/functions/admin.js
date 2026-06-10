// netlify/functions/admin.js
// GET /api/admin/users        → lista todos los usuarios con stats
// GET /api/admin/picks?user_id=xxx → picks de un usuario específico

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

function requireAdmin(event) {
  try {
    const token = (event.headers.authorization || '').replace('Bearer ', '');
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== 'admin') return null;
    return user;
  } catch { return null; }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});

  const admin = requireAdmin(event);
  if (!admin) return cors({ error: 'No autorizado' }, 403);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false }, global: { fetch } }
  );

  const path = event.path.replace(/.*\/admin/, '');

  // ── GET /admin/users ──────────────────────────────────────
  if (path === '/users' && event.httpMethod === 'GET') {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) return cors({ error: error.message }, 500);

    // Enriquecer con stats de predicciones
    const { data: predStats } = await supabase
      .from('predictions')
      .select('user_id, points');

    const statsByUser = {};
    (predStats || []).forEach(p => {
      if (!statsByUser[p.user_id]) statsByUser[p.user_id] = { predicted: 0, points: 0 };
      statsByUser[p.user_id].predicted++;
      statsByUser[p.user_id].points += p.points || 0;
    });

    return cors((users || []).map(u => ({
      ...u,
      predicted: statsByUser[u.id]?.predicted || 0,
      total_points: statsByUser[u.id]?.points || 0,
    })));
  }

  // ── GET /admin/picks?user_id=xxx ──────────────────────────
  if (path === '/picks' && event.httpMethod === 'GET') {
    const { user_id } = event.queryStringParameters || {};
    if (!user_id) return cors({ error: 'Falta user_id' }, 400);

    const { data: matches, error: mErr } = await supabase
      .from('matches').select('*').order('match_date').order('kickoff_time');
    if (mErr) return cors({ error: mErr.message }, 500);

    const { data: preds } = await supabase
      .from('predictions')
      .select('match_id, pred_home, pred_away, points')
      .eq('user_id', user_id);

    const predMap = {};
    (preds || []).forEach(p => { predMap[p.match_id] = p; });

    return cors((matches || [])
      .filter(m => predMap[m.id]) // solo partidos con pronóstico
      .map(m => ({ ...m, my_prediction: predMap[m.id] || null }))
    );
  }

  // ── PUT /admin/set-role ───────────────────────────────────
  if (path === '/set-role' && event.httpMethod === 'PUT') {
    const { user_id, role } = JSON.parse(event.body || '{}');
    if (!user_id || !['user','admin'].includes(role)) return cors({ error: 'Datos inválidos' }, 400);

    const { error } = await supabase
      .from('users').update({ role }).eq('id', user_id);
    if (error) return cors({ error: error.message }, 500);
    return cors({ ok: true });
  }

  // ── POST /admin/reset-results ─────────────────────────────
  if (path === '/reset-results' && event.httpMethod === 'POST') {
    await supabase
      .from('matches')
      .update({ result_home: null, result_away: null, status: 'scheduled' })
      .not('group_label', 'is', null); // solo partidos de grupos
    await supabase
      .from('predictions')
      .update({ points: null });
    return cors({ ok: true });
  }

  return cors({ error: 'Not found' }, 404);
};
