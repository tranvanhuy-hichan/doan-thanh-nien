import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret, getAppUrl } from "@/lib/env";

/** QR điểm danh sống ngắn; trang của bí thư tự làm mới. */
export const CHECKIN_TOKEN_TTL_SECONDS = 90;

export async function signCheckinToken(activityId: string, nonce: string) {
  return new SignJWT({ aid: activityId, n: nonce, typ: "checkin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHECKIN_TOKEN_TTL_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifyCheckinToken(token: string): Promise<{ activityId: string; nonce: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.typ !== "checkin" || typeof payload.aid !== "string" || typeof payload.n !== "string") return null;
    return { activityId: payload.aid, nonce: payload.n };
  } catch {
    return null;
  }
}

export const checkinUrl = (token: string) => `${getAppUrl()}/checkin?t=${encodeURIComponent(token)}`;
