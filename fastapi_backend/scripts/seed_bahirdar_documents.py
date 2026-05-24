"""
Add PDF/DOCX files to MongoDB collection `bahirdar_documents`.

Usage (from repo root):
  python fastapi_backend/scripts/seed_bahirdar_documents.py --folder path/to/bahirdar_documents
  python fastapi_backend/scripts/seed_bahirdar_documents.py --file path/to/thesis.pdf
  python fastapi_backend/scripts/seed_bahirdar_documents.py --folder ./bahirdar_documents --force
"""
from __future__ import annotations

import argparse
import os
import sys

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from fastapi_backend.database import bahirdar_documents_col, mongo_is_connected  # noqa: E402
from fastapi_backend.services.bahirdar_corpus_service import ingest_file, ingest_folder  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed bahirdar_documents MongoDB collection")
    parser.add_argument("--folder", help="Folder containing PDF/DOCX files")
    parser.add_argument("--file", help="Single PDF or DOCX file to add")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-ingest even if file_path/title already exists",
    )
    args = parser.parse_args()

    if not mongo_is_connected():
        print("ERROR: MongoDB not connected. Set MONGO_URI in fastapi_backend/.env")
        raise SystemExit(1)

    if not args.folder and not args.file:
        default = os.path.join(_REPO_ROOT, "bahirdar_documents")
        if os.path.isdir(default):
            args.folder = default
            print(f"Using default folder: {default}")
        else:
            parser.error("Provide --folder or --file (or create ./bahirdar_documents)")

    skip_existing = not args.force

    if args.file:
        doc_id = ingest_file(args.file, skip_existing=skip_existing)
        print(f"OK — document id: {doc_id}")
    else:
        added, skipped, errors = ingest_folder(args.folder, skip_existing=skip_existing)
        print(f"Added: {added}, skipped (already in DB): {skipped}")
        for err in errors:
            print(f"  ERROR: {err}")

    total = bahirdar_documents_col.count_documents({})
    print(f"Total documents in bahirdar_documents: {total}")


if __name__ == "__main__":
    main()
