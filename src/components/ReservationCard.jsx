import { Link } from 'react-router-dom';
import Icon from './Icons';
import { StatusBadge } from './ui';
import { fmtTime } from '../utils/format';

export default function ReservationCard({ r }) {
  const t = r.trip;
  const d = t.departureAt;
  return (
    <Link to={`/reservations/${r.id}`} className="rcard">
      <div className="rcard-date">
        <b>{d ? d.getDate() : '—'}</b>
        <span>{d ? d.toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
      </div>
      <div className="rcard-main">
        <strong>{t.from || 'Départ'} <Icon name="arrow" size={14} /> {t.to || 'Destination'}</strong>
        <span>{fmtTime(d)} · Siège {r.seat ?? '—'} · N° {r.number}</span>
      </div>
      <StatusBadge status={r.status} />
    </Link>
  );
}
