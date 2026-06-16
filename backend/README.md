# MikroWize Backend

FastAPI backend for MikroTik router/switch fleet management.

## Tech Stack
- FastAPI
- PostgreSQL (SQLAlchemy)
- Redis (Celery broker)
- MikroTik RouterOS REST API / SSH

## Setup

### Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run
```bash
uvicorn app.main:app --reload
```