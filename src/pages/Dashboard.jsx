import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { title: "Ventes Mensuelles", value: "142", trend: "+12.5%", icon: <TrendingUp /> },
    { title: "Clients Actifs", value: "3,842", trend: "+5.2%", icon: <Users /> },
    { title: "Prévision Croissance", value: "+18%", trend: "Stable", icon: <BarChart3 /> },
    { title: "Biens Analysés (IA)", value: "12,450", trend: "+450", icon: <Activity /> }
  ];

  return (
    <div className="dashboard-page container animate-fade-in">
      <div className="dashboard-header">
        <h1 className="page-title">Intelligence & <span className="text-accent">Analytique</span></h1>
        <p className="page-subtitle">Vue d'ensemble propulsée par notre modèle IA pour le réseau Y-Plaza.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card glass-panel delay-100 animate-fade-in">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : ''}`}>
                {stat.trend} par rapport au mois dernier
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-panel delay-200 animate-fade-in">
          <h3>Prédictions des prix par région (IA)</h3>
          <div className="mock-chart">
            <div className="bar-wrapper"><div className="bar" style={{ height: '80%' }}></div><span>PACA</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '65%' }}></div><span>IDF</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '50%' }}></div><span>ARA</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '70%' }}></div><span>NAQ</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '40%' }}></div><span>BFC</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '85%' }}></div><span>OCC</span></div>
          </div>
        </div>

        <div className="chart-card glass-panel delay-300 animate-fade-in">
          <h3>Demande vs Offre (Tendances)</h3>
          <div className="mock-chart-horizontal">
            <div className="h-bar-item">
              <span>Appartements</span>
              <div className="h-bar-track"><div className="h-bar-fill" style={{ width: '85%' }}></div></div>
            </div>
            <div className="h-bar-item">
              <span>Maisons</span>
              <div className="h-bar-track"><div className="h-bar-fill" style={{ width: '60%' }}></div></div>
            </div>
            <div className="h-bar-item">
              <span>Locaux Commerciaux</span>
              <div className="h-bar-track"><div className="h-bar-fill" style={{ width: '40%' }}></div></div>
            </div>
            <div className="h-bar-item">
              <span>Terrains</span>
              <div className="h-bar-track"><div className="h-bar-fill" style={{ width: '30%' }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
