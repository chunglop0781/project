const express = require('express');
const path = require('path');
require('dotenv').config();

const database = require('./config/database.config');
const clientRoutes = require('./routes/client/index.route');
const adminRoutes = require('./routes/admin/index.route');

const app = express();
const port = 3000;

// Kết nối đến cơ sở dữ liệu MongoDB
database.connect();

app.locals.header = "Website Du Lịch";
app.locals.footer = "© 2026 Website Du lịch";

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

// Cho phép Express đọc dữ liệu từ form (req.body)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const session = require('express-session');

app.use(session({
    secret: process.env.SESSION_SECRET || 'doi-secret-key-nay-trong-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 ngày
}));

// Gán thông tin user đang đăng nhập (nếu có) vào res.locals
// để mọi view (pug) đều đọc được biến `currentUser` (dùng trong header.pug)
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// Thiết lập đường dẫn cho các route
app.use('/', clientRoutes);
app.use('/admin', adminRoutes);


app.listen(port, () => {
    console.log(`Website đang chạy trên cổng ${port}`);
});