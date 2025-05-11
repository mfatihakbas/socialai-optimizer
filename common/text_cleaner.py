import re
import unicodedata

def normalize_unicode(text):
    return unicodedata.normalize("NFKC", text)

def remove_emojis(text):
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # yüz ifadeleri
        u"\U0001F300-\U0001F5FF"  # semboller
        u"\U0001F680-\U0001F6FF"  # taşıtlar
        u"\U0001F1E0-\U0001F1FF"  # bayraklar
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub(r'', text)

def clean_specials(text):
    text = re.sub(r"http\S+", "", text)         # linkler
    text = re.sub(r"@\w+", "", text)            # mentionlar
    return text

def clean_whitespace(text):
    text = text.replace("\n", " ")              # satır sonları
    text = re.sub(r"\s+", " ", text).strip()    # fazla boşluk
    return text

def clean_caption(text):
    if not isinstance(text, str): return ""
    text = normalize_unicode(text)
    text = remove_emojis(text)
    text = clean_specials(text)
    text = clean_whitespace(text)
    return text

def extract_hashtags(text):
    if not isinstance(text, str): return []
    return re.findall(r"#(\w+)", text)
