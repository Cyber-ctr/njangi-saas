from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import Account, JournalEntry, JournalLine


def account(db: Session, org_id: int, code: str, name: str, account_type: str) -> Account:
    obj = db.query(Account).filter_by(organization_id=org_id, code=code).first()
    if not obj:
        obj = Account(
            organization_id=org_id, code=code, name=name,
            account_type=account_type,
        )
        db.add(obj)
        db.flush()
    return obj


def post_entry(
    db: Session, org_id: int, group_id: int | None, reference: str,
    description: str, lines: list[tuple[str, str, str, Decimal, Decimal]],
):
    total_debit = sum((x[3] for x in lines), Decimal("0"))
    total_credit = sum((x[4] for x in lines), Decimal("0"))
    if total_debit != total_credit:
        raise ValueError("Unbalanced journal entry")
    entry = JournalEntry(
        organization_id=org_id, group_id=group_id,
        reference=reference, description=description,
    )
    db.add(entry)
    db.flush()
    for code, name, typ, debit, credit in lines:
        acc = account(db, org_id, code, name, typ)
        db.add(JournalLine(
            journal_entry_id=entry.id, account_id=acc.id,
            debit=debit, credit=credit,
        ))
    return entry


def seed_chart(db: Session, org_id: int):
    defaults = [
        ("1100", "Cash / Mobile Money", "asset"),
        ("1200", "Loans Receivable", "asset"),
        ("2100", "Member Savings Liability", "liability"),
        ("4100", "Interest Income", "income"),
        ("5100", "Operating Expenses", "expense"),
    ]
    for c, n, t in defaults:
        account(db, org_id, c, n, t)
