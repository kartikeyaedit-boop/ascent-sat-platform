import { Suspense } from "react";
import { VerifyEmailContent } from "@/components/auth/verify-email-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
