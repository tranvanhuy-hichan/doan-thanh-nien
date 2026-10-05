"use client";
import type { Credential } from "@/actions/members";

export function downloadCsv(rows: Credential[], filename: string) {
  const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const lines = [["Mã đoàn viên", "Họ tên", "Lớp", "Chi đoàn", "Mật khẩu tạm thời"].map(esc).join(",")]
    .concat(rows.map((r) => [r.code, r.fullName, r.className, r.department, r.password].map(esc).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
