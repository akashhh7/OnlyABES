const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
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
app.use(express.json());

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

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !password
    ) {
        res.status(400).json({
            status: "ERROR",
            message: "Name, email, and password are required"
        });
        return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rowCount > 0) {
            res.status(409).json({
                status: "ERROR",
                message: "An account with this email already exists"
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [name.trim(), normalizedEmail, passwordHash]
        );

        res.status(201).json({
            status: "OK",
            message: "Account created successfully",
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            res.status(409).json({
                status: "ERROR",
                message: "An account with this email already exists"
            });
            return;
        }

        console.error("User registration failed:", error.message);
        res.status(500).json({
            status: "ERROR",
            message: "Unable to create account"
        });
    }
});

app.listen(PORT, () => {
    console.log(`OnlyABES backend running on http://localhost:${PORT}`);
});