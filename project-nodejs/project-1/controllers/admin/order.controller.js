// controllers/admin/order.controller.js

const Order = require('../../models/order.model');
const User = require('../../models/user.model');
const Tour = require('../../models/tour.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

const PAYMENT_METHOD_LABELS = {
    cash: 'Tiền mặt',
    bank: 'Chuyển khoản'
};

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// =============================================================
// HELPER FUNCTIONS
// =============================================================

function parseVNDate(str, endOfDay) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const date = endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59, 999)
        : new Date(y, m - 1, d, 0, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
}

// =============================================================
// DANH SÁCH ĐƠN HÀNG
// =============================================================

exports.index = async (req, res) => {
    try {
        const activeStatus = req.query.status || 'all';
        const keyword = (req.query.keyword || '').trim();
        const paymentMethod = req.query.paymentMethod || '';
        const paymentStatus = req.query.paymentStatus || '';
        const dateFrom = req.query.dateFrom || '';
        const dateTo = req.query.dateTo || '';
        const page = parseInt(req.query.page) || 1;

        const mongoFilter = {};

        if (activeStatus !== 'all') {
            mongoFilter.status = activeStatus;
        }

        if (paymentMethod) {
            mongoFilter.paymentMethod = paymentMethod;
        }

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

        // Lọc theo ngày
        const fromDateObj = parseVNDate(dateFrom, false);
        const toDateObj = parseVNDate(dateTo, true);
        if (fromDateObj || toDateObj) {
            mongoFilter.createdAt = {};
            if (fromDateObj) mongoFilter.createdAt.$gte = fromDateObj;
            if (toDateObj) mongoFilter.createdAt.$lte = toDateObj;
        }

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
                paymentStatus: order.paymentStatus || 'pending',
                paymentStatusLabel: order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán',
                status: order.status,
                statusLabel: STATUS_LABELS[order.status] || order.status,
                createdAt: order.createdAt.toLocaleDateString('vi-VN')
            };
        });

        let baseUrl = '/admin/orders?';
        if (activeStatus && activeStatus !== 'all') baseUrl += 'status=' + activeStatus + '&';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';
        if (paymentMethod) baseUrl += 'paymentMethod=' + paymentMethod + '&';
        if (paymentStatus) baseUrl += 'paymentStatus=' + paymentStatus + '&';
        if (dateFrom) baseUrl += 'dateFrom=' + encodeURIComponent(dateFrom) + '&';
        if (dateTo) baseUrl += 'dateTo=' + encodeURIComponent(dateTo) + '&';

        res.render('admin/pages/orders/order-list', {
            activeMenu: 'orders',
            orders,
            currentPage,
            totalPages,
            activeStatus,
            filter: formFilter,
            baseUrl
        });

    } catch (error) {
        console.error('❌ ORDER INDEX ERROR:', error);
        res.render('admin/pages/orders/order-list', {
            activeMenu: 'orders',
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
};

// =============================================================
// CHI TIẾT ĐƠN HÀNG
// =============================================================

exports.detail = async (req, res) => {
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

            passengers: (orderRaw.passengers && orderRaw.passengers.length)
                ? orderRaw.passengers
                : [{
                    label: 'Khách',
                    quantity: orderRaw.quantity,
                    price: orderRaw.quantity ? orderRaw.total / orderRaw.quantity : orderRaw.total
                }],

            totalPrice: orderRaw.total,
            paymentMethod: orderRaw.paymentMethod || 'cash',
            paymentMethodLabel: PAYMENT_METHOD_LABELS[orderRaw.paymentMethod] || 'Tiền mặt',
            discount: orderRaw.discount || 0,
            discountCode: orderRaw.discountCode || '',
            paidAmount: orderRaw.paidAmount != null ? orderRaw.paidAmount : orderRaw.total
        };

        res.render('admin/pages/orders/order-detail', {
            activeMenu: 'orders',
            order
        });

    } catch (error) {
        console.error('❌ ORDER DETAIL ERROR:', error);
        res.redirect('/admin/orders');
    }
};

// =============================================================
// TRANG SỬA ĐƠN HÀNG
// =============================================================

exports.editPage = async (req, res) => {
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
            paymentStatus: orderRaw.paymentStatus || 'pending'
        };

        res.render('admin/pages/orders/order-edit', {
            activeMenu: 'orders',
            order
        });

    } catch (error) {
        console.error('❌ ORDER EDIT PAGE ERROR:', error);
        res.redirect('/admin/orders');
    }
};

// =============================================================
// CẬP NHẬT ĐƠN HÀNG
// =============================================================

exports.edit = async (req, res) => {
    try {
        const status = req.body.status;
        const paymentMethod = req.body.paymentMethod;
        const paymentStatus = req.body.paymentStatus;
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

        if (paymentStatus === 'paid' || paymentStatus === 'pending') {
            update.paymentStatus = paymentStatus;
        }

        update.note = note || '';

        await Order.findByIdAndUpdate(req.params.id, update);

        // Cập nhật thông tin khách hàng
        if (orderRaw.user && (customerName || customerPhone)) {
            const userUpdate = {};
            if (customerName) userUpdate.fullName = customerName;
            if (customerPhone) userUpdate.phone = customerPhone;

            await User.findByIdAndUpdate(orderRaw.user, userUpdate);
        }

        req.session.success = 'Cập nhật đơn hàng thành công!';
        res.redirect('/admin/orders/' + req.params.id);

    } catch (error) {
        console.error('❌ ORDER UPDATE ERROR:', error);
        res.redirect('/admin/orders/' + req.params.id + '/edit');
    }
};

// =============================================================
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// =============================================================

exports.updateStatus = async (req, res) => {
    try {
        const status = req.body.status;

        if (!VALID_STATUSES.includes(status)) {
            return res.redirect('/admin/orders/' + req.params.id);
        }

        await Order.findByIdAndUpdate(req.params.id, { status: status });

        req.session.success = 'Cập nhật trạng thái thành công!';
        res.redirect('/admin/orders/' + req.params.id);

    } catch (error) {
        console.error('❌ ORDER STATUS UPDATE ERROR:', error);
        res.redirect('/admin/orders/' + req.params.id);
    }
};

// =============================================================
// XÓA ĐƠN HÀNG
// =============================================================

exports.delete = async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ ORDER DELETE ERROR:', error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// API LẤY CHI TIẾT ĐƠN HÀNG
// =============================================================

exports.getDetail = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user')
            .populate('tour');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        res.json({
            success: true,
            data: {
                id: order._id,
                code: order.code,
                status: order.status,
                total: order.total,
                customer: order.user ? order.user.fullName : 'N/A',
                tour: order.tour ? order.tour.name : 'N/A',
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        console.error('❌ GET ORDER ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra'
        });
    }
};