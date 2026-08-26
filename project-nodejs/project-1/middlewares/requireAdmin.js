// =============================================================
// MIDDLEWARE: chỉ cho phép admin đã đăng nhập truy cập
// Dựa theo user.model.js: role enum ['customer', 'admin']
// và index.js: session lưu ở req.session.user
// =============================================================

module.exports = function requireAdmin(req, res, next) {

    console.log(
        '========================================'
    );

    console.log(
        '🔥 REQUIRE ADMIN'
    );

    console.log(
        'URL:',
        req.originalUrl
    );

    console.log(
        'SESSION ID:',
        req.sessionID
    );

    console.log(
        'SESSION USER:',
        req.session.user
    );

    console.log(
        'ROLE:',
        req.session.user?.role
    );

    console.log(
        '========================================'
    );


    const user =
        req.session.user;


    if (
        !user ||
        user.role !== 'admin'
    ) {

        console.log(
            '❌ ADMIN AUTH FAILED'
        );

        // TODO: đổi path này nếu route đăng nhập admin của bạn khác
        return res.redirect(
            '/admin/login'
        );
    }


    console.log(
        '✅ ADMIN AUTH SUCCESS'
    );


    next();

};