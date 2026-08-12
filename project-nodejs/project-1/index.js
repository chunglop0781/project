const express = require('express');
const path = require('path');
require('dotenv').config();

const database = require('./config/database.config');
const clientRoutes = require('./routes/client/index.route');

const app = express();
const port = 3000;

//Kết nối đến cơ sở dữ liệu MongoDB
database.connect();

app.locals.header = "Website Du Lịch";
app.locals.footer = "© 2026 Website Du lịch";

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

// Thiết lập đuong dẫn cho các route
app.use('/', clientRoutes);


app.listen(port, () => {
    console.log(`Website đang chạy trên cổng ${port}`);
});