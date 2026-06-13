import { useState, useEffect } from 'react';
import { 
  Folder, FileText, Lock, Unlock, Trash2, Upload, 
  ShieldAlert, ShieldCheck, Database, Plus, Check, Play, HardDrive, RefreshCw
} from 'lucide-react';
import './AgencySpace.css';

export default function AgencySpace({ user }) {
  const [activeTab, setActiveTab] = useState('properties'); // properties | files | supervision
  const [properties, setProperties] = useState([]);
  const [propError, setPropError] = useState('');
  const [propSuccess, setPropSuccess] = useState('');
  
  // Property Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProp, setNewProp] = useState({
    title: '', location: '', price: '', beds: 0, baths: 0, sqft: '', tag: '', type: 'appartement'
  });
  
  // Sell Property State
  const [sellModalId, setSellModalId] = useState(null);
  const [buyerName, setBuyerName] = useState('');

  // NTFS Simulator State
  const [selectedFolder, setSelectedFolder] = useState('Commercial');
  const [folderFiles, setFolderFiles] = useState([]);
  const [folderPermission, setFolderPermission] = useState('R'); // R | RW
  const [ntfsDenied, setNtfsDenied] = useState(false);
  const [ntfsErrorMsg, setNtfsErrorMsg] = useState('');
  const [uploadFileModal, setUploadFileModal] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', sizeKb: 150 });
  const [fileSuccess, setFileSuccess] = useState('');
  const [fileError, setFileError] = useState('');

  // IT Supervision State
  const [securityLogs, setSecurityLogs] = useState([]);
  const [backupResult, setBackupResult] = useState(null);
  const [cleaningResult, setCleaningResult] = useState(null);
  const [supervisionLoading, setSupervisionLoading] = useState(false);

  // Headers for backend calls
  const apiHeaders = {
    'Content-Type': 'application/json',
    'X-User-Name': user?.username || 'anonymous',
    'X-User-Role': user?.role || 'Guest'
  };

  // 1. Fetch properties
  const fetchProperties = async () => {
    try {
      const response = await fetch('http://4.251.144.215:5000/api/properties');
      if (!response.ok) throw new Error("Erreur de chargement des biens");
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setPropError(err.message);
    }
  };

  // 2. Fetch NTFS folder contents
  const fetchFolderContents = async (folderName) => {
    setNtfsDenied(false);
    setNtfsErrorMsg('');
    setFolderFiles([]);
    
    try {
      const url = `http://4.251.144.215:5000/api/files?folder=${encodeURIComponent(folderName)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: apiHeaders
      });
      const data = await response.json();

      if (response.status === 403) {
        setNtfsDenied(true);
        setNtfsErrorMsg(data.error);
        return;
      }

      if (!response.ok) throw new Error(data.error || "Erreur NTFS");

      setFolderFiles(data.files);
      setFolderPermission(data.permission);
    } catch (err) {
      setNtfsDenied(true);
      setNtfsErrorMsg(err.message);
    }
  };

  // 3. Fetch security logs (IT only)
  const fetchSecurityLogs = async () => {
    if (user?.role !== 'IT et Support') return;
    try {
      const response = await fetch('http://4.251.144.215:5000/api/logs', {
        headers: apiHeaders
      });
      if (!response.ok) throw new Error("Erreur lors de la lecture des logs");
      const data = await response.json();
      setSecurityLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFolderContents(selectedFolder);
    fetchSecurityLogs();
  }, [selectedFolder, activeTab]);

  // Handle Add Property Submit
  const handleAddProperty = async (e) => {
    e.preventDefault();
    setPropError('');
    setPropSuccess('');

    try {
      const response = await fetch('http://4.251.144.215:5000/api/properties', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(newProp)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur de création");

      setPropSuccess("Le bien a été ajouté avec succès.");
      setShowAddForm(false);
      setNewProp({
        title: '', location: '', price: '', beds: 0, baths: 0, sqft: '', tag: '', type: 'appartement'
      });
      fetchProperties();
    } catch (err) {
      setPropError(err.message);
    }
  };

  // Handle Sell Property Submit
  const handleSellProperty = async (e) => {
    e.preventDefault();
    setPropError('');
    setPropSuccess('');

    try {
      const response = await fetch(`http://4.251.144.215:5000/api/properties/${sellModalId}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({ status: 'vendu', buyer_name: buyerName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur d'enregistrement");

      setPropSuccess("La vente a été enregistrée avec succès. Commission générée.");
      setSellModalId(null);
      setBuyerName('');
      fetchProperties();
    } catch (err) {
      setPropError(err.message);
    }
  };

  // Handle Delete Property
  const handleDeleteProperty = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) return;
    setPropError('');
    setPropSuccess('');

    try {
      const response = await fetch(`http://4.251.144.215:5000/api/properties/${id}`, {
        method: 'DELETE',
        headers: apiHeaders
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur de suppression");

      setPropSuccess("Le bien a été retiré avec succès.");
      fetchProperties();
    } catch (err) {
      setPropError(err.message);
    }
  };

  // Handle Upload File (NTFS)
  const handleUploadFile = async (e) => {
    e.preventDefault();
    setFileError('');
    setFileSuccess('');

    const formData = new FormData();
    formData.append('folder', selectedFolder);
    formData.append('filename', newFile.name);
    formData.append('size_bytes', newFile.sizeKb * 1024);

    try {
      // Pour contourner le multipart headers en fetch
      const headers = { ...apiHeaders };
      delete headers['Content-Type']; // Laisser le navigateur configurer boundary

      const response = await fetch('http://4.251.144.215:5000/api/files', {
        method: 'POST',
        headers: headers,
        body: formData
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erreur d'envoi NTFS");

      setFileSuccess("Fichier enregistré en BDD et écrit sur le serveur de fichiers.");
      setUploadFileModal(false);
      setNewFile({ name: '', sizeKb: 150 });
      fetchFolderContents(selectedFolder);
    } catch (err) {
      setFileError(err.message);
    }
  };

  // Handle Delete File (NTFS)
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const response = await fetch(`http://4.251.144.215:5000/api/files/${fileId}`, {
        method: 'DELETE',
        headers: apiHeaders
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erreur NTFS");

      fetchFolderContents(selectedFolder);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle IT database backup
  const handleBackup = async () => {
    setBackupResult(null);
    supervisionLoading(true);
    try {
      const response = await fetch('http://4.251.144.215:5000/api/admin/backup', {
        method: 'POST',
        headers: apiHeaders
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBackupResult(data);
      fetchSecurityLogs();
    } catch (err) {
      alert(err.message);
    } finally {
      supervisionLoading(false);
    }
  };

  // Handle IT data cleaning run
  const handleCleanData = async () => {
    setCleaningResult(null);
    supervisionLoading(true);
    try {
      const response = await fetch('http://4.251.144.215:5000/api/admin/clean-data', {
        method: 'POST',
        headers: apiHeaders
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCleaningResult(data);
      fetchSecurityLogs();
      fetchProperties(); // Mettre à jour la grille de biens si certains ont été mis à jour
    } catch (err) {
      alert(err.message);
    } finally {
      supervisionLoading(false);
    }
  };

  // Formats bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const folders = [
    "Direction",
    "Commercial",
    "Communication & Marketing",
    "Administratif - RH - Juridique",
    "IT et Support"
  ];

  const canManageProperties = user?.role === 'Commercial' || user?.role === 'Direction';
  const isIT = user?.role === 'IT et Support';

  return (
    <div className="agency-space container animate-fade-in">
      <div className="agency-header glass-panel">
        <div className="user-profile-summary">
          <div className="user-avatar">{user?.name[0]}</div>
          <div className="user-details">
            <h2>Bienvenue, {user?.name}</h2>
            <p>Session active • Rôle NTFS : <span className="text-accent font-bold">{user?.role}</span></p>
          </div>
        </div>

        <div className="agency-tabs">
          <button 
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Gestion des Biens
          </button>
          <button 
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Dossiers Partagés (NTFS)
          </button>
          {isIT && (
            <button 
              className={`tab-btn ${activeTab === 'supervision' ? 'active' : ''}`}
              onClick={() => setActiveTab('supervision')}
              style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}
            >
              Supervision IT & Logs
            </button>
          )}
        </div>
      </div>

      {/* --- PANNEAU GESTION IMMOBILIÈRE --- */}
      {activeTab === 'properties' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>Portefeuille de Biens Immobiliers</h3>
            {canManageProperties ? (
              <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus size={18} style={{ marginRight: '6px' }} />
                Nouveau Bien
              </button>
            ) : (
              <span className="badge-ro">Lecture Seule</span>
            )}
          </div>

          {propError && <div className="alert alert-error">{propError}</div>}
          {propSuccess && <div className="alert alert-success">{propSuccess}</div>}

          {/* Formulaire ajout */}
          {showAddForm && (
            <form onSubmit={handleAddProperty} className="glass-panel add-property-form animate-fade-in">
              <h4>Ajouter une nouvelle propriété au catalogue</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Titre de l'annonce</label>
                  <input type="text" placeholder="Villa d'exception..." required
                    value={newProp.title} onChange={e => setNewProp({...newProp, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Type de bien</label>
                  <select value={newProp.type} onChange={e => setNewProp({...newProp, type: e.target.value})}>
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="commercial">Local Commercial</option>
                    <option value="terrain">Terrain</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Localisation (Ville, Code Postal)</label>
                  <input type="text" placeholder="Aix-en-Provence, 13100" required
                    value={newProp.location} onChange={e => setNewProp({...newProp, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Prix (€)</label>
                  <input type="number" placeholder="450000" required
                    value={newProp.price} onChange={e => setNewProp({...newProp, price: e.target.value})} />
                </div>
              </div>

              <div className="form-row three-cols">
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input type="number" placeholder="120" required
                    value={newProp.sqft} onChange={e => setNewProp({...newProp, sqft: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Chambres</label>
                  <input type="number" placeholder="3"
                    value={newProp.beds} onChange={e => setNewProp({...newProp, beds: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Salles de bain</label>
                  <input type="number" placeholder="2"
                    value={newProp.baths} onChange={e => setNewProp({...newProp, baths: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tag / Label (Optionnel)</label>
                  <input type="text" placeholder="Exclusivité, Coup de Coeur"
                    value={newProp.tag} onChange={e => setNewProp({...newProp, tag: e.target.value})} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Enregistrer le bien</button>
                <button type="button" className="btn-outline" onClick={() => setShowAddForm(false)}>Annuler</button>
              </div>
            </form>
          )}

          {/* Modal Vendre */}
          {sellModalId !== null && (
            <div className="modal-backdrop">
              <form onSubmit={handleSellProperty} className="glass-panel modal-card animate-fade-in">
                <h4>Confirmer la transaction de vente</h4>
                <p>Le bien sera marqué comme "vendu" et retiré du catalogue public. Une transaction de vente sera enregistrée en base de données.</p>
                <div className="form-group">
                  <label>Nom de l'acheteur</label>
                  <input type="text" placeholder="Ex: M. Jean Dupont" required value={buyerName} onChange={e => setBuyerName(e.target.value)} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Valider la Vente</button>
                  <button type="button" className="btn-outline" onClick={() => setSellModalId(null)}>Annuler</button>
                </div>
              </form>
            </div>
          )}

          {/* Grille de biens */}
          <div className="agency-properties-grid">
            {properties.map(prop => (
              <div key={prop.id} className={`agency-prop-card glass-panel ${prop.status === 'vendu' ? 'sold' : ''}`}>
                <div className="prop-img-container">
                  <img src={prop.image_url} alt={prop.title} />
                  <span className={`status-badge ${prop.status}`}>{prop.status}</span>
                </div>
                <div className="prop-details">
                  <h4>{prop.title}</h4>
                  <p className="location">{prop.location}</p>
                  <p className="price">{parseFloat(prop.price).toLocaleString()} €</p>
                  <p className="features">{prop.sqft} m² • {prop.beds} Ch. • {prop.baths} Sdb.</p>
                  
                  {canManageProperties && (
                    <div className="prop-actions">
                      {prop.status === 'disponible' && (
                        <button className="btn-sell" onClick={() => setSellModalId(prop.id)}>
                          Enregistrer Vente
                        </button>
                      )}
                      <button className="btn-delete-icon" title="Supprimer le bien" onClick={() => handleDeleteProperty(prop.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PANNEAU DOSSIERS PARTAGÉS (NTFS) --- */}
      {activeTab === 'files' && (
        <div className="tab-content files-content">
          <div className="files-layout">
            {/* Sidebar dossiers */}
            <div className="folders-sidebar glass-panel">
              <h4>Dossiers Réseau</h4>
              <div className="folders-list">
                {folders.map((folder, idx) => (
                  <button 
                    key={idx}
                    className={`folder-btn ${selectedFolder === folder ? 'active' : ''}`}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <Folder size={20} className="folder-icon" />
                    <span>{folder}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Explorateur de fichiers */}
            <div className="files-explorer glass-panel">
              {ntfsDenied ? (
                <div className="ntfs-denied-panel animate-fade-in">
                  <ShieldAlert size={64} className="error-icon" />
                  <h4>Alerte de Sécurité - Accès NTFS Refusé</h4>
                  <p className="error-desc">{ntfsErrorMsg}</p>
                  <div className="alert-meta">
                    <p><strong>Tentative bloquée pour :</strong> {user?.name} ({user?.role})</p>
                    <p><strong>Dossier cible :</strong> {selectedFolder}</p>
                    <p className="warning-text">⚠️ Cette intrusion a été consignée dans le journal d'audit de l'administrateur système.</p>
                  </div>
                </div>
              ) : (
                <div className="ntfs-allowed-panel animate-fade-in">
                  <div className="explorer-header">
                    <div className="title-area">
                      <Folder size={24} className="title-icon" />
                      <h3>Partage : {selectedFolder}</h3>
                    </div>
                    
                    <div className="permissions-badge">
                      {folderPermission === 'RW' ? (
                        <span className="badge-rw"><Unlock size={14} /> Lecture & Écriture</span>
                      ) : (
                        <span className="badge-ro"><Lock size={14} /> Lecture Seule</span>
                      )}
                    </div>
                  </div>

                  <div className="explorer-actions">
                    {folderPermission === 'RW' ? (
                      <button className="btn-primary" onClick={() => setUploadFileModal(true)}>
                        <Upload size={16} style={{ marginRight: '6px' }} />
                        Téléverser un document
                      </button>
                    ) : (
                      <span className="info-text">Vous n'avez pas l'autorisation d'écriture dans ce répertoire.</span>
                    )}
                  </div>

                  {/* Liste des fichiers */}
                  <table className="files-table">
                    <thead>
                      <tr>
                        <th>Nom du fichier</th>
                        <th>Taille</th>
                        <th>Ajouté par</th>
                        <th>Date de création</th>
                        {folderPermission === 'RW' && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {folderFiles.length === 0 ? (
                        <tr>
                          <td colSpan={folderPermission === 'RW' ? 5 : 4} className="empty-row">
                            Aucun document dans ce dossier.
                          </td>
                        </tr>
                      ) : (
                        folderFiles.map(file => (
                          <tr key={file.id}>
                            <td className="file-name">
                              <FileText size={18} className="file-icon" />
                              <span>{file.filename}</span>
                            </td>
                            <td>{formatBytes(file.size_bytes)}</td>
                            <td>{file.uploader_name}</td>
                            <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                            {folderPermission === 'RW' && (
                              <td>
                                <button className="btn-delete-file" onClick={() => handleDeleteFile(file.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal Upload File */}
          {uploadFileModal && (
            <div className="modal-backdrop">
              <form onSubmit={handleUploadFile} className="glass-panel modal-card animate-fade-in">
                <h4>Téléverser un document dans : {selectedFolder}</h4>
                {fileError && <div className="alert alert-error">{fileError}</div>}
                <div className="form-group">
                  <label>Nom du fichier (avec extension)</label>
                  <input type="text" placeholder="Ex: Rapport_Commercial_Q3.pdf" required
                    value={newFile.name} onChange={e => setNewFile({...newFile, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Taille du fichier (Ko)</label>
                  <input type="number" required
                    value={newFile.sizeKb} onChange={e => setNewFile({...newFile, sizeKb: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Confirmer l'envoi</button>
                  <button type="button" className="btn-outline" onClick={() => setUploadFileModal(false)}>Annuler</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- PANNEAU SUPERVISION (IT ONLY) --- */}
      {activeTab === 'supervision' && isIT && (
        <div className="tab-content supervision-content">
          <div className="supervision-grid">
            <div className="supervision-actions-panel glass-panel">
              <h3>Administration Système & Base de Données</h3>
              <p className="section-subtitle">Outils d'infrastructure virtuelle et de gestion de données.</p>
              
              <div className="action-buttons-group">
                <button className="super-action-btn" onClick={handleBackup} disabled={supervisionLoading}>
                  <HardDrive className="btn-icon" />
                  <div>
                    <strong>Sauvegarde de Base de Données</strong>
                    <span>Crée un backup à chaud de `y_plaza.db`</span>
                  </div>
                </button>

                <button className="super-action-btn" onClick={handleCleanData} disabled={supervisionLoading}>
                  <Database className="btn-icon" />
                  <div>
                    <strong>Nettoyage & Importation des Données (Python IA)</strong>
                    <span>Exécute le nettoyage automatique du CSV brut des ventes et l'importe en BDD</span>
                  </div>
                </button>
              </div>

              {backupResult && (
                <div className="supervision-result glass-panel success animate-fade-in">
                  <ShieldCheck size={24} className="res-icon" />
                  <div>
                    <h4>Sauvegarde Réussie !</h4>
                    <p>Fichier créé : <code>{backupResult.backup_file}</code> ({formatBytes(backupResult.size_bytes)})</p>
                    <span className="timestamp">Le {new Date(backupResult.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {cleaningResult && (
                <div className="supervision-result glass-panel success animate-fade-in">
                  <Database size={24} className="res-icon" />
                  <div>
                    <h4>Nettoyage Terminé !</h4>
                    <p>{cleaningResult.message}</p>
                    <span className="badge-rw">{cleaningResult.cleaned_records_count} enregistrements importés</span>
                  </div>
                </div>
              )}
            </div>

            {/* Logs de sécurité */}
            <div className="security-logs-panel glass-panel">
              <div className="logs-header">
                <h3>Journal d'Audit NTFS & Sécurité</h3>
                <button className="btn-refresh" onClick={fetchSecurityLogs}>
                  <RefreshCw size={16} /> Rafraîchir
                </button>
              </div>
              <p className="section-subtitle">Surveillance en temps réel des accès réseau (bloqués et autorisés).</p>

              <div className="logs-table-wrapper">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Date / Heure</th>
                      <th>Utilisateur</th>
                      <th>Rôle</th>
                      <th>Dossier</th>
                      <th>Action</th>
                      <th>Statut NTFS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-row">Aucun log enregistré.</td>
                      </tr>
                    ) : (
                      securityLogs.map(log => (
                        <tr key={log.id} className={log.status === 'BLOCKED' ? 'blocked-log' : ''}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td><strong>{log.username}</strong></td>
                          <td>{log.role}</td>
                          <td><code>{log.folder}</code></td>
                          <td>{log.action}</td>
                          <td className="status-cell">
                            {log.status === 'BLOCKED' ? (
                              <span className="log-status blocked">⚠️ REFUSÉ</span>
                            ) : (
                              <span className="log-status success">🟢 ACCORDÉ</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
