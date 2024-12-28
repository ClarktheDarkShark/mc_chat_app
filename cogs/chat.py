# chat.py
import os
from flask import Blueprint, request, jsonify
from openai import OpenAI

# Create a Blueprint for chat functionality
chat_blueprint = Blueprint("chat_blueprint", __name__)

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv('OPENAI_KEY'))

@chat_blueprint.route("/chat", methods=["POST"])
def chat():
    """
    Handle chat requests from the React frontend.
    Expects JSON: 
    {
      "message": "Your text here",
      "model": "gpt-4o",
      "temperature": 0.7,
      "system_prompt": "You are a helpful assistant."
    }
    """
    # Parse incoming JSON data
    data = request.get_json()

    # Extract user input and optional parameters
    user_message = data.get("message", "")
    model = data.get("model", "gpt-4o")  # Default to gpt-4o
    temperature = data.get("temperature", 0.7)
    system_prompt = data.get("system_prompt", "You are a helpful assistant.")

    # Handle missing messages
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Call OpenAI API with dynamic model and params
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=temperature
        )

        assistant_reply = response.choices[0].message.content

        return jsonify({
            "user_message": user_message,
            "assistant_reply": assistant_reply
        })
    
    except Exception as e:
        # Return error details for debugging
        return jsonify({"error": str(e)}), 500
