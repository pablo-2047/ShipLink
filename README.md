# 🚢 ShipLink: AI-Powered Maritime Chartering & Logistics Planner

**ShipLink** is a predictive intelligence command center designed to optimize bulk cargo procurement for India's Public Sector Undertakings (PSUs). Developed for the **Smart India Hackathon (SIH) 2026**.

## 🌟 Key Features
1. **14-Day Freight Forecaster:** Uses LightGBM & ARIMA to predict Baltic Dry Index (BDI) and specific route charter rates, allowing PSUs to lock optimal forward contracts.
2. **SHAP AI Interpretability:** Explains exactly *why* the AI made a prediction (e.g., VLSFO prices, Red Sea risk, port congestion).
3. **Physical Constraint Engine (Vessel Optimizer):** Validates drafts, LOA, and deadweight limits against East Coast Indian ports (e.g., flagging Haldia's severe 8.5m river draft limits for Capesize vessels).
4. **Scenario Lab:** Simulates geopolitical shocks (like Suez Canal blockages or Cyclones) to evaluate demurrage exposure in real-time.

## 🚀 Architecture
* **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, Recharts
* **Backend:** Python, FastAPI, LightGBM, SHAP, Pandas
* **Hosting Strategy:** Vercel (Frontend) + Render (Backend)

---

## 💻 Local Development Setup

### 1. Backend (Python/FastAPI)
`ash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
`

### 2. Frontend (React/Vite)
`ash
cd frontend
npm install
npm run dev
`

---

## 🌍 Production Deployment Guide

### Why two hosts?
Machine Learning models (LightGBM/SHAP) are too heavy for Vercel's lightweight serverless functions. 
* **Render** is used for the Backend because it runs a full Python environment capable of handling heavy ML workloads.
* **Vercel** is used for the Frontend because it is the fastest global CDN for React apps.

### Deployment Steps
1. Deploy the ackend folder to **Render.com** (Web Service).
2. Copy the URL Render gives you (e.g., https://shiplink-api.onrender.com).
3. Deploy the rontend folder to **Vercel.com**.
4. In Vercel's Environment Variables settings, add your Firebase keys AND add VITE_API_URL pointing to your Render URL.


