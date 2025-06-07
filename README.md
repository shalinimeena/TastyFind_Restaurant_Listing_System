TastyFind_Restaurant_Listing_System

Streamlit Deployment on : https://tastyfind.streamlit.app/
Custom Frontend Deployment on : https://helpful-pasca-d98220.netlify.app/

# 🍽️ TastyFind

**TastyFind** is a full-stack restaurant discovery app powered by FastAPI and Streamlit.  
It supports advanced search by country, city, cuisine, name, description, geolocation, and even food image recognition via the LogMeal API.

---

## 🚀 Local Setup

### 1. Prerequisites

- Python 3.8+ installed
- Project files:
  - `main_local.py` (FastAPI backend)
  - `streamlit.py` (Streamlit frontend)
  - `requirements.txt` (dependencies)
  - Data files: `zomato.csv`, `Country-Code.xlsx`
  - A valid LogMeal API key (for image search)

---

### 2. Install Dependencies

Create and activate a virtual environment (recommended):
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt


---

### 3. Set Up Environment Variables

Create a `.env` file in your project directory with your LogMeal API key:

LOGMEAL_API_KEY=your_logmeal_api_key_here


---

### 4. Start the FastAPI Backend

uvicorn main_local:app --reload



- The API will be available at: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 5. Configure the Streamlit Frontend

**IMPORTANT:**  
Before running Streamlit, **double-check that the `API_BASE_URL` variable in your `streamlit.py` is set to the correct FastAPI server URL.**  
For local development, it should be:

API_BASE_URL = "http://127.0.0.1:8000"


---


If you are running the backend on a different host or port (for example, in Docker or on a remote server), update `API_BASE_URL` accordingly.

---

### 6. Start the Streamlit Frontend

Open a **new terminal** (keep the backend running):

streamlit run streamlit.py


- The app will open at: [http://localhost:8501](http://localhost:8501)

---

### 7. Usage

- Use the sidebar to select search modes: by country, city, cuisine, ID, name, description, image, or geolocation.
- For image search, upload a food image and set your location.
- For geolocation, you can enter coordinates or use browser location.

---

### 8. Troubleshooting

- **File not found:** Ensure `zomato.csv` and `Country-Code.xlsx` are in the same directory as `main_local.py`.
- **LogMeal errors:** Check your API key and internet connection.
- **API connection errors:** Double-check that `API_BASE_URL` in `streamlit.py` matches your FastAPI server address and port.
- **Port conflicts:** If 8000 or 8501 are in use, specify another port.

---

### 9. Stopping the App

Press `CTRL+C` in each terminal to stop the backend and frontend servers.

---

**Enjoy discovering restaurants with TastyFind!**


# TastyFind Deployment (Modal + Streamlit Cloud)

## Deploy FastAPI Backend on Modal

1. **Install Modal CLI**
pip install modal


2. **Authenticate with Modal**
modal token new


3. **Deploy your backend**
modal deploy main.py

- Note the deployed URL (e.g., `https://your-app.modal.run`).

## Deploy Streamlit Frontend

1. In `streamlit.py`, set:
API_BASE_URL = "https://your-app.modal.run"

2. Deploy `streamlit.py` (and `requirements.txt`) on Streamlit Cloud.

---

**Note:**  
The first request to your Modal backend may take up to ~3 minutes as the container starts.  
Subsequent queries will be fast (a few seconds).

## Custom Frontend:



