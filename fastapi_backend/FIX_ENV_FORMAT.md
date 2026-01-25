# Fix .env File Format

Based on the logs, your `.env` file is being loaded but the variables aren't being read. This is almost always a **formatting issue**.

## ❌ Common Wrong Formats:

```env
# WRONG - spaces around =
SMTP_USER = yihenewrebika@gmail.com
SMTP_PASSWORD = yourpassword

# WRONG - quotes
SMTP_USER="yihenewrebika@gmail.com"
SMTP_PASSWORD="yourpassword"

# WRONG - wrong variable name
SMTP_USERNAME=yihenewrebika@gmail.com  # Should be SMTP_USER, not SMTP_USERNAME

# WRONG - empty value
SMTP_USER=
SMTP_PASSWORD=
```

## ✅ Correct Format:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yihenewrebika@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=noreply@realeye.com
FRONTEND_URL=http://localhost:3000
```

## Key Rules:

1. **NO spaces around `=`**: Use `SMTP_USER=email`, NOT `SMTP_USER = email`
2. **NO quotes**: Use `SMTP_USER=email`, NOT `SMTP_USER="email"`
3. **Exact variable names**: Must be `SMTP_USER` and `SMTP_PASSWORD` (case-sensitive)
4. **No empty lines between variable name and value**
5. **Values must be on the same line** (no line breaks)

## How to Fix:

1. Open `fastapi_backend/.env` in a text editor
2. Find lines 7-12 (where your email config is)
3. Make sure they look exactly like this:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yihenewrebika@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM=noreply@realeye.com
FRONTEND_URL=http://localhost:3000
```

4. **Remove any spaces** around the `=` signs
5. **Remove any quotes** around the values
6. **Save the file**
7. **Restart your backend server**

## For Gmail:

- Use an **App Password**, not your regular password
- Get it from: https://myaccount.google.com/apppasswords
- The App Password is 16 characters (may have spaces, that's OK)
- Example: `SMTP_PASSWORD=abcd efgh ijkl mnop` (spaces in password are OK)

## Test:

After fixing, restart your backend and check the startup logs. You should see:

```
SMTP_USER: yihenewrebika@gmail.com
SMTP_PASSWORD: SET (16 chars)
```

Instead of:

```
SMTP_USER: Not set
SMTP_PASSWORD: Not set
```

