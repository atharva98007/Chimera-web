"use client";

import { EmailScanner } from "@/components/email/EmailScanner";
import { useEmailSession } from "@/hooks/useEmailSession";
import { motion } from "framer-motion";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { themeTokens } from "@/lib/themes";

export default function EmailScanPage() {
  const session = useEmailSession();
  const { theme } = useTheme();
  const t = themeTokens[theme];

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: APPLE_EASE }}>
        <h1 className={cn("text-3xl font-light mb-4", t.text)}>Email Scan</h1>
        <p className={cn("mb-6 text-sm", t.muted)}>Analyze email artifacts for phishing and spam indicators.</p>
        <EmailScanner session={session} />
      </motion.div>
    </section>
  );
}
