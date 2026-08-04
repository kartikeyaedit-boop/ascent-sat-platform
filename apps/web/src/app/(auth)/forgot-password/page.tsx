"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck } from "lucide-react";
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
import { useResetPasswordWithRecoveryCode } from "@/hooks/use-auth";
import { ApiClientError } from "@/types/api";
import { RecoveryCodeDisplay } from "@/components/auth/recovery-code-display";

const formSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  recoveryCode: z.string().min(1, "Recovery code is required"),
  password: passwordSchema,
});
type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const resetMutation = useResetPasswordWithRecoveryCode();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", recoveryCode: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { recoveryCode } = await resetMutation.mutateAsync(values);
      setNewRecoveryCode(recoveryCode);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Something went wrong.";
      form.setError("recoveryCode", { message });
    }
  }

  if (newRecoveryCode) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="size-6" />
          </div>
          <CardTitle className="mt-2">Password reset</CardTitle>
          <CardDescription>
            Your old recovery code is no longer valid — here&apos;s your new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RecoveryCodeDisplay code={newRecoveryCode} />
          <Button asChild className="w-full">
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter the email and recovery code you saved when you created your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recoveryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recovery code</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXX-XXXX-XXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lost your recovery code?{" "}
          <Link
            href="/forgot-password/email-link"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Try email instead
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
