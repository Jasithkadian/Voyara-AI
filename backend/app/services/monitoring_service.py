import logging
import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.trip import Trip
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)

def run_realtime_trip_monitor(db: Session, user_id: int, trip_id: int) -> Dict[str, Any]:
    """
    Simulates checking weather changes or delay alerts.
    If rain is detected, it rewrites the itinerary automatically and triggers a notification.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        return {"status": "error", "message": "Trip not found"}

    plan = trip.generated_plan or {}
    daily_itinerary = plan.get("dailyItinerary", [])
    
    modified = False
    affected_days = []
    
    for day in daily_itinerary:
        day_num = day.get("day", 1)
        weather = day.get("weather", "").lower()
        
        # Simulate weather alert (e.g., weather forecast changed to Rain, or let's force a weather drop alert)
        if "rain" not in weather and day_num == 2: # Inject rain for Day 2 to demonstrate adaptive rewriting
            day["weather"] = "Thunderstorms, 23°C (Alert)"
            affected_days.append(day_num)
            
            # Rewrite outdoor activities to indoor alternatives
            for act in day.get("activities", []):
                title = act.get("title", "")
                if "beach" in title.lower() or "outdoor" in title.lower() or "hike" in title.lower() or "explore" in title.lower() or "fort" in title.lower() or "walk" in title.lower():
                    act["title"] = "Indoor: " + title
                    act["description"] = "REWRITTEN FOR WEATHER: Heavy downpours expected. Enjoy local historic museums, indoor art galleries, or cafe sessions."
                    act["estimatedCost"] = round(act.get("estimatedCost", 100) * 0.8, 2)
            
            modified = True

    if modified:
        trip.generated_plan = plan
        db.commit()
        db.refresh(trip)
        
        # Dispatch notification
        msg = f"Heavy rain/thunderstorms expected on Day {', '.join(map(str, affected_days))} of your trip to {trip.destination}. We have automatically rescheduled outdoor excursions to premium indoor alternatives."
        create_notification(
            db=db,
            user_id=user_id,
            title="Weather Alert: Itinerary Updated!",
            message=msg,
            type="Weather"
        )
        return {
            "status": "rescheduled",
            "message": "Itinerary updated automatically due to weather changes",
            "notified": True,
            "updated_plan": plan
        }
        
    return {"status": "nominal", "message": "Weather and operations are standard."}
