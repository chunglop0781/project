'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../1.env') });

const mongoose = require('mongoose');

async function test() {

    const uri = process.env.MONGODB_URI_1;

    console.log('--- Kiểm tra biến môi trường ---');
    if (!uri) {
        console.log('❌ MONGODB_URI_1 đang RỖNG hoặc không đọc được từ 1.env');
        console.log('   -> Kiểm tra file 1.env có nằm đúng ở project root không (ngang hàng index.js)');
        process.exit(1);
    }
    console.log('✅ Đọc được MONGODB_URI_1, độ dài:', uri.length, 'ký tự');
    console.log('   Database trong URI:', uri.split('/').pop().split('?')[0]);

    console.log('\n--- Đang thử kết nối tới MongoDB Atlas ---');

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
        console.log('✅ KẾT NỐI THÀNH CÔNG');
        console.log('   Database đang dùng:', mongoose.connection.name);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('   Các collection hiện có:', collections.map(c => c.name).join(', ') || '(chưa có collection nào)');

        const Tour = require('../models/tour.model');
        const count = await Tour.countDocuments();
        console.log('   Số tour trong collection "tours":', count);

        process.exit(0);

    } catch (error) {
        console.log('❌ KẾT NỐI THẤT BẠI');
        console.log('   Loại lỗi:', error.name);
        console.log('   Chi tiết:', error.message);

        if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
            console.log('\n   -> Sai username hoặc password trong URI. Kiểm tra lại trong Atlas:');
            console.log('      Database Access > user "mthn04112009_db_user" > Edit password');
            console.log('      Nếu password có ký tự đặc biệt (@ # % : / ...), phải encode URL');
            console.log('      (ví dụ @ -> %40). Dùng encodeURIComponent() để tự encode.');
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('querySrv') || error.message.includes('whitelist') || error.name === 'MongooseServerSelectionError') {
            console.log('\n   -> Nhiều khả năng do Network Access (IP Whitelist) trên Atlas.');
            console.log('      Vào Atlas > Network Access > Add IP Address > "Allow Access from Anywhere" (0.0.0.0/0) để test.');
        }

        process.exit(1);
    }

}

test();
