# Sửa giao diện 13/10/2026

- Đổi nhóm font tiêu đề/brand/badge sang Segoe UI, Arial để tránh trộn glyph tiếng Việt với Georgia.
- Sửa CSS specificity: padding trái của ô tìm kiếm là 42px, icon căn giữa và không bắt click.
- Thêm trạng thái đang tải/lỗi/đã sẵn sàng. Không vẽ menu rỗng khi người dùng đổi hash trước khi API hoàn tất.
- Nút Thử lại gọi lại API khởi tạo, không chỉ render các mảng rỗng.
- Kiểm tra kiểu dữ liệu menu/categories trả về trước khi render.
- Nút đặt bàn trên mobile không ngắt chữ; ghi chú có dòng riêng.
- Razor thêm asp-append-version cho CSS/JS để URL tài nguyên đổi khi nội dung đổi.

Kiểm tra thực tế: desktop1440x1000 và mobile375x812. Menu12món; tìm chanh trả Nước chanh tươi. Ô tìm kiếm có padding42px. Không tràn ngang: desktop1425/1440, mobile360/375 (có scrollbar). Giỏ thêm1món hiển thị79000VND; đã xóa món test khỏi giỏ. Form đặt bàn và dialog đăng nhập vừa màn hình nhỏ. Không tạo đặt bàn/đơn/hóa đơn mới.

3/3 kiểm thử JS đạt: tải ban đầu lỗi rồi retry thành công; render lúc API còn chờ; phản hồi API sai kiểu. Chạy: node --test tests/frontend-init.test.cjs. Node chỉ dùng cho bộ test frontend này, không cần để chạy web C#.

Không tái hiện chính xác sự cố mạng tại thời điểm ảnh người dùng được chụp. Đã xác nhận API hiện trả đủ12món và sửa được đường lỗi/retry có thể làm giao diện hiện0món. Không khẳng định mọi trang FE đã được kiểm tra hết.
