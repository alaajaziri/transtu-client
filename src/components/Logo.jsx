import { useState } from 'react';

/**
 * Affiche /public/logo.png (le vrai logo TRANSTU) s'il existe.
 * Sinon : une marque provisoire dessinée en SVG aux couleurs du logo.
 * Le logo officiel est horizontal (≈ 3 : 1) : on fixe la hauteur, la largeur suit.
 */
export default function Logo({ size = 44, light = false }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`logo${light ? ' logo-light' : ''}`}>
      {!broken ? (
        <img className="logo-img" src="/logo.png" alt="TRANSTU" height={size} onError={() => setBroken(true)} />
      ) : (
        <>
          <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="16" fill="#009751" />
            <path d="M10 40h14l8-16h22" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="40" r="6" fill="#fff" />
            <circle cx="52" cy="24" r="6" fill="#f8af26" stroke="#fff" strokeWidth="3" />
          </svg>
          <span className="logo-word">TRANS<b>TU</b></span>
        </>
      )}
    </span>
  );
}
