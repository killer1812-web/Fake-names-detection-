import re
import unicodedata
from typing import Tuple, List, Dict, Any, Optional

# Placeholder / generic test names to flag for review (not fraud accusation)
PLACEHOLDER_NAMES = {
    "test", "testing", "tester", "test user", "sample", "sample user",
    "fake", "fake name", "fake user", "dummy", "dummy user", "placeholder",
    "asdf", "asdf asdf", "qwerty", "zxcv", "foo", "bar", "foobar",
    "admin", "administrator", "null", "undefined", "anonymous", "user",
    "unknown", "no name", "not provided", "n/a", "na", "none", "demo", "demo user"
}

# Known disposable or testing email domains
TEST_EMAIL_DOMAINS = {
    "example.com", "example.org", "example.net", "test.com", "fake.com",
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "trashmail.com", "dispostable.com"
}

# Standard email regex pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

def normalize_name(name: Optional[str]) -> str:
    """
    Standardize name: unicode normalization, strip extra whitespace, lowercase.
    Preserves original hyphenation and apostrophes for cultural inclusivity.
    """
    if not name or not isinstance(name, str):
        return ""
    # Unicode NFKD decomposition
    normalized = unicodedata.normalize("NFKC", name).strip().lower()
    # Replace multiple spaces with single space
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized

