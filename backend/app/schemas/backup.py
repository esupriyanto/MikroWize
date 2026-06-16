from datetime import datetime
from pydantic import BaseModel

from ..models.backup import BackupType, BackupFormat, BackupStatus


class BackupResponse(BaseModel):
    id: int
    device_id: int
    backup_type: BackupType
    format: BackupFormat
    size: int
    status: BackupStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class BackupListResponse(BaseModel):
    items: list[BackupResponse]
    total: int
