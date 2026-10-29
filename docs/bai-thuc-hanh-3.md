# Bài thực hành số 3 theo Product Backlog Bếp Nhà

Bản này **thay thế toàn bộ kế hoạch tự đề xuất cũ** sau khi người dùng bổ sung file Product Backlog và xác nhận chuyển mẫu bán điện thoại sang website nhà hàng, làm bài cá nhân. Người thực hiện: **Lê Minh Nhật**, GitHub **nhatnha123hehe-sys**.

## Nguồn và quy tắc chuyển đổi

Đã đọc đủ bốn sheet của `Lab1_PhamMinhThanh_24DH113381.xlsx`: Project Information, Team, Product backlog, Sprint backlog. Đã đối chiếu lại `Bài thực hành số 3.docx` về milestone, labels, issue, PR và lọc tiến độ.

Mẫu có 14 story, tổng 54 điểm. Sprint 1 chọn Story 1, 4, 2, 5, 6, tổng 14 điểm. Giữ mã story và điểm **ước lượng kế thừa**; không gọi chúng là số ngày hay số điểm thực tế của nhà hàng.

Các điều chỉnh đã nêu rõ trong từng issue:

- Điện thoại/giao hàng chuyển thành món ăn, đặt bàn và lượt phục vụ.
- Đơn vãng lai đổi thành đặt bàn/gọi món sau đăng nhập, theo quy tắc người dùng đã yêu cầu cho Bếp Nhà.
- Tạo tài khoản tự động từ giao hàng đổi thành đăng ký chủ động.
- Email định danh đổi thành username theo code hiện có; chưa triển khai đăng nhập email.
- Khách chọn COD đổi thành nhân viên/quản lý ghi nhận tiền mặt hoặc chuyển khoản tại nhà hàng; không phải tích hợp cổng thanh toán.
- Đồ án giữ nhóm 2 thành viên; Lab 3 là bài nộp cá nhân của Lê Minh Nhật. Danh tính, tài khoản và phân công thành viên còn lại cần xác nhận theo đồ án, không tự sao chép từ mẫu bán điện thoại.
- Không chép ngày cũ và ngày Excel lỗi. Deadline **29/10/2026** do người dùng xác nhận. Khoảng 28–29/10 là kế hoạch đối chiếu lần này, không giả lập hai tuần làm việc.

## Bản backlog hiện dùng

[File Excel Bếp Nhà cá nhân](backlog/Product_Backlog_BepNha_LeMinhNhat.xlsx) gồm 5 sheet: thông tin dự án, cá nhân, Product backlog, Sprint backlog và đối chiếu code. Các cột ngày thực hiện/điểm thực tế để trống vì không có dữ liệu gốc.

