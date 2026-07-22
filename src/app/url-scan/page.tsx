"use client";

import { ScanConsole } from "@/components/scanner/ScanConsole";
import { ScannerInput } from "@/components/scanner/ScannerInput";
import { useScanSession } from "@/hooks/useScanSession";
import { motion } from "framer-motion";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { themeTokens } from "@/lib/themes";

export default function UrlScanPage() {
  const session = useScanSession();
  const { theme } = useTheme();
  const t = themeTokens[theme];

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: APPLE_EASE }}>
        <h1 className={cn("text-3xl font-light mb-4", t.text)}>URL Scan</h1>
        <p className={cn("mb-6 text-sm", t.muted)}>Scan suspicious URLs with Chimera's URL analysis engine.</p>
        <div className={cn("rounded-3xl border p-8", t.panel)}>
          <div className="mx-auto max-w-3xl">
            <ScannerInput session={session} />
            <div className="mt-6">
              <ScanConsole session={session} showAllTabs />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
