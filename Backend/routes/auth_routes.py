from flask import Blueprint, request, jsonify, url_for
from models.user_models import User
from utils.token_utils import generate_token, verify_token
from utils.email_utils import send_reset_email  # Assuming you have a function to send emails
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from werkzeug.security import generate_password_hash

import os

auth_routes = Blueprint('auth_routes', __name__)

def update_password(user_id, new_password):
    user = User.get_by_id(user_id)
    if not user:
        return False

    hashed_password = generate_password_hash(new_password)  # Use the existing hashing method
    User.update(user_id, {'password': hashed_password})  # Update with hashed password
    return True

@auth_routes.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.get_by_email(email):
        return jsonify({'message': 'User already exists'}), 400

    user_id = User.create(name, email, password)
    token = generate_token(user_id)
    return jsonify({'token': token}), 201

@auth_routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    user = User.get_by_email(email)
    if not user or not User.verify_password(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    token = generate_token(user['_id'])
    return jsonify({'token': token, 'message': 'Login Successful'}), 200

@auth_routes.route('/forget_password', methods=['POST'])
def forget_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    reset_token = generate_token(user['_id'])
    reset_url = url_for('auth_routes.reset_password', token=reset_token, _external=True)
    send_reset_email(email, reset_url)

    return jsonify({'message': 'Password reset link sent to your email'}), 200

@auth_routes.route('/reset_password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    new_password = data.get('password')

    if not new_password:
        return jsonify({'message': 'New password is required'}), 400

    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid or expired token'}), 400

    if update_password(user_id, new_password):
        return jsonify({'message': 'Password updated successfully'}), 200
    else:
        return jsonify({'message': 'User not found'}), 404

@auth_routes.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Successfully logged out'}), 200

# Google Authentication Route
@auth_routes.route('/login/google', methods=['GET'])
def login_with_google():
    flow = Flow.from_client_secrets_file(
        'client_secrets.json', 
        scopes=['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
        redirect_uri=url_for('auth_routes.google_callback', _external=True)
    )
    authorization_url, state = flow.authorization_url(prompt='consent')
    return jsonify({'authorization_url': authorization_url})

@auth_routes.route('/google_callback', methods=['GET'])
def google_callback():
    flow = Flow.from_client_secrets_file(
        'client_secrets.json', 
        scopes=['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
        redirect_uri=url_for('auth_routes.google_callback', _external=True)
    )
    flow.fetch_token(authorization_response=request.url)
    
    credentials = flow.credentials
    user_info = build('oauth2', 'v2', credentials=credentials).userinfo().get().execute()
    
    email = user_info['email']
    user = User.get_by_email(email)
    if not user:
        user_id = User.create(user_info['name'], email, '')
        token = generate_token(user_id)
    else:
        token = generate_token(user['_id'])
    
    return jsonify({'token': token})
