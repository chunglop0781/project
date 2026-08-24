
const router = require('express').Router();

const requireLogin = require('../../middlewares/requireLogin');

const accountController = require('../../controllers/auth/account.controller');

const changePassword = require('../../controllers/auth/change-password.controller');

const {validate, loginSchema, registerSchema} = require('../../validates/account.validate');


// =============================================================
// ĐĂNG NHẬP
// =============================================================

router.get(
    '/login',
    accountController.loginPage
);

router.post(
    '/login',
    validate(loginSchema),
    accountController.login
);


// =============================================================
// ĐĂNG KÝ
// =============================================================

router.get(
    '/register',
    accountController.registerPage
);

router.post(
    '/register',

    (req, res, next) => {
        console.log('🔥🔥🔥 AUTH ROUTE REGISTER ĐÃ CHẠY');
        next();
    },

    validate(registerSchema),
    accountController.register
);


// =============================================================
// XÁC MINH OTP ĐĂNG KÝ
// =============================================================

router.get(
    '/verify-register-otp',
    accountController.verifyRegisterOtpPage
);

router.post(
    '/verify-register-otp',
    accountController.verifyRegisterOtp
);


// =============================================================
// QUÊN MẬT KHẨU
// =============================================================

router.get(
    '/forgot-password',
    accountController.forgotPasswordPage
);

router.post(
    '/forgot-password',
    accountController.forgotPassword
);


// =============================================================
// XÁC MINH OTP
// =============================================================

router.get(
    '/verify-otp',
    accountController.verifyOtpPage
);

router.post(
    '/verify-otp',
    accountController.verifyOtp
);


// =============================================================
// ĐẶT MẬT KHẨU MỚI SAU OTP
// =============================================================

router.get(
    '/otp-password',
    accountController.otpPasswordPage
);

router.post(
    '/otp-password',
    accountController.otpPassword
);


// =============================================================
// ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP
// =============================================================

router.get(
    '/change-password',
    requireLogin,
    accountController.changePasswordPage
);

router.post(
    '/change-password',
    requireLogin,
    async (req, res) => {
        return await changePassword(req, res, {
            clientView: 'client/pages/change-password',
            adminView: 'admin/pages/profile'
        });
    }
);


// =============================================================
// ĐĂNG XUẤT
// =============================================================

router.get(
    '/logout',
    accountController.logout
);


module.exports = router;

