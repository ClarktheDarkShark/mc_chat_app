# cogs/chat.py
import os
import json
from flask import Blueprint, request, jsonify, session
import openai
import copy

from .web_search import WebSearchCog
from .code_files import CodeFilesCog

class ChatBlueprint:
    def __init__(self, app_instance):
        self.bp = Blueprint("chat_blueprint", __name__)
        
        # Initialize OpenAI client properly
        openai.api_key = os.getenv('OPENAI_KEY')
        self.client = openai  # Assign the openai module as the client

        # Pass the OpenAI client to WebSearchCog
        self.web_search_cog = WebSearchCog(openai_client=self.client)
        self.code_files_cog = CodeFilesCog()
        
        self.google_key = os.getenv('GOOGLE_API_KEY')
        self.app_instance = app_instance
        self.add_routes()

    def add_routes(self):
        @self.bp.route("/chat", methods=["POST"])
        def chat():
            data = request.get_json()
            user_message = data.get("message", "")
            model = data.get("model", "gpt-4")
            temperature = data.get("temperature", 0.7)
            system_prompt = data.get("system_prompt", "You are a USMC AI agent. Provide relevant responses.")
            additional_instructions = '''You are an AI assistant that generates structured and easy-to-read responses.  
Provide responses using corrct markdown format. It is critical that markdown format is used with nothing additional.  
Use headings (e.g., ## Section Title), numbered lists, and bullet points to format output.  
Ensure sufficient line breaks between sections to improve readability.'''

            if not user_message:
                return jsonify({"error": "No message provided"}), 400

            # Initialize conversation history if not present
            if 'conversation_history' not in session:
                session['conversation_history'] = [
                    {"role": "system", "content": system_prompt + '\n' + additional_instructions}
                ]

            conversation = session['conversation_history']
            conversation.append({"role": "user", "content": user_message})
            temp_conversation = copy.deepcopy(conversation)

            try:
                # Generate the assistant's reply
                assistant_reply = self.generate_chat_response(temp_conversation, model, temperature)
                
                # Append assistant response to the conversation history
                conversation.append({"role": "assistant", "content": assistant_reply})
                session['conversation_history'] = conversation

                # Return only the assistant's reply as required by the React frontend
                return jsonify({
                    "assistant_reply": assistant_reply
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500

    def analyze_user_intent(self, user_input, conversation_hist):
        """Analyze user intent using OpenAI and return a JSON object."""
        analysis_prompt = [
            {
                'role': 'system', 
                'content': (
                    'Analyze the user input and output a JSON object with the following keys:\n'
                    '- "image_generation": (boolean)\n'
                    '- "image_prompt": (string)\n'
                    '- "internet_search": (boolean)\n'
                    '- "favorite_songs": (boolean)\n'
                    '- "active_users": (boolean)\n'
                    '- "code_intent": (boolean)\n'
                    '- "rand_num": (list)\n\n'
                    'Respond with only the JSON object and no additional text.\n'
                )
            },
            {'role': 'user', 'content': f"User input: '{user_input}'\nDetermine the user's intent and required actions."}
        ]
        analysis_prompt.extend(conversation_hist[-5:])  # Include the last 5 messages for context

        try:
            response = self.client.ChatCompletion.create(
                model="gpt-4",
                messages=analysis_prompt,
                max_tokens=300,
                temperature=0
            )
            intent_json = response.choices[0].message['content'].strip()
            intent = json.loads(intent_json)
            return intent
        except Exception as e:
            return {
                "image_generation": False,
                "image_prompt": "",
                "internet_search": False,
                "favorite_songs": False,
                "active_users": False,
                "code_intent": False,
                "rand_num": []
            }

    def generate_image(self, prompt):
        """Generate an image using OpenAI's DALL-E and return the image URL."""
        try:
            image_response = self.client.Image.create(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                n=1
            )
            return image_response['data'][0]['url']
        except Exception as e:
            return "Error generating image."

    def generate_chat_response(self, conversation, model, temperature):
        """Generate a chat response using OpenAI's ChatCompletion."""
        try:
            response = self.client.ChatCompletion.create(
                model=model,
                messages=conversation,
                temperature=temperature
            )
            return response.choices[0].message['content']
        except Exception as e:
            return "Error generating response."
