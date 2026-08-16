const path = require('path');
const mongoose = require('mongoose');

// Nạp cả .env (gốc) và 1.env — 1.env được nạp sau và override để ưu tiên
require('dotenv').config(); // nạp .env gốc trước
require('dotenv').config({
    path: path.resolve(__dirname, '../1.env'),
    override: true
});

module.exports.connect = async () => {
    try {
        const connectionString = process.env.MONGODB_URI_1 || process.env.DATABASE;

        if (!connectionString) {
            throw new Error('Không tìm thấy chuỗi kết nối MongoDB (kiểm tra MONGODB_URI_1 trong 1.env hoặc DATABASE trong .env)');
        }

        await mongoose.connect(connectionString);
        console.log("Kết nối DB thành công!");
    } catch (error) {
        console.log("Kết nối DB thất bại!");
        console.log(error);
    }
};