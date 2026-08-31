
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ===============================
// VIEW ENGINE
// ===============================

app.set("view engine", "pug");

app.set(
    "views",
    path.join(__dirname, "..", "views")
);

// ===============================
// STATIC
// ===============================

app.use(
    express.static(
        path.join(__dirname, "..", "public")
    )
);

// ===============================
// ROUTES
// ===============================

const generateRoute = require(
    path.join(
        __dirname,
        "..",
        "routes",
        "generate.route"
    )
);

app.use(
    "/api/generate",
    generateRoute
);

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.render("index");
});

// ===============================
// EXPORT FOR VERCEL
// ===============================

module.exports = app;

