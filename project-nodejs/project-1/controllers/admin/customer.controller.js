const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const User = require('../../models/user.model');
const Order = require('../../models/order.model');

const PAGE_SIZE = 10;

const USER_STATUS_LABELS = {
    active: 'Hoạt động',
    inactive: 'Tạm dừng'
};

const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

// =============================================================
// CẤU HÌNH GITHUB
// =============================================================

const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: 'project-nodejs/project-1/public/uploads/customers/'
};

// =============================================================
// UPLOAD ẢNH ĐẠI DIỆN - TÊN FILE NGẪU NHIÊN
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/customers'));
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
                message: `Upload avatar: ${fileName}`,
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
        
        console.log('✅ Uploaded avatar to GitHub:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;
        
    } catch (error) {
        console.error('❌ Upload to GitHub failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

function parseVNDate(str) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
}

function normalizeIds(ids) {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

function getUserId(req) {
    return req.session.user?.id || req.session.user?._id || null;
}

// =============================================================
// DANH SÁCH KHÁCH HÀNG
// =============================================================

exports.index = async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const status = (req.query.status || '').trim();
        const fromDate = (req.query.fromDate || '').trim();
        const toDate = (req.query.toDate || '').trim();
        const page = parseInt(req.query.page) || 1;

        // ✅ Chỉ lấy khách hàng chưa bị xóa mềm (giống categories/tours)
        const filter = { role: 'customer', isDeleted: { $ne: true } };

        if (keyword) {
            filter.$or = [
                { fullName: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (status === 'active' || status === 'inactive') {
            filter.status = status;
        }

        const from = parseVNDate(fromDate);
        const to = parseVNDate(toDate);

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = from;
            if (to) {
                const toEnd = new Date(to);
                toEnd.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toEnd;
            }
        }

        const totalCustomers = await User.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalCustomers / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const usersRaw = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const userIds = usersRaw.map(function (u) { return u._id; });

        const orderStats = await Order.aggregate([
            { $match: { user: { $in: userIds }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$user',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' }
                }
            }
        ]);

        const statsMap = {};
        orderStats.forEach(function (item) {
            statsMap[item._id.toString()] = item;
        });

        const customers = usersRaw.map(function (user) {
            const stat = statsMap[user._id.toString()];
            return {
                id: user._id,
                name: user.fullName,
                phone: user.phone || '',
                email: user.email,
                address: user.address || '',
                avatar: user.avatar || '/admin/image/no-image.png',
                status: user.status || 'active',
                statusLabel: USER_STATUS_LABELS[user.status] || USER_STATUS_LABELS.active,
                totalOrders: stat ? stat.totalOrders : 0,
                totalSpent: stat ? stat.totalSpent : 0,
                joinedAt: user.createdAt.toLocaleDateString('vi-VN')
            };
        });

        let baseUrl = '/admin/customers?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';
        if (status) baseUrl += 'status=' + encodeURIComponent(status) + '&';
        if (fromDate) baseUrl += 'fromDate=' + encodeURIComponent(fromDate) + '&';
        if (toDate) baseUrl += 'toDate=' + encodeURIComponent(toDate) + '&';

        res.render('admin/pages/customers/customer-list', {
            activeMenu: 'customers',
            customers,
            currentPage,
            totalPages,
            baseUrl,
            keyword,
            status,
            // ✅ FIX: truyền Date đã parse (from/to) thay vì chuỗi "dd/mm/yyyy" thô,
            // vì new Date("dd/mm/yyyy") trong view bị hiểu nhầm thành mm/dd/yyyy
            // -> Invalid Date -> ô ngày hiển thị trống sau khi submit lọc.
            fromDate: from,
            toDate: to,
            pageTitle: 'Quản Lý Khách Hàng'
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/customers/customer-list', {
            activeMenu: 'customers',
            customers: [],
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/customers?',
            keyword: '',
            status: '',
            fromDate: '',
            toDate: '',
            pageTitle: 'Quản Lý Khách Hàng'
        });
    }
};

// =============================================================
// TRANG CHI TIẾT KHÁCH HÀNG
// =============================================================

exports.detail = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'customer', isDeleted: { $ne: true } });

        if (!user) {
            return res.redirect('/admin/customers');
        }

        const ordersRaw = await Order.find({ user: user._id })
            .populate('tour')
            .sort({ createdAt: -1 });

        const orders = ordersRaw.map(function (order) {
            return {
                id: order._id,
                code: order.code,
                tourName: order.tour ? order.tour.name : 'N/A',
                total: order.total,
                status: order.status,
                statusLabel: STATUS_LABELS[order.status] || order.status,
                createdAt: order.createdAt.toLocaleDateString('vi-VN')
            };
        });

        const totalSpent = ordersRaw
            .filter(function (o) { return o.status !== 'cancelled'; })
            .reduce(function (sum, o) { return sum + o.total; }, 0);

        const customer = {
            id: user._id,
            name: user.fullName,
            phone: user.phone,
            email: user.email,
            address: user.address || '',
            avatar: user.avatar || '/admin/image/no-image.png',
            status: user.status || 'active',
            statusLabel: USER_STATUS_LABELS[user.status] || USER_STATUS_LABELS.active,
            joinedAt: user.createdAt.toLocaleDateString('vi-VN'),
            totalOrders: orders.length,
            totalSpent: totalSpent
        };

        res.render('admin/pages/customers/customer-detail', {
            activeMenu: 'customers',
            customer,
            orders,
            pageTitle: 'Chi Tiết Khách Hàng'
        });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/customers');
    }
};

