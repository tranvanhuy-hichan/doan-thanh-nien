import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export type UploadFolder = "activities" | "members" | "certificates" | "documents";
const ROOT = "doan-sonha";

export const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const folderPath = (f: UploadFolder) => `${ROOT}/${f}`;

/** publicId do client gửi lên chỉ hợp lệ nếu nằm trong thư mục của hệ thống. */
export const isOwnPublicId = (publicId: string, f: UploadFolder) => publicId.startsWith(`${folderPath(f)}/`);

export function uploadImage(buffer: Buffer, folder: UploadFolder): Promise<UploadApiResponse> {
  configure();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folderPath(folder),
          resource_type: "image",
          transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
        },
        (err, res) => (err || !res ? reject(err ?? new Error("Upload thất bại")) : resolve(res)),
      )
      .end(buffer);
  });
}

/** Tải tệp tài liệu lên. PDF tải dạng "image" để Cloudinary dựng được ảnh trang đầu; Office tải dạng "raw". Tên gốc được giữ trong public_id để tải về đúng tên. */
export function uploadDocument(buffer: Buffer, filename: string): Promise<UploadApiResponse> {
  configure();
  const safe = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
  const isPdf = /\.pdf$/i.test(safe);
  const publicId = `${Math.random().toString(36).slice(2, 8)}-${isPdf ? safe.replace(/\.pdf$/i, "") : safe}`; // ảnh/PDF: public_id không kèm đuôi
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: folderPath("documents"), resource_type: isPdf ? "image" : "raw", public_id: publicId, use_filename: false },
        (err, res) => (err || !res ? reject(err ?? new Error("Upload thất bại")) : resolve(res)))
      .end(buffer);
  });
}

export async function deleteImage(publicId: string | null | undefined) {
  if (!publicId || !isCloudinaryConfigured()) return;
  configure();
  try {
    // Tài liệu nằm ở thư mục documents: PDF là "image", Office là "raw" -> thử cả hai.
    if (publicId.startsWith(`${folderPath("documents")}/`)) {
      const r = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      if (r.result !== "ok") await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } else {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }
  } catch (e) {
    console.error("[cloudinary] delete failed", e);
  }
}
