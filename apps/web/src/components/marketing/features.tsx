"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpenCheck,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

const features = [
  {
    icon: Gamepad2,
    title: "XP, levels & streaks",
    description:
      "Every correct answer, finished lesson, and daily login earns XP. Level up to unlock cosmetics, titles, and themes.",
  },
  {
    icon: BookOpenCheck,
    title: "Deep Math & English content",
    description:
      "Dozens of topics across Algebra, Geometry, Statistics, Reading, and Writing & Grammar — built to mirror the real digital SAT.",
  },
  {
    icon: Timer,
    title: "Full digital SAT simulations",
    description:
      "Timed, sectioned practice tests with flagging, pausing, and review mode, scored with an estimated SAT score.",
  },
  {
    icon: BarChart3,
    title: "Real analytics",
    description:
      "See your accuracy by topic, your weakest skills, and how your estimated score is trending over time.",
  },
  {
    icon: Sparkles,
    title: "Adaptive practice",
    description:
      "Practice sessions adjust to focus on the topics you're actually weak on, not the ones you've already mastered.",
  },
  {
    icon: ShieldCheck,
    title: "No pay-to-win",
    description:
      "Coins buy cosmetics — avatars, themes, effects. Every question, lesson, and practice test is free.",
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
          Everything you need, none of the boredom
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          Built like the products you already open every day, not a stale
          textbook website.
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
