# 🌏 Project 1 - Website Du Lịch

> Một project Node.js + Express + Pug được xây dựng trong quá trình học Backend.
>
> Đây không phải một hệ thống thương mại điện tử hoàn chỉnh, mà là project thực hành để ôn lại kiến thức Node.js, Express, Pug, MongoDB/Mongoose, JavaScript, HTML và CSS.
>
> Nói đơn giản:
>
> **Học đến đâu → code đến đó → lỗi đâu → sửa đó → cuối cùng thành một cái website du lịch.** 🥹

---

## 📌 Giới thiệu

`project-1` là một website giới thiệu và đặt tour du lịch được xây dựng bằng Node.js.

Project tập trung vào việc thực hành cách xây dựng một website có cấu trúc tương đối hoàn chỉnh:

- Backend với Node.js và Express
- Template Engine với Pug
- Database với MongoDB và Mongoose
- Tách Route / Controller / Model
- Quản lý biến môi trường bằng `.env`
- Xây dựng giao diện bằng HTML + Pug + CSS
- Xử lý tương tác bằng JavaScript
- Thiết kế Responsive cho nhiều kích thước màn hình
- Tái sử dụng giao diện bằng Pug Mixin
- Xây dựng các card tour
- Trang danh sách tour
- Trang chi tiết tour
- Gallery ảnh
- Bộ chọn số lượng hành khách
- Tính tổng tiền tự động

Project được phát triển theo hướng:

> **Không cần code hoàn hảo ngay từ đầu. Quan trọng là hiểu lỗi, sửa lỗi và hiểu vì sao nó lỗi.**

---

# 🛠️ Công nghệ sử dụng

## Backend

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [Nodemon](https://nodemon.io/)

## Frontend

- HTML
- CSS
- JavaScript
- Pug
- Font Awesome
- Swiper / giao diện slider được sử dụng cho các khu vực hiển thị tour

## Database

- MongoDB
- Mongoose

## Package Manager

- Yarn `4.14.1`

---

# 📂 Cấu trúc project

```text
project-1/
│
├── config/
│   └── database.config.js
│
├── controllers/
│   └── client/
│       └── home.controller.js
│
├── models/
│   └── tour.model.js
│
├── public/
│   └── assets/
│       ├── css/
│       ├── js/
│       └── image/
│
├── routes/
│   └── client/
│       ├── home.route.js
│       ├── index.route.js
│       └── tour.route.js
│
├── views/
│   ├── client/
│   │   └── pages/
│   │       ├── home.pug
│   │       ├── tour-detail.pug
│   │       └── tour-list.pug
│   │
│   ├── layouts/
│   │   └── default.pug
│   │
│   └── partials/
│       ├── header.pug
│       ├── footer.pug
│       └── box-contact.pug
│
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── .yarnrc.yml
├── index.js
├── package.json
├── package-lock.json
├── yarn.lock
└── README.md