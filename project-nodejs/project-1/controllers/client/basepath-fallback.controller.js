
// =============================================================
// BASE PATH FALLBACK CONTROLLER
// Tự sinh bởi fix-pug.js
// =============================================================

exports.login = (req, res) => {
    res.render('client/pages/login');
};

exports.register = (req, res) => {
    res.render('client/pages/register');
};

exports.forgotPassword = (req, res) => {
    res.render('client/pages/forgot-password');
};

exports.verifyOtp = (req, res) => {
    res.render('client/pages/verify-otp');
};

exports.verifyRegisterOtp = (req, res) => {
    res.render('client/pages/verify-register-otp');
};

exports.otpPassword = (req, res) => {
    res.render('client/pages/otp-password');
};

exports.changePassword = (req, res) => {
    res.render('client/pages/change-password');
};

exports.info = (req, res) => {
    res.render('client/pages/info');
};

exports.cart = (req, res) => {
    res.render('client/pages/cart');
};

exports.notFound = (req, res) => {
    res.status(404).render('errors/404', {
        title: '404 - Không tìm thấy trang',
        BASE_PATH: process.env.BASE_PATH || '/project-1'
    });
};
