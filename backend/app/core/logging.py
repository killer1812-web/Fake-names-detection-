import logging
import sys
import re

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "[INVALID_EMAIL]"
    name, domain = email.split("@", 1)
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
    return f"{masked_name}@{domain}"

def mask_phone(phone: str) -> str:
    if not phone:
        return "[EMPTY_PHONE]"
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 4:
        return "*" * (len(digits) - 4) + digits[-4:]
    return "****"

# Configure standard structured logger
logger = logging.getLogger("synthetic_identity_analytics")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s"}'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
