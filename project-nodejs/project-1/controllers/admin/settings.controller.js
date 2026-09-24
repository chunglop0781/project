// =============================================================
// controllers/admin/settings.controller.js
// =============================================================

const Website = require('../../models/website.model');
const User = require('../../models/user.model');
const Role = require('../../models/role.model');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const axios = require('axios');


// =============================================================
// GITHUB CONFIG
// =============================================================

const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: process.env.GITHUB_WEBSITE_PATH
        || 'project-nodejs/project-1/public/uploads/website/'
};

console.log('🐙 [SETTINGS] GITHUB_CONFIG loaded:', {
    owner: GITHUB_CONFIG.owner,
    repo: GITHUB_CONFIG.repo,
    branch: GITHUB_CONFIG.branch,
    path: GITHUB_CONFIG.path,
    token: GITHUB_CONFIG.token ? '✅ có' : '❌ THIẾU'
});


// =============================================================
// UPLOAD LÊN GITHUB
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    console.log('🐙 [GH] Bắt đầu upload:', fileName);

    if (!fs.existsSync(filePath)) {
        console.warn('⚠️ [GH] File not found:', filePath);
        return null;
    }
    if (!process.env.GITHUB_TOKEN) {
        console.warn('⚠️ [GH] GITHUB_TOKEN MISSING');
        return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentBase64 = fileBuffer.toString('base64');
    const githubPath = `${GITHUB_CONFIG.path}${fileName}`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPath}`;

    console.log('🐙 [GH] URL   :', apiUrl);
    console.log('🐙 [GH] Branch:', GITHUB_CONFIG.branch);
    console.log('🐙 [GH] Size  :', fileBuffer.length, 'bytes');

    try {
        const response = await axios.put(
            apiUrl,
            {
                message: `Upload website asset: ${fileName}`,
                content: contentBase64,
                branch: GITHUB_CONFIG.branch
            },
            {
                headers: {
                    Authorization: `token ${GITHUB_CONFIG.token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        console.log('✅ [GH] OK:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;
    } catch (error) {
        console.error('❌ [GH] FAILED');
        console.error('   Status :', error.response?.status);
        console.error('   Message:', error.response?.data?.message);
        console.error('   Docs   :', error.response?.data?.documentation_url);
        return null;
    }
}

async function uploadImage(filePath, fileName) {
    return await uploadToGitHub(filePath, fileName);
}


// =============================================================
// DANH SÁCH QUYỀN
// =============================================================

const rolePermissions = [
    {
        value: 'dashboard.view',
        label: 'Xem trang Tổng quan'
    },
    {
        value: 'categories.view',
        label: 'Xem danh mục'
    },
    {
        value: 'categories.create',
        label: 'Tạo danh mục'
    },
    {
        value: 'categories.edit',
        label: 'Sửa danh mục'
    },
    {
        value: 'categories.delete',
        label: 'Xóa danh mục'
    },
    {
        value: 'tours.view',
        label: 'Xem tour'
    },
    {
        value: 'tours.create',
        label: 'Tạo tour'
    },
    {
        value: 'tours.edit',
        label: 'Sửa tour'
    },
    {
        value: 'tours.delete',
        label: 'Xóa tour'
    },
    {
        value: 'orders.view',
        label: 'Xem đơn hàng'
    },
    {
        value: 'orders.create',
        label: 'Tạo đơn hàng'
    },
    {
        value: 'orders.edit',
        label: 'Sửa đơn hàng'
    },
    {
        value: 'orders.delete',
        label: 'Xóa đơn hàng'
    }
];


// =============================================================
// ROLE HỢP LỆ
// =============================================================

const allowedRoles = [
    'customer',
    'admin',
    'tour-manager',
    'order-manager'
];


// =============================================================
// ROLE QUẢN TRỊ
// =============================================================

const adminRoles = [
    'admin',
    'tour-manager',
    'order-manager'
];


