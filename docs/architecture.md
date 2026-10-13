# Kiến trúc bản C# và liên hệ bài giảng

Quyết định ngày 13/10/2026: chuyển backend Express sang ASP.NET Core MVC để nhóm mở, đọc và debug trong Visual Studio. Giữ SQL Server và hợp đồng API để tiếp tục dùng giao diện đã có.

```text
Trình duyệt: Razor layout + HTML/CSS/JavaScript
    ↓ HTTP/JSON cùng nguồn
Controllers: nhận request, kiểm tra model, phân quyền vai trò
    ↓
Services: quy tắc đặt bàn, đơn, hóa đơn và transaction
    ↓
Data/RestaurantDb: Dapper + Microsoft.Data.SqlClient
    ↓
SQL Server: RestaurantCNPMNC
```

- Một ứng dụng triển khai chung (monolith), client–server; phù hợp nhóm 2 người, giao dịch đặt bàn/hóa đơn cần nhất quán. Tham chiếu Week 5: Architectural Drivers, Layered Architecture, Client–Server, Monolith vs Microservices, ADR.
- MVC: Models là DTO đầu vào; Controllers điều phối HTTP; Views là Razor. Giao diện động vẫn dùng JavaScript. Không khẳng định toàn bộ màn hình đã chuyển thành form Razor phía server.
- Đánh đổi: giữ giao diện giúp giảm lỗi khi chuyển backend, nhưng code render giao diện còn tập trung ở app.js. SQL nghiệp vụ vẫn nằm trong Services, Data quản lý thực thi truy vấn/transaction.
- Week 4: yêu cầu nghiệp vụ được kiểm tra qua API tests. Hóa đơn dùng giá lúc đặt; lượt dùng bàn tách biệt giữa các lần ghé. Không suy diễn rằng mọi NFR đã đạt chỉ vì API test pass.
- Week 1–3: backlog, phân công, estimate và tiến độ thực tế cần nhóm ghi khi làm. Bộ code/test không thay thế bằng chứng Sprint, trao đổi nhóm hoặc số giờ thực tế; không tạo lại lịch sử giả.

Bản báo cáo cũ chưa được sửa sang công nghệ C# trong lần chuyển đổi này theo yêu cầu làm web trước.
