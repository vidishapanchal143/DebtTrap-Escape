"use client";

import React from "react";
import {
  Bot,
  Calculator,
  Scale,
  Coins,
  ClipboardCheck,
  Fingerprint,
  Wallet,
  Plus,
  Clock,
  ExternalLink,
  ShieldCheck,
  X,
  FileSearch,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { MidnightNavSection, RecentSession } from "@/types/midnight";

interface MidnightSidebarProps {
  activeSection: MidnightNavSection;
  setActiveSection: (section: MidnightNavSection) => void;
  onNewTask: () => void;
  recentSessions: RecentSession[];
  onSelectSession: (session: RecentSession) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  walletBalance: { balance: number; asset: string } | null;
}

export function MidnightSidebar({
  activeSection,
  setActiveSection,
  onNewTask,
  recentSessions,
  onSelectSession,
  mobileOpen,
  setMobileOpen,
  walletBalance,
}: MidnightSidebarProps) {
  const navItems = [
    {
      id: "workspace" as MidnightNavSection,
      label: "Agent Command Center",
      shortLabel: "AI Agent",
      icon: Bot,
      highlight: true,
      badge: "Core",
    },
    {
      id: "guided-review" as MidnightNavSection,
      label: "Guided 3-Step Review",
      shortLabel: "Guided",
      icon: FileSearch,
    },
    {
      id: "loan-calc" as MidnightNavSection,
      label: "True Cost Calculator",
      shortLabel: "Calculator",
      icon: Calculator,
    },
    {
      id: "compare" as MidnightNavSection,
      label: "Compare Loan Offers",
      shortLabel: "Compare",
      icon: Scale,
    },
    {
      id: "crypto" as MidnightNavSection,
      label: "Crypto Collateral Risk",
      shortLabel: "Crypto",
      icon: Coins,
    },
    {
      id: "document-review" as MidnightNavSection,
      label: "Agreement Checklist",
      shortLabel: "Checklist",
      icon: ClipboardCheck,
    },
    {
      id: "evidence" as MidnightNavSection,
      label: "Evidence Vault (SHA-256)",
      shortLabel: "Evidence",
      icon: Fingerprint,
      badge: "WebCrypto",
    },
    {
      id: "wallet" as MidnightNavSection,
      label: "Simulated Wallet Ledger",
      shortLabel: "Demo Wallet",
      icon: Wallet,
      badge: "Demo",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#08111F]/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#8E9EB5]/15 bg-[#0D192A] text-[#F1F5F9] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="flex h-[76px] items-center justify-between border-b border-[#8E9EB5]/15 px-5">
          <button
            type="button"
            onClick={() => {
              setActiveSection("workspace");
              setMobileOpen(false);
            }}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#56D9F5]/40 rounded-lg p-1"
            aria-label="DebtTrap Escape Home"
          >
            <BrandLogo className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#56D9F5] via-[#39D6C0] to-[#122238] p-1.5 shadow-md shadow-[#56D9F5]/10" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">DebtTrap</span>
                <span className="font-bold text-[#56D9F5] text-base">Escape</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#78F5CF] animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider text-[#8E9EB5] font-semibold">
                  Safety Agent
                </span>
              </div>
            </div>
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-[#8E9EB5] hover:bg-[#122238] hover:text-white lg:hidden"
            aria-label="Close Navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Task / Analysis Action */}
        <div className="p-4 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewTask();
              setMobileOpen(false);
            }}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#78F5CF] px-4 py-2.5 font-semibold text-[#08111F] shadow-lg shadow-[#78F5CF]/15 transition-all duration-200 hover:bg-[#8bf7d5] hover:shadow-[#78F5CF]/25 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#56D9F5] text-xs uppercase tracking-wide"
            aria-label="Start New Analysis"
          >
            <Plus size={16} strokeWidth={2.5} className="transition-transform group-hover:rotate-90 duration-200" />
            <span>New Analysis / Task</span>
          </button>
        </div>

        {/* Primary Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8E9EB5]/70">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileOpen(false);
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-180 text-left focus:outline-none focus:ring-1 focus:ring-[#56D9F5] ${
                  isActive
                    ? "bg-[#122238] text-white border-l-2 border-[#56D9F5] shadow-sm shadow-[#56D9F5]/10 font-semibold"
                    : "text-[#8E9EB5] hover:bg-[#122238]/60 hover:text-[#F1F5F9]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    size={17}
                    className={`shrink-0 transition-colors ${
                      isActive ? "text-[#56D9F5]" : "text-[#8E9EB5] group-hover:text-[#39D6C0]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${
                      item.badge === "Core"
                        ? "bg-[#56D9F5]/15 text-[#56D9F5]"
                        : item.badge === "Demo"
                        ? "bg-[#F4BB63]/15 text-[#F4BB63]"
                        : "bg-[#39D6C0]/15 text-[#39D6C0]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Recent Sessions (if supported / available) */}
          <div className="pt-4 pb-1">
            <div className="flex items-center justify-between px-3 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9EB5]/70">
                Recent Sessions
              </span>
              <Clock size={12} className="text-[#8E9EB5]/50" />
            </div>

            {recentSessions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-[#8E9EB5]/60 italic">
                No saved sessions yet. Start a calculation or chat above.
              </div>
            ) : (
              <div className="space-y-1">
                {recentSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      onSelectSession(session);
                      setMobileOpen(false);
                    }}
                    className="group flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-[#122238] focus:outline-none focus:ring-1 focus:ring-[#56D9F5]"
                  >
                    <span className="text-xs font-medium text-[#F1F5F9] group-hover:text-[#56D9F5] line-clamp-1">
                      {session.title}
                    </span>
                    <span className="text-[10px] text-[#8E9EB5] line-clamp-1">
                      {session.preview}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Demo Wallet Quick Balance Card */}
        <div className="mx-3 mb-3 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/70 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8E9EB5]">
              <Wallet size={13} className="text-[#39D6C0]" />
              Demo Ledger
            </span>
            <span className="rounded bg-[#F4BB63]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#F4BB63]">
              Simulated
            </span>
          </div>
          <div className="mt-1 text-sm font-bold text-white tracking-tight">
            {walletBalance ? `${walletBalance.balance.toLocaleString()} ${walletBalance.asset}` : "10,000.00 SIM-USDC"}
          </div>
          <p className="mt-0.5 text-[10px] text-[#8E9EB5]/70">
            Local SQLite off-chain ledger. Not real crypto.
          </p>
        </div>

        {/* System & Security Telemetry */}
        <div className="border-t border-[#8E9EB5]/15 p-3 text-[10px] text-[#8E9EB5]/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-[#78F5CF]" />
              Sepolia Hash Registry
            </span>
            <a
              href="https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[#56D9F5] hover:underline"
              aria-label="View smart contract on Sepolia Etherscan"
            >
              <span>0x8638…</span>
              <ExternalLink size={9} />
            </a>
          </div>
          <div className="text-[9px] text-[#8E9EB5]/50 flex items-center justify-between pt-0.5">
            <span>WebCrypto Client-Side Hashing</span>
            <span className="text-[#78F5CF]">SHA-256</span>
          </div>
        </div>
      </aside>
    </>
  );
}
