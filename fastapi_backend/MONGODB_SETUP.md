# MongoDB Setup Guide for RealEye

## 📋 Overview

This guide will help you set up MongoDB for storing video detection results, user data, and chat history.

---

## 🎯 What Gets Stored in MongoDB

1. **Users** - User accounts (email, password hash, name)
2. **Predictions** - Video detection results (result, confidence, filename, timestamp)
3. **Chats** - Chat conversation history

---

## 🚀 Quick Setup (MongoDB Atlas - Recommended)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new cluster (Free tier M0 is fine)

### Step 2: Create Database User

1. Go to **Database Access** → **Add New Database User**
2. Choose **Password** authentication
3. Set username and password (save these!)
4. Set privileges: **Atlas admin** (or read/write to any database)
5. Click **Add User**

### Step 3: Whitelist Your IP Address

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (0.0.0.0/0) for development
   - Or add your specific IP for production
3. Click **Confirm**

### Step 4: Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Configure Your App

1. Copy `.env.example` to `.env`:
   ```powershell
   copy fastapi_backend\.env.example fastapi_backend\.env
   ```

2. Edit `fastapi_backend\.env` and paste your connection string:
   ```env
   MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/deepfake_db?retryWrites=true&w=majority
   ```
   
   **Important:** Replace:
   - `yourusername` with your database username
   - `yourpassword` with your database password
   - `cluster0.xxxxx` with your cluster name
   - Add `/deepfake_db` before the `?` to specify database name

3. Save the file

### Step 6: Install Dependencies

```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install MongoDB dependencies
pip install pymongo certifi dnspython
```

### Step 7: Test Connection

Start your backend:
```powershell
cd fastapi_backend
python main.py
```

You should see:
```
✅ MongoDB connection successful
✅ Model loaded successfully!
```

---

## 🖥️ Local MongoDB Setup (Alternative)

If you prefer to run MongoDB locally:

### Step 1: Install MongoDB

**Windows:**
1. Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will run as a Windows service

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Step 2: Configure Connection

Edit `fastapi_backend\.env`:
```env
MONGO_URI=mongodb://localhost:27017/deepfake_db
```

### Step 3: Test

Start backend and verify connection.

---

## 📊 Database Structure

### Collections

#### 1. `users`
```json
{
  "_id": "ObjectId",
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "password_hash": "sha256_hash",
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### 2. `predictions`
```json
{
  "_id": "ObjectId",
  "id": "uuid",
  "user_email": "john@example.com",
  "filename": "video.mp4",
  "result": "FAKE",
  "confidence": 95.5,
  "message": "The video is likely manipulated.",
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### 3. `chats`
```json
{
  "_id": "ObjectId",
  "id": "uuid",
  "user_id": "uuid",
  "messages": [...],
  "created_at": "2024-01-01T12:00:00Z"
}
```

---

## 🔌 API Endpoints

### Prediction History

#### Get All Predictions
```http
GET /api/predictions
```

**Query Parameters:**
- `user_email` (optional) - Filter by user
- `limit` (optional, default: 50) - Max results
- `skip` (optional, default: 0) - Pagination offset
- `result` (optional) - Filter by "REAL" or "FAKE"

**Example:**
```bash
curl http://localhost:4000/api/predictions?user_email=john@example.com&limit=10
```

#### Get Single Prediction
```http
GET /api/predictions/{prediction_id}
```

#### Delete Prediction
```http
DELETE /api/predictions/{prediction_id}
```

#### Get Statistics
```http
GET /api/predictions/stats/summary?user_email=john@example.com
```

**Response:**
```json
{
  "total": 100,
  "real_count": 60,
  "fake_count": 40,
  "average_confidence": 87.5
}
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for database users
3. **Restrict IP access** in production (don't use 0.0.0.0/0)
4. **Use environment variables** for all secrets
5. **Enable MongoDB encryption** for production

---

## 🐛 Troubleshooting

### Error: "MongoDB connection failed"

**Possible causes:**
1. **IP not whitelisted** - Add your IP in MongoDB Atlas Network Access
2. **Wrong credentials** - Check username/password in connection string
3. **Network issues** - Check internet connection
4. **Firewall blocking** - Allow MongoDB ports (27017 for local, 443 for Atlas)

**Solution:**
- Check MongoDB Atlas dashboard for connection status
- Verify `.env` file has correct `MONGO_URI`
- Check backend logs for specific error messages

### Error: "certifi not found"

**Solution:**
```powershell
pip install certifi
```

### Fallback to JSON Storage

If MongoDB connection fails, the app automatically falls back to JSON file storage:
- `local_db_users.json`
- `local_db_predictions.json`
- `local_db_chats.json`

This allows the app to work without MongoDB, but data is stored locally only.

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created
- [ ] Database user created
- [ ] IP address whitelisted
- [ ] Connection string copied
- [ ] `.env` file created with `MONGO_URI`
- [ ] Dependencies installed (`pymongo`, `certifi`, `dnspython`)
- [ ] Backend starts without errors
- [ ] See "✅ MongoDB connection successful" in logs
- [ ] Can create predictions and see them in database

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for viewing data

---

## 🎉 You're All Set!

Once MongoDB is connected, all video detection results will be automatically saved to the database. You can query them using the API endpoints or view them in MongoDB Compass.





