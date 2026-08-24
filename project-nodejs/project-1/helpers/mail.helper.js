// =============================================================
// IMPORT NODEMAILER
// =============================================================

const nodemailer = require('nodemailer');


// =============================================================
// TẠO TRANSPORTER GMAIL
//
// .env:
//
// YOUR_GMAIL_ADDRESS=hunganh.okokok.0@gmail.com
// GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
//
// LƯU Ý:
// - YOUR_GMAIL_ADDRESS: Gmail dùng để gửi email
// - GMAIL_APP_PASSWORD: App Password của Gmail
// - Không dùng mật khẩu Gmail thông thường
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
// GỬI EMAIL THÔNG THƯỜNG
// Giữ lại chức năng sendMail()
// =============================================================

async function sendMail(
    toEmail,
    subject,
    content
) {

    // =============================================================
    // LOGO
    // =============================================================

    const logoUrl =
        'https://raw.githubusercontent.com/chunglop0781/project/refs/heads/main/project-nodejs/project-1/public/assets/image/logo.png';


    // =============================================================
    // MAIL OPTIONS
    // =============================================================

    const mailOptions = {

        from:
            `28 Travel <${process.env.YOUR_GMAIL_ADDRESS}>`,

        to:
            toEmail,

        subject:
            subject,

        html: `

            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            ">


                <!-- ================================================= -->
                <!-- LOGO -->
                <!-- ================================================= -->

                <div style="
                    text-align: left;
                    margin-bottom: 25px;
                ">

                    <img
                        src="${logoUrl}"
                        alt="Website Du Lịch"
                        style="
                            width: 120px;
                            height: auto;
                            display: block;
                        "
                    >

                </div>


                <!-- ================================================= -->
                <!-- NỘI DUNG EMAIL -->
                <!-- ================================================= -->

                <div style="
                    font-size: 16px;
                    line-height: 1.6;
                    color: #333333;
                ">

                    ${content}

                </div>


                <!-- ================================================= -->
                <!-- FOOTER -->
                <!-- ================================================= -->

                <div style="
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #eeeeee;
                    font-size: 13px;
                    color: #888888;
                ">

                    <p>
                        Email được gửi tự động từ hệ thống 28 Travel.
                    </p>

                    <p>
                        Vui lòng không trả lời email này.
                    </p>

                </div>

            </div>

        `
    };


    // =============================================================
    // SEND EMAIL
    // =============================================================

    try {

        const info = await transporter.sendMail(
            mailOptions
        );


        console.log(
            '✅ EMAIL SENT:',
            info.response
        );


        return info;

    } catch (error) {

        console.error(
            '❌ SEND EMAIL ERROR:',
            error
        );


        throw new Error(
            error.message || 'Gửi email thất bại.'
        );

    }

}


// =============================================================
// SINH MÃ OTP 6 CHỮ SỐ
// =============================================================

function generateOtp() {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();

}


// =============================================================
// GỬI OTP LẤY LẠI MẬT KHẨU
// =============================================================

async function sendOtpEmail(
    toEmail,
    otp
) {

    // =============================================================
    // SUBJECT
    // =============================================================

    const subject =
        'Mã OTP lấy lại mật khẩu';


    // =============================================================
    // CONTENT
    // =============================================================

    const content = `

        <h2 style="
            margin-top: 0;
            color: #333333;
        ">
            Lấy lại mật khẩu
        </h2>


        <p>
            Xin chào,
        </p>


        <p>
            Bạn vừa yêu cầu lấy lại mật khẩu tài khoản.
        </p>


        <p>
            Mã OTP của bạn là:
        </p>


        <p style="
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            margin: 20px 0;
        ">

            <b style="color: green;">
                ${otp}
            </b>

        </p>


        <p>
            Mã OTP có hiệu lực trong
            <b>5 phút</b>.
        </p>


        <p>
            Vui lòng không cung cấp mã OTP này
            cho bất kỳ ai.
        </p>


        <p>
            Nếu bạn không yêu cầu lấy lại mật khẩu,
            vui lòng bỏ qua email này.
        </p>

    `;


    // =============================================================
    // GỌI SEND MAIL
    // =============================================================

    try {

        const info = await sendMail(
            toEmail,
            subject,
            content
        );


        console.log(
            '✅ OTP RESET PASSWORD EMAIL SENT:',
            info.response
        );


        return info;

    } catch (error) {

        console.error(
            '❌ SEND RESET PASSWORD OTP ERROR:',
            error
        );


        throw error;

    }

}


// =============================================================
// GỬI OTP ĐĂNG KÝ TÀI KHOẢN
// =============================================================

async function sendRegisterOtpEmail(
    toEmail,
    otp
) {

    // =============================================================
    // SUBJECT
    // =============================================================

    const subject =
        'Mã OTP xác nhận đăng ký tài khoản';


    // =============================================================
    // CONTENT
    // =============================================================

    const content = `

        <h2 style="
            margin-top: 0;
            color: #333333;
        ">
            Xác nhận đăng ký tài khoản
        </h2>


        <p>
            Xin chào,
        </p>


        <p>
            Bạn vừa thực hiện đăng ký tài khoản tại
            <b>28 Travel</b>.
        </p>


        <p>
            Mã OTP xác nhận đăng ký của bạn là:
        </p>


        <p style="
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            margin: 20px 0;
        ">

            <b style="color: green;">
                ${otp}
            </b>

        </p>


        <p>
            Mã OTP có hiệu lực trong
            <b>5 phút</b>.
        </p>


        <p>
            Vui lòng không cung cấp mã OTP này
            cho bất kỳ ai.
        </p>


        <p>
            Nếu bạn không thực hiện đăng ký tài khoản,
            vui lòng bỏ qua email này.
        </p>

    `;


    // =============================================================
    // GỌI SEND MAIL
    // =============================================================

    try {

        const info = await sendMail(
            toEmail,
            subject,
            content
        );


        console.log(
            '✅ REGISTER OTP EMAIL SENT:',
            info.response
        );


        return info;

    } catch (error) {

        console.error(
            '❌ SEND REGISTER OTP ERROR:',
            error
        );


        throw error;

    }

}


// =============================================================
// EXPORT
// =============================================================

module.exports.sendMail =
    sendMail;


module.exports.generateOtp =
    generateOtp;


module.exports.sendOtpEmail =
    sendOtpEmail;


module.exports.sendRegisterOtpEmail =
    sendRegisterOtpEmail;