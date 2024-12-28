# main.py

import os
import threading
from flask import Flask
import requests
import time

from bot import Bot

app = Flask(__name__)


@app.route('/')
def home():
    return "\n\n\n\n\n            Bot is running."


def run_flask():
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)



if __name__ == "__main__":
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()

    bot = Bot()
    bot.run()
