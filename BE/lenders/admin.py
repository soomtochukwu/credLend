from django.contrib import admin
from .models import LenderPool, LenderDeposit, PoolAllocation


@admin.register(LenderPool)
class LenderPoolAdmin(admin.ModelAdmin):
    list_display = (
        "name", "pool_type", "apy", "total_liquidity",
        "available_liquidity", "min_deposit", "lock_period_days", "is_active"
    )
    list_filter = ("pool_type", "is_active", "created_at")
    search_fields = ("name", "token_address")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Pool Info", {
            "fields": ("name", "pool_type", "description", "token_address")
        }),
        ("Financials", {
            "fields": ("apy", "total_liquidity", "available_liquidity", "min_deposit")
        }),
        ("Lock & Status", {
            "fields": ("lock_period_days", "is_active")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(LenderDeposit)
class LenderDepositAdmin(admin.ModelAdmin):
    list_display = (
        "user", "pool", "amount", "shares",
        "deposit_tx_hash", "unlocked_at", "withdrawn", "withdraw_tx_hash"
    )
    list_filter = ("withdrawn", "created_at")
    search_fields = ("user__username", "user__email", "deposit_tx_hash", "withdraw_tx_hash")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Deposit Info", {
            "fields": ("user", "pool", "amount", "shares", "deposit_tx_hash")
        }),
        ("Unlock & Withdraw", {
            "fields": ("unlocked_at", "withdrawn", "withdraw_tx_hash")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(PoolAllocation)
class PoolAllocationAdmin(admin.ModelAdmin):
    list_display = ("pool", "loan", "amount", "allocation_tx_hash", "created_at")
    list_filter = ("created_at",)
    search_fields = ("pool__name", "loan__id", "allocation_tx_hash")
    readonly_fields = ("created_at",)

    fieldsets = (
        ("Allocation Info", {
            "fields": ("pool", "loan", "amount", "allocation_tx_hash")
        }),
        ("Timestamps", {
            "fields": ("created_at",)
        }),
    )
