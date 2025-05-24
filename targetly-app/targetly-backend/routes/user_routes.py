from flask import Blueprint, request, jsonify
from db import get_db_connection

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/users', methods=['GET'])
def get_users():
    role = request.args.get('role')

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if role and role != 'all':
            cur.execute("SELECT id, full_name, email, role FROM users WHERE role = %s", (role,))
        else:
            cur.execute("SELECT id, full_name, email, role FROM users")

        rows = cur.fetchall()
        conn.close()

        users = [{"id": r[0], "name": r[1], "email": r[2], "role": r[3]} for r in rows]
        return jsonify(users)

    except Exception as e:
        print("❌ Kullanıcıları alırken hata:", e)
        return jsonify({"error": "Database error"}), 500
