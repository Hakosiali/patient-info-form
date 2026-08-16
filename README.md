# Patient Information Form

A self-contained patient intake form. On submit it:

1. Generates a PDF copy of the submission on the server (pdfkit).
2. Emails that PDF to the patient's address through your own Gmail account, via the Gmail API.
3. Optionally logs the submission as a row in a Google Sheet (your own, acting as a simple
   database of every submission).

No third-party form/email/database SaaS (no EmailJS, no Formspree, no Airtable) — just your
code talking directly to Google's own APIs using your own account's credentials.

Mail is sent over HTTPS via the Gmail API rather than raw SMTP, because many free hosting
tiers (this app is deployed on Render's free tier) block outbound SMTP connections to stop
spam abuse — the Gmail API isn't affected since it's a normal HTTPS request.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then get Google API credentials (one-time setup, free, no card required):

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project.
2. **APIs & Services → Library** → search and Enable both "Gmail API" and "Google Sheets API"
   (skip Sheets if you don't want submission logging).
3. **APIs & Services → OAuth consent screen** → User type **External** → fill in app name/
   support email → under "Test users" add your own Gmail address.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application
   type **Desktop app** → note the Client ID and Client Secret it gives you.
5. Put `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` in `.env`, then run:
   ```bash
   node scripts/get-gmail-token.js
   ```
   This opens a Google consent screen in your browser (log in, click Allow) and prints a
   `GMAIL_REFRESH_TOKEN` — copy that into `.env` too, along with `GMAIL_USER` (the Gmail
   address these credentials belong to). This same token is used for both Gmail sending and
   Sheets logging: it requests `gmail.send` plus `drive.file` (access limited to files this
   app itself creates — not every sheet in your account) rather than the broader
   `spreadsheets` scope.
6. Optional — to log submissions to a Google Sheet, run:
   ```bash
   node scripts/create-sheet.js
   ```
   This creates a new spreadsheet (titled "BCI Patient Form Submissions") with the right
   header row already in place, and prints a `GOOGLE_SHEET_ID` to add to `.env`. Every
   submission after that gets appended as a new row. Leave `GOOGLE_SHEET_ID` unset to skip
   this entirely — nothing else is affected.

## Run

```bash
npm start
```

Then open http://localhost:3000 (or whatever `PORT` is set to in `.env`).

## Running persistently (deployed on this machine)

In production use here, the app runs under [pm2](https://pm2.keymetrics.io/) instead of a plain
`npm start`, so it survives crashes and restarts automatically when you log into Windows:

```bash
npm install -g pm2 pm2-windows-startup
cd patient-form
pm2 start server.js --name patient-form
pm2 save
pm2-startup install   # registers pm2 to relaunch at Windows login
```

Useful commands:

```bash
pm2 status                  # check it's running
pm2 logs patient-form       # tail logs
pm2 restart patient-form    # apply code changes (pm2 does not hot-reload)
```

It listens on all network interfaces, so it's reachable from other devices on the same
network at `http://<this-machine's-LAN-IP>:<PORT>` (e.g. `http://192.168.100.6:3050`) —
find your IP with `ipconfig`. Windows Firewall blocks inbound connections by default; to
allow it, run as admin:

```powershell
New-NetFirewallRule -DisplayName "Patient Form" -Direction Inbound -Protocol TCP -LocalPort 3050 -Action Allow
```

This is LAN-only — no domain, no HTTPS, not exposed to the internet. Exposing it beyond the
local network (port forwarding, a domain, a real host) is a separate, deliberate step.

## Dry-run mode

If `.env` is missing or Gmail API credentials aren't set, the server does **not** fail —
it still generates the PDF and saves it to `generated-pdfs/` locally, and the UI reports
"PDF generated (email not sent...)" instead of pretending an email went out. Fill in real
Gmail API credentials to actually send mail.

## Notes

- Required fields: Patient's Name, Passport No, Date of Birth, Patient's Email. Age is
  calculated automatically from the date of birth.
- Google Sheet logging is best-effort: if it fails (e.g. quota, network), the submission
  still generates a PDF and emails it — logging failures are only written to the server
  console, not shown to the user.

## Security notes

- The form has no login — anyone with the URL can submit it. `/api/submit` is rate-limited
  to 5 submissions/hour per client IP (keyed on Cloudflare's `CF-Connecting-IP` header, since
  Render's edge proxies through Cloudflare) to curb abuse; it doesn't prevent a single
  determined user, just mass spam.
- Credentials live only in `.env` (gitignored) and the host's environment variables — never
  commit real values, only `.env.example`'s placeholders.
- If any real credential is ever pasted somewhere it shouldn't be (chat, a doc, a screen
  share), rotate it immediately: reset the Client Secret and re-run
  `node scripts/get-gmail-token.js` for a new refresh token, in Google Cloud Console under
  **APIs & Services → Credentials → (your OAuth client)**.
