import React from 'react';

/**
 * LiquidMidnightBackdrop
 * 
 * An atmospheric, smoky, organic wave background designed for DebtTrap Shield.
 * Combines deep midnight navy, drifting cyan mist orbs, and layered organic SVG liquid waves.
 * Purely decorative, positioned fixed behind all content with pointer-events: none.
 */
export default function LiquidMidnightBackdrop({ step = 1, isWarning = false }) {
  return (
    <div className={`liquid-midnight-backdrop step-${step} ${isWarning ? 'is-warning' : ''}`} aria-hidden="true">
      {/* Deep smoky ambient mist orbs */}
      <div className="smoke-orb smoke-orb-1" />
      <div className="smoke-orb smoke-orb-2" />
      <div className="smoke-orb smoke-orb-3" />
      <div className="smoke-orb smoke-orb-4" />
      {step === 4 && <div className="smoke-orb smoke-orb-result" />}

      {/* Layered Organic Liquid Waves */}
      <svg
        className="liquid-waves-svg"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#70DDE8" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0A1E3C" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="waveGradSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#0F766E" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#70DDE8" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id="waveStrokeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#70DDE8" stopOpacity="0.05" />
            <stop offset="35%" stopColor="#70DDE8" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#7DF9D5" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#70DDE8" stopOpacity="0.05" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Deep ambient back-wave */}
        <path
          className="liquid-wave wave-back"
          d="M-100,520 C240,430 420,680 720,560 C1020,440 1220,600 1540,500 L1540,900 L-100,900 Z"
          fill="url(#waveGradSecondary)"
        />

        {/* Mid-layer undulating wave with luminous edge */}
        <path
          className="liquid-wave wave-mid"
          d="M-100,640 C180,540 380,740 680,620 C980,500 1260,700 1540,580 L1540,900 L-100,900 Z"
          fill="url(#waveGradPrimary)"
        />

        {/* Foreground signature luminous liquid ribbon stroke */}
        <path
          className="liquid-wave wave-ribbon"
          d="M-50,580 Q250,420 580,590 T1200,540 T1500,520"
          stroke="url(#waveStrokeGrad)"
          strokeWidth="2.5"
          fill="none"
          filter="url(#softGlow)"
        />

        {/* Secondary counter-flowing crest ribbon */}
        <path
          className="liquid-wave wave-ribbon-subtle"
          d="M-50,680 Q320,590 690,710 T1320,640 T1500,660"
          stroke="url(#waveStrokeGrad)"
          strokeWidth="1.2"
          strokeDasharray="8 12"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Atmospheric light diffusion overlay */}
      <div className="smoke-light-veil" />
    </div>
  );
}
