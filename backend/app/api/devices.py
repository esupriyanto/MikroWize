from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models.device import Device, DeviceCredential
from ..schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceListResponse
from ..core.deps import get_current_user
from ..models.user import User
from ..core.security import encrypt_credential
from ..services.mikrotik.client import MikroTikClient

router = APIRouter()


@router.get("", response_model=DeviceListResponse)
def list_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by hostname or IP"),
    status: str = Query("", description="Filter by status"),
):
    query = db.query(Device)
    if search:
        query = query.filter(
            (Device.hostname.ilike(f"%{search}%")) | (Device.ip.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(Device.status == status)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return DeviceListResponse(
        items=[DeviceResponse.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=DeviceResponse, status_code=201)
def create_device(
    data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = Device(
        hostname=data.hostname,
        ip=data.ip,
        model=data.model,
        routeros_version=data.routeros_version,
        device_type=data.device_type,
        site=data.site,
        tags=data.tags,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    data: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=204)
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()


@router.post("/{device_id}/test-connection")
def test_connection(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    cred = db.query(DeviceCredential).filter(DeviceCredential.device_id == device_id).first()
    if not cred:
        raise HTTPException(status_code=400, detail="No credentials configured for this device")

    client = MikroTikClient(
        ip=device.ip,
        port=cred.api_port,
        username=cred.username,
        encrypted_password=cred.encrypted_password,
    )
    try:
        resource = client.test_connection()
        if resource:
            return {"status": "connected", "resource": resource}
        return {"status": "failed", "error": "Connection failed"}
    finally:
        client.close()
