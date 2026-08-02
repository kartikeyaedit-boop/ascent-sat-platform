"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { siteConfig } from "@/lib/site-config";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AboutCreatorContent() {
  const { creator } = siteConfig;

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="text-sm font-medium text-muted-foreground">
          About the Creator
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          The person behind {siteConfig.name}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-12 rounded-2xl border bg-card p-8 shadow-sm sm:p-10"
      >
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
          <Avatar className="size-20 shrink-0 text-xl sm:size-24">
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
              {getInitials(creator.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-2xl font-semibold">{creator.name}</h2>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <MapPin className="size-4" />
              {creator.location}
            </p>
          </div>
        </div>

        <p className="mt-8 text-lg leading-relaxed text-pretty text-foreground/90">
          This platform was created by {creator.name}, based in{" "}
          {creator.location}, with the goal of making SAT preparation more
          engaging, interactive, and enjoyable through modern technology and
          gamified learning.
        </p>
      </motion.div>
    </section>
  );
}
