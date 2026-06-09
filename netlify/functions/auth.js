import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret';

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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false }, global: { fetch } }
    );

    const path = event.path.replace(/.*\/auth/, '');
    const body = JSON.parse(event.body || '{}');

    // ── REGISTER ────────────────────────────────────────────
    if (path === '/register' && event.httpMethod === 'POST') {
      const { name, email, password } = body;
      if (!name || !email || !password) return cors({ error: 'Faltan campos' }, 400);
      if (password.length < 6) return cors({ error: 'Contraseña muy corta (mín. 6 caracteres)' }, 400);

      // Check duplicate
      const { data: existing } = await supabase
        .from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
      if (existing) return cors({ error: 'Email ya registrado' }, 409);

      const hashed = bcrypt.hashSync(password, 10);
      const { data: user, error } = await supabase
        .from('users')
        .insert({ name: name.trim(), email: email.toLowerCase(), password: hashed, role: 'user' })
        .select('id, name, email, role')
        .single();

      if (error) return cors({ error: error.message }, 500);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return cors({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    }

    // ── LOGIN ───────────────────────────────────────────────
    if (path === '/login' && event.httpMethod === 'POST') {
      const { email, password } = body;
      if (!email || !password) return cors({ error: 'Faltan campos' }, 400);

      const { data: user } = await supabase
        .from('users').select('*').eq('email', email.toLowerCase()).maybeSingle();

      if (!user) return cors({ error: 'Credenciales incorrectas' }, 401);

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) return cors({ error: 'Credenciales incorrectas' }, 401);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return cors({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    }

    return cors({ error: 'Not found' }, 404);

  } catch (err) {
    console.error('Auth error:', err);
    return cors({ error: err.message || 'Internal server error' }, 500);
  }
};
