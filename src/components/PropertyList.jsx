import { useState, useEffect } from 'react';
import { MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { API_URL } from '../config';
import './PropertyList.css';

export default function PropertyList({ onPropertyClick }) {
  const [properties, setProperties] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`${API_URL}/properties?status=disponible`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setProperties(data);
      } catch (err) {
        // Fallback static data if backend is offline
        setProperties([
          {
            id: 1,
            title: "Villa Moderne avec Piscine",
            location: "Aix-en-Provence, 13100",
            price: 1250000.0,
            beds: 4,
            baths: 3,
            sqft: 220,
            image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            tag: "Exclusivité"
          },
          {
            id: 2,
            title: "Appartement Haussmannien",
            location: "Paris, 75008",
            price: 2100000.0,
            beds: 3,
            baths: 2,
            sqft: 150,
            image_url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
            tag: "Nouveau"
          },
          {
            id: 3,
            title: "Maison d'Architecte",
            location: "Lyon, 69006",
            price: 980000.0,
            beds: 5,
            baths: 4,
            sqft: 280,
            image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            tag: "Coup de Cœur"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const displayedProperties = showAll ? properties : properties.slice(0, 3);

  return (
    <section className="properties-section" id="properties">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Biens d'Exception</h2>
          <p className="section-subtitle">Découvrez notre sélection de propriétés prestigieuses gérées par nos agences.</p>
        </div>

        {loading ? (
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>
            Chargement des propriétés...
          </div>
        ) : (
          <div className="properties-grid">
            {displayedProperties.map((prop) => (
              <div 
                key={prop.id} 
                className="property-card glass-panel"
                style={{ cursor: 'pointer' }}
                onClick={() => onPropertyClick && onPropertyClick(prop)}
              >
                <div className="property-image-wrapper">
                  <img src={prop.image_url} alt={prop.title} className="property-image" />
                  {prop.tag && <span className="property-tag">{prop.tag}</span>}
                </div>
                
                <div className="property-content">
                  <h3 className="property-title">{prop.title}</h3>
                  <p className="property-location">
                    <MapPin size={16} />
                    {prop.location}
                  </p>
                  <div className="property-price">
                    {parseFloat(prop.price).toLocaleString()} €
                  </div>
                  
                  <div className="property-features">
                    <div className="prop-feature">
                      <Bed size={18} />
                      <span>{prop.beds} Ch.</span>
                    </div>
                    <div className="prop-feature">
                      <Bath size={18} />
                      <span>{prop.baths} Sdb.</span>
                    </div>
                    <div className="prop-feature">
                      <Maximize size={18} />
                      <span>{prop.sqft} m²</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center" style={{ marginTop: '40px' }}>
          <button 
            className="btn-outline" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Réduire la sélection" : "Voir tous nos biens"}
          </button>
        </div>
      </div>
    </section>
  );
}
