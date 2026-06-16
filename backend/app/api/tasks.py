from fastapi import APIRouter, Depends
from ..core.deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("")
def list_tasks(current_user: User = Depends(get_current_user)):
    """List background tasks. TODO: Integrate with Celery Flower or Redis queue."""
    return {
        "tasks": [],
        "summary": {"running": 0, "pending": 0, "completed_today": 0, "failed_today": 0},
    }
