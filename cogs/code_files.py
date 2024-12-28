# cogs/code_files.py
import os

class CodeFilesCog:
    def __init__(self, base_dir=''):
        """
        Initialize the CodeFilesCog.

        :param base_dir: Base directory to search for code files. Defaults to current working directory.
        """
        self.base_dir = base_dir or os.getcwd()

    def get_all_code_files_content(self):
        """
        Retrieve the content of all Python files in the base directory and its subdirectories.

        :return: Concatenated string of all code file contents.
        """
        code_content = ""
        
        for root, dirs, files in os.walk(self.base_dir):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            code_content += f.read() + "\n\n"
                        print(f"Included file: {file_path}")
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
        
        if not code_content:
            print("No Python files found in the specified directory.")
        
        return code_content
