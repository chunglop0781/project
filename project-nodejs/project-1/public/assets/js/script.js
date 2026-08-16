document.addEventListener("DOMContentLoaded", () => {

    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 800,
            once: true
        });
    }

});


/* =========================================================
   HEADER - MENU 3 SỌC
   CHỈ MỞ KHI BẤM NÚT 3 SỌC — KHÔNG DÙNG MOUSEENTER
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.querySelector(".menu-toggle");
    const menuEl = document.querySelector(".menu");
    const overlayEl = document.querySelector(".menu-overlay");

    if (!menuToggle || !menuEl || !overlayEl) {
        return;
    }

    /* -----------------------------------------------------
       TRẠNG THÁI BAN ĐẦU: LUÔN ĐÓNG
    ----------------------------------------------------- */

    menuEl.classList.remove("open");
    overlayEl.classList.remove("active");
    document.querySelectorAll(".has-dropdown.open").forEach(el => el.classList.remove("open"));

    function openMenu() {
        menuEl.classList.add("open");
        overlayEl.classList.add("active");
    }

    function closeMenu() {
        menuEl.classList.remove("open");
        overlayEl.classList.remove("active");
        document.querySelectorAll(".has-dropdown.open").forEach(el => el.classList.remove("open"));
    }

    /* -----------------------------------------------------
       NÚT 3 SỌC — CHỈ CLICK MỚI MỞ, KHÔNG MOUSEENTER
    ----------------------------------------------------- */

    menuToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        menuEl.classList.contains("open") ? closeMenu() : openMenu();
    });

    overlayEl.addEventListener("click", closeMenu);

    document.querySelectorAll(".has-dropdown > a").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            const parent = this.parentElement;
            const isOpen = parent.classList.contains("open");

            document.querySelectorAll(".has-dropdown.open").forEach(el => el.classList.remove("open"));

            if (!isOpen) {
                parent.classList.add("open");
            }
        });
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeMenu();
        }
    });

});


