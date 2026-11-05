import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container foot-in">
        <div>
          <Logo light />
          <p>Réservez votre place à bord, recevez votre billet numérique et voyagez sans file d'attente.</p>
        </div>
        <div>
          <h4>Voyager</h4>
          <Link to="/trips">Rechercher un trajet</Link>
          <Link to="/reservations">Mes réservations</Link>
          <Link to="/profile">Mon profil</Link>
        </div>
        <div>
          <h4>Compte</h4>
          <Link to="/login">Connexion</Link>
          <Link to="/register">Créer un compte</Link>
        </div>
      </div>
      <div className="container foot-bottom">© {new Date().getFullYear()} TRANSTU · Projet académique — interface client</div>
    </footer>
  );
}
