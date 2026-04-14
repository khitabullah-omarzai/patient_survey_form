const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// === MIDDLEWARE ===
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// === MYSQL CONNECTION ===
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // your MySQL username
  password: "root", // your MySQL password
  database: "hospital_db",
});

db.connect((err) => {
  if (err) {
    console.error("DB Connection Error:", err);
  } else {
    console.log("MySQL Connected Successfully!");
  }
});

// === ROUTE TO SUBMIT FORM ===
app.post("/submit", (req, res) => {
  const {
    patient_name,
    department,
    doctor_name,
    hospital_service,
    medical_facilities,
  } = req.body;

  if (
    !patient_name ||
    !department ||
    !doctor_name ||
    !hospital_service ||
    !medical_facilities
  ) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  const query =
    "INSERT INTO patient_survey (patient_name, department, doctor_name, hospital_service, medical_facilities) VALUES (?, ?, ?, ?, ?)";
  db.query(
    query,
    [
      patient_name,
      department,
      doctor_name,
      hospital_service,
      medical_facilities,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Form submitted successfully!" });
    }
  );
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
