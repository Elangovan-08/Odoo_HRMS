import base64
import hashlib
import hmac
import secrets


_HASH_NAME = "scrypt"
_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return f"{_HASH_NAME}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, encoded_salt, encoded_digest = encoded_hash.split("$", 2)
        if algorithm != _HASH_NAME:
            return False
        salt = base64.b64decode(encoded_salt)
        expected_digest = base64.b64decode(encoded_digest)
        actual_digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
        return hmac.compare_digest(actual_digest, expected_digest)
    except (ValueError, TypeError):
        return False
