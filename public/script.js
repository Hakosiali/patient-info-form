const form = document.getElementById("patientForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");
const packageAmount = document.getElementById("packageAmount");
const paidAmount = document.getElementById("paidAmount");
const remainingAmount = document.getElementById("remainingAmount");
const dob = document.getElementById("dob");
const patientAge = document.getElementById("patientAge");

function recalcRemaining() {
  const pkg = parseFloat(packageAmount.value) || 0;
  const paid = parseFloat(paidAmount.value) || 0;
  remainingAmount.value = (pkg - paid).toFixed(2);
}

function recalcAge() {
  if (!dob.value) {
    patientAge.value = "";
    return;
  }
  const birthDate = new Date(dob.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  patientAge.value = age >= 0 ? age : "";
}

packageAmount.addEventListener("input", recalcRemaining);
paidAmount.addEventListener("input", recalcRemaining);
dob.addEventListener("input", recalcAge);

function getSelectedOptions(select) {
  return Array.from(select.selectedOptions).map((opt) => opt.value);
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  recalcRemaining();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.treatmentTypes = getSelectedOptions(document.getElementById("treatmentTypes"));

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  statusMessage.hidden = true;

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    if (result.dryRun) {
      showStatus(
        "PDF generated (email not sent — SMTP is not configured yet). See server logs.",
        "success"
      );
    } else {
      showStatus("Email sent to patient successfully.", "success");
    }
    form.reset();
    recalcRemaining();
    recalcAge();
  } catch (err) {
    showStatus(err.message || "Failed to submit the form.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});
