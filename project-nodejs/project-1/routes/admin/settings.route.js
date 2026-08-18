const router = require('express').Router();
const multer = require('multer'); // nếu project chưa cài: npm install multer
const path = require('path');
const requireAdmin = require('../../middlewares/requireAdmin');
const settingsController = require('../../controllers/admin/settings.controller');

// Dùng diskStorage thay vì chỉ khai báo "dest" để giữ lại đuôi file
// (chỉ dùng "dest" khiến multer đặt tên file không có extension,
// dẫn tới sai/ mất MIME type khi serve tĩnh, đặc biệt là favicon).
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

router.get('/settings', requireAdmin, settingsController.general);

router.get('/settings/website', requireAdmin, settingsController.website);

router.post(
    '/settings/website',
    requireAdmin,
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 }
    ]),
    settingsController.updateWebsite
);

module.exports = router;
