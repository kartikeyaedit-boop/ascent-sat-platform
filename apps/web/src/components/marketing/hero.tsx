"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/12%),transparent_60%)]" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="size-3.5" />
            Live feedback while you speak
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Speak with{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              confidence
            </span>
            , every time.
          </h1>

          <p className="mt-5 max-w-md text-lg text-muted-foreground text-pretty">
            {siteConfig.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Start practicing free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative"
        >
          <div className="rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <Mic className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Live session</p>
                  <p className="text-xs text-muted-foreground">Impromptu speaking · 0:47</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                <TrendingUp className="size-3.5" />
                Confidence 82
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground italic">
              &ldquo;...and that&apos;s why I think the second approach is
              actually the stronger one, because it scales—&rdquo;
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Pace", value: "142 wpm" },
                { label: "Filler words", value: "2" },
                { label: "Clarity", value: "91%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
