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


// SQL Server Configuration
const masterConfig = {
  driver: "msnodesqlv8",
  connectionString:
    "Driver={ODBC Driver 18 for SQL Server};Server=localhost\\OMARZAI;Database=master;Trusted_Connection=Yes;TrustServerCertificate=Yes;"
};

const appDbConfig = {
  driver: "msnodesqlv8",
  connectionString:
    "Driver={ODBC Driver 18 for SQL Server};Server=localhost\\OMARZAI;Database=hospital_db;Trusted_Connection=Yes;TrustServerCertificate=Yes;"
};


let dbPool;


// Initialize Database
async function initializeDatabase() {

  try {

    console.log("Connecting to SQL Server...");


    const masterPool = await new sql.ConnectionPool(masterConfig).connect();


    await masterPool.request().query(`
        IF DB_ID(N'${DB_NAME}') IS NULL
        BEGIN
            CREATE DATABASE [${DB_NAME}]
        END
    `);


    console.log(`Database '${DB_NAME}' ready.`);


    await masterPool.close();



    // Connect Application Database
    dbPool = await new sql.ConnectionPool(appDbConfig).connect();



    console.log("Connected to hospital_db");



    // Create Table

    await dbPool.request().query(`

        IF OBJECT_ID('dbo.patient_survey','U') IS NULL

        BEGIN

            CREATE TABLE dbo.patient_survey
            (
                id INT IDENTITY(1,1) PRIMARY KEY,

                patient_name NVARCHAR(100) NOT NULL,

                department NVARCHAR(100) NOT NULL,

                doctor_name NVARCHAR(100) NOT NULL,

                hospital_service NVARCHAR(50) NOT NULL,

                medical_facilities NVARCHAR(50) NOT NULL,

                created_at DATETIME DEFAULT GETDATE()
            )

        END

    `);


    console.log("patient_survey table ready.");


  }

  catch(err){

    console.error("Database initialization error:");
    console.error(err);

    process.exit(1);

  }

}



// Submit Survey

app.post("/submit", async(req,res)=>{


    try{


        const {

            patient_name,

            department,

            doctor_name,

            hospital_service,

            medical_facilities


        } = req.body;



        if(
            !patient_name ||
            !department ||
            !doctor_name ||
            !hospital_service ||
            !medical_facilities
        ){

            return res.status(400).json({

                success:false,

                message:"Please fill all required fields."

            });

        }



        await dbPool.request()


        .input(
            "patient_name",
            sql.NVarChar(100),
            patient_name
        )


        .input(
            "department",
            sql.NVarChar(100),
            department
        )


        .input(
            "doctor_name",
            sql.NVarChar(100),
            doctor_name
        )


        .input(
            "hospital_service",
            sql.NVarChar(50),
            hospital_service
        )


        .input(
            "medical_facilities",
            sql.NVarChar(50),
            medical_facilities
        )


        .query(`

            INSERT INTO dbo.patient_survey

            (
                patient_name,

                department,

                doctor_name,

                hospital_service,

                medical_facilities
            )


            VALUES

            (

                @patient_name,

                @department,

                @doctor_name,

                @hospital_service,

                @medical_facilities

            )

        `);



        res.status(201).json({

            success:true,

            message:"Survey submitted successfully."

        });


    }


    catch(err){


        console.error(err);


        res.status(500).json({

            success:false,

            message:"Database insertion failed."

        });


    }


});




// Get All Surveys

app.get("/patients", async(req,res)=>{


    try{


        const result = await dbPool.request().query(`

            SELECT *

            FROM dbo.patient_survey

            ORDER BY id DESC

        `);



        res.json(result.recordset);


    }

    catch(err){


        console.error(err);


        res.status(500).json({

            message:"Database error."

        });


    }


});




// Start Server

initializeDatabase()

.then(()=>{


    app.listen(PORT,()=>{


        console.log(
            `Server running at http://localhost:${PORT}`
        );


    });


});