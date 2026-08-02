"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { passwordSchema } from "@/server/auth/validation";
import { useResetPassword } from "@/hooks/use-auth";
import { ApiClientError } from "@/types/api";
import { z } from "zod";

const formSchema = z.object({ password: passwordSchema });
type ResetPasswordValues = z.infer<typeof formSchema>;

export function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const resetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password: values.password,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Something went wrong.";
      form.setError("password", { message });
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <CircleX className="size-6" />
          </div>
          <CardTitle className="mt-2">Invalid link</CardTitle>
          <CardDescription>
            This password reset link is missing its token. Request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium underline underline-offset-4"
          >
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="size-6" />
          </div>
          <CardTitle className="mt-2">Password updated</CardTitle>
          <CardDescription>Redirecting you to login…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          Make it something you&apos;ll remember.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending
                ? "Updating…"
                : "Update password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
