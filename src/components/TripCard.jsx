import { Link } from 'react-router-dom';
import { fmtDay, fmtPrice, fmtTime } from '../utils/format';

export default function TripCard({ trip }) {
  const past = trip.departureAt && trip.departureAt < new Date();
  const full = trip.available === 0;
  const ratio = trip.total && trip.available != null ? Math.max(0, Math.min(1, trip.available / trip.total)) : null;

  return (
    <article className="trip">
      <div className="trip-top">
        {trip.line ? <span className="line-badge">{trip.line}</span> : <span />}
        <span className="trip-date">{fmtDay(trip.departureAt)}</span>
      </div>

      <div className="trip-route">
        <div><strong>{fmtTime(trip.departureAt)}</strong><span>{trip.from || 'Départ'}</span></div>
        <div className="route-line" aria-hidden="true"><i /><b /><i /></div>
        <div className="end"><strong>{fmtTime(trip.arrivalAt)}</strong><span>{trip.to || 'Destination'}</span></div>
      </div>

      <div className="trip-foot">
        <div className="trip-meta">
          <b>{fmtPrice(trip.price)}</b>
          <span>
            {trip.available != null ? (full ? 'Complet' : `${trip.available} place${trip.available > 1 ? 's' : ''} libre${trip.available > 1 ? 's' : ''}`) : 'Places : voir à la réservation'}
          </span>
          {ratio != null && <div className="meter"><i style={{ width: `${ratio * 100}%` }} /></div>}
        </div>
        {past || full ? (
          <span className="btn btn-disabled">{past ? 'Départ passé' : 'Complet'}</span>
        ) : (
          <Link className="btn btn-primary" to={`/trips/${trip.id}/book`}>Réserver</Link>
        )}
      </div>
    </article>
  );
}