// =============================================================
// TRANG SỬA KHÁCH HÀNG
// =============================================================

exports.editPage = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'customer', isDeleted: { $ne: true } });

        if (!user) {
            return res.redirect('/admin/customers');
        }

        const customer = {
            id: user._id,
            name: user.fullName,
            phone: user.phone,
            email: user.email,
            address: user.address || '',
            avatar: user.avatar || '/admin/image/no-image.png',
            status: user.status || 'active',
            role: user.role || 'customer'
        };

        res.render('admin/pages/customers/customer-edit', {
            activeMenu: 'customers',
            customer,
            // ✅ Chỉ admin mới được phép sửa role (kiểm tra thêm ở view lẫn controller.edit)
            currentUserRole: req.session.user?.role || null,
            pageTitle: 'Sửa Khách Hàng'
        });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/customers');
    }
};

// =============================================================
// CẬP NHẬT KHÁCH HÀNG - UPLOAD ẢNH LÊN GITHUB
// =============================================================

exports.edit = async (req, res) => {
    try {
        const body = req.body;
        const userId = req.params.id;

        console.log('========================================');
        console.log('📝 UPDATE CUSTOMER - DỮ LIỆU NHẬN ĐƯỢC:');
        console.log('  - name:', body.name);
        console.log('  - phone:', body.phone);
        console.log('  - email:', body.email);
        console.log('  - address:', body.address);
        console.log('  - status:', body.status);
        console.log('  - File:', req.file);
        console.log('========================================');

        // Kiểm tra user tồn tại (và chưa bị xóa)
        const existingUser = await User.findOne({ _id: userId, role: 'customer', isDeleted: { $ne: true } });
        if (!existingUser) {
            return res.redirect('/admin/customers');
        }

        const updateData = {
            fullName: body.name,
            phone: body.phone,
            email: body.email,
            address: body.address || '',
            status: body.status === 'inactive' ? 'inactive' : 'active',
            updatedBy: getUserId(req)
        };

        // ✅ CHỈ ADMIN MỚI ĐƯỢC PHÉP SỬA ROLE
        // (cho phép gán một role mới chưa từng tồn tại trong hệ thống,
        // miễn schema User.role không giới hạn bằng enum cố định)
        const currentUserRole = req.session.user?.role;
        if (currentUserRole === 'admin' && typeof body.role === 'string' && body.role.trim()) {
            updateData.role = body.role.trim();
        }

        // Xử lý upload ảnh đại diện
        let avatarUrl = null;
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading avatar to GitHub:', fileName);
            console.log('📁 Local path:', localPath);
            
            // Upload lên GitHub
            avatarUrl = await uploadToGitHub(localPath, fileName);
            
            if (avatarUrl) {
                updateData.avatar = avatarUrl;
                console.log('✅ Updated avatar URL to GitHub:', avatarUrl);
                
                // Xóa ảnh local sau khi upload thành công
                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Đã xóa ảnh local:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Không thể xóa ảnh local:', unlinkError.message);
                }
            } else {
                // Fallback: giữ ảnh local
                updateData.avatar = '/uploads/customers/' + fileName;
                console.warn('⚠️ GitHub upload failed, keeping local avatar.');
            }
        }

        await User.findByIdAndUpdate(userId, updateData);

        req.flash2('success', 'Cập nhật khách hàng thành công!');
        res.redirect('/admin/customers/' + userId);

    } catch (error) {
        console.error('❌ UPDATE CUSTOMER ERROR:', error);
        req.flash2('error', 'Có lỗi xảy ra khi cập nhật khách hàng.');
        res.redirect('/admin/customers/' + req.params.id + '/edit');
    }
};

