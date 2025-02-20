import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', '')  # Secret key for sessions and tokens
    MONGO_URI = os.environ.get('MONGO_URI', '')  # MongoDB URI
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')  # Google OAuth Client ID
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')  # Google OAuth Client Secret
     # Define Upload Folder
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')  
    SERPAPI_KEY = ""
    API_KEY = "" #GEMINI API KEY
    

