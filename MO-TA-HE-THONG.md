# Mô tả hệ thống: Cổng thông tin điện tử và quản lý Đoàn trường THPT Sơn Hà

> Tài liệu này mô tả đầy đủ hệ thống để dùng làm nguồn cho công cụ sinh bảng mô tả, sơ đồ chức năng hoặc tài liệu giới thiệu (ví dụ NotebookLM). Nội dung viết bằng tiếng Việt, theo đúng những gì hệ thống đang có.

---

## 1. Tổng quan

**Tên hệ thống:** Đoàn trường THPT Sơn Hà – Cổng thông tin điện tử và hệ thống quản lý Đoàn.
**Đơn vị:** Đoàn TNCS Hồ Chí Minh, Trường THPT Sơn Hà (Xã Sơn Hà, Tỉnh Quảng Ngãi).
**Quy mô thiết kế:** khoảng 1.400 đoàn viên, nhiều Chi đoàn, dùng trên máy tính và điện thoại.

Hệ thống gồm **hai phần liên thông**:

1. **Website công khai (Cổng thông tin điện tử):** ai cũng xem được, không cần đăng nhập. Đăng tin tức, kế hoạch, sự kiện, thông báo, lịch hoạt động, lịch công tác tuần, báo cáo của Chi đoàn, bảng thi đua, hộp thư góp ý ẩn danh.
2. **Hệ thống quản lý nội bộ:** cần đăng nhập. Quản lý đoàn viên, Chi đoàn, hoạt động, điểm danh bằng mã QR, điểm rèn luyện, huy hiệu, thi đua, bảng tin, bình chọn, báo cáo, lịch năm học và quản trị nội dung cổng thông tin.

**Mục tiêu:** số hóa công tác Đoàn trong trường, giảm việc thủ công (điểm danh, tính điểm, tổng hợp báo cáo), tăng minh bạch (thi đua, thành tích) và giúp Đoàn trường truyền thông chính thức qua một cổng thông tin.

