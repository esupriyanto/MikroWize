from datetime import datetime, timezone
from .celery_app import celery
from ..db.session import SessionLocal
from ..models.device import Device, DeviceCredential, DeviceStatus
from ..models.backup import Backup, BackupStatus, BackupFormat
from ..models.alert import Alert, AlertSeverity, AlertStatus
from ..services.mikrotik.client import MikroTikClient
from ..services.mikrotik.ssh import MikroTikSSH


@celery.task(name="backup_device", bind=True, max_retries=3)
def backup_device(self, backup_id: int):
    """Run a device backup via REST API or SSH."""
    db = SessionLocal()
    try:
        backup = db.query(Backup).filter(Backup.id == backup_id).first()
        if not backup:
            return {"error": "Backup not found"}

        device = db.query(Device).filter(Device.id == backup.device_id).first()
        cred = db.query(DeviceCredential).filter(DeviceCredential.device_id == backup.device_id).first()
        if not device or not cred:
            backup.status = BackupStatus.failed
            db.commit()
            return {"error": "Device or credentials not found"}

        # Try REST API first
        client = MikroTikClient(
            ip=device.ip, port=cred.api_port,
            username=cred.username, encrypted_password=cred.encrypted_password,
        )
        try:
            resource = client.test_connection()
            if resource:
                if backup.format == BackupFormat.binary:
                    client.backup(name=f"mw-backup-{backup.id}")
                else:
                    config = client.export_config()
                backup.status = BackupStatus.success
                device.last_backup = datetime.now(timezone.utc)
                db.commit()
                return {"status": "success", "device": device.hostname}
        finally:
            client.close()

        # Fallback to SSH
        ssh = MikroTikSSH(
            ip=device.ip, port=cred.ssh_port,
            username=cred.username, encrypted_password=cred.encrypted_password,
        )
        if ssh.connect():
            try:
                if backup.format == BackupFormat.binary:
                    ssh.backup(name=f"mw-backup-{backup.id}")
                else:
                    ssh.export_config()
                backup.status = BackupStatus.success
                device.last_backup = datetime.now(timezone.utc)
                db.commit()
                return {"status": "success", "device": device.hostname}
            finally:
                ssh.close()

        backup.status = BackupStatus.failed
        db.commit()
        return {"status": "failed", "device": device.hostname}
    except Exception as e:
        db.rollback()
        backup = db.query(Backup).filter(Backup.id == backup_id).first()
        if backup:
            backup.status = BackupStatus.failed
            db.commit()
        return {"error": str(e)}
    finally:
        db.close()


@celery.task(name="check_device_status")
def check_device_status():
    """Periodic task: check all device statuses."""
    db = SessionLocal()
    try:
        devices = db.query(Device).all()
        for device in devices:
            cred = db.query(DeviceCredential).filter(DeviceCredential.device_id == device.id).first()
            if not cred:
                continue
            client = MikroTikClient(
                ip=device.ip, port=cred.api_port,
                username=cred.username, encrypted_password=cred.encrypted_password,
            )
            try:
                resource = client.test_connection()
                new_status = DeviceStatus.online if resource else DeviceStatus.offline
                if device.status != new_status:
                    device.status = new_status
                    if resource:
                        device.last_seen = datetime.now(timezone.utc)
                    db.commit()
            finally:
                client.close()
    finally:
        db.close()
