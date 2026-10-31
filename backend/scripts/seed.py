import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import User, Organization, OrganizationMember, Group, GroupMember, UserRole
from app.security import hash_password
from app.services.ledger import seed_chart

if settings.environment != "development":
    raise SystemExit("Demo seeding is only allowed when ENVIRONMENT=development")

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    admin = db.query(User).filter_by(email="admin@njangi.local").first()
    if not admin:
        admin = User(full_name="Njangi Administrator", email="admin@njangi.local", password_hash=hash_password("ChangeMe123!"), phone="+237 6 99 99 99 99", is_active=True, is_superuser=True)
        db.add(admin)
        db.flush()
    org = db.query(Organization).filter_by(slug="njangi-demo").first()
    if not org:
        org = Organization(name="Demo Community Finance", slug="njangi-demo", plan="growth", currency="XAF")
        db.add(org)
        db.flush()
        db.add(OrganizationMember(organization_id=org.id, user_id=admin.id, role=UserRole.owner))
        seed_chart(db, org.id)
        group = Group(organization_id=org.id, name="Yaounde Growth Circle", contribution_amount=Decimal("50000"), contribution_frequency="monthly", payout_cycle="monthly")
        db.add(group)
        db.flush()
        db.add(GroupMember(group_id=group.id, user_id=admin.id, role=UserRole.owner))
    db.commit()
    print("Seed complete. Login: admin@njangi.local / ChangeMe123!")
finally:
    db.close()
