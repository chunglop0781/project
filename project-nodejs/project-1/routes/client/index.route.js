const router = require('express').Router();

const homeRoutes = require('./home.route');
const tourRoutes = require('./tour.route');
const cartRoutes = require('./cart.route');
const authRoutes = require('./auth.route'); // ✅ ĐÃ CÓ CHANGE-PASSWORD TRONG NÀY

router.use('/', homeRoutes);
router.use('/tours', tourRoutes);
router.use('/cart', cartRoutes);
router.use('/', authRoutes); // ✅ SẼ NHẬN /change-password, /login, /register, ...

module.exports = router;