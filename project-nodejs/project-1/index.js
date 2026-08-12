const express = require('express');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log('Kết nối thành công đến MongoDB');
        console.log('Database:', mongoose.connection.name);
    })
    .catch((error) => {
        console.error('Lỗi kết nối đến MongoDB:', error);
    });

const clientRoutes = require('./routes/client/index.route');


const app = express();
const port = 3000;

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