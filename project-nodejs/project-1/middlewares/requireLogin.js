// middlewares/requireLogin.js
// =============================================================
// REQUIRE LOGIN MIDDLEWARE
// =============================================================

module.exports = (req, res, next) => {
    console.log('========================================');
    console.log('🔐 REQUIRE LOGIN');
    console.log('Path:', req.path);
    console.log('Session user:', req.session.user ? '✅ Logged in' : '❌ Not logged in');
    console.log('========================================');

    // Kiểm tra session user
    if (!req.session || !req.session.user) {
        console.log('❌ NOT LOGGED IN - Redirect to /login');
        
        // Lưu thông báo lỗi
        req.session.error = 'Vui lòng đăng nhập để tiếp tục.';
        
        // Lưu URL để quay lại sau khi đăng nhập
        req.session.returnTo = req.originalUrl;
        
        // Kiểm tra nếu là admin thì redirect về /admin/login
        if (req.path.startsWith('/admin')) {
            return res.redirect('/admin/login');
        }
        
        // Client thì redirect về /login
        return res.redirect('/login');
    }

    console.log('✅ LOGGED IN - Continue');
    next();
};