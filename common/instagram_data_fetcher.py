import os
import requests
from dotenv import load_dotenv
from text_cleaner import clean_caption, extract_hashtags

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

ACCESS_TOKEN = os.getenv("IG_ACCESS_TOKEN")
ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")

GRAPH_URL = "https://graph.facebook.com/v22.0"
FIELDS = "caption,media_type,timestamp,like_count,comments_count"

def fetch_instagram_posts():
    url = f"{GRAPH_URL}/{ACCOUNT_ID}/media?fields={FIELDS}&access_token={ACCESS_TOKEN}"
    response = requests.get(url)

    if response.status_code != 200:
        print("❌ API Hatası:", response.json())
        return []

    return response.json().get("data", [])

if __name__ == "__main__":
    print("✅ Token yüklendi:", ACCESS_TOKEN[:10] + "..." if ACCESS_TOKEN else "YOK")
    print("✅ Hesap ID:", ACCOUNT_ID)

    posts = fetch_instagram_posts()

    if not posts:
        print("⚠️ Hiç gönderi bulunamadı.")
    else:
        print(f"\n📥 {len(posts)} gönderi bulundu.\n")

        for i, post in enumerate(posts):
            caption = post.get("caption", "")
            cleaned = clean_caption(caption)
            hashtags = extract_hashtags(caption)

            print(f"🟦 Gönderi {i+1}")
            print("📝 Orijinal :", caption)
            print("✅ Temizlenmiş:", cleaned)
            print("🏷️ Hashtagler:", hashtags)
            print("-" * 60)
