/**
 * Logo — crossed paintbrush + pencil icon with "Strokes by Sakshi" wordmark.
 * Props:
 *   variant  — 'full' (icon + text) | 'icon' (icon only) | 'text' (text only)
 *   color    — 'terracotta' (default) | 'ivory' | 'charcoal' | 'auto'
 *              'auto' = terracotta on light bg, ivory on dark bg
 *   size     — 'sm' | 'md' (default) | 'lg'
 *   className — extra classes
 */
export default function Logo({
  variant  = 'full',
  color    = 'terracotta',
  size     = 'md',
  className = '',
}) {
  const fill = color === 'ivory'    ? '#FAF7F2'
             : color === 'charcoal' ? '#2C2C2C'
             : '#C7694F'; // terracotta default

  const iconSizes = { sm: 24, md: 34, lg: 48 };
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  const iconPx = iconSizes[size] || 34;

  const Icon = () => (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      {/*
        Paintbrush — runs top-left to bottom-right
        Handle: wide rounded rect; Ferrule: thin band; Bristle: rounded tip
      */}
      {/* Paintbrush handle */}
      <rect
        x="10" y="8"
        width="14" height="56"
        rx="7"
        fill={fill}
        transform="rotate(45 50 50) translate(-22 -28)"
      />
      {/* Paintbrush bristle tip */}
      <ellipse
        cx="22" cy="80"
        rx="8" ry="12"
        fill={fill}
        transform="rotate(45 50 50) translate(-28 -28)"
      />

      {/*
        Pencil — runs top-right to bottom-left (crosses brush)
        Body: rect; Tip: triangle; Eraser: small rounded rect
      */}
      {/* Pencil body */}
      <rect
        x="58" y="6"
        width="12" height="52"
        rx="3"
        fill={fill}
        transform="rotate(-45 50 50) translate(8 -26)"
      />
      {/* Pencil tip */}
      <polygon
        points="64,58 70,58 67,72"
        fill={fill}
        transform="rotate(-45 50 50) translate(8 -26)"
      />
      {/* Eraser */}
      <rect
        x="59" y="4"
        width="12" height="8"
        rx="2"
        fill={fill}
        opacity="0.7"
        transform="rotate(-45 50 50) translate(8 -26)"
      />
    </svg>
  );

  /* ── Fully inline SVG for the crossed brush+pencil — hand-crafted paths ── */
  const CrossedIcon = () => (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      {/* ── Paintbrush (bottom-left to top-right, slight tilt) ── */}
      {/* handle */}
      <rect x="4" y="29" width="44" height="9" rx="4.5" fill={fill}
            transform="rotate(-40 4 29)" />
      {/* ferrule (metal band) */}
      <rect x="4" y="29" width="8" height="9" rx="2" fill={fill} opacity="0.75"
            transform="rotate(-40 4 29)" />
      {/* bristle */}
      <ellipse cx="8" cy="53" rx="5.5" ry="9" fill={fill}
               transform="rotate(-40 8 53)" />

      {/* ── Pencil (top-left to bottom-right, crosses brush) ── */}
      {/* body */}
      <rect x="16" y="3" width="9" height="44" rx="3" fill={fill}
            transform="rotate(40 16 3)" />
      {/* tip */}
      <polygon points="50,46 59,46 54.5,58" fill={fill}
               transform="rotate(40 50 46)" />
      {/* eraser */}
      <rect x="16" y="3" width="9" height="7" rx="2.5" fill={fill} opacity="0.7"
            transform="rotate(40 16 3)" />
    </svg>
  );

  /* ── Cleaner approach: use a single well-crafted viewBox ── */
  const LogoIcon = () => (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 80 80"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      {/*
        Paintbrush: runs from top-left (8,8) to bottom-right (54,72)
        Pencil:     runs from top-right (72,8) to bottom-left (26,72)
        They cross at roughly (40,40)
      */}

      {/* ── PAINTBRUSH ─────────────────────────────────────────
           A group rotated -45° around centre, representing:
           - long rounded handle
           - narrow ferrule
           - tapered bristle tip with a round end
      ─────────────────────────────────────────────────────── */}
      <g transform="translate(40,40) rotate(-45) translate(-40,-40)">
        {/* handle */}
        <rect x="36" y="6"  width="8" height="46" rx="4" />
        {/* ferrule */}
        <rect x="35" y="48" width="10" height="7" rx="1.5" opacity="0.8"/>
        {/* bristle */}
        <ellipse cx="40" cy="64" rx="6" ry="10" />
        {/* bristle tip highlight */}
        <ellipse cx="40" cy="70" rx="3" ry="4" opacity="0.6" />
      </g>

      {/* ── PENCIL ─────────────────────────────────────────────
           A group rotated +45° around centre, representing:
           - rectangular body
           - triangular wooden tip
           - small eraser
      ─────────────────────────────────────────────────────── */}
      <g transform="translate(40,40) rotate(45) translate(-40,-40)">
        {/* body */}
        <rect x="36" y="10" width="8" height="42" rx="2" />
        {/* wooden tip */}
        <polygon points="36,52 44,52 40,64" />
        {/* graphite tip dot */}
        <circle cx="40" cy="63" r="2" opacity="0.7" />
        {/* eraser */}
        <rect x="35" y="6" width="10" height="7" rx="2" opacity="0.75" />
        {/* eraser band */}
        <rect x="35" y="11" width="10" height="2" rx="1" opacity="0.5" />
      </g>
    </svg>
  );

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {variant !== 'text' && <LogoIcon />}
      {variant !== 'icon' && (
        <span
          className={`font-display font-medium leading-none ${textSizes[size]}`}
          style={{ color: fill }}
        >
          Strokes by Sakshi
        </span>
      )}
    </span>
  );
}
