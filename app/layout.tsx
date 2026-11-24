import type { Metadata } from "next";
import "./globals.css";
import "./filter-popover.css";
import { ClientErrorMonitor } from "@/components/client-error-monitor";

export const metadata: Metadata = {
  title: "Payme — Payments",
  description: "A modern payments operations dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ClientErrorMonitor />{children}</body></html>;
}
