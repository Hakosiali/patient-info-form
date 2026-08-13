require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const nodemailer = require("nodemailer");
const { generatePatientFormPdf } = require("./lib/generatePdf");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

const REQUIRED_FIELDS = ["patientName", "passportNo", "patientEmail", "patientAge"];

function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

app.post("/api/submit", async (req, res) => {
  const data = req.body || {};

  const missing = REQUIRED_FIELDS.filter((field) => !data[field]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  try {
    const pdfBuffer = await generatePatientFormPdf(data);
    const transporter = buildTransporter();

    if (!transporter) {
      const outDir = path.join(__dirname, "generated-pdfs");
      fs.mkdirSync(outDir, { recursive: true });
      const filePath = path.join(outDir, `patient-form-${Date.now()}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);
      console.log(`[DRY RUN] SMTP not configured. PDF saved to ${filePath}`);
      console.log(`[DRY RUN] Would have emailed: ${data.patientEmail}`);
      return res.json({ ok: true, dryRun: true, savedTo: filePath });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.patientEmail,
      bcc: process.env.MAIL_BCC || undefined,
      subject: "Your Patient Information Form",
      text: `Dear ${data.patientName},\n\nPlease find attached a PDF copy of your submitted patient information form.\n\nRegards.`,
      attachments: [
        {
          filename: `patient-form-${data.patientName || "patient"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res.json({ ok: true, dryRun: false });
  } catch (err) {
    console.error("Failed to process submission:", err);
    return res.status(500).json({ error: "Failed to generate or send the PDF." });
  }
});

app.listen(PORT, () => {
  console.log(`Patient form server running at http://localhost:${PORT}`);
});
