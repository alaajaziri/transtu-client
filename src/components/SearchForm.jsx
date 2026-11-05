import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icons';
import { todayISO } from '../utils/format';

export default function SearchForm({ stations = [], initial = {}, compact = false }) {
  const nav = useNavigate();
  const listId = useId();
  const [v, setV] = useState({ from: initial.from || '', to: initial.to || '', date: initial.date || '' });
  useEffect(() => { setV({ from: initial.from || '', to: initial.to || '', date: initial.date || '' }); },
    [initial.from, initial.to, initial.date]);

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    Object.entries(v).forEach(([k, val]) => val && q.set(k, val.trim()));
    nav(`/trips${q.toString() ? `?${q}` : ''}`);
  };

  return (
    <form className={`searchcard${compact ? ' compact' : ''}`} onSubmit={submit}>
      {!compact && <div className="sc-head"><span className="line-badge">1</span> Où allez-vous ?</div>}
      <div className="sc-grid">
        <label className="sc-field">
          <span><Icon name="pin" size={14} /> Départ</span>
          <input list={listId} value={v.from} onChange={set('from')} placeholder="Station de départ" autoComplete="off" />
        </label>
        <button type="button" className="sc-swap" aria-label="Inverser départ et destination"
          onClick={() => setV((s) => ({ ...s, from: s.to, to: s.from }))}>
          <Icon name="swap" size={18} />
        </button>
        <label className="sc-field">
          <span><Icon name="pin" size={14} /> Destination</span>
          <input list={listId} value={v.to} onChange={set('to')} placeholder="Station d'arrivée" autoComplete="off" />
        </label>
        <label className="sc-field">
          <span><Icon name="calendar" size={14} /> Date</span>
          <input type="date" min={todayISO()} value={v.date} onChange={set('date')} />
        </label>
        <button className="btn btn-primary sc-go" type="submit">Rechercher <Icon name="arrow" size={18} /></button>
      </div>
      <datalist id={listId}>{stations.map((s) => <option key={s} value={s} />)}</datalist>
    </form>
  );
}
