const jwt = require("jsonwebtoken");

const AUTH_COOKIE_NAME = "onlyabes_auth";

function requireAuthentication(req, res, next) {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!process.env.JWT_SECRET || !token) {
        res.status(401).json({
            status: "ERROR",
            message: "Authentication required"
        });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (!payload || typeof payload !== "object" || !payload.id) {
            throw new Error("Authenticated token does not contain a user id.");
        }

        req.userId = payload.id;
        next();
    } catch (error) {
        res.status(401).json({
            status: "ERROR",
            message: "Authentication required"
        });
    }
}

module.exports = requireAuthentication;
