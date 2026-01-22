# 🚀 Quick MongoDB Setup (5 Minutes)

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account (Free)
- Go to: https://www.mongodb.com/cloud/atlas/register
- Sign up and create a free cluster (M0)

### 2. Get Connection String
- Go to: **Database** → **Connect** → **Connect your application**
- Copy the connection string
- It looks like: `mongodb+srv://username:password@cluster.mongodb.net/`

### 3. Configure Your App

**Create `.env` file:**
```powershell
cd fastapi_backend
copy .env.example .env
```

**Edit `.env` and add your connection string:**
```env
MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/deepfake_db?retryWrites=true&w=majority
```

**Important:** 
- Replace `yourusername` and `yourpassword` with your MongoDB credentials
- Add `/deepfake_db` before the `?` to specify database name

### 4. Whitelist Your IP
- Go to: **Network Access** → **Add IP Address**
- Click **Allow Access from Anywhere** (0.0.0.0/0)
- Click **Confirm**

### 5. Install Dependencies
```powershell
.\venv\Scripts\Activate.ps1
pip install pymongo certifi dnspython
```

### 6. Test It!
```powershell
cd fastapi_backend
python main.py
```

**You should see:**
```
✅ MongoDB connection successful
✅ Model loaded successfully!
```

---

## ✅ That's It!

Now all your video detection results will be saved to MongoDB automatically!

---

## 📊 New API Endpoints

### Get Prediction History
```bash
GET http://localhost:4000/api/predictions
```

### Get User's Predictions
```bash
GET http://localhost:4000/api/predictions?user_email=user@example.com
```

### Get Statistics
```bash
GET http://localhost:4000/api/predictions/stats/summary
```

---

## 📚 Full Documentation

See `MONGODB_SETUP.md` for detailed instructions and troubleshooting.

