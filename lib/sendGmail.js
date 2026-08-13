const { google } = require("googleapis");

function buildGmailSender() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_USER) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  return async function sendMail({ to, bcc, subject, text, attachmentFilename, attachmentBuffer }) {
    const boundary = `patient_form_${Date.now()}`;

    const headers = [
      `From: ${GMAIL_USER}`,
      `To: ${to}`,
      bcc ? `Bcc: ${bcc}` : null,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ]
      .filter(Boolean)
      .join("\r\n");

    const textPart = [`--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "", text].join("\r\n");

    const attachmentPart = [
      `--${boundary}`,
      `Content-Type: application/pdf; name="${attachmentFilename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachmentFilename}"`,
      "",
      attachmentBuffer.toString("base64").replace(/(.{76})/g, "$1\r\n"),
    ].join("\r\n");

    const rawMessage = [headers, "", textPart, "", attachmentPart, "", `--${boundary}--`].join("\r\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });
  };
}

module.exports = { buildGmailSender };
