from enum import Enum
from typing import Set, Dict


class Permission(str, Enum):
    # Brand tenant administration
    BRAND_UPDATE = "brand:update"
    BRAND_DELETE = "brand:delete"

    # Membership and invitations
    MEMBERS_VIEW = "members:view"
    MEMBERS_INVITE = "members:invite"
    MEMBERS_MANAGE = "members:manage"

    # Brand Rules & Guardrails
    RULES_CREATE = "rules:create"
    RULES_READ = "rules:read"
    RULES_UPDATE = "rules:update"
    RULES_DELETE = "rules:delete"

    # Golden Facts (Knowledge base)
    FACTS_CREATE = "facts:create"
    FACTS_READ = "facts:read"
    FACTS_DELETE = "facts:delete"

    # Visual Identity Assets
    ASSETS_MANAGE = "assets:manage"
    ASSETS_VIEW = "assets:view"

    # Content Audit Pipeline
    AUDIT_CREATE = "audit:create"
    AUDIT_READ = "audit:read"

    # Review Queue
    REVIEW_VIEW = "review:view"
    REVIEW_ACT = "review:act"  # Approve, reject, request changes

    # Governance Analytics
    ANALYTICS_VIEW = "analytics:view"


# Role-Based Permissions Mapping
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    # Full tenant authority
    "OWNER": {
        Permission.BRAND_UPDATE,
        Permission.BRAND_DELETE,
        Permission.MEMBERS_VIEW,
        Permission.MEMBERS_INVITE,
        Permission.MEMBERS_MANAGE,
        Permission.RULES_CREATE,
        Permission.RULES_READ,
        Permission.RULES_UPDATE,
        Permission.RULES_DELETE,
        Permission.FACTS_CREATE,
        Permission.FACTS_READ,
        Permission.FACTS_DELETE,
        Permission.ASSETS_MANAGE,
        Permission.ASSETS_VIEW,
        Permission.AUDIT_CREATE,
        Permission.AUDIT_READ,
        Permission.REVIEW_VIEW,
        Permission.REVIEW_ACT,
        Permission.ANALYTICS_VIEW,
    },
    # Operations manager (all except deleting the entire brand workspace)
    "BRAND_MANAGER": {
        Permission.BRAND_UPDATE,
        Permission.MEMBERS_VIEW,
        Permission.MEMBERS_INVITE,
        Permission.MEMBERS_MANAGE,
        Permission.RULES_CREATE,
        Permission.RULES_READ,
        Permission.RULES_UPDATE,
        Permission.RULES_DELETE,
        Permission.FACTS_CREATE,
        Permission.FACTS_READ,
        Permission.FACTS_DELETE,
        Permission.ASSETS_MANAGE,
        Permission.ASSETS_VIEW,
        Permission.AUDIT_CREATE,
        Permission.AUDIT_READ,
        Permission.REVIEW_VIEW,
        Permission.REVIEW_ACT,
        Permission.ANALYTICS_VIEW,
    },
    # Authorised compliance reviewer (sign-offs & review actions)
    "COMPLIANCE_REVIEWER": {
        Permission.MEMBERS_VIEW,
        Permission.RULES_READ,
        Permission.FACTS_READ,
        Permission.ASSETS_VIEW,
        Permission.AUDIT_CREATE,
        Permission.AUDIT_READ,
        Permission.REVIEW_VIEW,
        Permission.REVIEW_ACT,
        Permission.ANALYTICS_VIEW,
    },
    # Content creator (drafting, pre-publication audits, viewing rules and facts)
    "CONTENT_CREATOR": {
        Permission.RULES_READ,
        Permission.FACTS_READ,
        Permission.ASSETS_VIEW,
        Permission.AUDIT_CREATE,
        Permission.AUDIT_READ,
    },
}


def has_permission(role: str, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
