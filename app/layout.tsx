import type { Metadata } from "next";
import "./globals.css";
import "./filter-popover.css";

export const metadata: Metadata = {
  title: "Payme — Payments",
  description: "A modern payments operations dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
