import pandas as pd
import numpy as np
import os
import sqlite3
from datetime import datetime

# Chemins des fichiers
DIR_PATH = os.path.dirname(__file__)
DB_PATH = os.path.join(DIR_PATH, "y_plaza.db")
DIRTY_CSV_PATH = os.path.join(DIR_PATH, "dirty_sales_data.csv")
CLEANED_CSV_PATH = os.path.join(DIR_PATH, "cleaned_sales_data.csv")

class DataAnalyzer:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path

    def clean_sales_csv(self, raw_path=DIRTY_CSV_PATH, cleaned_path=CLEANED_CSV_PATH):
        """
        Nettoie le fichier CSV brut des ventes (dirty_sales_data.csv) :
        - Suppression des doublons
        - Traitement des valeurs manquantes (imputation ou suppression)
        - Formatage uniforme des dates
        - Détection et suppression des valeurs aberrantes (outliers)
        """
        print(f"Début du nettoyage du fichier CSV : {raw_path}")
        
        # 1. Chargement des données
        df = pd.read_csv(raw_path, encoding='utf-8')
        print(f"Nombre de lignes initiales : {len(df)}")

        # 2. Suppression des doublons exacts
        df = df.drop_duplicates()
        print(f"Après suppression des doublons : {len(df)}")

        # 3. Traitement des valeurs manquantes (NaN)
        # Supprimer si le prix est manquant (car c'est notre variable cible)
        df = df.dropna(subset=['price'])
        
        # Remplacer d'autres champs manquants par des valeurs par défaut
        df['buyer_name'] = df['buyer_name'].fillna("Acheteur Inconnu")
        print(f"Après traitement des valeurs manquantes : {len(df)}")

        # Convertir le prix en numérique
        df['price'] = pd.to_numeric(df['price'], errors='coerce')
        df = df.dropna(subset=['price'])

        # 4. Uniformisation des dates (DD/MM/YYYY ou YYYY-MM-DD -> YYYY-MM-DD)
        def parse_date(date_str):
            if pd.isna(date_str):
                return datetime.now().strftime('%Y-%m-%d')
            date_str = str(date_str).strip()
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y'):
                try:
                    return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
                except ValueError:
                    continue
            return datetime.now().strftime('%Y-%m-%d')

        df['sale_date'] = df['sale_date'].apply(parse_date)

        # 5. Détection et suppression des valeurs aberrantes (Outliers)
        # Par exemple : un duplex à Lyon avec un prix de 68,000,000 € au lieu de ~680,000 €
        # On peut calculer le prix moyen et exclure ce qui dépasse un certain seuil,
        # ou utiliser une règle simple : éliminer les transactions > 15 000 000 €
        # qui ne sont pas de l'ultra-luxe à Nice ou Paris.
        # Ici on filtre tout prix supérieur à 10 000 000 € sauf s'il s'agit d'une villa très haut de gamme.
        # Plus statistiquement, on peut exclure les prix > Q3 + 3*IQR dans notre échantillon
        q1 = df['price'].quantile(0.25)
        q3 = df['price'].quantile(0.75)
        iqr = q3 - q1
        upper_bound = q3 + 5 * iqr # On utilise 5 pour garder les vrais biens d'exception mais éliminer les fautes de frappe
        
        print(f"Seuil de prix aberrant calculé : {upper_bound} €")
        df_cleaned = df[df['price'] <= upper_bound]
        print(f"Après suppression des valeurs aberrantes (outliers) : {len(df_cleaned)}")

        # Sauvegarde du fichier propre
        df_cleaned.to_csv(cleaned_path, index=False, encoding='utf-8')
        print(f"Fichier nettoyé sauvegardé sous : {cleaned_path}")
        return df_cleaned

    def get_sales_stats(self):
        """
        Calcule des rapports de vente avancés en interrogeant la BDD SQLite (SQL Avancé)
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        stats = {}

        # 1. Total Chiffre d'Affaires et Commission moyenne
        cursor.execute("SELECT SUM(sale_price) as ca, AVG(commission) as comm_moy, COUNT(*) as nb_ventes FROM sales")
        row = cursor.fetchone()
        stats['chiffre_affaires'] = row['ca'] or 0.0
        stats['commission_moyenne'] = round(row['comm_moy'] or 0.0, 2)
        stats['nombre_ventes'] = row['nb_ventes'] or 0

        # 2. Ventes par Ville (location) - SQL JOIN & GROUP BY
        cursor.execute("""
            SELECT 
                SUBSTR(p.location, 1, INSTR(p.location, ',') - 1) as ville,
                SUM(s.sale_price) as ca_ville,
                COUNT(*) as count_ville
            FROM sales s
            JOIN properties p ON s.property_id = p.id
            GROUP BY ville
            ORDER BY ca_ville DESC
        """)
        stats['ventes_par_ville'] = [dict(r) for r in cursor.fetchall()]

        # 3. Répartition Offre vs Demande par type de bien (disponibles vs vendus)
        cursor.execute("""
            SELECT 
                type,
                SUM(CASE WHEN status = 'disponible' THEN 1 ELSE 0 END) as disponible,
                SUM(CASE WHEN status = 'vendu' THEN 1 ELSE 0 END) as vendu
            FROM properties
            GROUP BY type
        """)
        stats['offre_demande'] = [dict(r) for r in cursor.fetchall()]

        # 4. Ventes Mensuelles pour graphiques temporels
        cursor.execute("""
            SELECT 
                STRFTIME('%Y-%m', sale_date) as mois,
                SUM(sale_price) as ca_mois,
                COUNT(*) as count_mois
            FROM sales
            GROUP BY mois
            ORDER BY mois ASC
        """)
        stats['ventes_mensuelles'] = [dict(r) for r in cursor.fetchall()]

        conn.close()
        return stats

    def train_price_predictor(self):
        """
        Entraîne un modèle de régression linéaire multivariée sur les données de la base
        pour estimer le prix des biens en fonction de : surface, chambres, salles de bain, ville.
        Utilise numpy pour la résolution des moindres carrés (A.T * A * x = A.T * b)
        """
        conn = sqlite3.connect(self.db_path)
        
        # Récupération de tous les biens immobiliers (vendus et disponibles) pour entraîner le modèle
        df = pd.read_sql_query("SELECT price, location, sqft, beds, baths, type FROM properties", conn)
        conn.close()

        if len(df) < 5:
            print("Pas assez de données pour entraîner le modèle de prédiction.")
            return None

        # Extraction de la ville
        df['ville'] = df['location'].apply(lambda loc: loc.split(',')[0].strip())

        # Variables indépendantes X et variable dépendante y
        # Encodage One-Hot simple pour les villes (Aix, Paris, Lyon, Nice, Toulouse, Marseille)
        villes_uniques = ['Aix-en-Provence', 'Paris', 'Lyon', 'Nice', 'Toulouse', 'Marseille']
        
        X_data = []
        y_data = []

        for idx, row in df.iterrows():
            # Features : Intercept (1), sqft, beds, baths
            features = [1.0, float(row['sqft']), float(row['beds']), float(row['baths'])]
            # Ajout du One-Hot encoding pour les villes (Aix est la référence si toutes les autres sont 0)
            for v in villes_uniques[1:]:
                features.append(1.0 if row['ville'] == v else 0.0)
            
            X_data.append(features)
            y_data.append(float(row['price']))

        X = np.array(X_data)
        y = np.array(y_data)

        # Calcul des coefficients via l'équation normale (Moindres Carrés) : beta = (X^T * X)^-1 * X^T * y
        try:
            beta = np.linalg.lstsq(X, y, rcond=None)[0]
            self.beta = beta
            self.villes_ref = villes_uniques
            print("Modèle prédictif entraîné avec succès. Coefficients :", beta)
            return beta
        except Exception as e:
            print(f"Erreur d'entraînement du modèle : {e}")
            return None

    def predict_property_price(self, ville, sqft, beds, baths):
        """
        Estime le prix d'un bien en utilisant les coefficients calculés
        """
        # Si le modèle n'a pas été entraîné localement, on l'entraîne
        if not hasattr(self, 'beta'):
            self.train_price_predictor()

        if not hasattr(self, 'beta') or self.beta is None:
            # Fallback sur une estimation basique de prix moyen au m²
            prix_m2 = {"Paris": 12000, "Nice": 8000, "Aix-en-Provence": 5500, "Lyon": 5000, "Toulouse": 3500, "Marseille": 3500}
            base_m2 = prix_m2.get(ville, 4000)
            estimated = sqft * base_m2 + beds * 15000 + baths * 10000
            return round(estimated, 2)

        # Construction du vecteur de caractéristiques
        features = [1.0, float(sqft), float(beds), float(baths)]
        for v in self.villes_ref[1:]:
            features.append(1.0 if ville == v else 0.0)

        # Produit matriciel
        predicted = np.dot(features, self.beta)
        
        # Garder une limite inférieure réaliste (ex: 50 000 €)
        return max(50000.0, round(predicted, 2))

    def get_purchase_zones_forecast(self):
        """
        Calcule les prévisions d'opportunités d'achat (Rentabilité / Taux de croissance des prix)
        """
        # Analyse statistique des prix au m² par ville
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT price, location, sqft, status FROM properties", conn)
        conn.close()

        df['ville'] = df['location'].apply(lambda loc: loc.split(',')[0].strip())
        df['prix_m2'] = df['price'] / df['sqft']

        # Calculer le prix moyen au m² par ville
        avg_m2_by_city = df.groupby('ville')['prix_m2'].mean().to_dict()

        # On simule un taux de croissance / attractivité basé sur la demande locale (nombre de biens vendus vs total)
        zones = []
        for ville in avg_m2_by_city:
            v_data = df[df['ville'] == ville]
            total_biens = len(v_data)
            vendu_biens = len(v_data[v_data['status'] == 'vendu'])
            
            # Attractivité proportionnelle au ratio de vente
            attractivite = (vendu_biens / total_biens) if total_biens > 0 else 0.1
            # Taux de croissance estimé annuel (simulé pour la démo immobilière)
            croissance_est = attractivite * 12.0 + 3.0 # ex: entre 3% et 15%
            
            zones.append({
                "ville": ville,
                "prix_m2_moyen": round(avg_m2_by_city[ville], 2),
                "croissance_annuelle_est": round(croissance_est, 1),
                "attractivite_score": round(attractivite * 10, 1),
                "conseil": "Achat Fort" if croissance_est > 8.0 else "Stable / Conserver" if croissance_est > 5.0 else "Vendre"
            })

        return sorted(zones, key=lambda x: x['croissance_annuelle_est'], reverse=True)


if __name__ == "__main__":
    # Test simple du module
    analyzer = DataAnalyzer()
    
    # Nettoyage
    cleaned_df = analyzer.clean_sales_csv()
    
    # Statistiques
    stats = analyzer.get_sales_stats()
    print("\n--- Statistiques des Ventes ---")
    print(f"Chiffre d'Affaires : {stats['chiffre_affaires']} €")
    print(f"Nombre de ventes : {stats['nombre_ventes']}")
    print(f"Commission moyenne : {stats['commission_moyenne']} €")
    print("Ventes par ville :", stats['ventes_par_ville'])
    
    # Entraînement du modèle de prix
    analyzer.train_price_predictor()
    
    # Test de prédiction
    test_prediction = analyzer.predict_property_price("Aix-en-Provence", 100, 3, 2)
    print(f"\nEstimation prix maison 100m² à Aix (3ch, 2sdb) : {test_prediction} €")
    
    # Prédictions zones
    zones = analyzer.get_purchase_zones_forecast()
    print("\nZones d'achat prédictives :", zones)
