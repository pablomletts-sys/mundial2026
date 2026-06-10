// netlify/functions/odds.js
// GET /api/odds?match_id=1&home=México&away=Sudáfrica
// Proxy a The Odds API — la key queda segura en env vars

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=300', // cachear 5 min
    },
    body: JSON.stringify(body),
  };
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

  const { home, away } = event.queryStringParameters || {};
  if (!home || !away) return cors({ error: 'Faltan parámetros home/away' }, 400);

  const API_KEY = process.env.ODDS_API_KEY;
  if (!API_KEY) return cors({ error: 'Odds API key no configurada' }, 500);

  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${API_KEY}&regions=eu,uk&markets=h2h&oddsFormat=decimal`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) {
      const err = await res.text();
      return cors({ error: `Odds API error: ${res.status}`, detail: err }, 500);
    }

    const events = await res.json();
    if (!Array.isArray(events)) return cors({ error: 'Respuesta inesperada de Odds API' }, 500);

    const hn = normalize(home.replace(/^\S+\s/, '')); // quitar emoji
    const an = normalize(away.replace(/^\S+\s/, ''));

    // Buscar el partido por matching de nombres
    const event2 = events.find(e => {
      const h = normalize(e.home_team);
      const a = normalize(e.away_team);
      const homeMatch = h.includes(hn.slice(0, 5)) || hn.includes(h.slice(0, 5));
      const awayMatch = a.includes(an.slice(0, 5)) || an.includes(a.slice(0, 5));
      return homeMatch && awayMatch;
    });

    if (!event2 || !event2.bookmakers?.length) {
      return cors({ found: false, message: 'Partido no encontrado en odds' });
    }

    // Preferir Bet365, si no el primero disponible
    const bm = event2.bookmakers.find(b => b.key === 'bet365')
      || event2.bookmakers.find(b => b.key === 'betfair')
      || event2.bookmakers[0];

    const h2h = bm.markets?.find(m => m.key === 'h2h');
    if (!h2h) return cors({ found: false });

    const outcomes = h2h.outcomes;
    const homeOdd = outcomes.find(o => {
      const n = normalize(o.name);
      return n.includes(hn.slice(0,4)) || hn.includes(n.slice(0,4));
    })?.price;
    const awayOdd = outcomes.find(o => {
      const n = normalize(o.name);
      return n.includes(an.slice(0,4)) || an.includes(n.slice(0,4));
    })?.price;
    const drawOdd = outcomes.find(o => normalize(o.name) === 'draw')?.price;

    if (!homeOdd || !awayOdd) return cors({ found: false });

    // Probabilidades implícitas (sin el margen de la casa)
    const pHome = 1 / homeOdd;
    const pDraw = drawOdd ? 1 / drawOdd : 0;
    const pAway = 1 / awayOdd;
    const total = pHome + pDraw + pAway;

    return cors({
      found: true,
      home:  Math.round(pHome / total * 100),
      draw:  Math.round(pDraw / total * 100),
      away:  Math.round(pAway / total * 100),
      source: bm.title,
      home_odd: homeOdd,
      draw_odd: drawOdd,
      away_odd: awayOdd,
    });

  } catch (err) {
    console.error('Odds error:', err.message);
    return cors({ error: err.message }, 500);
  }
};
