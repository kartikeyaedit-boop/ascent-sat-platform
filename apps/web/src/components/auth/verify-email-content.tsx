"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useVerifyEmail } from "@/hooks/use-auth";

export function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const verifyMutation = useVerifyEmail();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;
    verifyMutation.mutate(token);
  }, [token, verifyMutation]);

  if (!token) {
    return (
      <StatusCard
        icon={<CircleX className="size-6" />}
        tone="destructive"
        title="Missing verification token"
        description="This link doesn't include a verification token. Try clicking the link in your email again."
      />
    );
  }

  if (verifyMutation.isPending || verifyMutation.isIdle) {
    return (
      <StatusCard
        icon={<Loader2 className="size-6 animate-spin" />}
        tone="muted"
        title="Verifying your email…"
        description="This will only take a second."
      />
    );
  }

  if (verifyMutation.isError) {
    return (
      <StatusCard
        icon={<CircleX className="size-6" />}
        tone="destructive"
        title="Verification failed"
        description="This link is invalid or has expired. Log in to request a new verification email."
        action={{ href: "/login", label: "Go to login" }}
      />
    );
  }

  return (
    <StatusCard
      icon={<CircleCheck className="size-6" />}
      tone="success"
      title="Email verified"
      description="Your account is ready. Log in to start studying."
      action={{ href: "/login", label: "Log in" }}
    />
  );
}

function StatusCard({
  icon,
  tone,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  tone: "success" | "destructive" | "muted";
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  const toneClasses = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div
          className={`flex size-12 items-center justify-center rounded-full ${toneClasses}`}
        >
          {icon}
        </div>
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && (
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
