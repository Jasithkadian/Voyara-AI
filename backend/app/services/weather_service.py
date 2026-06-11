import os
import httpx
import logging
import random
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

def get_weather_forecast(destination: str, days: int) -> List[Dict[str, Any]]:
    """
    Retrieves weather forecast for a destination.
    Returns a list of daily weather objects, e.g. [{"day": 1, "condition": "Sunny", "temp": 31}]
    """
    if not OPENWEATHER_API_KEY:
        logger.info("OPENWEATHER_API_KEY not set. Generating simulated weather.")
        return simulate_weather(destination, days)

    try:
        # Fetch coordinates for the destination
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={destination}&limit=1&appid={OPENWEATHER_API_KEY}"
        response = httpx.get(geo_url, timeout=5.0)
        response.raise_for_status()
        geo_data = response.json()
        
        if not geo_data:
            logger.warning(f"Could not find coordinates for {destination}. Simulating weather.")
            return simulate_weather(destination, days)
            
        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        
        # Fetch 5-day weather forecast (standard OpenWeather free endpoint)
        weather_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
        weather_response = httpx.get(weather_url, timeout=5.0)
        weather_response.raise_for_status()
        weather_data = weather_response.json()
        
        # OpenWeather returns list of 3-hour forecasts. We aggregate them daily.
        forecast_list = weather_data.get("list", [])
        daily_forecasts = []
        
        # We slice 8 measurements per day (24 hours / 3 hours = 8)
        for i in range(days):
            index = min(i * 8 + 4, len(forecast_list) - 1)  # mid-day forecast
            if index < 0:
                break
            item = forecast_list[index]
            condition = item["weather"][0]["main"]
            temp = round(item["main"]["temp"])
            
            # Map common OpenWeather conditions to simplified ones
            if condition in ["Clear"]:
                condition = "Sunny"
            elif condition in ["Rain", "Drizzle", "Thunderstorm"]:
                condition = "Rain"
            elif condition in ["Clouds"]:
                condition = "Cloudy"
            
            daily_forecasts.append({
                "day": i + 1,
                "condition": condition,
                "temp": temp
            })
            
        # If the requested duration exceeds 5 days (OpenWeather free limit), pad it
        while len(daily_forecasts) < days:
            last_temp = daily_forecasts[-1]["temp"] if daily_forecasts else 25
            daily_forecasts.append({
                "day": len(daily_forecasts) + 1,
                "condition": random.choice(["Sunny", "Cloudy", "Windy"]),
                "temp": last_temp + random.randint(-2, 2)
            })
            
        return daily_forecasts
        
    except Exception as e:
        logger.error(f"Error fetching weather from OpenWeather: {str(e)}. Simulating fallback.")
        return simulate_weather(destination, days)

def simulate_weather(destination: str, days: int) -> List[Dict[str, Any]]:
    """
    Generates realistic simulated weather based on destination name.
    """
    dest_lower = destination.lower()
    
    # Establish base temperature ranges
    if "goa" in dest_lower or "bali" in dest_lower or "phuket" in dest_lower:
        base_temp = 30
        conditions = ["Sunny", "Sunny", "Rain", "Cloudy", "Sunny"]
    elif "paris" in dest_lower or "london" in dest_lower or "new york" in dest_lower:
        base_temp = 18
        conditions = ["Cloudy", "Rain", "Sunny", "Cloudy", "Windy"]
    elif "tokyo" in dest_lower:
        base_temp = 22
        conditions = ["Sunny", "Sunny", "Cloudy", "Rain", "Sunny"]
    else:
        base_temp = 25
        conditions = ["Sunny", "Cloudy", "Sunny", "Rain", "Windy"]
        
    forecasts = []
    for d in range(1, days + 1):
        cond = conditions[(d - 1) % len(conditions)]
        # Add slight variation in temp
        temp = base_temp + random.randint(-3, 3)
        forecasts.append({
            "day": d,
            "condition": cond,
            "temp": temp
        })
        
    return forecasts
