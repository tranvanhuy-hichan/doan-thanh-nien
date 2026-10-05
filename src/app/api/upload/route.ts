import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isCloudinaryConfigured, uploadImage, type UploadFolder } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const FOLDERS: UploadFolder[] = ["activities", "members", "certificates"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const folder = form.get("folder") as UploadFolder;
  if (!(file instanceof File) || !FOLDERS.includes(folder)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
  // Ảnh hoạt động / chứng nhận: chỉ ADMIN & BÍ THƯ. Ảnh đại diện: mọi người dùng cho chính mình.
  if (folder !== "members" && user.role === "MEMBER") {
    return NextResponse.json({ error: "Không có quyền tải ảnh lên" }, { status: 403 });
  }
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 400 });
  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Chưa cấu hình Cloudinary trên máy chủ" }, { status: 503 });
  }
  try {
    const res = await uploadImage(Buffer.from(await file.arrayBuffer()), folder);
    return NextResponse.json({ imageUrl: res.secure_url, publicId: res.public_id });
  } catch (e) {
    console.error("[upload]", e);
    return NextResponse.json({ error: "Tải ảnh lên thất bại" }, { status: 502 });
  }
}
