from fastapi import APIRouter

from .auth import router as auth_router
from .devices import router as devices_router
from .backups import router as backups_router
from .alerts import router as alerts_router
from .tasks import router as tasks_router

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(devices_router, prefix="/devices", tags=["Devices"])
router.include_router(backups_router, prefix="/backups", tags=["Backups"])
router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
router.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