// =============================================================
// TRANG CÀI ĐẶT CHUNG
// =============================================================

exports.general = (req, res) => {

    res.render(
        'admin/pages/settings/settings-general',
        {
            activeMenu: 'settings'
        }
    );

};


// =============================================================
// DANH SÁCH TÀI KHOẢN QUẢN TRỊ
// =============================================================

exports.accounts = async (req, res) => {

    try {

        const accounts =
            await User.find({
                role: {
                    $in: adminRoles
                }
            })
            .sort({
                createdAt: -1
            });

        console.log(
            'ACCOUNTS FROM DATABASE:',
            accounts
        );

        res.render(
            'admin/pages/settings/accounts',
            {
                accounts,
                activeMenu: 'settings'
            }
        );

    } catch (error) {

        console.error(
            'LỖI LOAD ACCOUNTS:',
            error
        );

        res.status(500).render(
            'admin/pages/settings/accounts',
            {
                accounts: [],
                activeMenu: 'settings',
                error:
                    'Không thể tải danh sách tài khoản.'
            }
        );

    }

};


// =============================================================
// TRANG TẠO TÀI KHOẢN QUẢN TRỊ
// =============================================================

exports.accountsCreate = (req, res) => {

    res.render(
        'admin/pages/settings/accounts-create',
        {
            activeMenu: 'settings'
        }
    );

};


// =============================================================
// XỬ LÝ TẠO TÀI KHOẢN
// =============================================================

exports.accountsCreatePost = async (req, res) => {

    try {

        const {
            fullName,
            email,
            phone,
            position,
            role,
            status,
            address,
            password,
            avatar
        } = req.body;

        // =====================================================
        // ROLE
        // =====================================================

        let userRole = 'customer';

        if (
            role &&
            allowedRoles.includes(role)
        ) {
            userRole = role;
        }

        // =====================================================
        // PASSWORD
        // =====================================================

        if (
            !password ||
            password.trim() === ''
        ) {

            return res.status(400).render(
                'admin/pages/settings/accounts-create',
                {
                    activeMenu: 'settings',
                    error:
                        'Vui lòng nhập mật khẩu.'
                }
            );

        }

        // =====================================================
        // HASH PASSWORD
        // =====================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        // =====================================================
        // TẠO USER
        // =====================================================

        const account =
            await User.create({

                fullName:
                    fullName || '',

                email:
                    email || '',

                phone:
                    phone || '',

                password:
                    hashedPassword,

                address:
                    address || '',

                avatar:
                    avatar || '',

                position:
                    position || '',

                status:
                    status || 'active',

                role:
                    userRole

            });

        console.log(
            'TẠO ACCOUNT THÀNH CÔNG:',
            account
        );

        res.redirect(
            '/admin/settings/accounts'
        );

    } catch (error) {

        console.error(
            'LỖI TẠO ACCOUNT:',
            error
        );

        let errorMessage =
            'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.';

        // =====================================================
        // EMAIL TRÙNG
        // =====================================================

        if (
            error.code === 11000
        ) {
            errorMessage =
                'Email này đã tồn tại trong hệ thống.';
        }

        res.status(500).render(
            'admin/pages/settings/accounts-create',
            {
                activeMenu: 'settings',
                error: errorMessage
            }
        );

    }

};


// =============================================================
// TRANG SỬA TÀI KHOẢN
// =============================================================

exports.accountsEdit = async (req, res) => {

    try {

        const account =
            await User.findOne({

                _id: req.params.id,

                role: {
                    $in: adminRoles
                }

            });

        if (!account) {

            return res.status(404).send(
                'Không tìm thấy tài khoản quản trị.'
            );

        }

        res.render(
            'admin/pages/settings/accounts-edit',
            {
                account,
                activeMenu: 'settings'
            }
        );

    } catch (error) {

        console.error(
            'LỖI ACCOUNT EDIT:',
            error
        );

        res.status(500).send(
            'Lỗi khi tải tài khoản.'
        );

    }

};


