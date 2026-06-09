import { createClient } from '@supabase/supabase-js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'POST') return cors({ error: 'Method not allowed' }, 405);

  const secret = event.headers['x-webhook-secret'];
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) return cors({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { global: { fetch } }
  );

  let payload;
  try { payload = JSON.parse(event.body); }
  catch { return cors({ error: 'Invalid JSON' }, 400); }

  const results = payload.results || (payload.match_id ? [payload] : []);
  if (!results.length) return cors({ error: 'No results in payload' }, 400);

  const processed = [], errors = [];
  for (const r of results) {
    const { match_id, result_home, result_away } = r;
    if (!match_id || result_home === undefined || result_away === undefined) {
      errors.push({ match_id, error: 'Missing fields' }); continue;
    }
    const { error: updateErr } = await supabase
      .from('matches')
      .update({ result_home, result_away, status: 'finished' })
      .eq('id', match_id);
    if (updateErr) { errors.push({ match_id, error: updateErr.message }); continue; }
    await supabase.rpc('recalculate_points', { p_match_id: match_id });
    processed.push(match_id);
  }
  return cors({ ok: true, processed, errors });
};
