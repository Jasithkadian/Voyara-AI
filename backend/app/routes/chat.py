from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database.connection import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.trip import Trip
from app.models.chat import ChatHistory
from app.services.chat_service import generate_chat_response

router = APIRouter(tags=["AI Travel Chat"])

# Pydantic Schemas
class ChatInput(BaseModel):
    trip_id: int
    message: str

class ChatResponse(BaseModel):
    reply: str
    message_id: int

class ChatHistoryOut(BaseModel):
    id: int
    message: str
    response: str
    timestamp: str

    class Config:
        from_attributes = True

# Routes
@router.post("/chat", response_model=ChatResponse)
def chat_with_copilot(
    request: ChatInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve Trip to extract context
    trip = db.query(Trip).filter(Trip.id == request.trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip context not found or unauthorized"
        )

    # Load recent conversation history for this trip
    past_history = db.query(ChatHistory).filter(
        ChatHistory.trip_id == request.trip_id,
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.timestamp.asc()).all()

    formatted_history = []
    for chat in past_history:
        formatted_history.append({"sender": "user", "text": chat.message})
        formatted_history.append({"sender": "assistant", "text": chat.response})

    # Call AI chat service
    try:
        # generated_plan is a JSON column in DB
        context = trip.generated_plan or {}
        ai_reply = generate_chat_response(
            message=request.message,
            history=formatted_history,
            context=context
        )
        
        # Save to DB
        new_chat = ChatHistory(
            user_id=current_user.id,
            trip_id=request.trip_id,
            message=request.message,
            response=ai_reply
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        return {
            "reply": ai_reply,
            "message_id": new_chat.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat: {str(e)}"
        )

@router.get("/chat/{trip_id}")
def get_trip_chat_history(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check trip authorization
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
        
    history = db.query(ChatHistory).filter(
        ChatHistory.trip_id == trip_id,
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.timestamp.asc()).all()

    return [
        {
            "id": h.id,
            "message": h.message,
            "response": h.response,
            "timestamp": h.timestamp.isoformat()
        }
        for h in history
    ]
