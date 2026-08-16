const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const Tour = require('../../models/tour.model');

router.get('/', requireAdmin, async (req, res) => {
    try {
        const tours = await Tour.find();
        res.render('admin/pages/tours/tour-list', { tours });
    } catch (error) {
        console.log(error);
        res.render('admin/pages/tours/tour-list', { tours: [] });
    }
});

module.exports = router;