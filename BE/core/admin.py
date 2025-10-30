from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Wallet, BlockchainTransaction


class UserAdmin(BaseUserAdmin):
    # Fields to display in the user list
    list_display = (
        "username", "email", "wallet_address", "is_borrower",
        "is_lender", "kyc_verified", "credit_score", "is_staff", "is_superuser"
    )
    list_filter = ("is_borrower", "is_lender", "kyc_verified", "is_staff", "is_superuser")
    search_fields = ("username", "email", "wallet_address")

    # Add custom fields to fieldsets (edit page)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Wallet Info", {"fields": ("wallet_address", "private_key")}),
        ("Verification & Score", {"fields": ("kyc_verified", "kyc_verified_at", "credit_score")}),
        ("Roles", {"fields": ("is_borrower", "is_lender")}),
    )

    # Add fields when creating a user in the admin
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Wallet Info", {"fields": ("wallet_address",)}),
        ("Verification & Score", {"fields": ("kyc_verified", "credit_score")}),
        ("Roles", {"fields": ("is_borrower", "is_lender")}),
    )


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "address", "is_default", "created_at")
    list_filter = ("is_default", "created_at")
    search_fields = ("address", "user__username")


@admin.register(BlockchainTransaction)
class BlockchainTransactionAdmin(admin.ModelAdmin):
    list_display = ("tx_hash", "status", "from_address", "to_address", "value", "block_number", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("tx_hash", "from_address", "to_address")


# Register the custom User admin
admin.site.register(User, UserAdmin)
