// routes/admin/upload.route.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình Multer lưu ảnh trực tiếp (KHÔNG moderation)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/uploads/admin');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)'));
        }
    }
});

// Route upload ảnh tour (KHÔNG moderation)
router.post('/upload-tour', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file ảnh'
            });
        }
        const fileUrl = `/uploads/admin/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Upload ảnh thành công!',
            data: { url: fileUrl }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route upload ảnh category (KHÔNG moderation)
router.post('/upload-category', upload.single('image'), (req, res) => {
    // tương tự
});

// Route upload ảnh news (KHÔNG moderation)
router.post('/upload-news', upload.single('image'), (req, res) => {
    // tương tự
});

module.exports = router;