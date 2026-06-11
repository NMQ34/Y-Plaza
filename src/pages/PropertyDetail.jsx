import { useState } from 'react';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, CheckCircle, ShieldCheck, Mail, Phone, User, DollarSign } from 'lucide-react';
import './PropertyDetail.css';

export default function PropertyDetail({ property, setCurrentPage }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    offerAmount: property.price,
    message: `Bonjour, je suis vivement intéressé par le bien "${property.title}" situé à ${property.location}. Je souhaite soumettre une offre d'acquisition pour ce bien.`
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simuler un envoi réseau vers le serveur de ventes / base
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const getPropertyDescription = () => {
    if (property.type === 'maison') {
      return `Cette demeure d'architecte d'exception offre des volumes remarquables et des prestations haut de gamme dans un cadre résidentiel privilégié. Édifiée sur un magnifique terrain arboré, elle propose une vaste pièce de vie lumineuse ouverte sur l'extérieur, une cuisine moderne équipée et plusieurs suites de prestige. Une véritable opportunité gérée en exclusivité par le réseau Y-Plaza.`;
    } else if (property.type === 'appartement') {
      return `Superbe appartement de prestige mariant avec brio le charme de l'ancien et le confort contemporain. Situé en étage noble au sein d'une copropriété de standing, il se compose d'une galerie d'entrée, d'un double salon spacieux, de chambres confortables au calme absolu, et d'une cuisine dinatoire haut de gamme. Un bien d'une qualité rare sur le marché local.`;
    } else if (property.type === 'commercial') {
      return `Locaux professionnels de premier ordre idéalement situés au cœur d'un pôle d'activité dynamique. Offrant une excellente visibilité et des configurations modulables, ces espaces conviennent parfaitement pour un siège social, des bureaux d'affaires ou des activités de prestige. Conformes aux normes PMR et dotés de connexions haut débit sécurisées.`;
    } else {
      return `Superbe terrain constructible idéalement orienté au sein d'une zone résidentielle très recherchée. Viabilisé en bordure, libre de constructeur, il permet d'envisager la réalisation d'un projet immobilier ambitieux avec de grands espaces et une intégration paysagère optimale. Une opportunité d'investissement pérenne sélectionnée par nos conseillers.`;
    }
  };

  return (
    <div className="property-detail-page container animate-fade-in">
      <button 
        className="btn-back" 
        onClick={() => setCurrentPage('home')}
      >
        <ArrowLeft size={18} />
        Retour aux biens
      </button>

      <div className="detail-layout">
        {/* Colonne Gauche : Détails du bien */}
        <div className="detail-info-column">
          <div className="detail-image-wrapper glass-panel">
            <img src={property.image_url} alt={property.title} className="detail-image" />
            {property.tag && <span className="detail-tag">{property.tag}</span>}
          </div>

          <div className="detail-content glass-panel">
            <span className="detail-type-badge">{property.type}</span>
            <h1 className="detail-title">{property.title}</h1>
            <p className="detail-location">
              <MapPin size={18} />
              {property.location}
            </p>
            <div className="detail-price">
              {parseFloat(property.price).toLocaleString()} €
            </div>

            <div className="detail-features-grid">
              <div className="detail-feature-card">
                <Maximize size={24} className="text-accent" />
                <div className="feature-text">
                  <span className="feature-label">Surface</span>
                  <span className="feature-val">{property.sqft} m²</span>
                </div>
              </div>
              <div className="detail-feature-card">
                <Bed size={24} className="text-accent" />
                <div className="feature-text">
                  <span className="feature-label">Chambres</span>
                  <span className="feature-val">{property.beds || '-'}</span>
                </div>
              </div>
              <div className="detail-feature-card">
                <Bath size={24} className="text-accent" />
                <div className="feature-text">
                  <span className="feature-label">Salles de bain</span>
                  <span className="feature-val">{property.baths || '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-description-section">
              <h3>Description du bien</h3>
              <p>{getPropertyDescription()}</p>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Formulaire d'achat / Offre */}
        <div className="detail-form-column">
          <div className="acquisition-card glass-panel">
            {!submitted ? (
              <>
                <div className="card-header">
                  <ShieldCheck size={28} className="text-accent" />
                  <h3>Formulaire d'Acquisition</h3>
                </div>
                <p className="card-subtitle">Soumettez votre proposition d'achat sécurisée pour ce bien d'exception.</p>

                <form onSubmit={handleSubmit} className="acquisition-form">
                  <div className="form-group">
                    <label htmlFor="fullName">Nom Complet</label>
                    <div className="input-wrapper">
                      <User size={16} className="input-icon" />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Ex: Jean Dupont"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Adresse Email</label>
                    <div className="input-wrapper">
                      <Mail size={16} className="input-icon" />
                      <input
                        id="email"
                        type="email"
                        placeholder="jean.dupont@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Numéro de Téléphone</label>
                    <div className="input-wrapper">
                      <Phone size={16} className="input-icon" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offerAmount">Montant de votre Offre (€)</label>
                    <div className="input-wrapper">
                      <DollarSign size={16} className="input-icon" />
                      <input
                        id="offerAmount"
                        type="number"
                        placeholder={property.price}
                        value={formData.offerAmount}
                        onChange={e => setFormData({ ...formData, offerAmount: parseFloat(e.target.value) || 0 })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message d'accompagnement</label>
                    <textarea
                      id="message"
                      rows="4"
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      disabled={loading}
                    ></textarea>
                  </div>

                  <div className="terms-checkbox">
                    <input type="checkbox" id="agree" required disabled={loading} />
                    <label htmlFor="agree">
                      Je certifie la véracité de mes informations et souhaite formaliser cette intention d'achat auprès de Y-Plaza.
                    </label>
                  </div>

                  <button type="submit" className="btn-primary submit-offer-btn" disabled={loading}>
                    {loading ? "Traitement de l'offre..." : "Soumettre l'offre d'acquisition"}
                  </button>
                </form>
              </>
            ) : (
              <div className="success-panel animate-fade-in">
                <CheckCircle size={64} className="success-icon" />
                <h2>Offre Soumise avec Succès !</h2>
                <p className="success-desc">
                  Votre proposition d'acquisition a été enregistrée et transmise en priorité à l'agent en charge de la transaction.
                </p>

                <div className="offer-summary-box">
                  <h4>Récapitulatif de votre offre :</h4>
                  <ul>
                    <li><strong>Propriété :</strong> {property.title}</li>
                    <li><strong>Montant proposé :</strong> {formData.offerAmount.toLocaleString()} €</li>
                    <li><strong>Acquéreur :</strong> {formData.fullName}</li>
                    <li><strong>Contact :</strong> {formData.email} | {formData.phone}</li>
                  </ul>
                </div>

                <div className="next-steps-info">
                  <p><strong>Prochaines étapes :</strong></p>
                  <p>Un conseiller du réseau Y-Plaza analysera la solvabilité du dossier et prendra contact avec vous sous 24 heures ouvrées pour l'édition de la lettre d'intention d'achat.</p>
                </div>

                <button className="btn-primary return-home-btn" onClick={() => setCurrentPage('home')}>
                  Retourner à l'accueil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
