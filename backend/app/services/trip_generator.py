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

def compute_budget_tier(total_budget: float, days: int, travelers: int, destination: str, travel_month: int = None, booking_lead_days: int = 30) -> str:
    days = 1 if days <= 0 else days
    travelers = 1 if travelers <= 0 else travelers
    raw_daily_per_person = total_budget / days / travelers
    
    dest_meta = None
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        json_path = os.path.join(base_dir, "..", "frontend", "src", "data", "destinations.json")
        if not os.path.exists(json_path):
            json_path = os.path.join(base_dir, "frontend", "src", "data", "destinations.json")
        if not os.path.exists(json_path):
            json_path = "c:\\Users\\Umang Kadian\\Desktop\\flyscanner\\frontend\\src\\data\\destinations.json"
            
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                destinations = json.load(f)
                for d in destinations:
                    if d.get("name", "").strip().lower() == destination.strip().lower():
                        dest_meta = d
                        break
    except Exception:
        pass
        
    if not dest_meta:
        fallbacks = {
            "goa": {"baseCostMultiplier": 1.0, "peakSeasonMonths": [11, 12, 1, 2], "isIslandDestination": False, "hasWaterRoute": False, "hasTrainAccess": True},
            "andaman islands": {"baseCostMultiplier": 1.5, "peakSeasonMonths": [12, 1, 2, 3], "isIslandDestination": True, "hasWaterRoute": True, "hasTrainAccess": False},
            "lakshadweep": {"baseCostMultiplier": 1.6, "peakSeasonMonths": [12, 1, 2, 3], "isIslandDestination": True, "hasWaterRoute": True, "hasTrainAccess": False},
            "kerala": {"baseCostMultiplier": 1.1, "peakSeasonMonths": [10, 11, 12, 1], "isIslandDestination": False, "hasWaterRoute": True, "hasTrainAccess": True},
            "rajasthan": {"baseCostMultiplier": 1.1, "peakSeasonMonths": [11, 12, 1, 2], "isIslandDestination": False, "hasWaterRoute": False, "hasTrainAccess": True},
            "delhi": {"baseCostMultiplier": 1.0, "peakSeasonMonths": [11, 12, 1, 2], "isIslandDestination": False, "hasWaterRoute": False, "hasTrainAccess": True},
            "mumbai": {"baseCostMultiplier": 1.2, "peakSeasonMonths": [11, 12, 1, 2], "isIslandDestination": False, "hasWaterRoute": False, "hasTrainAccess": True},
            "bali": {"baseCostMultiplier": 1.3, "peakSeasonMonths": [6, 7, 8, 12], "isIslandDestination": True, "hasWaterRoute": True, "hasTrainAccess": False},
            "dubai": {"baseCostMultiplier": 1.6, "peakSeasonMonths": [11, 12, 1, 2], "isIslandDestination": False, "hasWaterRoute": False, "hasTrainAccess": False}
        }
        dest_meta = fallbacks.get(destination.strip().lower())

    base_multiplier = 1.0
    peak_months = []
    is_seasonally_adjusted = False
    
    if dest_meta:
        base_multiplier = dest_meta.get("baseCostMultiplier", 1.0)
        peak_months = dest_meta.get("peakSeasonMonths", [])
        if travel_month in peak_months:
            is_seasonally_adjusted = True
            
    seasonal_multiplier = base_multiplier * 1.4 if is_seasonally_adjusted else base_multiplier
    effective_daily_budget = raw_daily_per_person / (seasonal_multiplier or 1.0)
    
    if booking_lead_days < 7:
        effective_daily_budget = effective_daily_budget * 0.85
        
    if effective_daily_budget < 2000:
        return "Backpacker"
    elif effective_daily_budget < 5000:
        return "Budget Traveler"
    elif effective_daily_budget <= 12000:
        return "Mid Range"
    else:
        return "Premium"

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
    
    # Calculate budget tier
    import datetime
    current_month = datetime.datetime.now().month
    tier_name = compute_budget_tier(budget, days, travelers, destination, current_month, 30)
    
    prompt = f"""
    Create a detailed, premium, and personalized travel plan for a trip from {source} to {destination}.
    
    Trip Details:
    - Source: {source}
    - Destination: {destination}
    - Budget: {budget} (Currency: match local currency or INR, keep it numeric in output)
    - Duration: {days} Days
    - Travelers: {travelers}
    - Interests: {interests_str}
    - Detected Budget Tier: {tier_name}
    
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
    2. Provide 3 to 5 hotel recommendations matching the budget class corresponding to the detected tier: {tier_name}.
    3. Suggest at least 4 attractions matching the interests: {interests_str}. Group them by category.
    4. Provide a detailed day-wise itinerary for exactly {days} days. Each day should have at least 3 activities (Morning, Afternoon, Evening) and restaurant suggestions.
    5. Follow these tier-specific rules strictly:
       - If Detected Budget Tier is "Backpacker" (effective daily budget under ₹2,000 per day per person):
         * Transport mode MUST be "bus" or "train-sleeper" only.
         * Accommodation recommendations MUST be hostel dorm beds (with personal lockers, social events, kitchen, and free wifi details).
         * Dining recommendations MUST be street food or local dhabas under ₹150 per meal.
         * Activities MUST be free or under ₹200.
       - If Detected Budget Tier is "Budget Traveler" (effective daily budget ₹2,000 to ₹4,999 per day per person):
         * Transport mode MUST be "train-sleeper" or "bus".
         * Accommodation recommendations MUST be budget guesthouses or 2-star hotels.
         * Dining recommendations MUST be local restaurants under ₹300 per meal.
         * Activities MUST be under ₹500.
       - If Detected Budget Tier is "Mid Range" (effective daily budget ₹5,000 to ₹12,000 per day per person):
         * Transport mode MUST be AC trains ("train-ac") or flights.
         * Accommodation recommendations MUST be 3-star hotels.
         * Dining recommendations MUST be mid-range dining under ₹800 per meal.
       - If Detected Budget Tier is "Premium" (effective daily budget over ₹12,000 per day per person):
         * Transport mode MUST be flights only.
         * Accommodation recommendations MUST be 4-star or 5-star luxury hotels.
         * Dining recommendations MUST be premium or fine-dining.
    6. Output ONLY the JSON. No markdown wrappers (like ```json), no greetings, no extra text.
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
    currency = "₹"
    tier_name = compute_budget_tier(budget, days, travelers, destination, datetime.datetime.now().month, 30)
    
    # Tier breakdown ratios
    if tier_name == "Backpacker":
        stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.30, 0.15, 0.35, 0.10, 0.10
    elif tier_name == "Budget Traveler":
        stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.35, 0.20, 0.30, 0.10, 0.05
    elif tier_name == "Mid Range":
        stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.40, 0.25, 0.20, 0.10, 0.05
    else: # Premium
        stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.45, 0.30, 0.15, 0.08, 0.02
        
    hotel_cost = round(budget * stay_pct, 2)
    food_cost = round(budget * food_pct, 2)
    transport_cost = round(budget * transport_pct, 2)
    activity_cost = round(budget * activities_pct, 2)
    misc_cost = round(budget * misc_pct, 2)
    total_cost = hotel_cost + food_cost + transport_cost + activity_cost + misc_cost

    dest_key = destination.lower()
    
    # Preset hotels by tier
    all_hotels = {
        "goa": {
            "Backpacker": [
                {"name": "Zostel Cavelossim", "rating": "4.5/5", "pricePerNight": f"{currency}1,200", "distanceFromCenter": "2.4 km from beach", "description": "Backpacker hostel with personal lockers, social events, common kitchen, and free wifi."}
            ],
            "Budget Traveler": [
                {"name": "Vasco Guesthouse", "rating": "4.2/5", "pricePerNight": f"{currency}2,800", "distanceFromCenter": "1.8 km from center", "description": "Cozy guesthouse with clean standard rooms, basic amenities, and friendly local hosts."}
            ],
            "Mid Range": [
                {"name": "Lemon Tree Amarante Beach Resort", "rating": "4.3/5", "pricePerNight": f"{currency}6,000", "distanceFromCenter": "1.1 km from Candolim Beach", "description": "3-star Portuguese-style resort with swimming pool, breakfast, and high-speed wifi."}
            ],
            "Premium": [
                {"name": "Taj Resort & Spa, Exotica", "rating": "4.8/5", "pricePerNight": f"{currency}15,500", "distanceFromCenter": "0.5 km from Benaulim Beach", "description": "Luxury 5-star beach-front property with fine dining, beach access, and a premium spa."}
            ]
        },
        "paris": {
            "Backpacker": [
                {"name": "Generator Hostel Paris", "rating": "4.1/5", "pricePerNight": f"{currency}1,800", "distanceFromCenter": "3.2 km from center", "description": "Backpacker hostel featuring a lively social rooftop lounge overlooking Montmartre."}
            ],
            "Budget Traveler": [
                {"name": "Hotel Caron de Beaumarchais", "rating": "4.4/5", "pricePerNight": f"{currency}4,500", "distanceFromCenter": "1.0 km from Notre-Dame", "description": "Budget-friendly hotel themed around 18th-century French opera, located in Marais."}
            ],
            "Mid Range": [
                {"name": "Hotel Relais Saint-Germain", "rating": "4.5/5", "pricePerNight": f"{currency}9,500", "distanceFromCenter": "1.5 km from center", "description": "3-star traditional Parisian hotel with charming standard suites and breakfast."}
            ],
            "Premium": [
                {"name": "Shangri-La Paris", "rating": "4.9/5", "pricePerNight": f"{currency}42,000", "distanceFromCenter": "0.4 km from Eiffel Tower", "description": "Luxury historic palace hotel with Eiffel views, Michelin-starred fine dining, and pool."}
            ]
        }
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

    hotels = all_hotels.get(dest_key, {}).get(tier_name)
    if not hotels:
        # Dynamic hotels based on destination and tier
        if tier_name == "Backpacker":
            hotels = [
                {"name": f"{destination} Backpackers Hostel", "rating": "4.4/5", "pricePerNight": f"{currency}{round(budget/days*0.08)}", "distanceFromCenter": "2.1 km from center", "description": "Budget backpacker hostel with lockers, kitchen, social events, and wifi."},
                {"name": f"Zostel {destination}", "rating": "4.5/5", "pricePerNight": f"{currency}{round(budget/days*0.1)}", "distanceFromCenter": "1.8 km from center", "description": "Cozy backpacker dorm with personal lockers, free wifi, and common kitchen."}
            ]
        elif tier_name == "Budget Traveler":
            hotels = [
                {"name": f"{destination} Standard Guesthouse", "rating": "4.2/5", "pricePerNight": f"{currency}{round(budget/days*0.2)}", "distanceFromCenter": "1.5 km from center", "description": "Affordable guesthouse with standard rooms, basic amenities, and local hosts."},
                {"name": f"{destination} 2-Star Hotel", "rating": "4.1/5", "pricePerNight": f"{currency}{round(budget/days*0.25)}", "distanceFromCenter": "2.0 km from center", "description": "Clean budget hotel with standard amenities and friendly service."}
            ]
        elif tier_name == "Mid Range":
            hotels = [
                {"name": f"{destination} Comfort Suites", "rating": "4.3/5", "pricePerNight": f"{currency}{round(budget/days*0.35)}", "distanceFromCenter": "0.8 km from center", "description": "Comfortable 3-star hotel with pool, breakfast, and wifi."},
                {"name": f"Lemon Tree {destination}", "rating": "4.4/5", "pricePerNight": f"{currency}{round(budget/days*0.4)}", "distanceFromCenter": "1.2 km from center", "description": "Highly rated 3-star hotel with good facilities and central location."}
            ]
        else:
            hotels = [
                {"name": f"Hotel {destination} Royale & Spa", "rating": "4.8/5", "pricePerNight": f"{currency}{round(budget/days*0.5)}", "distanceFromCenter": "0.4 km from center", "description": "Luxury 5-star stay with fine dining, premium spa, and pool."},
                {"name": f"Taj {destination} Palace", "rating": "4.9/5", "pricePerNight": f"{currency}{round(budget/days*0.65)}", "distanceFromCenter": "0.6 km from center", "description": "Premium luxury heritage property with exceptional standard of hospitality."}
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
        
        # Adjust costs by tier
        if tier_name == "Backpacker":
            lunch_cost = 120.0
            dinner_cost = 140.0
            act1_cost = 50.0
            act2_cost = 100.0
        elif tier_name == "Budget Traveler":
            lunch_cost = 250.0
            dinner_cost = 280.0
            act1_cost = 150.0
            act2_cost = 300.0
        elif tier_name == "Mid Range":
            lunch_cost = 550.0
            dinner_cost = 750.0
            act1_cost = 350.0
            act2_cost = 600.0
        else: # Premium
            lunch_cost = 1500.0
            dinner_cost = 2500.0
            act1_cost = 1000.0
            act2_cost = 2000.0

        # Determine activities based on weather
        if "rain" in weather_str.lower():
            act_1 = {"time": "Morning", "title": "Local Museum Tour", "description": "Explore the historical collections, antiquities, and art pieces indoors.", "estimatedCost": act1_cost, "duration": "3 hours", "location": "City Museum"}
            act_2 = {"time": "Afternoon", "title": "Traditional Spa / Wellness", "description": "Indulge in indoor therapies and relaxation.", "estimatedCost": act2_cost, "duration": "2.5 hours", "location": "Spa Center"}
            act_3 = {"time": "Evening", "title": "Teahouse / Indoor Concert", "description": "Enjoy warm beverages and watch local performances indoors.", "estimatedCost": 0.0, "duration": "3 hours", "location": "Cultural Center"}
        else:
            act_1 = {"time": "Morning", "title": f"Visit {attractions[(d-1)%len(attractions)]['name']}", "description": attractions[(d-1)%len(attractions)]['description'], "estimatedCost": act1_cost, "duration": "2.5 hours", "location": attractions[(d-1)%len(attractions)]['location']}
            act_2 = {"time": "Afternoon", "title": f"Explore {attractions[(d)%len(attractions)]['name']}", "description": attractions[(d)%len(attractions)]['description'], "estimatedCost": act2_cost, "duration": "3 hours", "location": attractions[(d)%len(attractions)]['location']}
            act_3 = {"time": "Evening", "title": "Local Sunset Walk", "description": "Walk around the city center to capture photos and enjoy breezes.", "estimatedCost": 0.0, "duration": "1.5 hours", "location": "Scenic Vista"}
 
        daily_itinerary.append({
            "day": d,
            "weather": weather_str,
            "activities": [act_1, act_2, act_3],
            "restaurants": [
                {
                    "name": f"{destination} Bites Cafe" if tier_name != "Backpacker" else "Street Food Stalls",
                    "cuisine": "Traditional & Continental" if tier_name != "Backpacker" else "Local Street Food",
                    "recommendedMeal": "Lunch",
                    "estimatedCost": lunch_cost,
                    "description": "Bustling local favorite serving quick and delicious meals."
                },
                {
                    "name": f"The Royal {destination} Dining" if tier_name == "Premium" else f"{destination} Family Dhaba" if tier_name == "Backpacker" else f"{destination} Local Tavern",
                    "cuisine": "Fine Dining" if tier_name == "Premium" else "Local Vegetarian" if tier_name == "Backpacker" else "Traditional Cookhouse",
                    "recommendedMeal": "Dinner",
                    "estimatedCost": dinner_cost,
                    "description": "Popular dinner option with highly rated specialties."
                }
            ]
        })
 
    travel_tips = [
        f"Pack light clothing for {destination}, but carry an umbrella as Day 2 shows {weather_forecast[1]['condition'] if len(weather_forecast) > 1 else 'Rain'}.",
        f"Keep your passport and local currency ({currency}) handy for the bustling street markets in {destination}.",
        f"Book local airport transfers in {destination} in advance to stay within your transportation limit.",
        f"Ask locals in {destination} for restaurant recommendations to discover the best authentic food!"
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
