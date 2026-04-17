import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="layout-container">
      {/* Background Glow Effects from the original CSS */}
      <div className="bg-glow blob-1"></div>
      <div className="bg-glow blob-2"></div>

      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
