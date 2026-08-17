const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên danh mục

    slug: { type: String, unique: true, sparse: true }, // dùng cho URL, tự tạo ở route khi tạo mới

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // Danh mục cha (null = danh mục gốc)

    position: { type: Number, default: 1 }, // Vị trí sắp xếp

    image: { type: String }, // Ảnh đại diện

    description: { type: String }, // Mô tả

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
