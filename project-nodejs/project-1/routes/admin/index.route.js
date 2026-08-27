const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Import middleware
const requireAdmin = require('../../middlewares/requireAdmin');

// Import routes
const loginRoutes = require('./login.route');
const dashboardRoutes = require('./dashboard.route');
const toursRoutes = require('./tours.route');
const categoriesRoutes = require('./categories.route');
const ordersRoutes = require('./orders.route');
const customersRoutes = require('./customers.route');
const newsRoutes = require('./news.route');
const settingsRoutes = require('./settings.route');
const profileRoutes = require('./profile.route');

// =============================================================
// UPLOAD ẢNH CHO TINYMCE
// =============================================================

const uploadDir = path.join(__dirname, '../../public/uploads/tinymce');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        var uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

var upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function(req, file, cb) {
        var allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.indexOf(file.mimetype) !== -1) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)'));
        }
    }
});

// API upload ảnh cho TinyMCE
router.post('/admin/api/upload-image', upload.single('file'), function(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Không có file nào được upload'
            });
        }

        var fileUrl = '/uploads/tinymce/' + req.file.filename;
        res.json({
            location: fileUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Upload thất bại: ' + error.message
        });
    }
});

// =============================================================
// MIDDLEWARE CACHE
// =============================================================

router.use(function(req, res, next) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// =============================================================
// ROUTES
// =============================================================

// login/logout KHÔNG qua requireAdmin
router.use('/', loginRoutes);
router.use('/', dashboardRoutes);

// Các route cần admin
router.use('/tours', requireAdmin, toursRoutes);
router.use('/categories', requireAdmin, categoriesRoutes);
router.use('/orders', requireAdmin, ordersRoutes);
router.use('/customers', requireAdmin, customersRoutes);
router.use('/news', requireAdmin, newsRoutes);
router.use('/profile', requireAdmin, profileRoutes); // <-- CHỈ SỬA DÒNG NÀY
router.use('/', settingsRoutes);

module.exports = router;