import { Sparkles, ThumbsUp, ThumbsDown, ListChecks, Dumbbell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CoachingFeedbackRecord } from "@/services/speech";

function FeedbackSection({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CoachingFeedbackCard({
  feedback,
}: {
  feedback: CoachingFeedbackRecord | null;
}) {
  if (!feedback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coaching feedback</CardTitle>
          <CardDescription>
            We couldn&apos;t generate written feedback for this session, but
            your scores above are fully computed and accurate. You can
            practice again anytime.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Coaching feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm leading-relaxed">
          {feedback.summary}
        </p>

        <FeedbackSection icon={ThumbsUp} title="Strengths" items={feedback.strengths} />
        <FeedbackSection icon={ThumbsDown} title="Weaknesses" items={feedback.weaknesses} />
        <FeedbackSection icon={ListChecks} title="Action plan" items={feedback.actionPlan} />
        <FeedbackSection icon={Dumbbell} title="Practice drills" items={feedback.practiceDrills} />

        <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{feedback.motivationalNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
