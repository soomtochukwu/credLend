from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from fernet_fields import EncryptedCharField, EncryptedTextField 



class User(AbstractUser):
    wallet_address = models.CharField(max_length=255, unique=True)
    private_key = EncryptedCharField(max_length=255, null=True, blank=True)
    is_borrower = models.BooleanField(default=False)
    is_lender = models.BooleanField(default=False)
    kyc_verified = models.BooleanField(default=False)
    kyc_verified_at = models.DateTimeField(null=True, blank=True)
    credit_score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def save(self, *args, **kwargs):
        # Ensure private key is encrypted before saving
        if self.private_key:
            # The encryption is handled automatically by django-cryptography
            pass
        super().save(*args, **kwargs)

class Wallet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallets')
    address = models.CharField(max_length=255, unique=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wallets'

class BlockchainTransaction(models.Model):
    tx_hash = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=50, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed')
    ])
    block_number = models.BigIntegerField(null=True, blank=True)
    from_address = models.CharField(max_length=255)
    to_address = models.CharField(max_length=255, null=True, blank=True)
    value = models.DecimalField(max_digits=36, decimal_places=18, null=True, blank=True)
    gas_used = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'blockchain_transactions'
        indexes = [
            models.Index(fields=['tx_hash']),
            models.Index(fields=['from_address']),
            models.Index(fields=['status']),
        ]