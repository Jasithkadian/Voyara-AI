import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.user_profile import UserProfile
from app.models.trip import Trip
from app.models.booking import Booking

logger = logging.getLogger(__name__)

def generate_personalized_recommendations(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Recommendation Engine: Generates personalized hotel, activity, restaurant, 
    and destination matches using Profile Preferences and history.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    trips = db.query(Trip).filter(Trip.user_id == user_id).all()
    bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
    
    # Defaults
    style = profile.travel_style if profile else "Relaxation"
    budget = profile.budget_range if profile else "Mid-Range"
    
    # 1. Destination Matching
    all_dests = [
        {"name": "Bali", "category": "Relaxation", "reason": "Perfect match for tropical beach getaways and wellness spas."},
        {"name": "Switzerland", "category": "Adventure", "reason": "Stunning alpine vistas, ski resorts, and hiking trails."},
        {"name": "Japan", "category": "Culture", "reason": "Explore ancient temples, historic castles, and local cuisine."},
        {"name": "Dubai", "category": "Luxury", "reason": "Stunning modern architecture, shopping malls, and premium safaris."},
        {"name": "Goa", "category": "Food", "reason": "Excellent local seafood curries, beach bars, and nightlife."}
    ]
    
    recommended_dests = []
    for d in all_dests:
        if d["category"].lower() == style.lower() or (budget.lower() == "luxury" and d["category"] == "Luxury"):
            recommended_dests.append(d)
            
    # Fallback if no direct match
    if not recommended_dests:
        recommended_dests = [all_dests[0], all_dests[2]]

    # 2. Hotel Recommendations
    hotel_options = [
        {"name": "Taj Exotica Resort, Goa", "budget": "Luxury", "style": "Relaxation", "price": "₹14,500/night", "rating": "4.9/5"},
        {"name": "Maya Ubud Resort, Bali", "budget": "Luxury", "style": "Relaxation", "price": "₹16,000/night", "rating": "4.8/5"},
        {"name": "Grindelwald Alpine Lodge, Switzerland", "budget": "Mid-Range", "style": "Adventure", "price": "₹9,500/night", "rating": "4.7/5"},
        {"name": "Ryokan Kyoto Heritage, Japan", "budget": "Mid-Range", "style": "Culture", "price": "₹7,200/night", "rating": "4.6/5"},
        {"name": "Backpackers Paradise, Goa", "budget": "Budget", "style": "Food", "price": "₹1,500/night", "rating": "4.4/5"}
    ]
    
    recommended_hotels = []
    for h in hotel_options:
        if h["budget"].lower() == budget.lower() or h["style"].lower() == style.lower():
            recommended_hotels.append(h)
    if not recommended_hotels:
        recommended_hotels = [hotel_options[0], hotel_options[2]]

    # 3. Activity recommendations
    activities = [
        {"title": "Beachside Snorkeling & Diving", "style": "Adventure", "location": "Bali", "cost": "₹2,500"},
        {"title": "Eiffel Tower Late Night Dinner", "style": "Luxury", "location": "Paris", "cost": "₹8,000"},
        {"title": "Kyoto Tea Ceremony Tour", "style": "Culture", "location": "Japan", "cost": "₹3,500"},
        {"title": "Ziplining Alpine Valley", "style": "Adventure", "location": "Switzerland", "cost": "₹4,500"},
        {"title": "Local Street Food Crawl", "style": "Food", "location": "Goa", "cost": "₹1,200"}
    ]
    
    recommended_acts = [a for a in activities if a["style"].lower() == style.lower()]
    if not recommended_acts:
        recommended_acts = [activities[0], activities[2]]

    return {
        "destinations": recommended_dests,
        "hotels": recommended_hotels[:3],
        "activities": recommended_acts[:3]
    }
