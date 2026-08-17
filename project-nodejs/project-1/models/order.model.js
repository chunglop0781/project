const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // mã đơn, vd: "DH0001"

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },

    quantity: { type: Number, default: 1 }, // tổng số khách/vé (giữ lại để không phá code cũ)
    total: { type: Number, required: true }, // tổng tiền đơn hàng

    // Bảng chi tiết loại khách trong đơn, dùng cho order-detail.pug
    // vd: [{ label: "Người lớn", quantity: 2, price: 1500000 }, { label: "Trẻ em", quantity: 1, price: 900000 }]
    passengers: [{
        label: { type: String },
        quantity: { type: Number },
        price: { type: Number }
    }],

    paymentMethod: {
        type: String,
        enum: ['cash', 'bank'],
        default: 'cash'
    },

    note: { type: String }, // ghi chú của khách khi đặt tour (nếu có)

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'], // đã thêm 'completed'
        default: 'pending'
    }
}, { timestamps: true }); // tự có createdAt, updatedAt

module.exports = mongoose.model('Order', orderSchema);
