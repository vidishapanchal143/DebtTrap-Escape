import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "DebtTrap Escape — Clearer Loan Decisions",
  description: "Understand loan costs, compare offers, and know what to check before you commit."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}