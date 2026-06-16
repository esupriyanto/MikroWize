import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class DeviceStatus(str, enum.Enum):
    online = "online"
    offline = "offline"
    warning = "warning"
    unreachable = "unreachable"


class DeviceType(str, enum.Enum):
    router = "router"
    switch = "switch"
    ap = "ap"


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    hostname: Mapped[str] = mapped_column(String(255), index=True)
    ip: Mapped[str] = mapped_column(String(45), index=True)
    model: Mapped[str] = mapped_column(String(255), default="")
    routeros_version: Mapped[str] = mapped_column(String(50), default="")
    device_type: Mapped[DeviceType] = mapped_column(Enum(DeviceType), default=DeviceType.router)
    site: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[DeviceStatus] = mapped_column(Enum(DeviceStatus), default=DeviceStatus.offline)
    tags: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_backup: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    credentials: Mapped[list["DeviceCredential"]] = relationship(back_populates="device", cascade="all, delete-orphan")
    backups: Mapped[list["Backup"]] = relationship(back_populates="device", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="device", cascade="all, delete-orphan")


class DeviceCredential(Base):
    __tablename__ = "device_credentials"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"))
    username: Mapped[str] = mapped_column(String(255))
    encrypted_password: Mapped[str] = mapped_column(Text)
    ssh_port: Mapped[int] = mapped_column(Integer, default=22)
    api_port: Mapped[int] = mapped_column(Integer, default=8728)

    device: Mapped["Device"] = relationship(back_populates="credentials")
