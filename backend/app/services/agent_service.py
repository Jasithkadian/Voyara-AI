import os
import json
import logging
from typing import Dict, Any, List
from openai import OpenAI
import httpx
from app.services.weather_service import get_weather_forecast
from app.services.hotel_service import search_hotels
from app.services.flight_service import search_flights
import datetime

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

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

class WeatherAgent:
    """Specialized agent responsible for weather forecasts and local climate context."""
    def run(self, destination: str, days: int) -> List[Dict[str, Any]]:
        logger.info(f"[WeatherAgent] Fetching forecast for {destination}...")
        return get_weather_forecast(destination, days)

class HotelAgent:
    """Specialized agent responsible for finding hotel matches using real APIs/Mocks."""
    def run(self, destination: str, budget: float, days: int) -> List[Dict[str, Any]]:
        logger.info(f"[HotelAgent] Searching lodging for {destination}...")
        all_hotels = search_hotels(destination)
        # Filter/score hotels based on budget tier
        budget_per_night = (budget * 0.35) / days
        filtered_hotels = []
        for h in all_hotels:
            price_val = 5000.0
            try:
                price_val = float(h["price"].replace("₹", "").replace(",", "").split(" ")[0])
            except:
                pass
            # Rank matches
            filtered_hotels.append(h)
        return filtered_hotels[:3]

class PlannerAgent:
    """Specialized agent responsible for generating the daily activities schedule."""
    def run(self, source: str, destination: str, days: int, interests: List[str], weather_data: List[Dict[str, Any]], hotels: List[Dict[str, Any]], preferences: Dict[str, Any] = None, budget: float = 30000.0, travelers: int = 1) -> List[Dict[str, Any]]:
        logger.info(f"[PlannerAgent] Generating day-by-day itinerary...")
        
        # Calculate budget tier
        current_month = datetime.datetime.now().month
        tier_name = compute_budget_tier(budget, days, travelers, destination, current_month, 30)
        
        pref_str = json.dumps(preferences) if preferences else "None"
        prompt = f"""
        You are the Planner Agent. Your job is to generate a day-by-day itinerary for a trip from {source} to {destination} for {days} days.
        Interests: {", ".join(interests)}
        User Profile Preferences: {pref_str}
        Weather Context: {json.dumps(weather_data)}
        Selected Lodging Options: {json.dumps(hotels)}
        Detected Budget Tier: {tier_name}
        
        You MUST respond with a JSON array named "dailyItinerary" matching this structure:
        [
          {{
            "day": <int, e.g. 1>,
            "weather": "<e.g. Sunny, 30°C - match the weather forecast provided>",
            "activities": [
              {{
                "time": "<Morning | Afternoon | Evening>",
                "title": "<Activity Title>",
                "description": "<Activity description customized to user interests and profile preferences>",
                "estimatedCost": <float>,
                "duration": "<e.g. 2 hours>",
                "location": "<Location/Attraction Name>"
              }}
            ],
            "restaurants": [
              {{
                "name": "<Restaurant Name>",
                "cuisine": "<Cuisine Type>",
                "recommendedMeal": "<Lunch | Dinner>",
                "estimatedCost": <float>,
                "description": "<Why recommended matching preferences>"
              }}
            ]
          }}
        ]
        
        Follow these tier-specific constraints strictly in your suggestions:
        - If Detected Budget Tier is "Backpacker" (effective daily budget under ₹2,000 per day per person):
          * Transport mode MUST be "bus" or "train-sleeper" only.
          * Accommodation recommendations MUST be hostel dorm beds (personal lockers, social events, kitchen, and free wifi details).
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
        
        Respond ONLY with valid JSON. No markdown wrappers.
        """
        
        response_content = call_llm(prompt, "You are a professional travel planner that outputs strictly JSON.")
        if response_content:
            try:
                data = json.loads(response_content)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "dailyItinerary" in data:
                    return data["dailyItinerary"]
            except Exception as e:
                logger.error(f"[PlannerAgent] Failed to parse JSON: {e}. Falling back to simulation.")
                
        # Simulated fallback if LLM fails
        return simulate_daily_itinerary(destination, days, weather_data)

