const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');

router.get('/dashboard', requireAdmin, (req, res) => {
    res.render('admin/pages/tours/dashboard', {
        layout: 'admin/layouts/admin-layout'
    });
});

module.exports = router;