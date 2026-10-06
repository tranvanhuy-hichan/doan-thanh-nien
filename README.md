# Hệ thống quản lý Đoàn viên & Hoạt động Đoàn – THPT Sơn Hà

Next.js 16 (App Router) · TypeScript · PostgreSQL · Prisma 6 · Tailwind CSS 4 · Cloudinary · Recharts.

## Chạy thử

```bash
cp .env.example .env        # điền DATABASE_URL, AUTH_SECRET (openssl rand -base64 48), APP_URL, Cloudinary
npm install
npx prisma db push          # tạo bảng
npm run db:seed             # DỮ LIỆU DEMO (xóa dữ liệu hiện có!)
npm run dev
```

Tài khoản demo (mật khẩu `Doan@2026`): `admin`, `bithu.10a1` / `bithu.11a1` / `bithu.12a1`, `SH20260001` … `SH20260030`.
Seed chỉ để trình diễn – không chạy trên dữ liệu thật. Hoạt động demo “Ngày Chủ nhật xanh tháng 10” của Chi đoàn 10A1 đang mở sẵn.

Cloudinary là tùy chọn khi chạy thử: thiếu biến `CLOUDINARY_*` thì upload ảnh trả lỗi rõ ràng, phần còn lại vẫn hoạt động.

## Kiến trúc

```
src/app/(auth)        đăng nhập, đổi mật khẩu, quên mật khẩu
src/app/(dashboard)   dashboard, members, departments, activities, attendance, achievements, reports, settings, checkin, history, profile
src/app/api           upload (Cloudinary), export báo cáo, mẫu import
src/actions           server actions (ghi dữ liệu) – mỗi action tự kiểm tra role + quyền sở hữu Chi đoàn
src/lib/auth          session (JWT cookie httpOnly, nạp lại user từ DB mỗi request), bcrypt
src/lib/permissions   quy tắc phân quyền tập trung
src/lib/services      điểm danh + cộng điểm (transaction), huy hiệu, thống kê, báo cáo
src/lib/qr            QR token ký HMAC, sống 90 giây
```

## Phân quyền

| | Admin | Bí thư Chi đoàn | Đoàn viên |
|---|---|---|---|
| Đoàn viên | thêm/sửa/xóa/import, khóa tài khoản, cấp lại mật khẩu, điều chỉnh điểm | chỉ **xem** đoàn viên Chi đoàn mình | hồ sơ & thẻ của mình |
| Chi đoàn, Báo cáo, Cài đặt hệ thống | toàn quyền | không có | không có |
| Hoạt động | toàn trường + mọi Chi đoàn | tạo/sửa/hủy hoạt động của **Chi đoàn mình** | xem, đăng ký, quét QR |
| Điểm danh | mọi hoạt động | hoạt động của Chi đoàn mình (QR, điểm danh hộ) | quét QR |
| Bảng tin | đăng toàn trường / Chi đoàn bất kỳ | đăng cho Chi đoàn mình | xem, thích, bình luận |
| Thi đua | ghi điểm thi đua trường | xem | xem |

## Quyết định thiết kế đáng lưu ý

