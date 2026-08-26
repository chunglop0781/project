const bcrypt = require('bcrypt'); // giống login.route.js (admin) - KHÔNG dùng bcryptjs
const User = require('../../models/user.model');
const changePassword = require('../auth/change-password.controller');

// =============================================================
// TRANG HỒ SƠ CÁ NHÂN - profile.pug
// =============================================================

exports.detail = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);

        if (!user) {
            return req.session.destroy(() => res.redirect('/admin/login'));
        }

        res.render('admin/pages/profile', {
            user,
            pageTitle: 'Hồ sơ cá nhân'
        });

    } catch (error) {
        console.log(error);

        res.render('admin/pages/profile', {
            user: req.session.user,
            pageTitle: 'Hồ sơ cá nhân',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// Cập nhật fullName / phone
// (email KHÔNG cho sửa ở đây vì đang là định danh đăng nhập - login.route.js
// tìm user bằng User.findOne({ email: username }))

exports.update = async (req, res) => {
    try {
        const { fullName, phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            {
                fullName,
                phone
            },
            {
                new: true
            }
        );

        // Đồng bộ lại session để header/topbar hiển thị tên mới ngay,
        // không cần đăng nhập lại
        req.session.user.fullName = user.fullName;

        res.render('admin/pages/profile', {
            user,
            pageTitle: 'Hồ sơ cá nhân',
            success: 'Cập nhật hồ sơ thành công.'
        });

    } catch (error) {
        console.log(error);

        const user =
            await User.findById(req.session.user.id);

        res.render('admin/pages/profile', {
            user,
            pageTitle: 'Hồ sơ cá nhân',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// Đổi mật khẩu (cùng quy tắc với /change-password phía client:
// yêu cầu mật khẩu hiện tại đúng, mật khẩu mới >= 6 ký tự, xác nhận khớp)

exports.updatePassword = async (req, res) => {
    try {

        // =============================================================
        // GỌI CONTROLLER ĐỔI MẬT KHẨU DÙNG CHUNG
        // =============================================================

        if (changePassword) {
            return await changePassword(req, res, {
                clientView: 'client/pages/change-password',
                adminView: 'admin/pages/profile'
            });
        }

        // =============================================================
        // CODE CŨ - GIỮ NGUYÊN
        // =============================================================

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        const user =
            await User.findById(req.session.user.id);

        if (!user) {
            return res.redirect('/admin/login');
        }

        const isMatch =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isMatch) {
            return res.render('admin/pages/profile', {
                user,
                pageTitle: 'Hồ sơ cá nhân',
                error: 'Mật khẩu hiện tại không đúng.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('admin/pages/profile', {
                user,
                pageTitle: 'Hồ sơ cá nhân',
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }

        if (newPassword.length < 6) {
            return res.render('admin/pages/profile', {
                user,
                pageTitle: 'Hồ sơ cá nhân',
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            });
        }

        user.password =
            await bcrypt.hash(
                newPassword,
                10
            );

        await user.save();

        res.render('admin/pages/profile', {
            user,
            pageTitle: 'Hồ sơ cá nhân',
            success: 'Đổi mật khẩu thành công.'
        });

    } catch (error) {
        console.log(error);

        const user =
            await User.findById(req.session.user.id);

        res.render('admin/pages/profile', {
            user,
            pageTitle: 'Hồ sơ cá nhân',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};