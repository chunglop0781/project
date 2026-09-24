// =============================================================
// routes/admin/settings.router.js
// =============================================================

const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const requireAdmin = require('../../middlewares/requireAdmin');
const settingsController = require('../../controllers/admin/settings.controller');


// =============================================================
// CẤU HÌNH MULTER CHO UPLOAD LOGO / FAVICON
// =============================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        // prefix để phân biệt logo / favicon
        const prefix = file.fieldname === 'favicon' ? 'favicon' : 'logo';
        cb(null, `${prefix}-${timestamp}-${random}${ext}`);
    }
});

// Chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|ico/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
        return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp, svg, ico).'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});


// =============================================================
// MIDDLEWARE: ĐẢM BẢO SESSION CÓ USER ID
// =============================================================

const ensureUserId = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/admin/login');
    }

    if (!req.session.user._id && req.session.user.id) {
        req.session.user._id = req.session.user.id;
    }
    if (!req.session.user.id && req.session.user._id) {
        req.session.user.id = req.session.user._id;
    }

    next();
};


// =============================================================
// CÀI ĐẶT CHUNG
// =============================================================

router.get('/general', requireAdmin, settingsController.general);


// =============================================================
// TÀI KHOẢN QUẢN TRỊ
// =============================================================

// Danh sách tài khoản
router.get('/accounts', requireAdmin, settingsController.accounts);

// Trang tạo tài khoản
router.get('/accounts/create', requireAdmin, settingsController.accountsCreate);

// Xử lý tạo tài khoản
router.post(
    '/accounts/create',
    requireAdmin,
    ensureUserId,
    settingsController.accountsCreatePost
);

// Trang sửa tài khoản
router.get('/accounts/:id/edit', requireAdmin, settingsController.accountsEdit);

// Xử lý sửa tài khoản
router.post(
    '/accounts/:id/edit',
    requireAdmin,
    ensureUserId,
    settingsController.accountsEditPost
);

// Xóa tài khoản
router.delete(
    '/accounts/:id',
    requireAdmin,
    settingsController.accountsDelete
);


// =============================================================
// THÔNG TIN WEBSITE (LOGO + FAVICON)
// =============================================================

// Trang xem thông tin website
router.get('/websiteInfo', requireAdmin, settingsController.website);

// ✅ XỬ LÝ CẬP NHẬT WEBSITE (UPLOAD LOGO + FAVICON)
// Dùng upload.fields vì có 2 file với fieldname khác nhau
router.post(
    '/websiteInfo',
    requireAdmin,
    ensureUserId,
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 }
    ]),
    settingsController.updateWebsite
);


// =============================================================
// NHÓM QUYỀN
// =============================================================

// Danh sách nhóm quyền
router.get('/roles', requireAdmin, settingsController.roles);

// Trang tạo nhóm quyền
router.get('/roles/create', requireAdmin, settingsController.roleCreate);

// Xử lý tạo nhóm quyền
router.post(
    '/roles/create',
    requireAdmin,
    ensureUserId,
    settingsController.roleCreatePost
);

// Trang sửa nhóm quyền
router.get('/roles/:id/edit', requireAdmin, settingsController.roleEdit);

// Xử lý sửa nhóm quyền
router.post(
    '/roles/:id/edit',
    requireAdmin,
    ensureUserId,
    settingsController.roleEditPost
);


// =============================================================
// EXPORT
// =============================================================

module.exports = router;