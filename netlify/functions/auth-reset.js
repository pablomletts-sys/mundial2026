import { getSupabase } from './_supabase.js';
import bcrypt from 'bcryptjs';

const RESEND_KEY = process.env.RESEND_API_KEY;
const SITE_URL   = process.env.URL || 'https://bejewelled-gumdrop-a3424c.netlify.app';

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

// Generar token usando Web Crypto (disponible en Node 18+, sin imports)
async function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendEmail(to, name, token) {
  const resetUrl = `${SITE_URL}?reset=${token}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1a0f;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1a0f;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0e1e13;border:1px solid #1a3020;border-radius:12px;overflow:hidden;max-width:480px;width:100%">
        <tr><td style="background:#081710;padding:24px 28px;border-bottom:1px solid #1a3020">
          <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#f0c040">POLLA<span style="color:#f0efea">MALAZOS</span></div>
          <div style="font-size:11px;color:#8a9088;margin-top:3px;letter-spacing:1px;text-transform:uppercase">Mundial 2026</div>
        </td></tr>
        <tr><td style="padding:28px">
          <p style="font-size:16px;color:#f0efea;margin:0 0 10px">Hola ${name},</p>
          <p style="font-size:14px;color:#8a9088;margin:0 0 24px;line-height:1.6">
            Recibimos una solicitud para restablecer tu contraseña.<br>
            El enlace vence en <strong style="color:#f0efea">30 minutos</strong>.
          </p>
          <div style="text-align:center;margin:0 0 24px">
            <a href="${resetUrl}" style="display:inline-block;background:#f0c040;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:6px">
              Restablecer contraseña
            </a>
          </div>
          <p style="font-size:12px;color:#8a9088;margin:0;line-height:1.6">
            Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.
          </p>
        </td></tr>
        <tr><td style="padding:14px 28px;border-top:1px solid #1a3020;text-align:center">
          <p style="font-size:11px;color:#8a9088;margin:0">Polla Malazos · Mundial 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Polla Malazos <noreply@diabloatelier.com>',
      to: [to],
      subject: '🔐 Restablece tu contraseña — Polla Malazos',
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend error ${res.status}: ${errText}`);
  }
  return true;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'POST') return cors({ error: 'Method not allowed' }, 405);

  try {
    const supabase = getSupabase();
    const path = event.path.replace(/.*\/auth-reset/, '');
    const body = JSON.parse(event.body || '{}');

    // ── SOLICITAR RESET ────────────────────────────────────
    if (path === '/request') {
      const { email } = body;
      if (!email) return cors({ error: 'Ingresa tu email' }, 400);

      const { data: user } = await supabase
        .from('users').select('id, name, email').eq('email', email.toLowerCase()).maybeSingle();

      // Siempre responder OK — no revelar si el email existe
      if (!user) return cors({ ok: true });

      const token   = await generateToken();
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await supabase.from('password_resets').upsert(
        { user_id: user.id, token, expires_at: expires },
        { onConflict: 'user_id' }
      );

      await sendEmail(user.email, user.name.split(' ')[0], token);

      return cors({ ok: true });
    }

    // ── CONFIRMAR RESET ────────────────────────────────────
    if (path === '/confirm') {
      const { token, password } = body;
      if (!token || !password) return cors({ error: 'Datos incompletos' }, 400);
      if (password.length < 6) return cors({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);

      const { data: reset } = await supabase
        .from('password_resets')
        .select('user_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (!reset) return cors({ error: 'El enlace no es válido o ya fue usado' }, 400);
      if (new Date(reset.expires_at) < new Date()) return cors({ error: 'El enlace venció. Solicita uno nuevo.' }, 400);

      const hashed = bcrypt.hashSync(password, 10);
      await supabase.from('users').update({ password: hashed }).eq('id', reset.user_id);
      await supabase.from('password_resets').delete().eq('user_id', reset.user_id);

      return cors({ ok: true });
    }

    return cors({ error: 'Not found' }, 404);

  } catch(err) {
    console.error('auth-reset error:', err.message);
    return cors({ error: err.message }, 500);
  }
};