// =============================================================
// HÀNH ĐỘNG HÀNG LOẠT (danh sách chính)
// =============================================================

exports.bulkAction = async (req, res) => {
    try {
        // Chấp nhận cả "bulkAction" (chuẩn giống categories/tours) lẫn "action" (tên cũ) để không phá view hiện tại
        const bulkAction = req.body.bulkAction || req.body.action;
        const ids = normalizeIds(req.body.ids);
        const userId = getUserId(req);

        if (ids.length === 0) {
            req.flash2('error', 'Vui lòng chọn ít nhất một khách hàng.');
            return res.redirect('/admin/customers');
        }

        switch (bulkAction) {
            case 'activate':
                await User.updateMany(
                    { _id: { $in: ids }, role: 'customer' },
                    { status: 'active', updatedBy: userId }
                );
                req.flash2('success', `Đã kích hoạt ${ids.length} khách hàng.`);
                break;
            case 'deactivate':
                await User.updateMany(
                    { _id: { $in: ids }, role: 'customer' },
                    { status: 'inactive', updatedBy: userId }
                );
                req.flash2('success', `Đã tạm dừng ${ids.length} khách hàng.`);
                break;
            case 'delete':
                await User.updateMany(
                    { _id: { $in: ids }, role: 'customer' },
                    { isDeleted: true, deletedAt: new Date(), deletedBy: userId }
                );
                req.flash2('success', `Đã chuyển ${ids.length} khách hàng vào thùng rác.`);
                break;
            default:
                req.flash2('error', 'Hành động không hợp lệ.');
                break;
        }

        res.redirect('/admin/customers');
    } catch (error) {
        console.error('❌ CUSTOMER BULK ACTION ERROR:', error);
        req.flash2('error', 'Có lỗi xảy ra khi thực hiện hành động hàng loạt.');
        res.redirect('/admin/customers');
    }
};

// =============================================================
// XÓA MỀM (Chuyển vào thùng rác) - TRẢ VỀ JSON
// =============================================================

exports.delete = async (req, res) => {
    try {
        const userId = getUserId(req);
        const customer = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'customer' },
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId
            },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }

        res.status(200).json({ success: true, message: 'Đã chuyển khách hàng vào thùng rác!' });
    } catch (error) {
        console.error('❌ DELETE CUSTOMER ERROR:', error);
        res.status(500).json({ success: false, message: 'Xóa thất bại!' });
    }
};

// =============================================================
// THÙNG RÁC KHÁCH HÀNG - DANH SÁCH
// =============================================================

