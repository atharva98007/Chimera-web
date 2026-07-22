"use client";



import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { motion } from "framer-motion";

import { Shield } from "lucide-react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

import { useTheme } from "@/context/ThemeContext";

import { themeTokens } from "@/lib/themes";

import { APPLE_EASE } from "@/lib/motion";

import { cn } from "@/lib/utils";



const navLinks = [
  { href: "/url-scan", label: "URL Scan" },
  { href: "/email-scan", label: "Email Scan" },
  { href: "/agentic", label: "Agentic Panel" },
  { href: "/sandboxing", label: "Sandboxing" },
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
];



export function Navbar() {

  const { theme } = useTheme();

  const t = themeTokens[theme];

  const isDark = theme === "dark";

  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ fullName?: string; email: string } | null>(null);

  useEffect(() => {
    const loadUser = () => {
      if (typeof window === "undefined") return;
      const stored = sessionStorage.getItem("chimera_user");
      if (!stored) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    };

    loadUser();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "chimera_user") {
        loadUser();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("chimera_user_changed", loadUser);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("chimera_user_changed", loadUser);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("chimera_user");
    setUser(null);
    router.push("/");
  };

  const headerBg = isDark
    ? "rgba(5, 5, 5, 0.92)"
    : "rgba(255, 255, 255, 1)";

  const borderColor = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.08)";



  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: APPLE_EASE }}
      style={{ backgroundColor: headerBg, borderBottom: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(24,24,27,0.16)" }}
      className="fixed top-0 left-0 right-0 z-50"

    >

      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

        <Link href="/" className="group flex shrink-0 items-center gap-3">

          <div

            className={cn(

              "flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-300",

              isDark
                ? "border-white/10 bg-white/[0.03] group-hover:border-white/30 group-hover:bg-white/[0.08] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.55),0_0_40px_rgba(255,255,255,0.26)]"
                : "border-zinc-200 bg-white group-hover:border-zinc-300 group-hover:bg-zinc-50 group-hover:shadow-[0_0_20px_rgba(161,161,170,0.45),0_0_40px_rgba(212,212,216,0.28)]"

            )}

          >

            <Shield

              className={cn(
                "h-4 w-4 transition-all duration-300",
                isDark ? "text-zinc-300 group-hover:text-white" : "text-zinc-700 group-hover:text-zinc-500"
              )}

              strokeWidth={1.5}

            />

          </div>

          <span

            className={cn(

              "text-sm font-medium tracking-[0.2em] uppercase",

              isDark ? "text-zinc-300" : "text-zinc-800"

            )}

          >

            Chimera

          </span>

        </Link>



        <ul className="hidden items-center gap-0.5 lg:flex">

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition duration-300",
                    t.muted,
                    isDark ? "hover:text-zinc-100" : "hover:text-zinc-900",
                    isActive &&
                      (isDark
                        ? "text-white ring-1 ring-white/30 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                        : "bg-zinc-100/80 text-zinc-900 ring-1 ring-zinc-300/80 shadow-[0_0_18px_rgba(161,161,170,0.25)]")
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}

        </ul>



        <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">

          {user ? (
            <div className="flex items-center gap-3">
              <div
                title={user.fullName ?? user.email}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white",
                  isDark ? "bg-zinc-900" : "bg-slate-900"
                )}
              >
                {(user.fullName?.trim().charAt(0) || user.email.charAt(0)).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300",
                  t.muted,
                  isDark ? "hover:text-zinc-100" : "hover:text-zinc-900"
                )}
              >
                Logout
              </button>
            </div>
          ) : null}

            {/* Mobile-only quick links for Agentic and Sandboxing */}
            <div className="flex items-center gap-1 lg:hidden">
              <Link
                href="/agentic"
                className={cn(
                  "rounded-md px-1.5 py-1 text-xs font-medium whitespace-nowrap",
                  t.muted,
                  isDark ? "hover:text-zinc-100" : "hover:text-zinc-900"
                )}
              >
                Agentic
              </Link>
              <Link
                href="/sandboxing"
                className={cn(
                  "rounded-md px-1.5 py-1 text-xs font-medium whitespace-nowrap",
                  t.muted,
                  isDark ? "hover:text-zinc-100" : "hover:text-zinc-900"
                )}
              >
                Sandbox
              </Link>
            </div>

            {/* Re-add login/signup at end for mobile */}
            {user ? null : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "rounded-lg px-1.5 py-1.5 text-[0.65rem] font-medium transition-colors duration-300 sm:px-3 sm:py-2 sm:text-sm whitespace-nowrap",
                    t.muted,
                    isDark ? "hover:text-zinc-100" : "hover:text-zinc-900"
                  )}
                >
                  Log in
                </Link>
                {/* Sign up removed per request */}
              </>
            )}

            <div className="-ml-1">
              <ThemeToggle />
            </div>

        </div>

      </nav>

    </motion.header>

  );

}

