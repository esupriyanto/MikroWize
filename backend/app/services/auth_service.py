from sqlalchemy.orm import Session

from ..models.user import User
from ..core.security import get_password_hash, verify_password, create_access_token


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, email: str, password: str, full_name: str = "", role: str = "read_only") -> User:
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> tuple[User | None, str | None]:
    user = get_user_by_email(db, email)
    if user is None:
        return None, "User not found"
    if not verify_password(password, user.hashed_password):
        return None, "Invalid password"
    if not user.is_active:
        return None, "User is inactive"
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return user, token
