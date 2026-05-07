import { BrainCircuit, Map, ShieldCheck, TrendingUp } from 'lucide-react';
import './Features.css';

export default function Features() {
  const features = [
    {
      icon: <BrainCircuit size={40} />,
      title: "IA & Analyse Prédictive",
      description: "Nos algorithmes analysent les tendances du marché pour vous offrir les meilleures opportunités d'achat et de vente."
    },
    {
      icon: <Map size={40} />,
      title: "Réseau National",
      description: "12 agences interconnectées en France, avec notre siège social à Aix-en-Provence pour un service de proximité."
    },
    {
      icon: <ShieldCheck size={40} />,
      title: "Infrastructure Sécurisée",
      description: "Vos données sont protégées par un réseau privé virtuel (VPN) de pointe et des protocoles stricts."
    },
    {
      icon: <TrendingUp size={40} />,
      title: "Rentabilité Optimisée",
      description: "Des rapports détaillés et des prévisions de marché pour maximiser le rendement de vos investissements immobiliers."
    }
  ];

  return (
    <section className="features-section container" id="features">
      <div className="section-header text-center">
        <h2 className="section-title">Pourquoi choisir <span className="text-accent">Y-Plaza</span> ?</h2>
        <p className="section-subtitle">L'alliance parfaite entre l'expertise humaine et la puissance technologique.</p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card glass-panel animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="feature-icon-wrapper">
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
