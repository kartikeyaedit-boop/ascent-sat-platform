import { Suspense } from "react";
import { ResetPasswordContent } from "@/components/auth/reset-password-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
