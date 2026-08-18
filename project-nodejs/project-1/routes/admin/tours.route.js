const path = require('path');
const multer = require('multer'); // TODO: nếu chưa cài, chạy: npm install multer
const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const Tour = require('../../models/tour.model');
const Category = require('../../models/category.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    active: 'Hoạt động',
    inactive: 'Tạm dừng'
};

// Danh sách địa điểm cố định cho checkbox "Những địa điểm có tour"
// TODO: thay bằng bảng riêng trong DB nếu cần quản lý động
const LOCATION_OPTIONS = [
    { value: 'ha-noi', label: 'Hà Nội' },
    { value: 'da-nang', label: 'Đà Nẵng' },
    { value: 'ho-chi-minh', label: 'Hồ Chí Minh' },
    { value: 'nha-trang', label: 'Nha Trang' },
    { value: 'da-lat', label: 'Đà Lạt' },
    { value: 'phu-quoc', label: 'Phú Quốc' }
];

// =============================================================
// UPLOAD ẢNH TOUR
// LƯU Ý: giả định app.js/server.js có dòng
//   app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))
// để ảnh trong thư mục public/uploads/tours truy cập được qua URL /uploads/tours/...
// Nếu project bạn đặt thư mục static khác, đổi lại 'destination' bên dưới.
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/tours'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

function normalizeIds(ids) {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

function normalizeLocations(locations) {
    if (!locations) return [];
    return Array.isArray(locations) ? locations : [locations];
}

// dd/mm/yyyy -> Date, trả về null nếu không parse được
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

function applyPriceRange(filter, priceRange) {
    if (priceRange === 'under-1tr') filter['newPrice.adult'] = { $lt: 1000000 };
    else if (priceRange === '1-3tr') filter['newPrice.adult'] = { $gte: 1000000, $lte: 3000000 };
    else if (priceRange === '3-5tr') filter['newPrice.adult'] = { $gt: 3000000, $lte: 5000000 };
    else if (priceRange === 'over-5tr') filter['newPrice.adult'] = { $gt: 5000000 };
}

function toTourViewModel(tour) {
    return {
        id: tour._id,
        name: tour.name,
        image: tour.image || '/admin/image/no-image.png',
        position: tour.position,
        status: tour.status,
        statusLabel: STATUS_LABELS[tour.status] || tour.status,
        priceAdult: tour.newPrice ? tour.newPrice.adult : (tour.price || 0),
        priceChild: tour.newPrice ? tour.newPrice.child : 0,
        priceInfant: tour.newPrice ? tour.newPrice.infant : 0,
        remainingAdult: tour.remaining ? tour.remaining.adult : 0,
        remainingChild: tour.remaining ? tour.remaining.child : 0,
        remainingInfant: tour.remaining ? tour.remaining.infant : 0,
        createdByName: tour.createdBy ? tour.createdBy.fullName : 'N/A',
        createdAt: tour.createdAt ? tour.createdAt.toLocaleString('vi-VN') : '',
        updatedByName: tour.updatedBy ? tour.updatedBy.fullName : 'N/A',
        updatedAt: tour.updatedAt ? tour.updatedAt.toLocaleString('vi-VN') : '',
        deletedByName: tour.deletedBy ? tour.deletedBy.fullName : 'N/A',
        deletedAt: tour.deletedAt ? tour.deletedAt.toLocaleString('vi-VN') : ''
    };
}

// =============================================================
// DANH SÁCH TOUR
// =============================================================

router.get('/', requireAdmin, async (req, res) => {
    try {
        const { status, creator, category, priceRange, dateFrom, dateTo } = req.query;
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        // Dùng $ne: true thay vì false để không loại các document cũ
        // chưa từng có field isDeleted (data cũ insert trước khi thêm field này)
        const filter = { isDeleted: { $ne: true } };

        if (status === 'active' || status === 'inactive') filter.status = status;
        if (creator) filter.createdBy = creator;
        if (category) filter.category = category;
        applyPriceRange(filter, priceRange);

        const fromDate = parseVNDate(dateFrom, false);
        const toDate = parseVNDate(dateTo, true);
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = fromDate;
            if (toDate) filter.createdAt.$lte = toDate;
        }

        if (keyword) {
            filter.name = { $regex: keyword, $options: 'i' };
        }

        const totalTours = await Tour.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalTours / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const toursRaw = await Tour.find(filter)
            .populate('createdBy')
            .populate('updatedBy')
            .sort({ position: 1, createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const tours = toursRaw.map(toTourViewModel);

        const categories = await Category.find().sort({ position: 1 });

        let baseUrl = '/admin/tours?';
        if (status) baseUrl += 'status=' + status + '&';
        if (creator) baseUrl += 'creator=' + creator + '&';
        if (category) baseUrl += 'category=' + category + '&';
        if (priceRange) baseUrl += 'priceRange=' + priceRange + '&';
        if (dateFrom) baseUrl += 'dateFrom=' + encodeURIComponent(dateFrom) + '&';
        if (dateTo) baseUrl += 'dateTo=' + encodeURIComponent(dateTo) + '&';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/tours/tour-list', {
            tours,
            categories,
            creators: [], // TODO: truyền User.find({ role: "admin" }) nếu cần lọc theo người tạo
            filter: { status, creator, category, priceRange, dateFrom, dateTo, keyword },
            currentPage,
            totalPages,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/tours/tour-list', {
            tours: [],
            categories: [],
            creators: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/tours?'
        });
    }
});

