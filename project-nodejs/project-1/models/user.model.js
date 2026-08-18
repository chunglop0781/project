const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String }, // dùng ở customer-detail.pug và order-detail.pug
    avatar: { type: String, default: '' }, // rỗng -> dùng ảnh mặc định / chữ cái đầu tên
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
