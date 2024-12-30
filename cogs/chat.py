# cogs/chat.py
import os
import json
from flask import Blueprint, request, jsonify, session
import openai
import copy
# Remove incorrect import
# from openai import OpenAI

from .web_search import WebSearchCog
from .code_files import CodeFilesCog

class ChatBlueprint:
    def __init__(self, app_instance):
        self.bp = Blueprint("chat_blueprint", __name__)
        
        # Initialize OpenAI client properly
        # The standard OpenAI library does not have an OpenAI class; instead, set the API key
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

            # Initialize conversation history in session
            if 'conversation_history' not in session:
                session['conversation_history'] = [{"role": "system", "content": system_prompt + '\n' + additional_instructions}]
            conversation = session['conversation_history']

            # Append user message to conversation history
            conversation.append({"role": "user", "content": user_message})
            temp_conversation = copy.deepcopy(conversation)
            # session['conversation_history'] = conversation

            # Analyze user intent
            intent = self.analyze_user_intent(user_message, conversation)

            print()
            print('intent', intent)
            print()

            # Handle different intents
            assistant_reply = ""
            try:
                if intent.get("image_generation", False):
                    # Generate Image using DALL-E 3
                    prompt = intent.get("image_prompt", "")
                    if prompt:
                        image_url = self.generate_image(prompt)
                        assistant_reply = f"![Generated Image]({image_url})"
                        conversation.append({"role": "assistant", "content": assistant_reply})
                        session['conversation_history'] = conversation
                    else:
                        assistant_reply = "No image prompt provided."
                    return jsonify({
                        "user_message": user_message,
                        "assistant_reply": assistant_reply,
                        "conversation_history": conversation
                    })

                elif intent.get("code_intent", False):
                    # Handle code-related intents
                    code_content = self.code_files_cog.get_all_code_files_content()
                    if code_content:
                        # Append code content to the system prompt
                        temp_conversation[0]['content'] += "\n\n" + code_content
                        temp_conversation[-1]['content'] += '\n\nYou have been supplemented with information from your code base to answer this query.'
                        intent['code_intent'] = True  # Ensure intent shows True
                    else:
                        assistant_reply = "No code files found to provide."
                        conversation.append({"role": "assistant", "content": assistant_reply})
                        session['conversation_history'] = conversation
                        return jsonify({
                            "user_message": user_message,
                            "assistant_reply": assistant_reply,
                            "conversation_history": conversation
                        })

                elif intent.get("internet_search", False):
                    # Handle internet search (Placeholder)
                    # Perform web search
                    query = user_message  # Or extract a specific part of the message
                    search_content = self.web_search_cog.web_search(user_message, conversation)
                    print('search_content', search_content)
                    sys_search_content = f'\nDo not say "I am unable to browse the internet," because you have information directly retrieved from the internet. Give a confident answer based on this. Only use the most relevent and accurate information that matches the User Query.'
                    # search_content = f'\n\nThe following is information from the internet to help with your answer: {search_content}\n\nDo not say "I am unable to browse the internet," because you have information directly retrieved from the internet. Give a confident answer based on this.'

                    temp_conversation[0]['content'] += sys_search_content
                    temp_conversation[-1]['content'] = f'\n\nYou are being supplimented with the following information from the internent to answer user query. Internet Content:\n***{search_content}***\n\nUser Query:\n***{user_message}***'
                else:
                    temp_conversation = conversation

                # Regular Chat Response
                print()
                print('***************************************************************************************************************')
                print('temp_conversation', temp_conversation)
                print('***************************************************************************************************************')
                print()
                assistant_reply = self.generate_chat_response(temp_conversation, model, temperature)
                print()
                print()
                print('Final Response:', assistant_reply)
                print()
                print()
                conversation.append({"role": "assistant", "content": assistant_reply})
                session['conversation_history'] = conversation

                return jsonify({
                    "user_message": user_message,
                    "assistant_reply": assistant_reply,
                    "conversation_history": conversation
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500

    def analyze_user_intent(self, user_input, conversation_hist):
        """Analyze user intent using OpenAI and return a JSON object."""
        analysis_prompt = [
            {
                'role': 'system', 
                'content': (
                    'As an AI assistant, analyze the user input and output a JSON object with the following keys:\n'
                    '- "image_generation": (boolean)\n'
                    '- "image_prompt": (string)\n'
                    '- "internet_search": (boolean)\n'
                    '- "favorite_songs": (boolean)\n'
                    '- "active_users": (boolean)\n'
                    '- "code_intent": (boolean)\n'
                    '- "rand_num": (list)\n\n'
                    'Respond with only the JSON object and no additional text.\n\n'
                    'Guidelines:\n'
                    '1. **image_generation** should be True only when an image is requested. Example: "Can you show me a USMC officer saluting?"\n'
                    '2. **image_prompt** should contain the prompt for image generation if **image_generation** is True.\n'
                    '3. **internet_search** should be True when the user asks for information that might require an internet search.\n'
                    '4. **favorite_songs** should be True when the user interacts with song-related commands.\n'
                    '5. **active_users** should be True if there is a question about the most active users.\n'
                    '6. **code_intent** should be True when the user is asking about code-related queries or commands starting with "!".\n'
                    '7. **rand_num** should contain [lowest_num, highest_num] if the user requests a random number within a range.\n\n'
                    'Respond in JSON format.\nIMPORTANT: Boolean values only: True or False.'
                )
            },
            {'role': 'user', 'content': f"User input: '{user_input}'\n\nDetermine the user's intent and required actions."}
        ]
        # Include the last 5 messages for context
        analysis_prompt.extend(conversation_hist[-5:])

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",  # Correct model name
                messages=analysis_prompt,
                max_tokens=300,
                temperature=0
            )
            intent_json = response.choices[0].message.content.strip()
            # Ensure the response is valid JSON
            intent = json.loads(intent_json)
            return intent
        except Exception as e:
            print()
            print(f'Error in analyzing user intent: {e}')
            print()
            # Return default intent if analysis fails
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
        """Generate an image using OpenAI's DALL-E 3 and return the image URL."""
        try:
            image_response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                n=1
            )
            image_url = image_response.data[0].url
            return image_url
        except Exception as e:
            print()
            print(f'Error in image generation: {e}')
            print()
            return "Error generating image."

    def generate_chat_response(self, conversation, model, temperature):
        """Generate a chat response using OpenAI's ChatCompletion."""
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=conversation,
                # max_tokens=max_tokens,  # You might want to set this based on requirements
                temperature=temperature
            )
            assistant_reply = response.choices[0].message.content
            return assistant_reply
        except Exception as e:
            print()
            print(f'Error in chat response generation: {e}')
            print()
            return "Error generating response."