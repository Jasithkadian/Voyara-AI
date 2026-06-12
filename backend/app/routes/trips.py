from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.database.connection import get_db
from app.routes.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.models.user import User
from app.models.trip import Trip
from app.models.user_profile import UserProfile
from app.services.agent_service import CoordinatorAgent, compute_budget_tier
from jose import jwt
import json
import logging
import os
import secrets
import io
import datetime
from openai import OpenAI

# ReportLab Imports for PDF Itinerary Generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch


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

    # Determine old budget tier
    old_month = datetime.datetime.now().month
    # Parse month from changes if any
    changes_lower = request.changes.lower()
    months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    for i, m in enumerate(months):
        if m in changes_lower:
            old_month = i + 1
            break
            
    lead_days = 30
    if "today" in changes_lower:
        lead_days = 0
    elif "tomorrow" in changes_lower:
        lead_days = 1
    else:
        import re
        match = re.search(r'in\s+(\d+)\s+day', changes_lower)
        if match:
            lead_days = int(match.group(1))

    old_tier = compute_budget_tier(
        total_budget=trip.budget,
        days=trip.days,
        travelers=trip.travelers,
        destination=trip.destination,
        travel_month=old_month,
        booking_lead_days=lead_days
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
        new_budget = new_plan["budgetBreakdown"].get("total_cost", trip.budget)
        new_days = new_plan["tripSummary"].get("days", trip.days)
        new_travelers = new_plan["tripSummary"].get("travelers", trip.travelers)
        new_destination = new_plan["tripSummary"].get("destination", trip.destination)

        new_tier = compute_budget_tier(
            total_budget=new_budget,
            days=new_days,
            travelers=new_travelers,
            destination=new_destination,
            travel_month=old_month,
            booking_lead_days=lead_days
        )
        
        tier_changed = old_tier != new_tier

        trip.budget = new_budget
        trip.days = new_days
        trip.travelers = new_travelers
        trip.generated_plan = new_plan
        
        db.commit()
        db.refresh(trip)
        
        return {
            "status": "success",
            "tier_changed": tier_changed,
            "old_tier": old_tier,
            "new_tier": new_tier,
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
    
    # Check for targeted single-day regeneration command
    import re
    day_match = re.search(r'(?:regenerate|replan|redo|refresh|change|update)\s+day\s+(\d+)', changes_lower)
    if day_match:
        target_day = int(day_match.group(1))
        day_found = False
        for day in new_plan.get("dailyItinerary", []):
            if day.get("day") == target_day:
                day_found = True
                dest = new_plan.get("tripSummary", {}).get("destination", "Goa").lower()
                if "goa" in dest:
                    day["activities"] = [
                        {"time": "Morning", "title": "Sunkissed Dolphin Watch Cruise", "description": "Early morning boat trip spotting dolphins in their natural habitat.", "estimatedCost": 400.0, "duration": "2 hours", "location": "Sinquerim Beach"},
                        {"time": "Afternoon", "title": "Old Goa Heritage Walk & Church Tours", "description": "Guided walking tour through historic churches and UNESCO sites.", "estimatedCost": 100.0, "duration": "3 hours", "location": "Old Goa"},
                        {"time": "Evening", "title": "Premium Beachside Seafood Barbecue", "description": "Enjoy a candlelight sunset seafood dinner right on the sand.", "estimatedCost": 1500.0, "duration": "3 hours", "location": "Calangute"}
                    ]
                else:
                    day["activities"] = [
                        {"time": "Morning", "title": "Premium Local Cultural Sightseeing", "description": "Experience local heritage, arts, and historic architectures with a professional guide.", "estimatedCost": 350.0, "duration": "3 hours", "location": "Cultural Center"},
                        {"time": "Afternoon", "title": "Artistic Craft Workshop & Gallery Tour", "description": "Interactive pottery, cooking, or local craft creation session.", "estimatedCost": 600.0, "duration": "2.5 hours", "location": "Artisan District"},
                        {"time": "Evening", "title": "Scenic Sunset Skyline Dinner", "description": "Enjoy high-quality local dishes with stunning elevated views.", "estimatedCost": 1400.0, "duration": "3 hours", "location": "Skyline Lounge"}
                    ]
        if day_found:
            # Re-calculate total activities cost in budget breakdown if applicable
            total_activity_cost = 0.0
            for d in new_plan.get("dailyItinerary", []):
                for act in d.get("activities", []):
                    total_activity_cost += act.get("estimatedCost", 0.0)
            
            if "budgetBreakdown" in new_plan:
                bd = new_plan["budgetBreakdown"]
                bd["activity_cost"] = round(total_activity_cost, 2)
                bd["total_cost"] = sum([
                    bd.get("hotel_cost", 0.0),
                    bd.get("food_cost", 0.0),
                    bd.get("transportation_cost", 0.0),
                    bd["activity_cost"],
                    bd.get("miscellaneous_cost", 0.0)
                ])
                
            new_plan.setdefault("travelTips", []).append(f"Note: Regenerated activities for Day {target_day} based on user request.")
            return new_plan

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

# --- TRIP SHARING ENDPOINTS ---

@router.post("/trips/{trip_id}/share")
def share_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if not trip.share_token:
        trip.share_token = secrets.token_hex(8)
        db.commit()
        db.refresh(trip)
        
    return {
        "share_token": trip.share_token,
        "share_url": f"/share/{trip.share_token}"
    }

@router.get("/trips/share/{token}")
def get_shared_trip(
    token: str,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.share_token == token).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Shared trip not found")
        
    return {
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

# --- PDF ITINERARY EXPORT ENDPOINT ---

def generate_trip_pdf_stream(trip: Trip) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # Page setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom color palette matching premium aesthetics
    PRIMARY_COLOR = colors.HexColor("#0f172a") # Slate-900
    SECONDARY_COLOR = colors.HexColor("#0284c7") # Sky-600
    TEXT_COLOR = colors.HexColor("#334155") # Slate-700
    CORAL_COLOR = colors.HexColor("#f43f5e") # Rose-500
    BG_LIGHT = colors.HexColor("#f8fafc") # Slate-50
    
    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY_COLOR,
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY_COLOR,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY_COLOR,
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=SECONDARY_COLOR,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=TEXT_COLOR,
        spaceAfter=4
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )
    
    # Title & Subtitle
    story.append(Paragraph(f"voira - Trip to {trip.destination}", title_style))
    story.append(Paragraph(f"Personalized Travel Itinerary generated by AI travel agent", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Overview Information Table
    plan = trip.generated_plan or {}
    summary = plan.get("tripSummary", {})
    
    overview_data = [
        [
            Paragraph("<b>Origin:</b>", body_style), Paragraph(trip.source, body_style),
            Paragraph("<b>Destination:</b>", body_style), Paragraph(trip.destination, body_style)
        ],
        [
            Paragraph("<b>Duration:</b>", body_style), Paragraph(f"{trip.days} Days", body_style),
            Paragraph("<b>Travelers:</b>", body_style), Paragraph(f"{trip.travelers} Guest(s)", body_style)
        ],
        [
            Paragraph("<b>Budget Allocation:</b>", body_style), Paragraph(f"INR {trip.budget:,.2f}", body_style),
            Paragraph("<b>Generated On:</b>", body_style), Paragraph(trip.created_at.strftime("%Y-%m-%d"), body_style)
        ]
    ]
    
    overview_table = Table(overview_data, colWidths=[1.2*inch, 2.3*inch, 1.3*inch, 2.2*inch])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor("#f1f5f9")),
    ]))
    
    story.append(overview_table)
    story.append(Spacer(1, 15))
    
    # Budget Breakdown
    story.append(Paragraph("Budget Breakdown Estimation", h1_style))
    bd = plan.get("budgetBreakdown", {})
    bd_data = [
        [Paragraph("<b>Category</b>", body_bold), Paragraph("<b>Estimated Cost</b>", body_bold)],
        [Paragraph("Hotel & Lodging", body_style), Paragraph(f"INR {bd.get('hotel_cost', 0):,.2f}", body_style)],
        [Paragraph("Food & Dining", body_style), Paragraph(f"INR {bd.get('food_cost', 0):,.2f}", body_style)],
        [Paragraph("Transportation", body_style), Paragraph(f"INR {bd.get('transportation_cost', 0):,.2f}", body_style)],
        [Paragraph("Activities & Tours", body_style), Paragraph(f"INR {bd.get('activity_cost', 0):,.2f}", body_style)],
        [Paragraph("Miscellaneous", body_style), Paragraph(f"INR {bd.get('miscellaneous_cost', 0):,.2f}", body_style)],
        [Paragraph("<b>Total Estimated Cost</b>", body_bold), Paragraph(f"<b>INR {bd.get('total_cost', 0):,.2f}</b>", ParagraphStyle('TotalCost', parent=body_bold, textColor=CORAL_COLOR))]
    ]
    bd_table = Table(bd_data, colWidths=[3.5*inch, 3.5*inch])
    bd_table.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 5),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#cbd5e1")),
        ('LINEBELOW', (0,-1), (-1,-1), 1.5, PRIMARY_COLOR),
    ]))
    story.append(bd_table)
    story.append(Spacer(1, 15))
    
    # Lodging Recommendations
    story.append(Paragraph("Lodging & Stay Recommendations", h1_style))
    hotels = plan.get("hotelRecommendations", [])
    if not hotels:
        story.append(Paragraph("No hotel recommendations included.", body_style))
    else:
        for idx, hotel in enumerate(hotels):
            h_name = hotel.get("name", "Unknown Hotel")
            h_rating = hotel.get("rating", "N/A")
            h_price = hotel.get("pricePerNight", "N/A")
            h_dist = hotel.get("distanceFromCenter", hotel.get("distance", "N/A"))
            h_desc = hotel.get("description", "")
            
            story.append(Paragraph(f"<b>{idx+1}. {h_name}</b> (Rating: {h_rating} | Price: {h_price})", h2_style))
            story.append(Paragraph(f"<i>Location: {h_dist} from city center</i>", meta_style))
            story.append(Paragraph(h_desc, body_style))
            story.append(Spacer(1, 4))
            
    story.append(PageBreak()) # Move to next page for daily itinerary
    
    # Daily Itinerary
    story.append(Paragraph("Day-by-Day Travel Schedule", title_style))
    daily_itinerary = plan.get("dailyItinerary", [])
    for day in daily_itinerary:
        day_num = day.get("day", 1)
        day_weather = day.get("weather", "Sunny, 28°C")
        
        story.append(Paragraph(f"Day {day_num} Plan - Weather: {day_weather}", h1_style))
        story.append(Spacer(1, 3))
        
        # Activities
        story.append(Paragraph("<b>Excursions & Scheduled Activities:</b>", h2_style))
        activities = day.get("activities", [])
        if not activities:
            story.append(Paragraph("No specific activities planned for today.", body_style))
        else:
            for act in activities:
                a_time = act.get("time", "Morning")
                a_title = act.get("title", "")
                a_desc = act.get("description", "")
                a_cost = act.get("estimatedCost", 0.0)
                a_loc = act.get("location", "")
                
                story.append(Paragraph(f"• <b>{a_time}: {a_title}</b>", body_style))
                story.append(Paragraph(f"<i>Location: {a_loc} | Estimated Cost: INR {a_cost:,.2f}</i>", meta_style))
                story.append(Paragraph(a_desc, body_style))
                story.append(Spacer(1, 2))
                
        # Dining Suggestions
        story.append(Paragraph("<b>Dining & Restaurant Matches:</b>", h2_style))
        restaurants = day.get("restaurants", [])
        if not restaurants:
            story.append(Paragraph("No specific dining recommendations for today.", body_style))
        else:
            for rest in restaurants:
                r_name = rest.get("name", "")
                r_cuisine = rest.get("cuisine", "")
                r_meal = rest.get("recommendedMeal", "Dinner")
                r_cost = rest.get("estimatedCost", 0.0)
                r_desc = rest.get("description", "")
                
                story.append(Paragraph(f"• <b>{r_name}</b> - {r_cuisine} ({r_meal})", body_style))
                story.append(Paragraph(f"<i>Recommendation: {r_desc} | Estimated Cost: INR {r_cost:,.2f}</i>", meta_style))
                story.append(Spacer(1, 2))
                
        story.append(Spacer(1, 8))
        
    # Travel Tips Section
    story.append(Spacer(1, 10))
    story.append(Paragraph("Curated Travel Tips & Guidelines", h1_style))
    tips = plan.get("travelTips", [])
    if not tips:
        story.append(Paragraph("Pack light, carry local currency, and respect cultural practices.", body_style))
    else:
        for tip in tips:
            story.append(Paragraph(f"• {tip}", body_style))
            
    doc.build(story)
    buffer.seek(0)
    return buffer

