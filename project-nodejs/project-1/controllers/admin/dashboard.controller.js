const Order = require('../../models/order.model');
const Tour = require('../../models/tour.model');
const User = require('../../models/user.model');

// =============================================================
// TÍNH DOANH THU 12 THÁNG GẦN NHẤT (dùng cho biểu đồ)
//
// GIẢ ĐỊNH schema Order có các field:
//   - total     : Number  (tổng tiền đơn hàng)
//   - createdAt : Date    (tự có sẵn nếu schema dùng { timestamps: true })
//   - status    : String  (vd: "pending", "paid", "cancelled"...)
//
// Nếu tên field trong order.model.js của bạn khác, chỉ cần đổi
// tên field tương ứng trong đoạn aggregate bên dưới.
// =============================================================

async function getRevenueChartData() {

    const now = new Date();

    // Lấy mốc đầu tháng, cách đây 11 tháng (tổng cộng 12 tháng gần nhất)
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const result = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $ne: 'cancelled' } // không tính đơn đã huỷ vào doanh thu
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                totalRevenue: { $sum: '$total' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);

    // Chuyển kết quả aggregate thành map { "2026-1": 12000000, ... }
    // để tra cứu nhanh khi build đủ 12 tháng liên tiếp (kể cả tháng không có đơn nào)
    const revenueMap = {};
    result.forEach(function (item) {
        const key = item._id.year + '-' + item._id.month;
        revenueMap[key] = item.totalRevenue;
    });

    const labels = [];
    const data = [];

    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.getFullYear() + '-' + (d.getMonth() + 1);

        labels.push('T' + (d.getMonth() + 1));
        data.push(revenueMap[key] || 0);
    }

    return { labels, data };
}


// =============================================================
// TRANG DASHBOARD
// =============================================================

exports.dashboard = async (req, res) => {
    try {

        const [
            totalOrders,
            totalCustomers,
            totalTours,
            revenueAgg,
            recentOrdersRaw,
            topToursRaw,
            revenueChart
        ] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments({ role: 'customer' }),
            Tour.countDocuments({ isDeleted: false }),
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('user').populate('tour'),
            Tour.find({ isDeleted: false }).sort({ bookedCount: -1 }).limit(5),
            getRevenueChartData()
        ]);

        const stats = {
            totalOrders,
            totalRevenue: (revenueAgg[0] && revenueAgg[0].total) || 0,
            totalCustomers,
            totalTours
        };

        // TODO: map recentOrdersRaw về đúng field mà dashboard.pug đang cần
        // (code, customerName, tourName, total, status, statusLabel)
        const recentOrders = recentOrdersRaw.map(function (order) {
            return {
                id: order._id,
                code: order.code,
                customerName: order.user ? order.user.fullName : 'N/A',
                tourName: order.tour ? order.tour.name : 'N/A',
                total: order.total,
                status: order.status,
                statusLabel: order.status // TODO: đổi thành nhãn tiếng Việt nếu cần
            };
        });

        const topTours = topToursRaw.map(function (tour) {
            return {
                name: tour.name,
                image: tour.image,
                bookedCount: tour.bookedCount || 0,
                price: tour.price
            };
        });

        res.render('admin/pages/tours/dashboard', {
            layout: 'admin/layouts/admin-layout',
            stats,
            recentOrders,
            topTours,
            revenueChart
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/tours/dashboard', {
            layout: 'admin/layouts/admin-layout',
            stats: {},
            recentOrders: [],
            topTours: [],
            revenueChart: { labels: [], data: [] }
        });
    }
};
