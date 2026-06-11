from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.database.connection import get_db
from app.routes.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.models.user import User
from app.models.trip import Trip
from app.models.user_profile import UserProfile
from app.services.agent_service import CoordinatorAgent
from jose import jwt
import json
import logging
import os
from openai import OpenAI

coordinator = CoordinatorAgent()

def get_optional_user(request: Request, db: Session) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email:
            return db.query(User).filter(User.email == email).first()
    except Exception:
        pass
    return None

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Trips"])

# Pydantic Schemas
class TripGenerateRequest(BaseModel):
    source: str
    destination: str
    days: int
    budget: float
    travelers: int = 1
    interests: List[str] = []

class TripSaveRequest(BaseModel):
    source: str
    destination: str
    budget: float
    days: int
    travelers: int
    interests: List[str] = []
    generated_plan: Dict[str, Any]

class ReplanRequest(BaseModel):
    trip_id: int
    changes: str

class TripUpdateRequest(BaseModel):
    trip_id: int
    budget: float
    days: int
    travelers: int
    interests: List[str] = []
    generated_plan: Dict[str, Any]


# Endpoints
@router.post("/generate-trip")
def generate_trip_v3(
    request: TripGenerateRequest,
    req_obj: Request,
    db: Session = Depends(get_db)
):
    try:
        # Load optional user profile preferences
        preferences = {}
        user = get_optional_user(req_obj, db)
        if user:
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            if profile:
                preferences = {
                    "travel_style": profile.travel_style,
                    "budget_range": profile.budget_range,
                    "food_preferences": profile.food_preferences,
                    "preferred_activities": profile.preferred_activities
                }

        plan = coordinator.generate_trip_plan(
            source=request.source,
            destination=request.destination,
            days=request.days,
            budget=request.budget,
            travelers=request.travelers,
            interests=request.interests,
            user_preferences=preferences
        )
        return plan
    except Exception as e:
        logger.error(f"Failed to generate trip V3: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate trip itinerary V3: {str(e)}"
        )

@router.post("/trips/generate")
def generate_trip(
    request: TripGenerateRequest,
    req_obj: Request,
    db: Session = Depends(get_db)
):
    try:
        # Load optional user profile preferences
        preferences = {}
        user = get_optional_user(req_obj, db)
        if user:
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            if profile:
                preferences = {
                    "travel_style": profile.travel_style,
                    "budget_range": profile.budget_range,
                    "food_preferences": profile.food_preferences,
                    "preferred_activities": profile.preferred_activities
                }

        plan = coordinator.generate_trip_plan(
            source=request.source,
            destination=request.destination,
            days=request.days,
            budget=request.budget,
            travelers=request.travelers,
            interests=request.interests,
            user_preferences=preferences
        )
        return plan
    except Exception as e:
        logger.error(f"Failed to generate trip: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate trip itinerary: {str(e)}"
        )

