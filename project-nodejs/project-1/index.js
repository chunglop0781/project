const express = require('express');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

const homeController = require('./controllers/client/home.controller');
const tourController = require('./controllers/client/tour.controller');

const app = express();
const port = 3000;

app.locals.header = "Website Du Lịch";
app.locals.footer = "© 2026 Website Du lịch";

mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log('Kết nối thành công đến MongoDB');
        console.log('Database:', mongoose.connection.name);
    })
    .catch((error) => {
        console.error('Lỗi kết nối đến MongoDB:', error);
    });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', homeController.home);
app.get('/tours', tourController.list);

app.listen(port, () => {
    console.log(`Website đang chạy trên cổng ${port}`);
});