import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { driverService } from '../services/driverService';
import { fmtDay, fmtTime, sameDay } from '../utils/format';
import Icon from '../components/Icons';
import { Empty, ErrorBox, Skeletons, StatusBadge } from '../components/ui';

function DriverTripCard({ t }) {
  const open = ['scheduled', 'boarding'].includes(t.status);
  const ratio = t.booked ? Math.min(1, t.boarded / t.booked) : 0;
  return (
    <article className="trip">
      <div className="trip-top">
        {t.line ? <span className="line-badge">{t.line.replace(/^Ligne\s*/i, '')}</span> : <span />}
        <span className="drv-top-right"><span className="trip-date">{fmtDay(t.departureAt)}</span> <StatusBadge status={t.status} /></span>
      </div>
      <div className="trip-route">
        <div><strong>{fmtTime(t.departureAt)}</strong><span>{t.from || 'Départ'}</span></div>
        <div className="route-line" aria-hidden="true"><i /><b /><i /></div>
        <div className="end"><strong>{fmtTime(t.arrivalAt)}</strong><span>{t.to || 'Destination'}</span></div>
      </div>
      <div className="trip-foot">
        <div className="trip-meta">
          <b>{t.boarded} / {t.booked} embarqués</b>
          <span>{t.total ? `${t.total} places` : ''}</span>
          <div className="meter"><i style={{ width: `${ratio * 100}%` }} /></div>
        </div>
        <Link className={`btn ${open ? 'btn-primary' : ''}`} to={`/driver/trips/${t.id}`}>
          {open ? 'Embarquement' : 'Voir'} <Icon name="arrow" size={18} />
        </Link>
      </div>
    </article>
  );
}

export default function DriverHome() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => driverService.trips(), []);

  const now = new Date();
  const list = data || [];
  const today = list.filter((t) => t.departureAt && sameDay(t.departureAt, now));
  const later = list.filter((t) => !today.includes(t));

  return (
    <div className="container pad">
      <header className="page-head">
        <div>
          <p className="eyebrow">Espace chauffeur</p>
          <h1>Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="muted">Vos trajets à faire embarquer.</p>
        </div>
        <button type="button" className="btn" onClick={reload} disabled={loading}><Icon name="refresh" size={18} /> Actualiser</button>
      </header>

      {loading && !data && <Skeletons n={3} />}
      {error && <ErrorBox error={error} onRetry={reload} />}

      {data && list.length === 0 && (
        <Empty title="Aucun trajet à venir">Aucun trajet ne vous est affecté pour le moment.</Empty>
      )}

      {today.length > 0 && (
        <section className="drv-section">
          <h2 className="h-sm">Aujourd'hui</h2>
          <div className="trip-grid">{today.map((t) => <DriverTripCard key={t.id} t={t} />)}</div>
        </section>
      )}
      {later.length > 0 && (
        <section className="drv-section">
          <h2 className="h-sm">À venir</h2>
          <div className="trip-grid">{later.map((t) => <DriverTripCard key={t.id} t={t} />)}</div>
        </section>
      )}
    </div>
  );
}