// =============================================================
// XỬ LÝ SỬA TÀI KHOẢN
// =============================================================

exports.accountsEditPost = async (req, res) => {

    try {

        // =====================================================
        // LẤY ROLE
        // =====================================================

        let userRole = req.body.role;

        // =====================================================
        // NẾU ROLE KHÔNG HỢP LỆ
        // => GIỮ ADMIN
        // =====================================================

        if (
            !userRole ||
            !allowedRoles.includes(userRole)
        ) {
            userRole = 'admin';
        }

        // =====================================================
        // DATA CẦN UPDATE
        // =====================================================

        const updateData = {

            fullName:
                req.body.fullName || '',

            email:
                req.body.email || '',

            phone:
                req.body.phone || '',

            position:
                req.body.position || '',

            role:
                userRole,

            status:
                req.body.status || 'active',

            address:
                req.body.address || '',

            avatar:
                req.body.avatar || ''

        };

        // =====================================================
        // PASSWORD
        // =====================================================

        if (
            req.body.password &&
            req.body.password.trim() !== ''
        ) {
            updateData.password =
                await bcrypt.hash(
                    req.body.password,
                    10
                );
        }

        // =====================================================
        // UPDATE DATABASE
        // =====================================================

        const account =
            await User.findOneAndUpdate(

                {
                    _id: req.params.id,

                    role: {
                        $in: adminRoles
                    }

                },

                updateData,

                {
                    new: true,
                    runValidators: true
                }

            );

        if (!account) {

            return res.status(404).send(
                'Không tìm thấy tài khoản quản trị.'
            );

        }

        console.log(
            'ACCOUNT UPDATED:',
            account
        );

        res.redirect(
            '/admin/settings/accounts'
        );

    } catch (error) {

        console.error(
            'LỖI UPDATE ACCOUNT:',
            error
        );

        let errorMessage =
            'Lỗi khi cập nhật tài khoản.';

        if (
            error.code === 11000
        ) {
            errorMessage =
                'Email này đã tồn tại trong hệ thống.';
        }

        res.status(500).send(
            errorMessage
        );

    }

};


// =============================================================
// XÓA TÀI KHOẢN
// =============================================================

exports.accountsDelete = async (req, res) => {

    try {

        const account =
            await User.findOneAndDelete({

                _id: req.params.id,

                role: {
                    $in: adminRoles
                }

            });

        if (!account) {

            return res.status(404).send(
                'Không tìm thấy tài khoản cần xóa.'
            );

        }

        console.log(
            'ACCOUNT DELETED:',
            account.email
        );

        res.redirect(
            '/admin/settings/accounts'
        );

    } catch (error) {

        console.error(
            'LỖI DELETE ACCOUNT:',
            error
        );

        res.status(500).send(
            'Lỗi khi xóa tài khoản.'
        );

    }

};


// =============================================================
// THÔNG TIN WEBSITE
// =============================================================

exports.website = async (req, res) => {

    try {

        const website =
            await Website.findOne();

        res.render(
            'admin/pages/settings/settings-website',
            {
                website,
                activeMenu: 'settings'
            }
        );

    } catch (error) {

        console.error(
            'LỖI LOAD WEBSITE:',
            error
        );

        res.status(500).render(
            'admin/pages/settings/settings-website',
            {
                website: null,
                activeMenu: 'settings',
                error:
                    'Không thể tải thông tin website.'
            }
        );

    }

};


// =============================================================
// XỬ LÝ CẬP NHẬT WEBSITE (UPLOAD LOGO + FAVICON LÊN GITHUB)
// =============================================================

