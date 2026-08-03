import Link from "next/link";
import { Layers, Megaphone, Lightbulb, Mic, BookOpen, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SPEECH_TECHNIQUES, type SpeechTechnique } from "@/lib/speech-techniques";

const CATEGORY_ICONS: Record<SpeechTechnique["category"], LucideIcon> = {
  Structure: Layers,
  Persuasion: Megaphone,
  Clarity: Lightbulb,
  Delivery: Mic,
  Storytelling: BookOpen,
};

const CATEGORY_COLORS: Record<SpeechTechnique["category"], string> = {
  Structure: "bg-blue-500/10 text-blue-600",
  Persuasion: "bg-rose-500/10 text-rose-600",
  Clarity: "bg-amber-500/10 text-amber-600",
  Delivery: "bg-emerald-500/10 text-emerald-600",
  Storytelling: "bg-purple-500/10 text-purple-600",
};

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Speech Library</h1>
        <p className="text-muted-foreground">
          {SPEECH_TECHNIQUES.length} communication techniques, each with a breakdown, an example, and a way to try it in your next session.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SPEECH_TECHNIQUES.map((technique) => {
          const Icon = CATEGORY_ICONS[technique.category];
          return (
            <Link key={technique.slug} href={`/library/${technique.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="flex items-start gap-3 py-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${CATEGORY_COLORS[technique.category]}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{technique.name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {technique.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{technique.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
