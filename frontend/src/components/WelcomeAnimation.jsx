import React, { useEffect, useState, useRef } from 'react';

export default function WelcomeAnimation({ onFinish }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'exiting'
  const hasFinishedRef = useRef(false);

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (onFinish) onFinish();
  };

  useEffect(() => {
    // Respect reduced-motion preferences
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      finish();
      return;
    }

    // Allow previewing animation when ?preview=welcome is present in URL
    const isPreview =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('preview') === 'welcome';
    if (isPreview) return;

    // Cinematic Timeline (Total ~2.4s):
    // 0ms - 1950ms: Mark scale-up, light sweep, staggered headline, tagline reveal
    // 1950ms: Iris/radial mask exit transition begins (450ms)
    // 2400ms: Unmount cleanly and reveal homepage
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
    }, 1950);

    const endTimer = setTimeout(() => {
      finish();
    }, 2400);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const handleDismiss = () => {
    setPhase('exiting');
    setTimeout(() => {
      finish();
    }, 180);
  };

  return (
    <div
      className={`welcome-anim-overlay phase-${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Welcome to DebtTrap Shield"
      onClick={handleDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          handleDismiss();
        }
      }}
      tabIndex={0}
    >
      {/* Cinematic ambient backdrop & breathing glow */}
      <div className="welcome-anim-backdrop" aria-hidden="true" />
      <div className="welcome-anim-glow" aria-hidden="true" />
      <div className="welcome-anim-radial-ring" aria-hidden="true" />

      {/* Lightweight subtle cyan light motes */}
      <div className="welcome-anim-particles" aria-hidden="true">
        <span className="p-dot p1" />
        <span className="p-dot p2" />
        <span className="p-dot p3" />
        <span className="p-dot p4" />
        <span className="p-dot p5" />
        <span className="p-dot p6" />
      </div>

      <div className="welcome-anim-content">
        {/* Brand Mark with light sweep and breathing aura */}
        <div className="welcome-anim-mark" aria-hidden="true">
          <div className="mark-shimmer" />
          <svg viewBox="0 0 120 120" focusable="false">
            <circle cx="52" cy="52" r="38" fill="#13296B" stroke="#6D93FF" strokeWidth="10" />
            <line x1="80" y1="80" x2="107" y2="107" stroke="#FFC72C" strokeWidth="12" strokeLinecap="round" />
            <path d="M34 40H54A5 5 0 0 1 54 50H34A5 5 0 0 1 34 40Z" fill="#BFD0FF" />
            <path d="M34 55H59V65H34A5 5 0 0 1 34 55Z" fill="#BFD0FF" />
            <path d="M61 55H70A5 5 0 0 1 70 65H61Z" fill="#FFC72C" />
          </svg>
        </div>

        {/* Staggered word reveal for "Welcome to DebtTrap Shield" */}
        <h1 className="welcome-anim-title" aria-label="Welcome to DebtTrap Shield">
          <span className="word w1">Welcome</span>{' '}
          <span className="word w2">to</span>{' '}
          <span className="word w3 accent">DebtTrap</span>{' '}
          <span className="word w4 accent">Shield</span>
        </h1>

        {/* Tagline with turquoise gradient sweep and elegant underline reveal */}
        <div className="welcome-anim-tagline-wrapper">
          <p className="welcome-anim-tagline">
            Understand your loan. Protect your future.
          </p>
          <div className="tagline-underline" aria-hidden="true" />
        </div>
      </div>

      <span className="welcome-skip-hint">Click or press Esc to skip</span>
    </div>
  );
}
