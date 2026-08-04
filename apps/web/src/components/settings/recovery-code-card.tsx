"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRegenerateRecoveryCode } from "@/hooks/use-auth";
import { ApiClientError } from "@/types/api";
import { RecoveryCodeDisplay } from "@/components/auth/recovery-code-display";

export function RecoveryCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const regenerate = useRegenerateRecoveryCode();

  function handleGenerate() {
    regenerate.mutate(undefined, {
      onSuccess: ({ recoveryCode }) => setCode(recoveryCode),
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Couldn't generate a new code.");
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recovery code</CardTitle>
        <CardDescription>
          Used to reset your password without email. We only show it once —
          generate a new one anytime if you lost yours (this invalidates the old one).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {code && <RecoveryCodeDisplay code={code} />}
        <Button variant="outline" disabled={regenerate.isPending} onClick={handleGenerate}>
          {regenerate.isPending ? "Generating…" : code ? "Generate another" : "Generate new code"}
        </Button>
      </CardContent>
    </Card>
  );
}
