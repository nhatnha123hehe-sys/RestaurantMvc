# Bài thực hành số 3 — Triển khai dự án Bếp Nhà trên GitHub

Người thực hiện bài cá nhân: **Lê Minh Nhật**, GitHub **nhatnha123hehe-sys**. Nhóm đồ án: **Lê Minh Nhật và Phạm Minh Thành**. Dùng mã nguồn đồ án nhóm Bếp Nhà; không thay đổi Product Backlog trong lần hoàn thiện này.

## 1. Đối chiếu đúng yêu cầu đề

Nguồn: `Bài thực hành số 3.docx`, mục “Yêu cầu: Hãy triển khai dự án của nhóm lên Github”. Đề minh họa bằng blog, hai thành viên David/Ruby và mốc năm 2014; áp dụng quy trình đó cho Bếp Nhà. Thời gian thực hiện ghi trong đề là 2 tuần; không tạo giả lịch sử hai tuần. Hạn sprint 29/10/2026 là ngày người nộp đã xác nhận.

| Yêu cầu | Kết quả đã thực hiện | Minh chứng |
|---|---|---|
| Triển khai dự án lên GitHub | Repository có mã nguồn Bếp Nhà | [Repository](https://github.com/nhatnha123hehe-sys/RestaurantMvc) |
| Tạo sprint bằng Milestone có tiêu đề, mô tả, deadline | Milestone #2, hạn 29/10/2026 | [Sprint 1](https://github.com/nhatnha123hehe-sys/RestaurantMvc/milestone/2) |
| Tạo Labels cho người thực hiện, điểm, trạng thái và bug | Có Le Minh Nhat; point:2/3/5/8; New/In progress/Done; bug. Các nhãn point:0/1/3/7 của ví dụ cũng có sẵn | [Labels](https://github.com/nhatnha123hehe-sys/RestaurantMvc/labels) |
| Mỗi task là Issue, có assignee và điểm | Issues #6–#19; 5 task được chọn vào Sprint 1 | [Issues](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue+label%3A%22Product+Backlog%22) |
| Liên kết task với Pull Request bằng ID | PR #20 tham chiếu và đóng #6, #7, #9, #11 | [PR #20 đã merge](https://github.com/nhatnha123hehe-sys/RestaurantMvc/pull/20) |
| Cập nhật New → In progress → Done; kiểm tra rồi đóng task | 4 task đã đối chiếu và đóng, 1 task chưa đạt giữ mở | [Lịch sử mẫu #6](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/6) |
| Tổng kết sprint | Bảng kết quả bên dưới ghi cả việc chưa hoàn thành | Mục 2 |
| Lọc theo sprint, người phụ trách và trạng thái | Các liên kết lọc trực tiếp ở mục 3 | Mục 3 |

Đề yêu cầu quản lý dự án trên GitHub, không bắt buộc triển khai hosting, dùng Jira/GitHub Projects, tạo lại Product Backlog hoặc hoàn thành toàn bộ đồ án. Bài cá nhân dùng tài khoản người nộp cho các task Lab; không tự gán công việc cho thành viên chưa xác nhận. Thông tin nhóm đồ án được giữ riêng, không tuyên bố một cá nhân viết toàn bộ code.

## 2. Tổng kết Sprint 1

Kiểm tra trực tiếp GitHub ngày **29/10/2026**:

| Task | Điểm | Kết quả trên GitHub |
|---|---:|---|
| [US01 #6 — Xem thực đơn/chi tiết món](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/6) | 2 | Done, closed |
| [US04 #9 — Đăng nhập](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/9) | 2 | Done, closed |
| [US02 #7 — Đặt bàn/gọi món sau đăng nhập](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/7) | 5 | Done, closed |
| [US05 #10 — Cập nhật hồ sơ](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/10) | 2 | New, open; chưa có API/màn hình theo đối chiếu trước |
| [US06 #11 — Ghi nhận thanh toán](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues/11) | 3 | Done, closed |

**Kết quả: 4/5 task, 12/14 điểm (85,7%).** Sprint vẫn mở vì US05 chưa hoàn tất. Có công việc tồn đọng không ngăn việc trình bày đầy đủ quy trình quản lý của Lab 3. Hướng xử lý: giữ #10 mở, triển khai và nghiệm thu ở lần phát triển tiếp theo; không tự chuyển lịch hoặc đánh Done.

PR #20 là PR đối chiếu/tài liệu hóa chức năng đã có; không coi là PR mới lập trình tất cả các chức năng. Bộ test lần trước ngày 28/10: backend 13/13, frontend 11/11; lần hoàn thiện Lab này chỉ thay đổi tài liệu và kiểm tra trạng thái GitHub, không chạy lại test nghiệp vụ. Tỷ lệ trên không phải velocity.

## 3. Quản lý tiến độ bằng Filters

Nhấn liên kết để mở đúng bộ lọc. Kết quả trống ở In progress/bug chỉ có nghĩa hiện không có task mang nhãn tương ứng, không cần tạo task/lỗi giả.

- [Công việc Sprint 1](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue%20milestone%3A%22Sprint%201%20-%20B%E1%BA%BFp%20Nh%C3%A0%20-%20Backlog%20c%C3%A1%20nh%C3%A2n%22) — `is:issue milestone:"Sprint 1 - Bếp Nhà - Backlog cá nhân"`
- [Công việc của Lê Minh Nhật](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue%20label%3A%22Le%20Minh%20Nhat%22%20-label%3ASuperseded) — `is:issue label:"Le Minh Nhat" -label:Superseded`
- [Đang thực hiện](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue%20label%3A%22Sprint%201%22%20label%3A%22In%20progress%22) — `is:issue label:"Sprint 1" label:"In progress"`
- [Đã hoàn thành](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue%20label%3A%22Sprint%201%22%20label%3ADone) — `is:issue label:"Sprint 1" label:Done`
- [Chưa hoàn thành](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue%20label%3A%22Sprint%201%22%20label%3ANew) — `is:issue label:"Sprint 1" label:New`
- [Lỗi](https://github.com/nhatnha123hehe-sys/RestaurantMvc/issues?q=is%3Aissue%20label%3Abug) — `is:issue label:bug`

## 4. Cách xem và nộp bài

1. Mở repository để xem source code.
2. Mở Milestone #2 để xem mục tiêu, hạn và tiến độ sprint.
3. Mở Labels và một Issue trong sprint để xem điểm, người phụ trách, tiêu chí và lịch sử trạng thái.
4. Mở PR #20 để xem liên kết tới task và trạng thái merge.
5. Dùng các bộ lọc mục 3 để xem tiến độ theo yêu cầu đề.
6. Đọc bảng tổng kết mục 2, gồm cả task chưa hoàn thành.

Có thể nộp link tài liệu này cùng repository. File đề không quy định phải nộp Word, ảnh chụp hoặc video; nếu giảng viên có hướng dẫn riêng thì bổ sung theo hướng dẫn đó.

## 5. Dữ liệu đối chiếu

[Snapshot kiểm tra GitHub ngày 29/10/2026](lab3-github-verification.json) ghi số Issue, trạng thái, labels, assignee, milestone và PR đã merge. Đây là bản chụp trạng thái tại lúc kiểm tra; GitHub trực tiếp là nguồn tiến độ hiện hành.

Các kế hoạch cũ bị thay thế không dùng làm minh chứng chính. Product Backlog hiện có được giữ nguyên; không phải sản phẩm cần làm lại trong Lab 3.
