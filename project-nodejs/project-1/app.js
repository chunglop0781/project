'use strict';

const path = require('path');

// Nạp biến môi trường từ "1.env" (tên file khác mặc định ".env"
// nên phải chỉ rõ path, dotenv sẽ không tự tìm thấy nếu để trống)
require('dotenv').config({ path: path.join(__dirname, '1.env') });

const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Kết nối MongoDB trước khi khởi động server
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... setup view engine, static, layout middleware, routes, v.v.
// app.use('/', require('./routes/client/index.route'));
// app.use('/admin', require('./routes/admin/index.route'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