exports.trash = async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = { role: 'customer', isDeleted: true };
        if (keyword) {
            filter.$or = [
                { fullName: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        const totalCustomers = await User.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalCustomers / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const usersRaw = await User.find(filter)
            .populate('deletedBy')
            .sort({ deletedAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const customers = usersRaw.map(function (user) {
            return {
                id: user._id,
                name: user.fullName,
                phone: user.phone || '',
                email: user.email,
                avatar: user.avatar || '/admin/image/no-image.png',
                status: user.status || 'active',
                statusLabel: USER_STATUS_LABELS[user.status] || USER_STATUS_LABELS.active,
                deletedByName: user.deletedBy ? user.deletedBy.fullName : 'N/A',
                deletedAt: user.deletedAt ? new Date(user.deletedAt).toLocaleString('vi-VN') : ''
            };
        });

        const baseUrl = keyword
            ? '/admin/customers/trash?keyword=' + encodeURIComponent(keyword)
            : '/admin/customers/trash?';

        res.render('admin/pages/customers/customer-trash', {
            activeMenu: 'customers',
            customers,
            filter: { keyword },
            currentPage,
            totalPages,
            baseUrl,
            pageTitle: 'Thùng Rác Khách Hàng'
        });
    } catch (error) {
        console.error('❌ CUSTOMER TRASH ERROR:', error);
        res.render('admin/pages/customers/customer-trash', {
            activeMenu: 'customers',
            customers: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/customers/trash?',
            pageTitle: 'Thùng Rác Khách Hàng'
        });
    }
};

// =============================================================
// KHÔI PHỤC TỪ THÙNG RÁC
// =============================================================

exports.restore = async (req, res) => {
    try {
        const customer = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'customer' },
            {
                $set: { isDeleted: false },
                $unset: { deletedAt: '', deletedBy: '' }
            },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }

        res.status(200).json({ success: true, message: 'Khôi phục thành công!' });
    } catch (error) {
        console.error('❌ RESTORE CUSTOMER ERROR:', error);
        res.status(500).json({ success: false, message: 'Khôi phục thất bại!' });
    }
};

// =============================================================
// XÓA VĨNH VIỄN
// =============================================================

exports.forceDelete = async (req, res) => {
    try {
        const result = await User.deleteOne({ _id: req.params.id, role: 'customer', isDeleted: true });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }
        res.status(200).json({ success: true, message: 'Xóa vĩnh viễn thành công!' });
    } catch (error) {
        console.error('❌ FORCE DELETE CUSTOMER ERROR:', error);
        res.status(500).json({ success: false, message: 'Xóa vĩnh viễn thất bại!' });
    }
};

// =============================================================
// HÀNH ĐỘNG HÀNG LOẠT TRONG THÙNG RÁC
// =============================================================

exports.bulkTrashAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length === 0) {
            req.flash2('error', 'Vui lòng chọn ít nhất một khách hàng.');
            return res.redirect('/admin/customers/trash');
        }

        if (bulkAction === 'restore') {
            await User.updateMany(
                { _id: { $in: ids }, role: 'customer' },
                { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
            );
            req.flash2('success', `Đã khôi phục ${ids.length} khách hàng.`);
        } else if (bulkAction === 'delete') {
            await User.deleteMany({ _id: { $in: ids }, role: 'customer' });
            req.flash2('success', `Đã xóa vĩnh viễn ${ids.length} khách hàng.`);
        } else {
            req.flash2('error', 'Hành động không hợp lệ.');
        }

        res.redirect('/admin/customers/trash');
    } catch (error) {
        console.error('❌ CUSTOMER BULK TRASH ACTION ERROR:', error);
        req.flash2('error', 'Có lỗi xảy ra khi thực hiện hành động hàng loạt.');
        res.redirect('/admin/customers/trash');
    }
};

// =============================================================
// EXPORT UPLOAD
// =============================================================

exports.upload = upload;

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