class SafetyAgent:
    """Specialized agent responsible for gathering safety advisories and packing tips."""
    def run(self, destination: str, interests: List[str]) -> List[str]:
        logger.info(f"[SafetyAgent] Formulating travel tips & safety guidelines...")
        prompt = f"""
        You are the Safety Agent. Formulate 4 highly useful and realistic travel tips, local customs, and safety rules for visiting {destination}.
        User Interests: {", ".join(interests)}
        
        Respond with a JSON array of strings:
        [
          "Tip 1...",
          "Tip 2..."
        ]
        
        Respond ONLY with valid JSON.
        """
        response_content = call_llm(prompt, "You are a travel safety advisor that outputs only JSON arrays.")
        if response_content:
            try:
                data = json.loads(response_content)
                if isinstance(data, list):
                    return data
            except:
                pass
                
        # Fallback tips: make destination-specific and context-aware
        dest = destination.lower()
        if "goa" in dest:
            return [
                "Negotiate scooter/car rentals down to ₹300-400 per day and inspect for damages beforehand.",
                "Wear comfortable beachwear, but cover up appropriately when visiting temples in Ponda.",
                "Taste local Goan fish curry and feni, but avoid shacks with poor hygiene ratings.",
                "Utilize Goa Miles app cabs for fixed transparent rates instead of local unmetered taxis."
            ]
        elif "bali" in dest:
            return [
                "Respect temple etiquette: always wear a sarong and sash at sacred Balinese sites.",
                "Be cautious of the wild monkeys at Ubud Monkey Forest; secure your sunglasses and phone.",
                "Avoid tap water entirely (including ice in remote areas) to prevent 'Bali Belly'.",
                "Rent scooters only if experienced, and always wear a helmet to comply with local police."
            ]
        elif "dubai" in dest:
            return [
                "Dress modestly in malls and public places to respect Islamic traditions in Dubai.",
                "Utilize the clean, air-conditioned Dubai Metro to travel between Downtown and Marina.",
                "Stay hydrated as temperatures can exceed 40°C, and restrict outdoor walks to evenings.",
                "Always ask for the meter to be turned on when riding official cream-colored taxis."
            ]
        elif "tokyo" in dest or "japan" in dest:
            return [
                "Purchase a Suica/Pasmo card or JR Pass for seamless navigation on Tokyo's metro systems.",
                "Avoid eating or drinking while walking; utilize designated areas near vending machines.",
                "Carry a small bag for trash, as public waste bins are extremely rare in Tokyo streets.",
                "Keep left on escalators in Tokyo (right in Osaka) and keep voice volume low in trains."
            ]
        elif "paris" in dest or "france" in dest:
            return [
                "Watch out for active pickpockets near the Eiffel Tower, Louvre, and on Metro Line 1.",
                "Always greet shopkeepers with a polite 'Bonjour' or 'Bonsoir' before asking questions.",
                "Validate your metro tickets at the barrier and keep them until you exit the station.",
                "Enjoy tap water safely by asking for 'une carafe d'eau' at Parisian bistros."
            ]
        else:
            # Dynamic template fallback based on destination and interests
            interest_tips = []
            if any(i.lower() in ["beaches", "adventure", "water sports"] for i in interests):
                interest_tips.append(f"Always check local tide schedules and weather flags before entering the water in {destination}.")
            if any(i.lower() in ["culture", "history", "temples"] for i in interests):
                interest_tips.append(f"Dress modestly and remove shoes when entering religious or historical sanctuaries in {destination}.")
            if any(i.lower() in ["nightlife", "party"] for i in interests):
                interest_tips.append(f"Drink responsibly and use verified ride-hailing apps for safe returns from {destination} nightlife zones.")
            
            # Pad with generic but destination-specific styled ones
            while len(interest_tips) < 4:
                if len(interest_tips) == 0:
                    interest_tips.append(f"Ensure you carry local currency for street vendors and small cafes across {destination}.")
                elif len(interest_tips) == 1:
                    interest_tips.append(f"Download offline Google Maps of {destination} to navigate streets and transit lines easily.")
                elif len(interest_tips) == 2:
                    interest_tips.append(f"Keep emergency numbers and the address of your hotel in {destination} saved offline.")
                else:
                    interest_tips.append(f"Always purchase reliable travel health insurance prior to your stay in {destination}.")
            return interest_tips

