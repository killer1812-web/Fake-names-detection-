from typing import Dict, Any, List, Tuple
from app.services.cleaner import (
    validate_name_format,
    validate_email_format,
    validate_phone_format,
    normalize_name,
    normalize_email
)
from app.core.config import settings

def evaluate_record_rules(
    full_name: str,
    email: str = None,
    phone: str = None,
    city: str = None,
    date_created: str = None,
    duplicate_count: int = 0
) -> Tuple[str, List[Dict[str, Any]], List[str], str]:
    """
    Evaluates rule-based signals on an identity record.
    Returns:
      (validation_status, signals, explanation_list, suggested_action)
    """
    signals: List[Dict[str, Any]] = []
    explanations: List[str] = []

    # 1. Name validation
    name_valid, name_signals = validate_name_format(full_name)
    signals.extend(name_signals)

    # 2. Email validation
    email_valid, email_signals = validate_email_format(email)
    signals.extend(email_signals)

    # 3. Phone validation
    phone_valid, phone_signals = validate_phone_format(phone)
    signals.extend(phone_signals)

    # 4. Cross-field consistency check
    if full_name and email and "@" in str(email):
        n_name = normalize_name(full_name)
        n_email = normalize_email(email)
        local_part = n_email.split("@")[0]
        
        # Check if local part is a generic placeholder like admin, test, support
        if local_part in ("admin", "test", "root", "support", "billing", "info", "contact"):
            signals.append({
                "rule_id": "EMAIL_ROLE_ACCOUNT",
                "rule_name": "Generic Role-Based Email",
                "severity": "MEDIUM",
                "description": f"The email username '{local_part}' represents a generic system role rather than an individual person.",
                "detected_value": email
            })

    # 5. Duplicate group signal
    if duplicate_count > 0:
        signals.append({
            "rule_id": "DUPLICATE_CLUSTER",
            "rule_name": "Duplicate Record Cluster Detected",
            "severity": "HIGH",
            "description": f"Found {duplicate_count} other record(s) in the database sharing identical name or contact credentials.",
            "detected_value": f"{duplicate_count} matches"
        })

    # Determine severity distribution
    critical_signals = [s for s in signals if s["severity"] == "CRITICAL"]
    high_signals = [s for s in signals if s["severity"] == "HIGH"]
    medium_signals = [s for s in signals if s["severity"] == "MEDIUM"]

    # Determine validation status
    if critical_signals:
        validation_status = "INVALID_FORMAT" if any("EMPTY" not in s["rule_id"] for s in critical_signals) else "MISSING_FIELDS"
    elif high_signals:
        validation_status = "FLAGGED"
    elif medium_signals:
        validation_status = "FLAGGED"
    else:
        validation_status = "VALID"

    # Compile human-readable explanations
    if not signals:
        explanations.append("All field formats and consistency rules passed standard verification.")
    else:
        for s in signals:
            explanations.append(f"[{s['severity']}] {s['rule_name']}: {s['description']}")

    # Formulate suggested action
    if validation_status == "VALID":
        suggested_action = "Approve Record: No artificial or malformed patterns detected."
    elif any(s["rule_id"] == "NAME_PLACEHOLDER" for s in signals):
        suggested_action = "Reject or Purge: Record contains synthetic placeholder name."
    elif duplicate_count > 0:
        suggested_action = "Review Duplicate: Investigate duplicate cluster to merge or flag redundant profiles."
    elif validation_status == "FLAGGED":
        suggested_action = "Manual Review Required: Human analyst review recommended due to quality or pattern anomalies."
    else:
        suggested_action = "Correct Data: Request updated contact or identity details to resolve formatting errors."

    return validation_status, signals, explanations, suggested_action
