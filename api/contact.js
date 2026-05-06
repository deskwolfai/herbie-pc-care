// Vercel Serverless Function — POST /api/contact
//
// Receives a JSON (or URL-encoded) submission from the contact form on
// /contact and emails it to the shop via Resend. No database, no queue.
//
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   required — your re_... secret from resend.com/api-keys
//   INTAKE_TO        optional — destination address (defaults to contact@deskwolf.ai)
//   INTAKE_FROM      optional — verified sender (defaults to onboarding@resend.dev,
//                    Resend's test domain — works out of the box but only delivers
//                    to the email registered on your Resend account.
//                    Once you verify deskwolf.ai in Resend, set this to something
//                    like:  "Herbie PC Care <intake@deskwolf.ai>")

import { Resend } from 'resend';

const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Vercel auto-parses application/json and application/x-www-form-urlencoded
  const body = req.body || {};
  const {
    name = '',
    phone = '',
    unit = '',
    service = '',
    msg = '',
    _honey = '',
  } = body;

  // Honeypot: bots fill the hidden field. Pretend success so they don't retry.
  if (_honey) return res.status(200).json({ ok: true });

  if (!name.trim() || !phone.trim()) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  // Cap field sizes — guard against abuse
  const cap = (s, n) => String(s).slice(0, n);
  const safe = {
    name: cap(name, 120),
    phone: cap(phone, 60),
    unit: cap(unit, 60),
    service: cap(service, 80),
    msg: cap(msg, 4000),
  };

  if (!process.env.RESEND_API_KEY) {
    return res
      .status(500)
      .json({ error: 'Server email is not configured (missing RESEND_API_KEY).' });
  }

  const to = process.env.INTAKE_TO || 'contact@deskwolf.ai';
  const from = process.env.INTAKE_FROM || 'Herbie PC Care <onboarding@resend.dev>';

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `New intake — ${safe.name} · ${safe.unit || 'PC'}`.slice(0, 120);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;color:#111">
      <h2 style="margin:0 0 8px;font-weight:600">New intake — Herbie PC Care</h2>
      <p style="color:#666;margin:0 0 22px;font-size:13px">via herbie-pc-care.vercel.app · ${new Date().toISOString()}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:9px 12px;background:#f6f6f6;font-weight:600;width:140px;border:1px solid #eee">Name</td><td style="padding:9px 12px;border:1px solid #eee">${escapeHtml(safe.name)}</td></tr>
        <tr><td style="padding:9px 12px;background:#f6f6f6;font-weight:600;border:1px solid #eee">Phone / Viber</td><td style="padding:9px 12px;border:1px solid #eee"><a href="tel:${escapeHtml(safe.phone)}" style="color:#C04A1F;text-decoration:none">${escapeHtml(safe.phone)}</a></td></tr>
        <tr><td style="padding:9px 12px;background:#f6f6f6;font-weight:600;border:1px solid #eee">Unit</td><td style="padding:9px 12px;border:1px solid #eee">${escapeHtml(safe.unit) || '—'}</td></tr>
        <tr><td style="padding:9px 12px;background:#f6f6f6;font-weight:600;border:1px solid #eee">Service</td><td style="padding:9px 12px;border:1px solid #eee">${escapeHtml(safe.service) || '—'}</td></tr>
        <tr><td style="padding:9px 12px;background:#f6f6f6;font-weight:600;vertical-align:top;border:1px solid #eee">Symptoms</td><td style="padding:9px 12px;white-space:pre-wrap;border:1px solid #eee">${escapeHtml(safe.msg) || '—'}</td></tr>
      </table>
      <p style="margin:22px 0 0;color:#888;font-size:12px">Replies to this email won't reach the customer — call them at <a href="tel:${escapeHtml(safe.phone)}" style="color:#888">${escapeHtml(safe.phone)}</a> or message via Viber/WhatsApp.</p>
    </div>
  `;

  const text = [
    'New intake — Herbie PC Care',
    `Submitted: ${new Date().toISOString()}`,
    '',
    `Name: ${safe.name}`,
    `Phone / Viber: ${safe.phone}`,
    `Unit: ${safe.unit || '—'}`,
    `Service: ${safe.service || '—'}`,
    `Symptoms: ${safe.msg || '—'}`,
    '',
    `Reply by phone/Viber/WhatsApp: ${safe.phone}`,
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
    });
    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: error.message || 'Email send failed.' });
    }
    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('Resend exception:', err);
    return res.status(500).json({ error: err.message || 'Unexpected error.' });
  }
}
