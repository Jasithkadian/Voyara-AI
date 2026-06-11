import logging
import json
import time
import threading
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.trip import Trip
from app.models.price_alert import PriceAlert
from app.database.connection import SessionLocal
from app.services.notification_service import create_notification
from app.services.flight_service import search_flights

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

def check_all_price_alerts(db: Session) -> Dict[str, Any]:
    """
    Scans all active price alerts, queries flight service, updates current_price,
    and dispatches a notification if the price has dropped or met target price.
    """
    logger.info("Running background check for active price alerts...")
    alerts = db.query(PriceAlert).filter(PriceAlert.is_active == True).all()
    triggered_count = 0
    checked_count = 0
    
    for alert in alerts:
        checked_count += 1
        try:
            # Query the flight service for this alert criteria
            flights = search_flights(
                source=alert.origin,
                destination=alert.destination,
                departure_date=alert.date,
                passengers=1
            )
            if not flights:
                continue
                
            # Find the lowest flight price available
            lowest_price = min(f["price"] for f in flights)
            
            # Detect drops
            if alert.current_price is None:
                alert.current_price = lowest_price
                db.commit()
            elif lowest_price < alert.current_price:
                # Price has dropped! Check if it satisfies the user's target
                met_target = lowest_price <= alert.target_price
                title = "Price Target Met!" if met_target else "Price Drop Alert!"
                msg = (
                    f"Good news! The flight from {alert.origin} to {alert.destination} on {alert.date} "
                    f"has dropped from ₹{alert.current_price:,.2f} to ₹{lowest_price:,.2f}."
                )
                if met_target:
                    msg += f" This meets your target price of ₹{alert.target_price:,.2f}!"
                
                create_notification(
                    db=db,
                    user_id=alert.user_id,
                    title=title,
                    message=msg,
                    type="PriceAlert"
                )
                alert.current_price = lowest_price
                db.commit()
                triggered_count += 1
            elif lowest_price <= alert.target_price and alert.current_price > alert.target_price:
                # If price is at or below target and wasn't previously flagged below target
                title = "Price Target Met!"
                msg = (
                    f"Good news! The flight from {alert.origin} to {alert.destination} on {alert.date} "
                    f"is now ₹{lowest_price:,.2f}, meeting your target price of ₹{alert.target_price:,.2f}!"
                )
                create_notification(
                    db=db,
                    user_id=alert.user_id,
                    title=title,
                    message=msg,
                    type="PriceAlert"
                )
                alert.current_price = lowest_price
                db.commit()
                triggered_count += 1
        except Exception as ex:
            logger.error(f"Failed to check price alert ID {alert.id}: {ex}")
            
    return {"status": "success", "checked": checked_count, "triggered": triggered_count}

def start_price_alert_monitor():
    def monitor_loop():
        # Delay startup to let database stabilize
        time.sleep(5)
        while True:
            try:
                db = SessionLocal()
                try:
                    check_all_price_alerts(db)
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"Error in price alert background thread: {e}")
            # Run every 6 hours
            time.sleep(6 * 3600)
            
    thread = threading.Thread(target=monitor_loop, daemon=True, name="PriceAlertMonitorThread")
    thread.start()
    logger.info("Background Price Alert monitor thread started.")
