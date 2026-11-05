import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PhoneFrame from './PhoneFrame';
import { isEmbedded } from '../utils/embed';

export default function Layout() {
  const [preview, setPreview] = useState(false);
  const { pathname } = useLocation();
  const embedded = isEmbedded();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="app">
      <Navbar embedded={embedded} onPreview={() => setPreview(true)} />
      <main key={pathname} className="page"><Outlet /></main>
      <Footer />
      {preview && !embedded && <PhoneFrame onClose={() => setPreview(false)} />}
    </div>
  );
}
