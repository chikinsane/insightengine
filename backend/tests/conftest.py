import os
import base64
import pytest


@pytest.fixture(autouse=True)
def set_test_encryption_key(monkeypatch):
    """Provide a valid 256-bit AES key for all tests."""
    test_key = base64.b64encode(os.urandom(32)).decode()
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", test_key)
