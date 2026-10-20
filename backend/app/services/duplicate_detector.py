import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.identity import IdentityRecord
from app.services.cleaner import normalize_name, normalize_email, normalize_phone

def find_duplicate_matches_in_db(
    db: Session,
    norm_name: str,
    norm_email: Optional[str] = None,
    norm_phone: Optional[str] = None,
    exclude_record_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Searches the database for identical or highly matching normalized identity records.
    Returns a list of match descriptions with matched record details.
    """
    matches = []
    
    query = db.query(IdentityRecord)
    if exclude_record_id:
        query = query.filter(IdentityRecord.record_id != exclude_record_id)

    # 1. Exact normalized name + normalized email match
    if norm_email:
        name_email_matches = query.filter(
            IdentityRecord.normalized_name == norm_name,
            IdentityRecord.normalized_email == norm_email
        ).limit(10).all()
        
        for rec in name_email_matches:
            matches.append({
                "match_type": "EXACT_NAME_AND_EMAIL",
                "confidence": 0.98,
                "matched_record_id": rec.record_id,
                "full_name": rec.full_name,
                "email": rec.email,
                "created_at": rec.created_at.isoformat() if rec.created_at else None,
                "note": "Matches both normalized name and email address"
            })

    # 2. Matching normalized name only (potential collision / duplicate individual)
    name_only_matches = query.filter(
        IdentityRecord.normalized_name == norm_name
    ).limit(5).all()

    existing_ids = {m["matched_record_id"] for m in matches}
    for rec in name_only_matches:
        if rec.record_id not in existing_ids:
            matches.append({
                "match_type": "NORMALIZED_NAME_ONLY",
                "confidence": 0.65,
                "matched_record_id": rec.record_id,
                "full_name": rec.full_name,
                "email": rec.email,
                "created_at": rec.created_at.isoformat() if rec.created_at else None,
                "note": "Shares identical normalized name but differing or absent contact info"
            })

    # 3. Matching phone number if provided
    if norm_phone and len(norm_phone) >= 7:
        phone_matches = query.filter(
            IdentityRecord.phone != None
        ).all()
        for rec in phone_matches:
            if rec.record_id not in existing_ids:
                if rec.phone and normalize_phone(rec.phone) == norm_phone:
                    matches.append({
                        "match_type": "SHARED_PHONE_NUMBER",
                        "confidence": 0.85,
                        "matched_record_id": rec.record_id,
                        "full_name": rec.full_name,
                        "phone": rec.phone,
                        "created_at": rec.created_at.isoformat() if rec.created_at else None,
                        "note": "Shares the exact same phone number with different name"
                    })

    return matches

def detect_duplicates_in_dataset(records_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    In-memory duplicate clustering for bulk uploads.
    Groups records by normalized name + normalized email / phone.
    Returns enriched records with is_duplicate and duplicate_group_id.
    """
    # Key mapping: composite key -> list of indices
    key_to_indices: Dict[str, List[int]] = {}

    for idx, rec in enumerate(records_data):
        n_name = normalize_name(rec.get("full_name", ""))
        n_email = normalize_email(rec.get("email", ""))
        n_phone = normalize_phone(rec.get("phone", ""))

        if n_name and n_email:
            key = f"NE:{n_name}|{n_email}"
            key_to_indices.setdefault(key, []).append(idx)
        elif n_name and n_phone and len(n_phone) >= 7:
            key = f"NP:{n_name}|{n_phone}"
            key_to_indices.setdefault(key, []).append(idx)
        elif n_name:
            key = f"N:{n_name}"
            key_to_indices.setdefault(key, []).append(idx)

    # Assign group IDs for clusters of size > 1
    for key, indices in key_to_indices.items():
        if len(indices) > 1:
            group_id = f"GRP-{uuid.uuid4().hex[:8].upper()}"
            for idx in indices:
                records_data[idx]["is_duplicate"] = True
                records_data[idx]["duplicate_group_id"] = group_id

    return records_data
