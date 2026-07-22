"use client";

import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { motion } from "framer-motion";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: APPLE_EASE }}
        className="mb-12 text-center"
      >
        <p className={cn("text-[11px] font-medium uppercase tracking-[0.35em] text-slate-500")}>Features</p>
        <h1 className={cn("mt-4 text-3xl font-light tracking-tight sm:text-4xl")}>Chimera capabilities</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-500">
          Explore the full list of Chimera's security features, from URL analysis to agentic and sandboxing capabilities.
        </p>
      </motion.div>

      <FeaturesSection />
    </main>
  );
}
