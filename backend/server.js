const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:5500"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(null, false);
    }
}));

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "OnlyABES backend is alive 🚀"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "OK",
            message: "OnlyABES database connection is working",
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection test failed:", error.message);
        res.status(503).json({
            status: "ERROR",
            message: "OnlyABES database connection failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`OnlyABES backend running on http://localhost:${PORT}`);
});