// =============================================================
// THÙNG RÁC TOUR
// =============================================================

router.get('/trash', requireAdmin, async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = { isDeleted: true };
        if (keyword) filter.name = { $regex: keyword, $options: 'i' };

        const totalTours = await Tour.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalTours / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const toursRaw = await Tour.find(filter)
            .populate('createdBy')
            .populate('deletedBy')
            .sort({ deletedAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const tours = toursRaw.map(toTourViewModel);

        let baseUrl = '/admin/tours/trash?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/tours/tour-trash', {
            tours,
            filter: { keyword },
            currentPage,
            totalPages,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/tours/tour-trash', {
            tours: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/tours/trash?'
        });
    }
});

router.post('/trash/bulk', requireAdmin, async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length) {
            if (bulkAction === 'restore') {
                await Tour.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: { isDeleted: false },
                        $unset: { deletedAt: '', deletedBy: '' }
                    }
                );
            } else if (bulkAction === 'delete') {
                await Tour.deleteMany({ _id: { $in: ids } });
            }
        }

        res.redirect('/admin/tours/trash');
    } catch (error) {
        console.log(error);
        res.redirect('/admin/tours/trash');
    }
});

// =============================================================
// FORM THÊM TOUR MỚI
// =============================================================

router.get('/new', requireAdmin, async (req, res) => {
    try {
        const categories = await Category.find().sort({ position: 1 });
        res.render('admin/pages/tours/tour-form', {
            categories,
            locationOptions: LOCATION_OPTIONS
        });
    } catch (error) {
        console.log(error);
        res.render('admin/pages/tours/tour-form', { categories: [], locationOptions: LOCATION_OPTIONS });
    }
});

router.post('/new', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const body = req.body;

        await Tour.create({
            name: body.name,
            code: body.code || undefined, // undefined để mongoose bỏ qua, tránh lỗi unique khi rỗng
            category: body.category || undefined,
            position: body.position || 1,
            status: body.status === 'inactive' ? 'inactive' : 'active',
            duration: body.duration,
            vehicle: body.vehicle,
            departureDate: body.departureDate ? new Date(body.departureDate) : undefined,
            description: body.description,
            image: req.file ? '/uploads/tours/' + req.file.filename : undefined,

            oldPrice: {
                adult: body.oldPriceAdult || 0,
                child: body.oldPriceChild || 0,
                infant: body.oldPriceInfant || 0
            },
            newPrice: {
                adult: body.newPriceAdult || 0,
                child: body.newPriceChild || 0,
                infant: body.newPriceInfant || 0
            },
            remaining: {
                adult: body.remainingAdult || 0,
                child: body.remainingChild || 0,
                infant: body.remainingInfant || 0
            },

            // giữ "price" cũ đồng bộ theo giá người lớn để không phá code cũ
            price: body.newPriceAdult || 0,

            locations: normalizeLocations(body.locations),

            // Route đã được bảo vệ bởi requireAdmin nên req.session.user luôn tồn tại
            createdBy: req.session.user._id
        });

        res.redirect('/admin/tours');

    } catch (error) {
        console.log(error);

        const categories = await Category.find().sort({ position: 1 });

        res.render('admin/pages/tours/tour-form', {
            categories,
            locationOptions: LOCATION_OPTIONS,
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
});

// =============================================================
// HÀNH ĐỘNG HÀNG LOẠT (danh sách chính)
// =============================================================

router.post('/bulk', requireAdmin, async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length) {
            if (bulkAction === 'activate') {
                await Tour.updateMany({ _id: { $in: ids } }, { status: 'active' });
            } else if (bulkAction === 'deactivate') {
                await Tour.updateMany({ _id: { $in: ids } }, { status: 'inactive' });
            } else if (bulkAction === 'delete') {
                await Tour.updateMany(
                    { _id: { $in: ids } },
                    {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedBy: req.session.user._id
                    }
                );
            }
        }

        res.redirect('/admin/tours');
    } catch (error) {
        console.log(error);
        res.redirect('/admin/tours');
    }
});