**Phong cách giao diện:** hiện đại, gọn, chủ đạo màu **xanh Đoàn (#0b63b8)** kèm màu vàng nhấn (#ffd400); toàn bộ bằng tiếng Việt; ưu tiên dùng tốt trên điện thoại (danh sách gọn, thanh điều hướng dưới, khung chờ khi tải); có nền huy hiệu Đoàn mờ phía sau.

---

## 2. Công nghệ và triển khai

| Thành phần | Công nghệ |
|---|---|
| Khung ứng dụng | Next.js 16 (App Router), React 19, TypeScript |
| Giao diện | Tailwind CSS 4, biểu tượng lucide, biểu đồ recharts |
| Cơ sở dữ liệu | PostgreSQL (dịch vụ Prisma Postgres), truy cập bằng Prisma 6 |
| Xác thực | Mật khẩu băm bcrypt, phiên đăng nhập bằng cookie JWT (thư viện jose), hạn 7 ngày |
| Lưu ảnh và tệp | Cloudinary (ảnh bìa, ảnh hoạt động, ảnh đại diện, tệp PDF/Office đính kèm) |
| Thông báo đẩy | Web Push (VAPID), có âm thanh khi nhận thông báo |
| Ứng dụng di động | PWA: cài lên màn hình chính Android/iOS, biểu tượng nền xanh Đoàn |
| Triển khai | Vercel (vùng Singapore), tự cập nhật cấu trúc database khi deploy |
| Tác vụ định kỳ | Vercel Cron (nhắc lịch, chuyển năm học, dọn dữ liệu cũ) |

**Chịu tải:** với chuỗi kết nối "pooled" của database, hệ thống chịu được cao điểm điểm danh QR của khoảng 1.400 đoàn viên. Các trang công khai được lưu đệm 60 giây nên nhẹ cho database.

---

## 3. Vai trò người dùng và phân quyền

Có **3 vai trò**. Phân quyền được kiểm tra ở máy chủ, không chỉ ở giao diện.

| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| **Quản trị viên (Admin)** | Ban chấp hành Đoàn trường | Toàn quyền: Chi đoàn, đoàn viên, hoạt động toàn trường, điểm danh, thi đua, huy hiệu, cổng thông tin, lịch năm học, lịch công tác, duyệt bài, góp ý, bình chọn, cài đặt, nhật ký. |
| **Bí thư Chi đoàn** | **Không phải tài khoản riêng:** là một đoàn viên được Admin gán thêm vai trò bí thư | Có mọi quyền của đoàn viên, cộng quyền quản lý **chỉ trong Chi đoàn mình**: xem/quản lý đoàn viên, tạo hoạt động của Chi đoàn, mở QR điểm danh, đăng báo cáo Chi đoàn, soạn bài viết (chỉ ở dạng nháp chờ Admin duyệt). |
| **Đoàn viên** | Học sinh là đoàn viên | Xem hồ sơ và thẻ số, đăng ký và điểm danh hoạt động (quét QR), xem lịch sử, điểm, huy hiệu, thi đua, bảng tin, bình chọn. |

**Nguyên tắc phạm vi dữ liệu:**
- Bí thư chỉ thấy đoàn viên và hoạt động của Chi đoàn mình (hoạt động toàn trường thì xem được). Mở đường dẫn của Chi đoàn khác sẽ nhận trang không tồn tại (404).
- Hoạt động **toàn trường** chỉ Admin quản lý.
- Đoàn viên chỉ thấy hồ sơ của chính mình.

**Tài khoản:**
- Tên đăng nhập là **mã đoàn viên** (dạng SH + năm + số thứ tự, ví dụ SH20260001) hoặc tên đăng nhập riêng; có thể đăng nhập bằng mã đoàn viên.
- Mật khẩu tạm thời được sinh khi tạo tài khoản, bắt buộc đổi ở lần đăng nhập đầu.
- Đăng nhập sai nhiều lần bị chặn tạm thời. Tài khoản bị khóa có hiệu lực ngay.
- Hệ thống không gửi email quên mật khẩu: Admin/bí thư cấp lại mật khẩu tạm.

---

## 4. Website công khai (không cần đăng nhập)

**Bố cục chung:** thanh liên hệ (hotline, email, Facebook, YouTube) → hàng logo + tên trường + địa chỉ + ô tìm kiếm → thanh menu xanh đậm (có chữ "Đăng nhập" hoặc "Trang quản lý" nếu đã đăng nhập) → banner → dòng ngày + dòng chữ chạy → nội dung (thanh bên trái, vùng chính) → chân trang.

### 4.1 Các trang

| Trang | Nội dung |
|---|---|
| **Trang chủ** | Đếm ngược sự kiện lớn (nếu Admin đặt); khối Tin tức (1 tin nổi bật + 5 tin), Sự kiện, Kế hoạch, Thông báo, Hoạt động sắp tới, bảng Thi đua tháng. Mỗi khối có "Xem tất cả". |
| **Tin tức / Kế hoạch / Sự kiện / Thông báo** | Danh sách có phân trang, mỗi bài có ảnh bìa hoặc hình thu nhỏ trang đầu tệp PDF đính kèm. Trang chi tiết chia 2/3 nội dung và 1/3 bài khác; hiển thị ảnh, nội dung, tệp đính kèm (xem trực tiếp hoặc tải về). |
| **Lịch hoạt động** | Xem theo **tuần của năm học** (chọn Năm học → Tuần, có nút tuần trước/sau); mỗi ngày một dòng, ngày không có hoạt động vẫn hiện. Có thể xem theo học kỳ hoặc cả năm học. |
| **Lịch công tác** | Lịch công tác tuần chính thức do Admin soạn và công bố: bảng Ngày, Thời gian, Nội dung, Phụ trách, Địa điểm; có nút **In lịch**. |
| **Giới thiệu** | Các trang nội dung do Admin soạn: Đoàn trường, BCH Đoàn trường, Cơ cấu tổ chức, Nội quy. |
| **Báo cáo Chi đoàn** | Danh sách báo cáo theo Khối (10/11/12) và Chi đoàn do bí thư/Admin đăng. |
| **Thi đua** | Bảng thi đua Chi đoàn theo Tuần/Tháng/Học kỳ/Năm học; trang Thành tích; trang Chi đoàn tiêu biểu. |
| **Góp ý** | Hộp thư góp ý **ẩn danh** của học sinh (không cần đăng nhập, không lưu danh tính; có chống spam). |
| **Tìm kiếm** | Tìm trong các bài viết đã đăng. |
| **Liên kết** | Menu thả xuống tới các trang ngoài: Trường THPT Sơn Hà, Sở GD&ĐT Quảng Ngãi, Bộ GD&ĐT, Trung ương Đoàn, Tỉnh Đoàn Quảng Ngãi. |

### 4.2 Tiện ích
- **Dòng chữ chạy** thông điệp, nối đuôi liên tục, Admin thêm/xóa/bật tắt.
- **Banner:** Admin tải ảnh banner full chiều ngang; chưa có ảnh thì dùng banner mặc định (huy hiệu + "Cổng thông tin điện tử – Đoàn trường THPT Sơn Hà").
- **Đếm ngược** tới sự kiện lớn (Đại hội, 26/3...) ở trang chủ.
- **In lịch công tác** bằng kiểu in riêng (ẩn menu, chỉ in bảng lịch).

---

## 5. Hệ thống quản lý nội bộ

### 5.1 Menu của Admin (đã gom nhóm cho gọn)

- **Tổng quan**
- **Hàng chờ duyệt** (có huy hiệu số việc đang chờ)
- **Tổ chức:** Đoàn viên, Chi đoàn
- **Hoạt động:** Hoạt động, Điểm danh, Lịch công tác
- **Phong trào:** Thi đua, Thành tích
- **Cộng đồng:** Bảng tin, Bình chọn, Góp ý
- **Báo cáo**
- **Cổng thông tin:** Tin tức, Kế hoạch, Sự kiện, Thông báo, Trang giới thiệu, Báo cáo Chi đoàn, Dòng chữ chạy, Thông tin website
- **Cài đặt**

Bí thư và đoàn viên có menu ngắn hơn theo quyền. Trên điện thoại có **thanh điều hướng dưới** (4 mục chính + nút "Thêm" mở danh sách các mục còn lại).

### 5.2 Quản lý đoàn viên
- Danh sách có tìm kiếm, lọc, phân trang; xem chi tiết hồ sơ.
- Thêm từng đoàn viên hoặc **nhập hàng loạt từ file Excel** (có file mẫu); hệ thống tự sinh mã đoàn viên và tài khoản kèm mật khẩu tạm thời (tải về dạng CSV, chỉ hiện một lần).
- Hồ sơ gồm họ tên, giới tính, ngày sinh, ngày vào Đoàn, khóa, lớp, Chi đoàn, ảnh đại diện, trạng thái (đang sinh hoạt, đã chuyển sinh hoạt, đã ra trường).
- **Thẻ đoàn viên số:** có ảnh, mã đoàn viên và **mã QR** định danh; đoàn viên tự đổi ảnh.
- Cấp lại mật khẩu tạm, khóa/mở khóa tài khoản.

### 5.3 Quản lý Chi đoàn
- Danh sách Chi đoàn, **niên khóa** (ví dụ 2026–2029), bí thư, số đoàn viên, số hoạt động, tỷ lệ tham gia. Hai tab: **Đang học** và **Đã ra trường**.
- Tạo Chi đoàn kèm **danh sách họ tên đoàn viên**: hệ thống tự tạo lớp, hồ sơ và tài khoản.
- **Bầu bí thư:** chọn một đoàn viên của Chi đoàn, tài khoản đó được gán thêm quyền bí thư (vẫn giữ quyền đoàn viên). Đổi/gỡ bí thư thì người đó trở lại là đoàn viên thường.
- Tên Chi đoàn dạng 12A1 hoặc 12/1.

### 5.4 Niên khóa và chuyển năm học
- Mỗi Chi đoàn đi cùng học sinh suốt 3 năm (lớp 10 → 12); tài khoản, điểm, huy hiệu, lịch sử được **giữ nguyên**.
- Năm học bắt đầu **01/09**. Tên khối **tự đổi theo năm học** (10A1 → 11A1 → 12A1), kể cả tên lớp bên trong.
- Quá lớp 12: Chi đoàn chuyển sang **"Đã ra trường"**, đoàn viên đổi trạng thái, **tài khoản đoàn viên và bí thư bị khóa**; dữ liệu vẫn giữ để tra cứu.
- Chạy tự động mỗi ngày; Admin cũng có nút **Cập nhật năm học**.

### 5.5 Hoạt động
- Loại hoạt động (Hoạt động Đoàn, Tình nguyện, Thể thao, Văn hóa, Học tập...) có điểm mặc định do Admin cấu hình.
- Mỗi hoạt động: tên, mô tả, địa điểm, thời gian, loại, Chi đoàn tổ chức (hoặc toàn trường), số lượng tối đa, **điểm**, **giờ tình nguyện**, ảnh.
- Trạng thái: sắp diễn ra, đang diễn ra, đã kết thúc, đã hủy.
- Đoàn viên **đăng ký tham gia** và hủy đăng ký; hệ thống kiểm soát số lượng tối đa.
- **Nhắc lịch tự động:** gửi thông báo cho người đã đăng ký khi hoạt động bắt đầu trong vòng 24 giờ.
- Bộ lọc dùng chung: **Năm học → Tuần / Học kỳ / Cả năm học**, loại, trạng thái, tìm kiếm.

### 5.5.1 Điểm danh bằng mã QR
1. Người quản lý mở điểm danh (từ 60 phút trước giờ bắt đầu) và hiển thị **mã QR**.
2. Mã QR là token ký số **hết hạn sau 90 giây**, trang tự làm mới; mỗi lần mở lại hoặc tạo mã mới đổi "nonce" nên mã cũ vô hiệu.
3. Đoàn viên quét → xem lại tên hoạt động → bấm xác nhận (tránh tự ghi khi trình duyệt tải trước).
4. Hệ thống ghi điểm danh, **cộng điểm và giờ tình nguyện trong một giao dịch**, xét huy hiệu, gửi thông báo cho đoàn viên.
5. Quản lý cũng có thể điểm danh/thu hồi thủ công và xuất danh sách.

### 5.6 Điểm và huy hiệu
- **Điểm rèn luyện:** cộng khi điểm danh theo điểm của hoạt động; Admin có thể điều chỉnh có lý do. Mọi biến động điểm được lưu thành lịch sử.
- **Giờ tình nguyện** cộng dồn theo hoạt động.
- **Huy hiệu:** Admin cấu hình điều kiện theo 4 loại: số hoạt động tham gia, giờ tình nguyện, tổng điểm, số hoạt động theo loại. Đạt điều kiện thì tự trao và thông báo.
- Đoàn viên xem tiến độ từng huy hiệu ở trang **Thành tích**.

### 5.7 Thi đua giữa các Chi đoàn
- **Tổng điểm = Điểm thi đua trường** (Admin ghi nhận cộng/trừ kèm lý do) **+ Điểm hoạt động bình quân mỗi đoàn viên** (tổng điểm điểm danh trong kỳ chia số đoàn viên).
- Xếp hạng theo **Tuần, Tháng, Học kỳ, Năm học** (tuần/học kỳ/năm học tính theo lịch năm học); đồng điểm thì đồng hạng.
- Hiển thị cho Admin, bí thư, đoàn viên và công khai (bảng thi đua, thành tích, Chi đoàn tiêu biểu). Chi đoàn đã ra trường không còn trong bảng.

### 5.8 Bảng tin nội bộ
- Bài đăng thông báo và hình ảnh hoạt động từ Đoàn trường và các Chi đoàn. Chỉ Admin và bí thư đăng bài (bí thư đăng trong phạm vi Chi đoàn mình). Đoàn viên **thích** và **bình luận**.
- Có trang đăng bài riêng, tải nhiều ảnh.

### 5.9 Bình chọn (khảo sát nhanh)
- Admin tạo câu hỏi với 2–10 lựa chọn, chọn một hoặc nhiều, có thể đặt hạn; kết thúc, mở lại, xóa.
- Mọi tài khoản đăng nhập bỏ phiếu (mỗi người một bộ phiếu, đổi được khi chưa kết thúc), kết quả hiện phần trăm theo thời gian thực. Có thông báo khi có bình chọn mới.

### 5.10 Thông báo
- **Trung tâm thông báo** trong ứng dụng (chuông ở góc trên), đánh dấu đã đọc.
- **Thông báo đẩy (Web Push)** tới điện thoại/máy tính, có âm thanh, cho các sự kiện: hoạt động mới, nhắc lịch, cộng điểm, huy hiệu, bài mới, bình luận, bình chọn mới, góp ý mới, bài chờ duyệt, lịch công tác mới.

### 5.11 Báo cáo
- Báo cáo hoạt động theo năm học/tuần với tỷ lệ tham gia, **xuất Excel** (hoạt động và đoàn viên).
- Xếp hạng tham gia theo Chi đoàn, biểu đồ tham gia theo tháng ở trang tổng quan.
- **Lịch sử hoạt động** cá nhân của đoàn viên (tham gia, đã đăng ký, vắng mặt, điểm).

---

## 6. Quản trị nội dung Cổng thông tin (Admin)

- **Bài viết 4 loại:** Tin tức, Kế hoạch, Sự kiện (có thời gian và địa điểm), Thông báo. Mỗi bài có tiêu đề, tóm tắt, nội dung định dạng đơn giản, ảnh bìa, **tệp đính kèm PDF/Word/Excel/PowerPoint** (xem trực tiếp hoặc tải về), trạng thái hiển thị hoặc nháp.
- **Bí thư soạn bài ở dạng nháp; Admin duyệt rồi mới đăng** (xem mục 7).
- **Trang giới thiệu:** soạn nội dung các trang Đoàn trường, BCH, Cơ cấu tổ chức, Nội quy.
- **Báo cáo Chi đoàn:** Admin và bí thư đăng (có ảnh); hiển thị công khai theo Khối/Chi đoàn.
- **Dòng chữ chạy:** thêm, bật/tắt, sắp xếp, xóa; có thể gắn liên kết.
- **Thông tin website:** địa chỉ, điện thoại, email, Facebook, YouTube, ảnh banner, đếm ngược (tên sự kiện, thời điểm, liên kết). Các thông tin này hiện ở đầu trang và chân trang.
- Trang chi tiết mở khi bấm vào một dòng của danh sách (cả bảng trên máy tính và danh sách gọn trên điện thoại), có nút Sửa, Xóa, Ẩn/Hiện.

---

## 7. Quy trình duyệt bài và Hàng chờ duyệt

1. Bí thư soạn Tin tức/Kế hoạch/Sự kiện/Thông báo → hệ thống **ép lưu ở dạng nháp** (kiểm tra ở máy chủ) và gửi thông báo "Bài viết chờ duyệt" tới Admin.
2. Bí thư chỉ sửa/xóa được **bản nháp của chính mình**; bài đã đăng thì chỉ xem.
3. Admin vào **Hàng chờ duyệt**: trang gom **bài nháp bí thư gửi lên**, **góp ý chưa xem** và **báo cáo Chi đoàn mới trong 7 ngày**; bấm **Duyệt & đăng** để đưa bài lên cổng công khai. Menu có huy hiệu số việc đang chờ.

---

## 8. Lịch năm học và Lịch công tác tuần

### 8.1 Lịch năm học (Cài đặt → Năm học)
- Giáo dục tính thời gian theo **tuần**: Admin đặt **ngày bắt đầu Tuần 1**, số tuần học kỳ 1 và tổng số tuần. Mặc định: Tuần 1 bắt đầu 05/09, học kỳ 1 gồm 18 tuần, cả năm 35 tuần.
- Mỗi tuần hiển thị kèm ngày tháng, ví dụ "Tuần 6 (05/10 – 11/10)".
- Các bộ lọc **Năm học → Tuần/Học kỳ** (mặc định năm học hiện tại) dùng chung cho Hoạt động, Lịch sử, Báo cáo, Lịch hoạt động công khai, và thi đua theo tuần/học kỳ/năm học.

### 8.2 Lịch công tác tuần (Admin soạn, công khai hiển thị)
- Admin chọn Năm học → Tuần, thêm công việc theo từng ngày: **thời gian** (chọn giờ bắt đầu, giờ kết thúc không bắt buộc hoặc "Cả ngày"), **nội dung**, **phụ trách**, **địa điểm**; sửa/xóa được.
- **Sao chép tuần trước** sang tuần này (dời 7 ngày).
- **Công bố** (có tùy chọn gửi thông báo cho mọi người dùng) hoặc hủy công bố. Admin xem trước bản nháp ở trang công khai.
- Trang công khai hiển thị đủ 7 ngày (ngày trống hiện dấu "—"), mặc định tuần hiện tại, có **In lịch**.

---

## 9. Hộp thư góp ý ẩn danh

- Học sinh gửi ý kiến ở trang công khai, chọn chủ đề, có thể để lại cách liên hệ (không bắt buộc). **Không lưu danh tính.**
- Chống spam: ô bẫy bot ẩn và giới hạn số góp ý mỗi giờ.
- Admin nhận thông báo, xem danh sách theo trạng thái (**Mới, Đã xem, Đã xử lý**), ghi chú xử lý, xóa. Mở xem thì tự đánh dấu đã xem.

---

## 10. Mô hình dữ liệu chính

| Nhóm | Bảng (thực thể) | Ý nghĩa |
|---|---|---|
| Người dùng | User, Member | Tài khoản đăng nhập và hồ sơ đoàn viên (một-một) |
| Tổ chức | Department (Chi đoàn), Class (lớp) | Chi đoàn có niên khóa, bí thư, trạng thái ra trường |
| Hoạt động | Activity, ActivityCategory, ActivityRegistration, Attendance, ActivityImage | Hoạt động, loại, đăng ký, điểm danh, ảnh |
| Điểm thưởng | PointTransaction, Badge, MemberBadge | Lịch sử điểm, huy hiệu và danh sách đã đạt |
| Thi đua | EmulationRecord | Điểm thi đua trường ghi nhận cho Chi đoàn |
| Tương tác | Post, PostLike, PostComment, Poll, PollOption, PollVote, Feedback | Bảng tin, bình chọn, góp ý |
| Nội dung công khai | Article (+ArticleAttachment), SitePage, SiteSetting, MarqueeItem, ChapterReport | Bài viết, trang giới thiệu, cài đặt, chữ chạy, báo cáo Chi đoàn |
| Lịch | SchoolYear, WeeklySchedule, WeeklyScheduleItem | Lịch năm học và lịch công tác tuần |
| Hệ thống | Notification, PushSubscription, AuditLog | Thông báo, đăng ký nhận đẩy, nhật ký thao tác |

---

## 11. Tác vụ tự động (Vercel Cron, mỗi ngày)

| Tác vụ | Việc làm |
|---|---|
| **Nhắc lịch** | Gửi thông báo tới người đã đăng ký hoạt động bắt đầu trong 24 giờ tới (mỗi hoạt động nhắc một lần). |
| **Chuyển năm học** | Đổi tên khối theo năm học, cho khóa lớp 12 ra trường và khóa tài khoản. |
| **Dọn dữ liệu cũ** | Xóa thông báo đã đọc quá 90 ngày, thông báo chưa đọc quá 120 ngày, nhật ký hệ thống quá 120 ngày. |

Các tác vụ được bảo vệ bằng khóa bí mật `CRON_SECRET`.

---

## 12. Dữ liệu, dung lượng và độ bền

- **Giữ lâu dài:** điểm danh, lịch sử điểm, huy hiệu, báo cáo, bài viết, hồ sơ. **Dọn định kỳ:** thông báo và nhật ký như trên.
- Ước tính với 1.400 đoàn viên: tăng khoảng **55MB mỗi năm**, nên gói database **500MB dùng được khoảng 7–8 năm** (dè dặt 4–5 năm). Admin theo dõi ở **Cài đặt → Dữ liệu** (dung lượng, bảng lớn nhất, nút Dọn ngay).
- Ảnh và tệp lưu ở Cloudinary, không tính vào dung lượng database.

---

## 13. Bảo mật

- Phân quyền kiểm tra ở máy chủ cho mọi thao tác; chống truy cập chéo giữa các Chi đoàn.
- Mật khẩu băm bcrypt, mật khẩu tạm bắt buộc đổi, giới hạn đăng nhập sai, khóa tài khoản có hiệu lực ngay.
- Mã QR điểm danh ký số, hết hạn nhanh, vô hiệu mã cũ bằng nonce; điểm cộng trong một giao dịch duy nhất.
- Tải tệp: chỉ nhận định dạng và dung lượng cho phép, kiểm tra thư mục lưu hợp lệ.
- Nhật ký thao tác (đăng nhập, tạo/sửa/xóa, duyệt, công bố...) lưu 120 ngày.
- Mã QR trên thẻ chỉ chứa mã định danh ngẫu nhiên, không chứa thông tin cá nhân.

---

## 14. Trải nghiệm di động và hiệu năng

- Cài như ứng dụng (PWA) trên Android/iOS; biểu tượng nền xanh Đoàn; tên ứng dụng "Đoàn trường THPT Sơn Hà".
- Danh sách trên điện thoại hiển thị **một dòng gọn**, bấm vào mở thẳng trang chi tiết; bảng đầy đủ trên máy tính. Hàng bảng bấm vào đâu cũng mở chi tiết.
- **Khung chờ (skeleton)** khi tải trang, có khung riêng cho biểu mẫu, trang chi tiết và trang theo tuần.
- Chống tự phóng to khi nhập liệu trên iOS; thanh điều hướng dưới có vùng an toàn của iPhone.
- Tối ưu truy vấn: gộp truy vấn, xếp hạng bằng SQL tổng hợp, lưu đệm trang công khai.

---

## 15. Hạn chế hiện tại và hướng phát triển

**Chưa có:** gửi email (nên không có "quên mật khẩu" tự động), xin phép vắng có duyệt, chứng nhận PDF, thư viện ảnh/video, màn hình sự kiện trực tiếp, khôi phục nhanh Chi đoàn đã ra trường nhầm.

**Gợi ý phát triển:** màn hình sự kiện trực tiếp (QR + số người vào theo thời gian thực), tổng kết "Hành trình Đoàn viên" cuối năm, nhiệm vụ tuần và cấp độ, cảnh báo đoàn viên lâu không tham gia, giấy chứng nhận có mã QR xác thực, trợ lý hỏi đáp.

---

## 16. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Đoàn viên | Học sinh là thành viên Đoàn TNCS Hồ Chí Minh |
| Chi đoàn | Đơn vị cơ sở gắn với một lớp/khóa, ví dụ 10A1 |
| Bí thư | Đoàn viên được bầu đứng đầu Chi đoàn |
| Niên khóa | Khoảng 3 năm học của một khóa (vd 2026–2029) |
| Thi đua | Xếp hạng Chi đoàn theo điểm thi đua và mức tham gia hoạt động |
| Điểm danh QR | Ghi nhận tham gia hoạt động bằng cách quét mã QR |
| Cổng thông tin | Phần website công khai của Đoàn trường |
| Hàng chờ duyệt | Trang gom các việc đang chờ Admin xử lý |
| PWA | Ứng dụng web cài được lên màn hình điện thoại |
