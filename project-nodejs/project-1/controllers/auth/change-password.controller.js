const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');

const changePassword = async (req, res, next) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        const user = await User.findById(req.session.user._id);

        if (!user) {
            if (req.session.user.role === 'admin') {
                return req.session.destroy(() => {
                    res.redirect('/admin/login');
                });
            }

            return res.redirect('/login');
        }

        // ==============================
        // KIỂM TRA MẬT KHẨU HIỆN TẠI
        // ==============================
        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return next({
                type: 'CHANGE_PASSWORD_ERROR',
                message: 'Mật khẩu hiện tại không đúng.'
            });
        }

        // ==============================
        // KIỂM TRA MẬT KHẨU MỚI
        // ==============================
        if (newPassword !== confirmPassword) {
            return next({
                type: 'CHANGE_PASSWORD_ERROR',
                message: 'Mật khẩu xác nhận không khớp.'
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return next({
                type: 'CHANGE_PASSWORD_ERROR',
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            });
        }

        // Không cho đổi thành chính mật khẩu cũ
        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return next({
                type: 'CHANGE_PASSWORD_ERROR',
                message: 'Mật khẩu mới phải khác mật khẩu hiện tại.'
            });
        }

        // ==============================
        // HASH MẬT KHẨU MỚI
        // ==============================
        user.password = await bcrypt.hash(newPassword, 10);

        await user.save();

        return next({
            type: 'CHANGE_PASSWORD_SUCCESS',
            message: 'Đổi mật khẩu thành công.'
        });

    } catch (error) {
        console.error('CHANGE PASSWORD ERROR:', error);
        return next(error);
    }
};

module.exports = {
    changePassword
};