const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true },

    thumbnail: { type: String },
    excerpt: { type: String }, // mô tả ngắn - dùng ở news-form.pug
    content: { type: String },
    category: { type: String },

    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },

    publishedAt: { type: Date } // chỉ set khi status chuyển sang 'published'

}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
