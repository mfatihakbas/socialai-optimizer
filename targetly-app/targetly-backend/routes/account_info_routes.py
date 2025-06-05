# targetly-backend/routes/account_info_routes.py
import os
from flask import Blueprint, jsonify
from db import get_db_connection
from dotenv import load_dotenv

# --- Blueprint Tanımı ---
account_info_routes = Blueprint('account_info_routes', __name__, url_prefix='/api')
# --- ---

# --- Ortam Değişkenlerini Yükleme ---
# Bu dosyanın (account_info_routes.py) bulunduğu yerden (routes) göreli yol ile common/.env'e ulaşım
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_FILE_DIR)
TARGETLY_APP_DIR = os.path.dirname(BACKEND_DIR) # Bu sizin yapınıza göre .../targetly-app
PROJECT_ROOT_DIR = os.path.dirname(TARGETLY_APP_DIR) # Bu sizin yapınıza göre .../SOCIALAI-OPTIMIZER
common_env_path = os.path.join(PROJECT_ROOT_DIR, 'common', '.env')

MAIN_IG_ACCOUNT_ID = None # Instagram User ID'si için
MAIN_IG_ACCOUNT_DISPLAY_NAME = "TCS Yazılım (Ana Hesap)" # Varsayılan veya .env'den okunacak isim

if os.path.exists(common_env_path):
    print(f"Account Info için common/.env yükleniyor: {common_env_path}")
    load_dotenv(dotenv_path=common_env_path)
    MAIN_IG_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")
    # İsterseniz hesap adını da .env'den alabilirsiniz:
    # MAIN_IG_ACCOUNT_DISPLAY_NAME = os.getenv("IG_DISPLAY_NAME", "TCS Yazılım (Ana Hesap)")
else:
    print(f"Uyarı: Account Info için {common_env_path} bulunamadı. Lütfen common/.env dosyasını kontrol edin.")

if not MAIN_IG_ACCOUNT_ID:
    print("UYARI: Account Info için ana IG_ACCOUNT_ID common/.env dosyasından okunamadı! Fallback kullanılacak.")
    MAIN_IG_ACCOUNT_ID = "YOUR_FALLBACK_IG_USER_ID_HERE" # Bu ID'nin geçerli bir formatta olması önemli
    # MAIN_IG_ACCOUNT_DISPLAY_NAME = "Ana Hesap (Yapılandırma Eksik)"


@account_info_routes.route('/managed-instagram-accounts', methods=['GET'])
def get_main_instagram_account_info(): # Fonksiyon adını daha spesifik yaptım
    conn = None
    cursor = None
    try:
        if not MAIN_IG_ACCOUNT_ID or MAIN_IG_ACCOUNT_ID == "YOUR_FALLBACK_IG_USER_ID_HERE":
            print("Hata: Ana Instagram Hesap ID'si doğru şekilde yapılandırılmamış.")
            return jsonify({"error": "Main Instagram Account ID is not properly configured"}), 500

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection could not be established"}), 500
        
        cursor = conn.cursor()
        
        manager_name = "N/A"
        # Bu sorgu, hangi account_manager'ın BU Instagram hesabına atandığını belirlemeli.
        # Şimdilik, sistemdeki ilk account_manager'ı varsayıyoruz.
        # Gerçek bir senaryoda, user_accounts gibi bir ara tabloya ihtiyacınız olabilir.
        cursor.execute("SELECT full_name FROM users WHERE role = %s ORDER BY id LIMIT 1", ('account_manager',))
        manager_tuple = cursor.fetchone()
        if manager_tuple:
            manager_name = manager_tuple[0]

        creator_name = "N/A"
        # Benzer şekilde, bu Instagram hesabına atanmış content_creator'ı bulmalısınız.
        cursor.execute("SELECT full_name FROM users WHERE role = %s ORDER BY id LIMIT 1", ('content_creator',))
        creator_tuple = cursor.fetchone()
        if creator_tuple:
            creator_name = creator_tuple[0]
        
        account_info = {
            "id": MAIN_IG_ACCOUNT_ID, # Frontend'in keyExtractor için kullandığı 'id'
            "name": MAIN_IG_ACCOUNT_DISPLAY_NAME,
            "managerName": manager_name,
            "creatorName": creator_name,
            "instagramUserId": MAIN_IG_ACCOUNT_ID # Frontend'in ayrıca göstermek istediği IG User ID
        }
        
        # Frontend bir liste beklediği için (önceki kodda FlatList vardı, şimdi tek kart olsa da yapı aynı kalabilir)
        # tek elemanlı bir liste döndürüyoruz.
        return jsonify([account_info])

    except Exception as e:
        print(f"❌ Error fetching main Instagram account info: {e}")
        return jsonify({"error": f"Failed to retrieve main account information: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# Buraya /api/account-info/... altında başka route'lar eklenebilir.