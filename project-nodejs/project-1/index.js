const express = require('express')
const path = require('path');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://hunganhokokok0_db_user:IV39iWz2nYOIqWDm@cluster0.wvdfh4d.mongodb.net/?appName=Cluster0', {
}).then(() => {
  console.log('Kết nối thành công đến MongoDB');
}).catch((error) => {
  console.error('Lỗi kết nối đến MongoDB:', error);
});
const Tour = mongoose.model('Tour', {
  name: String,
  vehicle: String
});
const app = express()
const port = 3000

// Thiết lập views và view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Thiết lập thư mục chứa các tệp tĩnh (CSS, JS, hình ảnh) của Front-end
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render("client/pages/home.pug", {
    pageTitle: "Trang chủ"
  })
})

app.get('/tours', async (req, res) => {
  const tourList = await Tour.find(); // Lấy danh sách tour từ cơ sở dữ liệu

  console.log(tourList); // In ra danh sách tour để kiểm tra

  res.render("client/pages/tour-list.pug", {
    pageTitle: "Danh sách tour",
    tourList: tourList
  })
})

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`)
})


