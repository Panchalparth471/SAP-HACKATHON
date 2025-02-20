from database import mongo
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
import random
from bson.regex import Regex
import re

class User:
    @classmethod
    def create(cls, name, email, password, role):
        if role not in ["patient", "doctor"]:
            raise ValueError("Role must be either 'patient' or 'doctor'.")

        hashed_password = generate_password_hash(password)

        user = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'role': role,  #   Add role field
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'saved_medicines': [],
            'reports':[],
            'access_requests':[],
            'otps': [],
            'authorized_patients':[],
            'current_medicines': [],
            'fcm_token': None
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

    @classmethod
    def update(cls, user_id, update_data):
     """Update user document with proper handling for $push operations"""
     if not isinstance(update_data, dict):
        raise ValueError("update_data must be a dictionary.")

     return mongo.db.users.update_one({'_id': ObjectId(user_id)}, update_data)  #   Correct


    @classmethod
    def generate_otp(cls, email):
        user = cls.get_by_email(email)
        if not user:
            return None

        otp = str(random.randint(100000, 999999))  # Generate a 6-digit OTP
        otp_entry = {
            "otp": otp,
            "created_at": datetime.now(timezone.utc),
            "verified": False  #   Track whether OTP was used
        }

        mongo.db.users.update_one(
            {"email": email},
            {"$push": {"otps": otp_entry}}
        )

        return otp

    @classmethod
    def get_latest_otp(cls, email):
        user = cls.get_by_email(email)
        if not user or "otps" not in user or not user["otps"]:
            return None

        return user["otps"][-1]  #   Get the last OTP entry

    @classmethod
    def get_all_users(cls):
        return mongo.db.users.find()

    @classmethod
    def verify_otp(cls, email, otp):
        user = cls.get_by_email(email)
        if not user or "otps" not in user:
            return False

        for otp_entry in user["otps"]:
            if otp_entry["otp"] == otp and not otp_entry["verified"]:
                otp_entry["verified"] = True  #   Mark OTP as used
                mongo.db.users.update_one(
                    {"email": email},
                    {"$set": {"otps": user["otps"]}}
                )
                return True

        return False

    @classmethod
    def save_fcm_token(cls, user_id, fcm_token):
        """Save or update user's FCM token"""
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"fcm_token": fcm_token}},
            upsert=True
        )
        
    @classmethod
    def find_by_role_and_name(cls, role, name_query):
     """Find users by role and search for their name (case-insensitive)."""
     doctors = mongo.db.users.find(
        {'role': role, 'name': {'$regex': Regex(name_query, 'i')}},  #   Case-insensitive search
        {'password': 0}  # Exclude password from results
     )

     return [
        {
            'doctor_id': str(doctor['_id']),  #   Send `doctor_id` (user_id)
            'name': doctor['name'],
            'email': doctor['email']
        }
        for doctor in doctors
    ]

    @classmethod
    def save_report(cls, user_id, report_summary, report_files):
        """Save summarized report and file details for a patient."""
        report_entry = {
            "summary": report_summary,
            "files": report_files,
            "created_at": datetime.now(timezone.utc),
        }

        return mongo.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$push': {'reports': report_entry}}
        )

    @classmethod
    def get_reports(cls, user_id):
        """Retrieve all reports for a specific user."""
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'reports': 1})
        return user.get('reports', []) if user else []
