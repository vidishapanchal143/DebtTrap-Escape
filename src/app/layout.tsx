import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "DebtTrap Escape — Loan Safety Agent",
  description: "Understand loan costs and review warning signs with evidence."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}