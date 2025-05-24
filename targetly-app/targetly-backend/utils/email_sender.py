import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def send_reset_email(to_email, reset_link):
    try:
        msg = EmailMessage()
        msg["Subject"] = "🔐 Şifre Sıfırlama Bağlantınız"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email
        msg.set_content(
            f"Merhaba,\n\nŞifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n{reset_link}\n\nBu işlemi siz yapmadıysanız dikkate almayın."
        )

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

        return True
    except Exception as e:
        print("❌ Mail gönderme hatası:", e)
        return False
