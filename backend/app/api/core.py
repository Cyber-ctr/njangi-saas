import json
from decimal import Decimal
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    AuditLog, Contribution, Expense, Group, GroupMember, Loan, LoanRepayment,
    Organization, OrganizationMember, User, UserRole,
)
from app.schemas import (
    ContributionCreate, ExpenseCreate, GroupCreate, LoanCreate, MemberAdd, RepaymentCreate,
)
from app.security import current_user
from app.services.ledger import post_entry, seed_chart
from app.services.ml import score_member, serialize_factors, MODEL_VERSION

router = APIRouter(prefix="/api", tags=["platform"])


def audit(db, org_id, actor_id, action, entity_type, entity_id, metadata=None):
    db.add(AuditLog(
        organization_id=org_id, actor_id=actor_id,
        action=action, entity_type=entity_type, entity_id=str(entity_id),
        metadata_json=json.dumps(metadata or {}),
    ))


def membership(db, group_id, user_id):
    return db.query(GroupMember).filter_by(group_id=group_id, user_id=user_id).first()


@router.post("/organizations")
def create_org(name: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    slug = f"{name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}"
    org = Organization(name=name, slug=slug)
    db.add(org)
    db.flush()
    db.add(OrganizationMember(organization_id=org.id, user_id=user.id, role=UserRole.owner))
    seed_chart(db, org.id)
    db.commit()
    return {"id": org.id, "name": org.name, "slug": org.slug, "plan": org.plan, "currency": org.currency}


@router.get("/organizations")
def organizations(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Organization).join(OrganizationMember).filter(OrganizationMember.user_id == user.id).all()
    return [{"id": x.id, "name": x.name, "slug": x.slug, "plan": x.plan, "currency": x.currency} for x in rows]


@router.post("/groups")
def create_group(payload: GroupCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    om = db.query(OrganizationMember).filter_by(organization_id=payload.organization_id, user_id=user.id).first()
    if not om or om.role not in [UserRole.owner, UserRole.admin]:
        raise HTTPException(403, "Not allowed to create groups in this organization")
    group = Group(**payload.model_dump())
    db.add(group)
    db.flush()
    db.add(GroupMember(group_id=group.id, user_id=user.id, role=om.role))
    audit(db, group.organization_id, user.id, "group.created", "group", group.id)
    db.commit()
    return {"id": group.id, "name": group.name}


@router.get("/groups")
def groups(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Group).join(GroupMember).filter(GroupMember.user_id == user.id).all()
    return [{
        "id": x.id, "name": x.name,
        "contribution_amount": float(x.contribution_amount),
        "frequency": x.contribution_frequency,
        "status": x.status,
    } for x in rows]


@router.post("/groups/{group_id}/members")
def add_member(group_id: int, payload: MemberAdd, user: User = Depends(current_user), db: Session = Depends(get_db)):
    gm = membership(db, group_id, user.id)
    if not gm or gm.role not in [UserRole.owner, UserRole.admin, UserRole.secretary]:
        raise HTTPException(403, "Not allowed")
    group = db.get(Group, group_id)
    target = db.query(User).filter_by(email=payload.email.lower()).first()
    if not target:
        raise HTTPException(404, "User must register before being added")
    if membership(db, group_id, target.id):
        raise HTTPException(409, "User is already a member")
    db.add(GroupMember(group_id=group_id, user_id=target.id, role=payload.role))
    audit(db, group.organization_id, user.id, "member.added", "user", target.id)
    db.commit()
    return {"message": "Member added"}


@router.get("/groups/{group_id}/members")
def get_members(group_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not membership(db, group_id, user.id):
        raise HTTPException(403, "Not a group member")
    rows = db.query(GroupMember, User).join(User, User.id == GroupMember.user_id).filter(GroupMember.group_id == group_id).all()
    return [{"member_id": gm.id, "user_id": u.id, "name": u.full_name, "email": u.email, "role": gm.role} for gm, u in rows]


@router.post("/contributions")
def create_contribution(payload: ContributionCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    gm = membership(db, payload.group_id, user.id)
    if not gm or gm.role not in [UserRole.owner, UserRole.admin, UserRole.treasurer, UserRole.secretary]:
        raise HTTPException(403, "Not allowed")
    member = db.get(GroupMember, payload.member_id)
    if not member or member.group_id != payload.group_id:
        raise HTTPException(400, "Invalid member")
    group = db.get(Group, payload.group_id)
    contribution = Contribution(**payload.model_dump())
    db.add(contribution)
    db.flush()
    post_entry(db, group.organization_id, group.id, f"CON-{contribution.id}", "Member contribution", [
        ("1100", "Cash / Mobile Money", "asset", payload.amount, Decimal("0")),
        ("2100", "Member Savings Liability", "liability", Decimal("0"), payload.amount),
    ])
    audit(db, group.organization_id, user.id, "contribution.recorded", "contribution", contribution.id, {"amount": str(payload.amount)})
    db.commit()
    return {"id": contribution.id, "status": contribution.status, "amount": float(contribution.amount)}


@router.get("/contributions")
def list_contributions(group_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not membership(db, group_id, user.id):
        raise HTTPException(403, "Not a group member")
    rows = db.query(Contribution, User).join(GroupMember, GroupMember.id == Contribution.member_id).join(User, User.id == GroupMember.user_id).filter(Contribution.group_id == group_id).order_by(Contribution.paid_at.desc()).limit(100).all()
    return [{"id": c.id, "member": u.full_name, "amount": float(c.amount), "method": c.method, "paid_at": c.paid_at.isoformat()} for c, u in rows]


@router.post("/loans")
def create_loan(payload: LoanCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    gm = membership(db, payload.group_id, user.id)
    if not gm or gm.role not in [UserRole.owner, UserRole.admin, UserRole.treasurer]:
        raise HTTPException(403, "Not allowed")
    borrower = db.get(GroupMember, payload.borrower_id)
    group = db.get(Group, payload.group_id)
    if not borrower or borrower.group_id != payload.group_id:
        raise HTTPException(400, "Invalid borrower")
    loan = Loan(
        **payload.model_dump(),
        outstanding=payload.principal,
    )
    db.add(loan)
    db.flush()
    post_entry(db, group.organization_id, group.id, f"LOAN-{loan.id}", "Loan disbursement", [
        ("1200", "Loans Receivable", "asset", payload.principal, Decimal("0")),
        ("1100", "Cash / Mobile Money", "asset", Decimal("0"), payload.principal),
    ])
    audit(db, group.organization_id, user.id, "loan.created", "loan", loan.id, {"principal": str(payload.principal)})
    db.commit()
    return {"id": loan.id, "outstanding": float(loan.outstanding), "status": loan.status}


@router.post("/loans/{loan_id}/repay")
def repay_loan(loan_id: int, payload: RepaymentCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    loan = db.get(Loan, loan_id)
    if not loan or not membership(db, loan.group_id, user.id):
        raise HTTPException(404, "Loan not found")
    gm = membership(db, loan.group_id, user.id)
    if gm.role not in [UserRole.owner, UserRole.admin, UserRole.treasurer, UserRole.member]:
        raise HTTPException(403, "Not allowed")
    if payload.amount > loan.outstanding:
        raise HTTPException(400, "Repayment exceeds outstanding balance")
    loan.outstanding -= payload.amount
    if loan.outstanding <= 0:
        loan.outstanding = Decimal("0")
        loan.status = "repaid"
    db.add(LoanRepayment(loan_id=loan.id, amount=payload.amount))
    group = db.get(Group, loan.group_id)
    post_entry(db, group.organization_id, group.id, f"REPAY-{loan.id}-{uuid.uuid4().hex[:6]}", "Loan repayment", [
        ("1100", "Cash / Mobile Money", "asset", payload.amount, Decimal("0")),
        ("1200", "Loans Receivable", "asset", Decimal("0"), payload.amount),
    ])
    audit(db, group.organization_id, user.id, "loan.repaid", "loan", loan.id, {"amount": str(payload.amount)})
    db.commit()
    return {"outstanding": float(loan.outstanding), "status": loan.status}


@router.post("/expenses")
def create_expense(payload: ExpenseCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    gm = membership(db, payload.group_id, user.id)
    if not gm or gm.role not in [UserRole.owner, UserRole.admin, UserRole.treasurer]:
        raise HTTPException(403, "Not allowed")
    group = db.get(Group, payload.group_id)
    expense = Expense(organization_id=group.organization_id, **payload.model_dump())
    db.add(expense)
    db.flush()
    post_entry(db, group.organization_id, group.id, f"EXP-{expense.id}", payload.description, [
        ("5100", "Operating Expenses", "expense", payload.amount, Decimal("0")),
        ("1100", "Cash / Mobile Money", "asset", Decimal("0"), payload.amount),
    ])
    audit(db, group.organization_id, user.id, "expense.recorded", "expense", expense.id, {"amount": str(payload.amount)})
    db.commit()
    return {"id": expense.id, "amount": float(expense.amount), "category": expense.category}


@router.get("/expenses")
def list_expenses(group_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not membership(db, group_id, user.id):
        raise HTTPException(403, "Not a group member")
    rows = db.query(Expense).filter(Expense.group_id == group_id).order_by(Expense.paid_at.desc()).limit(100).all()
    return [{"id": x.id, "amount": float(x.amount), "category": x.category, "description": x.description, "paid_at": x.paid_at.isoformat()} for x in rows]


@router.get("/audit")
def audit_log(organization_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    member = db.query(OrganizationMember).filter_by(organization_id=organization_id, user_id=user.id).first()
    if not member or member.role not in [UserRole.owner, UserRole.admin, UserRole.auditor]:
        raise HTTPException(403, "Not allowed")
    rows = db.query(AuditLog).filter(AuditLog.organization_id == organization_id).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [{"id": x.id, "action": x.action, "entity_type": x.entity_type, "entity_id": x.entity_id, "actor_id": x.actor_id, "created_at": x.created_at.isoformat()} for x in rows]


@router.get("/loans")
def list_loans(group_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not membership(db, group_id, user.id):
        raise HTTPException(403, "Not a group member")
    rows = db.query(Loan, User).join(GroupMember, GroupMember.id == Loan.borrower_id).join(User, User.id == GroupMember.user_id).filter(Loan.group_id == group_id).order_by(Loan.created_at.desc()).limit(100).all()
    return [{"id": l.id, "borrower": u.full_name, "principal": float(l.principal), "outstanding": float(l.outstanding), "status": l.status, "purpose": l.purpose} for l, u in rows]


@router.get("/groups/{group_id}/dashboard")
def dashboard(group_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not membership(db, group_id, user.id):
        raise HTTPException(403, "Not a group member")
    total_savings = db.query(func.coalesce(func.sum(Contribution.amount), 0)).filter(Contribution.group_id == group_id, Contribution.status == "paid").scalar() or 0
    total_loans = db.query(func.coalesce(func.sum(Loan.principal), 0)).filter(Loan.group_id == group_id).scalar() or 0
    outstanding = db.query(func.coalesce(func.sum(Loan.outstanding), 0)).filter(Loan.group_id == group_id, Loan.status == "active").scalar() or 0
    members = db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == group_id).scalar() or 0
    recent = db.query(Contribution).filter(Contribution.group_id == group_id).order_by(Contribution.paid_at.desc()).limit(6).all()
    return {
        "members": int(members), "total_savings": float(total_savings),
        "total_loans": float(total_loans), "outstanding_loans": float(outstanding),
        "recent_contributions": [{"amount": float(x.amount), "paid_at": x.paid_at.isoformat()} for x in recent],
    }


@router.get("/ai/groups/{group_id}/risk")
def ai_risk(group_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not membership(db, group_id, user.id):
        raise HTTPException(403, "Not a group member")
    rows = db.query(GroupMember, User).join(User, User.id == GroupMember.user_id).filter(GroupMember.group_id == group_id).all()
    output = []
    for gm, u in rows:
        contributions = db.query(Contribution).filter(Contribution.member_id == gm.id).all()
        total = len(contributions) + 2
        on_time = sum(1 for c in contributions if c.status == "paid")
        missed = max(0, len(contributions) - on_time)
        score, level, factors = score_member(total, on_time, missed, 2.0 if on_time else 12.0)
        output.append({"member_id": gm.id, "name": u.full_name, "risk_score": float(score), "risk_level": level, "factors": factors})
    return {"model_version": MODEL_VERSION, "members": output}


@router.post("/payments/intents")
def payment_intent():
    raise HTTPException(503, "Online payments are disabled until a certified provider is configured")


@router.post("/payments/webhook")
def payment_webhook():
    raise HTTPException(503, "Payment webhooks are disabled until provider signature verification is configured")
