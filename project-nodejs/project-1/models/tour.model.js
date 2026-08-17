const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true, sparse: true }, // mã tour, vd: "TR001" - dùng ở order-detail.pug
    vehicle: String,
    duration: String,       // vd: "3 ngày 2 đêm" - dùng ở order-detail.pug
    departureDate: Date,    // ngày khởi hành - dùng ở order-detail.pug
    description: String,
    image: String,
    price: { type: Number, default: 0 },
    bookedCount: { type: Number, default: 0 } // số lượt đã đặt, dùng cho "Tour bán chạy"
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);
