# Bếp Nhà – ASP.NET Core MVC + SQL Server

## Mở bằng Visual Studio

1. Mở `RestaurantMvc.sln` bằng Visual Studio 2026 (máy này có phiên bản 18.8).
2. Trong Solution Explorer, nhấp phải project **RestaurantMvc** → **Set as Startup Project** nếu chưa được chọn.
3. Chọn profile **RestaurantMvc**, nhấn **F5** (debug) hoặc **Ctrl+F5** (chạy không debug).
4. Trình duyệt mở `http://localhost:5080`. Dừng debug bằng Shift+F5.

Database hiện tại đã sẵn sàng: `Diddy\SQLEXPRESS` / `RestaurantCNPMNC`, Windows Authentication.
Không cần Node.js, npm hoặc chạy bản Express để chạy website này.

| Vai trò | Tài khoản | Mật khẩu demo |
|---|---|---|
| Khách | khach | khach123 |
| Nhân viên | nhanvien | nhanvien123 |
| Quản lý | admin | admin123 |

Phân quyền khu vực quản lý:

- **Nhân viên:** đặt bàn, nhận bàn, xử lý trạng thái đơn món, xem sơ đồ bàn, lập/thanh toán hóa đơn và trả lời tin nhắn hỗ trợ.
- **Quản lý:** có toàn bộ quyền của nhân viên, thêm quyền xem **Dashboard & doanh thu**, quản lý món, CRUD công thức, xem danh sách khách hàng và lịch sử đặt bàn/đơn món của từng khách.
- Dashboard/doanh thu được khóa ở backend với role `admin`; nhân viên không thể gọi trực tiếp API này.

## Đọc code trong Solution Explorer

- `Program.cs`: cấu hình MVC, cookie đăng nhập, phân quyền, giới hạn đăng nhập, xử lý lỗi.
- `Controllers/Customer/`: đăng nhập, menu và luồng khách hàng.
- `Controllers/Staff/`: đặt bàn, nhận bàn, gọi món, hóa đơn và hộp thư hỗ trợ.
- `Controllers/Admin/`: dashboard/doanh thu và quản lý khách hàng.
- `Controllers/Shared/`: API nền và Razor Home dùng chung.
- `Models/Requests.cs`: các lớp dữ liệu nhận từ giao diện và ràng buộc đầu vào.
- `Services/Customer/`, `Services/Staff/`, `Services/Admin/`: nghiệp vụ được chia theo vai trò; mỗi service vẫn dùng kiểm tra quyền sở hữu và transaction SQL.
- `Data/RestaurantDb.cs`: mở kết nối SQL Server, truy vấn có tham số và transaction bằng Dapper.
- `Data/DatabaseInitializer.cs`: tạo database/schema và dữ liệu mẫu khi chạy lệnh init.
- `Views/Home/Index.cshtml`, `Views/Shared/_Layout.cshtml`, `_Header.cshtml`, `_Footer.cshtml`: trang Razor và khung chung.
- `wwwroot/app.js`: phần giao diện tương tác, giỏ hàng, tìm món, gọi API và cập nhật trạng thái.
- `wwwroot/styles.css`, `wwwroot/assets`: CSS và hình minh họa.
- `Database/schema.sql`: các bảng, khóa ngoại, chỉ mục, ràng buộc.
- Project `RestaurantMvc.Tests` (thư mục `tests/RestaurantMvc.Tests`): kiểm thử C# / xUnit với SQL Server thật.

Đây là ASP.NET Core MVC kết hợp JavaScript gọi API: Razor trả khung trang; danh sách, form tương tác và giỏ hàng được dựng/cập nhật bằng JavaScript. Backend đã chuyển sang C# hoàn toàn. Không dùng Entity Framework; truy vấn T-SQL có tham số qua Dapper. Chưa tách mỗi truy vấn thành repository riêng.

## Chạy bằng terminal (tùy chọn)

```powershell
dotnet restore RestaurantMvc.sln
dotnet run --project RestaurantMvc.csproj
```

