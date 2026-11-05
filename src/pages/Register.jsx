import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateRegister } from '../utils/validate';
import Field from '../components/Field';
import { Alert } from '../components/ui';
import AuthShell from './AuthShell';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [v, setV] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const ve = validateRegister(v);
    setErrs(ve); setErr('');
    if (Object.keys(ve).length) return;
    setBusy(true);
    try {
      const r = await register({ name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim(), password: v.password });
      nav(r.loggedIn ? '/dashboard' : '/login', { replace: true, state: { registered: true } });
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Créer un compte" subtitle="Quelques secondes suffisent pour réserver votre première place."
      aside={{ title: 'Votre place vous attend.', text: 'Un compte, tous vos billets au même endroit.' }}>
      {err && <Alert>{err}</Alert>}
      <form onSubmit={submit} noValidate className="form">
        <Field label="Nom complet" autoComplete="name" value={v.name} onChange={set('name')} error={errs.name} />
        <Field label="Adresse e-mail" type="email" autoComplete="email" value={v.email} onChange={set('email')} error={errs.email} />
        <Field label="Téléphone" type="tel" autoComplete="tel" placeholder="22 123 456" value={v.phone} onChange={set('phone')} error={errs.phone} />
        <div className="two">
          <Field label="Mot de passe" type="password" autoComplete="new-password" value={v.password} onChange={set('password')} error={errs.password} />
          <Field label="Confirmation" type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} error={errs.confirm} />
        </div>
        <button className="btn btn-primary btn-lg block" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="auth-alt">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
    </AuthShell>
  );
}
