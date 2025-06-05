# targetly-backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection

import joblib
import pandas as pd
import numpy as np
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json # Gemini yanıtını parse etmek için
import re   # Gemini yanıtından JSON bloğunu ayıklamak için
import requests # Instagram API çağrıları için
import boto3    # AWS S3 için
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError # boto3 hataları için
from datetime import datetime, timezone # Zaman damgaları ve zaman dilimi işlemleri için
import unicodedata # Dosya adı sanitization için

app = Flask(__name__)
CORS(app)

# --- Ortam Değişkenleri ve Sabitler ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, '.env'))

MODEL_FILENAME = 'best_instagram_model_gradientboosting.joblib'
MODEL_PATH = os.path.join(BASE_DIR, MODEL_FILENAME)
model = None
MODEL_FEATURES_ORDER = ['caption_length', 'post_hour', 'post_dayofweek', 'Month', 'Year']

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
AWS_S3_REGION = os.getenv("AWS_S3_REGION")

IG_APP_ACCESS_TOKEN = os.getenv("IG_APP_ACCESS_TOKEN")
GRAPH_API_VERSION = os.getenv("REACT_APP_GRAPH_API_VERSION", "v20.0")


# --- Helper Fonksiyonlar ---
def load_trained_ml_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print(f"✅ INFO: ML Modeli '{MODEL_FILENAME}' başarıyla yüklendi: {MODEL_PATH}")
        else:
            print(f"❌ HATA: ML Model dosyası bulunamadı: {MODEL_PATH}")
            model = None
    except Exception as e:
        print(f"❌ HATA: ML Model yüklenirken hata oluştu: {e}")
        model = None

def configure_gemini_model():
    global gemini_model
    if not GEMINI_API_KEY:
        print("❌ UYARI: GEMINI_API_KEY .env dosyasında bulunamadı! Öneri endpoint'i çalışmayacak.")
        return
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        generation_config = {
          "temperature": 0.7, "top_p": 1, "top_k": 1, "max_output_tokens": 2048,
        }
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
        gemini_model = genai.GenerativeModel(model_name="gemini-1.5-flash-latest",
                                            generation_config=generation_config,
                                            safety_settings=safety_settings)
        print(f"✅ INFO: Gemini modeli '{gemini_model.model_name}' başarıyla yapılandırıldı.")
    except Exception as e:
        print(f"❌ HATA: Gemini modeli yapılandırılırken hata oluştu: {e}")
        gemini_model = None

def sanitize_filename(filename):
    """
    Dosya adını URL ve dosya sistemi için güvenli hale getirir.
    Türkçe karakterleri ASCII karşılıklarına çevirir, boşlukları ve geçersiz karakterleri temizler.
    """
    try:
        # Normalize Unicode characters (e.g., "ö" -> "o", "İ" -> "I")
        normalized_name = unicodedata.normalize('NFKD', filename).encode('ascii', 'ignore').decode('ascii')
        # Replace spaces and unsupported characters with a hyphen or remove them
        sanitized_name = re.sub(r'[^\w\.\-]', '', normalized_name) # Sadece harf, rakam, '.', '-' ve '_' kalsın
        sanitized_name = re.sub(r'[-\s]+', '-', sanitized_name).strip('-_') # Birden fazla tire/boşluğu tek tire yap
        if not sanitized_name: # Eğer isim tamamen boşaldıysa, rastgele bir isim ver
            return "unnamed_file"
        return sanitized_name
    except Exception as e:
        print(f"⚠️ Dosya adı sanitize edilirken hata: {e}. Orijinal ad kullanılacak: {filename}")
        return filename # Hata durumunda orijinali döndür


def upload_to_s3(file_obj, bucket_name, object_name=None):
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, bucket_name, AWS_S3_REGION]):
        print("❌ HATA: S3 için AWS konfigürasyonları eksik (.env dosyasını kontrol edin).")
        return None

    if object_name is None:
        object_name = file_obj.filename

    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_S3_REGION
    )
    try:
        s3_client.upload_fileobj(
            file_obj,
            bucket_name,
            object_name,
            ExtraArgs={'ACL': 'public-read', 'ContentType': file_obj.content_type}
        )
        file_url = f"https://{bucket_name}.s3.{AWS_S3_REGION}.amazonaws.com/{object_name}"
        if AWS_S3_REGION == "us-east-1":
            file_url = f"https://{bucket_name}.s3.amazonaws.com/{object_name}"
        print(f"✅ Dosya başarıyla S3'e yüklendi: {file_url}")
        return file_url
    except NoCredentialsError:
        print("❌ HATA: S3 için AWS kimlik bilgileri bulunamadı.")
        return None
    except PartialCredentialsError:
        print("❌ HATA: S3 için eksik AWS kimlik bilgileri.")
        return None
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "AccessDenied":
            print(f"❌ HATA: S3 bucket'ına erişim reddedildi ({bucket_name}). İzinleri kontrol edin.")
        else:
            print(f"❌ HATA: S3 yüklemesi sırasında ClientError: {e}")
        return None
    except Exception as e:
        print(f"❌ HATA: S3 yüklemesi sırasında beklenmedik bir hata: {e}")
        return None

