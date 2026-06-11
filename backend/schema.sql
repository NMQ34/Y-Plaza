-- Schéma de base de données relationnelle Y-Plaza

-- Désactivation des clés étrangères temporairement pour la création
PRAGMA foreign_keys = ON;

-- Table des utilisateurs / employés de l'agence
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Stocké en clair ou en hash (pour la démo, hash simple ou texte)
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Direction', 'Commercial', 'Communication & Marketing', 'Administratif - RH - Juridique', 'IT et Support')),
    email TEXT NOT NULL
);

-- Table des biens immobiliers
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    price REAL NOT NULL,
    beds INTEGER NOT NULL,
    baths INTEGER NOT NULL,
    sqft REAL NOT NULL,
    image_url TEXT NOT NULL,
    tag TEXT, -- Ex: Exclusivité, Coup de cœur, Nouveau
    type TEXT NOT NULL CHECK(type IN ('appartement', 'maison', 'commercial', 'terrain')),
    status TEXT NOT NULL DEFAULT 'disponible' CHECK(status IN ('disponible', 'vendu')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des ventes (transactions) pour l'analyse
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    sale_price REAL NOT NULL,
    sale_date TEXT NOT NULL, -- Format YYYY-MM-DD
    buyer_name TEXT NOT NULL,
    commission REAL NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des fichiers partagés (Simulateur NTFS)
CREATE TABLE IF NOT EXISTS shared_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    folder TEXT NOT NULL CHECK(folder IN ('Direction', 'Commercial', 'Communication & Marketing', 'Administratif - RH - Juridique', 'IT et Support')),
    size_bytes INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT NOT NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des journaux d'accès de sécurité (Audit Trail)
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    folder TEXT NOT NULL,
    action TEXT NOT NULL, -- 'READ', 'WRITE', 'DELETE', 'DENIED'
    status TEXT NOT NULL, -- 'SUCCESS', 'BLOCKED'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création d'index pour optimiser les requêtes (SQL Avancé)
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_shared_files_folder ON shared_files(folder);
