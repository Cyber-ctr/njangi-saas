from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    phone: str | None = None


class Login(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=72)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GroupCreate(BaseModel):
    organization_id: int
    name: str = Field(min_length=2, max_length=160)
    contribution_amount: Decimal = Field(default=0, ge=0)
    contribution_frequency: str = "monthly"
    payout_cycle: str = "monthly"


class MemberAdd(BaseModel):
    email: EmailStr
    role: Literal["member"] = "member"


class ContributionCreate(BaseModel):
    group_id: int
    member_id: int
    amount: Decimal = Field(gt=0)
    method: str = "cash"
    note: str | None = None


class ExpenseCreate(BaseModel):
    group_id: int
    amount: Decimal = Field(gt=0)
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=2, max_length=255)


class LoanCreate(BaseModel):
    group_id: int
    borrower_id: int
    principal: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(default=0, ge=0, le=100)
    term_months: int = Field(default=1, ge=1, le=120)
    purpose: str = "General"


class RepaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0)


class PaymentIntentCreate(BaseModel):
    group_id: int
    member_id: int
    amount: Decimal = Field(gt=0)
    provider: str = Field(default="momo", pattern=r"^(momo|orange|stripe)$")


class WebhookPayload(BaseModel):
    reference: str
    status: str
