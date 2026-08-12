const express = require('express');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log('Kết nối thành công đến MongoDB');
        console.log('Database:', mongoose.connection.name);
        console.log('Collection:', Tour.collection.name);
    })
    .catch((error) => {
        console.error('Lỗi kết nối đến MongoDB:', error);
    });

const Tour = mongoose.model('Tour', {
    name: String,
    vehicle: String
});

const app = express();
const port = 3000;

const header = "Website Du Lịch";
const footer = "© 2026 Website Du lịch";

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render("client/pages/home.pug", {
        pageTitle: "Trang chủ",
        header: header,
        footer: footer
    });
});

app.get('/tours', async (req, res) => {
    const tourList = await Tour.find();

    console.log(tourList);

    res.render("client/pages/tour-list.pug", {
        pageTitle: "Danh sách tour",
        tourList: tourList,
        header: header,
        footer: footer
    });
});

app.listen(port, () => {
    console.log(`Website đang chạy trên cổng ${port}`);
});