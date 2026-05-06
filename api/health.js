// Tiny diagnostic endpoint — GET /api/health
//
// Reveals whether each pipeline's required env vars are present in the
// running deployment. NEVER prints the full value; only a prefix.

export default function handler(req, res) {
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';
  const resendKey = process.env.RESEND_API_KEY || '';
  res.status(200).json({
    runtime: {
      node: process.version,
      region: process.env.VERCEL_REGION || 'unknown',
      deploymentUrl: process.env.VERCEL_URL || 'unknown',
    },
    pipelines: {
      resend: {
        enabled: !!resendKey,
        keyPrefix: resendKey ? resendKey.slice(0, 6) + '…' : null,
        keyLength: resendKey.length || 0,
      },
      sheets: {
        enabled: !!sheetsUrl,
        urlPrefix: sheetsUrl ? sheetsUrl.slice(0, 50) + '…' : null,
        urlLength: sheetsUrl.length || 0,
        looksLikeAppsScript: /^https:\/\/script\.google\.com\//.test(sheetsUrl),
        endsWithExec: sheetsUrl.endsWith('/exec'),
      },
    },
    config: {
      INTAKE_TO: process.env.INTAKE_TO || '(default contact@deskwolf.ai)',
      INTAKE_FROM: process.env.INTAKE_FROM || '(default Resend onboarding@resend.dev)',
      SHEETS_SECRET: process.env.SHEETS_SECRET ? 'set' : 'unset',
    },
  });
}
