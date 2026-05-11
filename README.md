# Plateforme Web Y-Plaza

Bienvenue sur le projet web de Y-Plaza, une plateforme immobilière innovante intégrant l'Intelligence Artificielle et une expérience utilisateur premium. 

Ce projet a été développé avec **React** et **Vite** dans le cadre de l'UF DEV B2.

## Comment lancer le projet

### Prérequis
Assurez-vous d'avoir installé **Node.js** (version 16 ou supérieure recommandée) sur votre machine.

### Installation

1. Ouvrez un terminal dans le dossier du projet (`y-plaza-web`).
2. Installez les dépendances nécessaires en exécutant la commande suivante :
   ```bash
   npm install
   ```

### Lancement du serveur de développement

Pour démarrer l'application en local et voir le site :

1. Exécutez la commande :
   ```bash
   npm run dev
   ```
2. Ouvrez votre navigateur et rendez-vous à l'adresse indiquée (généralement `http://127.0.0.1:5173/`).

## Compilation pour la Production

Pour déployer le site sur un serveur web dans la DMZ (ex: Nginx, Apache ou IIS), vous devrez générer les fichiers optimisés.

1. Lancez la compilation :
   ```bash
   npm run build
   ```
2. Le dossier `dist/` sera créé. Il contient tous les fichiers statiques (HTML, CSS, JS, Vidéo) que vous devez copier sur votre serveur web.
