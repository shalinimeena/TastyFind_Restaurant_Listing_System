import streamlit as st
import requests
import pandas as pd
import json
from PIL import Image
import io
import base64


# Configuration
API_BASE_URL = "http://127.0.0.1:8000"  # Change this to your FastAPI server URL

# Page configuration
st.set_page_config(
    page_title="TastyFind - Restaurant Search",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #FF6B6B, #4ECDC4);
        padding: 2rem;
        border-radius: 10px;
        text-align: center;
        color: white;
        margin-bottom: 2rem;
    }
    .restaurant-card {
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 1rem;
        margin: 1rem 0;
        background: #f9f9f9;
        color: #222; /* Add this line to set default text color */
    }
    .restaurant-card h3 {
        color: #222; /* Ensures heading is dark */
    }

    .rating-badge {
        background: #4ECDC4;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 15px;
        font-weight: bold;
    }
    .price-badge {
        background: #FF6B6B;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 15px;
        font-weight: bold;
    }
</style>

""", unsafe_allow_html=True)

# Helper functions
@st.cache_data
def get_countries():
    """Get list of countries from the FastAPI /countries endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/countries")
        if response.status_code == 200:
            countries = response.json()
            return sorted(countries)
    except Exception as e:
        st.error(f"Error fetching countries: {str(e)}")
    return []

    

@st.cache_data
def get_cities():
    """Get list of cities from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/restaurants", params={"limit": 1000})
        if response.status_code == 200:
            restaurants = response.json()
            cities = list(set([r["City"] for r in restaurants if r["City"]]))
            return sorted(cities)
    except:
        pass
    return []

@st.cache_data
def get_cuisines():
    """Get list of cuisines from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/restaurants", params={"limit": 1000})
        if response.status_code == 200:
            restaurants = response.json()
            all_cuisines = []
            for r in restaurants:
                if r["Cuisines"]:
                    cuisines = [c.strip() for c in r["Cuisines"].split(",")]
                    all_cuisines.extend(cuisines)
            return sorted(list(set(all_cuisines)))
    except:
        pass
    return []

