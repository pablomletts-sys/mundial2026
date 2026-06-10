// netlify/functions/auth-reset.js
// POST /api/auth/reset-request  → envía email con token
// POST /api/auth/reset-confirm  → cambia contraseña con token

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'mundial2026-secret';
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

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false }, global: { fetch } }
  );
}

async function sendEmail(to, name, token) {
  const resetUrl = `${SITE_URL}?reset=${token}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1a0f;font-family:'Inter',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1a0f;padding:40px 20px">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#0e1e13;border:1px solid #1a3020;border-radius:12px;overflow:hidden;max-width:500px;width:100%">
        <!-- Header -->
        <tr><td style="background:#0a1a0f;padding:28px 32px;border-bottom:1px solid #1a3020">
          <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:3px;color:#f0c040">
            POLLA<span style="color:#f0efea">MALAZOS</span>
          </div>
          <div style="font-size:11px;color:#8a9088;margin-top:4px;text-transform:uppercase;letter-spacing:1px">
            Mundial 2026
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="font-size:16px;color:#f0efea;margin:0 0 12px">Hola ${name},</p>
          <p style="font-size:14px;color:#8a9088;margin:0 0 28px;line-height:1.6">
            Recibimos una solicitud para restablecer tu contraseña.<br>
            Haz clic en el botón para continuar. El enlace vence en <strong style="color:#f0efea">30 minutos</strong>.
          </p>
          <div style="text-align:center;margin:0 0 28px">
            <a href="${resetUrl}" style="display:inline-block;background:#f0c040;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.5px">
              Restablecer contraseña
            </a>
          </div>
          <p style="font-size:12px;color:#8a9088;margin:0;line-height:1.6">
            Si no solicitaste esto, ignora este correo.<br>
            Tu contraseña no cambiará a menos que hagas clic en el enlace.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #1a3020">
          <p style="font-size:11px;color:#8a9088;margin:0;text-align:center">
            Polla Malazos · Mundial 2026 · ${SITE_URL}
          </p>
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
      from: 'Polla Malazos <onboarding@resend.dev>',
      to: [to],
      subject: '🔐 Restablece tu contraseña — Polla Malazos',
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email error: ${err}`);
  }
  return true;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'POST') return cors({ error: 'Method not allowed' }, 405);

  const supabase = getSupabase();
  const path = event.path.replace(/.*\/auth-reset/, '');
  const body = JSON.parse(event.body || '{}');

  // ── SOLICITAR RESET ──────────────────────────────────────
  if (path === '/request') {
    const { email } = body;
    if (!email) return cors({ error: 'Ingresa tu email' }, 400);

    const { data: user } = await supabase
      .from('users').select('id, name, email').eq('email', email.toLowerCase()).maybeSingle();

    // Siempre responder OK para no revelar si el email existe
    if (!user) return cors({ ok: true, message: 'Si el email existe, recibirás un enlace.' });

    // Generar token único de 32 bytes
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    // Guardar token en Supabase
    await supabase.from('password_resets').upsert(
      { user_id: user.id, token, expires_at: expires },
      { onConflict: 'user_id' }
    );

    // Enviar email
    try {
      await sendEmail(user.email, user.name.split(' ')[0], token);
    } catch(e) {
      console.error('Send email error:', e.message);
      return cors({ error: 'No se pudo enviar el email. Intenta más tarde.' }, 500);
    }

    return cors({ ok: true, message: 'Si el email existe, recibirás un enlace.' });
  }

  // ── CONFIRMAR RESET ──────────────────────────────────────
  if (path === '/confirm') {
    const { token, password } = body;
    if (!token || !password) return cors({ error: 'Datos incompletos' }, 400);
    if (password.length < 6) return cors({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);

    // Buscar token válido
    const { data: reset } = await supabase
      .from('password_resets')
      .select('user_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!reset) return cors({ error: 'El enlace no es válido o ya fue usado' }, 400);
    if (new Date(reset.expires_at) < new Date()) return cors({ error: 'El enlace venció. Solicita uno nuevo.' }, 400);

    // Actualizar contraseña
    const hashed = bcrypt.hashSync(password, 10);
    await supabase.from('users').update({ password: hashed }).eq('id', reset.user_id);

    // Invalidar token
    await supabase.from('password_resets').delete().eq('user_id', reset.user_id);

    return cors({ ok: true });
  }

  return cors({ error: 'Not found' }, 404);
};
