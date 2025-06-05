# routes/user_routes.py
from flask import Blueprint, request, jsonify
from db import get_db_connection

user_routes = Blueprint('user_routes', __name__)

# KULLANICILARI LİSTELEME (GET /users)
@user_routes.route('/users', methods=['GET'])
def get_users_route():
    conn = None
    cursor = None
    try:
        role_filter = request.args.get('role')
        conn = get_db_connection()
        cursor = conn.cursor()

        sql_query = "SELECT id, full_name, email, role FROM users"
        params = []

        if role_filter and role_filter.lower() != 'all':
            sql_query += " WHERE LOWER(role) = LOWER(%s)"
            params.append(role_filter)
        
        sql_query += " ORDER BY full_name"
        
        cursor.execute(sql_query, tuple(params))
        
        columns = [col[0] for col in cursor.description]
        users = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return jsonify(users), 200

    except Exception as e:
        print(f"❌ Kullanıcıları alırken hata: {e}")
        return jsonify({"error": "Database error while fetching users"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# TEK BİR KULLANICIYI GETİRME (GET /users/<user_id>)
@user_routes.route('/users/<int:user_id>', methods=['GET'])
def get_single_user_route(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, email, role FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        if user_data:
            columns = [col[0] for col in cursor.description]
            user_dict = dict(zip(columns, user_data))
            return jsonify(user_dict), 200
        else:
            return jsonify({"error": f"User with ID {user_id} not found"}), 404

    except Exception as e:
        print(f"❌ Tek kullanıcıyı alırken hata (ID: {user_id}): {e}")
        return jsonify({"error": "Database error while fetching user"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# KULLANICI EKLEME (POST /users)
@user_routes.route('/users', methods=['POST'])
def add_user_route():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is missing or not JSON"}), 400

        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password') # Şifre düz metin olarak alınıyor
        role = data.get('role')

        if not all([full_name, email, password, role]):
            return jsonify({"error": "Missing required fields: full_name, email, password, role"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already exists"}), 409

        cursor.execute(
            "INSERT INTO users (full_name, email, password, role) VALUES (%s, %s, %s, %s) RETURNING id",
            (full_name, email, password, role) # Şifre düz metin olarak kaydediliyor
        )
        new_user_id_tuple = cursor.fetchone()
        if not new_user_id_tuple:
            conn.rollback()
            raise Exception("User insertion failed, RETURNING id did not return a value.")
            
        new_user_id = new_user_id_tuple[0]
        conn.commit()

        return jsonify({"message": "User added successfully", "user_id": new_user_id}), 201

    except Exception as e:
        print(f"❌ Kullanıcı eklerken hata: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Server error while adding user"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# KULLANICI GÜNCELLEME (PUT /users/<user_id>)
@user_routes.route('/users/<int:user_id>', methods=['PUT'])
def update_user_route(user_id):
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is missing or not JSON"}), 400

        fields_to_update = {}
        allowed_fields = ['full_name', 'email', 'role', 'password']
        
        for field in allowed_fields:
            if field in data and data[field] is not None:
                if field == 'password':
                    if data[field].strip(): # Şifre boş değilse al
                        fields_to_update[field] = data[field] # Düz metin şifre
                else:
                    fields_to_update[field] = data[field]
        
        if not fields_to_update:
            return jsonify({"message": "No fields provided for update or no changes made"}), 200

        if 'email' in fields_to_update:
            conn_check = get_db_connection()
            cursor_check = conn_check.cursor()
            cursor_check.execute("SELECT id FROM users WHERE email = %s AND id != %s", (fields_to_update['email'], user_id))
            if cursor_check.fetchone():
                cursor_check.close()
                conn_check.close()
                return jsonify({"error": "Email already in use by another account"}), 409
            cursor_check.close()
            conn_check.close()

        set_clause_parts = []
        values = []
        for key, value in fields_to_update.items():
            set_clause_parts.append(f"{key} = %s")
            values.append(value)
        
        if not set_clause_parts:
             return jsonify({"message": "No valid fields to update"}), 200

        set_clause = ", ".join(set_clause_parts)
        values.append(user_id)

        update_query = f"UPDATE users SET {set_clause} WHERE id = %s"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(update_query, tuple(values))
        conn.commit()

        updated_rows = cursor.rowcount
        if updated_rows > 0:
            return jsonify({"message": f"User with ID {user_id} updated successfully"}), 200
        else:
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not cursor.fetchone():
                 return jsonify({"error": f"User with ID {user_id} not found"}), 404
            return jsonify({"message": f"No effective changes made for user with ID {user_id}"}), 200

    except Exception as e:
        print(f"❌ Kullanıcı güncellerken hata (ID: {user_id}): {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Server error while updating user"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# KULLANICI SİLME (DELETE /users/<user_id>)
@user_routes.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user_route(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()

        deleted_rows = cursor.rowcount

        if deleted_rows > 0:
            print(f"✅ User with ID {user_id} deleted successfully.")
            return jsonify({"message": f"User with ID {user_id} deleted successfully"}), 200
        else:
            print(f"⚠️ User with ID {user_id} not found for deletion or already deleted.")
            return jsonify({"error": f"User with ID {user_id} not found"}), 404

    except Exception as e:
        print(f"❌ Kullanıcı silerken hata (ID: {user_id}): {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Server error while deleting user"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()