import os
import sys

# Add the parent directory to sys.path so we can import fastapi_backend
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

from fastapi_backend.services.plagiarism_service import plagiarism_service

def process_corpus():
    corpus_dir = os.path.join(parent_dir, "fastapi_backend", "corpus", "bdu_papers")
    
    if not os.path.exists(corpus_dir):
        print(f"Corpus directory not found: {corpus_dir}")
        return

    files = [f for f in os.listdir(corpus_dir) if f.endswith(('.pdf', '.docx'))]
    
    if not files:
        print(f"No PDF or DOCX files found in {corpus_dir}")
        return

    print(f"Found {len(files)} files to process.")
    
    for filename in files:
        file_path = os.path.join(corpus_dir, filename)
        print(f"Processing {filename}...")
        plagiarism_service.process_and_index_file(file_path)
    
    print("Processing complete.")

if __name__ == "__main__":
    process_corpus()
