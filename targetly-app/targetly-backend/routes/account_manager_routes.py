# targetly-backend/routes/account_manager_routes.py
import os
from flask import Blueprint, jsonify
from db import get_db_connection
from dotenv import load_dotenv
from datetime import datetime, timedelta

account_manager_routes = Blueprint('account_manager_routes', __name__, url_prefix='/api/account-manager')

# common/.env dosyasındaki IG_ACCOUNT_ID'yi okumak için (bu, yönetilen ana hesap olabilir)
# Bu endpointler belirli bir instagram_account_id alacağı için bu genel ID'ye direkt ihtiyaç olmayabilir.
# Ancak, hangi kullanıcının hangi hesabı yönettiğini belirlemek için bir mekanizmaya ihtiyaç var.
# Şimdilik, endpoint'e gelen account_id'yi kullanacağız.

@account_manager_routes.route('/dashboard-data/<string:instagram_account_id>', methods=['GET'])
def get_am_dashboard_data(instagram_account_id):
    conn = None
    cursor = None
    if not instagram_account_id:
        return jsonify({"error": "Instagram Account ID is required"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Hesap Adı (instagram_accounts tablosundan veya sabit bir değerden)
        # Varsayım: Yönetilen hesapların bilgileri instagram_accounts tablosunda
        # VEYA common/.env'deki ana hesap için sabit bir isim kullanabiliriz.
        # Şimdilik, ana hesap adını varsayalım (dinamik hale getirilmeli)
        
        # common/.env dosyasından ana hesap adını okuyabiliriz (opsiyonel)
        # common_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'common', '.env')
        # if os.path.exists(common_env_path): load_dotenv(dotenv_path=common_env_path)
        # account_name_from_env = os.getenv("IG_DISPLAY_NAME", f"Account {instagram_account_id}")
        account_name = f"TCS Yazılım (ID: {instagram_account_id[:5]}...)" # Placeholder

        # 2. Toplam Takipçi
        cursor.execute("""
            SELECT value FROM follower_insights
            WHERE instagram_user_id = %s AND metric_name = 'followers_count'
            ORDER BY data_date DESC, fetched_at DESC LIMIT 1
        """, (instagram_account_id,))
        tf_tuple = cursor.fetchone()
        total_followers = tf_tuple[0] if tf_tuple and tf_tuple[0] is not None else 0

        # 3. Son 7 Günlük Veriler
        seven_days_ago = (datetime.now() - timedelta(days=7)).date()

        # Son 7 gündeki gönderi sayısı
        cursor.execute("SELECT COUNT(*) FROM instagram_posts WHERE instagram_user_id = %s AND DATE(timestamp) >= %s", (instagram_account_id, seven_days_ago))
        rps_tuple = cursor.fetchone()
        recent_posts_count = rps_tuple[0] if rps_tuple and rps_tuple[0] is not None else 0

        # Son 7 gündeki toplam beğeni ve yorum
        cursor.execute("""
            SELECT SUM(like_count), SUM(comments_count) FROM instagram_posts
            WHERE instagram_user_id = %s AND DATE(timestamp) >= %s
        """, (instagram_account_id, seven_days_ago))
        interactions = cursor.fetchone()
        total_likes_7d = interactions[0] if interactions and interactions[0] is not None else 0
        total_comments_7d = interactions[1] if interactions and interactions[1] is not None else 0
        
        avg_likes_per_post = (total_likes_7d / recent_posts_count) if recent_posts_count > 0 else 0
        avg_comments_per_post = (total_comments_7d / recent_posts_count) if recent_posts_count > 0 else 0

        # Son 7 günlük Reach ve Impressions
        cursor.execute("SELECT SUM(value) FROM daily_insights WHERE instagram_user_id = %s AND metric_name = 'reach' AND date >= %s", (instagram_account_id, seven_days_ago))
        reach_tuple = cursor.fetchone()
        recent_reach = int(reach_tuple[0]) if reach_tuple and reach_tuple[0] is not None else 0
        
        cursor.execute("SELECT SUM(value) FROM daily_insights WHERE instagram_user_id = %s AND metric_name = 'impressions' AND date >= %s", (instagram_account_id, seven_days_ago))
        imp_tuple = cursor.fetchone()
        recent_impressions = int(imp_tuple[0]) if imp_tuple and imp_tuple[0] is not None else 0

        # 4. Son Gönderiler (Son 5 gönderi)
        cursor.execute("""
            SELECT instagram_post_id as id, caption_cleaned, timestamp, media_type, like_count, comments_count
            FROM instagram_posts WHERE instagram_user_id = %s ORDER BY timestamp DESC LIMIT 5
        """, (instagram_account_id,))
        cols_posts = [col[0] for col in cursor.description]
        latest_posts_data = [dict(zip(cols_posts, row)) for row in cursor.fetchall()]
        latest_posts = []
        for post in latest_posts_data:
            if isinstance(post.get('timestamp'), datetime):
                post['timestamp'] = post['timestamp'].isoformat()
            latest_posts.append(post)

        # 5. Demografiler
        demographics_result = {"topCountries": [], "genderDistribution": [], "ageGroups": []}
        demo_map = {
            "country": "follower_demographics_country",
            "gender": "follower_demographics_gender",
            "age": "follower_demographics_age"
        }
        for key, metric in demo_map.items():
            cursor.execute("SELECT dimension_key, value FROM follower_insights WHERE instagram_user_id = %s AND metric_name = %s AND period = 'lifetime' ORDER BY value DESC LIMIT 3", (instagram_account_id, metric))
            demographics_result[key if key == "country" else "genderDistribution" if key == "gender" else "ageGroups"] = [{"dimension": r[0], "value": r[1]} for r in cursor.fetchall()]


        dashboard_payload = {
            "accountName": account_name,
            "totalFollowers": total_followers,
            "recentPostsCount": recent_posts_count,
            "avgLikesPerPost": round(avg_likes_per_post, 1),
            "avgCommentsPerPost": round(avg_comments_per_post, 1),
            "recentReach": recent_reach,
            "recentImpressions": recent_impressions,
            "latestPosts": latest_posts,
            "demographics": demographics_result
        }
        return jsonify(dashboard_payload)

    except Exception as e:
        print(f"❌ Account Manager Dashboard data error for {instagram_account_id}: {e}")
        return jsonify({"error": f"Failed to fetch dashboard data: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()