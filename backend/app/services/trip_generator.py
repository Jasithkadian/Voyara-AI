import os
import json
import logging
import random
from openai import OpenAI
import httpx
from typing import Dict, Any, List
from app.services.weather_service import get_weather_forecast

logger = logging.getLogger(__name__)

# Config
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def generate_trip_plan(
    source: str,
    destination: str,
    days: int,
    budget: float,
    travelers: int,
    interests: List[str]
) -> Dict[str, Any]:
    """
    Generates a full trip plan. Tries Anthropic Claude first, then OpenAI GPT, 
    and falls back to a smart mock engine if neither key is set.
    """
    weather_forecast = get_weather_forecast(destination, days)
    interests_str = ", ".join(interests) if interests else "sightseeing, beach, local food"
    
    prompt = f"""
    Create a detailed, premium, and personalized travel plan for a trip from {source} to {destination}.
    
    Trip Details:
    - Source: {source}
    - Destination: {destination}
    - Budget: {budget} (Currency: match local currency or INR, keep it numeric in output)
    - Duration: {days} Days
    - Travelers: {travelers}
    - Interests: {interests_str}
    
    Weather Forecast Context to incorporate:
    {json.dumps(weather_forecast)}

    You MUST respond with a single, valid JSON object matching the following structure:
    {{
      "tripSummary": {{
        "destination": "{destination}",
        "days": {days},
        "travelers": {travelers}
      }},
      "dailyItinerary": [
        {{
          "day": <int, e.g. 1>,
          "weather": "<e.g. Sunny, 30°C - match the weather forecast provided>",
          "activities": [
            {{
              "time": "<Morning | Afternoon | Evening>",
              "title": "<Activity Title>",
              "description": "<Activity description>",
              "estimatedCost": <float>,
              "duration": "<e.g., 2 hours>",
              "location": "<Location/Attraction Name>"
            }}
          ],
          "restaurants": [
            {{
              "name": "<Restaurant Name>",
              "cuisine": "<Cuisine Type>",
              "recommendedMeal": "<Lunch | Dinner>",
              "estimatedCost": <float>,
              "description": "<Brief description>"
            }}
          ]
        }}
      ],
      "budgetBreakdown": {{
        "hotel_cost": <float>,
        "food_cost": <float>,
        "transportation_cost": <float>,
        "activity_cost": <float>,
        "miscellaneous_cost": <float>,
        "total_cost": <float>
      }},
      "hotelRecommendations": [
        {{
          "name": "<Hotel Name>",
          "rating": "<e.g. 4.5/5>",
          "pricePerNight": "<e.g., ₹3,000 / night>",
          "distanceFromCenter": "<e.g., 1.2 km>",
          "description": "<Brief description why it fits the traveler>"
        }}
      ],
      "attractions": [
        {{
          "name": "<Attraction Name>",
          "description": "<Description>",
          "category": "<Nature | Adventure | Food | Culture | Nightlife>",
          "location": "<Area or neighborhood>",
          "rating": "<e.g., 4.6/5>"
        }}
      ],
      "travelTips": [
        "<Tip 1>",
        "<Tip 2>"
      ]
    }}

    Rules:
    1. Ensure the total estimated budget in 'budgetBreakdown' is realistic and stays close to or within the user's budget of {budget}.
    2. Provide 3 to 5 hotel recommendations matching the user's budget class (budget, mid-range, luxury).
    3. Suggest at least 4 attractions matching the interests: {interests_str}. Group them by category.
    4. Provide a detailed day-wise itinerary for exactly {days} days. Each day should have at least 3 activities (Morning, Afternoon, Evening) and restaurant suggestions.
    5. Output ONLY the JSON. No markdown wrappers (like ```json), no greetings, no extra text.
    """

    # 1. Try Claude (Anthropic)
    if ANTHROPIC_API_KEY:
        try:
            logger.info("Using Claude API for trip generation.")
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 4000,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "system": "You are a travel coordinator who outputs strictly valid JSON."
            }
            with httpx.Client() as client:
                response = client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers, timeout=20.0)
                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json["content"][0]["text"]
                    plan = json.loads(clean_json_wrapper(content))
                    plan["weather"] = weather_forecast
                    return plan
                else:
                    logger.error(f"Claude API failed: {response.text}")
        except Exception as e:
            logger.error(f"Claude generation error: {e}")

    # 2. Try OpenAI Fallback (using GPT-4o-mini as a robust, fast model)
    if OPENAI_API_KEY:
        try:
            logger.info("Using OpenAI API for trip generation.")
            client = OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o",  # GPT-4o requested by user, falling back to 4o-mini if needed
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a travel coordinator who outputs strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                timeout=25.0
            )
            content = response.choices[0].message.content
            plan = json.loads(content)
            plan["weather"] = weather_forecast
            return plan
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")

    # 3. Smart Mock Fallback
    logger.warning("No API keys configured or APIs failed. Invoking local smart travel mock engine.")
    return generate_mock_trip_v3(source, destination, days, budget, travelers, interests, weather_forecast)

