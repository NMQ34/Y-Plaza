import { useState } from 'react';
import { ShieldAlert, LogIn, User } from 'lucide-react';
import './Login.css';

export default function Login({ setUser, setCurrentPage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e, demoCreds = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginUsername = demoCreds ? demoCreds.username : username;
    const loginPassword = demoCreds ? demoCreds.password : password;

    if (!loginUsername || !loginPassword) {
      setError("Veuillez saisir un identifiant et un mot de passe.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://4.251.144.215:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Identifiants invalides");
      }

      // Success
      localStorage.setItem('yplaza_user', JSON.stringify(data));
      setUser(data);
      setCurrentPage('agency');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: "Direction (Claire)", username: "claire", password: "claire", role: "Direction" },
    { label: "Commercial (Lucas)", username: "lucas", password: "lucas", role: "Commercial" },
    { label: "Marketing (Sarah)", username: "sarah", password: "sarah", role: "Communication & Marketing" },
    { label: "Administratif/RH (Pierre)", username: "pierre", password: "pierre", role: "Administratif - RH - Juridique" },
    { label: "Support IT (David)", username: "david", password: "david", role: "IT et Support" }
  ];

  return (
    <div className="login-page container animate-fade-in">
      <div className="login-grid">
        <div className="login-card glass-panel">
          <div className="login-header">
            <div className="login-icon-wrapper">
              <LogIn size={28} />
            </div>
            <h2>Connexion Collaborateur</h2>
            <p>Accédez à l'espace de gestion et de partage sécurisé de Y-Plaza.</p>
          </div>

          {error && (
            <div className="login-error-alert">
              <ShieldAlert size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLoginSubmit(e)} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Identifiant</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="Ex: claire, lucas, david..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                placeholder="Saisissez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="demo-info-card glass-panel">
          <h3>Simulation de Session</h3>
          <p>
            Sélectionnez un profil ci-dessous pour simuler la session d'un collaborateur et explorer les privilèges de lecture, d'écriture et de supervision propres à chaque pôle d'activité.
          </p>
          
          <div className="demo-buttons">
            {demoAccounts.map((account, idx) => (
              <button
                key={idx}
                className="demo-btn"
                onClick={() => handleLoginSubmit(null, account)}
                disabled={loading}
              >
                <span className="demo-btn-label">{account.label}</span>
                <span className="demo-btn-role">{account.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
