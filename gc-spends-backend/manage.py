import sys, os, uuid
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core.config import settings
from app.models import User, Role
from app.common.enums import RoleCode
from app.core.security import hash_password

def db_session() -> Session:
    engine = create_engine(settings.database_url, future=True)
    from sqlalchemy.orm import sessionmaker
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)()

def seed_roles(db: Session):
    for code in RoleCode:
        exists = db.query(Role).filter(Role.code == code.value).first()
        if not exists:
            db.add(Role(code=code.value, name=code.value.title()))
    db.commit()

def seed_admin(db: Session):
    if not db.query(User).filter(User.email == "admin@example.com").first():
        db.add(User(full_name="Admin", email="admin@example.com", phone=None, password_hash=hash_password("admin")))
        db.commit()

def seed_from_xlsx(db: Session):
    # Optional: read XLSX files if present in /mnt/data
    xlsx_candidates = [
        "/mnt/data/Статьи расходов с ответственными.xlsx",
        "/mnt/data/Структура расходов.xlsx",
    ]
    for p in xlsx_candidates:
        if os.path.exists(p):
            print(f"Found XLSX: {p} (implement parsing as needed)")
    # TODO: implement detailed parsing/loading here

def main():
    if len(sys.argv) < 2:
        print("Usage: python manage.py [seed]")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "seed":
        db = db_session()
        seed_roles(db)
        seed_admin(db)
        seed_from_xlsx(db)
        print("Seed complete")
    else:
        print(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()
