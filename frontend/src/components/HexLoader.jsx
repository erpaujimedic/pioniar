import React from 'react';
import '../index.css'; // ensure animations load

export default function HexLoader({ size = 48, color = 'var(--pioniar-primary)' }) {
  // A center hexagon and 6 surrounding hexagons
  // Center: 50,50
  // Radius: 14 (width ~24.2, height ~28)
  
  const hexPoints = (cx, cy, r) => {
    return [
      [cx, cy - r],
      [cx + r * 0.866, cy - r * 0.5],
      [cx + r * 0.866, cy + r * 0.5],
      [cx, cy + r],
      [cx - r * 0.866, cy + r * 0.5],
      [cx - r * 0.866, cy - r * 0.5]
    ].map(p => p.join(',')).join(' ');
  };

  const r = 14;
  const dist = r * 1.732 + 2; // Distance to next hex center (+2 for gap)

  // Centers for the 6 outer hexagons
  const centers = [
    { cx: 50, cy: 50 - dist },
    { cx: 50 + dist * 0.866, cy: 50 - dist * 0.5 },
    { cx: 50 + dist * 0.866, cy: 50 + dist * 0.5 },
    { cx: 50, cy: 50 + dist },
    { cx: 50 - dist * 0.866, cy: 50 + dist * 0.5 },
    { cx: 50 - dist * 0.866, cy: 50 - dist * 0.5 }
  ];

  return (
    <div className="inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <g className="hex-loader-group">
          <polygon 
            points={hexPoints(50, 50, r)} 
            fill={color} 
            className="hex-center-piece" 
          />
          {centers.map((c, i) => (
            <polygon 
              key={i}
              points={hexPoints(c.cx, c.cy, r)} 
              fill={color} 
              className={`hex-piece hex-piece-${i}`}
              style={{ transformOrigin: `${c.cx}px ${c.cy}px` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
