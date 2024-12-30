# app.py
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_session import Session
from db import db  # Import db from db.py
from flask_migrate import Migrate
from cogs.chat import ChatBlueprint  # Import after db to prevent circular import

class FlaskApp:
    def __init__(self):
        self.app = Flask(__name__, static_folder='static', static_url_path='')
        self.app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret-key')
        self.app.config['SESSION_TYPE'] = 'filesystem'  # Use filesystem for session storage
        self.app.config['SESSION_PERMANENT'] = False

        # --- Add Timeout and File Upload Configurations ---
        self.app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
        self.app.config['PROPAGATE_EXCEPTIONS'] = True
        self.app.config['PERMANENT_SESSION_LIFETIME'] = 3600
        self.app.config['REQUEST_TIMEOUT'] = 60  # Increase timeout to 30 seconds
        self.app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit file size to 16 MB

        # Database configuration
        print("\nGetting DB credentials...")
        uri = os.getenv("DATABASE_URL")  # Get Heroku's default DATABASE_URL

        if uri:
            # Replace 'postgres://' with 'postgresql://' for SQLAlchemy compatibility
            if uri.startswith("postgres://"):
                uri = uri.replace("postgres://", "postgresql://", 1)
            self.app.config["SQLALCHEMY_DATABASE_URI"] = uri
            print("self.app.config['SQLALCHEMY_DATABASE_URI']", self.app.config['SQLALCHEMY_DATABASE_URI'])
        else:
            # Fallback to local SQLite database for development
            self.app.config["SQLALCHEMY_DATABASE_URI"] = 'sqlite:///local.db'
            print("Using local SQLite database:", self.app.config["SQLALCHEMY_DATABASE_URI"])

        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Initialize extensions
        CORS(self.app, supports_credentials=True)
        Session(self.app)  # Initialize server-side sessions
        db.init_app(self.app)  # Initialize the database

        # Initialize Flask-Migrate
        self.migrate = Migrate(self.app, db)

        # Register blueprint
        chat_blueprint = ChatBlueprint(self, self.app)  # Pass the Flask app instance
        self.app.register_blueprint(chat_blueprint.bp, url_prefix="/api")


        # Add routes
        self.add_routes()

    def add_routes(self):
        @self.app.route("/")
        def index():
            return send_from_directory(self.app.static_folder, 'index.html')

        @self.app.route("/<path:path>")
        def static_proxy(path):
            # Serve static files if they exist, else serve index.html (for SPA routing)
            if os.path.exists(os.path.join(self.app.static_folder, path)):
                return send_from_directory(self.app.static_folder, path)
            return send_from_directory(self.app.static_folder, 'index.html')

    def run(self):
        port = int(os.getenv("PORT", 5000))
        self.app.run(host="0.0.0.0", port=port, debug=True)

# Create the app instance globally for Gunicorn
app_instance = FlaskApp()
app = app_instance.app  # Expose the app instance for Gunicorn

if __name__ == "__main__":
    app_instance.run()
