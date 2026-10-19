from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.dto import AssistantQueryRequest, AssistantQueryResponse
from backend.app.services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["Evidence-Grounded AI Assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(req: AssistantQueryRequest, db: AsyncSession = Depends(get_db)):
    """
    Evidence-grounded conversational travel risk intelligence query.
    Extracts relevant hazards, cites source timestamps and authorities,
    and adheres to the platform's principle of never fabricating safety.
    """
    return await assistant_service.answer_query(
        query=req.query,
        db=db,
        route_id=req.route_id,
        lat=req.latitude,
        lon=req.longitude
    )
