const mongoose = require('mongoose');

// Nạp .env ở thư mục gốc project
require('dotenv').config();

module.exports.connect = async () => {
    try {
        const connectionString = process.env.MONGODB_URI_1 || process.env.DATABASE;

        if (!connectionString) {
            throw new Error('Không tìm thấy chuỗi kết nối MongoDB (kiểm tra MONGODB_URI_1 hoặc DATABASE trong .env)');
        }

        await mongoose.connect(connectionString);
        console.log("Kết nối DB thành công!");
    } catch (error) {
        console.log("Kết nối DB thất bại!");
        console.log(error);
    }
};