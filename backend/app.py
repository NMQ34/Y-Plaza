from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import os
from datetime import datetime
from data_analyzer import DataAnalyzer

app = Flask(__name__)
# Autoriser toutes les origines (CORS) pour le développement local avec Vite
CORS(app)

DIR_PATH = os.path.dirname(__file__)
DB_PATH = os.path.join(DIR_PATH, "y_plaza.db")

analyzer = DataAnalyzer(DB_PATH)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# Matrice des droits d'accès NTFS (Dossiers Partagés)
# Format : folder -> { role -> 'RW' | 'R' | 'Forbidden' }
NTFS_MATRIX = {
    "Direction": {
        "Direction": "RW",
        "Commercial": "R",
        "Communication & Marketing": "R",
        "Administratif - RH - Juridique": "R",
        "IT et Support": "R"
    },
    "Commercial": {
        "Direction": "Forbidden",
        "Commercial": "RW",
        "Communication & Marketing": "R",
        "Administratif - RH - Juridique": "Forbidden",
        "IT et Support": "Forbidden"
    },
    "Communication & Marketing": {
        "Direction": "Forbidden",
        "Commercial": "R",
        "Communication & Marketing": "RW",
        "Administratif - RH - Juridique": "Forbidden",
        "IT et Support": "Forbidden"
    },
    "Administratif - RH - Juridique": {
        "Direction": "Forbidden",
        "Commercial": "R",
        "Communication & Marketing": "R",
        "Administratif - RH - Juridique": "RW",
        "IT et Support": "Forbidden"
    },
    "IT et Support": {
        "Direction": "Forbidden",
        "Commercial": "R",
        "Communication & Marketing": "R",
        "Administratif - RH - Juridique": "Forbidden",
        "IT et Support": "RW"
    }
}

# --- MIDDLEWARE / HELPER PERMISSIONS ---
def check_ntfs_permission(username, role, folder, action):
    """
    Vérifie les droits NTFS de l'utilisateur sur un dossier partagé.
    action: 'READ' ou 'WRITE'
    """
    if folder not in NTFS_MATRIX:
        return False, "Dossier inconnu"
    
    permission = NTFS_MATRIX[folder].get(role, "Forbidden")
    
    # Log de l'action dans le journal d'accès
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if permission == "Forbidden":
        cursor.execute(
            "INSERT INTO access_logs (username, role, folder, action, status) VALUES (?, ?, ?, ?, ?)",
            (username, role, folder, f"TRY_{action}", "BLOCKED")
        )
        conn.commit()
        conn.close()
        return False, "NTFS Security Exception: Access Denied"
    
    if action == "WRITE" and permission != "RW":
        cursor.execute(
            "INSERT INTO access_logs (username, role, folder, action, status) VALUES (?, ?, ?, ?, ?)",
            (username, role, folder, f"TRY_WRITE", "BLOCKED")
        )
        conn.commit()
        conn.close()
        return False, "NTFS Security Exception: Read-Only Access"
    
    # Succès
    cursor.execute(
        "INSERT INTO access_logs (username, role, folder, action, status) VALUES (?, ?, ?, ?, ?)",
        (username, role, folder, action, "SUCCESS")
    )
    conn.commit()
    conn.close()
    return True, permission


# --- ROUTES AUTHENTIFICATION ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Veuillez fournir un nom d'utilisateur et un mot de passe."}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, name, role, email FROM users WHERE username = ? AND password = ?",
        (username, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "id": user['id'],
            "username": user['username'],
            "name": user['name'],
            "role": user['role'],
            "email": user['email']
        })
    else:
        return jsonify({"error": "Nom d'utilisateur ou mot de passe incorrect."}), 401


# --- ROUTES BIENS IMMOBILIERS ---

@app.route('/api/properties', methods=['GET'])
def get_properties():
    # Paramètres de filtrage optionnels
    status = request.args.get('status') # disponible ou vendu
    p_type = request.args.get('type') # appartement, maison, commercial, terrain
    location = request.args.get('location') # ex: Aix
    
    query = "SELECT * FROM properties WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status)
    if p_type:
        query += " AND type = ?"
        params.append(p_type)
    if location:
        query += " AND location LIKE ?"
        params.append(f"%{location}%")
        
    query += " ORDER BY id DESC"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    properties = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(properties)

