import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', '5e210b897dc96675db03b4f62a0f3ec3c97529a390f5591450c85734ab2fd1a2')  # Secret key for sessions and tokens
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://panchalparth471:nvdUO9UnBFy91nlX@cluster0.ko0ihta.mongodb.net/SAP')  # MongoDB URI
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')  # Google OAuth Client ID
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')  # Google OAuth Client Secret

