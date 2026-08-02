"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  BarChart3,
  MessageSquareText,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Live feedback while you speak",
    description:
      "See your pace, filler words, and confidence score update in real time as you talk — not just after you're done.",
  },
  {
    icon: MessageSquareText,
    title: "Coaching that explains itself",
    description:
      "Every score comes with a reason. We'll never just say 'confidence: 62' — you'll know exactly what pulled it up or down.",
  },
  {
    icon: AudioLines,
    title: "Vocal variety tracking",
    description:
      "Pitch, volume, and energy tracked throughout your speech, so you can catch monotone delivery before your audience does.",
  },
  {
    icon: Sparkles,
    title: "Research-backed techniques",
    description:
      "Learn and practice real communication frameworks — the Rule of Three, PREP, Monroe's Motivated Sequence — with guided drills.",
  },
  {
    icon: BarChart3,
    title: "Progress you can see",
    description:
      "Track confidence, clarity, and pace across every session, so improvement isn't just a feeling — it's a graph.",
  },
  {
    icon: ShieldCheck,
    title: "Your recordings, your control",
    description:
      "Clear on what's stored versus processed live, with full deletion of any recording or transcript whenever you want.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          A speaking coach that&apos;s always available
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          No scheduling, no judgment — just practice, real feedback, and a
          clear path to getting better.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