@app.route('/api/properties', methods=['POST'])
def add_property():
    role = request.headers.get('X-User-Role')
    if role not in ('Commercial', 'Direction'):
        return jsonify({"error": "Seuls les Commerciaux ou la Direction peuvent ajouter des biens."}), 403
        
    data = request.json or {}
    title = data.get('title')
    location = data.get('location')
    price = data.get('price')
    beds = data.get('beds', 0)
    baths = data.get('baths', 0)
    sqft = data.get('sqft')
    image_url = data.get('image_url')
    tag = data.get('tag')
    p_type = data.get('type')
    
    if not all([title, location, price, sqft, p_type]):
        return jsonify({"error": "Champs obligatoires manquants."}), 400
        
    if not image_url:
        image_url = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO properties 
        (title, location, price, beds, baths, sqft, image_url, tag, type, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible')""",
        (title, location, price, beds, baths, sqft, image_url, tag, p_type)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    
    # Retransmettre le modèle prédictif pour intégrer les nouvelles données
    analyzer.train_price_predictor()
    
    return jsonify({"message": "Bien ajouté avec succès.", "id": new_id}), 201

@app.route('/api/properties/<int:prop_id>', methods=['PUT'])
def update_property(prop_id):
    role = request.headers.get('X-User-Role')
    username = request.headers.get('X-User-Name', 'anonymous')
    if role not in ('Commercial', 'Direction'):
        return jsonify({"error": "Seuls les Commerciaux ou la Direction peuvent modifier des biens."}), 403
        
    data = request.json or {}
    status = data.get('status') # 'vendu' ou 'disponible'
    price = data.get('price')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Récupérer l'état actuel
    cursor.execute("SELECT * FROM properties WHERE id = ?", (prop_id,))
    prop = cursor.fetchone()
    if not prop:
        conn.close()
        return jsonify({"error": "Bien introuvable."}), 404
        
    # Mises à jour
    if price:
        cursor.execute("UPDATE properties SET price = ? WHERE id = ?", (price, prop_id))
    
    # Si le statut passe à 'vendu', on crée une vente
    if status == 'vendu' and prop['status'] != 'vendu':
        cursor.execute("UPDATE properties SET status = 'vendu' WHERE id = ?", (prop_id,))
        
        # Récupérer l'agent_id de Lucas (ou de l'utilisateur connecté)
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        agent = cursor.fetchone()
        agent_id = agent['id'] if agent else 2 # Lucas Martin par défaut
        
        sale_price = price or prop['price']
        sale_date = datetime.now().strftime('%Y-%m-%d')
        buyer_name = data.get('buyer_name', "Acheteur Anonyme")
        commission = round(sale_price * 0.05, 2) # Commission de 5% par défaut
        
        cursor.execute(
            """INSERT INTO sales (property_id, agent_id, sale_price, sale_date, buyer_name, commission)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (prop_id, agent_id, sale_price, sale_date, buyer_name, commission)
        )
        
    elif status == 'disponible' and prop['status'] == 'vendu':
        # Rebasculer en disponible et supprimer de l'historique des ventes
        cursor.execute("UPDATE properties SET status = 'disponible' WHERE id = ?", (prop_id,))
        cursor.execute("DELETE FROM sales WHERE property_id = ?", (prop_id,))
        
    conn.commit()
    conn.close()
    
    # Retransmettre le modèle prédictif
    analyzer.train_price_predictor()
    
    return jsonify({"message": "Bien mis à jour avec succès."})

@app.route('/api/properties/<int:prop_id>', methods=['DELETE'])
def delete_property(prop_id):
    role = request.headers.get('X-User-Role')
    if role not in ('Commercial', 'Direction'):
        return jsonify({"error": "Seuls les Commerciaux ou la Direction peuvent supprimer des biens."}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM properties WHERE id = ?", (prop_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Bien supprimé avec succès."})


# --- ROUTES ANALYSE DE DONNÉES / IA ---

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    # Renvoie les rapports calculés par data_analyzer.py
    try:
        stats = analyzer.get_sales_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/predictions', methods=['GET'])
def get_dashboard_predictions():
    # Renvoie les opportunités/zones calculées par data_analyzer.py
    try:
        predictions = analyzer.get_purchase_zones_forecast()
        return jsonify(predictions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/predict-price', methods=['GET'])
def get_predicted_price():
    # Estimation de prix par l'IA
    ville = request.args.get('ville', 'Aix-en-Provence')
    sqft = request.args.get('sqft', type=float)
    beds = request.args.get('beds', 0, type=int)
    baths = request.args.get('baths', 0, type=int)
    
    if not sqft:
        return jsonify({"error": "Veuillez spécifier la surface (sqft)."}), 400
        
    price = analyzer.predict_property_price(ville, sqft, beds, baths)
    return jsonify({"predicted_price": price})


# --- ROUTES DOSSIERS PARTAGÉS (NTFS SIMULATOR) ---

@app.route('/api/files', methods=['GET'])
def get_files():
    folder = request.args.get('folder')
    username = request.headers.get('X-User-Name')
    role = request.headers.get('X-User-Role')
    
    if not folder or not username or not role:
        return jsonify({"error": "Paramètres de requête ou d'en-tête manquants."}), 400
        
    # Vérification des droits NTFS
    allowed, status_msg = check_ntfs_permission(username, role, folder, 'READ')
    if not allowed:
        return jsonify({"error": status_msg}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT f.*, u.name as uploader_name 
        FROM shared_files f
        JOIN users u ON f.uploaded_by = u.id
        WHERE f.folder = ?
        ORDER BY f.id DESC
    """, (folder,))
    files = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        "files": files,
        "permission": status_msg # 'RW' ou 'R'
    })

