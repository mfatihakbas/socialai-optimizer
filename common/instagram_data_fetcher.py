# SOCIALAI-OPTIMIZER/common/instagram_data_fetcher.py
import os
import sys
from datetime import datetime
import requests
from dotenv import load_dotenv

# Mevcut dosyanın (instagram_data_fetcher.py) bulunduğu dizin (common)
CURRENT_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Projenin ana kök dizinini (SOCIALAI-OPTIMIZER)
PROJECT_ROOT_DIR = os.path.dirname(CURRENT_SCRIPT_DIR)

# 1. Ana proje kök dizinini sys.path'e ekle
if PROJECT_ROOT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_ROOT_DIR)

# 2. targetly-backend klasörünün doğru ve tam yolunu sys.path'e ekle
TARGETLY_APP_BACKEND_PATH = os.path.join(PROJECT_ROOT_DIR, 'targetly-app', 'targetly-backend')
if TARGETLY_APP_BACKEND_PATH not in sys.path:
    sys.path.insert(0, TARGETLY_APP_BACKEND_PATH)

# 3. common klasörünü de ekleyebiliriz (bu zaten script'in olduğu yer ama netlik için)
# Eğer common'ı bir paket olarak import ediyorsak (from common.text_cleaner),
# PROJECT_ROOT_DIR zaten path'te olduğu için bu satır opsiyoneldir.
# Ama doğrudan importlar için (from text_cleaner) CURRENT_SCRIPT_DIR path'te olmalı (ki zaten olur).
if CURRENT_SCRIPT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_SCRIPT_DIR) # Eğer doğrudan "from text_cleaner" kullanacaksak

print(f"--- SYS.PATH KONTROLÜ (YENİ YOL İLE) ---")
for p_idx, p_val in enumerate(sys.path):
    print(f"{p_idx}: {p_val}")
print(f"--- SYS.PATH SONU (YENİ YOL İLE) ---")

try:
    # text_cleaner.py, common klasöründe olduğu için ve common sys.path'te olduğu için
    # veya PROJECT_ROOT_DIR sys.path'te olduğu için "from common.text_cleaner" çalışmalı
    from common.text_cleaner import clean_caption, extract_hashtags
    print("common.text_cleaner başarıyla import edildi.")
    
    # db modülünü doğrudan import etmeyi dene (çünkü TARGETLY_APP_BACKEND_PATH sys.path'te)
    import db # Bu satır db.py'yi modül olarak yükler
    print("db modülü başarıyla import edildi.")
    from db import get_db_connection # Şimdi db modülünden fonksiyonu import et
    print("get_db_connection başarıyla import edildi.")

except ImportError as e:
    print(f"Import hatası: {e}.")
    print("Lütfen __init__.py dosyalarının ilgili klasörlerde (common, ve belirttiğiniz yoldaki targetly-app/targetly-backend) olduğundan emin olun.")
    sys.exit(1)
except Exception as e_general:
    print(f"Beklenmedik bir hata oluştu import sırasında: {e_general}")
    sys.exit(1)


# --- Instagram API'den Veri Çekme Fonksiyonları ---
ENV_PATH_COMMON = os.path.join(CURRENT_SCRIPT_DIR, ".env")
if os.path.exists(ENV_PATH_COMMON):
    print(f"Yükleniyor: {ENV_PATH_COMMON}")
    load_dotenv(dotenv_path=ENV_PATH_COMMON)
else:
    print(f"Uyarı: {ENV_PATH_COMMON} bulunamadı. Ortam değişkenlerinin (IG_ACCESS_TOKEN, IG_ACCOUNT_ID) ayarlandığından emin olun.")

ACCESS_TOKEN = os.getenv("IG_ACCESS_TOKEN")
ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")
GRAPH_URL = os.getenv("IG_GRAPH_URL", "https://graph.facebook.com/v20.0") # Güncel bir API versiyonu kullanın
POST_FIELDS = "caption,media_type,timestamp,like_count,comments_count,id,permalink"

