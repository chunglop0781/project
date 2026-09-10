<div align="center">

# 🚀 RESTful API Design

### 13 Best Practices to Make Your API Users Happy

<p>
  <img src="https://img.shields.io/badge/API-RESTful-FF6B6B?style=for-the-badge&logo=fastapi&logoColor=white" alt="RESTful API">
  <img src="https://img.shields.io/badge/HTTP-Methods-4A90E2?style=for-the-badge&logo=httpie&logoColor=white" alt="HTTP">
  <img src="https://img.shields.io/badge/Response-JSON-000000?style=for-the-badge&logo=json&logoColor=white" alt="JSON">
  <img src="https://img.shields.io/badge/Status-Codes-6C5CE7?style=for-the-badge" alt="Status Codes">
</p>

<p>
  <b>📚 Learning Resource</b> ·
  <b>🌐 REST API</b> ·
  <b>💡 Best Practices</b>
</p>

<br>

> **Thiết kế API tốt không chỉ là làm cho API chạy được —  
> mà là làm cho API dễ hiểu, dễ dùng và dễ bảo trì.**

</div>

---

## 📖 Overview

**REST (Representational State Transfer)** là một kiểu kiến trúc được sử dụng phổ biến để xây dựng Web API.

REST tập trung vào **Resource (tài nguyên)** và sử dụng các thành phần của HTTP để client giao tiếp với server.

Một REST API tốt cần đảm bảo:

```text
┌─────────────────────────────────────────────┐
│              RESTful API                    │
├─────────────────────────────────────────────┤
│                                             │
│  HTTP Method   →   Hành động                 │
│  URI           →   Tài nguyên                │
│  Status Code   →   Kết quả                   │
│  JSON          →   Dữ liệu                   │
│  Convention    →   Tính nhất quán            │
│                                             │
└─────────────────────────────────────────────┘
```

### 🧩 CRUD Mapping

| HTTP Method | CRUD | Operation |
|:---:|:---:|---|
| `GET` | Read | Lấy dữ liệu |
| `POST` | Create | Tạo mới |
| `PUT` | Update | Cập nhật toàn bộ |
| `PATCH` | Update | Cập nhật một phần |
| `DELETE` | Delete | Xóa |

---

## ✨ Features

- ✅ RESTful URI design
- ✅ HTTP Methods chuẩn
- ✅ JSON Response
- ✅ HTTP Status Codes
- ✅ Error Handling
- ✅ Filtering
- ✅ Pagination
- ✅ Authentication & Authorization
- ✅ Asynchronous Processing
- ✅ API Design Convention

---

# ⚙️ Installation

Tài liệu này chủ yếu phục vụ **học tập và tham khảo**, không yêu cầu cài đặt một project cụ thể.

Tuy nhiên, để thực hành REST API, bạn có thể sử dụng một trong các framework sau.

### 🐍 Python

```bash
pip install falcon
```

Hoặc:

```bash
pip install djangorestframework
```

### 🟢 Node.js

```bash
npm install restify
```

Sau khi cài đặt, bạn có thể bắt đầu xây dựng API dựa trên các nguyên tắc trong tài liệu này.

---

# 🔌 API Examples

## 1. Get all articles

```http
GET /articles/
```

Response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "data": [
    {
      "id": 1,
      "title": "REST API Design"
    },
    {
      "id": 2,
      "title": "HTTP Fundamentals"
    }
  ]
}
```

---

## 2. Get an article

```http
GET /articles/1
```

Response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "id": 1,
  "title": "REST API Design",
  "author": "Florimond Manca"
}
```

---

## 3. Create an article

```http
POST /articles/
Content-Type: application/json
```

Request:

```json
{
  "title": "REST API Best Practices",
  "author_id": 12
}
```

Response:

```http
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "id": 101,
  "title": "REST API Best Practices",
  "author_id": 12
}
```

---

## 4. Update an article

```http
PATCH /articles/101
Content-Type: application/json
```

Request:

```json
{
  "title": "REST API Design Guide"
}
```

Response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

---

## 5. Delete an article

```http
DELETE /articles/101
```

Response:

```http
HTTP/1.1 204 No Content
```

---

# ❌ Error Response

Một API tốt không nên chỉ trả về:

```text
Invalid request
```

Thay vào đó, hãy trả về JSON có cấu trúc rõ ràng:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "error": "Invalid payload.",
  "detail": {
    "surname": "This field is required."
  }
}
```

### 💡 Tại sao?

Client có thể biết chính xác:

```text
Request
   │
   ▼
Validation
   │
   ├── ❌ Invalid
   │      │
   │      ▼
   │   400 Bad Request
   │      +
   │   JSON Error
   │
   └── ✅ Valid
          │
          ▼
       Process
