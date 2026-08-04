"use client";

import { useState } from "react";
import { Copy, Check, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecoveryCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
        <code className="font-mono text-lg font-semibold tracking-wide">{code}</code>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
        Save this now — it&apos;s the only way to reset your password, and
        you won&apos;t be able to see it again. It won&apos;t be emailed to you.
      </p>
    </div>
  );
}
