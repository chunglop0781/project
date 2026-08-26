const router = require('express').Router();

// =============================================================
// MIDDLEWARE
// =============================================================

const requireLogin = require('../../middlewares/requireLogin');

// =============================================================
// CONTROLLERS
// =============================================================

const accountController = require('../../controllers/auth/account.controller');
const forgotPasswordController = require('../../controllers/auth/forgot-password.controller');

// =============================================================
// VALIDATION - IMPORT ĐÚNG CÁCH
// =============================================================

const {
    validate,
    loginSchema,
    registerSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    verifyOtpSchema
} = require('../../validates/account.validate');

// =============================================================
// LOGIN
// =============================================================

router.get('/login', accountController.loginPage);
router.post('/login', validate(loginSchema), accountController.login);

// =============================================================
// REGISTER
// =============================================================

router.get('/register', accountController.registerPage);
router.post('/register', validate(registerSchema), accountController.register);

// =============================================================
// FORGOT PASSWORD
// =============================================================

router.get('/forgot-password', forgotPasswordController.forgotPasswordPage);
router.post('/forgot-password', forgotPasswordController.forgotPassword);

// =============================================================
// VERIFY OTP
// =============================================================

router.get('/verify-otp', forgotPasswordController.verifyOtpPage);
router.post('/verify-otp', forgotPasswordController.verifyOtp);

// =============================================================
// OTP PASSWORD
// =============================================================

router.get('/otp-password', forgotPasswordController.otpPasswordPage);
router.post('/otp-password', forgotPasswordController.otpPassword);

// =============================================================
// RESEND OTP
// =============================================================

router.post('/resend-otp', forgotPasswordController.resendOtp);

// =============================================================
// CHANGE PASSWORD
// =============================================================

router.get('/change-password', requireLogin, accountController.changePasswordPage);
router.post('/change-password', requireLogin, validate(changePasswordSchema), accountController.changePassword);

// =============================================================
// LOGOUT
// =============================================================

router.get('/logout', accountController.logout);

// =============================================================
// EXPORT
// =============================================================

module.exports = router;