from django.db import models
from django.conf import settings

class KYCDocument(models.Model):
    DOCUMENT_TYPES = (
        ('passport', 'Passport'),
        ('id_card', 'National ID Card'),
        ('drivers_license', 'Driver\'s License'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc_documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=255)
    front_image = models.FileField(upload_to='kyc/documents/')
    back_image = models.FileField(upload_to='kyc/documents/', null=True, blank=True)
    selfie_image = models.FileField(upload_to='kyc/selfies/')
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                  null=True, blank=True, related_name='verified_documents')
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'kyc_documents'

class KYCVerification(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc_verification')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    provider_reference = models.CharField(max_length=255, null=True, blank=True)
    data = models.JSONField(default=dict)  # Store verification data from provider
    attested_hash = models.CharField(max_length=255, null=True, blank=True)
    tx_hash = models.CharField(max_length=255, null=True, blank=True)  # Blockchain transaction hash
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'kyc_verifications'