const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const User = require('../../models/user.model');
const Order = require('../../models/order.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

// =============================================================
// DANH SÁCH KHÁCH HÀNG
// =============================================================

router.get('/', requireAdmin, async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = { role: 'customer' };

        if (keyword) {
            filter.$or = [
                { fullName: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        const totalCustomers = await User.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalCustomers / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const usersRaw = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const userIds = usersRaw.map(function (u) { return u._id; });

        const orderStats = await Order.aggregate([
            { $match: { user: { $in: userIds }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$user',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' }
                }
            }
        ]);

        const statsMap = {};
        orderStats.forEach(function (item) {
            statsMap[item._id.toString()] = item;
        });

        const customers = usersRaw.map(function (user) {
            const stat = statsMap[user._id.toString()];
            return {
                id: user._id,
                name: user.fullName,
                phone: user.phone || '',
                email: user.email,
                totalOrders: stat ? stat.totalOrders : 0,
                totalSpent: stat ? stat.totalSpent : 0,
                joinedAt: user.createdAt.toLocaleDateString('vi-VN')
            };
        });

        let baseUrl = '/admin/customers?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/customers/customer-list', {
            customers,
            currentPage,
            totalPages,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/customers/customer-list', {
            customers: [],
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/customers?'
        });
    }
});

// =============================================================
// CHI TIẾT KHÁCH HÀNG
// =============================================================

router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.redirect('/admin/customers');
        }

        const ordersRaw = await Order.find({ user: user._id })
            .populate('tour')
            .sort({ createdAt: -1 });

        const orders = ordersRaw.map(function (order) {
            return {
                id: order._id,
                code: order.code,
                tourName: order.tour ? order.tour.name : 'N/A',
                total: order.total,
                status: order.status,
                statusLabel: STATUS_LABELS[order.status] || order.status,
                createdAt: order.createdAt.toLocaleDateString('vi-VN')
            };
        });

        const totalSpent = ordersRaw
            .filter(function (o) { return o.status !== 'cancelled'; })
            .reduce(function (sum, o) { return sum + o.total; }, 0);

        const customer = {
            id: user._id,
            name: user.fullName,
            phone: user.phone,
            email: user.email,
            address: user.address || '',
            joinedAt: user.createdAt.toLocaleDateString('vi-VN'),
            totalOrders: orders.length,
            totalSpent: totalSpent
        };

        res.render('admin/pages/customers/customer-detail', { customer, orders });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/customers');
    }
});

module.exports = router;
