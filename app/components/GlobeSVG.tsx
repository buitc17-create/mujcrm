// Pure SVG wireframe globe — zero JavaScript, no Three.js
// Dots pre-computed at module level (deterministic, runs at build time)

const CX = 280, CY = 280, R = 200;

const LAT_ANGLES = [-72, -54, -36, -18, 0, 18, 36, 54, 72];

const LON_RX = Array.from({ length: 11 }, (_, i) => {
  const angle = ((i + 1) * Math.PI) / 12;
  return Math.round(R * Math.sin(angle));
});

const DOTS: Array<{ x: number; y: number }> = Array.from({ length: 160 }, (_, i) => {
  const phi = Math.acos(2 * (i / 160) - 1);
  const theta = 2 * Math.PI * i * 0.618033988749;
  return {
    x: Math.round(CX + R * Math.sin(phi) * Math.cos(theta)),
    y: Math.round(CY - R * Math.cos(phi)),
  };
}).filter(({ x, y }) => {
  const dx = x - CX, dy = y - CY;
  return dx * dx + dy * dy <= R * R * 0.97;
}).slice(0, 65);

export default function GlobeSVG() {
  return (
    <div className="w-full h-full globe-spin" aria-hidden="true">
      <svg
        viewBox="0 0 560 560"
        width="560"
        height="560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="globe-clip">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
        </defs>

        {/* Outer circle */}
        <circle cx={CX} cy={CY} r={R} stroke="#00BFFF" strokeWidth="0.8" strokeOpacity="0.18" />

        <g clipPath="url(#globe-clip)">
          {/* Latitude lines */}
          {LAT_ANGLES.map((deg) => {
            const phi = (deg * Math.PI) / 180;
            const yCent = CY - R * Math.sin(phi);
            const rx = R * Math.cos(phi);
            const ry = rx * 0.32;
            return (
              <ellipse
                key={`lat${deg}`}
                cx={CX} cy={yCent}
                rx={rx} ry={ry}
                stroke="#00BFFF" strokeWidth="0.8" strokeOpacity="0.12"
              />
            );
          })}

          {/* Longitude lines */}
          {LON_RX.map((rx, i) => (
            <ellipse
              key={`lon${i}`}
              cx={CX} cy={CY}
              rx={rx} ry={R}
              stroke="#00BFFF" strokeWidth="0.8" strokeOpacity="0.12"
            />
          ))}
        </g>

        {/* Dots */}
        {DOTS.map((d, i) => (
          <circle
            key={i}
            cx={d.x} cy={d.y}
            r="2.2"
            fill="#00BFFF" fillOpacity="0.55"
            clipPath="url(#globe-clip)"
          />
        ))}
      </svg>
    </div>
  );
}
