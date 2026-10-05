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
