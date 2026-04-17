import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <>
      {/* Background Glow Effects from the original CSS */}
      <div className="bg-glow blob-1"></div>
      <div className="bg-glow blob-2"></div>
      <div className="bg-glow blob-3"></div>

      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
