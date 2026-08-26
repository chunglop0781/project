// =============================================================
// REQUIRE LOGIN MIDDLEWARE
// =============================================================

module.exports = (req, res, next) => {
    console.log('========================================');
    console.log('🔐 REQUIRE LOGIN');
    console.log('Path:', req.path);
    console.log('Session user:', req.session.user);
    console.log('========================================');

    // Kiểm tra session user
    if (!req.session || !req.session.user) {
        console.log('❌ NOT LOGGED IN - Redirect to /login');
        req.session.error = 'Vui lòng đăng nhập để tiếp tục.';
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }

    console.log('✅ LOGGED IN - Continue');
    next();
};