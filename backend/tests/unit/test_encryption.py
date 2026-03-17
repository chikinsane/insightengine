import os
import base64
import pytest
from app.security.encryption import encrypt_credential, decrypt_credential, _get_key


class TestEncryptDecryptRoundTrip:
    def test_round_trip_connection_string(self):
        plaintext = "postgresql://user:pass@host:5432/mydb"
        blob = encrypt_credential(plaintext)
        assert decrypt_credential(blob) == plaintext

    def test_round_trip_empty_string(self):
        blob = encrypt_credential("")
        assert decrypt_credential(blob) == ""

    def test_round_trip_unicode(self):
        plaintext = "password_with_special_chars_!@#$%"
        blob = encrypt_credential(plaintext)
        assert decrypt_credential(blob) == plaintext


class TestNonceUniqueness:
    def test_encrypt_produces_unique_ciphertext(self):
        plaintext = "same_plaintext"
        blob1 = encrypt_credential(plaintext)
        blob2 = encrypt_credential(plaintext)
        assert blob1 != blob2, "Two encryptions of same plaintext must produce different blobs (nonce uniqueness)"


class TestWrongKey:
    def test_decrypt_with_wrong_key_raises(self, monkeypatch):
        blob = encrypt_credential("secret_data")
        # Change the key
        wrong_key = base64.b64encode(os.urandom(32)).decode()
        monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", wrong_key)
        with pytest.raises(Exception):  # InvalidTag from AESGCM
            decrypt_credential(blob)


class TestMissingKey:
    def test_missing_key_raises_runtime_error(self, monkeypatch):
        monkeypatch.delenv("CREDENTIAL_ENCRYPTION_KEY", raising=False)
        with pytest.raises(RuntimeError, match="CREDENTIAL_ENCRYPTION_KEY"):
            _get_key()
