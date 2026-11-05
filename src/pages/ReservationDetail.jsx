import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { reservationService } from '../services/reservationService';
import { tripService } from '../services/tripService';
import { isMissing } from '../services/http';
import { isBoarded, isCancelled } from '../utils/format';
import { ENDPOINTS } from '../config/endpoints';
import TicketCard from '../components/TicketCard';
import SeatPicker from '../components/SeatPicker';
import { Alert, BackendMissing, ErrorBox, Spinner } from '../components/ui';

export default function ReservationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: r, loading, error, reload } = useAsync(() => reservationService.get(id), [id]);
  const [mode, setMode] = useState(null); // null | 'edit' | 'cancel'
  const [seatState, setSeatState] = useState(null);
  const [seat, setSeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone, text, missing? }

  if (loading && !r) return <div className="container pad"><Spinner /></div>;
  if (error) return <div className="container pad"><ErrorBox error={error} onRetry={reload} /></div>;

  const cancelled = isCancelled(r.status);
  const upcoming = r.trip.departureAt && r.trip.departureAt > new Date();
  const boarded = isBoarded(r.status);
  const canAct = !cancelled && !boarded && upcoming;

  const fail = (e, ep) => setMsg(isMissing(e) ? { missing: `${ep.method} ${ep.path}` } : { tone: 'error', text: e.message });

  const openEdit = async () => {
    setMsg(null); setSeat('');
    try { setSeatState(await tripService.seatState(r.tripId)); setMode('edit'); }
    catch (e) { setMsg({ tone: 'error', text: e.message }); }
  };
  const saveSeat = async () => {
    setBusy(true); setMsg(null);
    try {
      await reservationService.update(r.id, { seat });
      tripService.invalidate(r.tripId);
      setMode(null); reload(); setMsg({ tone: 'success', text: `Siège modifié : ${seat}.` });
    } catch (e) { fail(e, ENDPOINTS.reservations.update(r.id)); } finally { setBusy(false); }
  };
  const doCancel = async () => {
    setBusy(true); setMsg(null);
    try {
      await reservationService.cancel(r.id);
      tripService.invalidate(r.tripId);
      setMode(null); reload(); setMsg({ tone: 'success', text: 'Réservation annulée.' });
    } catch (e) { fail(e, ENDPOINTS.reservations.cancel(r.id)); } finally { setBusy(false); }
  };

  return (
    <div className="container pad narrow">
      <Link to="/reservations" className="back">← Mes réservations</Link>
      <header className="page-head"><div><p className="eyebrow">Réservation</p><h1>Billet n° {r.number}</h1></div></header>

      {msg?.missing && <BackendMissing endpoint={msg.missing} />}
      {msg?.text && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <TicketCard reservation={r} passenger={user?.name} />

      {canAct && (
        <section className="panel manage">
          <h2 className="h-sm">Gérer ma réservation</h2>
          {mode === null && (
            <div className="ticket-actions">
              <button className="btn" onClick={openEdit}>Changer de siège</button>
              <button className="btn btn-danger" onClick={() => setMode('cancel')}>Annuler la réservation</button>
            </div>
          )}
          {mode === 'edit' && seatState && (
            <div className="stack">
              <SeatPicker state={seatState} selected={seat} onSelect={setSeat} current={r.seat} />
              <div className="ticket-actions">
                <button className="btn btn-primary" disabled={!seat || busy} onClick={saveSeat}>{busy ? 'Enregistrement…' : `Passer au siège ${seat || '…'}`}</button>
                <button className="btn btn-ghost" onClick={() => setMode(null)}>Retour</button>
              </div>
            </div>
          )}
          {mode === 'cancel' && (
            <div className="stack">
              <Alert tone="warn">Voulez-vous vraiment annuler ce billet ? Les conditions de remboursement dépendent du serveur.</Alert>
              <div className="ticket-actions">
                <button className="btn btn-danger" disabled={busy} onClick={doCancel}>{busy ? 'Annulation…' : 'Oui, annuler'}</button>
                <button className="btn btn-ghost" onClick={() => setMode(null)}>Non, garder</button>
              </div>
            </div>
          )}
        </section>
      )}
      {!canAct && <p className="muted center">{cancelled ? 'Cette réservation est annulée.' : boarded ? 'Vous êtes embarqué. Bon voyage !' : "Ce voyage n'est plus modifiable."}</p>}
    </div>
  );
}
