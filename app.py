import os
from flask import Flask, send_from_directory
from cogs.chat import ChatBlueprint
from flask_cors import CORS

class FlaskApp:
    def __init__(self):
        self.app = Flask(__name__, static_folder='static', static_url_path='')
        self.app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret-key')
        CORS(self.app, supports_credentials=True)
        
        # Initialize conversation history
        self.conversation_history = []

        # Register blueprint
        chat_blueprint = ChatBlueprint(self)
        self.app.register_blueprint(chat_blueprint.bp, url_prefix="/api")

        # Routes
        self.add_routes()

    def add_routes(self):
        @self.app.route("/")
        def index():
            return send_from_directory(self.app.static_folder, 'index.html')

        @self.app.route("/<path:path>")
        def static_proxy(path):
            if os.path.exists(os.path.join(self.app.static_folder, path)):
                return send_from_directory(self.app.static_folder, path)
            return send_from_directory(self.app.static_folder, 'index.html')


if __name__ == "__main__":
    app_instance = FlaskApp()
    app = app_instance.app
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
