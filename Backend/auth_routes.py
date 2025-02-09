from flask import Blueprint, request, jsonify
from models.user_models import User
from utils.token_utils import generate_token, verify_token
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import os

auth_routes = Blueprint('auth_routes', __name__)

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
    #return jsonify({'token': token})
    return jsonify({'message': 'Login Successful'}), 400


@auth_routes.route('/forget_password', methods=['POST'])
def forget_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': 'User not found'}), 404

   
    return jsonify({'message': 'Password reset link sent'})


@auth_routes.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Successfully logged out'})


# Google Authentication Route
@auth_routes.route('/login/google', methods=['POST'])
def login_with_google():
    flow = Flow.from_client_secrets_file(
        'client_secrets.json', 
        scopes=['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
    )
    authorization_url, state = flow.authorization_url(prompt='consent')

    return jsonify({'authorization_url': authorization_url})


@auth_routes.route('/google_callback', methods=['GET'])
def google_callback():
    flow = Flow.from_client_secrets_file(
    r'D:\Coding\Hackathon_Backend\client_secrets.json', 
    scopes=['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
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