// =============================================================
// FORM SỬA TOUR
// =============================================================

router.get('/:id/edit', requireAdmin, async (req, res) => {
    try {
        const tourRaw = await Tour.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

        if (!tourRaw) {
            return res.redirect('/admin/tours');
        }

        const categories = await Category.find().sort({ position: 1 });

        const tour = {
            id: tourRaw._id,
            name: tourRaw.name,
            code: tourRaw.code,
            category: tourRaw.category ? tourRaw.category.toString() : '',
            position: tourRaw.position,
            status: tourRaw.status,
            duration: tourRaw.duration,
            vehicle: tourRaw.vehicle,
            departureDate: tourRaw.departureDate
                ? tourRaw.departureDate.toISOString().slice(0, 10) // yyyy-mm-dd cho input type="date"
                : '',
            description: tourRaw.description,
            image: tourRaw.image,
            bookedCount: tourRaw.bookedCount,
            oldPriceAdult: tourRaw.oldPrice ? tourRaw.oldPrice.adult : 0,
            oldPriceChild: tourRaw.oldPrice ? tourRaw.oldPrice.child : 0,
            oldPriceInfant: tourRaw.oldPrice ? tourRaw.oldPrice.infant : 0,
            newPriceAdult: tourRaw.newPrice ? tourRaw.newPrice.adult : 0,
            newPriceChild: tourRaw.newPrice ? tourRaw.newPrice.child : 0,
            newPriceInfant: tourRaw.newPrice ? tourRaw.newPrice.infant : 0,
            remainingAdult: tourRaw.remaining ? tourRaw.remaining.adult : 0,
            remainingChild: tourRaw.remaining ? tourRaw.remaining.child : 0,
            remainingInfant: tourRaw.remaining ? tourRaw.remaining.infant : 0,
            locations: tourRaw.locations || []
        };

        res.render('admin/pages/tours/tour-form', { tour, categories, locationOptions: LOCATION_OPTIONS });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/tours');
    }
});

router.post('/:id/edit', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const body = req.body;

        const updateData = {
            name: body.name,
            code: body.code || undefined,
            category: body.category || undefined,
            position: body.position || 1,
            status: body.status === 'inactive' ? 'inactive' : 'active',
            duration: body.duration,
            vehicle: body.vehicle,
            departureDate: body.departureDate ? new Date(body.departureDate) : undefined,
            description: body.description,

            oldPrice: {
                adult: body.oldPriceAdult || 0,
                child: body.oldPriceChild || 0,
                infant: body.oldPriceInfant || 0
            },
            newPrice: {
                adult: body.newPriceAdult || 0,
                child: body.newPriceChild || 0,
                infant: body.newPriceInfant || 0
            },
            remaining: {
                adult: body.remainingAdult || 0,
                child: body.remainingChild || 0,
                infant: body.remainingInfant || 0
            },

            price: body.newPriceAdult || 0,

            locations: normalizeLocations(body.locations),

            // Route đã được bảo vệ bởi requireAdmin nên req.session.user luôn tồn tại
            updatedBy: req.session.user._id
        };

        if (req.file) {
            updateData.image = '/uploads/tours/' + req.file.filename;
        }

        await Tour.findByIdAndUpdate(req.params.id, updateData);

        res.redirect('/admin/tours');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/tours/' + req.params.id + '/edit');
    }
});

// =============================================================
// XÓA TOUR (CHUYỂN VÀO THÙNG RÁC) / KHÔI PHỤC / XÓA VĨNH VIỄN
// LƯU Ý: tour-list.pug dùng data-delete-url="/admin/tours/:id" trên button,
// cần JS phía client gọi fetch(url, { method: 'DELETE' }). Kiểm tra lại file
// JS chung xử lý data-delete-url/data-confirm trong admin-layout.pug.
// =============================================================

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await Tour.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: req.session.user._id
        });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
});

router.post('/:id/restore', requireAdmin, async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(
            req.params.id,
            {
                $set: { isDeleted: false },
                $unset: { deletedAt: '', deletedBy: '' }
            },
            { new: true }
        );

        if (!tour) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
        }

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
});

router.delete('/:id/force', requireAdmin, async (req, res) => {
    try {
        await Tour.deleteOne({ _id: req.params.id, isDeleted: true });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
