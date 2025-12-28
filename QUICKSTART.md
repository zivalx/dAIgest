# Daigest Quick Start Guide

## Step-by-Step Setup for Testing

### 1️⃣ Backend Setup (5 minutes)

#### Create Python virtual environment
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

#### Install dependencies
```bash
pip install -r requirements.txt
```

#### Create .env file
```bash
# Copy example (you're in backend/ directory)
cp .env.example .env

# Edit .env file with minimal setup:
```

**Minimal .env for testing (SQLite + OpenAI):**
```env
# Database (SQLite for quick testing)
DATABASE_URL=sqlite+aiosqlite:///./daigest.db

# LLM Provider (just need one)
OPENAI_API_KEY=sk-your-actual-openai-key

# For Reddit testing (optional)
REDDIT_CLIENT_1_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_1_CLIENT_SECRET=your-reddit-client-secret
REDDIT_CLIENT_1_USER_AGENT=Daigest/2.0
```

#### Initialize database
```bash
# Create tables
python init_db.py

# Or with sample data
python init_db.py --seed
```

#### Start backend
```bash
uvicorn src.main:app --reload --host 127.0.0.1 --port 8001
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete.
```

✅ **Test it:** Open http://127.0.0.1:8001/health in browser - should see `{"status":"healthy",...}`

---

### 2️⃣ Frontend Setup (2 minutes)

**Open a NEW terminal (keep backend running)**

```bash
cd frontend
npm install
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3001
```

✅ **Test it:** Browser should automatically open to http://localhost:3001

---

### 3️⃣ Quick Functionality Test

#### Test 1: Health Check
```bash
curl http://127.0.0.1:8001/health
```

**Expected:** `{"status":"healthy","database":"connected",...}`

#### Test 2: Create a Source Config (via API)
```bash
curl -X POST http://127.0.0.1:8001/api/configs/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Reddit Config",
    "source_type": "reddit",
    "credential_ref": "REDDIT_CLIENT_1",
    "collect_spec": {
      "subreddits": ["python"],
      "max_posts": 5,
      "sort": "hot"
    },
    "enabled": true
  }'
```

**Expected:** JSON response with config ID

#### Test 3: List Configs
```bash
curl http://127.0.0.1:8001/api/configs/
```

**Expected:** Array with your config

#### Test 4: Create a Test Cycle (Small Test)
```bash
curl -X POST http://127.0.0.1:8001/api/cycles/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cycle",
    "sources": [
      {
        "source_type": "pytrends",
        "credential_ref": "PYTRENDS",
        "collect_spec": {
          "keywords": ["python", "javascript"],
          "timeframe": "today 1-m"
        }
      }
    ],
    "llm_provider": "openai",
    "llm_model": "gpt-4o-mini"
  }'
```

**Note:** PyTrends doesn't require credentials, so this will work immediately!

#### Test 5: View Cycle
```bash
# Get the cycle_id from the response above, then:
curl http://127.0.0.1:8001/api/cycles/{cycle_id}
```

---

### 4️⃣ Frontend Testing

1. **Open http://localhost:3001**

2. **Tab 1: Configure Sources**
   - Select "Google Trends" (no credentials needed)
   - Name: "My Trends Config"
   - Credential Ref: "PYTRENDS"
   - Keywords: `python, javascript, rust`
   - Timeframe: `today 3-m`
   - Click "Create Configuration"

3. **Tab 2: Cycle History & Summaries**
   - Should see your test cycle
   - Click the "eye" icon to view summary
   - Check the AI summary, cost, tokens, etc.

---

## 🐛 Troubleshooting

### Backend won't start

**Error: `ModuleNotFoundError: No module named 'src'`**
```bash
# Make sure you're in the backend directory
cd backend
# Activate venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

**Error: `sqlalchemy.exc.OperationalError`**
```bash
# Check DATABASE_URL in .env
# For quick test, use SQLite:
DATABASE_URL=sqlite+aiosqlite:///./daigest.db
```

**Error: `OPENAI_API_KEY not set`**
```bash
# Edit backend/.env and add your OpenAI key
OPENAI_API_KEY=sk-your-actual-key
```

### Frontend won't start

**Error: `npm: command not found`**
```bash
# Install Node.js from https://nodejs.org/
```

**Error: `Cannot GET /`**
```bash
# Make sure backend is running on port 8001
# Check http://127.0.0.1:8001/health
```

### API Errors

**Error: `CORS error` in browser**
```python
# backend/src/main.py should have:
allow_origins=["http://localhost:3001"]
```

**Error: `401 Unauthorized` when collecting**
```bash
# Check credentials in .env match credential_ref in config
# Example: If credential_ref="REDDIT_CLIENT_1", need:
# REDDIT_CLIENT_1_CLIENT_ID=...
# REDDIT_CLIENT_1_CLIENT_SECRET=...
```

---

## 📝 What to Test

### ✅ Basic Flow (No External APIs)
1. Health check works
2. Can create source config
3. Can list configs
4. Frontend loads

### ✅ PyTrends (No Credentials Needed)
1. Create PyTrends config
2. Trigger cycle with PyTrends
3. View summary

### ✅ Reddit (Needs Credentials)
1. Get Reddit API credentials from https://www.reddit.com/prefs/apps
2. Add to .env
3. Create Reddit config
4. Trigger cycle
5. View summary with Reddit data

### ✅ OpenAI Summarization
1. Ensure OPENAI_API_KEY in .env
2. Create cycle (any source)
3. Check summary has text
4. Verify cost tracking shows USD amount

---

## 💡 Pro Tips

1. **Use PyTrends first** - No credentials needed, instant testing
2. **Check browser DevTools** - See API calls in Network tab
3. **Watch backend logs** - See real-time request processing
4. **Start small** - Test with 5 posts, not 500
5. **Check costs** - GPT-4o-mini is cheap (~$0.02/summary)

---

## 🚀 Ready to Go?

1. ✅ Backend running on port 8001
2. ✅ Frontend running on port 3001
3. ✅ .env file configured
4. ✅ Database initialized

**Navigate to http://localhost:3001 and start testing!**
