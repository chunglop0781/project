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

const USER_STATUS_LABELS = {
    active: 'Hoạt động',
    inactive: 'Tạm dừng'
};

// Chuyển "dd/mm/yyyy" -> Date, trả về null nếu không hợp lệ
function parseVNDate(str) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
}

// =============================================================
// DANH SÁCH KHÁCH HÀNG
// =============================================================

router.get('/', requireAdmin, async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const status = (req.query.status || '').trim();
        const fromDate = (req.query.fromDate || '').trim();
        const toDate = (req.query.toDate || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = { role: 'customer' };

        if (keyword) {
            filter.$or = [
                { fullName: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (status === 'active' || status === 'inactive') {
            filter.status = status;
        }

        const from = parseVNDate(fromDate);
        const to = parseVNDate(toDate);

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = from;
            if (to) {
                const toEnd = new Date(to);
                toEnd.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toEnd;
            }
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
                address: user.address || '',
                avatar: user.avatar || '',
                status: user.status || 'active',
                statusLabel: USER_STATUS_LABELS[user.status] || USER_STATUS_LABELS.active,
                totalOrders: stat ? stat.totalOrders : 0,
                totalSpent: stat ? stat.totalSpent : 0,
                joinedAt: user.createdAt.toLocaleDateString('vi-VN')
            };
        });

        let baseUrl = '/admin/customers?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';
        if (status) baseUrl += 'status=' + encodeURIComponent(status) + '&';
        if (fromDate) baseUrl += 'fromDate=' + encodeURIComponent(fromDate) + '&';
        if (toDate) baseUrl += 'toDate=' + encodeURIComponent(toDate) + '&';

        res.render('admin/pages/customers/customer-list', {
            activeMenu: 'customers',
            customers,
            currentPage,
            totalPages,
            baseUrl,
            keyword,
            status,
            fromDate,
            toDate
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/customers/customer-list', {
            activeMenu: 'customers',
            customers: [],
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/customers?',
            keyword: '',
            status: '',
            fromDate: '',
            toDate: ''
        });
    }
});

// =============================================================
// HÀNH ĐỘNG HÀNG LOẠT (chọn nhiều dòng -> Áp dụng)
// =============================================================

router.post('/bulk-action', requireAdmin, async (req, res) => {
    try {
        const action = req.body.action;
        let ids = req.body.ids || [];
        if (!Array.isArray(ids)) ids = [ids];

        if (ids.length) {
            if (action === 'activate') {
                await User.updateMany({ _id: { $in: ids } }, { status: 'active' });
            } else if (action === 'deactivate') {
                await User.updateMany({ _id: { $in: ids } }, { status: 'inactive' });
            } else if (action === 'delete') {
                await User.deleteMany({ _id: { $in: ids }, role: 'customer' });
            }
        }
    } catch (error) {
        console.log(error);
    }
    res.redirect('back');
});

// =============================================================
// XÓA MỘT KHÁCH HÀNG
// =============================================================

router.post('/:id/delete', requireAdmin, async (req, res) => {
    try {
        await User.findOneAndDelete({ _id: req.params.id, role: 'customer' });
    } catch (error) {
        console.log(error);
    }
    res.redirect('back');
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
            avatar: user.avatar || '',
            status: user.status || 'active',
            statusLabel: USER_STATUS_LABELS[user.status] || USER_STATUS_LABELS.active,
            joinedAt: user.createdAt.toLocaleDateString('vi-VN'),
            totalOrders: orders.length,
            totalSpent: totalSpent
        };

        res.render('admin/pages/customers/customer-detail', { activeMenu: 'customers', customer, orders });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/customers');
    }
});

module.exports = router;
