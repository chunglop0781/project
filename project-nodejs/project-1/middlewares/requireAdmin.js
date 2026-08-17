// =============================================================
// MIDDLEWARE: chỉ cho phép admin đã đăng nhập truy cập
// Dựa theo user.model.js: role enum ['customer', 'admin']
// và index.js: session lưu ở req.session.user
// =============================================================

module.exports = function requireAdmin(req, res, next) {

    const user = req.session.user;

    if (!user || user.role !== 'admin') {
        // TODO: đổi path này nếu route đăng nhập admin của bạn khác
        return res.redirect('/admin/login');
    }

    next();

};
