from flask import Blueprint, request, jsonify
from models.user_models import User
import threading
import time
import schedule
import jwt
from config import Config
import pytz
from utils.token_utils import verify_token
from firebase_admin import credentials, messaging, initialize_app
from werkzeug.utils import secure_filename  #   Import this at the top
import os
import google.generativeai as genai
from PIL import Image
import io
from bson.regex import Regex
from datetime import datetime

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase_credentials.json")  # Ensure the JSON file is in your project directory
initialize_app(cred)

medicine_bp = Blueprint("medicine", __name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
API_KEY = ""
genai.configure(api_key=API_KEY)
def decode_token(token):
    """Extract user_id from token"""
    token = request.headers.get("Authorization")
    if not token:
        print("No token found")
        return None

    try:
        token = token.split(" ")[1]  # Remove "Bearer "
        decoded_token = verify_token(token)  # Decode JWT
        print(decoded_token)
        return decoded_token
    except Exception as e:
        print(f"Token decoding error: {e}")
        return None

# 🔹 Save FCM Token API
@medicine_bp.route("/save_fcm_token", methods=["POST"])
def save_fcm_token():
    """Save the user's FCM token for push notifications."""
    token = request.headers.get("Authorization")  # Fetch user token
    user_id = decode_token(token)  # Decode user token

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    data = request.json
    fcm_token = data.get("fcm_token")  # Expo Push Token

    if not fcm_token:
        return jsonify({"error": "FCM token is required"}), 400

    # Update user with FCM token
    User.update(user_id, {"$set": {"fcm_token": fcm_token}})

    return jsonify({"message": "FCM token saved successfully"}), 200

# 🔹 Add Medicine API
@medicine_bp.route("/add_medicine", methods=["POST"])
def add_medicine():
    """Add medicine details to a user's saved and current medicines"""
    data = request.json  
    token = request.headers.get("Authorization")  
    user_id = decode_token(token)  

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    # Extract values
    name = data.get("name")
    consulting_date = data.get("consulting_date")
    dosage_period = data.get("dosage_period")
    num_medicines = data.get("num_medicines")
    interval = data.get("interval")
    times = data.get("times")

    if not all([name, consulting_date, dosage_period, num_medicines, interval, times]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        dosage_period = int(dosage_period.split()[0]) if isinstance(dosage_period, str) else int(dosage_period)
        num_medicines = int(num_medicines)
        interval = int(interval.split()[0]) if isinstance(interval, str) else int(interval)
    except ValueError:
        return jsonify({"error": "Invalid input format"}), 400

    medicine = {
        "name": name,
        "consulting_date": datetime.datetime.strptime(consulting_date, "%Y-%m-%d"),
        "dosage_period": dosage_period,
        "num_medicines": num_medicines,
        "interval": interval,
        "times": times,
        "created_at": datetime.datetime.now(pytz.utc),
    }

    User.update(user_id, {"$push": {"current_medicines": medicine}})

    return jsonify({"message": "Medicine added successfully", "medicine": medicine}), 201

# 🔹 Send Notification Function
def send_notification(user_fcm_token, medicine_name, time):
    """Send a push notification via Firebase Cloud Messaging (FCM)"""
    
    if not user_fcm_token:
        print("No FCM token available for the user.")
        return False

    message = messaging.Message(
        notification=messaging.Notification(
            title="Medicine Reminder 💊",
            body=f"Take {medicine_name} at {time}."
        ),
        token=user_fcm_token
    )

    try:
        response = messaging.send(message)
        print(f"Notification sent successfully: {response}")
        return True
    except Exception as e:
        print(f"Error sending notification: {e}")
        return False

# 🔹 Schedule Medicine Reminders
def schedule_medicine_reminders():
    """Schedule medicine reminders for all users"""
    users = User.get_all_users()
    for user in users:
        user_fcm_token = user.get("fcm_token")
        
        for medicine in user.get("current_medicines", []):  
            for time in medicine["times"]:
                schedule.every().day.at(time).do(send_notification, user_fcm_token, medicine["name"], time)

# 🔹 Start Scheduler in Background
def start_reminder_scheduler():
    """Run the scheduler to check medicine reminders."""
    schedule_medicine_reminders()
    while True:
        schedule.run_pending()
        time.sleep(60)

threading.Thread(target=start_reminder_scheduler, daemon=True).start()

@medicine_bp.route("/get_user_details", methods=["GET"])
def get_user_details():
    """Fetch all details of the authenticated user."""
    token = request.headers.get("Authorization")
    user_id = decode_token(token)
    
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    # Fetch user data from MongoDB
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Remove sensitive information before sending the response
    user.pop("password", None)

    return jsonify({"user": user}), 200

@medicine_bp.route("/save_medicine", methods=["POST"])
def save_medicine():
    """
    Save medicine details to a user's saved_medicines using token authentication.
    
    Expected JSON request body:
    {
      "medicine_details": {
          "brand_name": "Aspirin",
          "generic_name": "N/A",
          "purpose": "Purpose Pain reliever",
          "active_ingredient": "81 mg",
          "dosage_and_administration": "Directions ...",
          "image_url": "https://m.media-amazon.com/images/I/71NqDsHtJML.jpg",
          "do_not_use": "Optional details",
          "when_using": "Optional details",
          "indications_and_usage": "Optional details"
      }
    }
    """
    data = request.json
    token = request.headers.get("Authorization")
    user_id = decode_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    medicine_details = data.get("medicine_details")
    if not medicine_details:
        return jsonify({"error": "Missing medicine details"}), 400

    # Optionally, add more validation for required fields inside medicine_details here

    # Save the medicine details into the user's saved_medicines array.
    update_data = {"$push": {"saved_medicines": medicine_details}}
    User.update(user_id, update_data)

    return jsonify({"message": "Medicine saved successfully", "medicine": medicine_details}), 201


@medicine_bp.route('/search-doctor', methods=['GET'])
def search_doctor():
    name_query = request.args.get('name', '').strip()

    if not name_query:
        return jsonify({'message': 'Please provide a name to search'}), 400

    #   Find doctors by name and return their user_id (doctor_id)
    doctors = User.find_by_role_and_name('doctor', name_query)

    if not doctors:
        return jsonify({'message': 'No doctors found'}), 404

    return jsonify({'doctors': doctors}), 200




@medicine_bp.route('/request-access', methods=['POST'])
def request_access():
    token = request.headers.get("Authorization")  # Fetch user token
    user_id = decode_token(token)  #   Extract patient_id from token
    data = request.get_json()

    if not user_id or "doctor_id" not in data:
        return jsonify({"message": "Missing user data"}), 400

    doctor_id = data["doctor_id"]

    #   Check if `access_requests` exists and is an array
    doctor = User.get_by_id(doctor_id)
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    if "access_requests" not in doctor or not isinstance(doctor["access_requests"], list):
        #   Convert to array if it's missing or of incorrect type
        User.update(doctor_id, {"$set": {"access_requests": []}})

    #   Store request in User model
    request_entry = {
        "patient_id": user_id,
        "doctor_id": doctor_id,
        "requested_at": datetime.utcnow().replace(tzinfo=pytz.utc)
    }

    #   Now safely push the request
    update_result = User.update(doctor_id, {"$push": {"access_requests": request_entry}})

    if update_result.modified_count == 0:
        return jsonify({"message": "Failed to send request"}), 500

    return jsonify({"message": "Access request sent successfully"}), 200

#   Endpoint: Doctor retrieves patient details
@medicine_bp.route('/get-patient-details/<patient_id>', methods=['GET'])
def get_patient_details(patient_id):
    doctor_id = request.args.get('doctor_id')

    if not doctor_id:
        return jsonify({'message': 'Missing doctor_id'}), 400

    doctor = User.get_by_id(doctor_id)

    if not doctor or doctor.get('role') != 'doctor' or patient_id not in doctor.get('authorized_patients', []):
        return jsonify({'message': 'Access denied'}), 403

    patient = User.get_by_id(patient_id)
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404

    # Remove sensitive information
    patient.pop('password', None)
    patient.pop('otps', None)

    return jsonify({'patient_details': patient}), 200

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

def allowed_file(filename):
    """Check if the file has an allowed image extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@medicine_bp.route('/upload-reports', methods=['POST'])
def upload_reports():
    try:
        #   Verify user authentication
        token = request.headers.get("Authorization")
        user_id = decode_token(token)
        
        if not user_id:
            return jsonify({"error": "Unauthorized access"}), 401

        #   Check if an image file is uploaded
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed types: jpg, jpeg, png"}), 400

        #   Convert image to bytes
        image = Image.open(file.stream).convert("RGB")
        with io.BytesIO() as output:
            image.save(output, format="JPEG")
            image_bytes = output.getvalue()

        #   Step 1: Extract Full Text from Image
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([
            {"parts": [
                {"text": "Extract all the text from this medical report image:"},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_bytes}}
            ]}
        ])

        extracted_text = response.text.strip() if response else "No text recognized"

        #   Step 2: Summarize Extracted Text
        summary_response = model.generate_content([
            {"parts": [
                {"text": f"Summarize the following medical report text:\n\n{extracted_text}"}
            ]}
        ])

        summary = summary_response.text.strip() if summary_response else "No summary generated."

        print(f"Extracted Text:\n{extracted_text}\n")
        print(f"Summary:\n{summary}\n")

        return jsonify({
            "extracted_text": extracted_text,
            "summary": summary
        }), 200

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500

#   2️⃣ API to Retrieve Saved Reports
@medicine_bp.route("/get-reports/<user_id>", methods=["GET"])
def get_reports(user_id):
    reports = User.get_reports(user_id)
    if not reports:
        return jsonify({"message": "No reports found"}), 404

    return jsonify({"reports": reports}), 200
@medicine_bp.route('/get-requests/<doctor_id>', methods=['GET'])
def get_requests(doctor_id):
    """
    API for doctors to get pending patient access requests.
    - Fetches patients who have requested access to the doctor.
    - Returns a list of requests with patient details.
    """
    try:
        #   Get the token from request headers
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization token"}), 401

        #   Remove "Bearer " prefix and verify token
        token = token.split(" ")[1]
        decoded_user_id = verify_token(token)

        if not decoded_user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        #   Ensure the requested doctor ID matches the token user ID
        if str(decoded_user_id) != str(doctor_id):
            return jsonify({"error": "Unauthorized request"}), 403

        #   Verify if the doctor exists
        doctor = User.get_by_id(doctor_id)
        if not doctor or doctor.get("role") != "doctor":
            return jsonify({"error": "Doctor not found"}), 404

        #   Fetch pending access requests
        requests = []
        access_requests = doctor.get("access_requests", [])

        #   Ensure `access_requests` is a list of dictionaries
        if not isinstance(access_requests, list):
            access_requests = []  # Default to an empty list if the format is incorrect

        for request_entry in access_requests:
            if isinstance(request_entry, dict) and "patient_id" in request_entry:  #   Ensure dictionary format
                patient = User.get_by_id(request_entry["patient_id"])
                if patient:
                    requests.append({
                        "patient_id": str(request_entry["patient_id"]),
                        "patient_name": patient.get("name", "Unknown"),
                        "patient_email": patient.get("email", "Unknown"),
                    })
        print(requests)

        return jsonify({"requests": requests}), 200

    except Exception as e:
        print(f"Error in get_requests API: {str(e)}")
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@medicine_bp.route('/accept-request', methods=['POST'])
def accept_request():
    """API for doctors to accept patient requests and grant access."""
    try:
        #   Extract doctor authentication
        token = request.headers.get("Authorization")
        doctor_id = decode_token(token)  # 🔹 Extract doctor ID from token

        if not doctor_id:
            return jsonify({"error": "Unauthorized access"}), 401

        data = request.get_json()
        patient_id = data.get('patient_id')

        if not patient_id:
            return jsonify({'message': 'Missing patient_id'}), 400

        #  Ensure doctor exists
        doctor = User.get_by_id(doctor_id)
        if not doctor or doctor.get('role') != 'doctor':
            return jsonify({'message': 'Doctor not found'}), 404

        #   Find the request in `access_requests`
        access_requests = doctor.get("access_requests", [])
        if not isinstance(access_requests, list):
            access_requests = []  # Default to an empty list

        #   Filter out accepted request and update MongoDB
        updated_requests = [req for req in access_requests if req.get("patient_id") != patient_id]

        #   Update doctor record
        update_result = User.update(doctor_id, {
            "$set": {"access_requests": updated_requests},  # Remove accepted request
            "$addToSet": {"authorized_patients": patient_id}  # Add patient to authorized list
        })

        if update_result.modified_count == 0:
            return jsonify({"message": "Failed to accept request"}), 500

        return jsonify({'message': 'Request accepted, access granted'}), 200

    except Exception as e:
        print(f"Error in accept_request API: {str(e)}")
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@medicine_bp.route('/save-summary', methods=['POST'])
def save_summary():
    """
    Saves the extracted report summary in the user's profile.
    """
    try:
        #   Authenticate User
        token = request.headers.get("Authorization")
        user_id = decode_token(token)

        if not user_id:
            return jsonify({"error": "Unauthorized access"}), 401

        #   Extract Summary Data from Request
        data = request.json
        extracted_text = data.get("extracted_text", "").strip()
        summary = data.get("summary", "").strip()

        if not extracted_text or not summary:
            return jsonify({"error": "Missing extracted text or summary"}), 400

        #   Create Report Entry
        report_entry = {
            "summary": summary,
            "extracted_text": extracted_text,
            "created_at": datetime.now(pytz.utc)
        }

        #   Save the report under the user's `reports` field
        update_result = User.update(user_id, {"$push": {"reports": report_entry}})

        if update_result.modified_count == 0:
            return jsonify({"error": "Failed to save summary"}), 500

        return jsonify({"message": "Summary saved successfully", "report": report_entry}), 201

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500
    
@medicine_bp.route('/get-authorized-patients-data/<doctor_id>', methods=['GET'])
def get_authorized_patients_data(doctor_id):
    """
    Fetch reports, saved medicines, and current medicines of all authorized patients for a given doctor.
    """
    try:
        #   Authenticate Doctor
        token = request.headers.get("Authorization")
        decoded_user_id = decode_token(token)

        if not decoded_user_id or str(decoded_user_id) != str(doctor_id):
            return jsonify({"error": "Unauthorized access"}), 403

        #   Retrieve Doctor's Record
        doctor = User.get_by_id(doctor_id)
        if not doctor or doctor.get("role") != "doctor":
            return jsonify({"error": "Doctor not found"}), 404

        #   Retrieve Details of Authorized Patients
        authorized_patients = doctor.get("authorized_patients", [])
        patients_data = []

        for patient_id in authorized_patients:
            patient = User.get_by_id(patient_id)
            if patient:
                patients_data.append({
                    "patient_id": str(patient["_id"]),
                    "name": patient.get("name", "Unknown"),
                    "saved_medicines": patient.get("saved_medicines", []),
                    "current_medicines": patient.get("current_medicines", []),
                    "reports": patient.get("reports", [])
                })

        return jsonify({"authorized_patients": patients_data}), 200

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500
