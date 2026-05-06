// Vercel Serverless Function — POST /api/contact
//
// Receives a submission from the contact form on /contact and fires it
// at two destinations in parallel:
//   - Resend       → email Herbie at INTAKE_TO
//   - Google Sheet → append a row via an Apps Script web-app webhook
// Both pipelines are independent. If at least ONE succeeds, the user sees
// a success state. If both fail, we surface an error so they can call.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY              required for email pipeline
//   INTAKE_TO                   optional — destination address (default: contact@deskwolf.ai)
//   INTAKE_FROM                 optional — verified sender (default: onboarding@resend.dev,
//                               Resend's test sender. Works out of the box but only
//                               delivers to the email registered on your Resend
//                               account. Once you verify deskwolf.ai in Resend, set
//                               this to e.g. "Herbie PC Care <intake@deskwolf.ai>")
//
//   GOOGLE_SHEETS_WEBHOOK_URL   required for sheets pipeline — the
//                               https://script.google.com/macros/s/.../exec URL
//                               from the Apps Script web-app deployment.
//                               See apps-script/sheets-webhook.gs for the script
//                               and DEPLOY.md → Step 5 for the deploy walkthrough.
//   SHEETS_SECRET               optional — if set, must match the SHARED_SECRET
//                               value inside the Apps Script. Adds a tiny layer
//                               of auth on top of the obscurity of the webhook URL.
//
// Either pipeline can be disabled by leaving its key/url unset; the function
// will skip it and log a warning.

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

  // Build the email payload (used only if Resend is configured)
  const buildEmailPayload = () => {
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
    return { subject, html, text };
  };

  // Pipeline 1 — Resend (email Herbie)
  const sendEmail = async () => {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { subject, html, text } = buildEmailPayload();
    const { data, error } = await resend.emails.send({
      from: process.env.INTAKE_FROM || 'Herbie PC Care <onboarding@resend.dev>',
      to: [process.env.INTAKE_TO || 'contact@deskwolf.ai'],
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message || 'Resend rejected the send');
    return { id: data?.id };
  };

  // Pipeline 2 — Google Sheets (Apps Script webhook)
  const appendToSheet = async () => {
    const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!url) throw new Error('GOOGLE_SHEETS_WEBHOOK_URL not set');
    const payload = {
      ...safe,
      ip:        (req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
      userAgent: req.headers['user-agent'] || '',
      source:    req.headers['referer'] || req.headers['referrer'] || '',
      ...(process.env.SHEETS_SECRET ? { secret: process.env.SHEETS_SECRET } : {}),
    };
    // Apps Script web-apps issue a 302 to googleusercontent.com with the JSON
    // response. Browsers follow it transparently; node-fetch in Vercel's
    // runtime does too as long as we don't disable redirects.
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (!r.ok) throw new Error(`Sheets webhook returned HTTP ${r.status}`);
    let body = {};
    try { body = await r.json(); } catch { /* Apps Script may return text */ }
    if (body && body.ok === false) throw new Error(body.error || 'Sheets script reported failure');
    return body;
  };

  const enabled = [];
  if (process.env.RESEND_API_KEY)            enabled.push({ name: 'resend', run: sendEmail });
  if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) enabled.push({ name: 'sheets', run: appendToSheet });

  if (enabled.length === 0) {
    return res.status(500).json({
      error: 'No delivery destinations configured. Set RESEND_API_KEY and/or GOOGLE_SHEETS_WEBHOOK_URL.',
    });
  }

  const settled = await Promise.allSettled(enabled.map(p => p.run()));
  const results = enabled.map((p, i) => ({
    name: p.name,
    ok: settled[i].status === 'fulfilled',
    detail: settled[i].status === 'fulfilled' ? settled[i].value : String(settled[i].reason?.message || settled[i].reason),
  }));

  results.forEach(r => {
    if (r.ok)  console.log(`[contact] ${r.name} ok`, r.detail);
    else       console.error(`[contact] ${r.name} FAILED:`, r.detail);
  });

  const anyOk = results.some(r => r.ok);
  if (!anyOk) {
    return res.status(502).json({
      error: 'All delivery destinations failed.',
      results,
    });
  }

  return res.status(200).json({ ok: true, results });
}
