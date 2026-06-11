# Plateforme Web Y-Plaza

Bienvenue sur la plateforme web centralisée de **Y-Plaza**, un groupe immobilier spécialisé dans les biens résidentiels et professionnels d'exception. Cette plateforme moderne intègre une base de données relationnelle, un module d'analyse prédictive (IA) en Python et une simulation complète de la sécurité NTFS pour les dossiers partagés de l'agence.

---

## 🏗️ Architecture Technique

L'application suit une architecture orientée services (SOA) claire :

1.  **Frontend (Vite / React)** :
    *   Design moderne avec effet de verre (glassmorphism), transitions animées (`framer-motion`) et lecteur vidéo en arrière-plan.
    *   Interfaces responsive (Desktop, Tablette, Smartphone).
    *   Pages publiques (Accueil, Grille dynamique de biens, Détails de biens & Proposition d'acquisition) et Espace Collaborateur sécurisé.
2.  **Backend (Python / Flask / SQLite3)** :
    *   API REST servant de passerelle de services.
    *   Base de données relationnelle SQLite (`y_plaza.db`) avec indexations avancées, clés étrangères et contraintes pour modéliser le portefeuille, les ventes, les fichiers et les logs.
3.  **Module IA & Statistiques (Python / Pandas / NumPy)** :
    *   **Nettoyage de données** : Script d'intégration qui ingère un CSV brut, filtre les doublons, traite les valeurs manquantes et élimine les valeurs aberrantes (outliers) par seuil statistique.
    *   **Modèle Prédictif (IA)** : Algorithme d'apprentissage supervisé de **régression linéaire multivariée** (moindres carrés via `numpy.linalg.lstsq`) entraîné à la volée sur la base de données. Il estime le prix d'un bien selon sa surface, son nombre de chambres/bains et un encodage One-Hot de sa localisation.

---

## 🔒 Simulateur de Droits d'Accès NTFS

L'**Espace Agence** intègre un simulateur fidèle de la matrice de droits NTFS du cahier des charges :
*   Les répertoires réseau (`Direction`, `Commercial`, `Communication & Marketing`, `Administratif - RH - Juridique`, `IT et Support`) appliquent strictement les permissions de lecture/écriture.
*   Toute tentative d'accès bloqué (ex: un Commercial accédant au répertoire Direction) est interceptée par le backend, lève un code HTTP `403 Forbidden`, affiche un écran rouge d'alerte sécurité NTFS et logue l'événement en base de données.
*   Une console de supervision IT permet de suivre en temps réel ce journal d'audit de sécurité (`access_logs`).

---

## 🚀 Comment lancer le projet

### 1. Prérequis
*   **Node.js** (version 16 ou supérieure recommandée)
*   **Python** (version 3.10 ou supérieure) avec les dépendances `flask`, `flask-cors`, `pandas` et `numpy`.

### 2. Démarrage du Backend et de la BDD

1.  Ouvrez un terminal dans le dossier `backend/`.
2.  Installez les dépendances Python requises :
    ```bash
    pip install flask flask-cors pandas numpy
    ```
3.  Initialisez la base de données et le CSV d'analyse :
    ```bash
    python init_db.py
    ```
4.  Lancez le serveur d'API Flask :
    ```bash
    python app.py
    ```
    *Le serveur démarre sur `http://127.0.0.1:5000`.*

### 3. Démarrage du Frontend React

1.  Ouvrez un second terminal dans le dossier racine du projet (`y-plaza-web`).
2.  Installez les dépendances npm :
    ```bash
    npm install
    ```
3.  Lancez le serveur de développement :
    ```bash
    npm run dev
    ```
4.  Ouvrez votre navigateur sur `http://127.0.0.1:5173/`.

### 4. Compilation pour la Production
Pour générer les fichiers statiques optimisés pour le déploiement final (sur Nginx, Apache ou IIS) :
```bash
npm run build
```
Les fichiers compilés seront disponibles dans le dossier `dist/`.

---

## 🧠 Zoom sur l'IA : Est-ce vraiment de l'IA ?

**Oui, c'est du Machine Learning (apprentissage supervisé).** 
Plutôt que d'utiliser des coefficients fixes ou des règles arbitraires codées en dur, l'estimateur de prix utilise l'algorithme de **régression linéaire multivariée**.

1.  **Entraînement (`data_analyzer.py`)** : Le modèle prend en entrée le vecteur de caractéristiques $X$ (constante d'ordonnée à l'origine, surface habitable, nombre de chambres, nombre de salles de bain) et effectue un encodage matriciel (One-Hot) des villes pour intégrer l'impact géographique.
2.  **Apprentissage (Moindres Carrés)** : Il calcule les coefficients optimaux $\beta$ en résolvant l'équation normale de régression :
    $$\beta = (X^T \cdot X)^{-1} \cdot X^T \cdot y$$
    où $y$ représente le prix réel des biens en base.
3.  **Inférence (Prédiction)** : Lors d'une saisie utilisateur sur le tableau de bord, le modèle multiplie le vecteur saisi par les coefficients $\beta$ appris pour déduire la valeur estimée. Le modèle se ré-entraîne automatiquement à chaque ajout de bien ou vente validée.

