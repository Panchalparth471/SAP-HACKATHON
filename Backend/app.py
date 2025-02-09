from flask import Flask
from routes.auth_routes import auth_routes
from database import init_app

app = Flask(__name__)

init_app(app)

app.register_blueprint(auth_routes, url_prefix='/auth')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)
