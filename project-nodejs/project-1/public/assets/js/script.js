/* =============================================================
   SECTION 13 - AUTH PAGES

   VALIDATE GIỐNG JOI BACKEND

   Frontend:
   - Kiểm tra dữ liệu để hỗ trợ UX
   - Gửi request lên Backend bằng fetch()
   - Backend Joi là lớp validation chính
   - Không để browser hiển thị JSON trực tiếp
   - Chỉ hiển thị lỗi
   - Thành công thì không in gì

   Login:
   - email: trim + email + required
   - password: min 6 + required

   Register:
   - fullName: trim + min 2 + max 100 + required
   - email: trim + email + required
   - phone: 0xxxxxxxxx hoặc +84xxxxxxxxx
   - password: min 6 + max 30 + required
   - confirmPassword: required + phải giống password
   - agreeTerms: bắt buộc

============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("AUTH JS ĐÃ LOAD");


    /* =========================================================
       HELPER
    ========================================================= */

    function showError(errorElement, message) {

        if (!errorElement) {
            return;
        }

        errorElement.textContent = message;
        errorElement.classList.add("show");
    }


    function hideError(errorElement) {

        if (!errorElement) {
            return;
        }

        errorElement.textContent = "";
        errorElement.classList.remove("show");
    }


    /* =========================================================
       TOGGLE HIỆN / ẨN MẬT KHẨU
    ========================================================= */

    const authPasswordToggles =
        document.querySelectorAll(".auth-password-toggle");


    authPasswordToggles.forEach(function (toggleButton) {

        const wrapper =
            toggleButton.closest(".auth-input-icon");


        const passwordInput =
            wrapper
                ? wrapper.querySelector("input")
                : null;


        const icon =
            toggleButton.querySelector("i");


        if (!passwordInput || !icon) {
            return;
        }


        toggleButton.addEventListener("click", function () {

            const isVisible =
                passwordInput.type === "text";


            passwordInput.type =
                isVisible
                    ? "password"
                    : "text";


            icon.classList.toggle(
                "fa-eye",
                isVisible
            );


            icon.classList.toggle(
                "fa-eye-slash",
                !isVisible
            );

        });

    });


    /* =========================================================
       EMAIL VALIDATION

       Gần tương đương Joi.string().email()
    ========================================================= */

    function isValidEmail(email) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    }


    /* =========================================================
       PHONE VALIDATION

       Joi:
       /^(0|\+84)[0-9]{9}$/

       Hợp lệ:
       0912345678
       0987654321
       +84912345678

       Không hợp lệ:
       091234567
       09123456789
       84912345678
       +841234567
    ========================================================= */

    function isValidPhone(phone) {

        const phoneRegex =
            /^(0|\+84)[0-9]{9}$/;

        return phoneRegex.test(phone);
    }


    /* =========================================================
       XỬ LÝ RESPONSE JSON LỖI

       Backend có thể trả:

       {
           code: "error",
           message: "Lỗi xác thực dữ liệu.",
           details: [
               "Email không được để trống."
           ]
       }

    ========================================================= */

    async function handleJsonError(response, errorElement, defaultMessage) {

        try {

            const data =
                await response.json();


            if (
                data &&
                Array.isArray(data.details) &&
                data.details.length > 0
            ) {

                showError(
                    errorElement,
                    data.details[0]
                );

                return true;
            }


            if (
                data &&
                data.message
            ) {

                showError(
                    errorElement,
                    data.message
                );

                return true;
            }


            showError(
                errorElement,
                defaultMessage
            );

            return true;

        }
        catch (error) {

            showError(
                errorElement,
                defaultMessage
            );

            return true;
        }
    }


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

                /*
                    QUAN TRỌNG:

                    Không cho browser submit HTML form
                    trực tiếp.

                    Nếu submit trực tiếp:

                    POST /login
                         ↓
                    Backend trả JSON
                         ↓
                    Chrome hiển thị JSON

                    Vì vậy dùng fetch().
                */

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


                /*
                    KHÔNG return ở đây.

                    Request vẫn được gửi Backend
                    để Joi validate lại.
                */


                /* =================================================
                   GỬI REQUEST BACKEND
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

                        /*
                            Chỉ xử lý JSON khi backend
                            trả lỗi.

                            Không in JSON ra Chrome.
                        */

                        if (!response.ok) {

                            await handleJsonError(
                                response,
                                loginError,
                                "Đăng nhập không thành công."
                            );

                        }
                        else {

                            /*
                                Nếu backend trả JSON
                                nhưng status thành công:

                                Không in gì.
                            */

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

                    /*
                        Nếu Express:

                        res.redirect(...)

                        fetch sẽ tự đi theo redirect.

                        response.redirected = true
                    */

                    if (
                        response.redirected &&
                        response.url
                    ) {

                        /*
                            Đăng nhập thành công.

                            KHÔNG console.log.
                            KHÔNG in JSON.

                            Chỉ chuyển trang.
                        */

                        window.location.href =
                            response.url;

                        return;
                    }


                    /*
                        Nếu response.ok nhưng không redirect:

                        Coi như request thành công.

                        Không in gì.
                    */

                    if (response.ok) {

                        return;
                    }


                    /*
                        Trường hợp lỗi HTTP nhưng
                        không phải JSON.
                    */

                    showError(
                        loginError,
                        "Đăng nhập không thành công."
                    );

                }
                catch (error) {

                    /*
                        Chỉ hiện lỗi kết nối trên giao diện.
                        Không console.log lỗi thành công.
                    */

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

                /*
                    Không cho browser submit trực tiếp.

                    Browser sẽ không chuyển tới:

                    /register

                    để hiển thị JSON.

                    JS dùng fetch() xử lý response.
                */

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


                /*
                    KHÔNG return.

                    Dù Frontend phát hiện lỗi,
                    request vẫn gửi Backend.

                    Backend Joi là lớp validation chính.
                */


                /* =================================================
                   GỬI REQUEST BACKEND
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

                        /*
                            Backend trả JSON lỗi.

                            Ví dụ:

                            {
                                code: "error",
                                message: "Lỗi xác thực dữ liệu.",
                                details: [
                                    "Email không được để trống."
                                ]
                            }

                            JS bắt JSON tại đây.

                            Chrome KHÔNG hiển thị JSON.
                        */

                        if (!response.ok) {

                            await handleJsonError(
                                response,
                                registerError,
                                "Đăng ký không thành công."
                            );

                        }
                        else {

                            /*
                                JSON thành công:

                                Không in gì.
                            */

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

                        /*
                            Đăng ký thành công.

                            Không console.log.
                            Không in JSON.

                            Chỉ chuyển trang.
                        */

                        window.location.href =
                            response.url;

                        return;
                    }


                    /*
                        Nếu backend trả HTTP 2xx
                        nhưng không redirect:

                        Không in gì.
                    */

                    if (response.ok) {

                        return;
                    }


                    /*
                        HTTP lỗi nhưng không phải JSON.
                    */

                    showError(
                        registerError,
                        "Đăng ký không thành công."
                    );

                }
                catch (error) {

                    /*
                        Chỉ hiển thị lỗi kết nối
                        trên giao diện.

                        Không console.log.
                    */

                    showError(
                        registerError,
                        "Không thể kết nối đến máy chủ."
                    );

                }

            }
        );

    }

});