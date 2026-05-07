import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo">
            <Building2 size={32} className="logo-icon" />
            <span className="logo-text">Y-Plaza</span>
          </div>
          <p className="footer-description">
            Votre partenaire immobilier de confiance. 
            Découvrez l'avenir de l'immobilier avec nos analyses IA exclusives et notre réseau de 12 agences à travers la France.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Navigation</h4>
          <ul>
            <li><a href="#home">Accueil</a></li>
            <li><a href="#properties">Nos Biens</a></li>
            <li><a href="#dashboard">Analyse IA</a></li>
            <li><a href="#agencies">Nos Agences</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contact Siège</h4>
          <ul>
            <li>
              <MapPin size={18} className="contact-icon" />
              <span>Aix-en-Provence, France</span>
            </li>
            <li>
              <Phone size={18} className="contact-icon" />
              <span>+33 4 42 00 00 00</span>
            </li>
            <li>
              <Mail size={18} className="contact-icon" />
              <span>contact@y-plaza.fr</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 Y-Plaza Immobilier. Projet UF_DEV_B2.</p>
        </div>
      </div>
    </footer>
  );
}
