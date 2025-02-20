from flask import Blueprint, request, jsonify, url_for
from models.user_models import User
from utils.token_utils import generate_token, verify_token
from utils.email_utils import send_reset_email  # Function to send OTP via email
from werkzeug.security import generate_password_hash

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not name or not email or not password or not role:
        return jsonify({'message': 'Missing required fields'}), 400

    if role not in ["patient", "doctor"]:
        return jsonify({'message': "Invalid role. Role must be either 'patient' or 'doctor'."}), 400

    if User.get_by_email(email):
        return jsonify({'message': 'User already exists'}), 400

    user_id = User.create(name, email, password, role)
    token = generate_token(user_id)

    return jsonify({'token': token, 'user_id': str(user_id), 'role': role}), 201


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
    """
    Generates and sends OTP to the user's email for password reset.
    """
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    otp = User.generate_otp(email)  #   Generate and store OTP inside the user's document

    #   Send OTP via email
    send_reset_email(email, f"Your OTP is: {otp}")

    return jsonify({'message': 'OTP sent to your email'}), 200





@auth_routes.route('/reset_password', methods=['POST'])
def reset_password():
    """
    Resets the user's password after OTP verification.
    """
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('password')

    if not email or not otp or not new_password:
        return jsonify({'message': 'Email, OTP, and new password are required'}), 400

    #   Check OTP validity before updating password
    if not User.verify_otp(email, otp):
        return jsonify({'message': 'Invalid or expired OTP'}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    #   Hash and update password
    hashed_password = generate_password_hash(new_password)
    User.update(user['_id'], {'password': hashed_password})

    return jsonify({'message': 'Password updated successfully'}), 200


@auth_routes.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Successfully logged out'}), 200
