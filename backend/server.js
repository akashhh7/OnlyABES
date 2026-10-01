const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;
const AUTH_COOKIE_NAME = "onlyabes_auth";
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(null, false);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/"
    };
}

function getAuthCookieClearOptions() {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/"
    };
}

function getAuthenticatedUser(req) {
    if (!JWT_SECRET || !req.cookies[AUTH_COOKIE_NAME]) {
        return null;
    }

    try {
        return jwt.verify(req.cookies[AUTH_COOKIE_NAME], JWT_SECRET);
    } catch (error) {
        return null;
    }
}

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

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        res.status(400).json({
            status: "ERROR",
            message: "Email and password are required"
        });
        return;
    }

    if (!JWT_SECRET) {
        console.error("JWT_SECRET is not configured.");
        res.status(500).json({
            status: "ERROR",
            message: "Authentication is not configured"
        });
        return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const result = await pool.query(
            "SELECT id, name, email, password_hash FROM users WHERE email = $1",
            [normalizedEmail]
        );
        const user = result.rows[0];
        const passwordMatches = user
            ? await bcrypt.compare(password, user.password_hash)
            : false;

        if (!passwordMatches) {
            res.status(401).json({
                status: "ERROR",
                message: "Invalid email or password"
            });
            return;
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
        res.json({
            status: "OK",
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("User login failed:", error.message);
        res.status(500).json({
            status: "ERROR",
            message: "Unable to log in"
        });
    }
});

app.get("/api/auth/me", async (req, res) => {
    const tokenUser = getAuthenticatedUser(req);

    if (!tokenUser) {
        res.status(401).json({
            status: "ERROR",
            message: "Authentication required"
        });
        return;
    }

    try {
        const result = await pool.query(
            "SELECT id, name, email FROM users WHERE id = $1",
            [tokenUser.id]
        );
        const user = result.rows[0];

        if (!user) {
            res.status(401).json({
                status: "ERROR",
                message: "Authentication required"
            });
            return;
        }

        res.json({
            status: "OK",
            user
        });
    } catch (error) {
        console.error("Authenticated user lookup failed:", error.message);
        res.status(500).json({
            status: "ERROR",
            message: "Unable to load authenticated user"
        });
    }
});

app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieClearOptions());
    res.json({
        status: "OK",
        message: "Logout successful"
    });
});

app.listen(PORT, () => {
    console.log(`OnlyABES backend running on http://localhost:${PORT}`);
});