def fetch_instagram_posts():
    if not ACCOUNT_ID or not ACCESS_TOKEN:
        print("❌ IG_ACCOUNT_ID veya IG_ACCESS_TOKEN .env dosyasında (common klasörü) bulunamadı veya yüklenemedi.")
        return []
    url = f"{GRAPH_URL}/{ACCOUNT_ID}/media?fields={POST_FIELDS}&access_token={ACCESS_TOKEN}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get("data", [])
    except requests.exceptions.RequestException as e:
        print(f"❌ Gönderiler alınamadı: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try: print(f"API Hata Detayı: {e.response.json()}")
            except ValueError: print(f"API Hata Detayı (Raw): {e.response.text}")
        return []

def fetch_insights(metric, period=None, breakdown=None):
    if not ACCOUNT_ID or not ACCESS_TOKEN:
        print("❌ IG_ACCOUNT_ID veya IG_ACCESS_TOKEN .env dosyasında (common) bulunamadı veya yüklenemedi.")
        return []
    url = f"{GRAPH_URL}/{ACCOUNT_ID}/insights"
    params = {"metric": metric, "access_token": ACCESS_TOKEN}
    if breakdown:
        params["breakdown"] = breakdown
        params["metric_type"] = "total_value"
        params["period"] = "lifetime"
    elif metric in ["profile_views", "accounts_engaged", "reach", "impressions"]:
        params["period"] = "day"
    elif period:
        params["period"] = period
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("data", [])
    except requests.exceptions.RequestException as e:
        print(f"❌ {metric} alınamadı: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try: print(f"API Hata Detayı: {e.response.json()}")
            except ValueError: print(f"API Hata Detayı (Raw): {e.response.text}")
        return []

def fetch_follower_count_direct():
    if not ACCOUNT_ID or not ACCESS_TOKEN:
        print("❌ IG_ACCOUNT_ID veya IG_ACCESS_TOKEN .env dosyasında (common) bulunamadı veya yüklenemedi.")
        return None
    url = f"{GRAPH_URL}/{ACCOUNT_ID}?fields=followers_count&access_token={ACCESS_TOKEN}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get("followers_count")
    except requests.exceptions.RequestException as e:
        print(f"❌ Takipçi sayısı alınamadı: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try: print(f"API Hata Detayı: {e.response.json()}")
            except ValueError: print(f"API Hata Detayı (Raw): {e.response.text}")
        return None

# --- Veritabanı İşlemleri ---
def clear_existing_data(conn, instagram_user_id_param):
    cursor = None
    try:
        cursor = conn.cursor()
        print(f"Instagram ID'si {instagram_user_id_param} için eski veriler siliniyor...")
        cursor.execute("DELETE FROM post_hashtags WHERE post_table_id IN (SELECT id FROM instagram_posts WHERE instagram_user_id = %s)", (instagram_user_id_param,))
        cursor.execute("DELETE FROM instagram_posts WHERE instagram_user_id = %s", (instagram_user_id_param,))
        cursor.execute("DELETE FROM daily_insights WHERE instagram_user_id = %s", (instagram_user_id_param,))
        cursor.execute("DELETE FROM follower_insights WHERE instagram_user_id = %s", (instagram_user_id_param,))
        conn.commit()
        print("Eski veriler başarıyla silindi.")
    except Exception as e:
        if conn: conn.rollback()
        print(f"Eski verileri silerken hata oluştu: {e}")
        raise
    finally:
        if cursor: cursor.close()

def save_posts_to_db(conn, posts_data, instagram_user_id_param):
    cursor = None
    try:
        cursor = conn.cursor()
        print(f"{len(posts_data)} gönderi veritabanına kaydediliyor...")
        for post_api_data in posts_data:
            caption_original = post_api_data.get("caption", "")
            caption_cleaned = clean_caption(caption_original)
            hashtags = extract_hashtags(caption_original)
            post_timestamp_str = post_api_data.get("timestamp")
            post_timestamp = None
            if post_timestamp_str:
                try:
                    post_timestamp = datetime.fromisoformat(post_timestamp_str.replace("+0000", "+00:00"))
                except ValueError:
                    print(f"Geçersiz tarih formatı: {post_timestamp_str} (Post ID: {post_api_data.get('id')}). Tarih None.")
            instagram_native_post_id = post_api_data.get("id")
            if not instagram_native_post_id:
                print(f"Uyarı: Gönderi ID'si alınamadı, atlanıyor: {post_api_data}")
                continue
            cursor.execute(
                """
                INSERT INTO instagram_posts (instagram_user_id, instagram_post_id, caption_original, caption_cleaned, media_type, timestamp, like_count, comments_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (instagram_post_id) DO UPDATE SET
                    caption_original = EXCLUDED.caption_original, caption_cleaned = EXCLUDED.caption_cleaned,
                    media_type = EXCLUDED.media_type, timestamp = EXCLUDED.timestamp,
                    like_count = EXCLUDED.like_count, comments_count = EXCLUDED.comments_count,
                    fetched_at = CURRENT_TIMESTAMP
                RETURNING id;
                """,
                (instagram_user_id_param, instagram_native_post_id, caption_original, caption_cleaned,
                 post_api_data.get("media_type"), post_timestamp, post_api_data.get("like_count", 0),
                 post_api_data.get("comments_count", 0))
            )
            post_table_db_id_tuple = cursor.fetchone()
            if not post_table_db_id_tuple:
                print(f"Uyarı: Gönderi kaydedilemedi/ID alınamadı (Insta ID: {instagram_native_post_id}). Hashtag'ler atlanıyor.")
                continue
            post_table_db_id = post_table_db_id_tuple[0]
            for hashtag in hashtags:
                cursor.execute(
                    "INSERT INTO post_hashtags (post_table_id, hashtag) VALUES (%s, %s) ON CONFLICT (post_table_id, hashtag) DO NOTHING;",
                    (post_table_db_id, hashtag)
                )
        conn.commit()
        print("Gönderiler ve hashtag'ler başarıyla kaydedildi/güncellendi.")
    except Exception as e:
        if conn: conn.rollback()
        print(f"Gönderileri kaydederken hata oluştu: {e}")
        raise
    finally:
        if cursor: cursor.close()

def save_daily_insights_to_db(conn, insights_data, metric_name_param, instagram_user_id_param):
    cursor = None
    try:
        cursor = conn.cursor()
        if not insights_data: print(f"{metric_name_param} için API'den veri bulunamadı."); return
        print(f"{metric_name_param} insight verileri kaydediliyor...")
        saved_count = 0
        if isinstance(insights_data, list) and len(insights_data) > 0:
            for data_item in insights_data:
                metric_values = data_item.get('values', [])
                for value_entry in metric_values:
                    insight_date_str = value_entry.get('end_time'); insight_date = None
                    if insight_date_str:
                        try: insight_date = datetime.fromisoformat(insight_date_str.replace("+0000", "+00:00")).date()
                        except ValueError: print(f"Geçersiz insight tarihi: {insight_date_str}"); continue
                    value = value_entry.get('value')
                    if insight_date is not None and value is not None:
                        cursor.execute("""INSERT INTO daily_insights (instagram_user_id, metric_name, date, value)
                                          VALUES (%s, %s, %s, %s) ON CONFLICT (instagram_user_id, metric_name, date)
                                          DO UPDATE SET value = EXCLUDED.value, fetched_at = CURRENT_TIMESTAMP;""",
                                       (instagram_user_id_param, metric_name_param, insight_date, value)); saved_count += 1
        if saved_count > 0: conn.commit(); print(f"{saved_count} {metric_name_param} insight kaydedildi/güncellendi.")
        else: print(f"{metric_name_param} için kaydedilecek 'values' bulunamadı. Veri: {insights_data}")
    except Exception as e:
        if conn: conn.rollback(); print(f"{metric_name_param} insight kaydederken hata: {e}"); raise
    finally:
        if cursor: cursor.close()

def save_follower_insights_to_db(conn, insights_data_list, metric_name_param, instagram_user_id_param, period_param='lifetime', data_date_param=None):
    cursor = None
    try:
        cursor = conn.cursor()
        if not insights_data_list: print(f"{metric_name_param} için API'den veri bulunamadı."); return
        print(f"{metric_name_param} (period: {period_param}) insight verileri kaydediliyor...")
        saved_count = 0
        if isinstance(insights_data_list, list) and len(insights_data_list) > 0:
            for data_item in insights_data_list:
                if "total_value" in data_item and "breakdowns" in data_item["total_value"] and data_item["total_value"]["breakdowns"]:
                    for breakdown_group in data_item["total_value"]["breakdowns"]:
                        for result in breakdown_group.get("results", []):
                            dimension_values = result.get("dimension_values", []); dimension_key = dimension_values[0] if dimension_values else "unknown"; value = result.get("value")
                            if value is not None:
                                cursor.execute("""INSERT INTO follower_insights (instagram_user_id, metric_name, dimension_key, value, period, data_date)
                                                  VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (instagram_user_id, metric_name, dimension_key, period, data_date)
                                                  DO UPDATE SET value = EXCLUDED.value, fetched_at = CURRENT_TIMESTAMP;""",
                                               (instagram_user_id_param, metric_name_param, dimension_key, value, period_param, data_date_param)); saved_count +=1
                else: print(f"{metric_name_param} için beklenmedik veri yapısı (breakdown yok): {data_item}")
        if saved_count > 0: conn.commit(); print(f"{saved_count} {metric_name_param} insight kaydedildi/güncellendi.")
        else: print(f"{metric_name_param} için kaydedilecek 'breakdown' bulunamadı. Veri: {insights_data_list}")
    except Exception as e:
        if conn: conn.rollback(); print(f"{metric_name_param} ({period_param}) insight kaydederken hata: {e}"); raise
    finally:
        if cursor: cursor.close()

def save_single_value_follower_insight(conn, value_param, metric_name_param, instagram_user_id_param, period_param='lifetime', data_date_param=None):
    cursor = None
    try:
        cursor = conn.cursor()
        if value_param is None: print(f"{metric_name_param} için değer yok."); return
        print(f"{metric_name_param} ({value_param}) kaydediliyor...");
        cursor.execute("""INSERT INTO follower_insights (instagram_user_id, metric_name, dimension_key, value, period, data_date)
                          VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (instagram_user_id, metric_name, dimension_key, period, data_date)
                          DO UPDATE SET value = EXCLUDED.value, fetched_at = CURRENT_TIMESTAMP;""",
                       (instagram_user_id_param, metric_name_param, None, value_param, period_param, data_date_param))
        conn.commit(); print(f"{metric_name_param} kaydedildi/güncellendi.")
    except Exception as e:
        if conn: conn.rollback(); print(f"{metric_name_param} kaydederken hata: {e}"); raise
    finally:
        if cursor: cursor.close()

# --- Ana İş Akışı ---
def run_pipeline():
    print(f"Veri işleme başlatılıyor... Zaman: {datetime.now()}")
    if not ACCOUNT_ID: print("❌ IG Hesap ID (ACCOUNT_ID) common/.env'de bulunamadı."); return
    conn = None
    try:
        conn = get_db_connection()
        if conn is None: print("❌ DB bağlantısı kurulamadı (db.py). Durduruldu."); return
        
        print(f"Instagram Hesabı ID: {ACCOUNT_ID} için işlem yapılıyor.")
        # clear_existing_data(conn, ACCOUNT_ID) # Verileri her seferinde silmek yerine ON CONFLICT ile güncelle

        print("\n--- Gönderiler Çekiliyor ---"); posts = fetch_instagram_posts()
        if posts: save_posts_to_db(conn, posts, ACCOUNT_ID)
        else: print("Gönderi bulunamadı/çekilemedi.")
        
        print("\n--- Günlük Insight'lar Çekiliyor ---"); daily_metrics = {"reach": "reach", "profile_views": "profile_views", "accounts_engaged": "accounts_engaged", "impressions": "impressions"}
        for api_metric, db_metric in daily_metrics.items(): print(f"Çekiliyor: Günlük {db_metric}..."); data = fetch_insights(api_metric); save_daily_insights_to_db(conn, data, db_metric, ACCOUNT_ID); print("-" * 30)
        
        print("\n--- Takipçi ve Demografi ---"); print("Çekiliyor: Takipçi Sayısı..."); follower_count = fetch_follower_count_direct()
        save_single_value_follower_insight(conn, follower_count, "followers_count", ACCOUNT_ID, period_param='day', data_date_param=datetime.now().date()); print("-" * 30)
        
        demographics = {"country": "follower_demographics_country", "gender": "follower_demographics_gender", "age": "follower_demographics_age"}
        # Facebook API'sinde demografi için doğru metrik adı "audience_city", "audience_country", "audience_gender_age" olabilir.
        # Veya bazen hepsi tek bir "page_fans_demographics" veya benzeri bir metrik altında toplanır.
        # Kullandığınız API versiyonu ve izinlere göre bu metrik adını doğrulamanız önemlidir.
        # Şimdilik "audience_demographics" kullanıyorum, bu genellikle daha genel bir demografi metriğidir.
        for breakdown_key, db_metric_name in demographics.items():
            print(f"Çekiliyor: Demografi - {breakdown_key}...");
            # demographics_data = fetch_insights("follower_demographics", breakdown=breakdown_key) # Eski deneme
            demographics_data = fetch_insights("audience_demographics", breakdown=breakdown_key) # Yeni deneme
            if not demographics_data: # Eğer audience_demographics boş dönerse follower_demographics'i dene
                print(f"audience_demographics ile {breakdown_key} verisi alınamadı, follower_demographics deneniyor...")
                demographics_data = fetch_insights("follower_demographics", breakdown=breakdown_key)

            save_follower_insights_to_db(conn, demographics_data, db_metric_name, ACCOUNT_ID, period_param='lifetime')
            print("-" * 30)
        
        print(f"\n✅ Veri işleme tamamlandı. Zaman: {datetime.now()}")
    except Exception as e:
        print(f"❌ İşleme sırasında genel hata: {e}")
    finally:
        if conn: conn.close(); print("DB bağlantısı kapatıldı.")

if __name__ == "__main__":
    if not ACCOUNT_ID or not ACCESS_TOKEN:
         print("Lütfen common/.env dosyasında IG_ACCOUNT_ID ve IG_ACCESS_TOKEN'ı ayarlayın ve script'i yeniden çalıştırın.")
    else:
        print(f"Başlatılıyor: common/.env dosyasından Hesap ID: {ACCOUNT_ID}, Token (ilk 10 krk): {ACCESS_TOKEN[:10]}...")
        print("Veritabanı bilgileri targetly-backend/.env dosyasından (db.py tarafından) okunacak.")
        run_pipeline()