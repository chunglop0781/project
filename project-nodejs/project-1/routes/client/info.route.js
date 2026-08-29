// =============================================================
// INFO ROUTES
// =============================================================

const router = require('express').Router();
const requireAuth = require('../../middlewares/requireAuth');
const infoController = require('../../controllers/client/info.controller');
const { moderateAndUpload } = require('../../middlewares/uploadWithModeration');

// Trang thông tin cá nhân
router.get('/', requireAuth, infoController.detail);

// ✅ Cập nhật thông tin (có avatar) – middleware moderateAndUpload đứng trước controller
router.post('/', requireAuth, moderateAndUpload('public/uploads/profiles', 'avatar'), infoController.update);

// Đổi mật khẩu
router.post('/password', requireAuth, infoController.updatePassword);

module.exports = router;