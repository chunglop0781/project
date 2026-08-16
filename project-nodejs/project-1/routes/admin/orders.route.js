const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');

router.get('/', requireAdmin, (req, res) => {
    res.render('admin/pages/orders/order-list');
});

module.exports = router;