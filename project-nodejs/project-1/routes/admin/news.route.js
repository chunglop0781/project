const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const requireAdmin = require('../../middlewares/requireAdmin');
const newsController = require('../../controllers/admin/news.controller');

// =============================================================
// CẤU HÌNH UPLOAD ẢNH
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/news'));
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
// NEWS ROUTES
// =============================================================

// Danh sách bài viết
router.get('/', requireAdmin, newsController.index);

// Tạo bài viết mới
router.get('/new', requireAdmin, newsController.createPage);
router.post('/new', requireAdmin, upload.single('thumbnail'), newsController.create);

// Sửa bài viết
router.get('/:id/edit', requireAdmin, newsController.editPage);
router.post('/:id/edit', requireAdmin, upload.single('thumbnail'), newsController.edit);

// Xóa bài viết
router.delete('/:id', requireAdmin, newsController.delete);

// Bulk action
router.post('/bulk', requireAdmin, newsController.bulkAction);

// API lấy chi tiết
router.get('/:id', requireAdmin, newsController.getDetail);

module.exports = router;