"use client";

import { Brain, Mail, Fingerprint, Link2, Lock, ShieldCheck, Globe2, Key, Cpu, Layers, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { TiltCard } from "@/components/features/TiltCard";
import { ProductSwitcher } from "@/components/home/ProductSwitcher";
import { ScannerInput } from "@/components/scanner/ScannerInput";
import { ScanConsole } from "@/components/scanner/ScanConsole";
import { EmailScanner } from "@/components/email/EmailScanner";
import { useScanSession } from "@/hooks/useScanSession";
import { useEmailSession } from "@/hooks/useEmailSession";
import { useTheme } from "@/context/ThemeContext";
import { themeTokens } from "@/lib/themes";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <Link2 className="h-5 w-5" strokeWidth={1.5} />,
    title: "Real-Time URL Analysis",
    description: "SSL, redirects, domain age, homoglyphs, and threat intel in one pass.",
  },
  {
    icon: <Mail className="h-5 w-5" strokeWidth={1.5} />,
    title: "Email Phishing Checker",
    description: "Headers, urgency language, and embedded links scored in seconds.",
  },
  {
    icon: <Brain className="h-5 w-5" strokeWidth={1.5} />,
    title: "AI Risk Scoring",
    description: "Calibrated verdicts with transparent factor breakdown.",
  },
  {
    icon: <Fingerprint className="h-5 w-5" strokeWidth={1.5} />,
    title: "Threat Fingerprinting",
    description: "Community signals and heuristic anomaly detection.",
  },
  {
    icon: <Lock className="h-5 w-5" strokeWidth={1.5} />,
    title: "Privacy First",
    description: "Client-side evaluation — your targets stay on your machine.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />,
    title: "White-Hat Terminal",
    description: "Built for defenders who need clarity, not noise.",
  },
  {
    icon: <Link2 className="h-5 w-5" strokeWidth={1.5} />,
    title: "Lexical Scan",
    description: "Deep lexical analysis of URLs and payload text.",
  },
  {
    icon: <Globe2 className="h-5 w-5" strokeWidth={1.5} />,
    title: "Network Scan",
    description: "Passive and active network indicators, topology, and reachability.",
  },
  {
    icon: <Key className="h-5 w-5" strokeWidth={1.5} />,
    title: "Crypto Scan",
    description: "Detects crypto-related payloads, wallets, and obfuscated tokens.",
  },
  {
    icon: <Fingerprint className="h-5 w-5" strokeWidth={1.5} />,
    title: "Context Scan",
    description: "Contextual threat correlation across artifacts and timelines.",
  },
  {
    icon: <Brain className="h-5 w-5" strokeWidth={1.5} />,
    title: "Convolutional Neural Network",
    description: "Image and pattern recognition powered by CNN models.",
  },
  {
    icon: <Brain className="h-5 w-5" strokeWidth={1.5} />,
    title: "Natural Language Processing (NLP)",
    description: "Semantic analysis and intent detection for text and emails.",
  },
  {
    icon: <Cpu className="h-5 w-5" strokeWidth={1.5} />,
    title: "DNS Fastflux Detection",
    description: "Identifies fast-changing DNS infrastructures indicative of botnets.",
  },
  {
    icon: <Layers className="h-5 w-5" strokeWidth={1.5} />,
    title: "Graph Neural Network",
    description: "Relational analysis using GNNs for entity-link patterns.",
  },
  {
    icon: <Activity className="h-5 w-5" strokeWidth={1.5} />,
    title: "Agentic Scan",
    description: "Autonomous multi-agent investigations that cross-validate findings.",
  },
  {
    icon: <Globe2 className="h-5 w-5" strokeWidth={1.5} />,
    title: "Sandboxing",
    description: "Safe detonation of artifacts in isolated environments.",
  },
];

export function FeaturesSection() {
  const { theme } = useTheme();
  const t = themeTokens[theme];
  const [mode, setMode] = useState<"url" | "email">("url");
  const urlSession = useScanSession();
  const emailSession = useEmailSession();

  return (
    <section
      id="features"
        className="relative pt-20 lg:pt-28 lg:pb-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: APPLE_EASE }}
          className="mb-16 text-center"
        >
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.35em]", t.muted)}>
            Capabilities
          </p>
          <h2 className={cn("mt-4 text-3xl font-light tracking-tight sm:text-4xl leading-relaxed", t.text)}>
            Security, refined
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <TiltCard key={f.title} {...f} delay={i * 0.06} />
          ))}
        </div>

      </div>
    </section>
  );
}