class BudgetAgent:
    """Specialized agent responsible for calculating and auditing the budget breakdown."""
    def run(self, budget: float, days: int, travelers: int, hotel_options: List[Dict[str, Any]], itinerary: List[Dict[str, Any]], destination: str = "Goa") -> Dict[str, float]:
        logger.info(f"[BudgetAgent] Auditing travel expenses...")
        
        current_month = datetime.datetime.now().month
        tier_name = compute_budget_tier(budget, days, travelers, destination, current_month, 30)
        
        if tier_name == "Backpacker":
            stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.30, 0.15, 0.35, 0.10, 0.10
        elif tier_name == "Budget Traveler":
            stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.35, 0.20, 0.30, 0.10, 0.05
        elif tier_name == "Mid Range":
            stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.40, 0.25, 0.20, 0.10, 0.05
        else: # Premium
            stay_pct, transport_pct, food_pct, activities_pct, misc_pct = 0.45, 0.30, 0.15, 0.08, 0.02
            
        total_hotel_cost = round(budget * stay_pct, 2)
        transport_cost = round(budget * transport_pct, 2)
        food_cost = round(budget * food_pct, 2)
        activity_cost = round(budget * activities_pct, 2)
        misc_cost = round(budget * misc_pct, 2)
        total_cost = total_hotel_cost + food_cost + transport_cost + activity_cost + misc_cost
        
        # Ensure it fits within budget
        if total_cost > budget:
            scale = budget / total_cost
            total_hotel_cost = round(total_hotel_cost * scale, 2)
            food_cost = round(food_cost * scale, 2)
            transport_cost = round(transport_cost * scale, 2)
            activity_cost = round(activity_cost * scale, 2)
            misc_cost = round(misc_cost * scale, 2)
            total_cost = budget
            
        return {
            "hotel_cost": total_hotel_cost,
            "food_cost": food_cost,
            "transportation_cost": transport_cost,
            "activity_cost": activity_cost,
            "miscellaneous_cost": misc_cost,
            "total_cost": total_cost
        }

