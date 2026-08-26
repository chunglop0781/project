/* =============================================================
   ACCOUNT JS

   LOGIN + REGISTER
   FORGOT PASSWORD
   OTP PASSWORD
   CHANGE PASSWORD

   Frontend:
   - Hỗ trợ UX
   - Backend vẫn là validation chính
   - Không tự hiển thị "Có lỗi xảy ra"
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

                const errors = [];


                if (!email) {

                    errors.push(
                        "Email không được để trống."
                    );

                }
                else if (!isValidEmail(email)) {

                    errors.push(
                        "Email không đúng định dạng."
                    );

                }


                if (!password) {

                    errors.push(
                        "Mật khẩu không được để trống."
                    );

                }
                else if (password.length < 6) {

                    errors.push(
                        "Mật khẩu phải có ít nhất 6 ký tự."
                    );

                }


                /* =================================================
                   HIỂN THỊ LỖI
                ================================================= */

                if (errors.length > 0) {

                    loginError.innerHTML =
                        errors
                            .map(
                                message =>
                                    `<div>${message}</div>`
                            )
                            .join("");

                    loginError.classList.add("show");
                }


                /* =================================================
                   GỬI BACKEND
                ================================================= */

                try {

                    const formData =
                        new FormData(
                            loginForm
                        );


                    const response =
                        await fetch(
                            loginForm.action,
                            {
                                method: "POST",

                                body:
                                    new URLSearchParams(
                                        formData
                                    )
                            }
                        );


                    /* =================================================
                       SERVER REDIRECT
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
                       SERVER TRẢ HTML
                    ================================================= */

                    if (
                        response.headers
                            .get("content-type")
                            ?.includes("text/html")
                    ) {

                        const html =
                            await response.text();

                        document.open();

                        document.write(html);

                        document.close();

                        return;
                    }

                }
                catch (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );


                    if (!errors.length) {

                        loginError.innerHTML =
                            "<div>Không thể kết nối đến máy chủ.</div>";

                        loginError.classList.add("show");
                    }

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
                "#register-fullName"
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
                "#register-confirmPassword"
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

                const errors = [];


                /* =================================================
                   HỌ VÀ TÊN
                ================================================= */

                if (!fullName) {

                    errors.push(
                        "Họ và tên không được để trống."
                    );

                }
                else if (fullName.length < 2) {

                    errors.push(
                        "Họ và tên phải có ít nhất 2 ký tự."
                    );

                }
                else if (fullName.length > 100) {

                    errors.push(
                        "Họ và tên không được vượt quá 100 ký tự."
                    );

                }


                /* =================================================
                   EMAIL
                ================================================= */

                if (!email) {

                    errors.push(
                        "Email không được để trống."
                    );

                }
                else if (!isValidEmail(email)) {

                    errors.push(
                        "Email không đúng định dạng."
                    );

                }


                /* =================================================
                   PHONE
                ================================================= */

                if (!phone) {

                    errors.push(
                        "Số điện thoại không được để trống."
                    );

                }
                else if (!isValidPhone(phone)) {

                    errors.push(
                        "Số điện thoại không đúng định dạng."
                    );

                }


                /* =================================================
                   PASSWORD
                ================================================= */

                if (!password) {

                    errors.push(
                        "Mật khẩu không được để trống."
                    );

                }
                else if (password.length < 6) {

                    errors.push(
                        "Mật khẩu phải có ít nhất 6 ký tự."
                    );

                }
                else if (password.length > 30) {

                    errors.push(
                        "Mật khẩu không được vượt quá 30 ký tự."
                    );

                }


                /* =================================================
                   CONFIRM PASSWORD
                ================================================= */

                if (!confirmPassword) {

                    errors.push(
                        "Vui lòng nhập lại mật khẩu."
                    );

                }
                else if (
                    confirmPassword !== password
                ) {

                    errors.push(
                        "Mật khẩu xác nhận không khớp."
                    );

                }


                /* =================================================
                   ĐIỀU KHOẢN
                ================================================= */

                if (
                    !agreeTermsInput ||
                    !agreeTermsInput.checked
                ) {

                    errors.push(
                        "Bạn phải đồng ý với điều khoản sử dụng."
                    );

                }


                /* =================================================
                   HIỂN THỊ TẤT CẢ LỖI
                ================================================= */

                if (errors.length > 0) {

                    registerError.innerHTML =
                        errors
                            .map(
                                message =>
                                    `<div>${message}</div>`
                            )
                            .join("");

                    registerError.classList.add("show");
                }


                /* =================================================
                   GỬI BACKEND
                ================================================= */

                try {

                    const formData =
                        new FormData(
                            registerForm
                        );


                    const response =
                        await fetch(
                            registerForm.action,
                            {
                                method: "POST",

                                body:
                                    new URLSearchParams(
                                        formData
                                    )
                            }
                        );


                    /* =================================================
                       SERVER REDIRECT
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
                       SERVER TRẢ HTML
                    ================================================= */

                    if (
                        response.headers
                            .get("content-type")
                            ?.includes("text/html")
                    ) {

                        const html =
                            await response.text();

                        document.open();

                        document.write(html);

                        document.close();

                        return;
                    }

                }
                catch (error) {

                    console.error(
                        "REGISTER ERROR:",
                        error
                    );


                    if (!errors.length) {

                        registerError.innerHTML =
                            "<div>Không thể kết nối đến máy chủ.</div>";

                        registerError.classList.add("show");
                    }

                }

            }
        );

    }


    /* =========================================================
       FORM QUÊN MẬT KHẨU
    ========================================================= */

    const forgotPasswordForm =
        document.querySelector(
            "#forgot-password-form"
        );


    if (forgotPasswordForm) {

        const validation =
            new JustValidate(
                "#forgot-password-form"
            );


        validation
            .addField(
                "#email",
                [
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
                ]
            )
            .onSuccess(function (event) {

                const email =
                    event.target.email.value;


                const dataFinal = {
                    email: email
                };


                fetch(
                    "/forgot-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                dataFinal
                            )
                    }
                )

                .then(res => res.json())

                .then(data => {

                    if (
                        data.code === "error"
                    ) {

                        alert(
                            data.message
                        );

                        return;
                    }


                    if (
                        data.code === "success"
                    ) {

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
    ========================================================= */

    const otpPasswordForm =
        document.querySelector(
            "#otp-password-form"
        );


    if (otpPasswordForm) {

        const validation =
            new JustValidate(
                "#otp-password-form"
            );


        validation
            .addField(
                "#otp",
                [
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
                ]
            )
            .onSuccess(function (event) {

                const otp =
                    event.target.otp.value.trim();


                const dataFinal = {
                    otp: otp
                };


                fetch(
                    "/verify-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                dataFinal
                            )
                    }
                )

                .then(res => res.json())

                .then(data => {

                    if (
                        data.code === "error"
                    ) {

                        alert(
                            data.message
                        );

                        return;
                    }


                    if (
                        data.code === "success"
                    ) {

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
       FORM ĐỔI MẬT KHẨU
    ========================================================= */

    const changePasswordForm =
        document.querySelector(
            "#changePasswordForm"
        );


    if (changePasswordForm) {

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


                /* =================================================
                   KIỂM TRA ELEMENT
                ================================================= */

                if (
                    !changePasswordError
                ) {

                    console.error(
                        "Không tìm thấy #changePasswordFormError"
                    );

                    return;
                }


                /* =================================================
                   LẤY GIÁ TRỊ
                ================================================= */

                const currentPassword =
                    currentPasswordInput
                        ? currentPasswordInput.value
                        : "";


                const newPassword =
                    newPasswordInput
                        ? newPasswordInput.value
                        : "";


                const confirmPassword =
                    confirmPasswordInput
                        ? confirmPasswordInput.value
                        : "";


                const errors = [];


                /* =================================================
                   MẬT KHẨU HIỆN TẠI
                ================================================= */

                if (!currentPassword) {

                    errors.push(
                        "Vui lòng nhập mật khẩu hiện tại."
                    );

                }


                /* =================================================
                   MẬT KHẨU MỚI
                ================================================= */

                if (!newPassword) {

                    errors.push(
                        "Mật khẩu mới không được để trống."
                    );

                }
                else if (
                    newPassword.length < 6
                ) {

                    errors.push(
                        "Mật khẩu mới phải có ít nhất 6 ký tự."
                    );

                }
                else if (
                    newPassword.length > 30
                ) {

                    errors.push(
                        "Mật khẩu không được vượt quá 30 ký tự."
                    );

                }


                /* =================================================
                   XÁC NHẬN MẬT KHẨU
                ================================================= */

                if (!confirmPassword) {

                    errors.push(
                        "Vui lòng nhập lại mật khẩu."
                    );

                }
                else if (
                    newPassword !==
                    confirmPassword
                ) {

                    errors.push(
                        "Mật khẩu xác nhận không khớp."
                    );

                }


                /* =================================================
                   HIỂN THỊ LỖI
                ================================================= */

                if (
                    errors.length > 0
                ) {

                    changePasswordError.innerHTML =
                        errors
                            .map(
                                message =>
                                    `<div>${message}</div>`
                            )
                            .join("");


                    changePasswordError.classList.add(
                        "show"
                    );

                    return;
                }


                /* =================================================
                   XÓA LỖI
                ================================================= */

                changePasswordError.innerHTML =
                    "";

                changePasswordError.classList.remove(
                    "show"
                );


                /* =================================================
                   GỬI SERVER
                ================================================= */

                try {

                    const response =
                        await fetch(
                            changePasswordForm.action,
                            {
                                method: "POST",

                                credentials:
                                    "same-origin",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        currentPassword:
                                            currentPassword,

                                        newPassword:
                                            newPassword,

                                        confirmPassword:
                                            confirmPassword

                                    })
                            }
                        );


                    /* =================================================
                       ĐỌC RESPONSE
                    ================================================= */

                    const data =
                        await response.json();


                    /* =================================================
                       SERVER ERROR
                    ================================================= */

                    if (
                        !response.ok ||
                        data.code === "error"
                    ) {

                        changePasswordError.innerHTML =
                            `<div>${
                                data.message ||
                                "Không thể đổi mật khẩu."
                            }</div>`;


                        changePasswordError.classList.add(
                            "show"
                        );

                        return;
                    }


                    /* =================================================
                       THÀNH CÔNG
                    ================================================= */

                    if (
                        data.code === "success"
                    ) {

                        alert(
                            data.message ||
                            "Đổi mật khẩu thành công!"
                        );


                        /*
                         * Không logout.
                         * Không destroy session.
                         * Không chuyển về /login.
                         *
                         * User vẫn đang đăng nhập.
                         */

                        window.location.reload();

                        return;
                    }


                    /* =================================================
                       RESPONSE KHÔNG HỢP LỆ
                    ================================================= */

                    changePasswordError.innerHTML =
                        "<div>Phản hồi từ máy chủ không hợp lệ.</div>";

                    changePasswordError.classList.add(
                        "show"
                    );

                }
                catch (error) {

                    console.error(
                        "CHANGE PASSWORD ERROR:",
                        error
                    );


                    changePasswordError.innerHTML =
                        "<div>Không thể kết nối đến máy chủ.</div>";

                    changePasswordError.classList.add(
                        "show"
                    );
                }

            }
        );

    }


    /* =========================================================
       HOÀN TẤT
    ========================================================= */

    console.log(
        "OTP PASSWORD + CHANGE PASSWORD JS ĐÃ SẴN SÀNG"
    );

});