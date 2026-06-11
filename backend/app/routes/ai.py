import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.routes.auth import get_current_user
from app.models.user import User
from openai import OpenAI

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Chat Assistant"])

class ChatRequest(BaseModel):
    message: str
    trip_context: Optional[Dict[str, Any]] = None

@router.post("/chat")
def chat_assistant(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        message = request.message
        context = request.trip_context or {}
        
        # Format trip context details for the prompt
        context_str = "No active trip selected."
        if context:
            dest = context.get("destination", "Unknown")
            budget = context.get("budget", "Unknown")
            days = context.get("days", "Unknown")
            interests = context.get("interests", [])
            travelers = context.get("travelers", 1)
            
            context_str = f"""
            Active Trip Context:
            - Destination: {dest}
            - Budget: {budget}
            - Days: {days}
            - Travelers: {travelers}
            - Interests: {", ".join(interests) if isinstance(interests, list) else str(interests)}
            """
            if "itinerary" in context:
                # Add basic day summaries
                context_str += "\nDay-by-Day activities:"
                for day in context["itinerary"]:
                    day_num = day.get("day_number", 0)
                    acts = [act.get("title", "") for act in day.get("activities", [])]
                    context_str += f"\n  Day {day_num}: {', '.join(acts)}"

        system_prompt = f"""
        You are the AI Travel Copilot Assistant. Your goal is to help the user with questions regarding their travel planning, packing lists, restaurants, weather, local customs, and itinerary adjustments.
        
        Here is the user's active trip details:
        {context_str}
        
        Answer their questions politely, professionally, and make it super tailored to their destination, budget, and travel style. Be concise and keep your answers conversational.
        """

        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            logger.warning("OPENAI_API_KEY not found. Using local smart chat response.")
            return {"reply": generate_mock_chat_reply(message, context)}

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7
        )
        reply = response.choices[0].message.content
        return {"reply": reply}

    except Exception as e:
        logger.error(f"Error in chat assistant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response from travel assistant."
        )

def generate_mock_chat_reply(message: str, context: Dict[str, Any]) -> str:
    """
    Generate highly context-aware replies for common travel questions if OpenAI API is unavailable.
    """
    msg = message.lower()
    dest = context.get("destination", "your destination")
    budget = context.get("budget", 30000)
    interests = context.get("interests", [])
    
    if "pack" in msg:
        if "goa" in dest.lower():
            return f"For Goa, you should pack light cotton clothes, swimwear, sunscreen (SPF 50+), sunglasses, beach footwear (flip flops), a quick-dry towel, and a light jacket if traveling in winter. Don't forget your sunglasses and waterproof phone cover for water sports!"
        elif "paris" in dest.lower():
            return f"For Paris, packing depends on the season. Generally, pack layers: comfortable walking shoes (a must!), smart-casual outfits for dining out, a light trench coat or umbrella, and adaptors for European outlets. Paris styling is chic but understated!"
        else:
            return f"For {dest}, pack comfortable walking shoes, weather-appropriate clothing (layers are best), toiletries, electronics chargers, copy of documents, and a small first-aid kit. Since you are staying for {context.get('days', 3)} days, pack accordingly!"

    elif "do tonight" in msg or "evening" in msg or "night" in msg:
        if "goa" in dest.lower():
            return f"Goa has an incredible nightlife! Tonight, you could check out Tito's Lane in Baga for clubbing, visit Curlies or Shiva Valley in Anjuna for a beachfront sunset trance vibe, or try a quiet dinner cruise on the Mandovi River."
        elif "paris" in dest.lower():
            return f"Tonight in Paris, you cannot miss a night-time Seine River cruise to see the Eiffel Tower sparkling. Alternatively, head to Montmartre for a romantic dinner or check out a jazz club in the Latin Quarter."
        else:
            return f"For tonight in {dest}, I suggest checking out the local night market, walking around the city center to see the illuminated monuments, and trying a top-rated local restaurant that serves traditional dishes."

    elif "restaurant" in msg or "food" in msg or "eat" in msg:
        if "goa" in dest.lower():
            return "Here are some amazing recommendations for Goa:\n1. Fisherman's Wharf (Cavelossim) - Incredible Goan seafood and riverside setting.\n2. Gunpowder (Assagao) - Exceptional South Indian/Goan fusion.\n3. Mum's Kitchen (Panaji) - Traditional Goan home-style recipes."
        elif "paris" in dest.lower():
            return "Here are top spots in Paris:\n1. Le Comptoir du Relais (Saint-Germain) - Classic French bistro.\n2. Bouillon Chartier (Grands Boulevards) - Historic, bustling hall with very affordable classic French food.\n3. Angelina (Rue de Rivoli) - Famous for the best hot chocolate and pastries."
        else:
            return f"In {dest}, seek out eateries in the downtown market area. Try local street food vendors with active queues, or visit a traditional bistro/cafe. Be sure to ask your hotel for their favorite local spot!"

    elif "family" in msg or "kid" in msg:
        if "goa" in dest.lower():
            return "Yes, Goa is very family-friendly, especially South Goa. Beaches like Cavelossim, Benaulim, and Varca are clean, quiet, and perfect for families. Avoid late-night party hubs in North Goa like Anjuna/Baga if traveling with kids."
        elif "paris" in dest.lower():
            return "Paris is wonderful for families! Kids will love climbing the Eiffel Tower, sailing model boats in the Jardin du Luxembourg, exploring the Science Museum (Cité des Sciences), and of course, a day trip to Disneyland Paris."
        else:
            return f"{dest} is generally welcoming to families. Make sure to choose hotels with family rooms, check if museums have stroller accessibility, and plan activities with shorter travel durations."

    else:
        return f"That's a great question about {dest}! As your Copilot, I recommend checking out the local travel guidelines, booking your activities online to save time, and talking to locals at the street markets to find hidden gems. Let me know if you want me to adjust your itinerary for specific sightseeing!"
