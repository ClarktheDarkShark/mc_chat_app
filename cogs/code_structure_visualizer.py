import os
import uuid
import graphviz
from flask import current_app

class CodeStructureVisualizerCog:
    def __init__(self, upload_folder):
        """
        Initialize the CodeStructureVisualizerCog.

        :param upload_folder: Path to the folder where uploaded files and generated images are stored.
        """
        self.upload_folder = upload_folder
        
        # Explicitly add Graphviz path
        os.environ["PATH"] += os.pathsep + '/app/.heroku-buildpack-graphviz/usr/bin'

    def generate_codebase_structure_diagram(self):
        """
        Generate a visual representation of the codebase structure using Graphviz.

        :return: URL path to the generated image or None if generation fails.
        """
        try:
            current_file_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.abspath(os.path.join(current_file_dir, '..'))

            print(f"Scanning root directory: {root_dir}")

            dot = graphviz.Digraph(comment='Codebase Structure', format='png')
            dot.attr(dpi='300')  # High resolution for clarity

            def add_nodes_edges(current_path, parent=None):
                directory = os.path.basename(current_path)
                node_id = current_path.replace(os.sep, '_')

                if parent:
                    dot.node(node_id, directory, shape='folder')
                    dot.edge(parent, node_id)
                else:
                    dot.node(node_id, directory, shape='folder')

                for entry in os.listdir(current_path):
                    path = os.path.join(current_path, entry)
                    if os.path.isdir(path):
                        add_nodes_edges(path, node_id)
                    else:
                        file_node_id = path.replace(os.sep, '_')
                        dot.node(file_node_id, entry, shape='note')
                        dot.edge(node_id, file_node_id)

            add_nodes_edges(root_dir)

            output_filename = f"codebase_structure_{uuid.uuid4()}"
            dot.render(filename=output_filename, directory=self.upload_folder, cleanup=True)
            image_path = os.path.join(self.upload_folder, f"{output_filename}.png")
            image_url = f"/uploads/{output_filename}.png"

            print(f"Codebase structure diagram generated at: {image_path}")

            return image_url

        except Exception as e:
            print(f"Error generating codebase structure diagram: {e}")
            return None
