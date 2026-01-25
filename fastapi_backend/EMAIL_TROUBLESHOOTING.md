# Email Troubleshooting Guide

## Quick Check

1. **Check if .env file exists and is in the right location:**
   ```
   fastapi_backend/.env
   ```

2. **Verify your .env file has these lines (no spaces around =):**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password-here
   SMTP_FROM=noreply@realeye.com
   FRONTEND_URL=http://localhost:3000
   ```

3. **Restart your backend server** after changing .env file

4. **Check backend console logs** when you request password reset - you should see:
   ```
   📧 Email Configuration Status:
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: ✅ Set
      SMTP_PASSWORD: ✅ Set
   ```

## Test Your Email Configuration

Run the test script:
```bash
cd fastapi_backend
python test_email.py your-email@example.com
```

This will:
- Show your current configuration
- Send a test email
- Show any errors

## Common Issues

### 1. "SMTP not configured" in logs

**Problem:** Environment variables not loading

**Solution:**
- Make sure `.env` file is in `fastapi_backend/` directory
- Check for typos in variable names (must be exact: `SMTP_USER`, `SMTP_PASSWORD`)
- No spaces around `=` sign: `SMTP_USER=email@gmail.com` ✅ (not `SMTP_USER = email@gmail.com` ❌)
- Restart backend server after changing .env

### 2. "SMTP Authentication failed"

**Problem:** Wrong credentials

**For Gmail:**
- ❌ Don't use your regular Gmail password
- ✅ Use an **App Password** instead:
  1. Go to: https://myaccount.google.com/apppasswords
  2. Enable 2-Factor Authentication first (if not already)
  3. Generate App Password for "Mail"
  4. Copy the 16-character password
  5. Use that as `SMTP_PASSWORD` in .env

**For other providers:**
- Check your email provider's SMTP settings
- Some providers require special passwords or API keys

### 3. "Connection timeout" or "Connection refused"

**Problem:** Network/firewall blocking SMTP

**Solutions:**
- Check if port 587 is blocked by firewall
- Try port 465 (requires SSL, code modification needed)
- Check if your network allows SMTP connections
- Some corporate networks block SMTP

### 4. Email sent but not received

**Check:**
- ✅ Spam/Junk folder
- ✅ Email address is correct
- ✅ Wait a few minutes (some providers delay emails)
- ✅ Check backend logs for "✅ Password reset email sent successfully"

### 5. "Module 'smtplib' not found"

**Problem:** Python environment issue

**Solution:**
- `smtplib` is built-in to Python, shouldn't need installation
- Make sure you're using the correct Python environment
- Try: `python -c "import smtplib; print('OK')"`

## Debug Steps

1. **Check backend startup logs:**
   When you start the backend, you should see:
   ```
   Loading email config from: C:\Users\...\fastapi_backend\.env
   📧 Email Configuration Status:
      SMTP_USER: ✅ Set
      SMTP_PASSWORD: ✅ Set
   ```

2. **Check logs when requesting password reset:**
   Look for these messages in backend console:
   ```
   Attempting to send password reset email to user@example.com
   SMTP Host: smtp.gmail.com, Port: 587
   SMTP User configured: Yes
   SMTP Password configured: Yes
   Connecting to SMTP server...
   Starting TLS...
   Logging in as...
   Sending email...
   ✅ Password reset email sent successfully
   ```

3. **If you see errors:**
   - Copy the full error message
   - Check which step failed (connection, login, sending)
   - Common error types:
     - `SMTPAuthenticationError` = wrong password
     - `SMTPConnectError` = can't connect to server
     - `TimeoutError` = connection timeout

## Alternative: Use Email Service Providers

If SMTP is too complicated, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, requires AWS account)
- **Resend** (modern, developer-friendly)

These services provide:
- Better deliverability
- Easier setup (just API key)
- Better error handling
- Analytics

## Still Not Working?

1. Run the test script: `python test_email.py your-email@example.com`
2. Check backend console for detailed error messages
3. Verify .env file location and format
4. Try a different email provider
5. Check if your email provider has special requirements

