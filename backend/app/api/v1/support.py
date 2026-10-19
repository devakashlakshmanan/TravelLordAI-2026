import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.models.entities import SupportTicket, User
from backend.app.schemas.dto import SupportTicketCreate, SupportTicketResponse
from backend.app.services.auth_service import get_current_user_optional, get_current_admin

router = APIRouter(prefix="/support", tags=["Help & Support"])

@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def submit_support_ticket(
    req: SupportTicketCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an authentic user inquiry, data correction, or support request.
    Persisted to database with unique tracking reference.
    """
    ref_suffix = secrets.token_hex(3).upper()
    ticket_ref = f"TL-SUP-{ref_suffix}"

    user_email = req.email or (current_user.email if current_user else None)
    if not user_email:
        user_email = "guest@travellord.ai"

    ticket = SupportTicket(
        user_id=current_user.id if current_user else None,
        ticket_reference=ticket_ref,
        email=user_email,
        subject=req.subject.strip(),
        description=req.description.strip(),
        status="open"
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return SupportTicketResponse(
        id=ticket.id,
        ticket_reference=ticket.ticket_reference,
        subject=ticket.subject,
        status=ticket.status,
        message=f"Inquiry logged successfully with ticket reference {ticket.ticket_reference}. Our support desk will review it.",
        created_at=ticket.created_at
    )

@router.get("/tickets", response_model=List[SupportTicketResponse])
async def list_support_tickets_admin(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only view of customer support tickets."""
    res = await db.execute(select(SupportTicket).order_by(SupportTicket.created_at.desc()))
    tickets = res.scalars().all()
    return [
        SupportTicketResponse(
            id=t.id,
            ticket_reference=t.ticket_reference,
            subject=t.subject,
            status=t.status,
            message="Support ticket record.",
            created_at=t.created_at
        )
        for t in tickets
    ]
