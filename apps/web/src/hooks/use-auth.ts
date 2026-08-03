"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as authService from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { ApiClientError } from "@/types/api";

const ME_QUERY_KEY = ["me"] as const;

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        const { user } = await authService.fetchCurrentUser();
        return user;
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data !== undefined) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(ME_QUERY_KEY, user);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: authService.register });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      router.push("/");
    },
  });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: authService.verifyEmail });
}

export function useResendVerification() {
  return useMutation({ mutationFn: authService.resendVerification });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authService.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authService.resetPassword });
}

export function useChangePassword() {
  return useMutation({ mutationFn: authService.changePassword });
}
