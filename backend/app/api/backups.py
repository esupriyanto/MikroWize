from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models.device import Device
from ..models.backup import Backup, BackupStatus
from ..schemas.backup import BackupResponse, BackupListResponse
from ..core.deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("", response_model=BackupListResponse)
def list_backups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    device_id: int = Query(0, description="Filter by device ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = db.query(Backup)
    if device_id:
        query = query.filter(Backup.device_id == device_id)
    query = query.order_by(Backup.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return BackupListResponse(
        items=[BackupResponse.model_validate(b) for b in items],
        total=total,
    )


@router.post("/{device_id}", response_model=BackupResponse, status_code=201)
def trigger_backup(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    backup = Backup(device_id=device_id, status=BackupStatus.in_progress)
    db.add(backup)
    db.commit()
    db.refresh(backup)

    # TODO: Dispatch to Celery task queue
    # from ..tasks.device_tasks import run_backup
    # run_backup.delay(backup.id)

    return backup


@router.get("/{backup_id}", response_model=BackupResponse)
def get_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    return backup
