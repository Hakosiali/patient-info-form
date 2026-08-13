const SHEET_HEADERS = [
  "Timestamp",
  "Patient's Name",
  "Passport No",
  "Date of Birth",
  "Patient's Age",
  "Patient's Email",
  "Height (CM)",
  "Weight (KG)",
  "Country",
  "Flight Arrival Code",
  "Flight Departure Code",
  "Arr Date",
  "Op Date",
  "Dep Date",
  "Flight Note",
  "Type of Treatments",
  "Diagnostic No",
  "Op Types",
  "Currency",
  "Note for Accommodation",
  "Package Amount",
  "Paid Amount",
  "Remaining Amount",
];

function dataToRow(data) {
  const treatmentTypes = Array.isArray(data.treatmentTypes)
    ? data.treatmentTypes.join(", ")
    : data.treatmentTypes || "";

  return [
    new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC"),
    data.patientName || "",
    data.passportNo || "",
    data.dob || "",
    data.patientAge || "",
    data.patientEmail || "",
    data.height || "",
    data.weight || "",
    data.country || "",
    data.arrivalCode || "",
    data.departureCode || "",
    data.arrDate || "",
    data.opDate || "",
    data.depDate || "",
    data.flightNote || "",
    treatmentTypes,
    data.diagnosticNo || "",
    data.opTypes || "",
    data.currency || "",
    data.accommodationNote || "",
    data.packageAmount || "",
    data.paidAmount || "",
    data.remainingAmount || "",
  ];
}

module.exports = { SHEET_HEADERS, dataToRow };
