from flask import Flask
from routes.auth_routes import auth_routes
from routes.main_routes import main_routes
from routes.medicine_routes import medicine_bp
from flask_cors import CORS
from database import init_app

app = Flask(__name__)
CORS(app)

init_app(app)

app.register_blueprint(auth_routes, url_prefix='/auth')
app.register_blueprint(main_routes,url_prefix='/api/v1')
app.register_blueprint(medicine_bp,url_prefix="/api/v1")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)
