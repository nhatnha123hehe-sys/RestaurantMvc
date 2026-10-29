# Tổng hợp hoàn thiện Lab 3 từ đồ án Bếp Nhà

Cập nhật 29/10/2026. Đồ án nhóm 2 người, bài Lab 3 nộp cá nhân Lê Minh Nhật. Hạn Sprint 1 vẫn 29/10/2026. Đây là danh sách cần rà soát, không phải xác nhận hoàn thành chức năng.

## Thông tin nhóm

| Thành viên | Thông tin đã có | Cần bổ sung |
|---|---|---|
| Lê Minh Nhật | GitHub nhatnha123hehe-sys 
| Phạm Minh Thành 

Không gán vai trò Scrum Master/Product Owner hoặc tác giả code khi chưa có phân công. Giữ bài Lab cá nhân và ghi công đóng góp của cả nhóm trong đồ án.

## Các phần cần hoàn thiện trên GitHub

| Nội dung | Hiện trạng tài liệu trước cập nhật | Việc cần làm |
|---|---|---|
| Thành viên và phân công | Bản trước chỉ thể hiện cá nhân | Cập nhật thành viên dự án, phân công và sheet Team sau xác nhận |
| Product Backlog | 14 US, 54 điểm chuyển từ mẫu | Bổ sung yêu cầu bắt buộc của đồ án còn thiếu; phân biệt bắt buộc và mở rộng |
| Sprint 1 | 5 US, 14 điểm; 4 US được đối chiếu | US05 #10 còn mở; nghiệm thu cập nhật hồ sơ trước khi đóng sprint |
| Issues | #6–#19 có tiêu chí và nhãn | Ghi đúng người thực hiện, minh chứng code/test và PR liên quan; không đóng theo suy đoán |
| Quy trình Lab 3 | Có milestone, labels, issues và PR #20 | Lưu minh chứng lọc tiến độ và chuỗi issue–PR; đối chiếu đề/rubric mới nhất |
| Báo cáo cá nhân | Đã có bản Markdown | Tách phần người nộp thực hiện với code có sẵn của nhóm; bổ sung kết quả thực tế |

Theo lần đối chiếu trước: US01, US02, US04, US06 đạt; US05 chưa có API/màn hình. Chín story ngoài sprint chưa nghiệm thu. Các trạng thái này chưa được kiểm thử lại trong lần cập nhật tài liệu này.

## Bổ sung backlog theo đúng đồ án

Tám chức năng bắt buộc đã thống nhất: menu, đặt bàn, đặt món, giỏ hàng, trạng thái đơn, quản lý bàn, quản lý món và hóa đơn. Bộ 14 US từ mẫu chưa tách rõ tất cả các chức năng này. Khi bổ sung nên tạo US riêng với vai trò, điều kiện nghiệm thu và liên kết code:

- Giỏ hàng: thêm/xóa/đổi số lượng; yêu cầu đăng nhập theo quy tắc đã chốt.
- Trạng thái đơn: chuyển trạng thái hợp lệ, khách xem được tiến độ; staff/admin có quyền phù hợp.
- Quản lý bàn: tình trạng bàn, sức chứa, chống trùng lượt đặt; cảnh báo nhận bàn chưa đến giờ hoặc quá giờ.
- Quản lý món và công thức: CRUD chỉ admin, ảnh URL nhất quán ở menu/chi tiết/giỏ hàng.
- Hóa đơn: tổng tiền chính xác, gắn đúng lượt bàn, ghi nhận thanh toán; tránh thanh toán lặp.
- Phân quyền: customer/staff/admin; doanh thu và dashboard chỉ admin.
- Chat hỗ trợ: tự động chào, nhân viên xem và trả lời đúng hội thoại.

Đây là đề xuất tách yêu cầu để bao phủ đồ án; chưa cấp mã US, điểm hoặc trạng thái Done cho các mục bổ sung. Khuyến mãi, khảo sát, phân hạng và đánh giá trong mẫu là mở rộng, cần chốt mức ưu tiên trước khi đưa vào sprint. Không mặc định phải xây toàn bộ để hoàn thành Lab 3 quản lý GitHub.

## Tài liệu cần cung cấp

1. Danh sách nhóm chính thức: họ tên, MSSV, GitHub và phân công code thực tế của 2 người.
2. Đề đồ án/rubric mới nhất và mẫu báo cáo đã điền nếu có thay đổi so với file trước.
3. Quy tắc nghiệp vụ chưa chốt: hủy đặt bàn, thời gian giữ bàn, thanh toán, phạm vi staff và admin.
4. Minh chứng cá nhân: commit/PR hoặc nhật ký công việc của mỗi người nếu cần xác nhận đóng góp.
5. Yêu cầu nộp Lab 3: chỉ link GitHub hay kèm Word/ảnh/video; nếu cô đã hướng dẫn bổ sung thì gửi nội dung đó.

Không cần gửi lại code đã có trong repository. Không cần cung cấp mật khẩu, token GitHub hoặc thông tin đăng nhập SQL.
