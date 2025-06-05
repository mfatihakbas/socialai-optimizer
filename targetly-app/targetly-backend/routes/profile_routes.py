# targetly-backend/routes/profile_routes.py
from flask import Blueprint, jsonify # request'e artık gerek yok (şimdilik)
from db import get_db_connection
# JWT veya session için importlar buraya gelebilir

profile_routes = Blueprint('profile_routes', __name__, url_prefix='/api/profile')

# GET /api/profile/user/<user_id> -> Belirli bir kullanıcının profilini getirir
@profile_routes.route('/user/<int:user_id>', methods=['GET'])
# @jwt_required() # Eğer JWT kullanıyorsanız ve token'dan user_id almayacaksanız,
                 # en azından route'u korumak için bu gerekebilir.
                 # Veya, token'dan ID alıp URL'deki ID ile eşleşip eşleşmediğini kontrol edebilirsiniz.
def get_user_profile_by_id(user_id): # Parametre olarak user_id alındı
    conn = None
    cursor = None
    try:
        # Artık URL'den gelen user_id'yi kullanıyoruz
        current_user_id_to_fetch = user_id

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection could not be established"}), 500
        
        cursor = conn.cursor()
        # Sadece full_name ve email'i seçiyoruz (şifre veya rol gibi hassas bilgiler değil)
        cursor.execute(
            "SELECT full_name, email FROM users WHERE id = %s",
            (current_user_id_to_fetch,)
        )
        user_data_tuple = cursor.fetchone()

        if user_data_tuple:
            columns = [col[0] for col in cursor.description]
            user_profile = dict(zip(columns, user_data_tuple))
            return jsonify(user_profile), 200
        else:
            return jsonify({"error": f"User profile not found for ID: {current_user_id_to_fetch}"}), 404

    except Exception as e:
        print(f"❌ Error fetching user profile for ID {user_id}: {e}")
        return jsonify({"error": "Server error while fetching profile"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()