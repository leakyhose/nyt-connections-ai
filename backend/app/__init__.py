from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register Blueprints
    from app.routes.games import games_bp
    app.register_blueprint(games_bp, url_prefix='/api/games')

    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy'}

    return app
