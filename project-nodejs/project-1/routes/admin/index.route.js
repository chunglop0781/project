const router = require('express').Router();

const loginRoutes = require('./login.route');
const dashboardRoutes = require('./dashboard.route');
const toursRoutes = require('./tours.route');
const categoriesRoutes = require('./categories.route');
const ordersRoutes = require('./orders.route');
const customersRoutes = require('./customers.route');
const newsRoutes = require('./news.route');

// login/logout KHÔNG qua requireAdmin (không thì lặp redirect vô hạn)
router.use('/', loginRoutes);

router.use('/', dashboardRoutes);
router.use('/tours', toursRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/customers', customersRoutes);
router.use('/news', newsRoutes);

module.exports = router;
