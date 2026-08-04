import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mic, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTechniqueBySlug } from "@/lib/speech-techniques";

export default async function TechniquePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const technique = getTechniqueBySlug(slug);
  if (!technique) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/library">
          <ArrowLeft className="size-4" />
          Speech Library
        </Link>
      </Button>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{technique.name}</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {technique.category}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">{technique.summary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">When to use it</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{technique.whenToUse}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {technique.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm italic leading-relaxed text-muted-foreground">
            {technique.example}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 py-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold">Try it next session</p>
            <p className="mt-1 text-sm text-muted-foreground">{technique.practiceTip}</p>
          </div>
        </CardContent>
      </Card>

      <Button asChild className="w-full">
        {/* Plain anchor, not next/link — see sessions/[id]/page.tsx for why. */}
        <a href="/practice">
          <Mic className="size-4" />
          Practice now
        </a>
      </Button>
    </div>
  );
}
