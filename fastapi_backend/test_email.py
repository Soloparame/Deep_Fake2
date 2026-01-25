"""
Test script to verify email configuration and send a test email.
Run this from the fastapi_backend directory:
    python test_email.py your-email@example.com
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi_backend.core.config import settings
from fastapi_backend.services.email_service import EmailService

def test_email_config():
    """Test email configuration and send a test email"""
    
    print("=" * 60)
    print("📧 Email Configuration Test")
    print("=" * 60)
    print()
    
    # Check configuration
    print("Configuration Status:")
    print(f"  SMTP_HOST: {settings.SMTP_HOST}")
    print(f"  SMTP_PORT: {settings.SMTP_PORT}")
    print(f"  SMTP_USER: {settings.SMTP_USER or '❌ NOT SET'}")
    print(f"  SMTP_PASSWORD: {'✅ Set' if settings.SMTP_PASSWORD else '❌ NOT SET'}")
    print(f"  SMTP_FROM: {settings.SMTP_FROM}")
    print(f"  FRONTEND_URL: {settings.FRONTEND_URL}")
    print()
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("❌ ERROR: SMTP_USER or SMTP_PASSWORD not configured!")
        print()
        print("Please add these to your fastapi_backend/.env file:")
        print("  SMTP_HOST=smtp.gmail.com")
        print("  SMTP_PORT=587")
        print("  SMTP_USER=your-email@gmail.com")
        print("  SMTP_PASSWORD=your-app-password")
        print("  SMTP_FROM=noreply@realeye.com")
        print("  FRONTEND_URL=http://localhost:3000")
        print()
        print("For Gmail:")
        print("  1. Enable 2-Factor Authentication")
        print("  2. Generate App Password: https://myaccount.google.com/apppasswords")
        print("  3. Use the 16-character app password (not your regular password)")
        return False
    
    # Get test email address
    if len(sys.argv) > 1:
        test_email = sys.argv[1]
    else:
        test_email = input("Enter test email address: ")
    
    if not test_email or "@" not in test_email:
        print("❌ Invalid email address")
        return False
    
    print(f"Sending test email to {test_email}...")
    print()
    
    # Send test email
    test_link = f"{settings.FRONTEND_URL}/reset-password?token=test_token_12345"
    success = EmailService.send_password_reset_email(test_email, test_link)
    
    if success:
        print()
        print("✅ SUCCESS! Test email sent successfully!")
        print(f"   Check {test_email} inbox (and spam folder)")
        return True
    else:
        print()
        print("❌ FAILED! Could not send test email.")
        print("   Check the error messages above for details.")
        print()
        print("Common issues:")
        print("  1. Wrong SMTP credentials")
        print("  2. Gmail: Need to use App Password, not regular password")
        print("  3. Firewall blocking port 587")
        print("  4. SMTP server requires different port (try 465 with SSL)")
        return False

if __name__ == "__main__":
    test_email_config()

