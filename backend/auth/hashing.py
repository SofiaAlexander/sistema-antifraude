import hashlib
import secrets

def hash_password(password: str) -> str:
    salt = secrets.token_hex(32)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 310000)
    return f"{salt}${hashed.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split("$")
        hashed = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt.encode(), 310000)
        return hashed.hex() == stored_hash
    except Exception:
        return False