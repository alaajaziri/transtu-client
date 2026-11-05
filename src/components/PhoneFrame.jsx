import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const DEVICES = [
  { id: 'pro', name: 'iPhone 15 Pro', w: 393, h: 852, r: 52, island: true },
  { id: 'max', name: 'iPhone 15 Pro Max', w: 430, h: 932, r: 56, island: true },
  { id: 'se', name: 'iPhone SE', w: 375, h: 667, r: 32, island: false },
];
const BEZEL = 12;

const clock = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/**
 * Aperçu iPhone : l'application RÉELLE est chargée dans une iframe
 * (même origine, même JWT). Les media queries réagissent à la vraie largeur
 * de l'iframe, donc aucune version "factice" n'existe.
 */
export default function PhoneFrame({ onClose }) {
  const navigate = useNavigate();
  const { sync } = useAuth();
  const ref = useRef(null);
  const [deviceId, setDeviceId] = useState('pro');
  const [time, setTime] = useState(clock());
  const [scale, setScale] = useState(1);
  const [src] = useState(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('embed', '1');
    return u.pathname + u.search + u.hash;
  });
  const dev = DEVICES.find((d) => d.id === deviceId);
  const totalH = dev.h + BEZEL * 2;

  useEffect(() => {
    const t = setInterval(() => setTime(clock()), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 110) / totalH));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [totalH]);

  const close = () => {
    try {
      const l = ref.current.contentWindow.location;
      const q = new URLSearchParams(l.search);
      q.delete('embed');
      const s = q.toString();
      navigate(l.pathname + (s ? `?${s}` : '') + l.hash);
    } catch { /* iframe non accessible */ }
    sync();
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onLoad = () => {
    try {
      const root = ref.current.contentDocument.documentElement;
      root.style.setProperty('--safe-top', dev.island ? '54px' : '20px');
      root.style.setProperty('--safe-bottom', dev.island ? '26px' : '0px');
    } catch { /* ignore */ }
  };

  return (
    <div className="pf-overlay" role="dialog" aria-label="Aperçu iPhone">
      <div className="pf-bar">
        <div className="pf-title"><Icon name="phone" size={18} /> Aperçu mobile <em>· application réelle</em></div>
        <div className="pf-controls">
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} aria-label="Modèle d'iPhone">
            {DEVICES.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.w}×{d.h})</option>)}
          </select>
          <button className="btn btn-sm btn-light" onClick={() => { ref.current.src = src; }}>
            <Icon name="refresh" size={15} /> Recharger
          </button>
          <button className="btn btn-sm btn-primary" onClick={close}>
            <Icon name="x" size={15} /> Quitter l'aperçu
          </button>
        </div>
      </div>

      <div className="pf-stage">
        <div className="pf-scaler" style={{ width: (dev.w + BEZEL * 2) * scale, height: totalH * scale }}>
          <div className="pf-device" style={{ width: dev.w + BEZEL * 2, height: totalH, borderRadius: dev.r + BEZEL, transform: `scale(${scale})` }}>
            <div className="pf-screen" style={{ borderRadius: dev.r }}>
              <iframe key={deviceId} ref={ref} src={src} title="Application TRANSTU (mobile)" onLoad={onLoad} />
              <div className="pf-status" style={{ height: dev.island ? 54 : 20 }}>
                <span className="pf-time">{time}</span>
                <span className="pf-icons" aria-hidden="true">
                  <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
                  <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45" /><rect x="2" y="2" width="17" height="8" rx="2" /><rect x="24" y="4" width="2" height="4" rx="1" opacity=".45" /></svg>
                </span>
              </div>
              {dev.island && <div className="pf-island" />}
              <div className="pf-home" />
            </div>
          </div>
        </div>
      </div>
      <p className="pf-hint">Naviguez normalement dans le téléphone · Échap pour revenir à la vue ordinateur</p>
    </div>
  );
}
