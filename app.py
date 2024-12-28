import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from cogs.chat import chat_blueprint

class FlaskApp:
    def __init__(self):
        self.app = Flask(__name__, static_folder='static', static_url_path='')
        self.configure_app()
        self.register_blueprints()
        self.add_routes()

    def configure_app(self):
        # Set configurations
        self.app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret-key')
        CORS(self.app, supports_credentials=True)

    def register_blueprints(self):
        # Register Blueprints
        self.app.register_blueprint(chat_blueprint, url_prefix="/api")

    def add_routes(self):
        # Serve React's index.html for the root
        @self.app.route("/")
        def index():
            return send_from_directory(self.app.static_folder, 'index.html')

        # Catch-all for React Router
        @self.app.route("/<path:path>")
        def static_proxy(path):
            if os.path.exists(os.path.join(self.app.static_folder, path)):
                return send_from_directory(self.app.static_folder, path)
            return send_from_directory(self.app.static_folder, 'index.html')

    def run(self):
        port = int(os.environ.get("PORT", 5000))
        self.app.run(host="0.0.0.0", port=port, debug=True)


if __name__ == "__main__":
    app_instance = FlaskApp()
    app_instance.run()
