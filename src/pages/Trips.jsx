import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { tripService } from '../services/tripService';
import { fmtLong, uniqueStations } from '../utils/format';
import SearchForm from '../components/SearchForm';
import TripCard from '../components/TripCard';
import Reveal from '../components/fx/Reveal';
import { Empty, ErrorBox, Skeletons } from '../components/ui';

export default function Trips() {
  const [sp] = useSearchParams();
  const f = { from: sp.get('from') || '', to: sp.get('to') || '', date: sp.get('date') || '' };
  const { data, loading, error, reload } = useAsync(() => tripService.list(f), [f.from, f.to, f.date]);
  const all = useAsync(() => tripService.list({}), []);
  const stations = useMemo(() => uniqueStations(all.data || data || []), [all.data, data]);
  const filtered = !!(f.from || f.to || f.date);

  return (
    <div className="container pad">
      <header className="page-head">
        <div>
          <p className="eyebrow">Trajets disponibles</p>
          <h1>{f.from || f.to ? `${f.from || 'Partout'} → ${f.to || 'Partout'}` : 'Tous les trajets'}</h1>
          {f.date && <p className="muted">{fmtLong(new Date(`${f.date}T00:00:00`))}</p>}
        </div>
      </header>

      <SearchForm compact stations={stations} initial={f} />

      <div className="results">
        {loading && <Skeletons n={4} />}
        {error && <ErrorBox error={error} onRetry={reload} />}
        {!loading && !error && (
          <>
            <p className="muted count">{data.length} trajet{data.length > 1 ? 's' : ''} trouvé{data.length > 1 ? 's' : ''}</p>
            {data.length === 0 ? (
              <Empty title="Aucun trajet ne correspond">
                {filtered ? 'Essayez une autre date ou retirez un filtre.' : "Aucun trajet n'est programmé pour le moment."}
              </Empty>
            ) : (
              <div className="trip-grid">{data.map((t, i) => <Reveal key={t.id} delay={Math.min(i, 5) * 0.07}><TripCard trip={t} /></Reveal>)}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
