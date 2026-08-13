const PDFDocument = require("pdfkit");

const COLORS = {
  maroon: "#7a1120",
  label: "#6b6b6b",
  text: "#222222",
  border: "#dddddd",
  footer: "#999999",
};

const MARGIN_X = 40;
const ROW_HEIGHT = 34;
const SECTION_BAR_HEIGHT = 22;

function sectionBar(doc, title, y, width) {
  doc.rect(MARGIN_X, y, width, SECTION_BAR_HEIGHT).fill(COLORS.maroon);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title.toUpperCase(), MARGIN_X + 12, y + 6, { characterSpacing: 0.5 });
  return y + SECTION_BAR_HEIGHT + 12;
}

function fieldGrid(doc, fields, y, width) {
  const colWidth = width / 2 - 10;
  let curY = y;
  let col = 0;

  for (const [label, rawValue] of fields) {
    const value = rawValue === undefined || rawValue === null || rawValue === "" ? "-" : String(rawValue);
    const colX = MARGIN_X + (col === 0 ? 0 : colWidth + 20);

    doc
      .fillColor(COLORS.label)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(label.toUpperCase(), colX, curY, { width: colWidth, characterSpacing: 0.3 });

    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(11)
      .text(value, colX, curY + 12, { width: colWidth, height: 14, ellipsis: true });

    doc
      .moveTo(colX, curY + 28)
      .lineTo(colX + colWidth, curY + 28)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    if (col === 1) {
      curY += ROW_HEIGHT;
      col = 0;
    } else {
      col = 1;
    }
  }

  if (col === 1) {
    curY += ROW_HEIGHT;
  }

  return curY + 8;
}

function generatePatientFormPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN_X });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - MARGIN_X * 2;
    let y = MARGIN_X;

    doc.rect(MARGIN_X, y, contentWidth, 46).fill("#2a0a0a");
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Patient Information Form", MARGIN_X + 14, y + 15);
    y += 46 + 14;

    const treatmentTypes = Array.isArray(data.treatmentTypes)
      ? data.treatmentTypes.join(", ")
      : data.treatmentTypes || "";

    y = sectionBar(doc, "Patient Info", y, contentWidth);
    y = fieldGrid(
      doc,
      [
        ["Patient's Name", data.patientName],
        ["Passport No", data.passportNo],
        ["Date of Birth", data.dob],
        ["Patient's Age", data.patientAge],
        ["Patient's Email", data.patientEmail],
        ["Height (CM)", data.height],
        ["Weight (KG)", data.weight],
        ["Country", data.country],
      ],
      y,
      contentWidth
    );

    y = sectionBar(doc, "Flight Info", y, contentWidth);
    y = fieldGrid(
      doc,
      [
        ["Flight Arrival Code", data.arrivalCode],
        ["Flight Departure Code", data.departureCode],
        ["Arr Date", data.arrDate],
        ["Op Date", data.opDate],
        ["Dep Date", data.depDate],
        ["Flight Note", data.flightNote],
      ],
      y,
      contentWidth
    );

    y = sectionBar(doc, "Treatment Info", y, contentWidth);
    y = fieldGrid(
      doc,
      [
        ["Type of Treatments", treatmentTypes],
        ["Diagnostic No", data.diagnosticNo],
        ["Op Types", data.opTypes],
      ],
      y,
      contentWidth
    );

    y = sectionBar(doc, "Financial Info", y, contentWidth);
    y = fieldGrid(
      doc,
      [
        ["Currency", data.currency],
        ["Note for Accommodation", data.accommodationNote],
        ["Package Amount", data.packageAmount],
        ["Paid Amount", data.paidAmount],
        ["Remaining Amount", data.remainingAmount],
      ],
      y,
      contentWidth
    );

    doc
      .fillColor(COLORS.footer)
      .font("Helvetica")
      .fontSize(9)
      .text(`Generated ${new Date().toLocaleString()}`, MARGIN_X, y + 6);

    doc.end();
  });
}

module.exports = { generatePatientFormPdf };
