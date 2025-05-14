# 🧠 Vizionary: Natural Language-Based Data Visualization Tool

DataVizPrompt is an interactive tool that allows users to upload CSV/Excel files and generate insightful data visualizations by simply typing natural language queries.

---

## 🚀 Features

- Upload your own dataset in CSV format
- Automatically detect and extract field (column) names
- Ask questions in plain English
- An LLM translates your question into MongoDB queries
- Queries are executed on your dataset in a Cloud MongoDB database
- View dynamic charts (bar, line, pie, etc.) directly in the browser

---

## 🛠️ Tech Stack

| Layer     | Tech                    |
|-----------|-------------------------|
| Frontend  | Next.js + Chart.js      |
| Backend   | Python (Flask)          |
| LLM       | Google gemini 2.5-flash-preview |
| Database  | MongoDB Cloud           |
| Deployment| Vercel (Next.js) & Render.com (Flask) |

---

## 📁 Folder Structure

project-root
- backend/
    - app.py
    - requirements.txt
    - .gitignore
- frontend/
    - src/
        - page.tsx
        - layout.tsx
        - globals.css
    - public/
    - components/
        - typewriter-effect.tsx
        - chart-display.tsx
    - package.json

## ⚙️ Setup Instructions

### 1. 🔙 Backend Setup

#### Navigate to backend directory
```bash
cd backend
```

#### Create and activate a Python virtual environment
```bash
python -m venv venv
```
#### On Windows:
```bash
.\venv\Scripts\activate
```
#### On Unix/MacOS:
```bash
source venv/bin/activate
```

#### Install dependencies
```bash
pip install -r requirements.txt
```

### 2. 📁 .env File (place in root or backend)
```python
MONGODB_URI=mongoDB_url_string
DB_NAME=database_name
GOOGLE_API_KEY=your_google_api_key_here
```

### 3. 🌐 Frontend Setup

#### Open a new terminal and navigate to frontend directory
```bash
cd frontend
```

#### Install dependencies
```bash
npm install
```

#### Start the development server
```bash
npm run dev
```

## 🔄 How It Works (System Flow)
- User uploads a file (CSV) via frontend
- Backend parses columns and stores data in Cloud MongoDB
- User types a natural query (e.g. "Top 10 albums by streams")
- LLM converts the query into MongoDB queries
- Query is run on database and results returned
- Frontend renders a chart using Chart.js

## ✅ Future Improvements
- Role-based login and history tracking
- Export visualizations as images/PDF
- Implementation of Redis to cache the results and save LLM load
- Support files of different extensions
- Integrate file uploads from Databases 
