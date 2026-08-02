"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card px-8 py-14 text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to start leveling up?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground text-pretty">
          Create a free account and jump into your first practice session in
          under a minute.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
