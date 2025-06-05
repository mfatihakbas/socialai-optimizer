# targetly-backend/routes/dashboard_routes.py
import os
from flask import Blueprint, jsonify
from db import get_db_connection
from dotenv import load_dotenv
from datetime import datetime, timedelta # timedelta eklendi

# common/.env dosyasındaki IG_ACCOUNT_ID'yi okumak için
# Bu dosyanın (dashboard_routes.py) bulunduğu yerden (routes) göreli yol
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_FILE_DIR)
# Eğer common klasörü SOCIALAI-OPTIMIZER içindeyse ve targetly-backend de SOCIALAI-OPTIMIZER/targetly-app içindeyse:
TARGETLY_APP_DIR = os.path.dirname(BACKEND_DIR)
PROJECT_ROOT_DIR = os.path.dirname(TARGETLY_APP_DIR)
common_env_path = os.path.join(PROJECT_ROOT_DIR, 'common', '.env')

ACCOUNT_ID_FOR_DASHBOARD = None
if os.path.exists(common_env_path):
    print(f"Dashboard için common/.env yükleniyor: {common_env_path}")
    load_dotenv(dotenv_path=common_env_path)
    ACCOUNT_ID_FOR_DASHBOARD = os.getenv("IG_ACCOUNT_ID")
else:
    print(f"Uyarı: Dashboard için {common_env_path} bulunamadı.")

if not ACCOUNT_ID_FOR_DASHBOARD:
    print("UYARI: Dashboard için IG_ACCOUNT_ID .env dosyasından okunamadı! Lütfen common/.env dosyasını kontrol edin.")
    ACCOUNT_ID_FOR_DASHBOARD = "FALLBACK_ACCOUNT_ID_CONFIGURE_ME" # Hata durumunda kullanılacak


dashboard_routes = Blueprint('dashboard_routes', __name__, url_prefix='/api/dashboard')

