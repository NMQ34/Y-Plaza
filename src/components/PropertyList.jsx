import { MapPin, Bed, Bath, Maximize } from 'lucide-react';
import './PropertyList.css';

export default function PropertyList() {
  const properties = [
    {
      id: 1,
      title: "Villa Moderne avec Piscine",
      location: "Aix-en-Provence, 13100",
      price: "1 250 000 €",
      beds: 4,
      baths: 3,
      sqft: 220,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      tag: "Exclusivité"
    },
    {
      id: 2,
      title: "Appartement Haussmannien",
      location: "Paris, 75008",
      price: "2 100 000 €",
      beds: 3,
      baths: 2,
      sqft: 150,
      image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
      tag: "Nouveau"
    },
    {
      id: 3,
      title: "Maison d'Architecte",
      location: "Lyon, 69006",
      price: "980 000 €",
      beds: 5,
      baths: 4,
      sqft: 280,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      tag: "Coup de Cœur"
    }
  ];

  return (
    <section className="properties-section" id="properties">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Biens d'Exception</h2>
          <p className="section-subtitle">Découvrez notre sélection de propriétés prestigieuses gérées par nos agences.</p>
        </div>

        <div className="properties-grid">
          {properties.map((prop) => (
            <div key={prop.id} className="property-card glass-panel">
              <div className="property-image-wrapper">
                <img src={prop.image} alt={prop.title} className="property-image" />
                <span className="property-tag">{prop.tag}</span>
              </div>
              
              <div className="property-content">
                <h3 className="property-title">{prop.title}</h3>
                <p className="property-location">
                  <MapPin size={16} />
                  {prop.location}
                </p>
                <div className="property-price">{prop.price}</div>
                
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
        
        <div className="text-center" style={{ marginTop: '40px' }}>
          <button className="btn-outline">Voir tous nos biens</button>
        </div>
      </div>
    </section>
  );
}
