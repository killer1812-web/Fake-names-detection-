import pytest
from app.services.cleaner import (
    normalize_name,
    validate_name_format,
    normalize_email,
    validate_email_format,
    normalize_phone,
    validate_phone_format
)
from app.ml.feature_engineering import extract_features_from_record

def test_normalize_name():
    assert normalize_name("  John   DOE  ") == "john doe"
    assert normalize_name("Mary-Jane O'Connor") == "mary-jane o'connor"
    assert normalize_name(None) == ""

def test_validate_placeholder_name():
    is_valid, signals = validate_name_format("Test User")
    assert any(s["rule_id"] == "NAME_PLACEHOLDER" for s in signals)

def test_validate_digit_in_name():
    is_valid, signals = validate_name_format("Alice123")
    assert not is_valid
    assert any(s["rule_id"] == "NAME_CONTAINS_DIGITS" for s in signals)

def test_validate_special_chars_in_name():
    is_valid, signals = validate_name_format("Bob@Smith")
    assert not is_valid
    assert any(s["rule_id"] == "NAME_SPECIAL_CHARACTERS" for s in signals)

def test_validate_email():
    is_valid, signals = validate_email_format("bad-email-at-domain")
    assert not is_valid
    assert any(s["rule_id"] == "EMAIL_INVALID_SYNTAX" for s in signals)

    is_valid_disp, signals_disp = validate_email_format("user@mailinator.com")
    assert any(s["rule_id"] == "EMAIL_TEST_DOMAIN" for s in signals_disp)

def test_validate_phone():
    is_valid, signals = validate_phone_format("0000000000")
    assert any(s["rule_id"] == "PHONE_REPEATED_DIGITS" for s in signals)

def test_feature_engineering_extraction():
    feats = extract_features_from_record(
        full_name="John Doe",
        email="john.doe@example.com",
        phone="555-1234",
        city="Chicago",
        is_duplicate=False
    )
    assert feats["name_char_count"] == 8.0
    assert feats["name_word_count"] == 2.0
    assert feats["has_email"] == 1.0
    assert feats["has_city"] == 1.0
    assert feats["is_duplicate_flag"] == 0.0
