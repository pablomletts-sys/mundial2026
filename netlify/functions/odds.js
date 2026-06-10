import jwt from 'jsonwebtoken';

const ODDS_KEY = process.env.ODDS_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret';

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=300',
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

function norm(s) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'GET') return cors({ error: 'Method not allowed' }, 405);

  const user = requireUser(event);
  if (!user) return cors({ error: 'No autenticado' }, 401);
  if (!ODDS_KEY) return cors({ error: 'ODDS_API_KEY not set' }, 500);

  const { home, away, debug } = event.queryStringParameters || {};
  if (!home || !away) return cors({ error: 'Faltan parámetros home/away' }, 400);

  try {
    // Primero intentamos con World Cup, si falla intentamos con soccer general
    const sportKeys = ['soccer_fifa_world_cup', 'soccer_international_friendlies'];
    let allEvents = [];

    for (const sportKey of sportKeys) {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_KEY}&regions=eu,uk&markets=h2h&oddsFormat=decimal`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        allEvents = allEvents.concat(data);
        break; // encontramos datos, no seguimos
      }
    }

    // Si debug=1, devolver los eventos disponibles para diagnosticar
    if (debug === '1') {
      return cors({
        total_events: allEvents.length,
        events: allEvents.slice(0, 5).map(e => ({
          home: e.home_team,
          away: e.away_team,
          bookmakers: e.bookmakers?.length,
          sport: e.sport_key
        }))
      });
    }

    if (!allEvents.length) return cors({ found: false, reason: 'no_events' });

    const hn = norm(home.replace(/^\S+\s/, ''));
    const an = norm(away.replace(/^\S+\s/, ''));

    const matched = allEvents.find(e => {
      const h = norm(e.home_team);
      const a = norm(e.away_team);
      return (h.includes(hn.slice(0,5)) || hn.includes(h.slice(0,5))) &&
             (a.includes(an.slice(0,5)) || an.includes(a.slice(0,5)));
    });

    if (!matched || !matched.bookmakers?.length)
      return cors({ found: false, reason: 'no_match', searched: `${hn} vs ${an}` });

    const bm = matched.bookmakers.find(b => b.key === 'bet365')
      || matched.bookmakers.find(b => b.key === 'williamhill')
      || matched.bookmakers[0];

    const h2h = bm.markets?.find(m => m.key === 'h2h');
    if (!h2h?.outcomes?.length) return cors({ found: false, reason: 'no_h2h' });

    const outcomes = h2h.outcomes;
    const homeOut = outcomes.find(o => { const n = norm(o.name); return n.includes(hn.slice(0,4)) || hn.includes(n.slice(0,4)); });
    const awayOut = outcomes.find(o => { const n = norm(o.name); return n.includes(an.slice(0,4)) || an.includes(n.slice(0,4)); });
    const drawOut = outcomes.find(o => norm(o.name) === 'draw');

    if (!homeOut || !awayOut) return cors({ found: false, reason: 'no_outcomes', outcomes: outcomes.map(o=>o.name) });

    const pH = 1 / homeOut.price;
    const pD = drawOut ? 1 / drawOut.price : 0;
    const pA = 1 / awayOut.price;
    const total = pH + pD + pA;

    return cors({
      found: true,
      home:    Math.round(pH / total * 100),
      draw:    Math.round(pD / total * 100),
      away:    Math.round(pA / total * 100),
      source:  bm.title,
      homeOdd: homeOut.price.toFixed(2),
      drawOdd: drawOut?.price.toFixed(2) || null,
      awayOdd: awayOut.price.toFixed(2),
    });

  } catch (err) {
    console.error('Odds error:', err.message);
    return cors({ error: err.message }, 500);
  }
};
