import os
from flask import Flask, render_template
from cogs.chat import chat_blueprint

def create_app():
    app = Flask(__name__)

    # Register chat blueprint
    app.register_blueprint(chat_blueprint, url_prefix="/api")

    @app.route("/")
    def index():
        return render_template("index.html")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
