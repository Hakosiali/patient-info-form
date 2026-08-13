# Patient Information Form

A self-contained patient intake form. On submit it:

1. Generates a PDF copy of the submission on the server (pdfkit).
2. Emails that PDF to the patient's address using your own SMTP account (Nodemailer).

No third-party form/email SaaS (no EmailJS, no Formspree, etc.) — just your code talking directly to an SMTP server.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your SMTP credentials:

```bash
cp .env.example .env
```

For Gmail: enable 2-factor auth on the account, then create an "App Password" at
https://myaccount.google.com/apppasswords and use that as `SMTP_PASS` (not your normal
Google password). Any other SMTP provider (Outlook, your own mail server, a transactional
mail provider's SMTP endpoint, etc.) works the same way — just set `SMTP_HOST`/`SMTP_PORT`.

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

If `.env` is missing or SMTP credentials aren't set, the server does **not** fail —
it still generates the PDF and saves it to `generated-pdfs/` locally, and the UI reports
"PDF generated (email not sent...)" instead of pretending an email went out. Fill in real
SMTP credentials to actually send mail.

## Notes

- Required fields: Patient's Name, Passport No, Patient's Email, Patient's Age.
