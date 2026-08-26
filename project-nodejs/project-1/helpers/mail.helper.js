// =============================================================
// IMPORT NODEMAILER
// =============================================================

const nodemailer = require('nodemailer');

// =============================================================
// TẠO TRANSPORTER GMAIL
// =============================================================

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.YOUR_GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// =============================================================
// KIỂM TRA CẤU HÌNH EMAIL
// =============================================================

const isEmailConfigured = () => {
    return !!(process.env.YOUR_GMAIL_ADDRESS && process.env.GMAIL_APP_PASSWORD);
};

// =============================================================
// GỬI EMAIL THÔNG THƯỜNG
// =============================================================

async function sendMail(toEmail, subject, content) {
    // Kiểm tra cấu hình email
    if (!isEmailConfigured()) {
        console.warn('⚠️ EMAIL NOT CONFIGURED: Vui lòng cấu hình YOUR_GMAIL_ADDRESS và GMAIL_APP_PASSWORD trong .env');
        console.log(`📧 [MOCK] Gửi email đến: ${toEmail}`);
        console.log(`📧 [MOCK] Subject: ${subject}`);
        return { messageId: 'mock-email-id', response: 'Mock email sent' };
    }

    const logoUrl = 'https://raw.githubusercontent.com/chunglop0781/project/refs/heads/main/project-nodejs/project-1/public/assets/image/logo.png';

    const mailOptions = {
        from: `28 Travel <${process.env.YOUR_GMAIL_ADDRESS}>`,
        to: toEmail,
        subject: subject,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            ">
                <!-- LOGO -->
                <div style="text-align: left; margin-bottom: 25px;">
                    <img
                        src="${logoUrl}"
                        alt="Website Du Lịch"
                        style="width: 120px; height: auto; display: block;"
                    >
                </div>

                <!-- NỘI DUNG EMAIL -->
                <div style="font-size: 16px; line-height: 1.6; color: #333333;">
                    ${content}
                </div>

                <!-- FOOTER -->
                <div style="
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #eeeeee;
                    font-size: 13px;
                    color: #888888;
                ">
                    <p>Email được gửi tự động từ hệ thống 28 Travel.</p>
                    <p>Vui lòng không trả lời email này.</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ EMAIL SENT:', info.response);
        return info;
    } catch (error) {
        console.error('❌ SEND EMAIL ERROR:', error.message);
        throw new Error(error.message || 'Gửi email thất bại.');
    }
}

// =============================================================
// SINH MÃ OTP 6 CHỮ SỐ
// =============================================================

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// =============================================================
// GỬI OTP LẤY LẠI MẬT KHẨU
// =============================================================

async function sendOtpEmail(toEmail, otp) {
    const subject = 'Mã OTP lấy lại mật khẩu';

    const content = `
        <h2 style="margin-top: 0; color: #333333;">
            Lấy lại mật khẩu
        </h2>

        <p>Xin chào,</p>

        <p>Bạn vừa yêu cầu lấy lại mật khẩu tài khoản.</p>

        <p>Mã OTP của bạn là:</p>

        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            <b style="color: #28a745;">${otp}</b>
        </p>

        <p>Mã OTP có hiệu lực trong <b>5 phút</b>.</p>

        <p>Vui lòng không cung cấp mã OTP này cho bất kỳ ai.</p>

        <p>Nếu bạn không yêu cầu lấy lại mật khẩu, vui lòng bỏ qua email này.</p>
    `;

    try {
        const info = await sendMail(toEmail, subject, content);
        console.log('✅ OTP RESET PASSWORD EMAIL SENT');
        return info;
    } catch (error) {
        console.error('❌ SEND RESET PASSWORD OTP ERROR:', error.message);
        throw error;
    }
}

// =============================================================
// GỬI OTP ĐĂNG KÝ TÀI KHOẢN
// =============================================================

async function sendRegisterOtpEmail(toEmail, otp) {
    const subject = 'Mã OTP xác nhận đăng ký tài khoản';

    const content = `
        <h2 style="margin-top: 0; color: #333333;">
            Xác nhận đăng ký tài khoản
        </h2>

        <p>Xin chào,</p>

        <p>Bạn vừa thực hiện đăng ký tài khoản tại <b>28 Travel</b>.</p>

        <p>Mã OTP xác nhận đăng ký của bạn là:</p>

        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            <b style="color: #28a745;">${otp}</b>
        </p>

        <p>Mã OTP có hiệu lực trong <b>5 phút</b>.</p>

        <p>Vui lòng không cung cấp mã OTP này cho bất kỳ ai.</p>

        <p>Nếu bạn không thực hiện đăng ký tài khoản, vui lòng bỏ qua email này.</p>
    `;

    try {
        const info = await sendMail(toEmail, subject, content);
        console.log('✅ REGISTER OTP EMAIL SENT');
        return info;
    } catch (error) {
        console.error('❌ SEND REGISTER OTP ERROR:', error.message);
        throw error;
    }
}

// =============================================================
// GỬI EMAIL CHÀO MỪNG
// =============================================================

async function sendWelcomeEmail(toEmail, fullName) {
    const subject = 'Chào mừng bạn đến với 28 Travel';

    const content = `
        <h2 style="margin-top: 0; color: #333333;">
            Chào mừng ${fullName}!
        </h2>

        <p>Xin chào <b>${fullName}</b>,</p>

        <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>28 Travel</b>.</p>

        <p>Chúng tôi rất vui được đồng hành cùng bạn trong những chuyến đi sắp tới.</p>

        <p>Bạn có thể bắt đầu khám phá các tour du lịch tại:
            <a href="${process.env.BASE_URL || 'http://localhost:3000'}" style="color: #28a745;">
                ${process.env.BASE_URL || 'http://localhost:3000'}
            </a>
        </p>

        <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>

        <p>Chúc bạn có những trải nghiệm tuyệt vời!</p>

        <p>Trân trọng,<br><b>28 Travel Team</b></p>
    `;

    try {
        const info = await sendMail(toEmail, subject, content);
        console.log('✅ WELCOME EMAIL SENT');
        return info;
    } catch (error) {
        console.error('❌ SEND WELCOME EMAIL ERROR:', error.message);
        throw error;
    }
}

// =============================================================
// EXPORT - SỬA LẠI CÁCH EXPORT CHO ĐÚNG
// =============================================================

module.exports = {
    sendMail,
    generateOtp,
    sendOtpEmail,
    sendRegisterOtpEmail,
    sendWelcomeEmail,
    isEmailConfigured
};