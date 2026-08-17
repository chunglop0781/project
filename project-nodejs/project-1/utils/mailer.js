const { Resend } = require('resend');

// TODO: thêm vào file .env
//   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// Cách lấy API Key:
//   1. Tạo tài khoản tại https://resend.com (miễn phí, 3.000 email/tháng)
//   2. Vào mục "API Keys" -> Create API Key -> copy chuỗi bắt đầu bằng "re_"
//
// LƯU Ý QUAN TRỌNG (giới hạn tài khoản chưa verify domain):
//   Khi CHƯA verify domain riêng, Resend chỉ cho phép gửi từ địa chỉ
//   mặc định "onboarding@resend.dev" và CHỈ gửi tới đúng email bạn
//   dùng để đăng ký tài khoản Resend (dùng để test).
//   Muốn gửi tới bất kỳ email nào (khách hàng thật), cần verify 1 domain
//   riêng tại: https://resend.com/domains (thêm bản ghi DNS: MX, TXT, DKIM)

const resend = new Resend(process.env.RESEND_API_KEY);

// Sinh mã OTP 6 chữ số
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi email chứa mã OTP
async function sendOtpEmail(toEmail, otp) {
    const { data, error } = await resend.emails.send({
        from: '28 Travel <onboarding@resend.dev>', // đổi thành email trên domain đã verify khi lên production
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

    if (error) {
        throw new Error(error.message || 'Gửi email thất bại.');
    }

    return data;
}

module.exports = { generateOtp, sendOtpEmail };
