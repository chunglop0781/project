const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');

router.get('/', requireAdmin, (req, res) => {
    res.render('admin/pages/customers/customer-list');
});

module.exports = router;