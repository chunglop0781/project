
// =============================================================
// BASE PATH FALLBACK ROUTES
// Tự sinh bởi fix-pug.js
// =============================================================

const router = require('express').Router();
const controller = require('../../controllers/client/basepath-fallback.controller');

router.get('/login', controller.login);
router.get('/register', controller.register);
router.get('/forgot-password', controller.forgotPassword);
router.get('/verify-otp', controller.verifyOtp);
router.get('/verify-register-otp', controller.verifyRegisterOtp);
router.get('/otp-password', controller.otpPassword);
router.get('/change-password', controller.changePassword);
router.get('/info', controller.info);
router.get('/cart', controller.cart);

module.exports = router;
