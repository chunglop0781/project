/* =============================================================
   ACCOUNT JS

   LOGIN + REGISTER

   Frontend:
   - Hỗ trợ UX
   - Gửi request bằng fetch()
   - Backend Joi vẫn là validation chính
   - Không để browser hiển thị JSON trực tiếp
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("ACCOUNT JS ĐÃ LOAD");


    /* =========================================================
       FORM ĐĂNG NHẬP
    ========================================================= */

    const loginForm =
        document.querySelector("#loginForm");


    if (loginForm) {

        const loginError =
            loginForm.querySelector(
                "#loginFormError"
            );


        const emailInput =
            loginForm.querySelector(
                "#login-email"
            );


        const passwordInput =
            loginForm.querySelector(
                "#login-password"
            );


        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                hideError(loginError);


                /* =================================================
                   LẤY GIÁ TRỊ
                ================================================= */

                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                /* =================================================
                   FRONTEND VALIDATION
                ================================================= */

                let frontendError = false;


                /* EMAIL */

                if (!email) {

                    showError(
                        loginError,
                        "Email không được để trống."
                    );

                    frontendError = true;

                    if (emailInput) {
                        emailInput.focus();
                    }

                }
                else if (!isValidEmail(email)) {

                    showError(
                        loginError,
                        "Email không đúng định dạng."
                    );

                    frontendError = true;

                    if (emailInput) {
                        emailInput.focus();
                    }

                }


                /* PASSWORD */

                if (!password) {

                    showError(
                        loginError,
                        "Mật khẩu không được để trống."
                    );

                    frontendError = true;

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }
                else if (password.length < 6) {

                    showError(
                        loginError,
                        "Mật khẩu phải có ít nhất 6 ký tự."
                    );

                    frontendError = true;

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }


                /* =================================================
                   KHÔNG RETURN

                   Frontend có lỗi vẫn gửi Backend.
                   Backend Joi là validation chính.
                ================================================= */


                try {

                    const response =
                        await fetch(
                            loginForm.action,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/x-www-form-urlencoded"
                                },

                                body:
                                    new URLSearchParams(
                                        new FormData(loginForm)
                                    )
                            }
                        );


                    /* =================================================
                       SERVER TRẢ JSON
                    ================================================= */

                    const contentType =
                        response.headers.get(
                            "content-type"
                        );


                    if (
                        contentType &&
                        contentType.includes(
                            "application/json"
                        )
                    ) {

                        if (!response.ok) {

                            await handleJsonError(
                                response,
                                loginError,
                                "Đăng nhập không thành công."
                            );

                        }
                        else {

                            try {
                                await response.json();
                            }
                            catch (error) {
                                // Không làm gì
                            }

                        }

                        return;
                    }


                    /* =================================================
                       SERVER REDIRECT / HTML
                    ================================================= */

                    if (
                        response.redirected &&
                        response.url
                    ) {

                        window.location.href =
                            response.url;

                        return;
                    }


                    /* =================================================
                       HTTP 2XX
                    ================================================= */

                    if (response.ok) {
                        return;
                    }


                    /* =================================================
                       HTTP ERROR KHÔNG PHẢI JSON
                    ================================================= */

                    showError(
                        loginError,
                        "Đăng nhập không thành công."
                    );

                }
                catch (error) {

                    showError(
                        loginError,
                        "Không thể kết nối đến máy chủ."
                    );

                }

            }
        );

    }


    /* =========================================================
       FORM ĐĂNG KÝ
    ========================================================= */

    const registerForm =
        document.querySelector("#registerForm");


    if (registerForm) {

        const registerError =
            registerForm.querySelector(
                "#registerFormError"
            );


        const fullNameInput =
            registerForm.querySelector(
                "#register-fullname"
            );


        const emailInput =
            registerForm.querySelector(
                "#register-email"
            );


        const phoneInput =
            registerForm.querySelector(
                "#register-phone"
            );


        const passwordInput =
            registerForm.querySelector(
                "#register-password"
            );


        const confirmPasswordInput =
            registerForm.querySelector(
                "#register-confirm-password"
            );


        const agreeTermsInput =
            registerForm.querySelector(
                'input[name="agreeTerms"]'
            );


        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                hideError(registerError);


                /* =================================================
                   LẤY GIÁ TRỊ
                ================================================= */

                const fullName =
                    fullNameInput
                        ? fullNameInput.value.trim()
                        : "";


                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : "";


                const phone =
                    phoneInput
                        ? phoneInput.value.trim()
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                const confirmPassword =
                    confirmPasswordInput
                        ? confirmPasswordInput.value
                        : "";


                /* =================================================
                   FRONTEND VALIDATION
                ================================================= */

                let frontendError = false;


                /* =================================================
                   FULL NAME
                ================================================= */

                if (!fullName) {

                    showError(
                        registerError,
                        "Họ và tên không được để trống."
                    );

                    frontendError = true;

                    if (fullNameInput) {
                        fullNameInput.focus();
                    }

                }
                else if (fullName.length < 2) {

                    showError(
                        registerError,
                        "Họ và tên phải có ít nhất 2 ký tự."
                    );

                    frontendError = true;

                    if (fullNameInput) {
                        fullNameInput.focus();
                    }

                }
                else if (fullName.length > 100) {

                    showError(
                        registerError,
                        "Họ và tên không được vượt quá 100 ký tự."
                    );

                    frontendError = true;

                    if (fullNameInput) {
                        fullNameInput.focus();
                    }

                }


                /* =================================================
                   EMAIL
                ================================================= */

                if (!email) {

                    showError(
                        registerError,
                        "Email không được để trống."
                    );

                    frontendError = true;

                    if (emailInput) {
                        emailInput.focus();
                    }

                }
                else if (!isValidEmail(email)) {

                    showError(
                        registerError,
                        "Email không đúng định dạng."
                    );

                    frontendError = true;

                    if (emailInput) {
                        emailInput.focus();
                    }

                }


                /* =================================================
                   PHONE
                ================================================= */

                if (!phone) {

                    showError(
                        registerError,
                        "Số điện thoại không được để trống."
                    );

                    frontendError = true;

                    if (phoneInput) {
                        phoneInput.focus();
                    }

                }
                else if (!isValidPhone(phone)) {

                    showError(
                        registerError,
                        "Số điện thoại không đúng định dạng."
                    );

                    frontendError = true;

                    if (phoneInput) {
                        phoneInput.focus();
                    }

                }


                /* =================================================
                   PASSWORD
                ================================================= */

                if (!password) {

                    showError(
                        registerError,
                        "Mật khẩu không được để trống."
                    );

                    frontendError = true;

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }
                else if (password.length < 6) {

                    showError(
                        registerError,
                        "Mật khẩu phải có ít nhất 6 ký tự."
                    );

                    frontendError = true;

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }
                else if (password.length > 30) {

                    showError(
                        registerError,
                        "Mật khẩu không được vượt quá 30 ký tự."
                    );

                    frontendError = true;

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }


                /* =================================================
                   CONFIRM PASSWORD
                ================================================= */

                if (!confirmPassword) {

                    showError(
                        registerError,
                        "Vui lòng nhập lại mật khẩu."
                    );

                    frontendError = true;

                    if (confirmPasswordInput) {
                        confirmPasswordInput.focus();
                    }

                }
                else if (
                    confirmPassword !== password
                ) {

                    showError(
                        registerError,
                        "Mật khẩu xác nhận không khớp."
                    );

                    frontendError = true;

                    if (confirmPasswordInput) {
                        confirmPasswordInput.focus();
                    }

                }


                /* =================================================
                   ĐIỀU KHOẢN
                ================================================= */

                if (
                    !agreeTermsInput ||
                    !agreeTermsInput.checked
                ) {

                    showError(
                        registerError,
                        "Bạn phải đồng ý với điều khoản sử dụng."
                    );

                    frontendError = true;

                    if (agreeTermsInput) {
                        agreeTermsInput.focus();
                    }

                }


                /* =================================================
                   KHÔNG RETURN

                   Frontend lỗi vẫn gửi Backend.
                ================================================= */


                try {

                    const response =
                        await fetch(
                            registerForm.action,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/x-www-form-urlencoded"
                                },

                                body:
                                    new URLSearchParams(
                                        new FormData(registerForm)
                                    )
                            }
                        );


                    /* =================================================
                       SERVER TRẢ JSON
                    ================================================= */

                    const contentType =
                        response.headers.get(
                            "content-type"
                        );


                    if (
                        contentType &&
                        contentType.includes(
                            "application/json"
                        )
                    ) {

                        if (!response.ok) {

                            await handleJsonError(
                                response,
                                registerError,
                                "Đăng ký không thành công."
                            );

                        }
                        else {

                            try {
                                await response.json();
                            }
                            catch (error) {
                                // Không làm gì
                            }

                        }

                        return;
                    }


                    /* =================================================
                       SERVER REDIRECT / HTML
                    ================================================= */

                    if (
                        response.redirected &&
                        response.url
                    ) {

                        window.location.href =
                            response.url;

                        return;
                    }


                    /* =================================================
                       HTTP 2XX
                    ================================================= */

                    if (response.ok) {
                        return;
                    }


                    /* =================================================
                       HTTP ERROR KHÔNG PHẢI JSON
                    ================================================= */

                    showError(
                        registerError,
                        "Đăng ký không thành công."
                    );

                }
                catch (error) {

                    showError(
                        registerError,
                        "Không thể kết nối đến máy chủ."
                    );

                }

            }
        );

    }


    /* =========================================================
       FORM QUÊN MẬT KHẨU
       
       JustValidate:
       - Validate email required
       - Validate email format
       - Khi hợp lệ thì lấy email
       - Không bỏ các xử lý Login / Register phía trên
    ========================================================= */

    const forgotPasswordForm =
        document.querySelector("#forgot-password-form");


    if (forgotPasswordForm) {

        const validation =
            new JustValidate("#forgot-password-form");


        validation
            .addField("#email", [
                {
                    rule: "required",
                    errorMessage:
                        "Vui lòng nhập email của bạn!"
                },
                {
                    rule: "email",
                    errorMessage:
                        "Email không đúng định dạng!"
                }
            ])
            .onSuccess(function (event) {

                const email =
                    event.target.email.value;

                console.log(email);


                /* =========================================================
                   GỬI EMAIL LÊN BACKEND
                ========================================================= */

                const dataFinal = {
                    email: email
                };


                fetch('/forgot-password', {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(dataFinal)

                })

                .then(res => res.json())

                .then(data => {

                    if (data.code === "error") {

                        alert(data.message);

                    }


                    if (data.code === "success") {

                        window.location.href =
                            "/otp-password";

                    }

                })

                .catch(error => {

                    console.error(
                        "FORGOT PASSWORD ERROR:",
                        error
                    );

                    alert(
                        "Không thể kết nối đến máy chủ."
                    );

                });

            });

    }


    /* =========================================================
       FORM OTP PASSWORD

       - Nhập OTP
       - Gửi OTP lên Backend
       - OTP đúng -> /change-password
    ========================================================= */

    const otpPasswordForm =
        document.querySelector("#otp-password-form");


    if (otpPasswordForm) {

        const validation =
            new JustValidate("#otp-password-form");


        validation
            .addField("#otp", [
                {
                    rule: "required",
                    errorMessage:
                        "Vui lòng nhập mã OTP!"
                },
                {
                    rule: "number",
                    errorMessage:
                        "OTP phải là số!"
                },
                {
                    rule: "minLength",
                    value: 6,
                    errorMessage:
                        "OTP phải có 6 số!"
                },
                {
                    rule: "maxLength",
                    value: 6,
                    errorMessage:
                        "OTP phải có 6 số!"
                }
            ])
            .onSuccess(function (event) {

                const otp =
                    event.target.otp.value.trim();


                console.log(
                    "OTP USER NHẬP:",
                    otp
                );


                const dataFinal = {
                    otp: otp
                };


                fetch("/verify-otp", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(dataFinal)

                })

                .then(res => res.json())

                .then(data => {

                    console.log(
                        "VERIFY OTP:",
                        data
                    );


                    if (data.code === "error") {

                        alert(
                            data.message
                        );

                        return;

                    }


                    if (data.code === "success") {

                        window.location.href =
                            "/change-password";

                    }

                })

                .catch(error => {

                    console.error(
                        "VERIFY OTP ERROR:",
                        error
                    );

                    alert(
                        "Không thể kết nối đến máy chủ."
                    );

                });

            });

    }


    /* =========================================================
       FORM ĐỔI MẬT KHẨU SAU OTP

       - Chỉ xử lý khi có resetByOtp
       - Không ảnh hưởng form đổi mật khẩu cũ
    ========================================================= */

    const changePasswordForm =
        document.querySelector("#changePasswordForm");


    if (changePasswordForm) {

        const resetByOtpInput =
            changePasswordForm.querySelector(
                'input[name="resetByOtp"]'
            );


        if (resetByOtpInput) {

            const currentPasswordInput =
                changePasswordForm.querySelector(
                    "#change-password-current"
                );


            const newPasswordInput =
                changePasswordForm.querySelector(
                    "#change-password-new"
                );


            const confirmPasswordInput =
                changePasswordForm.querySelector(
                    "#change-password-confirm"
                );


            const changePasswordError =
                changePasswordForm.querySelector(
                    "#changePasswordFormError"
                );


            changePasswordForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    if (
                        resetByOtpInput.value !==
                        "true"
                    ) {

                        return;

                    }


                    const newPassword =
                        newPasswordInput
                            ? newPasswordInput.value
                            : "";


                    const confirmPassword =
                        confirmPasswordInput
                            ? confirmPasswordInput.value
                            : "";


                    if (!newPassword) {

                        if (changePasswordError) {

                            changePasswordError.textContent =
                                "Mật khẩu mới không được để trống.";

                        }

                        return;

                    }


                    if (newPassword.length < 6) {

                        if (changePasswordError) {

                            changePasswordError.textContent =
                                "Mật khẩu phải có ít nhất 6 ký tự.";

                        }

                        return;

                    }


                    if (newPassword.length > 30) {

                        if (changePasswordError) {

                            changePasswordError.textContent =
                                "Mật khẩu không được vượt quá 30 ký tự.";

                        }

                        return;

                    }


                    if (
                        newPassword !==
                        confirmPassword
                    ) {

                        if (changePasswordError) {

                            changePasswordError.textContent =
                                "Mật khẩu xác nhận không khớp.";

                        }

                        return;

                    }


                    if (changePasswordError) {

                        changePasswordError.textContent =
                            "";

                    }


                    try {

                        const response =
                            await fetch(
                                "/change-password",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({

                                            resetByOtp:
                                                true,

                                            newPassword:
                                                newPassword,

                                            confirmPassword:
                                                confirmPassword

                                        })
                                }
                            );


                        const data =
                            await response.json();


                        if (
                            data.code ===
                            "error"
                        ) {

                            if (
                                changePasswordError
                            ) {

                                changePasswordError
                                    .textContent =
                                    data.message;

                            }

                            return;

                        }


                        if (
                            data.code ===
                            "success"
                        ) {

                            alert(
                                "Đổi mật khẩu thành công!"
                            );


                            window.location.href =
                                "/login";

                        }

                    }
                    catch (error) {

                        console.error(
                            "CHANGE PASSWORD ERROR:",
                            error
                        );


                        if (
                            changePasswordError
                        ) {

                            changePasswordError
                                .textContent =
                                "Không thể kết nối đến máy chủ.";

                        }

                    }

                }
            );

        }

    }


    /* =========================================================
       DEBUG RESET PASSWORD FLOW
    ========================================================= */

    console.log(
        "OTP PASSWORD + CHANGE PASSWORD JS ĐÃ SẴN SÀNG"
    );

});