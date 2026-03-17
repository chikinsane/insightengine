import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    raw = os.environ.get("CREDENTIAL_ENCRYPTION_KEY", "")
    if not raw:
        raise RuntimeError("CREDENTIAL_ENCRYPTION_KEY env var is not set")
    return base64.b64decode(raw)


def encrypt_credential(plaintext: str) -> str:
    """Returns base64(nonce + ciphertext) suitable for DB storage."""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce — required per GCM spec
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt_credential(blob: str) -> str:
    """Decrypts a blob produced by encrypt_credential. Raises on tamper."""
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(blob)
    nonce, ciphertext = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
