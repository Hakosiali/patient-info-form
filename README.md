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

Then open http://localhost:3000

## Dry-run mode

If `.env` is missing or SMTP credentials aren't set, the server does **not** fail —
it still generates the PDF and saves it to `generated-pdfs/` locally, and the UI reports
"PDF generated (email not sent...)" instead of pretending an email went out. Fill in real
SMTP credentials to actually send mail.

## Notes

- Required fields: Patient's Name, Passport No, Patient's Email, Patient's Age.
