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
        const paymentMethod = req.query.paymentMethod || '';
        const paymentStatus = req.query.paymentStatus || '';
        const dateFrom = req.query.dateFrom || '';
        const dateTo = req.query.dateTo || '';
        const page = parseInt(req.query.page) || 1;

        // dùng để truy vấn Mongo (Order.find)
        const mongoFilter = {};

        if (activeStatus !== 'all') {
            mongoFilter.status = activeStatus;
        }

        if (paymentMethod) {
            mongoFilter.paymentMethod = paymentMethod;
        }

        // TODO: paymentStatus, dateFrom, dateTo chưa có field tương ứng
        // đầy đủ trong order.model.js -> tạm thời CHƯA lọc theo các field này,
        // chỉ giữ lại giá trị để hiển thị lại trên form (xem formFilter bên dưới).

        if (keyword) {
            const matchedUsers = await User.find({
                $or: [
                    { fullName: { $regex: keyword, $options: 'i' } },
                    { phone: { $regex: keyword, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = matchedUsers.map(function (u) { return u._id; });

            mongoFilter.$or = [
                { code: { $regex: keyword, $options: 'i' } },
                { user: { $in: userIds } }
            ];
        }

        // dùng để đổ ngược giá trị lên các ô input/select trên form (pug cần biến này)
        const formFilter = {
            status: activeStatus,
            keyword,
            paymentMethod,
            paymentStatus,
            dateFrom,
            dateTo
        };

        const totalOrders = await Order.countDocuments(mongoFilter);
        const totalPages = Math.max(Math.ceil(totalOrders / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const ordersRaw = await Order.find(mongoFilter)
            .populate('user')
            .populate('tour')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const PAYMENT_METHOD_LABELS = {
            cash: 'Tiền mặt',
            bank: 'Chuyển khoản'
        };

        const orders = ordersRaw.map(function (order) {
            return {
                id: order._id,
                code: order.code,
                customerName: order.user ? order.user.fullName : 'N/A',
                phone: order.user ? order.user.phone : '',
                note: order.note || '',
                tourName: order.tour ? order.tour.name : 'N/A',
                tourImage: order.tour ? order.tour.image : '',
                departureDate: (order.tour && order.tour.departureDate)
                    ? order.tour.departureDate.toLocaleDateString('vi-VN')
                    : '',
                // Đơn hàng cũ chưa có breakdown "passengers" -> fallback về 1 dòng từ quantity/total
                passengers: (order.passengers && order.passengers.length)
                    ? order.passengers
                    : [{
                        label: 'Khách',
                        quantity: order.quantity,
                        price: order.quantity ? order.total / order.quantity : order.total
                    }],
                totalPassengers: order.quantity,
                total: order.total,
                discount: order.discount || 0,
                discountCode: order.discountCode || '',
                paidAmount: order.paidAmount != null ? order.paidAmount : order.total,
                paymentMethod: order.paymentMethod || 'cash',
                paymentMethodLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] || 'Tiền mặt',
                // TODO: paymentStatus chưa có field trong order.model.js
                paymentStatusLabel: '—',
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
            filter: formFilter,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/orders/order-list', {
            orders: [],
            currentPage: 1,
            totalPages: 1,
            activeStatus: 'all',
            filter: {
                status: 'all',
                keyword: '',
                paymentMethod: '',
                paymentStatus: '',
                dateFrom: '',
                dateTo: ''
            },
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
// CHỈNH SỬA ĐƠN HÀNG
// =============================================================

router.get('/:id/edit', requireAdmin, async (req, res) => {
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
            createdAt: orderRaw.createdAt.toLocaleString('vi-VN'),

            customer: {
                name: orderRaw.user ? orderRaw.user.fullName : 'N/A',
                phone: orderRaw.user ? orderRaw.user.phone : '',
                note: orderRaw.note || ''
            },

            tour: {
                name: orderRaw.tour ? orderRaw.tour.name : 'N/A',
                image: orderRaw.tour ? orderRaw.tour.image : '',
                departureDate: (orderRaw.tour && orderRaw.tour.departureDate)
                    ? orderRaw.tour.departureDate.toLocaleDateString('vi-VN')
                    : ''
            },

            passengers: (orderRaw.passengers && orderRaw.passengers.length)
                ? orderRaw.passengers
                : [{
                    label: 'Khách',
                    quantity: orderRaw.quantity,
                    price: orderRaw.quantity ? orderRaw.total / orderRaw.quantity : orderRaw.total
                }],

            total: orderRaw.total,
            discount: orderRaw.discount || 0,
            discountCode: orderRaw.discountCode || '',
            paidAmount: orderRaw.paidAmount != null ? orderRaw.paidAmount : orderRaw.total,
            paymentMethod: orderRaw.paymentMethod || 'cash',
            // TODO: paymentStatus chưa có field trong order.model.js, tạm để rỗng
            paymentStatus: orderRaw.paymentStatus || ''
        };

        res.render('admin/pages/orders/order-edit', { order });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/orders');
    }
});

router.post('/:id/edit', requireAdmin, async (req, res) => {
    try {
        const status = req.body.status;
        const paymentMethod = req.body.paymentMethod;
        const note = req.body.note;
        const customerName = (req.body.customerName || '').trim();
        const customerPhone = (req.body.customerPhone || '').trim();

        const orderRaw = await Order.findById(req.params.id);

        if (!orderRaw) {
            return res.redirect('/admin/orders');
        }

        const update = {};

        if (VALID_STATUSES.includes(status)) {
            update.status = status;
        }

        if (paymentMethod === 'cash' || paymentMethod === 'bank') {
            update.paymentMethod = paymentMethod;
        }

        update.note = note || '';

        await Order.findByIdAndUpdate(req.params.id, update);

        // customerName / customerPhone thuộc về User (order.user), không phải Order
        // -> cập nhật riêng vào User. Lưu ý: User này có thể được dùng chung cho
        // các đơn hàng khác của cùng khách, nên sửa ở đây sẽ ảnh hưởng tới hồ sơ
        // khách hàng nói chung, không chỉ riêng đơn này.
        if (orderRaw.user && (customerName || customerPhone)) {
            const userUpdate = {};
            if (customerName) userUpdate.fullName = customerName;
            if (customerPhone) userUpdate.phone = customerPhone;

            await User.findByIdAndUpdate(orderRaw.user, userUpdate);
        }

        res.redirect('/admin/orders/' + req.params.id);

    } catch (error) {
        console.log(error);
        res.redirect('/admin/orders/' + req.params.id + '/edit');
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
