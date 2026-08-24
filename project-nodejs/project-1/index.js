const express = require('express');
const path = require('path');
require('dotenv').config();

const database = require('./config/database.config');

const clientRoutes = require('./routes/client/index.route');
const adminRoutes = require('./routes/admin/index.route');
const errorRoutes = require('./routes/error.route');

const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;


/* =============================================================
   KẾT NỐI DATABASE
============================================================= */

database.connect();


/* =============================================================
   APP LOCALS
============================================================= */

app.locals.header = "Website Du Lịch";
app.locals.footer = "© 2026 Website Du lịch";


/* =============================================================
   PUG
============================================================= */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


/* =============================================================
   STATIC
============================================================= */

app.use(express.static(path.join(__dirname, 'public')));


/* =============================================================
   PARSE REQUEST BODY
============================================================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


/* =============================================================
   COOKIE PARSER
============================================================= */

app.use(cookieParser());


/* =============================================================
   SESSION
============================================================= */

app.use(session({
    secret: process.env.SESSION_SECRET || 'doi-secret-key-nay-trong-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));


/* =============================================================
   CURRENT USER
============================================================= */

/*
 * Gán thông tin user đang đăng nhập vào res.locals
 * để các file Pug có thể sử dụng currentUser
 */

app.use((req, res, next) => {

    res.locals.currentUser =
        req.session.user || null;

    next();

});


/* =============================================================
   RESET PASSWORD FLOW DEBUG
   BỔ SUNG - KHÔNG XÓA CODE CŨ
============================================================= */

app.use((req, res, next) => {

    if (
        req.path === '/forgot-password' ||
        req.path === '/verify-otp' ||
        req.path === '/change-password'
    ) {

        console.log(
            '=========================================='
        );


        console.log(
            '🔐 RESET PASSWORD FLOW'
        );


        console.log(
            'METHOD:',
            req.method
        );


        console.log(
            'URL:',
            req.originalUrl
        );


        console.log(
            'BODY:',
            req.body
        );


        console.log(
            'SESSION PASSWORD RESET:',
            req.session.passwordReset
        );


        console.log(
            '=========================================='
        );

    }


    next();

});


/* =============================================================
   CLIENT ROUTES
============================================================= */

app.use('/', clientRoutes);


/* =============================================================
   ADMIN ROUTES
============================================================= */

app.use('/admin', adminRoutes);


/* =============================================================
   404 / ERROR
   PHẢI ĐẶT CUỐI CÙNG
============================================================= */

app.use(errorRoutes);


/* =============================================================
   START SERVER
============================================================= */

app.listen(port, () => {

    console.log(
        `Website đang chạy trên cổng ${port}`
    );

});