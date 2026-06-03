interface LongLightMarkProps {
  className?: string;
}

export function LongLightMark({ className = "" }: LongLightMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Long Light"
      role="img"
    >
      {/* Honey radial glow */}
      <defs>
        <radialGradient id="long-light-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4A574" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#long-light-glow)" />

      {/* Anchor-as-lantern: simplified anchor + horizontal light line */}
      <g stroke="#A8794C" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Anchor crossbar (horizontal light beam) */}
        <line x1="30" y1="40" x2="70" y2="40" />
        {/* Anchor shank (vertical) */}
        <line x1="50" y1="40" x2="50" y2="70" />
        {/* Anchor arms (curved up like cupped hands holding light) */}
        <path d="M 32 65 Q 40 75 50 70 Q 60 75 68 65" />
        {/* Ring at top */}
        <circle cx="50" cy="34" r="4" />
      </g>
    </svg>
  );
}