@dashboard_routes.route('/summary', methods=['GET'])
def get_dashboard_summary():
    conn = None
    cursor = None
    if not ACCOUNT_ID_FOR_DASHBOARD or ACCOUNT_ID_FOR_DASHBOARD == "FALLBACK_ACCOUNT_ID_CONFIGURE_ME":
        return jsonify({"error": "Instagram Account ID is not configured for dashboard"}), 500
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Total Accounts (Şimdilik tek hesap varsayıyoruz)
        total_accounts = 1

        # 2. Total Posts (instagram_posts tablosundaki toplam satır sayısı)
        cursor.execute("SELECT COUNT(*) FROM instagram_posts WHERE instagram_user_id = %s", (ACCOUNT_ID_FOR_DASHBOARD,))
        total_posts_tuple = cursor.fetchone()
        total_posts = total_posts_tuple[0] if total_posts_tuple and total_posts_tuple[0] is not None else 0

        # 3. Total Followers (follower_insights tablosundan metric_name='followers_count' olan en son değer)
        cursor.execute("""
            SELECT value FROM follower_insights
            WHERE instagram_user_id = %s AND metric_name = 'followers_count'
            ORDER BY data_date DESC, fetched_at DESC
            LIMIT 1
        """, (ACCOUNT_ID_FOR_DASHBOARD,))
        total_followers_tuple = cursor.fetchone()
        total_followers = total_followers_tuple[0] if total_followers_tuple and total_followers_tuple[0] is not None else 0
        
        summary = {
            "totalAccounts": total_accounts,
            "totalPosts": total_posts,
            "totalFollowers": total_followers,
            "systemStatus": "Good ✅" # Bu şimdilik sabit kalabilir
        }
        return jsonify(summary), 200
    except Exception as e:
        print(f"❌ Dashboard summary error: {e}")
        return jsonify({"error": f"Failed to fetch dashboard summary: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_routes.route('/content-calendar', methods=['GET'])
def get_content_calendar():
    conn = None
    cursor = None
    if not ACCOUNT_ID_FOR_DASHBOARD or ACCOUNT_ID_FOR_DASHBOARD == "FALLBACK_ACCOUNT_ID_CONFIGURE_ME":
        return jsonify({"error": "Instagram Account ID is not configured for dashboard"}), 500
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Son 15 gönderiyi çekelim, daha fazla gerekirse frontend'de sayfalama eklenebilir
        cursor.execute("""
            SELECT id, instagram_post_id, caption_cleaned, timestamp, instagram_user_id, media_type, like_count, comments_count
            FROM instagram_posts
            WHERE instagram_user_id = %s
            ORDER BY timestamp DESC
            LIMIT 15
        """, (ACCOUNT_ID_FOR_DASHBOARD,))
        
        columns = [col[0] for col in cursor.description]
        posts = []
        for row in cursor.fetchall():
            post_dict = dict(zip(columns, row))
            # Timestamp'i ISO formatına çevirelim ki JavaScript Date objesi kolayca parse edebilsin
            if isinstance(post_dict.get('timestamp'), datetime):
                post_dict['timestamp'] = post_dict['timestamp'].isoformat()
            posts.append(post_dict)
        
        return jsonify(posts), 200
    except Exception as e:
        print(f"❌ Content calendar error: {e}")
        return jsonify({"error": f"Failed to fetch content calendar: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_routes.route('/insights-overview', methods=['GET'])
def get_insights_overview():
    conn = None
    cursor = None
    if not ACCOUNT_ID_FOR_DASHBOARD or ACCOUNT_ID_FOR_DASHBOARD == "FALLBACK_ACCOUNT_ID_CONFIGURE_ME":
        return jsonify({"error": "Instagram Account ID is not configured for dashboard"}), 500
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Son 7 günlük toplam erişim
        seven_days_ago = (datetime.now() - timedelta(days=7)).date()
        cursor.execute("""
            SELECT SUM(value) FROM daily_insights
            WHERE instagram_user_id = %s AND metric_name = 'reach' AND date >= %s
        """, (ACCOUNT_ID_FOR_DASHBOARD, seven_days_ago))
        recent_reach_tuple = cursor.fetchone()
        recent_reach = int(recent_reach_tuple[0]) if recent_reach_tuple and recent_reach_tuple[0] is not None else 0

        # Son 7 günlük toplam gösterim (impressions)
        cursor.execute("""
            SELECT SUM(value) FROM daily_insights
            WHERE instagram_user_id = %s AND metric_name = 'impressions' AND date >= %s
        """, (ACCOUNT_ID_FOR_DASHBOARD, seven_days_ago))
        impressions_tuple = cursor.fetchone()
        total_impressions_last_7_days = int(impressions_tuple[0]) if impressions_tuple and impressions_tuple[0] is not None else 0

        # Ortalama Etkileşim Oranı (Örnek hesaplama: (Toplam Beğeni + Toplam Yorum) / Toplam Gönderi / Toplam Takipçi * 100)
        # Bu daha karmaşık olabilir ve farklı şekillerde hesaplanabilir. Şimdilik basit bir örnek.
        # Daha doğru bir etkileşim oranı için Instagram'ın kendi "engagement_rate" metriği varsa onu kullanın.
        cursor.execute("SELECT SUM(like_count), SUM(comments_count), COUNT(*) FROM instagram_posts WHERE instagram_user_id = %s", (ACCOUNT_ID_FOR_DASHBOARD,))
        post_stats = cursor.fetchone()
        total_likes = post_stats[0] if post_stats and post_stats[0] is not None else 0
        total_comments = post_stats[1] if post_stats and post_stats[1] is not None else 0
        num_posts = post_stats[2] if post_stats and post_stats[2] is not None and post_stats[2] > 0 else 1 # Bölme hatası için 1

        cursor.execute("SELECT value FROM follower_insights WHERE instagram_user_id = %s AND metric_name = 'followers_count' ORDER BY data_date DESC LIMIT 1", (ACCOUNT_ID_FOR_DASHBOARD,))
        followers_tuple = cursor.fetchone()
        current_followers = followers_tuple[0] if followers_tuple and followers_tuple[0] is not None and followers_tuple[0] > 0 else 1 # Bölme hatası için 1
        
        average_engagement_rate = ((total_likes + total_comments) / num_posts / current_followers) * 100 if num_posts > 0 and current_followers > 0 else 0


        # En çok beğeni alan gönderi
        cursor.execute("""
            SELECT instagram_post_id, caption_cleaned, like_count FROM instagram_posts
            WHERE instagram_user_id = %s
            ORDER BY like_count DESC
            LIMIT 1
        """, (ACCOUNT_ID_FOR_DASHBOARD,))
        top_post_data = cursor.fetchone()
        top_post_by_likes = None
        if top_post_data:
            columns = [col[0] for col in cursor.description]
            top_post_by_likes = dict(zip(columns, top_post_data))

        overview = {
            "recentReach": recent_reach,
            "totalImpressionsLast7Days": total_impressions_last_7_days,
            "averageEngagementRate": round(average_engagement_rate, 2), # 2 ondalık basamağa yuvarla
            "topPostByLikes": top_post_by_likes,
        }
        return jsonify(overview), 200
    except Exception as e:
        print(f"❌ Insights overview error: {e}")
        return jsonify({"error": f"Failed to fetch insights overview: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()