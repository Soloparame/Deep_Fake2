# Email Configuration for Password Reset

## Overview

The RealEye backend now supports sending password reset emails via SMTP. When a user requests a password reset, they will receive a verification email with a reset link.

## Configuration

### Step 1: Add Email Settings to `.env`

Add the following environment variables to your `fastapi_backend/.env` file:

```env
# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@realeye.com
FRONTEND_URL=http://localhost:3000
```

### Step 2: Gmail Setup (Example)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "RealEye" as the name
   - Copy the generated 16-character password
   - Use this as `SMTP_PASSWORD` in your `.env` file

3. **Use your Gmail address** as `SMTP_USER`

### Step 3: Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## Development Mode

If SMTP is not configured, the backend will:
- Still generate the reset token
- Return the reset link in the API response (for development only)
- Log a warning about missing SMTP configuration

**Note:** In production, always configure SMTP properly.

## Testing

1. Start the backend server
2. Request a password reset via the frontend or API:
   ```bash
   POST http://localhost:4000/api/auth/forgot-password
   Content-Type: application/json
   
   {
     "email": "user@example.com"
   }
   ```
3. Check the user's email inbox for the reset link
4. Click the link to reset the password

## Troubleshooting

### Email not sending
- Check that SMTP credentials are correct
- Verify SMTP_HOST and SMTP_PORT are correct for your provider
- Check firewall/network settings
- Review backend logs for error messages

### Gmail "Less secure app" error
- Use App Passwords instead of your regular password
- Enable 2-Factor Authentication first

### Connection timeout
- Check if port 587 is blocked by firewall
- Try port 465 with SSL instead (requires code modification)

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords, not your main account password
- In production, consider using a dedicated email service (SendGrid, Mailgun, AWS SES)
- Reset tokens expire after 1 hour

