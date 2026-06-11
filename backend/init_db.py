import sqlite3
import os
import hashlib
import csv
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "y_plaza.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")
DIRTY_CSV_PATH = os.path.join(os.path.dirname(__file__), "dirty_sales_data.csv")

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    print(f"Initialisation de la base de données : {DB_PATH}")
    
    # Suppression de l'ancienne BDD si elle existe pour repartir à propre
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Ancienne base de données supprimée.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Lecture et exécution du schéma SQL
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema = f.read()
    
    cursor.executescript(schema)
    conn.commit()
    print("Schéma appliqué avec succès.")

    # 1. Insertion des utilisateurs (avec mots de passe hashés par SHA-256)
    # Les logins correspondent aux rôles : username = password
    users_data = [
        ("claire", hash_password("claire"), "Claire Valin", "Direction", "claire.valin@y-plaza.fr"),
        ("lucas", hash_password("lucas"), "Lucas Martin", "Commercial", "lucas.martin@y-plaza.fr"),
        ("sarah", hash_password("sarah"), "Sarah Laurent", "Communication & Marketing", "sarah.laurent@y-plaza.fr"),
        ("pierre", hash_password("pierre"), "Pierre Dubois", "Administratif - RH - Juridique", "pierre.dubois@y-plaza.fr"),
        ("david", hash_password("david"), "David Giraud", "IT et Support", "david.giraud@y-plaza.fr")
    ]

    cursor.executemany(
        "INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)",
        users_data
    )
    conn.commit()
    print("Utilisateurs de test insérés.")

    # 2. Insertion des propriétés (disponibles et vendues)
    properties_data = [
        # Disponibles
        ("Villa Moderne avec Piscine", "Aix-en-Provence, 13100", 1250000.0, 4, 3, 220.0, "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", "Exclusivité", "maison", "disponible"),
        ("Appartement Haussmannien", "Paris, 75008", 2100000.0, 3, 2, 150.0, "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80", "Nouveau", "appartement", "disponible"),
        ("Maison d'Architecte", "Lyon, 69006", 980000.0, 5, 4, 280.0, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", "Coup de Cœur", "maison", "disponible"),
        ("Bureaux Neufs", "Marseille, 13002", 450000.0, 0, 2, 120.0, "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80", "Zone Franche", "commercial", "disponible"),
        ("Terrain Constructible", "Aix-en-Provence, 13090", 180000.0, 0, 0, 600.0, "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80", "Libre Constructeur", "terrain", "disponible"),
        ("Appartement Cosy", "Toulouse, 31000", 240000.0, 2, 1, 65.0, "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80", None, "appartement", "disponible"),
        
        # Vendus (historique pour l'analyse)
        ("Studio meublé hypercentre", "Aix-en-Provence, 13100", 150000.0, 1, 1, 28.0, "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80", None, "appartement", "vendu"),
        ("Villa vue mer", "Nice, 06000", 3200000.0, 6, 5, 350.0, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", None, "maison", "vendu"),
        ("Local commercial", "Paris, 75002", 850000.0, 0, 1, 95.0, "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", None, "commercial", "vendu"),
        ("Maison de village", "Aix-en-Provence, 13100", 420000.0, 3, 2, 110.0, "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80", None, "maison", "vendu"),
        ("Duplex contemporain", "Lyon, 69002", 680000.0, 3, 2, 105.0, "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=800&q=80", None, "appartement", "vendu")
    ]

    cursor.executemany(
        """INSERT INTO properties 
        (title, location, price, beds, baths, sqft, image_url, tag, type, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        properties_data
    )
    conn.commit()
    print("Propriétés insérées.")

    # 3. Insertion des ventes (reliées aux biens vendus, agent_id = 2 pour Lucas Martin)
    # Pour simplifier les ID :
    # Studio Aix (ID 7) -> vendu 148,000 € (commission 5% = 7,400 €)
    # Villa Nice (ID 8) -> vendu 3,100,000 € (commission 4% = 124,000 €)
    # Local Paris (ID 9) -> vendu 820,000 € (commission 6% = 49,200 €)
    # Maison village Aix (ID 10) -> vendu 410,000 € (commission 5% = 20,500 €)
    # Duplex Lyon (ID 11) -> vendu 670,000 € (commission 5% = 33,500 €)
    sales_data = [
        (7, 2, 148000.0, "2026-01-15", "Jean Dupont", 7400.0),
        (8, 2, 3100000.0, "2026-02-28", "SCI Riviera", 124000.0),
        (9, 2, 820000.0, "2026-03-12", "Société Alpha", 49200.0),
        (10, 2, 410000.0, "2026-04-20", "Marie Legrand", 20500.0),
        (11, 2, 670000.0, "2026-05-05", "Robert Martin", 33500.0)
    ]

    cursor.executemany(
        """INSERT INTO sales 
        (property_id, agent_id, sale_price, sale_date, buyer_name, commission) 
        VALUES (?, ?, ?, ?, ?, ?)""",
        sales_data
    )
    conn.commit()
    print("Ventes insérées.")

    # 4. Fichiers partagés par défaut (pour le simulateur NTFS)
    # Note : uploaded_by = 1 (Direction) ou 5 (IT)
    files_data = [
        ("Strategie_Annuelle_2026.pdf", "Direction", 2453000, 1, "backend/storage/Direction/Strategie_Annuelle_2026.pdf"),
        ("Comptes_Consolides_Q1.xlsx", "Direction", 1542000, 1, "backend/storage/Direction/Comptes_Consolides_Q1.xlsx"),
        
        ("Fiches_Estimation_Biens.pdf", "Commercial", 1024000, 2, "backend/storage/Commercial/Fiches_Estimation_Biens.pdf"),
        ("Contrats_Vente_Types.docx", "Commercial", 512000, 2, "backend/storage/Commercial/Contrats_Vente_Types.docx"),
        
        ("Charte_Graphique_YPlaza_v2.pdf", "Communication & Marketing", 5890000, 3, "backend/storage/Communication & Marketing/Charte_Graphique_YPlaza_v2.pdf"),
        ("Campagne_Aix_2026.pptx", "Communication & Marketing", 12500000, 3, "backend/storage/Communication & Marketing/Campagne_Aix_2026.pptx"),
        
        ("Reglement_Interieur_2026.pdf", "Administratif - RH - Juridique", 850000, 4, "backend/storage/Administratif - RH - Juridique/Reglement_Interieur_2026.pdf"),
        ("Fiche_Poste_Commercial.pdf", "Administratif - RH - Juridique", 432000, 4, "backend/storage/Administratif - RH - Juridique/Fiche_Poste_Commercial.pdf"),
        
        ("Plan_Adressage_Reseau.xlsx", "IT et Support", 312000, 5, "backend/storage/IT et Support/Plan_Adressage_Reseau.xlsx"),
        ("Procedure_Restauration_Backup.pdf", "IT et Support", 1250000, 5, "backend/storage/IT et Support/Procedure_Restauration_Backup.pdf")
    ]

    cursor.executemany(
        """INSERT INTO shared_files 
        (filename, folder, size_bytes, uploaded_by, file_path) 
        VALUES (?, ?, ?, ?, ?)""",
        files_data
    )
    conn.commit()
    print("Fichiers partagés insérés.")

    # Créer les dossiers de stockage virtuels s'ils n'existent pas
    for folder in ['Direction', 'Commercial', 'Communication & Marketing', 'Administratif - RH - Juridique', 'IT et Support']:
        path = os.path.join(os.path.dirname(__file__), "storage", folder)
        os.makedirs(path, exist_ok=True)
        # Création d'un petit fichier vide pour simuler la présence physique du fichier
        for item in files_data:
            if item[1] == folder:
                fpath = os.path.join(os.path.dirname(__file__), "storage", folder, item[0])
                with open(fpath, "w") as f:
                    f.write("Simulated file content")

    conn.close()
    print("Base de données initialisée à 100% avec succès.")

    # 5. Génération du fichier CSV "sales" (dirty_sales_data.csv) pour le module de nettoyage
    generate_dirty_csv()


def generate_dirty_csv():
    print(f"Génération du CSV de ventes brut (dirty data) : {DIRTY_CSV_PATH}")
    rows = [
        ["property_title", "location", "price", "sale_date", "buyer_name", "agent_name"],
        ["Villa Moderne avec Piscine", "Aix-en-Provence, 13100", "1250000", "2026-06-01", "M. Dupont", "Lucas Martin"],
        ["Appartement Haussmannien", "Paris, 75008", "2100000", "2026-05-15", "Mme. Riviere", "Lucas Martin"],
        ["Maison d'Architecte", "Lyon, 69006", "980000", "12/05/2026", "M. Legrand", "Lucas Martin"],  # Date mal formatée
        ["Maison d'Architecte", "Lyon, 69006", "980000", "12/05/2026", "M. Legrand", "Lucas Martin"],  # Doublon exact
        ["Studio meublé hypercentre", "Aix-en-Provence", "150000", "2026-04-10", "M. Petit", "Lucas Martin"],
        ["Villa vue mer", "Nice, 06000", "3200000", "2026-02-28", "SCI Riviera", "Lucas Martin"],
        ["Local commercial", "Paris", "", "2026-03-12", "Société Alpha", "Lucas Martin"],  # Prix manquant
        ["Maison de village", "Aix-en-Provence, 13100", "420000", "2026-04-20", "", "Lucas Martin"],  # Acheteur manquant
        ["Duplex contemporain", "Lyon, 69002", "68000000", "2026-05-05", "M. Martin", "Lucas Martin"],  # Prix aberrant (outlier)
        ["Terrain Constructible", "Aix-en-Provence, 13090", "180000", "2026-01-30", "M. Blanc", "Lucas Martin"]
    ]

    with open(DIRTY_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print("CSV brut généré.")

if __name__ == "__main__":
    init_db()
