// The agenta mark. Strokes and fills use currentColor, so it takes the colour
// of whatever it sits in and works on both the light and dark themes.
//
// Pass animated when the AI is busy: the three dots pulse in sequence. The
// animation is skipped for anyone who has asked for reduced motion.
export default function AgentaMark({ size = 28, animated = false }) {
  const dotClass = animated ? 'agenta-dot' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={animated ? 'agenta, thinking' : 'agenta'}
    >
      {animated && (
        <style>{`
          .agenta-dot { animation: agenta-think 1.4s ease-in-out infinite; }
          .agenta-dot-2 { animation-delay: 0.18s; }
          .agenta-dot-3 { animation-delay: 0.36s; }

          @keyframes agenta-think {
            0%, 100% { opacity: 0.18; }
            50% { opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .agenta-dot { animation: none; opacity: 0.6; }
          }
        `}</style>
      )}

      <path d="M6 9H42V36H21L12 44V36H6Z" stroke="currentColor" strokeWidth="3.2" />
      <path d="M6 18H42" stroke="currentColor" strokeWidth="3.2" />
      <rect x="14" y="3" width="3.2" height="7" fill="currentColor" />
      <rect x="30.8" y="3" width="3.2" height="7" fill="currentColor" />

      <rect className={dotClass} x="12" y="24" width="6" height="6" fill="currentColor" />
      <rect
        className={animated ? `${dotClass} agenta-dot-2` : ''}
        x="21"
        y="24"
        width="6"
        height="6"
        fill="currentColor"
        opacity={animated ? 1 : 0.32}
      />
      <rect
        className={animated ? `${dotClass} agenta-dot-3` : ''}
        x="30"
        y="24"
        width="6"
        height="6"
        fill="currentColor"
        opacity={animated ? 1 : 0.32}
      />
    </svg>
  );
}
