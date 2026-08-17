const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true, sparse: true }, // mã tour, vd: "TR001" - dùng ở order-detail.pug
    vehicle: String,
    duration: String,       // vd: "3 ngày 2 đêm" - dùng ở order-detail.pug
    departureDate: Date,    // ngày khởi hành - dùng ở order-detail.pug
    description: String,
    image: String,

    // giữ lại "price" cũ để không phá code cũ (order.model.js, order-detail.pug...)
    // -> khi lưu tour sẽ đồng bộ price = newPrice.adult
    price: { type: Number, default: 0 },

    bookedCount: { type: Number, default: 0 }, // số lượt đã đặt, dùng cho "Tour bán chạy"

    // ---------------------------------------------------------------
    // Các field mới, phục vụ trang Quản lý tour / Tạo tour (28Admin UI)
    // ---------------------------------------------------------------

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    position: { type: Number, default: 1 }, // vị trí sắp xếp

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    // Giá cũ (giá gạch ngang, không bắt buộc)
    oldPrice: {
        adult: { type: Number, default: 0 },  // NL - Người lớn
        child: { type: Number, default: 0 },  // TE - Trẻ em
        infant: { type: Number, default: 0 }  // EB - Em bé
    },

    // Giá mới (giá bán thực tế)
    newPrice: {
        adult: { type: Number, default: 0 },
        child: { type: Number, default: 0 },
        infant: { type: Number, default: 0 }
    },

    // Số lượng chỗ còn lại theo từng loại khách
    remaining: {
        adult: { type: Number, default: 0 },
        child: { type: Number, default: 0 },
        infant: { type: Number, default: 0 }
    },

    // Những địa điểm có tour, vd: ["ha-noi", "da-nang"]
    locations: [{ type: String }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ---------------------------------------------------------------
    // Thùng rác (soft delete) - dùng cho trang "Thùng rác tour"
    // ---------------------------------------------------------------

    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);
