module.exports = function requireLogin(req, res, next) {

    // Lấy JWT token từ cookie
    const token = req.cookies.token;

    // In token ra Terminal
    console.log('=================================');
    console.log('🔑 JWT TOKEN:');
    console.log(token);
    console.log('=================================');


    // Kiểm tra đã đăng nhập chưa
    if (!req.session.user) {
        return res.redirect('/login');
    }

    next();
};