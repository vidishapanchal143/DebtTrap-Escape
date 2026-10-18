import React from 'react';

// Premium brand logo using SVG with navy, blue, and yellow colors
export const BrandLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="DebtTrap Escape logo"
  >
    {/* Background circle */}
    <circle cx="24" cy="24" r="24" fill="#0A1A4A" />
    {/* Stylized shield */}
    <path d="M24 8L34 16V28C34 34 28 38 24 40C20 38 14 34 14 28V16L24 8Z" fill="#1F47E0" />
    {/* Accent star */}
    <polygon points="24,12 26,20 34,20 27,25 29,33 24,28 19,33 21,25 14,20 22,20" fill="#FFC72C" />
  </svg>
);
