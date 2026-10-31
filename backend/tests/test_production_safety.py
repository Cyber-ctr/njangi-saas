import unittest
from decimal import Decimal

from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import Settings
from app.database import Base, get_db
from app.main import app
from app.models import Group, GroupMember, Organization, OrganizationMember, User, UserRole
from app.schemas import MemberAdd
from app.security import create_access_token, hash_password


class ProductionSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False)

        db = cls.Session()
        owner = User(
            full_name="Test Owner",
            email="owner@example.com",
            password_hash=hash_password("SecurePass123!"),
            is_active=True,
        )
        outsider = User(
            full_name="Other Owner",
            email="other@example.com",
            password_hash=hash_password("SecurePass123!"),
            is_active=True,
        )
        target = User(
            full_name="Test Member",
            email="member@example.com",
            password_hash=hash_password("SecurePass123!"),
            is_active=True,
        )
        db.add_all([owner, outsider, target])
        db.flush()

        org = Organization(name="Test Org", slug="test-org")
        other_org = Organization(name="Other Org", slug="other-org")
        db.add_all([org, other_org])
        db.flush()
        group = Group(organization_id=org.id, name="Test Circle", contribution_amount=Decimal("100"))
        other_group = Group(organization_id=other_org.id, name="Other Circle", contribution_amount=Decimal("100"))
        db.add_all([group, other_group])
        db.flush()
        db.add_all([
            OrganizationMember(organization_id=org.id, user_id=owner.id, role=UserRole.owner),
            OrganizationMember(organization_id=other_org.id, user_id=outsider.id, role=UserRole.owner),
            GroupMember(group_id=group.id, user_id=owner.id, role=UserRole.owner),
            GroupMember(group_id=group.id, user_id=target.id, role=UserRole.member),
            GroupMember(group_id=other_group.id, user_id=outsider.id, role=UserRole.owner),
        ])
        db.flush()
        cls.owner_id = owner.id
        cls.group_id = group.id
        cls.other_group_id = other_group.id
        cls.target_member_id = next(
            item.id for item in db.query(GroupMember).filter_by(group_id=group.id).all()
            if item.user_id == target.id
        )
        db.commit()
        db.close()

        def override_db():
            session = cls.Session()
            try:
                yield session
            finally:
                session.close()

        cls.db_override = override_db
        app.dependency_overrides[get_db] = override_db
        cls.client = TestClient(app, raise_server_exceptions=False)
        cls.headers = {"Authorization": f"Bearer {create_access_token(cls.owner_id)}"}

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        cls.engine.dispose()

    def test_production_settings_reject_development_defaults(self):
        with self.assertRaises(ValidationError):
            Settings(_env_file=None, environment="production")

    def test_production_settings_accept_explicit_configuration(self):
        settings = Settings(
            _env_file=None,
            environment="production",
            secret_key="random-production-secret-" + "x" * 32,
            database_url="postgresql+psycopg2://user:password@db.example.com/app",
            redis_url="rediss://cache.example.com/0",
            cors_origins="https://app.example.com",
            allowed_hosts="app.example.com,api.example.com",
            forwarded_allow_ips="10.0.0.10",
        )
        self.assertEqual(settings.allowed_hosts_list, ["app.example.com", "api.example.com"])

    def test_member_invite_cannot_assign_privileged_role(self):
        with self.assertRaises(ValidationError):
            MemberAdd.model_validate({"email": "member@example.com", "role": "owner"})

    def test_registered_user_can_log_in(self):
        response = self.client.post(
            "/api/auth/login",
            json={"email": "owner@example.com", "password": "SecurePass123!"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())

    def test_member_cannot_read_another_groups_data(self):
        response = self.client.get(
            f"/api/groups/{self.other_group_id}/dashboard",
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 403)

    def test_payment_intent_and_unsigned_webhook_are_disabled(self):
        intent = self.client.post(
            "/api/payments/intents",
            headers=self.headers,
            json={
                "group_id": self.group_id,
                "member_id": self.target_member_id,
                "amount": 100,
                "provider": "momo",
            },
        )
        webhook = self.client.post(
            "/api/payments/webhook",
            json={"reference": "untrusted", "status": "paid"},
        )
        self.assertEqual(intent.status_code, 503)
        self.assertEqual(webhook.status_code, 503)


if __name__ == "__main__":
    unittest.main()
