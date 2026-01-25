import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi_backend.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails via SMTP"""
    
    @staticmethod
    def send_password_reset_email(email: str, reset_link: str):
        """
        Send password reset email to user.
        
        Args:
            email: Recipient email address
            reset_link: Password reset link with token
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get SMTP settings from config
            smtp_host = getattr(settings, 'SMTP_HOST', 'smtp.gmail.com')
            smtp_port = getattr(settings, 'SMTP_PORT', 587)
            smtp_user = getattr(settings, 'SMTP_USER', None)
            smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
            smtp_from = getattr(settings, 'SMTP_FROM', smtp_user or 'noreply@realeye.com')
            
            # Log configuration status for debugging
            logger.info(f"Attempting to send password reset email to {email}")
            logger.info(f"SMTP Host: {smtp_host}, Port: {smtp_port}")
            logger.info(f"SMTP User configured: {'Yes' if smtp_user else 'No'}")
            logger.info(f"SMTP Password configured: {'Yes' if smtp_password else 'No'}")
            
            # If SMTP is not configured, log and return False
            if not smtp_user or not smtp_password:
                logger.warning(
                    f"SMTP not configured. SMTP_USER={bool(smtp_user)}, SMTP_PASSWORD={bool(smtp_password)}. "
                    "Set SMTP_USER and SMTP_PASSWORD environment variables in .env file. "
                    "For development, password reset link will be returned in API response."
                )
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'RealEye - Password Reset Request'
            msg['From'] = smtp_from
            msg['To'] = email
            
            # Email body
            text_content = f"""
RealEye Password Reset Request

You requested to reset your password for your RealEye account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
RealEye Team
"""
            
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RealEye</h1>
            <p>Password Reset Request</p>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your RealEye account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{reset_link}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <p>Best regards,<br>The RealEye Team</p>
        </div>
        <div class="footer">
            <p>© 2026 RealEye. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            logger.info(f"Connecting to SMTP server {smtp_host}:{smtp_port}...")
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                logger.info("Starting TLS...")
                server.starttls()
                logger.info(f"Logging in as {smtp_user}...")
                server.login(smtp_user, smtp_password)
                logger.info(f"Sending email to {email}...")
                server.send_message(msg)
            
            logger.info(f"✅ Password reset email sent successfully to {email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication failed for {email}: {str(e)}")
            logger.error("Check your SMTP_USER and SMTP_PASSWORD. For Gmail, use an App Password, not your regular password.")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error sending email to {email}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to send password reset email to {email}: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False

