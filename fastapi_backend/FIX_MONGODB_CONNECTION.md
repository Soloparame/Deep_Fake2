# 🔧 Fix MongoDB Connection Error

## ❌ The Problem

Your error shows:
```
ac-tekat1t-shard-00-00.eix7wzd.mongodb.net:27017: [WinError 10061] No connection could be made
```

This means your connection string is **WRONG**. It's trying to use port 27017, but MongoDB Atlas requires `mongodb+srv://` format (no port).

---

## ✅ THE FIX

### Step 1: Get the CORRECT Connection String from Atlas

1. **Go to MongoDB Atlas Dashboard**
2. **Click "Database"** (left sidebar)
3. **Click "Connect"** button on your cluster
4. **Choose "Connect your application"**
5. **Select "Python"** and version **"3.6 or later"**
6. **Copy the connection string**

It should look like this:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**IMPORTANT:** Notice it says `mongodb+srv://` NOT `mongodb://`

---

### Step 2: Fix Your .env File

Open `fastapi_backend\.env` and make sure it looks like this:

```env
MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/deepfake_db?retryWrites=true&w=majority
```

**Key Points:**
1. ✅ Must start with `mongodb+srv://` (NOT `mongodb://`)
2. ✅ Replace `<username>` with your database username
3. ✅ Replace `<password>` with your database password
4. ✅ Replace `cluster0.xxxxx` with your actual cluster name
5. ✅ Add `/deepfake_db` before the `?` (this is the database name)
6. ✅ NO port number (27017) should be in the string

**Example:**
```env
MONGO_URI=mongodb+srv://myuser:mypassword123@ac-tekat1t-shard-00-00.eix7wzd.mongodb.net/deepfake_db?retryWrites=true&w=majority
```

---

### Step 3: URL Encode Your Password

If your password has special characters (`@`, `#`, `%`, etc.), you need to URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |

**Example:**
- Password: `my@pass#123`
- Encoded: `my%40pass%23123`
- Connection string: `mongodb+srv://user:my%40pass%23123@cluster...`

**OR** use Atlas's connection string builder - it does this automatically!

---

### Step 4: Verify Network Access

Even with the correct connection string, you need:

1. **Go to "Network Access"** in Atlas
2. **Click "Add IP Address"**
3. **Click "Allow Access from Anywhere"** (0.0.0.0/0)
4. **Click "Confirm"**
5. **Wait 1-2 minutes** for changes to propagate

---

### Step 5: Test Connection

Restart your backend:
```powershell
# Stop backend (Ctrl+C)
# Then restart:
uvicorn fastapi_backend.main:app --host 0.0.0.0 --port 4000 --reload
```

**You should see:**
```
✅ MongoDB connection successful
✅ Model loaded successfully!
```

---

## 🔍 Common Mistakes

### ❌ WRONG:
```env
MONGO_URI=mongodb://user:pass@cluster.mongodb.net:27017/deepfake_db
```
- Using `mongodb://` instead of `mongodb+srv://`
- Including port `:27017`

### ✅ CORRECT:
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/deepfake_db?retryWrites=true&w=majority
```
- Using `mongodb+srv://`
- NO port number
- Has `/deepfake_db` before `?`

---

## 🆘 Still Not Working?

### Check 1: Verify Connection String Format
```powershell
# In PowerShell, check your .env file (don't show password!)
Get-Content fastapi_backend\.env | Select-String "MONGO_URI"
```

Should show: `MONGO_URI=mongodb+srv://...`

### Check 2: Test Connection Manually
```powershell
python -c "from pymongo import MongoClient; import os; from dotenv import load_dotenv; load_dotenv('fastapi_backend/.env'); client = MongoClient(os.getenv('MONGO_URI'), serverSelectionTimeoutMS=5000); client.admin.command('ping'); print('✅ Connection works!')"
```

### Check 3: Verify Database User
- Go to **Database Access** in Atlas
- Make sure your user exists and password is correct
- User should have **Atlas admin** or **read/write** privileges

### Check 4: Check Firewall/Antivirus
- Some firewalls block MongoDB connections
- Temporarily disable to test
- Or add MongoDB to firewall exceptions

---

## 📝 Quick Checklist

- [ ] Connection string uses `mongodb+srv://` (NOT `mongodb://`)
- [ ] No port number (27017) in connection string
- [ ] Username and password are correct
- [ ] Password is URL-encoded if it has special characters
- [ ] Database name `/deepfake_db` is in the URI
- [ ] IP address is whitelisted in Network Access (0.0.0.0/0)
- [ ] Waited 1-2 minutes after whitelisting IP
- [ ] Database user exists and has correct privileges

---

## ✅ After Fixing

Once you see `✅ MongoDB connection successful`, you can:

1. **View data in Atlas:**
   - Go to **Database** → **Browse Collections**
   - See `deepfake_db` → `users`, `predictions`, `chats`

2. **Or use MongoDB Compass:**
   - Download from [mongodb.com/compass](https://www.mongodb.com/products/compass)
   - Connect with your connection string
   - Browse collections visually

---

**🎉 Fix your connection string format and it will work!**




