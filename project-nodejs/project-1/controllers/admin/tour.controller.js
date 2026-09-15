const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const Tour = require('../../models/tour.model');
const Category = require('../../models/category.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    active: 'Hoạt động',
    inactive: 'Tạm dừng'
};

// =============================================================
// DANH SÁCH ĐỊA ĐIỂM (34 tỉnh/thành sau sáp nhập) - dùng chung
// cho tour-form.pug (checkbox "Những địa điểm có tour")
// =============================================================

const LOCATION_OPTIONS = [
    { value: 'cao-bang', label: 'Cao Bằng' },
    { value: 'son-la', label: 'Sơn La' },
    { value: 'lai-chau', label: 'Lai Châu' },
    { value: 'lang-son', label: 'Lạng Sơn' },
    { value: 'tuyen-quang', label: 'Tuyên Quang' },
    { value: 'lao-cai', label: 'Lào Cai' },
    { value: 'thai-nguyen', label: 'Thái Nguyên' },
    { value: 'dien-bien', label: 'Điện Biên' },
    { value: 'phu-tho', label: 'Phú Thọ' },
    { value: 'bac-ninh', label: 'Bắc Ninh' },
    { value: 'ha-noi', label: 'Hà Nội' },
    { value: 'quang-ninh', label: 'Quảng Ninh' },
    { value: 'hai-phong', label: 'Hải Phòng' },
    { value: 'hung-yen', label: 'Hưng Yên' },
    { value: 'ninh-binh', label: 'Ninh Bình' },
    { value: 'thanh-hoa', label: 'Thanh Hóa' },
    { value: 'nghe-an', label: 'Nghệ An' },
    { value: 'ha-tinh', label: 'Hà Tĩnh' },
    { value: 'quang-tri', label: 'Quảng Trị' },
    { value: 'hue', label: 'Huế' },
    { value: 'da-nang', label: 'Đà Nẵng' },
    { value: 'quang-ngai', label: 'Quảng Ngãi' },
    { value: 'gia-lai', label: 'Gia Lai' },
    { value: 'dak-lak', label: 'Đắk Lắk' },
    { value: 'khanh-hoa', label: 'Khánh Hòa' },
    { value: 'lam-dong', label: 'Lâm Đồng' },
    { value: 'dong-nai', label: 'Đồng Nai' },
    { value: 'ho-chi-minh', label: 'TP. Hồ Chí Minh' },
    { value: 'tay-ninh', label: 'Tây Ninh' },
    { value: 'dong-thap', label: 'Đồng Tháp' },
    { value: 'vinh-long', label: 'Vĩnh Long' },
    { value: 'can-tho', label: 'Cần Thơ' },
    { value: 'an-giang', label: 'An Giang' },
    { value: 'ca-mau', label: 'Cà Mau' }
];

// =============================================================
// CẤU HÌNH GITHUB
// =============================================================

const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: 'project-nodejs/project-1/public/uploads/tours/'
};

// =============================================================
// UPLOAD ẢNH - TÊN FILE NGẪU NHIÊN
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/tours'));
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const uniqueName = `${timestamp}-${random}${ext}`;
        cb(null, uniqueName);
    }
});

// Trả về danh sách category đã dựng cây + thụt lề sẵn trong "name",
// để dùng cho <select> của tour-form.pug — cùng kiểu với parentCategories
// bên category-form.pug (option label đã có tiền tố "- " theo độ sâu).
async function getCategoryTreeForSelect() {
    const categoriesRaw = await Category.find().sort({ position: 1, name: 1 });
    const tree = buildCategoryTree(
        categoriesRaw.map(cat => ({
            _id: cat._id,
            name: cat.name,
            parent: cat.parent || null,
            position: cat.position
        }))
    );
    return flattenCategoryTree(tree).map(cat => ({
        id: cat._id.toString(), // ✅ ép về string để so sánh selected đúng trong pug (tour.category cũng là string)
        name: cat.label, // đã có "- ", "- - "... theo depth
        depth: cat.depth
    }));
}

const upload = multer({ storage: storage });

