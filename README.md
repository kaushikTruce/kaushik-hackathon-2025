# 🧠 Vizionary: Natural Language-Based Data Visualization Tool

DataVizPrompt is an interactive tool that allows users to upload CSV/Excel files and generate insightful data visualizations by simply typing natural language queries.

---

## 🚀 Features

- Upload your own dataset (CSV/XLSX)
- Automatically extract column names
- Ask questions in plain English
- LLM converts your query to SQL
- SQL runs on your dataset in a Cloud SQL database
- Dynamic charts (bar, line, pie, etc.) rendered in the browser
- LLM result caching with Redis to reduce API calls

---

## 🛠️ Tech Stack

| Layer     | Tech                    |
|-----------|-------------------------|
| Frontend  | Next.js + Chart.js or Plotly |
| Backend   | Python (Flask) |
| LLM       | Google gemini 2.5 pro |
| Database  | MySQL (Cloud SQL)       |
| Caching   | Redis                   |
| Deployment| Docker Compose          |

---

## 📁 Folder Structure

project-root
- backend/
    - app.py
    - docker-compose.yml
    - requirements.txt
    - Dockerfile
    - .gitignore
- frontend/
    - src/
        - page.tsx
        - layout.tsx
        - globals.css
    - public/
    - components/
        - typewriter-effect.tsx
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

#### Start the backend using Docker Compose
```bash
docker-compose build --no-cache
```

#### Start Docker
```bash
docker-compose up -d
```

### 2. 📁 .env File (place in root or backend)
```python
MYSQL_ROOT_PASSWORD=rootpassword

DB_NAME=database_name

MYSQL_USERNAME=user

MYSQL_PASSWORD=password

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

### 4.🧠 Redis-Based LLM Caching (Backend)
To reduce LLM cost and latency, prompts are cached in Redis.

#### Start Redis Locally via Docker:
```bash
docker run --name redis -p 6379:6379 -d redis
```

Redis will cache every (prompt + column list) combo and return saved SQL if the same prompt is reused.

## 🔄 How It Works (System Flow)
- User uploads a file (CSV/Excel) via frontend
- Backend parses columns and stores data in Cloud SQL
- User types a natural query (e.g. "Top 10 albums by streams")
- LLM converts the query into SQL
- SQL is cached in Redis if not already present
- Query is run on database and results returned
- Frontend renders a chart using Chart.js / Plotly

## ✅ Future Improvements
- Role-based login and history tracking
- Export visualizations as images/PDF