- **Phân quyền ở server**: mọi truy vấn đi qua `memberScope` / `activityScope` / `canManageDepartment`. Bí thư mở URL của Chi đoàn khác nhận 404.
- **QR điểm danh**: token JWT chứa `activityId` + `nonce` của hoạt động, hết hạn sau 90 giây, trang bí thư tự làm mới. Mỗi lần mở điểm danh hoặc bấm “Tạo QR mới” đổi nonce → mọi QR cũ vô hiệu. Đoàn viên quét → xem lại hoạt động → bấm xác nhận (tránh tự động ghi nhận khi trình duyệt prefetch).
- **Điểm**: luôn lấy từ `Activity.points` ở backend; ghi `PointTransaction` + cập nhật `Member.totalPoints` trong cùng transaction với `Attendance`. Unique `(activityId, memberId)` chặn điểm danh đôi. Hủy điểm danh tạo giao dịch đối ứng, không xóa lịch sử.
- **Chống check-in hộ** (cơ bản): token ngắn hạn, một lần/đoàn viên, lưu `deviceInfo`, `ipAddress`, và có sẵn cột `latitude/longitude` để thêm GPS sau.
- **Hoạt động toàn trường** (`departmentId = null`) chỉ Admin quản lý; hoạt động của Chi đoàn do bí thư Chi đoàn đó quản lý.
- **Bài viết trên website công khai**: Bí thư được soạn Tin tức / Kế hoạch / Sự kiện / Thông báo nhưng chỉ lưu ở dạng **bản nháp** (server ép `published=false`); chỉ sửa/xóa được nháp của chính mình. Admin nhận thông báo "Bài viết chờ duyệt" và bấm Hiển thị để đăng.
- **Tài khoản**: username = mã đoàn viên (`SH` + năm + 4 số); mật khẩu tạm sinh ngẫu nhiên, hiển thị đúng một lần (kèm CSV khi import), bắt buộc đổi ở lần đăng nhập đầu.
- **Quên mật khẩu**: không có email nên không tự đặt lại; Admin/Bí thư cấp lại mật khẩu tạm trên trang hồ sơ đoàn viên.

## Hạn chế hiện tại

- Dùng `prisma db push`, chưa có thư mục migrations (chạy `npm run db:migrate` để tạo migration đầu tiên khi triển khai thật).
- Giới hạn đăng nhập sai lưu trong bộ nhớ tiến trình (đủ cho 1 instance; cần Redis khi scale ngang).
- Quét QR bằng camera cần HTTPS (hoặc localhost). Có thể quét bằng camera điện thoại rồi mở liên kết, hoặc dán liên kết.
- Thông báo “hoạt động sắp diễn ra” chưa có job nền; cần cron gọi một route nội bộ nếu muốn nhắc tự động.
- Logo Đoàn là SVG đơn giản (`src/components/layout/logo.tsx`); thay bằng asset chính thức khi có.

## Triển khai (Vercel)

`vercel-build` tự chạy: `prisma generate` → `prisma db push` → `prisma/bootstrap.ts` → `next build`.
`bootstrap.ts` an toàn khi chạy lặp lại: **chỉ hành động khi database chưa có người dùng nào**, không bao giờ xóa dữ liệu.

- Mặc định: tạo 1 tài khoản admin (`ADMIN_USERNAME`, mặc định `admin`) với mật khẩu `ADMIN_INITIAL_PASSWORD` hoặc mật khẩu ngẫu nhiên in ra log build (xem ở tab Deployments → Build Logs). Bắt buộc đổi mật khẩu ở lần đăng nhập đầu.
- Đặt `SEED_DEMO=true` ở lần deploy đầu để nạp dữ liệu demo như local (mật khẩu chung `Doan@2026`). Sau khi trình diễn xong nên xóa biến này và đổi/xóa tài khoản demo.
- `npm run db:seed` (xóa sạch dữ liệu) bị chặn khi `NODE_ENV=production` trừ khi đặt `SEED_CONFIRM=yes`.

## Nhắc lịch, góp ý, bình chọn, đếm ngược

- **Nhắc lịch**: Vercel Cron gọi `/api/cron/reminders` mỗi ngày 07:00 (giờ VN, `vercel.json`), gửi thông báo + push cho người đã đăng ký hoạt động sắp diễn ra trong 24 giờ. Cần đặt biến `CRON_SECRET` trên Vercel (Vercel tự gửi kèm khi gọi cron). Mỗi hoạt động chỉ nhắc một lần; đổi giờ bắt đầu thì được nhắc lại. Gói Hobby chỉ cho cron mỗi ngày một lần.
- **Góp ý ẩn danh**: trang công khai `/gop-y` (không đăng nhập, không lưu danh tính, có ô bẫy bot và giới hạn 30 góp ý/giờ). Admin xem/xử lý ở mục **Góp ý**.
- **Bình chọn**: Admin tạo ở mục **Bình chọn**; mọi tài khoản đăng nhập bỏ phiếu (đổi được lựa chọn khi chưa kết thúc), kết quả hiện dạng thanh phần trăm.
- **Đếm ngược**: Admin đặt tên + thời điểm tại **Cổng thông tin → Thông tin website**; hiện đầu trang chủ cho tới khi hết giờ.

