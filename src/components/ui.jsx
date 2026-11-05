import Icon from './Icons';
import { statusLabel, statusTone } from '../utils/format';
import { ApiError } from '../services/http';

export const Spinner = ({ label = 'Chargement…' }) => (
  <div className="spinner-wrap" role="status"><span className="spinner" /><span>{label}</span></div>
);

export const Alert = ({ tone = 'error', children, action }) => (
  <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <Icon name={tone === 'success' ? 'check' : 'alert'} size={18} />
    <div>{children}</div>
    {action}
  </div>
);

export const ErrorBox = ({ error, onRetry }) => (
  <Alert action={onRetry && <button className="btn btn-sm" onClick={onRetry}>Réessayer</button>}>
    {error instanceof ApiError || error?.message ? error.message : 'Une erreur est survenue.'}
  </Alert>
);

export const Empty = ({ title, children, action }) => (
  <div className="empty">
    <div className="empty-ill" aria-hidden="true"><i /><b /><i /></div>
    <h3>{title}</h3>
    {children && <p>{children}</p>}
    {action}
  </div>
);

export const Skeletons = ({ n = 3 }) => (
  <div className="skel-grid">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" />)}</div>
);

export const BackendMissing = ({ endpoint }) => (
  <div className="missing">
    <strong>Fonction non disponible côté serveur</strong>
    <p>La route <code>{endpoint}</code> n'existe pas (ou n'est pas encore implémentée). Voir <code>API.md</code> pour la liste des routes attendues.</p>
  </div>
);

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${statusTone(status)}`}>{status ? statusLabel(status) : 'Statut inconnu'}</span>
);
