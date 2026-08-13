require("dotenv").config();
const http = require("http");
const { URL } = require("url");
const { google } = require("googleapis");

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Missing authorization code.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Authorized. You can close this tab and return to the terminal.</h2>");

    console.log("\nAdd this to your .env:\n");
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);

    if (!tokens.refresh_token) {
      console.log(
        "\nNo refresh token returned -- this happens if you've authorized this app before." +
          " Go to https://myaccount.google.com/permissions, remove access for this app, and re-run this script."
      );
    }

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500).end("Token exchange failed.");
    console.error("Token exchange failed:", err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in your browser and click Allow:\n");
  console.log(authUrl);
  console.log(`\nWaiting for authorization on http://localhost:${PORT} ...`);
});
