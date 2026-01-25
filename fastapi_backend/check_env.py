"""
Quick script to check if .env file exists and what email variables are set.
Run: python check_env.py
"""

import os
from pathlib import Path

# Find .env file
base_dir = Path(__file__).parent  # fastapi_backend directory
env_path = base_dir / ".env"

print("=" * 60)
print("🔍 Checking .env File Configuration")
print("=" * 60)
print()

print(f"Looking for .env file at: {env_path}")
print(f"File exists: {env_path.exists()}")
print()

if not env_path.exists():
    print("❌ .env file NOT FOUND!")
    print()
    print("Please create a .env file at:")
    print(f"   {env_path}")
    print()
    print("With the following content:")
    print("   SMTP_HOST=smtp.gmail.com")
    print("   SMTP_PORT=587")
    print("   SMTP_USER=your-email@gmail.com")
    print("   SMTP_PASSWORD=your-app-password")
    print("   SMTP_FROM=noreply@realeye.com")
    print("   FRONTEND_URL=http://localhost:3000")
    exit(1)

print("✅ .env file found!")
print()

# Read and check contents
from dotenv import load_dotenv
load_dotenv(env_path)

print("Email Configuration Variables:")
print("-" * 60)

smtp_host = os.getenv("SMTP_HOST", "")
smtp_port = os.getenv("SMTP_PORT", "")
smtp_user = os.getenv("SMTP_USER", "")
smtp_password = os.getenv("SMTP_PASSWORD", "")
smtp_from = os.getenv("SMTP_FROM", "")
frontend_url = os.getenv("FRONTEND_URL", "")

print(f"SMTP_HOST:     {smtp_host if smtp_host else '❌ NOT SET'}")
print(f"SMTP_PORT:     {smtp_port if smtp_port else '❌ NOT SET'}")
print(f"SMTP_USER:     {smtp_user if smtp_user else '❌ NOT SET'}")
print(f"SMTP_PASSWORD: {'✅ SET (' + str(len(smtp_password)) + ' chars)' if smtp_password else '❌ NOT SET'}")
print(f"SMTP_FROM:     {smtp_from if smtp_from else '❌ NOT SET (will use SMTP_USER)'}")
print(f"FRONTEND_URL:  {frontend_url if frontend_url else '❌ NOT SET'}")
print()

# Check if required variables are set
all_set = smtp_host and smtp_port and smtp_user and smtp_password

if all_set:
    print("✅ All required email variables are set!")
    print()
    print("If emails still don't work:")
    print("  1. Make sure you restarted the backend server")
    print("  2. Check that SMTP_PASSWORD is an App Password (for Gmail)")
    print("  3. Check backend logs for detailed error messages")
else:
    print("❌ Some required variables are missing!")
    print()
    print("Required variables:")
    print("  - SMTP_HOST")
    print("  - SMTP_PORT")
    print("  - SMTP_USER")
    print("  - SMTP_PASSWORD")
    print()
    print("Optional variables:")
    print("  - SMTP_FROM (defaults to SMTP_USER)")
    print("  - FRONTEND_URL (defaults to http://localhost:3000)")

print()
print("=" * 60)

