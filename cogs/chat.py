# cogs/chat.py
import os
from flask import Blueprint, request, jsonify
from openai import OpenAI

class ChatBlueprint:
    def __init__(self, app_instance):
        self.bp = Blueprint("chat_blueprint", __name__)
        self.client = OpenAI(api_key=os.getenv('OPENAI_KEY'))
        self.app_instance = app_instance
        self.add_routes()

    def add_routes(self):
        @self.bp.route("/chat", methods=["POST"])
        def chat():
            data = request.get_json()
            user_message = data.get("message", "")
            model = data.get("model", "gpt-4o")
            temperature = data.get("temperature", 0.7)
            system_prompt = data.get("system_prompt", "You are a USMC AI agent. Provide relevent responses.")

            if not user_message:
                return jsonify({"error": "No message provided"}), 400

            # Append to conversation history
            self.app_instance.conversation_history.append({
                'role': 'user',
                'content': user_message
            })

            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        *self.app_instance.conversation_history
                    ],
                    temperature=temperature
                )

                assistant_reply = response.choices[0].message.content
                self.app_instance.conversation_history.append({
                    'role': 'assistant',
                    'content': assistant_reply
                })

                return jsonify({
                    "user_message": user_message,
                    "assistant_reply": assistant_reply
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500
