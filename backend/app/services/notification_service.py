import logging
import smtplib
import os
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from app.models.notification import Notification

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str
) -> Notification:
    """Creates a notification in the database and fires in-app/email alerts."""
    db_notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        is_read=False
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)

    # Attempt to send email alert asynchronously or logged
    send_email_notification(title, message, user_id)
    return db_notif

def send_email_notification(title: str, message: str, user_id: int):
    """Simulates or sends an email alert using SMTP details if configured."""
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEText(message)
            msg["Subject"] = f"Voira Alert: {title}"
            msg["From"] = SMTP_USER
            msg["To"] = f"user_{user_id}@voira.com"  # Simulated mapping or placeholder email
            
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            logger.info(f"Notification email sent successfully to user {user_id}.")
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
    else:
        logger.info(f"[Email Simulation] Dispatching to user {user_id}: '{title}' -> {message}")