// =============================================================
// UPLOAD ẢNH LÊN GITHUB
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    try {
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found. Skipping GitHub upload.');
            return null;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');

        const githubPath = `${GITHUB_CONFIG.path}${fileName}`;

        const response = await axios.put(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPath}`,
            {
                message: `Upload tour image: ${fileName}`,
                content: contentBase64,
                branch: GITHUB_CONFIG.branch
            },
            {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        console.log('✅ Uploaded tour image to GitHub:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;

    } catch (error) {
        console.error('❌ Upload to GitHub failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

function normalizeIds(ids) {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

// ✅ FIX: session có lúc chỉ lưu "_id", có lúc chỉ lưu "id" (tùy nơi set) -
// nếu chỉ đọc req.session.user?.id thì createdBy/updatedBy/deletedBy dễ
// bị lưu null → hiển thị "N/A" dù đã đăng nhập. Đồng bộ với customer_controller.js.
function getUserId(req) {
    return req.session.user?.id || req.session.user?._id || null;
}

function normalizeLocations(locations) {
    if (!locations) return [];
    return Array.isArray(locations) ? locations : [locations];
}

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
// XÂY DỰNG CÂY DANH MỤC (dựa trên field "parent") - dùng cho dropdown lọc
// =============================================================

function buildCategoryTree(categories) {
    const map = new Map();

    categories.forEach(cat => {
        map.set(String(cat._id), { ...cat, children: [] });
    });

    const roots = [];

    map.forEach(node => {
        const parentId = node.parent ? String(node.parent) : null;
        if (parentId && map.has(parentId)) {
            map.get(parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    const sortNodes = (nodes) => {
        nodes.sort((a, b) => {
            const posA = a.position || 0;
            const posB = b.position || 0;
            if (posA !== posB) return posA - posB;
            return (a.name || '').localeCompare(b.name || '');
        });
        nodes.forEach(n => sortNodes(n.children));
    };
    sortNodes(roots);

    return roots;
}

// Làm phẳng cây thành mảng theo thứ tự cha -> con, có "depth" và "label" đã thụt lề,
// dùng để đổ vào <select> của bộ lọc category trên danh sách tour.
// Ví dụ: "Tour châu Á" -> "- Tour Việt Nam" -> "- - Tour Hà Nội"
function flattenCategoryTree(nodes, depth = 0, result = []) {
    nodes.forEach(node => {
        const { children, ...rest } = node;
        result.push({
            ...rest,
            depth,
            label: (depth > 0 ? '- '.repeat(depth) : '') + rest.name
        });
        if (children && children.length) {
            flattenCategoryTree(children, depth + 1, result);
        }
    });
    return result;
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

exports.index = async (req, res) => {
    try {
        const { status, creator, category, priceRange, dateFrom, dateTo } = req.query;
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

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

        // ✅ Dựng cây danh mục để dropdown lọc "Danh mục" hiển thị phân cấp
        // cha -> con (Tour châu Á > Tour Việt Nam > Tour Hà Nội) thay vì phẳng.
        const categoriesRaw = await Category.find().sort({ position: 1, name: 1 });
        const categoryTree = buildCategoryTree(
            categoriesRaw.map(cat => ({
                _id: cat._id,
                name: cat.name,
                parent: cat.parent || null,
                position: cat.position
            }))
        );
        const categories = flattenCategoryTree(categoryTree).map(cat => ({
            id: cat._id.toString(), // ✅ ép về string để so sánh selected đúng với filter.category (string từ query)
            name: cat.name,   // giữ lại để view cũ không bị vỡ nếu đang dùng .name
            depth: cat.depth,
            label: cat.label  // dùng field này để hiển thị có thụt lề trong <option>
        }));

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
            creators: [],
            // ✅ Truyền Date đã parse xuống view (đồng bộ với category-list),
            // để view format lại dd/mm/yyyy thay vì in string thô
            filter: { status, creator, category, priceRange, dateFrom: fromDate, dateTo: toDate, keyword },
            currentPage,
            totalPages,
            baseUrl,
            pageTitle: 'Quản Lý Tour',
            activeMenu: 'tours'
        });

    } catch (error) {
        console.error(error);
        res.render('admin/pages/tours/tour-list', {
            tours: [],
            categories: [],
            creators: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/tours?',
            pageTitle: 'Quản Lý Tour',
            activeMenu: 'tours'
        });
    }
};

// =============================================================
// THÙNG RÁC TOUR
// =============================================================

exports.trash = async (req, res) => {
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
            baseUrl,
            pageTitle: 'Thùng Rác Tour',
            activeMenu: 'tours'
        });

    } catch (error) {
        console.error(error);
        res.render('admin/pages/tours/tour-trash', {
            tours: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/tours/trash?',
            pageTitle: 'Thùng Rác Tour',
            activeMenu: 'tours'
        });
    }
};

// =============================================================
// TRANG TẠO TOUR MỚI
// =============================================================

exports.createPage = async (req, res) => {
    try {
        const categories = await getCategoryTreeForSelect();

        res.render('admin/pages/tours/tour-form', {
            categories,
            locationOptions: LOCATION_OPTIONS,
            pageTitle: 'Tạo Tour Mới',
            activeMenu: 'tours'
        });
    } catch (error) {
        console.error(error);
        res.render('admin/pages/tours/tour-form', {
            categories: [],
            locationOptions: [],
            pageTitle: 'Tạo Tour Mới',
            activeMenu: 'tours'
        });
    }
};

// =============================================================
// TẠO TOUR - UPLOAD ẢNH LÊN GITHUB
// =============================================================

exports.create = async (req, res) => {
    try {
        console.log('🔍 CREATE TOUR - Request received');
        console.log('  - Body:', req.body);
        console.log('  - File:', req.file);

        const body = req.body;

        // ✅ Lấy 1 lần, dùng chung cho cả createdBy và updatedBy
        const userId = getUserId(req);

        // Xử lý ảnh
        let imageUrl = undefined;
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;

            console.log('📤 Uploading tour image to GitHub:', fileName);

            // Upload lên GitHub
            const githubImageUrl = await uploadToGitHub(localPath, fileName);

            if (githubImageUrl) {
                imageUrl = githubImageUrl;
                console.log('✅ Uploaded tour image to GitHub:', imageUrl);

                // Xóa ảnh local sau khi upload thành công
                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Deleted local image:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Could not delete local image:', unlinkError.message);
                }
            } else {
                // Fallback: giữ ảnh local
                imageUrl = '/uploads/tours/' + fileName;
                console.warn('⚠️ GitHub upload failed, keeping local image.');
            }
        }

        const newTour = await Tour.create({
            name: body.name,
            code: body.code || undefined,
            category: body.category || undefined,
            position: body.position || 1,
            status: body.status === 'inactive' ? 'inactive' : 'active',
            duration: body.duration,
            vehicle: body.vehicle,
            departureDate: body.departureDate ? new Date(body.departureDate) : undefined,
            description: body.description,
            image: imageUrl,

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
            // ✅ FIX: gán cả createdBy và updatedBy = người tạo,
            // để tour mới tạo không hiển thị "Cập nhật bởi: N/A"
            createdBy: userId,
            updatedBy: userId
        });

        console.log('✅ Tour created successfully:', newTour._id);
        req.flash2('success', 'Tạo tour thành công!');
        res.redirect('/admin/tours');

    } catch (error) {
        console.error('❌ CREATE TOUR ERROR:', error);
        req.flash2('error', 'Có lỗi xảy ra khi tạo tour.');

        const categories = await getCategoryTreeForSelect();

        res.render('admin/pages/tours/tour-form', {
            categories,
            locationOptions: LOCATION_OPTIONS,
            error: 'Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại.'),
            pageTitle: 'Tạo Tour Mới',
            activeMenu: 'tours'
        });
    }
};

// =============================================================
// TRANG SỬA TOUR
// =============================================================

exports.editPage = async (req, res) => {
    try {
        const tourRaw = await Tour.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

        if (!tourRaw) {
            return res.redirect('/admin/tours');
        }

        const categories = await getCategoryTreeForSelect();

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
                ? tourRaw.departureDate.toISOString().slice(0, 10)
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

        res.render('admin/pages/tours/tour-form', {
            tour,
            categories,
            locationOptions: LOCATION_OPTIONS,
            pageTitle: 'Sửa Tour',
            activeMenu: 'tours'
        });

    } catch (error) {
        console.error(error);
        res.redirect('/admin/tours');
    }
};

// =============================================================
// CẬP NHẬT TOUR - UPLOAD ẢNH LÊN GITHUB
// =============================================================

exports.edit = async (req, res) => {
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
            // ✅ Không đụng vào createdBy khi edit — chỉ cập nhật updatedBy
            updatedBy: getUserId(req)
        };

        // Xử lý ảnh mới
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;

            console.log('📤 Uploading updated tour image to GitHub:', fileName);

            const githubImageUrl = await uploadToGitHub(localPath, fileName);

            if (githubImageUrl) {
                updateData.image = githubImageUrl;
                console.log('✅ Updated tour image to GitHub:', githubImageUrl);

                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Deleted local image:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Could not delete local image:', unlinkError.message);
                }
            } else {
                updateData.image = '/uploads/tours/' + fileName;
                console.warn('⚠️ GitHub upload failed, keeping local image.');
            }
        }

        await Tour.findByIdAndUpdate(req.params.id, updateData);
        req.flash2('success', 'Cập nhật tour thành công!');
        res.redirect('/admin/tours');

    } catch (error) {
        console.error('❌ UPDATE TOUR ERROR:', error);
        req.flash2('error', 'Có lỗi xảy ra khi cập nhật tour.');
        res.redirect('/admin/tours/' + req.params.id + '/edit');
    }
};

// =============================================================
// XÓA TOUR (CHUYỂN VÀO THÙNG RÁC)
// =============================================================

exports.delete = async (req, res) => {
    try {
        await Tour.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: getUserId(req)
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// KHÔI PHỤC TOUR TỪ THÙNG RÁC
// =============================================================

exports.restore = async (req, res) => {
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
        console.error(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// XÓA VĨNH VIỄN TOUR
// =============================================================

exports.forceDelete = async (req, res) => {
    try {
        await Tour.deleteOne({ _id: req.params.id, isDeleted: true });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// BULK ACTION
// =============================================================

exports.bulkAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);
        // ✅ Lấy userId 1 lần, dùng chung cho updatedBy/deletedBy
        const userId = getUserId(req);

        if (ids.length === 0) {
            req.flash2('error', 'Vui lòng chọn ít nhất một tour.');
            return res.redirect('/admin/tours');
        }

        switch (bulkAction) {
            case 'activate':
                await Tour.updateMany(
                    { _id: { $in: ids } },
                    { status: 'active', updatedBy: userId }
                );
                req.flash2('success', `Đã kích hoạt ${ids.length} tour.`);
                break;
            case 'deactivate':
                await Tour.updateMany(
                    { _id: { $in: ids } },
                    { status: 'inactive', updatedBy: userId }
                );
                req.flash2('success', `Đã tạm dừng ${ids.length} tour.`);
                break;
            case 'delete':
                await Tour.updateMany(
                    { _id: { $in: ids } },
                    {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedBy: userId
                    }
                );
                req.flash2('success', `Đã chuyển ${ids.length} tour vào thùng rác.`);
                break;
            default:
                req.flash2('error', 'Hành động không hợp lệ.');
                break;
        }

        res.redirect('/admin/tours');
    } catch (error) {
        console.error(error);
        req.flash2('error', 'Có lỗi xảy ra khi thực hiện hành động hàng loạt.');
        res.redirect('/admin/tours');
    }
};

// =============================================================
// BULK ACTION THÙNG RÁC
// =============================================================

exports.bulkTrashAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length === 0) {
            req.flash2('error', 'Vui lòng chọn ít nhất một tour.');
            return res.redirect('/admin/tours/trash');
        }

        if (bulkAction === 'restore') {
            await Tour.updateMany(
                { _id: { $in: ids } },
                {
                    $set: { isDeleted: false },
                    $unset: { deletedAt: '', deletedBy: '' }
                }
            );
            req.flash2('success', `Đã khôi phục ${ids.length} tour.`);
        } else if (bulkAction === 'delete') {
            await Tour.deleteMany({ _id: { $in: ids } });
            req.flash2('success', `Đã xóa vĩnh viễn ${ids.length} tour.`);
        } else {
            req.flash2('error', 'Hành động không hợp lệ.');
        }

        res.redirect('/admin/tours/trash');
    } catch (error) {
        console.error(error);
        req.flash2('error', 'Có lỗi xảy ra khi thực hiện hành động hàng loạt.');
        res.redirect('/admin/tours/trash');
    }
};

// =============================================================
// EXPORT UPLOAD
// =============================================================

exports.upload = upload;

// =============================================================
// API - LẤY CHI TIẾT MỘT TOUR (đồng bộ với categoryController.getDetail /
// orderController.getDetail)
// =============================================================

exports.getDetail = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id)
            .populate('createdBy')
            .populate('updatedBy');

        if (!tour) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
        }

        res.json({
            success: true,
            data: {
                id: tour._id,
                name: tour.name,
                code: tour.code,
                category: tour.category,
                position: tour.position || 1,
                status: tour.status || 'active',
                image: tour.image || '/admin/image/no-image.png',
                duration: tour.duration,
                vehicle: tour.vehicle,
                departureDate: tour.departureDate,
                description: tour.description || '',
                oldPrice: tour.oldPrice,
                newPrice: tour.newPrice,
                remaining: tour.remaining,
                createdByName: tour.createdBy ? tour.createdBy.fullName : 'N/A',
                createdAt: tour.createdAt,
                updatedByName: tour.updatedBy ? tour.updatedBy.fullName : 'N/A',
                updatedAt: tour.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ GET TOUR DETAIL ERROR:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};

// =============================================================
// CHANGE MULTI PATCH (đổi trạng thái nhiều bản ghi)
// =============================================================
exports.changeMultiPatch = async (req, res) => {
    try {
        console.log(req.body);

        req.flash2("success", "Đổi trạng thái thành công!");

        res.json({
            code: "success"
        });
    } catch (error) {
        res.json({
            code: "error",
            message: "Id không tồn tại trong hệ thống!"
        });
    }
};
