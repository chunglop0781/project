const path = require('path');
const multer = require('multer'); // TODO: nếu chưa cài, chạy: npm install multer
const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const News = require('../../models/news.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    draft: 'Nháp',
    published: 'Đã đăng'
};

// =============================================================
// UPLOAD ẢNH ĐẠI DIỆN BÀI VIẾT
// LƯU Ý: giả định app.js/server.js có dòng
//   app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))
// để ảnh trong thư mục public/uploads/news truy cập được qua URL /uploads/news/...
// Nếu project bạn đặt thư mục static khác, đổi lại 'destination' bên dưới.
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/news'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// =============================================================
// DANH SÁCH BÀI VIẾT
// =============================================================

router.get('/', requireAdmin, async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = {};
        if (keyword) {
            filter.title = { $regex: keyword, $options: 'i' };
        }

        const totalPosts = await News.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalPosts / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const postsRaw = await News.find(filter)
            .populate('author')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const posts = postsRaw.map(function (post) {
            return {
                id: post._id,
                thumbnail: post.thumbnail,
                title: post.title,
                category: post.category || 'Chưa phân loại',
                author: post.author ? post.author.fullName : 'N/A',
                status: post.status,
                statusLabel: STATUS_LABELS[post.status] || post.status,
                publishedAt: post.publishedAt
                    ? post.publishedAt.toLocaleDateString('vi-VN')
                    : '—'
            };
        });

        let baseUrl = '/admin/news?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/news/news-list', {
            posts,
            currentPage,
            totalPages,
            baseUrl
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/news/news-list', {
            posts: [],
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/news?'
        });
    }
});

// =============================================================
// FORM VIẾT BÀI MỚI
// =============================================================

router.get('/new', requireAdmin, function (req, res) {
    res.render('admin/pages/news/news-form');
});

router.post('/new', requireAdmin, upload.single('thumbnail'), async (req, res) => {
    try {
        const body = req.body;

        await News.create({
            title: body.title,
            slug: body.slug || undefined, // undefined để mongoose bỏ qua, tránh lỗi unique khi rỗng
            excerpt: body.excerpt,
            content: body.content,
            category: body.category,
            thumbnail: req.file ? '/uploads/news/' + req.file.filename : undefined,

            // TODO: đổi theo cách project bạn lưu admin đang đăng nhập trong session/req.user
            // (kiểm tra middlewares/requireAdmin.js để biết chính xác field nào chứa id admin)
            author: (req.session && req.session.admin) ? req.session.admin._id : undefined,

            status: body.status === 'published' ? 'published' : 'draft',
            publishedAt: body.publishedAt
                ? new Date(body.publishedAt)
                : (body.status === 'published' ? new Date() : undefined)
        });

        res.redirect('/admin/news');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/news/new');
    }
});

// =============================================================
// FORM SỬA BÀI VIẾT
// =============================================================

router.get('/:id/edit', requireAdmin, async (req, res) => {
    try {
        const postRaw = await News.findById(req.params.id);

        if (!postRaw) {
            return res.redirect('/admin/news');
        }

        const post = {
            id: postRaw._id,
            title: postRaw.title,
            slug: postRaw.slug,
            excerpt: postRaw.excerpt,
            content: postRaw.content,
            thumbnail: postRaw.thumbnail,
            category: postRaw.category,
            status: postRaw.status,
            publishedAt: postRaw.publishedAt
                ? postRaw.publishedAt.toISOString().slice(0, 10) // yyyy-mm-dd cho input type="date"
                : ''
        };

        res.render('admin/pages/news/news-form', { post });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/news');
    }
});

router.post('/:id/edit', requireAdmin, upload.single('thumbnail'), async (req, res) => {
    try {
        const body = req.body;

        const updateData = {
            title: body.title,
            slug: body.slug || undefined,
            excerpt: body.excerpt,
            content: body.content,
            category: body.category,
            status: body.status === 'published' ? 'published' : 'draft',
            publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined
        };

        if (req.file) {
            updateData.thumbnail = '/uploads/news/' + req.file.filename;
        }

        await News.findByIdAndUpdate(req.params.id, updateData);

        res.redirect('/admin/news');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/news/' + req.params.id + '/edit');
    }
});

// =============================================================
// XÓA BÀI VIẾT
// LƯU Ý: news-list.pug dùng data-delete-url="/admin/news/:id/delete" trên
// button, chắc cần JS phía client gọi fetch(url, { method: 'DELETE' }) hoặc
// 'POST'. Route dưới đây nhận cả 2 - kiểm tra lại file JS xử lý data-confirm
// trong admin-layout.pug / file JS chung để chỉnh method cho khớp.
// =============================================================

router.post('/:id/delete', requireAdmin, async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.redirect('/admin/news');
    } catch (error) {
        console.log(error);
        res.redirect('/admin/news');
    }
});

router.delete('/:id/delete', requireAdmin, async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
