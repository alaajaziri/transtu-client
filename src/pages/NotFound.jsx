import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container pad">
      <Empty title="Page introuvable" action={<Link to="/" className="btn btn-primary">Retour à l'accueil</Link>}>
        Cette ligne n'existe pas sur notre réseau.
      </Empty>
    </div>
  );
}