| Story | Chức năng | Điểm | Phạm vi | Kết quả đối chiếu | Issue |
|---|---|---:|---|---|---|
| US01 | Xem thực đơn và chi tiết món ăn | 2 | Sprint 1 | Đối chiếu đạt | [#6](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/6) |
| US02 | Đăng nhập để đặt bàn và gọi món theo lượt bàn | 5 | Sprint 1 | Đối chiếu đạt | [#7](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/7) |
| US03 | Đăng ký tài khoản khách hàng | 3 | Backlog | New | [#8](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/8) |
| US04 | Đăng nhập bằng tên đăng nhập và mật khẩu | 2 | Sprint 1 | Đối chiếu đạt | [#9](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/9) |
| US05 | Cập nhật hồ sơ và giữ nguyên tên đăng nhập | 2 | Sprint 1 | New | [#10](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/10) |
| US06 | Ghi nhận thanh toán tiền mặt hoặc chuyển khoản | 3 | Sprint 1 | Đối chiếu đạt | [#11](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/11) |
| US07 | Xem lịch đặt bàn, đơn món và hóa đơn của mình | 3 | Backlog | New | [#12](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/12) |
| US08 | Hủy đặt bàn khi đang chờ hoặc đã xác nhận | 3 | Backlog | New | [#13](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/13) |
| US09 | Đánh giá món sau khi hoàn tất bữa ăn | 3 | Backlog | New | [#14](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/14) |
| US10 | Lọc danh sách đặt bàn và đơn món | 5 | Backlog | New | [#15](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/15) |
| US11 | Thông báo khi có đặt bàn hoặc đơn món mới | 5 | Backlog | New | [#16](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/16) |
| US12 | Tạo khuyến mãi theo món hoặc hạng khách | 8 | Backlog | New | [#17](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/17) |
| US13 | Tạo khảo sát chất lượng phục vụ | 5 | Backlog | New | [#18](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/18) |
| US14 | Phân hạng khách theo chi tiêu đã thanh toán | 5 | Backlog | New | [#19](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/19) |

## Sprint 1 và kết quả

[Milestone Sprint 1](https://github.com/nhatnha123hehe-sys/RestaurantMvc/milestone/2), hạn **29/10/2026**. Toàn bộ issue giao cho tài khoản cá nhân.

- US01 (2), US04 (2), US02 (5), US06 (3): đã đối chiếu bằng code và bộ test liên quan; 12 điểm.
- **US05 (2): New, chưa có API/màn hình cập nhật hồ sơ.** Không đánh dấu Done, không đóng sprint.
- Tổng: **4/5 story, 12/14 điểm**, tương đương 85,7% điểm kế hoạch đã đối chiếu. Đây là mức độ đáp ứng của code hiện có, không phải năng suất viết code mới trong hai ngày.
- Chín story ngoài sprint giữ New/chưa nghiệm thu. Một số đã có code một phần; đánh giá, khuyến mãi, khảo sát và phân hạng chưa có.

Kiểm chứng chạy lại ngày 28/10/2026:

```text
dotnet test RestaurantMvc.sln --no-build --no-restore --nologo
Passed: 13; Failed: 0
node --test tests/frontend-init.test.cjs
Passed: 11; Failed: 0
```

Test .NET dùng database GUID riêng do fixture tạo; không đánh dấu tất cả 14 story đạt chỉ vì bộ test hiện có chạy qua. Chi tiết file/controller và điều kiện nghiệm thu nằm ở sheet Doi chieu code và từng issue.

## Thực hiện bài GitHub

1. Milestone có mục tiêu, deadline; task trong sprint có cùng milestone, task còn lại ở Product Backlog.
2. Labels: Product Backlog, Sprint 1, người thực hiện, point:2/3/5/8, New/In progress/Done và bug có sẵn.
3. Mỗi US là một issue có actor, tiêu chí, nguồn mẫu, thay đổi nghiệp vụ và phần code còn thiếu.
4. Các US được kiểm chứng đi qua New → In progress → Done và liên kết PR đối chiếu. PR tài liệu này không tuyên bố mới viết toàn bộ code nghiệp vụ.
5. US05 và các story chưa đủ tiêu chí giữ New; cập nhật tiếp theo tiến độ thực tế.
6. Sprint còn mở; phần này là báo cáo tiến độ, chưa phải tổng kết hoàn tất sprint.

Filter trong Issues của repository:

```text
is:issue label:"Product Backlog" -label:Superseded
is:issue milestone:"Sprint 1 - Bếp Nhà - Backlog cá nhân"
is:issue assignee:nhatnha123hehe-sys label:"In progress"
is:issue assignee:nhatnha123hehe-sys label:New label:"Sprint 1"
is:issue label:Done label:"Sprint 1"
is:issue label:bug
```

## Nội dung cũ đã bỏ khỏi bài chính

Issues #1–#3 và milestone #1 được gắn ĐÃ THAY THẾ; không còn là Product Backlog để nộp. PR #4 là lịch sử thay đổi code/tài liệu cũ, đã ghi chú kế hoạch bị thay thế. Giữ commit và code đang chạy để tránh mất chức năng; không xóa lịch sử rồi giả tạo lại thời điểm phát triển.
PR đối chiếu mới liên kết riêng US01, US02, US04, US06; US05 giữ mở. Không liên kết PR cũ #4 để đóng các story mới. Lịch sử issue mới thể hiện bước đối chiếu New → In progress → Done, không giả lập lịch sử phát triển đã xảy ra trong quá khứ.


## Cập nhật phạm vi nhóm và bài nộp cá nhân — 29/10/2026

Đồ án Bếp Nhà là sản phẩm của nhóm 2 người. Lab 3 vẫn là bài nộp cá nhân của Lê Minh Nhật; người nộp tổng hợp yêu cầu và minh chứng từ đồ án chung. Không dùng việc mọi issue đang giao Nhật để kết luận Nhật đã viết toàn bộ sản phẩm.

- Lê Minh Nhật: thành viên đã xác định; GitHub `nhatnha123hehe-sys`. Vai trò và phần code thực tế cần ghi theo phân công đã thống nhất.
- Thành viên thứ hai: giữ vị trí trong nhóm, chờ xác nhận họ tên, MSSV, GitHub và phần việc. File mẫu ghi Phạm Minh Thành nhưng chưa đủ cơ sở coi đó là thành viên chính thức của đồ án Bếp Nhà.
- File Excel hiện liên kết được lập cho bài cá nhân trước yêu cầu cập nhật này; sheet Team chưa phản ánh nhóm 2 người. Khi chốt danh sách sẽ sửa sheet Team và giữ riêng thông tin người nộp Lab 3.

Xem [Danh sách nội dung cần hoàn thiện và tài liệu cần bổ sung](lab3-noi-dung-can-hoan-thien.md). Phần cập nhật này được ưu tiên khi đọc các mô tả cũ về nhóm chỉ có một người.
