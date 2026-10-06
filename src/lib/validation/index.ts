import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v === null ? undefined : v);
const optionalText = (max = 2000) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const optionalDate = z.preprocess(emptyToUndef, z.coerce.date().optional());

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự").max(72)
      .regex(/[A-Za-z]/, "Mật khẩu cần có chữ cái").regex(/\d/, "Mật khẩu cần có chữ số"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu xác nhận không khớp" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu hiện tại" });

export const memberSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên").max(100),
  gender: z.preprocess(emptyToUndef, z.enum(["Nam", "Nữ", "Khác"]).optional()),
  dateOfBirth: optionalDate,
  joinedAt: optionalDate,
  cohort: z.preprocess(emptyToUndef, z.coerce.number().int().min(2000).max(2100).optional()),
  departmentId: z.string().min(1, "Chọn Chi đoàn"),
  className: z.string().trim().min(1, "Nhập lớp").max(20),
  status: z.enum(["ACTIVE", "TRANSFERRED", "GRADUATED"]).default("ACTIVE"),
  avatarUrl: optionalText(500),
  avatarPublicId: optionalText(300),
});
export type MemberInput = z.infer<typeof memberSchema>;

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên Chi đoàn").max(50),
  description: optionalText(500),
  startYear: z.number().int().min(2000, "Năm không hợp lệ").max(2100, "Năm không hợp lệ").optional(),
  members: z.string().max(20000).optional(), // danh sách họ tên đoàn viên (mỗi dòng một người) để tự tạo tài khoản
});

/** Bí thư là một đoàn viên của Chi đoàn được gán thêm chức vụ. */
export const secretarySchema = z.object({
  departmentId: z.string().min(1),
  memberId: z.string().min(1, "Chọn đoàn viên làm bí thư"),
});

export const activitySchema = z
  .object({
    title: z.string().trim().min(3, "Tên hoạt động tối thiểu 3 ký tự").max(150),
    description: optionalText(5000),
    location: z.string().trim().min(2, "Nhập địa điểm").max(200),
    startAt: z.coerce.date({ message: "Chọn thời gian bắt đầu" }),
    endAt: z.coerce.date({ message: "Chọn thời gian kết thúc" }),
    categoryId: z.string().min(1, "Chọn loại hoạt động"),
    departmentId: z.preprocess(emptyToUndef, z.string().optional()),
    maxParticipants: z.preprocess(emptyToUndef, z.coerce.number().int().min(1, "Tối thiểu 1").max(5000).optional()),
    points: z.coerce.number().int().min(0, "Điểm không âm").max(100),
    volunteerHours: z.coerce.number().min(0).max(100).default(0),
    imageUrl: optionalText(500),
    imagePublicId: optionalText(300),
  })
  .refine((v) => v.endAt > v.startAt, { path: ["endAt"], message: "Thời gian kết thúc phải sau thời gian bắt đầu" });

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nhập tên loại").max(50),
  defaultPoints: z.coerce.number().int().min(0).max(100),
});

export const badgeSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên huy hiệu").max(60),
  description: z.string().trim().min(1, "Nhập mô tả").max(200),
  icon: z.enum(["award", "heart", "leaf", "star", "trophy", "flame", "book-open", "medal"]),
  criteria: z.enum(["ACTIVITY_COUNT", "VOLUNTEER_HOURS", "TOTAL_POINTS", "CATEGORY_COUNT"]),
  threshold: z.coerce.number().int().min(1, "Tối thiểu 1"),
  categoryId: z.preprocess(emptyToUndef, z.string().optional()),
});

export const pointAdjustSchema = z.object({
  memberId: z.string().min(1),
  points: z.coerce.number().int().min(-100).max(100).refine((n) => n !== 0, "Số điểm khác 0"),
  reason: z.string().trim().min(3, "Nhập lý do").max(200),
});

export const formToObject = (fd: FormData) => Object.fromEntries(fd.entries());

export const postSchema = z.object({
  content: z.string().trim().min(1, "Nhập nội dung bài viết").max(5000, "Tối đa 5000 ký tự"),
  departmentId: z.preprocess(emptyToUndef, z.string().optional()),
  imageUrl: optionalText(500),
  imagePublicId: optionalText(300),
});

export const commentSchema = z.object({ content: z.string().trim().min(1, "Nhập nội dung bình luận").max(1000, "Tối đa 1000 ký tự") });

export const emulationSchema = z.object({
  departmentId: z.string().min(1, "Chọn Chi đoàn"),
  points: z.coerce.number().int().min(-100, "Tối thiểu -100").max(100, "Tối đa 100").refine((n) => n !== 0, "Số điểm khác 0"),
  reason: z.string().trim().min(3, "Nhập nội dung ghi nhận").max(200),
  recordedAt: z.coerce.date({ message: "Chọn ngày ghi nhận" }),
});

export const articleSchema = z.object({
  kind: z.enum(["NEWS", "PLAN", "EVENT", "ANNOUNCEMENT"]),
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự").max(200),
  summary: optionalText(500),
  content: z.string().trim().min(1, "Nhập nội dung").max(50000),
  coverUrl: optionalText(500),
  coverPublicId: optionalText(300),
  eventAt: optionalDate,
  eventLocation: optionalText(200),
  published: z.coerce.boolean().default(true),
  attachments: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    url: z.url().max(600),
    publicId: z.string().min(1).max(300),
    size: z.coerce.number().int().min(0).max(50_000_000).default(0),
    mime: z.string().max(150).optional(),
  })).max(10, "Tối đa 10 tệp đính kèm").default([]),
});

export const sitePageSchema = z.object({ content: z.string().max(50000) });

export const reportSchema = z.object({
  departmentId: z.string().optional(), // bí thư: server tự gán Chi đoàn của mình
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự").max(200),
  content: z.string().trim().min(1, "Nhập nội dung").max(50000),
  imageUrl: optionalText(500),
  imagePublicId: optionalText(300),
});
