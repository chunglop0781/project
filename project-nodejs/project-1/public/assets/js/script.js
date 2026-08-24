/* =============================================================
   AUTH COMMON SCRIPT
   Dùng chung cho Login / Register
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("SCRIPT JS ĐÃ LOAD");


    /* =========================================================
       HELPER
    ========================================================= */

    window.showError = function (errorElement, message) {

        if (!errorElement) {
            return;
        }

        errorElement.textContent = message;
        errorElement.classList.add("show");
    };


    window.hideError = function (errorElement) {

        if (!errorElement) {
            return;
        }

        errorElement.textContent = "";
        errorElement.classList.remove("show");
    };


    /* =========================================================
       EMAIL VALIDATION

       Gần tương đương:
       Joi.string().trim().email().required()
    ========================================================= */

    window.isValidEmail = function (email) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    };


    /* =========================================================
       PHONE VALIDATION

       Joi:
       /^(0|\+84)[0-9]{9}$/

       Hợp lệ:
       0912345678
       0987654321
       +84912345678
    ========================================================= */

    window.isValidPhone = function (phone) {

        const phoneRegex =
            /^(0|\+84)[0-9]{9}$/;

        return phoneRegex.test(phone);
    };


    /* =========================================================
       XỬ LÝ RESPONSE JSON ERROR
    ========================================================= */

    window.handleJsonError = async function (
        response,
        errorElement,
        defaultMessage
    ) {

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
    };


    /* =========================================================
       TOGGLE HIỆN / ẨN MẬT KHẨU
    ========================================================= */

    const authPasswordToggles =
        document.querySelectorAll(
            ".auth-password-toggle"
        );


    authPasswordToggles.forEach(function (toggleButton) {

        const wrapper =
            toggleButton.closest(
                ".auth-input-icon"
            );


        const passwordInput =
            wrapper
                ? wrapper.querySelector("input")
                : null;


        const icon =
            toggleButton.querySelector("i");


        if (!passwordInput || !icon) {
            return;
        }


        toggleButton.addEventListener(
            "click",
            function () {

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

            }
        );

    });

});