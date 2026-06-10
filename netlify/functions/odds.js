// netlify/functions/odds.js
// GET /api/odds?home=México&away=Sudáfrica
// Proxy seguro para The Odds API — la key nunca se expone en el frontend

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
      'Cache-Control': 'public, max-age=300', // cache 5 min
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

function normalize(s) {
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

  if (!ODDS_KEY) return cors({ error: 'Odds API not configured' }, 500);

  try {
    const { home, away } = event.queryStringParameters || {};
    if (!home || !away) return cors({ error: 'Faltan parámetros home/away' }, 400);

    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${ODDS_KEY}&regions=eu,uk&markets=h2h&oddsFormat=decimal`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) return cors({ error: `Odds API error: ${res.status}` }, 502);

    const data = await res.json();
    if (!Array.isArray(data)) return cors({ error: 'Unexpected response' }, 502);

    const hn = normalize(home.replace(/^\S+\s/, ''));
    const an = normalize(away.replace(/^\S+\s/, ''));

    const event_match = data.find(e => {
      const h = normalize(e.home_team);
      const a = normalize(e.away_team);
      const homeMatch = h.includes(hn.slice(0,5)) || hn.includes(h.slice(0,5));
      const awayMatch = a.includes(an.slice(0,5)) || an.includes(a.slice(0,5));
      return homeMatch && awayMatch;
    });

    if (!event_match || !event_match.bookmakers?.length)
      return cors({ found: false });

    // Preferir Bet365, sino el primero disponible
    const bm = event_match.bookmakers.find(b => b.key === 'bet365')
      || event_match.bookmakers.find(b => b.key === 'williamhill')
      || event_match.bookmakers[0];

    const h2h = bm.markets?.find(m => m.key === 'h2h');
    if (!h2h?.outcomes?.length) return cors({ found: false });

    const outcomes = h2h.outcomes;
    const homeOut = outcomes.find(o => {
      const n = normalize(o.name);
      return n.includes(hn.slice(0,4)) || hn.includes(n.slice(0,4));
    });
    const awayOut = outcomes.find(o => {
      const n = normalize(o.name);
      return n.includes(an.slice(0,4)) || an.includes(n.slice(0,4));
    });
    const drawOut = outcomes.find(o => normalize(o.name) === 'draw');

    if (!homeOut || !awayOut) return cors({ found: false });

    // Probabilidades implícitas (normalizadas)
    const pH = 1 / homeOut.price;
    const pD = drawOut ? 1 / drawOut.price : 0;
    const pA = 1 / awayOut.price;
    const total = pH + pD + pA;

    return cors({
      found: true,
      home:  Math.round(pH / total * 100),
      draw:  Math.round(pD / total * 100),
      away:  Math.round(pA / total * 100),
      source: bm.title,
      homeOdd: homeOut.price.toFixed(2),
      drawOdd: drawOut?.price.toFixed(2),
      awayOdd: awayOut.price.toFixed(2),
    });

  } catch (err) {
    console.error('Odds error:', err.message);
    return cors({ error: err.message }, 500);
  }
};
