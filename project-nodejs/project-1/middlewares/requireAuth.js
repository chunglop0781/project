// middlewares/requireAuth.js
// =============================================================
// REQUIRE AUTH MIDDLEWARE - Dùng cho Client
// =============================================================

module.exports = (req, res, next) => {
    console.log('========================================');
    console.log('🔐 REQUIRE AUTH (Client)');
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
        
        return res.redirect('/login');
    }

    console.log('✅ LOGGED IN - Continue');
    next();
};