const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
    name: { type: String, default: '' },      // Tên website
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    logo: { type: String, default: '' },       // đường dẫn ảnh, vd: /uploads/xxx.png
    favicon: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Website', websiteSchema);
