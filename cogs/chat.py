import os
import openai
from flask import Blueprint, request, jsonify

# Create a Blueprint for chat functionality
chat_blueprint = Blueprint("chat_blueprint", __name__)

# Use your OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

@chat_blueprint.route("/chat", methods=["POST"])
def chat():
    """
    Basic route for handling chat messages.
    Expects JSON: {"message": "Your text here"}
    """
    data = request.get_json()
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message}
            ]
        )
        assistant_reply = response["choices"][0]["message"]["content"]
        return jsonify({
            "user_message": user_message,
            "assistant_reply": assistant_reply
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
