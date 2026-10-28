# Thư viện hiệu ứng giao diện

Đã xem Animate.css và AOS từ repository gốc. Hai URL tìm kiếm GitHub người dùng gửi không tải được qua công cụ duyệt; không coi các repo dưới đây là kết quả đã đọc từ hai trang tìm kiếm đó.

## Thư viện được tích hợp

Animate.css **4.1.1**, tác giả Daniel Eden và các cộng tác viên, giấy phép MIT.

- Repository: https://github.com/animate-css/animate.css
- Hướng dẫn: https://animate.style/
- CSS gốc: https://raw.githubusercontent.com/animate-css/animate.css/v4.1.1/animate.min.css
- Giấy phép được giữ trong `wwwroot/lib/animate-css/LICENSE`.

File CSS được lưu local, không phụ thuộc CDN khi demo. Không đổi file thư viện gốc.

`restaurant-motion.js` dùng IntersectionObserver để chạy fadeInUp một lần khi nội dung đi vào màn hình; dùng fadeIn cho ảnh banner, zoomIn khi mở dialog, pulse khi số lượng giỏ hàng thực sự tăng. MutationObserver xử lý menu được vẽ lại khi tìm kiếm/lọc. Vòng sáng khi bấm nút là CSS/JavaScript riêng, không lấy từ Animate.css.

`restaurant-motion.css` điều chỉnh thời lượng và phạm vi áp dụng. Chế độ giảm chuyển động tắt animation; người dùng có thể chủ động bật bằng nút đã có trên banner. Tắt lại sẽ hủy animation đang chạy và hiện nội dung chờ xuất hiện.

## Phương án đã xem nhưng chưa dùng

AOS: https://github.com/michalsnik/aos — hỗ trợ hiệu ứng khi cuộn nhưng trùng với IntersectionObserver đã có; thêm một bộ theo dõi cuộn nữa chưa cần thiết.

Backend ASP.NET MVC, quyền truy cập và dữ liệu SQL Server không thay đổi.

## Kết quả kiểm tra tích hợp

- Build .NET: 0 lỗi, 0 cảnh báo.
- Kiểm tra cú pháp cả 3 file JavaScript và 10/10 test frontend đạt.
- Trình duyệt xác nhận keyframe fadeInUp/fadeIn chạy với thời lượng 0.65 giây khi bật hiệu ứng.
- Tắt hiệu ứng: 0 phần tử đang animation, 0 phần tử bị ẩn chờ cuộn.
- Tìm kiếm cá hồi còn 1 thẻ; nút banner mở chi tiết cá hồi bình thường.
- Mobile 390×844: nội dung rộng 375px, không tràn ngang; không ghi nhận console error.
- Chưa chạy lại toàn bộ kiểm thử nghiệp vụ SQL; nhịp giỏ hàng được gắn theo số lượng tăng, không thay xử lý đơn hàng.
