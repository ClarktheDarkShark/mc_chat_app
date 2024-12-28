# app.py
import os
from flask import Flask, send_from_directory
from cogs.chat import chat_blueprint
from flask_cors import CORS

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='')
    
    # Set a secret key for session management
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret-key')
    
    # Enable CORS if your frontend is served from a different origin
    CORS(app, supports_credentials=True)
    
    # Register blueprint for API
    app.register_blueprint(chat_blueprint, url_prefix="/api")
    
    # Serve React's index.html for the root
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, 'index.html')
    
    # Catch-all for React Router
    @app.route("/<path:path>")
    def static_proxy(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
