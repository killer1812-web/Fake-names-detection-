import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.cleaner import (
    normalize_name,
    normalize_email,
    normalize_phone,
    PLACEHOLDER_NAMES,
    TEST_EMAIL_DOMAINS
)

FEATURE_COLUMNS = [
    "name_char_count",
    "name_word_count",
    "name_digit_count",
    "name_special_char_count",
    "name_has_whitespace_issues",
    "name_is_placeholder_phrase",
    "name_repeated_char_max",
    "has_email",
    "email_has_test_domain",
    "email_is_role_account",
    "has_phone",
    "phone_digit_count",
    "phone_is_repeated_or_sequential",
    "has_city",
    "missing_field_count",
    "is_duplicate_flag"
]

def extract_features_from_record(
    full_name: str,
    email: str = None,
    phone: str = None,
    city: str = None,
    is_duplicate: bool = False
) -> Dict[str, float]:
    """
    Extracts numerical features from a single identity record for model inference.
    """
    raw_name = str(full_name or "").strip()
    norm_n = normalize_name(raw_name)
    raw_email = str(email or "").strip() if email else ""
    norm_e = normalize_email(raw_email)
    raw_phone = str(phone or "").strip() if phone else ""
    norm_p = normalize_phone(raw_phone)
    raw_city = str(city or "").strip() if city else ""

    # Name features
    char_count = len(raw_name)
    words = raw_name.split()
    word_count = len(words)
    digit_count = len(re.findall(r"\d", raw_name))
    special_char_count = len(re.findall(r"[!@#$%^&*()_+=\[\]{};:\"\\|<>,/?~`]", raw_name))
    whitespace_issues = 1.0 if ("  " in (full_name or "") or (full_name or "").startswith(" ") or (full_name or "").endswith(" ")) else 0.0
    is_placeholder = 1.0 if norm_n in PLACEHOLDER_NAMES else 0.0

    # Max consecutive repeated chars in name
    max_repeat = 1
    if norm_n:
        current_char = ""
        current_streak = 0
        for ch in norm_n:
            if ch == current_char:
                current_streak += 1
                if current_streak > max_repeat:
                    max_repeat = current_streak
            else:
                current_char = ch
                current_streak = 1

    # Email features
    has_email = 1.0 if raw_email else 0.0
    email_test_domain = 0.0
    email_role_account = 0.0
    if norm_e and "@" in norm_e:
        local_p, domain = norm_e.split("@", 1)
        if domain in TEST_EMAIL_DOMAINS:
            email_test_domain = 1.0
        if local_p in ("admin", "test", "root", "support", "billing", "info", "contact"):
            email_role_account = 1.0

    # Phone features
    has_phone = 1.0 if raw_phone else 0.0
    phone_digits_len = len(norm_p)
    phone_repeated_seq = 0.0
    if norm_p:
        if len(set(norm_p)) == 1 or norm_p in ("1234567890", "0123456789", "9876543210"):
            phone_repeated_seq = 1.0

    # City & Missing
    has_city = 1.0 if raw_city else 0.0
    missing_count = (1 if not raw_email else 0) + (1 if not raw_phone else 0) + (1 if not raw_city else 0)

    return {
        "name_char_count": float(char_count),
        "name_word_count": float(word_count),
        "name_digit_count": float(digit_count),
        "name_special_char_count": float(special_char_count),
        "name_has_whitespace_issues": float(whitespace_issues),
        "name_is_placeholder_phrase": float(is_placeholder),
        "name_repeated_char_max": float(max_repeat),
        "has_email": float(has_email),
        "email_has_test_domain": float(email_test_domain),
        "email_is_role_account": float(email_role_account),
        "has_phone": float(has_phone),
        "phone_digit_count": float(phone_digits_len),
        "phone_is_repeated_or_sequential": float(phone_repeated_seq),
        "has_city": float(has_city),
        "missing_field_count": float(missing_count),
        "is_duplicate_flag": 1.0 if is_duplicate else 0.0,
    }

def build_feature_dataframe(records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Transforms a list of record dictionaries into a feature DataFrame aligned with FEATURE_COLUMNS.
    """
    rows = []
    for r in records:
        f = extract_features_from_record(
            full_name=r.get("full_name", ""),
            email=r.get("email"),
            phone=r.get("phone"),
            city=r.get("city"),
            is_duplicate=bool(r.get("is_duplicate", False))
        )
        rows.append(f)
    return pd.DataFrame(rows, columns=FEATURE_COLUMNS)
