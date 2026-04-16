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
  server: "OMARZAI",
  database: "master",
  driver: "msnodesqlv8",
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

    // Connect to master
    const masterPool = await new sql.ConnectionPool(masterConfig).connect();

    // Create database if it does not exist
    await masterPool.request().query(`
      IF DB_ID(N'${DB_NAME}') IS NULL
      BEGIN
        CREATE DATABASE [${DB_NAME}]
      END
    `);

    console.log(`Database '${DB_NAME}' is ready.`);
    await masterPool.close();

    // Connect to app database
    dbPool = await new sql.ConnectionPool(appDbConfig).connect();

    // Create table if it does not exist
    await dbPool.request().query(`
      IF OBJECT_ID('dbo.patient_survey', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.patient_survey (
          id INT IDENTITY(1,1) PRIMARY KEY,
          patient_name NVARCHAR(100) NOT NULL,
          file_number NVARCHAR(50) NOT NULL,
          department NVARCHAR(100) NOT NULL,
          overall_treatment NVARCHAR(30) NOT NULL,
          medical_facilities NVARCHAR(30) NOT NULL,
          overall_comments NVARCHAR(500) NULL,
          created_at DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // Add missing columns if the table already exists from an old version
    await dbPool.request().query(`
      IF COL_LENGTH('dbo.patient_survey', 'file_number') IS NULL
        ALTER TABLE dbo.patient_survey ADD file_number NVARCHAR(50) NULL;

      IF COL_LENGTH('dbo.patient_survey', 'overall_treatment') IS NULL
        ALTER TABLE dbo.patient_survey ADD overall_treatment NVARCHAR(30) NULL;

      IF COL_LENGTH('dbo.patient_survey', 'overall_comments') IS NULL
        ALTER TABLE dbo.patient_survey ADD overall_comments NVARCHAR(500) NULL;
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
      file_number,
      department,
      overall_treatment,
      medical_facilities,
      overall_comments
    } = req.body;

    if (
      !patient_name ||
      !file_number ||
      !department ||
      !overall_treatment ||
      !medical_facilities
    ) {
      return res.status(400).json({
        error: "Please complete all required fields."
      });
    }

    await dbPool
      .request()
      .input("patient_name", sql.NVarChar(100), patient_name)
      .input("file_number", sql.NVarChar(50), file_number)
      .input("department", sql.NVarChar(100), department)
      .input("overall_treatment", sql.NVarChar(30), overall_treatment)
      .input("medical_facilities", sql.NVarChar(30), medical_facilities)
      .input("overall_comments", sql.NVarChar(500), overall_comments || null)
      .query(`
        INSERT INTO dbo.patient_survey
        (patient_name, file_number, department, overall_treatment, medical_facilities, overall_comments)
        VALUES
        (@patient_name, @file_number, @department, @overall_treatment, @medical_facilities, @overall_comments)
      `);

    res.status(201).json({ message: "Survey submitted successfully." });
  } catch (error) {
    console.error("Insert error:", error);
    res.status(500).json({ error: "Database error. Please try again." });
  }
});

// Fetch all records
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