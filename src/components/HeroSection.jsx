import './HeroSection.css';

export default function HeroSection({ setCurrentPage }) {
  return (
    <div className="hero-container">
      <div className="container hero-content">
        <h1 className="hero-title animate-fade-in">
          L'Immobilier de Demain,<br />
          <span className="text-accent">Aujourd'hui.</span>
        </h1>
        <p className="hero-subtitle animate-fade-in delay-100">
          Trouvez, vendez et investissez avec l'expertise d'Y-Plaza. 
          Propulsé par l'intelligence artificielle pour des décisions éclairées.
        </p>
        
        <div className="hero-actions animate-fade-in delay-200">
          <button 
            className="btn-primary"
            onClick={() => {
              document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explorer les biens
          </button>
          <button 
            className="btn-outline"
            onClick={() => setCurrentPage('dashboard')}
          >
            Découvrir l'Analyse IA
          </button>
        </div>
      </div>
    </div>
  );
}
