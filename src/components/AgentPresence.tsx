"use client";

import React from "react";
import { AgentFlowState } from "@/types/midnight";

interface AgentPresenceProps {
  state: AgentFlowState;
  className?: string;
  size?: "compact" | "normal" | "large";
}

export function AgentPresence({
  state,
  className = "",
  size = "normal",
}: AgentPresenceProps) {
  const getVisualStyles = () => {
    switch (state) {
      case "welcoming":
        return {
          coreGradient: "from-[#56D9F5] via-[#78F5CF] to-[#39D6C0]",
          ringColor: "border-[#56D9F5]/80",
          nodeColor: "bg-[#78F5CF]",
          glowColor: "rgba(86, 217, 245, 0.90)",
          haloColor: "rgba(86, 217, 245, 0.40)",
          pulseClass: "animate-pulse duration-1000 scale-105",
          statusText: "Welcome to DebtTrap Escape",
          accentColor: "text-[#56D9F5]",
          spinSpeed1: "animate-[spin_6s_linear_infinite]",
          spinSpeed2: "animate-[spin_8s_linear_infinite_reverse]",
        };
      case "attentive":
        return {
          coreGradient: "from-[#56D9F5] via-[#78F5CF] to-[#39D6C0]",
          ringColor: "border-[#78F5CF]/80",
          nodeColor: "bg-[#78F5CF]",
          glowColor: "rgba(120, 245, 207, 0.75)",
          haloColor: "rgba(86, 217, 245, 0.35)",
          pulseClass: "animate-pulse duration-500 scale-105",
          statusText: "Preparing your assessment…",
          accentColor: "text-[#78F5CF]",
          spinSpeed1: "animate-[spin_3s_linear_infinite]",
          spinSpeed2: "animate-[spin_4s_linear_infinite_reverse]",
        };
      case "running":
        return {
          coreGradient: "from-[#56D9F5] via-[#39D6C0] to-[#122238]",
          ringColor: "border-[#56D9F5]/60",
          nodeColor: "bg-[#56D9F5]",
          glowColor: "rgba(86, 217, 245, 0.60)",
          haloColor: "rgba(86, 217, 245, 0.22)",
          pulseClass: "animate-pulse duration-1000",
          statusText: "Processing task parameters…",
          accentColor: "text-[#56D9F5]",
          spinSpeed1: "animate-[spin_4s_linear_infinite]",
          spinSpeed2: "animate-[spin_6s_linear_infinite_reverse]",
        };
      case "collecting_input":
      case "needs_clarification":
        return {
          coreGradient: "from-[#39D6C0] via-[#56D9F5] to-[#0D192A]",
          ringColor: "border-[#39D6C0]/50",
          nodeColor: "bg-[#39D6C0]",
          glowColor: "rgba(57, 214, 192, 0.45)",
          haloColor: "rgba(57, 214, 192, 0.16)",
          pulseClass: "",
          statusText:
            state === "needs_clarification"
              ? "Awaiting required details"
              : "Gathering input parameters",
          accentColor: "text-[#39D6C0]",
          spinSpeed1: "animate-[spin_12s_linear_infinite]",
          spinSpeed2: "animate-[spin_16s_linear_infinite_reverse]",
        };
      case "awaiting_approval":
      case "reviewing":
        return {
          coreGradient: "from-[#F4BB63] via-[#e2a84d] to-[#122238]",
          ringColor: "border-[#F4BB63]/70",
          nodeColor: "bg-[#F4BB63]",
          glowColor: "rgba(244, 187, 99, 0.55)",
          haloColor: "rgba(244, 187, 99, 0.20)",
          pulseClass: "animate-pulse duration-1200",
          statusText: "Awaiting explicit authorization",
          accentColor: "text-[#F4BB63]",
          spinSpeed1: "animate-[spin_8s_linear_infinite]",
          spinSpeed2: "animate-[spin_10s_linear_infinite_reverse]",
        };
      case "result_ready":
      case "answering_question":
        return {
          coreGradient: "from-[#78F5CF] via-[#56D9F5] to-[#122238]",
          ringColor: "border-[#78F5CF]/60",
          nodeColor: "bg-[#78F5CF]",
          glowColor: "rgba(120, 245, 207, 0.55)",
          haloColor: "rgba(120, 245, 207, 0.20)",
          pulseClass: "",
          statusText: "Result established & verified",
          accentColor: "text-[#78F5CF]",
          spinSpeed1: "animate-[spin_16s_linear_infinite]",
          spinSpeed2: "animate-[spin_22s_linear_infinite_reverse]",
        };
      case "error":
        return {
          coreGradient: "from-[#F87171] via-[#F4BB63] to-[#122238]",
          ringColor: "border-[#F87171]/60",
          nodeColor: "bg-[#F87171]",
          glowColor: "rgba(248, 113, 113, 0.50)",
          haloColor: "rgba(248, 113, 113, 0.18)",
          pulseClass: "",
          statusText: "Task error",
          accentColor: "text-[#F87171]",
          spinSpeed1: "animate-[spin_20s_linear_infinite]",
          spinSpeed2: "animate-[spin_20s_linear_infinite_reverse]",
        };
      default: // idle
        return {
          coreGradient: "from-[#56D9F5] via-[#39D6C0] to-[#0D192A]",
          ringColor: "border-[#56D9F5]/35",
          nodeColor: "bg-[#56D9F5]",
          glowColor: "rgba(86, 217, 245, 0.38)",
          haloColor: "rgba(86, 217, 245, 0.16)",
          pulseClass: "",
          statusText: "AI Agent Standby",
          accentColor: "text-[#8E9EB5]",
          spinSpeed1: "animate-[spin_20s_linear_infinite]",
          spinSpeed2: "animate-[spin_26s_linear_infinite_reverse]",
        };
    }
  };

  const style = getVisualStyles();
  const dimension =
    size === "compact"
      ? "h-16 w-16"
      : size === "large"
      ? "h-32 w-32"
      : "h-24 w-24";
  const coreSize =
    size === "compact"
      ? "h-7 w-7"
      : size === "large"
      ? "h-14 w-14"
      : "h-10 w-10";

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Outer Atmospheric Aura */}
      <div
        className="pointer-events-none absolute -inset-8 rounded-full blur-3xl transition-all duration-1000"
        style={{ backgroundColor: style.haloColor }}
      />

      <div
        className={`relative flex items-center justify-center ${dimension} ${
          state === "welcoming" ? "scale-110 transition-transform duration-700 ease-out" : "transition-transform duration-500"
        }`}
        style={{ filter: `drop-shadow(0 0 28px ${style.glowColor})` }}
      >
        {/* Orbital Ring 1: Equatorial Tilt with satellite node */}
        <div
          className={`absolute inset-0 rounded-full border ${style.ringColor} transition-all duration-700 ${style.spinSpeed1}`}
          style={{ transform: "rotateX(64deg) rotateZ(-15deg)" }}
        >
          <span
            className={`absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ${style.nodeColor} shadow-[0_0_8px_currentColor]`}
          />
        </div>

        {/* Orbital Ring 2: Polar Tilt with dash pattern */}
        <div
          className={`absolute inset-2 rounded-full border border-dashed ${style.ringColor} opacity-80 transition-all duration-700 ${style.spinSpeed2}`}
          style={{ transform: "rotateY(58deg) rotateZ(32deg)" }}
        >
          <span
            className={`absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${style.nodeColor} opacity-90 shadow-[0_0_6px_currentColor]`}
          />
        </div>

        {/* Orbital Ring 3: Counter Harmonic Tilt */}
        <div
          className={`absolute inset-4 rounded-full border border-dotted ${style.ringColor} opacity-50 transition-all duration-700`}
          style={{ transform: "rotateX(42deg) rotateY(-40deg)" }}
        />

        {/* Central Luminous Liquid Core */}
        <div
          className={`${coreSize} relative rounded-full bg-gradient-to-tr ${style.coreGradient} shadow-inner transition-all duration-500 ${style.pulseClass}`}
          style={{
            boxShadow: `0 0 28px ${style.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.7)`,
            animation: "floatOrb 5s ease-in-out infinite",
          }}
        >
          {/* Internal Specular Shimmer */}
          <div className="absolute top-1 left-1.5 h-3 w-3 rounded-full bg-white/60 blur-[0.6px]" />
          <div className="h-full w-full rounded-full bg-white/10 backdrop-blur-[1px]" />
        </div>
      </div>

      {/* State Caption with subtle beacon */}
      <div className="mt-3.5 flex items-center gap-2 rounded-full border border-[#8E9EB5]/15 bg-[#0D192A]/85 px-3.5 py-1 text-[11px] font-medium tracking-wide backdrop-blur-md">
        <span
          className="inline-block h-2 w-2 rounded-full transition-colors duration-500"
          style={{
            backgroundColor: style.glowColor,
            boxShadow: `0 0 8px ${style.glowColor}`,
          }}
        />
        <span className={style.accentColor}>{style.statusText}</span>
      </div>
    </div>
  );
}