## Niên khóa & chuyển năm học

- Mỗi Chi đoàn lưu **năm vào lớp 10** (`startYear`, ví dụ 2026 → niên khóa 2026–2029) và đi cùng học sinh suốt 3 năm; tài khoản, điểm, huy hiệu, lịch sử được giữ nguyên.
- Năm học bắt đầu **01/09** (giờ VN). Tên khối tự đổi theo năm học (10A1 → 11A1 → 12A1), kể cả tên lớp bên trong Chi đoàn. Việc này chạy tự động mỗi ngày qua `/api/cron/rollover` (idempotent) và Admin có nút **Cập nhật năm học** ở trang Chi đoàn.
- Quá lớp 12: Chi đoàn chuyển sang **Đã ra trường** (tab riêng ở trang Chi đoàn), đoàn viên chuyển trạng thái "Đã ra trường", tài khoản đoàn viên và bí thư bị khóa; dữ liệu vẫn giữ để tra cứu. Chi đoàn đã ra trường không còn xuất hiện ở danh sách chọn, thi đua và trang công khai.
- Tạo Chi đoàn mới: nhập tên (vd 10A1); ô "Năm vào lớp 10" để trống thì tự tính theo năm học hiện tại. Tạo trước ngày 01/09 cho khóa sắp vào thì nhập năm của khóa đó.

## Bí thư = đoàn viên giữ chức vụ

- Bí thư **không phải tài khoản riêng**: đó là tài khoản của một đoàn viên trong Chi đoàn, được Admin gán thêm vai trò bí thư (nút **Chọn bí thư** ở trang Chi đoàn). Tài khoản vẫn có hồ sơ, thẻ số, quét QR, lịch sử như đoàn viên, cộng thêm quyền quản lý Chi đoàn của mình.
- Bầu bí thư mới → chọn đoàn viên khác; bí thư cũ tự trở lại là đoàn viên thường. **Gỡ chức bí thư** cũng chỉ bỏ vai trò, tài khoản vẫn là đoàn viên.
- Khi tạo Chi đoàn, Admin có thể dán danh sách họ tên (mỗi dòng một người): hệ thống tự tạo lớp, hồ sơ đoàn viên và tài khoản (tên đăng nhập = mã đoàn viên, mật khẩu tạm thời hiện một lần, tải được CSV). Có thể nhập thêm bằng file Excel ở mục Đoàn viên.
- Tài khoản bí thư tạo trước đây (như `bithu.10a1`) đã được tự bổ sung hồ sơ đoàn viên.

## Lịch năm học theo tuần & bộ lọc

- Giáo dục tính thời gian theo **tuần**: Admin đặt **ngày bắt đầu Tuần 1**, số tuần học kỳ 1 và tổng số tuần ở **Cài đặt → Năm học** (mặc định Tuần 1 = 05/09, HK1 18 tuần, cả năm 35 tuần). Năm chưa đặt dùng mặc định.
- Bộ lọc thời gian dùng chung (hoạt động, lịch sử, báo cáo + xuất Excel, lịch hoạt động công khai): chọn **Năm học** rồi **Tuần** (hiện kèm ngày tháng, ví dụ "Tuần 1 (05/09 – 11/09)"), hoặc **Học kỳ 1/2**, hoặc cả năm học. URL: `?nh=2026&tuan=3|hk1|hk2`.
- Thi đua: kỳ **Tuần / Học kỳ / Năm học** theo lịch này (tuần có dạng `2026-T03`); kỳ **Tháng** vẫn theo lịch dương.
- Trang công khai **Lịch hoạt động** hiển thị theo tuần (mặc định tuần hiện tại, có nút tuần trước/sau).

