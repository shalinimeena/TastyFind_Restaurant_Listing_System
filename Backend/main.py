import pandas as pd
import numpy as np
from fastapi import FastAPI, Query, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from geopy.distance import great_circle
from sentence_transformers import SentenceTransformer
from PIL import Image
from io import BytesIO
import os
import requests
from numpy.linalg import norm
from dotenv import load_dotenv

# === FASTAPI SETUP ===
app = FastAPI(title="Zomato-like Restaurant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === RESPONSE MODEL ===
class RestaurantResponse(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: str
    country: str
    country_code: int
    city: str
    address: str
    locality: str
    locality_verbose: str
    longitude: float
    latitude: float
    cuisines: str
    average_cost_for_two: float
    currency: str
    has_table_booking: str
    has_online_delivery: str
    is_delivering_now: str
    switch_to_order_menu: str
    price_range: int
    aggregate_rating: float
    rating_color: str
    rating_text: str
    votes: int

class RestaurantResponseWithSimilarity(RestaurantResponse):
    similarity: float

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 5

# === GLOBALS (populated at startup) ===
df_merged = None
embedding_model = None
restaurant_embeddings = None
unique_cuisines = None
cuisine_embeddings = None
LOGMEAL_API_KEY = None

# === LOAD DATA AND MODELS AT STARTUP ===
@app.on_event("startup")
def startup_event():
    global df_merged, embedding_model, restaurant_embeddings, unique_cuisines, cuisine_embeddings, LOGMEAL_API_KEY

    load_dotenv()
    LOGMEAL_API_KEY = os.getenv("LOGMEAL_API_KEY")
    CSV_PATH = "/app/zomato.csv"
    COUNTRY_EXCEL_PATH = "/app/Country-Code.xlsx"

    try:
        df_main = pd.read_csv(CSV_PATH, encoding='latin-1')
        df_country = pd.read_excel(COUNTRY_EXCEL_PATH)
        df_merged = pd.merge(df_main, df_country, on='Country Code', how='left')
        df_merged['id'] = df_merged.index
    except Exception as e:
        raise RuntimeError(f"Failed to load/merge data: {e}")

    embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

    df_merged['search_text'] = (
        df_merged['Restaurant Name'].astype(str) + " " +
        df_merged['Country'].astype(str) + " " +
        df_merged['Country Code'].astype(str) + " " +
        df_merged['City'].astype(str) + " " +
        df_merged['Address'].astype(str) + " " +
        df_merged['Locality'].astype(str) + " " +
        df_merged['Locality Verbose'].astype(str) + " " +
        df_merged['Longitude'].astype(str) + " " +
        df_merged['Latitude'].astype(str) + " " +
        df_merged['Cuisines'].astype(str) + " " +
        df_merged['Average Cost for two'].astype(str) + " " +
        df_merged['Currency'].astype(str) + " " +
        df_merged['Has Table booking'].astype(str) + " " +
        df_merged['Has Online delivery'].astype(str) + " " +
        df_merged['Is delivering now'].astype(str) + " " +
        df_merged['Switch to order menu'].astype(str) + " " +
        df_merged['Price range'].astype(str) + " " +
        df_merged['Aggregate rating'].astype(str) + " " +
        df_merged['Rating color'].astype(str) + " " +
        df_merged['Rating text'].astype(str) + " " +
        df_merged['Votes'].astype(str)
    )

    # Precompute embeddings for all restaurants
    restaurant_texts = df_merged['search_text'].tolist()
    restaurant_embeddings = embedding_model.encode(restaurant_texts, normalize_embeddings=True)
    df_merged['embedding'] = list(restaurant_embeddings)

    unique_cuisines = df_merged['Cuisines'].dropna().unique().tolist()
    cuisine_embeddings = embedding_model.encode(unique_cuisines, normalize_embeddings=True)

# === UTILITY FUNCTIONS ===
def get_logmeal_prediction(image_bytes: bytes):
    url = "https://api.logmeal.es/v2/recognition/dish"
    headers = {"Authorization": f"Bearer {LOGMEAL_API_KEY}"}
    files = {"image": ("image.jpg", image_bytes, "image/jpeg")}
    response = requests.post(url, headers=headers, files=files)
    if response.status_code != 200:
        raise Exception(f"LogMeal API error: {response.text}")
    data = response.json()
    if data.get("recognition_results"):
        dish = data["recognition_results"][0]["name"]
        food_family = data["recognition_results"][0].get("food_family", "")
        return dish, food_family
    raise Exception("No dish recognized")

def semantic_match_cuisines(search_term: str, top_k: int = 3):
    query_emb = embedding_model.encode([search_term], normalize_embeddings=True)[0]
    sims = np.dot(cuisine_embeddings, query_emb) / (norm(cuisine_embeddings, axis=1) * norm(query_emb) + 1e-10)
    top_indices = sims.argsort()[-top_k:][::-1]
    top_cuisines = [unique_cuisines[i] for i in top_indices]
    return top_cuisines

# === ENDPOINTS ===

@app.post("/semantic-search", response_model=List[RestaurantResponseWithSimilarity])
async def semantic_search(request: SemanticSearchRequest):
    query = request.query
    limit = request.limit
    try:
        query_embedding = embedding_model.encode([query], normalize_embeddings=True)[0]
        similarities = np.dot(np.stack(df_merged['embedding'].values), query_embedding)
        df_merged['similarity'] = similarities
        results = df_merged.sort_values('similarity', ascending=False).head(limit)
        return [
            RestaurantResponseWithSimilarity(
                id=int(row['id']),
                restaurant_id=int(row['Restaurant ID']),
                restaurant_name=row['Restaurant Name'],
                country=row['Country'],
                country_code=int(row['Country Code']),
                city=row['City'],
                address=row['Address'],
                locality=row['Locality'],
                locality_verbose=row['Locality Verbose'],
                longitude=float(row['Longitude']),
                latitude=float(row['Latitude']),
                cuisines=row['Cuisines'],
                average_cost_for_two=float(row['Average Cost for two']),
                currency=row['Currency'],
                has_table_booking=row['Has Table booking'],
                has_online_delivery=row['Has Online delivery'],
                is_delivering_now=row['Is delivering now'],
                switch_to_order_menu=row['Switch to order menu'],
                price_range=int(row['Price range']),
                aggregate_rating=float(row['Aggregate rating']),
                rating_color=row['Rating color'],
                rating_text=row['Rating text'],
                votes=int(row['Votes']),
                similarity=float(row['similarity'])
            )
            for _, row in results.iterrows()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/image-search-nearby", response_model=List[RestaurantResponse])
async def image_search_nearby(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    radius: float = Form(3.0),
    limit: int = Form(10)
):
    try:
        image_bytes = await file.read()
        dish, cuisine = get_logmeal_prediction(image_bytes)
        search_term = cuisine if cuisine else dish
        matched_cuisines = semantic_match_cuisines(search_term, top_k=3)
        df = df_merged.copy()
        df['Cuisines'] = df['Cuisines'].fillna('').astype(str)
        mask = df['Cuisines'].apply(lambda c: any(mc.lower() in c.lower() for mc in matched_cuisines))
        df = df[mask]
        df = df[df['Latitude'].notnull() & df['Longitude'].notnull()]
        df['Latitude'] = df['Latitude'].astype(float)
        df['Longitude'] = df['Longitude'].astype(float)
        def calc_dist(row):
            return great_circle((lat, lng), (row['Latitude'], row['Longitude'])).km
        df['distance'] = df.apply(calc_dist, axis=1)
        df = df[df['distance'] <= radius]
        results = df.sort_values('distance').head(limit)
        data = []
        for _, row in results.iterrows():
            data.append({
                "id": int(row['id']),
                "restaurant_id": int(row['Restaurant ID']),
                "restaurant_name": row['Restaurant Name'],
                "country": row['Country'],
                "country_code": int(row['Country Code']),
                "city": row['City'],
                "address": row['Address'],
                "locality": row['Locality'],
                "locality_verbose": row['Locality Verbose'],
                "longitude": float(row['Longitude']),
                "latitude": float(row['Latitude']),
                "cuisines": row['Cuisines'],
                "average_cost_for_two": float(row['Average Cost for two']),
                "currency": row['Currency'],
                "has_table_booking": row['Has Table booking'],
                "has_online_delivery": row['Has Online delivery'],
                "is_delivering_now": row['Is delivering now'],
                "switch_to_order_menu": row['Switch to order menu'],
                "price_range": int(row['Price range']),
                "aggregate_rating": float(row['Aggregate rating']),
                "rating_color": row['Rating color'],
                "rating_text": row['Rating text'],
                "votes": int(row['Votes']),
            })
        if not data:
            raise HTTPException(status_code=404, detail=f"No nearby restaurants found for cuisines: {matched_cuisines}")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

@app.get("/countries", response_model=List[str])
def get_countries():
    df = pd.read_excel("/app/Country-Code.xlsx", usecols=['Country'])
    countries = df['Country'].dropna().unique().tolist()
    return countries

@app.get("/restaurants", response_model=List[RestaurantResponse])
def list_restaurants(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    country: Optional[str] = None,
    min_cost: Optional[float] = None,
    max_cost: Optional[float] = None
):
    df = df_merged
    if city:
        df = df[df['City'].str.contains(city, case=False, na=False)]
    if cuisine:
        df = df[df['Cuisines'].str.contains(cuisine, case=False, na=False)]
    if country:
        df = df[df['Country'].str.contains(country, case=False, na=False)]
    if min_cost is not None:
        df = df[df['Average Cost for two'] >= min_cost]
    if max_cost is not None:
        df = df[df['Average Cost for two'] <= max_cost]
    start = (page - 1) * limit
    data = []
    for _, row in df.iloc[start:start+limit].iterrows():
        data.append({
            "id": int(row['id']),
            "restaurant_id": int(row['Restaurant ID']),
            "restaurant_name": row['Restaurant Name'],
            "country": row['Country'],
            "country_code": int(row['Country Code']),
            "city": row['City'],
            "address": row['Address'],
            "locality": row['Locality'],
            "locality_verbose": row['Locality Verbose'],
            "longitude": float(row['Longitude']),
            "latitude": float(row['Latitude']),
            "cuisines": row['Cuisines'],
            "average_cost_for_two": float(row['Average Cost for two']),
            "currency": row['Currency'],
            "has_table_booking": row['Has Table booking'],
            "has_online_delivery": row['Has Online delivery'],
            "is_delivering_now": row['Is delivering now'],
            "switch_to_order_menu": row['Switch to order menu'],
            "price_range": int(row['Price range']),
            "aggregate_rating": float(row['Aggregate rating']),
            "rating_color": row['Rating color'],
            "rating_text": row['Rating text'],
            "votes": int(row['Votes']),
        })
    return data

@app.get("/restaurants/nearby", response_model=List[RestaurantResponse])
def nearby_restaurants(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(3.0, description="Radius in kilometers"),
    limit: int = Query(20)
):
    def calc_dist(row):
        return great_circle((lat, lng), (row['Latitude'], row['Longitude'])).km
    df = df_merged.copy()
    df['distance'] = df.apply(calc_dist, axis=1)
    nearby = df[df['distance'] <= radius].sort_values('distance')
    data = []
    for _, row in nearby.head(limit).iterrows():
        data.append({
            "id": int(row['id']),
            "restaurant_id": int(row['Restaurant ID']),
            "restaurant_name": row['Restaurant Name'],
            "country": row['Country'],
            "country_code": int(row['Country Code']),
            "city": row['City'],
            "address": row['Address'],
            "locality": row['Locality'],
            "locality_verbose": row['Locality Verbose'],
            "longitude": float(row['Longitude']),
            "latitude": float(row['Latitude']),
            "cuisines": row['Cuisines'],
            "average_cost_for_two": float(row['Average Cost for two']),
            "currency": row['Currency'],
            "has_table_booking": row['Has Table booking'],
            "has_online_delivery": row['Has Online delivery'],
            "is_delivering_now": row['Is delivering now'],
            "switch_to_order_menu": row['Switch to order menu'],
            "price_range": int(row['Price range']),
            "aggregate_rating": float(row['Aggregate rating']),
            "rating_color": row['Rating color'],
            "rating_text": row['Rating text'],
            "votes": int(row['Votes']),
        })
    return data

@app.get("/restaurants/search", response_model=List[RestaurantResponse])
def search_restaurants(
    q_name: Optional[str] = Query(None, description="Search by restaurant name"),
    q_city: Optional[str] = Query(None, description="Search by city"),
    q_cuisine: Optional[str] = Query(None, description="Search by cuisine"),
    q_country: Optional[str] = Query(None, description="Search by country"),
    limit: int = 20
):
    df = df_merged
    mask = pd.Series([True] * len(df))
    if q_name:
        mask = mask & df['Restaurant Name'].str.contains(q_name, case=False, na=False)
    if q_city:
        mask = mask & df['City'].str.contains(q_city, case=False, na=False)
    if q_cuisine:
        mask = mask & df['Cuisines'].str.contains(q_cuisine, case=False, na=False)
    if q_country:
        mask = mask & df['Country'].str.contains(q_country, case=False, na=False)
    results = []
    for _, row in df[mask].head(limit).iterrows():
        results.append({
            "id": int(row['id']),
            "restaurant_id": int(row['Restaurant ID']),
            "restaurant_name": row['Restaurant Name'],
            "country": row['Country'],
            "country_code": int(row['Country Code']),
            "city": row['City'],
            "address": row['Address'],
            "locality": row['Locality'],
            "locality_verbose": row['Locality Verbose'],
            "longitude": float(row['Longitude']),
            "latitude": float(row['Latitude']),
            "cuisines": row['Cuisines'],
            "average_cost_for_two": float(row['Average Cost for two']),
            "currency": row['Currency'],
            "has_table_booking": row['Has Table booking'],
            "has_online_delivery": row['Has Online delivery'],
            "is_delivering_now": row['Is delivering now'],
            "switch_to_order_menu": row['Switch to order menu'],
            "price_range": int(row['Price range']),
            "aggregate_rating": float(row['Aggregate rating']),
            "rating_color": row['Rating color'],
            "rating_text": row['Rating text'],
            "votes": int(row['Votes']),
        })
    return results

@app.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: int):
    row = df_merged[df_merged['Restaurant ID'] == restaurant_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    row = row.iloc[0]
    return {
        "id": int(row['id']),
        "restaurant_id": int(row['Restaurant ID']),
        "restaurant_name": row['Restaurant Name'],
        "country": row['Country'],
        "country_code": int(row['Country Code']),
        "city": row['City'],
        "address": row['Address'],
        "locality": row['Locality'],
        "locality_verbose": row['Locality Verbose'],
        "longitude": float(row['Longitude']),
        "latitude": float(row['Latitude']),
        "cuisines": row['Cuisines'],
        "average_cost_for_two": float(row['Average Cost for two']),
        "currency": row['Currency'],
        "has_table_booking": row['Has Table booking'],
        "has_online_delivery": row['Has Online delivery'],
        "is_delivering_now": row['Is delivering now'],
        "switch_to_order_menu": row['Switch to order menu'],
        "price_range": int(row['Price range']),
        "aggregate_rating": float(row['Aggregate rating']),
        "rating_color": row['Rating color'],
        "rating_text": row['Rating text'],
        "votes": int(row['Votes']),
    }

@app.get("/")
def root():
    return {
        "message": "API ready. Try /restaurants, /restaurants/{restaurant_id}, /restaurants/nearby, /restaurants/search"
    }
