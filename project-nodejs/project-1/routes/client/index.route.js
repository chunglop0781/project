const router = require('express').Router();
const requireAuth = require('../../middlewares/requireAuth');

const homeRoutes = require('./home.route');
const tourRoutes = require('./tour.route');
const cartRoutes = require('./cart.route');
const authRoutes = require('./auth.route');
const infoRoutes = require('./info.route'); // <-- THÊM DÒNG NÀY

router.use('/', homeRoutes);
router.use('/tours', tourRoutes);
router.use('/cart', cartRoutes);
router.use('/', authRoutes);
router.use('/info', requireAuth, infoRoutes); // <-- THÊM DÒNG NÀY

module.exports = router;