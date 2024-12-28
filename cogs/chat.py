# cogs/chat.py
import os
from flask import Blueprint, request, jsonify, session
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
            system_prompt = data.get("system_prompt", 
                "You are a USMC AI agent. Conduct a reasoning stage before responding. "
                "Give a very brief explaination of the logic used in your response. Then, provide a relevant response.")

            if not user_message:
                return jsonify({"error": "No message provided"}), 400

            # Initialize conversation history in session
            if 'conversation_history' not in session:
                session['conversation_history'] = [{"role": "system", "content": system_prompt}]
            conversation = session['conversation_history']

            # Append user message
            conversation.append({"role": "user", "content": user_message})
            session['conversation_history'] = conversation

            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=conversation,
                    temperature=temperature
                )

                assistant_reply = response.choices[0].message.content
                conversation.append({"role": "assistant", "content": assistant_reply})
                session['conversation_history'] = conversation

                return jsonify({
                    "user_message": user_message,
                    "assistant_reply": assistant_reply,
                    "conversation_history": conversation
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500
