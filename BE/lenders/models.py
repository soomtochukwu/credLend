from django.db import models
from django.conf import settings

class LenderPool(models.Model):
    POOL_TYPES = (
        ('stablecoin', 'Stablecoin Pool'),
        ('native', 'Native Token Pool'),
    )
    
    name = models.CharField(max_length=255)
    pool_type = models.CharField(max_length=50, choices=POOL_TYPES)
    description = models.TextField()
    token_address = models.CharField(max_length=255)
    apy = models.DecimalField(max_digits=5, decimal_places=2)  # Annual Percentage Yield
    total_liquidity = models.DecimalField(max_digits=36, decimal_places=18, default=0)
    available_liquidity = models.DecimalField(max_digits=36, decimal_places=18, default=0)
    min_deposit = models.DecimalField(max_digits=36, decimal_places=18)
    lock_period_days = models.IntegerField()  # 0 for no lock period
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lender_pools'

class LenderDeposit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deposits')
    pool = models.ForeignKey(LenderPool, on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=36, decimal_places=18)
    shares = models.DecimalField(max_digits=36, decimal_places=18)  # LP tokens
    deposit_tx_hash = models.CharField(max_length=255)
    unlocked_at = models.DateTimeField()
    withdrawn = models.BooleanField(default=False)
    withdraw_tx_hash = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lender_deposits'

class PoolAllocation(models.Model):
    pool = models.ForeignKey(LenderPool, on_delete=models.CASCADE, related_name='allocations')
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, related_name='pool_allocations')
    amount = models.DecimalField(max_digits=36, decimal_places=18)
    allocation_tx_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pool_allocations'