@app.route('/api/files', methods=['POST'])
def upload_file():
    folder = request.form.get('folder')
    filename = request.form.get('filename')
    size_bytes = request.form.get('size_bytes', type=int)
    username = request.headers.get('X-User-Name')
    role = request.headers.get('X-User-Role')
    
    if not all([folder, filename, size_bytes, username, role]):
        return jsonify({"error": "Paramètres manquants."}), 400
        
    # Vérification des droits d'écriture NTFS
    allowed, status_msg = check_ntfs_permission(username, role, folder, 'WRITE')
    if not allowed:
        return jsonify({"error": status_msg}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Récupérer l'utilisateur
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    user_id = user['id'] if user else 1
    
    file_path = f"backend/storage/{folder}/{filename}"
    
    cursor.execute(
        """INSERT INTO shared_files (filename, folder, size_bytes, uploaded_by, file_path) 
        VALUES (?, ?, ?, ?, ?)""",
        (filename, folder, size_bytes, user_id, file_path)
    )
    conn.commit()
    conn.close()
    
    # Simuler l'écriture physique du fichier
    folder_path = os.path.join(DIR_PATH, "storage", folder)
    os.makedirs(folder_path, exist_ok=True)
    with open(os.path.join(folder_path, filename), 'w') as f:
        f.write("Uploaded mock file content")
        
    return jsonify({"message": "Fichier téléversé avec succès."}), 201

@app.route('/api/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    username = request.headers.get('X-User-Name')
    role = request.headers.get('X-User-Role')
    
    if not username or not role:
        return jsonify({"error": "Informations de l'utilisateur manquantes."}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shared_files WHERE id = ?", (file_id,))
    shared_file = cursor.fetchone()
    
    if not shared_file:
        conn.close()
        return jsonify({"error": "Fichier introuvable."}), 404
        
    folder = shared_file['folder']
    
    # Vérification des droits d'écriture (suppression = modification du dossier)
    allowed, status_msg = check_ntfs_permission(username, role, folder, 'WRITE')
    if not allowed:
        conn.close()
        return jsonify({"error": status_msg}), 403
        
    cursor.execute("DELETE FROM shared_files WHERE id = ?", (file_id,))
    conn.commit()
    conn.close()
    
    # Tenter de supprimer physiquement s'il existe
    try:
        phys_path = os.path.join(DIR_PATH, "storage", folder, shared_file['filename'])
        if os.path.exists(phys_path):
            os.remove(phys_path)
    except:
        pass
        
    return jsonify({"message": "Fichier supprimé avec succès."})


# --- ROUTES SUPERVISION / IT SUPPORT ---

@app.route('/api/logs', methods=['GET'])
def get_logs():
    role = request.headers.get('X-User-Role')
    if role != 'IT et Support':
        return jsonify({"error": "Accès réservé au support IT (Security Audit Log)."}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM access_logs ORDER BY id DESC LIMIT 100")
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(logs)

@app.route('/api/admin/clean-data', methods=['POST'])
def trigger_clean_data():
    role = request.headers.get('X-User-Role')
    if role not in ('IT et Support', 'Direction'):
        return jsonify({"error": "Action réservée à la Direction ou à l'IT."}), 403
        
    try:
        # Lancer le nettoyage des données du CSV
        cleaned_df = analyzer.clean_sales_csv()
        
        # Enregistrer l'opération dans le journal
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO access_logs (username, role, folder, action, status) VALUES (?, ?, ?, ?, ?)",
            ("System", role, "Database", "CLEAN_DATA", "SUCCESS")
        )
        
        # Mettre à jour la base de données avec les nouvelles données nettoyées
        # On insère les nouvelles ventes si elles n'existent pas
        # (Pour la démo, on peut simplement vider sales et réinsérer les ventes propres)
        cursor.execute("DELETE FROM sales")
        cursor.execute("UPDATE properties SET status = 'disponible'")
        
        # Récupérer l'agent_id de Lucas
        cursor.execute("SELECT id FROM users WHERE username = 'lucas'")
        lucas_id = cursor.fetchone()['id']
        
        for idx, row in cleaned_df.iterrows():
            # Trouver la propriété correspondante
            cursor.execute("SELECT id, price FROM properties WHERE title = ?", (row['property_title'],))
            prop = cursor.fetchone()
            if prop:
                prop_id = prop['id']
                sale_price = float(row['price'])
                cursor.execute("UPDATE properties SET status = 'vendu' WHERE id = ?", (prop_id,))
                commission = round(sale_price * 0.05, 2)
                cursor.execute(
                    """INSERT INTO sales (property_id, agent_id, sale_price, sale_date, buyer_name, commission)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                    (prop_id, lucas_id, sale_price, row['sale_date'], row['buyer_name'], commission)
                )
                
        conn.commit()
        conn.close()
        
        # Entraîner à nouveau le modèle de prix
        analyzer.train_price_predictor()
        
        return jsonify({
            "message": "Données nettoyées et réimportées en BDD avec succès.",
            "cleaned_records_count": len(cleaned_df)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/backup', methods=['POST'])
def trigger_backup():
    role = request.headers.get('X-User-Role')
    if role != 'IT et Support':
        return jsonify({"error": "Action réservée à l'IT."}), 403
        
    try:
        # Simuler un backup
        backup_dir = os.path.join(DIR_PATH, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        backup_filename = f"backup_y_plaza_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Effectuer la copie SQLite
        conn = get_db_connection()
        backup_conn = sqlite3.connect(backup_path)
        conn.backup(backup_conn)
        backup_conn.close()
        conn.close()
        
        # Logger
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO access_logs (username, role, folder, action, status) VALUES (?, ?, ?, ?, ?)",
            ("System", "IT et Support", "Database", f"BACKUP_CREATED: {backup_filename}", "SUCCESS")
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "Sauvegarde de la base de données créée avec succès.",
            "backup_file": backup_filename,
            "size_bytes": os.path.getsize(backup_path),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Entraîner le prédicteur au lancement
    try:
        analyzer.train_price_predictor()
    except Exception as e:
        print(f"Erreur d'entraînement initial : {e}")
        
    print("Démarrage du serveur Flask sur http://0.0.0.0:5000 ip publique de la VM3")
    app.run(host='0.0.0.0', port=5000, debug=True)
