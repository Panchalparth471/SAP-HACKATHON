from database import mongo
from datetime import datetime,timezone
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId


class User:
    @classmethod
    def create(cls, name, email, password):
        hashed_password = generate_password_hash(password)
        
        user = {
            'name': name,
            'email': email,
            'password': hashed_password,  
            'created_at': datetime.now(timezone.utc),  
            'updated_at': datetime.now(timezone.utc)  
        }
        
        result = mongo.db.users.insert_one(user)  
        return result.inserted_id  

    @classmethod
    def get_by_email(cls, email):
        return mongo.db.users.find_one({'email': email})

    @classmethod
    def get_by_id(cls, user_id):
        return mongo.db.users.find_one({'_id': ObjectId(user_id)})

    @staticmethod
    def verify_password(stored_password, password):
        return check_password_hash(stored_password, password)
