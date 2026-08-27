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
            creators: [],
            filter: { status, creator, category, priceRange, dateFrom, dateTo, keyword },
            currentPage,
            totalPages,
            baseUrl,
            pageTitle: 'Quản Lý Tour',
            activeMenu: 'tours'
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
        console.log(error);
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
        const categories = await Category.find().sort({ position: 1 });
        const LOCATION_OPTIONS = [
            { value: 'ha-noi', label: 'Hà Nội' },
            { value: 'da-nang', label: 'Đà Nẵng' },
            { value: 'ho-chi-minh', label: 'Hồ Chí Minh' },
            { value: 'nha-trang', label: 'Nha Trang' },
            { value: 'da-lat', label: 'Đà Lạt' },
            { value: 'phu-quoc', label: 'Phú Quốc' }
        ];
        
        res.render('admin/pages/tours/tour-form', {
            categories,
            locationOptions: LOCATION_OPTIONS,
            pageTitle: 'Tạo Tour Mới',
            activeMenu: 'tours'
        });
    } catch (error) {
        console.log(error);
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
            createdBy: req.session.user?._id || null
        });

        console.log('✅ Tour created successfully:', newTour._id);
        req.session.success = 'Tạo tour thành công!';
        res.redirect('/admin/tours');

    } catch (error) {
        console.error('❌ CREATE TOUR ERROR:', error);
        
        const categories = await Category.find().sort({ position: 1 });
        const LOCATION_OPTIONS = [
            { value: 'ha-noi', label: 'Hà Nội' },
            { value: 'da-nang', label: 'Đà Nẵng' },
            { value: 'ho-chi-minh', label: 'Hồ Chí Minh' },
            { value: 'nha-trang', label: 'Nha Trang' },
            { value: 'da-lat', label: 'Đà Lạt' },
            { value: 'phu-quoc', label: 'Phú Quốc' }
        ];

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

        const categories = await Category.find().sort({ position: 1 });
        const LOCATION_OPTIONS = [
            { value: 'ha-noi', label: 'Hà Nội' },
            { value: 'da-nang', label: 'Đà Nẵng' },
            { value: 'ho-chi-minh', label: 'Hồ Chí Minh' },
            { value: 'nha-trang', label: 'Nha Trang' },
            { value: 'da-lat', label: 'Đà Lạt' },
            { value: 'phu-quoc', label: 'Phú Quốc' }
        ];

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
        console.log(error);
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
            updatedBy: req.session.user?._id || null
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
        req.session.success = 'Cập nhật tour thành công!';
        res.redirect('/admin/tours');

    } catch (error) {
        console.error('❌ UPDATE TOUR ERROR:', error);
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
            deletedBy: req.session.user?._id || null
        });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
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
        console.log(error);
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
        console.log(error);
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
                        deletedBy: req.session.user?._id || null
                    }
                );
            }
        }

        res.redirect('/admin/tours');
    } catch (error) {
        console.log(error);
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
};

// =============================================================
// EXPORT UPLOAD
// =============================================================

exports.upload = upload;