```

---

# 🏆 13 Best Practices

## 01 — Master HTTP Fundamentals

Hiểu rõ HTTP trước khi thiết kế REST API.

### HTTP Methods

```text
GET       → Read
POST      → Create
PUT       → Update
PATCH     → Partial Update
DELETE    → Delete
```

### Status Code Groups

```text
1xx → Informational
2xx → Success
3xx → Redirection
4xx → Client Error
5xx → Server Error
```

---

## 02 — Always Return JSON Properly

Không chỉ trả JSON trong body.

Phải khai báo:

```http
Content-Type: application/json
```

Ví dụ:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "id": 1,
  "name": "ABC Building"
}
```

### 🖼️ Example

![Content-Type application/json](https://florimond.dev/static/img/restapi-json.png)

---

## 03 — Don't Use Verbs in URI

HTTP Method đã thể hiện hành động.

### ❌ Bad

```http
GET /articles/hello-world/generateBanner
POST /articles/createNewArticle
```

### ✅ Good

```http
GET  /articles/hello-world/banner
POST /articles/
```

> **HTTP Method = Action**  
> **URI = Resource**

---

## 04 — Use Plural Nouns

Nên sử dụng danh từ số nhiều.

### ❌ Bad

```http
GET /article/
GET /user/
GET /product/
```

### ✅ Good

```http
GET /articles/
GET /users/
GET /products/
```

CRUD:

```http
GET    /articles/
POST   /articles/
GET    /articles/1
PUT    /articles/1
PATCH  /articles/1
DELETE /articles/1
```

---

## 05 — Return Detailed Errors

Error response cần có đủ thông tin để client debug.

### Recommended

```json
{
  "error": "Invalid payload.",
  "detail": {
    "email": "This field is required.",
    "password": "Password is too short."
  }
}
```

### 🎯 Mục tiêu

```text
❌ Something went wrong

          ↓

✅ What went wrong?
✅ Which field?
✅ Why?
✅ How to fix?
```

---

## 06 — Use Correct Status Codes

### ❌ Bad

```http
HTTP/1.1 200 OK

{
  "status": "failure",
  "error": "Invalid request"
}
```

### ✅ Good

```http
HTTP/1.1 400 Bad Request

{
  "error": "Invalid request"
}
```

> 🚨 **Đừng dùng `200 OK` cho một request thực sự thất bại.**

---

## 07 — Be Consistent With Status Codes

Nên thống nhất convention trên toàn bộ API.

| Operation | Recommended |
|---|---|
| `GET` | `200 OK` |
| `POST` | `201 Created` |
| `PUT` | `200 OK` |
| `PATCH` | `200 OK` |
| `DELETE` | `204 No Content` |

Consistency giúp client không phải "đoán ý" API.

---

## 08 — Avoid Deep Nested Resources

### ❌ Too Nested

```http
GET /authors/12/articles/
```

### ✅ Better

```http
GET /articles/?author_id=12
```

Query String phù hợp cho các điều kiện lọc.

Ví dụ:

```http
GET /articles/?author_id=12
```

Có nghĩa:

> Lấy tất cả articles của author có ID = `12`.

---

## 09 — Handle Trailing Slashes

Có thể sử dụng:

```text
/articles/
```

hoặc:

```text
/articles
```

Điều quan trọng nhất là **nhất quán**.

Ví dụ project chọn:

```text
/articles/
/users/
/products/
```

Nếu client request:

```text
/articles
```

server có thể redirect:

```text
/articles/
```

---

## 10 — Use Query Strings for Filtering & Pagination

### 🔎 Filtering

```http
GET /articles/?published=true
```

### 📄 Pagination

```http
GET /articles/?page=1&page_size=10
```

### 🔥 Combined

```http
GET /articles/?published=true&page=2&page_size=20
```

Có thể mở rộng:

```http
GET /articles/?author_id=12
GET /articles/?category=technology
GET /articles/?sort=-created_at
GET /articles/?search=rest
```

---

## 11 — Understand 401 vs 403

Đây là một trong những cặp status code dễ nhầm nhất.

### 🔐 401 Unauthorized

Client **chưa xác thực** hoặc credentials không hợp lệ.

```http
HTTP/1.1 401 Unauthorized
```

Ví dụ:

```text
Không có token
      ↓
   401
```

---

### 🚫 403 Forbidden

Client **đã xác thực**, nhưng không có quyền.

```http
HTTP/1.1 403 Forbidden
```

Ví dụ:

```text
Có token
   ↓
Đã đăng nhập
   ↓
Không đủ quyền
   ↓
  403
```

### 🧠 Easy Remember

```text
401 → Who are you?
403 → I know who you are,
      but you can't do that.
```

---

## 12 — Use 202 Accepted

`202 Accepted` phù hợp với các request được xử lý **bất đồng bộ**.

Ví dụ:

```http
POST /reports/generate
```

Response:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json
```

```json
{
  "message": "Report generation started.",
  "job_id": "abc123"
}
```

Flow:

```text
Client
  │
  │ POST /reports/generate
  ▼
Server
  │
  ├── Accept request
  │
  ├── Create background job
  │
  └── 202 Accepted
         │
         ▼
   Background Worker
         │
         ▼
      Complete
```

### Suitable for

- Background jobs
- Generate reports
- Generate files
- Long-running tasks
- Data processing

---

## 13 — Use a REST API Framework

Không nhất thiết phải tự xây mọi thứ từ đầu.

### 🐍 Python

| Framework | Use Case |
|---|---|
| Falcon | Lightweight REST API |
| Django REST Framework | Full-featured REST API |

### 🟢 Node.js

| Framework | Use Case |
|---|---|
| Restify | REST API services |

### 🦅 Falcon

![Falcon](https://florimond.dev/static/img/logo-falcon.png)

> **Falcon — Unburdening APIs for over 0.0564 centuries.**

---

# 📊 HTTP Status Code Cheat Sheet

| Code | Meaning | Typical Usage |
|:---:|---|---|
| `200` | OK | GET / PUT / PATCH success |
| `201` | Created | POST success |
| `202` | Accepted | Async processing |
| `204` | No Content | DELETE success |
| `400` | Bad Request | Invalid request |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permission |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource conflict |
| `422` | Unprocessable Content | Validation error |
| `500` | Internal Server Error | Server failure |

---

# 🧱 Recommended API Structure

Một API có cấu trúc dễ hiểu:

```text
/api
│
├── /articles
│   ├── GET
│   ├── POST
│   │
│   └── /:id
│       ├── GET
│       ├── PUT
│       ├── PATCH
│       └── DELETE
│
├── /users
│   ├── GET
│   ├── POST
│   └── /:id
│
└── /comments
    ├── GET
    └── POST
```

Ví dụ:

```http
GET    /api/articles
POST   /api/articles

GET    /api/articles/10
PUT    /api/articles/10
PATCH  /api/articles/10
DELETE /api/articles/10
```

---

# 🧪 API Design Checklist

Trước khi release API, hãy kiểm tra:

```text
[ ] Resource sử dụng danh từ?
[ ] URI có tránh động từ?
[ ] HTTP Method có đúng?
[ ] Status Code có chính xác?
[ ] Content-Type có đúng?
[ ] Response có JSON?
[ ] Error response có đủ thông tin?
[ ] Filtering dùng Query String?
[ ] Pagination dùng Query String?
[ ] 401 và 403 được phân biệt?
[ ] API convention có nhất quán?
[ ] Nested resources có quá sâu?
[ ] Async task có sử dụng 202?
```

---

# 🎬 Recommended Video

<div align="center">

### You Give REST a Bad Name

**Dylan Beattie**

[![You Give REST a Bad Name](https://img.youtube.com/vi/nSKp2StlS6s/maxresdefault.jpg)](https://www.youtube.com/watch?v=nSKp2StlS6s)

</div>

---

# 📚 Resources

### 📖 Original Article

**RESTful API Design: 13 Best Practices to Make Your Users Happy**

Florimond Manca — 26/08/2018

https://florimond.dev/en/posts/2018/08/restful-api-design-13-best-practices-to-make-your-users-happy

### 🎨 Images

```text
Content-Type JSON
https://florimond.dev/static/img/restapi-json.png

Falcon
https://florimond.dev/static/img/logo-falcon.png
```

---

# 🧠 Quick Summary

```text
                    REST API
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     RESOURCE         HTTP           JSON
        │            METHODS        RESPONSE
        │              │              │
     /articles/    GET / POST      application/json
        │          PUT / PATCH
        │            DELETE
        │
        └──────────────┬──────────────┘
                       │
                 STATUS CODES
                       │
          ┌────────────┼────────────┐
          │            │            │
         2xx          4xx          5xx
       Success       Client       Server
                       Error        Error
```

---

<div align="center">

## ⭐ If this documentation helped you

**Learn → Practice → Build → Improve**

Made for learning RESTful API design 🚀

</div>

---

## 📌 License & Attribution

Tài liệu này là bản **tổng hợp và biên soạn tiếng Việt** dựa trên bài viết gốc của **Florimond Manca**.

Nội dung được sử dụng cho mục đích **học tập, tham khảo và thực hành thiết kế REST API**.

**Original Article:**  
https://florimond.dev/en/posts/2018/08/restful-api-design-13-best-practices-to-make-your-users-happy