import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PhoneFrame from './PhoneFrame';
import ClickSpark from '../reactbits/ClickSpark';
import { isEmbedded } from '../utils/embed';

export default function Layout() {
  const [preview, setPreview] = useState(false);
  const { pathname } = useLocation();
  const embedded = isEmbedded();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    // Étincelles au clic (React Bits). Désactivées dans l'espace chauffeur : on y veut du calme.
    <ClickSpark sparkColor={['#f8af26', '#009751', '#0f66ad']} sparkCount={9} sparkRadius={26} sparkSize={12} sparkWidth={3} duration={550} disabled={pathname.startsWith('/driver')}>
      <div className="app">
        <Navbar embedded={embedded} onPreview={() => setPreview(true)} />
        <main key={pathname} className="page"><Outlet /></main>
        <Footer />
        {preview && !embedded && <PhoneFrame onClose={() => setPreview(false)} />}
      </div>
    </ClickSpark>
  );
}
