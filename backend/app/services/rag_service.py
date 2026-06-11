import os
import re
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# A structured local knowledge base of high-fidelity travel documents
TRAVEL_KNOWLEDGE_BASE = [
    # GOA
    {
        "destination": "goa",
        "title": "Lonely Planet: Goa Local Customs",
        "content": "When visiting temples or churches in Goa, dress conservatively. Cover shoulders and knees. Always remove footwear before entering place of worship. Respect religious icons and photography bans inside shrines.",
        "url": "https://www.lonelyplanet.com/india/goa/local-customs"
    },
    {
        "destination": "goa",
        "title": "Goa Safety Advisory Guide",
        "content": "Avoid swimming in red-flagged beach zones. Riptides can be very strong. Stick to licensed shacks and tourist taxis. Avoid accepting drinks from strangers in night clubs to prevent drugging.",
        "url": "https://www.goatourism.gov.in/safety-advisory"
    },
    {
        "destination": "goa",
        "title": "Goa Transportation Blog",
        "content": "Scooter rentals in Goa cost around ₹300-₹500 per day. Ensure you wear a helmet to avoid hefty police fines. Pre-paid taxi booths exist at Dabolim and Mopa Airports; negotiate rates beforehand if booking elsewhere.",
        "url": "https://www.travelgoablog.com/transport-guide"
    },
    {
        "destination": "goa",
        "title": "Goan Culinary Heritage Guide",
        "content": "Authentic Goan cuisine is a mix of Hindu origins and Portuguese influences. Must-try meals include Pork Vindaloo, Fish Curry Rice, Chicken Xacuti, and Bebinca (a multi-layered coconut milk pudding).",
        "url": "https://www.goanfoodies.org/culinary-heritage"
    },
    # PARIS
    {
        "destination": "paris",
        "title": "Paris Tourism: Safety and Pickpockets",
        "content": "Pickpockets are highly active around Eiffel Tower, Louvre, and Montmartre. Keep zippers closed and bags in front of you on the Metro. Ignore petition-signers or string-bracelet sellers who try to distract you.",
        "url": "https://www.parisinfo.com/safety-tips"
    },
    {
        "destination": "paris",
        "title": "Paris Metro & Transport Guide",
        "content": "The Metro is the fastest way around Paris. Buy a Navigo Easy card for cheaper multi-ride fares. Always validate your ticket at the barriers and keep it until you exit to avoid inspecteur fines.",
        "url": "https://www.ratp.fr/en/paris-metro-guide"
    },
    {
        "destination": "paris",
        "title": "French Dining Etiquette",
        "content": "In Parisian bistros, say 'Bonjour' (daytime) or 'Bonsoir' (evening) when entering. Tips (service compris) are already included in the bill, but it is customary to leave an extra 5-10% for excellent service.",
        "url": "https://www.france-dining-etiquette.com"
    },
    # BALI
    {
        "destination": "bali",
        "title": "Bali Customs & Temple Etiquette",
        "content": "Wear a sarong and sash when entering any Balinese temple. Do not step on 'Canang Sari' (flower offerings on pavements). Avoid touching people's heads, as it is considered sacred.",
        "url": "https://www.balitourismboard.org/temple-etiquette"
    },
    {
        "destination": "bali",
        "title": "Bali Safety & Scooter Advisory",
        "content": "Scooter accidents are extremely common in Bali. Always wear a helmet and carry an International Driving Permit (IDP). Buy comprehensive travel insurance that covers scooter riding.",
        "url": "https://www.balisafe.gov/scooter-accidents"
    }
]

def retrieve_relevant_knowledge(query: str, destination: str, top_k: int = 2) -> Tuple[str, List[Dict[str, str]]]:
    """
    RAG Retriever: Uses keyword similarity scoring to fetch the most relevant 
    travel knowledge context and source citations for a destination.
    """
    dest_clean = destination.lower().strip()
    query_words = set(re.findall(r'\w+', query.lower()))
    
    # Filter documents by destination
    filtered_docs = [doc for doc in TRAVEL_KNOWLEDGE_BASE if doc["destination"] in dest_clean or dest_clean in doc["destination"]]
    
    # If no destination match, search all documents
    if not filtered_docs:
        filtered_docs = TRAVEL_KNOWLEDGE_BASE
        
    scored_docs = []
    for doc in filtered_docs:
        # Calculate TF overlap score
        doc_words = set(re.findall(r'\w+', doc["content"].lower() + " " + doc["title"].lower()))
        overlap = len(query_words.intersection(doc_words))
        scored_docs.append((overlap, doc))
        
    # Sort by score descending
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    
    selected_docs = [doc for score, doc in scored_docs[:top_k]]
    
    # Format context string
    context_parts = []
    citations = []
    for doc in selected_docs:
        context_parts.append(f"Source: {doc['title']}\nContent: {doc['content']}\nURL: {doc['url']}")
        citations.append({
            "title": doc["title"],
            "url": doc["url"]
        })
        
    context_str = "\n\n".join(context_parts) if context_parts else "No specific local guides found."
    return context_str, citations
