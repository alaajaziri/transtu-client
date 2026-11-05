import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { tripService } from '../services/tripService';
import { uniqueStations } from '../utils/format';
import RouteArt from '../components/RouteArt';
import SearchForm from '../components/SearchForm';
import TripCard from '../components/TripCard';
import Icon from '../components/Icons';
import Reveal from '../components/fx/Reveal';
import BlurText from '../reactbits/BlurText';
import RotatingText from '../reactbits/RotatingText';
import { Empty, ErrorBox, Skeletons } from '../components/ui';

const STEPS = [
  { n: 1, icon: 'pin', t: 'Cherchez', d: 'Indiquez votre départ, votre destination et la date. Les trajets du jour apparaissent aussitôt.' },
  { n: 2, icon: 'seat', t: 'Choisissez votre siège', d: 'Le plan du bus montre les places libres et occupées. Vous réservez la vôtre en un geste.' },
  { n: 3, icon: 'ticket', t: 'Montez avec votre QR', d: 'Votre billet numérique est prêt. Présentez le QR code à bord, sans papier.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, reload } = useAsync(() => tripService.list({}), []);
  const upcoming = useMemo(() => (data || []).filter((t) => !t.departureAt || t.departureAt > new Date()).slice(0, 6), [data]);
  const stations = useMemo(() => uniqueStations(data || []), [data]);

  return (
    <>
      <section className="hero">
        <RouteArt />
        <div className="container hero-grid">
          <div className="hero-copy stagger">
            <p className="eyebrow"><span className="dot" /> Transport public · Tunisie</p>
            <h1>
              <RotatingText
                texts={['Réservez votre place.', 'Recevez votre billet.', 'Voyagez sans attendre.']}
                highlight
                highlightColor="#f8af26"
              />
            </h1>
            <BlurText
              className="lead"
              text="Plus de file d'attente. Choisissez votre siège, recevez votre billet avec QR code et voyagez l'esprit tranquille."
              animateBy="words"
              delay={45}
              stepDuration={0.3}
              direction="bottom"
              trigger="load"
            />
            <div className="hero-cta">
              <Link to="/trips" className="btn btn-primary btn-lg">Voir les trajets <Icon name="arrow" size={18} /></Link>
              {!isAuthenticated && <Link to="/register" className="btn btn-lg">Créer un compte</Link>}
            </div>
          </div>
          <div className="hero-search"><SearchForm stations={stations} /></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <div><p className="eyebrow">Au départ bientôt</p><h2>Prochains trajets</h2></div>
            <Link to="/trips" className="link-arrow">Tout voir <Icon name="arrow" size={16} /></Link>
          </header>
          {loading && <Skeletons n={3} />}
          {error && <ErrorBox error={error} onRetry={reload} />}
          {!loading && !error && upcoming.length === 0 && (
            <Empty title="Aucun trajet disponible pour le moment">Revenez un peu plus tard : les nouveaux départs apparaissent ici dès qu'ils sont programmés.</Empty>
          )}
          <div className="trip-grid">{upcoming.map((t, i) => <Reveal key={t.id} delay={Math.min(i, 5) * 0.08}><TripCard trip={t} /></Reveal>)}</div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <header className="section-head"><div><p className="eyebrow">Comment ça marche</p><h2>Trois étapes, zéro file</h2></div></header>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal className="step" delay={i * 0.15} distance={50}>
                  <span className="line-badge big">{s.n}</span>
                  <div><h3>{s.t}</h3><p>{s.d}</p></div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <RouteArt className="cta-art" />
            <div>
              <h2>{isAuthenticated ? 'Prêt pour un nouveau départ ?' : 'Votre prochain voyage commence ici.'}</h2>
              <p>{isAuthenticated ? 'Retrouvez vos billets ou réservez un nouveau trajet.' : "Créez votre compte gratuit en moins d'une minute."}</p>
            </div>
            <div className="hero-cta">
              {isAuthenticated
                ? <><Link to="/reservations" className="btn btn-light btn-lg">Mes réservations</Link><Link to="/trips" className="btn btn-primary btn-lg">Réserver</Link></>
                : <><Link to="/register" className="btn btn-primary btn-lg">Créer un compte</Link><Link to="/login" className="btn btn-light btn-lg">Se connecter</Link></>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
