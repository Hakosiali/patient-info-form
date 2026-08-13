require("dotenv").config();
const { google } = require("googleapis");
const { SHEET_HEADERS } = require("../lib/sheetHeaders");

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
  console.error("Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in .env first.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
const sheets = google.sheets({ version: "v4", auth: oauth2Client });

async function main() {
  const { data: spreadsheet } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "BCI Patient Form Submissions" },
      sheets: [{ properties: { title: "Submissions" } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheet.spreadsheetId,
    range: "Submissions!A1",
    valueInputOption: "RAW",
    requestBody: { values: [SHEET_HEADERS] },
  });

  console.log("\nSpreadsheet created:");
  console.log(spreadsheet.spreadsheetUrl);
  console.log("\nAdd this to your .env:\n");
  console.log(`GOOGLE_SHEET_ID=${spreadsheet.spreadsheetId}`);
}

main().catch((err) => {
  console.error("Failed to create spreadsheet:", err.message);
  process.exit(1);
});