@router.get("/trips/{trip_id}/pdf")
def export_trip_pdf(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    pdf_stream = generate_trip_pdf_stream(trip)
    
    dest_name = trip.destination.split(",")[0].strip().replace(" ", "_")
    filename = f"Itinerary_{dest_name}.pdf"
    
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

# --- ICS CALENDAR SYNC ENDPOINT ---

@router.get("/trips/{trip_id}/calendar")
def export_trip_calendar(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    start_date = datetime.date(2026, 6, 12)  # Base trip date from demo settings
    
    ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//voira//Itinerary Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]
    
    plan = trip.generated_plan or {}
    daily_itinerary = plan.get("dailyItinerary", [])
    
    for day in daily_itinerary:
        day_num = day.get("day", 1)
        day_date = start_date + datetime.timedelta(days=day_num - 1)
        date_str = day_date.strftime("%Y%m%d")
        
        # Activities
        for act in day.get("activities", []):
            time_slot = act.get("time", "Morning").lower()
            title = act.get("title", "")
            desc = act.get("description", "")
            loc = act.get("location", "")
            
            if "morning" in time_slot:
                start_t = "090000"
                end_t = "120000"
            elif "afternoon" in time_slot:
                start_t = "140000"
                end_t = "170000"
            else: # Evening
                start_t = "190000"
                end_t = "220000"
                
            uid = f"voira-act-{trip.id}-{day_num}-{time_slot}@{trip.share_token or 'local'}"
            stamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
            
            ics.extend([
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{stamp}",
                f"DTSTART:{date_str}T{start_t}",
                f"DTEND:{date_str}T{end_t}",
                f"SUMMARY:{title} ({trip.destination})",
                f"DESCRIPTION:{desc}",
                f"LOCATION:{loc}",
                "END:VEVENT"
            ])
            
    ics.append("END:VCALENDAR")
    ics_str = "\n".join(ics)
    
    dest_name = trip.destination.split(",")[0].strip().replace(" ", "_")
    filename = f"Itinerary_{dest_name}.ics"
    
    return Response(
        content=ics_str,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

