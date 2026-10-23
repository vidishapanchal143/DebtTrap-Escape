"use client";

import React, { useEffect, useRef } from "react";

interface AmbientWaveFieldProps {
  className?: string;
  intensity?: "calm" | "active" | "focal" | "welcome_ripple";
}

export function AmbientWaveField({
  className = "",
  intensity = "calm",
}: AmbientWaveFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / width - 0.5;
      const y = e.clientY / height - 0.5;
      targetMouseX = x * 80;
      targetMouseY = y * 40;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let time = 0;
    const isRipple = intensity === "welcome_ripple";
    const baseSpeed =
      intensity === "active"
        ? 0.015
        : intensity === "welcome_ripple"
        ? 0.016
        : intensity === "focal"
        ? 0.011
        : 0.007;

    const render = () => {
      if (!ctx) return;

      // Smooth mouse damping for elegant desktop parallax
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Camera perspective parameters
      const fov = 450;
      const centerX = width * 0.5 + mouseX;
      const horizonY = height * 0.58 + mouseY;

      const isMobile = width < 640;
      const numRows = isMobile ? 24 : 38;
      const numCols = isMobile ? 32 : 52;
      const xSpacing = (width * 1.55) / numCols;
      const zSpacing = isMobile ? 36 : 28;

      ctx.lineWidth = 1.3;

      // 1. LAYER ONE: Flowing 3D Perspective Grid Landscape
      for (let r = 0; r < numRows; r++) {
        const z = (numRows - r) * zSpacing;
        const scale = fov / (fov + z);
        const nextZ = (numRows - r + 1) * zSpacing;
        const nextScale = fov / (fov + nextZ);

        // Alpha fades smoothly with distance, keeping foreground crisp
        const depthAlpha = Math.pow(r / numRows, 1.15);
        const alpha = Math.min(0.9, depthAlpha * 0.85 + 0.12);

        // Fluid gradient palette based on row depth
        const strokeColor =
          r % 6 === 0
            ? `rgba(120, 245, 207, ${alpha * 0.95})` // Restrained Mint highlight
            : r % 3 === 0
            ? `rgba(86, 217, 245, ${alpha * 0.85})` // Cyan Accent
            : `rgba(57, 214, 192, ${alpha * 0.65})`; // Oceanic Teal

        ctx.strokeStyle = strokeColor;
        ctx.beginPath();

        let started = false;

        for (let c = 0; c <= numCols; c++) {
          const worldX = (c - numCols / 2) * xSpacing;

          // Multi-harmonic procedural wave formula for organic fluid motion
          const wave1 = Math.sin(worldX * 0.0032 + time + r * 0.12) * 38;
          const wave2 = Math.cos(z * 0.0048 - time * 0.8 + c * 0.075) * 28;
          const wave3 = Math.sin((worldX + z) * 0.0025 + time * 1.15) * 16;
          const dist = Math.hypot(worldX, z - numRows * zSpacing * 0.45);
          const ripple = isRipple ? Math.sin(dist * 0.0075 - time * 3.5) * 22 : 0;
          const worldY = wave1 + wave2 + wave3 + ripple;

          const projX = centerX + worldX * scale;
          const projY = horizonY + worldY * scale;

          if (!started) {
            ctx.moveTo(projX, projY);
            started = true;
          } else {
            ctx.lineTo(projX, projY);
          }

          // Cross filaments connecting rows for genuine 3D data mesh
          if (r < numRows - 1 && c % (isMobile ? 8 : 4) === 0) {
            const nextWorldX = worldX;
            const nextWave =
              Math.sin(nextWorldX * 0.0032 + time + (r + 1) * 0.12) * 38 +
              Math.cos((z + zSpacing) * 0.0048 - time * 0.8 + c * 0.075) * 28 +
              Math.sin((nextWorldX + z + zSpacing) * 0.0025 + time * 1.15) * 16;
            const nextProjX = centerX + nextWorldX * nextScale;
            const nextProjY = horizonY + nextWave * nextScale;

            ctx.save();
            ctx.strokeStyle = `rgba(86, 217, 245, ${alpha * 0.28})`;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(nextProjX, nextProjY);
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.stroke();
      }

      // 2. LAYER TWO: Foreground Fluid Undulating Wave Ribbons (Prominent & Cinematic)
      const ribbons = [
        {
          color: "rgba(86, 217, 245, 0.45)",
          lineWidth: 2.2,
          speed: 1.0,
          amp: 45,
          freq: 0.0028,
          phase: 0,
          yOffset: height * 0.62 + mouseY * 0.6,
        },
        {
          color: "rgba(57, 214, 192, 0.40)",
          lineWidth: 1.8,
          speed: 0.75,
          amp: 55,
          freq: 0.0022,
          phase: 1.8,
          yOffset: height * 0.66 + mouseY * 0.7,
        },
        {
          color: "rgba(120, 245, 207, 0.35)",
          lineWidth: 1.5,
          speed: 1.25,
          amp: 35,
          freq: 0.0035,
          phase: 3.2,
          yOffset: height * 0.71 + mouseY * 0.8,
        },
      ];

      ribbons.forEach((ribbon) => {
        ctx.save();
        ctx.strokeStyle = ribbon.color;
        ctx.lineWidth = ribbon.lineWidth;
        ctx.beginPath();

        for (let x = 0; x <= width + 20; x += 15) {
          const y =
            ribbon.yOffset +
            Math.sin(x * ribbon.freq + time * ribbon.speed + ribbon.phase) *
              ribbon.amp +
            Math.cos(x * 0.0012 - time * 0.5) * (ribbon.amp * 0.45);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      });

      if (!prefersReducedMotion) {
        time += baseSpeed;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full opacity-90 transition-opacity duration-700"
      />
    </div>
  );
}
