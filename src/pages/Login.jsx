import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validate';
import { homeFor } from '../utils/roles';
import Field from '../components/Field';
import { Alert } from '../components/ui';
import AuthShell from './AuthShell';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const explicit = loc.state?.from; // page demandée avant la connexion (sinon : accueil selon le rôle)
  const [v, setV] = useState({ email: '', password: '' });
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to={explicit || homeFor(user)} replace />;

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const ve = validateLogin(v);
    setErrs(ve); setErr('');
    if (Object.keys(ve).length) return;
    setBusy(true);
    try { const u = await login({ email: v.email.trim(), password: v.password }); nav(explicit || homeFor(u), { replace: true }); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Bon retour." subtitle="Connectez-vous pour retrouver vos réservations.">
      {loc.state?.notice && <Alert tone="info">{loc.state.notice}</Alert>}
      {loc.state?.registered && <Alert tone="success">Compte créé. Vous pouvez maintenant vous connecter.</Alert>}
      {err && <Alert>{err}</Alert>}
      <form onSubmit={submit} noValidate className="form">
        <Field label="Adresse e-mail" type="email" autoComplete="email" value={v.email} onChange={set('email')} error={errs.email} />
        <Field label="Mot de passe" type="password" autoComplete="current-password" value={v.password} onChange={set('password')} error={errs.password} />
        <button className="btn btn-primary btn-lg block" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <p className="auth-alt">Pas encore de compte ? <Link to="/register">Créer un compte</Link></p>
    </AuthShell>
  );
}
