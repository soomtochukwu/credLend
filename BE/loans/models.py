from django.db import models
from django.conf import settings
from decimal import Decimal

class LoanProduct(models.Model):
    LOAN_TYPES = (
        ('personal', 'Personal Loan'),
        ('business', 'Business Loan'),
        ('mortgage', 'Mortgage'),
    )
    
    COLLATERAL_TYPES = (
        ('real_estate', 'Real Estate'),
        ('crypto', 'Cryptocurrency'),
        ('vehicle', 'Vehicle'),
        ('other', 'Other'),
    )
    
    name = models.CharField(max_length=255)
    loan_type = models.CharField(max_length=50, choices=LOAN_TYPES)
    description = models.TextField()
    min_amount = models.DecimalField(max_digits=18, decimal_places=2)
    max_amount = models.DecimalField(max_digits=18, decimal_places=2)
    min_duration = models.IntegerField()  # in days
    max_duration = models.IntegerField()  # in days
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    collateral_required = models.BooleanField(default=False)
    collateral_type = models.CharField(max_length=50, choices=COLLATERAL_TYPES, null=True, blank=True)
    ltv_ratio = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Loan-to-Value ratio
    min_credit_score = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loan_products'

class LoanApplication(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('canceled', 'Canceled'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loan_applications')
    loan_product = models.ForeignKey(LoanProduct, on_delete=models.CASCADE, related_name='applications')
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    duration_days = models.IntegerField()
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    rejection_reason = models.TextField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='approved_loans')
    approved_at = models.DateTimeField(null=True, blank=True)
    contract_address = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loan_applications'

class Loan(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('repaid', 'Repaid'),
        ('defaulted', 'Defaulted'),
        ('liquidated', 'Liquidated'),
    )
    
    application = models.OneToOneField(LoanApplication, on_delete=models.CASCADE, related_name='loan')
    principal = models.DecimalField(max_digits=18, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    total_due = models.DecimalField(max_digits=18, decimal_places=2)
    amount_repaid = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    start_date = models.DateTimeField()
    due_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    collateral_address = models.CharField(max_length=255, null=True, blank=True)
    collateral_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    liquidated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loans'

class Repayment(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayments')
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    due_date = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)
    tx_hash = models.CharField(max_length=255, null=True, blank=True)
    is_late = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'repayments'