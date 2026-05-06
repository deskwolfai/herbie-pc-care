/**
 * sheets-webhook.gs
 *
 * Paste this into the Apps Script editor of the Google Sheet that should
 * collect contact-form submissions. Then deploy as a Web App (Anyone, even
 * anonymous, can access). Copy the URL and set it as the
 * GOOGLE_SHEETS_WEBHOOK_URL env var in Vercel.
 *
 * What this does:
 *   - Receives a POST from the Vercel /api/contact function
 *   - Auto-creates the header row on the first submission
 *   - Appends one row per submission (timestamp + fields + metadata)
 *   - Returns JSON {ok:true} so the function knows it landed
 *
 * Tweak HEADERS or the row mapping below if you add new form fields.
 */

const HEADERS = [
  'Timestamp',
  'Name',
  'Phone / Viber',
  'Unit',
  'Service',
  'Symptoms',
  'IP',
  'User-Agent',
  'Source page',
];

// Optional shared secret. If set, the Vercel function must POST a matching
// "secret" field. Leave empty string to disable. Set the same value in
// Vercel as SHEETS_SECRET if you turn this on.
const SHARED_SECRET = '';

function doPost(e) {
  try {
    let payload = {};
    try { payload = JSON.parse(e.postData.contents || '{}'); }
    catch (parseErr) { payload = e.parameter || {}; }

    if (SHARED_SECRET && payload.secret !== SHARED_SECRET) {
      return jsonOut({ ok: false, error: 'Unauthorized' }, 401);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // First write — drop in the header row
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      payload.name      || '',
      payload.phone     || '',
      payload.unit      || '',
      payload.service   || '',
      payload.msg       || '',
      payload.ip        || '',
      payload.userAgent || '',
      payload.source    || '',
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

// GET is for sanity-checking the deploy from a browser
function doGet() {
  return jsonOut({ ok: true, msg: 'Herbie PC Care intake webhook — POST only.' });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
