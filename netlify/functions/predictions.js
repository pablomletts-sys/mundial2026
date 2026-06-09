import { getSupabase } from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret';
const PODIUM_DEADLINE = new Date('2026-06-11T19:00:00Z');

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function requireUser(event) {
  try {
    const token = (event.headers.authorization || '').replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireUser(event);
  if (!user) return cors({ error: 'No autenticado' }, 401);

  try {
    const supabase = getSupabase();
    const isPodium = event.path.includes('/podium');

    if (isPodium) {
      if (event.httpMethod === 'GET') {
        const { data, error } = await supabase
          .from('podium_predictions')
          .select('champion, runner_up, third_place, pts_champion, pts_runner_up, pts_third')
          .eq('user_id', user.id).maybeSingle();
        if (error) return cors({ error: error.message }, 500);
        return cors(data || null);
      }
      if (event.httpMethod === 'POST') {
        if (new Date() >= PODIUM_DEADLINE)
          return cors({ error: 'El deadline para el podio fue el 11/06/2026 a las 14:00' }, 400);
        const { champion, runner_up, third_place } = JSON.parse(event.body || '{}');
        if (!champion || !runner_up || !third_place) return cors({ error: 'Seleccioná los 3 equipos' }, 400);
        if (new Set([champion, runner_up, third_place]).size < 3) return cors({ error: 'Los 3 equipos deben ser distintos' }, 400);
        const { error } = await supabase.from('podium_predictions')
          .upsert({ user_id: user.id, champion, runner_up, third_place, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (error) return cors({ error: error.message }, 500);
        return cors({ ok: true, champion, runner_up, third_place });
      }
    }

    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('predictions').select('match_id, pred_home, pred_away, points, updated_at').eq('user_id', user.id);
      if (error) return cors({ error: error.message }, 500);
      return cors(data || []);
    }

    if (event.httpMethod === 'POST') {
      const { match_id, pred_home, pred_away } = JSON.parse(event.body || '{}');
      if (!match_id || pred_home === undefined || pred_away === undefined) return cors({ error: 'Faltan datos' }, 400);

      const { data: match } = await supabase
        .from('matches').select('id, match_date, kickoff_time, status').eq('id', match_id).maybeSingle();
      if (!match) return cors({ error: 'Partido no encontrado' }, 404);
      if (match.status === 'finished' || match.status === 'live')
        return cors({ error: 'El partido ya empezó — pronóstico cerrado' }, 400);

      if (match.kickoff_time) {
        const deadline = new Date(`${match.match_date}T${match.kickoff_time}:00`);
        deadline.setMinutes(deadline.getMinutes() - 10);
        if (new Date() >= deadline)
          return cors({ error: 'Pronóstico cerrado — faltan menos de 10 minutos' }, 400);
      }

      const { error } = await supabase.from('predictions')
        .upsert({ user_id: user.id, match_id, pred_home, pred_away, updated_at: new Date().toISOString() }, { onConflict: 'user_id,match_id' });
      if (error) return cors({ error: error.message }, 500);
      return cors({ ok: true, match_id, pred_home, pred_away });
    }

    return cors({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('predictions error:', err.message);
    return cors({ error: err.message }, 500);
  }
};
