// routes/admin/settings.route.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const requireAdmin = require('../../middlewares/requireAdmin');
const settingsController = require('../../controllers/admin/settings.controller');


// =============================================================
// DEBUG MIDDLEWARE
// =============================================================
router.use((req, res, next) => {
    console.log('===== SETTINGS ROUTER =====');
    console.log('  Method:', req.method);
    console.log('  URL   :', req.originalUrl);
    console.log('  Path  :', req.path);
    console.log('===========================');
    next();
});


// =============================================================
// MULTER
// =============================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const prefix = file.fieldname === 'favicon' ? 'favicon' : 'logo';
        cb(null, `${prefix}-${timestamp}-${random}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|ico/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file ảnh.'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});


// =============================================================
// ROUTE GỐC: /admin/settings
// =============================================================
router.get('/', (req, res) => {
    res.redirect('/admin/settings/websiteInfo');
});


// =============================================================
// CÀI ĐẶT CHUNG
// =============================================================
router.get('/general', settingsController.general);


// =============================================================
// TÀI KHOẢN
// =============================================================
router.get('/accounts', settingsController.accounts);
router.get('/accounts/create', settingsController.accountsCreate);
router.post('/accounts/create', settingsController.accountsCreatePost);
router.get('/accounts/:id/edit', settingsController.accountsEdit);
router.post('/accounts/:id/edit', settingsController.accountsEditPost);
router.delete('/accounts/:id', settingsController.accountsDelete);


// =============================================================
// THÔNG TIN WEBSITE (LOGO + FAVICON)
// =============================================================
router.get('/websiteInfo', settingsController.website);

router.post(
    '/websiteInfo',
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 }
    ]),
    settingsController.updateWebsite
);


// =============================================================
// NHÓM QUYỀN
// =============================================================
router.get('/roles', settingsController.roles);
router.get('/roles/create', settingsController.roleCreate);
router.post('/roles/create', settingsController.roleCreatePost);
router.get('/roles/:id/edit', settingsController.roleEdit);
router.post('/roles/:id/edit', settingsController.roleEditPost);


module.exports = router;