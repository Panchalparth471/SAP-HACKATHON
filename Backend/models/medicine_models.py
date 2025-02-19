from database import mongo
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import schedule
import time
import re
import threading


def extract_number(value):
          """Extract the first numeric value from a string"""
          match = re.search(r"\d+", value)
          return int(match.group()) if match else None
class Medicine:

    @classmethod
    def add_medicine(cls, user_id, name, consulting_date, dosage_period, num_medicines, interval, times):
        """ Add medicine details to a user's current_medicines and saved_medicines """
        medicine = {
            "name": name,
            "consulting_date": datetime.strptime(consulting_date, "%Y-%m-%d"),
            "dosage_period": int(dosage_period.split()[0]) if isinstance(dosage_period, str) and " " in dosage_period else int(dosage_period),
  # in days
            "num_medicines": int(num_medicines),
            "interval": extract_number(interval) if isinstance(interval, str) else int(interval),
  # hours between doses
            "times": times,  # list of times (e.g., ["08:00", "14:00", "20:00"])
            "created_at": datetime.now(timezone.utc)
        }

        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"saved_medicines": medicine, "current_medicines": medicine}}
        )
        return medicine


    @classmethod
    def get_current_medicines(cls, user_id):
         """ Get all active medicines for a user """
         user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"current_medicines": 1})
         return user.get("current_medicines", []) if user else []

    @classmethod
    def delete_medicine(cls, user_id, medicine_name):
         """ Delete a specific medicine from both saved_medicines and current_medicines """
         mongo.db.users.update_one(
             {"_id": ObjectId(user_id)},
             {
                 "$pull": {
                     "saved_medicines": {"name": medicine_name},
                     "current_medicines": {"name": medicine_name}
                 }
             }
         )
         return True

    @classmethod
    def clean_expired_medicines(cls):
         """ Remove medicines from current_medicines after the dosage period is over """
         users = mongo.db.users.find()
         for user in users:
             user_id = user["_id"]
             updated_medicines = [
                 med for med in user.get("current_medicines", [])
                 if med["consulting_date"] + timedelta(days=med["dosage_period"]) > datetime.now(timezone.utc)
             ]

             mongo.db.users.update_one(
                 {"_id": ObjectId(user_id)},
                 {"$set": {"current_medicines": updated_medicines}}
             )


 # Schedule the cleanup job
def schedule_cleanup():
     schedule.every().day.at("00:00").do(Medicine.clean_expired_medicines)
    
     while True:
         schedule.run_pending()
         time.sleep(60)  # Check every minute

# # Run in a separate thread
threading.Thread(target=schedule_cleanup, daemon=True).start()