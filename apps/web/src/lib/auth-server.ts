import { cookies } from "next/headers";
import {
  getUserFromAccessToken,
  type PublicUser,
} from "@/server/auth/auth.service";
import { ACCESS_TOKEN_COOKIE } from "@/server/auth/cookies";
import { AuthErrors } from "@/lib/errors";

/** Reads the current user from the access token cookie. Read-only: does not
 * attempt to refresh an expired token (that happens client-side via the
 * API client's 401 interceptor, or the /api/auth/refresh route). */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  return getUserFromAccessToken(accessToken);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw AuthErrors.unauthenticated();
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw AuthErrors.unauthenticated();
  return user;
}
