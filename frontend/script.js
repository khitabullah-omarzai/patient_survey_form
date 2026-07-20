const form = document.getElementById("surveyForm");

form.addEventListener("submit", function (e) {

  e.preventDefault();


  // Get form values
  const patient_name = document.getElementById("name").value.trim();

  const department = document.getElementById("department").value;

  const doctor_name = document.getElementById("doctor").value.trim();


  const hospital_service =
    document.querySelector('input[name="hospitalService"]:checked')?.value;


  const medical_facilities =
    document.querySelector('input[name="medicalFacilities"]:checked')?.value;



  // Clear previous errors

  document.querySelectorAll(".error").forEach((el) => {

    el.textContent = "";

  });



  let errors = false;



  // Validation

  if (!patient_name) {

    document.getElementById("errName").textContent =
      "Please enter patient name.";

    errors = true;

  }



  if (!department) {

    document.getElementById("errDept").textContent =
      "Please select department.";

    errors = true;

  }



  if (!doctor_name) {

    document.getElementById("errDoctor").textContent =
      "Please enter doctor name.";

    errors = true;

  }



  if (!hospital_service) {

    document.getElementById("errHospitalService").textContent =
      "Please rate hospital service.";

    errors = true;

  }



  if (!medical_facilities) {

    document.getElementById("errMedicalFacilities").textContent =
      "Please rate medical facilities.";

    errors = true;

  }



  if (errors) return;



  // Data sent to backend

  const surveyData = {

    patient_name,

    department,

    doctor_name,

    hospital_service,

    medical_facilities

  };



  fetch("http://localhost:5000/submit", {

    method: "POST",

    headers: {

      "Content-Type": "application/json"

    },

    body: JSON.stringify(surveyData)

  })


    .then(response => response.json())


    .then(data => {


      if (data.success) {

        alert("Survey submitted successfully.");

        form.reset();

      }

      else {

        alert(data.message);

      }


    })


    .catch(error => {


      console.error("Error:", error);

      alert("Unable to submit survey. Server error.");


    });


});



// Reset Button

document.getElementById("resetBtn").addEventListener("click", () => {


  form.reset();


  document.querySelectorAll(".error").forEach((el) => {

    el.textContent = "";

  });


});