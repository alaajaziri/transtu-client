import { useId, useState } from 'react';

export default function Field({ label, error, hint, type = 'text', ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <input id={id} type={isPw && show ? 'text' : type} aria-invalid={!!error} {...rest} />
        {isPw && (
          <button type="button" className="field-toggle" onClick={() => setShow((s) => !s)}>
            {show ? 'Masquer' : 'Afficher'}
          </button>
        )}
      </div>
      {error ? <p className="field-err">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