@router.post("/trips/save")
def save_trip(
    request: TripSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Create Trip record
        db_trip = Trip(
            user_id=current_user.id,
            source=request.source,
            destination=request.destination,
            budget=request.budget,
            days=request.days,
            travelers=request.travelers,
            interests=request.interests,
            generated_plan=request.generated_plan
        )
        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)

        return {
            "status": "success",
            "trip_id": db_trip.id,
            "message": "Trip saved successfully",
            "trip": {
                "id": db_trip.id,
                "source": db_trip.source,
                "destination": db_trip.destination,
                "budget": db_trip.budget,
                "days": db_trip.days,
                "travelers": db_trip.travelers,
                "interests": db_trip.interests,
                "generated_plan": db_trip.generated_plan,
                "created_at": db_trip.created_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save trip: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save trip: {str(e)}"
        )

@router.get("/trips/history")
def get_trip_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    
    result = []
    for trip in trips:
        result.append({
            "id": trip.id,
            "source": trip.source,
            "destination": trip.destination,
            "budget": trip.budget,
            "days": trip.days,
            "travelers": trip.travelers,
            "interests": trip.interests,
            "generated_plan": trip.generated_plan,
            "created_at": trip.created_at.isoformat()
        })
    return result

@router.delete("/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or unauthorized"
        )
    try:
        db.delete(trip)
        db.commit()
        return {"status": "success", "message": "Trip deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete trip: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete trip"
        )

@router.post("/trips/replan")
def replan_trip(
    request: ReplanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve existing trip
    trip = db.query(Trip).filter(Trip.id == request.trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or unauthorized"
        )

    # Replan using Claude/OpenAI
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    
    prompt = f"""
    You are an expert travel assistant. Replan the following trip to {trip.destination} according to these changes:
    "{request.changes}"

    Original Trip Details:
    - Source: {trip.source}
    - Destination: {trip.destination}
    - Budget: {trip.budget}
    - Days: {trip.days}
    - Travelers: {trip.travelers}
    - Interests: {trip.interests}
    
    Original Generated Plan details:
    {json.dumps(trip.generated_plan)}

    You MUST respond with a valid JSON object matching this structure exactly:
    {{
      "tripSummary": {{
        "destination": "<Destination>",
        "days": <integer>,
        "travelers": <integer>
      }},
      "dailyItinerary": [
        {{
          "day": <integer>,
          "weather": "<Weather status, e.g. Sunny, 30°C - modify if weather changes requested>",
          "activities": [
            {{
              "time": "<Morning | Afternoon | Evening>",
              "title": "<Activity Title>",
              "description": "<Activity description>",
              "estimatedCost": <float>,
              "duration": "<Duration>",
              "location": "<Location>"
            }}
          ],
          "restaurants": [
            {{
              "name": "<Restaurant Name>",
              "cuisine": "<Cuisine>",
              "recommendedMeal": "<Meal>",
              "estimatedCost": <float>,
              "description": "<Why recommended>"
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
          "rating": "<Rating>",
          "pricePerNight": "<Price>",
          "distanceFromCenter": "<Distance>",
          "description": "<Description>"
        }}
      ],
      "attractions": [
        {{
          "name": "<Attraction>",
          "description": "<Description>",
          "category": "<Nature | Adventure | Food | Culture | Nightlife>",
          "location": "<Location>",
          "rating": "<Rating>"
        }}
      ],
      "travelTips": [ ... ]
    }}

    Rules:
    1. If the budget changes, adjust all category costs in 'budgetBreakdown'.
    2. If the number of days changes (increases or decreases), generate the exact number of days requested in the new itinerary.
    3. Modify activities and weather descriptions to reflect specific weather requests (e.g. rain, heatwaves, indoor vs outdoor).
    4. Respond ONLY with the JSON object. No markdown wrappers.
    """

    new_plan = None
    
    # Try Anthropic Claude
    if api_key:
        try:
            logger.info("Using Claude API for replan.")
            headers = {
                "x-api-key": api_key,
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
            import httpx
            with httpx.Client() as client:
                response = client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers, timeout=20.0)
                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json["content"][0]["text"]
                    # Clean markdown wrappers if any
                    if content.strip().startswith("```json"):
                        content = content.strip()[7:]
                    if content.strip().endswith("```"):
                        content = content.strip()[:-3]
                    new_plan = json.loads(content.strip())
        except Exception as e:
            logger.error(f"Claude Replan Error: {e}")

    # Fallback to OpenAI
    if not new_plan and openai_key:
        try:
            logger.info("Using OpenAI fallback for replan.")
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a professional travel replanner that outputs only JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                timeout=15.0
            )
            new_plan = json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI Replan Error: {e}")

    # Fallback to Local Simulation
    if not new_plan:
        logger.warning("No API keys set or APIs failed. Simulating replan locally.")
        new_plan = simulate_replan_v3(trip.generated_plan, request.changes)

    try:
        # Update trip in database
        trip.budget = new_plan["budgetBreakdown"].get("total_cost", trip.budget)
        trip.days = new_plan["tripSummary"].get("days", trip.days)
        trip.travelers = new_plan["tripSummary"].get("travelers", trip.travelers)
        trip.generated_plan = new_plan
        
        db.commit()
        db.refresh(trip)
        
        return {
            "status": "success",
            "trip": {
                "id": trip.id,
                "source": trip.source,
                "destination": trip.destination,
                "budget": trip.budget,
                "days": trip.days,
                "travelers": trip.travelers,
                "interests": trip.interests,
                "generated_plan": trip.generated_plan,
                "created_at": trip.created_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update database for replan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply replanned trip in database: {str(e)}"
        )

@router.post("/trips/update")
def update_trip(
    request: TripUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == request.trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or unauthorized"
        )
    try:
        trip.budget = request.budget
        trip.days = request.days
        trip.travelers = request.travelers
        trip.interests = request.interests
        trip.generated_plan = request.generated_plan
        db.commit()
        db.refresh(trip)
        return {
            "status": "success",
            "trip": {
                "id": trip.id,
                "source": trip.source,
                "destination": trip.destination,
                "budget": trip.budget,
                "days": trip.days,
                "travelers": trip.travelers,
                "interests": trip.interests,
                "generated_plan": trip.generated_plan,
                "created_at": trip.created_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update database for trip: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update trip in database: {str(e)}"
        )

def simulate_replan_v3(original_plan: Dict[str, Any], changes: str) -> Dict[str, Any]:
    """
    Simulates replanning using rule-based changes matching V3 JSON structure.
    """
    changes_lower = changes.lower()
    
    # Deep copy original plan
    new_plan = json.loads(json.dumps(original_plan))
    
    # 1. Weather adjustments (rain / storm / snow)
    if "rain" in changes_lower or "weather" in changes_lower or "storm" in changes_lower:
        # Set Day 2 to Rain (if exists) or modify all days slightly
        for index, day in enumerate(new_plan.get("dailyItinerary", [])):
            if index == 1 or "rain" in changes_lower:  # Target day 2 or all days
                day["weather"] = "Rain, 24°C"
                for act in day.get("activities", []):
                    act["title"] = "Indoor: " + act["title"]
                    act["description"] = "Adjusted for rain. Enjoying indoor tours, dining in glass cafes, or visiting local historic museums."
                    act["estimatedCost"] = round(act["estimatedCost"] * 0.9, 2)
        new_plan.setdefault("travelTips", []).append("Note: Adjusted itinerary dynamically to prioritize indoor spots due to rainy forecasts.")

    # 2. Budget changes
    elif "budget" in changes_lower or "reduce" in changes_lower or "cheaper" in changes_lower:
        # Scale budget values down
        bd = new_plan["budgetBreakdown"]
        bd["hotel_cost"] = round(bd["hotel_cost"] * 0.7, 2)
        bd["food_cost"] = round(bd["food_cost"] * 0.7, 2)
        bd["transportation_cost"] = round(bd["transportation_cost"] * 0.75, 2)
        bd["activity_cost"] = round(bd["activity_cost"] * 0.65, 2)
        bd["miscellaneous_cost"] = round(bd["miscellaneous_cost"] * 0.6, 2)
        bd["total_cost"] = sum([bd["hotel_cost"], bd["food_cost"], bd["transportation_cost"], bd["activity_cost"], bd["miscellaneous_cost"]])
        
        # Adjust activities cost
        for day in new_plan.get("dailyItinerary", []):
            for act in day.get("activities", []):
                act["estimatedCost"] = round(act["estimatedCost"] * 0.7, 2)
        
        # Select cheaper hotels
        for hotel in new_plan.get("hotelRecommendations", []):
            hotel["name"] = hotel["name"] + " (Budget Saver)"
            hotel["description"] = hotel["description"] + " (Standard Room - Discounted rate applied)"
            
        new_plan.setdefault("travelTips", []).append("Note: Re-estimated budget categories down by 30% to fit your budget changes.")

    # 3. Days modifications
    elif "day" in changes_lower or "duration" in changes_lower:
        days = len(new_plan.get("dailyItinerary", []))
        if "reduce" in changes_lower or "fewer" in changes_lower or "less" in changes_lower or "decrease" in changes_lower:
            if days > 1:
                new_plan["dailyItinerary"] = new_plan["dailyItinerary"][:-1]
                new_plan["tripSummary"]["days"] = days - 1
        else:
            # Add a day
            new_day_num = days + 1
            new_plan["tripSummary"]["days"] = new_day_num
            new_plan.setdefault("dailyItinerary", []).append({
                "day": new_day_num,
                "weather": "Sunny, 28°C",
                "activities": [
                    {"time": "Morning", "title": "Explore Local Hidden Paths", "description": "Wander through local neighborhoods and find scenic view points.", "estimatedCost": 0.0, "duration": "2.5 hours", "location": "Scenic Route"},
                    {"time": "Afternoon", "title": "Visit Souvenir Craft Bazaar", "description": "Pick up handmade crafts, spices, and souvenirs.", "estimatedCost": 500.0, "duration": "3 hours", "location": "Artisans Alley"},
                    {"time": "Evening", "title": "Gourmet Farewell Dinner", "description": "Dine at the highly recommended local restaurant for a farewell meal.", "estimatedCost": 1200.0, "duration": "3 hours", "location": "Grand Bistro"}
                ],
                "restaurants": [
                    {"name": "Local Craft Cafe", "cuisine": "Bakery & Coffee", "recommendedMeal": "Lunch", "estimatedCost": 300.0, "description": "Highly rated bakery."},
                    {"name": "Traditional farewell diner", "cuisine": "Local delicacies", "recommendedMeal": "Dinner", "estimatedCost": 1200.0, "description": "Famous gourmet spot."}
                ]
            })

    return new_plan
