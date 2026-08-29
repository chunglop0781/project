const router = require('express').Router();
const requireAuth = require('../../middlewares/requireAuth');

// Import routes
const homeRoutes = require('./home.route');
const tourRoutes = require('./tour.route');
const cartRoutes = require('./cart.route');
const authRoutes = require('./auth.route');
const infoRoutes = require('./info.route');
const uploadRoute = require('./upload.route');

// =============================================================
// ROUTES
// =============================================================

router.use('/', homeRoutes);
router.use('/tours', tourRoutes);
router.use('/cart', cartRoutes);
router.use('/', authRoutes);
router.use('/info', requireAuth, infoRoutes);

// ✅ Route upload cần đăng nhập
router.use('/upload', requireAuth, uploadRoute);

module.exports = router;