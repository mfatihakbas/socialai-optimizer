import os
import sys
import requests
from dotenv import load_dotenv

# text_cleaner modülünü import et
sys.path.append(os.path.dirname(__file__))
from text_cleaner import clean_caption, extract_hashtags

# Ortam değişkenlerini yükle
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
ACCESS_TOKEN = os.getenv("IG_ACCESS_TOKEN")
ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")
GRAPH_URL = "https://graph.facebook.com/v22.0"
POST_FIELDS = "caption,media_type,timestamp,like_count,comments_count"

# 🔹 Gönderileri çek
def fetch_instagram_posts():
    url = f"{GRAPH_URL}/{ACCOUNT_ID}/media?fields={POST_FIELDS}&access_token={ACCESS_TOKEN}"
    response = requests.get(url)
    if response.status_code != 200:
        print("❌ Gönderiler alınamadı:", response.json())
        return []
    return response.json().get("data", [])

# 🔹 Insights verisi çek (desteklenen metriklerle uyumlu)
def fetch_insights(metric, period=None, breakdown=None):
    url = f"{GRAPH_URL}/{ACCOUNT_ID}/insights"
    params = {
        "metric": metric,
        "access_token": ACCESS_TOKEN
    }

    if breakdown:
        params["breakdown"] = breakdown
        params["metric_type"] = "total_value"
        params["period"] = "lifetime"
    elif metric in ["profile_views", "accounts_engaged"]:
        params["metric_type"] = "total_value"
        params["period"] = "day"
    elif period:
        params["period"] = period

    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"❌ {metric} alınamadı:", response.json())
        return []
    return response.json().get("data", [])

# 🔹 Takipçi sayısını çek
def fetch_follower_count_direct():
    url = f"{GRAPH_URL}/{ACCOUNT_ID}?fields=followers_count&access_token={ACCESS_TOKEN}"
    response = requests.get(url)
    if response.status_code != 200:
        print("❌ Takipçi sayısı alınamadı:", response.json())
        return None
    return response.json().get("followers_count")

# 🔹 Veri güvenli yazıcı (values/total_value ayrımı)
def print_metric_data(metric_title, data):
    if not data:
        print(f"🔹 {metric_title} verisi alınamadı.")
        return

    first = data[0]
    print(f"🔹 {first.get('title', metric_title)}:")
    if "values" in first:
        for v in first["values"]:
            print(f"   📅 {v.get('end_time')} ➜ {v.get('value')}")
    elif "total_value" in first:
        if "breakdowns" in first["total_value"]:
            print("   🔸 Breakdown içeriği:")
            for item in first["total_value"]["breakdowns"][0]["results"]:
                key = item["dimension_values"][0]
                val = item["value"]
                print(f"     {key}: {val}")
        else:
            print("   🔸 total_value:", first["total_value"])
    else:
        print("   ⚠️ Veriler boş")

# 🔹 Tüm verileri terminale yazdır
def display_data():
    print("✅ Token:", ACCESS_TOKEN[:10] + "...") if ACCESS_TOKEN else print("❌ Token bulunamadı.")
    print("✅ Hesap ID:", ACCOUNT_ID)

    # Gönderiler
    posts = fetch_instagram_posts()
    print(f"\n📥 Toplam {len(posts)} gönderi bulundu.\n")
    for i, post in enumerate(posts):
        caption = post.get("caption", "")
        cleaned = clean_caption(caption)
        hashtags = extract_hashtags(caption)

        print(f"🟦 Gönderi {i+1}")
        print("📝 Orijinal :", caption)
        print("✅ Temizlenmiş:", cleaned)
        print("🏷️ Hashtagler:", hashtags)
        print("🕒 Tarih:", post.get("timestamp"))
        print("👍 Beğeni:", post.get("like_count"), "💬 Yorum:", post.get("comments_count"))
        print("-" * 50)

    # Insights
    print("\n📊 Insights Verileri:\n")

    # Günlük erişim
    print_metric_data("reach", fetch_insights("reach", period="day"))
    print("-" * 50)

    # Takipçi sayısı
    follower_count = fetch_follower_count_direct()
    print(f"🔹 Takipçi sayısı: {follower_count if follower_count is not None else 'alınamadı'}")
    print("-" * 50)

    # Günlük diğer metrikler
    for metric in ["profile_views", "accounts_engaged"]:
        print_metric_data(metric, fetch_insights(metric))
        print("-" * 50)

    # Ülke bazlı demografi
    print_metric_data("follower_demographics (country)", fetch_insights("follower_demographics", breakdown="country"))
    print("-" * 50)

    # 🔹 Ülke, Cinsiyet, Yaş bazlı demografi verilerini yazdır
    print_metric_data("follower_demographics (country)", fetch_insights("follower_demographics", breakdown="country"))
    print("-" * 50)

    print_metric_data("follower_demographics (gender)", fetch_insights("follower_demographics", breakdown="gender"))
    print("-" * 50)

    print_metric_data("follower_demographics (age)", fetch_insights("follower_demographics", breakdown="age"))
    print("-" * 50)


if __name__ == "__main__":
    display_data()
