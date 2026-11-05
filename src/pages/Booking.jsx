import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { tripService } from '../services/tripService';
import { reservationService } from '../services/reservationService';
import { fmtLong, fmtPrice, fmtTime } from '../utils/format';
import SeatPicker from '../components/SeatPicker';
import Icon from '../components/Icons';
import { Alert, ErrorBox, Spinner } from '../components/ui';

export default function Booking() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: st, loading, error, reload } = useAsync(() => tripService.seatState(id), [id]);
  const [seat, setSeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState(false);

  // Si le siège choisi vient d'être pris (rechargement), on le désélectionne.
  useEffect(() => { if (st && seat && st.occupied.includes(seat)) setSeat(''); }, [st, seat]);

  if (loading && !st) return <div className="container pad"><Spinner label="Chargement du trajet…" /></div>;
  if (error) return <div className="container pad"><ErrorBox error={error} onRetry={reload} /></div>;

  const t = st.trip;
  const past = t.departureAt && t.departureAt < new Date();

  const confirm = async () => {
    setBusy(true); setErr('');
    try {
      const r = await reservationService.create({ tripId: t.id, seat });
      if (r.id == null) { setCreated(true); setErr("La réservation a peut-être été créée, mais le serveur n'a pas renvoyé son identifiant."); return; }
      nav(`/confirmation/${r.id}`, { state: { reservation: r } });
    } catch (ex) {
      setErr(ex.message);
      setSeat('');
      reload(); // le backend a tranché : on recharge l'état réel des sièges
    } finally { setBusy(false); }
  };

  return (
    <div className="container pad">
      <header className="page-head">
        <div><p className="eyebrow">Réservation</p><h1>Choisissez votre siège</h1></div>
        <Link to="/trips" className="btn btn-ghost">Changer de trajet</Link>
      </header>

      {past && <Alert tone="warn">Ce trajet est déjà parti.</Alert>}
      {err && <Alert action={created ? <Link to="/reservations" className="btn btn-sm">Mes réservations</Link> : null}>{err}</Alert>}

      <div className="booking">
        <section className="panel">
          <SeatPicker state={st} selected={seat} onSelect={setSeat} />
        </section>

        <aside className="panel summary">
          <h2 className="h-sm">Récapitulatif</h2>
          <div className="sum-route">
            <div><strong>{t.from || 'Départ'}</strong><span>{fmtTime(t.departureAt)}</span></div>
            <Icon name="arrow" />
            <div className="end"><strong>{t.to || 'Destination'}</strong><span>{fmtTime(t.arrivalAt)}</span></div>
          </div>
          <dl className="sum-list">
            <div><dt>Date</dt><dd>{fmtLong(t.departureAt)}</dd></div>
            {t.line && <div><dt>Ligne</dt><dd>{t.line}</dd></div>}
            <div><dt>Passager</dt><dd>{user?.name || 'Vous'}</dd></div>
            <div><dt>Siège</dt><dd>{seat ? <b className="chip-seat">{seat}</b> : <span className="muted">à choisir</span>}</dd></div>
            <div className="total"><dt>Prix</dt><dd>{fmtPrice(t.price)}</dd></div>
          </dl>
          <button className="btn btn-primary btn-lg block" disabled={!seat || busy || past} onClick={confirm}>
            {busy ? 'Confirmation…' : 'Confirmer la réservation'}
          </button>
          <p className="muted small">La disponibilité du siège est vérifiée par le serveur au moment de la confirmation.</p>
        </aside>
      </div>
    </div>
  );
}
