import os
from flask import Flask, send_from_directory
from cogs.chat import chat_blueprint

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='')

    # Register chat blueprint for API
    app.register_blueprint(chat_blueprint, url_prefix="/api")

    # Serve React build files (index.html) for the root
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    # Catch-all route for React client-side routing (e.g., /about, /chat)
    @app.route("/<path:path>")
    def static_proxy(path):
        # If the file exists, serve it
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # Otherwise, serve index.html (React handles routing)
        return send_from_directory(app.static_folder, "index.html")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