/* =========================================================
   SECTION 2 - SWIPER
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (typeof Swiper === "undefined") {
        return;
    }

    const section2Element = document.querySelector(".section-2-swiper");
    if (!section2Element) {
        return;
    }

    const section2Swiper = new Swiper(".section-2-swiper", {
        slidesPerView: 3,
        spaceBetween: 14,
        navigation: {
            nextEl: ".section-2-arrow-next",
            prevEl: ".section-2-arrow-prev"
        },
        breakpoints: {
            0: {
                slidesPerView: 1
            },
            576: {
                slidesPerView: 2
            },
            1000: {
                slidesPerView: 3
            }
        }
    });

});


/* =========================================================
   COUNTDOWN
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const countdowns = document.querySelectorAll("[clock-expire]");

    countdowns.forEach(countdown => {

        const expireTime = new Date(
            countdown.getAttribute("clock-expire")
        ).getTime();

        const days = countdown.querySelector(".countdown-days");
        const hours = countdown.querySelector(".countdown-hours");
        const minutes = countdown.querySelector(".countdown-minutes");
        const seconds = countdown.querySelector(".countdown-seconds");

        if (!days || !hours || !minutes || !seconds) {
            return;
        }

        function updateCountdown() {

            const now = new Date().getTime();
            const distance = expireTime - now;

            if (distance <= 0) {
                days.textContent = "00";
                hours.textContent = "00";
                minutes.textContent = "00";
                seconds.textContent = "00";
                return;
            }

            const day = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hour = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minute = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const second = Math.floor((distance % (1000 * 60)) / 1000);

            days.textContent = String(day).padStart(2, "0");
            hours.textContent = String(hour).padStart(2, "0");
            minutes.textContent = String(minute).padStart(2, "0");
            seconds.textContent = String(second).padStart(2, "0");

        }

        updateCountdown();
        setInterval(updateCountdown, 1000);

    });

});


/* =========================================================
   SECTION 3 - KHUYẾN MÃI
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (typeof Swiper === "undefined") {
        return;
    }

    const section3Element = document.querySelector(".section-3-swiper");
    if (!section3Element) {
        return;
    }

    const section3Swiper = new Swiper(".section-3-swiper", {
        slidesPerView: 3,
        spaceBetween: 14,
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false
        },
        pagination: {
            el: ".section-3-swiper .swiper-pagination",
            clickable: true
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 10
            },
            576: {
                slidesPerView: 2,
                spaceBetween: 12
            },
            1000: {
                slidesPerView: 3,
                spaceBetween: 14
            }
        }
    });

});


/* =========================================================
   SECTION 11 - TÍNH TIỀN HÀNH KHÁCH
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const booking = document.querySelector(".sec-11-booking");
    if (!booking) {
        return;
    }

    const totalElement = booking.querySelector("#sec-11-total-price");
    if (!totalElement) {
        return;
    }

    function formatMoney(number) {
        return new Intl.NumberFormat("vi-VN").format(number);
    }

    function calculateTotal() {

        let total = 0;

        const rows = booking.querySelectorAll(".sec-11-passenger-row");

        rows.forEach(function (row) {

            const input = row.querySelector(".sec-11-passenger-input");
            const priceElement = row.querySelector(".sec-11-passenger-price");

            if (!input || !priceElement) {
                return;
            }

            let quantity = parseInt(input.value, 10);
            if (isNaN(quantity)) {
                quantity = 0;
            }

            let min = parseInt(input.getAttribute("min"), 10);
            let max = parseInt(input.getAttribute("max"), 10);

            if (isNaN(min)) {
                min = 0;
            }
            if (isNaN(max)) {
                max = 99;
            }

            if (quantity < min) {
                quantity = min;
            }
            if (quantity > max) {
                quantity = max;
            }

            input.value = quantity;

            const price = parseInt(input.getAttribute("data-price"), 10);

            if (isNaN(price)) {
                console.error("Không tìm thấy data-price:", input);
                return;
            }

            const itemTotal = quantity * price;
            total += itemTotal;

            priceElement.textContent = quantity + "x" + formatMoney(price) + " đ";

        });

        totalElement.textContent = formatMoney(total) + " đ";

    }

    const rows = booking.querySelectorAll(".sec-11-passenger-row");

    rows.forEach(function (row) {

        const input = row.querySelector(".sec-11-passenger-input");
        const minusButton = row.querySelector(".sec-11-quantity-minus");
        const plusButton = row.querySelector(".sec-11-quantity-plus");

        if (!input || !minusButton || !plusButton) {
            return;
        }

        minusButton.addEventListener("click", function (event) {

            event.preventDefault();

            let value = parseInt(input.value, 10);
            if (isNaN(value)) {
                value = 0;
            }

            let min = parseInt(input.getAttribute("min"), 10);
            if (isNaN(min)) {
                min = 0;
            }

            if (value > min) {
                value--;
            }

            input.value = value;
            calculateTotal();

        });

        plusButton.addEventListener("click", function (event) {

            event.preventDefault();

            let value = parseInt(input.value, 10);
            if (isNaN(value)) {
                value = 0;
            }

            let max = parseInt(input.getAttribute("max"), 10);
            if (isNaN(max)) {
                max = 99;
            }

            if (value < max) {
                value++;
            }

            input.value = value;
            calculateTotal();

        });

        input.addEventListener("input", function () {
            calculateTotal();
        });

        input.addEventListener("change", function () {
            calculateTotal();
        });

    });

    calculateTotal();

});


/* =========================================================
   SECTION 11 - THÊM VÀO GIỎ HÀNG
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const booking = document.querySelector(".sec-11-booking");
    const addCartButton = document.querySelector(".sec-11-add-cart");

    if (!booking || !addCartButton) {
        return;
    }

    const CART_STORAGE_KEY = "cart";

    function getCart() {

        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const cart = raw ? JSON.parse(raw) : [];
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            console.error("Không đọc được giỏ hàng trong localStorage:", error);
            return [];
        }

    }

    function saveCart(cart) {

        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error("Không lưu được giỏ hàng vào localStorage:", error);
        }

    }

    function updateHeaderCartCount() {

        const cart = getCart();
        const totalItems = cart.length;

        const countElement = document.querySelector("#header-cart-count");

        if (countElement) {
            countElement.textContent = totalItems;
        }

    }

    function getTourInfo() {

        const nameElement = booking.querySelector(".sec-11-tour-name");
        const imageElement = booking.querySelector(".sec-11-tour-image img");

        const infoRows = booking.querySelectorAll(".sec-11-info-row");

        let tourCode = "";
        let duration = "";
        let vehicle = "";
        let departureDate = "";

        infoRows.forEach(function (row) {

            const label = row.querySelector("span");
            const value = row.querySelector("strong");

            if (!label || !value) {
                return;
            }

            const labelText = label.textContent.trim();
            const valueText = value.textContent.trim();

            if (labelText.indexOf("Mã Tour") !== -1) {
                tourCode = valueText;
            } else if (labelText.indexOf("Thời Gian") !== -1) {
                duration = valueText;
            } else if (labelText.indexOf("Phương Tiện") !== -1) {
                vehicle = valueText;
            } else if (labelText.indexOf("Ngày Khởi Hành") !== -1) {
                departureDate = valueText;
            }

        });

        return {
            code: tourCode,
            name: nameElement ? nameElement.textContent.trim().replace(/\s+/g, " ") : "",
            image: imageElement ? imageElement.getAttribute("src") : "",
            duration: duration,
            vehicle: vehicle,
            departureDate: departureDate
        };

    }

    function getPassengers() {

        const rows = booking.querySelectorAll(".sec-11-passenger-row");
        const passengers = [];
        let totalPassengers = 0;
        let totalPrice = 0;

        rows.forEach(function (row) {

            const labelElement = row.querySelector(".sec-11-passenger-label");
            const input = row.querySelector(".sec-11-passenger-input");

            if (!labelElement || !input) {
                return;
            }

            const quantity = parseInt(input.value, 10) || 0;
            const price = parseInt(input.getAttribute("data-price"), 10) || 0;

            if (quantity > 0) {
                passengers.push({
                    label: labelElement.textContent.replace(":", "").trim(),
                    quantity: quantity,
                    price: price
                });
            }

            totalPassengers += quantity;
            totalPrice += quantity * price;

        });

        return {
            passengers: passengers,
            totalPassengers: totalPassengers,
            totalPrice: totalPrice
        };

    }

    addCartButton.addEventListener("click", function () {

        const tourInfo = getTourInfo();
        const passengerInfo = getPassengers();

        if (passengerInfo.totalPassengers <= 0) {
            alert("Vui lòng chọn ít nhất 1 hành khách trước khi thêm vào giỏ hàng.");
            return;
        }

        const cartItem = {
            id: (tourInfo.code || "tour") + "-" + Date.now(),
            tourCode: tourInfo.code,
            name: tourInfo.name,
            image: tourInfo.image,
            duration: tourInfo.duration,
            vehicle: tourInfo.vehicle,
            departureDate: tourInfo.departureDate,
            passengers: passengerInfo.passengers,
            totalPassengers: passengerInfo.totalPassengers,
            totalPrice: passengerInfo.totalPrice,
            addedAt: Date.now()
        };

        const cart = getCart();
        cart.push(cartItem);
        saveCart(cart);

        updateHeaderCartCount();

        addCartButton.classList.add("sec-11-add-cart-success");

        setTimeout(function () {
            addCartButton.classList.remove("sec-11-add-cart-success");
        }, 900);

    });

    updateHeaderCartCount();

});


/* =========================================================
   SECTION 12 - GIỎ HÀNG + THANH TOÁN
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const cartSection = document.querySelector(".sec-12");
    if (!cartSection) {
        return;
    }

    const CART_STORAGE_KEY = "cart";

    const cartItemsContainer = cartSection.querySelector("#sec-12-cart-items");
    const emptyCartEl = cartSection.querySelector("#sec-12-empty-cart");
    const tourCountEl = cartSection.querySelector("#sec-12-tour-count");
    const passengerCountEl = cartSection.querySelector("#sec-12-passenger-count");
    const summaryTotalEl = cartSection.querySelector("#sec-12-summary-total");
    const paymentTotalEl = cartSection.querySelector("#sec-12-payment-total");
    const checkoutButton = cartSection.querySelector(".sec-12-checkout-button");
    const clearButton = cartSection.querySelector(".sec-12-clear-button");
    const paymentSection = cartSection.querySelector("#sec-12-payment");
    const successSection = cartSection.querySelector("#sec-12-success");
    const bankInfoEl = cartSection.querySelector("#sec-12-bank-info");
    const submitButton = cartSection.querySelector(".sec-12-submit");

    if (!cartItemsContainer || !emptyCartEl) {
        return;
    }

    /* -----------------------------------------------------
       HELPERS
    ----------------------------------------------------- */

    function formatMoney(number) {
        return new Intl.NumberFormat("vi-VN").format(number || 0);
    }

    function getCart() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const cart = raw ? JSON.parse(raw) : [];
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            console.error("Không đọc được giỏ hàng trong localStorage:", error);
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error("Không lưu được giỏ hàng vào localStorage:", error);
        }
    }

    function updateHeaderCartCount() {
        const cart = getCart();
        const countElement = document.querySelector("#header-cart-count");
        if (countElement) {
            countElement.textContent = cart.length;
        }
    }

    /* -----------------------------------------------------
       RENDER 1 DÒNG SẢN PHẨM TRONG GIỎ HÀNG
    ----------------------------------------------------- */

    function renderCartItem(item) {

        const wrapper = document.createElement("div");
        wrapper.className = "sec-12-cart-item";
        wrapper.setAttribute("data-id", item.id);

        const passengersHtml = (item.passengers || []).map(function (p) {
            return (
                '<div class="sec-12-passenger-item">' +
                    "<span>" + p.label + " x" + p.quantity + "</span>" +
                    "<strong>" + formatMoney(p.price * p.quantity) + " đ</strong>" +
                "</div>"
            );
        }).join("");

        const infoHtml =
            (item.duration ? '<span><i class="fas fa-clock"></i>' + item.duration + "</span>" : "") +
            (item.vehicle ? '<span><i class="fas fa-bus"></i>' + item.vehicle + "</span>" : "") +
            (item.departureDate ? '<span><i class="fas fa-calendar"></i>' + item.departureDate + "</span>" : "");

        wrapper.innerHTML =
            '<div class="sec-12-cart-item-image">' +
                '<img src="' + (item.image || "") + '" alt="' + (item.name || "") + '">' +
            "</div>" +
            '<div class="sec-12-cart-item-content">' +
                "<h3>" + (item.name || "") + "</h3>" +
                '<div class="sec-12-cart-item-info">' + infoHtml + "</div>" +
                '<div class="sec-12-passenger-list">' + passengersHtml + "</div>" +
                '<div class="sec-12-cart-item-bottom">' +
                    '<div class="sec-12-cart-item-price">' + formatMoney(item.totalPrice) + " đ</div>" +
                    '<button type="button" class="sec-12-remove-item">' +
                        '<i class="fas fa-trash"></i> Xóa' +
                    "</button>" +
                "</div>" +
            "</div>";

        const removeButton = wrapper.querySelector(".sec-12-remove-item");

        removeButton.addEventListener("click", function () {
            removeItem(item.id);
        });

        return wrapper;

    }

    /* -----------------------------------------------------
       XOÁ 1 CHUYẾN ĐI
    ----------------------------------------------------- */

    function removeItem(id) {
        let cart = getCart();
        cart = cart.filter(function (item) {
            return item.id !== id;
        });
        saveCart(cart);
        renderCart();
        updateHeaderCartCount();
    }

    /* -----------------------------------------------------
       RENDER TOÀN BỘ GIỎ HÀNG
    ----------------------------------------------------- */

    function renderCart() {

        const cart = getCart();

        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            emptyCartEl.classList.add("show");
        } else {
            emptyCartEl.classList.remove("show");
            cart.forEach(function (item) {
                cartItemsContainer.appendChild(renderCartItem(item));
            });
        }

        let totalPassengers = 0;
        let totalPrice = 0;

        cart.forEach(function (item) {
            totalPassengers += item.totalPassengers || 0;
            totalPrice += item.totalPrice || 0;
        });

        if (tourCountEl) {
            tourCountEl.textContent = cart.length;
        }

        if (passengerCountEl) {
            passengerCountEl.textContent = totalPassengers;
        }

        if (summaryTotalEl) {
            summaryTotalEl.textContent = formatMoney(totalPrice) + " đ";
        }

        if (paymentTotalEl) {
            paymentTotalEl.textContent = formatMoney(totalPrice) + " đ";
        }

        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
        }

        if (clearButton) {
            clearButton.disabled = cart.length === 0;
        }

        if (cart.length === 0 && paymentSection) {
            paymentSection.classList.remove("show");
        }

    }

    /* -----------------------------------------------------
       XOÁ TOÀN BỘ GIỎ HÀNG
    ----------------------------------------------------- */

    if (clearButton) {
        clearButton.addEventListener("click", function () {

            const cart = getCart();
            if (cart.length === 0) {
                return;
            }

            if (!confirm("Xóa toàn bộ giỏ hàng?")) {
                return;
            }

            saveCart([]);
            renderCart();
            updateHeaderCartCount();

            if (paymentSection) {
                paymentSection.classList.remove("show");
            }

        });
    }

    /* -----------------------------------------------------
       MỞ FORM THANH TOÁN
    ----------------------------------------------------- */

    if (checkoutButton && paymentSection) {
        checkoutButton.addEventListener("click", function () {

            const cart = getCart();
            if (cart.length === 0) {
                return;
            }

            paymentSection.classList.add("show");
            paymentSection.scrollIntoView({ behavior: "smooth", block: "start" });

        });
    }

    /* -----------------------------------------------------
       CHỌN PHƯƠNG THỨC THANH TOÁN
    ----------------------------------------------------- */

    const paymentRadios = cartSection.querySelectorAll('input[name="paymentMethod"]');

    paymentRadios.forEach(function (radio) {
        radio.addEventListener("change", function () {

            if (!bankInfoEl || !radio.checked) {
                return;
            }

            if (radio.value === "bank") {
                bankInfoEl.classList.add("show");
            } else {
                bankInfoEl.classList.remove("show");
            }

        });
    });

    /* -----------------------------------------------------
       XÁC NHẬN ĐẶT TOUR
    ----------------------------------------------------- */

    if (submitButton) {
        submitButton.addEventListener("click", function () {

            const cart = getCart();

            if (cart.length === 0) {
                alert("Giỏ hàng đang trống.");
                return;
            }

            const fullNameInput = cartSection.querySelector("#sec-12-full-name");
            const phoneInput = cartSection.querySelector("#sec-12-phone");
            const emailInput = cartSection.querySelector("#sec-12-email");

            if (
                (fullNameInput && !fullNameInput.value.trim()) ||
                (phoneInput && !phoneInput.value.trim()) ||
                (emailInput && !emailInput.value.trim())
            ) {
                alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
                return;
            }

            saveCart([]);
            updateHeaderCartCount();
            renderCart();

            if (paymentSection) {
                paymentSection.classList.remove("show");
            }

            if (successSection) {
                successSection.classList.add("show");
                successSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }

        });
    }

    /* -----------------------------------------------------
       KHỞI TẠO
    ----------------------------------------------------- */

    renderCart();
    updateHeaderCartCount();

});
