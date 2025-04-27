import json
import csv

# JSON dosyasını oku
with open('posts.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Sadece "data" içindeki postları al
posts = data['data']

# CSV dosyasını oluştur
with open('posts.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['id', 'caption', 'media_type', 'media_url', 'timestamp', 'permalink', 'like_count', 'comments_count']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for post in posts:
        writer.writerow({
            'id': post.get('id', ''),
            'caption': post.get('caption', ''),
            'media_type': post.get('media_type', ''),
            'media_url': post.get('media_url', ''),
            'timestamp': post.get('timestamp', ''),
            'permalink': post.get('permalink', ''),
            'like_count': post.get('like_count', 0),
            'comments_count': post.get('comments_count', 0)
        })

print("CSV dosyası oluşturuldu: posts.csv")
