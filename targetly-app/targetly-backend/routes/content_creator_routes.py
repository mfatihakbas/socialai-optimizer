# targetly-backend/routes/content_creator_routes.py
import os
from flask import Blueprint, jsonify # request'e şimdilik gerek yok bu endpoint'te
from db import get_db_connection
from dotenv import load_dotenv
from datetime import datetime, timedelta

content_creator_routes = Blueprint('content_creator_routes', __name__, url_prefix='/api/content-creator')

# common/.env dosyasından IG_DISPLAY_NAME'i okumak için (opsiyonel)
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_FILE_DIR)
TARGETLY_APP_DIR = os.path.dirname(BACKEND_DIR)
PROJECT_ROOT_DIR = os.path.dirname(TARGETLY_APP_DIR)
common_env_path = os.path.join(PROJECT_ROOT_DIR, 'common', '.env')

IG_ACCOUNT_DISPLAY_NAME_FROM_ENV = None
if os.path.exists(common_env_path):
    print(f"Content Creator routes için common/.env yükleniyor: {common_env_path}")
    load_dotenv(dotenv_path=common_env_path)
    IG_ACCOUNT_DISPLAY_NAME_FROM_ENV = os.getenv("IG_DISPLAY_NAME") # .env dosyanızda bu anahtar olmalı

if not IG_ACCOUNT_DISPLAY_NAME_FROM_ENV:
    print("UYARI: IG_DISPLAY_NAME common/.env dosyasından okunamadı! Varsayılan kullanılacak.")


@content_creator_routes.route('/dashboard-data/<string:instagram_account_id>', methods=['GET'])
def get_cc_dashboard_data(instagram_account_id):
    conn = None
    cursor = None
    if not instagram_account_id:
        return jsonify({"error": "Instagram Account ID is required"}), 400
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection could not be established"}), 500
        cursor = conn.cursor()

        # Hesap Adı
        account_name = IG_ACCOUNT_DISPLAY_NAME_FROM_ENV if IG_ACCOUNT_DISPLAY_NAME_FROM_ENV else f"Account ID: {instagram_account_id[:7]}..."
        # Veya eğer birden fazla IG hesabı yönetiyorsanız ve bir 'instagram_accounts' tablonuz varsa:
        # cursor.execute("SELECT account_display_name FROM instagram_accounts WHERE ig_user_id = %s", (instagram_account_id,))
        # acc_name_tuple = cursor.fetchone()
        # account_name = acc_name_tuple[0] if acc_name_tuple else f"Account ID: {instagram_account_id[:7]}..."


        # Toplam Takipçi
        cursor.execute("SELECT value FROM follower_insights WHERE instagram_user_id = %s AND metric_name = 'followers_count' ORDER BY data_date DESC, fetched_at DESC LIMIT 1", (instagram_account_id,))
        tf_tuple = cursor.fetchone()
        total_followers = tf_tuple[0] if tf_tuple and tf_tuple[0] is not None else 0

        # Son 30 Günlük Genel İstatistikler
        thirty_days_ago = (datetime.now() - timedelta(days=30)).date()

        cursor.execute("SELECT COUNT(*) FROM instagram_posts WHERE instagram_user_id = %s AND DATE(timestamp) >= %s", (instagram_account_id, thirty_days_ago))
        rps_tuple = cursor.fetchone()
        total_posts_last_30_days = rps_tuple[0] if rps_tuple and rps_tuple[0] is not None else 0

        cursor.execute("SELECT SUM(like_count), SUM(comments_count) FROM instagram_posts WHERE instagram_user_id = %s AND DATE(timestamp) >= %s", (instagram_account_id, thirty_days_ago))
        interactions = cursor.fetchone()
        total_likes_30d = interactions[0] if interactions and interactions[0] is not None else 0
        total_comments_30d = interactions[1] if interactions and interactions[1] is not None else 0
        
        avg_likes_per_post = (total_likes_30d / total_posts_last_30_days) if total_posts_last_30_days > 0 else 0
        avg_comments_per_post = (total_comments_30d / total_posts_last_30_days) if total_posts_last_30_days > 0 else 0

        # Tüm Gönderiler
        cursor.execute("""
            SELECT instagram_post_id as id, caption_cleaned, timestamp, media_type, 
                   like_count, comments_count
                   -- İleride bu sorguya daily_insights'tan reach, impressions gibi veriler de joinlenebilir
            FROM instagram_posts 
            WHERE instagram_user_id = %s 
            ORDER BY timestamp DESC
        """, (instagram_account_id,)) # LIMIT kaldırıldı
        
        cols_posts = [col[0] for col in cursor.description]
        all_posts_data = [dict(zip(cols_posts, row)) for row in cursor.fetchall()]
        
        all_posts_list = []
        for post in all_posts_data:
            if isinstance(post.get('timestamp'), datetime):
                post['timestamp'] = post['timestamp'].isoformat()
            # Gönderi başına reach, impressions, engagement_rate gibi değerleri de burada hesaplayabilir veya
            # ayrı bir sorguyla çekip ekleyebilirsiniz. Şimdilik PostDetail tipine göre temel alanlar.
            all_posts_list.append(post)

        # En iyi performans gösteren gönderi (örnek: en çok beğeni alan)
        top_performing_post_data = None
        if all_posts_list: # Eğer gönderi varsa
            # Bu sadece listedeki en çok beğeniyi alır, tüm zamanlar için ayrı sorgu gerekebilir
            # Veya instagram_posts tablosundan doğrudan ORDER BY like_count DESC LIMIT 1 ile çekilebilir
            # Şimdilik all_posts_list içinden bulalım:
            # top_performing_post_data = max(all_posts_list, key=lambda x: x.get('like_count', 0), default=None)
            
            # Daha doğru bir yaklaşım: Veritabanından en çok beğeni alanı çekmek
            cursor.execute("""
                SELECT instagram_post_id as id, caption_cleaned, timestamp, media_type, like_count, comments_count
                FROM instagram_posts
                WHERE instagram_user_id = %s
                ORDER BY like_count DESC
                LIMIT 1
            """, (instagram_account_id,))
            top_post_tuple = cursor.fetchone()
            if top_post_tuple:
                top_cols = [col[0] for col in cursor.description]
                top_performing_post_data = dict(zip(top_cols, top_post_tuple))
                if isinstance(top_performing_post_data.get('timestamp'), datetime):
                    top_performing_post_data['timestamp'] = top_performing_post_data['timestamp'].isoformat()


        dashboard_payload = {
            "accountName": account_name,
            "totalFollowers": total_followers,
            "allPosts": all_posts_list, # "recentPosts" yerine "allPosts"
            "overallStats": {
                "totalPostsLast30Days": total_posts_last_30_days,
                "avgLikesPerPost": round(avg_likes_per_post, 1),
                "avgCommentsPerPost": round(avg_comments_per_post, 1),
                # "avgEngagementRateOverall": ... // Bu da hesaplanabilir
            },
            "topPerformingPost": top_performing_post_data,
            # "demographics": {} // Content creator için şimdilik demografi yoktu, istenirse eklenebilir
        }
        return jsonify(dashboard_payload)

    except Exception as e:
        print(f"❌ Content Creator Dashboard data error for {instagram_account_id}: {e}")
        return jsonify({"error": f"Failed to fetch CC dashboard data: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()