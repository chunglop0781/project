const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const dashboardController = require('../../controllers/admin/dashboard.controller');
const Order = require('../../models/order.model');

router.get('/dashboard', requireAdmin, dashboardController.dashboard);

// =============================================================
// API BIỂU ĐỒ DOANH THU (dùng cho select#revenueChartRange trong dashboard.pug)
//
//   GET /admin/api/dashboard/revenue-chart?range=today
//   GET /admin/api/dashboard/revenue-chart?range=week
//   GET /admin/api/dashboard/revenue-chart?range=month
//   GET /admin/api/dashboard/revenue-chart?range=year
//   GET /admin/api/dashboard/revenue-chart?range=pickMonth&month=2026-08
//   GET /admin/api/dashboard/revenue-chart?range=pickWeek&week=2026-W33
//
// Trả về: { labels: [...], data: [...] }
// =============================================================

function pad(n) {
    return n < 10 ? '0' + n : '' + n;
}

function formatDateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// Dãy nhãn theo GIỜ trong 1 ngày (dùng cho range=today)
function generateHourSeries(dayDate) {
    const dateKey = formatDateKey(dayDate);
    const series = [];
    for (let h = 0; h < 24; h++) {
        series.push({
            key: dateKey + ' ' + pad(h),
            label: pad(h) + ':00'
        });
    }
    return series;
}

// Dãy nhãn theo NGÀY, bắt đầu từ startDate, liên tiếp "days" ngày
function generateDaySeries(startDate, days) {
    const series = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        series.push({
            key: formatDateKey(d),
            label: pad(d.getDate()) + '/' + pad(d.getMonth() + 1)
        });
    }
    return series;
}

// Dãy nhãn theo THÁNG, bắt đầu từ startDate, liên tiếp "months" tháng
function generateMonthSeries(startDate, months) {
    const series = [];
    for (let i = 0; i < months; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        series.push({
            key: d.getFullYear() + '-' + pad(d.getMonth() + 1),
            label: 'T' + (d.getMonth() + 1) + '/' + d.getFullYear()
        });
    }
    return series;
}

// Tính ngày Thứ Hai của 1 tuần ISO, ví dụ getDateOfISOWeek(33, 2026)
// Lưu ý: cách tính chuẩn ISO-8601, có thể lệch 1 tuần với vài trường hợp
// biên năm mới (31/12 - 01/01) tùy cách trình duyệt sinh input type="week".
function getDateOfISOWeek(week, year) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = new Date(simple);
    if (dayOfWeek <= 4) {
        isoWeekStart.setDate(simple.getDate() - dayOfWeek + 1);
    } else {
        isoWeekStart.setDate(simple.getDate() + 8 - dayOfWeek);
    }
    isoWeekStart.setHours(0, 0, 0, 0);
    return isoWeekStart;
}

router.get('/api/dashboard/revenue-chart', requireAdmin, async (req, res) => {
    try {
        const range = req.query.range || 'year';
        const now = new Date();

        let matchStart;
        let matchEnd;
        let series;
        let groupUnit; // 'hour' | 'day' | 'month'

        if (range === 'today') {
            matchStart = new Date(now);
            matchStart.setHours(0, 0, 0, 0);
            matchEnd = new Date(now);
            matchEnd.setHours(23, 59, 59, 999);

            series = generateHourSeries(matchStart);
            groupUnit = 'hour';

        } else if (range === 'week') {
            matchEnd = new Date(now);
            matchEnd.setHours(23, 59, 59, 999);
            matchStart = new Date(now);
            matchStart.setDate(matchStart.getDate() - 6);
            matchStart.setHours(0, 0, 0, 0);

            series = generateDaySeries(matchStart, 7);
            groupUnit = 'day';

        } else if (range === 'month') {
            matchEnd = new Date(now);
            matchEnd.setHours(23, 59, 59, 999);
            matchStart = new Date(now);
            matchStart.setDate(matchStart.getDate() - 29);
            matchStart.setHours(0, 0, 0, 0);

            series = generateDaySeries(matchStart, 30);
            groupUnit = 'day';

        } else if (range === 'pickMonth') {
            const monthValue = req.query.month; // 'YYYY-MM'
            if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) {
                return res.status(400).json({ labels: [], data: [], error: 'Thiếu hoặc sai định dạng tham số month (YYYY-MM)' });
            }
            const parts = monthValue.split('-').map(Number);
            const y = parts[0];
            const m = parts[1];

            matchStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
            matchEnd = new Date(y, m, 0, 23, 59, 59, 999); // ngày cuối cùng của tháng
            const daysInMonth = matchEnd.getDate();

            series = generateDaySeries(matchStart, daysInMonth);
            groupUnit = 'day';

        } else if (range === 'pickWeek') {
            const weekValue = req.query.week; // 'YYYY-Www'
            if (!weekValue || !/^\d{4}-W\d{2}$/.test(weekValue)) {
                return res.status(400).json({ labels: [], data: [], error: 'Thiếu hoặc sai định dạng tham số week (YYYY-Www)' });
            }
            const weekParts = weekValue.split('-W');
            const yearPart = parseInt(weekParts[0], 10);
            const weekPart = parseInt(weekParts[1], 10);

            const weekStart = getDateOfISOWeek(weekPart, yearPart);
            matchStart = new Date(weekStart);
            matchEnd = new Date(weekStart);
            matchEnd.setDate(matchEnd.getDate() + 6);
            matchEnd.setHours(23, 59, 59, 999);

            series = generateDaySeries(matchStart, 7);
            groupUnit = 'day';

        } else {
            // range === 'year' (mặc định) - 12 tháng gần nhất, tính cả tháng hiện tại
            matchEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            matchStart = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

            series = generateMonthSeries(matchStart, 12);
            groupUnit = 'month';
        }

        const dateFormat = groupUnit === 'hour'
            ? '%Y-%m-%d %H'
            : (groupUnit === 'month' ? '%Y-%m' : '%Y-%m-%d');

        const rows = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: matchStart, $lte: matchEnd },
                    // Không tính đơn đã hủy vào doanh thu, giống cách tính ở customers.route.js
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormat,
                            date: '$createdAt',
                            timezone: 'Asia/Ho_Chi_Minh'
                        }
                    },
                    total: { $sum: '$total' }
                }
            }
        ]);

        const totalsByKey = {};
        rows.forEach(function (row) {
            totalsByKey[row._id] = row.total;
        });

        const labels = series.map(function (s) { return s.label; });
        const data = series.map(function (s) { return totalsByKey[s.key] || 0; });

        res.json({ labels: labels, data: data });

    } catch (error) {
        console.log(error);
        res.status(500).json({ labels: [], data: [], error: 'Không tải được dữ liệu biểu đồ' });
    }
});

module.exports = router;
