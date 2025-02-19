import requests
import re
from flask import Blueprint, request, jsonify, url_for
from bson import ObjectId
from models.user_models import User  
from utils.token_utils import verify_token 
import google.generativeai as genai
from werkzeug.utils import secure_filename
from PIL import Image
import io
import os
import re

# API URLs
OPENFDA_URL = "https://api.fda.gov/drug/label.json"
SERPAPI_KEY = "84e040e4573fee205b1843aa03ed88cee9d7dffb6207496e15240bc9e483e360"
API_KEY = "AIzaSyDqVZpzmhfjIhMR69k3HDpuOCojPJ32hHQ"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
genai.configure(api_key=API_KEY)

main_routes = Blueprint('main_routes', __name__)
# Function to fetch the first image from Google search
def fetch_first_image(drug_name):
    url = "https://serpapi.com/search"
    params = {
        "q": drug_name,
        "tbm": "isch",  # Image search
        "api_key": SERPAPI_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    # Get the first image URL
    if "images_results" in data and data["images_results"]:
        return data["images_results"][0]["original"]
    return None

def extract_mg_value(text):
    """Extracts the mg (milligram) value from a string."""
    match = re.search(r'(\d+\s?mg)', text)  # Looks for 'number + mg'
    return match.group(1) if match else "N/A"

# Medicine info endpoint (now includes image)
@main_routes.route('/medicine/<string:medicine_name>', methods=['GET'])
def get_medicine_info(medicine_name):
    try:
        # Fetch medicine data from OpenFDA
        api_url = f"{OPENFDA_URL}?search=active_ingredient:{medicine_name}&limit=1"
        print(f"Fetching data from: {api_url}")

        response = requests.get(api_url)
        data = response.json()
        print("API Response:", data)  # Debugging print

        if "results" not in data or not data["results"]:
            return jsonify({"error": "Medicine not found", "message": "Try another brand name"}), 404

        medicine_info = data["results"][0]
         # Build response
        mg_value = extract_mg_value(medicine_info["active_ingredient"][0])

        # Fetch image URL
        image_url = fetch_first_image(medicine_name)

       
        result = {
            "brand_name": medicine_info.get("openfda", {}).get("brand_name", ["N/A"])[0],
            "generic_name": medicine_info.get("openfda", {}).get("generic_name", ["N/A"])[0],
            "purpose": medicine_info.get("purpose", ["N/A"])[0],
            "indications_and_usage": medicine_info.get("indications_and_usage", ["N/A"])[0],
            "active_ingredient":mg_value,
            "do_not_use": medicine_info.get("do_not_use", ["N/A"])[0],
            "when_using": medicine_info.get("when_using", ["N/A"])[0],
            "dosage_and_administration": medicine_info.get("dosage_and_administration", ["N/A"])[0],
            "image_url": image_url if image_url else "No image available"
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500

# Endpoint for suggesting medicine names while typing
@main_routes.route('/medicine_suggestions', methods=['GET'])
def suggest_medicine_names():
    try:
        query = request.args.get('query', '').lower()
        if not query or len(query) < 3:
            return jsonify([]) 
        api_url = f"{OPENFDA_URL}?search=active_ingredient:{query}*&limit=100"
        print(f"Fetching data from: {api_url}")

        response = requests.get(api_url)
        data = response.json()
        print("API Response:", data)  # Debugging print

        if "results" not in data or not data["results"]:
            return jsonify({"error": "No suggestions found", "message": "No medicines match your query"}), 404

        suggestions = []
        for medicine_info in data["results"]:
            brand_name = medicine_info.get("openfda", {}).get("brand_name", ["N/A"])[0]
            if brand_name.lower().startswith(query):  # Filter only those that start with the query
                suggestions.append(brand_name)

        if not suggestions:
            return jsonify({"error": "No suggestions found", "message": "No medicines found that match your query"}), 404

        return jsonify(suggestions)

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500
# Function to extract user_id from token
def get_user_id_from_token():
    token = request.headers.get("Authorization")
    if not token:
        print("No token")
        return None

    try:
        token = token.split(" ")[1]  # Remove "Bearer "
        decoded_token = verify_token(token)  # Decode JWT
        print(decoded_token)
        return decoded_token
    except Exception:
        return None

@main_routes.route('/save_medicine', methods=['POST'])
def save_medicine():
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized", "message": "Invalid or missing token"}), 401

        data = request.get_json()
        medicine_details = data.get("medicine_details")

        if not medicine_details:
            return jsonify({"error": "Missing medicine details"}), 400

        # Check if user exists
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Use `$push` instead of `$set` to add to the array
        result = User.update(user_id, {"$push": {"saved_medicines": medicine_details}})

        if result.modified_count == 0:
            return jsonify({"message": "No changes made, medicine might already exist"}), 200

        return jsonify({"message": "Medicine saved successfully"}), 200

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500

@main_routes.route('/get_saved_medicines', methods=['GET'])
def get_saved_medicines():
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized", "message": "Invalid or missing token"}), 401

        # Fetch user details from the database
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get the saved medicines list (default to empty array if not found)
        saved_medicines = user.get("saved_medicines", [])

        return jsonify({"medicines": saved_medicines}), 200

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main_routes.route('/extract_medicines', methods=['POST'])
def extract_medicines():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed types: jpg, jpeg, png"}), 400

        filename = secure_filename(file.filename)
        image = Image.open(file.stream).convert("RGB")

        # Convert image to bytes for Gemini API
        with io.BytesIO() as output:
            image.save(output, format="JPEG")
            image_bytes = output.getvalue()

        # Use Gemini API for OCR
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([
            {"parts": [{"text": "Extract only the medicine names from this image:"},
                        {"inline_data": {"mime_type": "image/jpeg", "data": image_bytes}}]}
        ])

        recognized_text = response.text if response else "No text recognized"

        # Send extracted text back to Gemini for medicine name extraction
        refined_response = model.generate_content([
            {"parts": [{"text": f"From the following text, extract only the medicine names and return them as a comma-separated list:\n\n{recognized_text}"}]}
        ])

        extracted_medicines = refined_response.text.strip() if refined_response else "No medicines found"

        # Convert extracted medicines into the required format (list of lists)
        medicine_list = [[med.strip()] for med in extracted_medicines.split(",")]

        return jsonify({
            "recognized_text": recognized_text,
            "medicines": medicine_list
        }), 200

    except Exception as e:
        return jsonify({"error": "An error occurred", "message": str(e)}), 500

    

# IBM Watson Granite API Details
IBM_URL = "https://eu-de.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
IBM_MODEL_ID = "ibm/granite-3-8b-instruct"
IBM_PROJECT_ID = "c6bde235-19d3-4773-8ab4-f226d36f509e"
IBM_AUTH_TOKEN = "eyJraWQiOiIyMDI1MDEzMDA4NDQiLCJhbGciOiJSUzI1NiJ9.eyJpYW1faWQiOiJJQk1pZC02QTcwMDA0RFpNIiwiaWQiOiJJQk1pZC02QTcwMDA0RFpNIiwicmVhbG1pZCI6IklCTWlkIiwianRpIjoiMjMyY2EwNmQtN2M1Yi00ODBiLWFmNDEtODFjNjFiZDI3MjI1IiwiaWRlbnRpZmllciI6IjZBNzAwMDREWk0iLCJnaXZlbl9uYW1lIjoiU2FtYXJ0aCIsImZhbWlseV9uYW1lIjoiQmhpbWFuaSIsIm5hbWUiOiJTYW1hcnRoIEJoaW1hbmkiLCJlbWFpbCI6InNhbWFydGhiaGltYW5pMTFAZ21haWwuY29tIiwic3ViIjoic2FtYXJ0aGJoaW1hbmkxMUBnbWFpbC5jb20iLCJhdXRobiI6eyJzdWIiOiJzYW1hcnRoYmhpbWFuaTExQGdtYWlsLmNvbSIsImlhbV9pZCI6IklCTWlkLTZBNzAwMDREWk0iLCJuYW1lIjoiU2FtYXJ0aCBCaGltYW5pIiwiZ2l2ZW5fbmFtZSI6IlNhbWFydGgiLCJmYW1pbHlfbmFtZSI6IkJoaW1hbmkiLCJlbWFpbCI6InNhbWFydGhiaGltYW5pMTFAZ21haWwuY29tIn0sImFjY291bnQiOnsidmFsaWQiOnRydWUsImJzcyI6ImQ0ZDJkOWQ4ZTcyNDRiYmRiNzc5MDM5ZWJjNDRjMzY3IiwiaW1zX3VzZXJfaWQiOiIxMzI2NjQ5NCIsImZyb3plbiI6dHJ1ZSwiaW1zIjoiMzAxMTYwMiJ9LCJpYXQiOjE3Mzk2MDc2NzksImV4cCI6MTczOTYxMTI3OSwiaXNzIjoiaHR0cHM6Ly9pYW0uY2xvdWQuaWJtLmNvbS9pZGVudGl0eSIsImdyYW50X3R5cGUiOiJ1cm46aWJtOnBhcmFtczpvYXV0aDpncmFudC10eXBlOmFwaWtleSIsInNjb3BlIjoiaWJtIG9wZW5pZCIsImNsaWVudF9pZCI6ImRlZmF1bHQiLCJhY3IiOjEsImFtciI6WyJwd2QiXX0.Yh0lGHk7FNOnNR9PBdJ3wbq_1APgu-qEtNPWZWevk0IdYyOBNNrUxpIOWrONnAh3rFWLsFCtsI6rj8JpY1TZ8TsN82260wxiQHhHYhI5XwkVS6BwvjJJVOzrO0MSOnDseOvVsMpx1vv4k5uCKMML9UWdXQuZx6Volz2sk1GUNGhCuGRv-8Js_4Q6bPL5kp40CkR1_-Um6KwJVMxihOpkAddDROySlUiF1erTdWrpkC30kOq363R6_QTp7tG3JuEdsCuS-UDaZLkIKlEEWu1abqigpm9e2VFLa2Z0oB2nP6tSxk3q5ZIG8DVDsOndf2TjQaPKa8OlAvoBFPBec-Ub3w"
# Function to query IBM Watson API
def get_ai_response(user_input):
    body = {
        "input": f"""<|start_of_role|>system<|end_of_role|>You are Granite, an AI language model developed by IBM in 2024. You are a cautious assistant. You carefully follow instructions. You are helpful and harmless and you follow ethical guidelines and promote positive behavior.<|end_of_text|>
        <|start_of_role|>user<|end_of_role|>{user_input}<|end_of_text|>
        <|start_of_role|>assistant<|end_of_role|>""",
        "parameters": {
            "decoding_method": "greedy",
            "max_new_tokens": 900,
            "min_new_tokens": 0,
            "repetition_penalty": 1
        },
        "model_id": IBM_MODEL_ID,
        "project_id": IBM_PROJECT_ID
    }

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {IBM_AUTH_TOKEN}"
    }

    response = requests.post(IBM_URL, headers=headers, json=body)

    if response.status_code != 200:
        return {"error": f"API Error: {response.text}"}

    return response.json()

# Flask API Route
@main_routes.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.get_json()
    user_input = data.get("query")

    if not user_input:
        return jsonify({"error": "Missing 'query' parameter"}), 400
    
    print(get_ai_response(user_input))
    ai_response = get_ai_response(user_input).get("results", [{}])[0].get("generated_text", "No response found.")
    return jsonify(ai_response)
