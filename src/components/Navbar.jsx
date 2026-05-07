import { useState, useEffect } from 'react';
import { Building2, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ currentPage, setCurrentPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <div className="logo" onClick={() => handleNavClick('home')}>
          <Building2 size={32} className="logo-icon" />
          <span className="logo-text">Y-Plaza</span>
        </div>

        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <button 
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Accueil
          </button>
          <button 
            className="nav-btn"
            onClick={() => {
              if (currentPage !== 'home') handleNavClick('home');
              setTimeout(() => {
                document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            Nos Biens
          </button>
          <button 
            className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            Analyse IA
          </button>
          <button className="btn-primary login-btn">
            Espace Agence
          </button>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
}
