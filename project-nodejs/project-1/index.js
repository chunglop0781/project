const express = require('express');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

const { Tour } = require('./models/tour.model');

const app = express();
const port = 3000;

const header = "Website Du Lịch";
const footer = "© 2026 Website Du lịch";

mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log('Kết nối thành công đến MongoDB');
        console.log('Database:', mongoose.connection.name);
        console.log('Collection:', Tour.collection.name);
    })
    .catch((error) => {
        console.error('Lỗi kết nối đến MongoDB:', error);
    });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render("client/pages/home", {
        pageTitle: "Trang chủ",
        header: header,
        footer: footer
    });
});

app.get('/tours', async (req, res) => {
    try {
        const tourList = await Tour.find();

        console.log("Danh sách tour:", tourList);

        res.render("client/pages/tour-list", {
            pageTitle: "Danh sách tour",
            tourList: tourList,
            header: header,
            footer: footer
        });
    } catch (error) {
        console.error("===== LOI LAY TOUR =====");
        console.error(error);
        console.error("========================");

        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Website đang chạy trên cổng ${port}`);
});