require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { generatePatientFormPdf } = require("./lib/generatePdf");
const { buildGmailSender } = require("./lib/sendGmail");
const { buildSheetAppender } = require("./lib/appendToSheet");

const app = express();
const PORT = process.env.PORT || 3000;

// Render's edge sits behind Cloudflare, then Render's own proxy, before
// reaching this app - trust proxy so req.ip resolves correctly either way.
app.set("trust proxy", true);

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Cloudflare sets this to the true client IP, more reliable than trusting
  // an X-Forwarded-For chain of unknown/variable length.
  keyGenerator: (req) => ipKeyGenerator(req.headers["cf-connecting-ip"] || req.ip),
  message: { error: "Too many submissions from this device. Please try again later." },
});

const REQUIRED_FIELDS = ["patientName", "passportNo", "patientEmail", "patientAge"];

app.post("/api/submit", submitLimiter, async (req, res) => {
  const data = req.body || {};

  const missing = REQUIRED_FIELDS.filter((field) => !data[field]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  try {
    const pdfBuffer = await generatePatientFormPdf(data);

    const appendSheet = buildSheetAppender();
    if (appendSheet) {
      try {
        await appendSheet(data);
      } catch (err) {
        console.error("Failed to log submission to Google Sheet:", err.message);
      }
    }

    const sendMail = buildGmailSender();

    if (!sendMail) {
      const outDir = path.join(__dirname, "generated-pdfs");
      fs.mkdirSync(outDir, { recursive: true });
      const filePath = path.join(outDir, `patient-form-${Date.now()}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);
      console.log(`[DRY RUN] Gmail API not configured. PDF saved to ${filePath}`);
      console.log(`[DRY RUN] Would have emailed: ${data.patientEmail}`);
      return res.json({ ok: true, dryRun: true, savedTo: filePath });
    }

    await sendMail({
      to: data.patientEmail,
      bcc: process.env.MAIL_BCC || undefined,
      subject: "Your Patient Information Form",
      text: `Dear ${data.patientName},\n\nPlease find attached a PDF copy of your submitted patient information form.\n\nRegards.`,
      attachmentFilename: `patient-form-${data.patientName || "patient"}.pdf`,
      attachmentBuffer: pdfBuffer,
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
