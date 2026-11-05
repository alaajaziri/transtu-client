import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { driverService } from '../services/driverService';
import { fmtDay, fmtTime } from '../utils/format';
import QrScanner from '../components/QrScanner';
import Icon from '../components/Icons';
import { Alert, ErrorBox, Spinner, StatusBadge } from '../components/ui';

const OPEN = ['scheduled', 'boarding'];
const TITLES = {
  BOARDED: 'Embarquement validé',
  ALREADY_BOARDED: 'Billet déjà utilisé',
  INVALID_QR: 'QR invalide',
  NOT_FOUND: 'Billet inconnu',
  WRONG_TRIP: 'Mauvais trajet',
  CANCELLED: 'Réservation annulée',
  TRIP_CLOSED: 'Embarquement fermé',
  ERROR: 'Erreur',
};

const feedback = (ok) => { try { navigator.vibrate?.(ok ? 90 : [140, 70, 140]); } catch { /* non supporté */ } };

export default function DriverTrip() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => driverService.trip(id), [id]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const lock = useRef(false);
  const seen = useRef({ text: '', at: 0 });

  const submit = async (input) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const res = await driverService.scan(id, input);
      setResult({ ...res, at: Date.now() });
      feedback(res.ok);
      reload();
    } catch (e) {
      setResult({ ok: false, code: 'ERROR', message: e.message, at: Date.now() });
      feedback(false);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Le même QR reste devant la caméra pendant plusieurs lectures : on ne le renvoie au serveur
  // qu'après qu'il soit sorti du cadre (> 2,5 s sans le voir). Sinon un billet validé passerait
  // aussitôt en « déjà utilisé ».
  const onCode = (text) => {
    const now = Date.now();
    const same = text === seen.current.text && now - seen.current.at < 2500;
    seen.current = { text, at: now };
    if (!same) submit({ qr: text });
  };

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    try { await fn(); reload(); } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  if (loading && !data) return <div className="container pad"><Spinner /></div>;
  if (error) return <div className="container pad"><Link to="/driver" className="back">← Mes trajets</Link><ErrorBox error={error} onRetry={reload} /></div>;

  const { trip, stats, passengers } = data;
  const open = OPEN.includes(trip.status);
  const waiting = stats.booked - stats.boarded;
  const shown = passengers.filter((p) => filter === 'all' || (filter === 'boarded' ? p.status === 'boarded' : p.status !== 'boarded'));
  const r = result?.reservation;

  return (
    <div className="container pad narrow-lg">
      <Link to="/driver" className="back">← Mes trajets</Link>
      <header className="page-head">
        <div>
          <p className="eyebrow">Embarquement</p>
          <h1>{trip.from} → {trip.to}</h1>
          <p className="muted">{fmtDay(trip.departureAt)} · {fmtTime(trip.departureAt)}{trip.line ? ` · ${trip.line}` : ''}</p>
        </div>
        <StatusBadge status={trip.status} />
      </header>

      {msg && <Alert>{msg}</Alert>}

      <div className="drv-counts">
        <div className="stat accent"><b>{stats.boarded}</b><span>Embarqués</span></div>
        <div className="stat"><b>{waiting}</b><span>En attente</span></div>
        <div className="stat"><b>{stats.booked}</b><span>Réservés</span></div>
      </div>

      <div className="ticket-actions drv-bar">
        {trip.status === 'scheduled' && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => driverService.setStatus(id, 'boarding'))}>Ouvrir l'embarquement</button>
        )}
        {OPEN.includes(trip.status) && (
          <button
            type="button"
            className={`btn ${trip.status === 'boarding' ? 'btn-primary' : ''}`}
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Confirmer le départ ?${waiting > 0 ? ` ${waiting} passager(s) n'ont pas embarqué.` : ''} L'embarquement sera fermé.`)) return;
              run(() => driverService.setStatus(id, 'departed'));
            }}
          >Départ du bus</button>
        )}
        {trip.status === 'departed' && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => driverService.setStatus(id, 'completed'))}>Terminer le trajet</button>
        )}
        {trip.status === 'completed' && <p className="muted">Trajet terminé.</p>}
      </div>

      {open ? (
        <section className="panel">
          <h2 className="h-sm">Scanner un billet</h2>
          <QrScanner onCode={onCode} paused={busy} />

          {result && (
            <div key={result.at} className={`scan-result ${result.ok ? 'ok' : 'ko'}`} role="status" aria-live="polite">
              <span className="scan-ic"><Icon name={result.ok ? 'check' : 'x'} size={28} /></span>
              <div>
                <strong>{TITLES[result.code] || 'Résultat'}</strong>
                {result.code !== 'BOARDED' && <p>{result.message}</p>}
                {r && <p className="scan-who">Siège <b>{r.seatNumber}</b> · {r.passengerName} · <span className="mono">{r.reservationNumber}</span></p>}
              </div>
            </div>
          )}

          <form
            className="manual"
            onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { submit({ number: manual.trim() }); setManual(''); } }}
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="N° de réservation : TR-8F3K2Q"
              aria-label="Numéro de réservation"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn" disabled={busy || !manual.trim()}>Valider</button>
          </form>
        </section>
      ) : (
        trip.status !== 'completed' && <Alert tone="info">L'embarquement est fermé : le scan est désactivé.</Alert>
      )}

      <section>
        <div className="row-between">
          <h2 className="h-sm">Passagers</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}><Icon name="refresh" size={16} /> Actualiser</button>
        </div>
        <div className="tabs" role="tablist">
          {[['all', 'Tous', passengers.length], ['waiting', 'En attente', waiting], ['boarded', 'Embarqués', stats.boarded]].map(([k, label, n]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}<i>{n}</i></button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="muted">Aucun passager dans cette liste.</p>
        ) : (
          <div className="pax-list">
            {shown.map((p) => {
              const boarded = p.status === 'boarded';
              return (
                <div key={p.reservationId} className={`pax${boarded ? ' is-boarded' : ''}`}>
                  <span className="pax-seat" aria-label={`Siège ${p.seatNumber}`}>{p.seatNumber}</span>
                  <div className="pax-main">
                    <strong>{p.passengerName}</strong>
                    <span className="mono">{p.reservationNumber}{boarded && p.boardedAt ? ` · embarqué à ${fmtTime(p.boardedAt)}` : ''}</span>
                  </div>
                  {open && (
                    <button
                      type="button"
                      className={`btn btn-sm ${boarded ? 'btn-danger-outline' : ''}`}
                      style={boarded ? { marginTop: 0 } : undefined}
                      disabled={busy}
                      onClick={() => run(() => (boarded ? driverService.unboard(id, p.reservationId) : driverService.board(id, p.reservationId)))}
                    >{boarded ? 'Annuler' : 'Embarquer'}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
