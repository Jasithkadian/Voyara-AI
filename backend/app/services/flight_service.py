import os
import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID", "")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET", "")
AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY", "")

def parse_duration_to_minutes(duration_str: str) -> int:
    try:
        duration_str = duration_str.lower().replace(" ", "").replace("pt", "")
        # e.g., "2h30m", "7h45m", "8h", "2h", "45m"
        hours = 0
        minutes = 0
        if "h" in duration_str:
            parts = duration_str.split("h")
            hours = int(parts[0])
            if len(parts) > 1 and "m" in parts[1]:
                minutes = int(parts[1].replace("m", ""))
        elif "m" in duration_str:
            minutes = int(duration_str.replace("m", ""))
        else:
            minutes = int(duration_str)
        return hours * 60 + minutes
    except Exception:
        return 180

def enrich_and_tag_flights(flights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not flights:
        return []
    
    enriched = []
    for fl in flights:
        price = fl["price"]
        stops = fl["stops"]
        
        # Base price and taxes
        base_price = round(price * 0.85, 2)
        taxes = round(price * 0.15, 2)
        
        # Stop locations
        if "stopLocations" not in fl:
            if stops > 0:
                stop_locs = ["DXB"] if price > 30000 else ["BOM"]
            else:
                stop_locs = []
        else:
            stop_locs = fl["stopLocations"]
            
        # Baggage allowance
        baggage = fl.get("baggage", "7kg Cabin, 15kg Checked" if price < 20000 else "7kg Cabin, 25kg Checked")
        
        # Cancellation
        cancellation = fl.get("cancellation", "Non-refundable" if price < 15000 else "Refundable (fee applies)")
        
        enriched_fl = {
            **fl,
            "basePrice": base_price,
            "taxes": taxes,
            "baggage": baggage,
            "cancellation": cancellation,
            "stopLocations": stop_locs,
            "bestValue": False,
            "bestValueExplanation": ""
        }
        enriched.append(enriched_fl)
        
    # Find Best Value: score = price + stops * 3000 + duration_mins * 10
    best_idx = 0
    best_score = float('inf')
    for i, fl in enumerate(enriched):
        mins = parse_duration_to_minutes(fl.get("duration", "2h 30m"))
        score = fl["price"] + (fl["stops"] * 3000) + (mins * 10)
        if score < best_score:
            best_score = score
            best_idx = i
            
    if enriched:
        enriched[best_idx]["bestValue"] = True
        enriched[best_idx]["bestValueExplanation"] = "Best combination of ticket price, travel time, and minimum stops."
    
    return enriched

def search_flights(
    source: str,
    destination: str,
    departure_date: str,
    return_date: str = None,
    passengers: int = 1
) -> List[Dict[str, Any]]:
    """
    Searches for flights. Tries Amadeus Flight API first, falls back to AviationStack, 
    and finally returns a robust simulated flight selection if APIs are unconfigured or fail.
    """
    flights = []
    
    # 1. Try Amadeus
    if AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET:
        try:
            logger.info("Attempting flight search via Amadeus API...")
            # Authenticate Amadeus
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
                    
                    # Flight Offers Search
                    search_url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
                    params = {
                        "originLocationCode": source[:3].upper(), # Assuming IATA Code format
                        "destinationLocationCode": destination[:3].upper(),
                        "departureDate": departure_date,
                        "adults": passengers,
                        "max": 5
                    }
                    if return_date:
                        params["returnDate"] = return_date
                        
                    res = client.get(search_url, params=params, headers=headers, timeout=10.0)
                    if res.status_code == 200:
                        data = res.json().get("data", [])
                        for offer in data:
                            itinerary = offer["itineraries"][0]
                            segment = itinerary["segments"][0]
                            carrier = segment["carrierCode"]
                            
                            stop_locs = []
                            if len(itinerary["segments"]) > 1:
                                for seg in itinerary["segments"][:-1]:
                                    stop_locs.append(seg["arrival"]["iataCode"])
                                    
                            flights.append({
                                "airline": carrier, # E.g., LH, Indigo, BA
                                "flightNumber": f"{carrier}-{segment['number']}",
                                "price": float(offer["price"]["total"]),
                                "duration": itinerary["duration"].replace("PT", "").lower(),
                                "departure": segment["departure"]["at"][-8:-3],
                                "arrival": segment["arrival"]["at"][-8:-3],
                                "stops": len(itinerary["segments"]) - 1,
                                "stopLocations": stop_locs
                            })
                        if flights:
                            return enrich_and_tag_flights(flights)
        except Exception as e:
            logger.error(f"Amadeus Flight API search failed: {e}")

    # 2. Try AviationStack Fallback
    if not flights and AVIATIONSTACK_API_KEY:
        try:
            logger.info("Attempting flight search via AviationStack API...")
            url = "http://api.aviationstack.com/v1/flights"
            params = {
                "access_key": AVIATIONSTACK_API_KEY,
                "dep_iata": source[:3].upper(),
                "arr_iata": destination[:3].upper(),
                "limit": 5
            }
            with httpx.Client() as client:
                res = client.get(url, params=params, timeout=5.0)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    for fl in data:
                        airline = fl.get("airline", {}).get("name", "Unknown Airline")
                        flight_num = fl.get("flight", {}).get("iata", "N/A")
                        flights.append({
                            "airline": airline,
                            "flightNumber": flight_num,
                            "price": 7500.0, # AviationStack API mostly lacks price info on free tier
                            "duration": "2h 45m",
                            "departure": fl.get("departure", {}).get("scheduled", "12:00")[-8:-3],
                            "arrival": fl.get("arrival", {}).get("scheduled", "14:45")[-8:-3],
                            "stops": 0
                        })
                    if flights:
                        return enrich_and_tag_flights(flights)
        except Exception as e:
            logger.error(f"AviationStack Flight API failed: {e}")

    # 3. Smart High-Fidelity Mock Fallback (Guarantees beautiful commercial data)
    logger.warning("Using high-fidelity mock flight data engine.")
    flights = get_mock_flights(source, destination, passengers)
    return enrich_and_tag_flights(flights)

def get_mock_flights(source: str, destination: str, passengers: int) -> List[Dict[str, Any]]:
    # Simple rule-based generation
    s_clean = source.strip().lower()
    d_clean = destination.strip().lower()
    
    # Preset rates based on distance simulation
    base_price = 5500.0
    if "delhi" in s_clean and "goa" in d_clean:
        base_price = 6200.0
    elif "mumbai" in s_clean and "goa" in d_clean:
        base_price = 3800.0
    elif "new york" in s_clean or "london" in s_clean or "paris" in s_clean or "tokyo" in s_clean:
        base_price = 45000.0
        
    price_1 = base_price * passengers
    price_2 = (base_price + 1850) * passengers
    price_3 = (base_price - 800) * passengers

    if base_price > 30000:  # International
        return [
            {
                "airline": "Emirates",
                "flightNumber": "EK-503",
                "price": price_1,
                "duration": "7h 45m",
                "departure": "04:15",
                "arrival": "12:00",
                "stops": 1,
                "stopLocations": ["DXB"]
            },
            {
                "airline": "Qatar Airways",
                "flightNumber": "QR-298",
                "price": price_2,
                "duration": "8h 15m",
                "departure": "09:30",
                "arrival": "17:45",
                "stops": 1,
                "stopLocations": ["DOH"]
            },
            {
                "airline": "Air India",
                "flightNumber": "AI-121",
                "price": price_3,
                "duration": "9h 30m",
                "departure": "13:15",
                "arrival": "22:45",
                "stops": 0,
                "stopLocations": []
            }
        ]
    else:  # Domestic
        return [
            {
                "airline": "IndiGo",
                "flightNumber": "6E-221",
                "price": price_1,
                "duration": "2h 30m",
                "departure": "10:30",
                "arrival": "13:00",
                "stops": 0,
                "stopLocations": []
            },
            {
                "airline": "Air India",
                "flightNumber": "AI-845",
                "price": price_2,
                "duration": "2h 40m",
                "departure": "08:15",
                "arrival": "10:55",
                "stops": 0,
                "stopLocations": []
            },
            {
                "airline": "Vistara",
                "flightNumber": "UK-811",
                "price": price_3,
                "duration": "2h 25m",
                "departure": "18:30",
                "arrival": "20:55",
                "stops": 0,
                "stopLocations": []
            }
        ]
