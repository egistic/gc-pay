# app/common/enums.py
from enum import Enum

class PaymentRequestStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    CLASSIFIED = "classified"
    RETURNED = "returned"
    APPROVED = "approved"
    APPROVED_ON_BEHALF = "approved-on-behalf"
    TO_PAY = "to-pay"
    IN_REGISTER = "in-register"
    APPROVED_FOR_PAYMENT = "approved-for-payment"
    PAID_FULL = "paid-full"
    PAID_PARTIAL = "paid-partial"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    CLOSED = "closed"
    DISTRIBUTED = "distributed"
    SPLITED = "splited"
    REPORT_PUBLISHED = "report_published"
    EXPORT_LINKED = "export_linked"

class DistributionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class DocumentStatus(str, Enum):
    REQUIRED = "required"
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"

class SubRegistrarAssignmentStatus(str, Enum):
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"

class ContractType(str, Enum):
    GENERAL = "general"
    EXPORT = "export"
    SERVICE = "service"
    SUPPLY = "supply"

class PaymentPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

# Additional enums for backward compatibility
class RoleCode(str, Enum):
    ADMIN = "admin"
    EXECUTOR = "executor"
    REGISTRAR = "registrar"
    SUB_REGISTRAR = "sub_registrar"
    DISTRIBUTOR = "distributor"
    TREASURER = "treasurer"

# Alias for backward compatibility
RequestStatus = PaymentRequestStatus
