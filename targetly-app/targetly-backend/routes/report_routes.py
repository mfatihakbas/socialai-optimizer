# targetly-backend/routes/report_routes.py
import os
from flask import Blueprint, jsonify, request
from db import get_db_connection
from dotenv import load_dotenv
from datetime import datetime, timedelta

# common/.env dosyasındaki IG_ACCOUNT_ID'yi okumak için
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__)) # .../routes
BACKEND_DIR = os.path.dirname(CURRENT_FILE_DIR) # .../targetly-backend
TARGETLY_APP_DIR = os.path.dirname(BACKEND_DIR) # .../targetly-app
PROJECT_ROOT_DIR = os.path.dirname(TARGETLY_APP_DIR) # .../SOCIALAI-OPTIMIZER
common_env_path = os.path.join(PROJECT_ROOT_DIR, 'common', '.env')

MAIN_ACCOUNT_ID_FROM_ENV = None
if os.path.exists(common_env_path):
    print(f"Raporlar için common/.env yükleniyor: {common_env_path}")
    load_dotenv(dotenv_path=common_env_path)
    MAIN_ACCOUNT_ID_FROM_ENV = os.getenv("IG_ACCOUNT_ID")
else:
    print(f"Uyarı: Raporlar için {common_env_path} bulunamadı.")

if not MAIN_ACCOUNT_ID_FROM_ENV:
    print("UYARI: Raporlar için ana IG_ACCOUNT_ID common/.env dosyasından okunamadı!")
    MAIN_ACCOUNT_ID_FROM_ENV = "YOUR_MAIN_IG_ACCOUNT_ID_FALLBACK" # Fallback

report_routes = Blueprint('report_routes', __name__, url_prefix='/api/reporting')

# Yönetilen Instagram Hesaplarını Listeleme
@report_routes.route('/accounts', methods=['GET'])
def get_managed_accounts():
    # Şimdilik .env'den okuduğumuz ana hesabı ve birkaç sahte hesabı döndürelim
    # İleride bu liste veritabanından veya başka bir konfigürasyon dosyasından gelebilir
    accounts_list = []
    if MAIN_ACCOUNT_ID_FROM_ENV and MAIN_ACCOUNT_ID_FROM_ENV != "YOUR_MAIN_IG_ACCOUNT_ID_FALLBACK":
        accounts_list.append({"id": MAIN_ACCOUNT_ID_FROM_ENV, "name": "TCS Yazılım (Ana Hesap)"})
    
    # Gösterimlik sahte hesaplar
    accounts_list.extend([
        {"id": "dummy_ig_id_1", "name": "Everest Media"},
        {"id": "dummy_ig_id_2", "name": "Beach Vibes Co"},
        {"id": "dummy_ig_id_3", "name": "Urban Stylez"},
    ])
    return jsonify(accounts_list)

# Belirli Bir Hesap İçin Özet Rapor Verileri
@report_routes.route('/account-summary/<string:account_id>', methods=['GET'])
def get_account_summary(account_id):
    conn = None
    cursor = None
    if not account_id or account_id == "YOUR_MAIN_IG_ACCOUNT_ID_FALLBACK": # Fallback ID kontrolü
        return jsonify({"error": "Valid Instagram Account ID is required for summary"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Total Followers
        cursor.execute("""
            SELECT value FROM follower_insights
            WHERE instagram_user_id = %s AND metric_name = 'followers_count'
            ORDER BY data_date DESC, fetched_at DESC
            LIMIT 1
        """, (account_id,))
        total_followers_tuple = cursor.fetchone()
        total_followers = total_followers_tuple[0] if total_followers_tuple and total_followers_tuple[0] is not None else 0

        # Weekly Engagement Rate (Basit bir örnek, detaylandırılmalı)
        # Son 7 gündeki toplam etkileşim (beğeni + yorum) / takipçi sayısı
        # Bu metrik Instagram API'sinden daha doğru alınabilirse o tercih edilmeli.
        seven_days_ago = (datetime.now() - timedelta(days=7)).date()
        cursor.execute("""
            SELECT SUM(p.like_count + p.comments_count)
            FROM instagram_posts p
            WHERE p.instagram_user_id = %s AND DATE(p.timestamp) >= %s
        """, (account_id, seven_days_ago))
        total_interactions_tuple = cursor.fetchone()
        total_interactions = total_interactions_tuple[0] if total_interactions_tuple and total_interactions_tuple[0] is not None else 0
        
        weekly_engagement_rate_value = (total_interactions / total_followers * 100) if total_followers > 0 else 0
        weekly_engagement_rate_str = f"{weekly_engagement_rate_value:.2f}%"

        # Active Followers Estimate (Bu metrik için daha iyi bir kaynak veya hesaplama gerekebilir)
        # Şimdilik 'accounts_engaged' metriğinin son 7 günlük ortalamasını alabiliriz.
        cursor.execute("""
            SELECT AVG(value) FROM daily_insights
            WHERE instagram_user_id = %s AND metric_name = 'accounts_engaged' AND date >= %s
        """, (account_id, seven_days_ago))
        active_followers_tuple = cursor.fetchone()
        active_followers_estimate = int(active_followers_tuple[0]) if active_followers_tuple and active_followers_tuple[0] is not None else 0
        
        summary = {
            "totalFollowers": total_followers,
            "weeklyEngagementRate": weekly_engagement_rate_str,
            "activeFollowersEstimate": active_followers_estimate
        }
        return jsonify(summary), 200
    except Exception as e:
        print(f"❌ Account summary error for {account_id}: {e}")
        return jsonify({"error": f"Failed to fetch account summary: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# Belirli Bir Hesap İçin Takipçi Demografileri
@report_routes.route('/follower-demographics/<string:account_id>', methods=['GET'])
def get_follower_demographics(account_id):
    conn = None
    cursor = None
    if not account_id or account_id == "YOUR_MAIN_IG_ACCOUNT_ID_FALLBACK":
        return jsonify({"error": "Valid Instagram Account ID is required for demographics"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        demographics_data = {}
        metric_map = {
            "country": "follower_demographics_country",
            "gender": "follower_demographics_gender",
            "age": "follower_demographics_age"
        }

        for demo_type, metric_name in metric_map.items():
            cursor.execute("""
                SELECT dimension_key, value FROM follower_insights
                WHERE instagram_user_id = %s AND metric_name = %s AND period = 'lifetime'
                ORDER BY value DESC
            """, (account_id, metric_name))
            
            data_list = []
            for row in cursor.fetchall():
                data_list.append({"dimension": row[0], "value": row[1]})
            demographics_data[demo_type] = data_list
            
        return jsonify(demographics_data), 200
    except Exception as e:
        print(f"❌ Follower demographics error for {account_id}: {e}")
        return jsonify({"error": f"Failed to fetch follower demographics: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()