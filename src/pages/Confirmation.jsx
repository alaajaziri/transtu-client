import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { reservationService } from '../services/reservationService';
import { tripService } from '../services/tripService';
import { isMissing } from '../services/http';
import TicketCard from '../components/TicketCard';
import Icon from '../components/Icons';
import { Alert, ErrorBox, Spinner } from '../components/ui';

export default function Confirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    try {
      return await reservationService.get(id);
    } catch (e) {
      // Repli : réponse réelle du POST de création, si la route de lecture n'existe pas
      if (isMissing(e) && state?.reservation) {
        const r = state.reservation;
        if (r.tripId != null && !r.trip.from) r.trip = await tripService.get(r.tripId);
        return r;
      }
      throw e;
    }
  }, [id]);

  if (loading) return <div className="container pad"><Spinner label="Récupération de votre billet…" /></div>;
  if (error) return <div className="container pad"><ErrorBox error={error} onRetry={reload} /></div>;

  return (
    <div className="container pad narrow">
      <div className="success">
        <span className="success-ic"><Icon name="check" size={30} /></span>
        <p className="eyebrow">Réservation enregistrée</p>
        <h1>Bon voyage !</h1>
        <p className="muted">Réservation n° <b className="mono">{data.number}</b></p>
      </div>
      {!data.status && <Alert tone="info">Le serveur n'a pas renvoyé de statut pour cette réservation.</Alert>}
      <TicketCard reservation={data} passenger={user?.name} />
      <div className="ticket-actions center">
        <Link to="/reservations" className="btn btn-ghost">Mes réservations</Link>
        <Link to="/trips" className="btn btn-ghost">Réserver un autre trajet</Link>
      </div>
    </div>
  );
}
