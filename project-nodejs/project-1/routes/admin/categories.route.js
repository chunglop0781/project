const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const categoryController = require('../../controllers/admin/category.controller');

// =============================================================
// CATEGORIES ROUTES
// =============================================================

// Danh sách danh mục
router.get('/', requireAdmin, categoryController.index);

// Tạo danh mục
router.get('/new', requireAdmin, categoryController.createPage);

// ✅ TẠO DANH MỤC - VỚI DEBUG VÀ UPLOAD
router.post('/new', 
    requireAdmin,
    // Debug trước khi upload
    function(req, res, next) {
        console.log('========================================');
        console.log('🔍 ROUTE DEBUG - BEFORE MULTER');
        console.log('  - Content-Type:', req.headers['content-type']);
        console.log('  - Content-Length:', req.headers['content-length']);
        console.log('========================================');
        next();
    },
    // Upload ảnh
    categoryController.upload.single('image'),
    // Debug sau khi upload
    function(req, res, next) {
        console.log('========================================');
        console.log('🔍 ROUTE DEBUG - AFTER MULTER');
        console.log('  - Body:', req.body);
        console.log('  - File:', req.file);
        console.log('========================================');
        next();
    },
    // Controller xử lý
    categoryController.create
);

// Sửa danh mục
router.get('/:id/edit', requireAdmin, categoryController.editPage);
router.post('/:id/edit', requireAdmin, categoryController.upload.single('image'), categoryController.edit);

// Xóa danh mục
router.delete('/:id', requireAdmin, categoryController.delete);

// Bulk action
router.post('/bulk', requireAdmin, categoryController.bulkAction);

// API
router.get('/:id', requireAdmin, categoryController.getDetail);
router.get('/api/all', requireAdmin, categoryController.getAll);

module.exports = router;