import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { reservationService } from '../services/reservationService';
import { isCancelled, isUpcoming } from '../utils/format';
import { isMissing } from '../services/http';
import ReservationCard from '../components/ReservationCard';
import Icon from '../components/Icons';
import CountUp from '../reactbits/CountUp';
import { BackendMissing, Empty, ErrorBox, Skeletons } from '../components/ui';
import { ENDPOINTS } from '../config/endpoints';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => reservationService.mine(), []);

  const s = useMemo(() => {
    const list = data || [];
    const up = list.filter(isUpcoming).sort((a, b) => a.trip.departureAt - b.trip.departureAt);
    const recent = [...list].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(0, 5);
    return {
      total: list.length, up,
      cancelled: list.filter((r) => isCancelled(r.status)).length,
      past: list.filter((r) => !isCancelled(r.status) && r.trip.departureAt && r.trip.departureAt <= new Date()).length,
      recent,
    };
  }, [data]);

  return (
    <div className="container pad">
      <header className="page-head">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <h1>Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
          <p className="muted">Voici l'état de vos voyages.</p>
        </div>
        <Link to="/trips" className="btn btn-primary btn-lg">Nouvelle réservation <Icon name="arrow" size={18} /></Link>
      </header>

      {loading && <Skeletons n={4} />}
      {error && (isMissing(error) ? <BackendMissing endpoint={`${ENDPOINTS.reservations.mine.method} ${ENDPOINTS.reservations.mine.path}`} /> : <ErrorBox error={error} onRetry={reload} />)}

      {data && (
        <>
          <div className="stats">
            <div className="stat"><b><CountUp to={s.total} duration={1.2} /></b><span>Réservations</span></div>
            <div className="stat accent"><b><CountUp to={s.up.length} duration={1.2} delay={0.1} /></b><span>À venir</span></div>
            <div className="stat"><b><CountUp to={s.past} duration={1.2} delay={0.2} /></b><span>Voyages effectués</span></div>
            <div className="stat"><b><CountUp to={s.cancelled} duration={1.2} delay={0.3} /></b><span>Annulées</span></div>
          </div>

          <div className="dash-grid">
            <section>
              <h2 className="h-sm">Prochains voyages</h2>
              {s.up.length === 0
                ? <Empty title="Aucun voyage à venir" action={<Link to="/trips" className="btn btn-primary">Trouver un trajet</Link>}>Réservez votre prochaine place en quelques secondes.</Empty>
                : <div className="stack">{s.up.slice(0, 3).map((r) => <ReservationCard key={r.id} r={r} />)}</div>}
            </section>
            <section>
              <div className="row-between"><h2 className="h-sm">Dernières réservations</h2><Link to="/reservations" className="link-arrow">Historique <Icon name="arrow" size={16} /></Link></div>
              {s.recent.length === 0
                ? <p className="muted">Rien pour l'instant.</p>
                : <div className="stack">{s.recent.map((r) => <ReservationCard key={r.id} r={r} />)}</div>}
            </section>
          </div>

          <div className="quick">
            <Link to="/trips"><Icon name="bus" /> Rechercher un trajet</Link>
            <Link to="/reservations"><Icon name="ticket" /> Historique</Link>
            <Link to="/profile"><Icon name="user" /> Mon profil</Link>
          </div>
        </>
      )}
    </div>
  );
}
