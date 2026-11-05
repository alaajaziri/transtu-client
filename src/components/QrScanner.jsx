import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import Icon from './Icons';
import { Alert } from './ui';

const SCAN_EVERY_MS = 120; // ~8 lectures par seconde : assez rapide, économe en batterie

/** Lit un QR dans une image/vidéo. Réduit l'image (maxW) pour garder la lecture rapide. */
function decode(source, w, h, canvas, { maxW, attempts }) {
  const scale = Math.min(1, maxW / w);
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: attempts })?.data || null;
}

/**
 * Scanner de QR : caméra en direct + repli « photo du billet ».
 * - onCode(texte) est appelé à chaque lecture (c'est à la page de filtrer les doublons).
 * - paused : suspend la lecture (pendant l'appel au serveur).
 * La caméra en direct exige HTTPS ou localhost ; la photo marche partout.
 */
export default function QrScanner({ onCode, paused = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const onCodeRef = useRef(onCode);
  const pausedRef = useRef(paused);
  onCodeRef.current = onCode;
  pausedRef.current = paused;
  const [on, setOn] = useState(false);
  const [error, setError] = useState('');

  const teardown = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };
  useEffect(() => teardown, []);
  const stop = () => { teardown(); setOn(false); };

  const start = async () => {
    setError('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("La caméra en direct exige HTTPS ou localhost. Utilisez « Photo du billet » ou saisissez le numéro.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setOn(true);
      let last = 0;
      const tick = (t) => {
        rafRef.current = requestAnimationFrame(tick);
        if (pausedRef.current || t - last < SCAN_EVERY_MS || video.readyState < 2 || !video.videoWidth) return;
        last = t;
        const text = decode(video, video.videoWidth, video.videoHeight, canvasRef.current, { maxW: 640, attempts: 'dontInvert' });
        if (text) onCodeRef.current(text);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      teardown();
      setError(e?.name === 'NotAllowedError'
        ? "Accès à la caméra refusé. Autorisez-la dans le navigateur, ou utilisez la photo / la saisie du numéro."
        : "Impossible d'ouvrir la caméra. Utilisez « Photo du billet » ou la saisie du numéro.");
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const bmp = await createImageBitmap(file);
      const text = decode(bmp, bmp.width, bmp.height, canvasRef.current, { maxW: 1400, attempts: 'attemptBoth' });
      bmp.close?.();
      if (text) onCodeRef.current(text);
      else setError('Aucun QR code lisible sur cette photo. Rapprochez-vous du billet et réessayez.');
    } catch {
      setError("Impossible de lire cette image.");
    }
  };

  return (
    <div className="scanner">
      <div className={`scanner-view${on ? ' is-on' : ''}`}>
        <video ref={videoRef} muted playsInline />
        {on && <div className="scanner-frame" aria-hidden="true"><i /><i /><i /><i /></div>}
        {!on && <div className="scanner-idle"><Icon name="scan" size={44} /><span>Caméra éteinte</span></div>}
        {on && paused && <div className="scanner-busy">Vérification…</div>}
      </div>
      <canvas ref={canvasRef} hidden />
      <div className="ticket-actions center">
        {on
          ? <button type="button" className="btn" onClick={stop}>Arrêter la caméra</button>
          : <button type="button" className="btn btn-primary" onClick={start}><Icon name="scan" size={18} /> Scanner un billet</button>}
        <label className="btn btn-light">
          Photo du billet
          <input type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        </label>
      </div>
      {error && <Alert tone="warn">{error}</Alert>}
    </div>
  );
}
