const nodemailer = require('nodemailer');

// TODO: thêm 2 biến này vào file .env
//   EMAIL_USER=your-email@gmail.com
//   EMAIL_PASS=your-app-password   (App Password của Gmail, KHÔNG phải mật khẩu Gmail thường)
//
// Cách tạo App Password (Gmail):
//   1. Bật xác minh 2 bước cho tài khoản Google
//   2. Vào https://myaccount.google.com/apppasswords
//   3. Tạo App Password mới -> copy vào EMAIL_PASS

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Sinh mã OTP 6 chữ số
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi email chứa mã OTP
async function sendOtpEmail(toEmail, otp) {
    await transporter.sendMail({
        from: `"28 Travel" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Mã OTP đặt lại mật khẩu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Đặt lại mật khẩu</h2>
                <p>Mã OTP của bạn là:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
                <p>Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            </div>
        `
    });
}

module.exports = { generateOtp, sendOtpEmail };
