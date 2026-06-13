// Configuration de la plateforme Web Y-Plaza

// Détection dynamique de l'hôte pour éviter les échecs de connexion (CORS/IP)
// Si l'application est consultée depuis une autre machine du réseau (ex: http://192.168.x.x:5173),
// l'API pointera automatiquement vers l'IP de la VM sur le port 5000.
export const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : `http://${window.location.hostname}:5000/api`
);
