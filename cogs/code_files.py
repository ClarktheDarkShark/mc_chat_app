# cogs/code_files.py
import os

class CodeFilesCog:
    def __init__(self, base_dir=''):
        """
        Initialize the CodeFilesCog.

        :param base_dir: Base directory to search for code files. Defaults to current directory.
        """
        self.base_dir = base_dir or os.getcwd()

    def get_all_code_files_content(self):
        """
        Retrieve the content of all Python files in the base directory and 'cogs' subdirectory.

        :return: Concatenated string of all code file contents.
        """
        code_content = ""
        
        # Path to bot.py
        bot_file = os.path.join(self.base_dir, 'bot.py')
        
        # Check if bot.py exists and read its content
        if os.path.isfile(bot_file):
            try:
                with open(bot_file, 'r', encoding='utf-8') as f:
                    code_content += f.read() + "\n\n"
                print(f"Included file: {bot_file}")
            except Exception as e:
                print(f"Error reading {bot_file}: {e}")
        else:
            print(f"{bot_file} does not exist.")
        
        # Path to cogs directory
        cogs_dir = os.path.join(self.base_dir, 'cogs')
        
        # Check if cogs directory exists
        if os.path.isdir(cogs_dir):
            # Iterate over all files in the cogs directory
            for file_name in os.listdir(cogs_dir):
                # Process only .py files
                if file_name.endswith('.py'):
                    file_path = os.path.join(cogs_dir, file_name)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            code_content += f.read() + "\n\n"
                        print(f"Included file: {file_path}")
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
        else:
            print(f"The directory '{cogs_dir}' does not exist.")
        
        return code_content
