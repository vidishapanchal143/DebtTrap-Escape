import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DebtTrap Escape — AI Financial Safety Agent",
  description:
    "Cinematic AI financial safety agent for true loan amortization, predatory clause screening, cash-flow stress testing, and crypto collateral risk modeling.",
};

export const viewport: Viewport = {
  themeColor: "#08111F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#08111F]">
      <body className="min-h-screen bg-[#08111F] text-[#F1F5F9] antialiased overflow-x-hidden selection:bg-[#56D9F5]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}