from flask import Blueprint, request, jsonify
from db import get_db_connection
import smtplib
from email.message import EmailMessage

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/send-reset-email', methods=['POST'])
def send_reset_email():
    data = request.get_json()
    email = data.get('email')
    role = data.get('role')

    if not email or not role:
        return jsonify({"error": "Email and role are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s AND role = %s", (email, role))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "No matching user found"}), 404

    # Email gönder
    msg = EmailMessage()
    msg['Subject'] = 'Şifre Sıfırlama Bağlantısı'
    msg['From'] = 'seninmail@gmail.com'
    msg['To'] = email
    msg.set_content('Şifre sıfırlama bağlantınız: https://targetly/reset-password')

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login('seninmail@gmail.com', 'uygulama-sifresi')
            smtp.send_message(msg)
        return jsonify({"message": "Mail gönderildi"}), 200
    except Exception as e:
        print("❌ Mail hatası:", e)
        return jsonify({"error": "Mail gönderilemedi"}), 500
