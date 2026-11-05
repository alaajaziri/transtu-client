import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { reservationService } from '../services/reservationService';
import { isMissing } from '../services/http';
import { isCancelled, isUpcoming } from '../utils/format';
import ReservationCard from '../components/ReservationCard';
import { BackendMissing, Empty, ErrorBox, Skeletons } from '../components/ui';
import { ENDPOINTS } from '../config/endpoints';

const TABS = [
  ['all', 'Toutes', () => true],
  ['up', 'À venir', isUpcoming],
  ['past', 'Passées', (r) => !isCancelled(r.status) && r.trip.departureAt && r.trip.departureAt <= new Date()],
  ['canc', 'Annulées', (r) => isCancelled(r.status)],
];

export default function Reservations() {
  const { data, loading, error, reload } = useAsync(() => reservationService.mine(), []);
  const [tab, setTab] = useState('all');
  const list = useMemo(() => {
    const fn = TABS.find((t) => t[0] === tab)[2];
    return (data || []).filter(fn).sort((a, b) => (b.trip.departureAt?.getTime() ?? 0) - (a.trip.departureAt?.getTime() ?? 0));
  }, [data, tab]);

  return (
    <div className="container pad narrow-lg">
      <header className="page-head">
        <div><p className="eyebrow">Historique</p><h1>Mes réservations</h1></div>
        <Link to="/trips" className="btn btn-primary">Nouvelle réservation</Link>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map(([k, l, fn]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}{data ? <i>{data.filter(fn).length}</i> : null}
          </button>
        ))}
      </div>

      {loading && <Skeletons n={4} />}
      {error && (isMissing(error) ? <BackendMissing endpoint={`${ENDPOINTS.reservations.mine.method} ${ENDPOINTS.reservations.mine.path}`} /> : <ErrorBox error={error} onRetry={reload} />)}
      {data && (list.length === 0
        ? <Empty title="Aucune réservation ici" action={<Link to="/trips" className="btn btn-primary">Trouver un trajet</Link>}>Vos billets apparaîtront dans cette liste.</Empty>
        : <div className="stack">{list.map((r) => <ReservationCard key={r.id} r={r} />)}</div>)}
    </div>
  );
}