## Hàng chờ duyệt & Lịch công tác tuần

- **Hàng chờ duyệt** (`/approvals`, Admin): gom bài nháp bí thư gửi lên (bấm **Duyệt & đăng** là hiển thị công khai), góp ý chưa xem và báo cáo Chi đoàn mới trong 7 ngày. Menu có huy hiệu số việc đang chờ (bài nháp + góp ý mới).
- **Lịch công tác tuần** (`/schedule`, Admin): chọn Năm học → Tuần (theo lịch năm học), thêm công việc theo từng ngày (thời gian, nội dung, phụ trách, địa điểm), **Sao chép tuần trước**, **Công bố** (tùy chọn gửi thông báo cho mọi người dùng). Lịch đã công bố hiện ở trang công khai `/lich-cong-tac` (mặc định tuần hiện tại, có nút tuần trước/sau và **In lịch**); Admin xem được bản nháp để xem trước.

## Dọn dữ liệu cũ

- Mỗi ngày (`/api/cron/cleanup`, dùng chung `CRON_SECRET`) hệ thống xóa: thông báo **đã đọc** quá 90 ngày, thông báo chưa đọc quá 120 ngày và **nhật ký hệ thống** quá 120 ngày. Điểm danh, điểm, huy hiệu, báo cáo, bài viết được giữ lâu dài. Chỉnh số ngày trong `RETENTION` ở `src/lib/services/cleanup.ts`.
- Admin theo dõi dung lượng database và các bảng lớn nhất, hoặc bấm **Dọn ngay**, ở **Cài đặt → Dữ liệu**.

## Màn hình khởi động của ứng dụng cài trên điện thoại (PWA)

- **Android (Chrome):** màn hình khởi động do hệ điều hành dựng từ `manifest` (nền `#0b63b8`, biểu tượng nền xanh, tên ứng dụng). Cần **gỡ rồi cài lại** ứng dụng để Android cập nhật.
- **iOS (Safari):** dùng 14 ảnh khởi động ở `public/splash/` (nền xanh + huy hiệu + tên), khai báo trong `src/app/layout.tsx`. Tạo lại bằng `node scripts/gen-splash.mjs`. iOS chỉ dùng ảnh khi thiết bị khớp đúng kích thước đã khai báo, và cũng cần **gỡ rồi thêm lại** vào màn hình chính.
- **Trong lúc trang tải:** có một lớp phủ nền xanh + huy hiệu + tên hiển thị ngay từ khung hình đầu và mờ dần khi ứng dụng sẵn sàng (tối đa 6 giây). Chỉ hiện khi mở từ biểu tượng đã cài (chế độ standalone), trình duyệt thường không thấy.

### Vì sao vẫn có thể thấy màn hình đen lúc đầu, và cách đã xử lý

- Khoảnh khắc đầu tiên khi mở app (trước khi có bất kỳ mã nào của ta chạy) do **hệ điều hành** dựng: Android lấy nền/biểu tượng từ manifest **lúc cài**, iOS lấy ảnh khởi động khớp **đúng cỡ máy**. Nếu cài từ trước khi có cấu hình mới, hoặc cỡ máy không khớp, sẽ còn thấy màn hình đen/trắng cho tới khi cài lại.
- Khoảng chờ tiếp theo là **chờ máy chủ trả trang** (đặc biệt khi máy chủ "ngủ" lâu chưa gọi). Để không còn màn hình trống, ứng dụng đã cài giờ mở bằng **trang khởi động tĩnh** `public/start.html` (`start_url` trong manifest): nền xanh + huy hiệu + vòng xoay, phục vụ tức thì và được **Service Worker lưu sẵn** (mở lại gần như không chờ mạng), rồi tự chuyển vào `/dashboard`. Trang này giữ nguyên trên màn hình cho tới khi trang đích trả về nên không bị khoảng trắng giữa hai trang.
