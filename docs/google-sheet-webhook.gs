// Gujarat PG Org — live submissions webhook (Google Apps Script).
//
// Setup (already done for the live site — this file is for reference / rebuild):
//   1. Create a Google Sheet, Extensions -> Apps Script, paste this code.
//   2. Set TOKEN below to a random secret.
//   3. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone.
//   4. Copy the /exec URL, then in the Cloudflare Pages project add two SECRETS:
//        SHEETS_WEBHOOK_URL = <the /exec URL>
//        SHEETS_TOKEN       = <the same TOKEN string>
//   5. Redeploy Pages. functions/api/stories.js fires each submission here.
//
// The site posts { token, row } as JSON; a slow/unreachable sheet never affects
// the resident's submission (fire-and-forget via waitUntil in the Function).

const TOKEN = 'REPLACE_WITH_YOUR_SHARED_TOKEN'; // must equal Cloudflare secret SHEETS_TOKEN
const SHEET_NAME = 'Submissions';
const HEADERS = ['Submitted (UTC)', 'Name', 'Phone', 'Email', 'City', 'State',
  'PG / Hostel', 'Area', 'Resident Type', 'Duration', 'Problems', 'Story',
  'What They Want', 'Video', 'Public Consent', 'Status', 'ID'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return ContentService.createTextOutput('forbidden');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    const r = body.row || {};
    sheet.appendRow([r.created_at, r.full_name, r.phone, r.email, r.city, r.state,
      r.pg_name, r.pg_area, r.resident_type, r.duration, r.problems, r.story,
      r.what_they_want, r.video, r.consent_public, r.status, r.id]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

function doGet() { return ContentService.createTextOutput('Gujarat PG Org webhook is live.'); }