def validate_name_format(name: Optional[str]) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Validates name format according to data quality and formatting rules.
    Returns (is_valid, signals)
    """
    signals = []
    
    if not name or not str(name).strip():
        signals.append({
            "rule_id": "NAME_EMPTY",
            "rule_name": "Missing Full Name",
            "severity": "CRITICAL",
            "description": "The name field is completely empty or contains only whitespace.",
            "detected_value": str(name)
        })
        return False, signals

    stripped = str(name).strip()
    norm = normalize_name(stripped)

    # 1. Length checks
    if len(stripped) < 2:
        signals.append({
            "rule_id": "NAME_TOO_SHORT",
            "rule_name": "Extremely Short Name",
            "severity": "HIGH",
            "description": f"Name has only {len(stripped)} character(s), which is atypical for identity records.",
            "detected_value": stripped
        })
    elif len(stripped) > 70:
        signals.append({
            "rule_id": "NAME_EXCESSIVE_LENGTH",
            "rule_name": "Atypically Long Name",
            "severity": "MEDIUM",
            "description": f"Name has {len(stripped)} characters, which may indicate concatenated data or parsing error.",
            "detected_value": stripped[:30] + "..."
        })

    # 2. Known placeholder / dummy tokens
    if norm in PLACEHOLDER_NAMES:
        signals.append({
            "rule_id": "NAME_PLACEHOLDER",
            "rule_name": "Test/Placeholder Name Detected",
            "severity": "HIGH",
            "description": f"The name matches known test or placeholder text ('{stripped}').",
            "detected_value": stripped
        })

    # 3. Numeric characters in name
    digits = re.findall(r"\d", stripped)
    if digits:
        signals.append({
            "rule_id": "NAME_CONTAINS_DIGITS",
            "rule_name": "Digits in Name Field",
            "severity": "HIGH",
            "description": f"Name contains {len(digits)} numeric digit(s), which usually indicates system ID or data corruption.",
            "detected_value": "".join(digits)
        })

    # 4. Excessive special symbols (excluding normal cultural hyphens and apostrophes)
    suspicious_chars = re.findall(r"[!@#$%^&*()_+=\[\]{};:\"\\|<>,/?~`]", stripped)
    if suspicious_chars:
        signals.append({
            "rule_id": "NAME_SPECIAL_CHARACTERS",
            "rule_name": "Invalid Punctuation in Name",
            "severity": "HIGH",
            "description": f"Name contains invalid punctuation symbols: {', '.join(set(suspicious_chars))}",
            "detected_value": "".join(suspicious_chars)
        })

    # 5. Repeated consecutive characters (e.g., 'aaaaaa', 'zzzzz')
    if re.search(r"(.)\1{4,}", norm):
        signals.append({
            "rule_id": "NAME_REPEATED_CHARS",
            "rule_name": "Repetitive Character Sequences",
            "severity": "MEDIUM",
            "description": "Name contains 5 or more identical consecutive characters, suggesting keyboard mash or synthetic filler.",
            "detected_value": stripped
        })

    # 6. Single character token check (e.g. 'X Y')
    tokens = norm.split()
    if all(len(t) == 1 for t in tokens) and len(tokens) > 1:
        signals.append({
            "rule_id": "NAME_INITIALS_ONLY",
            "rule_name": "Initials Only",
            "severity": "LOW",
            "description": "Name consists entirely of single-letter initials.",
            "detected_value": stripped
        })

    is_valid = len([s for s in signals if s["severity"] in ("HIGH", "CRITICAL")]) == 0
    return is_valid, signals

def normalize_email(email: Optional[str]) -> str:
    """Trims, standardizes unicode, and lowercases email."""
    if not email or not isinstance(email, str):
        return ""
    return unicodedata.normalize("NFKC", email).strip().lower()

def validate_email_format(email: Optional[str]) -> Tuple[bool, List[Dict[str, Any]]]:
    """Validates email format and detects placeholder/disposable domains."""
    signals = []
    if not email or not str(email).strip():
        signals.append({
            "rule_id": "EMAIL_MISSING",
            "rule_name": "Missing Email",
            "severity": "LOW",
            "description": "No email address provided for this identity record.",
            "detected_value": None
        })
        return True, signals

    norm = normalize_email(email)

    if not EMAIL_REGEX.match(norm):
        signals.append({
            "rule_id": "EMAIL_INVALID_SYNTAX",
            "rule_name": "Malformed Email Syntax",
            "severity": "HIGH",
            "description": "The email does not conform to RFC email address format specifications.",
            "detected_value": email
        })
        return False, signals

    domain = norm.split("@")[-1]
    if domain in TEST_EMAIL_DOMAINS:
        signals.append({
            "rule_id": "EMAIL_TEST_DOMAIN",
            "rule_name": "Disposable/Test Domain Detected",
            "severity": "MEDIUM",
            "description": f"Email is registered on a known test or disposable domain ('{domain}').",
            "detected_value": domain
        })

    return True, signals

def normalize_phone(phone: Optional[str]) -> str:
    """Extracts numeric digits from phone string."""
    if not phone or not isinstance(phone, str):
        return ""
    return re.sub(r"\D", "", phone)

def validate_phone_format(phone: Optional[str]) -> Tuple[bool, List[Dict[str, Any]]]:
    """Validates phone number length and flags placeholder/repeated patterns."""
    signals = []
    if not phone or not str(phone).strip():
        signals.append({
            "rule_id": "PHONE_MISSING",
            "rule_name": "Missing Phone Number",
            "severity": "LOW",
            "description": "No phone number provided for this identity record.",
            "detected_value": None
        })
        return True, signals

    digits = normalize_phone(phone)

    if len(digits) < 7 or len(digits) > 15:
        signals.append({
            "rule_id": "PHONE_INVALID_LENGTH",
            "rule_name": "Irregular Phone Length",
            "severity": "MEDIUM",
            "description": f"Phone contains {len(digits)} digits; valid standard numbers typically range between 7 and 15 digits.",
            "detected_value": phone
        })

    # Repeated digits (e.g., 000-000-0000 or 9999999999)
    if digits and len(set(digits)) == 1:
        signals.append({
            "rule_id": "PHONE_REPEATED_DIGITS",
            "rule_name": "Single Repeated Digit Pattern",
            "severity": "HIGH",
            "description": "Phone number consists of a single repeated digit.",
            "detected_value": phone
        })

    # Sequential digits (e.g. 1234567890)
    if digits in ("1234567890", "0123456789", "9876543210"):
        signals.append({
            "rule_id": "PHONE_SEQUENTIAL_DIGITS",
            "rule_name": "Sequential Test Phone Pattern",
            "severity": "HIGH",
            "description": "Phone number contains an artificial ascending or descending sequence.",
            "detected_value": phone
        })

    is_valid = len([s for s in signals if s["severity"] in ("HIGH", "CRITICAL")]) == 0
    return is_valid, signals