exports.updateWebsite = async (req, res) => {
    try {
        // ===== DEBUG =====
        console.log('🔍 UPDATE WEBSITE CALLED');
        console.log('   req.files keys:', req.files ? Object.keys(req.files) : 'KHÔNG CÓ');
        console.log('   logo file:', req.files?.logo?.[0]?.filename || 'không có');
        console.log('   favicon file:', req.files?.favicon?.[0]?.filename || 'không có');
        // =================

        const { name, phone, email, address } = req.body;
        const update = { name, phone, email, address };

        // Mảng gom thông báo
        const githubSuccess = [];
        const githubFailed = [];

        // ============ LOGO ============
        if (req.files?.logo?.[0]) {
            const file = req.files.logo[0];
            const githubUrl = await uploadImage(file.path, file.filename);

            if (githubUrl) {
                update.logo = githubUrl;
                try { fs.unlinkSync(file.path); } catch (e) {}
                console.log('✅ Logo → GitHub:', githubUrl);
                githubSuccess.push('Logo');
            } else {
                update.logo = '/uploads/' + file.filename;
                console.log('⚠️ Logo → local fallback:', update.logo);
                githubFailed.push({
                    name: 'Logo',
                    localPath: '/uploads/' + file.filename
                });
            }
        }

        // ============ FAVICON ============
        if (req.files?.favicon?.[0]) {
            const file = req.files.favicon[0];
            const githubUrl = await uploadImage(file.path, file.filename);

            if (githubUrl) {
                update.favicon = githubUrl;
                try { fs.unlinkSync(file.path); } catch (e) {}
                console.log('✅ Favicon → GitHub:', githubUrl);
                githubSuccess.push('Favicon');
            } else {
                update.favicon = '/uploads/' + file.filename;
                console.log('⚠️ Favicon → local fallback:', update.favicon);
                githubFailed.push({
                    name: 'Favicon',
                    localPath: '/uploads/' + file.filename
                });
            }
        }

        // ============ LƯU DB ============
        await Website.findOneAndUpdate(
            {},
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // =====================================================
        // FLASH MESSAGE — THÔNG BÁO CHO USER
        // =====================================================

        // Trường hợp 1: Có file upload lên GitHub thành công (hết)
        if (githubSuccess.length > 0 && githubFailed.length === 0) {
            req.flash2(
                'success',
                `✅ Cập nhật thành công! ${githubSuccess.join(' & ')} đã upload lên GitHub.`
            );
        }

        // Trường hợp 2: Có file upload GitHub thất bại → lưu local
        else if (githubFailed.length > 0 && githubSuccess.length === 0) {
            const names = githubFailed.map(f => f.name).join(' & ');
            const paths = githubFailed.map(f => f.localPath).join(', ');
            req.flash2(
                'error',
                `⚠️ ${names} upload lên GitHub thất bại — đã lưu tạm vào local (${paths}). ` +
                `Ảnh này sẽ MẤT khi chuyển server. Vui lòng kiểm tra token GitHub!`
            );
        }

        // Trường hợp 3: Có cả thành công lẫn thất bại
        else if (githubFailed.length > 0 && githubSuccess.length > 0) {
            const failNames = githubFailed.map(f => f.name).join(' & ');
            req.flash2(
                'error',
                `⚠️ ${githubSuccess.join(' & ')} đã lên GitHub. ` +
                `Nhưng ${failNames} upload thất bại — lưu tạm vào local, sẽ MẤT khi chuyển server!`
            );
        }

        // Trường hợp 4: Không có file upload (chỉ sửa text)
        else {
            req.flash2('success', '✅ Cập nhật thông tin website thành công!');
        }

        res.redirect('/admin/settings/websiteInfo');

    } catch (error) {
        console.error('❌ LỖI UPDATE WEBSITE:', error);
        req.flash2('error', '❌ Có lỗi xảy ra, vui lòng thử lại.');
        res.redirect('/admin/settings/websiteInfo');
    }
};


// =============================================================
// DANH SÁCH NHÓM QUYỀN
// =============================================================

exports.roles = async (req, res) => {

    try {

        const roles =
            await Role.find({})
                .sort({
                    createdAt: -1
                });

        console.log(
            'ROLES FROM DATABASE:',
            roles
        );

        res.render(
            'admin/pages/settings/role-list',
            {
                roles,
                activeMenu: 'settings'
            }
        );

    } catch (error) {

        console.error(
            'LỖI LOAD ROLES:',
            error
        );

        res.status(500).render(
            'admin/pages/settings/role-list',
            {
                roles: [],
                activeMenu: 'settings',
                error:
                    'Không thể tải danh sách nhóm quyền.'
            }
        );

    }

};


// =============================================================
// TRANG TẠO NHÓM QUYỀN
// =============================================================

exports.roleCreate = (req, res) => {

    res.render(
        'admin/pages/settings/role-edit',
        {
            role: {
                name: '',
                description: '',
                permissions: []
            },

            permissions:
                rolePermissions,

            isEdit:
                false,

            activeMenu:
                'settings'
        }
    );

};


// =============================================================
// XỬ LÝ TẠO NHÓM QUYỀN
// =============================================================

exports.roleCreatePost = async (req, res) => {

    try {

        let permissions =
            req.body.permissions || [];

        // =====================================================
        // STRING -> ARRAY
        // =====================================================

        if (
            !Array.isArray(permissions)
        ) {
            permissions = [permissions];
        }

        const role =
            await Role.create({

                name:
                    req.body.name,

                description:
                    req.body.description || '',

                permissions,

                status:
                    'active'

            });

        console.log(
            'ROLE CREATED:',
            role
        );

        res.redirect(
            '/admin/settings/roles'
        );

    } catch (error) {

        console.error(
            'LỖI TẠO ROLE:',
            error
        );

        let permissions =
            req.body.permissions || [];

        if (
            !Array.isArray(permissions)
        ) {
            permissions = [permissions];
        }

        res.status(500).render(
            'admin/pages/settings/role-edit',
            {
                role: {
                    name:
                        req.body.name || '',

                    description:
                        req.body.description || '',

                    permissions
                },

                permissions:
                    rolePermissions,

                isEdit:
                    false,

                activeMenu:
                    'settings',

                error:
                    'Không thể tạo nhóm quyền.'
            }
        );

    }

};


// =============================================================
// TRANG SỬA NHÓM QUYỀN
// =============================================================

exports.roleEdit = async (req, res) => {

    try {

        const id =
            req.params.id;

        console.log(
            'ID NHÓM QUYỀN:',
            id
        );

        const role =
            await Role.findById(id);

        if (!role) {

            return res.status(404).send(
                'Không tìm thấy nhóm quyền.'
            );

        }

        res.render(
            'admin/pages/settings/role-edit',
            {
                role,

                permissions:
                    rolePermissions,

                isEdit:
                    true,

                activeMenu:
                    'settings'
            }
        );

    } catch (error) {

        console.error(
            'LỖI ROLE EDIT:',
            error
        );

        res.status(500).send(
            'Lỗi khi tải nhóm quyền.'
        );

    }

};


// =============================================================
// XỬ LÝ SỬA NHÓM QUYỀN
// =============================================================

exports.roleEditPost = async (req, res) => {

    try {

        let permissions =
            req.body.permissions || [];

        // =====================================================
        // STRING -> ARRAY
        // =====================================================

        if (
            !Array.isArray(permissions)
        ) {
            permissions = [permissions];
        }

        const role =
            await Role.findByIdAndUpdate(

                req.params.id,

                {
                    name:
                        req.body.name,

                    description:
                        req.body.description || '',

                    permissions
                },

                {
                    new: true,
                    runValidators: true
                }

            );

        if (!role) {

            return res.status(404).send(
                'Không tìm thấy nhóm quyền.'
            );

        }

        console.log(
            'ROLE UPDATED:',
            role
        );

        res.redirect(
            '/admin/settings/roles'
        );

    } catch (error) {

        console.error(
            'LỖI UPDATE ROLE:',
            error
        );

        res.status(500).send(
            'Lỗi khi cập nhật nhóm quyền.'
        );

    }

};