# Add this new API helper function
def nearby_restaurants_api(params):
    """Make API call for nearby restaurants"""
    try:
        response = requests.get(f"{API_BASE_URL}/restaurants/nearby", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Connection Error: {str(e)}")
        return []

def display_restaurant_card(restaurant):
    """Display a restaurant card with styling"""
    with st.container():
        st.markdown(f"""
        <div class="restaurant-card">
            <h3>🍽️ {restaurant['restaurant_name']}</h3>
            <p><strong>📍 Location:</strong> {restaurant['address']}, {restaurant['city']}, {restaurant['country']}</p>
            <p><strong>🍳 Cuisines:</strong> {restaurant['cuisines']}</p>
            <p><strong>💰 Average Cost for Two:</strong> {restaurant['currency']} {restaurant['average_cost_for_two']}</p>
            <div style="display: flex; gap: 10px; margin: 10px 0;">
                <span class="rating-badge">⭐ {restaurant['aggregate_rating']}/5</span>
                <span class="price-badge">💵 Price Range: {restaurant['price_range']}</span>
            </div>
            <p><strong>🗳️ Votes:</strong> {restaurant['votes']} | <strong>📋 Rating:</strong> {restaurant['rating_text']}</p>
            <p><strong>🍽️ Table Booking:</strong> {restaurant['has_table_booking']} | <strong>🚚 Online Delivery:</strong> {restaurant['has_online_delivery']}</p>
        </div>
        """, unsafe_allow_html=True)

def search_restaurants_api(params):
    """Make API call to search restaurants"""
    try:
        response = requests.get(f"{API_BASE_URL}/restaurants/search", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Connection Error: {str(e)}")
        return []

def list_restaurants_api(params):
    """Make API call to list restaurants"""
    try:
        response = requests.get(f"{API_BASE_URL}/restaurants", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Connection Error: {str(e)}")
        return []

def get_restaurant_by_id(restaurant_id):
    """Get specific restaurant by ID"""
    try:
        response = requests.get(f"{API_BASE_URL}/restaurants/{restaurant_id}")
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Restaurant not found: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"Connection Error: {str(e)}")
        return None

def semantic_search_api(query, limit=10):
    """Make API call for semantic search"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/semantic-search",
            json={"query": query, "limit": limit}
        )
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Connection Error: {str(e)}")
        return []

def image_search_api(image_file, lat, lng, radius=3.0, limit=10):
    """Make API call for image search"""
    try:
        files = {"file": image_file}
        data = {
            "lat": lat,
            "lng": lng,
            "radius": radius,
            "limit": limit
        }
        response = requests.post(f"{API_BASE_URL}/image-search-nearby", files=files, data=data)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Connection Error: {str(e)}")
        return []

# Main app
def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🍽️ TastyFind</h1>
        <h3>Discover Amazing Restaurants Around the World</h3>
    </div>
    """, unsafe_allow_html=True)

    # Sidebar for search options
    st.sidebar.title("🔍 Search Options")
    search_type = st.sidebar.selectbox(
        "Choose Search Type:",
        [
            "📋 List All Restaurants",
            "🌍 Search by Country",
            "🏙️ Search by City", 
            "🍳 Search by Cuisine",
            "🆔 Search by Restaurant ID",
            "📝 Search by Name",
            "💭 Search by Description",
            "📸 Image Search",
            "📍 Search by Geolocation"
        ]
    )

    # Main content area
    if search_type == "📋 List All Restaurants":
        st.header("📋 All Restaurants")
        
        # Filters
        col1, col2, col3 = st.columns(3)
        with col1:
            page = st.number_input("Page", min_value=1, value=1)
        with col2:
            limit = st.selectbox("Results per page", [10, 20, 50, 100], index=1)
        with col3:
            min_cost = st.number_input("Min Cost", min_value=0.0, value=0.0, step=10.0)
            max_cost = st.number_input("Max Cost", min_value=0.0, value=1000.0, step=10.0)

        if st.button("🔍 Load Restaurants"):
            params = {
                "page": page,
                "limit": limit,
                "min_cost": min_cost if min_cost > 0 else None,
                "max_cost": max_cost if max_cost < 1000 else None
            }
            restaurants = list_restaurants_api(params)
            
            if restaurants:
                st.success(f"Found {len(restaurants)} restaurants")
                for restaurant in restaurants:
                    display_restaurant_card(restaurant)
            else:
                st.warning("No restaurants found")

    elif search_type == "🌍 Search by Country":
        st.header("🌍 Search by Country")
        
        countries = get_countries()
        if countries:
            selected_country = st.selectbox("Select Country:", [""] + countries)
            limit = st.selectbox("Number of results:", [10, 20, 50, 100], index=1)
            
            if selected_country and st.button("🔍 Search"):
                params = {"q_country": selected_country, "limit": limit}
                restaurants = search_restaurants_api(params)
                
                if restaurants:
                    st.success(f"Found {len(restaurants)} restaurants in {selected_country}")
                    for restaurant in restaurants:
                        display_restaurant_card(restaurant)
                else:
                    st.warning(f"No restaurants found in {selected_country}")
        else:
            st.error("Could not load countries. Please check API connection.")

    elif search_type == "🏙️ Search by City":
        st.header("🏙️ Search by City")
        
        city_input = st.text_input("Enter City Name:")
        limit = st.selectbox("Number of results:", [10, 20, 50, 100], index=1)
        
        if city_input and st.button("🔍 Search"):
            params = {"q_city": city_input, "limit": limit}
            restaurants = search_restaurants_api(params)
            
            if restaurants:
                st.success(f"Found {len(restaurants)} restaurants in {city_input}")
                for restaurant in restaurants:
                    display_restaurant_card(restaurant)
            else:
                st.warning(f"No restaurants found in {city_input}")

    elif search_type == "🍳 Search by Cuisine":
        st.header("🍳 Search by Cuisine")
        
        cuisine_input = st.text_input("Enter Cuisine Type (e.g., Italian, Chinese, Indian):")
        limit = st.selectbox("Number of results:", [10, 20, 50, 100], index=1)
        
        if cuisine_input and st.button("🔍 Search"):
            params = {"q_cuisine": cuisine_input, "limit": limit}
            restaurants = search_restaurants_api(params)
            
            if restaurants:
                st.success(f"Found {len(restaurants)} restaurants serving {cuisine_input} cuisine")
                for restaurant in restaurants:
                    display_restaurant_card(restaurant)
            else:
                st.warning(f"No restaurants found serving {cuisine_input} cuisine")

    elif search_type == "🆔 Search by Restaurant ID":
        st.header("🆔 Search by Restaurant ID")
        
        restaurant_id = st.number_input("Enter Restaurant ID:", min_value=1, value=1)
        
        if st.button("🔍 Search"):
            restaurant = get_restaurant_by_id(restaurant_id)
            
            if restaurant:
                st.success("Restaurant found!")
                display_restaurant_card(restaurant)
            else:
                st.warning(f"No restaurant found with ID {restaurant_id}")

    elif search_type == "📝 Search by Name":
        st.header("📝 Search by Restaurant Name")
        
        name_input = st.text_input("Enter Restaurant Name:")
        limit = st.selectbox("Number of results:", [10, 20, 50, 100], index=1)
        
        if name_input and st.button("🔍 Search"):
            params = {"q_name": name_input, "limit": limit}
            restaurants = search_restaurants_api(params)
            
            if restaurants:
                st.success(f"Found {len(restaurants)} restaurants matching '{name_input}'")
                for restaurant in restaurants:
                    display_restaurant_card(restaurant)
            else:
                st.warning(f"No restaurants found matching '{name_input}'")

    elif search_type == "💭 Search by Description":
        st.header("💭 Search by Description")
        st.write("Use natural language to describe what you're looking for!")
        
        description = st.text_area(
            "Describe what you're looking for:",
            placeholder="e.g., 'Cozy Italian restaurant with outdoor seating and good wine selection'"
        )
        limit = st.selectbox("Number of results:", [5, 10, 15, 20], index=1)
        
        if description and st.button("🔍 Search"):
            restaurants = semantic_search_api(description, limit)
            
            if restaurants:
                st.success(f"Found {len(restaurants)} restaurants matching your description")
                for restaurant in restaurants:
                    # Display similarity score for semantic search
                    if 'similarity' in restaurant:
                        similarity_score = round(restaurant['similarity'] * 100, 1)
                        st.write(f"**Match Score: {similarity_score}%**")
                    display_restaurant_card(restaurant)
            else:
                st.warning("No restaurants found matching your description")

    elif search_type == "📸 Image Search":
        st.header("📸 Image Search")
        st.write("Upload a food image to find nearby restaurants serving similar cuisine!")
        
        uploaded_file = st.file_uploader("Choose an image...", type=['jpg', 'jpeg', 'png'])
        
        col1, col2 = st.columns(2)
        with col1:
            lat = st.number_input("Latitude:", value=40.7128, format="%.6f")
            radius = st.slider("Search Radius (km):", 1.0, 20.0, 5.0)
        with col2:
            lng = st.number_input("Longitude:", value=-74.0060, format="%.6f")
            limit = st.selectbox("Number of results:", [5, 10, 15, 20], index=1)
        
        if uploaded_file is not None:
            # Display the uploaded image
            image = Image.open(uploaded_file)
            st.image(image, caption="Uploaded Image", width=300)
            
            if st.button("🔍 Search Similar Restaurants"):
                # Reset file pointer
                uploaded_file.seek(0)
                restaurants = image_search_api(uploaded_file, lat, lng, radius, limit)
                
                if restaurants:
                    st.success(f"Found {len(restaurants)} restaurants based on your image")
                    for restaurant in restaurants:
                        display_restaurant_card(restaurant)
                else:
                    st.warning("No restaurants found based on the uploaded image")
                    
    elif search_type == "📍 Search by Geolocation":
        st.header("📍 Search by Geolocation")
        
        col1, col2 = st.columns(2)
        with col1:
            lat = st.number_input("Latitude:", value=40.7128, format="%.6f")
        with col2:
            lng = st.number_input("Longitude:", value=-74.0060, format="%.6f")
        
        # Allow any radius (in km)
        radius = st.number_input(
            "Search Radius (km):",
            min_value=0.0,  # or 0.01 if you want to avoid 0
            value=3.0,
            format="%.2f",
            step=0.1,
            placeholder="Type radius in km"
        )
        
        # Allow any limit (number of results)
        limit = st.number_input(
            "Number of results:",
            min_value=1,
            value=20,
            step=1,
            format="%d",
            placeholder="Type max results"
        )
        
        if st.button("🔍 Search Nearby Restaurants"):
            params = {
                "lat": lat,
                "lng": lng,
                "radius": radius,
                "limit": int(limit)
            }
            restaurants = nearby_restaurants_api(params)
            
            if restaurants:
                st.success(f"Found {len(restaurants)} restaurants within {radius}km")
                for restaurant in restaurants:
                    display_restaurant_card(restaurant)
            else:
                st.warning("No restaurants found in this area")



    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; padding: 20px;">
        <p>🍽️ TastyFind - Powered by AI-driven Restaurant Discovery</p>
        <p>Find your next favorite restaurant with advanced search capabilities!</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()