Khi cài ở máy khác: sửa `ConnectionStrings:Restaurant` trong `appsettings.json` cho đúng SQL Server, sau đó:

```powershell
dotnet run --project RestaurantMvc.csproj -- --init-db
```

Init chỉ tạo đối tượng/dữ liệu còn thiếu, không xóa database đang có. Không tự reset mật khẩu. Dùng scrypt tương thích bản Node.js nên tài khoản cũ đăng nhập được.

## Kiểm thử

Visual Studio → Test → Test Explorer → Run All Tests; hoặc:

```powershell
dotnet test RestaurantMvc.sln
```

Test tạo database riêng tên `RestaurantMvc_Test_<GUID>` rồi tự xóa đúng database đó. Tài khoản Windows chạy test cần quyền tạo/xóa database test trên SQL Server. Website dùng database `RestaurantCNPMNC`, không bị test sửa dữ liệu.

## Giới hạn

- Ghi nhận tiền mặt/chuyển khoản thủ công; không tích hợp cổng thanh toán.
- Chưa đo tải 20 người đồng thời trong 5 phút và chưa thử phục hồi backup.
- Bản Node.js tại `../restaurant-web` được giữ để đối chiếu, nhưng mở solution này để làm tiếp.
- Website dùng SQL Server đang có, gồm cả dữ liệu demo/lịch sử của bản cũ.

## Git repository

Tạo repository tại `C:\CNPMNC\RestaurantMvc`. Solution và cả hai project đều nằm trong thư mục này. Thư mục kiểm thử cũ `C:\CNPMNC\RestaurantMvc.Tests` chỉ được giữ để dự phòng; solution không còn tham chiếu nó. Không đưa bin, obj, .vs hoặc logs lên Git.

## Quy tắc giỏ hàng (cập nhật 13/10/2026)

Khách chưa đăng nhập được xem/tìm món nhưng không được thêm món hoặc mở nội dung giỏ. Khi thao tác, website yêu cầu đăng nhập tài khoản customer. Mỗi tài khoản có giỏ localStorage riêng; giỏ guest cũ không được đọc hoặc nhập vào tài khoản. Trước khi sửa giỏ, website kiểm tra phiên đăng nhập với server. Gửi đơn vẫn cần một lượt bàn đang mở và được backend kiểm tra quyền sở hữu.

Kiểm thử FE: `node --test tests/frontend-init.test.cjs` (8 ca, gồm đăng nhập/guest/cart/phiên hết hạn).

## Chi tiết món và công thức (13/10/2026)

- Bấm ảnh hoặc tên món để xem giá, mô tả, nguyên liệu, các bước chế biến, khẩu phần và thời gian.
- Khách/nhân viên chỉ đọc; admin có Thêm, Sửa, Xóa công thức. Trong Quản lý món có nút Công thức ở từng dòng.
- Nhập mỗi nguyên liệu hoặc bước chế biến trên một dòng. Công thức chưa nhập hiện thông báo chưa cập nhật; chưa điền công thức mẫu.
- Xóa có bước xác nhận, chỉ xóa công thức, giữ món và lịch sử đơn hàng.
- SQL: bảng DishRecipes, FK dishId → Dishes.id. Database trên máy đã được cập nhật; máy khác chạy lại --init-db để thêm bảng.
- API: GET /api/menu/{id}; POST, PUT, DELETE /api/menu/{id}/recipe. Các thao tác ghi chỉ admin, kiểm tra phía server. Món ẩn chỉ admin xem chi tiết.
- Kiểm chứng: 12/12 xUnit, 10/10 frontend tests. Bao gồm CRUD, quyền guest/customer/staff/admin, validation, món ẩn, escape HTML và chạy init lại sau khi xóa.
- Đã kiểm tra trình duyệt: khách mở chi tiết; admin mở form qua Quản lý món → Công thức. Không nhập công thức thật vào database demo khi kiểm tra UI.
