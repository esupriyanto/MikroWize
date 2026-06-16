"""Seed dummy users for local development."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.services.auth_service import create_user, get_user_by_email


def seed_users():
    db = SessionLocal()
    users = [
        {
            "email": "admin@mikrowize.local",
            "password": "admin123",
            "full_name": "Super Admin",
            "role": "super_admin",
        },
        {
            "email": "noc@mikrowize.local",
            "password": "noc123",
            "full_name": "NOC Engineer",
            "role": "noc_engineer",
        },
        {
            "email": "neteng@mikrowize.local",
            "password": "neteng123",
            "full_name": "Network Engineer",
            "role": "network_engineer",
        },
        {
            "email": "readonly@mikrowize.local",
            "password": "readonly123",
            "full_name": "Read Only User",
            "role": "read_only",
        },
        {
            "email": "customer@mikrowize.local",
            "password": "customer123",
            "full_name": "Customer",
            "role": "customer",
        },
    ]

    for u in users:
        existing = get_user_by_email(db, u["email"])
        if existing:
            print(f"  SKIP  {u['email']} (already exists)")
            continue
        user = create_user(db, **u)
        print(f"  OK    {user.email} / {u['password']}  (role: {user.role.value})")

    db.close()
    print("\nSeeding complete.")


if __name__ == "__main__":
    seed_users()
