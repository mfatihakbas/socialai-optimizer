from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "✅ Targetly backend is alive!"

@app.route('/db-test')
def db_test():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1;")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return f"✅ DB connected successfully. Result: {result}"
    except Exception as e:
        print("❌ DB error:", e)
        return f"❌ DB connection failed: {str(e)}"

# ✅ /login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, role FROM users WHERE email = %s AND password = %s",
            (email, password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            user_id, role = user
            return jsonify({
                "message": "Login successful",
                "user_id": user_id,
                "role": role
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        print("❌ Login DB error:", e)
        return jsonify({"error": "Server error"}), 500

if __name__ == '__main__':
    print("🚀 Flask is starting...")
    app.run(debug=True, host='0.0.0.0', port=5000)

