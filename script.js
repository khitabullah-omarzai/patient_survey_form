const form = document.getElementById("surveyForm");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  // get values
  const patient_name = document.getElementById("name").value.trim();
  const department = document.getElementById("department").value;
  const doctor_name = document.getElementById("doctor").value.trim();
  const hospital_service = document.querySelector(
    'input[name="hospitalService"]:checked'
  )?.value;
  const medical_facilities = document.querySelector(
    'input[name="medicalFacilities"]:checked'
  )?.value;

  // simple validation
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  let errors = false;

  if (!patient_name) {
    document.getElementById("errName").textContent = "Please enter your name.";
    errors = true;
  }
  if (!department) {
    document.getElementById("errDept").textContent =
      "Please select a department.";
    errors = true;
  }
  if (!doctor_name) {
    document.getElementById("errDoctor").textContent =
      "Please enter a doctor name.";
    errors = true;
  }
  if (!hospital_service) {
    document.getElementById("errHospitalService").textContent =
      "Please rate the hospital service.";
    errors = true;
  }
  if (!medical_facilities) {
    document.getElementById("errMedicalFacilities").textContent =
      "Please rate the medical facilities.";
    errors = true;
  }

  if (errors) return;

  // send data to backend
  fetch("http://localhost:5000/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_name,
      department,
      doctor_name,
      hospital_service,
      medical_facilities,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      form.reset();
    })
    .catch((err) => console.error(err));
});

// Reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  form.reset();
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
});
