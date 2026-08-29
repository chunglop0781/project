// middlewares/requireAdmin.js
// =============================================================
// REQUIRE ADMIN MIDDLEWARE
// =============================================================

module.exports = (req, res, next) => {
    console.log('========================================');
    console.log('🔐 REQUIRE ADMIN');
    console.log('Path:', req.path);
    console.log('Session user:', req.session.user ? '✅ Logged in' : '❌ Not logged in');
    console.log('User role:', req.session.user?.role || 'No role');
    console.log('========================================');

    // Kiểm tra đã đăng nhập chưa
    if (!req.session || !req.session.user) {
        console.log('❌ NOT LOGGED IN - Redirect to /admin/login');
        req.session.error = 'Vui lòng đăng nhập để tiếp tục.';
        req.session.returnTo = req.originalUrl;
        return res.redirect('/admin/login');
    }

    // Kiểm tra quyền admin
    if (req.session.user.role !== 'admin') {
        console.log('❌ NOT ADMIN - Redirect to /');
        req.session.error = 'Bạn không có quyền truy cập trang này.';
        return res.redirect('/');
    }

    console.log('✅ ADMIN - Continue');
    next();
};