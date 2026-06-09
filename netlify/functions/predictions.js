// netlify/functions/predictions.js
// POST /api/predictions              → save/update match prediction
// GET  /api/predictions              → get all predictions for current user
// POST /api/predictions/podium       → save podium picks (champion, runner-up, third)
// GET  /api/predictions/podium       → get user's podium pick

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret-change-me';

// Podium deadline: June 11 2026 14:00:00 UTC-5 (adjust to your timezone)
const PODIUM_DEADLINE = new Date('2026-06-11T19:00:00Z'); // 14:00 ET = 19:00 UTC

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

  const isPodium = event.path.includes('/podium');

  // ══════════════════════════════════════════════════════════
  // PODIUM PREDICTIONS
  // ══════════════════════════════════════════════════════════
  if (isPodium) {
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('podium_predictions')
        .select('champion, runner_up, third_place, pts_champion, pts_runner_up, pts_third')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') return cors({ error: error.message }, 500);
      return cors(data || null);
    }

    if (event.httpMethod === 'POST') {
      if (new Date() >= PODIUM_DEADLINE)
        return cors({ error: 'El deadline para el podio fue el 11/06/2026 a las 14:00' }, 400);

      const { champion, runner_up, third_place } = JSON.parse(event.body || '{}');
      if (!champion || !runner_up || !third_place)
        return cors({ error: 'Seleccioná campeón, subcampeón y tercer puesto' }, 400);
      if (new Set([champion, runner_up, third_place]).size < 3)
        return cors({ error: 'Los tres equipos deben ser distintos' }, 400);

      const { error } = await supabase
        .from('podium_predictions')
        .upsert(
          { user_id: user.id, champion, runner_up, third_place, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) return cors({ error: error.message }, 500);
      return cors({ ok: true, champion, runner_up, third_place });
    }
  }

  // ══════════════════════════════════════════════════════════
  // MATCH PREDICTIONS
  // ══════════════════════════════════════════════════════════
  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('predictions')
      .select('match_id, pred_home, pred_away, points, updated_at')
      .eq('user_id', user.id);
    if (error) return cors({ error: error.message }, 500);
    return cors(data);
  }

  if (event.httpMethod === 'POST') {
    const { match_id, pred_home, pred_away } = JSON.parse(event.body || '{}');
    if (!match_id || pred_home === undefined || pred_away === undefined)
      return cors({ error: 'Faltan datos' }, 400);

    // Fetch match to validate deadline
    const { data: match, error: mErr } = await supabase
      .from('matches').select('id, match_date, kickoff_time, status').eq('id', match_id).single();

    if (mErr || !match) return cors({ error: 'Partido no encontrado' }, 404);
    if (match.status === 'finished' || match.status === 'live')
      return cors({ error: 'El partido ya empezó — pronóstico cerrado' }, 400);

    // Enforce 10-minute deadline before kickoff
    // kickoff_time is stored as 'HH:MM' in UTC-5 local — adjust offset as needed
    if (match.kickoff_time) {
      const kickoffISO = `${match.match_date}T${match.kickoff_time}:00`;
      const kickoff = new Date(kickoffISO);
      const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
      if (new Date() >= deadline)
        return cors({ error: 'Pronóstico cerrado — faltan menos de 10 minutos para el pitazo' }, 400);
    }

    // Upsert prediction
    const { error: upsertErr } = await supabase
      .from('predictions')
      .upsert(
        { user_id: user.id, match_id, pred_home, pred_away, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,match_id' }
      );

    if (upsertErr) return cors({ error: upsertErr.message }, 500);
    return cors({ ok: true, match_id, pred_home, pred_away });
  }

  return cors({ error: 'Method not allowed' }, 405);
};
