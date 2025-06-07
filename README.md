# 🍽️ TastyFind Restaurant Listing System

[Live Streamlit Demo](https://tastyfind.streamlit.app/) | [Custom Frontend Demo (Netlify)](https://helpful-pasca-d98220.netlify.app/)

TastyFind Restaurant Listing System is a full-stack restaurant discovery app powered by FastAPI and Streamlit. Users can search for restaurants by country, city, cuisine, name, description, geolocation, or even food images (with LogMeal API integration).

---

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Frontend (Custom UI)](#frontend-custom-ui)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Deployment (Modal + Streamlit Cloud + Custom UI)](#deployment-modal--streamlit-cloud--Custom-UI)

---

## Features

- Advanced restaurant search: by country, city, cuisine, ID, name, description, image, or geolocation
- Food image recognition powered by LogMeal API
- FastAPI backend with interactive API docs
- Streamlit frontend for user-friendly exploration
- Custom React/TypeScript frontend

---

## Live Demo

- Streamlit: [https://tastyfind.streamlit.app/](https://tastyfind.streamlit.app/)
- Custom Frontend (UI) on Netlify: [https://helpful-pasca-d98220.netlify.app/](https://helpful-pasca-d98220.netlify.app/)

---

## Project Structure

```
├── Backend/                # Backend-related files/folders (if any)
├── src/                    # Custom frontend source code (TypeScript/React)
│   ├── components/         # React components
│   ├── pages/              # Page components/views
│   └── ...                 # Other frontend files
├── index.html              # Frontend HTML entry point (for Vite/React)
├── main_local.py           # FastAPI backend entry point (local)
├── streamlit.py            # Streamlit frontend entry point
├── requirements.txt        # Python dependencies
├── package.json            # Frontend dependencies and scripts
├── vite.config.ts          # Vite config for frontend
├── zomato.csv              # Restaurant dataset
├── Country-Code.xlsx       # Country codes dataset
└── ...
```

---

## Local Setup

### 1. Prerequisites

- Python 3.8+
- Node.js (for the custom frontend)
- The following files:  
  `main_local.py`, `streamlit.py`, `requirements.txt`, `zomato.csv`, `Country-Code.xlsx`
- A valid LogMeal API key (for image search)

---

### 2. Install Backend Dependencies

Create and activate a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Set Up Environment Variables

Create a `.env` file in your project directory:

```
LOGMEAL_API_KEY=your_logmeal_api_key_here
```

---

### 4. Start the FastAPI Backend

```bash
uvicorn main_local:app --reload
```

- API will be available at: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 5. Configure the Streamlit Frontend

Make sure `API_BASE_URL` in `streamlit.py` points to your FastAPI server, e.g.:

```python
API_BASE_URL = "http://127.0.0.1:8000"
```

---

### 6. Start the Streamlit Frontend

Open another terminal and run:

```bash
streamlit run streamlit.py
```

- App will be available at: [http://localhost:8501](http://localhost:8501)

---

## Frontend (Custom UI)

This repository also contains a custom frontend built with TypeScript, React, and Vite.

**Location:**  
- `src/` — React/TypeScript source code  
- `index.html`, `vite.config.ts`, etc. — Vite config files


### Setup & Run the Frontend Locally

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start the development server:

    ```bash
    npm run dev
    ```

3. Open your browser at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

4. **API Connection:**  
   Ensure the frontend is configured to communicate with your FastAPI backend. Check for API_BASE_URL config file where the backend URL is set.

---

## Usage 

- Use the filters to select search modes (by country, city, cuisine, ID, name, description, image, or geolocation)
- For image search: upload a food image and set your location
- For geolocation: enter coordinates or use your browser’s location

---

## Troubleshooting

- **File not found:** Ensure `zomato.csv` and `Country-Code.xlsx` are in the same directory as `main_local.py`.
- **LogMeal errors:** Check your API key and internet connection.
- **API connection errors:** Make sure `API_BASE_URL` in `streamlit.py` and `api.ts` matches your FastAPI server.
- **Port conflicts:** Use a different port if 8000 or 8501 are in use.

---

## Deployment (Modal + Streamlit Cloud + Custom UI)

### Deploy FastAPI Backend on Modal

1. **Install Modal CLI**

    ```bash
    pip install modal
    ```

2. **Authenticate with Modal**

    ```bash
    modal token new
    ```

3. **Deploy your backend**

    ```bash
    modal deploy main.py
    ```

    - Note the deployed URL (e.g., `https://your-app.modal.run`).

### Deploy Streamlit Frontend

1. In `streamlit.py`, set:

    ```python
    API_BASE_URL = "https://your-app.modal.run"
    ```

2. Deploy `streamlit.py` (and `requirements.txt`) on Streamlit Cloud.

### Deploy Custom UI

1. Set API_BASE_URL in api.ts:
     ```python
    API_BASE_URL = "https://your-app.modal.run"
    ```
2. Deploy `streamlit.py` on Netlify.

> **⚠️ Warning:**  
> When deploying the backend on Modal, the service uses container-based infrastructure that requires a cold start. This means that if the container has been idle, the first query or API request may take approximately 2–3 minutes to respond while the container starts up. Subsequent requests will be much faster.

