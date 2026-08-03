import { apiFetch } from "@/lib/api-client";
import type { PublicUser } from "@/types/api";

export function fetchCurrentUser(): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>("/api/me");
}

export function register(input: {
  email: string;
  password: string;
  name: string;
}) {
  return apiFetch<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: input,
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function logout() {
  return apiFetch<{ success: true }>("/api/auth/logout", { method: "POST" });
}

export function verifyEmail(token: string) {
  return apiFetch<{ success: true }>("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function resendVerification(email: string) {
  return apiFetch<{ success: true }>("/api/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ success: true }>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(input: { token: string; password: string }) {
  return apiFetch<{ success: true }>("/api/auth/reset-password", {
    method: "POST",
    body: input,
  });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ ok: true }>("/api/auth/change-password", {
    method: "POST",
    body: input,
  });
}
