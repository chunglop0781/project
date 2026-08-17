const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const Order = require('../../models/order.model');
const User = require('../../models/user.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// =============================================================
// DANH SÁCH ĐƠN HÀNG
// =============================================================

router.get('/', requireAdmin, async (req, res) => {
    try {
        const activeStatus = req.query.status || 'all';
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = {};

        if (activeStatus !== 'all') {
            filter.status = activeStatus;
        }

        if (keyword) {
            const matchedUsers = await User.find({
                $or: [
                    { fullName: { $regex: keyword, $options: 'i' } },
                    { phone: { $regex: keyword, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = matchedUsers.map(function (u) { return u._id; });

            filter.$or = [
                { code: { $regex: keyword, $options: 'i' } },
                { user: { $in: userIds } }
            ];
        }

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalOrders / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const ordersRaw = await Order.find(filter)
            .populate('user')
            .populate('tour')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const orders = ordersRaw.map(function (order) {
            return {
                id: order._id,
                code: order.code,
                customerName: order.user ? order.user.fullName : 'N/A',
                phone: order.user ? order.user.phone : '',
                tourName: order.tour ? order.tour.name : 'N/A',
                totalPassengers: order.quantity,
                total: order.total,
                status: order.status,
                statusLabel: STATUS_LABELS[order.status] || order.status,
                createdAt: order.createdAt.toLocaleDateString('vi-VN')
            };
        });

        // Giữ lại status/keyword đang lọc khi bấm sang trang khác
        let baseUrl = '/admin/orders?';
        if (activeStatus && activeStatus !== 'all') baseUrl += 'status=' + activeStatus + '&';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/orders/order-list', {
            orders,
            currentPage,
            totalPages,
            activeStatus,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/orders/order-list', {
            orders: [],
            currentPage: 1,
            totalPages: 1,
            activeStatus: 'all',
            baseUrl: '/admin/orders?'
        });
    }
});

// =============================================================
// CHI TIẾT ĐƠN HÀNG
// =============================================================

router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const orderRaw = await Order.findById(req.params.id)
            .populate('user')
            .populate('tour');

        if (!orderRaw) {
            return res.redirect('/admin/orders');
        }

        const order = {
            id: orderRaw._id,
            code: orderRaw.code,
            status: orderRaw.status,
            statusLabel: STATUS_LABELS[orderRaw.status] || orderRaw.status,
            createdAt: orderRaw.createdAt.toLocaleString('vi-VN'),

            customer: {
                name: orderRaw.user ? orderRaw.user.fullName : 'N/A',
                phone: orderRaw.user ? orderRaw.user.phone : '',
                email: orderRaw.user ? orderRaw.user.email : '',
                address: orderRaw.user ? orderRaw.user.address : '',
                note: orderRaw.note || ''
            },

            tour: {
                name: orderRaw.tour ? orderRaw.tour.name : 'N/A',
                image: orderRaw.tour ? orderRaw.tour.image : '',
                code: orderRaw.tour ? orderRaw.tour.code : '',
                duration: orderRaw.tour ? orderRaw.tour.duration : '',
                vehicle: orderRaw.tour ? orderRaw.tour.vehicle : '',
                departureDate: (orderRaw.tour && orderRaw.tour.departureDate)
                    ? orderRaw.tour.departureDate.toLocaleDateString('vi-VN')
                    : ''
            },

            // Đơn hàng cũ tạo trước khi có field "passengers" sẽ không có
            // breakdown chi tiết -> fallback về 1 dòng duy nhất từ quantity/total
            passengers: (orderRaw.passengers && orderRaw.passengers.length)
                ? orderRaw.passengers
                : [{
                    label: 'Khách',
                    quantity: orderRaw.quantity,
                    price: orderRaw.quantity ? orderRaw.total / orderRaw.quantity : orderRaw.total
                }],

            totalPrice: orderRaw.total,
            paymentMethod: orderRaw.paymentMethod || 'cash'
        };

        res.render('admin/pages/orders/order-detail', { order });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/orders');
    }
});

// =============================================================
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// =============================================================

router.post('/:id/status', requireAdmin, async (req, res) => {
    try {
        const status = req.body.status;

        if (!VALID_STATUSES.includes(status)) {
            return res.redirect('/admin/orders/' + req.params.id);
        }

        await Order.findByIdAndUpdate(req.params.id, { status: status });

        res.redirect('/admin/orders/' + req.params.id);

    } catch (error) {
        console.log(error);
        res.redirect('/admin/orders/' + req.params.id);
    }
});

module.exports = router;
