"use client";

import React from "react";

interface SmokyAtmosphereProps {
  className?: string;
  state?: "idle" | "running" | "awaiting_approval" | "result_ready" | "error" | "welcoming";
}

export function SmokyAtmosphere({
  className = "",
  state = "idle",
}: SmokyAtmosphereProps) {
  const getGlowColors = () => {
    switch (state) {
      case "welcoming":
        return {
          core: "rgba(86, 217, 245, 0.32)",
          fringe: "rgba(120, 245, 207, 0.24)",
          accent: "rgba(57, 214, 192, 0.18)",
        };
      case "running":
        return {
          core: "rgba(86, 217, 245, 0.22)",
          fringe: "rgba(57, 214, 192, 0.16)",
          accent: "rgba(120, 245, 207, 0.12)",
        };
      case "awaiting_approval":
        return {
          core: "rgba(244, 187, 99, 0.22)",
          fringe: "rgba(86, 217, 245, 0.14)",
          accent: "rgba(244, 187, 99, 0.10)",
        };
      case "result_ready":
        return {
          core: "rgba(120, 245, 207, 0.22)",
          fringe: "rgba(86, 217, 245, 0.16)",
          accent: "rgba(57, 214, 192, 0.14)",
        };
      case "error":
        return {
          core: "rgba(248, 113, 113, 0.22)",
          fringe: "rgba(86, 217, 245, 0.12)",
          accent: "rgba(244, 187, 99, 0.08)",
        };
      default:
        return {
          core: "rgba(86, 217, 245, 0.18)",
          fringe: "rgba(57, 214, 192, 0.14)",
          accent: "rgba(18, 34, 56, 0.65)",
        };
    }
  };

  const colors = getGlowColors();

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base Deep Atmospheric Background */}
      <div className="absolute inset-0 bg-[#08111F]" />

      {/* Layer 1: Central Luminous Smoky Drift behind the agent core */}
      <div
        className="absolute top-1/4 left-1/2 h-[580px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[115px] transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.core} 0%, ${colors.fringe} 45%, transparent 72%)`,
          animation: "driftPulse 18s ease-in-out infinite alternate",
        }}
      />

      {/* Layer 2: Left Flank Teal Oceanic Drift */}
      <div
        className="absolute top-1/3 left-1/5 h-[480px] w-[620px] rounded-full blur-[100px] opacity-80 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${colors.fringe} 0%, rgba(13,25,42,0.4) 60%, transparent 80%)`,
          animation: "driftLeft 24s ease-in-out infinite alternate",
        }}
      />

      {/* Layer 3: Right Flank Cyan Mist Swell */}
      <div
        className="absolute top-1/4 right-1/6 h-[440px] w-[560px] rounded-full blur-[90px] opacity-70 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, rgba(86,217,245,0.14) 0%, rgba(120,245,207,0.08) 50%, transparent 75%)`,
          animation: "driftRightSlow 26s ease-in-out infinite alternate",
        }}
      />

      {/* Layer 4: Lower Horizon Deep Mist */}
      <div
        className="absolute bottom-0 inset-x-0 h-[380px] blur-[85px] opacity-75 transition-all duration-1000"
        style={{
          background: `linear-gradient(to top, rgba(8,17,31,0.98), ${colors.accent} 45%, transparent 100%)`,
        }}
      />

      {/* Layer 5: Edge Vignette ensuring central typography and cards are sharp */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(8,17,31,0.65) 100%)",
        }}
      />
    </div>
  );
}
