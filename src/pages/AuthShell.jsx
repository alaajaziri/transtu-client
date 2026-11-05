import RouteArt from '../components/RouteArt';

export default function AuthShell({ title, subtitle, children, aside }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <RouteArt className="auth-art" />
        <div className="auth-brand-in">
          <p className="eyebrow light">TRANSTU</p>
          <h2>{aside?.title || 'Voyagez sans attendre.'}</h2>
          <p>{aside?.text || 'Réservez votre siège, gardez votre billet dans votre poche.'}</p>
        </div>
      </aside>
      <section className="auth-form">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
