import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Icon from './Icons';
import { StatusBadge } from './ui';
import { fmtLong, fmtPrice, fmtTime } from '../utils/format';
import { buildQrPayload, downloadTicketPng } from '../utils/ticket';

export default function TicketCard({ reservation: r, passenger }) {
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const payload = buildQrPayload(r);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(payload, { margin: 1, width: 320, color: { dark: '#0b1630', light: '#ffffff' } })
      .then((u) => alive && setQr(u))
      .catch(() => alive && setQr(''));
    return () => { alive = false; };
  }, [payload]);

  const rr = { ...r, passenger: r.passenger || passenger };
  const download = async () => {
    setBusy(true);
    try { await downloadTicketPng(rr, qr); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="ticket-wrap ticket-print">
        <div className="ticket">
          <div className="tk-main">
            <div className="tk-top"><span>TRANSTU · Billet numérique</span><StatusBadge status={r.status} /></div>
            <div className="tk-route">
              <div><small>Départ</small><strong>{r.trip.from || '—'}</strong></div>
              <Icon name="arrow" size={28} />
              <div><small>Arrivée</small><strong>{r.trip.to || '—'}</strong></div>
            </div>
            <dl className="tk-grid">
              <div><dt>Date</dt><dd>{fmtLong(r.trip.departureAt)}</dd></div>
              <div><dt>Heure</dt><dd>{fmtTime(r.trip.departureAt)}</dd></div>
              <div><dt>Siège</dt><dd className="big">{r.seat ?? '—'}</dd></div>
              {r.trip.line && <div><dt>Ligne</dt><dd>{r.trip.line}</dd></div>}
              {rr.passenger && <div><dt>Passager</dt><dd>{rr.passenger}</dd></div>}
              {r.price != null && <div><dt>Prix</dt><dd>{fmtPrice(r.price)}</dd></div>}
            </dl>
          </div>
          <div className="tk-stub">
            {qr ? <img src={qr} alt={`QR code de la réservation ${r.number}`} /> : <div className="qr-ph">QR…</div>}
            <code>{r.number}</code>
            <small>Présentez ce code à bord</small>
          </div>
        </div>
      </div>
      <div className="ticket-actions">
        <button className="btn btn-primary" onClick={download} disabled={!qr || busy}><Icon name="download" size={18} /> Télécharger (PNG)</button>
        <button className="btn" onClick={() => window.print()}><Icon name="print" size={18} /> Imprimer</button>
      </div>
    </div>
  );
}
