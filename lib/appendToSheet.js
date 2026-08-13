const { google } = require("googleapis");
const { dataToRow } = require("./sheetHeaders");

function buildSheetAppender() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GOOGLE_SHEET_ID } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GOOGLE_SHEET_ID) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  return async function appendSubmission(data) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Submissions!A:A",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [dataToRow(data)] },
    });
  };
}

module.exports = { buildSheetAppender };
