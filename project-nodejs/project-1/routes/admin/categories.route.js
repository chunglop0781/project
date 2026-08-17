const path = require('path');
const multer = require('multer'); // TODO: nếu chưa cài, chạy: npm install multer
const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const Category = require('../../models/category.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    active: 'Hoạt động',
    inactive: 'Tạm dừng'
};

// =============================================================
// UPLOAD ẢNH DANH MỤC
// LƯU Ý: giả định app.js/server.js có dòng
//   app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))
// để ảnh trong thư mục public/uploads/categories truy cập được qua URL /uploads/categories/...
// Nếu project bạn đặt thư mục static khác, đổi lại 'destination' bên dưới.
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/categories'));
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

// tạo slug đơn giản từ tên danh mục (không cần cài thêm package)
function toSlug(str) {
    return (str || '')
        .toString()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
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

// =============================================================
// DANH SÁCH DANH MỤC
// =============================================================

router.get('/', requireAdmin, async (req, res) => {
    try {
        const { status, creator, dateFrom, dateTo } = req.query;
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = {};

        if (status === 'active' || status === 'inactive') filter.status = status;
        if (creator) filter.createdBy = creator;

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

        const totalCategories = await Category.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalCategories / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const categoriesRaw = await Category.find(filter)
            .populate('createdBy')
            .populate('updatedBy')
            .sort({ position: 1, createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const categories = categoriesRaw.map(function (cat) {
            return {
                id: cat._id,
                name: cat.name,
                image: cat.image || '/admin/image/no-image.png',
                position: cat.position,
                status: cat.status,
                statusLabel: STATUS_LABELS[cat.status] || cat.status,
                createdByName: cat.createdBy ? cat.createdBy.fullName : 'N/A',
                createdAt: cat.createdAt ? cat.createdAt.toLocaleString('vi-VN') : '',
                updatedByName: cat.updatedBy ? cat.updatedBy.fullName : 'N/A',
                updatedAt: cat.updatedAt ? cat.updatedAt.toLocaleString('vi-VN') : ''
            };
        });

        let baseUrl = '/admin/categories?';
        if (status) baseUrl += 'status=' + status + '&';
        if (creator) baseUrl += 'creator=' + creator + '&';
        if (dateFrom) baseUrl += 'dateFrom=' + encodeURIComponent(dateFrom) + '&';
        if (dateTo) baseUrl += 'dateTo=' + encodeURIComponent(dateTo) + '&';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/category/category-list', {
            categories,
            creators: [], // TODO: truyền User.find({ role: "admin" }) nếu cần lọc theo người tạo
            filter: { status, creator, dateFrom, dateTo, keyword },
            currentPage,
            totalPages,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/category/category-list', {
            categories: [],
            creators: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/categories?'
        });
    }
});

// =============================================================
// FORM TẠO DANH MỤC MỚI
// =============================================================

router.get('/new', requireAdmin, async (req, res) => {
    try {
        const parentCategories = await Category.find().sort({ position: 1 });
        res.render('admin/pages/category/category-form', { parentCategories });
    } catch (error) {
        console.log(error);
        res.render('admin/pages/category/category-form', { parentCategories: [] });
    }
});

router.post('/new', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const body = req.body;

        await Category.create({
            name: body.name,
            slug: toSlug(body.name) + '-' + Date.now(),
            parent: body.parent || null,
            position: body.position || 1,
            status: body.status === 'inactive' ? 'inactive' : 'active',
            description: body.description,
            image: req.file ? '/uploads/categories/' + req.file.filename : undefined,

            // Route đã được bảo vệ bởi requireAdmin nên req.session.user luôn tồn tại
            createdBy: req.session.user._id
        });

        res.redirect('/admin/categories');

    } catch (error) {
        console.log(error);

        const parentCategories = await Category.find().sort({ position: 1 });

        res.render('admin/pages/category/category-form', {
            parentCategories,
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
});

// =============================================================
// HÀNH ĐỘNG HÀNG LOẠT
// =============================================================

router.post('/bulk', requireAdmin, async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length) {
            if (bulkAction === 'activate') {
                await Category.updateMany({ _id: { $in: ids } }, { status: 'active' });
            } else if (bulkAction === 'deactivate') {
                await Category.updateMany({ _id: { $in: ids } }, { status: 'inactive' });
            } else if (bulkAction === 'delete') {
                await Category.deleteMany({ _id: { $in: ids } });
            }
        }

        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error);
        res.redirect('/admin/categories');
    }
});

// =============================================================
// FORM SỬA DANH MỤC
// =============================================================

router.get('/:id/edit', requireAdmin, async (req, res) => {
    try {
        const categoryRaw = await Category.findById(req.params.id);

        if (!categoryRaw) {
            return res.redirect('/admin/categories');
        }

        const parentCategories = await Category.find({ _id: { $ne: categoryRaw._id } }).sort({ position: 1 });

        const category = {
            id: categoryRaw._id,
            name: categoryRaw.name,
            parent: categoryRaw.parent ? categoryRaw.parent.toString() : '',
            position: categoryRaw.position,
            status: categoryRaw.status,
            image: categoryRaw.image,
            description: categoryRaw.description
        };

        res.render('admin/pages/category/category-form', { category, parentCategories });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/categories');
    }
});

router.post('/:id/edit', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const body = req.body;

        const updateData = {
            name: body.name,
            parent: body.parent || null,
            position: body.position || 1,
            status: body.status === 'inactive' ? 'inactive' : 'active',
            description: body.description,

            // Route đã được bảo vệ bởi requireAdmin nên req.session.user luôn tồn tại
            updatedBy: req.session.user._id
        };

        if (req.file) {
            updateData.image = '/uploads/categories/' + req.file.filename;
        }

        await Category.findByIdAndUpdate(req.params.id, updateData);

        res.redirect('/admin/categories');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/categories/' + req.params.id + '/edit');
    }
});

// =============================================================
// XÓA DANH MỤC
// LƯU Ý: category-list.pug dùng data-delete-url="/admin/categories/:id" trên
// button, cần JS phía client gọi fetch(url, { method: 'DELETE' }).
// =============================================================

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
