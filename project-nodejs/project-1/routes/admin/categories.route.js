const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const categoryController = require('../../controllers/admin/category.controller');

// =============================================================
// ✅ MIDDLEWARE: ĐẢM BẢO SESSION CÓ USER ID
// =============================================================
const ensureUserId = (req, res, next) => {
    if (!req.session.user) {
        console.error('❌ No user in session!');
        return res.redirect('/admin/login');
    }
    
    // Đảm bảo có _id
    if (!req.session.user._id && req.session.user.id) {
        req.session.user._id = req.session.user.id;
    }
    if (!req.session.user.id && req.session.user._id) {
        req.session.user.id = req.session.user._id;
    }
    
    console.log('✅ ensureUserId - User ID:', req.session.user._id);
    next();
};

// =============================================================
// ✅ MIDDLEWARE DEBUG - VIẾT ĐÚNG CÚ PHÁP
// =============================================================
const debugBeforeMulter = (req, res, next) => {
    console.log('========================================');
    console.log('🔍 ROUTE DEBUG - BEFORE MULTER');
    console.log('  - Content-Type:', req.headers['content-type']);
    console.log('  - Content-Length:', req.headers['content-length']);
    console.log('  - Session user ID:', req.session.user?._id);
    console.log('========================================');
    next();
};

const debugAfterMulter = (req, res, next) => {
    console.log('========================================');
    console.log('🔍 ROUTE DEBUG - AFTER MULTER');
    console.log('  - Body:', req.body);
    console.log('  - File:', req.file);
    console.log('  - Session user ID:', req.session.user?._id);
    console.log('========================================');
    next();
};

// =============================================================
// CATEGORIES ROUTES
// =============================================================

// Danh sách danh mục (chỉ hiển thị chưa xóa)
router.get('/', requireAdmin, categoryController.index);

// ✅ THÙNG RÁC DANH MỤC
router.get('/trash', requireAdmin, categoryController.trash);

// Tạo danh mục
router.get('/new', requireAdmin, categoryController.createPage);

// ✅ TẠO DANH MỤC
router.post('/new', 
    requireAdmin,
    ensureUserId,
    debugBeforeMulter,
    categoryController.upload.single('image'),
    debugAfterMulter,
    categoryController.create
);

// Sửa danh mục
router.get('/:id/edit', requireAdmin, categoryController.editPage);

// ✅ SỬA DANH MỤC
router.post('/:id/edit', 
    requireAdmin,
    ensureUserId,
    debugBeforeMulter,
    categoryController.upload.single('image'),
    debugAfterMulter,
    categoryController.edit
);

// ✅ XÓA MỀM (Chuyển vào thùng rác)
router.delete('/:id', requireAdmin, categoryController.delete);

// ✅ KHÔI PHỤC TỪ THÙNG RÁC
router.post('/:id/restore', requireAdmin, categoryController.restore);

// ✅ XÓA VĨNH VIỄN
router.delete('/:id/force', requireAdmin, categoryController.forceDelete);

// Bulk action cho danh sách chính
router.post('/bulk', requireAdmin, categoryController.bulkAction);

// ✅ Bulk action cho thùng rác
router.post('/trash/bulk', requireAdmin, categoryController.bulkTrashAction);

// API
router.get('/:id', requireAdmin, categoryController.getDetail);
router.get('/api/all', requireAdmin, categoryController.getAll);

module.exports = router;