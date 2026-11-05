import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { isMissing } from '../services/http';
import { ENDPOINTS } from '../config/endpoints';
import { isPhone } from '../utils/validate';
import { initials } from '../utils/format';
import Field from '../components/Field';
import Icon from '../components/Icons';
import { Alert, BackendMissing } from '../components/ui';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const nav = useNavigate();
  const [p, setP] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pErr, setPErr] = useState({});
  const [pMsg, setPMsg] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [pwMsg, setPwMsg] = useState(null);
  const [busy, setBusy] = useState('');

  // Profil frais depuis le serveur (si la route existe)
  useEffect(() => {
    userService.get().then((u) => { updateUser({ ...user, ...u }); setP({ name: u.name || '', phone: u.phone || '' }); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    const er = {};
    if (p.name.trim().length < 2) er.name = 'Nom trop court.';
    if (p.phone && !isPhone(p.phone)) er.phone = 'Numéro invalide.';
    setPErr(er); setPMsg(null);
    if (Object.keys(er).length) return;
    setBusy('p');
    try {
      const u = await userService.update({ name: p.name.trim(), phone: p.phone.trim() });
      updateUser({ ...user, ...(u || { name: p.name.trim(), phone: p.phone.trim() }) });
      setPMsg({ tone: 'success', text: 'Profil mis à jour.' });
    } catch (ex) {
      setPMsg(isMissing(ex) ? { missing: `${ENDPOINTS.users.updateProfile.method} ${ENDPOINTS.users.updateProfile.path}` } : { tone: 'error', text: ex.message });
    } finally { setBusy(''); }
  };

  const savePw = async (e) => {
    e.preventDefault();
    const er = {};
    if (!pw.currentPassword) er.currentPassword = 'Requis.';
    if (pw.newPassword.length < 6) er.newPassword = 'Au moins 6 caractères.';
    if (pw.newPassword !== pw.confirm) er.confirm = 'Ne correspond pas.';
    setPwErr(er); setPwMsg(null);
    if (Object.keys(er).length) return;
    setBusy('pw');
    try {
      await userService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ tone: 'success', text: 'Mot de passe modifié.' });
    } catch (ex) {
      setPwMsg(isMissing(ex) ? { missing: `${ENDPOINTS.users.changePassword.method} ${ENDPOINTS.users.changePassword.path}` } : { tone: 'error', text: ex.message });
    } finally { setBusy(''); }
  };

  const Msg = ({ m }) => m && (m.missing ? <BackendMissing endpoint={m.missing} /> : <Alert tone={m.tone}>{m.text}</Alert>);

  return (
    <div className="container pad narrow">
      <header className="page-head profile-head">
        <span className="avatar-big">{initials(user?.name)}</span>
        <div><p className="eyebrow">Mon profil</p><h1>{user?.name || 'Client'}</h1><p className="muted">{user?.email}</p></div>
      </header>

      <section className="panel">
        <h2 className="h-sm">Informations personnelles</h2>
        <Msg m={pMsg} />
        <form className="form" onSubmit={saveProfile} noValidate>
          <Field label="Nom complet" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} error={pErr.name} />
          <Field label="Adresse e-mail" value={user?.email || ''} disabled hint="L'adresse e-mail ne peut pas être modifiée ici." readOnly />
          <Field label="Téléphone" type="tel" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} error={pErr.phone} />
          <button className="btn btn-primary" disabled={busy === 'p'}>{busy === 'p' ? 'Enregistrement…' : 'Enregistrer'}</button>
        </form>
      </section>

      <section className="panel">
        <h2 className="h-sm">Mot de passe</h2>
        <Msg m={pwMsg} />
        <form className="form" onSubmit={savePw} noValidate>
          <Field label="Mot de passe actuel" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErr.currentPassword} />
          <div className="two">
            <Field label="Nouveau mot de passe" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErr.newPassword} />
            <Field label="Confirmation" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr.confirm} />
          </div>
          <button className="btn" disabled={busy === 'pw'}>{busy === 'pw' ? 'Modification…' : 'Changer le mot de passe'}</button>
        </form>
      </section>

      <button className="btn btn-danger-outline block" onClick={() => { logout(); nav('/', { replace: true }); }}>
        <Icon name="logout" size={18} /> Se déconnecter
      </button>
    </div>
  );
}
