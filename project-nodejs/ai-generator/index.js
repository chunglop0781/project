
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================================================
// VIEW ENGINE
// =========================================================

app.set("view engine", "pug");

app.set(
    "views",
    path.join(__dirname, "views")
);


// =========================================================
// STATIC
// =========================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =========================================================
// ROUTES
// =========================================================

const generateRoute =
    require("./routes/generate.route");

app.use(
    "/api/generate",
    generateRoute
);


// =========================================================
// HOME
// =========================================================

app.get("/", (req, res) => {

    res.render("index");

});


// =========================================================
// 404
// =========================================================

app.use((req, res) => {

    // API → trả JSON
    if (req.path.startsWith("/api/")) {

        return res.status(404).json({
            success: false,
            message: "API endpoint không tồn tại",
            path: req.path
        });

    }

    // Website → trả text
    return res.status(404).send(
        "The page could not be found."
    );

});


// =========================================================
// ERROR HANDLER
// =========================================================

app.use((err, req, res, next) => {

    console.error(
        "🔥 EXPRESS ERROR:",
        err
    );

    if (req.path.startsWith("/api/")) {

        return res.status(500).json({
            success: false,
            message:
                err.message ||
                "Internal Server Error"
        });

    }

    return res.status(500).send(
        "Internal Server Error"
    );

});


// =========================================================
// VERCEL
// =========================================================
//
// Vercel cần app được export.
// Không gọi app.listen() khi chạy trên Vercel.
//

module.exports = app;


// =========================================================
// LOCAL DEVELOPMENT
// =========================================================

if (require.main === module) {

    const PORT =
        process.env.PORT || 3000;

    app.listen(PORT, () => {

        console.log(
            `🚀 Server chạy tại http://localhost:${PORT}`
        );

    });

}

