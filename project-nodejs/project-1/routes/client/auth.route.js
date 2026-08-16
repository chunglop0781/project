const router = require('express').Router();

// Trang đăng nhập
router.get('/login', (req, res) => {
    res.render('client/pages/login', {
        layout: 'layouts/default'
    });
});

// Trang đăng ký
router.get('/register', (req, res) => {
    res.render('client/pages/register', {
        layout: 'layouts/default'
    });
});

// Xử lý submit form đăng nhập (form action="/login" method="POST")
router.post('/login', (req, res) => {
    // TODO: kiểm tra email/mật khẩu với MongoDB
    res.redirect('/');
});

// Xử lý submit form đăng ký (form action="/register" method="POST")
router.post('/register', (req, res) => {
    // TODO: tạo user mới trong MongoDB
    res.redirect('/login');
});

module.exports = router;