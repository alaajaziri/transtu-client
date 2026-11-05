import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';
import Logo from './Logo';
import { initials } from '../utils/format';
import { homeFor, isDriver } from '../utils/roles';

export default function Navbar({ onPreview, embedded }) {
  const { isAuthenticated, user, logout } = useAuth();
  const driver = isAuthenticated && isDriver(user);
  const cls = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <>
      <header className="navbar">
        <div className="container nav-in">
          <Link to={isAuthenticated ? homeFor(user) : '/'} className="nav-logo" aria-label="Accueil TRANSTU"><Logo /></Link>

          <nav className="nav-links" aria-label="Navigation principale">
            {driver ? (
              <NavLink to="/driver" className={cls}>Mes trajets</NavLink>
            ) : (
              <>
                <NavLink to="/" end className={cls}>Accueil</NavLink>
                <NavLink to="/trips" className={cls}>Trajets</NavLink>
                {isAuthenticated && <NavLink to="/dashboard" className={cls}>Tableau de bord</NavLink>}
                {isAuthenticated && <NavLink to="/reservations" className={cls}>Mes réservations</NavLink>}
              </>
            )}
          </nav>

          <div className="nav-actions">
            {!embedded && (
              <button type="button" className="preview-btn" onClick={onPreview}>
                <Icon name="phone" size={16} /> Voir sur mobile
              </button>
            )}
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="avatar-chip" title="Mon profil">
                  <span>{initials(user?.name)}</span>{user?.name?.split(' ')[0] || 'Profil'}
                </Link>
                <button className="btn btn-ghost btn-sm nav-desk" onClick={logout}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
                <Link to="/register" className="btn btn-primary btn-sm nav-desk">Créer un compte</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label="Navigation mobile">
        {driver ? (
          <>
            <NavLink to="/driver" className={cls}><Icon name="bus" /><span>Trajets</span></NavLink>
            <NavLink to="/profile" className={cls}><Icon name="user" /><span>Profil</span></NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" end className={cls}><Icon name="home" /><span>Accueil</span></NavLink>
            <NavLink to="/trips" className={cls}><Icon name="bus" /><span>Trajets</span></NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/reservations" className={cls}><Icon name="ticket" /><span>Billets</span></NavLink>
                <NavLink to="/profile" className={cls}><Icon name="user" /><span>Profil</span></NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className={cls}><Icon name="user" /><span>Connexion</span></NavLink>
                <NavLink to="/register" className={cls}><Icon name="ticket" /><span>Inscription</span></NavLink>
              </>
            )}
          </>
        )}
      </nav>
    </>
  );
}