load_trained_ml_model()
configure_gemini_model()

from routes.auth_routes import auth_routes
from routes.user_routes import user_routes
from routes.dashboard_routes import dashboard_routes
from routes.report_routes import report_routes
from routes.account_info_routes import account_info_routes
from routes.profile_routes import profile_routes
from routes.account_manager_routes import account_manager_routes
from routes.content_creator_routes import content_creator_routes

app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(user_routes, url_prefix='/api/users')
app.register_blueprint(dashboard_routes, url_prefix='/api/dashboard')
app.register_blueprint(report_routes, url_prefix='/api/reporting')
app.register_blueprint(account_info_routes, url_prefix='/api')
app.register_blueprint(profile_routes, url_prefix='/api/profile')
app.register_blueprint(account_manager_routes, url_prefix='/api/account-manager')
app.register_blueprint(content_creator_routes, url_prefix='/api/content-creator')

@app.route('/api/optimal-posting-info', methods=['GET'])
def get_optimal_posting_info_route():
    optimal_info = {
        "best_time_prediction": {"day_name": "Cumartesi", "hour": 16, "estimated_likes": 60.15 },
        "best_caption_length_prediction": {"length": 23, "estimated_likes_at_best_time": 60.77 },
        "ideal_hashtag_count": {"count": 2, "note": "Veri setindeki hashtag sayısı sabit."},
        "most_important_features": [{"feature": "post_hour", "importance": 0.350878}, {"feature": "caption_length", "importance": 0.230093}],
        "model_status_message": "ML Model loaded." if model else "ML Model not loaded."
    }
    return jsonify(optimal_info)

@app.route('/api/generate-post-suggestions', methods=['POST'])
def generate_post_suggestions_route():
    if not gemini_model: return jsonify({"error": "Gemini API is not configured."}), 503
    data = request.get_json()
    if not data or not data.get('subject'): return jsonify({"error": "Post subject is required."}), 400
    post_subject = data.get('subject')
    media_type = data.get('media_type', 'unknown')
    print(f"ℹ️ Gemini için konu: '{post_subject}', medya: '{media_type}'")
    prompt_parts = [
        "You are an expert social media content assistant for Instagram.",
        f"Generate content for a post about: '{post_subject}'. Media type: {media_type}.",
        "Provide 3 creative and engaging caption alternatives (100-150 chars).",
        "Also, provide 5-7 relevant and popular hashtags.",
        "Tone: friendly, inviting, engagement-focused.",
        "Return STRICTLY JSON: {\"captions\": [\"c1\", \"c2\", \"c3\"], \"hashtags\": [\"#h1\", \"#h2\"]}"
    ]
    try:
        response = gemini_model.generate_content("\n".join(prompt_parts))
        raw_text = response.text
        match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_text, re.DOTALL)
        json_str = match.group(1).strip() if match else raw_text.strip()
        suggestions = json.loads(json_str)
        if not (isinstance(suggestions.get("captions"), list) and isinstance(suggestions.get("hashtags"), list)):
            raise ValueError("Invalid JSON structure from Gemini.")
        return jsonify(suggestions), 200
    except Exception as e:
        print(f"❌ Gemini API hatası: {e}")
        return jsonify({"error": "AI suggestions failed.", "details": str(e)}), 503

