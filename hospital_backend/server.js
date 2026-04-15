const express = require("express");
const sql = require("mssql/msnodesqlv8");
const cors = require("cors");

const app = express();
const PORT = 5000;
const DB_NAME = "hospital_db";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Base config using Windows Authentication
const baseConfig = {
  server: "OMARZAI", // from your SSMS screenshot
  options: {
    trustedConnection: true,
    trustServerCertificate: true
  }
};

// Connect first to master to create database
const masterConfig = {
  ...baseConfig,
  database: "master"
};

// Then connect to app database
const appDbConfig = {
  ...baseConfig,
  database: DB_NAME
};

let dbPool;

// Initialize DB and table
async function initializeDatabase() {
  try {
    console.log("Connecting to SQL Server with Windows Authentication...");

    // connect to master
    const masterPool = await new sql.ConnectionPool(masterConfig).connect();

    // create database if not exists
    await masterPool.request().query(`
      IF DB_ID(N'${DB_NAME}') IS NULL
      BEGIN
        CREATE DATABASE [${DB_NAME}]
      END
    `);

    console.log(`Database '${DB_NAME}' is ready.`);
    await masterPool.close();

    // connect to created database
    dbPool = await new sql.ConnectionPool(appDbConfig).connect();

    // create table if not exists
    await dbPool.request().query(`
      IF OBJECT_ID('dbo.patient_survey', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.patient_survey (
          id INT IDENTITY(1,1) PRIMARY KEY,
          patient_name NVARCHAR(100) NOT NULL,
          department NVARCHAR(100) NOT NULL,
          doctor_name NVARCHAR(100) NOT NULL,
          hospital_service NVARCHAR(255) NOT NULL,
          medical_facilities NVARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        )
      END
    `);

    console.log("Table 'patient_survey' is ready.");
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  }
}

// Submit route
app.post("/submit", async (req, res) => {
  try {
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

    await dbPool
      .request()
      .input("patient_name", sql.NVarChar(100), patient_name)
      .input("department", sql.NVarChar(100), department)
      .input("doctor_name", sql.NVarChar(100), doctor_name)
      .input("hospital_service", sql.NVarChar(255), hospital_service)
      .input("medical_facilities", sql.NVarChar(255), medical_facilities)
      .query(`
        INSERT INTO dbo.patient_survey
        (patient_name, department, doctor_name, hospital_service, medical_facilities)
        VALUES
        (@patient_name, @department, @doctor_name, @hospital_service, @medical_facilities)
      `);

    res.status(201).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Insert error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Optional fetch route
app.get("/patients", async (req, res) => {
  try {
    const result = await dbPool.request().query(`
      SELECT * FROM dbo.patient_survey ORDER BY id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});