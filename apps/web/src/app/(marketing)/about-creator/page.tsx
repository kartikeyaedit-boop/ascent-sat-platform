import type { Metadata } from "next";
import { AboutCreatorContent } from "@/components/marketing/about-creator-content";

export const metadata: Metadata = {
  title: "About the Creator",
  description: "Meet the creator behind the platform.",
};

export default function AboutCreatorPage() {
  return <AboutCreatorContent />;
}
