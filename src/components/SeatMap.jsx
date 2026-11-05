import Icon from './Icons';

/** Plan du bus : 2 + couloir + 2. Les numéros vont de 1 à `total`. */
export default function SeatMap({ total, occupied = [], selected, onSelect, current }) {
  const occ = new Set(occupied.map(String));
  const seats = Array.from({ length: total }, (_, i) => String(i + 1));
  const rows = [];
  for (let i = 0; i < seats.length; i += 4) rows.push(seats.slice(i, i + 4));

  const Seat = ({ n }) => {
    if (!n) return <span className="seat-gap" />;
    const isCur = current != null && String(current) === n;
    const isOcc = occ.has(n) && !isCur;
    const isSel = selected === n;
    const state = isSel ? 'sélectionné' : isCur ? 'votre siège actuel' : isOcc ? 'occupé' : 'libre';
    return (
      <button type="button" disabled={isOcc} aria-pressed={isSel} aria-label={`Siège ${n}, ${state}`}
        className={`seat${isOcc ? ' is-occ' : ''}${isSel ? ' is-sel' : ''}${isCur ? ' is-cur' : ''}`}
        onClick={() => onSelect(n)}>
        {n}
      </button>
    );
  };

  return (
    <div className="bus" role="group" aria-label="Plan des sièges">
      <div className="bus-front"><span>Avant</span><Icon name="bus" size={18} /></div>
      {rows.map((r, i) => (
        <div className="bus-row" key={i}>
          <Seat n={r[0]} /><Seat n={r[1]} />
          <span className="aisle" />
          <Seat n={r[2]} /><Seat n={r[3]} />
        </div>
      ))}
    </div>
  );
}
