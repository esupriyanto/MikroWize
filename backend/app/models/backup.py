import enum
from datetime import datetime, timezone
from sqlalchemy import String, Enum, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class BackupType(str, enum.Enum):
    scheduled = "scheduled"
    manual = "manual"


class BackupFormat(str, enum.Enum):
    binary = "binary"
    rsc = "rsc"


class BackupStatus(str, enum.Enum):
    success = "success"
    failed = "failed"
    in_progress = "in_progress"


class Backup(Base):
    __tablename__ = "backups"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"))
    backup_type: Mapped[BackupType] = mapped_column(Enum(BackupType), default=BackupType.manual)
    format: Mapped[BackupFormat] = mapped_column(Enum(BackupFormat), default=BackupFormat.binary)
    file_path: Mapped[str] = mapped_column(String(500), default="")
    size: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[BackupStatus] = mapped_column(Enum(BackupStatus), default=BackupStatus.in_progress)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    device: Mapped["Device"] = relationship(back_populates="backups")
