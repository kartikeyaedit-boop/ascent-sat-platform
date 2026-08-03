"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { passwordSchema } from "@/server/auth/validation";
import { useChangePassword } from "@/hooks/use-auth";
import { ApiClientError } from "@/types/api";

const formSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
type ChangePasswordValues = z.infer<typeof formSchema>;

export function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePasswordMutation.mutateAsync(values);
      form.reset();
      toast.success("Password updated.");
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Something went wrong.";
      form.setError("currentPassword", { message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Update your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
