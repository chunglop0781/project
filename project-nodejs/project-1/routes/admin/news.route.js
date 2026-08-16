const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');

router.get('/', requireAdmin, (req, res) => {
    res.render('admin/pages/news/news-list');
});

module.exports = router;