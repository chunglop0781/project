const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const requireAuth = require('../../middlewares/requireAuth');
const infoController = require('../../controllers/client/info.controller');

// =============================================================
// CẤU HÌNH UPLOAD ẢNH ĐẠI DIỆN
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/profiles'));
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const uniqueName = `${timestamp}-${random}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// =============================================================
// INFO ROUTES
// =============================================================

// Trang thông tin cá nhân
router.get('/', requireAuth, infoController.detail);

// Cập nhật thông tin (có upload ảnh)
router.post('/', requireAuth, upload.single('avatar'), infoController.update);

// Đổi mật khẩu
router.post('/password', requireAuth, infoController.updatePassword);

module.exports = router;