def clean_json_wrapper(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def generate_mock_trip_v3(
    source: str,
    destination: str,
    days: int,
    budget: float,
    travelers: int,
    interests: List[str],
    weather_forecast: List[Dict[str, Any]]
) -> Dict[str, Any]:
    currency = "₹" if budget > 5000 else "$"
    
    # Calculate costs
    hotel_cost = round(budget * 0.35, 2)
    food_cost = round(budget * 0.20, 2)
    transport_cost = round(budget * 0.15, 2)
    activity_cost = round(budget * 0.20, 2)
    misc_cost = round(budget * 0.10, 2)
    total_cost = hotel_cost + food_cost + transport_cost + activity_cost + misc_cost

    dest_key = destination.lower()
    
    # Preset hotels
    hotels_db = {
        "goa": [
            {"name": "Taj Resort & Spa, Exotica", "rating": "4.8/5", "pricePerNight": f"{currency}12,500", "distanceFromCenter": "0.5 km from Benaulim Beach", "description": "Beautiful beach-front property with fine dining, beach access, and a premium spa."},
            {"name": "Lemon Tree Amarante Beach Resort", "rating": "4.3/5", "pricePerNight": f"{currency}6,000", "distanceFromCenter": "1.1 km from Candolim Beach", "description": "Portuguese-inspired boutique resort close to North Goa's top beaches and shopping streets."},
            {"name": "Zostel Cavelossim", "rating": "4.5/5", "pricePerNight": f"{currency}1,800", "distanceFromCenter": "2.4 km from beach", "description": "Highly rated backpacker hostel with social events, pool table, and friendly staff."}
        ],
        "paris": [
            {"name": "Shangri-La Paris", "rating": "4.9/5", "pricePerNight": f"{currency}42,000", "distanceFromCenter": "0.4 km from Eiffel Tower", "description": "Historical palace view hotel with Michelin-starred restaurants and elegant interiors."},
            {"name": "Hotel Caron de Beaumarchais", "rating": "4.4/5", "pricePerNight": f"{currency}18,000", "distanceFromCenter": "1.0 km from Notre-Dame", "description": "Historic boutique hotel themed around 18th-century French opera, located in Marais."},
            {"name": "Generator Hostel Paris", "rating": "4.1/5", "pricePerNight": f"{currency}4,500", "distanceFromCenter": "3.2 km from center", "description": "Trendy hostel featuring a lively rooftop lounge overlooking Montmartre."}
        ]
    }
    
    # Preset attractions
    attractions_db = {
        "goa": [
            {"name": "Fort Aguada", "description": "A well-preserved 17th-century Portuguese lighthouse and fort.", "category": "Culture", "location": "Candolim", "rating": "4.5/5"},
            {"name": "Dudhsagar Falls", "description": "A stunning four-tiered waterfall on the Mandovi river.", "category": "Nature", "location": "Sanguem", "rating": "4.8/5"},
            {"name": "Scuba Diving at Grand Island", "description": "Explore the vibrant underwater marine life of the Arabian sea.", "category": "Adventure", "location": "Grand Island", "rating": "4.6/5"},
            {"name": "Fisherman's Wharf Restaurant", "description": "Premium Goan seafood with live music and delta views.", "category": "Food", "location": "Cavelossim", "rating": "4.4/5"},
            {"name": "Tito's Lane Nightclubs", "description": "Famous lane packed with lively pubs, bars, and clubs.", "category": "Nightlife", "location": "Baga", "rating": "4.3/5"}
        ],
        "paris": [
            {"name": "Eiffel Tower Climb", "description": "Scale Paris' most iconic landmark for panoramic views.", "category": "Culture", "location": "7th Arr.", "rating": "4.8/5"},
            {"name": "Sailing in Jardin du Luxembourg", "description": "Rent a vintage toy sailboat on the grand circular pond.", "category": "Nature", "location": "6th Arr.", "rating": "4.6/5"},
            {"name": "Seine River Dinner Cruise", "description": "A luxury cruise down the river dining on gourmet food.", "category": "Food", "location": "Seine River", "rating": "4.7/5"},
            {"name": "Disneyland Paris Adventure", "description": "Thrills, magic, and world-class rides in Marne-la-Vallée.", "category": "Adventure", "location": "Outskirts", "rating": "4.5/5"},
            {"name": "Le Caveau de la Huchette", "description": "Legendary underground jazz club featured in La La Land.", "category": "Nightlife", "location": "Latin Quarter", "rating": "4.6/5"}
        ]
    }

    hotels = hotels_db.get(dest_key)
    if not hotels:
        hotels = [
            {"name": f"Hotel {destination} Royale", "rating": "4.6/5", "pricePerNight": f"{currency}{round(budget/days*0.4)}", "distanceFromCenter": "0.8 km from center", "description": f"Highly recommended stay in {destination}."},
            {"name": f"{destination} Comfort Suites", "rating": "4.2/5", "pricePerNight": f"{currency}{round(budget/days*0.25)}", "distanceFromCenter": "1.5 km from center", "description": f"Comfortable and central choice for {destination}."},
            {"name": f"{destination} Backpackers Lodge", "rating": "4.4/5", "pricePerNight": f"{currency}{round(budget/days*0.1)}", "distanceFromCenter": "2.1 km from center", "description": f"Affordable and social hostel in {destination}."}
        ]

    attractions = attractions_db.get(dest_key)
    if not attractions:
        attractions = [
            {"name": f"{destination} Ancient Palace", "description": "Rich history dating back centuries with tours.", "category": "Culture", "location": "Old Quarter", "rating": "4.6/5"},
            {"name": f"{destination} Scenic Trails", "description": "Beautiful hike through valleys and lakes.", "category": "Nature", "location": "North Hills", "rating": "4.7/5"},
            {"name": f"{destination} Extreme Adventure Park", "description": "Ziplining and rock climbing.", "category": "Adventure", "location": "East Valley", "rating": "4.5/5"},
            {"name": f"Local Spice & Street Bazaar", "description": "Authentic street foods and spices.", "category": "Food", "location": "Center Market", "rating": "4.4/5"},
            {"name": f"Skyline Lounge {destination}", "description": "Rooftop lounge overlooking the city skyline.", "category": "Nightlife", "location": "Downtown", "rating": "4.3/5"}
        ]

    # Build daily plans
    daily_itinerary = []
    for d in range(1, days + 1):
        weather_item = weather_forecast[d-1] if d-1 < len(weather_forecast) else {"condition": "Sunny", "temp": 28}
        weather_str = f"{weather_item['condition']}, {weather_item['temp']}°C"
        
        # Determine activities based on weather
        if "rain" in weather_str.lower():
            act_1 = {"time": "Morning", "title": "Local Museum Tour", "description": "Explore the historical collections, antiquities, and art pieces indoors.", "estimatedCost": round(budget*0.01, 2), "duration": "3 hours", "location": "City Museum"}
            act_2 = {"time": "Afternoon", "title": "Traditional Spa / Wellness", "description": "Indulge in indoor therapies and relaxation.", "estimatedCost": round(budget*0.04, 2), "duration": "2.5 hours", "location": "Spa Center"}
            act_3 = {"time": "Evening", "title": "Teahouse / Indoor Concert", "description": "Enjoy warm beverages and watch local performances indoors.", "estimatedCost": round(budget*0.02, 2), "duration": "3 hours", "location": "Cultural Center"}
        else:
            act_1 = {"time": "Morning", "title": f"Visit {attractions[(d-1)%len(attractions)]['name']}", "description": attractions[(d-1)%len(attractions)]['description'], "estimatedCost": round(budget*0.01, 2), "duration": "2.5 hours", "location": attractions[(d-1)%len(attractions)]['location']}
            act_2 = {"time": "Afternoon", "title": f"Explore {attractions[(d)%len(attractions)]['name']}", "description": attractions[(d)%len(attractions)]['description'], "estimatedCost": round(budget*0.03, 2), "duration": "3 hours", "location": attractions[(d)%len(attractions)]['location']}
            act_3 = {"time": "Evening", "title": "Local Sunset Walk", "description": "Walk around the city center to capture photos and enjoy breezes.", "estimatedCost": 0.0, "duration": "1.5 hours", "location": "Scenic Vista"}

        daily_itinerary.append({
            "day": d,
            "weather": weather_str,
            "activities": [act_1, act_2, act_3],
            "restaurants": [
                {
                    "name": f"{destination} Bites Cafe",
                    "cuisine": "Traditional & Continental",
                    "recommendedMeal": "Lunch",
                    "estimatedCost": round(budget*0.02, 2),
                    "description": "Bustling local favorite known for friendly hosts and signature traditional dishes."
                },
                {
                    "name": f"The Royal {destination} Dining",
                    "cuisine": "Fusion Seafood & Barbecue",
                    "recommendedMeal": "Dinner",
                    "estimatedCost": round(budget*0.04, 2),
                    "description": "Candle-lit restaurant offering premium dinner sets and live instrumental music."
                }
            ]
        })

    travel_tips = [
        f"Pack light clothes, but carry an umbrella because Day 2 indicates {weather_forecast[1]['condition'] if len(weather_forecast) > 1 else 'Rain'}.",
        f"Keep your passport and local currency ({currency}) handy for street markets.",
        "Book transfers in advance to stay within your transportation limit.",
        "Take local recommendations for restaurants to find the freshest catch of the day!"
    ]

    return {
        "tripSummary": {
            "destination": destination,
            "days": days,
            "travelers": travelers
        },
        "dailyItinerary": daily_itinerary,
        "budgetBreakdown": {
            "hotel_cost": hotel_cost,
            "food_cost": food_cost,
            "transportation_cost": transport_cost,
            "activity_cost": activity_cost,
            "miscellaneous_cost": misc_cost,
            "total_cost": total_cost
        },
        "hotelRecommendations": hotels,
        "attractions": attractions,
        "travelTips": travel_tips,
        "weather": weather_forecast
    }
