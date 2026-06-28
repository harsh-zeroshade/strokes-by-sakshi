/**
 * Logo — "Strokes" + 3×3 dot grid + "by Sakshi" + India badge
 * Matches the hero section Delassus-style logo exactly.
 *
 * Props:
 *   color    — 'terracotta' | 'ivory' | 'charcoal'   (default: 'terracotta')
 *   size     — 'sm' | 'md' | 'lg'                    (default: 'md')
 *   variant  — 'full' | 'compact'                    (default: 'full')
 *              full    = Strokes + dots + "by Sakshi" + badge
 *              compact = Strokes + dots + "by Sakshi" (no badge)
 */
export default function Logo({
  color   = 'terracotta',
  size    = 'md',
  variant = 'full',
  className = '',
}) {
  const c = color === 'ivory'
    ? { text:'#FAF7F2', dot:'rgba(250,247,242,0.85)', badge:'rgba(250,247,242,0.5)', badgeText:'rgba(250,247,242,0.8)' }
    : color === 'charcoal'
    ? { text:'#2C2C2C', dot:'rgba(44,44,44,0.7)',     badge:'rgba(44,44,44,0.4)',    badgeText:'rgba(44,44,44,0.7)' }
    : { text:'#C7694F', dot:'rgba(199,105,79,0.8)',    badge:'rgba(199,105,79,0.45)', badgeText:'rgba(199,105,79,0.85)' };

  const scale = size === 'sm' ? 0.78 : size === 'lg' ? 1.22 : 1.0;

  const strokFontSize   = Math.round(22 * scale);
  const subFontSize     = Math.round(14 * scale);
  const dotSize         = Math.round(4  * scale);
  const dotGap          = Math.round(3  * scale);
  const badgePadH       = Math.round(8  * scale);
  const badgePadV       = Math.round(3  * scale);
  const badgeFontSize   = Math.round(9  * scale);
  const hexSize         = Math.round(11 * scale);

  return (
    <span
      className={`inline-flex flex-col items-start select-none ${className}`}
      style={{ gap: Math.round(2 * scale) }}
      aria-label="Strokes by Sakshi"
    >
      {/* "Strokes" */}
      <span style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize:   strokFontSize,
        fontWeight: 400,
        color:      c.text,
        letterSpacing: '-0.3px',
        lineHeight: 1,
        display:    'block',
      }}>
        Strokes
      </span>

      {/* dot grid + "by Sakshi" */}
      <span style={{ display:'flex', alignItems:'center', gap: Math.round(5 * scale), marginTop: Math.round(1 * scale) }}>
        {/* 3×3 dot grid */}
        <span style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${dotSize}px)`,
          gap: `${dotGap}px`,
          flexShrink: 0,
        }}>
          {[...Array(9)].map((_, i) => (
            <span key={i} style={{ width: dotSize, height: dotSize, background: c.dot, borderRadius: '50%', display: 'block' }}/>
          ))}
        </span>

        {/* "by Sakshi" */}
        <span style={{
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize:   subFontSize,
          fontWeight: 300,
          color:      c.text,
          letterSpacing: '0.5px',
          lineHeight: 1,
        }}>
          by Sakshi
        </span>
      </span>

      {/* India badge */}
      {variant === 'full' && (
        <span style={{
          marginTop:   Math.round(6 * scale),
          border:      `1px solid ${c.badge}`,
          borderRadius: 2,
          padding:     `${badgePadV}px ${badgePadH}px`,
          display:     'inline-flex',
          alignItems:  'center',
          gap:         Math.round(4 * scale),
        }}>
          {/* Hexagon icon */}
          <svg width={hexSize} height={hexSize} viewBox="0 0 20 20" fill={c.badgeText} opacity="0.85" aria-hidden="true">
            <polygon points="10,2 18,6.5 18,13.5 10,18 2,13.5 2,6.5"/>
          </svg>
          <span style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      badgeFontSize,
            fontStyle:     'italic',
            letterSpacing: '1.5px',
            color:         c.badgeText,
          }}>
            India
          </span>
        </span>
      )}
    </span>
  );
}
