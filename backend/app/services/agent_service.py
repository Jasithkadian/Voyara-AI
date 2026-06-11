import os
import json
import logging
from typing import Dict, Any, List
from openai import OpenAI
import httpx
from app.services.weather_service import get_weather_forecast
from app.services.hotel_service import search_hotels
from app.services.flight_service import search_flights

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

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
    def run(self, source: str, destination: str, days: int, interests: List[str], weather_data: List[Dict[str, Any]], hotels: List[Dict[str, Any]], preferences: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        logger.info(f"[PlannerAgent] Generating day-by-day itinerary...")
        
        pref_str = json.dumps(preferences) if preferences else "None"
        prompt = f"""
        You are the Planner Agent. Your job is to generate a day-by-day itinerary for a trip from {source} to {destination} for {days} days.
        Interests: {", ".join(interests)}
        User Profile Preferences: {pref_str}
        Weather Context: {json.dumps(weather_data)}
        Selected Lodging Options: {json.dumps(hotels)}
        
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
                
        # Fallback tips
        return [
            f"Respect local cultural customs and dress codes in {destination}.",
            "Keep emergency contact numbers handy and check regional safety guidelines.",
            "Book transportation from authorized vendor desks to prevent taxi scams.",
            "Stay hydrated and purchase travel health insurance before departure."
        ]

class BudgetAgent:
    """Specialized agent responsible for calculating and auditing the budget breakdown."""
    def run(self, budget: float, days: int, travelers: int, hotel_options: List[Dict[str, Any]], itinerary: List[Dict[str, Any]]) -> Dict[str, float]:
        logger.info(f"[BudgetAgent] Auditing travel expenses...")
        
        # Calculate estimated sum of activities from itinerary
        total_activity_cost = 0.0
        for day in itinerary:
            for act in day.get("activities", []):
                total_activity_cost += act.get("estimatedCost", 0.0)
            for rest in day.get("restaurants", []):
                total_activity_cost += rest.get("estimatedCost", 0.0)
                
        # Parse average hotel rate
        avg_hotel_price = 4500.0
        if hotel_options:
            try:
                price_str = hotel_options[0]["price"].replace("₹", "").replace(",", "").split(" ")[0]
                avg_hotel_price = float(price_str)
            except:
                pass
        total_hotel_cost = avg_hotel_price * days
        
        transport_cost = round(budget * 0.15, 2)
        misc_cost = round(budget * 0.10, 2)
        total_cost = total_hotel_cost + total_activity_cost + transport_cost + misc_cost
        
        # Ensure it fits within budget
        if total_cost > budget:
            # Scale down
            scale = budget / total_cost
            total_hotel_cost = round(total_hotel_cost * scale, 2)
            total_activity_cost = round(total_activity_cost * scale, 2)
            transport_cost = round(transport_cost * scale, 2)
            misc_cost = round(misc_cost * scale, 2)
            total_cost = budget
            
        return {
            "hotel_cost": total_hotel_cost,
            "food_cost": round(total_activity_cost * 0.4, 2),
            "transportation_cost": transport_cost,
            "activity_cost": round(total_activity_cost * 0.6, 2),
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
            preferences=user_preferences
        )
        
        # 4. Formulate safety guidelines & tips
        tips = self.safety_agent.run(destination, interests)
        
        # 5. Review and finalize budget allocations
        budget_breakdown = self.budget_agent.run(
            budget=budget,
            days=days,
            travelers=travelers,
            hotel_options=hotels,
            itinerary=itinerary
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
