/** Motif "plan de lignes" animé : identité visuelle du site. */
export default function RouteArt({ className = '' }) {
  const blue = 'M-20 430 C 190 430, 250 230, 470 230 S 790 390, 990 310 S 1170 150, 1240 150';
  const red = 'M-20 540 H 300 C 420 540 420 450 540 450 H 1240';
  return (
    <svg className={`route-art ${className}`} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path className="ra-line" d={blue} stroke="#0f66ad" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path className="ra-line ra-2" d={red} stroke="#f8af26" strokeWidth="14" fill="none" strokeLinecap="round" />
      {[[470, 230], [990, 310], [300, 540], [540, 450], [1130, 190]].map(([x, y], i) => (
        <circle key={i} className="ra-dot" style={{ animationDelay: `${0.8 + i * 0.2}s` }} cx={x} cy={y} r="17" fill="#fffdf8" stroke="#0b2238" strokeWidth="6" />
      ))}
      <g>
        <rect x="-26" y="-14" width="52" height="28" rx="8" fill="#009751" stroke="#0b2238" strokeWidth="4" />
        <rect x="-16" y="-7" width="10" height="9" rx="2" fill="#fffdf8" />
        <rect x="-2" y="-7" width="10" height="9" rx="2" fill="#fffdf8" />
        <rect x="12" y="-7" width="8" height="9" rx="2" fill="#fffdf8" />
        <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path={blue} />
      </g>
    </svg>
  );
}
