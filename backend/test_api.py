import requests
import json

def test_generate():
    url = "http://127.0.0.1:8000/api/generate-trip"
    payload = {
        "source": "Delhi",
        "destination": "Goa",
        "days": 5,
        "budget": 30000,
        "travelers": 1,
        "interests": ["Beaches", "Nightlife", "Water Sports"]
    }
    try:
        print("Sending request to:", url)
        response = requests.post(url, json=payload, timeout=30)
        print("Status code:", response.status_code)
        if response.status_code == 200:
            data = response.json()
            print("Response structure keys:")
            print(list(data.keys()))
            print("\ntripSummary:", json.dumps(data.get("tripSummary"), indent=2))
            print("\nbudgetBreakdown:", json.dumps(data.get("budgetBreakdown"), indent=2))
            print("\nNumber of dailyItinerary items:", len(data.get("dailyItinerary", [])))
            print("\nNumber of hotelRecommendations:", len(data.get("hotelRecommendations", [])))
            print("\nNumber of attractions:", len(data.get("attractions", [])))
            print("\ntravelTips:", data.get("travelTips"))
        else:
            print("Error response:", response.text)
    except Exception as e:
        print("Failed to connect to backend:", e)

if __name__ == "__main__":
    test_generate()
