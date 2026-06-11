import os
import logging
import json
import httpx
from openai import OpenAI
from typing import Dict, Any, List
from app.services.rag_service import retrieve_relevant_knowledge

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def generate_chat_response(
    message: str,
    history: List[Dict[str, str]],
    context: Dict[str, Any]
) -> str:
    """
    Generates a conversational response from the AI Travel Copilot.
    Tries Anthropic, then OpenAI, and falls back to a smart local matcher.
    """
    # Format Context
    context_str = "No active trip selected."
    dest = "Unknown"
    if context:
        dest = context.get("destination", "Unknown")
        budget = context.get("budget", "Unknown")
        days = context.get("days", "Unknown")
        travelers = context.get("travelers", 1)
        interests = context.get("interests", [])
        
        context_str = f"""
        Active Trip Context:
        - Destination: {dest}
        - Budget Limit: {budget}
        - Duration: {days} Days
        - Travelers: {travelers}
        - Selected Interests: {", ".join(interests) if isinstance(interests, list) else str(interests)}
        """
        daily_plan_key = "dailyItinerary" if "dailyItinerary" in context else "dailyPlan"
        if daily_plan_key in context:
            context_str += "\nDay-by-Day Activities Summary:"
            for day in context[daily_plan_key]:
                day_num = day.get("day", 0)
                acts = [act.get("title", "") for act in day.get("activities", [])]
                context_str += f"\n  Day {day_num}: {', '.join(acts)}"

    # Retrieve RAG travel knowledge
    rag_context, citations = retrieve_relevant_knowledge(message, dest)

    system_prompt = f"""
    You are the AI Travel Copilot Assistant. Your job is to answer the user's travel questions.
    You MUST answer in context of their active trip:
    {context_str}
    
    Ground your answer in this verified local travel knowledge if applicable to the query:
    {rag_context}
    
    Keep your responses conversational, helpful, concise, and focused on making their trip amazing.
    If you ground any part of your answer in the verified travel knowledge above, cite the guide title inline, e.g., (Source: Lonely Planet).
    """

    # Format history for Claude / OpenAI
    messages = []
    for h in history:
        messages.append({"role": "user" if h["sender"] == "user" else "assistant", "content": h["text"]})
    messages.append({"role": "user", "content": message})

    ai_reply = ""

    # 1. Try Claude (Anthropic)
    if ANTHROPIC_API_KEY:
        try:
            logger.info("Using Claude API for chat.")
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1000,
                "messages": messages,
                "system": system_prompt
            }
            with httpx.Client() as client:
                response = client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    ai_reply = response.json()["content"][0]["text"]
        except Exception as e:
            logger.error(f"Claude Chat Error: {e}")

    # 2. Try OpenAI Fallback
    if not ai_reply and OPENAI_API_KEY:
        try:
            logger.info("Using OpenAI API for chat.")
            client = OpenAI(api_key=OPENAI_API_KEY)
            openai_messages = [{"role": "system", "content": system_prompt}] + messages
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=openai_messages,
                temperature=0.7,
                max_tokens=800,
                timeout=10.0
            )
            ai_reply = response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI Chat Error: {e}")

    # 3. Smart Local Mock Fallback
    if not ai_reply:
        logger.warning("No API keys configured. Using local smart chat response.")
        ai_reply = get_local_reply(message, context)

    # Append citations to reply
    if citations and any(c["title"].lower().split(":")[0] in ai_reply.lower() or "local customs" in message.lower() or "safety" in message.lower() or "transport" in message.lower() for c in citations):
        source_links = []
        for c in citations:
            source_links.append(f"[{c['title']}]({c['url']})")
        ai_reply += "\n\n**Sources:** " + ", ".join(source_links)

    return ai_reply

def get_local_reply(message: str, context: Dict[str, Any]) -> str:
    msg = message.lower()
    dest = context.get("destination", "your destination")
    days = context.get("days", 3)
    
    if "pack" in msg:
        if "goa" in dest.lower():
            return "Based on your Goa trip, I highly recommend packing: swimwear, breathable cotton clothes, sunscreen, sunglasses, slippers, and a small waterproof pouch for your electronics during water sports."
        elif "paris" in dest.lower():
            return "For Paris, you should pack: comfortable walking shoes for city walks, smart-casual dress code items for restaurants, adaptors, and a compact umbrella in case of unexpected rain showers."
        else:
            return f"For your {days}-day trip to {dest}, pack walking shoes, comfortable clothes, basic medications, a travel adaptor, and check the daily weather forecast before leaving!"
            
    elif "do tonight" in msg or "evening" in msg or "night" in msg:
        if "goa" in dest.lower():
            return "Since you're in Goa, tonight is perfect for visiting Tito's Lane in Baga Beach for beach clubs, or trying some local vindaloo/seafood at Fisherman's Wharf, or walking along the shoreline under the stars."
        elif "paris" in dest.lower():
            return "Tonight in Paris, you should definitely book a late Seine River cruise. Seeing the Eiffel Tower illuminate and sparkle on the hour is an unforgettable experience!"
        else:
            return f"For your evening in {dest}, I suggest visiting the central market square, dining at a highly rated local tavern, and checking if there are any outdoor music performances or local walking paths."
            
    elif "restaurant" in msg or "food" in msg or "eat" in msg:
        if "goa" in dest.lower():
            return "You must try: \n1. Fisherman's Wharf (Cavelossim) - for amazing butter garlic prawns.\n2. Mum's Kitchen (Panjim) - authentic Goan fish curry.\n3. Gunpowder (Assagao) - South Indian fusion with stellar cocktails."
        elif "paris" in dest.lower():
            return "Here are my top Parisian dining suggestions: \n1. Bouillon Chartier - classic French bistro food in a gorgeous 19th-century hall.\n2. L'As du Fallafel - the absolute best falafel wraps in Le Marais.\n3. Berthillon - world-renowned ice cream on Île Saint-Louis."
        else:
            return f"In {dest}, look for local food markets or walk around the central streets. Seek out family-run diners for the most authentic experience. Don't hesitate to ask locals for recommendations!"
            
    elif "family" in msg or "kid" in msg:
        return f"{dest} is a fantastic choice! It has many options suitable for all ages. Make sure to schedule relaxing breaks in your daily itinerary to prevent fatigue."

    return f"I'm here to help with your trip to {dest}. You can ask me about packing lists, local dining, things to do in the evening, or how to get around!"
