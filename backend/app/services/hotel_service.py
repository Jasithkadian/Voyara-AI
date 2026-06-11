import os
import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID", "")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET", "")

def enrich_hotels(hotel_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    import urllib.parse
    
    # Curated premium photos
    pool_photos = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80"
    ]
    
    enriched = []
    for idx, hotel in enumerate(hotel_list):
        name = hotel["name"]
        
        # Determine rating and review count
        rating = hotel.get("rating", "4.4")
        review_count = hotel.get("reviewCount", int(abs(hash(name)) % 300) + 120)
            
        # Determine price (as float/integer)
        price = hotel.get("price", 4500.0 + (idx * 1800.0))
        price_str = f"₹{int(price):,}"
        
        # Amenities
        amenities = hotel.get("amenities", ["Wi-Fi", "Pool", "Room Service", "AC"])
        
        # Distance from center
        dist = hotel.get("distanceFromCenter", hotel.get("distance", "1.2 km from center"))
        
        # Cancellation policy
        cancellation = hotel.get("cancellationPolicy", "Free cancellation before 24h" if price > 5000.0 else "Non-refundable")
        
        # Unsplash photo array (4 photos)
        p1 = hotel.get("image", pool_photos[idx % len(pool_photos)])
        p2 = pool_photos[(idx + 1) % len(pool_photos)]
        p3 = pool_photos[(idx + 2) % len(pool_photos)]
        p4 = pool_photos[(idx + 3) % len(pool_photos)]
        images = [p1, p2, p3, p4]
        
        # Booking.com search affiliate link format
        query = urllib.parse.quote_plus(name)
        booking_link = f"https://www.booking.com/searchresults.html?ss={query}&aid=2319985"
        
        desc = hotel.get("description", f"A beautiful property located near {dist} with elegant design and high-quality services.")
        
        enriched.append({
            "name": name,
            "images": images,
            "rating": str(rating),
            "reviewCount": review_count,
            "price": float(price),
            "pricePerNight": price_str,
            "distanceFromCenter": dist,
            "amenities": amenities,
            "cancellationPolicy": cancellation,
            "bookingLink": booking_link,
            "description": desc
        })
        
    return enriched

def search_hotels(destination: str) -> List[Dict[str, Any]]:
    """
    Searches for real hotels. Tries Amadeus Hotel search first, 
    falls back to high-fidelity simulated hotels matching real spots.
    """
    hotels = []
    
    # 1. Try Amadeus Hotels Search
    if AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET:
        try:
            logger.info("Attempting hotel search via Amadeus API...")
            auth_url = "https://test.api.amadeus.com/v1/security/oauth2/token"
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": AMADEUS_CLIENT_ID,
                "client_secret": AMADEUS_CLIENT_SECRET
            }
            with httpx.Client() as client:
                auth_res = client.post(auth_url, data=auth_data, timeout=5.0)
                if auth_res.status_code == 200:
                    token = auth_res.json().get("access_token")
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # 1. Get city code or location coordinates
                    # Let's search hotels by city code (using first 3 letters of destination)
                    city_code = destination[:3].upper()
                    search_url = "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city"
                    params = {"cityCode": city_code, "ratings": "3,4,5"}
                    
                    res = client.get(search_url, params=params, headers=headers, timeout=10.0)
                    if res.status_code == 200:
                        data = res.json().get("data", [])
                        for h in data[:5]:
                            hotels.append({
                                "name": h.get("name", "Unknown Hotel").title(),
                                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
                                "price": 6500.0,
                                "rating": "4.2",
                                "distance": "1.2 km from center",
                                "amenities": ["Wi-Fi", "Pool", "Room Service", "AC"]
                            })
                        if hotels:
                            return enrich_hotels(hotels)
        except Exception as e:
            logger.error(f"Amadeus Hotels API failed: {e}")

    # 2. Smart High-Fidelity Mock Fallback (Guarantees beautiful commercial data)
    logger.warning("Using high-fidelity mock hotel data engine.")
    hotels = get_mock_hotels(destination)
    return enrich_hotels(hotels)

def get_mock_hotels(destination: str) -> List[Dict[str, Any]]:
    dest_lower = destination.lower()
    
    if "goa" in dest_lower:
        return [
            {
                "name": "Taj Exotica Resort & Spa",
                "image": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80",
                "price": 14500.0,
                "rating": "4.9",
                "distance": "0.1 km from Benaulim Beach",
                "amenities": ["Beach Front", "Luxury Spa", "Outdoor Pool", "Free Wi-Fi", "Bar"]
            },
            {
                "name": "Lemon Tree Amarante Beach Resort",
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
                "price": 6200.0,
                "rating": "4.4",
                "distance": "0.8 km from Candolim Beach",
                "amenities": ["Pool", "Fitness Center", "Free Wi-Fi", "AC", "Free Breakfast"]
            },
            {
                "name": "Zostel Cavelossim",
                "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
                "price": 1500.0,
                "rating": "4.5",
                "distance": "2.1 km from Mobor Beach",
                "amenities": ["Free Wi-Fi", "Social Lounge", "Kitchen", "Bicycle Rental", "AC"]
            }
        ]
    elif "paris" in dest_lower:
        return [
            {
                "name": "Shangri-La Hotel Paris",
                "image": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80",
                "price": 45000.0,
                "rating": "4.9",
                "distance": "0.4 km from Eiffel Tower",
                "amenities": ["Eiffel View", "Indoor Pool", "Michelin Dining", "Luxury Spa", "Bar"]
            },
            {
                "name": "Hotel Caron de Beaumarchais",
                "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
                "price": 18500.0,
                "rating": "4.6",
                "distance": "1.0 km from Notre-Dame",
                "amenities": ["Historic Styling", "Room Service", "Free Wi-Fi", "AC", "Coffee Maker"]
            },
            {
                "name": "Generator Hostel Paris",
                "image": "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=600&q=80",
                "price": 4200.0,
                "rating": "4.2",
                "distance": "3.5 km from center",
                "amenities": ["Rooftop Bar", "Free Wi-Fi", "Laundromat", "Cafe", "Social Events"]
            }
        ]
    else:
        # Generic high quality hotel mocks
        return [
            {
                "name": f"{destination} Heritage Palace",
                "image": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80",
                "price": 8500.0,
                "rating": "4.7",
                "distance": "0.5 km from center",
                "amenities": ["Pool", "Spa", "Restaurant", "Free Wi-Fi", "AC"]
            },
            {
                "name": f"The Grand {destination} Suites",
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
                "price": 5800.0,
                "rating": "4.3",
                "distance": "1.2 km from center",
                "amenities": ["Pool", "Gym", "Breakfast", "Free Wi-Fi", "AC"]
            },
            {
                "name": f"{destination} Backpackers Lodge",
                "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
                "price": 1800.0,
                "rating": "4.4",
                "distance": "2.5 km from center",
                "amenities": ["Free Wi-Fi", "Kitchen", "AC", "Laundry", "Lounge"]
            }
        ]
