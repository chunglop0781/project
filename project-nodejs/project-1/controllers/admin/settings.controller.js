const Website = require('../../models/website.model');
const User = require('../../models/user.model');
const Role = require('../../models/role.model');
const bcrypt = require('bcryptjs');


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
//
// customer       = tài khoản khách hàng bình thường
// admin          = quản trị viên
// tour-manager   = quản lý tour
// order-manager  = quản lý đơn hàng
//
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
//
// QUAN TRỌNG:
//
// Nếu không gửi role:
//     => customer
//
// Nếu gửi role hợp lệ:
//     => lưu role đó
//
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


        // =====================================================
        // REDIRECT
        // =====================================================

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


        // =====================================================
        // REDIRECT
        // =====================================================

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
// XỬ LÝ CẬP NHẬT WEBSITE
// =============================================================

exports.updateWebsite = async (req, res) => {

    try {

        const {
            name,
            phone,
            email,
            address
        } = req.body;


        const update = {

            name,

            phone,

            email,

            address

        };


        // =====================================================
        // LOGO
        // =====================================================

        if (
            req.files &&
            req.files.logo &&
            req.files.logo[0]
        ) {

            update.logo =
                '/uploads/' +
                req.files.logo[0].filename;

        }


        // =====================================================
        // FAVICON
        // =====================================================

        if (
            req.files &&
            req.files.favicon &&
            req.files.favicon[0]
        ) {

            update.favicon =
                '/uploads/' +
                req.files.favicon[0].filename;

        }


        await Website.findOneAndUpdate(
            {},
            update,
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );


        res.redirect(
            '/admin/settings/websiteInfo'
        );


    } catch (error) {

        console.error(
            'LỖI UPDATE WEBSITE:',
            error
        );


        const website =
            await Website.findOne();


        res.status(500).render(
            'admin/pages/settings/settings-website',
            {
                website,
                activeMenu: 'settings',
                error:
                    'Có lỗi xảy ra, vui lòng thử lại.'
            }
        );

    }

};


// =============================================================
// NHÓM QUYỀN
// =============================================================


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

            permissions = [
                permissions
            ];

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

            permissions = [
                permissions
            ];

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

            permissions = [
                permissions
            ];

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