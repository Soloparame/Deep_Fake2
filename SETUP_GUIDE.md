# 🚀 Complete Setup Guide - RealEye Project

## 📋 Prerequisites

- **Python 3.10+** installed
- **Node.js 18+** installed
- **Git** (optional, for version control)

---

## 🎯 Step-by-Step Setup Instructions

### **STEP 1: Navigate to Project Directory**

Open PowerShell or Terminal and navigate to your project:

```powershell
cd C:\Users\haile\OneDrive\Documents\RealEye
```

---

### **STEP 2: Setup Backend (FastAPI)**

#### 2.1 Activate Virtual Environment

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run this first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

You should see `(venv)` in your prompt.

#### 2.2 Install Backend Dependencies

```powershell
# Navigate to backend folder
cd fastapi_backend

# Install dependencies
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi-0.104.1 tensorflow-2.15.0 opencv-python-4.8.1.78 ...
```

#### 2.3 Verify Model File Location

Make sure your `deepfake_model.h5` file is here:
```
fastapi_backend/models/deepfake_model.h5
```

If it's not there, copy it:
```powershell
# Check if model exists
dir fastapi_backend\models\

# If missing, copy from public folder (if you have it there)
# copy public\deepfake_detector.h5 fastapi_backend\models\deepfake_model.h5
```

#### 2.4 Start Backend Server

```powershell
# Make sure you're in fastapi_backend directory
cd fastapi_backend

# Start the server
python main.py
```

**Expected output:**
```
INFO:     Loading model from fastapi_backend/models/deepfake_model.h5...
INFO:     Model loaded successfully!
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:4000
```

**✅ Backend is now running!** Keep this terminal open.

---

### **STEP 3: Setup Frontend (Next.js)**

#### 3.1 Open a NEW Terminal/PowerShell Window

Keep the backend running, open a **new** PowerShell window.

#### 3.2 Navigate to Project Root

```powershell
cd C:\Users\haile\OneDrive\Documents\RealEye
```

#### 3.3 Install Frontend Dependencies

```powershell
# Install Node.js dependencies
npm install

# OR if you prefer pnpm:
# pnpm install
```

**Expected output:**
```
added 500+ packages
```

#### 3.4 Start Frontend Development Server

```powershell
npm run dev

# OR if using pnpm:
# pnpm dev
```

**Expected output:**
```
  ▲ Next.js 15.1.6
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

**✅ Frontend is now running!**

---

### **STEP 4: Access the Application**

1. **Open your browser** and go to: `http://localhost:3000`

2. **Sign in** (or sign up if needed)

3. **Navigate to Upload page**: Click "Upload" in the navigation

4. **Upload a video** and click "Initiate Scan"

5. **Wait for analysis** - The backend will process the video and return results

---

## 🔧 Troubleshooting

### ❌ Error: "requirements.txt not found"

**Problem:** You're in the wrong directory.

**Solution:**
```powershell
# Make sure you're in the fastapi_backend folder
cd fastapi_backend
pip install -r requirements.txt
```

---

### ❌ Error: "deepfakeDetector is not defined"

**Problem:** Frontend was trying to use client-side model (now fixed).

**Solution:** 
- ✅ This is already fixed in the code
- Make sure you've pulled the latest changes
- Restart the frontend server: `npm run dev`

---

### ❌ Error: "Cannot connect to backend"

**Problem:** Backend server is not running.

**Solution:**
1. Check if backend is running on `http://localhost:4000`
2. Open browser and visit: `http://localhost:4000/health`
3. Should return: `{"status": "ok"}`
4. If not, start backend: `cd fastapi_backend && python main.py`

---

### ❌ Error: "Model file not found"

**Problem:** `deepfake_model.h5` is missing.

**Solution:**
```powershell
# Check if model exists
dir fastapi_backend\models\deepfake_model.h5

# If missing, place your model file there
# Copy from wherever you have it:
# copy "path\to\your\deepfake_model.h5" fastapi_backend\models\
```

---

### ❌ Error: "TensorFlow not installed"

**Problem:** Dependencies not installed.

**Solution:**
```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Install dependencies
cd fastapi_backend
pip install -r requirements.txt
```

---

### ❌ Error: "Port 4000 already in use"

**Problem:** Another process is using port 4000.

**Solution:**
```powershell
# Option 1: Kill the process using port 4000
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F

# Option 2: Change port in main.py (line 58)
# Change: port=4000 to port=4001
```

---

## 📝 Quick Reference Commands

### Backend Commands
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install dependencies
cd fastapi_backend
pip install -r requirements.txt

# Start server
python main.py

# Test endpoint (in another terminal)
curl -X POST http://localhost:4000/api/detect-video -F "file=@test_video.mp4"
```

### Frontend Commands
```powershell
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
npm start
```

---

## 🎯 Project Structure Summary

```
RealEye/
├── fastapi_backend/          # Backend (Python/FastAPI)
│   ├── main.py              # Server entry point
│   ├── requirements.txt    # Python dependencies
│   ├── models/
│   │   └── deepfake_model.h5  # YOUR MODEL FILE HERE
│   ├── routers/
│   │   └── detect.py        # Detection endpoint
│   └── services/
│       └── model_service.py # ML logic
│
├── app/                      # Frontend (Next.js/React)
│   └── upload/
│       └── page.tsx         # Upload page (FIXED)
│
├── package.json              # Node.js dependencies
└── venv/                     # Python virtual environment
```

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] Backend dependencies installed (`pip install -r fastapi_backend/requirements.txt`)
- [ ] Model file exists (`fastapi_backend/models/deepfake_model.h5`)
- [ ] Backend server running (`python fastapi_backend/main.py`)
- [ ] Backend accessible (`http://localhost:4000/health` returns `{"status": "ok"}`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Frontend accessible (`http://localhost:3000`)

---

## 🚀 Running Everything

### Terminal 1 - Backend:
```powershell
cd C:\Users\haile\OneDrive\Documents\RealEye
.\venv\Scripts\Activate.ps1
cd fastapi_backend
python main.py
```

### Terminal 2 - Frontend:
```powershell
cd C:\Users\haile\OneDrive\Documents\RealEye
npm run dev
```

### Browser:
- Open: `http://localhost:3000`
- Go to Upload page
- Upload video and scan!

---

## 📞 Need Help?

1. Check backend logs for errors
2. Check browser console (F12) for frontend errors
3. Verify both servers are running
4. Test backend directly: `http://localhost:4000/health`

---

**🎉 You're all set! Happy coding!**

