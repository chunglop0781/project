const router = require('express').Router();

const dashboardRoutes = require('./dashboard.route');
const toursRoutes = require('./tours.route');
const ordersRoutes = require('./orders.route');
const customersRoutes = require('./customers.route');
const newsRoutes = require('./news.route');

router.use('/', dashboardRoutes);
router.use('/tours', toursRoutes);
router.use('/orders', ordersRoutes);
router.use('/customers', customersRoutes);
router.use('/news', newsRoutes);

module.exports = router;