import SeatMap from './SeatMap';
import { Alert } from './ui';

/** SeatMap + légende, avec un repli (saisie manuelle) si le backend ne donne pas la capacité. */
export default function SeatPicker({ state, selected, onSelect, current }) {
  if (state.total == null) {
    return (
      <div className="stack">
        <Alert tone="warn">
          Le serveur ne fournit pas le nombre de places de ce trajet : le plan des sièges ne peut pas être affiché.
          Entrez un numéro de siège, le serveur vérifiera sa disponibilité.
        </Alert>
        <label className="field"><span className="lbl">Numéro de siège</span>
          <input inputMode="numeric" value={selected || ''} onChange={(e) => onSelect(e.target.value.trim())} placeholder="ex. 12" />
        </label>
      </div>
    );
  }
  return (
    <div className="seatpicker">
      {!state.occupancyKnown && (
        <Alert tone="warn">Le serveur ne renvoie pas la liste des sièges occupés : tous les sièges semblent libres, la disponibilité sera vérifiée à la confirmation.</Alert>
      )}
      <div className="legend">
        <span><i className="seat mini" /> Libre</span>
        <span><i className="seat mini is-occ" /> Occupé</span>
        <span><i className="seat mini is-sel" /> Votre choix</span>
        {current != null && <span><i className="seat mini is-cur" /> Siège actuel</span>}
      </div>
      <SeatMap total={state.total} occupied={state.occupied} selected={selected} onSelect={onSelect} current={current} />
    </div>
  );
}