class CoordinatorAgent:
    """Coordinator Agent orchestrating the specialists and aggregating their answers."""
    def __init__(self):
        self.weather_agent = WeatherAgent()
        self.hotel_agent = HotelAgent()
        self.planner_agent = PlannerAgent()
        self.safety_agent = SafetyAgent()
        self.budget_agent = BudgetAgent()

    def generate_trip_plan(
        self,
        source: str,
        destination: str,
        days: int,
        budget: float,
        travelers: int,
        interests: List[str],
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        
        # 1. Fetch weather forecast
        weather_forecast = self.weather_agent.run(destination, days)
        
        # 2. Get hotel matches
        hotels = self.hotel_agent.run(destination, budget, days)
        
        # 3. Create itinerary
        itinerary = self.planner_agent.run(
            source=source,
            destination=destination,
            days=days,
            interests=interests,
            weather_data=weather_forecast,
            hotels=hotels,
            preferences=user_preferences,
            budget=budget,
            travelers=travelers
        )
        
        # 4. Formulate safety guidelines & tips
        tips = self.safety_agent.run(destination, interests)
        
        # 5. Review and finalize budget allocations
        budget_breakdown = self.budget_agent.run(
            budget=budget,
            days=days,
            travelers=travelers,
            hotel_options=hotels,
            itinerary=itinerary,
            destination=destination
        )
        
        # 6. Search Flights (real flight matches)
        flights = search_flights(source, destination, "2026-06-12", passengers=travelers)
        
        # Extract Attractions
        attractions = []
        seen = set()
        for day in itinerary:
            for act in day.get("activities", []):
                name = act.get("title", "")
                if name and name not in seen:
                    seen.add(name)
                    attractions.append({
                        "name": name,
                        "description": act.get("description", "A highly rated spot to check out."),
                        "category": "Culture" if "museum" in name.lower() or "fort" in name.lower() else "Adventure",
                        "location": act.get("location", destination),
                        "rating": "4.5/5"
                    })
        
        return {
            "tripSummary": {
                "destination": destination,
                "days": days,
                "travelers": travelers
            },
            "dailyItinerary": itinerary,
            "budgetBreakdown": budget_breakdown,
            "hotelRecommendations": hotels,
            "attractions": attractions[:5],
            "travelTips": tips,
            "flights": flights,
            "weather": weather_forecast
        }

def call_llm(prompt: str, system_message: str) -> str:
    """Helper method to invoke Anthropic or OpenAI API, returning raw content string."""
    if ANTHROPIC_API_KEY:
        try:
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 3000,
                "messages": [{"role": "user", "content": prompt}],
                "system": system_message
            }
            with httpx.Client() as client:
                res = client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers, timeout=15.0)
                if res.status_code == 200:
                    return res.json()["content"][0]["text"].strip()
        except Exception as e:
            logger.error(f"LLM Agent invocation failed on Claude: {e}")

    if OPENAI_API_KEY:
        try:
            client = OpenAI(api_key=OPENAI_API_KEY)
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                timeout=15.0
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"LLM Agent invocation failed on OpenAI: {e}")
            
    return ""

def simulate_daily_itinerary(destination: str, days: int, weather_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generates standard chronological simulation itinerary in case LLMs fail."""
    itinerary = []
    for d in range(1, days + 1):
        weather_item = weather_data[d-1] if d-1 < len(weather_data) else {"condition": "Sunny", "temp": 28}
        weather_str = f"{weather_item['condition']}, {weather_item['temp']}°C"
        itinerary.append({
            "day": d,
            "weather": weather_str,
            "activities": [
                {
                    "time": "Morning",
                    "title": f"Explore Central {destination} Landmarks",
                    "description": f"Embark on a walking tour of the most iconic historical monuments and view points around {destination}.",
                    "estimatedCost": 250.0,
                    "duration": "2.5 hours",
                    "location": "Historic Square"
                },
                {
                    "time": "Afternoon",
                    "title": f"Discover {destination} Local Market",
                    "description": "Indulge in shopping for local crafts, clothes, spices, and souvenirs from local vendors.",
                    "estimatedCost": 500.0,
                    "duration": "3 hours",
                    "location": "Bazaar Street"
                },
                {
                    "time": "Evening",
                    "title": "Sunset View & Local Walks",
                    "description": "Enjoy scenic views as the sun sets. Capture photos and experience the vibrant evening city life.",
                    "estimatedCost": 0.0,
                    "duration": "1.5 hours",
                    "location": "Sunset View Point"
                }
            ],
            "restaurants": [
                {
                    "name": f"{destination} Traditional Diner",
                    "cuisine": "Local Fusion",
                    "recommendedMeal": "Lunch",
                    "estimatedCost": 350.0,
                    "description": "A popular restaurant serving signature authentic meals."
                },
                {
                    "name": f"The Grand {destination} Lounge",
                    "cuisine": "International & Seafood",
                    "recommendedMeal": "Dinner",
                    "estimatedCost": 800.0,
                    "description": "Elegant dining with ocean or city views and live background instrumental music."
                }
            ]
        })
    return itinerary
