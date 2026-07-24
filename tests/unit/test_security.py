"""Tests for `app/utilities/security.py` — regex-based PII/secret scanning.

Arrange-Act-Assert throughout. Positive cases per pattern type, a clean-text
negative case, and an explicit assertion that the matched secret value never
appears in the return value (the return value is always a fixed type label).
"""

from app.utilities.security import scan_for_sensitive_data

SENSITIVE_SAMPLES = {
    "api_key": "sk-1234567890abcdefghijklmnopqrstuvwxyz",
    "email": "Please contact jane.smith@example.com for details.",
    "phone": "Call me at 415-555-2671 tomorrow.",
    "credit_card": "Card number: 4111 1111 1111 1111, exp 12/29.",
}


def test_scan_detects_api_key_sk_prefixed_token():
    apiKeyText = "Authorization: Bearer " + SENSITIVE_SAMPLES["api_key"]

    result = scan_for_sensitive_data(apiKeyText)

    assert result == "api_key"


def test_scan_detects_api_key_generic_long_secret():
    genericSecretText = "leaked secret: 3f2504e04f8911d39a0c0305e82c3301d3f2504e04f8911d39a0c0305e82c33"

    result = scan_for_sensitive_data(genericSecretText)

    assert result == "api_key"


def test_scan_detects_email():
    emailText = SENSITIVE_SAMPLES["email"]

    result = scan_for_sensitive_data(emailText)

    assert result == "email"


def test_scan_detects_phone_number():
    phoneText = SENSITIVE_SAMPLES["phone"]

    result = scan_for_sensitive_data(phoneText)

    assert result == "phone"


def test_scan_detects_credit_card_number():
    creditCardText = SENSITIVE_SAMPLES["credit_card"]

    result = scan_for_sensitive_data(creditCardText)

    assert result == "credit_card"


def test_scan_returns_none_for_clean_text():
    cleanText = "What is the average listing price by state?"

    result = scan_for_sensitive_data(cleanText)

    assert result is None


def test_scan_never_leaks_the_matched_secret_value():
    for expectedType, sampleText in SENSITIVE_SAMPLES.items():
        result = scan_for_sensitive_data(sampleText)

        assert result == expectedType
        assert result != sampleText
        assert sampleText not in result
