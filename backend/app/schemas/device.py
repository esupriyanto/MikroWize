from datetime import datetime
from pydantic import BaseModel

from ..models.device import DeviceStatus, DeviceType


class DeviceCreate(BaseModel):
    hostname: str
    ip: str
    model: str = ""
    routeros_version: str = ""
    device_type: DeviceType = DeviceType.router
    site: str = ""
    tags: str = ""


class DeviceUpdate(BaseModel):
    hostname: str | None = None
    ip: str | None = None
    model: str | None = None
    routeros_version: str | None = None
    device_type: DeviceType | None = None
    site: str | None = None
    status: DeviceStatus | None = None
    tags: str | None = None


class DeviceResponse(BaseModel):
    id: int
    hostname: str
    ip: str
    model: str
    routeros_version: str
    device_type: DeviceType
    site: str
    status: DeviceStatus
    tags: str
    last_seen: datetime | None
    last_backup: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DeviceListResponse(BaseModel):
    items: list[DeviceResponse]
    total: int
    page: int
    page_size: int
