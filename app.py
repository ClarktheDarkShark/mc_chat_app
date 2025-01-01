# app.py
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_session import Session
from db import db  # Import db from db.py
from flask_migrate import Migrate
from cogs import register_cogs  # Import the register_cogs function
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='')
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret-key')
    app.config['SESSION_TYPE'] = 'filesystem'  # Use filesystem for session storage
    app.config['SESSION_PERMANENT'] = False

    # --- Add Timeout and File Upload Configurations ---
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.config['PROPAGATE_EXCEPTIONS'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour
    app.config['REQUEST_TIMEOUT'] = 60  # 60 seconds
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit file size to 16 MB

    # Database configuration
    print("\nGetting DB credentials...")
    uri = os.getenv("DATABASE_URL")  # Get Heroku's default DATABASE_URL

    if uri:
        # Replace 'postgres://' with 'postgresql://' for SQLAlchemy compatibility
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = uri
        print("self.app.config['SQLALCHEMY_DATABASE_URI']", app.config['SQLALCHEMY_DATABASE_URI'])
    else:
        # Fallback to local SQLite database for development
        app.config["SQLALCHEMY_DATABASE_URI"] = 'sqlite:///local.db'
        print("Using local SQLite database:", app.config["SQLALCHEMY_DATABASE_URI"])

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


    # Initialize extensions
    CORS(app, supports_credentials=True)
    Session(app)  # Initialize server-side sessions
    db.init_app(app)  # Initialize the database

    # Initialize Flask-Migrate
    migrate = Migrate(app, db)

    # Register all cogs
    register_cogs(app, app)  # Pass the Flask app instance to register_cogs

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    # Add routes for serving the frontend (e.g., React)
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route("/<path:path>")
    def static_proxy(path):
        # Serve static files if they exist, else serve index.html (for SPA routing)
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app

# Create the app instance globally for Gunicorn
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