@app.route('/api/schedule-ig-post', methods=['POST'])
def schedule_ig_post_route_impl():
    if 'media' not in request.files: return jsonify({"error": "Media file is required"}), 400
    media_file = request.files['media']
    if not media_file.filename: return jsonify({"error": "Media file name is empty"}), 400

    caption = request.form.get('caption', '')
    hashtags = request.form.get('hashtags', '')
    ig_account_id = request.form.get('ig_account_id')
    scheduled_publish_time_unix_str = request.form.get('scheduled_publish_time')
    use_optimal_hour_str = request.form.get('use_optimal_hour', 'false')

    if not ig_account_id: return jsonify({"error": "Instagram Account ID is required"}), 400
    if not scheduled_publish_time_unix_str: return jsonify({"error": "Scheduled publish time is required"}), 400
    if not IG_APP_ACCESS_TOKEN:
        print("❌ HATA: IG_APP_ACCESS_TOKEN .env'de ayarlanmamış.")
        return jsonify({"error": "Server IG publishing config error."}), 500

    final_caption = f"{caption} {hashtags}".strip()
    scheduled_publish_time_unix = int(scheduled_publish_time_unix_str)
    use_optimal_hour = use_optimal_hour_str.lower() == 'true'
    final_publish_time_for_ig = scheduled_publish_time_unix

    if use_optimal_hour:
        try:
            optimal_info_resp = requests.get(f"{request.host_url.rstrip('/')}/api/optimal-posting-info")
            optimal_info_resp.raise_for_status()
            optimal_hour = optimal_info_resp.json()['best_time_prediction']['hour']
            dt_object = datetime.fromtimestamp(scheduled_publish_time_unix, tz=timezone.utc)
            dt_object_with_optimal_hour = dt_object.replace(hour=optimal_hour, minute=0, second=0, microsecond=0)
            final_publish_time_for_ig = int(dt_object_with_optimal_hour.timestamp())
            print(f"ℹ️ Optimal saat ({optimal_hour}) kullanıldı: {final_publish_time_for_ig}")
        except Exception as e:
            print(f"⚠️ Optimal saat alınamadı/işlenemedi: {e}. Manuel zaman kullanılacak.")

    original_filename = media_file.filename
    base_name, file_extension = os.path.splitext(original_filename)
    sanitized_base_name = sanitize_filename(base_name) # Sanitize et
    # Uzunluğu kontrol et ve kısalt, sonra uzantıyı ekle
    max_base_len = 100 # S3 obje adı için makul bir uzunluk
    if len(sanitized_base_name) > max_base_len:
        sanitized_base_name = sanitized_base_name[:max_base_len]
    
    # Zaman damgası ve sanitize edilmiş adı birleştir
    s3_object_name = f"instagram_uploads/{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}_{sanitized_base_name}{file_extension}"
    
    print(f"ℹ️ Orijinal dosya adı: {original_filename}, S3 için sanitize edilmiş obje adı: {s3_object_name}")

    image_url_on_s3 = upload_to_s3(media_file, AWS_S3_BUCKET_NAME, s3_object_name)
    if not image_url_on_s3:
        return jsonify({"error": "Failed to upload media to S3."}), 500

    creation_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_account_id}/media"
    creation_payload = {'image_url': image_url_on_s3, 'caption': final_caption, 'access_token': IG_APP_ACCESS_TOKEN}
    print(f"➡️ IG Container Oluşturma: {creation_url}, Image: {image_url_on_s3}")
    try:
        creation_r = requests.post(creation_url, data=creation_payload)
        creation_r.raise_for_status()
        container_id = creation_r.json().get('id')
        if not container_id:
            print(f"❌ IG Container oluşturulamadı: {creation_r.text}")
            return jsonify({"error": "Failed to create IG container.", "details": creation_r.json()}), 500
        print(f"✅ IG Container oluşturuldu: {container_id}")
    except requests.exceptions.HTTPError as e:
        print(f"❌ IG Container HTTP hatası: {e.response.status_code} - {e.response.text}")
        return jsonify({"error": "Error creating IG container.", "details": e.response.json()}), e.response.status_code
    except Exception as e:
        print(f"❌ IG Container genel hata: {e}")
        return jsonify({"error": "Unexpected error creating IG container.", "details": str(e)}), 500

    publish_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_account_id}/media_publish"
    publish_payload = {'creation_id': container_id, 'access_token': IG_APP_ACCESS_TOKEN, 'scheduled_publish_time': final_publish_time_for_ig}
    print(f"➡️ IG Publish: Creation ID={container_id}, Schedule Time={final_publish_time_for_ig}")
    try:
        publish_r = requests.post(publish_url, data=publish_payload)
        publish_r.raise_for_status()
        published_media_id = publish_r.json().get('id')
        print(f"✅ IG Post zamanlandı/yayınlandı: {publish_r.text}")
        return jsonify({"message": "Post successfully scheduled!", "instagram_post_id": published_media_id}), 200
    except requests.exceptions.HTTPError as e:
        print(f"❌ IG Publish HTTP hatası: {e.response.status_code} - {e.response.text}")
        return jsonify({"error": "Error publishing IG container.", "details": e.response.json()}), e.response.status_code
    except Exception as e:
        print(f"❌ IG Publish genel hata: {e}")
        return jsonify({"error": "Unexpected error publishing IG container.", "details": str(e)}), 500

@app.route('/')
def index(): return "✅ Targetly backend is alive!"

@app.route('/db-test')
def db_test():
    # ... (kod aynı)
    conn = None; cursor = None
    try:
        conn = get_db_connection()
        if conn is None: return "❌ DB connection error.", 500
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        return f"✅ DB Connected! PostgreSQL Version: {version[0]}" if version else "⚠️ DB Connected, no version.", 200
    except Exception as e: return f"❌ DB Error: {str(e)}", 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@app.route('/login', methods=['POST'])
def login():
    # ... (kod aynı)
    data = request.get_json();
    if not data or not data.get('email') or not data.get('password'): return jsonify({"error": "Email/password required"}), 400
    email, password = data['email'], data['password']
    conn = None; cursor = None
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT id, role, full_name FROM users WHERE email = %s AND password = %s", (email, password)) # Parola HASH'lenmeli!
        user = cursor.fetchone()
        if user: return jsonify({"message": "Login successful", "user_id": user[0], "role": user[1], "full_name": user[2], "email": email }), 200
        else: return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e: print(f"❌ Login DB error: {e}"); return jsonify({"error": "Login server error"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

if __name__ == '__main__':
    print("🚀 Targetly Flask Backend is preparing to launch...")
    app.run(debug=True, host='0.0.0.0', port=5000)