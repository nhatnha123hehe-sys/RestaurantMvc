# Kiểm chứng chuyển sang ASP.NET Core MVC — 13/10/2026

- Visual Studio Community 2026 18.8; .NET SDK 10.0.302.
- Build solution thành công: 0 warning, 0 error.
- xUnit: 11/11 test đạt. Xem test-results.txt. Một test tích hợp kiểm tra trọn luồng nghiệp vụ với nhiều tình huống liên tiếp; không coi 11 test là 11 chức năng độc lập.
- SQL Server thật: Diddy\SQLEXPRESS. Test dùng database GUID riêng và cleanup trong fixture; website dùng RestaurantCNPMNC cũ.
- Kiểm tra: tài khoản scrypt cũ, đăng xuất, chặn truy cập trái quyền, nguồn request khác, dữ liệu đặt bàn sai, đặt trùng đồng thời, nhận bàn lặp, đơn sai giá/số lượng, gửi đơn lặp, chuyển trạng thái, giá lịch sử, món ẩn/hết, gọi thêm, hủy, hóa đơn/thanh toán đồng thời và lượt bàn mới.
- Sau khi tách Razor layout, build và chạy lại 11/11 test đạt.
- Kiểm tra trình duyệt thực tế tại localhost:5080: thực đơn tải 12 món, đăng nhập admin cũ thành công, dashboard hiển thị lượt B01 đang mở từ database cũ. Không ghi thêm giao dịch vào database demo qua UI.
- Kiểm tra giao diện ở cửa sổ hẹp và console không có lỗi được ghi nhận. Chưa chạy lại toàn bộ kiểm tra desktop/mobile của bản cũ.
- Đã mở solution bằng devenv; xác nhận tiêu đề cửa sổ RestaurantMvc - Microsoft Visual Studio.
- Đã dừng server preview sau kiểm tra để không giữ cổng 5080 hoặc khóa file build khi người dùng nhấn F5.
- Chưa thao tác nút F5 trực tiếp trong IDE; profile Project, launchBrowser=true và port5080 đã cấu hình; ứng dụng đã chạy bằng dotnet run.
- Chưa kiểm chứng tải lớn, phục hồi backup hay triển khai máy khác.
