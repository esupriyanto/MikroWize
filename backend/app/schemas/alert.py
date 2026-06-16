from datetime import datetime
from pydantic import BaseModel

from ..models.alert import AlertSeverity, AlertStatus


class AlertResponse(BaseModel):
    id: int
    device_id: int
    severity: AlertSeverity
    message: str
    status: AlertStatus
    created_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    items: list[AlertResponse]
    total: int
